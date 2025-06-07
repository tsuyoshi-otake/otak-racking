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
} from '../types/equipment';
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
    options: PlacementOptions = {}
  ): Promise<PlacementResult> {
    const position: PlacementPosition = {
      startUnit,
      endUnit: startUnit + equipment.height - 1
    };

    const context: PlacementContext = {
      rack,
      position,
      equipment,
      options
    };

    // 検証のみの場合
    if (options.validateOnly) {
      const validation = await this.validatePlacement(context);
      return {
        success: validation.isValid,
        position,
        validation,
        appliedChanges: []
      };
    }

    // 配置前検証
    const validation = await this.validatePlacement(context);
    
    if (!validation.isValid && !options.forceOverride) {
      return {
        success: false,
        validation,
        appliedChanges: []
      };
    }

    // 警告がある場合の処理（autoInstallCageNutsが有効な場合はゲージナット警告を無視）
    const shouldIgnoreWarnings = options.skipWarnings ||
                                 options.forceOverride ||
                                 (options.autoInstallCageNuts &&
                                  validation.warnings.every(w => w.code === 'CAGE_NUT_MISSING'));
    
    if (validation.warnings.length > 0 && !shouldIgnoreWarnings) {
      return {
        success: false,
        validation,
        appliedChanges: []
      };
    }

    // 実際の配置処理
    const changes = await this.executePlacement(context);
    
    return {
      success: true,
      position,
      validation,
      appliedChanges: changes
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
        const result = constraint.validate(context.rack, context.position, context.equipment);
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
      type: equipment.needsRails ? 'none' : 'direct',
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

    // ゲージナット自動設置
    if (options.autoInstallCageNuts && !equipment.needsRails) {
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
    const equipment = rack.equipment[unit];
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
        appliedChanges: []
      };
    }

    const changes: PlacementChange[] = [];

    // 機器を全ユニットから削除
    for (let u = equipment.startUnit!; u <= equipment.endUnit!; u++) {
      const removedEquipment = rack.equipment[u];
      delete rack.equipment[u];
      
      changes.push({
        type: 'equipment',
        action: 'remove',
        target: u.toString(),
        oldValue: removedEquipment
      });
    }

    // 関連設定を削除
    delete rack.powerConnections[equipment.id];
    delete rack.mountingOptions[equipment.id];
    delete rack.labels[equipment.id];

    changes.push(
      {
        type: 'power',
        action: 'remove',
        target: equipment.id,
        oldValue: rack.powerConnections[equipment.id]
      },
      {
        type: 'mounting',
        action: 'remove',
        target: equipment.id,
        oldValue: rack.mountingOptions[equipment.id]
      },
      {
        type: 'label',
        action: 'remove',
        target: equipment.id,
        oldValue: rack.labels[equipment.id]
      }
    );

    return {
      success: true,
      validation: { isValid: true, errors: [], warnings: [] },
      appliedChanges: changes
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
      this.createShelfRequirementConstraint(),
      this.createCageNutConstraint()
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
      validate: (rack: Rack, position: PlacementPosition, equipment: Equipment): PlacementValidation => {
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
      validate: (rack: Rack, position: PlacementPosition, equipment: Equipment): PlacementValidation => {
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
      validate: (rack: Rack, position: PlacementPosition, equipment: Equipment): PlacementValidation => {
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
   * 棚板要求制約（神棚用）
   */
  private createShelfRequirementConstraint(): PlacementConstraint {
    return {
      id: 'shelf-requirement',
      name: '棚板要求チェック',
      priority: 4,
      validate: (rack: Rack, position: PlacementPosition, equipment: Equipment): PlacementValidation => {
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
   * ゲージナット制約
   */
  private createCageNutConstraint(): PlacementConstraint {
    return {
      id: 'cage-nut',
      name: 'ゲージナットチェック',
      priority: 5,
      validate: (rack: Rack, position: PlacementPosition, equipment: Equipment): PlacementValidation => {
        const warnings: PlacementWarning[] = [];
        
        // レールが不要で、特定のタイプ以外の機器のみチェック
        if (!equipment.needsRails &&
            equipment.type !== 'mounting' &&
            equipment.type !== 'shelf' &&
            equipment.type !== 'spiritual' &&
            equipment.type !== 'panel') {
          const missingUnits: number[] = [];
          
          for (let unit = position.startUnit; unit <= position.endUnit; unit++) {
            if (!this.hasCompleteCageNuts(rack, unit)) {
              missingUnits.push(unit);
            }
          }
          
          if (missingUnits.length > 0) {
            warnings.push({
              code: 'CAGE_NUT_MISSING',
              message: `ユニット ${missingUnits.join(', ')} にゲージナットが不足しています`,
              affectedUnits: missingUnits,
              suggestion: '自動設置オプションを有効にするか、事前にゲージナットを設置してください'
            });
          }
        }
        
        return { isValid: true, errors: [], warnings };
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
      cageNuts.frontLeft?.top, cageNuts.frontLeft?.bottom,
      cageNuts.frontRight?.top, cageNuts.frontRight?.bottom,
      cageNuts.rearLeft?.top, cageNuts.rearLeft?.bottom,
      cageNuts.rearRight?.top, cageNuts.rearRight?.bottom
    ];
    
    return positions.filter(Boolean).length === 8;
  }

  private createCompleteCageNutConfig(nutType: string) {
    return {
      frontLeft: { top: nutType, middle: nutType, bottom: nutType },
      frontRight: { top: nutType, middle: nutType, bottom: nutType },
      rearLeft: { top: nutType, middle: nutType, bottom: nutType },
      rearRight: { top: nutType, middle: nutType, bottom: nutType }
    };
  }
}

// シングルトンインスタンス
export const placementManager = new EquipmentPlacementManager();