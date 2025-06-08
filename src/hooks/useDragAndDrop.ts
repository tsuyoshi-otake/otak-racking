import { useState, useCallback } from 'react';
import { Equipment, Rack } from '../types';

export type DraggedItem = Equipment | null;
export interface HoveredInfo {
  rackId: string | null;
  unit: number | null;
}

export const useDragAndDrop = (
  racks: Record<string, Rack>,
  addEquipment: (rackId: string, startUnit: number, equipment: Equipment) => Promise<import('../types').PlacementResult>,
  autoInstallCageNutsForUnit: (rackId: string, unit: number, nutType: string) => void,
  showInfoModal: (title: string, message: string) => void,
  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void
) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [hoveredInfo, setHoveredInfo] = useState<HoveredInfo>({ rackId: null, unit: null });

  const handleDragStart = useCallback((e: React.DragEvent, item: Equipment) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, unit: number, rackId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (draggedItem) {
      setHoveredInfo({ rackId, unit });
    }
  }, [draggedItem]);

  const handleDrop = useCallback(async (e: React.DragEvent, startUnit: number, rackId: string) => {
    e.preventDefault();
    setHoveredInfo({ rackId: null, unit: null });
    if (!draggedItem || !racks[rackId]) return;

    const cleanup = () => setDraggedItem(null);

    try {
      const correctedStartUnit = startUnit;
      if (draggedItem.nutType) {
        autoInstallCageNutsForUnit(rackId, correctedStartUnit, draggedItem.nutType);
        showInfoModal('ゲージナット設置完了', `${correctedStartUnit}Uに${draggedItem.name}を8個設置しました。\n（前面4穴・背面4穴）`);
        cleanup();
        return;
      }

      if (draggedItem.screwType || draggedItem.washerType) {
        showInfoModal('部品在庫追加', `${draggedItem.name}を部品在庫に追加しました。\n取り付け設定で各機器に割り当ててください。`);
        cleanup();
        return;
      }

      const result = await addEquipment(rackId, correctedStartUnit, draggedItem);

      if (!result.success) {
        const error = result.validation.errors[0];
        showInfoModal('設置エラー', error ? error.message : '不明なエラーが発生しました。');
      }
    } catch (error) {
      console.error("Drop handling failed:", error);
      showInfoModal('重大なエラー', '機器の設置中に予期せぬエラーが発生しました。');
    } finally {
      cleanup();
    }
  }, [draggedItem, racks, addEquipment, autoInstallCageNutsForUnit, showInfoModal]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setHoveredInfo({ rackId: null, unit: null });
  }, []);

  return {
    draggedItem,
    hoveredInfo,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    setDraggedItem,
  };
};