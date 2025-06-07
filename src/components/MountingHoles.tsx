import React from 'react';
import { Rack } from '../types';

interface MountingHolesProps {
  rack: Rack;
  unit: number;
  zoomLevel: number;
  unitHeight: number;
  darkMode: boolean;
  perspective: 'front' | 'rear';
  onCageNutInstall?: (unit: number, side: string, position: string, nutType: string) => void;
  onCageNutRemove?: (unit: number, side: string, position: string) => void;
}

export const MountingHoles: React.FC<MountingHolesProps> = ({
  rack,
  unit,
  zoomLevel,
  unitHeight,
  darkMode,
  perspective,
  onCageNutInstall,
  onCageNutRemove
}) => {
  const cageNuts = rack.cageNuts[unit] || {
    frontLeft: { top: null, bottom: null },
    frontRight: { top: null, bottom: null },
    rearLeft: { top: null, bottom: null },
    rearRight: { top: null, bottom: null }
  };

  const railInstallation = rack.railInstallations?.[unit];
  const holeSize = Math.max(13 * (zoomLevel / 100), unitHeight * 0.38);
  const frameOffset = 20 * (zoomLevel / 100);
  const holeOffset = frameOffset - (holeSize / 2);

  const renderHole = (side: 'front' | 'rear', position: 'left' | 'right', vertical: 'top' | 'bottom') => {
    const nutSide = `${side}${position.charAt(0).toUpperCase() + position.slice(1)}` as keyof typeof cageNuts;
    const nut = cageNuts[nutSide]?.[vertical];
    const title = `${side === 'front' ? '前面' : '背面'}${position === 'left' ? '左' : '右'}${vertical === 'top' ? '上' : '下'}: ${nut ? `${nut.toUpperCase()}ナット` : '空き穴'}`;

    return (
      <div
        className={`absolute border cursor-pointer ${
          nut
            ? 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500'
            : darkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
              : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
        }`}
        style={{
          width: `${holeSize}px`,
          height: `${holeSize}px`,
          [position]: `-${holeOffset + 2}px`,
          [vertical]: `2px`,
          borderRadius: '2px',
          boxShadow: nut
            ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
            : 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          if (nut) {
            onCageNutRemove?.(unit, nutSide, vertical);
          } else {
            onCageNutInstall?.(unit, nutSide, vertical, 'm6');
          }
        }}
      >
        {nut && (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="bg-gradient-to-br from-zinc-300 to-zinc-500 rounded-full"
              style={{
                width: `${Math.max(6, holeSize * 0.4)}px`,
                height: `${Math.max(6, holeSize * 0.4)}px`,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* レール表現 */}
      {railInstallation && railInstallation.installed && (
        <>
          {/* 左レール */}
          <div
            className="absolute bg-gradient-to-r from-gray-400 to-gray-600 border border-gray-500 opacity-90"
            style={{
              width: `${3 * (zoomLevel / 100)}px`,
              height: `${unitHeight - 4}px`,
              left: `-${8 * (zoomLevel / 100)}px`,
              top: `2px`,
              borderRadius: '1px'
            }}
            title={`左レール: ${railInstallation.type}`}
          >
            <div className="w-full h-full flex flex-col justify-around">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-full h-0.5 bg-gray-700" />
              ))}
            </div>
          </div>
          
          {/* 右レール */}
          <div
            className="absolute bg-gradient-to-r from-gray-400 to-gray-600 border border-gray-500 opacity-90"
            style={{
              width: `${3 * (zoomLevel / 100)}px`,
              height: `${unitHeight - 4}px`,
              right: `-${8 * (zoomLevel / 100)}px`,
              top: `2px`,
              borderRadius: '1px'
            }}
            title={`右レール: ${railInstallation.type}`}
          >
            <div className="w-full h-full flex flex-col justify-around">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-full h-0.5 bg-gray-700" />
              ))}
            </div>
          </div>
        </>
      )}

      {/* 取り付け穴 */}
      {renderHole(perspective, 'left', 'top')}
      {renderHole(perspective, 'left', 'bottom')}
      {renderHole(perspective, 'right', 'top')}
      {renderHole(perspective, 'right', 'bottom')}
    </>
  );
};