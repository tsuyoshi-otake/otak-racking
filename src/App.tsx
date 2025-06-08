import React, { useState, useEffect, useCallback } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Equipment, PhysicalStructure } from './types';
import { useRackState } from './hooks/useRackState';
import { useDragAndDrop, DraggedItem, HoveredInfo } from './hooks/useDragAndDrop';
import { LeftSidebar } from './components/LeftSidebar'; // Sidebar を LeftSidebar に変更
import { RightSidebar } from './components/RightSidebar'; // RightSidebar を追加
import { RackView } from './components/RackView';
import { ModalsAndDialogs, InfoModalProps, ConfirmModalProps } from './components/ModalsAndDialogs';
import { calculateLayoutDimensions } from './utils';
import { loadAppState, saveAppState } from './utils/localStorage';

export type RackViewPerspective = 'front' | 'rear' | 'left' | 'right';
function App() {
  // LocalStorageから初期状態を読み込み
  const loadedState = loadAppState();
  
  // 基本状態
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
    updateEquipmentColor,
    updateEquipmentOpacity,
    autoInstallCageNutsForUnit,
    installCageNut,
    removeCageNut,
    installRail,
    removeRail,
    isProMode,
    toggleProMode,
  } = useRackState();
// モーダル表示関数
  const showInfoModal = (title: string, message: string) => {
    setInfoModal({ isOpen: true, title, message, onClose: () => setInfoModal(null) });
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
      confirmText,
      cancelText
    });
  };

  // LocalStorageに状態保存
  useEffect(() => {
    const appState = {
      zoomLevel,
      selectedRack,
      activeViewMode,
      rackViewPerspective,
      racks,
      floorSettings,
      isProMode,
    };
    saveAppState(appState);
  }, [zoomLevel, selectedRack, activeViewMode, rackViewPerspective, racks, floorSettings, isProMode]);

  // 選択中の機器情報が更新されたら、モーダルに表示されている情報も更新する
  useEffect(() => {
    if (selectedEquipment && currentRack) {
      const updatedEquipment = Object.values(currentRack.equipment).find(
        (e) => e.id === selectedEquipment.id
      );
      if (updatedEquipment) {
        setSelectedEquipment(updatedEquipment);
      }
    }
  }, [racks, selectedEquipment, currentRack]);

  // ドラッグ&ドロップ
  const {
    draggedItem,
    hoveredInfo,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(
    racks,
    addEquipment,
    autoInstallCageNutsForUnit,
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
  const handleEquipmentRemove = (unit: number, rackId: string) => {
    showConfirmModal(
      '機器の削除',
      'この機器を削除しますか？\n関連する設定もすべて削除されます。',
      () => {
        removeEquipment(rackId, unit);
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
    const cageNutCount = Object.keys(rack?.cageNuts || {}).length;
    const railCount = Object.keys(rack?.rails || {}).length;
    
    if (equipmentCount === 0 && cageNutCount === 0 && railCount === 0) {
      showInfoModal(
        'ラッククリア',
        'このラックには機器・ケージナット・レールが設置されていません。'
      );
      return;
    }

    const items = [];
    if (equipmentCount > 0) items.push(`機器${equipmentCount}台`);
    if (cageNutCount > 0) items.push(`ケージナット${cageNutCount}箇所`);
    if (railCount > 0) items.push(`レール${railCount}箇所`);
    const itemsText = items.join('、');

    showConfirmModal(
      'ラック内容クリア',
      `このラックの${itemsText}をすべて削除しますか？\n関連する設定もすべて削除されます。\n\n⚠️ この操作は元に戻せません。`,
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

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // クリーンアップ関数でスタイルをリセット
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      const html = document.documentElement;
      html.style.transform = '';
      html.style.transformOrigin = '';
      html.style.width = '';
      html.style.height = '';
      html.style.overflow = '';
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen dark">
      <div className="min-h-screen bg-gray-800 text-gray-100">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none"
            title={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
        {/* ヘッダー */}
        <header className="border-b p-4 border-custom-gray bg-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">otak-racking</h1>
              <p className="text-sm text-gray-300">
                データセンター・サーバールーム設計支援ツール
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* ズーム表示 */}
            </div>
          </div>
        </header>

      {/* メインコンテンツ */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左サイドバー */}
        <LeftSidebar
          zoomLevel={zoomLevel}
          activeViewMode={activeViewMode}
          onZoomChange={setZoomLevel}
          onActiveViewModeChange={handleActiveViewModeChange}
          onDragStart={handleDragStart}
          currentPerspective={rackViewPerspective}
          onPerspectiveChange={setRackViewPerspective}
          isProMode={isProMode}
          onToggleProMode={toggleProMode}
        />

        {/* ラック表示エリア */}
        <main className="flex-1 overflow-auto p-4 custom-scrollbar">
          {selectedRack === 'all' ? (
            // 全体表示
            <div className="space-y-6">
              <div className="p-4 border rounded-lg bg-gray-700 border-custom-gray">
                <h2 className="text-xl font-bold mb-2 text-gray-100">全体レイアウト</h2>
                <p className="text-sm text-gray-300">
                  {Object.keys(racks).length}台のラックを表示中
                </p>
              </div>
              
              <div
                className={`flex gap-16 ${
                  layoutDimensions.needsScroll ? 'overflow-x-auto pb-4 custom-scrollbar' : 'justify-center'
                }`}
                style={{ minWidth: layoutDimensions.needsScroll ? `${layoutDimensions.totalContentWidth}px` : 'auto' }}
              >
                {Object.values(racks).map(rack => (
                  <div key={rack.id} className="flex-shrink-0">
                    <RackView
                      rack={rack}
                      zoomLevel={zoomLevel}
                      selectedRack={rack.id} // 個別のラックIDを渡す
                      activeViewMode={activeViewMode}
                      onDragOver={(e, unit) => handleDragOver(e, unit, rack.id)}
                      onDrop={(e, unit) => handleDrop(e, unit, rack.id)}
                      onEquipmentClick={handleEquipmentClick}
                      onEquipmentRemove={(unit) => handleEquipmentRemove(unit, rack.id)}
                      onCageNutInstall={(unit, side, position, nutType) =>
                        installCageNut(rack.id, unit, side, position, nutType)
                      }
                      onCageNutRemove={(unit, side, position) =>
                        removeCageNut(rack.id, unit, side, position)
                      }
                      onAutoInstallCageNuts={(unit, nutType) =>
                        autoInstallCageNutsForUnit(rack.id, unit, nutType)
                      }
                      draggedItem={draggedItem as DraggedItem | null}
                      hoveredUnit={hoveredInfo.rackId === rack.id ? hoveredInfo.unit : null}
                      perspective={rackViewPerspective}
                      showConfirmModal={showConfirmModal}
                      onUpdatePhysicalStructure={(updates) => {
                        updateRack(rack.id, {
                          physicalStructure: {
                            ...rack.physicalStructure,
                            ...updates
                          }
                        });
                      }}
                      onRailInstall={(unit, side, railType) =>
                        installRail(rack.id, unit, side, railType as any)
                      }
                      onRailRemove={(unit, side) =>
                        removeRail(rack.id, unit, side)
                      }
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
                    zoomLevel={zoomLevel}
                    selectedRack={selectedRack}
                    activeViewMode={activeViewMode}
                    onDragOver={(e, unit) => handleDragOver(e, unit, selectedRack)}
                    onDrop={(e, unit) => handleDrop(e, unit, selectedRack)}
                    onEquipmentClick={handleEquipmentClick}
                    onEquipmentRemove={(unit) => handleEquipmentRemove(unit, selectedRack)}
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
                    hoveredUnit={hoveredInfo.rackId === selectedRack ? hoveredInfo.unit : null}
                    perspective={rackViewPerspective}
                    showConfirmModal={showConfirmModal}
                    onUpdatePhysicalStructure={handleUpdatePhysicalStructure}
                    onRailInstall={(unit, side, railType) =>
                      installRail(selectedRack, unit, side, railType as any)
                    }
                    onRailRemove={(unit, side) =>
                      removeRail(selectedRack, unit, side)
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
          floorSettings={floorSettings}
          isProMode={isProMode}
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
        onUpdateEquipmentColor={(equipmentId, color) =>
          updateEquipmentColor(selectedRack, equipmentId, color)
        }
        onUpdateEquipmentOpacity={(equipmentId, opacity) =>
          updateEquipmentOpacity(selectedRack, equipmentId, opacity)
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
    </div>
  );
}

export default App;