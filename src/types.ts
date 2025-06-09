// 基本的な型定義
export interface Equipment {
  id: string;
  name: string;
  height: number;
  depth: number;
  power: number;
  heat: number;
  weight: number;
  type: string;
  color: string;
  opacity?: number; // 0-100
  dualPower: boolean;
  airflow: string;
  cfm: number;
  heatGeneration: number;
  description: string;
  specifications?: Record<string, string>;
  mountingNotes?: string;
  
  // ラック配置関連
  startUnit?: number;
  endUnit?: number;
  isMainUnit?: boolean;
  
  // 取り付け方法
  mountingMethod?: 'rails' | 'cage-nuts' | 'direct';
  requiresRails?: boolean;
  requiresCageNuts?: boolean;
  requiresShelf?: boolean;
  
  // 特殊プロパティ
  pduType?: string;
  nutType?: string;
  screwType?: string;
  washerType?: string;
  system?: string;
  role?: EquipmentRole;
  
  // サイズバリエーション機能
  availableSizes?: EquipmentSize[];
  selectedSize?: number; // 選択されたサイズ（height）
  powerOutlets?: PowerOutlet[];
}

export interface PowerOutlet {
  id: number;
  type: string;
  inUse: boolean;
  connectedEquipmentId?: string | null;
}

export interface EquipmentSize {
  height: number; // 1, 2, 4
  power: number;
  heat: number;
  weight: number;
  cfm: number;
  heatGeneration: number;
  specifications?: Record<string, string>;
  priceMultiplier?: number; // 基本価格からの倍率
}

export type EquipmentRole = 'compute' | 'network' | 'storage' | 'power-source' | 'power-distribution' | 'cooling' | 'security' | 'monitoring' | 'accessory' | 'other';

export interface RackType {
  name: string;
  units: number;
  depth: number;
  width: number;
  maxWeight: number;
  price: number;
  description: string;
}

export interface CageNutPosition {
  top: string | null;
  middle: string | null;
  bottom: string | null;
}

export interface CageNutConfig {
  frontLeft: CageNutPosition;
  frontRight: CageNutPosition;
  rearLeft: CageNutPosition;
  rearRight: CageNutPosition;
}

export interface PowerConnection {
  primarySource: string | null;
  primaryType: string;
  secondarySource?: string | null;
  secondaryType?: string;
  powerPath: 'single' | 'redundant';
  primaryPduId?: string | null;
  primaryPduOutlet?: number | null;
  secondaryPduId?: string | null;
  secondaryPduOutlet?: number | null;
}

export interface MountingOption {
  type: 'none' | 'shelf' | 'direct';
  hasShelf: boolean;
  hasCableArm: boolean;
}

export interface Label {
  customName: string;
  ipAddress: string;
  serialNumber: string;
  owner: string;
  purpose: string;
  installDate: string;
  notes: string;
}

export interface Position {
  row: string;
  column: number;
}

export interface CablingConfig {
  external: Record<string, any>;
  overhead: Record<string, any>;
  underfloor: Record<string, any>;
}

export interface HousingConfig {
  type: 'full' | 'partial';
  startUnit: number;
  endUnit: number;
  frontPanel: 'solid' | 'perforated' | 'glass';
  rearPanel: 'solid' | 'perforated' | 'mesh';
}

export interface EnvironmentConfig {
  ambientTemp: number;
  humidity: number;
  pressureDiff: number;
}

export interface FanConfig {
  count: number;
  rpm: number;
}

export interface PDUPlacement {
  id: string;
  equipment: Equipment;
  position: 'left' | 'right' | 'rear';
  offset: number; // ラック上端からのオフセット（mm）
  orientation: 'vertical' | 'horizontal';
}


export interface Rack {
  id: string;
  name: string;
  type: string;
  units: number;
  depth: number;
  width: number;
  equipment: Record<number, Equipment>;
  powerConnections: Record<string, PowerConnection>;
  mountingOptions: Record<string, MountingOption>;
  labels: Record<string, Label>;
  cageNuts: Record<number, CageNutConfig>;
  rails: Record<number, RailConfiguration>; // レール配置情報
  partInventory: Record<string, Equipment>;
  fans: FanConfig;
  position: Position;
  cabling: CablingConfig;
  housing: HousingConfig;
  environment: EnvironmentConfig;
  pduPlacements: PDUPlacement[]; // PDU配置情報
  physicalStructure: PhysicalStructure; // ラック物理構造
}

export interface FloorSettings {
  hasAccessFloor: boolean;
  floorHeight: number;
  tileSize: number;
  supportType: 'adjustable' | 'fixed' | 'string';
  loadCapacity: 'light' | 'medium' | 'heavy';
  cableRouting: {
    power: 'underfloor' | 'overhead' | 'side';
    data: 'underfloor' | 'overhead' | 'side';
    fiber: 'underfloor' | 'overhead' | 'side';
  };
}

export interface RackStats {
  totalPower: number;
  totalHeat: number;
  totalWeight: number;
  usedUnits: number;
  availableUnits: number;
}

export interface TotalStats extends RackStats {
  totalCost: number;
  rackCount: number;
  totalUsedUnits: number;
  totalAvailableUnits: number;
}

export interface CoolingStats {
  totalHeatGeneration: number;
  totalCFM: number;
  totalCoolingCapacity: number;
  coolingEfficiency: number;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  temperatureMap: Record<number, number>;
  airflowIssues: Array<{
    unit: number;
    item: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  pressureDrop: number;
  thermalDesignPoint: number;
}

export interface CageNutStatus {
  installed: number;
  total: number;
  isComplete: boolean;
}

export interface PowerSources {
  pdus: Equipment[];
  upses: Equipment[];
  cvcfs: Equipment[];
  distributionPanels: Equipment[];
  all: Equipment[];
}

// 電源状態の型定義
export interface PowerStatus {
  status: 'ok' | 'warning' | 'error' | 'not-required';
  icon: string;
  color: string;
  message: string;
}

export interface LayoutDimensions {
  rackCount: number;
  rackWidth: number;
  rackGap: number;
  totalContentWidth: number;
  needsScroll: boolean;
}

// 定数型
export type EquipmentType = 'server' | 'network' | 'security' | 'storage' | 'pdu' | 'ups' | 'power' | 'console' | 'monitoring' | 'cooling' | 'shelf' | 'cable' | 'mounting' | 'panel' | 'rail' | 'other';

// 取り付け方法の型定義
export type MountingMethod = 'rails' | 'cage-nuts' | 'direct';

// レール関連の型定義
export interface RailConfiguration {
  frontLeft: RailPosition;
  frontRight: RailPosition;
  rearLeft: RailPosition;
  rearRight: RailPosition;
}

export interface RailPosition {
  installed: boolean;
  railType: string | null; // '1u', '2u', '4u' など
  startUnit: number | null;
  endUnit: number | null;
  railId: string | null;
}

export type RailType = '1u' | '2u' | '4u';

export type AirflowDirection = 'front-to-rear' | 'rear-to-front' | 'side-to-side' | 'intake' | 'exhaust' | 'blocking' | 'natural';

export type ViewMode = 'power' | 'mounting' | 'label' | 'airflow' | 'temperature' | 'cabling' | 'floor' | 'cagenut';

// ラック物理構造の型定義
export interface RackDoor {
  type: 'none' | 'mesh' | 'glass' | 'steel' | 'perforated';
  locked: boolean;
  opened: boolean;
  color: string;
  transparency: number; // 0-100%
  ventilation: number; // 通気性 0-100%
}

export interface SidePanel {
  type: 'none' | 'steel' | 'mesh' | 'glass' | 'perforated';
  mounted: boolean;
  color: string;
  transparency: number;
  ventilation: number;
  removable: boolean;
}

export interface RackFrame {
  material: 'steel' | 'aluminum' | 'composite';
  color: string;
  thickness: number; // mm
  coating: 'powder' | 'galvanized' | 'anodized' | 'painted';
  style: 'standard' | 'heavy-duty' | 'seismic';
}

export interface MountingPost {
  type: 'square' | 'round' | 'channel';
  holes: 'universal' | 'threaded' | 'cage-nut';
  spacing: number; // mm (standard: 25.4mm for 1/2U)
  depth: number; // mm
}

export interface RackBase {
  type: 'fixed' | 'adjustable' | 'casters' | 'seismic';
  height: number; // mm
  loadCapacity: number; // kg
  leveling: boolean;
  antivibration: boolean;
}

export interface RackTop {
  type: 'open' | 'solid' | 'cable-tray' | 'fan-mount';
  cableManagement: boolean;
  loadCapacity: number; // kg
  fanMounts: number;
}

export interface PhysicalStructure {
  frame: RackFrame;
  frontDoor: RackDoor;
  rearDoor: RackDoor;
  leftPanel: SidePanel;
  rightPanel: SidePanel;
  mountingPosts: {
    frontLeft: MountingPost;
    frontRight: MountingPost;
    rearLeft: MountingPost;
    rearRight: MountingPost;
  };
  base: RackBase;
  top: RackTop;
  dimensions: {
    externalWidth: number; // mm
    externalDepth: number; // mm
    externalHeight: number; // mm
    internalWidth: number; // mm (19" = 482.6mm)
    internalDepth: number; // mm
    usableHeight: number; // mm
  };
  weight: {
    empty: number; // kg
    maxLoad: number; // kg
    current: number; // kg
  };
  ventilation: {
    frontAirflow: number; // CFM
    rearAirflow: number; // CFM
    sideAirflow: number; // CFM
    totalCapacity: number; // CFM
  };
}

// デフォルト値作成関数
export const createDefaultPhysicalStructure = (): PhysicalStructure => ({
  frame: {
    material: 'steel',
    color: '#2d3748',
    thickness: 2,
    coating: 'powder',
    style: 'standard'
  },
  frontDoor: {
    type: 'mesh',
    locked: false,
    opened: false,
    color: '#2d3748',
    transparency: 0,
    ventilation: 80
  },
  rearDoor: {
    type: 'mesh',
    locked: false,
    opened: false,
    color: '#2d3748',
    transparency: 0,
    ventilation: 80
  },
  leftPanel: {
    type: 'steel',
    mounted: true,
    color: '#2d3748',
    transparency: 0,
    ventilation: 0,
    removable: true
  },
  rightPanel: {
    type: 'steel',
    mounted: true,
    color: '#2d3748',
    transparency: 0,
    ventilation: 0,
    removable: true
  },
  mountingPosts: {
    frontLeft: {
      type: 'square',
      holes: 'cage-nut',
      spacing: 25.4,
      depth: 50
    },
    frontRight: {
      type: 'square',
      holes: 'cage-nut',
      spacing: 25.4,
      depth: 50
    },
    rearLeft: {
      type: 'square',
      holes: 'cage-nut',
      spacing: 25.4,
      depth: 50
    },
    rearRight: {
      type: 'square',
      holes: 'cage-nut',
      spacing: 25.4,
      depth: 50
    }
  },
  base: {
    type: 'adjustable',
    height: 100,
    loadCapacity: 1000,
    leveling: true,
    antivibration: false
  },
  top: {
    type: 'cable-tray',
    cableManagement: true,
    loadCapacity: 50,
    fanMounts: 0
  },
  dimensions: {
    externalWidth: 600,
    externalDepth: 1000,
    externalHeight: 2000,
    internalWidth: 482.6,
    internalDepth: 900,
    usableHeight: 1778
  },
  weight: {
    empty: 150,
    maxLoad: 1000,
    current: 150
  },
  ventilation: {
    frontAirflow: 0,
    rearAirflow: 0,
    sideAirflow: 0,
    totalCapacity: 1000
  }
});
// 機器設置システム用の新しい型定義

export interface PlacementPosition {
  startUnit: number;
  endUnit: number;
}

export interface PlacementValidation {
  isValid: boolean;
  errors: PlacementError[];
  warnings: PlacementWarning[];
}

export interface PlacementError {
  code: string;
  message: string;
  affectedUnits: number[];
  severity: 'error' | 'warning';
}

export interface PlacementWarning {
  code: string;
  message: string;
  affectedUnits: number[];
  suggestion?: string;
}

export interface PlacementConstraint {
  id:string;
  name: string;
  validate: (context: PlacementContext) => PlacementValidation;
  priority: number; // 低い数値ほど高優先度
}

export interface PlacementContext {
  rack: Rack;
  position: PlacementPosition;
  equipment: Equipment;
  options: PlacementOptions;
  isProMode: boolean;
}

export interface PlacementOptions {
  autoInstallCageNuts?: boolean;
  skipWarnings?: boolean;
  forceOverride?: boolean;
  validateOnly?: boolean;
}

export interface PlacementResult {
  success: boolean;
  position?: PlacementPosition;
  validation: PlacementValidation;
  appliedChanges: PlacementChange[];
  updatedRack?: Rack;
}

export interface PlacementChange {
  type: 'equipment' | 'cagenut' | 'power' | 'mounting' | 'label' | 'rail';
  action: 'add' | 'remove' | 'update';
  target: string; // equipment ID, unit number, etc.
  oldValue?: any;
  newValue?: any;
}

// 機器の配置状態を表す型
export interface EquipmentPlacement {
  equipmentId: string;
  equipment: Equipment;
  position: PlacementPosition;
  isMainUnit: boolean;
  placedAt: Date;
  dependencies: string[]; // 依存する他の機器のID
}

// ラック内の機器配置管理
export interface RackOccupancy {
  [unit: number]: EquipmentPlacement | null;
}

// 機器設置の状態管理
export interface PlacementState {
  placements: Record<string, EquipmentPlacement>;
  occupancy: RackOccupancy;
  lastModified: Date;
}
export type RackViewPerspective = 'front' | 'rear' | 'left' | 'right';

// 共有機能用の型定義
export interface ShareableData {
  version: string;
  timestamp: number;
  racks: Record<string, Rack>;
  floorSettings: FloorSettings;
  selectedRack: string;
  activeViewMode: string | null;
  rackViewPerspective: RackViewPerspective;
  isProMode: boolean;
  zoomLevel: number;
}

export interface CompressionStats {
  original: number;
  compressed: number;
  ratio: number;
  improvement: number;
}

export interface ShareResult {
  success: boolean;
  url?: string;
  error?: string;
  stats?: CompressionStats;
}