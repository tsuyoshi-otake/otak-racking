import React, { useState } from 'react';
import {
  Server,
  Network,
  Shield,
  HardDrive,
  Zap,
  Activity,
  Wrench,
  Info,
  Power,
  Move
} from 'lucide-react';
import { Equipment } from '../types';
import {
  serverEquipment,
  networkEquipment,
  storageEquipment,
  powerEquipment,
  mountingEquipment,
  otherEquipment
} from '../constants';

interface EquipmentLibraryProps {
  darkMode: boolean;
  onDragStart: (e: React.DragEvent, item: Equipment) => void;
}

export const EquipmentLibrary: React.FC<EquipmentLibraryProps> = ({
  darkMode,
  onDragStart
}) => {
  const [showEquipmentInfo, setShowEquipmentInfo] = useState<string | null>(null);

  const renderEquipmentCard = (item: Equipment) => (
    <div
      key={item.id}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
        darkMode
          ? 'border-gray-600 bg-gray-700 hover:shadow-lg border-l-4 border-l-custom-gray'
          : 'border-gray-200 bg-white border-l-4 border-l-gray-400'
      } ${item.pduType || item.nutType ? 'border-dashed' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getEquipmentIcon(item.type, darkMode)}
          <span className="font-medium text-xs">{item.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
            }}
            className={`p-0.5 rounded transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-custom-gray hover:text-gray-700'
            }`}
            title="詳細情報"
          >
            <Info size={12} />
          </button>
        </div>
        <div className="flex gap-1">
          <span className={`text-xs px-1 py-0.5 rounded ${
            darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
          }`}>
            {item.height > 0 ? `${item.height}U` : '0U'}
          </span>
          {item.dualPower && (
            <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              <Zap size={10} />
            </span>
          )}
          {item.pduType && (
            <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`} title="特殊配電">
              <Power size={8} />
            </span>
          )}
        </div>
      </div>
      
      {showEquipmentInfo === item.id && (
        <div className={`mt-2 p-2 border rounded text-xs ${
          darkMode ? 'bg-gray-600 border-custom-gray' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="font-medium mb-1">{item.description}</div>
          <div className="space-y-1">
            {item.power > 0 && <div><strong>消費電力:</strong> {item.power}W</div>}
            <div><strong>重量:</strong> {item.weight}kg</div>
            {item.depth > 0 && <div><strong>奥行:</strong> {item.depth}mm</div>}
            {item.cfm > 0 && <div><strong>冷却:</strong> {item.cfm}CFM</div>}
            {item.airflow && <div><strong>エアフロー:</strong> {item.airflow}</div>}
            
            {item.specifications && (
              <div className="mt-2">
                <div className="font-medium">主要仕様:</div>
                {Object.entries(item.specifications).map(([key, value]) => (
                  <div key={key}>{key}: {value}</div>
                ))}
              </div>
            )}
            
            {item.mountingNotes && (
              <div className="mt-1 text-gray-600 dark:text-gray-400">
                <strong>設置注意:</strong> {item.mountingNotes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const getEquipmentIcon = (type: string, darkMode: boolean) => {
    const iconClass = darkMode ? 'text-gray-400' : 'text-gray-600';
    const size = 14;

    switch (type) {
      case 'server':
        return <Server size={size} className={iconClass} />;
      case 'network':
        return <Network size={size} className={iconClass} />;
      case 'security':
        return <Shield size={size} className={iconClass} />;
      case 'storage':
        return <HardDrive size={size} className={iconClass} />;
      case 'pdu':
      case 'ups':
        return <Zap size={size} className={iconClass} />;
      case 'power':
        return <Activity size={size} className={iconClass} />;
      case 'mounting':
        return <Wrench size={size} className={iconClass} />;
      case 'rail':
        return <Move size={size} className={iconClass} />;
      default:
        return <Server size={size} className={iconClass} />;
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* サーバー類 */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <Server size={14} />
          サーバー
        </h3>
        <div className="space-y-2">
          {serverEquipment.map(renderEquipmentCard)}
        </div>
      </div>

      {/* ネットワーク・セキュリティ */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <Network size={14} />
          ネットワーク・セキュリティ
        </h3>
        <div className="space-y-2">
          {networkEquipment.map(renderEquipmentCard)}
        </div>
      </div>

      {/* ストレージ */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <HardDrive size={14} />
          ストレージ
        </h3>
        <div className="space-y-2">
          {storageEquipment.map(renderEquipmentCard)}
        </div>
      </div>

      {/* 電源・UPS・電力制御 */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <Zap size={14} />
          電源・UPS・電力制御
        </h3>
        <div className="space-y-2">
          {powerEquipment.map(renderEquipmentCard)}
        </div>
      </div>

      {/* 取り付け部品 */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <Wrench size={14} />
          取り付け部品
        </h3>
        <div className="space-y-2">
          {mountingEquipment.map((item) => (
            <div key={item.id}>
              {renderEquipmentCard(item)}
              {item.nutType && (
                <div className={`mt-1 text-xs px-2 py-1 rounded ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  💡 ドラッグしてユニットにドロップすると8個まとめて設置されます
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* その他 */}
      <div>
        <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <Wrench size={14} />
          その他
        </h3>
        <div className="space-y-2">
          {otherEquipment.map(renderEquipmentCard)}
        </div>
      </div>
    </div>
  );
};