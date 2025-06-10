import React, { useMemo } from 'react';
import { Rack, Equipment, PhysicalStructure } from '../types';
import { RackViewPerspective } from '../App';
import {
  calculateCoolingStats,
  getZoomedUnitHeight,
  getZoomedFontSize,
} from '../utils';
import { RackStructure } from './RackStructure';
import { RackPDU } from './RackPDU';
import { RackUnit } from './RackUnit';

// メモ化されたコンポーネント
const MemoizedRackStructure = React.memo(RackStructure);
const MemoizedRackPDU = React.memo(RackPDU);
const MemoizedRackUnit = React.memo(RackUnit);

interface RackViewProps {
  rack: Rack;
  zoomLevel: number;
  selectedRack: string;
  activeViewMode: string | null;
  draggedItem?: Equipment | null;
  onDragOver?: (e: React.DragEvent, unit: number) => void;
  onDrop?: (e: React.DragEvent, unit: number) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
  onEquipmentRemove?: (unit: number) => void;
  onEquipmentDragStart?: (equipment: Equipment, unit: number, e: React.DragEvent) => void;
  onRackHeaderClick?: () => void;
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
  onAutoInstallCageNuts?: (unit: number, nutType: string) => void;
  perspective: RackViewPerspective;
  showConfirmModal?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  onUpdatePhysicalStructure?: (updates: Partial<PhysicalStructure>) => void;
  onRailInstall?: (unit: number, side: 'left' | 'right', railType: string) => void;
  onRailRemove?: (unit: number, side: 'left' | 'right') => void;
  hoveredUnit?: number | null;
  onPduInstall?: (side: 'left' | 'right', top: number) => void;
  onPduRemove?: (pduId: string) => void;
  onPowerToggle?: (equipmentId: string) => void;
}

export const RackView: React.FC<RackViewProps> = React.memo(({
  rack,
  zoomLevel,
  selectedRack,
  activeViewMode,
  onDragOver,
  onDrop,
  onEquipmentClick,
  onEquipmentRemove,
  onEquipmentDragStart,
  onRackHeaderClick,
  onCageNutInstall,
  onCageNutRemove,
  onAutoInstallCageNuts,
  perspective,
  draggedItem,
  showConfirmModal,
  onUpdatePhysicalStructure,
  onRailInstall,
  onRailRemove,
  hoveredUnit,
  onPduInstall,
  onPduRemove,
  onPowerToggle
}) => {
  // メモ化された計算値
  const unitHeight = useMemo(() => getZoomedUnitHeight(zoomLevel), [zoomLevel]);
  const fontSize = useMemo(() => getZoomedFontSize(zoomLevel), [zoomLevel]);
  const coolingStats = useMemo(() => calculateCoolingStats(rack), [rack]);
  const rackWidth = useMemo(() => 600 * (zoomLevel / 100), [zoomLevel]);

  // メモ化されたヘッダーレンダリング関数
  const renderRackHeader = useMemo(() => {
    return (view: '前面' | '背面') => (
      <div
        className="mb-2 p-2 border rounded-t-lg bg-gray-800 border-custom-gray cursor-pointer hover:bg-gray-700 transition-colors"
        style={{
          width: `${rackWidth}px`
        }}
        onClick={onRackHeaderClick}
        title="クリックしてラック詳細を編集"
      >
        <h3 className="font-bold text-center text-gray-100" style={{ fontSize: `${fontSize * 1.2}px` }}>{rack.name} ({view})</h3>
        <div className="text-center text-gray-300" style={{ fontSize: `${fontSize * 0.8}px` }}>
          {rack.units}U / {rack.width}mm幅 × {rack.depth}mm奥行
        </div>
      </div>
    );
  }, [rackWidth, fontSize, rack.name, rack.units, rack.width, rack.depth, onRackHeaderClick]);

  // ユニット配列をメモ化
  const unitArray = useMemo(() =>
    Array.from({ length: rack.units }, (_, i) => rack.units - i),
    [rack.units]
  );

  return (
    <div className="flex flex-col relative items-center">
      {renderRackHeader(perspective === 'front' ? '前面' : '背面')}
      <div
        className="border rounded-b-lg overflow-visible relative border-custom-gray"
        style={{
          width: `${rackWidth}px`
        }}
      >
        <MemoizedRackStructure
          rack={rack}
          zoomLevel={zoomLevel}
          unitHeight={unitHeight}
          perspective={perspective}
          onUpdatePhysicalStructure={onUpdatePhysicalStructure}
        />
        {/* PDUは背面のみ表示 */}
        {perspective === 'rear' && (
          <MemoizedRackPDU rack={rack} zoomLevel={zoomLevel} unitHeight={unitHeight} perspective={perspective} rackWidth={rackWidth} onPduInstall={onPduInstall} onPduRemove={onPduRemove} />
        )}
        
        {draggedItem && hoveredUnit && draggedItem.height > 0 && (
          <div
            className="absolute bg-blue-500 bg-opacity-30 border-2 border-dashed border-blue-400 pointer-events-none"
            style={{
              height: `${draggedItem.height * unitHeight}px`,
              width: '100%',
              top: `${(rack.units - hoveredUnit - draggedItem.height + 1) * unitHeight}px`,
              zIndex: 20,
            }}
          />
        )}

        {unitArray.map(unit => (
          <MemoizedRackUnit
            key={`unit-${unit}`}
            rack={rack}
            unit={unit}
            zoomLevel={zoomLevel}
            unitHeight={unitHeight}
            fontSize={fontSize}
            activeViewMode={activeViewMode}
            selectedRack={selectedRack}
            coolingStats={coolingStats}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onEquipmentClick={onEquipmentClick}
            onEquipmentRemove={onEquipmentRemove}
            onEquipmentDragStart={onEquipmentDragStart}
            onCageNutInstall={onCageNutInstall}
            onCageNutRemove={onCageNutRemove}
            onAutoInstallCageNuts={onAutoInstallCageNuts}
            showConfirmModal={showConfirmModal}
            onRailInstall={onRailInstall}
            onRailRemove={onRailRemove}
            perspective={perspective}
            onPowerToggle={onPowerToggle}
          />
        ))}
      </div>
    </div>
  );
});

// 表示名を設定
RackView.displayName = 'RackView';