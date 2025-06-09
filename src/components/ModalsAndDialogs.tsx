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
  Building,
  Edit2
} from 'lucide-react';
import { Equipment, Rack, FloorSettings } from '../types';
import { getPowerSources } from '../utils';
import EquipmentSizeSelector from './EquipmentSizeSelector';

// +++ 新しい InfoModal 用の Props (簡易版) +++
export interface InfoModalProps { // export を追加
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

// +++ 新しい ConfirmModal 用の Props (簡易版) +++
export interface ConfirmModalProps extends Omit<InfoModalProps, 'darkMode'> { // export を追加
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}



interface ModalsAndDialogsProps {
  currentRack: Rack | null;
  selectedEquipment: Equipment | null;
  showEquipmentModal: boolean;
  onCloseEquipmentModal: () => void;
  onUpdateLabel: (equipmentId: string, field: string, value: string) => void;
  onUpdatePowerConnection: (equipmentId: string, field: string, value: any) => void;
  onUpdateMountingOption: (equipmentId: string, field: string, value: any) => void;
  onUpdateEquipmentColor: (equipmentId: string, color: string) => void;
  onUpdateEquipmentOpacity: (equipmentId: string, opacity: number) => void;
  onUpdateEquipmentSpecs?: (equipmentId: string, field: 'power' | 'cfm' | 'weight', value: number) => void;
  onUpdateEquipmentSize?: (equipmentId: string, newHeight: number) => Promise<void>;
  
  // 新しいモーダル用props
  racks?: Record<string, Rack>;
  showRackManager?: boolean;
  onCloseRackManager?: () => void;
  onAddRack?: () => void;
  onRemoveRack?: (rackId: string) => void;
  onDuplicateRack?: (rackId: string) => void;
  onUpdateRackName?: (rackId: string, name: string) => void;
  
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
  
  // ラック詳細モーダル用props
  showRackDetailsModal?: boolean;
  onCloseRackDetailsModal?: () => void;
  selectedRackForDetails?: string;
  onUpdateRackDetails?: (rackId: string, updates: Partial<Rack>) => void;
}

export const ModalsAndDialogs: React.FC<ModalsAndDialogsProps> = ({
  currentRack,
  selectedEquipment,
  showEquipmentModal,
  onCloseEquipmentModal,
  onUpdateLabel,
  onUpdatePowerConnection,
  onUpdateMountingOption,
  onUpdateEquipmentColor,
  onUpdateEquipmentOpacity,
  onUpdateEquipmentSpecs,
  onUpdateEquipmentSize,
  
  // 新しいモーダル用props
  racks,
  showRackManager,
  onCloseRackManager,
  onAddRack,
  onRemoveRack,
  onDuplicateRack,
  onUpdateRackName,
  
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
  confirmModal,
  
  // ラック詳細モーダル用props
  showRackDetailsModal,
  onCloseRackDetailsModal,
  selectedRackForDetails,
  onUpdateRackDetails
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'power' | 'mounting' | 'label'>('info');
  const [tempFloorSettings, setTempFloorSettings] = useState<FloorSettings | null>(null);
  const [editingRackId, setEditingRackId] = useState<string | null>(null);
  const [editingRackName, setEditingRackName] = useState<string>('');
  
  // ラック詳細モーダル用の一時的な状態
  const [tempRackDetails, setTempRackDetails] = useState<Partial<Rack> | null>(null);

  // 機器設定モーダル
  const renderEquipmentModal = () => {
    if (!showEquipmentModal || !selectedEquipment || !currentRack) {
      return null;
    }

    const powerSources = getPowerSources(currentRack);
    const labels = currentRack.labels?.[selectedEquipment.id] || {};
    const powerConnection = currentRack.powerConnections?.[selectedEquipment.id] || {};
    const mountingOption = currentRack.mountingOptions?.[selectedEquipment.id] || {};

    const modalBg = 'bg-gray-800 text-white';
    const inputBg = 'bg-gray-700 border-gray-600 text-white';
    const tabActiveClass = 'bg-gray-600 text-white';
    const tabInactiveClass = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
        {/* ヘッダー */}
        <div className="p-4 border-b flex items-center justify-between border-custom-gray">
          <h3 className="text-lg font-bold">{selectedEquipment.name}</h3>
          <button
            onClick={onCloseEquipmentModal}
            className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray"
          >
            <X size={20} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-custom-gray">
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
                  <div><strong>エアフロー:</strong> {selectedEquipment.airflow}</div>
                </div>
              </div>

              <EquipmentSizeSelector
                equipment={selectedEquipment}
                onSizeChange={async (newHeight: number) => {
                  try {
                    await onUpdateEquipmentSize?.(selectedEquipment.id, newHeight);
                  } catch (error) {
                    console.error('機器サイズ変更に失敗しました:', error);
                  }
                }}
              />
              {/* 編集可能な仕様 */}
              <div>
                <h4 className="font-medium mb-2">編集可能な仕様</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">消費電力 (W)</label>
                    <input
                      type="number"
                      value={selectedEquipment.power}
                      onChange={(e) => onUpdateEquipmentSpecs?.(selectedEquipment.id, 'power', parseFloat(e.target.value) || 0)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">冷却風量 (CFM)</label>
                    <input
                      type="number"
                      value={selectedEquipment.cfm}
                      onChange={(e) => onUpdateEquipmentSpecs?.(selectedEquipment.id, 'cfm', parseFloat(e.target.value) || 0)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">重量 (kg)</label>
                    <input
                      type="number"
                      value={selectedEquipment.weight}
                      onChange={(e) => onUpdateEquipmentSpecs?.(selectedEquipment.id, 'weight', parseFloat(e.target.value) || 0)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* 計算値 */}
              <div>
                <h4 className="font-medium mb-2">計算値</h4>
                <div className="text-sm space-y-1">
                  <div><strong>発熱量:</strong> {selectedEquipment.heat}BTU/h</div>
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
                    <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded">
                      冗長電源
                    </span>
                  )}
                </h4>
                
                <div className="space-y-3">
                  {/* プライマリ電源 */}
                  <div className="space-y-2 p-2 border rounded border-gray-600">
                    <label className="block text-sm font-medium">プライマリ電源</label>
                    <select
                      value={powerConnection.primaryPduId || ''}
                      onChange={(e) => onUpdatePowerConnection(selectedEquipment.id, 'primaryPduId', e.target.value)}
                      className={`w-full p-2 border rounded text-sm ${inputBg}`}
                    >
                      <option value="">PDU未接続</option>
                      {powerSources.pdus.map(pdu => (
                        <option key={pdu.id} value={pdu.id}>
                          {pdu.name}
                        </option>
                      ))}
                    </select>
                    {powerConnection.primaryPduId && (
                      <select
                        value={powerConnection.primaryPduOutlet || ''}
                        onChange={(e) => onUpdatePowerConnection(selectedEquipment.id, 'primaryPduOutlet', parseInt(e.target.value))}
                        className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      >
                        <option value="">コンセント選択</option>
                        {powerSources.pdus.find(p => p.id === powerConnection.primaryPduId)?.powerOutlets?.map(outlet => (
                          <option key={outlet.id} value={outlet.id} disabled={outlet.inUse && outlet.connectedEquipmentId !== selectedEquipment.id}>
                            コンセント #{outlet.id} ({outlet.type}) {outlet.inUse ? `(使用中: ${outlet.connectedEquipmentId === selectedEquipment.id ? 'この機器' : '他機器'})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* セカンダリ電源（冗長電源機器のみ） */}
                  {selectedEquipment.dualPower && (
                    <div className="space-y-2 p-2 border rounded border-gray-600">
                      <label className="block text-sm font-medium">セカンダリ電源</label>
                      <select
                        value={powerConnection.secondaryPduId || ''}
                        onChange={(e) => onUpdatePowerConnection(selectedEquipment.id, 'secondaryPduId', e.target.value)}
                        className={`w-full p-2 border rounded text-sm ${inputBg}`}
                      >
                        <option value="">PDU未接続</option>
                        {powerSources.pdus.map(pdu => (
                          <option key={pdu.id} value={pdu.id}>
                            {pdu.name}
                          </option>
                        ))}
                      </select>
                      {powerConnection.secondaryPduId && (
                        <select
                          value={powerConnection.secondaryPduOutlet || ''}
                          onChange={(e) => onUpdatePowerConnection(selectedEquipment.id, 'secondaryPduOutlet', parseInt(e.target.value))}
                          className={`w-full p-2 border rounded text-sm ${inputBg}`}
                        >
                          <option value="">コンセント選択</option>
                          {powerSources.pdus.find(p => p.id === powerConnection.secondaryPduId)?.powerOutlets?.map(outlet => (
                            <option key={outlet.id} value={outlet.id} disabled={outlet.inUse && outlet.connectedEquipmentId !== selectedEquipment.id}>
                              コンセント #{outlet.id} ({outlet.type}) {outlet.inUse ? `(使用中: ${outlet.connectedEquipmentId === selectedEquipment.id ? 'この機器' : '他機器'})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* 電源状態表示 */}
                  <div className="p-2 rounded bg-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      {(() => {
                        const hasPrimaryConnection = powerConnection.primaryPduId && powerConnection.primaryPduOutlet;
                        const hasSecondaryConnection = powerConnection.secondaryPduId && powerConnection.secondaryPduOutlet;
                        
                        if (selectedEquipment.dualPower) {
                          // 冗長電源機器の場合：両方の電源接続が必要
                          if (hasPrimaryConnection && hasSecondaryConnection) {
                            return (
                              <>
                                <CheckCircle size={14} className="text-green-400" />
                                <span className="text-gray-200">電源設定完了（冗長構成）</span>
                              </>
                            );
                          } else if (hasPrimaryConnection || hasSecondaryConnection) {
                            return (
                              <>
                                <AlertTriangle size={14} className="text-yellow-400" />
                                <span className="text-gray-300">冗長電源が未設定です</span>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <AlertTriangle size={14} className="text-yellow-400" />
                                <span className="text-gray-300">電源設定が不完全です</span>
                              </>
                            );
                          }
                        } else {
                          // 単一電源機器の場合：プライマリ電源のみ必要
                          if (hasPrimaryConnection) {
                            return (
                              <>
                                <CheckCircle size={14} className="text-green-400" />
                                <span className="text-gray-200">電源設定完了</span>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <AlertTriangle size={14} className="text-yellow-400" />
                                <span className="text-gray-300">電源設定が不完全です</span>
                              </>
                            );
                          }
                        }
                      })()}
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
                    <label className="block text-sm font-medium mb-1">背景色と透過度</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedEquipment.color}
                        onChange={(e) => onUpdateEquipmentColor(selectedEquipment.id, e.target.value)}
                        className="w-8 h-8 p-0 border-none rounded bg-transparent"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedEquipment.opacity ?? 100}
                        onChange={(e) => onUpdateEquipmentOpacity(selectedEquipment.id, parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs w-10 text-center">{selectedEquipment.opacity ?? 100}%</span>
                    </div>
                  </div>
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

    const modalBg = 'bg-gray-800 text-white';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings size={20} />
              ラック管理
            </h3>
            <button
              onClick={onCloseRackManager}
              className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray"
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
                  className="p-2 rounded flex items-center gap-1 text-sm bg-gray-600 hover:bg-custom-gray text-white"
                >
                  <Plus size={14} />
                  追加
                </button>
              </div>

              <div className="space-y-2">
                {Object.values(racks).map((rack) => (
                  <div key={rack.id} className="p-3 border rounded flex items-center justify-between border-custom-gray bg-gray-700">
                    <div className="flex-1">
                      {editingRackId === rack.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingRackName}
                            onChange={(e) => setEditingRackName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onUpdateRackName?.(rack.id, editingRackName);
                                setEditingRackId(null);
                              } else if (e.key === 'Escape') {
                                setEditingRackId(null);
                              }
                            }}
                            onBlur={() => {
                              onUpdateRackName?.(rack.id, editingRackName);
                              setEditingRackId(null);
                            }}
                            className="px-2 py-1 text-sm bg-gray-600 border border-gray-500 rounded text-white"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {rack.name}
                            <button
                              onClick={() => {
                                setEditingRackId(rack.id);
                                setEditingRackName(rack.name);
                              }}
                              className="p-1 rounded hover:bg-gray-600"
                              title="名前を編集"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                          <div className="text-sm text-custom-gray">
                            {rack.units}U - {Object.keys(rack.equipment).length}台の機器
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onDuplicateRack?.(rack.id)}
                        className="p-1 rounded hover:bg-gray-600"
                        title="複製"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => onRemoveRack?.(rack.id)}
                        className="p-1 rounded hover:bg-gray-600"
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

    const modalBg = 'bg-gray-800 text-white';
    const inputBg = 'bg-gray-700 border-gray-600 text-white';
    
    const settings = tempFloorSettings || floorSettings;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building size={20} />
              フリーアクセスフロア設定
            </h3>
            <button
              onClick={onCloseFloorSettings}
              className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray"
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
                className="flex-1 p-2 rounded text-sm font-medium bg-gray-600 hover:bg-custom-gray text-white"
              >
                保存
              </button>
              <button
                onClick={onCloseFloorSettings}
                className="flex-1 p-2 rounded text-sm bg-gray-600 hover:bg-gray-700 text-white"
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

    const modalBg = 'bg-gray-800 text-white';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Snowflake size={20} />
              冷却・空调設定
            </h3>
            <button
              onClick={onCloseCoolingConfig}
              className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="text-center text-custom-gray">
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

    const modalBg = 'bg-gray-800 text-white';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap size={20} />
              電源・UPS設定
            </h3>
            <button
              onClick={onClosePowerConfig}
              className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="text-center text-custom-gray">
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
    const modalBg = 'bg-gray-800 text-white';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${modalBg} rounded-lg shadow-xl w-full max-w-md`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info size={20} className="text-gray-300" />
              {infoModal.title}
            </h3>
            <button onClick={infoModal.onClose} className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 text-sm">
            {infoModal.message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="p-4 border-t flex justify-end border-custom-gray">
            <button
              onClick={infoModal.onClose}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-600 hover:bg-custom-gray text-white"
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
    const modalBg = 'bg-gray-800 text-white';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${modalBg} rounded-lg shadow-xl w-full max-w-md`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-400" />
              {confirmModal.title}
            </h3>
             {/* <button onClick={confirmModal.onClose} className={`p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray`}>
              <X size={20} />
            </button> */}
          </div>
          <div className="p-6 text-sm">
            {confirmModal.message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <div className="p-4 border-t flex justify-end gap-3 border-custom-gray">
            <button
              onClick={confirmModal.onClose}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-gray-300"
            >
              {confirmModal.cancelText || 'キャンセル'}
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm();
                confirmModal.onClose(); // 確認後も閉じる
              }}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-600 hover:bg-custom-gray text-white"
            >
              {confirmModal.confirmText || 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ラック詳細モーダル
  const renderRackDetailsModal = () => {
    if (!showRackDetailsModal || !selectedRackForDetails || !racks) return null;
    
    const currentRack = racks[selectedRackForDetails];
    if (!currentRack) return null;
    
    const modalBg = 'bg-gray-800 text-white';
    const inputBg = 'bg-gray-700 border-gray-600 text-white';
    
    const details = tempRackDetails || {
      name: currentRack.name,
      type: currentRack.type,
      units: currentRack.units,
      width: currentRack.width,
      depth: currentRack.depth,
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${modalBg} rounded-lg shadow-xl w-96 max-w-full max-h-[90vh] overflow-hidden`}>
          <div className="p-4 border-b flex items-center justify-between border-custom-gray">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings size={20} />
              ラック詳細設定
            </h3>
            <button
              onClick={() => {
                setTempRackDetails(null);
                onCloseRackDetailsModal?.();
              }}
              className="p-1 rounded hover:bg-opacity-10 hover:bg-custom-gray"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ラック名</label>
              <input
                type="text"
                value={details.name || ''}
                onChange={(e) => setTempRackDetails({
                  ...details,
                  name: e.target.value
                })}
                className={`w-full p-2 border rounded ${inputBg}`}
                placeholder="ラック名を入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ラックタイプ</label>
              <select
                value={details.type || '42U'}
                onChange={(e) => {
                  const type = e.target.value;
                  const units = parseInt(type);
                  setTempRackDetails({
                    ...details,
                    type,
                    units
                  });
                }}
                className={`w-full p-2 border rounded ${inputBg}`}
              >
                <option value="42U">42U (標準)</option>
                <option value="47U">47U (高密度)</option>
                <option value="36U">36U (コンパクト)</option>
                <option value="24U">24U (小型)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">幅 (mm)</label>
              <select
                value={details.width || 600}
                onChange={(e) => setTempRackDetails({
                  ...details,
                  width: parseInt(e.target.value)
                })}
                className={`w-full p-2 border rounded ${inputBg}`}
              >
                <option value={600}>600mm (標準)</option>
                <option value={700}>700mm (ケーブル余裕)</option>
                <option value={800}>800mm (高密度配線)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">奥行き (mm)</label>
              <select
                value={details.depth || 1000}
                onChange={(e) => setTempRackDetails({
                  ...details,
                  depth: parseInt(e.target.value)
                })}
                className={`w-full p-2 border rounded ${inputBg}`}
              >
                <option value={800}>800mm (浅型)</option>
                <option value={1000}>1000mm (標準)</option>
                <option value={1200}>1200mm (深型)</option>
                <option value={1400}>1400mm (超深型)</option>
              </select>
            </div>
            
            <div className="p-3 bg-gray-700 rounded">
              <h4 className="font-medium mb-2">現在の設定</h4>
              <div className="text-sm space-y-1 text-gray-300">
                <div>機器数: {Object.keys(currentRack.equipment).length}台</div>
                <div>使用済みU数: {Object.values(currentRack.equipment).reduce((sum, eq) => sum + eq.height, 0)}U</div>
                <div>空きU数: {currentRack.units - Object.values(currentRack.equipment).reduce((sum, eq) => sum + eq.height, 0)}U</div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  if (tempRackDetails) {
                    onUpdateRackDetails?.(selectedRackForDetails, tempRackDetails);
                  }
                  setTempRackDetails(null);
                  onCloseRackDetailsModal?.();
                }}
                className="flex-1 p-2 rounded text-sm font-medium bg-gray-600 hover:bg-custom-gray text-white"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setTempRackDetails(null);
                  onCloseRackDetailsModal?.();
                }}
                className="flex-1 p-2 rounded text-sm bg-gray-600 hover:bg-gray-700 text-white"
              >
                キャンセル
              </button>
            </div>
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
      {renderRackDetailsModal()}
    </>
  );
};