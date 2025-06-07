import React from 'react';
import { Trash2, CheckCircle, AlertCircle, XCircle, Thermometer } from 'lucide-react';
import { Rack, Equipment, CoolingStats } from '../types';
import {
  getCageNutStatus,
  getUnitBorderClass,
  getEmptyUnitClass,
  getUnitNumClass,
  getPowerStatus,
  getEquipmentDisplayName
} from '../utils';
import { getEquipmentIcon, getAirflowIcon, getMountingIcon } from './RackIcons';
import { MountingHoles } from './MountingHoles';

interface RackUnitProps {
  rack: Rack;
  unit: number;
  darkMode: boolean;
  zoomLevel: number;
  unitHeight: number;
  fontSize: number;
  activeViewMode: string | null;
  selectedRack: string;
  coolingStats: CoolingStats;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, unit: number) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
  onEquipmentRemove?: (unit: number) => void;
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
  onAutoInstallCageNuts?: (unit: number, nutType: string) => void;
  onInstallRail?: (unit: number, type: 'slide' | 'fixed' | 'toolless', depth: number) => void;
  showConfirmModal?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
}

export const RackUnit: React.FC<RackUnitProps> = ({
  rack,
  unit,
  darkMode,
  zoomLevel,
  unitHeight,
  fontSize,
  activeViewMode,
  selectedRack,
  coolingStats,
  onDragOver,
  onDrop,
  onEquipmentClick,
  onEquipmentRemove,
  onCageNutInstall,
  onCageNutRemove,
  onAutoInstallCageNuts,
  onInstallRail,
  showConfirmModal
}) => {
  const item = rack.equipment[unit];
  const isEmpty = !item;
  const isMainUnit = item?.isMainUnit;
  const cageNutStatus = getCageNutStatus(unit, rack);

  let powerStatus = null;
  let mountingStatus = null;
  let airflowStatus = null;
  let temperatureStatus = null;
  let cageNutDisplay = null;
  let displayName = '';
  
  if (item && isMainUnit) {
    displayName = getEquipmentDisplayName(item, rack.labels);
    
    if (activeViewMode === 'showLabelView') {
      const labels = rack.labels?.[item.id] || {};
      if (labels.ipAddress) {
        displayName += ` (${labels.ipAddress})`;
      } else if (labels.serialNumber) {
        displayName += ` (SN:${labels.serialNumber})`;
      }
    }
    
    if (activeViewMode === 'showPowerView') {
      const status = getPowerStatus(item, rack.powerConnections);
      powerStatus = React.createElement(
        status.icon === 'CircleCheck' ? CheckCircle :
        status.icon === 'AlertCircle' ? AlertCircle : XCircle,
        { size: 12, className: status.color }
      );
    }
    
    if (activeViewMode === 'showMountingView') {
      const mounting = rack.mountingOptions[item.id] || {};
      mountingStatus = getMountingIcon(mounting.type, item.needsRails, 12);
    }
    
    if (activeViewMode === 'showAirflowView') {
      airflowStatus = getAirflowIcon(item.airflow, 12);
    }
    
    if (activeViewMode === 'showTemperatureView') {
      const unitTemp = coolingStats.temperatureMap[unit] || rack.environment.ambientTemp;
      const tempColor = unitTemp > 30 ? 'text-red-500' : unitTemp > 25 ? 'text-yellow-500' : 'text-green-500';
      temperatureStatus = <Thermometer size={12} className={tempColor} />;
    }
  }

  if (activeViewMode === 'showCageNutView') {
    if (cageNutStatus.isComplete) {
      cageNutDisplay = <CheckCircle size={12} className="text-green-500" />;
    } else if (cageNutStatus.installed > 0) {
      cageNutDisplay = <AlertCircle size={12} className="text-yellow-500" />;
    } else {
      cageNutDisplay = <XCircle size={12} className="text-red-500" />;
    }
  }

  const unitBorderClass = getUnitBorderClass(darkMode);
  const emptyUnitClass = getEmptyUnitClass(darkMode);
  const unitNumClass = getUnitNumClass(darkMode);

  return (
    <div
      key={unit}
      className={`relative border flex items-center justify-between px-2 ${unitBorderClass} ${
        isEmpty ? emptyUnitClass : ''
      } ${
        item && !isMainUnit ? `border-t-0 ${emptyUnitClass}` : ''
      }`}
      style={{
        height: `${unitHeight}px`,
        fontSize: `${fontSize}px`
      }}
      onDragOver={(isEmpty || (item && !isMainUnit)) && selectedRack !== 'all' ? onDragOver : undefined}
      onDrop={(isEmpty || (item && !isMainUnit)) && selectedRack !== 'all' ? (e) => onDrop?.(e, unit) : undefined}
      onContextMenu={(e) => {
        if (selectedRack !== 'all' && (isEmpty || (item && !isMainUnit)) && showConfirmModal) {
          e.preventDefault();
          showConfirmModal(
            'レール設置',
            `${unit}Uにスライドレールを設置しますか？`,
            () => {
              onInstallRail?.(unit, 'slide', 700);
            },
            '設置する',
            'キャンセル'
          );
        }
      }}
      onClick={() => {
        if (item && isMainUnit && selectedRack !== 'all') {
          onEquipmentClick?.(item);
        }
      }}
    >
      <div className="flex items-center gap-1">
        <span className={`font-mono ${unitNumClass}`}>{unit}</span>
        {activeViewMode === 'showCageNutView' && (
          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5" title={`ゲージナット: ${cageNutStatus.installed}/8`}>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`w-1 h-1 rounded-full ${
                      cageNutStatus.installed > i ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-0.5">
                {[4, 5, 6, 7].map((i) => (
                  <div 
                    key={i} 
                    className={`w-1 h-1 rounded-full ${
                      cageNutStatus.installed > i ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(activeViewMode === 'showCageNutView' || isEmpty || (item && !isMainUnit)) && (
        <MountingHoles
          rack={rack}
          unit={unit}
          zoomLevel={zoomLevel}
          unitHeight={unitHeight}
          darkMode={darkMode}
          perspective="front"
          onCageNutInstall={onCageNutInstall}
          onCageNutRemove={onCageNutRemove}
        />
      )}
      
      {item && isMainUnit && (
        <div
          className={`absolute inset-0 flex items-center justify-between px-2 ${
            ['showPowerView', 'showMountingView', 'showLabelView', 'showCablingView', 'showCageNutView'].includes(activeViewMode ?? '') ? 'border-2 border-dashed border-blue-400' : ''
          }`}
          style={{
            backgroundColor: item.color, 
            height: `${item.height * unitHeight}px`,
            zIndex: 10
          }}
        >
          <div className="text-white font-medium truncate flex-1 text-center flex items-center justify-center gap-1">
            <span>{displayName}</span>
            {powerStatus && <span className="ml-1">{powerStatus}</span>}
            {mountingStatus && <span className="ml-1">{mountingStatus}</span>}
            {airflowStatus && <span className="ml-1">{airflowStatus}</span>}
            {temperatureStatus && <span className="ml-1">{temperatureStatus}</span>}
            {cageNutDisplay && <span className="ml-1">{cageNutDisplay}</span>}
          </div>
          <div className="flex gap-1 items-center">
            {getEquipmentIcon(item.type, Math.max(10, fontSize))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEquipmentRemove?.(unit);
              }}
              className="text-white hover:text-red-200 ml-1"
            >
              <Trash2 size={Math.max(8, fontSize - 2)} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export {};