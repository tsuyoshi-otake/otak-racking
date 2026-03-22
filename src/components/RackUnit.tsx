import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Thermometer, Move } from 'lucide-react';
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
import { getAirflowIcon, getMountingIcon } from './RackIcons';
import { MountingHoles } from './MountingHoles';
import { StatusLEDs } from './StatusLEDs';

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
  onEquipmentDragStart?: (equipment: Equipment, unit: number, e: React.DragEvent) => void;
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
  onAutoInstallCageNuts?: (unit: number, nutType: string) => void;
  showConfirmModal?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  onRailInstall?: (unit: number, side: 'left' | 'right', railType: string) => void;
  onRailRemove?: (unit: number, side: 'left' | 'right') => void;
  onPowerToggle?: (equipmentId: string) => void;
  onUpdateLabel?: (equipmentId: string, field: string, value: string) => void;
}


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
  onEquipmentDragStart,
  onCageNutInstall,
  onCageNutRemove,
  onAutoInstallCageNuts,
  showConfirmModal,
  onRailInstall,
  onRailRemove,
  onPowerToggle,
  onUpdateLabel
}) => {
  const item = rack.equipment[unit];
  const isEmpty = !item;
  const isMainUnit = item?.isMainUnit;

  // インライン編集状態
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 名前テキストクリック → インライン編集（モーダルは開かない）
  const handleNameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!item || !isMainUnit || selectedRack === 'all') return;
    const labels = rack.labels?.[item.id] || {};
    setEditValue((labels as any).customName || item.name);
    setIsEditing(true);
  }, [item, isMainUnit, selectedRack, rack.labels]);

  const handleEditCommit = useCallback(() => {
    if (!item || !onUpdateLabel) return;
    const trimmed = editValue.trim();
    // 元の機器名と同じなら customName をクリア
    const newName = trimmed === item.name ? '' : trimmed;
    onUpdateLabel(item.id, 'customName', newName);
    setIsEditing(false);
  }, [item, editValue, onUpdateLabel]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { handleEditCommit(); }
    if (e.key === 'Escape') { setIsEditing(false); }
  }, [handleEditCommit]);
  
  // メモ化された計算値
  const cageNutStatus = useMemo(() => getCageNutStatus(unit, rack), [unit, rack]);
  const railStatus = useMemo(() => rack.rails && rack.rails[unit], [rack.rails, unit]);
  const marginLeft = useMemo(() => getZoomedMarginLeft(zoomLevel), [zoomLevel]);

  // メモ化された表示要素
  const { displayName, powerStatus, powerStatusString, mountingStatus, airflowStatus, temperatureStatus, cageNutDisplay, railDisplay } = useMemo(() => {
    let powerStatus = null;
    let powerStatusString = '';
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
        powerStatusString = status.status;
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

    return { displayName, powerStatus, powerStatusString, mountingStatus, airflowStatus, temperatureStatus, cageNutDisplay, railDisplay };
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
        item && !isMainUnit ? 'border-t-0' : ''
      }`}
      style={{ height: unitHeight }}
      onDragOver={isEmpty && selectedRack !== 'all' ? (e) => { e.preventDefault(); onDragOver?.(e, unit); } : undefined}
      onDrop={isEmpty && selectedRack !== 'all' ? (e) => onDrop?.(e, unit) : undefined}
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

      {(activeViewMode === 'showCageNutView' || activeViewMode === 'showRailView' || isEmpty) && (perspective === 'front' || perspective === 'rear') && (
        <MemoizedMountingHoles
          rack={rack}
          unit={unit}
          zoomLevel={zoomLevel}
          unitHeight={unitHeight}
          perspective={perspective}
          isInteractive={activeViewMode === 'showCageNutView' || activeViewMode === 'showRailView'}
          onCageNutInstall={onCageNutInstall}
          onCageNutRemove={onCageNutRemove}
          onRailInstall={onRailInstall}
          onRailRemove={onRailRemove}
        />
      )}
      
      {item && isMainUnit && (
        <div
          draggable={selectedRack !== 'all'}
          onDragStart={(e) => {
            if (selectedRack !== 'all') {
              onEquipmentDragStart?.(item, unit, e);
              e.dataTransfer.effectAllowed = 'move';
            }
          }}
          className={`absolute top-0 left-0 w-full flex items-center justify-between px-2 cursor-move border-2 border-solid rounded-sm ${
            ['showPowerView', 'showMountingView', 'showLabelView', 'showCablingView', 'showCageNutView', 'showRailView'].includes(activeViewMode ?? '')
              ? 'border-gray-400 border-dashed'
              : 'border-gray-800 border-solid shadow-lg'
          }`}
          style={{
            backgroundColor: `${item.color}${Math.round(10 / 100 * 255).toString(16).padStart(2, '0')}`,
            height: `${item.height * unitHeight - 2}px`,
            top: `${-(item.height - 1) * unitHeight + 1}px`,
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          onClick={() => {
            if (isEditing) return;
            if (item && isMainUnit && selectedRack !== 'all') {
              onEquipmentClick?.(item);
            }
          }}
        >
          {/* 機器名ラベル — div全体でクリックをキャッチしインライン編集を開始 */}
          <div
            className="relative z-10 text-gray-300 font-normal text-xs truncate flex-1 text-center flex items-center justify-center gap-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] cursor-text"
            onClick={handleNameClick}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditCommit}
                onKeyDown={handleEditKeyDown}
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                className="bg-transparent border-b border-gray-400 text-gray-200 text-xs text-center outline-none w-full max-w-[200px]"
                style={{ textShadow: 'none' }}
              />
            ) : (
              <span className="px-2 py-1">{displayName}</span>
            )}
            {powerStatus && <span className="ml-1">{powerStatus}</span>}
            {mountingStatus && <span className="ml-1">{mountingStatus}</span>}
            {airflowStatus && <span className="ml-1">{airflowStatus}</span>}
            {temperatureStatus && <span className="ml-1">{temperatureStatus}</span>}
            {cageNutDisplay && <span className="ml-1">{cageNutDisplay}</span>}
            {railDisplay && <span className="ml-1">{railDisplay}</span>}
          </div>
          
          {/* LEDコンポーネント - 右上隅に絶対配置 */}
          {(item.type === 'server' || item.type === 'network' || item.type === 'storage') && (
            <div
              className="absolute z-20"
              style={{
                top: `${2 * (zoomLevel / 100)}px`,
                right: `${2 * (zoomLevel / 100)}px`
              }}
            >
              <StatusLEDs
                powerStatus={powerStatusString || getPowerStatus(item, rack.powerConnections).status}
                healthStatus={item.healthStatus || 'normal'}
                powerOn={item.powerOn !== false}
                onPowerToggle={onPowerToggle ? () => onPowerToggle(item.id) : undefined}
                zoomLevel={zoomLevel}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// 表示名を設定
RackUnit.displayName = 'RackUnit';