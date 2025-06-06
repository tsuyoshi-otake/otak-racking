import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Zap,
  Wrench,
  Tag,
  Wind,
  Thermometer,
  Cable,
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
import { Rack } from '../types'; // ViewMode を削除 (未使用のため)
import { RackViewPerspective } from '../App'; // App.tsx から型をインポート
import {
  calculateTotalStats,
  calculateRackStats,
  calculateCoolingStats,
  getSidebarStyle,
  getButtonStyle
} from '../utils';
import { zoomLevels } from '../constants';
import { EquipmentLibrary } from './EquipmentLibrary';

// ViewModes は App.tsx で activeViewMode として管理されるため、
// ここでの Props は activeViewMode とその更新関数になる
// export type ViewModeKey = 'showPowerView' | 'showMountingView' | 'showLabelView' | 'showAirflowView' | 'showTemperatureView' | 'showCablingView' | 'showCageNutView' | 'showFloorView';

interface FloorSettings {
  hasAccessFloor: boolean;
  floorHeight: number;
  tileSize: number;
  supportType: 'fixed' | 'adjustable';
  loadCapacity: 'light' | 'medium' | 'heavy';
  cableRouting: {
    power: 'underfloor' | 'overhead' | 'side';
    data: 'underfloor' | 'overhead' | 'side';
    fiber: 'underfloor' | 'overhead' | 'side';
  };
}

interface SidebarProps {
  racks: Record<string, Rack>;
  selectedRack: string;
  darkMode: boolean;
  zoomLevel: number;
  // viewModes: ViewModes; // 削除
  activeViewMode: string | null; // 追加 (より厳密な型は後で検討)
  floorSettings: FloorSettings;
  onRackSelect: (rackId: string) => void;
  onAddRack: () => void;
  onRemoveRack: (rackId: string) => void;
  onDuplicateRack: (rackId: string) => void;
  onZoomChange: (zoom: number) => void;
  // onViewModeToggle: (mode: keyof ViewModes) => void; // 削除
  onActiveViewModeChange: (mode: string | null) => void; // 追加
  onDragStart: (e: React.DragEvent, item: any) => void;
  onShowRackManager: () => void;
  onShowFloorSettings: () => void;
  onShowCoolingConfig: () => void;
  onShowPowerConfig: () => void;
  currentPerspective: RackViewPerspective;
  onPerspectiveChange: (perspective: RackViewPerspective) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  racks,
  selectedRack,
  darkMode,
  zoomLevel,
  // viewModes, // 削除
  activeViewMode, // 追加
  floorSettings,
  onRackSelect,
  onAddRack,
  onRemoveRack,
  onDuplicateRack,
  onZoomChange,
  // onViewModeToggle, // 削除
  onActiveViewModeChange, // 追加
  onDragStart,
  onShowRackManager,
  onShowFloorSettings,
  onShowCoolingConfig,
  onShowPowerConfig,
  currentPerspective,
  onPerspectiveChange
}) => {
  const [showStats, setShowStats] = useState(true);
  const [showEquipmentLibrary, setShowEquipmentLibrary] = useState(true);
  const [showViewModes, setShowViewModes] = useState(true);

  const totalStats = calculateTotalStats(racks);
  const currentRack = racks[selectedRack];
  const currentRackStats = currentRack ? calculateRackStats(currentRack) : null;
  const currentCoolingStats = currentRack ? calculateCoolingStats(currentRack) : null;

  const sidebarStyle = getSidebarStyle(darkMode);
  const getButton = (isActive: boolean = false) => getButtonStyle(darkMode, isActive);

  const viewModeButtons = [
    { key: 'showPowerView' as const, icon: Zap, label: '電源', color: 'text-red-500' },
    { key: 'showMountingView' as const, icon: Wrench, label: '取付', color: 'text-purple-500' },
    { key: 'showLabelView' as const, icon: Tag, label: 'ラベル', color: 'text-blue-500' },
    { key: 'showAirflowView' as const, icon: Wind, label: 'エアフロー', color: 'text-green-500' },
    { key: 'showTemperatureView' as const, icon: Thermometer, label: '温度', color: 'text-orange-500' },
    { key: 'showCablingView' as const, icon: Cable, label: 'ケーブル', color: 'text-cyan-500' },
    { key: 'showCageNutView' as const, icon: Square, label: 'ゲージナット', color: 'text-gray-500' },
    { key: 'showFloorView' as const, icon: Square, label: 'フロア', color: 'text-indigo-500' }
  ];

  return (
    <div className={`w-80 border-r overflow-y-auto custom-scrollbar ${sidebarStyle}`}>
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
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
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
          )}
        </div>

        {/* ズーム制御 */}
        <div>
          <h3 className="text-sm font-semibold mb-2">表示倍率</h3>
          <div className="flex gap-1">
            {zoomLevels.map(zoom => (
              <button
                key={zoom}
                onClick={() => onZoomChange(zoom)}
                className={`px-3 py-1 rounded text-sm ${getButton(zoomLevel === zoom)}`}
              >
                {zoom}%
              </button>
            ))}
          </div>
        </div>

        {/* ビューモード */}
        <div>
          <button
            onClick={() => setShowViewModes(!showViewModes)}
            className="flex items-center gap-2 text-sm font-semibold mb-2 w-full"
          >
            {showViewModes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            表示モード
          </button>
          
          {showViewModes && (
            <select
              value={activeViewMode || ''}
              onChange={(e) => onActiveViewModeChange(e.target.value || null)}
              className={`w-full p-2 border rounded text-sm ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">標準表示</option>
              {viewModeButtons.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
{/* ラック視点切り替え */}
          <div>
            <h3 className="text-sm font-semibold mb-2 mt-4">ラック視点</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['front', 'rear', 'left', 'right'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onPerspectiveChange(p)}
                  className={`p-2 rounded text-xs flex items-center justify-center gap-1 ${
                    getButton(currentPerspective === p)
                  }`}
                >
                  {p === 'front' ? '前面' : p === 'rear' ? '背面' : p === 'left' ? '左面' : '右面'}
                </button>
              ))}
            </div>
          </div>

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
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
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
                      <Server size={12} className="text-blue-400" />
                      <span>{totalStats.rackCount}台</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity size={12} className="text-red-400" />
                      <span>{totalStats.totalPower}W</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={12} className="text-green-400" />
                      <span>{totalStats.usedUnits}U使用</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Snowflake size={12} className="text-cyan-400" />
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
                      <Activity size={12} className="text-red-400" />
                      <span>{currentRackStats.totalPower}W</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Snowflake size={12} className="text-cyan-400" />
                      <span>{Math.round(currentRackStats.totalHeat/1000)}kBTU</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={12} className="text-green-400" />
                      <span>{currentRackStats.usedUnits}U</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square size={12} className="text-gray-400" />
                      <span>{currentRackStats.availableUnits}U空</span>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>重量: {currentRackStats.totalWeight}kg</div>
                    <div>平均温度: {currentCoolingStats.avgTemp}°C</div>
                    <div>冷却効率: {currentCoolingStats.coolingEfficiency}%</div>
                    {currentCoolingStats.airflowIssues.length > 0 && (
                      <div className="flex items-center gap-1 text-orange-400">
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
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
          }`}>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Square size={12} className="text-indigo-500" />
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

        {/* 機器ライブラリ */}
        <div>
          <button
            onClick={() => setShowEquipmentLibrary(!showEquipmentLibrary)}
            className="flex items-center gap-2 text-sm font-semibold mb-2 w-full"
          >
            {showEquipmentLibrary ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            機器ライブラリ
          </button>
          
          {showEquipmentLibrary && (
            <EquipmentLibrary
              darkMode={darkMode}
              onDragStart={onDragStart}
            />
          )}
        </div>
      </div>
    </div>
  );
};