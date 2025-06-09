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
  onPduRemove
}) => {
  // メモ化された計算値
  const unitHeight = useMemo(() => getZoomedUnitHeight(zoomLevel), [zoomLevel]);
  const fontSize = useMemo(() => getZoomedFontSize(zoomLevel), [zoomLevel]);
  const coolingStats = useMemo(() => calculateCoolingStats(rack), [rack]);
  const rackWidth = useMemo(() => 600 * (zoomLevel / 100), [zoomLevel]);

  // メモ化されたヘッダーレンダリング関数
  const renderRackHeader = useMemo(() => {
    return (view: '前面' | '背面' | '左側面' | '右側面') => (
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

  if (perspective === 'front' || perspective === 'rear') {
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
                top: `${(rack.units - hoveredUnit) * unitHeight}px`,
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
              onCageNutInstall={onCageNutInstall}
              onCageNutRemove={onCageNutRemove}
              onAutoInstallCageNuts={onAutoInstallCageNuts}
              showConfirmModal={showConfirmModal}
              onRailInstall={onRailInstall}
              onRailRemove={onRailRemove}
              perspective={perspective}
            />
          ))}
        </div>
      </div>
    );
  } else if (perspective === 'left' || perspective === 'right') {
    const sideLabel = perspective === 'left' ? '左側面' : '右側面';
    return (
      <div className="flex flex-col">
        {renderRackHeader(sideLabel)}
        <div
          className="border rounded-b-lg overflow-hidden p-4 bg-gray-700 border-custom-gray"
          style={{
            height: `${rack.units * getZoomedUnitHeight(zoomLevel)}px`,
            width: `${Math.max(150, rack.depth / (zoomLevel > 75 ? 3 : zoomLevel > 50 ? 4 : 5))}px`
          }}
        >
          <p className="text-center text-xs text-gray-400">側面ビュー (実装中)</p>
          {Object.values(rack.equipment).filter(eq => eq.isMainUnit).map(eq => (
            <div
              key={eq.id}
              className="absolute border text-white text-xs flex items-center justify-center"
              style={{
                backgroundColor: eq.color,
                height: `${eq.height * getZoomedUnitHeight(zoomLevel)}px`,
                width: `${Math.max(20, eq.depth / (zoomLevel > 75 ? 3 : zoomLevel > 50 ? 4 : 5) * 0.8)}px`,
                top: `${(rack.units - (eq.startUnit || 0) - eq.height + 1) * getZoomedUnitHeight(zoomLevel)}px`,
                left: perspective === 'left' ? '10%' : undefined,
                right: perspective === 'right' ? '10%' : undefined,
                opacity: 0.7
              }}
              title={eq.name}
            >
              {eq.name.substring(0,10)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
});

// 表示名を設定
RackView.displayName = 'RackView';