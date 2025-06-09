import LZString from 'lz-string';
import { ShareableData, CompressionStats, ShareResult, Rack, FloorSettings, RackViewPerspective } from '../types';

// URL長制限（ブラウザの制限を考慮）
const MAX_URL_LENGTH = 32000;

/**
 * データを最適化してサイズを削減
 */
function optimizeDataForCompression(data: ShareableData): ShareableData {
  const optimized: ShareableData = {
    version: data.version,
    timestamp: data.timestamp,
    selectedRack: data.selectedRack,
    zoomLevel: data.zoomLevel,
    racks: {},
    floorSettings: data.floorSettings,
    activeViewMode: data.activeViewMode,
    rackViewPerspective: data.rackViewPerspective,
    isProMode: data.isProMode
  };

  // ラックデータの最適化
  Object.entries(data.racks).forEach(([rackId, rack]) => {
    const optimizedRack: any = {
      id: rack.id,
      name: rack.name,
      type: rack.type,
      units: rack.units,
      depth: rack.depth,
      width: rack.width,
      equipment: {},
      position: rack.position
    };

    // 機器データの最適化（デフォルト値を除外）
    Object.entries(rack.equipment).forEach(([unit, equipment]) => {
      const optimizedEquipment: any = {
        id: equipment.id,
        name: equipment.name,
        height: equipment.height,
        type: equipment.type,
        color: equipment.color
      };

      // デフォルト値ではない場合のみ追加
      if (equipment.depth !== 0) optimizedEquipment.depth = equipment.depth;
      if (equipment.power !== 0) optimizedEquipment.power = equipment.power;
      if (equipment.heat !== 0) optimizedEquipment.heat = equipment.heat;
      if (equipment.weight !== 0) optimizedEquipment.weight = equipment.weight;
      if (equipment.opacity !== undefined && equipment.opacity !== 100) {
        optimizedEquipment.opacity = equipment.opacity;
      }
      if (equipment.dualPower) optimizedEquipment.dualPower = equipment.dualPower;
      if (equipment.airflow !== 'front-to-rear') optimizedEquipment.airflow = equipment.airflow;
      if (equipment.cfm !== 0) optimizedEquipment.cfm = equipment.cfm;
      if (equipment.heatGeneration !== 0) optimizedEquipment.heatGeneration = equipment.heatGeneration;
      if (equipment.description) optimizedEquipment.description = equipment.description;
      if (equipment.specifications) optimizedEquipment.specifications = equipment.specifications;
      if (equipment.mountingNotes) optimizedEquipment.mountingNotes = equipment.mountingNotes;
      if (equipment.startUnit !== undefined) optimizedEquipment.startUnit = equipment.startUnit;
      if (equipment.endUnit !== undefined) optimizedEquipment.endUnit = equipment.endUnit;
      if (equipment.isMainUnit !== undefined) optimizedEquipment.isMainUnit = equipment.isMainUnit;
      if (equipment.mountingMethod) optimizedEquipment.mountingMethod = equipment.mountingMethod;
      if (equipment.requiresRails) optimizedEquipment.requiresRails = equipment.requiresRails;
      if (equipment.requiresCageNuts) optimizedEquipment.requiresCageNuts = equipment.requiresCageNuts;
      if (equipment.role) optimizedEquipment.role = equipment.role;
      if (equipment.availableSizes) optimizedEquipment.availableSizes = equipment.availableSizes;
      if (equipment.selectedSize !== undefined) optimizedEquipment.selectedSize = equipment.selectedSize;

      optimizedRack.equipment[unit] = optimizedEquipment;
    });

    // 空でないデータのみ追加
    if (Object.keys(rack.powerConnections).length > 0) {
      optimizedRack.powerConnections = rack.powerConnections;
    }
    if (Object.keys(rack.mountingOptions).length > 0) {
      optimizedRack.mountingOptions = rack.mountingOptions;
    }
    if (Object.keys(rack.labels).length > 0) {
      optimizedRack.labels = rack.labels;
    }
    if (Object.keys(rack.cageNuts).length > 0) {
      optimizedRack.cageNuts = rack.cageNuts;
    }
    if (Object.keys(rack.rails).length > 0) {
      optimizedRack.rails = rack.rails;
    }
    if (Object.keys(rack.partInventory).length > 0) {
      optimizedRack.partInventory = rack.partInventory;
    }

    // デフォルト値ではない場合のみ追加
    if (rack.fans.count !== 4 || rack.fans.rpm !== 3000) {
      optimizedRack.fans = rack.fans;
    }
    if (rack.cabling && (
      Object.keys(rack.cabling.external).length > 0 ||
      Object.keys(rack.cabling.overhead).length > 0 ||
      Object.keys(rack.cabling.underfloor).length > 0
    )) {
      optimizedRack.cabling = rack.cabling;
    }
    if (rack.housing.type !== 'full' || 
        rack.housing.startUnit !== 1 || 
        rack.housing.endUnit !== rack.units ||
        rack.housing.frontPanel !== 'perforated' ||
        rack.housing.rearPanel !== 'perforated') {
      optimizedRack.housing = rack.housing;
    }
    if (rack.environment.ambientTemp !== 22 ||
        rack.environment.humidity !== 45 ||
        rack.environment.pressureDiff !== 0.2) {
      optimizedRack.environment = rack.environment;
    }
    if (rack.pduPlacements && rack.pduPlacements.length > 0) {
      optimizedRack.pduPlacements = rack.pduPlacements;
    }
    if (rack.physicalStructure) {
      optimizedRack.physicalStructure = rack.physicalStructure;
    }

    optimized.racks[rackId] = optimizedRack;
  });

  // フロア設定の最適化（デフォルト値と異なる場合のみ）
  const defaultFloorSettings = {
    hasAccessFloor: true,
    floorHeight: 600,
    tileSize: 600,
    supportType: 'adjustable',
    loadCapacity: 'heavy',
    cableRouting: {
      power: 'underfloor',
      data: 'underfloor',
      fiber: 'overhead'
    }
  };

  const optimizedFloorSettings: any = {};
  Object.entries(data.floorSettings).forEach(([key, value]) => {
    if (JSON.stringify(value) !== JSON.stringify((defaultFloorSettings as any)[key])) {
      optimizedFloorSettings[key] = value;
    }
  });

  if (Object.keys(optimizedFloorSettings).length > 0) {
    optimized.floorSettings = optimizedFloorSettings as FloorSettings;
  } else {
    // デフォルト値の場合は空オブジェクトにして圧縮効率を上げる
    optimized.floorSettings = {} as FloorSettings;
  }

  // デフォルト値の除外
  if (data.activeViewMode === null) {
    delete (optimized as any).activeViewMode;
  }
  if (data.rackViewPerspective === 'front') {
    delete (optimized as any).rackViewPerspective;
  }
  if (data.isProMode === false) {
    delete (optimized as any).isProMode;
  }
  if (data.zoomLevel === 100) {
    delete (optimized as any).zoomLevel;
  }

  return optimized;
}

/**
 * 最適化されたデータから元のデータ構造を復元
 */
function restoreDataFromOptimized(optimized: any): ShareableData {
  // デフォルト値を復元
  const restored: ShareableData = {
    version: optimized.version || '1.0.0',
    timestamp: optimized.timestamp || Date.now(),
    selectedRack: optimized.selectedRack || 'rack-1',
    activeViewMode: optimized.activeViewMode || null,
    rackViewPerspective: optimized.rackViewPerspective || 'front',
    isProMode: optimized.isProMode || false,
    zoomLevel: optimized.zoomLevel || 100,
    racks: {},
    floorSettings: {
      hasAccessFloor: true,
      floorHeight: 600,
      tileSize: 600,
      supportType: 'adjustable',
      loadCapacity: 'heavy',
      cableRouting: {
        power: 'underfloor',
        data: 'underfloor',
        fiber: 'overhead'
      },
      ...optimized.floorSettings
    }
  };

  // ラックデータの復元
  Object.entries(optimized.racks || {}).forEach(([rackId, rack]: [string, any]) => {
    const restoredRack: any = {
      id: rack.id,
      name: rack.name,
      type: rack.type || '42u-standard',
      units: rack.units || 42,
      depth: rack.depth || 1000,
      width: rack.width || 600,
      equipment: {},
      powerConnections: rack.powerConnections || {},
      mountingOptions: rack.mountingOptions || {},
      labels: rack.labels || {},
      cageNuts: rack.cageNuts || {},
      rails: rack.rails || {},
      partInventory: rack.partInventory || {},
      fans: rack.fans || { count: 4, rpm: 3000 },
      position: rack.position || { row: 'A', column: 1 },
      cabling: rack.cabling || {
        external: {},
        overhead: {},
        underfloor: {}
      },
      housing: rack.housing || {
        type: 'full',
        startUnit: 1,
        endUnit: rack.units || 42,
        frontPanel: 'perforated',
        rearPanel: 'perforated'
      },
      environment: rack.environment || {
        ambientTemp: 22,
        humidity: 45,
        pressureDiff: 0.2
      },
      pduPlacements: rack.pduPlacements || [],
      physicalStructure: rack.physicalStructure
    };

    // 機器データの復元
    Object.entries(rack.equipment || {}).forEach(([unit, equipment]: [string, any]) => {
      const restoredEquipment = {
        id: equipment.id,
        name: equipment.name,
        height: equipment.height,
        depth: equipment.depth || 0,
        power: equipment.power || 0,
        heat: equipment.heat || 0,
        weight: equipment.weight || 0,
        type: equipment.type,
        color: equipment.color,
        opacity: equipment.opacity !== undefined ? equipment.opacity : 100,
        dualPower: equipment.dualPower || false,
        airflow: equipment.airflow || 'front-to-rear',
        cfm: equipment.cfm || 0,
        heatGeneration: equipment.heatGeneration || 0,
        description: equipment.description || '',
        specifications: equipment.specifications,
        mountingNotes: equipment.mountingNotes,
        startUnit: equipment.startUnit,
        endUnit: equipment.endUnit,
        isMainUnit: equipment.isMainUnit,
        mountingMethod: equipment.mountingMethod,
        requiresRails: equipment.requiresRails,
        requiresCageNuts: equipment.requiresCageNuts,
        role: equipment.role,
        availableSizes: equipment.availableSizes,
        selectedSize: equipment.selectedSize
      };

      restoredRack.equipment[unit] = restoredEquipment;
    });

    restored.racks[rackId] = restoredRack;
  });

  return restored;
}

/**
 * データを圧縮
 */
export function compressData(data: ShareableData): string {
  try {
    // データを最適化してからJSON化
    const optimizedData = optimizeDataForCompression(data);
    const jsonString = JSON.stringify(optimizedData);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    
    if (!compressed) {
      throw new Error('圧縮に失敗しました');
    }
    
    return compressed;
  } catch (error) {
    console.error('データ圧縮エラー:', error);
    throw new Error('データの圧縮中にエラーが発生しました');
  }
}

/**
 * UTF-8文字列をBase64エンコード（日本語対応）
 */
function utf8ToBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

/**
 * Base64からUTF-8文字列にデコード（日本語対応）
 */
function base64ToUtf8(str: string): string {
  return decodeURIComponent(atob(str).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

/**
 * データを解凍（Base64フォールバック対応）
 */
export function decompressData(
  compressedData: string,
  fallbackToBase64: boolean = false
): ShareableData | null {
  try {
    // まずLZ-Stringで展開を試行
    const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
    
    if (decompressed) {
      const parsed = JSON.parse(decompressed);
      return restoreDataFromOptimized(parsed);
    }
    
    // LZ-Stringで失敗した場合、Base64フォールバックを試行
    if (fallbackToBase64) {
      try {
        const base64Decoded = base64ToUtf8(compressedData);
        const parsed = JSON.parse(base64Decoded);
        return restoreDataFromOptimized(parsed);
      } catch (base64Error) {
        console.warn('Base64フォールバックも失敗:', base64Error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('データ展開エラー:', error);
    return null;
  }
}

/**
 * 圧縮効率を比較
 */
export function compareCompressionEfficiency(data: ShareableData): CompressionStats {
  const originalJson = JSON.stringify(data);
  const lzCompressed = compressData(data);
  const base64Compressed = utf8ToBase64(originalJson);
  
  const originalSize = originalJson.length;
  const lzSize = lzCompressed.length;
  const base64Size = base64Compressed.length;
  
  return {
    original: originalSize,
    compressed: lzSize,
    ratio: (lzSize / originalSize) * 100,
    improvement: ((base64Size - lzSize) / base64Size) * 100
  };
}

/**
 * 共有URLを生成
 */
export function generateShareUrl(data: ShareableData): ShareResult {
  try {
    const compressed = compressData(data);
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?data=${compressed}`;
    
    if (shareUrl.length > MAX_URL_LENGTH) {
      return {
        success: false,
        error: `URLが長すぎます（${shareUrl.length}文字）。データを簡素化してください。`
      };
    }
    
    const stats = compareCompressionEfficiency(data);
    
    return {
      success: true,
      url: shareUrl,
      stats
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * URLからデータを読み込み
 */
export function loadDataFromUrl(): ShareableData | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const compressedData = urlParams.get('data');
    
    if (!compressedData) {
      return null;
    }
    
    return decompressData(compressedData, true);
  } catch (error) {
    console.error('URLからのデータ読み込みエラー:', error);
    return null;
  }
}

/**
 * 現在のアプリ状態から共有可能なデータを作成
 */
export function createShareableData(
  racks: Record<string, Rack>,
  floorSettings: FloorSettings,
  selectedRack: string,
  activeViewMode: string | null,
  rackViewPerspective: RackViewPerspective,
  isProMode: boolean,
  zoomLevel: number
): ShareableData {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    racks,
    floorSettings,
    selectedRack,
    activeViewMode,
    rackViewPerspective,
    isProMode,
    zoomLevel
  };
}