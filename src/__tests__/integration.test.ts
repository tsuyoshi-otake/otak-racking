import { describe, it, expect, beforeEach } from '@jest/globals';
import { EquipmentPlacementManager } from '../services/EquipmentPlacementManager';
import { canPlaceEquipmentAdvanced } from '../utils';
import { Rack, Equipment } from '../types';

describe('新しい機器設置システム統合テスト', () => {
  let manager: EquipmentPlacementManager;
  let testRack: Rack;

  beforeEach(() => {
    manager = new EquipmentPlacementManager();
    testRack = createTestRack();
  });

  const createTestRack = (): Rack => ({
    id: 'integration-test-rack',
    name: '統合テストラック',
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
    id: 'server-2u-integration',
    name: '2Uサーバー（統合テスト）',
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
    description: '2Uサーバー統合テスト用'
  });

  const create1UServer = (): Equipment => ({
    id: 'server-1u-integration',
    name: '1Uサーバー（統合テスト）',
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
    description: '1Uサーバー統合テスト用'
  });

  describe('2Uサーバー配置問題の修正確認', () => {
    it('元の問題を再現：3-4Uに2Uサーバー設置後、1-2Uに別の2Uサーバーを設置', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-second' };

      // Step 1: 3-4Uに最初の2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 3, server1, {
        autoInstallCageNuts: true
      });
      expect(result1.success).toBe(true);
      expect(testRack.equipment[3]).toBeDefined();
      expect(testRack.equipment[4]).toBeDefined();
      expect(testRack.equipment[3].isMainUnit).toBe(true);
      expect(testRack.equipment[4].isMainUnit).toBe(false);

      // Step 2: 1-2Uに2番目の2Uサーバーを設置
      const result2 = await manager.placeEquipment(testRack, 1, server2, {
        autoInstallCageNuts: true
      });
      expect(result2.success).toBe(true);
      expect(testRack.equipment[1]).toBeDefined();
      expect(testRack.equipment[2]).toBeDefined();
      expect(testRack.equipment[1].isMainUnit).toBe(true);
      expect(testRack.equipment[2].isMainUnit).toBe(false);

      // 配置状態の最終確認
      expect(testRack.equipment[1].id).not.toBe(testRack.equipment[3].id);
      expect(testRack.equipment[1].startUnit).toBe(1);
      expect(testRack.equipment[1].endUnit).toBe(2);
      expect(testRack.equipment[3].startUnit).toBe(3);
      expect(testRack.equipment[3].endUnit).toBe(4);
    });

    it('canPlaceEquipmentAdvanced関数での配置可能性チェック', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-second' };

      // Step 1: 3-4Uに最初の2Uサーバーを設置
      await manager.placeEquipment(testRack, 3, server1, { autoInstallCageNuts: true });

      // Step 2: utils関数を使って1-2Uの配置可能性をチェック
      const checkResult = await canPlaceEquipmentAdvanced(testRack, 1, server2);
      expect(checkResult.canPlace).toBe(true);
      expect(checkResult.warnings).toBeDefined();

      // Step 3: 実際に配置
      const result = await manager.placeEquipment(testRack, 1, server2, { autoInstallCageNuts: true });
      expect(result.success).toBe(true);
    });

    it('異なるサイズの機器混在配置', async () => {
      const server2U = create2UServer();
      const server1U1 = create1UServer();
      const server1U2 = { ...create1UServer(), id: 'server-1u-second' };

      // 1-2Uに2Uサーバーを設置
      const result1 = await manager.placeEquipment(testRack, 1, server2U, { autoInstallCageNuts: true });
      expect(result1.success).toBe(true);

      // 3Uに1Uサーバーを設置
      const result2 = await manager.placeEquipment(testRack, 3, server1U1, { autoInstallCageNuts: true });
      expect(result2.success).toBe(true);

      // 4Uに別の1Uサーバーを設置
      const result3 = await manager.placeEquipment(testRack, 4, server1U2, { autoInstallCageNuts: true });
      expect(result3.success).toBe(true);

      // 配置状態確認
      expect(testRack.equipment[1].height).toBe(2);
      expect(testRack.equipment[2].height).toBe(2);
      expect(testRack.equipment[3].height).toBe(1);
      expect(testRack.equipment[4].height).toBe(1);
      expect(testRack.equipment[1].isMainUnit).toBe(true);
      expect(testRack.equipment[2].isMainUnit).toBe(false);
      expect(testRack.equipment[3].isMainUnit).toBe(true);
      expect(testRack.equipment[4].isMainUnit).toBe(true);
    });
  });

  describe('占有チェックの正確性', () => {
    it('重複配置を正しく拒否する', async () => {
      const server1 = create2UServer();
      const server2 = { ...create1UServer(), id: 'server-1u-conflict' };

      // 1-2Uに2Uサーバーを設置
      await manager.placeEquipment(testRack, 1, server1, { autoInstallCageNuts: true });

      // 2Uに1Uサーバーを設置しようとする（占有されているため失敗すべき）
      const result = await manager.placeEquipment(testRack, 2, server2, { autoInstallCageNuts: true });
      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('UNIT_OCCUPIED');
      expect(result.validation.errors[0].affectedUnits).toContain(2);
    });

    it('隣接する空きユニットへの配置は成功する', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-adjacent' };

      // 1-2Uに2Uサーバーを設置
      await manager.placeEquipment(testRack, 1, server1, { autoInstallCageNuts: true });

      // 3-4Uに別の2Uサーバーを設置（隣接するが重複しない）
      const result = await manager.placeEquipment(testRack, 3, server2, { autoInstallCageNuts: true });
      expect(result.success).toBe(true);
    });
  });

  describe('機器削除の正確性', () => {
    it('2Uサーバーの削除で両方のユニットがクリアされる', async () => {
      const server = create2UServer();

      // 1-2Uに2Uサーバーを設置
      await manager.placeEquipment(testRack, 1, server, { autoInstallCageNuts: true });
      expect(testRack.equipment[1]).toBeDefined();
      expect(testRack.equipment[2]).toBeDefined();

      // 削除
      let removeResult = await manager.removeEquipment(testRack, 1);
      expect(removeResult.success).toBe(true);
      let updatedRack = removeResult.updatedRack!;
      expect(updatedRack.equipment[1]).toBeUndefined();
      expect(updatedRack.equipment[2]).toBeUndefined();

      // 削除後に同じ場所に新しい機器を設置できる
      const newServer = { ...create2UServer(), id: 'server-2u-new' };
      const result = await manager.placeEquipment(updatedRack, 1, newServer, { autoInstallCageNuts: true });
      expect(result.success).toBe(true);
    });

    it('複数機器設置後の部分削除', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-second' };
      const server3 = create1UServer();

      // 複数機器を設置
      await manager.placeEquipment(testRack, 1, server1, { autoInstallCageNuts: true });
      await manager.placeEquipment(testRack, 3, server2, { autoInstallCageNuts: true });
      await manager.placeEquipment(testRack, 5, server3, { autoInstallCageNuts: true });

      // 中間の機器を削除
      const removeResult = await manager.removeEquipment(testRack, 3);
      let updatedRack = removeResult.updatedRack!;

      // 削除されたユニットが空いていることを確認
      expect(updatedRack.equipment[3]).toBeUndefined();
      expect(updatedRack.equipment[4]).toBeUndefined();

      // 他の機器は残っていることを確認
      expect(updatedRack.equipment[1]).toBeDefined();
      expect(updatedRack.equipment[2]).toBeDefined();
      expect(updatedRack.equipment[5]).toBeDefined();

      // 削除された場所に新しい機器を設置できる
      const newServer = { ...create1UServer(), id: 'server-1u-replacement' };
      const result = await manager.placeEquipment(updatedRack, 3, newServer, { autoInstallCageNuts: true });
      expect(result.success).toBe(true);
    });
  });

  describe('自動ゲージナット設置', () => {
    it('レール不要機器の自動ゲージナット設置', async () => {
      const server = { ...create1UServer(), needsRails: false };

      const result = await manager.placeEquipment(testRack, 1, server, { 
        autoInstallCageNuts: true 
      });

      expect(result.success).toBe(true);
      expect(testRack.cageNuts[1]).toBeDefined();
      expect(testRack.cageNuts[1].frontLeft.top).toBe('m6');
      expect(testRack.cageNuts[1].frontLeft.bottom).toBe('m6');

      // 変更履歴にゲージナット設置が含まれることを確認
      const cageNutChanges = result.appliedChanges.filter(c => c.type === 'cagenut');
      expect(cageNutChanges.length).toBeGreaterThan(0);
    });
  });

  describe('占有状況管理', () => {
    it('getRackOccupancyが正確な占有状況を返す', async () => {
      const server2U = create2UServer();
      const server1U = create1UServer();

      // 機器を設置
      await manager.placeEquipment(testRack, 1, server2U, { autoInstallCageNuts: true });
      await manager.placeEquipment(testRack, 4, server1U, { autoInstallCageNuts: true });

      const occupancy = manager.getRackOccupancy(testRack);

      // 2Uサーバーの占有状況
      expect(occupancy[1]).not.toBeNull();
      expect(occupancy[1]?.isMainUnit).toBe(true);
      expect(occupancy[1]?.position.startUnit).toBe(1);
      expect(occupancy[1]?.position.endUnit).toBe(2);

      expect(occupancy[2]).not.toBeNull();
      expect(occupancy[2]?.isMainUnit).toBe(false);
      expect(occupancy[2]?.position.startUnit).toBe(1);
      expect(occupancy[2]?.position.endUnit).toBe(2);

      // 1Uサーバーの占有状況
      expect(occupancy[4]).not.toBeNull();
      expect(occupancy[4]?.isMainUnit).toBe(true);
      expect(occupancy[4]?.position.startUnit).toBe(4);
      expect(occupancy[4]?.position.endUnit).toBe(4);

      // 空きユニット
      expect(occupancy[3]).toBeNull();
      expect(occupancy[5]).toBeNull();
    });
  });
});