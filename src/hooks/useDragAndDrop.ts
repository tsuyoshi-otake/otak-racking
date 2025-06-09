import { useState, useCallback } from 'react';
import { Equipment, Rack } from '../types';

export type DraggedItem = Equipment | null;
export interface DraggedEquipmentInfo {
  equipment: Equipment;
  sourceRackId: string;
  sourceUnit: number;
}
export interface HoveredInfo {
  rackId: string | null;
  unit: number | null;
}

export const useDragAndDrop = (
  racks: Record<string, Rack>,
  addEquipment: (rackId: string, startUnit: number, equipment: Equipment) => Promise<import('../types').PlacementResult>,
  moveEquipment: (rackId: string, fromUnit: number, toUnit: number) => Promise<import('../types').PlacementResult>,
  autoInstallCageNutsForUnit: (rackId: string, unit: number, nutType: string) => void,
  showInfoModal: (title: string, message: string) => void,
  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void
) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [draggedEquipmentInfo, setDraggedEquipmentInfo] = useState<DraggedEquipmentInfo | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<HoveredInfo>({ rackId: null, unit: null });

  const handleDragStart = useCallback((e: React.DragEvent, item: Equipment) => {
    setDraggedItem(item);
    setDraggedEquipmentInfo(null); // 新しい機器をドラッグする場合はクリア
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // 設置済み機器のドラッグ開始ハンドラー
  const handleEquipmentDragStart = useCallback((e: React.DragEvent, equipment: Equipment, rackId: string, unit: number) => {
    setDraggedEquipmentInfo({
      equipment,
      sourceRackId: rackId,
      sourceUnit: unit
    });
    setDraggedItem(equipment); // 表示用
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, unit: number, rackId: string) => {
    e.preventDefault();
    if (draggedEquipmentInfo) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (draggedItem) {
      setHoveredInfo({ rackId, unit });
    }
  }, [draggedItem, draggedEquipmentInfo]);

  const handleDrop = useCallback(async (e: React.DragEvent, startUnit: number, rackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredInfo({ rackId: null, unit: null });
    if (!draggedItem || !racks[rackId]) return;

    const cleanup = () => {
      setDraggedItem(null);
      setDraggedEquipmentInfo(null);
    };

    try {
      const correctedStartUnit = startUnit;

      // 設置済み機器の移動の場合
      if (draggedEquipmentInfo) {
        // 同じ位置への移動は無視
        if (draggedEquipmentInfo.sourceRackId === rackId && draggedEquipmentInfo.sourceUnit === correctedStartUnit) {
          cleanup();
          return;
        }

        // 異なるラックへの移動は現在サポートしていない
        if (draggedEquipmentInfo.sourceRackId !== rackId) {
          showInfoModal('移動エラー', '異なるラック間での機器移動は現在サポートされていません。');
          cleanup();
          return;
        }

        // 機器移動時もケージナット自動設置オプションを適用
        const result = await moveEquipment(rackId, draggedEquipmentInfo.sourceUnit, correctedStartUnit);

        if (!result.success) {
          const error = result.validation.errors[0];
          showInfoModal('移動エラー', error ? error.message : '不明なエラーが発生しました。');
        }
        // 移動完了時のモーダル表示を削除 - よりスムーズな操作感のため
        cleanup();
        return;
      }

      // 新しい機器の設置の場合
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
  }, [draggedItem, draggedEquipmentInfo, racks, addEquipment, moveEquipment, autoInstallCageNutsForUnit, showInfoModal]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDraggedEquipmentInfo(null);
    setHoveredInfo({ rackId: null, unit: null });
  }, []);

  return {
    draggedItem,
    draggedEquipmentInfo,
    hoveredInfo,
    handleDragStart,
    handleEquipmentDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    setDraggedItem,
  };
};