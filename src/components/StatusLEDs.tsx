import React from 'react';

interface StatusLEDsProps {
  powerStatus: 'ok' | 'warning' | 'error' | 'not-required';
  healthStatus: 'normal' | 'error';
  powerOn?: boolean;
  onPowerToggle?: () => void;
  zoomLevel?: number;
}

export const StatusLEDs: React.FC<StatusLEDsProps> = ({ powerStatus, healthStatus, powerOn = true, onPowerToggle, zoomLevel = 100 }) => {
  // ズームレベルに応じたサイズ計算（75%サイズ）
  const scaleFactor = zoomLevel / 100;
  const ledSize = 6 * scaleFactor * 0.75; // 基準6px × 75%
  const fontSize = 8 * scaleFactor * 0.75; // 基準8px × 75%
  const labelWidth = 24 * scaleFactor * 0.75; // 基準24px × 75%
  const containerHeight = 12 * scaleFactor * 0.75; // 基準12px × 75%
  const gap = 4 * scaleFactor * 0.75; // 基準4px × 75%
  // 電源LEDの色を決定（電源ON/OFF状態も考慮）
  const getPowerLEDColor = () => {
    // 電源不要機器の場合
    if (powerStatus === 'not-required') {
      return 'bg-gray-600';
    }
    
    // PDU両方未接続の場合は消灯（電源ON/OFF関係なく）
    if (powerStatus === 'error') {
      return 'bg-gray-600';
    }
    
    // 電源がOFFの場合は常にグレー
    if (!powerOn) {
      return 'bg-gray-600';
    }
    
    // 電源がONで接続がある場合は接続状態に応じて色を決定
    switch (powerStatus) {
      case 'ok':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-600';
    }
  };

  // ヘルスLEDの色を決定（電源状態も考慮）
  const getHealthLEDColor = () => {
    // 電源を必要としない機器の場合はヘルスも表示しない（消灯）
    if (powerStatus === 'not-required') {
      return 'bg-gray-600';
    }
    
    // 電源がOFFの場合はヘルスも消灯
    if (!powerOn) {
      return 'bg-gray-600';
    }
    
    // PDU両方未接続なら消灯
    if (powerStatus === 'error') {
      return 'bg-gray-600';
    }
    
    // PDU片方接続なら異常（警告状態）
    if (powerStatus === 'warning') {
      return 'bg-red-500';
    }
    
    // PDU両方接続なら正常（ヘルス状態に応じて表示）
    if (powerStatus === 'ok') {
      switch (healthStatus) {
        case 'normal':
          return 'bg-green-500';
        case 'error':
          return 'bg-red-500';
        default:
          return 'bg-green-500';
      }
    }
    
    // デフォルト（念のため）
    return 'bg-gray-600';
  };

  return (
    <div className="flex flex-col" style={{ gap: '0px' }}>
      {/* 電源LED */}
      <div
        className="flex items-center justify-start"
        style={{ gap: `${gap}px`, height: `${containerHeight}px` }}
      >
        <span
          className="text-gray-400 font-mono text-right leading-none"
          style={{
            fontSize: `${fontSize}px`,
            width: `${labelWidth}px`
          }}
        >
          Power
        </span>
        <div
          className={`${getPowerLEDColor()} ${onPowerToggle ? 'cursor-pointer hover:opacity-80' : ''}`}
          style={{
            width: `${ledSize}px`,
            height: `${ledSize}px`
          }}
          title={`電源: ${powerOn ? 'ON' : 'OFF'} (${powerStatus === 'ok' ? '正常' : powerStatus === 'warning' ? '警告' : 'エラー'}) ${onPowerToggle ? 'クリックで切り替え' : ''}`}
          onClick={onPowerToggle}
        />
      </div>
      {/* ヘルスLED */}
      <div
        className="flex items-center justify-start"
        style={{ gap: `${gap}px`, height: `${containerHeight}px` }}
      >
        <span
          className="text-gray-400 font-mono text-right leading-none"
          style={{
            fontSize: `${fontSize}px`,
            width: `${labelWidth}px`
          }}
        >
          Health
        </span>
        <div
          className={`${getHealthLEDColor()}`}
          style={{
            width: `${ledSize}px`,
            height: `${ledSize}px`
          }}
          title={`ヘルス: ${healthStatus === 'normal' ? '正常' : 'エラー'}`}
        />
      </div>
    </div>
  );
};