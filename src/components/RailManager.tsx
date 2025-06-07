import React from 'react';
import { Move, Plus, Trash2 } from 'lucide-react';
import { Rack, RailType } from '../types';

interface RailManagerProps {
  rack: Rack;
  unit: number;
  darkMode: boolean;
  onInstallRail?: (unit: number, railType: RailType) => void;
  onRemoveRail?: (unit: number) => void;
}

export const RailManager: React.FC<RailManagerProps> = ({
  rack,
  unit,
  darkMode,
  onInstallRail,
  onRemoveRail
}) => {
  const rails = rack.rails?.[unit];
  const hasRails = rails?.frontLeft?.installed || rails?.frontRight?.installed;

  const railTypes: { value: RailType; label: string; units: number }[] = [
    { value: '1u', label: '1Uレール', units: 1 },
    { value: '2u', label: '2Uレール', units: 2 },
    { value: '4u', label: '4Uレール', units: 4 }
  ];

  const handleInstallRail = (railType: RailType) => {
    onInstallRail?.(unit, railType);
  };

  const handleRemoveRail = () => {
    onRemoveRail?.(unit);
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded ${
      darkMode ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      <Move size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
      
      {!hasRails ? (
        <>
          <span className="text-sm">レール設置:</span>
          <div className="flex gap-1">
            {railTypes.map((rail) => (
              <button
                key={rail.value}
                onClick={() => handleInstallRail(rail.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
                title={`${rail.label}を設置`}
              >
                <Plus size={12} className="inline mr-1" />
                {rail.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <span className="text-sm">
            レール設置済み: {rails.frontLeft?.railType?.toUpperCase()}
          </span>
          <button
            onClick={handleRemoveRail}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              darkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title="レールを削除"
          >
            <Trash2 size={12} className="inline mr-1" />
            削除
          </button>
        </>
      )}
    </div>
  );
};