import React from 'react';
import { Rack, RailInstallation } from '../types';

interface RailProps {
  rack: Rack;
  rail: RailInstallation;
  unitHeight: number;
  zoomLevel: number;
  rackWidth: number;
  totalUnits: number;
  darkMode: boolean;
}

export const Rail: React.FC<RailProps> = ({
  rack,
  rail,
  unitHeight,
  zoomLevel,
  rackWidth,
  totalUnits,
  darkMode,
}) => {
  const railHeight = (rail.endUnit - rail.startUnit + 1) * unitHeight;
  const topPosition = (totalUnits - rail.endUnit) * unitHeight;

  const railColor = darkMode ? 'bg-gray-500' : 'bg-gray-400';
  const railBorderStyle = darkMode ? 'border-gray-400' : 'border-gray-500';

  return (
    <div
      className={`absolute left-0 w-full`}
      style={{
        top: `${topPosition}px`,
        height: `${railHeight}px`,
        pointerEvents: 'none', // 機器のドラッグ＆ドロップを妨げないように
      }}
    >
      {/* Left Rail */}
      <div
        className={`absolute ${railColor} ${railBorderStyle} border-r-2`}
        style={{
          left: '20px', // ラックの柱の内側に表示
          width: '10px',
          height: '100%',
          opacity: 0.7,
        }}
        title={`Rail for ${rail.equipmentId || 'Unassigned'}`}
      />
      {/* Right Rail */}
      <div
        className={`absolute ${railColor} ${railBorderStyle} border-l-2`}
        style={{
          right: '20px', // ラックの柱の内側に表示
          width: '10px',
          height: '100%',
          opacity: 0.7,
        }}
        title={`Rail for ${rail.equipmentId || 'Unassigned'}`}
      />
    </div>
  );
};