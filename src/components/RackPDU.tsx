import React from 'react';
import { Zap } from 'lucide-react';
import { Rack } from '../types';

interface RackPDUProps {
  rack: Rack;
  zoomLevel: number;
  unitHeight: number;
}

export const RackPDU: React.FC<RackPDUProps> = ({
  rack,
  zoomLevel,
  unitHeight
}) => {
  // PDU描画機能
  const renderPDUs = () => {
    if (!rack.pduPlacements || rack.pduPlacements.length === 0) return null;

    return rack.pduPlacements.map((pdu, index) => {
      const pduWidth = 20 * (zoomLevel / 100); // PDUの幅をズームに対応
      const pduHeight = Math.min(rack.units * unitHeight * 0.8, pdu.equipment.height * unitHeight || rack.units * unitHeight * 0.6);
      
      let positionStyle: React.CSSProperties = {};
      
      switch (pdu.position) {
        case 'left':
          positionStyle = {
            left: `-${pduWidth + 10 * (zoomLevel / 100)}px`,
            top: `${pdu.offset}px`,
            width: `${pduWidth}px`,
            height: `${pduHeight}px`
          };
          break;
        case 'right':
          positionStyle = {
            right: `-${pduWidth + 10 * (zoomLevel / 100)}px`,
            top: `${pdu.offset}px`,
            width: `${pduWidth}px`,
            height: `${pduHeight}px`
          };
          break;
        case 'rear':
          positionStyle = {
            left: '50%',
            transform: 'translateX(-50%)',
            top: `${pdu.offset}px`,
            width: `${pduWidth * 0.7}px`,
            height: `${pduHeight}px`,
            zIndex: 1
          };
          break;
      }

      return (
        <div
          key={`pdu-${index}`}
          className={`absolute border-2 border-red-500 bg-red-600 opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
          style={positionStyle}
          title={`${pdu.equipment.name} (${pdu.position})`}
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs">
            <Zap size={Math.max(8, pduWidth * 0.4)} />
            <span className="writing-vertical-rl text-vertical transform rotate-180 mt-1 truncate">
              {pdu.equipment.name.substring(0, 8)}
            </span>
          </div>
          {/* PDUコンセント表現 */}
          <div className="absolute right-0 top-2 bottom-2 w-1 flex flex-col justify-around">
            {Array.from({ length: Math.floor(pduHeight / 20) }, (_, i) => (
              <div key={i} className="w-1 h-1 bg-yellow-400 rounded-full" />
            ))}
          </div>
        </div>
      );
    });
  };

  return <>{renderPDUs()}</>;
};
export {};