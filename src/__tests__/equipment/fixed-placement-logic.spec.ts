import { describe, it, expect, beforeEach } from '@jest/globals';
import { EquipmentPlacementManager } from '../services/EquipmentPlacementManager';
import { Rack, Equipment } from '../types';

describe('設置ロジック修正確認テスト', () => {
  let manager: EquipmentPlacementManager;
  let testRack: Rack;

  beforeEach(() => {
    manager = new EquipmentPlacementManager();
    testRack = createTestRack();
  });

  const createTestRack = (): Rack => ({
    id: 'fix-test-rack',
    name: '修正テストラック',
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
    id: 'server-2u-fix-test',
    name: '2Uサーバー（修正テスト）',
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
    description: '2Uサーバー修正テスト用'
  });

  describe('正確な設置範囲の確認', () => {
    it('33-34Uに2Uサーバーを設置した場合、正確に33Uと34Uのみが占有される', async () => {
      const server = create2UServer();

      // 33-34Uに2Uサーバーを設置
      const result = await manager.placeEquipment(testRack, 33, server, {
        autoInstallCageNuts: true
      });

      expect(result.success).toBe(true);

      // 33Uがメインユニットとして設置されている
      expect(testRack.equipment[33]).toBeDefined();
      expect(testRack.equipment[33].isMainUnit).toBe(true);
      expect(testRack.equipment[33].startUnit).toBe(33);
      expect(testRack.equipment[33].endUnit).toBe(34);

      // 34Uが拡張ユニットとして設置されている
      expect(testRack.equipment[34]).toBeDefined();
      expect(testRack.equipment[34].isMainUnit).toBe(false);
      expect(testRack.equipment[34].startUnit).toBe(33);
      expect(testRack.equipment[34].endUnit).toBe(34);

      // 35Uは空きのまま
      expect(testRack.equipment[35]).toBeUndefined();

      // 32Uも空きのまま
      expect(testRack.equipment[32]).toBeUndefined();

      console.log('設置後の状態確認:');
      console.log('32U:', testRack.equipment[32] ? 'occupied' : 'empty');
      console.log('33U:', testRack.equipment[33] ? `occupied (${testRack.equipment[33].isMainUnit ? 'main' : 'sub'})` : 'empty');
      console.log('34U:', testRack.equipment[34] ? `occupied (${testRack.equipment[34].isMainUnit ? 'main' : 'sub'})` : 'empty');
      console.log('35U:', testRack.equipment[35] ? 'occupied' : 'empty');
    });

    it('1-2Uに2Uサーバーを設置した場合、正確に1Uと2Uのみが占有される', async () => {
      const server = create2UServer();

      // 1-2Uに2Uサーバーを設置
      const result = await manager.placeEquipment(testRack, 1, server, {
        autoInstallCageNuts: true
      });

      expect(result.success).toBe(true);

      // 1Uがメインユニットとして設置されている
      expect(testRack.equipment[1]).toBeDefined();
      expect(testRack.equipment[1].isMainUnit).toBe(true);
      expect(testRack.equipment[1].startUnit).toBe(1);
      expect(testRack.equipment[1].endUnit).toBe(2);

      // 2Uが拡張ユニットとして設置されている
      expect(testRack.equipment[2]).toBeDefined();
      expect(testRack.equipment[2].isMainUnit).toBe(false);
      expect(testRack.equipment[2].startUnit).toBe(1);
      expect(testRack.equipment[2].endUnit).toBe(2);

      // 3Uは空きのまま
      expect(testRack.equipment[3]).toBeUndefined();
    });

    it('複数の2Uサーバーを設置した場合、それぞれが正確な範囲を占有する', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-2u-second' };
      const server3 = { ...create2UServer(), id: 'server-2u-third' };

      // 1-2Uに最初のサーバー
      await manager.placeEquipment(testRack, 1, server1, { autoInstallCageNuts: true });

      // 4-5Uに2番目のサーバー
      await manager.placeEquipment(testRack, 4, server2, { autoInstallCageNuts: true });

      // 7-8Uに3番目のサーバー
      await manager.placeEquipment(testRack, 7, server3, { autoInstallCageNuts: true });

      // 各サーバーの占有状況を確認
      expect(testRack.equipment[1]?.isMainUnit).toBe(true);
      expect(testRack.equipment[2]?.isMainUnit).toBe(false);
      expect(testRack.equipment[3]).toBeUndefined(); // 空き

      expect(testRack.equipment[4]?.isMainUnit).toBe(true);
      expect(testRack.equipment[5]?.isMainUnit).toBe(false);
      expect(testRack.equipment[6]).toBeUndefined(); // 空き

      expect(testRack.equipment[7]?.isMainUnit).toBe(true);
      expect(testRack.equipment[8]?.isMainUnit).toBe(false);
      expect(testRack.equipment[9]).toBeUndefined(); // 空き

      // 機器IDが異なることを確認
      expect(testRack.equipment[1].id).not.toBe(testRack.equipment[4].id);
      expect(testRack.equipment[4].id).not.toBe(testRack.equipment[7].id);
    });
  });

  describe('占有チェックの正確性', () => {
    it('33-34Uに設置後、35Uに新しい機器を設置できる', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-1u-single', height: 1 };

      // 33-34Uに2Uサーバーを設置
      await manager.placeEquipment(testRack, 33, server1, { autoInstallCageNuts: true });

      // 35Uに1Uサーバーを設置しようとする
      const result = await manager.placeEquipment(testRack, 35, server2, { autoInstallCageNuts: true });

      expect(result.success).toBe(true);
      expect(testRack.equipment[35]).toBeDefined();
      expect(testRack.equipment[35].height).toBe(1);
    });

    it('33-34Uに設置後、34Uに重複設置はできない', async () => {
      const server1 = create2UServer();
      const server2 = { ...create2UServer(), id: 'server-conflict', height: 1 };

      // 33-34Uに2Uサーバーを設置
      await manager.placeEquipment(testRack, 33, server1, { autoInstallCageNuts: true });

      // 34Uに1Uサーバーを設置しようとする（失敗すべき）
      const result = await manager.placeEquipment(testRack, 34, server2, { autoInstallCageNuts: true });

      expect(result.success).toBe(false);
      expect(result.validation.errors[0].code).toBe('UNIT_OCCUPIED');
    });
  });

  describe('削除ロジックの確認', () => {
    it('33-34Uの2Uサーバーを削除すると、両方のユニットがクリアされる', async () => {
      const server = create2UServer();

      // 33-34Uに2Uサーバーを設置
      await manager.placeEquipment(testRack, 33, server, { autoInstallCageNuts: true });

      // 確認：設置されている
      expect(testRack.equipment[33]).toBeDefined();
      expect(testRack.equipment[34]).toBeDefined();

      // 削除
      let removeResult = await manager.removeEquipment(testRack, 33);
      expect(removeResult.success).toBe(true);
      
      // 更新されたラックでアサーションを行う
      const updatedRack = removeResult.updatedRack!;

      // 確認：両方のユニットがクリアされている
      expect(updatedRack.equipment[33]).toBeUndefined();
      expect(updatedRack.equipment[34]).toBeUndefined();

      // 35Uは影響されない（元々空き）
      expect(updatedRack.equipment[35]).toBeUndefined();
    });
  });
});