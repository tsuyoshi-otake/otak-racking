import React, { useState } from 'react';
import {
  X,
  Settings,
  Zap,
  Tag,
  Wrench,
  Info,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Copy,
  Snowflake,
  Building
} from 'lucide-react';
import { Equipment, Rack, FloorSettings } from '../types';
import { getPowerSources } from '../utils';

// +++ 新しい InfoModal 用の Props (簡易版) +++
export interface InfoModalProps { // export を追加
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  darkMode: boolean;
}

// +++ 新しい ConfirmModal 用の Props (簡易版) +++
export interface ConfirmModalProps extends InfoModalProps { // export を追加
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}



interface ModalsAndDialogsProps {
  darkMode: boolean;
  currentRack: Rack | null;
  selectedEquipment: Equipment | null;
  showEquipmentModal: boolean;
  onCloseEquipmentModal: () => void;
  onUpdateLabel: (equipmentId: string, field: string, value: string) => void;
  onUpdatePowerConnection: (equipmentId: string, field: string, value: any) => void;
  onUpdateMountingOption: (equipmentId: string, field: string, value: any) => void;
  
  // 新しいモーダル用props
  racks?: Record<string, Rack>;
  showRackManager?: boolean;
  onCloseRackManager?: () => void;
  onAddRack?: () => void;
  onRemoveRack?: (rackId: string) => void;
  onDuplicateRack?: (rackId: string) => void;
  
  floorSettings?: FloorSettings;
  showFloorSettings?: boolean;
  onCloseFloorSettings?: () => void;
  onUpdateFloorSettings?: (settings: FloorSettings) => void;
  
  showCoolingConfig?: boolean;
  onCloseCoolingConfig?: () => void;
  
  showPowerConfig?: boolean;
  onClosePowerConfig?: () => void;

  // +++ InfoModal と ConfirmModal 用の Props を ModalsAndDialogsProps に追加 +++
  infoModal?: InfoModalProps | null;
  confirmModal?: ConfirmModalProps | null;
}

export const ModalsAndDialogs: React.FC<ModalsAndDialogsProps> = ({
  darkMode,
  currentRack,
  selectedEquipment,
  showEquipmentModal,
  onCloseEquipmentModal,
  onUpdateLabel,
  onUpdatePowerConnection,
  onUpdateMountingOption,
  
  // 新しいモーダル用props
  racks,
  showRackManager,
  onCloseRackManager,
  onAddRack,
  onRemoveRack,
  onDuplicateRack,
  
  floorSettings,
  showFloorSettings,
  onCloseFloorSettings,
  onUpdateFloorSettings,
  
  showCoolingConfig,
  onCloseCoolingConfig,
  
  showPowerConfig,
  onClosePowerConfig,

  // +++ props を展開 +++
  infoModal,
  confirmModal
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'power' | 'mounting' | 'label'>('info');
  const [tempFloorSettings, setTempFloorSettings] = useState<FloorSettings | null>(null);

  // 機器設定モーダル
  const renderEquipmentModal = () => {
    if (!showEquipmentModal || !selectedEquipment || !currentRack) {
      return null;
    }

    const powerSources = getPowerSources(currentRack);
    const labels = currentRack.labels?.[selectedEquipment.id] || {};
    const powerConnection = currentRack.powerConnections?.[selectedEquipment.id] || {};
    const mountingOption = currentRack.mountingOptions?.[selectedEquipment.id] || {};

    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const tabActiveClass = darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
    const tabInactiveClass = darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
        {/* ヘッダー */}
        <div className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <h3 className="text-lg font-bold">{selectedEquipment.name}</h3>
          <button
            onClick={onCloseEquipmentModal}
            className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}
          >
            <X size={20} />
          </button>
        </div>

        {/* タブ */}
        <div className={`flex border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 ${
              activeTab === 'info' ? tabActiveClass : tabInactiveClass
            }`}
          >
            <Info size={14} />
            基本情報
          </button>
          <button
            onClick={() => setActiveTab('power')}
            className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 ${
              activeTab === 'power' ? tabActiveClass : tabInactiveClass
            }`}
          >
            <Zap size={14} />
            電源
          </button>
          <button
            onClick={() => setActiveTab('mounting')}
            className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 ${
              activeTab === 'mounting' ? tabActiveClass : tabInactiveClass
            }`}
          >
            <Wrench size={14} />
            取付
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`flex-1 p-2 text-xs flex items-center justify-center gap-1 ${
              activeTab === 'label' ? tabActiveClass : tabInactiveClass
            }`}
          >
            <Tag size={14} />
            ラベル
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
          {activeTab === 'info' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">機器仕様</h4>
                <div className="text-sm space-y-1">
                  <div><strong>高さ:</strong> {selectedEquipment.height}U</div>
                  <div><strong>奥行:</strong> {selectedEquipment.depth}mm</div>
                  <div><strong>消費電力:</strong> {selectedEquipment.power}W</div>
                  <div><strong>発熱量:</strong> {selectedEquipment.heat}BTU/h</div>
                  <div><strong>重量:</strong> {selectedEquipment.weight}kg</div>
                  <div><strong>エアフロー:</strong> {selectedEquipment.airflow}</div>
                  {selectedEquipment.cfm > 0 && (
                    <div><strong>冷却風量:</strong> {selectedEquipment.cfm}CFM</div>
                  )}
                </div>
              </div>
              
              {selectedEquipment.description && (
                <div>
                  <h4 className="font-medium mb-2">説明</h4>
                  <p className="text-sm">{selectedEquipment.description}</p>
                </div>
              )}
              
              {selectedEquipment.specifications && (
                <div>
                  <h4 className="font-medium mb-2">詳細仕様</h4>
                  <div className="text-sm space-y-1">
                    {Object.entries(selectedEquipment.specifications).map(([key, value]) => (
                      <div key={key}><strong>{key}:</strong> {value}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedEquipment.mountingNotes && (
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle size={14} />
                    <span className="font-medium">設置注意</span>
                  </div>
                  <p className="text-sm mt-1 text-orange-700 dark:text-orange-300">
                    {selectedEquipment.mountingNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'power' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  電源接続設定
                  {selectedEquipment.dualPower && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                      冗長電源
                    </span>
                  )}
                </h4>
                
                <div className="space-y-3">
                  {/* プライマリ電源 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">プライマリ電源</label>
                    <select
                      value={powerConnection.primarySource || ''}
                      onChange={(e) => onUpdatePowerConnection(selectedEquipment.id, 'primarySource', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                    >
                      <option value="">未接続</option>
                      {powerSources.all.map(source => (
                        <option key={source.id} value={source.id}>
                          {source.name} ({source.system || 'A系統'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* セカンダリ電源（冗長電源機器のみ） */}
                  {selectedEquipment.dualPower && (
                    <div>
                      <label className="block text-sm font-medium mb-1">セカンダリ電源</label>
                      <select
                        value={powerConnection.secondarySource || ''}
                        onChange={(e) => onUpdatePowerConnection(selectedEquipment.id, 'secondarySource', e.target.value)}
                        className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      >
                        <option value="">未接続</option>
                        {powerSources.all.map(source => (
                          <option key={source.id} value={source.id}>
                            {source.name} ({source.system || 'B系統'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 電源状態表示 */}
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      {powerConnection.primarySource && (selectedEquipment.dualPower ? powerConnection.secondarySource : true) ? (
                        <>
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-green-600 dark:text-green-400">電源設定完了</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} className="text-orange-500" />
                          <span className="text-orange-600 dark:text-orange-400">電源設定が不完全です</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mounting' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">取り付け設定</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">取り付け方法</label>
                    <select
                      value={mountingOption.type || 'none'}
                      onChange={(e) => onUpdateMountingOption(selectedEquipment.id, 'type', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                    >
                      <option value="none">未設定</option>
                      <option value="direct">直接取り付け</option>
                      <option value="slide-rail">スライドレール</option>
                      <option value="fixed-rail">固定レール</option>
                      <option value="toolless-rail">ツールレスレール</option>
                      <option value="shelf">棚板設置</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mountingOption.hasShelf || false}
                        onChange={(e) => onUpdateMountingOption(selectedEquipment.id, 'hasShelf', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">棚板使用</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mountingOption.hasCableArm || false}
                        onChange={(e) => onUpdateMountingOption(selectedEquipment.id, 'hasCableArm', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">ケーブルアーム</span>
                    </label>
                  </div>

                  {selectedEquipment.needsRails && (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <Info size={14} />
                        <span className="text-sm">この機器にはレールが必要です</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'label' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">ラベル情報</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">カスタム名</label>
                    <input
                      type="text"
                      value={labels.customName || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'customName', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      placeholder="表示名をカスタマイズ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">IPアドレス</label>
                    <input
                      type="text"
                      value={labels.ipAddress || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'ipAddress', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      placeholder="例: 192.168.1.100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">シリアル番号</label>
                    <input
                      type="text"
                      value={labels.serialNumber || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'serialNumber', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      placeholder="機器のシリアル番号"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">所有者・担当者</label>
                    <input
                      type="text"
                      value={labels.owner || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'owner', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      placeholder="部署名・担当者名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">用途・目的</label>
                    <input
                      type="text"
                      value={labels.purpose || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'purpose', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      placeholder="Webサーバー、DBサーバー等"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">設置日</label>
                    <input
                      type="date"
                      value={labels.installDate || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'installDate', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">備考</label>
                    <textarea
                      value={labels.notes || ''}
                      onChange={(e) => onUpdateLabel(selectedEquipment.id, 'notes', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      rows={3}
                      placeholder="保守情報・注意事項等"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  // ラック管理モーダル
  const renderRackManagerModal = () => {
    if (!showRackManager || !racks) return null;

    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings size={20} />
              ラック管理
            </h3>
            <button
              onClick={onCloseRackManager}
              className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">登録ラック一覧</h4>
                <button
                  onClick={onAddRack}
                  className={`p-2 rounded flex items-center gap-1 text-sm ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  <Plus size={14} />
                  追加
                </button>
              </div>

              <div className="space-y-2">
                {Object.values(racks).map((rack) => (
                  <div key={rack.id} className={`p-3 border rounded flex items-center justify-between ${
                    darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div>
                      <div className="font-medium">{rack.name}</div>
                      <div className="text-sm text-gray-500">
                        {rack.units}U - {Object.keys(rack.equipment).length}台の機器
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onDuplicateRack?.(rack.id)}
                        className={`p-1 rounded ${
                          darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="複製"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => onRemoveRack?.(rack.id)}
                        className={`p-1 rounded ${
                          darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="削除"
                        disabled={Object.keys(racks).length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // フロア設定モーダル
  const renderFloorSettingsModal = () => {
    if (!showFloorSettings || !floorSettings) return null;

    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    
    const settings = tempFloorSettings || floorSettings;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building size={20} />
              フリーアクセスフロア設定
            </h3>
            <button
              onClick={onCloseFloorSettings}
              className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.hasAccessFloor}
                  onChange={(e) => setTempFloorSettings({
                    ...settings,
                    hasAccessFloor: e.target.checked
                  })}
                />
                <span>フリーアクセスフロアを使用</span>
              </label>
            </div>

            {settings.hasAccessFloor && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">フロア高さ (mm)</label>
                  <input
                    type="number"
                    value={settings.floorHeight}
                    onChange={(e) => setTempFloorSettings({
                      ...settings,
                      floorHeight: parseInt(e.target.value) || 600
                    })}
                    className={`w-full p-2 border rounded ${inputBg}`}
                    min="100"
                    max="1000"
                    step="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">タイルサイズ (mm)</label>
                  <select
                    value={settings.tileSize}
                    onChange={(e) => setTempFloorSettings({
                      ...settings,
                      tileSize: parseInt(e.target.value)
                    })}
                    className={`w-full p-2 border rounded ${inputBg}`}
                  >
                    <option value={500}>500×500mm</option>
                    <option value={600}>600×600mm</option>
                    <option value={610}>610×610mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">支持脚タイプ</label>
                  <select
                    value={settings.supportType}
                    onChange={(e) => setTempFloorSettings({
                      ...settings,
                      supportType: e.target.value as 'fixed' | 'adjustable'
                    })}
                    className={`w-full p-2 border rounded ${inputBg}`}
                  >
                    <option value="adjustable">調整式</option>
                    <option value="fixed">固定式</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">荷重仕様</label>
                  <select
                    value={settings.loadCapacity}
                    onChange={(e) => setTempFloorSettings({
                      ...settings,
                      loadCapacity: e.target.value as 'light' | 'medium' | 'heavy'
                    })}
                    className={`w-full p-2 border rounded ${inputBg}`}
                  >
                    <option value="light">軽荷重 (~500kg/m²)</option>
                    <option value="medium">中荷重 (~1000kg/m²)</option>
                    <option value="heavy">重荷重 (~1500kg/m²)</option>
                  </select>
                </div>

                <div>
                  <h4 className="font-medium mb-2">ケーブル配線方式</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm mb-1">電源ケーブル</label>
                      <select
                        value={settings.cableRouting.power}
                        onChange={(e) => setTempFloorSettings({
                          ...settings,
                          cableRouting: {
                            ...settings.cableRouting,
                            power: e.target.value as 'underfloor' | 'overhead' | 'side'
                          }
                        })}
                        className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      >
                        <option value="underfloor">床下配線</option>
                        <option value="overhead">天井配線</option>
                        <option value="side">サイド配線</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">データケーブル</label>
                      <select
                        value={settings.cableRouting.data}
                        onChange={(e) => setTempFloorSettings({
                          ...settings,
                          cableRouting: {
                            ...settings.cableRouting,
                            data: e.target.value as 'underfloor' | 'overhead' | 'side'
                          }
                        })}
                        className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      >
                        <option value="underfloor">床下配線</option>
                        <option value="overhead">天井配線</option>
                        <option value="side">サイド配線</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">光ファイバー</label>
                      <select
                        value={settings.cableRouting.fiber}
                        onChange={(e) => setTempFloorSettings({
                          ...settings,
                          cableRouting: {
                            ...settings.cableRouting,
                            fiber: e.target.value as 'underfloor' | 'overhead' | 'side'
                          }
                        })}
                        className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      >
                        <option value="underfloor">床下配線</option>
                        <option value="overhead">天井配線</option>
                        <option value="side">サイド配線</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  if (tempFloorSettings) {
                    onUpdateFloorSettings?.(tempFloorSettings);
                  }
                  onCloseFloorSettings?.();
                }}
                className={`flex-1 p-2 rounded text-sm font-medium ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                保存
              </button>
              <button
                onClick={onCloseFloorSettings}
                className={`flex-1 p-2 rounded text-sm ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'
                } text-white`}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 冷却設定モーダル
  const renderCoolingConfigModal = () => {
    if (!showCoolingConfig) return null;

    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Snowflake size={20} />
              冷却・空调設定
            </h3>
            <button
              onClick={onCloseCoolingConfig}
              className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="text-center text-gray-500">
              <Snowflake size={48} className="mx-auto mb-4 opacity-50" />
              <p>冷却・空调設定機能は開発中です</p>
              <p className="text-sm mt-2">温度管理、エアフロー最適化、<br />冷却効率計算機能を実装予定</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 電源設定モーダル
  const renderPowerConfigModal = () => {
    if (!showPowerConfig) return null;

    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap size={20} />
              電源・UPS設定
            </h3>
            <button
              onClick={onClosePowerConfig}
              className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="text-center text-gray-500">
              <Zap size={48} className="mx-auto mb-4 opacity-50" />
              <p>電源・UPS設定機能は開発中です</p>
              <p className="text-sm mt-2">電源容量計算、UPS設定、<br />冗長電源管理機能を実装予定</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // +++ InfoModal レンダリング関数 +++
  const renderInfoModal = () => {
    if (!infoModal || !infoModal.isOpen) return null;
    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${modalBg} rounded-lg shadow-xl w-full max-w-md`}>
          <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info size={20} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
              {infoModal.title}
            </h3>
            <button onClick={infoModal.onClose} className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}>
              <X size={20} />
            </button>
          </div>
          <div className="p-6 text-sm">
            {infoModal.message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className={`p-4 border-t flex justify-end ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <button
              onClick={infoModal.onClose}
              className={`px-4 py-2 rounded text-sm font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  // +++ ConfirmModal レンダリング関数 +++
  const renderConfirmModal = () => {
    if (!confirmModal || !confirmModal.isOpen) return null;
    const modalBg = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${modalBg} rounded-lg shadow-xl w-full max-w-md`}>
          <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={20} className={darkMode ? 'text-yellow-400' : 'text-yellow-500'} />
              {confirmModal.title}
            </h3>
             {/* <button onClick={confirmModal.onClose} className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500`}>
              <X size={20} />
            </button> */}
          </div>
          <div className="p-6 text-sm">
            {confirmModal.message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className={`p-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <button
              onClick={confirmModal.onClose}
              className={`px-4 py-2 rounded text-sm font-medium ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              {confirmModal.cancelText || 'キャンセル'}
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm();
                confirmModal.onClose(); // 確認後も閉じる
              }}
              className={`px-4 py-2 rounded text-sm font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              {confirmModal.confirmText || 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // すべてのモーダルをレンダリング
  return (
    <>
      {renderEquipmentModal()}
      {renderRackManagerModal()}
      {renderFloorSettingsModal()}
      {renderCoolingConfigModal()}
      {renderPowerConfigModal()}
      {renderInfoModal()}
      {renderConfirmModal()}
    </>
  );
};