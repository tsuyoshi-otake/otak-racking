import { describe, it, expect, beforeEach } from '@jest/globals';
import { EquipmentPlacementManager } from '../services/EquipmentPlacementManager';
import { Rack, Equipment } from '../types';

describe('EquipmentPlacementManager', () => {
  let manager: EquipmentPlacementManager;
  let testRack: Rack;

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
    rails: {},
    partInventory: {},
    fans: { count: 4, rpm: 3000 },
    position: { row: 'A', column: 1 },
    cabling: { external: {}, overhead: {}, underfloor: {} },
    housing: { type: 'full', startUnit: 1, endUnit: 42, frontPanel: 'perforated', rearPanel: 'perforated' },
    pduPlacements: [],
    environment: { ambientTemp: 22, humidity: 45, pressureDiff: 0.2 },
    physicalStructure: {
      frame: { material: 'steel', color: '#2d3748', thickness: 2, coating: 'powder', style: 'standard' },
      frontDoor: { type: 'mesh', locked: false, opened: false, color: '#2d3748', transparency: 0, ventilation: 80 },
      rearDoor: { type: 'mesh', locked: false, opened: false, color: '#2d3748', transparency: 0, ventilation: 80 },
      leftPanel: { type: 'steel', mounted: true, color: '#2d3748', transparency: 0, ventilation: 0, removable: true },
      rightPanel: { type: 'steel', mounted: true, color: '#2d3748', transparency: 0, ventilation: 0, removable: true },
      mountingPosts: {
        frontLeft: { type: 'square', holes: 'cage-nut', spacing: 25.4, depth: 50 },
        frontRight: { type: 'square', holes: 'cage-nut', spacing: 25.4, depth: 50 },
        rearLeft: { type: 'square', holes: 'cage-nut', spacing: 25.4, depth: 50 },
        rearRight: { type: 'square', holes: 'cage-nut', spacing: 25.4, depth: 50 }
      },
      base: { type: 'adjustable', height: 100, loadCapacity: 1000, leveling: true, antivibration: false },
      top: { type: 'cable-tray', cableManagement: true, loadCapacity: 50, fanMounts: 0 },
      dimensions: { externalWidth: 600, externalDepth: 1000, externalHeight: 2000, internalWidth: 482.6, internalDepth: 900, usableHeight: 1778 },
      weight: { empty: 150, maxLoad: 1000, current: 150 },
      ventilation: { frontAirflow: 0, rearAirflow: 0, sideAirflow: 0, totalCapacity: 1000 }
    }
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
    requiresRails: true,
    mountingMethod: 'rails' as const,
    requiresCageNuts: false,
    airflow: 'front-to-rear',
    cfm: 120,
    heatGeneration: 1707,
    description: '2Uサーバーテスト用'
  });

  const create2URail = (): Equipment => ({
    id: 'rail-2u',
    name: '2Uレールキット',
    height: 2,
    depth: 700,
    power: 0,
    heat: 0,
    weight: 2,
    type: 'rail',
    color: '#9CA3AF',
    dualPower: false,
    requiresRails: false,
    mountingMethod: 'direct',
    requiresCageNuts: false,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: '2U機器用レールキット'
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
    requiresRails: true,
    mountingMethod: 'rails' as const,
    requiresCageNuts: false,
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
    requiresRails: false,
    mountingMethod: 'cage-nuts' as const,
    requiresCageNuts: true,
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
    requiresRails: false,
    mountingMethod: 'shelf' as const,
    requiresCageNuts: false,
    requiresShelf: true,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: '神棚'
  });

  beforeEach(() => {
    manager = new EquipmentPlacementManager();
    testRack = createTestRack();
  });

  describe('基本的な配置テスト', () => {
    it('空のラックに1Uサーバーを配置できる', async () => {
      const server = create1UServer();
      const result = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true });
      
      expect(result.success).toBe(true);
      expect(result.position).toEqual({ startUnit: 1, endUnit: 1 });
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
      expect(result.updatedRack).toBeDefined();
      expect(result.updatedRack?.equipment[1]).toBeDefined();
    });

    it('空のラックに2Uサーバーを配置できる', async () => {
      const server = create2UServer();
      const result = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true });
      
      expect(result.success).toBe(true);
      expect(result.position).toEqual({ startUnit: 1, endUnit: 2 });
      expect(result.validation.isValid).toBe(true);
      expect(result.updatedRack).toBeDefined();
      const updatedRack = result.updatedRack!;
      expect(updatedRack.equipment[1]).toBeDefined();
      expect(updatedRack.equipment[2]).toBeDefined();
      expect(updatedRack.equipment[1].isMainUnit).toBe(true);
      expect(updatedRack.equipment[2].isMainUnit).toBe(false);
    });
  });

  describe('2Uサーバー配置問題の修正確認', () => {
    it('3-4Uに2Uサーバー設置後、1-2Uに別の2Uサーバーを設置できる', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-second' };
      
      // 3-4Uに最初の2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 3, server1, { skipWarnings: true });
      expect(result1.success).toBe(true);
      expect(result1.updatedRack).toBeDefined();
      
      // 1-2Uに2番目の2Uサーバーを設置
      const result2 = await manager.placeEquipment(result1.updatedRack!, 1, server2, { skipWarnings: true });
      expect(result2.success).toBe(true);
      expect(result2.position).toEqual({ startUnit: 1, endUnit: 2 });
      
      // 設置状態の確認
      const finalRack = result2.updatedRack!;
      expect(finalRack.equipment[1].isMainUnit).toBe(true);
      expect(finalRack.equipment[2].isMainUnit).toBe(false);
      expect(finalRack.equipment[3].isMainUnit).toBe(true);
      expect(finalRack.equipment[4].isMainUnit).toBe(false);
    });

    it('2-3Uに2Uサーバー設置後、1Uに1Uサーバーを設置できる', async () => {
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 2-3Uに2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 2, server2U, { skipWarnings: true });
      expect(result1.success).toBe(true);
      expect(result1.updatedRack).toBeDefined();
      
      // 1Uに1Uサーバーを設置
      const result2 = await manager.placeEquipment(result1.updatedRack!, 1, server1U, { skipWarnings: true });
      expect(result2.success).toBe(true);
      expect(result2.position).toEqual({ startUnit: 1, endUnit: 1 });
    });

    it('1-2Uに2Uサーバー設置後、2Uに機器を設置しようとするとエラー', async () => {
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 1-2Uに2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 1, server2U, { skipWarnings: true });
      expect(result1.success).toBe(true);
      expect(result1.updatedRack).toBeDefined();
      
      // 2Uに1Uサーバーを設置しようとする
      const result2 = await manager.placeEquipment(result1.updatedRack!, 2, server1U, { skipWarnings: true });
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
      const result1 = await manager.placeEquipment(testRack, 1, server1, { skipWarnings: true });
      expect(result1.updatedRack).toBeDefined();
      
      // 同じ1Uに再度設置しようとする
      const result2 = await manager.placeEquipment(result1.updatedRack!, 1, server2);
      expect(result2.success).toBe(false);
      expect(result2.validation.errors[0].code).toBe('UNIT_OCCUPIED');
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
      const result1 = await manager.placeEquipment(testRack, 1, shelf, { skipWarnings: true });
      expect(result1.success).toBe(true);
      expect(result1.updatedRack).toBeDefined();
      
      // 2Uに神棚を設置
      const result2 = await manager.placeEquipment(result1.updatedRack!, 2, kamidana);
      expect(result2.success).toBe(true);
    });
  });

  describe('ゲージナット自動設置テスト', () => {
    it('autoInstallCageNutsオプションでゲージナットが自動設置される', async () => {
      const server = { ...create1UServer(), requiresRails: false, mountingMethod: 'cage-nuts' as const, requiresCageNuts: true }; // ケージナット取り付けに変更
      
      const result = await manager.placeEquipment(testRack, 1, server, {
        autoInstallCageNuts: true
      });
      
      expect(result.success).toBe(true);
      const updatedRack = result.updatedRack!;
      expect(updatedRack.cageNuts[1]).toBeDefined();
      expect(updatedRack.cageNuts[1].frontLeft.top).toBe('m6');
      expect(updatedRack.cageNuts[1].frontLeft.bottom).toBe('m6');
      
      // 変更履歴にゲージナット設置が含まれることを確認
      const cageNutChanges = result.appliedChanges.filter(c => c.type === 'cagenut');
      expect(cageNutChanges).toHaveLength(1);
    });
  });

  describe('機器削除テスト', () => {
    it('機器を正常に削除できる', async () => {
      const server = create2UServer();
      
      // 設置
      const placeResult = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true });
      expect(placeResult.success).toBe(true);
      const rackAfterPlace = placeResult.updatedRack!;
      expect(rackAfterPlace.equipment[1]).toBeDefined();
      expect(rackAfterPlace.equipment[2]).toBeDefined();
      
      // 削除
      const removeResult = await manager.removeEquipment(rackAfterPlace, 1);
      expect(removeResult.success).toBe(true);
      const rackAfterRemove = removeResult.updatedRack!;
      expect(rackAfterRemove.equipment[1]).toBeUndefined();
      expect(rackAfterRemove.equipment[2]).toBeUndefined();
      
      // 関連設定も削除されることを確認
      const equipmentId = removeResult.appliedChanges.find(c => c.type === 'equipment')?.oldValue?.id;
      expect(rackAfterRemove.powerConnections[equipmentId!]).toBeUndefined();
      expect(rackAfterRemove.mountingOptions[equipmentId!]).toBeUndefined();
      expect(rackAfterRemove.labels[equipmentId!]).toBeUndefined();
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
      expect(result.updatedRack?.equipment[1]).toBeUndefined(); // 実際には配置されない
    });
  });

  describe('警告処理テスト', () => {
    it('ゲージナット不足の警告が表示される', async () => {
      const server = { ...create1UServer(), requiresRails: false, mountingMethod: 'cage-nuts' as const, requiresCageNuts: true };
      
      const result = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true });
      
      expect(result.success).toBe(true); // ケージナット警告は出るが配置は成功（新しいロジック）
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
    });

    it('skipWarningsオプションで警告を無視して配置できる', async () => {
      const server = { ...create1UServer(), requiresRails: false, mountingMethod: 'cage-nuts' as const, requiresCageNuts: true };
      
      const result = await manager.placeEquipment(testRack, 1, server, { 
        skipWarnings: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1); // 警告は表示されるが配置は成功
      expect(result.updatedRack?.equipment[1]).toBeDefined();
    });
  });

  describe('ラック占有状況取得テスト', () => {
    it('正しい占有状況を取得できる', async () => {
      const server = create2UServer();
      const result = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true });
      const updatedRack = result.updatedRack!;
      
      const occupancy = manager.getRackOccupancy(updatedRack);
      
      expect(occupancy[1]).not.toBeNull();
      expect(occupancy[1]?.isMainUnit).toBe(true);
      expect(occupancy[1]?.position).toEqual({ startUnit: 1, endUnit: 2 });
      
      expect(occupancy[2]).not.toBeNull();
      expect(occupancy[2]?.isMainUnit).toBe(false);
      
      expect(occupancy[3]).toBeNull();
    });
  });

  describe('clearAllEquipment', () => {
    it('should clear all equipment, cage nuts, and rails from rack', async () => {
      const manager = new EquipmentPlacementManager();
      const rack = createTestRack();
      
      // ケージナットを設置
      rack.cageNuts[5] = {
        frontLeft: { top: 'm6', middle: 'm6', bottom: 'm6' },
        frontRight: { top: 'm6', middle: 'm6', bottom: 'm6' },
        rearLeft: { top: 'm6', middle: 'm6', bottom: 'm6' },
        rearRight: { top: 'm6', middle: 'm6', bottom: 'm6' }
      };
      
      // レールを設置
      rack.rails[10] = {
        frontLeft: { installed: true, railType: '2u', startUnit: 10, endUnit: 11, railId: 'rail-1' },
        frontRight: { installed: true, railType: '2u', startUnit: 10, endUnit: 11, railId: 'rail-1' },
        rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
        rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
      };
      
      // 機器を追加
      const server = create2UServer();
      await manager.placeEquipment(rack, 20, server);
      
      const result = await manager.clearAllEquipment(rack);
      
      expect(result.success).toBe(true);
      expect(result.updatedRack?.equipment).toEqual({});
      expect(result.updatedRack?.powerConnections).toEqual({});
      expect(result.updatedRack?.mountingOptions).toEqual({});
      expect(result.updatedRack?.labels).toEqual({});
      expect(result.updatedRack?.cageNuts).toEqual({});
      expect(result.updatedRack?.rails).toEqual({});
      
      // 変更履歴を確認
      const cageNutChanges = result.appliedChanges.filter(c => c.type === 'cagenut');
      const railChanges = result.appliedChanges.filter(c => c.type === 'rail');
      
      expect(cageNutChanges.length).toBeGreaterThan(0);
      expect(railChanges.length).toBeGreaterThan(0);
      expect(cageNutChanges[0].action).toBe('remove');
      expect(railChanges[0].action).toBe('remove');
    });
  });

  describe('Proモード ケージナット制約テスト', () => {
    const createCageNutServer = (): Equipment => ({
      id: 'server-1u-cagenut',
      name: '1U CageNutサーバー',
      height: 1,
      depth: 500,
      power: 200,
      heat: 700,
      weight: 10,
      type: 'server',
      color: '#8B5CF6',
      dualPower: false,
      requiresRails: false,
      mountingMethod: 'cage-nuts' as const,
      requiresCageNuts: true,
      airflow: 'front-to-rear',
      cfm: 50,
      heatGeneration: 700,
      description: 'ケージナット固定サーバー'
    });

    it('ProモードON: ケージナットがないと設置に失敗する', async () => {
      const server = createCageNutServer();
      const result = await manager.placeEquipment(testRack, 1, server, {}, true); // isProMode = true

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].code).toBe('CAGE_NUT_REQUIRED');
    });

    it('ProモードON: ケージナットが正しく設置されていれば設置に成功する', async () => {
      const server = createCageNutServer();
      
      // 前面の左右にケージナットを設置
      testRack.cageNuts[1] = {
        frontLeft: { top: 'm6', middle: 'm6', bottom: 'm6' },
        frontRight: { top: 'm6', middle: 'm6', bottom: 'm6' },
        rearLeft: { top: null, middle: null, bottom: null },
        rearRight: { top: null, middle: null, bottom: null }
      };

      const result = await manager.placeEquipment(testRack, 1, server, {}, true); // isProMode = true

      expect(result.success).toBe(true);
      expect(result.validation.isValid).toBe(true);
      expect(result.updatedRack?.equipment[1]).toBeDefined();
    });

    it('ProモードOFF: ケージナットがなくても警告のみで設置は成功する', async () => {
      const server = createCageNutServer();
      const result = await manager.placeEquipment(testRack, 1, server, {}, false); // isProMode = false

      expect(result.success).toBe(false); // skipWarnings: false なので失敗する
      expect(result.validation.isValid).toBe(true); // エラーはない
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
      
      // skipWarnings: true で再試行
      const result2 = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true }, false);
      expect(result2.success).toBe(true);
      expect(result2.updatedRack?.equipment[1]).toBeDefined();
    });
  });

  describe('Proモード レール制約テスト', () => {
    it('ProモードON: レールがないと設置に失敗する', async () => {
      const server = create2UServer();
      const result = await manager.placeEquipment(testRack, 1, server, {}, true); // isProMode = true

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].code).toBe('RAIL_REQUIRED');
    });

    it('ProモードON: 対応するレールが設置されていれば設置に成功する', async () => {
      const server = create2UServer();
      const rail = create2URail();

      // 1-2Uにレールを設置
      const railPlaceResult = await manager.placeEquipment(testRack, 1, rail, { skipWarnings: true });
      expect(railPlaceResult.success).toBe(true);
      const rackWithRail = railPlaceResult.updatedRack!;

      // 1-2Uにサーバーを設置
      const serverPlaceResult = await manager.placeEquipment(rackWithRail, 1, server, {}, true);

      expect(serverPlaceResult.success).toBe(true);
      expect(serverPlaceResult.validation.isValid).toBe(true);
      expect(serverPlaceResult.updatedRack?.equipment[1].id).toContain('server-2u');
    });

    it('ProモードON: サイズの違うレールが設置されている場合は失敗する', async () => {
      const server = create2UServer(); // 2Uサーバー
      const rail = { ...create2URail(), id: 'rail-1u', name: '1Uレールキット', height: 1 }; // 1Uレール

      // 1Uに1Uレールを設置
      const railPlaceResult = await manager.placeEquipment(testRack, 1, rail, { skipWarnings: true });
      expect(railPlaceResult.success).toBe(true);
      const rackWithRail = railPlaceResult.updatedRack!;

      // 1-2Uに2Uサーバーを設置しようとする
      const serverPlaceResult = await manager.placeEquipment(rackWithRail, 1, server, {}, true);

      expect(serverPlaceResult.success).toBe(false);
      expect(serverPlaceResult.validation.errors[0].code).toBe('RAIL_REQUIRED');
    });

    it('ProモードOFF: レールがなくても警告のみで設置は成功する', async () => {
      const server = create2UServer();
      
      // isProMode = false, skipWarnings = false
      const result1 = await manager.placeEquipment(testRack, 1, server, {}, false);
      expect(result1.success).toBe(false); // 警告があるので失敗
      expect(result1.validation.isValid).toBe(true);
      expect(result1.validation.warnings).toHaveLength(1);
      expect(result1.validation.warnings[0].code).toBe('RAILS_REQUIRED');

      // isProMode = false, skipWarnings = true
      const result2 = await manager.placeEquipment(testRack, 1, server, { skipWarnings: true }, false);
      expect(result2.success).toBe(true);
      expect(result2.updatedRack?.equipment[1]).toBeDefined();
    });
  });
});