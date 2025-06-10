import React from 'react';
import { Move, Plus } from 'lucide-react';
import { Rack, RailType } from '../types';

interface RailManagerProps {
  rack: Rack;
  unit: number;
  darkMode: boolean;
  onInstallRail?: (unit: number, side: 'left' | 'right', railType: RailType) => void;
  onRemoveRail?: (unit: number, side: 'left' | 'right') => void;
}

export const RailManager: React.FC<RailManagerProps> = ({
  rack,
  unit,
  darkMode,
  onInstallRail,
  onRemoveRail
}) => {
  const rails = rack.rails?.[unit];
  const hasLeftRail = rails?.frontLeft?.installed || false;
  const hasRightRail = rails?.frontRight?.installed || false;

  const railTypes: { value: RailType; label: string; units: number }[] = [
    { value: '1u', label: '1Uレール', units: 1 },
    { value: '2u', label: '2Uレール', units: 2 },
    { value: '4u', label: '4Uレール', units: 4 }
  ];

  const handleInstallRail = (side: 'left' | 'right', railType: RailType) => {
    onInstallRail?.(unit, side, railType);
  };

  const handleRemoveRail = (side: 'left' | 'right') => {
    onRemoveRail?.(unit, side);
  };

  return (
    <div className={`flex flex-col gap-2 p-2 rounded ${
      darkMode ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      <div className="flex items-center gap-2">
        <Move size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
        <span className="text-sm font-medium">レール管理</span>
      </div>
      
      {/* 左レール */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-16">左レール:</span>
        {!hasLeftRail ? (
          <div className="flex gap-1">
            {railTypes.map((rail) => (
              <button
                key={`left-${rail.value}`}
                onClick={() => handleInstallRail('left', rail.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                    : 'bg-custom-gray hover:bg-gray-600 text-gray-200'
                }`}
                title={`左側に${rail.label}を設置`}
              >
                <Plus size={10} className="inline mr-1" />
                {rail.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs">
              {rails.frontLeft?.railType?.toUpperCase()}設置済み
            </span>
          </div>
        )}
      </div>
      
      {/* 右レール */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-16">右レール:</span>
        {!hasRightRail ? (
          <div className="flex gap-1">
            {railTypes.map((rail) => (
              <button
                key={`right-${rail.value}`}
                onClick={() => handleInstallRail('right', rail.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                    : 'bg-custom-gray hover:bg-gray-600 text-gray-200'
                }`}
                title={`右側に${rail.label}を設置`}
              >
                <Plus size={10} className="inline mr-1" />
                {rail.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs">
              {rails.frontRight?.railType?.toUpperCase()}設置済み
            </span>
          </div>
        )}
      </div>
    </div>
  );
};