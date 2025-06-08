import React from 'react';
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
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
  onAutoInstallCageNuts?: (unit: number, nutType: string) => void;
  perspective: RackViewPerspective;
  showConfirmModal?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  onUpdatePhysicalStructure?: (updates: Partial<PhysicalStructure>) => void;
  onRailInstall?: (unit: number, side: 'left' | 'right', railType: string) => void;
  onRailRemove?: (unit: number, side: 'left' | 'right') => void;
  hoveredUnit?: number | null;
}

export const RackView: React.FC<RackViewProps> = ({
  rack,
  zoomLevel,
  selectedRack,
  activeViewMode,
  onDragOver,
  onDrop,
  onEquipmentClick,
  onEquipmentRemove,
  onCageNutInstall,
  onCageNutRemove,
  onAutoInstallCageNuts,
  perspective,
  draggedItem,
  showConfirmModal,
  onUpdatePhysicalStructure,
  onRailInstall,
  onRailRemove,
  hoveredUnit
}) => {
  const unitHeight = getZoomedUnitHeight(zoomLevel);
  const fontSize = getZoomedFontSize(zoomLevel);
  const coolingStats = calculateCoolingStats(rack);

  const renderRackHeader = (view: '前面' | '背面' | '左側面' | '右側面') => (
    <div
      className="mb-2 p-2 border rounded-t-lg bg-gray-800 border-custom-gray"
      style={{
        width: `${600 * (zoomLevel / 100)}px`
      }}
    >
      <h3 className="font-bold text-center text-gray-100" style={{ fontSize: `${fontSize * 1.2}px` }}>{rack.name} ({view})</h3>
      <div className="text-center text-gray-300" style={{ fontSize: `${fontSize * 0.8}px` }}>
        {rack.units}U / {rack.width}mm幅 × {rack.depth}mm奥行
      </div>
    </div>
  );

  if (perspective === 'front' || perspective === 'rear') {
    const rackWidth = 600 * (zoomLevel / 100);
    return (
      <div className="flex flex-col relative items-center">
        {renderRackHeader(perspective === 'front' ? '前面' : '背面')}
        <div
          className="border rounded-b-lg overflow-visible relative border-custom-gray"
          style={{
            width: `${rackWidth}px`
          }}
        >
          <RackStructure
            rack={rack}
            zoomLevel={zoomLevel}
            unitHeight={unitHeight}
            perspective={perspective}
            onUpdatePhysicalStructure={onUpdatePhysicalStructure}
          />
          {/* PDUは背面のみ表示 */}
          {perspective === 'rear' && (
            <RackPDU rack={rack} zoomLevel={zoomLevel} unitHeight={unitHeight} />
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

          {Array.from({ length: rack.units }, (_, i) => rack.units - i).map(unit => (
            <RackUnit
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
};