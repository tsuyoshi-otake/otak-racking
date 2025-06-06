import { describe, it, expect } from '@jest/globals';
import { canPlaceEquipment } from '../utils';
import { Rack, Equipment } from '../types';

describe('機器配置ロジック', () => {
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

  describe('2Uサーバーの配置テスト', () => {
    it('空のラックに2Uサーバーを1Uに配置できる', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      
      const result = canPlaceEquipment(rack, 1, server2U);
      expect(result.canPlace).toBe(true);
    });

    it('空のラックに2Uサーバーを42Uに配置できない（ラック容量オーバー）', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      
      const result = canPlaceEquipment(rack, 42, server2U);
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('ラックの容量を超えています');
    });

    it('1Uに1Uサーバーがある場合、2Uに2Uサーバーを配置できる', () => {
      const rack = createTestRack();
      const server1U = create1UServer();
      const server2U = create2UServer();
      
      // 1Uに1Uサーバーを配置
      rack.equipment[1] = {
        ...server1U,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      const result = canPlaceEquipment(rack, 2, server2U);
      expect(result.canPlace).toBe(true);
    });

    it('1Uに2Uサーバーがある場合、1Uより前に機器を配置できない', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 1-2Uに2Uサーバーを配置
      rack.equipment[1] = {
        ...server2U,
        startUnit: 1,
        endUnit: 2,
        isMainUnit: true
      };
      rack.equipment[2] = {
        ...server2U,
        startUnit: 1,
        endUnit: 2,
        isMainUnit: false
      };
      
      // 1Uに1Uサーバーを配置しようとする（既に2Uサーバーが使用中）
      const result = canPlaceEquipment(rack, 1, server1U);
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('既に機器が設置されています');
    });

    it('3-4Uに2Uサーバーがある場合、1-2Uに2Uサーバーを配置できる', () => {
      const rack = createTestRack();
      const server2U_1 = create2UServer();
      const server2U_2 = create2UServer();
      
      // 3-4Uに2Uサーバーを配置
      rack.equipment[3] = {
        ...server2U_1,
        id: 'server-2u-1',
        startUnit: 3,
        endUnit: 4,
        isMainUnit: true
      };
      rack.equipment[4] = {
        ...server2U_1,
        id: 'server-2u-1',
        startUnit: 3,
        endUnit: 4,
        isMainUnit: false
      };
      
      // 1-2Uに別の2Uサーバーを配置
      const result = canPlaceEquipment(rack, 1, server2U_2);
      expect(result.canPlace).toBe(true);
    });

    it('1-2Uに2Uサーバーがある場合、2Uに1Uサーバーを配置できない', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 1-2Uに2Uサーバーを配置
      rack.equipment[1] = {
        ...server2U,
        startUnit: 1,
        endUnit: 2,
        isMainUnit: true
      };
      rack.equipment[2] = {
        ...server2U,
        startUnit: 1,
        endUnit: 2,
        isMainUnit: false
      };
      
      // 2Uに1Uサーバーを配置しようとする（既に2Uサーバーが使用中）
      const result = canPlaceEquipment(rack, 2, server1U);
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('既に機器が設置されています');
    });

    it('連続する複数ユニットの占有チェック', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      
      // 2-3Uに2Uサーバーを配置
      rack.equipment[2] = {
        ...server2U,
        startUnit: 2,
        endUnit: 3,
        isMainUnit: true
      };
      rack.equipment[3] = {
        ...server2U,
        startUnit: 2,
        endUnit: 3,
        isMainUnit: false
      };
      
      // 1-2Uに2Uサーバーを配置しようとする（2Uが既に使用中）
      const result1 = canPlaceEquipment(rack, 1, server2U);
      expect(result1.canPlace).toBe(false);
      
      // 3-4Uに2Uサーバーを配置しようとする（3Uが既に使用中）
      const result2 = canPlaceEquipment(rack, 3, server2U);
      expect(result2.canPlace).toBe(false);
      
      // 4-5Uに2Uサーバーを配置する（空いている）
      const result3 = canPlaceEquipment(rack, 4, server2U);
      expect(result3.canPlace).toBe(true);
    });
  });

  describe('エッジケーステスト', () => {
    it('ラック上限近くでの配置チェック', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      
      // 41-42Uに2Uサーバーを配置
      const result = canPlaceEquipment(rack, 41, server2U);
      expect(result.canPlace).toBe(true);
    });

    it('ラック容量を超える配置チェック', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      
      // 42-43Uに2Uサーバーを配置しようとする（43Uは存在しない）
      const result = canPlaceEquipment(rack, 42, server2U);
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('ラックの容量を超えています');
    });
  });

  describe('棚板機器の配置テスト', () => {
    it('棚板とモニターの配置パターン確認', () => {
      const rack = createTestRack();
      const shelf: Equipment = {
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
      };
      
      const monitor: Equipment = {
        id: 'monitor-1u',
        name: '1Uモニター',
        height: 1,
        depth: 200,
        power: 50,
        heat: 170,
        weight: 3,
        type: 'console',
        color: '#374151',
        dualPower: false,
        needsRails: false,
        airflow: 'natural',
        cfm: 20,
        heatGeneration: 170,
        description: 'モニター'
      };
      
      // 1Uに棚板を設置
      const result1 = canPlaceEquipment(rack, 1, shelf);
      expect(result1.canPlace).toBe(true);
      
      rack.equipment[1] = {
        ...shelf,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      // 2Uにモニターを設置
      const result2 = canPlaceEquipment(rack, 2, monitor);
      expect(result2.canPlace).toBe(true);
    });
  });
});