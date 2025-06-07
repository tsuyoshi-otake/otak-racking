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
  onRailInstall?: (unit: number, railType: string) => void;
  onRailRemove?: (unit: number) => void;
}

export const MountingHoles: React.FC<MountingHolesProps> = ({
  rack,
  unit,
  zoomLevel,
  unitHeight,
  darkMode,
  perspective,
  onCageNutInstall,
  onCageNutRemove,
  onRailInstall,
  onRailRemove
}) => {
  const cageNuts = rack.cageNuts[unit] || {
    frontLeft: { top: null, middle: null, bottom: null },
    frontRight: { top: null, middle: null, bottom: null },
    rearLeft: { top: null, middle: null, bottom: null },
    rearRight: { top: null, middle: null, bottom: null }
  };

  // レール情報を取得
  const rails = rack.rails?.[unit];
  const railSide = perspective === 'front' ? 'front' : 'rear';

  const holeSize = Math.max(8, 16 * (zoomLevel / 100));
  const frameOffset = 20 * (zoomLevel / 100);

  const renderHole = (side: 'front' | 'rear', position: 'left' | 'right', vertical: 'top' | 'middle' | 'bottom') => {
    const nutSide = `${side}${position.charAt(0).toUpperCase() + position.slice(1)}` as keyof typeof cageNuts;
    const nut = cageNuts[nutSide]?.[vertical];
    const title = `${side === 'front' ? '前面' : '背面'}${position === 'left' ? '左' : '右'}${vertical === 'top' ? '上' : vertical === 'middle' ? '中' : '下'}: ${nut ? `${nut.toUpperCase()}ナット` : '空き穴'}`;

    // レールスロットのサイズ
    const slotWidth = 8 * (zoomLevel / 100);
    const slotHeight = Math.max(4, 8 * (zoomLevel / 100));
    const holeWithSlotWidth = holeSize + slotWidth + 2; // 2pxの間隔
    const holeWithSlotOffset = frameOffset - (holeWithSlotWidth / 2);
    
    // レールが設置されているかチェック
    const railKey = `${railSide}${position.charAt(0).toUpperCase() + position.slice(1)}` as 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';
    const hasRail = rails?.[railKey]?.installed;

    return (
      <div
        className="absolute flex items-center"
        style={{
          [position]: `-${holeWithSlotOffset + 2}px`,
          top: vertical === 'top' ? '2px' : vertical === 'middle' ? '50%' : undefined,
          bottom: vertical === 'bottom' ? '2px' : undefined,
          transform: vertical === 'middle' ? 'translateY(-50%)' : undefined,
          height: `${holeSize}px`,
          flexDirection: position === 'left' ? 'row' : 'row-reverse',
          gap: '2px',
        }}
      >
        {/* ゲージナット穴 */}
        <div
          className={`relative border cursor-pointer ${
            nut
              ? darkMode
                ? 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 border-gray-400'
                : 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 border-gray-600'
              : darkMode
                ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700'
                : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-gray-400'
          }`}
          style={{
            width: `${holeSize}px`,
            height: `${holeSize}px`,
            borderRadius: '2px',
            boxShadow: nut ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.1)',
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
                className={`rounded-full ${
                  darkMode
                    ? 'bg-gradient-to-br from-zinc-400 to-zinc-600'
                    : 'bg-gradient-to-br from-zinc-200 to-zinc-400'
                }`}
                style={{
                  width: `${Math.max(6, holeSize * 0.4)}px`,
                  height: `${Math.max(6, holeSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          )}
        </div>

        {/* レールスロット */}
        <div
          className={`relative border cursor-pointer transition-all hover:scale-110 ${
            hasRail
              ? darkMode
                ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 border-indigo-500 hover:from-indigo-500 hover:to-indigo-700'
                : 'bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 border-indigo-700 hover:from-indigo-300 hover:to-indigo-500'
              : darkMode
                ? 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border-gray-600 hover:from-gray-600 hover:to-gray-800'
                : 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border-gray-500 hover:from-gray-100 hover:to-gray-300'
          }`}
          style={{
            width: `${slotWidth}px`,
            height: `${slotHeight}px`,
            borderRadius: `${slotHeight / 2}px`,
            boxShadow: hasRail ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.2)',
          }}
          title={`レールスロット: ${hasRail ? 'レール設置済み（クリックで削除）' : 'クリックでレール設置'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasRail) {
              onRailRemove?.(unit);
            } else {
              // デフォルトで1Uレールを設置
              onRailInstall?.(unit, '1u');
            }
          }}
        >
          {hasRail && (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className={`${
                  darkMode
                    ? 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                    : 'bg-gradient-to-r from-indigo-300 to-indigo-400'
                }`}
                style={{
                  width: `${Math.max(2, slotWidth * 0.6)}px`,
                  height: `${Math.max(2, slotHeight * 0.6)}px`,
                  borderRadius: `${slotHeight / 3}px`,
                  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 取り付け穴 */}
      {renderHole(perspective, 'left', 'top')}
      {renderHole(perspective, 'left', 'middle')}
      {renderHole(perspective, 'left', 'bottom')}
      {renderHole(perspective, 'right', 'top')}
      {renderHole(perspective, 'right', 'middle')}
      {renderHole(perspective, 'right', 'bottom')}
    </>
  );
};