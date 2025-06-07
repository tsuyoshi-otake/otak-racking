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

export const Rail: React.FC<RailProps> = ({ rack, rail, unitHeight, totalUnits, zoomLevel, rackWidth, darkMode }) => {
  const railHeight = unitHeight;
  const topPosition = (totalUnits - rail.unit) * unitHeight;

  const railColor = darkMode ? 'bg-gray-500' : 'bg-gray-400';
  const railBorderStyle = darkMode ? 'border-gray-400' : 'border-gray-500';

  // MountingHoles.tsx の計算ロジックと完全に一致させる
  const holeSize = Math.max(8, 16 * (zoomLevel / 100));
  const frameOffset = 20 * (zoomLevel / 100);
  const holeOffset = frameOffset - (holeSize / 2);
  
  // RackUnitのパディング(px-2 -> 0.5rem -> 8px)とMountingHolesのオフセットを考慮
  // MountingHolesの `-(holeOffset + 2)` という実装から `+2` を除外して微調整
  const holeAbsoluteX = 8 - holeOffset;

  const railWidth = 15 * (zoomLevel / 100);
  const railClipWidth = 5 * (zoomLevel / 100);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: `${topPosition}px`,
        height: `${railHeight}px`,
        width: `${rackWidth}px`,
        left: 0,
        zIndex: 5,
      }}
      title={`Rail at U${rail.unit} (${rail.type})`}
    >
      {/* 左レール */}
      <div
        className={`absolute top-0 h-full ${railColor} border-y border-r ${railBorderStyle}`}
        style={{
          left: `${holeAbsoluteX + holeSize / 2 - 2}px`,
          width: `${railWidth}px`,
        }}
      />
      <div
        className={`absolute top-0 h-full ${railColor} border ${railBorderStyle}`}
        style={{
          left: `${holeAbsoluteX - holeSize / 2 - 2}px`,
          width: `${holeSize}px`,
        }}
      />

      {/* 右レール */}
      <div
        className={`absolute top-0 h-full ${railColor} border-y border-l ${railBorderStyle}`}
        style={{
          right: `${holeAbsoluteX + holeSize / 2}px`,
          width: `${railWidth}px`,
        }}
      />
      <div
        className={`absolute top-0 h-full ${railColor} border ${railBorderStyle}`}
        style={{
          right: `${holeAbsoluteX - holeSize / 2}px`,
          width: `${holeSize}px`,
        }}
      />
    </div>
  );
};