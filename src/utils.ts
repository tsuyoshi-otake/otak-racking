import { Rack, Equipment, RackStats, TotalStats, CoolingStats, CageNutStatus, PowerSources, PowerStatus } from './types';
import { rackTypes, BASE_UNIT_HEIGHT, BASE_FONT_SIZE, BASE_MARGIN_LEFT, BASE_CAGE_NUT_SIZE } from './constants';
import { placementManager } from './services/EquipmentPlacementManager';

/**
 * 個別ラック統計計算（メモ化対応）
 */
const rackStatsCache = new WeakMap<Rack, { stats: RackStats; version: number }>();

export const calculateRackStats = (rack: Rack): RackStats => {
  // キャッシュチェック
  const cached = rackStatsCache.get(rack);
  const currentVersion = Object.keys(rack.equipment).length;
  
  if (cached && cached.version === currentVersion) {
    return cached.stats;
  }

  const equipmentArray = Object.values(rack.equipment).filter(item => item.isMainUnit || !item.startUnit);
  const totalPower = equipmentArray.reduce((sum, item) => sum + (item.power || 0), 0);
  const totalHeat = equipmentArray.reduce((sum, item) => sum + (item.heat || 0), 0);
  const totalWeight = equipmentArray.reduce((sum, item) => sum + (item.weight || 0), 0);
  const usedUnits = equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
  const availableUnits = rack.units - usedUnits;
  
  const stats = {
    totalPower,
    totalHeat,
    totalWeight,
    usedUnits,
    availableUnits
  };

  // キャッシュに保存
  rackStatsCache.set(rack, { stats, version: currentVersion });
  
  return stats;
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
 * 冷却・エアフロー計算（メモ化対応）
 */
const coolingStatsCache = new WeakMap<Rack, { stats: CoolingStats; version: string }>();

export const calculateCoolingStats = (rack: Rack): CoolingStats => {
  // キャッシュチェック
  const cacheKey = `${Object.keys(rack.equipment).length}-${rack.environment.ambientTemp}-${rack.fans.count}-${rack.fans.rpm}`;
  const cached = coolingStatsCache.get(rack);

  if (cached && cached.version === cacheKey) {
    return cached.stats;
  }

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

  // プレスキャン: ブランクパネル・エアフロー方向・占有率を集計
  let occupiedUnits = 0;
  let blankedUnits = 0;
  let trulyEmptyUnits = 0;
  const airflowDirections: Record<string, number> = {};
  let rearToFrontCount = 0;

  for (let unit = 1; unit <= rack.units; unit++) {
    const item = rack.equipment[unit];
    if (item) {
      if (item.isMainUnit !== false) {
        occupiedUnits += item.height || 1;
      }
      if (item.type === 'panel' && item.airflow === 'blocking') {
        blankedUnits += item.height || 1;
      }
      if (item.isMainUnit !== false && (item.heatGeneration || 0) > 0) {
        const dir = item.airflow;
        if (dir === 'front-to-rear' || dir === 'rear-to-front' || dir === 'side-to-side') {
          airflowDirections[dir] = (airflowDirections[dir] || 0) + 1;
        }
        if (dir === 'rear-to-front') {
          rearToFrontCount++;
        }
      }
    } else {
      trulyEmptyUnits++;
    }
  }

  // メインループ: 発熱量・CFM集計、温度マップ、個別機器の警告
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
        // ブランクパネル: 気流分離で微小冷却
        currentTemp = Math.max(currentTemp - 0.1, rack.environment.ambientTemp);
      }
    }

    if (!item) {
      // 空きU: ブランクパネル無しで熱気再循環
      currentTemp += 0.05;
    }

    temperatureMap[unit] = Math.round(currentTemp * 10) / 10;
  }

  // === 多因子冷却効率計算（ASHRAE TC 9.9準拠） ===
  let coolingEfficiency = 0;

  if (totalHeatGeneration > 0) {
    // Factor 1: ブランクパネル充填率（最重要）
    const emptyUnits = rack.units - occupiedUnits;
    const blankableUnits = emptyUnits + blankedUnits;
    const blankingCoverage = blankableUnits > 0 ? blankedUnits / blankableUnits : 1.0;
    const blankingFactor = 0.60 + (0.40 * blankingCoverage);

    // Factor 2: エアフロー方向一貫性
    const directionValues = Object.values(airflowDirections);
    const totalDirectional = directionValues.reduce((a, b) => a + b, 0);
    const dominantCount = directionValues.length > 0 ? Math.max(...directionValues) : 0;
    let airflowConsistencyFactor = 1.0;
    if (totalDirectional > 1) {
      const consistencyRatio = dominantCount / totalDirectional;
      airflowConsistencyFactor = 0.70 + (0.30 * consistencyRatio);
      airflowConsistencyFactor -= (rearToFrontCount / totalDirectional) * 0.10;
      airflowConsistencyFactor = Math.max(airflowConsistencyFactor, 0.60);
    }

    // Factor 3: CFM充足率
    const fanCfm = rack.fans.count * (rack.fans.rpm / 3000) * 100;
    const availableCfm = totalCFM + fanCfm;
    const requiredCfm = totalHeatGeneration * 0.05;
    const cfmRatio = requiredCfm > 0 ? availableCfm / requiredCfm : 1.0;
    const cfmAdequacyFactor = Math.min(Math.max(0.30 + 0.70 * (cfmRatio / 1.5), 0.30), 1.0);

    // Factor 4: ラックファン有無
    const fanBoostFactor = (rack.fans.count > 0 && rack.fans.rpm > 0) ? 1.0 : 0.90;

    coolingEfficiency = 95 * blankingFactor * airflowConsistencyFactor * cfmAdequacyFactor * fanBoostFactor;
    coolingEfficiency = Math.min(Math.max(coolingEfficiency, 0), 100);
  }

  // === ラックレベルのエアフロー警告 ===
  if (trulyEmptyUnits > 0 && totalHeatGeneration > 0) {
    const emptyRatio = trulyEmptyUnits / rack.units;
    airflowIssues.push({
      unit: 0,
      item: 'ラック',
      issue: `ブランクパネル未設置 (${trulyEmptyUnits}U空き)`,
      severity: emptyRatio > 0.5 ? 'high' : emptyRatio > 0.25 ? 'medium' : 'low'
    });
  }

  if (rearToFrontCount > 0 && totalHeatGeneration > 0) {
    airflowIssues.push({
      unit: 0,
      item: 'ラック',
      issue: `逆方向エアフロー機器あり (${rearToFrontCount}台)`,
      severity: 'high'
    });
  }

  if (rack.fans.count === 0 && totalHeatGeneration > 0) {
    airflowIssues.push({
      unit: 0,
      item: 'ラック',
      issue: 'ラックファン未設置',
      severity: 'medium'
    });
  }

  const tempValues = Object.values(temperatureMap);
  const maxTemp = Math.max(...tempValues);
  const minTemp = Math.min(...tempValues);
  const avgTemp = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;

  const stats = {
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

  // キャッシュに保存
  coolingStatsCache.set(rack, { stats, version: cacheKey });

  return stats;
};

/**
 * ゲージナット状態取得
 */
export const getCageNutStatus = (unit: number, rack: Rack): CageNutStatus => {
  const cageNuts = rack.cageNuts[unit] || {
    frontLeft: { top: null, middle: null, bottom: null },
    frontRight: { top: null, middle: null, bottom: null },
    rearLeft: { top: null, middle: null, bottom: null },
    rearRight: { top: null, middle: null, bottom: null }
  };
  
  // 1ユニット機器では上段と下段のみ必要（真ん中は不要）
  const requiredPositions = [
    cageNuts.frontLeft?.top, cageNuts.frontLeft?.bottom,
    cageNuts.frontRight?.top, cageNuts.frontRight?.bottom,
    cageNuts.rearLeft?.top, cageNuts.rearLeft?.bottom,
    cageNuts.rearRight?.top, cageNuts.rearRight?.bottom
  ];
  
  const installed = requiredPositions.filter(Boolean).length;
  return { installed, total: 8, isComplete: installed === 8 };
};

/**
 * 電源系統検索
 */
export const getPowerSources = (rack: Rack): PowerSources => {
  const equipmentPowerSources = Object.values(rack.equipment).filter(item =>
    (item.role === 'power-source' || item.role === 'power-distribution') && item.isMainUnit
  );

  const pduPowerSources = (rack.pduPlacements || []).map(pduPlacement => pduPlacement.equipment);

  const allPowerSources = [...equipmentPowerSources, ...pduPowerSources];

  const pdus = allPowerSources.filter(item => item.type === 'pdu');
  const upses = allPowerSources.filter(item => item.type === 'ups');
  const cvcfs = allPowerSources.filter(item => item.id.includes('cvcf') || item.name.includes('CVCF'));
  const distributionPanels = allPowerSources.filter(item => item.id.includes('distribution-panel'));

  return {
    pdus,
    upses,
    cvcfs,
    distributionPanels,
    all: allPowerSources
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
  return Math.max(16, (BASE_UNIT_HEIGHT * zoomLevel) / 100);
};

export const getZoomedFontSize = (zoomLevel: number): number => {
  return Math.max(8, (BASE_FONT_SIZE * zoomLevel) / 100);
};

export const getZoomedMarginLeft = (zoomLevel: number): number => {
  return (BASE_MARGIN_LEFT * zoomLevel) / 100;
};

export const getZoomedCageNutSize = (zoomLevel: number): number => {
  return BASE_CAGE_NUT_SIZE * (zoomLevel / 250);
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
  // 1ユニット機器では上段と下段のみ設置（真ん中は不要）
  return {
    frontLeft: { top: nutType, middle: null, bottom: nutType },
    frontRight: { top: nutType, middle: null, bottom: nutType },
    rearLeft: { top: nutType, middle: null, bottom: nutType },
    rearRight: { top: nutType, middle: null, bottom: nutType }
  };
};

/**
 * スタイルヘルパー関数（定数化）
 */
export const getContainerStyle = (): string => 'bg-gray-800 text-gray-100';

export const getSidebarStyle = (): string => 'bg-gray-700 border-custom-gray text-gray-100';

export const getButtonStyle = (isActive: boolean = false): string =>
  isActive ? 'bg-custom-gray text-gray-200' : 'bg-gray-600 text-gray-200 hover:bg-custom-gray';

/**
 * ユニット表示ヘルパー（定数化）
 */
export const getUnitBorderClass = (): string => 'border-custom-gray';

export const getEmptyUnitClass = (): string => 'bg-gray-700 hover:bg-gray-600';

export const getUnitNumClass = (): string => 'text-gray-300';

/**
 * 電源状態チェック
 */
export const getPowerStatus = (equipment: Equipment, powerConnections: any): PowerStatus => {
  const connections = powerConnections[equipment.id] || {};
  
  // 電源不要機器の場合
  if (!equipment.power || equipment.power === 0) {
    return {
      status: 'not-required',
      icon: 'Minus',
      color: 'text-gray-400',
      message: '電源接続不要'
    };
  }
  
  // 冗長電源搭載機器の場合
  if (equipment.dualPower) {
    const hasPrimary = connections.primaryPduId && connections.primaryPduOutlet;
    const hasSecondary = connections.secondaryPduId && connections.secondaryPduOutlet;
    
    // セカンダリ電源を使用しない場合は単一電源として扱う
    if (equipment.useSecondaryPower === false) {
      if (hasPrimary) {
        return {
          status: 'ok',
          icon: 'CircleCheck',
          color: 'text-green-400',
          message: '電源設定完了（単一電源モード）'
        };
      } else {
        return {
          status: 'error',
          icon: 'XCircle',
          color: 'text-red-500',
          message: '電源が未接続です'
        };
      }
    } else {
      // セカンダリ電源を使用する場合：両方の電源接続が必要
      if (hasPrimary && hasSecondary) {
        return {
          status: 'ok',
          icon: 'CircleCheck',
          color: 'text-green-400',
          message: '電源設定完了（冗長構成）'
        };
      } else if (hasPrimary || hasSecondary) {
        return {
          status: 'warning',
          icon: 'AlertCircle',
          color: 'text-yellow-400',
          message: '冗長電源が未設定です'
        };
      } else {
        return {
          status: 'error',
          icon: 'XCircle',
          color: 'text-red-500',
          message: '電源が未接続です'
        };
      }
    }
  } else {
    // 単一電源機器の場合
    const hasPrimary = connections.primaryPduId && connections.primaryPduOutlet;
    if (hasPrimary) {
      return {
        status: 'ok',
        icon: 'CircleCheck',
        color: 'text-green-400',
        message: '電源設定完了'
      };
    } else {
      return {
        status: 'error',
        icon: 'XCircle',
        color: 'text-red-500',
        message: '電源が未接続です'
      };
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