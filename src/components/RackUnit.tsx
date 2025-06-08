import React, { useMemo } from 'react';
import { Trash2, CheckCircle, AlertCircle, XCircle, Thermometer, Move } from 'lucide-react';
import { Rack, Equipment, CoolingStats, RackViewPerspective } from '../types';
import {
  getCageNutStatus,
  getUnitBorderClass,
  getEmptyUnitClass,
  getUnitNumClass,
  getPowerStatus,
  getEquipmentDisplayName,
  getZoomedMarginLeft
} from '../utils';
import { getEquipmentIcon, getAirflowIcon, getMountingIcon } from './RackIcons';
import { MountingHoles } from './MountingHoles';

// メモ化されたコンポーネント
const MemoizedMountingHoles = React.memo(MountingHoles);

interface RackUnitProps {
  rack: Rack;
  unit: number;
  zoomLevel: number;
  unitHeight: number;
  fontSize: number;
  activeViewMode: string | null;
  selectedRack: string;
  coolingStats: CoolingStats;
  perspective: RackViewPerspective;
  onDragOver?: (e: React.DragEvent, unit: number) => void;
  onDrop?: (e: React.DragEvent, unit: number) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
  onEquipmentRemove?: (unit: number) => void;
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
  onAutoInstallCageNuts?: (unit: number, nutType: string) => void;
  showConfirmModal?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  onRailInstall?: (unit: number, side: 'left' | 'right', railType: string) => void;
  onRailRemove?: (unit: number, side: 'left' | 'right') => void;
}

const ServerFrontView: React.FC = React.memo(() => (
  <div className="w-full h-full flex items-center justify-center bg-gray-700 border border-gray-600 rounded-sm overflow-hidden">
    <div className="w-full h-full flex items-center justify-between px-1">
      {/* Left Ear */}
      <div className="h-5/6 w-5 bg-gray-800 flex items-center justify-center rounded-l-sm">
        <div className="w-1 h-4 bg-gray-600 rounded-full" />
      </div>
      
      {/* Center Grill */}
      <div className="flex-1 h-full flex items-center justify-center bg-black bg-opacity-20 p-1 relative">
        <div className="w-full h-3/4 grid grid-cols-10 gap-px">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="bg-gray-500 opacity-50 rounded-sm" />
          ))}
        </div>
        <div className="absolute w-12 h-3 bg-green-500 bg-opacity-70 rounded-sm flex items-center justify-center text-white text-xs font-bold" style={{fontSize: '0.5rem'}}>
          HPE
        </div>
      </div>

      {/* Right Ear */}
      <div className="h-5/6 w-7 bg-gray-800 flex flex-col items-center justify-around p-1 rounded-r-sm">
        <div className="w-full h-1 bg-green-400 rounded-full" />
        <div className="w-full h-1 bg-blue-400 rounded-full" />
        <div className="w-full h-1 bg-gray-500 rounded-full" />
      </div>
    </div>
  </div>
));
ServerFrontView.displayName = 'ServerFrontView';

const ServerRearView: React.FC<{ dualPower: boolean }> = React.memo(({ dualPower }) => (
  <div className="w-full h-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded-sm overflow-hidden p-1">
    {/* Left side: Ports */}
    <div className="h-full w-2/5 flex flex-wrap gap-1 p-1 bg-gray-900 rounded-sm content-start">
      <div className="w-5 h-3 bg-gray-600 rounded-sm" title="USB" />
      <div className="w-5 h-3 bg-gray-600 rounded-sm" title="USB" />
      <div className="w-5 h-3 bg-gray-700 rounded-sm" title="VGA" />
      <div className="w-5 h-3 bg-gray-700 rounded-sm" title="Serial" />
      <div className="w-full h-4 bg-black rounded-sm grid grid-cols-2 gap-px p-px" title="Network">
        <div className="bg-gray-600 rounded-sm" />
        <div className="bg-gray-600 rounded-sm" />
      </div>
    </div>
    {/* Right side: PSUs */}
    <div className="h-full w-3/5 flex gap-1 p-1">
      {Array.from({ length: dualPower ? 2 : 1 }).map((_, i) => (
        <div key={i} className={`flex-1 h-full bg-gray-900 rounded-sm flex flex-col items-center justify-between p-1 ${!dualPower && i > 0 ? 'opacity-0' : ''}`}>
          <div className="w-full h-2/3 bg-black rounded-sm grid grid-cols-3 gap-px p-px">
            {Array.from({ length: 9 }).map((_, j) => <div key={j} className="bg-gray-700 rounded-full" />)}
          </div>
          <div className="w-4 h-2 bg-gray-600 rounded-full" />
        </div>
      ))}
      {!dualPower && <div className="flex-1 h-full" />}
    </div>
  </div>
));
ServerRearView.displayName = 'ServerRearView';

const SwitchFrontView: React.FC = React.memo(() => (
  <div className="w-full h-full flex items-center justify-between bg-gray-300 border border-gray-400 rounded-sm overflow-hidden p-1">
    {/* Left side: Console/Management */}
    <div className="h-full w-1/5 flex flex-col justify-around bg-gray-200 p-1 rounded-l-sm">
      <div className="w-full h-2 bg-blue-400 rounded-sm" title="Console" />
      <div className="w-full h-2 bg-yellow-400 rounded-sm" title="Management" />
      <div className="flex gap-1 mt-1">
        <div className="w-1 h-1 bg-green-500 rounded-full" />
        <div className="w-1 h-1 bg-gray-500 rounded-full" />
      </div>
    </div>
    {/* Right side: Ports */}
    <div className="h-full w-4/5 flex flex-wrap gap-px p-1 bg-gray-800 rounded-r-sm content-center justify-center">
      {Array.from({ length: 48 }).map((_, i) => (
        <div key={i} className="w-3 h-2 bg-gray-600 border border-gray-500 rounded-sm" />
      ))}
    </div>
  </div>
));
SwitchFrontView.displayName = 'SwitchFrontView';

const SwitchRearView: React.FC = React.memo(() => (
  <div className="w-full h-full flex items-center justify-between bg-gray-300 border border-gray-400 rounded-sm overflow-hidden p-1">
    {/* Fans */}
    <div className="h-full w-1/4 bg-gray-200 rounded-sm flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center">
        <div className="w-2 h-2 bg-blue-400 rounded-full" />
      </div>
    </div>
    {/* PSU */}
    <div className="h-full flex-1 bg-gray-800 mx-1 rounded-sm flex items-center justify-center">
      <div className="w-1/2 h-4/5 bg-gray-600 rounded-sm" />
    </div>
    <div className="h-full flex-1 bg-gray-800 mx-1 rounded-sm flex items-center justify-center">
      <div className="w-1/2 h-4/5 bg-gray-600 rounded-sm" />
    </div>
    {/* Fans */}
    <div className="h-full w-1/4 bg-gray-200 rounded-sm flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center">
        <div className="w-2 h-2 bg-blue-400 rounded-full" />
      </div>
    </div>
  </div>
));
SwitchRearView.displayName = 'SwitchRearView';

export const RackUnit: React.FC<RackUnitProps> = React.memo(({
  rack,
  unit,
  zoomLevel,
  unitHeight,
  fontSize,
  activeViewMode,
  selectedRack,
  coolingStats,
  perspective,
  onDragOver,
  onDrop,
  onEquipmentClick,
  onEquipmentRemove,
  onCageNutInstall,
  onCageNutRemove,
  onAutoInstallCageNuts,
  showConfirmModal,
  onRailInstall,
  onRailRemove
}) => {
  const item = rack.equipment[unit];
  const isEmpty = !item;
  const isMainUnit = item?.isMainUnit;
  
  // メモ化された計算値
  const cageNutStatus = useMemo(() => getCageNutStatus(unit, rack), [unit, rack]);
  const railStatus = useMemo(() => rack.rails && rack.rails[unit], [rack.rails, unit]);
  const marginLeft = useMemo(() => getZoomedMarginLeft(zoomLevel), [zoomLevel]);

  // メモ化された表示要素
  const { displayName, powerStatus, mountingStatus, airflowStatus, temperatureStatus, cageNutDisplay, railDisplay } = useMemo(() => {
    let powerStatus = null;
    let mountingStatus = null;
    let airflowStatus = null;
    let temperatureStatus = null;
    let cageNutDisplay = null;
    let railDisplay = null;
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
        mountingStatus = getMountingIcon(mounting.type, false, 12);
      }
      
      if (activeViewMode === 'showAirflowView') {
        airflowStatus = getAirflowIcon(item.airflow, 12);
      }
      
      if (activeViewMode === 'showTemperatureView') {
        const unitTemp = coolingStats.temperatureMap[unit] || rack.environment.ambientTemp;
        const tempColor = unitTemp > 30 ? 'text-red-500' : unitTemp > 25 ? 'text-yellow-500' : 'text-gray-300';
        temperatureStatus = <Thermometer size={12} className={tempColor} />;
      }
    }

    if (activeViewMode === 'showCageNutView') {
      if (cageNutStatus.isComplete) {
        cageNutDisplay = <CheckCircle size={12} className="text-green-400" />;
      } else if (cageNutStatus.installed > 0) {
        cageNutDisplay = <AlertCircle size={12} className="text-yellow-400" />;
      } else {
        cageNutDisplay = <XCircle size={12} className="text-gray-400" />;
      }
    }

    // レール表示処理
    if (activeViewMode === 'showRailView') {
      if (railStatus && (railStatus.frontLeft?.installed || railStatus.frontRight?.installed)) {
        railDisplay = <Move size={12} className="text-blue-400" />;
      } else {
        railDisplay = <XCircle size={12} className="text-gray-400" />;
      }
    }

    return { displayName, powerStatus, mountingStatus, airflowStatus, temperatureStatus, cageNutDisplay, railDisplay };
  }, [item, isMainUnit, activeViewMode, rack.labels, rack.powerConnections, rack.mountingOptions, coolingStats.temperatureMap, unit, rack.environment.ambientTemp, cageNutStatus, railStatus]);

  // スタイルクラスをメモ化
  const unitBorderClass = useMemo(() => getUnitBorderClass(), []);
  const emptyUnitClass = useMemo(() => getEmptyUnitClass(), []);
  const unitNumClass = useMemo(() => getUnitNumClass(), []);

  return (
    <div
      key={unit}
      className={`relative border flex items-center justify-between px-2 ${unitBorderClass} ${
        isEmpty ? emptyUnitClass : ''
      } ${
        item && !isMainUnit ? `border-t-0 ${emptyUnitClass}` : ''
      }`}
      style={{ height: unitHeight }}
      onDragOver={(isEmpty || (item && !isMainUnit)) && selectedRack !== 'all' ? (e) => onDragOver?.(e, unit) : undefined}
      onDrop={(isEmpty || (item && !isMainUnit)) && selectedRack !== 'all' ? (e) => onDrop?.(e, unit) : undefined}
      onClick={() => {
        if (item && isMainUnit && selectedRack !== 'all') {
          onEquipmentClick?.(item);
        }
      }}
    >
      <div className="flex items-center gap-1">
        <span
          className={`font-mono ${unitNumClass}`}
          style={{ fontSize: fontSize, marginLeft: marginLeft }}
        >
          {unit}
        </span>
        {activeViewMode === 'showCageNutView' && (
          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5" title={`ゲージナット: ${cageNutStatus.installed}/8`}>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${
                      cageNutStatus.installed > i ? 'bg-gray-300' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-0.5">
                {[4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 rounded-full ${
                      cageNutStatus.installed > i ? 'bg-gray-300' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(activeViewMode === 'showCageNutView' || isEmpty || (item && !isMainUnit)) && (perspective === 'front' || perspective === 'rear') && (
        <MemoizedMountingHoles
          rack={rack}
          unit={unit}
          zoomLevel={zoomLevel}
          unitHeight={unitHeight}
          perspective={perspective}
          onCageNutInstall={onCageNutInstall}
          onCageNutRemove={onCageNutRemove}
          onRailInstall={onRailInstall}
          onRailRemove={onRailRemove}
        />
      )}
      
      {item && isMainUnit && (
        <div
          className={`absolute inset-0 flex items-center justify-between px-2 ${
            ['showPowerView', 'showMountingView', 'showLabelView', 'showCablingView', 'showCageNutView', 'showRailView'].includes(activeViewMode ?? '') ? 'border-2 border-dashed border-gray-400' : ''
          }`}
          style={{
            backgroundColor: `${item.color}${Math.round((item.opacity ?? 100) / 100 * 255).toString(16).padStart(2, '0')}`,
            height: `${item.height * unitHeight}px`,
            zIndex: 10
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            {item.type === 'server' && (
              perspective === 'front' ? <ServerFrontView /> : <ServerRearView dualPower={item.dualPower} />
            )}
            {item.type === 'network' && (
              perspective === 'front' ? <SwitchFrontView /> : <SwitchRearView />
            )}
            {/* 他の機器タイプのビューもここに追加 */}
          </div>
          <div className="relative z-10 text-white font-normal text-xs truncate flex-1 text-center flex items-center justify-center gap-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            <span>{displayName}</span>
            {powerStatus && <span className="ml-1">{powerStatus}</span>}
            {mountingStatus && <span className="ml-1">{mountingStatus}</span>}
            {airflowStatus && <span className="ml-1">{airflowStatus}</span>}
            {temperatureStatus && <span className="ml-1">{temperatureStatus}</span>}
            {cageNutDisplay && <span className="ml-1">{cageNutDisplay}</span>}
            {railDisplay && <span className="ml-1">{railDisplay}</span>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEquipmentRemove?.(unit);
            }}
            className="relative z-10 text-white hover:text-gray-300 ml-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
          >
            <Trash2 size={Math.max(8, fontSize - 2)} />
          </button>
        </div>
      )}
    </div>
  );
});

// 表示名を設定
RackUnit.displayName = 'RackUnit';