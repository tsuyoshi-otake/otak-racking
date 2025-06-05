import { describe, it, expect } from '@jest/globals';
import { canPlaceEquipment } from '../utils';
import { Rack, Equipment } from '../types';

describe('2Uサーバー設置問題の調査', () => {
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

  describe('シナリオ1: 2Uサーバーを設置後の前方配置', () => {
    it('ケース1: 3-4Uに2Uサーバー設置後、1-2Uに設置可能か', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      
      // 3-4Uに2Uサーバーを設置
      rack.equipment[3] = {
        ...server2U,
        id: 'server-2u-first',
        startUnit: 3,
        endUnit: 4,
        isMainUnit: true
      };
      rack.equipment[4] = {
        ...server2U,
        id: 'server-2u-first',
        startUnit: 3,
        endUnit: 4,
        isMainUnit: false
      };
      
      console.log('3-4Uにサーバー設置済み。ラック状態:');
      console.log('ユニット3:', rack.equipment[3] ? 'occupied' : 'empty');
      console.log('ユニット4:', rack.equipment[4] ? 'occupied' : 'empty');
      console.log('ユニット1:', rack.equipment[1] ? 'occupied' : 'empty');
      console.log('ユニット2:', rack.equipment[2] ? 'occupied' : 'empty');
      
      // 1-2Uに別の2Uサーバーを設置しようとする
      const result = canPlaceEquipment(rack, 1, server2U);
      console.log('1-2Uへの設置可能性:', result);
      
      expect(result.canPlace).toBe(true);
    });

    it('ケース2: 2-3Uに2Uサーバー設置後、1Uに1Uサーバー設置可能か', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 2-3Uに2Uサーバーを設置
      rack.equipment[2] = {
        ...server2U,
        id: 'server-2u-first',
        startUnit: 2,
        endUnit: 3,
        isMainUnit: true
      };
      rack.equipment[3] = {
        ...server2U,
        id: 'server-2u-first',
        startUnit: 2,
        endUnit: 3,
        isMainUnit: false
      };
      
      console.log('2-3Uにサーバー設置済み。ラック状態:');
      console.log('ユニット1:', rack.equipment[1] ? 'occupied' : 'empty');
      console.log('ユニット2:', rack.equipment[2] ? 'occupied' : 'empty');
      console.log('ユニット3:', rack.equipment[3] ? 'occupied' : 'empty');
      
      // 1Uに1Uサーバーを設置しようとする
      const result = canPlaceEquipment(rack, 1, server1U);
      console.log('1Uへの設置可能性:', result);
      
      expect(result.canPlace).toBe(true);
    });

    it('ケース3: 1-2Uに2Uサーバー設置後、その前（0U?）には設置できない', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      // 1-2Uに2Uサーバーを設置
      rack.equipment[1] = {
        ...server2U,
        id: 'server-2u-first',
        startUnit: 1,
        endUnit: 2,
        isMainUnit: true
      };
      rack.equipment[2] = {
        ...server2U,
        id: 'server-2u-first',
        startUnit: 1,
        endUnit: 2,
        isMainUnit: false
      };
      
      console.log('1-2Uにサーバー設置済み。ラック状態:');
      console.log('ユニット1:', rack.equipment[1] ? 'occupied' : 'empty');
      console.log('ユニット2:', rack.equipment[2] ? 'occupied' : 'empty');
      
      // 0Uに設置しようとする（存在しないユニット）
      const result = canPlaceEquipment(rack, 0, server1U);
      console.log('0Uへの設置可能性:', result);
      
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('ユニット番号は1以上である必要があります。');
    });
  });

  describe('シナリオ2: ラック番号付けの確認', () => {
    it('ラック番号は下から上に1, 2, 3...42の順番', () => {
      const rack = createTestRack();
      
      // ラックの基本情報を確認
      console.log('ラック基本情報:');
      console.log('総ユニット数:', rack.units);
      console.log('1U（最下部）は存在するか:', rack.units >= 1);
      console.log('42U（最上部）は存在するか:', rack.units >= 42);
      console.log('0Uは存在するか: false（ユニット番号は1から始まる）');
      
      expect(rack.units).toBe(42);
    });
  });

  describe('シナリオ3: 実際の配置確認', () => {
    it('段階的な機器配置テスト', () => {
      const rack = createTestRack();
      const server2U = create2UServer();
      const server1U = create1UServer();
      
      console.log('\n=== 段階的配置テスト ===');
      
      // ステップ1: 空のラック状態確認
      console.log('ステップ1: 空のラック');
      for (let i = 1; i <= 5; i++) {
        console.log(`ユニット${i}:`, rack.equipment[i] ? 'occupied' : 'empty');
      }
      
      // ステップ2: 3-4Uに2Uサーバーを設置
      const step2Check = canPlaceEquipment(rack, 3, server2U);
      console.log('\nステップ2: 3-4Uに2Uサーバー設置可能性:', step2Check);
      
      if (step2Check.canPlace) {
        rack.equipment[3] = {
          ...server2U,
          id: 'server-2u-step2',
          startUnit: 3,
          endUnit: 4,
          isMainUnit: true
        };
        rack.equipment[4] = {
          ...server2U,
          id: 'server-2u-step2',
          startUnit: 3,
          endUnit: 4,
          isMainUnit: false
        };
        
        console.log('3-4Uに2Uサーバー設置完了');
        for (let i = 1; i <= 5; i++) {
          console.log(`ユニット${i}:`, rack.equipment[i] ? 'occupied' : 'empty');
        }
      }
      
      // ステップ3: 1Uに1Uサーバーを設置
      const step3Check = canPlaceEquipment(rack, 1, server1U);
      console.log('\nステップ3: 1Uに1Uサーバー設置可能性:', step3Check);
      
      expect(step2Check.canPlace).toBe(true);
      expect(step3Check.canPlace).toBe(true);
      
      // ステップ4: 2Uに1Uサーバーを設置（3Uが使用中なので不可）
      const step4Check = canPlaceEquipment(rack, 2, server1U);
      console.log('\nステップ4: 2Uに1Uサーバー設置可能性:', step4Check);
      expect(step4Check.canPlace).toBe(true); // 2Uは空いているので設置可能
      
      // ステップ5: 1-2Uに2Uサーバーを設置しようとする（3Uが使用中なので不可）
      const step5Check = canPlaceEquipment(rack, 1, server2U);
      console.log('\nステップ5: 1-2Uに2Uサーバー設置可能性:', step5Check);
      expect(step5Check.canPlace).toBe(true); // 1-2Uは空いているので設置可能
    });
  });
});