import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Maximize, Minimize, Upload, Download, FileText, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, FilePlus, Palette } from 'lucide-react';
import { Equipment, PhysicalStructure, Rack, RackViewPerspective } from './types';
import { useRackState } from './hooks/useRackState';
import { useIsMobile } from './hooks/useIsMobile';
import { useDragAndDrop, DraggedItem } from './hooks/useDragAndDrop';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { RackView } from './components/RackView';
import { ModalsAndDialogs, InfoModalProps, ConfirmModalProps } from './components/ModalsAndDialogs';
import { ShareButton } from './components/ShareButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileEquipmentPicker } from './components/MobileEquipmentPicker';
import { MobileContextMenu } from './components/MobileContextMenu';
import { calculateLayoutDimensions } from './utils';
import { loadAppState, saveAppState, clearAppState } from './utils/localStorage';
import { generateRackMarkdown, exportRackJson, importRackJson, createShareableData, generateShareUrl } from './utils/shareUtils';

// テーマ定義
type ThemeName = 'default' | 'claude' | 'light-gray';
const THEMES: ThemeName[] = ['default', 'claude', 'light-gray'];
const THEME_LABELS: Record<ThemeName, string> = {
  default: 'Cool',
  claude: 'Claude',
  'light-gray': 'Light Gray',
};

// メモ化されたコンポーネント
const MemoizedLeftSidebar = React.memo(LeftSidebar);
const MemoizedRightSidebar = React.memo(RightSidebar);
const MemoizedRackView = React.memo(RackView);
const MemoizedModalsAndDialogs = ModalsAndDialogs;

function App() {
  const isMobile = useIsMobile();

  // テーマ状態
  const [theme, setTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem('otak-racking-theme') as ThemeName) || 'default';
  });

  const cycleTheme = useCallback(() => {
    setTheme(prev => {
      const idx = THEMES.indexOf(prev);
      const next = THEMES[(idx + 1) % THEMES.length];
      localStorage.setItem('otak-racking-theme', next);
      return next;
    });
  }, []);

  // LocalStorageから初期状態を読み込み（初回のみ実行）
  const [loadedState] = useState(() => loadAppState());

  // 基本状態
  const [zoomLevel, setZoomLevel] = useState(() => loadedState.zoomLevel ?? 100);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showRackDetailsModal, setShowRackDetailsModal] = useState(false);
  
  const [rackViewPerspective, setRackViewPerspective] = useState<RackViewPerspective>(() => {
    const saved = loadedState.rackViewPerspective as string;
    // 左右の視点が保存されている場合は前面にフォールバック
    if (saved === 'left' || saved === 'right') {
      return 'front';
    }
    return (saved as RackViewPerspective) ?? 'front';
  });
  
  // アクティブなビューモードの状態 (単一選択)
  const [activeViewMode, setActiveViewMode] = useState<string | null>(() =>
    loadedState.activeViewMode ?? null
  );

  // モーダル状態
  const [showRackManager, setShowRackManager] = useState(false);
  const [showFloorSettings, setShowFloorSettings] = useState(false);
  const [showCoolingConfig, setShowCoolingConfig] = useState(false);
  const [showPowerConfig, setShowPowerConfig] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // モバイル用 state
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);
  const [tappedUnit, setTappedUnit] = useState<number>(0);
  const [tappedRackId, setTappedRackId] = useState<string>('');
  const pickerClosedAt = useRef<number>(0);
  const [contextMenuEquipment, setContextMenuEquipment] = useState<Equipment | null>(null);
  const [contextMenuUnit, setContextMenuUnit] = useState<number>(0);
  const [contextMenuRackId, setContextMenuRackId] = useState<string>('');
  const [showContextMenu, setShowContextMenu] = useState(false);

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
    updateLabel,
    updatePowerConnection,
    updateMountingOption,
    updateEquipmentColor,
    updateEquipmentOpacity,
    updateEquipmentSpecs,
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
    toggleEquipmentHealth,
    toggleEquipmentPower,
    isSharedDataLoaded,
    restoreState,
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

  // モバイル時のズーム自動調整
  useEffect(() => {
    if (isMobile) {
      const mobileZoom = Math.floor((window.innerWidth - 32) / 600 * 100);
      setZoomLevel(Math.max(50, Math.min(100, mobileZoom)));
    }
  }, [isMobile]);

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
      if (updatedEquipment && updatedEquipment !== selectedEquipment) {
        setSelectedEquipment(updatedEquipment);
      }
    }
  }, [racks, currentRack]);

  // ドラッグ&ドロップ
  const {
    draggedItem,
    draggedEquipmentInfo,
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

  // ラックエリア外でのドロップ処理（機器削除）
  const handleDropOutside = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // ラックからドラッグされた機器の場合のみ削除処理を実行
    if (draggedEquipmentInfo) {
      removeEquipment(draggedEquipmentInfo.sourceRackId, draggedEquipmentInfo.sourceUnit);
    }
    
    // ドラッグ状態をリセット
    handleDragEnd();
  }, [draggedEquipmentInfo, removeEquipment, handleDragEnd]);

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

  // 新規作成
  const handleNew = useCallback(() => {
    showConfirmModal(
      '新規作成',
      '現在の設計データをすべて破棄して、新しい設計を開始しますか？',
      () => {
        clearAppState();
        window.location.hash = '';
        window.location.reload();
      },
      '新規作成',
      'キャンセル'
    );
  }, [showConfirmModal]);

  // ファイルインポート用ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // マークダウンコピー
  const handleCopyMarkdown = useCallback(async () => {
    const md = generateRackMarkdown(racks);
    await navigator.clipboard.writeText(md);
    showInfoModal('マークダウンをコピーしました', 'クリップボードにラック構成のマークダウンをコピーしました。');
  }, [racks, showInfoModal]);

  // JSONエクスポート
  const handleExportJson = useCallback(() => {
    const data = createShareableData(racks, floorSettings, selectedRack, activeViewMode, rackViewPerspective, isProMode, zoomLevel);
    exportRackJson(data);
  }, [racks, floorSettings, selectedRack, activeViewMode, rackViewPerspective, isProMode, zoomLevel]);

  // JSONインポート
  const handleImportJson = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importRackJson(file);
      if (data.racks && Object.keys(data.racks).length > 0) {
        // 状態を直接復元（リロード不要）
        restoreState({
          racks: data.racks,
          selectedRack: data.selectedRack,
          floorSettings: data.floorSettings,
          isProMode: data.isProMode,
        });
        if (data.activeViewMode !== undefined) setActiveViewMode(data.activeViewMode);
        if (data.rackViewPerspective) setRackViewPerspective(data.rackViewPerspective as RackViewPerspective);
        if (data.zoomLevel !== undefined) setZoomLevel(data.zoomLevel);
        showInfoModal('インポート完了', 'ラック構成を復元しました。');
      } else {
        showInfoModal('インポートエラー', 'ラックデータが見つかりませんでした。');
      }
    } catch (error) {
      showInfoModal('インポートエラー', error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました。');
    }
    // input をリセットして同じファイルを再選択可能にする
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [showInfoModal, restoreState, setActiveViewMode, setRackViewPerspective, setZoomLevel]);

  // モーダル関連のコールバック（メモ化）
  const handleCloseEquipmentModal = useCallback(() => {
    setShowEquipmentModal(false);
    setSelectedEquipment(null);
  }, []);

  // ラック削除（確認ダイアログ付き）
  const handleRemoveRack = useCallback((rackId: string) => {
    const rack = racks[rackId];
    const equipCount = rack ? Object.values(rack.equipment).filter(e => e.isMainUnit !== false).length : 0;
    const message = equipCount > 0
      ? `「${rack?.name}」を削除しますか？\n設置済みの機器（${equipCount}台）もすべて削除されます。`
      : `「${rack?.name}」を削除しますか？`;
    showConfirmModal(
      'ラックの削除',
      message,
      () => removeRack(rackId),
      '削除する',
      'キャンセル'
    );
  }, [racks, showConfirmModal, removeRack]);

  // モバイル: ユニットタップ処理
  const handleMobileUnitTap = useCallback((unit: number, rackId: string) => {
    // ピッカー閉じた直後のタップを無視（イベント伝播防止）
    if (Date.now() - pickerClosedAt.current < 300) return;
    const rack = racks[rackId];
    if (!rack) return;
    const equipment = rack.equipment[unit];
    if (equipment && equipment.isMainUnit !== false) {
      // 設置済み → 詳細モーダルを開く
      handleEquipmentClick(equipment);
    } else if (!equipment) {
      // 空ユニット → 機器ピッカーを開く
      setTappedUnit(unit);
      setTappedRackId(rackId);
      setShowEquipmentPicker(true);
    }
  }, [racks, handleEquipmentClick]);

  // モバイル: ピッカーから機器を選択して設置
  const handleMobileEquipmentSelect = useCallback(async (equipment: Equipment) => {
    if (!tappedRackId || !tappedUnit) return;
    const result = await addEquipment(tappedRackId, tappedUnit, equipment);
    if (result && !result.success) {
      const errorMsg = result.validation?.errors?.[0]?.message || 'この位置に機器を設置できません。';
      showInfoModal('設置エラー', errorMsg);
    } else {
      setShowEquipmentPicker(false);
      pickerClosedAt.current = Date.now();
    }
  }, [tappedRackId, tappedUnit, addEquipment, showInfoModal]);

  // モバイル: 長押しコンテキストメニュー
  const handleMobileLongPress = useCallback((equipment: Equipment, unit: number, rackId: string) => {
    setContextMenuEquipment(equipment);
    setContextMenuUnit(unit);
    setContextMenuRackId(rackId);
    setShowContextMenu(true);
  }, []);

  const handleContextMenuEdit = useCallback(() => {
    if (contextMenuEquipment) {
      handleEquipmentClick(contextMenuEquipment);
    }
  }, [contextMenuEquipment, handleEquipmentClick]);

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenuRackId && contextMenuUnit) {
      handleEquipmentRemove(contextMenuUnit, contextMenuRackId);
    }
  }, [contextMenuRackId, contextMenuUnit, handleEquipmentRemove]);

  const handleContextMenuPowerToggle = useCallback(() => {
    if (contextMenuEquipment && contextMenuRackId) {
      toggleEquipmentPower(contextMenuRackId, contextMenuEquipment.id);
    }
  }, [contextMenuEquipment, contextMenuRackId, toggleEquipmentPower]);

  const handleContextMenuRename = useCallback(() => {
    // 名前変更は詳細モーダル経由で行う（インライン編集はデスクトップ向き）
    if (contextMenuEquipment) {
      handleEquipmentClick(contextMenuEquipment);
    }
  }, [contextMenuEquipment, handleEquipmentClick]);

  // モバイル: 共有URL生成
  const handleMobileShare = useCallback(async () => {
    const shareableData = createShareableData(racks, floorSettings, selectedRack, activeViewMode, rackViewPerspective, isProMode, zoomLevel);
    const result = generateShareUrl(shareableData);
    if (result.success && result.url) {
      await navigator.clipboard.writeText(result.url);
      showInfoModal('共有URLを生成しました', 'URLがクリップボードにコピーされました。');
    } else {
      showInfoModal('共有エラー', result.error || '不明なエラーが発生しました');
    }
  }, [racks, floorSettings, selectedRack, activeViewMode, rackViewPerspective, isProMode, zoomLevel, showInfoModal]);

  // モバイル: 前面/背面トグル
  const handlePerspectiveToggle = useCallback(() => {
    setRackViewPerspective(prev => prev === 'front' ? 'rear' : 'front');
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
    <div className="min-h-screen dark" data-theme={theme}>
      <div className="min-h-screen bg-gray-800 text-gray-100">
        <div className="fixed top-4 right-4 z-50 hidden md:flex items-center gap-2">
          <button
            onClick={handleNew}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title="新規作成"
          >
            <FilePlus size={20} />
          </button>
          <button
            onClick={() => setLeftSidebarOpen(prev => !prev)}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title={leftSidebarOpen ? '左サイドバーを閉じる' : '左サイドバーを開く'}
          >
            {leftSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <button
            onClick={() => setRightSidebarOpen(prev => !prev)}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title={rightSidebarOpen ? '右サイドバーを閉じる' : '右サイドバーを開く'}
          >
            {rightSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJson}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title="JSONインポート"
          >
            <Upload size={20} />
          </button>
          <button
            onClick={handleExportJson}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title="JSONエクスポート"
          >
            <Download size={20} />
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title="マークダウンをコピー"
          >
            <FileText size={20} />
          </button>
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
            onClick={cycleTheme}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title={`テーマ: ${THEME_LABELS[theme]}`}
          >
            <Palette size={20} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
            title={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
        {/* ヘッダー */}
        <header className="border-b p-3 md:p-4 border-custom-gray bg-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-100">otak-racking</h1>
              <p className="text-sm text-gray-300 hidden md:block">
                データセンター・サーバールーム設計支援ツール
                {import.meta.env.VITE_COMMIT_HASH && ` - ${(import.meta.env.VITE_COMMIT_HASH as string).substring(0, 7)}`}
              </p>
            </div>

          </div>
        </header>

      {/* メインコンテンツ */}
      <div
        className={`flex ${isMobile ? 'h-[calc(100vh-52px)]' : 'h-[calc(100vh-80px)]'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOutside}
      >
        {/* 左サイドバー */}
        {!isMobile && leftSidebarOpen && (
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
        )}

        {/* ラック表示エリア */}
        <main className={`flex-1 overflow-auto p-4 custom-scrollbar ${isMobile ? 'pb-20' : ''}`}>
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
                      onPowerToggle={(equipmentId) => toggleEquipmentPower(rack.id, equipmentId)}
                      onUpdateLabel={(equipmentId, field, value) => updateLabel(rack.id, equipmentId, field, value)}
                      onMobileUnitTap={isMobile ? (unit: number) => handleMobileUnitTap(unit, rack.id) : undefined}
                      onMobileLongPress={isMobile ? (equipment: Equipment, unit: number) => handleMobileLongPress(equipment, unit, rack.id) : undefined}
                      isMobile={isMobile}
                      maxWidth={isMobile ? window.innerWidth - 32 : undefined}
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
                    onPowerToggle={(equipmentId) => toggleEquipmentPower(selectedRack, equipmentId)}
                    onUpdateLabel={(equipmentId, field, value) => updateLabel(selectedRack, equipmentId, field, value)}
                    onMobileUnitTap={isMobile ? (unit: number) => handleMobileUnitTap(unit, selectedRack) : undefined}
                    onMobileLongPress={isMobile ? (equipment: Equipment, unit: number) => handleMobileLongPress(equipment, unit, selectedRack) : undefined}
                    isMobile={isMobile}
                    maxWidth={isMobile ? window.innerWidth - 32 : undefined}
                  />
                </div>
              </div>
            )
          )}
        </main>

        {/* 右サイドバー */}
        {!isMobile && rightSidebarOpen && (
          <MemoizedRightSidebar
            racks={racks}
            selectedRack={selectedRack}
            floorSettings={floorSettings}
            isProMode={isProMode}
            onRackSelect={setSelectedRack}
            onAddRack={addRack}
            onRemoveRack={handleRemoveRack}
            onDuplicateRack={duplicateRack}
            onShowRackManager={handleShowRackManager}
            onShowFloorSettings={handleShowFloorSettings}
            onShowCoolingConfig={handleShowCoolingConfig}
            onShowPowerConfig={handleShowPowerConfig}
          />
        )}
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
        onToggleEquipmentHealth={(equipmentId) =>
          toggleEquipmentHealth(selectedRack, equipmentId)
        }
        
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

        {/* モバイルUI */}
        {isMobile && (
          <>
            <MobileBottomNav
              racks={racks}
              selectedRack={selectedRack}
              currentPerspective={rackViewPerspective}
              activeViewMode={activeViewMode}
              zoomLevel={zoomLevel}
              onRackSelect={setSelectedRack}
              onPerspectiveToggle={handlePerspectiveToggle}
              onViewModeChange={handleActiveViewModeChange}
              onZoomChange={setZoomLevel}
              onShowRackManager={handleShowRackManager}
              onShowFloorSettings={handleShowFloorSettings}
              onShowCoolingConfig={handleShowCoolingConfig}
              onShowPowerConfig={handleShowPowerConfig}
              onNew={handleNew}
              onImport={() => fileInputRef.current?.click()}
              onExport={handleExportJson}
              onCopyMarkdown={handleCopyMarkdown}
              onShare={handleMobileShare}
              onFullscreen={toggleFullscreen}
              themeLabel={THEME_LABELS[theme]}
              onCycleTheme={cycleTheme}
            />
            <MobileContextMenu
              isOpen={showContextMenu}
              equipment={contextMenuEquipment}
              unit={contextMenuUnit}
              onClose={() => setShowContextMenu(false)}
              onEdit={handleContextMenuEdit}
              onDelete={handleContextMenuDelete}
              onPowerToggle={handleContextMenuPowerToggle}
              onRename={handleContextMenuRename}
            />
            <MobileEquipmentPicker
              isOpen={showEquipmentPicker}
              targetUnit={tappedUnit}
              onClose={() => { setShowEquipmentPicker(false); pickerClosedAt.current = Date.now(); }}
              onSelect={handleMobileEquipmentSelect}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;