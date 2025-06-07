import { useState, useCallback } from 'react';
import { Equipment } from '../types';
import { canPlaceEquipment } from '../utils';

export type DraggedItem = Equipment | null;

export const useDragAndDrop = (
  currentRack: any,
  addEquipment: (rackId: string, startUnit: number, equipment: Equipment) => void,
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
  const handleDrop = useCallback((e: React.DragEvent, startUnit: number) => {
    e.preventDefault();
    if (!draggedItem || !currentRack) return;

    // ゲージナットの場合は該当ユニットに自動設置
    if (draggedItem.nutType) {
      autoInstallCageNutsForUnit(selectedRack, startUnit, draggedItem.nutType);
      showInfoModal('ゲージナット設置完了', `${startUnit}Uに${draggedItem.name}を8個設置しました。\n（前面4穴・背面4穴）`);
      setDraggedItem(null);
      return;
    }

    // その他の取り付け部品（ネジ等）の場合は在庫に追加
    if (draggedItem.screwType || draggedItem.washerType) {
      showInfoModal('部品在庫追加', `${draggedItem.name}を部品在庫に追加しました。\n取り付け設定で各機器に割り当ててください。`);
      setDraggedItem(null);
      return;
    }


    // 神棚の特別チェック
    if (draggedItem.requiresShelf) {
      const shelfUnit = startUnit - 1;  // 神棚の下のユニット（棚板がある位置）
      const shelfItem = currentRack.equipment[shelfUnit];
      if (!shelfItem || shelfItem.type !== 'shelf') {
        showInfoModal('設置エラー', '神棚は棚板の上にのみ設置できます。まず棚板を設置してください。');
        setDraggedItem(null);
        return;
      }
    }

    // 配置可能チェック
    const { canPlace, reason } = canPlaceEquipment(currentRack, startUnit, draggedItem);
    
    if (!canPlace && reason) { // reason が undefined でないことを確認
      showInfoModal('設置エラー', reason);
      setDraggedItem(null);
      return;
    }

    // 機器設置前にゲージナットの確認（取り付け部品以外）
    if (draggedItem.type !== 'mounting') {
      let missingCageNuts: number[] = [];
      const endUnit = startUnit + draggedItem.height - 1;
      
      for (let unit = startUnit; unit <= endUnit; unit++) {
        const cageNuts = currentRack.cageNuts[unit] || {
          frontLeft: { top: null, bottom: null },
          frontRight: { top: null, bottom: null },
          rearLeft: { top: null, bottom: null },
          rearRight: { top: null, bottom: null }
        };
        
        const allPositions = [
          cageNuts.frontLeft?.top, cageNuts.frontLeft?.bottom,
          cageNuts.frontRight?.top, cageNuts.frontRight?.bottom,
          cageNuts.rearLeft?.top, cageNuts.rearLeft?.bottom,
          cageNuts.rearRight?.top, cageNuts.rearRight?.bottom
        ];
        
        const installed = allPositions.filter(Boolean).length;
        if (installed < 8) {
          missingCageNuts.push(unit);
        }
      }
      
      if (missingCageNuts.length > 0) {
        showConfirmModal(
          'ゲージナット不足',
          `${missingCageNuts.join('U, ')}Uにゲージナットが不足しています。\n設置を続行しますか？\n（後でゲージナットを設置する必要があります）`,
          () => {
            // 確認ダイアログで「はい」が押された場合のみ機器を配置
            addEquipment(selectedRack, startUnit, draggedItem);
            setDraggedItem(null);
          }
        );
        // 確認モーダルが表示されるので、ここでは一旦何もしない (モーダルの結果で処理)
        // ただし、モーダルがキャンセルされた場合も draggedItem を null にする必要があるかもしれないが、
        // showConfirmModal の onClose で setConfirmModal(null) しているので、
        // draggedItem はこの confirm の外で null にする方が良いかもしれない。
        // 一旦、confirm された場合のみ draggedItem を null にする。
        return; // モーダルの結果を待つ
      }
    }

    // 機器を配置 (ゲージナット確認が不要、または確認でOKだった場合)
    addEquipment(selectedRack, startUnit, draggedItem);
    setDraggedItem(null);
  }, [draggedItem, currentRack, selectedRack, addEquipment, autoInstallCageNutsForUnit]);

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