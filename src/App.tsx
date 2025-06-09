import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Equipment, PhysicalStructure, Rack } from './types';
import { useRackState } from './hooks/useRackState';
import { useDragAndDrop, DraggedItem } from './hooks/useDragAndDrop';
import { LeftSidebar } from './components/LeftSidebar'; // Sidebar を LeftSidebar に変更
import { RightSidebar } from './components/RightSidebar'; // RightSidebar を追加
import { RackView } from './components/RackView';
import { ModalsAndDialogs, InfoModalProps, ConfirmModalProps } from './components/ModalsAndDialogs';
import { ShareButton } from './components/ShareButton';
import { calculateLayoutDimensions } from './utils';
import { loadAppState, saveAppState } from './utils/localStorage';

export type RackViewPerspective = 'front' | 'rear' | 'left' | 'right';

// メモ化されたコンポーネント
const MemoizedLeftSidebar = React.memo(LeftSidebar);
const MemoizedRightSidebar = React.memo(RightSidebar);
const MemoizedRackView = React.memo(RackView);
const MemoizedModalsAndDialogs = React.memo(ModalsAndDialogs);

function App() {
  // LocalStorageから初期状態を読み込み
  const loadedState = loadAppState();
  
  // 基本状態
  const [zoomLevel, setZoomLevel] = useState(() => loadedState.zoomLevel ?? 100);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showRackDetailsModal, setShowRackDetailsModal] = useState(false);
  
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
    updateEquipmentSpecs,
    updateEquipmentSize,
    autoInstallCageNutsForUnit,
    installCageNut,
    removeCageNut,
    installRail,
    removeRail,
    isProMode,
    toggleProMode,
    addPduToSlot,
    removePdu,
    moveEquipment,
    isSharedDataLoaded,
  } = useRackState();
  // モーダル表示関数（メモ化）
  const showInfoModal = useCallback((title: string, message: string) => {
    setInfoModal({ isOpen: true, title, message, onClose: () => setInfoModal(null) });
  }, []);

  const showConfirmModal = useCallback((
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
  }, []);

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

  // 共有データが読み込まれた場合の通知
  useEffect(() => {
    if (isSharedDataLoaded) {
      showInfoModal(
        '共有データを読み込みました',
        '共有URLからラック設計データを読み込みました。\n\n設計を変更する場合は、新しい共有URLを生成してください。'
      );
    }
  }, [isSharedDataLoaded, showInfoModal]);

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
    handleEquipmentDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop(
    racks,
    addEquipment,
    moveEquipment,
    autoInstallCageNutsForUnit,
    showInfoModal,
    showConfirmModal
  );

  // アクティブなビューモード変更（メモ化）
  const handleActiveViewModeChange = useCallback((mode: string | null) => {
    setActiveViewMode(mode);
  }, []);

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

  // 機器クリック処理（メモ化）
  const handleEquipmentClick = useCallback((equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentModal(true);
  }, []);

  // 機器削除処理（メモ化）
  const handleEquipmentRemove = useCallback((unit: number, rackId: string) => {
    showConfirmModal(
      '機器の削除',
      'この機器を削除しますか？\n関連する設定もすべて削除されます。',
      () => {
        removeEquipment(rackId, unit);
      },
      '削除する',
      'キャンセル'
    );
  }, [showConfirmModal, removeEquipment]);

  // ラック機器全クリア処理（メモ化）
  const handleClearAllEquipment = useCallback(() => {
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
  }, [selectedRack, racks, showInfoModal, showConfirmModal, clearAllEquipment]);

  // レイアウト計算（メモ化）
  const rackIds = useMemo(() =>
    selectedRack === 'all' ? Object.keys(racks) : [selectedRack],
    [selectedRack, racks]
  );
  const layoutDimensions = useMemo(() =>
    calculateLayoutDimensions(rackIds.length),
    [rackIds]
  );

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // モーダル関連のコールバック（メモ化）
  const handleCloseEquipmentModal = useCallback(() => {
    setShowEquipmentModal(false);
    setSelectedEquipment(null);
  }, []);

  const handleShowRackManager = useCallback(() => setShowRackManager(true), []);
  const handleShowFloorSettings = useCallback(() => setShowFloorSettings(true), []);
  const handleShowCoolingConfig = useCallback(() => setShowCoolingConfig(true), []);
  const handleShowPowerConfig = useCallback(() => setShowPowerConfig(true), []);

  // ラック詳細モーダルを開く処理
  const handleRackHeaderClick = useCallback((rackId: string) => {
    setSelectedRack(rackId);
    setShowRackDetailsModal(true);
  }, [setSelectedRack]);

  return (
    <div className="min-h-screen dark">
      <div className="min-h-screen bg-gray-800 text-gray-100">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <ShareButton
            racks={racks}
            floorSettings={floorSettings}
            selectedRack={selectedRack}
            activeViewMode={activeViewMode}
            rackViewPerspective={rackViewPerspective}
            isProMode={isProMode}
            zoomLevel={zoomLevel}
            onShowModal={showInfoModal}
          />
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
                {process.env.REACT_APP_COMMIT_HASH && ` - ${process.env.REACT_APP_COMMIT_HASH.substring(0, 7)}`}
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
        <MemoizedLeftSidebar
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
                className={`flex gap-32 ${
                  layoutDimensions.needsScroll ? 'overflow-x-auto pb-4 custom-scrollbar' : 'justify-center'
                }`}
                style={{ minWidth: layoutDimensions.needsScroll ? `${layoutDimensions.totalContentWidth}px` : 'auto' }}
              >
                {Object.values(racks).map(rack => (
                  <div key={rack.id} className="flex-shrink-0">
                    <MemoizedRackView
                      rack={rack}
                      zoomLevel={zoomLevel}
                      selectedRack={rack.id} // 個別のラックIDを渡す
                      activeViewMode={activeViewMode}
                      onDragOver={(e, unit) => handleDragOver(e, unit, rack.id)}
                      onDrop={(e, unit) => handleDrop(e, unit, rack.id)}
                      onEquipmentClick={handleEquipmentClick}
                      onEquipmentRemove={(unit) => handleEquipmentRemove(unit, rack.id)}
                      onEquipmentDragStart={(equipment: Equipment, unit: number, e: React.DragEvent) => handleEquipmentDragStart(e, equipment, rack.id, unit)}
                      onRackHeaderClick={() => handleRackHeaderClick(rack.id)}
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
                      onPduInstall={(side, top) =>
                        addPduToSlot(rack.id, side, top)
                      }
                      onPduRemove={(pduId) => removePdu(rack.id, pduId)}
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
                  <MemoizedRackView
                    rack={currentRack}
                    zoomLevel={zoomLevel}
                    selectedRack={selectedRack}
                    activeViewMode={activeViewMode}
                    onDragOver={(e, unit) => handleDragOver(e, unit, selectedRack)}
                    onDrop={(e, unit) => handleDrop(e, unit, selectedRack)}
                    onEquipmentClick={handleEquipmentClick}
                    onEquipmentRemove={(unit) => handleEquipmentRemove(unit, selectedRack)}
                    onEquipmentDragStart={(equipment: Equipment, unit: number, e: React.DragEvent) => handleEquipmentDragStart(e, equipment, selectedRack, unit)}
                    onRackHeaderClick={() => handleRackHeaderClick(selectedRack)}
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
                    onPduInstall={(side, top) =>
                      addPduToSlot(selectedRack, side, top)
                    }
                    onPduRemove={(pduId) => removePdu(selectedRack, pduId)}
                  />
                </div>
              </div>
            )
          )}
        </main>

        {/* 右サイドバー */}
        <MemoizedRightSidebar
          racks={racks}
          selectedRack={selectedRack}
          floorSettings={floorSettings}
          isProMode={isProMode}
          onRackSelect={setSelectedRack}
          onAddRack={addRack}
          onRemoveRack={removeRack}
          onDuplicateRack={duplicateRack}
          onClearAllEquipment={handleClearAllEquipment}
          onShowRackManager={handleShowRackManager}
          onShowFloorSettings={handleShowFloorSettings}
          onShowCoolingConfig={handleShowCoolingConfig}
          onShowPowerConfig={handleShowPowerConfig}
        />
      </div>

      {/* モーダル・ダイアログ */}
      <MemoizedModalsAndDialogs
        currentRack={currentRack}
        selectedEquipment={selectedEquipment}
        showEquipmentModal={showEquipmentModal}
        onCloseEquipmentModal={handleCloseEquipmentModal}
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
        onUpdateEquipmentSpecs={(equipmentId, field, value) =>
          updateEquipmentSpecs(selectedRack, equipmentId, field, value)
        }
        onUpdateEquipmentSize={async (equipmentId, newHeight) => {
          try {
            await updateEquipmentSize(selectedRack, equipmentId, newHeight);
          } catch (error) {
            console.error('機器サイズ変更に失敗しました:', error);
            showInfoModal('エラー', '機器サイズの変更に失敗しました。');
          }
        }}
        
        // 新しいモーダル用props
        racks={racks}
        showRackManager={showRackManager}
        onCloseRackManager={() => setShowRackManager(false)}
        onAddRack={addRack}
        onRemoveRack={removeRack}
        onDuplicateRack={duplicateRack}
        onUpdateRackName={(rackId, name) => updateRack(rackId, { name })}
        
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
        
        // ラック詳細モーダル用props
        showRackDetailsModal={showRackDetailsModal}
        onCloseRackDetailsModal={() => setShowRackDetailsModal(false)}
        selectedRackForDetails={selectedRack}
        onUpdateRackDetails={(rackId: string, updates: Partial<Rack>) => updateRack(rackId, updates)}
      />

        {/* ドラッグ終了処理 */}
        <div onDragEnd={handleDragEnd} />
      </div>
    </div>
  );
}

export default App;