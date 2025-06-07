import React from 'react';
import { Rack } from '../types';
import { getZoomedCageNutSize } from '../utils';

interface MountingHolesProps {
  rack: Rack;
  unit: number;
  zoomLevel: number;
  unitHeight: number;
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

  const cageNutSize = getZoomedCageNutSize(zoomLevel);
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
            ? 'rgba(71, 85, 105, 0.95)' // ダークスチール（設置済み）
            : 'transparent', // 未使用時は透過
          border: hasRail
            ? '1px solid rgba(51, 65, 85, 1)'
            : '1px dashed rgba(71, 85, 105, 0.4)',
          borderRadius: '2px',
          boxShadow: hasRail ? 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(255,255,255,0.1)' : 'none',
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
              background: 'linear-gradient(180deg, rgba(100, 116, 139, 0.3) 0%, rgba(71, 85, 105, 0.5) 50%, rgba(51, 65, 85, 0.3) 100%)',
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
          [position]: `-${frameOffset - cageNutSize / 2}px`,
          top: vertical === 'top' ? '2px' : vertical === 'middle' ? '50%' : undefined,
          bottom: vertical === 'bottom' ? '2px' : undefined,
          transform: vertical === 'middle' ? 'translateY(-50%)' : undefined,
        }}
      >
        {/* ケージナット穴 */}
        <div
          className={`relative border ${isRailFixed ? '' : 'cursor-pointer'} ${
            isRailFixed
              ? 'border-gray-600'
              : nut
                ? 'bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 border-zinc-500'
                : 'bg-gradient-to-br from-gray-900 via-black to-gray-950 border-gray-800'
          }`}
          style={{
            width: cageNutSize,
            height: cageNutSize,
            borderRadius: '2px',
            backgroundColor: isRailFixed ? '#242d40' : undefined,
            boxShadow: isRailFixed
              ? 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 2px rgba(255,255,255,0.05)'
              : nut
                ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.1)'
                : 'inset 0 2px 4px rgba(0,0,0,0.2)',
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
                className="bg-gradient-to-br from-gray-400 to-gray-600"
                style={{
                  width: `${Math.max(4, cageNutSize * 0.3)}px`,
                  height: `${Math.max(4, cageNutSize * 0.3)}px`,
                  borderRadius: '50%',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.1)',
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
                    className="bg-gray-800"
                    style={{
                      width: '1px',
                      height: '60%',
                      position: 'absolute',
                    }}
                  />
                  <div
                    className="bg-gray-800"
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
                className="rounded-full bg-gradient-to-br from-slate-500 to-slate-700"
                style={{
                  width: `${Math.max(6, cageNutSize * 0.4)}px`,
                  height: `${Math.max(6, cageNutSize * 0.4)}px`,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.2)',
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