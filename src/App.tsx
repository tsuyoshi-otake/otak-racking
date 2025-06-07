import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Equipment, PhysicalStructure } from './types';
import { useRackState } from './hooks/useRackState';
import { useDragAndDrop, DraggedItem } from './hooks/useDragAndDrop';
import { LeftSidebar } from './components/LeftSidebar'; // Sidebar を LeftSidebar に変更
import { RightSidebar } from './components/RightSidebar'; // RightSidebar を追加
import { RackView } from './components/RackView';
import { ModalsAndDialogs, InfoModalProps, ConfirmModalProps } from './components/ModalsAndDialogs';
import { calculateLayoutDimensions, getContainerStyle } from './utils';
import { loadAppState, saveAppState } from './utils/localStorage';

export type RackViewPerspective = 'front' | 'rear' | 'left' | 'right';
function App() {
  // LocalStorageから初期状態を読み込み
  const loadedState = loadAppState();
  
  // 基本状態
  const [darkMode, setDarkMode] = useState(() => loadedState.darkMode ?? false);
  const [zoomLevel, setZoomLevel] = useState(() => loadedState.zoomLevel ?? 100);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  
  const [rackViewPerspective, setRackViewPerspective] = useState<RackViewPerspective>(() =>
    loadedState.rackViewPerspective ?? 'front'
  );
  
  // アクティブなビューモードの状態 (単一選択)
  const [activeViewMode, setActiveViewMode] = useState<string | null>(() =>
    loadedState.activeViewMode ?? null
  );

  // モーダル状態
  const [showRackManager, setShowRackManager] = useState(false);
  const [showFloorSettings, setShowFloorSettings] = useState(false);
  const [showCoolingConfig, setShowCoolingConfig] = useState(false);
  const [showPowerConfig, setShowPowerConfig] = useState(false);

  // 通知・確認モーダル用 state
  const [infoModal, setInfoModal] = useState<InfoModalProps | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalProps | null>(null);

  // ラック状態管理
  const {
    racks,
    selectedRack,
    currentRack,
    floorSettings,
    setSelectedRack,
    setFloorSettings,
    addRack,
    removeRack,
    duplicateRack,
    updateRack,
    addEquipment,
    removeEquipment,
    clearAllEquipment,
    updateLabel,
    updatePowerConnection,
    updateMountingOption,
    autoInstallCageNutsForUnit,
    installCageNut,
    removeCageNut,
    installRail,
    removeRail,
  } = useRackState();
// モーダル表示関数
  const showInfoModal = (title: string, message: string) => {
    setInfoModal({ isOpen: true, title, message, onClose: () => setInfoModal(null), darkMode });
  };

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirmAction: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmModal(null); // 確認後も閉じる
      },
      onClose: () => setConfirmModal(null),
      darkMode,
      confirmText,
      cancelText
    });
  };

  // LocalStorageに状態保存
  useEffect(() => {
    const appState = {
      darkMode,
      zoomLevel,
      selectedRack,
      activeViewMode,
      rackViewPerspective,
      racks,
      floorSettings
    };
    saveAppState(appState);
  }, [darkMode, zoomLevel, selectedRack, activeViewMode, rackViewPerspective, racks, floorSettings]);

  // ドラッグ&ドロップ
  const {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    draggedItem
  } = useDragAndDrop(
    currentRack,
    addEquipment,
    autoInstallCageNutsForUnit,
    selectedRack,
    showInfoModal,
    showConfirmModal
  );

  // アクティブなビューモード変更
  const handleActiveViewModeChange = (mode: string | null) => {
    setActiveViewMode(mode);
  };

  // 物理構造更新関数
  const handleUpdatePhysicalStructure = useCallback((updates: Partial<PhysicalStructure>) => {
    if (selectedRack && selectedRack !== 'all') {
      updateRack(selectedRack, {
        physicalStructure: {
          ...racks[selectedRack]?.physicalStructure,
          ...updates
        }
      });
    }
  }, [selectedRack, racks, updateRack]);

  // 機器クリック処理
  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentModal(true);
  };

  // 機器削除処理
  const handleEquipmentRemove = (unit: number) => {
    showConfirmModal(
      '機器の削除',
      'この機器を削除しますか？\n関連する設定もすべて削除されます。',
      () => {
        removeEquipment(selectedRack, unit);
      },
      '削除する',
      'キャンセル'
    );
  };

  // ラック機器全クリア処理
  const handleClearAllEquipment = () => {
    if (selectedRack === 'all') return;
    
    const rack = racks[selectedRack];
    const equipmentCount = Object.keys(rack?.equipment || {}).length;
    
    if (equipmentCount === 0) {
      showInfoModal(
        'ラッククリア',
        'このラックには機器が設置されていません。'
      );
      return;
    }

    showConfirmModal(
      'ラック機器クリア',
      `このラックの全ての機器（${equipmentCount}台）を削除しますか？\n関連する設定もすべて削除されます。\n\n⚠️ この操作は元に戻せません。`,
      () => {
        clearAllEquipment(selectedRack);
      },
      'すべて削除する',
      'キャンセル'
    );
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
            <h1 className="text-2xl font-bold">otak-racking</h1>
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
        {/* 左サイドバー */}
        <LeftSidebar
          darkMode={darkMode}
          zoomLevel={zoomLevel}
          activeViewMode={activeViewMode}
          onZoomChange={setZoomLevel}
          onActiveViewModeChange={handleActiveViewModeChange}
          onDragStart={handleDragStart}
          currentPerspective={rackViewPerspective}
          onPerspectiveChange={setRackViewPerspective}
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
                      activeViewMode={activeViewMode}
                      onEquipmentClick={handleEquipmentClick}
                      perspective={rackViewPerspective}
                      showConfirmModal={showConfirmModal}
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
                    activeViewMode={activeViewMode}
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
                    draggedItem={draggedItem as DraggedItem | null}
                    perspective={rackViewPerspective}
                    showConfirmModal={showConfirmModal}
                    onUpdatePhysicalStructure={handleUpdatePhysicalStructure}
                    onRailInstall={(unit, railType) =>
                      installRail(selectedRack, unit, railType as any)
                    }
                    onRailRemove={(unit) =>
                      removeRail(selectedRack, unit)
                    }
                  />
                </div>
              </div>
            )
          )}
        </main>

        {/* 右サイドバー */}
        <RightSidebar
          racks={racks}
          selectedRack={selectedRack}
          darkMode={darkMode}
          floorSettings={floorSettings}
          onRackSelect={setSelectedRack}
          onAddRack={addRack}
          onRemoveRack={removeRack}
          onDuplicateRack={duplicateRack}
          onClearAllEquipment={handleClearAllEquipment}
          onShowRackManager={() => setShowRackManager(true)}
          onShowFloorSettings={() => setShowFloorSettings(true)}
          onShowCoolingConfig={() => setShowCoolingConfig(true)}
          onShowPowerConfig={() => setShowPowerConfig(true)}
        />
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

        infoModal={infoModal}
        confirmModal={confirmModal}
      />

      {/* ドラッグ終了処理 */}
      <div onDragEnd={handleDragEnd} />
    </div>
  );
}

export default App;