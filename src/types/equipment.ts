// 機器設置システム用の新しい型定義
import { Rack, Equipment } from '../types';

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
  id: string;
  name: string;
  validate: (rack: Rack, position: PlacementPosition, equipment: Equipment) => PlacementValidation;
  priority: number; // 低い数値ほど高優先度
}

export interface PlacementContext {
  rack: Rack;
  position: PlacementPosition;
  equipment: Equipment;
  options: PlacementOptions;
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
}

export interface PlacementChange {
  type: 'equipment' | 'cagenut' | 'power' | 'mounting' | 'label';
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

// 再エクスポート既存型
export * from '../types';