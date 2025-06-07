import { describe, it, expect } from '@jest/globals';
import { calculateRackStats, canPlaceEquipment } from '../utils';
import { networkEquipment } from '../constants';
import { Rack, Equipment, createDefaultPhysicalStructure } from '../types';

describe('負荷分散装置のテスト', () => {
  const createTestRack = (): Rack => ({
    id: 'test-rack',
    name: 'テストラック',
    type: '42u-standard',
    units: 42,
    depth: 1000,
    width: 600,
    equipment: {},
    cageNuts: {},
    powerConnections: {},
    labels: {},
    mountingOptions: {},
    railInventory: {},
    partInventory: {},
    fans: { count: 4, rpm: 3000 },
    position: { row: 'A', column: 1 },
    environment: {
      ambientTemp: 22,
      humidity: 45,
      pressureDiff: 0.2
    },
    housing: {
      type: 'full',
      startUnit: 1,
      endUnit: 42,
      frontPanel: 'perforated',
      rearPanel: 'perforated'
    },
    cabling: {
      external: {},
      overhead: {},
      underfloor: {}
    },
    pduPlacements: [],
    physicalStructure: createDefaultPhysicalStructure()
  });

  const getLoadBalancer = (): Equipment => {
    const lb = networkEquipment.find(eq => eq.id === 'load-balancer');
    if (!lb) {
      throw new Error('ロードバランサーが見つかりません');
    }
    return lb;
  };

  describe('ロードバランサーの基本仕様確認', () => {
    it('ロードバランサーが機器ライブラリに存在する', () => {
      const loadBalancer = getLoadBalancer();
      
      expect(loadBalancer).toBeDefined();
      expect(loadBalancer.name).toBe('ロードバランサー');
      expect(loadBalancer.type).toBe('network');
    });

    it('ロードバランサーの仕様が正しく設定されている', () => {
      const loadBalancer = getLoadBalancer();
      
      expect(loadBalancer.height).toBe(1);
      expect(loadBalancer.depth).toBe(450);
      expect(loadBalancer.power).toBe(200);
      expect(loadBalancer.heat).toBe(683);
      expect(loadBalancer.weight).toBe(12);
      expect(loadBalancer.dualPower).toBe(true);
      expect(loadBalancer.needsRails).toBe(false);
      expect(loadBalancer.airflow).toBe('front-to-rear');
      expect(loadBalancer.cfm).toBe(60);
    });

    it('ロードバランサーに詳細仕様が含まれている', () => {
      const loadBalancer = getLoadBalancer();
      
      expect(loadBalancer.specifications).toBeDefined();
      expect(loadBalancer.specifications?.throughput).toBe('最大10Gbps');
      expect(loadBalancer.specifications?.connections).toBe('最大100万同時接続');
      expect(loadBalancer.specifications?.ssl).toBe('SSL終端・オフロード対応');
    });
  });

  describe('ロードバランサーの配置テスト', () => {
    it('空のラックにロードバランサーを配置できる', () => {
      const rack = createTestRack();
      const loadBalancer = getLoadBalancer();
      
      const result = canPlaceEquipment(rack, 1, loadBalancer);
      
      expect(result.canPlace).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('ロードバランサーを配置後、統計が正しく計算される', () => {
      const rack = createTestRack();
      const loadBalancer = getLoadBalancer();
      
      // ロードバランサーを1Uに配置
      rack.equipment[1] = {
        ...loadBalancer,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      const stats = calculateRackStats(rack);
      
      expect(stats.usedUnits).toBe(1);
      expect(stats.totalPower).toBe(200);
      expect(stats.totalHeat).toBe(683);
      expect(stats.totalWeight).toBe(12);
    });

    it('複数のロードバランサーを配置して冗長構成を作れる', () => {
      const rack = createTestRack();
      const loadBalancer = getLoadBalancer();
      
      // 1UにプライマリLB
      rack.equipment[1] = {
        ...loadBalancer,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      // 3UにセカンダリLB
      rack.equipment[3] = {
        ...loadBalancer,
        id: 'load-balancer-secondary',
        startUnit: 3,
        endUnit: 3,
        isMainUnit: true
      };
      
      const stats = calculateRackStats(rack);
      
      expect(stats.usedUnits).toBe(2);
      expect(stats.totalPower).toBe(400); // 200W × 2台
      expect(stats.totalHeat).toBe(1366); // 683BTU/h × 2台
    });

    it('ロードバランサーの隣にサーバーを配置できる', () => {
      const rack = createTestRack();
      const loadBalancer = getLoadBalancer();
      
      // 1UにLB配置
      rack.equipment[1] = {
        ...loadBalancer,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      // 2Uに1Uサーバー配置のテスト（既存のサーバー機器を使用）
      const server1u: Equipment = {
        id: 'server-1u-test',
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
        description: 'テスト用1Uサーバー'
      };
      
      const result = canPlaceEquipment(rack, 2, server1u);
      expect(result.canPlace).toBe(true);
    });
  });

  describe('ロードバランサーの電源・冷却要件', () => {
    it('ロードバランサーは冗長電源対応である', () => {
      const loadBalancer = getLoadBalancer();
      
      expect(loadBalancer.dualPower).toBe(true);
    });

    it('ロードバランサーのエアフローは前面から背面である', () => {
      const loadBalancer = getLoadBalancer();
      
      expect(loadBalancer.airflow).toBe('front-to-rear');
      expect(loadBalancer.cfm).toBeGreaterThan(0);
    });

    it('ロードバランサーは適切な発熱量を持っている', () => {
      const loadBalancer = getLoadBalancer();
      
      // 200Wの消費電力に対して適切な発熱量
      // 1W ≈ 3.41 BTU/h なので、200W ≈ 682 BTU/h
      expect(loadBalancer.heatGeneration).toBe(683);
      expect(loadBalancer.heat).toBe(loadBalancer.heatGeneration);
    });
  });

  describe('ロードバランサーの設置要件', () => {
    it('ロードバランサーはレール不要で設置できる', () => {
      const loadBalancer = getLoadBalancer();
      
      expect(loadBalancer.needsRails).toBe(false);
    });

    it('ロードバランサーの奥行きが適切である', () => {
      const loadBalancer = getLoadBalancer();
      
      // 標準ラック奥行き1000mmに対して450mmは適切
      expect(loadBalancer.depth).toBe(450);
      expect(loadBalancer.depth).toBeLessThan(1000);
    });

    it('ロードバランサーの重量が適切である', () => {
      const loadBalancer = getLoadBalancer();
      
      // 1U機器として12kgは適切な範囲
      expect(loadBalancer.weight).toBe(12);
      expect(loadBalancer.weight).toBeGreaterThan(0);
      expect(loadBalancer.weight).toBeLessThan(50); // 1Uとして適切な重量
    });
  });
});