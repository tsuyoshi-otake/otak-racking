import React, { useState } from 'react';
import {
  Zap,
  Wrench,
  Tag,
  Wind,
  Thermometer,
  Cable,
  Square,
  ChevronDown,
  ChevronRight,
  Move
} from 'lucide-react';
import { RackViewPerspective } from '../App'; // App.tsx から型をインポート
import {
  getSidebarStyle,
  getButtonStyle
} from '../utils';
import { zoomLevels } from '../constants';
import { EquipmentLibrary } from './EquipmentLibrary';

interface LeftSidebarProps {
  zoomLevel: number;
  activeViewMode: string | null;
  onZoomChange: (zoom: number) => void;
  onActiveViewModeChange: (mode: string | null) => void;
  onDragStart: (e: React.DragEvent, item: any) => void;
  currentPerspective: RackViewPerspective;
  onPerspectiveChange: (perspective: RackViewPerspective) => void;
  isProMode: boolean;
  onToggleProMode: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  zoomLevel,
  activeViewMode,
  onZoomChange,
  onActiveViewModeChange,
  onDragStart,
  currentPerspective,
  onPerspectiveChange,
  isProMode,
  onToggleProMode
}) => {
  const [showEquipmentLibrary, setShowEquipmentLibrary] = useState(true);
  const [showViewModes, setShowViewModes] = useState(true);

  const sidebarStyle = getSidebarStyle();
  const getButton = (isActive: boolean = false) => getButtonStyle(isActive);

  const viewModeButtons = [
    { key: 'showPowerView' as const, icon: Zap, label: '電源', color: 'text-gray-300' },
    { key: 'showMountingView' as const, icon: Wrench, label: '取付', color: 'text-gray-300' },
    { key: 'showLabelView' as const, icon: Tag, label: 'ラベル', color: 'text-gray-300' },
    { key: 'showAirflowView' as const, icon: Wind, label: 'エアフロー', color: 'text-gray-300' },
    { key: 'showTemperatureView' as const, icon: Thermometer, label: '温度', color: 'text-gray-300' },
    { key: 'showCablingView' as const, icon: Cable, label: 'ケーブル', color: 'text-gray-300' },
    { key: 'showCageNutView' as const, icon: Square, label: 'ゲージナット', color: 'text-gray-300' },
    { key: 'showRailView' as const, icon: Move, label: 'レール', color: 'text-gray-300' },
    { key: 'showFloorView' as const, icon: Square, label: 'フロア', color: 'text-gray-300' }
  ];

  return (
    <div className={`w-80 border-r overflow-y-auto custom-scrollbar ${sidebarStyle}`}>
      <div className="p-4 space-y-4">
        {/* ズーム制御 */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-100">表示倍率</h3>
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
            className="flex items-center gap-2 text-sm font-semibold mb-2 w-full text-gray-100"
          >
            {showViewModes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            表示モード
          </button>
          
          {showViewModes && (
            <select
              value={activeViewMode || ''}
              onChange={(e) => onActiveViewModeChange(e.target.value || null)}
              className="w-full p-2 border rounded text-sm bg-gray-600 border-custom-gray text-gray-100"
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
          <h3 className="text-sm font-semibold mb-2 mt-4 text-gray-100">ラック視点</h3>
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

        {/* 機器ライブラリ */}
        <div>
          <button
            onClick={() => setShowEquipmentLibrary(!showEquipmentLibrary)}
            className="flex items-center gap-2 text-sm font-semibold mb-2 w-full text-gray-100"
          >
            {showEquipmentLibrary ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            機器ライブラリ
          </button>
          
          {showEquipmentLibrary && (
            <EquipmentLibrary
              onDragStart={onDragStart}
            />
          )}
        </div>
        
        {/* Pro Mode トグル */}
        <div className="border-t border-custom-gray pt-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-100">設定</h3>
          <div className="flex items-center justify-between">
            <label htmlFor="pro-mode-toggle" className="text-sm text-gray-300">
              Pro Mode
            </label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                name="pro-mode-toggle"
                id="pro-mode-toggle"
                checked={isProMode}
                onChange={onToggleProMode}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label
                htmlFor="pro-mode-toggle"
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"
              ></label>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            機器設置の制約を強化します。
          </p>
        </div>
      </div>
    </div>
  );
};