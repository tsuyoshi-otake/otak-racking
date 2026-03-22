import React from 'react';
import {
  X,
  Edit3,
  Trash2,
  Power,
  Tag,
  Info
} from 'lucide-react';
import { Equipment } from '../types';

interface MobileContextMenuProps {
  isOpen: boolean;
  equipment: Equipment | null;
  unit: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPowerToggle: () => void;
  onRename: () => void;
}

export const MobileContextMenu: React.FC<MobileContextMenuProps> = ({
  isOpen,
  equipment,
  unit,
  onClose,
  onEdit,
  onDelete,
  onPowerToggle,
  onRename
}) => {
  if (!isOpen || !equipment) return null;

  const isPowerable = equipment.type === 'server' || equipment.type === 'network' || equipment.type === 'storage';

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-800 border-t border-custom-gray rounded-t-2xl animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-gray-400" />
            <div>
              <h3 className="text-sm font-bold text-gray-100">{equipment.name}</h3>
              <p className="text-xs text-gray-400">U{unit} / {equipment.height}U / {equipment.power}W</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* アクション */}
        <div className="p-2 space-y-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
          <button
            onClick={() => { onEdit(); onClose(); }}
            className="w-full p-4 rounded-lg text-left hover:bg-gray-700 active:bg-gray-600 text-gray-200 flex items-center gap-3"
          >
            <Edit3 size={18} className="text-blue-400" />
            <div>
              <div className="text-sm font-medium">編集</div>
              <div className="text-xs text-gray-400">機器の詳細設定を開く</div>
            </div>
          </button>

          <button
            onClick={() => { onRename(); onClose(); }}
            className="w-full p-4 rounded-lg text-left hover:bg-gray-700 active:bg-gray-600 text-gray-200 flex items-center gap-3"
          >
            <Tag size={18} className="text-green-400" />
            <div>
              <div className="text-sm font-medium">名前変更</div>
              <div className="text-xs text-gray-400">表示名をインライン編集</div>
            </div>
          </button>

          {isPowerable && (
            <button
              onClick={() => { onPowerToggle(); onClose(); }}
              className="w-full p-4 rounded-lg text-left hover:bg-gray-700 active:bg-gray-600 text-gray-200 flex items-center gap-3"
            >
              <Power size={18} className={equipment.powerOn !== false ? 'text-green-400' : 'text-gray-500'} />
              <div>
                <div className="text-sm font-medium">
                  {equipment.powerOn !== false ? '電源OFF' : '電源ON'}
                </div>
                <div className="text-xs text-gray-400">電源状態を切り替え</div>
              </div>
            </button>
          )}

          <div className="border-t border-gray-700 my-1" />

          <button
            onClick={() => { onDelete(); onClose(); }}
            className="w-full p-4 rounded-lg text-left hover:bg-gray-700 active:bg-red-900 text-red-400 flex items-center gap-3"
          >
            <Trash2 size={18} />
            <div>
              <div className="text-sm font-medium">削除</div>
              <div className="text-xs text-red-400/70">この機器をラックから取り外す</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};
