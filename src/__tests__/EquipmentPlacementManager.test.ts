import { describe, it, expect, beforeEach } from '@jest/globals';
import { EquipmentPlacementManager } from '../services/EquipmentPlacementManager';
import { Rack, Equipment } from '../types';

describe('EquipmentPlacementManager', () => {
  let manager: EquipmentPlacementManager;
  let testRack: Rack;

  beforeEach(() => {
    manager = new EquipmentPlacementManager();
    testRack = createTestRack();
  });

  const createTestRack = (): Rack => ({
    id: 'test-rack',
    name: 'テストラック',
    type: '42u-standard',
    units: 42,
    depth: 1000,
    width: 600,
    equipment: {},
    powerConnections: {},
    mountingOptions: {},
    labels: {},
    cageNuts: {},
    railInventory: {},
    partInventory: {},
    fans: { count: 4, rpm: 3000 },
    position: { row: 'A', column: 1 },
    cabling: { external: {}, overhead: {}, underfloor: {} },
    housing: { type: 'full', startUnit: 1, endUnit: 42, frontPanel: 'perforated', rearPanel: 'perforated' },
    environment: { ambientTemp: 22, humidity: 45, pressureDiff: 0.2 }
  });

  const create2UServer = (): Equipment => ({
    id: 'server-2u',
    name: '2Uサーバー',
    height: 2,
    depth: 700,
    power: 500,
    heat: 1707,
    weight: 25,
    type: 'server',
    color: '#7C3AED',
    dualPower: true,
    needsRails: true,
    airflow: 'front-to-rear',
    cfm: 120,
    heatGeneration: 1707,
    description: '2Uサーバーテスト用'
  });

  const create1UServer = (): Equipment => ({
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
    needsRails: true,
    airflow: 'front-to-rear',
    cfm: 65,
    heatGeneration: 1024,
    description: '1Uサーバーテスト用'
  });

  const createShelf = (): Equipment => ({
    id: 'shelf-1u',
    name: '1U棚板',
    height: 1,
    depth: 400,
    power: 0,
    heat: 0,
    weight: 2,
    type: 'shelf',
    color: '#64748B',
    dualPower: false,
    needsRails: false,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: '棚板'
  });

  const createKamidana = (): Equipment => ({
    id: 'kamidana',
    name: '神棚',
    height: 1,
    depth: 200,
    power: 0,
    heat: 0,
    weight: 1,
    type: 'spiritual',
    color: '#F59E0B',
    dualPower: false,
    needsRails: false,
    requiresShelf: true,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: '神棚'
  });

  describe('基本的な配置テスト', () => {
    it('空のラックに1Uサーバーを配置できる', async () => {
      const server = create1UServer();
      const result = await manager.placeEquipment(testRack, 1, server);
      
      expect(result.success).toBe(true);
      expect(result.position).toEqual({ startUnit: 1, endUnit: 1 });
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
      expect(result.appliedChanges).toHaveLength(4); // equipment, power, mounting, label
    });

    it('空のラックに2Uサーバーを配置できる', async () => {
      const server = create2UServer();
      const result = await manager.placeEquipment(testRack, 1, server);
      
      expect(result.success).toBe(true);
      expect(result.position).toEqual({ startUnit: 1, endUnit: 2 });
      expect(result.validation.isValid).toBe(true);
      expect(testRack.equipment[1]).toBeDefined();
      expect(testRack.equipment[2]).toBeDefined();
      expect(testRack.equipment[1].isMainUnit).toBe(true);
      expect(testRack.equipment[2].isMainUnit).toBe(false);
    });
  });

  describe('2Uサーバー配置問題の修正確認', () => {
    it('3-4Uに2Uサーバー設置後、1-2Uに別の2Uサーバーを設置できる', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-second' };
      
      // 3-4Uに最初の2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 3, server1);
      expect(result1.success).toBe(true);
      
      // 1-2Uに2番目の2Uサーバーを設置
      const result2 = await manager.placeEquipment(testRack, 1, server2);
      expect(result2.success).toBe(true);
      expect(result2.position).toEqual({ startUnit: 1, endUnit: 2 });
      
      // 設置状態の確認
      expect(testRack.equipment[1].isMainUnit).toBe(true);
      expect(testRack.equipment[2].isMainUnit).toBe(false);
      expect(testRack.equipment[3].isMainUnit).toBe(true);
      expect(testRack.equipment[4].isMainUnit).toBe(false);
    });

    it('2-3Uに2Uサーバー設置後、1Uに1Uサーバーを設置できる', async () => {
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 2-3Uに2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 2, server2U);
      expect(result1.success).toBe(true);
      
      // 1Uに1Uサーバーを設置
      const result2 = await manager.placeEquipment(testRack, 1, server1U);
      expect(result2.success).toBe(true);
      expect(result2.position).toEqual({ startUnit: 1, endUnit: 1 });
    });

    it('1-2Uに2Uサーバー設置後、2Uに機器を設置しようとするとエラー', async () => {
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 1-2Uに2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 1, server2U);
      expect(result1.success).toBe(true);
      
      // 2Uに1Uサーバーを設置しようとする
      const result2 = await manager.placeEquipment(testRack, 2, server1U);
      expect(result2.success).toBe(false);
      expect(result2.validation.errors).toHaveLength(1);
      expect(result2.validation.errors[0].code).toBe('UNIT_OCCUPIED');
      expect(result2.validation.errors[0].affectedUnits).toContain(2);
    });
  });

  describe('制約チェックテスト', () => {
    it('ラック容量を超える配置を拒否する', async () => {
      const server = create2UServer();
      
      // 42Uに2Uサーバーを配置しようとする（43Uまで必要だが42Uが上限）
      const result = await manager.placeEquipment(testRack, 42, server);
      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('EXCEED_RACK_CAPACITY');
    });

    it('ユニット番号0以下を拒否する', async () => {
      const server = create1UServer();
      
      const result = await manager.placeEquipment(testRack, 0, server);
      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('INVALID_START_UNIT');
    });

    it('既に占有されたユニットへの配置を拒否する', async () => {
      const server1 = create1UServer();
      const server2 = { ...create1UServer(), id: 'server-1u-second' };
      
      // 1Uに設置
      await manager.placeEquipment(testRack, 1, server1);
      
      // 同じ1Uに再度設置しようとする
      const result = await manager.placeEquipment(testRack, 1, server2);
      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('UNIT_OCCUPIED');
    });
  });

  describe('特殊機器設置テスト', () => {
    it('神棚は棚板なしでは設置できない', async () => {
      const kamidana = createKamidana();
      
      const result = await manager.placeEquipment(testRack, 2, kamidana);
      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('SHELF_REQUIRED');
    });

    it('棚板上に神棚を設置できる', async () => {
      const shelf = createShelf();
      const kamidana = createKamidana();
      
      // 1Uに棚板を設置
      const result1 = await manager.placeEquipment(testRack, 1, shelf);
      expect(result1.success).toBe(true);
      
      // 2Uに神棚を設置
      const result2 = await manager.placeEquipment(testRack, 2, kamidana);
      expect(result2.success).toBe(true);
    });
  });

  describe('ゲージナット自動設置テスト', () => {
    it('autoInstallCageNutsオプションでゲージナットが自動設置される', async () => {
      const server = { ...create1UServer(), needsRails: false }; // レール不要に変更
      
      const result = await manager.placeEquipment(testRack, 1, server, {
        autoInstallCageNuts: true
      });
      
      expect(result.success).toBe(true);
      expect(testRack.cageNuts[1]).toBeDefined();
      expect(testRack.cageNuts[1].frontLeft.top).toBe('m6');
      expect(testRack.cageNuts[1].frontLeft.bottom).toBe('m6');
      
      // 変更履歴にゲージナット設置が含まれることを確認
      const cageNutChanges = result.appliedChanges.filter(c => c.type === 'cagenut');
      expect(cageNutChanges).toHaveLength(1);
    });
  });

  describe('機器削除テスト', () => {
    it('機器を正常に削除できる', async () => {
      const server = create2UServer();
      
      // 設置
      await manager.placeEquipment(testRack, 1, server);
      expect(testRack.equipment[1]).toBeDefined();
      expect(testRack.equipment[2]).toBeDefined();
      
      // 削除
      const result = await manager.removeEquipment(testRack, 1);
      expect(result.success).toBe(true);
      expect(testRack.equipment[1]).toBeUndefined();
      expect(testRack.equipment[2]).toBeUndefined();
      
      // 関連設定も削除されることを確認
      const equipmentId = result.appliedChanges.find(c => c.type === 'equipment')?.oldValue?.id;
      expect(testRack.powerConnections[equipmentId!]).toBeUndefined();
      expect(testRack.mountingOptions[equipmentId!]).toBeUndefined();
      expect(testRack.labels[equipmentId!]).toBeUndefined();
    });

    it('存在しない機器の削除を適切にエラーハンドリングする', async () => {
      const result = await manager.removeEquipment(testRack, 1);
      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('EQUIPMENT_NOT_FOUND');
    });
  });

  describe('検証のみモードテスト', () => {
    it('validateOnlyオプションで実際の配置を行わない', async () => {
      const server = create1UServer();
      
      const result = await manager.placeEquipment(testRack, 1, server, { 
        validateOnly: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.validation.isValid).toBe(true);
      expect(result.appliedChanges).toHaveLength(0);
      expect(testRack.equipment[1]).toBeUndefined(); // 実際には配置されない
    });
  });

  describe('警告処理テスト', () => {
    it('ゲージナット不足の警告が表示される', async () => {
      const server = { ...create1UServer(), needsRails: false };
      
      const result = await manager.placeEquipment(testRack, 1, server);
      
      expect(result.success).toBe(false); // 警告があるため配置されない
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
    });

    it('skipWarningsオプションで警告を無視して配置できる', async () => {
      const server = { ...create1UServer(), needsRails: false };
      
      const result = await manager.placeEquipment(testRack, 1, server, { 
        skipWarnings: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1); // 警告は残るが配置される
    });
  });

  describe('ラック占有状況取得テスト', () => {
    it('正しい占有状況を取得できる', async () => {
      const server = create2UServer();
      await manager.placeEquipment(testRack, 1, server);
      
      const occupancy = manager.getRackOccupancy(testRack);
      
      expect(occupancy[1]).not.toBeNull();
      expect(occupancy[1]?.isMainUnit).toBe(true);
      expect(occupancy[1]?.position).toEqual({ startUnit: 1, endUnit: 2 });
      
      expect(occupancy[2]).not.toBeNull();
      expect(occupancy[2]?.isMainUnit).toBe(false);
      
      expect(occupancy[3]).toBeNull();
    });
  });
});