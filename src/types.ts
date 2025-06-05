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
  dualPower: boolean;
  needsRails: boolean;
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
  
  // 特殊プロパティ
  pduType?: string;
  railType?: string;
  nutType?: string;
  screwType?: string;
  washerType?: string;
  requiresShelf?: boolean;
  system?: string;
}

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
}

export interface MountingOption {
  type: 'none' | 'slide-rail' | 'fixed-rail' | 'toolless-rail' | 'shelf' | 'direct';
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
  railInventory: Record<string, Equipment>;
  partInventory: Record<string, Equipment>;
  fans: FanConfig;
  position: Position;
  cabling: CablingConfig;
  housing: HousingConfig;
  environment: EnvironmentConfig;
}

export interface FloorSettings {
  hasAccessFloor: boolean;
  floorHeight: number;
  tileSize: number;
  supportType: 'adjustable' | 'fixed' | 'string';
  loadCapacity: 'light' | 'medium' | 'heavy';
  cableRouting: {
    power: 'underfloor' | 'overhead' | 'wall';
    data: 'underfloor' | 'overhead' | 'wall';
    fiber: 'underfloor' | 'overhead' | 'wall';
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

export interface LayoutDimensions {
  rackCount: number;
  rackWidth: number;
  rackGap: number;
  totalContentWidth: number;
  needsScroll: boolean;
}

// 定数型
export type EquipmentType = 'server' | 'network' | 'security' | 'storage' | 'pdu' | 'ups' | 'power' | 'console' | 'monitoring' | 'cooling' | 'shelf' | 'spiritual' | 'cable' | 'mounting' | 'panel' | 'other';

export type AirflowDirection = 'front-to-rear' | 'rear-to-front' | 'side-to-side' | 'intake' | 'exhaust' | 'blocking' | 'natural';

export type ViewMode = 'power' | 'mounting' | 'label' | 'airflow' | 'temperature' | 'cabling' | 'floor' | 'cagenut';