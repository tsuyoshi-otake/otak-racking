import React from 'react';
import { Rack } from '../types';

interface RackPDUProps {
  rack: Rack;
  zoomLevel: number;
  unitHeight: number;
  perspective: 'front' | 'rear' | 'left' | 'right';
  rackWidth: number;
  onPduInstall?: (side: 'left' | 'right', top: number) => void;
  onPduRemove?: (pduId: string) => void;
}

export const RackPDU: React.FC<RackPDUProps> = ({
  rack,
  zoomLevel,
  unitHeight,
  perspective,
  rackWidth,
  onPduInstall,
  onPduRemove
}) => {
  // PDU描画機能
  const renderPDUs = () => {
    if (!rack.pduPlacements || rack.pduPlacements.length === 0) return null;

    return rack.pduPlacements.map((pdu, index) => {
      const pduWidth = 12 * (zoomLevel / 100); // スロットと同じ幅
      const pduHeightU = Math.min(pdu.equipment.height, rack.units);
      const pduHeight = pduHeightU * unitHeight;

      const top = (rack.units - pduHeightU) * unitHeight / 2; // 中央に配置
      let positionStyle: React.CSSProperties = {
        top: `${top}px`,
        width: `${pduWidth}px`,
        height: `${pduHeight}px`,
      };

      if (pdu.position === 'left') {
        positionStyle.left = '-34px';
      } else if (pdu.position === 'right') {
        positionStyle.left = '620px';
      }
      positionStyle.border = '1px solid #181c23'; // 設置後の枠線

      return (
        <div
          key={`pdu-${index}`}
          className="absolute rounded-sm shadow-lg cursor-pointer hover:border-red-500"
          style={{...positionStyle, backgroundColor: '#181c23'}}
          title={`${pdu.equipment.name} - クリックして削除`}
          onClick={() => onPduRemove?.(pdu.id)}
        >
          {/* PDU本体の表示（文字なし） */}
        </div>
      );
    });
  };

  const renderPDUSlots = () => {
    if (perspective !== 'rear') return null;

    const slotWidth = 12 * (zoomLevel / 100);
    const slots = [];
    const pduHeightU = Math.min(42, rack.units);
    const slotHeight = pduHeightU * unitHeight;
    const top = (rack.units - pduHeightU) * unitHeight / 2; // 中央に配置

    // 左側のスロット
    const isLeftSlotFilled = rack.pduPlacements?.some(p => p.position === 'left');
    if (!isLeftSlotFilled) {
      slots.push(
        <div
          key="pdu-slot-left"
          className="absolute bg-gray-600 rounded-sm shadow-lg cursor-pointer hover:border-blue-500"
          style={{
            top: `${top}px`,
            left: '-34px',
            width: `${slotWidth}px`,
            height: `${slotHeight}px`,
            zIndex: 2,
            border: '1px dashed #3c4656', // 設置前の枠線
            opacity: 0.05
          }}
          title="PDUスロット (左)"
          onClick={() => onPduInstall?.('left', top)}
        >
          {/* PDUスロット左側（文字なし） */}
        </div>
      );
    }

    // 右側のスロット
    const isRightSlotFilled = rack.pduPlacements?.some(p => p.position === 'right');
    if (!isRightSlotFilled) {
      slots.push(
        <div
          key="pdu-slot-right"
          className="absolute bg-gray-600 rounded-sm shadow-lg cursor-pointer hover:border-blue-500"
          style={{
            top: `${top}px`,
            left: '620px',
            width: `${slotWidth}px`,
            height: `${slotHeight}px`,
            zIndex: 2,
            border: '1px dashed #3c4656', // 設置前の枠線
            opacity: 0.05
          }}
          title="PDUスロット (右)"
          onClick={() => onPduInstall?.('right', top)}
        >
          {/* PDUスロット右側（文字なし） */}
        </div>
      );
    }

    return slots;
  };

  return (
    <>
      {renderPDUs()}
      {renderPDUSlots()}
    </>
  );
};
export {};