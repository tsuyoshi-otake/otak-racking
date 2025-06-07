import React from 'react';
import {
  Server,
  Network,
  Shield,
  HardDrive,
  Zap,
  Activity,
  Monitor,
  Eye,
  Snowflake,
  Package,
  Flame,
  Cable,
  Wrench,
  Settings,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Square,
  Wind
} from 'lucide-react';

// アイコン取得関数
export const getEquipmentIcon = (type: string, size: number) => {
  const iconProps = { size, className: "text-white" };
  
  switch (type) {
    case 'server': return <Server {...iconProps} />;
    case 'network': return <Network {...iconProps} />;
    case 'security': return <Shield {...iconProps} />;
    case 'storage': return <HardDrive {...iconProps} />;
    case 'pdu':
    case 'ups': return <Zap {...iconProps} />;
    case 'power': return <Activity {...iconProps} />;
    case 'console': return <Monitor {...iconProps} />;
    case 'monitoring': return <Eye {...iconProps} />;
    case 'cooling': return <Snowflake {...iconProps} />;
    case 'shelf': return <Package {...iconProps} />;
    case 'spiritual': return <Flame {...iconProps} />;
    case 'cable': return <Cable {...iconProps} />;
    case 'mounting': return <Wrench {...iconProps} />;
    case 'panel': return <Square {...iconProps} />;
    case 'other': return <Settings {...iconProps} />;
    default: return <Settings {...iconProps} />;
  }
};

// エアフローアイコン取得
export const getAirflowIcon = (airflow: string, size: number) => {
  const iconProps = { size };
  
  switch (airflow) {
    case 'front-to-rear': return <ArrowRight {...iconProps} className="text-custom-gray" />;
    case 'rear-to-front': return <ArrowLeft {...iconProps} className="text-gray-600" />;
    case 'side-to-side': return <ArrowUp {...iconProps} className="text-custom-gray" />;
    case 'intake': return <ArrowDown {...iconProps} className="text-gray-600" />;
    case 'exhaust': return <ArrowUp {...iconProps} className="text-gray-700" />;
    case 'blocking': return <Square {...iconProps} className="text-gray-800" />;
    default: return <Wind {...iconProps} className="text-gray-400" />;
  }
};

// 取り付け状態アイコン取得
export const getMountingIcon = (mountingType: string, needsRails: boolean, size: number) => {
  switch (mountingType) {
    case 'slide-rail':
      return <Settings size={size} className="text-gray-600" />;
    case 'fixed-rail':
      return <Settings size={size} className="text-custom-gray" />;
    case 'toolless-rail':
      return <Settings size={size} className="text-gray-600" />;
    case 'shelf':
      return <Package size={size} className="text-gray-700" />;
    case 'direct':
      return <Wrench size={size} className="text-gray-700" />;
    default:
      return needsRails ?
        <AlertCircle size={size} className="text-gray-800" /> :
        <CheckCircle size={size} className="text-gray-400" />;
  }
};
export {};