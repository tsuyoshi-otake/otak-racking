import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Settings,
  Zap,
  Square,
  BarChart3,
  Server,
  Activity,
  HardDrive,
  Snowflake,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Rack, FloorSettings } from '../types'; // FloorSettingsを追加
import {
  calculateTotalStats,
  calculateRackStats,
  calculateCoolingStats,
  getSidebarStyle,
  getButtonStyle
} from '../utils';

// ViewModes は App.tsx で activeViewMode として管理されるため、
// ここでの Props は activeViewMode とその更新関数になる
// export type ViewModeKey = 'showPowerView' | 'showMountingView' | 'showLabelView' | 'showAirflowView' | 'showTemperatureView' | 'showCablingView' | 'showCageNutView' | 'showFloorView';

interface RightSidebarProps { // SidebarProps を RightSidebarProps に変更
  racks: Record<string, Rack>;
  selectedRack: string;
  darkMode: boolean;
  floorSettings: FloorSettings;
  onRackSelect: (rackId: string) => void;
  onAddRack: () => void;
  onRemoveRack: (rackId: string) => void;
  onDuplicateRack: (rackId: string) => void;
  onClearAllEquipment: () => void;
  onShowRackManager: () => void;
  onShowFloorSettings: () => void;
  onShowCoolingConfig: () => void;
  onShowPowerConfig: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ // コンポーネント名を RightSidebar に変更し、型も RightSidebarProps に変更
  racks,
  selectedRack,
  darkMode,
  floorSettings,
  onRackSelect,
  onAddRack,
  onRemoveRack,
  onDuplicateRack,
  onClearAllEquipment,
  onShowRackManager,
  onShowFloorSettings,
  onShowCoolingConfig,
  onShowPowerConfig,
}) => {
  const [showStats, setShowStats] = useState(true);
  // const [showEquipmentLibrary, setShowEquipmentLibrary] = useState(true); // 削除
  // const [showViewModes, setShowViewModes] = useState(true); // 削除

  const totalStats = calculateTotalStats(racks);
  const currentRack = racks[selectedRack];
  const currentRackStats = currentRack ? calculateRackStats(currentRack) : null;
  const currentCoolingStats = currentRack ? calculateCoolingStats(currentRack) : null;

  const sidebarStyle = getSidebarStyle(darkMode);
  const getButton = (isActive: boolean = false) => getButtonStyle(darkMode, isActive);

  // const viewModeButtons = [ // 削除
  //   { key: 'showPowerView' as const, icon: Zap, label: '電源', color: 'text-red-500' },
  //   { key: 'showMountingView' as const, icon: Wrench, label: '取付', color: 'text-purple-500' },
  //   { key: 'showLabelView' as const, icon: Tag, label: 'ラベル', color: 'text-blue-500' },
  //   { key: 'showAirflowView' as const, icon: Wind, label: 'エアフロー', color: 'text-green-500' },
  //   { key: 'showTemperatureView' as const, icon: Thermometer, label: '温度', color: 'text-orange-500' },
  //   { key: 'showCablingView' as const, icon: Cable, label: 'ケーブル', color: 'text-cyan-500' },
  //   { key: 'showCageNutView' as const, icon: Square, label: 'ゲージナット', color: 'text-gray-500' },
  //   { key: 'showFloorView' as const, icon: Square, label: 'フロア', color: 'text-indigo-500' }
  // ];

  return (
    <div className={`w-80 border-l overflow-y-auto custom-scrollbar ${sidebarStyle}`}> {/* border-r を border-l に変更 */}
      <div className="p-4 space-y-4">
        {/* ラック選択・操作 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">ラック管理</h2>
            <button
              onClick={onAddRack}
              className={`p-1 rounded ${getButton()}`}
              title="ラック追加"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <select
            value={selectedRack}
            onChange={(e) => onRackSelect(e.target.value)}
            className={`w-full p-2 border rounded mb-2 ${
              darkMode
                ? 'bg-gray-600 border-gray-500 text-gray-200'
                : 'bg-gray-300 border-gray-400 text-gray-700'
            }`}
          >
            <option value="all">全体表示</option>
            {Object.values(racks).map(rack => (
              <option key={rack.id} value={rack.id}>
                {rack.name}
              </option>
            ))}
          </select>

          {selectedRack !== 'all' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => onDuplicateRack(selectedRack)}
                  className={`flex-1 p-2 rounded text-sm flex items-center justify-center gap-1 ${getButton()}`}
                  title="ラック複製"
                >
                  <Copy size={14} />
                  複製
                </button>
                <button
                  onClick={() => onRemoveRack(selectedRack)}
                  className={`flex-1 p-2 rounded text-sm flex items-center justify-center gap-1 ${getButton()}`}
                  title="ラック削除"
                  disabled={Object.keys(racks).length <= 1}
                >
                  <Trash2 size={14} />
                  削除
                </button>
              </div>
              <button
                onClick={onClearAllEquipment}
                className={`w-full p-2 rounded text-sm flex items-center justify-center gap-1 ${getButton()}`}
                title="ラック内の全機器をクリア"
              >
                <RotateCcw size={14} />
                機器クリア
              </button>
            </div>
          )}
        </div>

        {/* ズーム制御 削除 */}
        {/* ビューモード 削除 */}
        {/* ラック視点切り替え 削除 */}

        {/* 統計情報 */}
        <div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 text-sm font-semibold mb-2 w-full"
          >
            {showStats ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            統計情報
          </button>
          
          {showStats && (
            <div className={`p-3 border rounded ${
              darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
            }`}>
              {selectedRack === 'all' ? (
                // 全体統計
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <BarChart3 size={14} />
                    全体統計
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Server size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{totalStats.rackCount}台</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{totalStats.totalPower}W</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{totalStats.usedUnits}U使用</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Snowflake size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{Math.round(totalStats.totalHeat/1000)}kBTU</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    <div>総重量: {totalStats.totalWeight}kg</div>
                    <div>使用率: {Math.round((totalStats.usedUnits / (totalStats.usedUnits + totalStats.availableUnits)) * 100)}%</div>
                  </div>
                </div>
              ) : currentRackStats && currentCoolingStats ? (
                // 個別ラック統計
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Server size={14} />
                    {currentRack.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Activity size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{currentRackStats.totalPower}W</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Snowflake size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{Math.round(currentRackStats.totalHeat/1000)}kBTU</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{currentRackStats.usedUnits}U</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                      <span>{currentRackStats.availableUnits}U空</span>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>重量: {currentRackStats.totalWeight}kg</div>
                    <div>平均温度: {currentCoolingStats.avgTemp}°C</div>
                    <div>冷却効率: {currentCoolingStats.coolingEfficiency}%</div>
                    {currentCoolingStats.airflowIssues.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <AlertTriangle size={12} />
                        <span>{currentCoolingStats.airflowIssues.length}件の問題</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-center text-gray-500">
                  統計データなし
                </div>
              )}
            </div>
          )}
        </div>

        {/* 設定・管理機能 */}
        <div>
          <h3 className="text-sm font-semibold mb-2">設定・管理</h3>
          <div className="space-y-2">
            <button
              onClick={onShowRackManager}
              className={`w-full p-2 rounded text-sm flex items-center gap-2 ${getButton()}`}
            >
              <Settings size={14} />
              ラック管理
            </button>
            <button
              onClick={onShowFloorSettings}
              className={`w-full p-2 rounded text-sm flex items-center gap-2 ${getButton()}`}
            >
              <Square size={14} />
              フロア設定
            </button>
            <button
              onClick={onShowCoolingConfig}
              className={`w-full p-2 rounded text-sm flex items-center gap-2 ${getButton()}`}
            >
              <Snowflake size={14} />
              冷却設定
            </button>
            <button
              onClick={onShowPowerConfig}
              className={`w-full p-2 rounded text-sm flex items-center gap-2 ${getButton()}`}
            >
              <Zap size={14} />
              電源設定
            </button>
          </div>
        </div>

        {/* フロア設定表示 */}
        {floorSettings.hasAccessFloor && (
          <div className={`p-3 border rounded ${
            darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
          }`}>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Square size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
              フリーアクセスフロア
            </h4>
            <div className="text-xs space-y-1">
              <div>高さ: {floorSettings.floorHeight}mm</div>
              <div>タイル: {floorSettings.tileSize}×{floorSettings.tileSize}mm</div>
              <div>支持脚: {floorSettings.supportType === 'adjustable' ? '調整式' : '固定式'}</div>
              <div>荷重: {
                floorSettings.loadCapacity === 'heavy' ? '重荷重' :
                floorSettings.loadCapacity === 'medium' ? '中荷重' : '軽荷重'
              }</div>
            </div>
          </div>
        )}

        {/* 機器ライブラリ 削除 */}
      </div>
    </div>
  );
};