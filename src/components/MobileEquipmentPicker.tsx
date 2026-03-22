import React, { useState } from 'react';
import {
  X,
  Server,
  Network,
  HardDrive,
  Zap,
  Wrench,
  ChevronDown,
  ChevronRight
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

interface MobileEquipmentPickerProps {
  isOpen: boolean;
  targetUnit: number;
  onClose: () => void;
  onSelect: (equipment: Equipment) => void;
}

const categories = [
  { key: 'server', label: 'サーバー', icon: Server, items: serverEquipment },
  { key: 'network', label: 'ネットワーク', icon: Network, items: networkEquipment },
  { key: 'storage', label: 'ストレージ', icon: HardDrive, items: storageEquipment },
  { key: 'power', label: '電源・UPS', icon: Zap, items: powerEquipment },
  { key: 'mounting', label: '取り付け部品', icon: Wrench, items: mountingEquipment },
  { key: 'other', label: 'その他', icon: Wrench, items: otherEquipment },
];

export const MobileEquipmentPicker: React.FC<MobileEquipmentPickerProps> = ({
  isOpen,
  targetUnit,
  onClose,
  onSelect
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string>('server');

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      {/* ボトムシート */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-800 border-t border-custom-gray rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-custom-gray flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-100">機器を選択</h3>
            <p className="text-xs text-gray-400">U{targetUnit} に設置</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* カテゴリ・機器リスト */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {categories.map(({ key, label, icon: Icon, items }) => (
            <div key={key}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === key ? '' : key)}
                className="w-full flex items-center gap-2 p-3 text-sm font-semibold text-gray-200 hover:bg-gray-700 border-b border-gray-700"
              >
                <Icon size={14} className="text-gray-400" />
                {label}
                <span className="text-xs text-gray-500 ml-1">({items.length})</span>
                <span className="ml-auto">
                  {expandedCategory === key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>
              {expandedCategory === key && (
                <div className="p-2 space-y-1">
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSelect(item); }}
                      className="w-full p-3 rounded-lg text-left hover:bg-gray-700 active:bg-gray-600 transition-colors border border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-200">
                          {item.name.replace(/\s*\(\d+U\)$/, '')}
                        </span>
                        <div className="flex gap-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-600 text-gray-300">
                            {item.height > 0 ? `${item.height}U` : '0U'}
                          </span>
                          {item.power > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-600 text-gray-300">
                              {item.power}W
                            </span>
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
