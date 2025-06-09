import React from 'react';
import { Equipment, EquipmentSize } from '../types';

interface EquipmentSizeSelectorProps {
  equipment: Equipment;
  onSizeChange: (newHeight: number) => void;
}

const EquipmentSizeSelector: React.FC<EquipmentSizeSelectorProps> = ({ 
  equipment, 
  onSizeChange 
}) => {
  if (!equipment.availableSizes || equipment.availableSizes.length <= 1) {
    return null;
  }

  const currentSize = equipment.selectedSize || equipment.height;

  const handleSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newHeight = parseInt(event.target.value);
    onSizeChange(newHeight);
  };

  const getSizeDisplayName = (size: EquipmentSize) => {
    return `${size.height}U (${size.power}W, ${Math.round(size.weight)}kg)`;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        サイズ選択
      </label>
      <select
        value={currentSize}
        onChange={handleSizeChange}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {equipment.availableSizes.map((size) => (
          <option key={size.height} value={size.height}>
            {getSizeDisplayName(size)}
          </option>
        ))}
      </select>
      
      {/* 選択されたサイズの詳細情報 */}
      {equipment.availableSizes.map((size) => {
        if (size.height === currentSize) {
          return (
            <div key={size.height} className="mt-3 p-3 bg-gray-800 rounded-md">
              <h4 className="text-sm font-medium text-gray-300 mb-2">仕様詳細</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>消費電力: {size.power}W</div>
                <div>発熱量: {size.heatGeneration}BTU/h</div>
                <div>重量: {size.weight}kg</div>
                <div>冷却風量: {size.cfm}CFM</div>
              </div>
              {size.specifications && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500">追加仕様:</div>
                  {Object.entries(size.specifications).map(([key, value]) => (
                    <div key={key} className="text-xs text-gray-400">
                      {key}: {value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default EquipmentSizeSelector;