import { describe, test, expect, beforeEach } from '@jest/globals';
import { Rack, Equipment, createDefaultPhysicalStructure } from '../types';
import { placementManager } from '../services/EquipmentPlacementManager';
import { serverEquipment } from '../constants';

describe('レール設置後のサーバー設置統合テスト', () => {
  let testRack: Rack;
  let server1U: Equipment;

  beforeEach(() => {
    // テスト用ラックの初期化
    testRack = {
      id: 'rack1',
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
      fans: { count: 0, rpm: 0 },
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
        ambientTemp: 20,
        humidity: 50,
        pressureDiff: 0
      },
      pduPlacements: [],
      physicalStructure: createDefaultPhysicalStructure()
    };

    // 1Uサーバーの取得
    server1U = serverEquipment.find(e => e.id === 'server-1u')!;
  });

  test('useRackStateのinstallRailメソッドと同じ方法でレールを設置してサーバーが設置できる', async () => {
    // useRackStateのinstallRailメソッドをシミュレート
    const unit = 10;
    const railType = '1u';
    const railUnits = 1;

    // レール情報を設定（左側）
    for (let u = unit; u < unit + railUnits && u <= testRack.units; u++) {
      if (!testRack.rails[u]) {
        testRack.rails[u] = {
          frontLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          frontRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
          rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
        };
      }

      testRack.rails[u].frontLeft = {
        installed: true,
        railType: railType,
        startUnit: unit,
        endUnit: unit + railUnits - 1,
        railId: `rail-${railType}-${unit}-left`
      };
      testRack.rails[u].rearLeft = {
        installed: true,
        railType: railType,
        startUnit: unit,
        endUnit: unit + railUnits - 1,
        railId: `rail-${railType}-${unit}-rear-left`
      };
    }

    // レール情報を設定（右側）
    for (let u = unit; u < unit + railUnits && u <= testRack.units; u++) {
      testRack.rails[u].frontRight = {
        installed: true,
        railType: railType,
        startUnit: unit,
        endUnit: unit + railUnits - 1,
        railId: `rail-${railType}-${unit}-right`
      };
      testRack.rails[u].rearRight = {
        installed: true,
        railType: railType,
        startUnit: unit,
        endUnit: unit + railUnits - 1,
        railId: `rail-${railType}-${unit}-rear-right`
      };
    }

    // サーバーを設置（通常モード）
    const serverResult = await placementManager.placeEquipment(
      testRack,
      10,
      server1U,
      {},
      false // 通常モード
    );

    expect(serverResult.success).toBe(true);
    expect(serverResult.validation.warnings.length).toBe(0);
    expect(testRack.equipment[10]).toBeDefined();
    expect(testRack.equipment[10].name).toBe('1Uサーバー');
  });

  test('前面のレールのみ設置でもサーバーが設置できる', async () => {
    // 前面のレールのみ設置
    testRack.rails[15] = {
      frontLeft: {
        installed: true,
        railType: '1u',
        startUnit: 15,
        endUnit: 15,
        railId: 'rail-1u-15-left'
      },
      frontRight: {
        installed: true,
        railType: '1u',
        startUnit: 15,
        endUnit: 15,
        railId: 'rail-1u-15-right'
      },
      rearLeft: {
        installed: false,
        railType: null,
        startUnit: null,
        endUnit: null,
        railId: null
      },
      rearRight: {
        installed: false,
        railType: null,
        startUnit: null,
        endUnit: null,
        railId: null
      }
    };

    // サーバーを設置（通常モード）
    const serverResult = await placementManager.placeEquipment(
      testRack,
      15,
      server1U,
      {},
      false // 通常モード
    );

    expect(serverResult.success).toBe(true);
    expect(serverResult.validation.warnings.length).toBe(0);
    expect(testRack.equipment[15]).toBeDefined();
    expect(testRack.equipment[15].name).toBe('1Uサーバー');
  });

  test('レールが設置されていない場合は警告が表示される', async () => {
    // レールなしでサーバーを設置
    const serverResult = await placementManager.placeEquipment(
      testRack,
      20,
      server1U,
      {},
      false // 通常モード
    );

    expect(serverResult.success).toBe(false);
    expect(serverResult.validation.warnings.length).toBe(1);
    expect(serverResult.validation.warnings[0].code).toBe('RAILS_REQUIRED');
  });

  test('Proモードでレールが設置されていない場合はエラーになる', async () => {
    // レールなしでサーバーを設置（Proモード）
    const serverResult = await placementManager.placeEquipment(
      testRack,
      25,
      server1U,
      {},
      true // Proモード
    );

    expect(serverResult.success).toBe(false);
    expect(serverResult.validation.errors.length).toBe(1);
    expect(serverResult.validation.errors[0].code).toBe('RAIL_REQUIRED');
  });

  test('Proモードでレールが設置されている場合は成功する', async () => {
    // レール設置
    testRack.rails[30] = {
      frontLeft: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'rail-1u-30-left'
      },
      frontRight: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'rail-1u-30-right'
      },
      rearLeft: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'rail-1u-30-rear-left'
      },
      rearRight: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'rail-1u-30-rear-right'
      }
    };

    // partInventoryにレール情報を追加（Proモードでは必要）
    testRack.partInventory['rail-1u-30-left'] = {
      id: 'rail-1u-30-left',
      name: '1Uレールキット',
      height: 1,
      depth: 0,
      power: 0,
      heat: 0,
      weight: 2,
      type: 'rail',
      color: '#94A3B8',
      dualPower: false,
      airflow: 'natural',
      cfm: 0,
      heatGeneration: 0,
      description: '1Uサーバー用スライドレール'
    };

    // サーバーを設置（Proモード）
    const serverResult = await placementManager.placeEquipment(
      testRack,
      30,
      server1U,
      {},
      true // Proモード
    );

    expect(serverResult.success).toBe(true);
    expect(serverResult.validation.errors.length).toBe(0);
    expect(testRack.equipment[30]).toBeDefined();
    expect(testRack.equipment[30].name).toBe('1Uサーバー');
  });
});