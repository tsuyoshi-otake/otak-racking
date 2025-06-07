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
  onRailInstall?: (unit: number, side: 'left' | 'right', railType: string) => void;
  onRailRemove?: (unit: number, side: 'left' | 'right') => void;
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

  // レールスロットを描画する関数
  const renderRailSlot = (side: 'front' | 'rear', position: 'left' | 'right') => {
    const railKey = `${railSide}${position.charAt(0).toUpperCase() + position.slice(1)}` as 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';
    const hasRail = rails?.[railKey]?.installed;
    
    // レールスロットのサイズ（縦長の四角形）
    const slotWidth = Math.max(6, 10 * (zoomLevel / 100));
    const slotHeight = unitHeight - 8; // ユニットの高さから少し余白を残す

    return (
      <div
        className={`absolute cursor-pointer transition-all ${
          hasRail ? 'hover:scale-105' : 'hover:opacity-80'
        }`}
        style={{
          ...(position === 'left'
            ? { left: `${8 * (zoomLevel / 100)}px` }
            : { right: `${8 * (zoomLevel / 100)}px` }
          ),
          top: '4px',
          width: `${slotWidth}px`,
          height: `${slotHeight}px`,
          backgroundColor: hasRail
            ? darkMode
              ? 'rgba(192, 192, 192, 0.9)' // 銀色（設置済み）
              : 'rgba(192, 192, 192, 0.8)'
            : 'transparent', // 未使用時は透過
          border: hasRail
            ? `1px solid ${darkMode ? 'rgba(169, 169, 169, 0.9)' : 'rgba(169, 169, 169, 0.8)'}`
            : `1px dashed ${darkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.5)'}`,
          borderRadius: '2px',
          boxShadow: hasRail ? 'inset 0 1px 3px rgba(0,0,0,0.3)' : 'none',
        }}
        title={`${position === 'left' ? '左' : '右'}レールスロット: ${hasRail ? 'レール設置済み（クリックで削除）' : 'クリックでレール設置'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (hasRail) {
            onRailRemove?.(unit, position);
          } else {
            onRailInstall?.(unit, position, '1u');
          }
        }}
      >
        {hasRail && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: darkMode
                ? 'linear-gradient(180deg, rgba(211, 211, 211, 0.4) 0%, rgba(192, 192, 192, 0.6) 50%, rgba(169, 169, 169, 0.4) 100%)'
                : 'linear-gradient(180deg, rgba(220, 220, 220, 0.4) 0%, rgba(192, 192, 192, 0.6) 50%, rgba(169, 169, 169, 0.4) 100%)',
              borderRadius: '1px',
              margin: '1px',
            }}
          />
        )}
      </div>
    );
  };

  const renderHole = (side: 'front' | 'rear', position: 'left' | 'right', vertical: 'top' | 'middle' | 'bottom') => {
    const nutSide = `${side}${position.charAt(0).toUpperCase() + position.slice(1)}` as keyof typeof cageNuts;
    const nut = cageNuts[nutSide]?.[vertical];
    
    // レールが設置されているかチェック
    const railKey = `${side}${position.charAt(0).toUpperCase() + position.slice(1)}` as 'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight';
    const hasRail = rails?.[railKey]?.installed;
    const isRailFixed = hasRail; // レールが設置されている場合、ケージナット穴は固定される
    
    const title = `${side === 'front' ? '前面' : '背面'}${position === 'left' ? '左' : '右'}${vertical === 'top' ? '上' : vertical === 'middle' ? '中' : '下'}: ${
      isRailFixed ? 'レール固定' : nut ? `${nut.toUpperCase()}ナット` : '空き穴'
    }`;

    return (
      <div
        className="absolute"
        style={{
          [position]: `-${frameOffset - holeSize / 2}px`,
          top: vertical === 'top' ? '2px' : vertical === 'middle' ? '50%' : undefined,
          bottom: vertical === 'bottom' ? '2px' : undefined,
          transform: vertical === 'middle' ? 'translateY(-50%)' : undefined,
        }}
      >
        {/* ケージナット穴 */}
        <div
          className={`relative border ${isRailFixed ? '' : 'cursor-pointer'} ${
            isRailFixed
              ? darkMode
                ? 'bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 border-zinc-500'
                : 'bg-gradient-to-br from-zinc-400 via-zinc-500 to-zinc-600 border-zinc-700'
              : nut
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
            boxShadow: isRailFixed
              ? 'inset 0 2px 4px rgba(0,0,0,0.5)'
              : nut
                ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
                : 'inset 0 2px 4px rgba(0,0,0,0.1)',
            opacity: isRailFixed ? 0.8 : 1,
          }}
          title={title}
          onClick={(e) => {
            e.stopPropagation();
            // レール固定時はクリック無効
            if (isRailFixed) return;
            
            if (nut) {
              onCageNutRemove?.(unit, nutSide, vertical);
            } else {
              onCageNutInstall?.(unit, nutSide, vertical, 'm6');
            }
          }}
        >
          {isRailFixed ? (
            // レール固定用のビス表現
            <div className="w-full h-full flex items-center justify-center">
              <div
                className={`${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}
                style={{
                  width: `${Math.max(4, holeSize * 0.3)}px`,
                  height: `${Math.max(4, holeSize * 0.3)}px`,
                  borderRadius: '50%',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                {/* ビスの十字溝 */}
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  style={{
                    transform: 'rotate(45deg)',
                  }}
                >
                  <div
                    className={darkMode ? 'bg-gray-700' : 'bg-gray-800'}
                    style={{
                      width: '1px',
                      height: '60%',
                      position: 'absolute',
                    }}
                  />
                  <div
                    className={darkMode ? 'bg-gray-700' : 'bg-gray-800'}
                    style={{
                      width: '60%',
                      height: '1px',
                      position: 'absolute',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : nut ? (
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
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* レールスロット（縦長の四角形） */}
      {renderRailSlot(perspective, 'left')}
      {renderRailSlot(perspective, 'right')}
      
      {/* ケージナット穴 */}
      {renderHole(perspective, 'left', 'top')}
      {renderHole(perspective, 'left', 'middle')}
      {renderHole(perspective, 'left', 'bottom')}
      {renderHole(perspective, 'right', 'top')}
      {renderHole(perspective, 'right', 'middle')}
      {renderHole(perspective, 'right', 'bottom')}
    </>
  );
};