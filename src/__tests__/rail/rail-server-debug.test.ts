import { describe, test, expect, beforeEach } from '@jest/globals';
import { Rack, Equipment, createDefaultPhysicalStructure } from '../types';
import { placementManagerDebug } from '../services/EquipmentPlacementManager.debug';
import { serverEquipment } from '../constants';

describe('Rail and Server Placement Debug Tests', () => {
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

  test('通常モードでレール設置後にサーバーが設置できる', async () => {
    console.log('\n=== TEST: 通常モードでレール設置後にサーバーが設置できる ===\n');

    // 1. レール機器を作成
    const railEquipment: Equipment = {
      id: 'rail-1u',
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
      description: '1Uサーバー用スライドレール',
      mountingMethod: 'direct'
    };

    // 2. レールを設置（ユニット10）
    console.log('Step 1: Installing rail at unit 10');
    const railResult = await placementManagerDebug.placeEquipment(
      testRack,
      10,
      railEquipment,
      {},
      false // 通常モード
    );

    expect(railResult.success).toBe(true);
    console.log('Rail installation result:', railResult.success);
    console.log('Rails after installation:', testRack.rails[10]);
    console.log('Part inventory after installation:', Object.keys(testRack.partInventory));

    // 3. サーバーを設置（ユニット10）
    console.log('\nStep 2: Installing server at unit 10');
    const serverResult = await placementManagerDebug.placeEquipment(
      testRack,
      10,
      server1U,
      {},
      false // 通常モード
    );

    console.log('Server installation result:', serverResult);
    expect(serverResult.success).toBe(true);
    expect(testRack.equipment[10]).toBeDefined();
    expect(testRack.equipment[10].name).toBe('1Uサーバー');
  });

  test('Proモードでレール設置後にサーバーが設置できる', async () => {
    console.log('\n=== TEST: Proモードでレール設置後にサーバーが設置できる ===\n');

    // 1. レール機器を作成
    const railEquipment: Equipment = {
      id: 'rail-1u',
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
      description: '1Uサーバー用スライドレール',
      mountingMethod: 'direct'
    };

    // 2. レールを設置（ユニット15）
    console.log('Step 1: Installing rail at unit 15');
    const railResult = await placementManagerDebug.placeEquipment(
      testRack,
      15,
      railEquipment,
      {},
      true // Proモード
    );

    expect(railResult.success).toBe(true);
    console.log('Rail installation result:', railResult.success);
    console.log('Rails after installation:', testRack.rails[15]);
    console.log('Part inventory after installation:', Object.keys(testRack.partInventory));

    // 3. サーバーを設置（ユニット15）
    console.log('\nStep 2: Installing server at unit 15 in Pro Mode');
    const serverResult = await placementManagerDebug.placeEquipment(
      testRack,
      15,
      server1U,
      {},
      true // Proモード
    );

    console.log('Server installation result:', serverResult);
    
    if (!serverResult.success) {
      console.log('Installation failed!');
      console.log('Errors:', serverResult.validation.errors);
      console.log('Warnings:', serverResult.validation.warnings);
    }

    expect(serverResult.success).toBe(true);
    expect(testRack.equipment[15]).toBeDefined();
    expect(testRack.equipment[15].name).toBe('1Uサーバー');
  });

  test('useRackStateのinstallRailメソッドで設置したレールでサーバーが設置できる', async () => {
    console.log('\n=== TEST: useRackStateのinstallRailメソッドで設置したレールでサーバーが設置できる ===\n');

    // useRackStateのinstallRailメソッドをシミュレート
    const unit = 20;
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

    console.log('Rails after manual installation:', testRack.rails[20]);

    // サーバーを設置（通常モード）
    console.log('\nInstalling server at unit 20 in normal mode');
    const serverResult = await placementManagerDebug.placeEquipment(
      testRack,
      20,
      server1U,
      {},
      false // 通常モード
    );

    console.log('Server installation result:', serverResult);
    
    if (!serverResult.success) {
      console.log('Installation failed!');
      console.log('Errors:', serverResult.validation.errors);
      console.log('Warnings:', serverResult.validation.warnings);
    }

    expect(serverResult.success).toBe(true);
    expect(testRack.equipment[20]).toBeDefined();
    expect(testRack.equipment[20].name).toBe('1Uサーバー');
  });

  test('レール設置方法の違いによる動作確認', async () => {
    console.log('\n=== TEST: レール設置方法の違いによる動作確認 ===\n');

    // 方法1: EquipmentPlacementManagerでレール機器として設置
    const railEquipment: Equipment = {
      id: 'rail-1u',
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
      description: '1Uサーバー用スライドレール',
      mountingMethod: 'direct'
    };

    console.log('Method 1: Installing rail via EquipmentPlacementManager');
    const railResult1 = await placementManagerDebug.placeEquipment(
      testRack,
      25,
      railEquipment,
      {},
      false
    );
    console.log('Rails at unit 25 after method 1:', testRack.rails[25]);
    console.log('Part inventory:', testRack.partInventory);

    // 方法2: 手動でrails構造を設定（useRackStateのinstallRailメソッドと同じ）
    console.log('\nMethod 2: Manual rail structure setup');
    testRack.rails[30] = {
      frontLeft: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'manual-rail-1'
      },
      frontRight: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'manual-rail-2'
      },
      rearLeft: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'manual-rail-3'
      },
      rearRight: {
        installed: true,
        railType: '1u',
        startUnit: 30,
        endUnit: 30,
        railId: 'manual-rail-4'
      }
    };
    console.log('Rails at unit 30 after method 2:', testRack.rails[30]);

    // 両方の方法でサーバー設置を試みる
    console.log('\nTrying to install server at unit 25 (method 1)');
    const serverResult1 = await placementManagerDebug.placeEquipment(
      testRack,
      25,
      server1U,
      {},
      false
    );
    console.log('Result:', serverResult1.success);
    if (!serverResult1.success) {
      console.log('Warnings:', serverResult1.validation.warnings);
    }

    console.log('\nTrying to install server at unit 30 (method 2)');
    const serverResult2 = await placementManagerDebug.placeEquipment(
      testRack,
      30,
      server1U,
      {},
      false
    );
    console.log('Result:', serverResult2.success);
    if (!serverResult2.success) {
      console.log('Warnings:', serverResult2.validation.warnings);
    }

    // 両方成功するはず
    expect(serverResult1.success).toBe(true);
    expect(serverResult2.success).toBe(true);
  });
});