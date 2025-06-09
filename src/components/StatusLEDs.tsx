import React from 'react';

interface StatusLEDsProps {
  powerStatus: 'ok' | 'warning' | 'error' | 'not-required';
  healthStatus: 'normal' | 'error';
}

export const StatusLEDs: React.FC<StatusLEDsProps> = ({ powerStatus, healthStatus }) => {
  // 電源LEDの色を決定
  const getPowerLEDColor = () => {
    switch (powerStatus) {
      case 'ok':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-gray-600';
      case 'not-required':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  // ヘルスLEDの色を決定
  const getHealthLEDColor = () => {
    switch (healthStatus) {
      case 'normal':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      {/* 電源LED */}
      <div
        className={`w-1 h-1 rounded-full ${getPowerLEDColor()}`}
        title={`電源: ${powerStatus === 'ok' ? '正常' : powerStatus === 'warning' ? '警告' : 'エラー'}`}
      />
      {/* ヘルスLED */}
      <div
        className={`w-1 h-1 rounded-full ${getHealthLEDColor()}`}
        title={`ヘルス: ${healthStatus === 'normal' ? '正常' : 'エラー'}`}
      />
    </div>
  );
};