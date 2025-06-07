import { Rack, Equipment, RackStats, TotalStats, CoolingStats, CageNutStatus, PowerSources } from './types';
import { rackTypes } from './constants';
import { placementManager } from './services/EquipmentPlacementManager';

/**
 * 個別ラック統計計算
 */
export const calculateRackStats = (rack: Rack): RackStats => {
  const equipmentArray = Object.values(rack.equipment).filter(item => item.isMainUnit || !item.startUnit);
  const totalPower = equipmentArray.reduce((sum, item) => sum + (item.power || 0), 0);
  const totalHeat = equipmentArray.reduce((sum, item) => sum + (item.heat || 0), 0);
  const totalWeight = equipmentArray.reduce((sum, item) => sum + (item.weight || 0), 0);
  const usedUnits = equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
  const availableUnits = rack.units - usedUnits;
  
  return { 
    totalPower, 
    totalHeat, 
    totalWeight, 
    usedUnits, 
    availableUnits
  };
};

/**
 * 全体統計計算
 */
export const calculateTotalStats = (racks: Record<string, Rack>): TotalStats => {
  let totalPower = 0;
  let totalHeat = 0;
  let totalWeight = 0;
  let totalUsedUnits = 0;
  let totalAvailableUnits = 0;
  let totalCost = 0;

  Object.values(racks).forEach(rack => {
    const equipmentArray = Object.values(rack.equipment).filter(item => item.isMainUnit || !item.startUnit);
    totalPower += equipmentArray.reduce((sum, item) => sum + (item.power || 0), 0);
    totalHeat += equipmentArray.reduce((sum, item) => sum + (item.heat || 0), 0);
    totalWeight += equipmentArray.reduce((sum, item) => sum + (item.weight || 0), 0);
    totalUsedUnits += equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
    totalAvailableUnits += rack.units - equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
    totalCost += rackTypes[rack.type].price;
  });

  return {
    totalPower,
    totalHeat,
    totalWeight,
    usedUnits: totalUsedUnits,
    availableUnits: totalAvailableUnits,
    totalUsedUnits,
    totalAvailableUnits,
    totalCost,
    rackCount: Object.keys(racks).length
  };
};

/**
 * 冷却・エアフロー計算
 */
export const calculateCoolingStats = (rack: Rack): CoolingStats => {
  let totalHeatGeneration = 0;
  let totalCFM = 0;
  let totalCoolingCapacity = 0;
  let airflowIssues: Array<{
    unit: number;
    item: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];
  
  const temperatureMap: Record<number, number> = {};
  let currentTemp = rack.environment.ambientTemp;
  
  for (let unit = 1; unit <= rack.units; unit++) {
    const item = rack.equipment[unit];
    if (item && item.isMainUnit) {
      totalHeatGeneration += item.heatGeneration || 0;
      totalCFM += item.cfm || 0;
      
      if (item.type === 'cooling') {
        totalCoolingCapacity += Math.abs(item.heatGeneration || 0);
      }
      
      const heatDensity = (item.heatGeneration || 0) / (item.cfm || 100);
      const tempRise = heatDensity * 0.1;
      currentTemp += tempRise;
      
      if (item.airflow === 'front-to-rear' && item.cfm < (item.heatGeneration || 0) / 10) {
        airflowIssues.push({
          unit,
          item: item.name,
          issue: '冷却能力不足',
          severity: 'high'
        });
      }
      
      if (item.airflow === 'blocking') {
        airflowIssues.push({
          unit,
          item: item.name,
          issue: 'エアフロー阻害',
          severity: 'medium'
        });
      }
    }
    
    temperatureMap[unit] = Math.round(currentTemp * 10) / 10;
    
    if (!item) {
      currentTemp = Math.max(currentTemp - 0.1, rack.environment.ambientTemp);
    }
  }
  
  const coolingEfficiency = totalCoolingCapacity > 0 ? 
    Math.min((totalCoolingCapacity / totalHeatGeneration) * 100, 100) : 0;
  
  const maxTemp = Math.max(...Object.values(temperatureMap));
  const minTemp = Math.min(...Object.values(temperatureMap));
  const avgTemp = Object.values(temperatureMap).reduce((a, b) => a + b, 0) / Object.values(temperatureMap).length;
  
  return {
    totalHeatGeneration,
    totalCFM,
    totalCoolingCapacity,
    coolingEfficiency: Math.round(coolingEfficiency),
    maxTemp: Math.round(maxTemp * 10) / 10,
    minTemp: Math.round(minTemp * 10) / 10,
    avgTemp: Math.round(avgTemp * 10) / 10,
    temperatureMap,
    airflowIssues,
    pressureDrop: Math.round(totalCFM * 0.001 * 100) / 100,
    thermalDesignPoint: totalHeatGeneration / (rack.units * 100)
  };
};

/**
 * ゲージナット状態取得
 */
export const getCageNutStatus = (unit: number, rack: Rack): CageNutStatus => {
  const cageNuts = rack.cageNuts[unit] || {
    frontLeft: { top: null, bottom: null },
    frontRight: { top: null, bottom: null },
    rearLeft: { top: null, bottom: null },
    rearRight: { top: null, bottom: null }
  };
  
  const allPositions = [
    cageNuts.frontLeft?.top, cageNuts.frontLeft?.bottom,
    cageNuts.frontRight?.top, cageNuts.frontRight?.bottom,
    cageNuts.rearLeft?.top, cageNuts.rearLeft?.bottom,
    cageNuts.rearRight?.top, cageNuts.rearRight?.bottom
  ];
  
  const installed = allPositions.filter(Boolean).length;
  return { installed, total: 8, isComplete: installed === 8 };
};

/**
 * 電源系統検索
 */
export const getPowerSources = (rack: Rack): PowerSources => {
  const pdus = Object.values(rack.equipment).filter(item => item.type === 'pdu' && item.isMainUnit);
  const upses = Object.values(rack.equipment).filter(item => item.type === 'ups' && item.isMainUnit);
  const cvcfs = Object.values(rack.equipment).filter(item => (item.id.includes('cvcf') || item.name.includes('CVCF')) && item.isMainUnit);
  const distributionPanels = Object.values(rack.equipment).filter(item => item.id.includes('distribution-panel') && item.isMainUnit);
  
  return {
    pdus,
    upses,
    cvcfs,
    distributionPanels,
    all: [...pdus, ...upses, ...cvcfs, ...distributionPanels]
  };
};

/**
 * レイアウト寸法計算
 */
export const calculateLayoutDimensions = (rackCount: number, windowWidth: number = window.innerWidth) => {
  const rackWidth = 320;
  const rackGap = 32;
  const totalContentWidth = (rackWidth * rackCount) + (rackGap * (rackCount - 1));
  
  return {
    rackCount,
    rackWidth,
    rackGap,
    totalContentWidth,
    needsScroll: totalContentWidth > (windowWidth - 400)
  };
};

/**
 * ズーム計算ユーティリティ
 */
export const getZoomedUnitHeight = (zoomLevel: number): number => {
  // リアルな比率に修正 (幅600pxに対して、1Uの高さを約55.2pxに設定)
  return Math.max(16, (55.2 * zoomLevel) / 100);
};

export const getZoomedFontSize = (zoomLevel: number): number => {
  const baseFontSize = 12;
  return Math.max(8, (baseFontSize * zoomLevel) / 100);
};

/**
 * 機器配置可能チェック（後方互換性のため同期版を維持）
 */
export const canPlaceEquipment = (
  rack: Rack,
  startUnit: number,
  equipment: Equipment
): { canPlace: boolean; reason?: string } => {
  const endUnit = startUnit + equipment.height - 1;
  
  // ユニット番号の妥当性チェック
  if (startUnit < 1) {
    return { canPlace: false, reason: 'ユニット番号は1以上である必要があります。' };
  }
  
  // ラック容量チェック
  if (endUnit > rack.units) {
    return { canPlace: false, reason: 'ラックの容量を超えています。' };
  }
  
  // 既存機器チェック
  for (let unit = startUnit; unit <= endUnit; unit++) {
    if (rack.equipment[unit]) {
      return { canPlace: false, reason: 'このユニットには既に機器が設置されています。' };
    }
  }
  
  // 神棚の場合は棚板チェック
  if (equipment.requiresShelf) {
    const shelfUnit = startUnit - 1;  // 神棚の下のユニット（棚板がある位置）
    const shelfItem = rack.equipment[shelfUnit];
    if (!shelfItem || shelfItem.type !== 'shelf') {
      return { canPlace: false, reason: '神棚は棚板の上にのみ設置できます。まず棚板を設置してください。' };
    }
  }
  
  return { canPlace: true };
};

/**
 * 機器配置可能チェック（新しいEquipmentPlacementManagerを使用）
 */
export const canPlaceEquipmentAdvanced = async (
  rack: Rack,
  startUnit: number,
  equipment: Equipment
): Promise<{ canPlace: boolean; reason?: string; warnings?: string[] }> => {
  const result = await placementManager.placeEquipment(rack, startUnit, equipment, {
    validateOnly: true
  });
  
  if (!result.success) {
    // エラーがある場合
    if (result.validation.errors.length > 0) {
      return {
        canPlace: false,
        reason: result.validation.errors[0].message
      };
    }
    
    // 警告のみの場合
    if (result.validation.warnings.length > 0) {
      return {
        canPlace: false,
        reason: result.validation.warnings[0].message,
        warnings: result.validation.warnings.map(w => w.message)
      };
    }
  }
  
  return {
    canPlace: true,
    warnings: result.validation.warnings.map(w => w.message)
  };
};

/**
 * ゲージナット自動設置
 */
export const autoInstallCageNuts = (unit: number, nutType: string = 'm6') => {
  return {
    frontLeft: { top: nutType, middle: nutType, bottom: nutType },
    frontRight: { top: nutType, middle: nutType, bottom: nutType },
    rearLeft: { top: nutType, middle: nutType, bottom: nutType },
    rearRight: { top: nutType, middle: nutType, bottom: nutType }
  };
};

/**
 * スタイルヘルパー関数
 */
export const getContainerStyle = (darkMode: boolean): string => {
  return darkMode ? 'bg-gray-800 text-gray-100' : 'bg-light-bg-primary text-light-text-primary';
};

export const getSidebarStyle = (darkMode: boolean): string => {
  return darkMode ? 'bg-gray-700 border-custom-gray text-gray-100' : 'bg-light-bg-secondary border-light-border-primary text-light-text-primary';
};

export const getButtonStyle = (darkMode: boolean, isActive: boolean = false): string => {
  if (isActive) {
    return darkMode ? 'bg-custom-gray text-white' : 'bg-light-accent text-white hover:bg-light-accent-hover';
  }
  return darkMode ? 'bg-gray-600 text-gray-200 hover:bg-custom-gray' : 'bg-light-bg-tertiary text-light-text-primary hover:bg-light-bg-hover border border-light-border-primary';
};

/**
 * ユニット表示ヘルパー
 */
export const getUnitBorderClass = (darkMode: boolean): string => {
  return darkMode ? 'border-custom-gray' : 'border-light-border-primary';
};

export const getEmptyUnitClass = (darkMode: boolean): string => {
  return darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-light-bg-secondary hover:bg-light-bg-hover';
};

export const getUnitNumClass = (darkMode: boolean): string => {
  return darkMode ? 'text-gray-300' : 'text-light-text-tertiary';
};

/**
 * 電源状態チェック
 */
export const getPowerStatus = (equipment: Equipment, powerConnections: any, darkMode: boolean = false) => {
  const connections = powerConnections[equipment.id] || {};
  
  if (equipment.dualPower) {
    const hasPrimary = connections.primarySource;
    const hasSecondary = connections.secondarySource;
    
    if (hasPrimary && hasSecondary) {
      return { status: 'ok', icon: 'CircleCheck', color: darkMode ? 'text-green-400' : 'text-green-600' };
    } else if (hasPrimary || hasSecondary) {
      return { status: 'warning', icon: 'AlertCircle', color: darkMode ? 'text-yellow-400' : 'text-yellow-600' };
    } else {
      return { status: 'error', icon: 'XCircle', color: 'text-red-500' };
    }
  } else {
    const hasPrimary = connections.primarySource;
    if (hasPrimary) {
      return { status: 'ok', icon: 'CircleCheck', color: darkMode ? 'text-green-400' : 'text-green-600' };
    } else {
      return { status: 'error', icon: 'XCircle', color: 'text-red-500' };
    }
  }
};

/**
 * 機器表示名取得
 */
export const getEquipmentDisplayName = (equipment: Equipment, labels: any): string => {
  const equipmentLabels = labels?.[equipment.id] || {};
  
  if (equipmentLabels.customName) {
    return equipmentLabels.customName;
  }
  
  return equipment.name;
};

/**
 * デバウンス関数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * ディープコピー
 */
export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};