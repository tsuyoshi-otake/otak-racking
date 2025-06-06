import React from 'react';
import {
  Server,
  Network,
  Shield,
  HardDrive,
  Zap,
  Activity,
  Monitor,
  Eye,
  Snowflake,
  Package,
  Flame,
  Cable,
  Wrench,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Square,
  Wind,
  Thermometer
} from 'lucide-react';
import { Rack, Equipment } from '../types'; // ViewMode を削除
import { RackViewPerspective } from '../App'; // App.tsx から型をインポート
import {
  getCageNutStatus,
  calculateCoolingStats,
  getZoomedUnitHeight, 
  getZoomedFontSize,
  getUnitBorderClass,
  getEmptyUnitClass,
  getUnitNumClass,
  getPowerStatus,
  getEquipmentDisplayName
} from '../utils';

interface RackViewProps {
  rack: Rack;
  darkMode: boolean;
  zoomLevel: number;
  selectedRack: string;
  // viewModes: { // 削除
  //   showPowerView: boolean;
  //   showMountingView: boolean;
  //   showLabelView: boolean;
  //   showAirflowView: boolean;
  //   showTemperatureView: boolean;
  //   showCablingView: boolean;
  //   showCageNutView: boolean;
  //   showFloorView: boolean;
  // };
  activeViewMode: string | null; // 追加
  draggedItem?: Equipment | null;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, unit: number) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
  onEquipmentRemove?: (unit: number) => void;
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
  onAutoInstallCageNuts?: (unit: number, nutType: string) => void;
  perspective: RackViewPerspective; // perspective prop を追加
}

export const RackView: React.FC<RackViewProps> = ({
  rack,
  darkMode,
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
  perspective, // perspective を分割代入に追加
  draggedItem // draggedItem を分割代入に追加
}) => {
  const unitHeight = getZoomedUnitHeight(zoomLevel);
  const fontSize = getZoomedFontSize(zoomLevel);
  const coolingStats = calculateCoolingStats(rack);

  // アイコン取得関数
  const getEquipmentIcon = (type: string, size: number) => {
    const iconProps = { size, className: "text-white" };
    
    switch (type) {
      case 'server': return <Server {...iconProps} />;
      case 'network': return <Network {...iconProps} />;
      case 'security': return <Shield {...iconProps} />;
      case 'storage': return <HardDrive {...iconProps} />;
      case 'pdu':
      case 'ups': return <Zap {...iconProps} />;
      case 'power': return <Activity {...iconProps} />;
      case 'console': return <Monitor {...iconProps} />;
      case 'monitoring': return <Eye {...iconProps} />;
      case 'cooling': return <Snowflake {...iconProps} />;
      case 'shelf': return <Package {...iconProps} />;
      case 'spiritual': return <Flame {...iconProps} />;
      case 'cable': return <Cable {...iconProps} />;
      case 'mounting': return <Wrench {...iconProps} />;
      case 'panel': return <Square {...iconProps} />;
      case 'other': return <Settings {...iconProps} />;
      default: return <Settings {...iconProps} />;
    }
  };

  // エアフローアイコン取得
  const getAirflowIcon = (airflow: string, size: number) => {
    const iconProps = { size };
    
    switch (airflow) {
      case 'front-to-rear': return <ArrowRight {...iconProps} className="text-blue-400" />;
      case 'rear-to-front': return <ArrowLeft {...iconProps} className="text-green-400" />;
      case 'side-to-side': return <ArrowUp {...iconProps} className="text-yellow-400" />;
      case 'intake': return <ArrowDown {...iconProps} className="text-cyan-400" />;
      case 'exhaust': return <ArrowUp {...iconProps} className="text-orange-400" />;
      case 'blocking': return <Square {...iconProps} className="text-red-400" />;
      default: return <Wind {...iconProps} className="text-gray-400" />;
    }
  };

  // 取り付け状態アイコン取得
  const getMountingIcon = (mountingType: string, needsRails: boolean, size: number) => {
    switch (mountingType) {
      case 'slide-rail':
        return <Settings size={size} className="text-purple-400" />;
      case 'fixed-rail':
        return <Settings size={size} className="text-blue-400" />;
      case 'toolless-rail':
        return <Settings size={size} className="text-green-400" />;
      case 'shelf':
        return <Package size={size} className="text-yellow-400" />;
      case 'direct':
        return <Wrench size={size} className="text-orange-400" />;
      default:
        return needsRails ?
          <AlertCircle size={size} className="text-red-400" /> :
          <CheckCircle size={size} className="text-gray-400" />;
    }
  };

  // ラック柱の取り付け穴を描画
  const renderMountingHoles = (unit: number) => {
    const cageNuts = rack.cageNuts[unit] || {
      frontLeft: { top: null, bottom: null },
      frontRight: { top: null, bottom: null },
      rearLeft: { top: null, bottom: null },
      rearRight: { top: null, bottom: null }
    };

    const holeSize = Math.max(4, unitHeight * 0.12);
    
    return (
      <>
        {/* 前面左ラック柱 - 上穴 */}
        <div 
          className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
            cageNuts.frontLeft?.top ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
          }`}
          style={{ 
            width: `${holeSize}px`, 
            height: `${holeSize}px`,
            left: `-${holeSize + 2}px`,
            top: `2px`
          }}
          title={cageNuts.frontLeft?.top ? `前面左上: ${cageNuts.frontLeft.top.toUpperCase()}` : '前面左上: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.frontLeft?.top) {
              onCageNutRemove?.(unit, 'frontLeft', 'top');
            } else {
              onCageNutInstall?.(unit, 'frontLeft', 'top', 'm6');
            }
          }}
        >
          {cageNuts.frontLeft?.top && (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
            </div>
          )}
        </div>

        {/* 前面左ラック柱 - 下穴 */}
        <div 
          className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
            cageNuts.frontLeft?.bottom ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
          }`}
          style={{ 
            width: `${holeSize}px`, 
            height: `${holeSize}px`,
            left: `-${holeSize + 2}px`,
            bottom: `2px`
          }}
          title={cageNuts.frontLeft?.bottom ? `前面左下: ${cageNuts.frontLeft.bottom.toUpperCase()}` : '前面左下: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.frontLeft?.bottom) {
              onCageNutRemove?.(unit, 'frontLeft', 'bottom');
            } else {
              onCageNutInstall?.(unit, 'frontLeft', 'bottom', 'm6');
            }
          }}
        >
          {cageNuts.frontLeft?.bottom && (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
            </div>
          )}
        </div>

        {/* 前面右ラック柱 - 上穴 */}
        <div 
          className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
            cageNuts.frontRight?.top ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
          }`}
          style={{ 
            width: `${holeSize}px`, 
            height: `${holeSize}px`,
            right: `-${holeSize + 2}px`,
            top: `2px`
          }}
          title={cageNuts.frontRight?.top ? `前面右上: ${cageNuts.frontRight.top.toUpperCase()}` : '前面右上: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.frontRight?.top) {
              onCageNutRemove?.(unit, 'frontRight', 'top');
            } else {
              onCageNutInstall?.(unit, 'frontRight', 'top', 'm6');
            }
          }}
        >
          {cageNuts.frontRight?.top && (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
            </div>
          )}
        </div>

        {/* 前面右ラック柱 - 下穴 */}
        <div 
          className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
            cageNuts.frontRight?.bottom ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
          }`}
          style={{ 
            width: `${holeSize}px`, 
            height: `${holeSize}px`,
            right: `-${holeSize + 2}px`,
            bottom: `2px`
          }}
          title={cageNuts.frontRight?.bottom ? `前面右下: ${cageNuts.frontRight.bottom.toUpperCase()}` : '前面右下: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.frontRight?.bottom) {
              onCageNutRemove?.(unit, 'frontRight', 'bottom');
            } else {
              onCageNutInstall?.(unit, 'frontRight', 'bottom', 'm6');
            }
          }}
        >
          {cageNuts.frontRight?.bottom && (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
            </div>
          )}
        </div>

        {/* 背面表示（簡略化） */}
        <div 
          className={`absolute border cursor-pointer hover:scale-110 transition-transform opacity-70 ${
            cageNuts.rearLeft?.top || cageNuts.rearLeft?.bottom ? 'bg-green-400 border-green-500' : darkMode ? 'bg-gray-500 border-gray-400' : 'bg-gray-200 border-gray-300'
          }`}
          style={{ 
            width: `${Math.max(3, holeSize * 0.7)}px`, 
            height: `${unitHeight - 4}px`,
            left: `${holeSize + 4}px`,
            top: `2px`
          }}
          title={`背面左: ${(cageNuts.rearLeft?.top || cageNuts.rearLeft?.bottom) ? '設置済み' : '未設置'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.rearLeft?.top || cageNuts.rearLeft?.bottom) {
              onCageNutRemove?.(unit, 'rearLeft', 'top');
              onCageNutRemove?.(unit, 'rearLeft', 'bottom');
            } else {
              onCageNutInstall?.(unit, 'rearLeft', 'top', 'm6');
              onCageNutInstall?.(unit, 'rearLeft', 'bottom', 'm6');
            }
          }}
        />

        <div 
          className={`absolute border cursor-pointer hover:scale-110 transition-transform opacity-70 ${
            cageNuts.rearRight?.top || cageNuts.rearRight?.bottom ? 'bg-green-400 border-green-500' : darkMode ? 'bg-gray-500 border-gray-400' : 'bg-gray-200 border-gray-300'
          }`}
          style={{ 
            width: `${Math.max(3, holeSize * 0.7)}px`, 
            height: `${unitHeight - 4}px`,
            right: `${holeSize + 4}px`,
            top: `2px`
          }}
          title={`背面右: ${(cageNuts.rearRight?.top || cageNuts.rearRight?.bottom) ? '設置済み' : '未設置'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.rearRight?.top || cageNuts.rearRight?.bottom) {
              onCageNutRemove?.(unit, 'rearRight', 'top');
              onCageNutRemove?.(unit, 'rearRight', 'bottom');
            } else {
              onCageNutInstall?.(unit, 'rearRight', 'top', 'm6');
              onCageNutInstall?.(unit, 'rearRight', 'bottom', 'm6');
            }
          }}
        />
      </>
    );
  };

  // ラックユニットレンダリング
  const renderRackUnit = (unit: number) => {
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
      
      // 電源状態
      if (activeViewMode === 'showPowerView') {
        const status = getPowerStatus(item, rack.powerConnections);
        powerStatus = React.createElement(
          status.icon === 'CircleCheck' ? CheckCircle :
          status.icon === 'AlertCircle' ? AlertCircle : XCircle,
          { size: 12, className: status.color }
        );
      }
      
      // 取り付け状態
      if (activeViewMode === 'showMountingView') {
        const mounting = rack.mountingOptions[item.id] || {};
        mountingStatus = getMountingIcon(mounting.type, item.needsRails, 12);
      }
      
      // エアフロー状態
      if (activeViewMode === 'showAirflowView') {
        airflowStatus = getAirflowIcon(item.airflow, 12);
      }
      
      // 温度状態
      if (activeViewMode === 'showTemperatureView') {
        const unitTemp = coolingStats.temperatureMap[unit] || rack.environment.ambientTemp;
        const tempColor = unitTemp > 30 ? 'text-red-500' : unitTemp > 25 ? 'text-yellow-500' : 'text-green-500';
        temperatureStatus = <Thermometer size={12} className={tempColor} />;
      }
    }

    // ゲージナット表示
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
          item && !isMainUnit ? 'border-t-0 bg-opacity-50' : ''
        }`}
        style={{ 
          height: `${unitHeight}px`,
          fontSize: `${fontSize}px`
        }}
        onDragOver={isEmpty && selectedRack !== 'all' ? onDragOver : undefined}
        onDrop={isEmpty && selectedRack !== 'all' ? (e) => onDrop?.(e, unit) : undefined}
        onContextMenu={(e) => {
          if (selectedRack !== 'all' && isEmpty) {
            e.preventDefault();
            const action = window.confirm(`${unit}Uにゲージナットを設置しますか？\n（前面4穴・背面4穴、計8個のM6ナット）`);
            if (action) {
              onAutoInstallCageNuts?.(unit, 'm6');
            }
          }
        }}
        onClick={() => {
          if (item && selectedRack !== 'all') {
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
                  {/* 前面4穴の状態表示 */}
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
                  {/* 背面4穴の状態表示 */}
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

        {/* ラック柱の取り付け穴 */}
        {(activeViewMode === 'showCageNutView' || isEmpty) && renderMountingHoles(unit)}
        
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

  // perspective に応じて描画内容を分岐
  if (perspective === 'front') {
    return (
      <div className="flex flex-col">
        {/* ラックヘッダー (前面) */}
        <div className={`mb-2 p-2 border rounded-t-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className="font-bold text-center">{rack.name} (前面)</h3>
          <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {rack.units}U / {rack.width}mm幅 × {rack.depth}mm奥行
          </div>
        </div>
        {/* ラックユニット (前面) */}
        <div className={`border rounded-b-lg overflow-hidden ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          {Array.from({ length: rack.units }, (_, i) => rack.units - i).map(unit => renderRackUnit(unit))}
        </div>
      </div>
    );
  } else if (perspective === 'rear') {
    // TODO: 背面ビューの詳細実装 (ゲージナット表示の切り替えなど)
    return (
      <div className="flex flex-col">
        <div className={`mb-2 p-2 border rounded-t-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className="font-bold text-center">{rack.name} (背面)</h3>
          <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {rack.units}U / {rack.width}mm幅 × {rack.depth}mm奥行
          </div>
        </div>
        <div className={`border rounded-b-lg overflow-hidden p-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`} style={{ height: `${rack.units * Math.max(16, (32 * zoomLevel) / 100)}px` }}>
          {/* <p className="p-4 text-center">背面ユニット表示 (実装中)</p> */}
          {/* 背面もユニットごとに描画するが、renderRackUnit を背面用に調整するか、新しい関数を作る */}
          {Array.from({ length: rack.units }, (_, i) => rack.units - i).map(unit => (
            <div
              key={`rear-unit-${unit}`}
              className={`relative border flex items-center justify-between px-2 ${getUnitBorderClass(darkMode)} ${getEmptyUnitClass(darkMode)}`}
              style={{ height: `${getZoomedUnitHeight(zoomLevel)}px`, fontSize: `${getZoomedFontSize(zoomLevel)}px` }}
            >
              <span className={`font-mono ${getUnitNumClass(darkMode)}`}>{unit}</span>
              {/* TODO: 背面ゲージナットと機器の背面表示 */}
              <span className="text-xs text-gray-500">機器背面 (仮)</span>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (perspective === 'left' || perspective === 'right') {
    const sideLabel = perspective === 'left' ? '左側面' : '右側面';
    // TODO: 側面ビューの詳細実装 (機器の奥行き描画、レール、PDUなど)
    return (
      <div className="flex flex-col">
        <div className={`mb-2 p-2 border rounded-t-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className="font-bold text-center">{rack.name} ({sideLabel})</h3>
          <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {rack.units}U高さ / {rack.depth}mm奥行
          </div>
        </div>
        <div
          className={`border rounded-b-lg overflow-hidden p-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
          style={{
            height: `${rack.units * getZoomedUnitHeight(zoomLevel)}px`, // 高さはU数に依存
            width: `${Math.max(150, rack.depth / (zoomLevel > 75 ? 3 : zoomLevel > 50 ? 4 : 5))}px` // 奥行きは仮スケール、ズームに応じて調整
          }}
        >
          <p className="text-center text-xs text-gray-500">側面ビュー (実装中)</p>
          {/* TODO: ここに機器を奥行き方向に描画するロジック */}
          {Object.values(rack.equipment).filter(eq => eq.isMainUnit).map(eq => (
            <div
              key={eq.id}
              className="absolute border text-white text-xs flex items-center justify-center"
              style={{
                backgroundColor: eq.color,
                height: `${eq.height * getZoomedUnitHeight(zoomLevel)}px`,
                width: `${Math.max(20, eq.depth / (zoomLevel > 75 ? 3 : zoomLevel > 50 ? 4 : 5) * 0.8)}px`, // 機器の奥行きも仮スケール
                top: `${(rack.units - (eq.startUnit || 0) - eq.height + 1) * getZoomedUnitHeight(zoomLevel)}px`,
                left: perspective === 'left' ? '10%' : undefined, // 仮配置
                right: perspective === 'right' ? '10%' : undefined, // 仮配置
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

  return null; // Should not happen if perspective is always one of the defined values
};