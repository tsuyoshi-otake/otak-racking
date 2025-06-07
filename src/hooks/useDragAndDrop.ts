import { useState, useCallback } from 'react';
import { Equipment } from '../types';
import { canPlaceEquipment } from '../utils';

export type DraggedItem = Equipment | null;

export const useDragAndDrop = (
  currentRack: any,
  addEquipment: (rackId: string, startUnit: number, equipment: Equipment) => Promise<import('../types').PlacementResult>,
  autoInstallCageNutsForUnit: (rackId: string, unit: number, nutType: string) => void,
  selectedRack: string,
  // モーダル表示用関数を引数に追加
  showInfoModal: (title: string, message: string) => void,
  showConfirmModal: (title: string, message: string, onConfirm: () => void) => void
) => {
  const [draggedItem, setDraggedItem] = useState<Equipment | null>(null);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, item: Equipment) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ドロップ処理
  const handleDrop = useCallback(async (e: React.DragEvent, startUnit: number) => {
    e.preventDefault();
    if (!draggedItem || !currentRack) return;

    // 最終的にドラッグ状態をリセット
    const cleanup = () => setDraggedItem(null);

    try {
      // ゲージナットの場合は該当ユニットに自動設置
      if (draggedItem.nutType) {
        autoInstallCageNutsForUnit(selectedRack, startUnit, draggedItem.nutType);
        showInfoModal('ゲージナット設置完了', `${startUnit}Uに${draggedItem.name}を8個設置しました。\n（前面4穴・背面4穴）`);
        return;
      }

      // その他の取り付け部品（ネジ等）の場合は在庫に追加
      if (draggedItem.screwType || draggedItem.washerType) {
        showInfoModal('部品在庫追加', `${draggedItem.name}を部品在庫に追加しました。\n取り付け設定で各機器に割り当ててください。`);
        return;
      }

      // 機器を配置
      const result = await addEquipment(selectedRack, startUnit, draggedItem);

      // 結果をハンドリング
      if (!result.success) {
        const error = result.validation.errors[0];
        if (error) {
          showInfoModal('設置エラー', error.message);
        } else {
          showInfoModal('設置エラー', '不明なエラーが発生しました。');
        }
      }
    } catch (error) {
      console.error("Drop handling failed:", error);
      showInfoModal('重大なエラー', '機器の設置中に予期せぬエラーが発生しました。');
    } finally {
      cleanup();
    }
  }, [draggedItem, currentRack, selectedRack, addEquipment, autoInstallCageNutsForUnit, showInfoModal, showConfirmModal]);

  // ドラッグキャンセル
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    setDraggedItem
  };
};