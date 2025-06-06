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
  Thermometer,
  Minus,
  Circle
} from 'lucide-react';
import { Rack, Equipment, PDUPlacement, RailInstallation } from '../types'; // ViewMode を削除
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
  perspective: RackViewPerspective;
  showConfirmModal?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void; // 追加
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
  perspective,
  draggedItem,
  showConfirmModal // 追加
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

  // PDU描画機能
  const renderPDUs = () => {
    if (!rack.pduPlacements || rack.pduPlacements.length === 0) return null;

    return rack.pduPlacements.map((pdu, index) => {
      const pduWidth = 20; // PDUの幅
      const pduHeight = Math.min(rack.units * unitHeight * 0.8, pdu.equipment.height * unitHeight || rack.units * unitHeight * 0.6);
      
      let positionStyle: React.CSSProperties = {};
      
      switch (pdu.position) {
        case 'left':
          positionStyle = {
            left: `-${pduWidth + 10}px`,
            top: `${pdu.offset}px`,
            width: `${pduWidth}px`,
            height: `${pduHeight}px`
          };
          break;
        case 'right':
          positionStyle = {
            right: `-${pduWidth + 10}px`,
            top: `${pdu.offset}px`,
            width: `${pduWidth}px`,
            height: `${pduHeight}px`
          };
          break;
        case 'rear':
          positionStyle = {
            left: '50%',
            transform: 'translateX(-50%)',
            top: `${pdu.offset}px`,
            width: `${pduWidth * 0.7}px`,
            height: `${pduHeight}px`,
            zIndex: 1
          };
          break;
      }

      return (
        <div
          key={`pdu-${index}`}
          className={`absolute border-2 border-red-500 bg-red-600 opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
          style={positionStyle}
          title={`${pdu.equipment.name} (${pdu.position})`}
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs">
            <Zap size={Math.max(8, pduWidth * 0.4)} />
            <span className="writing-vertical-rl text-vertical transform rotate-180 mt-1 truncate">
              {pdu.equipment.name.substring(0, 8)}
            </span>
          </div>
          {/* PDUコンセント表現 */}
          <div className="absolute right-0 top-2 bottom-2 w-1 flex flex-col justify-around">
            {Array.from({ length: Math.floor(pduHeight / 20) }, (_, i) => (
              <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full" />
            ))}
          </div>
        </div>
      );
    });
  };

  // 前面用ナット・レール表現
  const renderFrontMountingHoles = (unit: number) => {
    const cageNuts = rack.cageNuts[unit] || {
      frontLeft: { top: null, bottom: null },
      frontRight: { top: null, bottom: null },
      rearLeft: { top: null, bottom: null },
      rearRight: { top: null, bottom: null }
    };

    const railInstallation = rack.railInstallations?.[unit];
    const holeSize = Math.max(13, unitHeight * 0.38);
    
    return (
      <>
        {/* レール表現 */}
        {railInstallation && railInstallation.installed && (
          <>
            {/* 左レール */}
            <div
              className="absolute bg-gradient-to-r from-gray-400 to-gray-600 border border-gray-500 opacity-90"
              style={{
                width: `3px`,
                height: `${unitHeight - 4}px`,
                left: `-8px`,
                top: `2px`,
                borderRadius: '1px'
              }}
              title={`左レール: ${railInstallation.type}`}
            >
              {/* レールの溝表現 */}
              <div className="w-full h-full flex flex-col justify-around">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="w-full h-0.5 bg-gray-700" />
                ))}
              </div>
            </div>
            
            {/* 右レール */}
            <div
              className="absolute bg-gradient-to-r from-gray-400 to-gray-600 border border-gray-500 opacity-90"
              style={{
                width: `3px`,
                height: `${unitHeight - 4}px`,
                right: `-8px`,
                top: `2px`,
                borderRadius: '1px'
              }}
              title={`右レール: ${railInstallation.type}`}
            >
              <div className="w-full h-full flex flex-col justify-around">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="w-full h-0.5 bg-gray-700" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* 前面左ラック柱 - 上穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.frontLeft?.top
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            left: `-${holeSize + 2}px`,
            top: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.frontLeft?.top
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.frontLeft?.top ? `前面左上: ${cageNuts.frontLeft.top.toUpperCase()}ナット` : '前面左上: 空き穴'}
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
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        {/* 前面左ラック柱 - 下穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.frontLeft?.bottom
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            left: `-${holeSize + 2}px`,
            bottom: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.frontLeft?.bottom
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.frontLeft?.bottom ? `前面左下: ${cageNuts.frontLeft.bottom.toUpperCase()}ナット` : '前面左下: 空き穴'}
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
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        {/* 前面右ラック柱 - 上穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.frontRight?.top
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            right: `-${holeSize + 2}px`,
            top: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.frontRight?.top
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.frontRight?.top ? `前面右上: ${cageNuts.frontRight.top.toUpperCase()}ナット` : '前面右上: 空き穴'}
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
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        {/* 前面右ラック柱 - 下穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.frontRight?.bottom
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            right: `-${holeSize + 2}px`,
            bottom: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.frontRight?.bottom
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.frontRight?.bottom ? `前面右下: ${cageNuts.frontRight.bottom.toUpperCase()}ナット` : '前面右下: 空き穴'}
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
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  // 背面用ナット・レール表現
  const renderRearMountingHoles = (unit: number) => {
    const cageNuts = rack.cageNuts[unit] || {
      frontLeft: { top: null, bottom: null },
      frontRight: { top: null, bottom: null },
      rearLeft: { top: null, bottom: null },
      rearRight: { top: null, bottom: null }
    };

    const railInstallation = rack.railInstallations?.[unit];
    const holeSize = Math.max(13, unitHeight * 0.38);
    
    return (
      <>
        {/* レール表現 */}
        {railInstallation && railInstallation.installed && (
          <>
            {/* 左レール */}
            <div
              className="absolute bg-gradient-to-r from-gray-400 to-gray-600 border border-gray-500 opacity-90"
              style={{
                width: `3px`,
                height: `${unitHeight - 4}px`,
                left: `-8px`,
                top: `2px`,
                borderRadius: '1px'
              }}
              title={`左レール: ${railInstallation.type}`}
            >
              <div className="w-full h-full flex flex-col justify-around">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="w-full h-0.5 bg-gray-700" />
                ))}
              </div>
            </div>
            
            {/* 右レール */}
            <div
              className="absolute bg-gradient-to-r from-gray-400 to-gray-600 border border-gray-500 opacity-90"
              style={{
                width: `3px`,
                height: `${unitHeight - 4}px`,
                right: `-8px`,
                top: `2px`,
                borderRadius: '1px'
              }}
              title={`右レール: ${railInstallation.type}`}
            >
              <div className="w-full h-full flex flex-col justify-around">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="w-full h-0.5 bg-gray-700" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* 背面左ラック柱 - 上穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.rearLeft?.top
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            left: `-${holeSize + 2}px`,
            top: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.rearLeft?.top
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.rearLeft?.top ? `背面左上: ${cageNuts.rearLeft.top.toUpperCase()}ナット` : '背面左上: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.rearLeft?.top) {
              onCageNutRemove?.(unit, 'rearLeft', 'top');
            } else {
              onCageNutInstall?.(unit, 'rearLeft', 'top', 'm6');
            }
          }}
        >
          {cageNuts.rearLeft?.top && (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        {/* 背面左ラック柱 - 下穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.rearLeft?.bottom
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            left: `-${holeSize + 2}px`,
            bottom: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.rearLeft?.bottom
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.rearLeft?.bottom ? `背面左下: ${cageNuts.rearLeft.bottom.toUpperCase()}ナット` : '背面左下: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.rearLeft?.bottom) {
              onCageNutRemove?.(unit, 'rearLeft', 'bottom');
            } else {
              onCageNutInstall?.(unit, 'rearLeft', 'bottom', 'm6');
            }
          }}
        >
          {cageNuts.rearLeft?.bottom && (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        {/* 背面右ラック柱 - 上穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.rearRight?.top
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            right: `-${holeSize + 2}px`,
            top: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.rearRight?.top
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.rearRight?.top ? `背面右上: ${cageNuts.rearRight.top.toUpperCase()}ナット` : '背面右上: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.rearRight?.top) {
              onCageNutRemove?.(unit, 'rearRight', 'top');
            } else {
              onCageNutInstall?.(unit, 'rearRight', 'top', 'm6');
            }
          }}
        >
          {cageNuts.rearRight?.top && (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>

        {/* 背面右ラック柱 - 下穴 */}
        <div
          className={`absolute border cursor-pointer ${
            cageNuts.rearRight?.bottom
              ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            right: `-${holeSize + 2}px`,
            bottom: `2px`,
            borderRadius: '2px',
            boxShadow: cageNuts.rearRight?.bottom
              ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
              : 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
          title={cageNuts.rearRight?.bottom ? `背面右下: ${cageNuts.rearRight.bottom.toUpperCase()}ナット` : '背面右下: 空き穴'}
          onClick={(e) => {
            e.stopPropagation();
            if (cageNuts.rearRight?.bottom) {
              onCageNutRemove?.(unit, 'rearRight', 'bottom');
            } else {
              onCageNutInstall?.(unit, 'rearRight', 'bottom', 'm6');
            }
          }}
        >
          {cageNuts.rearRight?.bottom && (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  // ラックユニットレンダリング
  const renderRackUnit = (unit: number) => {
    const item = rack.equipment[unit];
    const isEmpty = !item;
    const isMainUnit = item?.isMainUnit;
    const cageNutStatus = getCageNutStatus(unit, rack);
    
    // 2UサーバーのmainUnitを探す（表示の整合性のため）
    const mainEquipment = isMainUnit ? item :
      (item ? rack.equipment[item.startUnit || unit] : null);

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
          item && !isMainUnit ? `border-t-0 ${emptyUnitClass}` : ''
        }`}
        style={{
          height: `${unitHeight}px`,
          fontSize: `${fontSize}px`
        }}
        onDragOver={(isEmpty || (item && !isMainUnit)) && selectedRack !== 'all' ? onDragOver : undefined}
        onDrop={(isEmpty || (item && !isMainUnit)) && selectedRack !== 'all' ? (e) => onDrop?.(e, unit) : undefined}
        onContextMenu={(e) => {
          if (selectedRack !== 'all' && (isEmpty || (item && !isMainUnit)) && showConfirmModal && onAutoInstallCageNuts) {
            e.preventDefault();
            showConfirmModal(
              'ゲージナット一括設置',
              `${unit}Uのすべての取り付け穴（前面4箇所・背面4箇所）にM6ゲージナットを設置しますか？`,
              () => {
                onAutoInstallCageNuts(unit, 'm6');
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
          {/* 拡張ユニットは何も表示しない（空きユニットと同じ見た目） */}
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
        {(activeViewMode === 'showCageNutView' || isEmpty || (item && !isMainUnit)) && renderFrontMountingHoles(unit)}
        
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
      <div className="flex flex-col relative">
        {/* ラックヘッダー (前面) */}
        <div className={`mb-2 p-2 border rounded-t-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className="font-bold text-center">{rack.name} (前面)</h3>
          <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {rack.units}U / {rack.width}mm幅 × {rack.depth}mm奥行
          </div>
        </div>
        {/* ラックユニット (前面) */}
        <div className={`border rounded-b-lg overflow-visible relative ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          {/* PDU表示 */}
          {renderPDUs()}
          {/* ラックユニット */}
          {Array.from({ length: rack.units }, (_, i) => rack.units - i).map(unit => renderRackUnit(unit))}
        </div>
      </div>
    );
  } else if (perspective === 'rear') {
    // 背面ビューの詳細実装
    return (
      <div className="flex flex-col relative">
        {/* ラックヘッダー (背面) */}
        <div className={`mb-2 p-2 border rounded-t-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className="font-bold text-center">{rack.name} (背面)</h3>
          <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {rack.units}U / {rack.width}mm幅 × {rack.depth}mm奥行
          </div>
        </div>
        {/* ラックユニット (背面) */}
        <div className={`border rounded-b-lg overflow-visible relative ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          {/* ラックユニット */}
          {Array.from({ length: rack.units }, (_, i) => rack.units - i).map(unit => {
            const item = rack.equipment[unit];
            const isEmpty = !item;
            const isMainUnit = item?.isMainUnit;
            const cageNutStatus = getCageNutStatus(unit, rack);
            
            let displayName = '';
            
            if (item && isMainUnit) {
              displayName = getEquipmentDisplayName(item, rack.labels) + ' (背面)';
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
                  if (selectedRack !== 'all' && (isEmpty || (item && !isMainUnit)) && showConfirmModal && onAutoInstallCageNuts) {
                    e.preventDefault();
                    showConfirmModal(
                      'ゲージナット一括設置',
                      `${unit}Uのすべての取り付け穴（前面4箇所・背面4箇所）にM6ゲージナットを設置しますか？`,
                      () => {
                        onAutoInstallCageNuts(unit, 'm6');
                      },
                      '設置する',
                      'キャンセル'
                    );
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <span className={`font-mono ${unitNumClass}`}>{unit}</span>
                  {/* 背面ゲージナット状態表示 */}
                  {activeViewMode === 'showCageNutView' && (
                    <div className="flex gap-0.5">
                      <div className="flex flex-col gap-0.5" title={`背面ゲージナット: ${Math.min(4, Math.max(0, cageNutStatus.installed - 4))}/4`}>
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

                {/* 背面ラック柱の取り付け穴 */}
                {(activeViewMode === 'showCageNutView' || isEmpty || (item && !isMainUnit)) && renderRearMountingHoles(unit)}
                
                {item && isMainUnit && (
                  <div
                    className={`absolute inset-0 flex items-center justify-between px-2 ${
                      ['showPowerView', 'showMountingView', 'showLabelView', 'showCablingView', 'showCageNutView'].includes(activeViewMode ?? '') ? 'border-2 border-dashed border-blue-400' : ''
                    }`}
                    style={{
                      backgroundColor: item.color,
                      height: `${item.height * unitHeight}px`,
                      zIndex: 10,
                      opacity: 0.8 // 背面は少し薄く表示
                    }}
                  >
                    <div className="text-white font-medium truncate flex-1 text-center flex items-center justify-center gap-1">
                      <span>{displayName}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      {getEquipmentIcon(item.type, Math.max(10, fontSize))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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