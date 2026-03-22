import React, { useState } from 'react';
import {
  Server,
  Eye,
  RotateCcw,
  Settings,
  Menu,
  X,
  FilePlus,
  Upload,
  Download,
  FileText,
  Share2,
  Maximize,
  Square,
  Snowflake,
  Zap,
  ZoomIn,
  ZoomOut,
  Palette
} from 'lucide-react';
import { Rack, RackViewPerspective } from '../types';

interface MobileBottomNavProps {
  racks: Record<string, Rack>;
  selectedRack: string;
  currentPerspective: RackViewPerspective;
  activeViewMode: string | null;
  zoomLevel: number;
  onRackSelect: (rackId: string) => void;
  onPerspectiveToggle: () => void;
  onViewModeChange: (mode: string | null) => void;
  onZoomChange: (zoom: number) => void;
  onShowRackManager: () => void;
  onShowFloorSettings: () => void;
  onShowCoolingConfig: () => void;
  onShowPowerConfig: () => void;
  onNew: () => void;
  onImport: () => void;
  onExport: () => void;
  onCopyMarkdown: () => void;
  onShare: () => void;
  onFullscreen: () => void;
  themeLabel: string;
  onCycleTheme: () => void;
}

const viewModes = [
  { key: null, label: '標準表示' },
  { key: 'showPowerView', label: '電源' },
  { key: 'showMountingView', label: '取付' },
  { key: 'showLabelView', label: 'ラベル' },
  { key: 'showAirflowView', label: 'エアフロー' },
  { key: 'showTemperatureView', label: '温度' },
  { key: 'showCablingView', label: 'ケーブル' },
  { key: 'showCageNutView', label: 'ゲージナット' },
  { key: 'showRailView', label: 'レール' },
  { key: 'showFloorView', label: 'フロア' },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  racks,
  selectedRack,
  currentPerspective,
  activeViewMode,
  zoomLevel,
  onRackSelect,
  onPerspectiveToggle,
  onViewModeChange,
  onZoomChange,
  onShowRackManager,
  onShowFloorSettings,
  onShowCoolingConfig,
  onShowPowerConfig,
  onNew,
  onImport,
  onExport,
  onCopyMarkdown,
  onShare,
  onFullscreen,
  themeLabel,
  onCycleTheme
}) => {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const currentRack = racks[selectedRack];
  const rackName = selectedRack === 'all' ? '全体' : currentRack?.name || 'ラック';

  return (
    <>
      {/* パネルオーバーレイ */}
      {activePanel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setActivePanel(null)}
        />
      )}

      {/* ポップアップパネル */}
      {activePanel && (
        <div className="fixed inset-x-0 bottom-14 z-50 bg-gray-800 border-t border-custom-gray rounded-t-xl max-h-[60vh] overflow-y-auto custom-scrollbar animate-slide-up">
          <div className="p-3">
            {activePanel === 'rack' && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">ラック選択</h4>
                <button
                  onClick={() => { onRackSelect('all'); setActivePanel(null); }}
                  className={`w-full p-3 rounded-lg text-left text-sm ${selectedRack === 'all' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700 text-gray-200'}`}
                >
                  全体表示
                </button>
                {Object.values(racks).map(rack => (
                  <button
                    key={rack.id}
                    onClick={() => { onRackSelect(rack.id); setActivePanel(null); }}
                    className={`w-full p-3 rounded-lg text-left text-sm ${selectedRack === rack.id ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700 text-gray-200'}`}
                  >
                    {rack.name} ({rack.units}U)
                  </button>
                ))}
              </div>
            )}

            {activePanel === 'view' && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">表示モード</h4>
                {viewModes.map(({ key, label }) => (
                  <button
                    key={key || 'standard'}
                    onClick={() => { onViewModeChange(key); setActivePanel(null); }}
                    className={`w-full p-3 rounded-lg text-left text-sm ${activeViewMode === key ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700 text-gray-200'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {activePanel === 'settings' && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">設定</h4>
                <button onClick={() => { onShowRackManager(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Settings size={14} /> ラック管理
                </button>
                <button onClick={() => { onShowFloorSettings(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Square size={14} /> フロア設定
                </button>
                <button onClick={() => { onShowCoolingConfig(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Snowflake size={14} /> 冷却設定
                </button>
                <button onClick={() => { onShowPowerConfig(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Zap size={14} /> 電源・PDU設定
                </button>
                <div className="border-t border-gray-700 my-2" />
                <h4 className="text-xs font-semibold text-gray-400 mb-2">テーマ</h4>
                <button onClick={() => { onCycleTheme(); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Palette size={14} /> {themeLabel}
                </button>
                <div className="border-t border-gray-700 my-2" />
                <h4 className="text-xs font-semibold text-gray-400 mb-2">ズーム</h4>
                <div className="flex items-center gap-2 px-3">
                  <button onClick={() => onZoomChange(Math.max(50, zoomLevel - 25))} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-sm text-gray-300 flex-1 text-center">{zoomLevel}%</span>
                  <button onClick={() => onZoomChange(Math.min(200, zoomLevel + 25))} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
                    <ZoomIn size={18} />
                  </button>
                </div>
              </div>
            )}

            {activePanel === 'menu' && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">メニュー</h4>
                <button onClick={() => { onNew(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <FilePlus size={14} /> 新規作成
                </button>
                <button onClick={() => { onImport(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Upload size={14} /> JSONインポート
                </button>
                <button onClick={() => { onExport(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Download size={14} /> JSONエクスポート
                </button>
                <button onClick={() => { onCopyMarkdown(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <FileText size={14} /> マークダウンコピー
                </button>
                <button onClick={() => { onShare(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Share2 size={14} /> 共有URL生成
                </button>
                <button onClick={() => { onFullscreen(); setActivePanel(null); }} className="w-full p-3 rounded-lg text-left text-sm hover:bg-gray-700 text-gray-200 flex items-center gap-2">
                  <Maximize size={14} /> フルスクリーン
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ボトムナビバー */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 border-t border-custom-gray" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => togglePanel('rack')}
            className={`flex flex-col items-center justify-center text-xs gap-0.5 px-2 py-1 ${activePanel === 'rack' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <Server size={18} />
            <span className="truncate max-w-[60px]">{rackName}</span>
          </button>
          <button
            onClick={() => togglePanel('view')}
            className={`flex flex-col items-center justify-center text-xs gap-0.5 px-2 py-1 ${activePanel === 'view' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <Eye size={18} />
            <span>表示</span>
          </button>
          <button
            onClick={() => { onPerspectiveToggle(); setActivePanel(null); }}
            className="flex flex-col items-center justify-center text-xs gap-0.5 px-2 py-1 text-gray-400"
          >
            <RotateCcw size={18} />
            <span>{currentPerspective === 'front' ? '前面' : '背面'}</span>
          </button>
          <button
            onClick={() => togglePanel('settings')}
            className={`flex flex-col items-center justify-center text-xs gap-0.5 px-2 py-1 ${activePanel === 'settings' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <Settings size={18} />
            <span>設定</span>
          </button>
          <button
            onClick={() => togglePanel('menu')}
            className={`flex flex-col items-center justify-center text-xs gap-0.5 px-2 py-1 ${activePanel === 'menu' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            {activePanel === 'menu' ? <X size={18} /> : <Menu size={18} />}
            <span>メニュー</span>
          </button>
        </div>
      </nav>
    </>
  );
};
