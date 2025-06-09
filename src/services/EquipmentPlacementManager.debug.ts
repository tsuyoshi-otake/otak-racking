import {
  Rack,
  Equipment,
  PlacementPosition,
  PlacementValidation,
  PlacementError,
  PlacementWarning,
  PlacementConstraint,
  PlacementContext,
  PlacementOptions,
  PlacementResult,
  PlacementChange,
  EquipmentPlacement,
  RackOccupancy,
  PlacementState
} from '../types';
import { rackTypes } from '../constants';

/**
 * デバッグ版 機器設置管理システム
 * 
 * 責務:
 * - 機器の配置可能性チェック
 * - 設置制約の検証
 * - 設置処理の実行
 * - 設置状態の管理
 */
export class EquipmentPlacementManagerDebug {
  private constraints: PlacementConstraint[] = [];
  
  constructor() {
    this.initializeConstraints();
  }

  /**
   * 機器の配置を試行する
   */
  async placeEquipment(
    rack: Rack,
    startUnit: number,
    equipment: Equipment,
    options: PlacementOptions = {},
    isProMode: boolean = false
  ): Promise<PlacementResult> {
    console.log('=== placeEquipment DEBUG START ===');
    console.log('Equipment:', equipment);
    console.log('StartUnit:', startUnit);
    console.log('IsProMode:', isProMode);
    console.log('Options:', options);
    
    const position: PlacementPosition = {
      startUnit,
      endUnit: startUnit + equipment.height - 1
    };

    const context: PlacementContext = {
      rack: rack,
      position,
      equipment,
      options,
      isProMode
    };

    // 検証のみの場合
    if (options.validateOnly) {
      const validation = await this.validatePlacement(context);
      return {
        success: validation.isValid,
        position,
        validation,
        appliedChanges: [],
        updatedRack: undefined
      };
    }

    // 配置前検証
    const validation = await this.validatePlacement(context);
    
    console.log('Validation result:', validation);
    
    if (!validation.isValid && !options.forceOverride) {
      console.log('Validation failed, returning error');
      return {
        success: false,
        validation,
        appliedChanges: [],
        updatedRack: undefined
      };
    }

    // 警告がある場合の処理
    const shouldIgnoreWarnings = options.skipWarnings ||
                                 options.forceOverride ||
                                 (options.autoInstallCageNuts &&
                                  (equipment.requiresCageNuts || equipment.mountingMethod === 'cage-nuts') &&
                                  validation.warnings.every(w => w.code === 'CAGE_NUT_MISSING')) ||
                                 (!isProMode && validation.warnings.every(w =>
                                   w.code === 'CAGE_NUT_MISSING' || w.code === 'RAILS_REQUIRED'));
    
    if (validation.warnings.length > 0 && !shouldIgnoreWarnings) {
      console.log('Warnings exist and not ignored, returning error');
      return {
        success: false,
        validation,
        appliedChanges: [],
        updatedRack: undefined
      };
    }

    // 実際の配置処理
    const changes = await this.executePlacement(context);
    
    console.log('=== placeEquipment DEBUG END ===');
    
    return {
      success: true,
      position,
      validation,
      appliedChanges: changes,
      updatedRack: rack
    };
  }

  /**
   * 機器の配置を検証する
   */
  async validatePlacement(context: PlacementContext): Promise<PlacementValidation> {
    console.log('--- validatePlacement START ---');
    const errors: PlacementError[] = [];
    const warnings: PlacementWarning[] = [];

    // 制約を優先度順にソートして実行
    const sortedConstraints = [...this.constraints].sort((a, b) => a.priority - b.priority);

    for (const constraint of sortedConstraints) {
      try {
        console.log(`Checking constraint: ${constraint.name} (priority: ${constraint.priority})`);
        const result = constraint.validate(context);
        
        if (result.errors.length > 0) {
          console.log(`  Errors from ${constraint.name}:`, result.errors);
        }
        if (result.warnings.length > 0) {
          console.log(`  Warnings from ${constraint.name}:`, result.warnings);
        }
        
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } catch (error) {
        console.error(`Error in constraint ${constraint.name}:`, error);
        errors.push({
          code: 'CONSTRAINT_ERROR',
          message: `制約チェック中にエラーが発生: ${constraint.name}`,
          affectedUnits: [context.position.startUnit],
          severity: 'error' as const
        });
      }
    }

    console.log('--- validatePlacement END ---');
    console.log('Total errors:', errors.length);
    console.log('Total warnings:', warnings.length);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 制約の初期化
   */
  private initializeConstraints(): void {
    this.constraints = [
      this.createUnitRangeConstraint(),
      this.createCapacityConstraint(),
      this.createOccupancyConstraint(),
      this.createProModeCageNutConstraint(),
      this.createShelfRequirementConstraint(),
      this.createProModeRailConstraint(),
      this.createMountingMethodWarningConstraint(),
      this.createRailConflictConstraint()
    ];
  }

  /**
   * ユニット範囲制約
   */
  private createUnitRangeConstraint(): PlacementConstraint {
    return {
      id: 'unit-range',
      name: 'ユニット範囲チェック',
      priority: 1,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position } = context;
        const errors: PlacementError[] = [];
        
        if (position.startUnit < 1) {
          errors.push({
            code: 'INVALID_START_UNIT',
            message: 'ユニット番号は1以上である必要があります',
            affectedUnits: [position.startUnit],
            severity: 'error' as const
          });
        }
        
        if (position.endUnit > rack.units) {
          errors.push({
            code: 'EXCEED_RACK_CAPACITY',
            message: `ラックの容量（${rack.units}U）を超えています`,
            affectedUnits: [position.endUnit],
            severity: 'error' as const
          });
        }
        
        return { isValid: errors.length === 0, errors, warnings: [] };
      }
    };
  }

  /**
   * 容量制約
   */
  private createCapacityConstraint(): PlacementConstraint {
    return {
      id: 'capacity',
      name: '容量チェック',
      priority: 2,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment } = context;
        const errors: PlacementError[] = [];
        const warnings: PlacementWarning[] = [];
        
        // 重量チェック
        const currentWeight = this.calculateTotalWeight(rack);
        const maxWeight = this.getRackMaxWeight(rack);
        
        if (currentWeight + equipment.weight > maxWeight) {
          errors.push({
            code: 'WEIGHT_EXCEEDED',
            message: `重量制限（${maxWeight}kg）を超過します。現在: ${currentWeight}kg, 追加: ${equipment.weight}kg`,
            affectedUnits: [position.startUnit],
            severity: 'error' as const
          });
        } else if (currentWeight + equipment.weight > maxWeight * 0.8) {
          warnings.push({
            code: 'WEIGHT_WARNING',
            message: `重量制限の80%を超えます。現在: ${currentWeight}kg, 追加: ${equipment.weight}kg`,
            affectedUnits: [position.startUnit],
            suggestion: '重量分散を検討してください'
          });
        }
        
        return { isValid: errors.length === 0, errors, warnings };
      }
    };
  }

  /**
   * 占有チェック制約
   */
  private createOccupancyConstraint(): PlacementConstraint {
    return {
      id: 'occupancy',
      name: '占有チェック',
      priority: 3,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position } = context;
        const errors: PlacementError[] = [];
        const occupiedUnits: number[] = [];
        
        for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
          if (rack.equipment[unit]) {
            occupiedUnits.push(unit);
          }
        }
        
        if (occupiedUnits.length > 0) {
          errors.push({
            code: 'UNIT_OCCUPIED',
            message: `ユニット ${occupiedUnits.join(', ')} には既に機器が設置されています`,
            affectedUnits: occupiedUnits,
            severity: 'error' as const
          });
        }
        
        return { isValid: errors.length === 0, errors, warnings: [] };
      }
    };
  }

  /**
   * Proモード用ケージナット制約（エラー）
   */
  private createProModeCageNutConstraint(): PlacementConstraint {
    return {
      id: 'pro-mode-cage-nut',
      name: 'Proモード ケージナット必須チェック',
      priority: 4,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment, isProMode } = context;

        if (!isProMode) {
          return { isValid: true, errors: [], warnings: [] };
        }

        if (equipment.requiresCageNuts || equipment.mountingMethod === 'cage-nuts') {
          const missingUnits: number[] = [];
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            if (!this.hasRequiredCageNutsForProMode(rack, unit)) {
              missingUnits.push(unit);
            }
          }

          if (missingUnits.length > 0) {
            const errors: PlacementError[] = [{
              code: 'CAGE_NUT_REQUIRED',
              message: `Proモードではケージナットの事前設置が必要です (U${missingUnits.join(', ')})`,
              affectedUnits: missingUnits,
              severity: 'error' as const
            }];
            return { isValid: false, errors, warnings: [] };
          }
        }
        
        return { isValid: true, errors: [], warnings: [] };
      }
    };
  }

  /**
   * Proモード用レール制約（エラー）
   */
  private createProModeRailConstraint(): PlacementConstraint {
    return {
      id: 'pro-mode-rail',
      name: 'Proモード レール必須チェック',
      priority: 5,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment, isProMode } = context;

        console.log('  Pro Mode Rail Check:');
        console.log('    isProMode:', isProMode);
        console.log('    equipment.requiresRails:', equipment.requiresRails);
        console.log('    equipment.mountingMethod:', equipment.mountingMethod);

        if (!isProMode) {
          console.log('    Not in Pro Mode, skipping check');
          return { isValid: true, errors: [], warnings: [] };
        }

        if (equipment.requiresRails || equipment.mountingMethod === 'rails') {
          console.log('    Equipment requires rails, checking...');
          const missingUnits: number[] = [];
          
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            console.log(`    Checking unit ${unit}:`);
            console.log('      rack.rails[unit]:', rack.rails[unit]);
            
            if (!this.hasRequiredRailForProMode(rack, unit, equipment)) {
              console.log(`      Unit ${unit} is missing required rail`);
              missingUnits.push(unit);
            } else {
              console.log(`      Unit ${unit} has required rail`);
            }
          }

          if (missingUnits.length > 0) {
            const errors: PlacementError[] = [{
              code: 'RAIL_REQUIRED',
              message: `Proモードではこの機器に対応するレールの事前設置が必要です (U${missingUnits.join(', ')})`,
              affectedUnits: missingUnits,
              severity: 'error' as const
            }];
            console.log('    Rail check failed with errors:', errors);
            return { isValid: false, errors, warnings: [] };
          }
        }
        
        console.log('    Rail check passed');
        return { isValid: true, errors: [], warnings: [] };
      }
    };
  }

  /**
   * 棚板要求制約（神棚用）
   */
  private createShelfRequirementConstraint(): PlacementConstraint {
    return {
      id: 'shelf-requirement',
      name: '棚板要求チェック',
      priority: 6,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment } = context;
        const errors: PlacementError[] = [];
        
        if (equipment.requiresShelf) {
          const shelfUnit = position.startUnit - 1;
          const shelfItem = rack.equipment[shelfUnit];
          
          if (!shelfItem || shelfItem.type !== 'shelf') {
            errors.push({
              code: 'SHELF_REQUIRED',
              message: '神棚は棚板の上にのみ設置できます。まず棚板を設置してください',
              affectedUnits: [position.startUnit, shelfUnit],
              severity: 'error' as const
            });
          }
        }
        
        return { isValid: errors.length === 0, errors, warnings: [] };
      }
    };
  }

  /**
   * 取り付け方法に関する警告制約
   */
  private createMountingMethodWarningConstraint(): PlacementConstraint {
    return {
      id: 'mounting-method-warning',
      name: '取り付け方法警告チェック',
      priority: 7,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment, isProMode } = context;
        const warnings: PlacementWarning[] = [];
        
        if (isProMode && (equipment.requiresCageNuts || equipment.mountingMethod === 'cage-nuts')) {
          return { isValid: true, errors: [], warnings: [] };
        }

        if (equipment.requiresCageNuts || equipment.mountingMethod === 'cage-nuts') {
          const missingUnits: number[] = [];
          
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            if (!this.hasCompleteCageNuts(rack, unit)) {
              missingUnits.push(unit);
            }
          }
          
          if (missingUnits.length > 0) {
            warnings.push({
              code: 'CAGE_NUT_MISSING',
              message: `${equipment.name}はケージナットで固定します。ユニット ${missingUnits.join(', ')} にケージナットが不足しています`,
              affectedUnits: missingUnits,
              suggestion: '自動設置オプションを有効にするか、事前にケージナットを設置してください'
            });
          }
        }
        
        if (equipment.requiresRails || equipment.mountingMethod === 'rails') {
          console.log('  Checking rail requirement for warning:');
          const missingRailUnits: number[] = [];
          
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            console.log(`    Checking unit ${unit} with hasRailForUnit`);
            if (!this.hasRailForUnit(rack, unit)) {
              console.log(`      Unit ${unit} is missing rail`);
              missingRailUnits.push(unit);
            } else {
              console.log(`      Unit ${unit} has rail`);
            }
          }
          
          if (missingRailUnits.length > 0) {
            warnings.push({
              code: 'RAILS_REQUIRED',
              message: `${equipment.name}にはスライドレールが必要です`,
              affectedUnits: missingRailUnits,
              suggestion: 'レールキットを事前に設置してください。重量機器の場合は耐荷重の確認も必要です'
            });
          }
        }
        
        return { isValid: true, errors: [], warnings };
      }
    };
  }

  /**
   * レールとケージナットの競合制約
   */
  private createRailConflictConstraint(): PlacementConstraint {
    return {
      id: 'rail-conflict',
      name: 'レール・ケージナット競合チェック',
      priority: 8,
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment } = context;
        const warnings: PlacementWarning[] = [];
        const errors: PlacementError[] = [];

        if (equipment.type === 'rail') {
          const conflictUnits: number[] = [];
          
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            if (this.hasCompleteCageNuts(rack, unit)) {
              conflictUnits.push(unit);
            }
          }
          
          if (conflictUnits.length > 0) {
            warnings.push({
              code: 'CAGE_NUT_CONFLICT',
              message: `レール設置のため、ユニット ${conflictUnits.join(', ')} のケージナットを取り外す必要があります`,
              affectedUnits: conflictUnits,
              suggestion: 'レールの耳部分の金具がケージナットを横断するため、既存のケージナットは使用できません'
            });
          }
        }

        if (equipment.type === 'mounting' && equipment.nutType) {
          const conflictUnits: number[] = [];
          
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            if (this.hasRailInstalled(rack, unit)) {
              conflictUnits.push(unit);
            }
          }
          
          if (conflictUnits.length > 0) {
            warnings.push({
              code: 'RAIL_CONFLICT',
              message: `ユニット ${conflictUnits.join(', ')} にはレールが設置されているため、ケージナットを設置できません`,
              affectedUnits: conflictUnits,
              suggestion: 'レールを取り外してからケージナットを設置してください'
            });
          }
        }

        return { isValid: errors.length === 0, errors, warnings };
      }
    };
  }

  /**
   * ユーティリティメソッド
   */
  private calculateTotalWeight(rack: Rack): number {
    return Object.values(rack.equipment)
      .filter(item => item.isMainUnit)
      .reduce((sum, item) => sum + (item.weight || 0), 0);
  }

  private getRackMaxWeight(rack: Rack): number {
    const rackType = rackTypes[rack.type];
    return rackType ? rackType.maxWeight : 1500;
  }

  private hasCompleteCageNuts(rack: Rack, unit: number): boolean {
    const cageNuts = rack.cageNuts[unit];
    if (!cageNuts) return false;
    
    const positions = [
      cageNuts.frontLeft?.top, cageNuts.frontLeft?.middle, cageNuts.frontLeft?.bottom,
      cageNuts.frontRight?.top, cageNuts.frontRight?.middle, cageNuts.frontRight?.bottom,
      cageNuts.rearLeft?.top, cageNuts.rearLeft?.middle, cageNuts.rearLeft?.bottom,
      cageNuts.rearRight?.top, cageNuts.rearRight?.middle, cageNuts.rearRight?.bottom
    ];
    
    return positions.filter(Boolean).length === 12;
  }

  private hasRequiredCageNutsForProMode(rack: Rack, unit: number): boolean {
    const cageNuts = rack.cageNuts[unit];
    if (!cageNuts) return false;

    const frontLeftOk = cageNuts.frontLeft?.top && cageNuts.frontLeft?.middle && cageNuts.frontLeft?.bottom;
    const frontRightOk = cageNuts.frontRight?.top && cageNuts.frontRight?.middle && cageNuts.frontRight?.bottom;

    return !!(frontLeftOk && frontRightOk);
  }

  private hasRequiredRailForProMode(rack: Rack, unit: number, equipment: Equipment): boolean {
    console.log(`      hasRequiredRailForProMode - unit ${unit}:`);
    const railInfo = rack.rails[unit];
    console.log('        railInfo:', railInfo);
    
    if (!railInfo) {
      console.log('        No rail info found');
      return false;
    }

    // 左右両方のレールが設置されているか
    const isFrontRailInstalled = railInfo.frontLeft.installed && railInfo.frontRight.installed;
    console.log('        isFrontRailInstalled:', isFrontRailInstalled);
    
    if (!isFrontRailInstalled) {
      console.log('        Front rails not installed');
      return false;
    }

    // レールのサイズが機器の高さと一致するか
    const railEquipment = rack.equipment[unit];
    console.log('        railEquipment:', railEquipment);
    
    if (railEquipment && railEquipment.type === 'rail' && railEquipment.height === equipment.height) {
      console.log('        Rail equipment matches height');
      return true;
    }
    
    // partInventoryに格納されているレールもチェック対象とする
    const installedRailId = railInfo.frontLeft.railId;
    console.log('        installedRailId:', installedRailId);
    
    if (!installedRailId) {
      console.log('        No rail ID found');
      return false;
    }

    const installedRail = Object.values(rack.partInventory).find(part => part.id === installedRailId);
    console.log('        installedRail from partInventory:', installedRail);
    
    if (installedRail && installedRail.height === equipment.height) {
      console.log('        Part inventory rail matches height');
      return true;
    }

    console.log('        No matching rail found');
    return false;
  }

  private hasRailInstalled(rack: Rack, unit: number): boolean {
    const rails = rack.rails[unit];
    if (!rails) return false;
    
    return rails.frontLeft.installed ||
           rails.frontRight.installed ||
           rails.rearLeft.installed ||
           rails.rearRight.installed;
  }

  /**
   * 指定されたユニットにレールが設置されているかチェック（通常モード用）
   */
  private hasRailForUnit(rack: Rack, unit: number): boolean {
    console.log(`      hasRailForUnit - unit ${unit}:`);
    const rails = rack.rails[unit];
    console.log('        rails:', rails);
    
    if (!rails) {
      console.log('        No rails found');
      return false;
    }
    
    // 左右両方のレールが設置されているかチェック
    const leftRailInstalled = rails.frontLeft.installed && rails.rearLeft.installed;
    const rightRailInstalled = rails.frontRight.installed && rails.rearRight.installed;
    
    console.log('        leftRailInstalled:', leftRailInstalled);
    console.log('        rightRailInstalled:', rightRailInstalled);
    
    // 左右両方のレールが設置されている場合のみtrueを返す
    const result = leftRailInstalled && rightRailInstalled;
    console.log('        result:', result);
    
    return result;
  }

  /**
   * 配置処理を実行する
   */
  private async executePlacement(context: PlacementContext): Promise<PlacementChange[]> {
    const changes: PlacementChange[] = [];
    const { rack, position, equipment, options } = context;

    // レール機器の場合は特別な処理
    if (equipment.type === 'rail') {
      return this.executeRailPlacement(context);
    }

    // 機器をラックに配置
    const equipmentId = `${equipment.id}-${Date.now()}`;
    
    for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
      const equipmentPlacement: Equipment = {
        ...equipment,
        id: equipmentId,
        startUnit: position.startUnit,
        endUnit: position.endUnit,
        isMainUnit: unit === position.startUnit
      };

      // ラックに機器を配置（直接変更）
      rack.equipment[unit] = equipmentPlacement;

      changes.push({
        type: 'equipment',
        action: 'add',
        target: unit.toString(),
        newValue: equipmentPlacement
      });
    }

    // 電源接続設定
    if (equipment.dualPower) {
      rack.powerConnections[equipmentId] = {
        primarySource: null,
        primaryType: 'pdu',
        secondarySource: null,
        secondaryType: 'pdu',
        powerPath: 'redundant'
      };
    } else {
      rack.powerConnections[equipmentId] = {
        primarySource: null,
        primaryType: 'pdu',
        powerPath: 'single'
      };
    }

    changes.push({
      type: 'power',
      action: 'add',
      target: equipmentId,
      newValue: rack.powerConnections[equipmentId]
    });

    // 取り付け設定
    rack.mountingOptions[equipmentId] = {
      type: 'direct',
      hasShelf: false,
      hasCableArm: false
    };

    changes.push({
      type: 'mounting',
      action: 'add',
      target: equipmentId,
      newValue: rack.mountingOptions[equipmentId]
    });

    // ラベル設定
    rack.labels[equipmentId] = {
      customName: '',
      ipAddress: '',
      serialNumber: '',
      owner: '',
      purpose: '',
      installDate: new Date().toISOString().split('T')[0],
      notes: ''
    };

    changes.push({
      type: 'label',
      action: 'add',
      target: equipmentId,
      newValue: rack.labels[equipmentId]
    });


    // ケージナット自動設置（ケージナットが必要な機器のみ）
    if (options.autoInstallCageNuts &&
        (equipment.requiresCageNuts || equipment.mountingMethod === 'cage-nuts')) {
      for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
        if (!this.hasCompleteCageNuts(rack, unit)) {
          rack.cageNuts[unit] = this.createCompleteCageNutConfig('m6');
          
          changes.push({
            type: 'cagenut',
            action: 'add',
            target: unit.toString(),
            newValue: rack.cageNuts[unit]
          });
        }
      }
    }

    return changes;
  }

  private createCompleteCageNutConfig(nutType: string) {
    return {
      frontLeft: { top: nutType, middle: nutType, bottom: nutType },
      frontRight: { top: nutType, middle: nutType, bottom: nutType },
      rearLeft: { top: nutType, middle: nutType, bottom: nutType },
      rearRight: { top: nutType, middle: nutType, bottom: nutType }
    };
  }

  /**
   * レール設置の特別な処理
   */
  private async executeRailPlacement(context: PlacementContext): Promise<PlacementChange[]> {
    const changes: PlacementChange[] = [];
    const { rack, position, equipment } = context;
    const equipmentId = `${equipment.id}-${Date.now()}`;
    const railWithId = { ...equipment, id: equipmentId };

    // 1. レール本体を partInventory に追加
    rack.partInventory[equipmentId] = railWithId;
    changes.push({
      type: 'equipment',
      action: 'add',
      target: equipmentId,
      newValue: railWithId
    });

    // 2. レール情報を rack.rails に追加
    for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
      if (!rack.rails[unit]) {
        rack.rails[unit] = {
          frontLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          frontRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
        };
      }

      const railType = equipment.height === 1 ? '1u' : equipment.height === 2 ? '2u' : '4u';
      const railPositionInfo = {
        installed: true,
        railType,
        startUnit: position.startUnit,
        endUnit: position.endUnit,
        railId: equipmentId
      };

      rack.rails[unit].frontLeft = railPositionInfo;
      rack.rails[unit].frontRight = railPositionInfo;
      rack.rails[unit].rearLeft = railPositionInfo;
      rack.rails[unit].rearRight = railPositionInfo;

      changes.push({
        type: 'rail',
        action: 'update',
        target: unit.toString(),
        newValue: rack.rails[unit]
      });
    }

    // 3. rack.equipment には何も追加しない
    return changes;
  }
}

// シングルトンインスタンス
export const placementManagerDebug = new EquipmentPlacementManagerDebug();