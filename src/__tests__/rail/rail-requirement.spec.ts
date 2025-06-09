import { describe, beforeEach, test, expect } from '@jest/globals';
import { EquipmentPlacementManager } from '../../services/EquipmentPlacementManager';
import { Rack, Equipment } from '../../types';
import { createDefaultPhysicalStructure } from '../../types';

// placementManagerインスタンスを作成
const placementManager = new EquipmentPlacementManager();

describe('レール要求制約のテスト', () => {
  let rack: Rack;
  let server1U: Equipment;

  beforeEach(() => {
    // 基本的なラックの設定
    rack = {
      id: 'test-rack',
      name: 'Test Rack',
      type: '42u-standard',
      units: 42,
      depth: 1000,
      width: 600,
      equipment: {},
      powerConnections: {},
      mountingOptions: {},
      labels: {},
      cageNuts: {},
      rails: {},
      partInventory: {},
      fans: { count: 4, rpm: 3000 },
      position: { row: 'A', column: 1 },
      cabling: {
        external: {},
        overhead: {},
        underfloor: {}
      },
      housing: {
        type: 'full',
        startUnit: 1,
        endUnit: 42,
        frontPanel: 'perforated',
        rearPanel: 'perforated'
      },
      environment: {
        ambientTemp: 22,
        humidity: 45,
        pressureDiff: 0.2
      },
      pduPlacements: [],
      physicalStructure: createDefaultPhysicalStructure()
    };

    // 1Uサーバーの設定
    server1U = {
      id: 'server-1u',
      name: '1Uサーバー',
      height: 1,
      depth: 650,
      power: 300,
      heat: 1024,
      weight: 15,
      type: 'server',
      color: '#4F46E5',
      dualPower: true,
      airflow: 'front-to-rear',
      cfm: 65,
      heatGeneration: 1024,
      description: 'テスト用1Uサーバー',
      mountingMethod: 'rails',
      requiresRails: true,
      requiresCageNuts: false
    };
  });

  test('レールが設置されていない場合、警告が出る', async () => {
    const result = await placementManager.placeEquipment(rack, 10, server1U, {
      validateOnly: true
    });

    // 通常モードでは警告のみで配置は可能
    expect(result.success).toBe(true);
    expect(result.validation.warnings).toHaveLength(1);
    expect(result.validation.warnings[0].code).toBe('RAILS_REQUIRED');
    expect(result.validation.warnings[0].affectedUnits).toEqual([10]);
  });

  test('レールが設置されている場合、警告が出ない', async () => {
    // レールを設置
    rack.rails[10] = {
      frontLeft: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-1' },
      frontRight: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-2' },
      rearLeft: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-3' },
      rearRight: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-4' }
    };

    const result = await placementManager.placeEquipment(rack, 10, server1U, {
      validateOnly: true
    });

    // レールが設置されているので、レール関連の警告は出ないはず
    const railWarnings = result.validation.warnings.filter(w => w.code === 'RAILS_REQUIRED');
    expect(railWarnings).toHaveLength(0);
  });

  test('片側だけレールが設置されている場合、警告が出る', async () => {
    // 左側だけレールを設置
    rack.rails[10] = {
      frontLeft: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-1' },
      frontRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
      rearLeft: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-3' },
      rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
    };

    const result = await placementManager.placeEquipment(rack, 10, server1U, {
      validateOnly: true
    });

    // 通常モードでは警告のみで配置は可能
    expect(result.success).toBe(true);
    expect(result.validation.warnings).toHaveLength(1);
    expect(result.validation.warnings[0].code).toBe('RAILS_REQUIRED');
  });

  test('Proモードでレールが設置されていない場合、エラーが出る', async () => {
    const result = await placementManager.placeEquipment(rack, 10, server1U, {
      validateOnly: true
    }, true); // Proモード有効

    expect(result.success).toBe(false);
    expect(result.validation.errors).toHaveLength(1);
    expect(result.validation.errors[0].code).toBe('RAIL_REQUIRED');
  });

  test('Proモードでレールが設置されている場合、エラーが出ない', async () => {
    // レールを設置
    rack.rails[10] = {
      frontLeft: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-1' },
      frontRight: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-2' },
      rearLeft: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-3' },
      rearRight: { installed: true, railType: '1u', startUnit: 10, endUnit: 10, railId: 'rail-4' }
    };

    // レール機器をpartInventoryに追加（Proモードのチェック用）
    rack.partInventory['rail-1'] = {
      ...server1U,
      id: 'rail-1',
      type: 'rail',
      height: 1,
      name: '1Uレール'
    };

    const result = await placementManager.placeEquipment(rack, 10, server1U, {
      validateOnly: true
    }, true); // Proモード有効

    // レールが設置されているので、レール関連のエラーは出ないはず
    const railErrors = result.validation.errors.filter(e => e.code === 'RAIL_REQUIRED');
    expect(railErrors).toHaveLength(0);
  });
});