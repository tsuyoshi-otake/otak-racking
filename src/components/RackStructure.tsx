import React from 'react';
import { Eye, Grid, Lock, Unlock, DoorOpen, DoorClosed } from 'lucide-react';
import { Rack, PhysicalStructure } from '../types';
import { RackViewPerspective } from '../App';

interface RackStructureProps {
  rack: Rack;
  zoomLevel: number;
  unitHeight: number;
  perspective: RackViewPerspective;
  onUpdatePhysicalStructure?: (updates: Partial<PhysicalStructure>) => void;
}

export const RackStructure: React.FC<RackStructureProps> = ({
  rack,
  zoomLevel,
  unitHeight,
  perspective,
  onUpdatePhysicalStructure
}) => {
  const structure = rack.physicalStructure;
  if (!structure) return null;

  const rackHeight = rack.units * unitHeight;
  const rackWidth = 600 * (zoomLevel / 100);
  const frameWidth = 16 * (zoomLevel / 100);
  const frameOffset = 20 * (zoomLevel / 100);

  return (
    <>
      {/* フレーム（角柱） */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 前面左角柱 */}
        <div
          className="absolute border-2 bg-gradient-to-r from-gray-600 to-gray-700"
          style={{
            left: `-${frameOffset}px`,
            top: '0px',
            width: `${frameWidth}px`,
            height: `${rackHeight}px`,
            backgroundColor: structure.frame.color,
            borderColor: structure.frame.color,
            borderRadius: '2px'
          }}
        />
        
        {/* 前面右角柱 */}
        <div
          className="absolute border-2 bg-gradient-to-r from-gray-600 to-gray-700"
          style={{
            right: `-${frameOffset}px`,
            top: '0px',
            width: `${frameWidth}px`,
            height: `${rackHeight}px`,
            backgroundColor: structure.frame.color,
            borderColor: structure.frame.color,
            borderRadius: '2px'
          }}
        />

        {/* 背面左角柱 */}
        <div
          className="absolute border-2 bg-gradient-to-r from-gray-600 to-gray-700 opacity-50"
          style={{
            left: `-${frameOffset * 0.8}px`,
            top: `${4 * (zoomLevel / 100)}px`,
            width: `${frameWidth * 0.75}px`,
            height: `${rackHeight - 8 * (zoomLevel / 100)}px`,
            backgroundColor: structure.frame.color,
            borderColor: structure.frame.color,
            borderRadius: '2px'
          }}
        />
        
        {/* 背面右角柱 */}
        <div
          className="absolute border-2 bg-gradient-to-r from-gray-600 to-gray-700 opacity-50"
          style={{
            right: `-${frameOffset * 0.8}px`,
            top: `${4 * (zoomLevel / 100)}px`,
            width: `${frameWidth * 0.75}px`,
            height: `${rackHeight - 8 * (zoomLevel / 100)}px`,
            backgroundColor: structure.frame.color,
            borderColor: structure.frame.color,
            borderRadius: '2px'
          }}
        />
      </div>

      {/* 前面扉 */}
      {structure.frontDoor.type !== 'none' && (
        <div
          className={`absolute cursor-pointer transition-all duration-300 ${
            structure.frontDoor.opened ? 'transform -translate-x-full' : ''
          }`}
          style={{
            left: structure.frontDoor.opened ? '-100%' : '0px',
            top: '0px',
            width: `${rackWidth}px`,
            height: `${rackHeight}px`,
            backgroundColor: structure.frontDoor.color,
            opacity: structure.frontDoor.transparency / 100,
            zIndex: 20
          }}
          onClick={() => onUpdatePhysicalStructure?.({
            frontDoor: {
              ...structure.frontDoor,
              opened: !structure.frontDoor.opened
            }
          })}
          title={`前面扉 (${structure.frontDoor.type}) - クリックで開閉`}
        >
          {/* 扉のタイプに応じた表現 */}
          {structure.frontDoor.type === 'mesh' && (
            <div className="w-full h-full grid grid-cols-8 grid-rows-16 gap-1 p-2">
              {Array.from({ length: 128 }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-sm opacity-50" />
              ))}
            </div>
          )}
          
          {structure.frontDoor.type === 'glass' && (
            <div className="w-full h-full bg-gray-100 bg-opacity-30 border-2 border-gray-400">
              <div className="absolute top-2 right-2">
                <Eye size={16} className="text-gray-600" />
              </div>
            </div>
          )}
          
          {structure.frontDoor.type === 'steel' && (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600">
              <div className="w-full h-full grid grid-cols-4 grid-rows-8 gap-1 p-4">
                {Array.from({ length: 32 }, (_, i) => (
                  <div key={i} className="border border-gray-500 rounded-sm" />
                ))}
              </div>
            </div>
          )}

          {structure.frontDoor.type === 'perforated' && (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600">
              <Grid size={24} className="absolute top-2 left-2 text-gray-700" />
              <div className="w-full h-full grid grid-cols-12 grid-rows-24 gap-1 p-2">
                {Array.from({ length: 288 }, (_, i) => (
                  <div key={i} className="bg-black rounded-full opacity-30" />
                ))}
              </div>
            </div>
          )}

          {/* ロック表示 */}
          <div className="absolute top-4 right-4">
            {structure.frontDoor.locked ? (
              <Lock size={16} className="text-gray-700" />
            ) : (
              <Unlock size={16} className="text-gray-500" />
            )}
          </div>

          {/* 開閉状態アイコン */}
          <div className="absolute bottom-4 right-4">
            {structure.frontDoor.opened ? (
              <DoorOpen size={16} className="text-gray-600" />
            ) : (
              <DoorClosed size={16} className="text-gray-600" />
            )}
          </div>
        </div>
      )}

      {/* 背面扉 */}
      {structure.rearDoor.type !== 'none' && perspective === 'rear' && (
        <div
          className={`absolute cursor-pointer transition-all duration-300 opacity-80 ${
            structure.rearDoor.opened ? 'transform translate-x-full' : ''
          }`}
          style={{
            left: structure.rearDoor.opened ? '100%' : '0px',
            top: '0px',
            width: `${rackWidth}px`,
            height: `${rackHeight}px`,
            backgroundColor: structure.rearDoor.color,
            opacity: structure.rearDoor.transparency / 100,
            zIndex: 20
          }}
          onClick={() => onUpdatePhysicalStructure?.({
            rearDoor: {
              ...structure.rearDoor,
              opened: !structure.rearDoor.opened
            }
          })}
          title={`背面扉 (${structure.rearDoor.type}) - クリックで開閉`}
        >
          {/* 背面扉の表現（前面と同様） */}
          {structure.rearDoor.type === 'mesh' && (
            <div className="w-full h-full grid grid-cols-8 grid-rows-16 gap-1 p-2">
              {Array.from({ length: 128 }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-sm opacity-50" />
              ))}
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            {structure.rearDoor.locked ? (
              <Lock size={16} className="text-gray-700" />
            ) : (
              <Unlock size={16} className="text-gray-500" />
            )}
          </div>
        </div>
      )}

      {/* 左サイドパネル */}
      {structure.leftPanel.type !== 'none' && structure.leftPanel.mounted && (
        <div
          className="absolute cursor-pointer"
          style={{
            left: `-${40 * (zoomLevel / 100)}px`,
            top: '0px',
            width: `${36 * (zoomLevel / 100)}px`,
            height: `${rackHeight}px`,
            backgroundColor: structure.leftPanel.color,
            opacity: structure.leftPanel.transparency / 100,
            zIndex: 15,
            transform: `perspective(${200 * (zoomLevel / 100)}px) rotateY(15deg)`,
            transformOrigin: 'right center'
          }}
          onClick={() => structure.leftPanel.removable && onUpdatePhysicalStructure?.({
            leftPanel: {
              ...structure.leftPanel,
              mounted: false
            }
          })}
          title={`左サイドパネル (${structure.leftPanel.type}) ${structure.leftPanel.removable ? '- クリックで取り外し' : ''}`}
        >
          {structure.leftPanel.type === 'mesh' && (
            <div className="w-full h-full grid grid-cols-2 grid-rows-16 gap-1 p-1">
              {Array.from({ length: 32 }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-sm opacity-50" />
              ))}
            </div>
          )}
          
          {structure.leftPanel.type === 'steel' && (
            <div className="w-full h-full bg-gradient-to-r from-gray-500 to-gray-600" />
          )}
        </div>
      )}

      {/* 右サイドパネル */}
      {structure.rightPanel.type !== 'none' && structure.rightPanel.mounted && (
        <div
          className="absolute cursor-pointer"
          style={{
            right: `-${40 * (zoomLevel / 100)}px`,
            top: '0px',
            width: `${36 * (zoomLevel / 100)}px`,
            height: `${rackHeight}px`,
            backgroundColor: structure.rightPanel.color,
            opacity: structure.rightPanel.transparency / 100,
            zIndex: 15,
            transform: `perspective(${200 * (zoomLevel / 100)}px) rotateY(-15deg)`,
            transformOrigin: 'left center'
          }}
          onClick={() => structure.rightPanel.removable && onUpdatePhysicalStructure?.({
            rightPanel: {
              ...structure.rightPanel,
              mounted: false
            }
          })}
          title={`右サイドパネル (${structure.rightPanel.type}) ${structure.rightPanel.removable ? '- クリックで取り外し' : ''}`}
        >
          {structure.rightPanel.type === 'mesh' && (
            <div className="w-full h-full grid grid-cols-2 grid-rows-16 gap-1 p-1">
              {Array.from({ length: 32 }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-sm opacity-50" />
              ))}
            </div>
          )}
          
          {structure.rightPanel.type === 'steel' && (
            <div className="w-full h-full bg-gradient-to-r from-gray-500 to-gray-600" />
          )}
        </div>
      )}
    </>
  );
};
export {};