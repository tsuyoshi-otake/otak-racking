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
 * 機器設置管理システム
 * 
 * 責務:
 * - 機器の配置可能性チェック
 * - 設置制約の検証
 * - 設置処理の実行
 * - 設置状態の管理
 */
export class EquipmentPlacementManager {
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
    
    if (!validation.isValid && !options.forceOverride) {
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
                                 // レール要求警告は設置を阻害しない（警告のみ）
                                 validation.warnings.every(w => w.code === 'RAILS_REQUIRED');
    
    if (validation.warnings.length > 0 && !shouldIgnoreWarnings) {
      return {
        success: false,
        validation,
        appliedChanges: [],
        updatedRack: undefined
      };
    }

    // 実際の配置処理
    const changes = await this.executePlacement(context);
    
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
    const errors: PlacementError[] = [];
    const warnings: PlacementWarning[] = [];

    // 制約を優先度順にソートして実行
    const sortedConstraints = [...this.constraints].sort((a, b) => a.priority - b.priority);

    for (const constraint of sortedConstraints) {
      try {
        const result = constraint.validate(context);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } catch (error) {
        errors.push({
          code: 'CONSTRAINT_ERROR',
          message: `制約チェック中にエラーが発生: ${constraint.name}`,
          affectedUnits: [context.position.startUnit],
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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

  /**
   * 機器の削除
   */
  async removeEquipment(rack: Rack, unit: number): Promise<PlacementResult> {
    // 不変性を保つためにラックのディープコピーを作成
    const rackCopy = JSON.parse(JSON.stringify(rack));
    const equipment = rackCopy.equipment[unit];

    if (!equipment) {
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            code: 'EQUIPMENT_NOT_FOUND',
            message: `ユニット${unit}に機器が見つかりません`,
            affectedUnits: [unit],
            severity: 'error'
          }],
          warnings: []
        },
        appliedChanges: [],
        updatedRack: rack
      };
    }

    const changes: PlacementChange[] = [];

    // レール機器の場合は特別な処理
    if (equipment.type === 'rail') {
      for (let u = equipment.startUnit!; u <= equipment.endUnit!; u++) {
        // レール情報を削除
        if (rackCopy.rails[u]) {
          delete rackCopy.rails[u];
          changes.push({
            type: 'equipment',
            action: 'remove',
            target: `rail-${u}`,
            oldValue: rackCopy.rails[u]
          });
        }
      }
    }

    // 機器を全ユニットから削除
    for (let u = equipment.startUnit!; u <= equipment.endUnit!; u++) {
      const removedEquipment = rackCopy.equipment[u];
      delete rackCopy.equipment[u];
      
      changes.push({
        type: 'equipment',
        action: 'remove',
        target: u.toString(),
        oldValue: removedEquipment
      });
    }

    // 関連設定を削除
    const oldPowerConnection = rackCopy.powerConnections[equipment.id];
    const oldMountingOption = rackCopy.mountingOptions[equipment.id];
    const oldLabel = rackCopy.labels[equipment.id];

    delete rackCopy.powerConnections[equipment.id];
    delete rackCopy.mountingOptions[equipment.id];
    delete rackCopy.labels[equipment.id];


    changes.push(
      {
        type: 'power',
        action: 'remove',
        target: equipment.id,
        oldValue: oldPowerConnection
      },
      {
        type: 'mounting',
        action: 'remove',
        target: equipment.id,
        oldValue: oldMountingOption
      },
      {
        type: 'label',
        action: 'remove',
        target: equipment.id,
        oldValue: oldLabel
      }
    );

    return {
      success: true,
      validation: { isValid: true, errors: [], warnings: [] },
      appliedChanges: changes,
      updatedRack: rackCopy
    };
  }

  /**
   * ラック内の全機器をクリア
   */
  async clearAllEquipment(rack: Rack): Promise<PlacementResult> {
    // 不変性を保つためにラックのディープコピーを作成
    const rackCopy = JSON.parse(JSON.stringify(rack));
    const changes: PlacementChange[] = [];

    // 全機器を削除
    const equipmentIds = new Set<string>();
    for (const unit in rackCopy.equipment) {
      const equipment = rackCopy.equipment[unit];
      if (equipment) {
        equipmentIds.add(equipment.id);
        
        changes.push({
          type: 'equipment',
          action: 'remove',
          target: unit,
          oldValue: equipment
        });
      }
    }

    // 機器を全てクリア
    rackCopy.equipment = {};

    // 関連設定もクリア
    Array.from(equipmentIds).forEach(equipmentId => {
      if (rackCopy.powerConnections[equipmentId]) {
        changes.push({
          type: 'power',
          action: 'remove',
          target: equipmentId,
          oldValue: rackCopy.powerConnections[equipmentId]
        });
        delete rackCopy.powerConnections[equipmentId];
      }

      if (rackCopy.mountingOptions[equipmentId]) {
        changes.push({
          type: 'mounting',
          action: 'remove',
          target: equipmentId,
          oldValue: rackCopy.mountingOptions[equipmentId]
        });
        delete rackCopy.mountingOptions[equipmentId];
      }

      if (rackCopy.labels[equipmentId]) {
        changes.push({
          type: 'label',
          action: 'remove',
          target: equipmentId,
          oldValue: rackCopy.labels[equipmentId]
        });
        delete rackCopy.labels[equipmentId];
      }
    });

    // ゲージナットもクリア
    for (const unit in rackCopy.cageNuts) {
      if (rackCopy.cageNuts[unit]) {
        changes.push({
          type: 'cagenut',
          action: 'remove',
          target: unit,
          oldValue: rackCopy.cageNuts[unit]
        });
      }
    }
    rackCopy.cageNuts = {};

    // レールもクリア
    for (const unit in rackCopy.rails) {
      if (rackCopy.rails[unit]) {
        changes.push({
          type: 'rail',
          action: 'remove',
          target: unit,
          oldValue: rackCopy.rails[unit]
        });
      }
    }
    rackCopy.rails = {};

    return {
      success: true,
      validation: { isValid: true, errors: [], warnings: [] },
      appliedChanges: changes,
      updatedRack: rackCopy
    };
  }

  /**
   * ラックの占有状況を取得
   */
  getRackOccupancy(rack: Rack): RackOccupancy {
    const occupancy: RackOccupancy = {};
    
    for (let unit = 1; unit <= rack.units; unit++) {
      const equipment = rack.equipment[unit];
      if (equipment) {
        occupancy[unit] = {
          equipmentId: equipment.id,
          equipment,
          position: {
            startUnit: equipment.startUnit!,
            endUnit: equipment.endUnit!
          },
          isMainUnit: equipment.isMainUnit!,
          placedAt: new Date(), // 実際の実装では設置日時を記録
          dependencies: []
        };
      } else {
        occupancy[unit] = null;
      }
    }
    
    return occupancy;
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
      this.createProModeRailConstraint(), // 新しい制約を追加
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
            severity: 'error'
          });
        }
        
        if (position.endUnit > rack.units) {
          errors.push({
            code: 'EXCEED_RACK_CAPACITY',
            message: `ラックの容量（${rack.units}U）を超えています`,
            affectedUnits: [position.endUnit],
            severity: 'error'
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
            severity: 'error'
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
            severity: 'error'
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
              severity: 'error'
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
      priority: 5, // ケージナットと棚板の間
      validate: (context: PlacementContext): PlacementValidation => {
        const { rack, position, equipment, isProMode } = context;

        if (!isProMode) {
          return { isValid: true, errors: [], warnings: [] };
        }

        if (equipment.requiresRails || equipment.mountingMethod === 'rails') {
          const missingUnits: number[] = [];
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            // このユニットに対応するレールが設置されているかチェック
            if (!this.hasRequiredRailForProMode(rack, unit, equipment)) {
              missingUnits.push(unit);
            }
          }

          if (missingUnits.length > 0) {
            const errors: PlacementError[] = [{
              code: 'RAIL_REQUIRED',
              message: `Proモードではこの機器に対応するレールの事前設置が必要です (U${missingUnits.join(', ')})`,
              affectedUnits: missingUnits,
              severity: 'error'
            }];
            return { isValid: false, errors, warnings: [] };
          }
        }
        
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
      priority: 6, // 優先度を調整
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
              severity: 'error'
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
      priority: 7, // 優先度を調整
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
          warnings.push({
            code: 'RAILS_REQUIRED',
            message: `${equipment.name}にはスライドレールが必要です`,
            affectedUnits: [position.startUnit],
            suggestion: 'レールキットを事前に設置してください。重量機器の場合は耐荷重の確認も必要です'
          });
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
      priority: 8, // 優先度を調整
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
    return rackType ? rackType.maxWeight : 1500; // デフォルト値
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
    const railInfo = rack.rails[unit];
    if (!railInfo) return false;

    // 左右両方のレールが設置されているか
    const isFrontRailInstalled = railInfo.frontLeft.installed && railInfo.frontRight.installed;
    if (!isFrontRailInstalled) return false;

    // レールのサイズが機器の高さと一致するか
    const railEquipment = rack.equipment[unit];
    if (railEquipment && railEquipment.type === 'rail' && railEquipment.height === equipment.height) {
      return true;
    }
    
    // partInventoryに格納されているレールもチェック対象とする
    const installedRailId = railInfo.frontLeft.railId;
    if (!installedRailId) return false;

    const installedRail = Object.values(rack.partInventory).find(part => part.id === installedRailId);
    if (installedRail && installedRail.height === equipment.height) {
      return true;
    }

    return false;
  }

  private createCompleteCageNutConfig(nutType: string) {
    return {
      frontLeft: { top: nutType, middle: nutType, bottom: nutType },
      frontRight: { top: nutType, middle: nutType, bottom: nutType },
      rearLeft: { top: nutType, middle: nutType, bottom: nutType },
      rearRight: { top: nutType, middle: nutType, bottom: nutType }
    };
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
   * レール設置の特別な処理
   */
  private async executeRailPlacement(context: PlacementContext): Promise<PlacementChange[]> {
    const changes: PlacementChange[] = [];
    const { rack, position, equipment } = context;
    const equipmentId = `${equipment.id}-${Date.now()}`;

    // レール情報をrack.railsに追加
    for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
      if (!rack.rails[unit]) {
        rack.rails[unit] = {
          frontLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          frontRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
        };
      }

      // レール設置情報を更新（左右のレール）
      const railType = equipment.height === 1 ? '1u' : equipment.height === 2 ? '2u' : '4u';
      rack.rails[unit].frontLeft = {
        installed: true,
        railType,
        startUnit: position.startUnit,
        endUnit: position.endUnit,
        railId: equipmentId
      };
      rack.rails[unit].frontRight = {
        installed: true,
        railType,
        startUnit: position.startUnit,
        endUnit: position.endUnit,
        railId: equipmentId
      };

      changes.push({
        type: 'equipment',
        action: 'add',
        target: `rail-${unit}`,
        newValue: rack.rails[unit]
      });
    }

    // 通常の機器設置処理も実行
    for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
      const equipmentPlacement: Equipment = {
        ...equipment,
        id: equipmentId,
        startUnit: position.startUnit,
        endUnit: position.endUnit,
        isMainUnit: unit === position.startUnit
      };

      rack.equipment[unit] = equipmentPlacement;

      changes.push({
        type: 'equipment',
        action: 'add',
        target: unit.toString(),
        newValue: equipmentPlacement
      });
    }

    return changes;
  }
}

// シングルトンインスタンス
export const placementManager = new EquipmentPlacementManager();