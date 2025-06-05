import React, { useState } from 'react';
import { Moon, Sun, Maximize } from 'lucide-react';
import { Equipment } from './types';
import { useRackState } from './hooks/useRackState';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { Sidebar } from './components/Sidebar';
import { RackView } from './components/RackView';
import { ModalsAndDialogs } from './components/ModalsAndDialogs';
import { calculateLayoutDimensions, getContainerStyle } from './utils';

interface ViewModes {
  showPowerView: boolean;
  showMountingView: boolean;
  showLabelView: boolean;
  showAirflowView: boolean;
  showTemperatureView: boolean;
  showCablingView: boolean;
  showCageNutView: boolean;
  showFloorView: boolean;
}

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

function App() {
  // 基本状態
  const [darkMode, setDarkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  
  // ビューモード状態
  const [viewModes, setViewModes] = useState<ViewModes>({
    showPowerView: false,
    showMountingView: false,
    showLabelView: false,
    showAirflowView: false,
    showTemperatureView: false,
    showCablingView: false,
    showCageNutView: false,
    showFloorView: false
  });

  // フリーアクセスフロア設定
  const [floorSettings, setFloorSettings] = useState<FloorSettings>({
    hasAccessFloor: true,
    floorHeight: 600,
    tileSize: 600,
    supportType: 'adjustable',
    loadCapacity: 'heavy',
    cableRouting: {
      power: 'underfloor',
      data: 'underfloor',
      fiber: 'overhead'
    }
  });

  // モーダル状態
  const [showRackManager, setShowRackManager] = useState(false);
  const [showEquipmentInfo, setShowEquipmentInfo] = useState<string | null>(null);
  const [showFloorSettings, setShowFloorSettings] = useState(false);
  const [showCoolingConfig, setShowCoolingConfig] = useState(false);
  const [showPowerConfig, setShowPowerConfig] = useState(false);

  // ラック状態管理
  const {
    racks,
    selectedRack,
    currentRack,
    setSelectedRack,
    addRack,
    removeRack,
    duplicateRack,
    addEquipment,
    removeEquipment,
    updateLabel,
    updatePowerConnection,
    updateMountingOption,
    autoInstallCageNutsForUnit,
    installCageNut,
    removeCageNut
  } = useRackState();

  // ドラッグ&ドロップ
  const {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop(
    currentRack,
    addEquipment,
    autoInstallCageNutsForUnit,
    selectedRack
  );

  // ビューモード切り替え
  const handleViewModeToggle = (mode: keyof ViewModes) => {
    setViewModes(prev => ({
      ...prev,
      [mode]: !prev[mode]
    }));
  };
const handleZoomFit = () => {
    const sidebarWidth = 320; // サイドバーの幅 (w-80)
    const headerHeight = 80;  // ヘッダーの高さ
    const margin = 40; // ビューポート計算時の余裕マージン

    if (selectedRack === 'all') {
      const rackIds = Object.keys(racks);
      // calculateLayoutDimensions は window.innerWidth を内部で参照するため、
      // ここで渡す必要はありません。
      const layout = calculateLayoutDimensions(rackIds.length);
      const viewportWidth = window.innerWidth - sidebarWidth - margin;
      const viewportHeight = window.innerHeight - headerHeight - margin;
      
      const referenceRackHeight = (42 * 32) + 100; // 42Uラックの高さ + パディング等

      const widthBasedZoom = Math.floor((viewportWidth / layout.totalContentWidth) * 100);
      const heightBasedZoom = Math.floor((viewportHeight / referenceRackHeight) * 100);
      
      // ズームレベルが極端に小さくならないように最小値を設定 (例: 20%)
      // また、大きくなりすぎないように最大値も設定 (例: 75%)
      const optimalZoom = Math.min(75, Math.max(20, Math.min(widthBasedZoom, heightBasedZoom)));
      setZoomLevel(optimalZoom);
    } else if (currentRack) {
      const viewportHeight = window.innerHeight - headerHeight - margin;
      const rackContentHeight = (currentRack.units * 32) + 100; // ラックのコンテンツ高さ + パディング等
      
      // こちらも最小・最大値を設定 (例: 20% - 100%)
      const optimalZoom = Math.min(100, Math.max(20, Math.floor((viewportHeight / rackContentHeight) * 100)));
      setZoomLevel(optimalZoom);
    }
  };

  // 機器クリック処理
  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentModal(true);
  };

  // 機器削除処理
<button
              onClick={handleZoomFit}
              className={`p-2 rounded transition-colors ${
                darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="画面にフィット"
            >
              <Maximize size={18} />
            </button>
  const handleEquipmentRemove = (unit: number) => {
    if (window.confirm('この機器を削除しますか？\n関連する設定もすべて削除されます。')) {
      removeEquipment(selectedRack, unit);
    }
  };

  // レイアウト計算
  const rackIds = selectedRack === 'all' ? Object.keys(racks) : [selectedRack];
  const layoutDimensions = calculateLayoutDimensions(rackIds.length);

  const containerStyle = getContainerStyle(darkMode);

  return (
    <div className={`min-h-screen ${containerStyle} ${darkMode ? 'dark' : ''}`}>
      {/* ヘッダー */}
      <header className={`border-b p-4 ${
        darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">OTAK ラック設計システム</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              データセンター・サーバールーム設計支援ツール
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* ズーム表示 */}
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {zoomLevel}%
            </span>
            
            {/* ダークモード切り替え */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* サイドバー */}
        <Sidebar
          racks={racks}
          selectedRack={selectedRack}
          darkMode={darkMode}
          zoomLevel={zoomLevel}
          viewModes={viewModes}
          floorSettings={floorSettings}
          onRackSelect={setSelectedRack}
          onAddRack={addRack}
          onRemoveRack={removeRack}
          onDuplicateRack={duplicateRack}
          onZoomChange={setZoomLevel}
          onViewModeToggle={handleViewModeToggle}
          onDragStart={handleDragStart}
          onShowRackManager={() => setShowRackManager(true)}
          onShowFloorSettings={() => setShowFloorSettings(true)}
          onShowCoolingConfig={() => setShowCoolingConfig(true)}
          onShowPowerConfig={() => setShowPowerConfig(true)}
        />

        {/* ラック表示エリア */}
        <main className="flex-1 overflow-auto p-4 custom-scrollbar">
          {selectedRack === 'all' ? (
            // 全体表示
            <div className="space-y-6">
              <div className={`p-4 border rounded-lg ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h2 className="text-xl font-bold mb-2">全体レイアウト</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Object.keys(racks).length}台のラックを表示中
                </p>
              </div>
              
              <div
                className={`flex gap-8 ${
                  layoutDimensions.needsScroll ? 'overflow-x-auto pb-4 custom-scrollbar' : 'justify-center'
                }`}
                style={{ minWidth: layoutDimensions.needsScroll ? `${layoutDimensions.totalContentWidth}px` : 'auto' }}
              >
                {Object.values(racks).map(rack => (
                  <div key={rack.id} className="flex-shrink-0">
                    <RackView
                      rack={rack}
                      darkMode={darkMode}
                      zoomLevel={zoomLevel}
                      selectedRack={selectedRack}
                      viewModes={viewModes}
                      onEquipmentClick={handleEquipmentClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 個別ラック表示
            currentRack && (
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <RackView
                    rack={currentRack}
                    darkMode={darkMode}
                    zoomLevel={zoomLevel}
                    selectedRack={selectedRack}
                    viewModes={viewModes}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onEquipmentClick={handleEquipmentClick}
                    onEquipmentRemove={handleEquipmentRemove}
                    onCageNutInstall={(unit, side, position, nutType) => 
                      installCageNut(selectedRack, unit, side, position, nutType)
                    }
                    onCageNutRemove={(unit, side, position) => 
                      removeCageNut(selectedRack, unit, side, position)
                    }
                    onAutoInstallCageNuts={(unit, nutType) => 
                      autoInstallCageNutsForUnit(selectedRack, unit, nutType)
                    }
                  />
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* モーダル・ダイアログ */}
      <ModalsAndDialogs
        darkMode={darkMode}
        currentRack={currentRack}
        selectedEquipment={selectedEquipment}
        showEquipmentModal={showEquipmentModal}
        onCloseEquipmentModal={() => {
          setShowEquipmentModal(false);
          setSelectedEquipment(null);
        }}
        onUpdateLabel={(equipmentId, field, value) =>
          updateLabel(selectedRack, equipmentId, field, value)
        }
        onUpdatePowerConnection={(equipmentId, field, value) =>
          updatePowerConnection(selectedRack, equipmentId, field, value)
        }
        onUpdateMountingOption={(equipmentId, field, value) =>
          updateMountingOption(selectedRack, equipmentId, field, value)
        }
        
        // 新しいモーダル用props
        racks={racks}
        showRackManager={showRackManager}
        onCloseRackManager={() => setShowRackManager(false)}
        onAddRack={addRack}
        onRemoveRack={removeRack}
        onDuplicateRack={duplicateRack}
        
        floorSettings={floorSettings}
        showFloorSettings={showFloorSettings}
        onCloseFloorSettings={() => setShowFloorSettings(false)}
        onUpdateFloorSettings={setFloorSettings}
        
        showCoolingConfig={showCoolingConfig}
        onCloseCoolingConfig={() => setShowCoolingConfig(false)}
        
        showPowerConfig={showPowerConfig}
        onClosePowerConfig={() => setShowPowerConfig(false)}
      />

      {/* ドラッグ終了処理 */}
      <div onDragEnd={handleDragEnd} />
    </div>
  );
}

export default App;