import { useState, useCallback } from 'react';
import { Equipment } from '../types';
import { canPlaceEquipment } from '../utils';

export const useDragAndDrop = (
  currentRack: any,
  addEquipment: (rackId: string, startUnit: number, equipment: Equipment) => void,
  autoInstallCageNutsForUnit: (rackId: string, unit: number, nutType: string) => void,
  selectedRack: string
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
      alert(`${startUnit}Uに${draggedItem.name}を8個設置しました。\n（前面4穴・背面4穴）`);
      setDraggedItem(null);
      return;
    }

    // その他の取り付け部品（ネジ等）の場合は在庫に追加
    if (draggedItem.screwType || draggedItem.washerType) {
      alert(`${draggedItem.name}を部品在庫に追加しました。\n取り付け設定で各機器に割り当ててください。`);
      setDraggedItem(null);
      return;
    }

    // レール類の場合は仮想設置（実際のユニットは占有しない）
    if (draggedItem.railType) {
      // レール情報をラック設定に追加する処理は後で実装
      alert(`${draggedItem.name}を${startUnit}Uエリアに仮設置しました。\n機器設定で実際の取り付けを行ってください。`);
      setDraggedItem(null);
      return;
    }

    // 神棚の特別チェック
    if (draggedItem.requiresShelf) {
      const shelfUnit = startUnit - 1;  // 神棚の下のユニット（棚板がある位置）
      const shelfItem = currentRack.equipment[shelfUnit];
      if (!shelfItem || shelfItem.type !== 'shelf') {
        alert('神棚は棚板の上にのみ設置できます。まず棚板を設置してください。');
        setDraggedItem(null);
        return;
      }
    }

    // 配置可能チェック
    const { canPlace, reason } = canPlaceEquipment(currentRack, startUnit, draggedItem);
    
    if (!canPlace) {
      alert(reason);
      setDraggedItem(null);
      return;
    }

    // 機器設置前にゲージナットの確認（レール不要機器のみ）
    if (!draggedItem.needsRails && draggedItem.type !== 'mounting') {
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
        const proceed = window.confirm(
          `${missingCageNuts.join('U, ')}Uにゲージナットが不足しています。\n設置を続行しますか？\n（後でゲージナットを設置する必要があります）`
        );
        if (!proceed) {
          setDraggedItem(null);
          return;
        }
      }
    }

    // 機器を配置
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