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
  darkMode: boolean;
  zoomLevel: number;
  activeViewMode: string | null;
  onZoomChange: (zoom: number) => void;
  onActiveViewModeChange: (mode: string | null) => void;
  onDragStart: (e: React.DragEvent, item: any) => void;
  currentPerspective: RackViewPerspective;
  onPerspectiveChange: (perspective: RackViewPerspective) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  darkMode,
  zoomLevel,
  activeViewMode,
  onZoomChange,
  onActiveViewModeChange,
  onDragStart,
  currentPerspective,
  onPerspectiveChange
}) => {
  const [showEquipmentLibrary, setShowEquipmentLibrary] = useState(true);
  const [showViewModes, setShowViewModes] = useState(true);

  const sidebarStyle = getSidebarStyle(darkMode);
  const getButton = (isActive: boolean = false) => getButtonStyle(darkMode, isActive);

  const viewModeButtons = [
    { key: 'showPowerView' as const, icon: Zap, label: '電源', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showMountingView' as const, icon: Wrench, label: '取付', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showLabelView' as const, icon: Tag, label: 'ラベル', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showAirflowView' as const, icon: Wind, label: 'エアフロー', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showTemperatureView' as const, icon: Thermometer, label: '温度', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showCablingView' as const, icon: Cable, label: 'ケーブル', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showCageNutView' as const, icon: Square, label: 'ゲージナット', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showRailView' as const, icon: Move, label: 'レール', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' },
    { key: 'showFloorView' as const, icon: Square, label: 'フロア', color: darkMode ? 'text-gray-300' : 'text-light-text-secondary' }
  ];

  return (
    <div className={`w-80 border-r overflow-y-auto custom-scrollbar ${sidebarStyle}`}>
      <div className="p-4 space-y-4">
        {/* ズーム制御 */}
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-light-text-primary'}`}>表示倍率</h3>
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
            className={`flex items-center gap-2 text-sm font-semibold mb-2 w-full ${darkMode ? 'text-gray-100' : 'text-light-text-primary'}`}
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
                  ? 'bg-gray-600 border-custom-gray text-gray-100'
                  : 'bg-light-bg-tertiary border-light-border-primary text-light-text-primary'
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
          <h3 className={`text-sm font-semibold mb-2 mt-4 ${darkMode ? 'text-gray-100' : 'text-light-text-primary'}`}>ラック視点</h3>
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
            className={`flex items-center gap-2 text-sm font-semibold mb-2 w-full ${darkMode ? 'text-gray-100' : 'text-light-text-primary'}`}
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