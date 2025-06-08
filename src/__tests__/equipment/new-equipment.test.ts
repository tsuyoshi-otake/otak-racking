import { describe, it, expect } from '@jest/globals';
import {
  calculateRackStats,
  canPlaceEquipment
} from '../utils';
import { Rack, Equipment, createDefaultPhysicalStructure } from '../types';

describe('新規追加機器のテスト', () => {
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
      rearPanel: 'mesh'
    },
    environment: {
      ambientTemp: 22,
      humidity: 45,
      pressureDiff: 0.1
    },
    pduPlacements: [],
    physicalStructure: createDefaultPhysicalStructure()
  });

  const createShelfBasic = (): Equipment => ({
    id: 'shelf-1u-basic',
    name: '1U棚板 (基本)',
    height: 1,
    depth: 400,
    power: 0,
    heat: 0,
    weight: 2,
    type: 'shelf',
    color: '#6B7280',
    dualPower: false,
    needsRails: false,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: '軽量機器や小型装置の設置用棚板。最大荷重20kg。モニターなどの設置台として使用。',
    specifications: {
      material: 'スチール製',
      loadCapacity: '最大20kg',
      surface: '防錆塗装',
      ventilation: '通気スリット付き',
      mounting: '前面・背面4点固定'
    },
    mountingNotes: '荷重制限厳守。設置物の奥行き確認必要。'
  });


  const createLoadBalancer1U = (): Equipment => ({
    id: 'load-balancer-1u',
    name: '1U負荷分散装置',
    height: 1,
    depth: 450,
    power: 200,
    heat: 683,
    weight: 12,
    type: 'network',
    color: '#0891B2',
    dualPower: true,
    needsRails: false,
    airflow: 'front-to-rear',
    cfm: 60,
    heatGeneration: 683,
    description: 'アプリケーション負荷分散装置。L4-L7負荷分散、SSL処理、ヘルスチェック機能を提供。',
    specifications: {
      throughput: '最大2Gbps',
      connections: '最大100万コネクション',
      servers: '最大1000台バランシング',
      features: 'SSL処理/圧縮/キャッシュ',
      protocols: 'HTTP/HTTPS/TCP/UDP'
    },
    mountingNotes: 'ネットワーク設計要検討。冗長構成推奨。'
  });

  const createLoadBalancer2U = (): Equipment => ({
    id: 'load-balancer-2u',
    name: '2U負荷分散装置 (高性能)',
    height: 2,
    depth: 500,
    power: 400,
    heat: 1365,
    weight: 20,
    type: 'network',
    color: '#0E7490',
    dualPower: true,
    needsRails: true,
    airflow: 'front-to-rear',
    cfm: 120,
    heatGeneration: 1365,
    description: '高性能負荷分散装置。大規模環境対応。ADC機能とWAF機能を統合。',
    specifications: {
      throughput: '最大10Gbps',
      connections: '最大1000万コネクション',
      servers: '最大10000台バランシング',
      features: 'WAF/DDoS保護/API Gateway',
      clustering: 'アクティブ-アクティブ対応'
    },
    mountingNotes: '大容量処理。ネットワーク帯域要確認。'
  });

  const createMonitor = (): Equipment => ({
    id: 'monitor-1u',
    name: '1Uモニター',
    height: 1,
    depth: 300,
    power: 50,
    heat: 170,
    weight: 4,
    type: 'console',
    color: '#374151',
    dualPower: false,
    needsRails: false,
    airflow: 'natural',
    cfm: 20,
    heatGeneration: 170,
    description: 'ラックマウント型液晶モニター。サーバー管理用コンソール表示。',
    specifications: {
      screen: '17インチ液晶',
      resolution: '1280×1024',
      input: 'VGA/DVI/HDMI',
      viewing: '上下左右170度',
      backlight: 'LED（省電力）'
    },
    mountingNotes: '画面角度調整可能。ケーブル管理要検討。'
  });

  describe('棚板の配置テスト', () => {
    it('空のラックに1U棚板を配置できる', () => {
      const rack = createTestRack();
      const shelf = createShelfBasic();
      
      const result = canPlaceEquipment(rack, 1, shelf);
      expect(result.canPlace).toBe(true);
    });


    it('棚板の統計が正しく計算される', () => {
      const rack = createTestRack();
      const shelf = createShelfBasic();
      
      // 棚板を配置
      rack.equipment[1] = { ...shelf, startUnit: 1, endUnit: 1, isMainUnit: true };
      
      const stats = calculateRackStats(rack);
      expect(stats.totalPower).toBe(0); // 棚板は電力消費なし
      expect(stats.totalHeat).toBe(0);  // 棚板は発熱なし
      expect(stats.totalWeight).toBe(2); // 棚板の重量
      expect(stats.usedUnits).toBe(1);
      expect(stats.availableUnits).toBe(41);
    });
  });

  describe('負荷分散装置の配置テスト', () => {
    it('空のラックに1U負荷分散装置を配置できる', () => {
      const rack = createTestRack();
      const lb = createLoadBalancer1U();
      
      const result = canPlaceEquipment(rack, 1, lb);
      expect(result.canPlace).toBe(true);
    });

    it('空のラックに2U負荷分散装置を配置できる', () => {
      const rack = createTestRack();
      const lb = createLoadBalancer2U();
      
      const result = canPlaceEquipment(rack, 1, lb);
      expect(result.canPlace).toBe(true);
    });

    it('1U負荷分散装置の統計が正しく計算される', () => {
      const rack = createTestRack();
      const lb = createLoadBalancer1U();
      
      // 負荷分散装置を配置
      rack.equipment[1] = { ...lb, startUnit: 1, endUnit: 1, isMainUnit: true };
      
      const stats = calculateRackStats(rack);
      expect(stats.totalPower).toBe(200);
      expect(stats.totalHeat).toBe(683);
      expect(stats.totalWeight).toBe(12);
      expect(stats.usedUnits).toBe(1);
      expect(stats.availableUnits).toBe(41);
    });

    it('2U負荷分散装置の統計が正しく計算される', () => {
      const rack = createTestRack();
      const lb = createLoadBalancer2U();
      
      // 負荷分散装置を配置
      rack.equipment[1] = { ...lb, startUnit: 1, endUnit: 2, isMainUnit: true };
      rack.equipment[2] = { ...lb, startUnit: 1, endUnit: 2, isMainUnit: false };
      
      const stats = calculateRackStats(rack);
      expect(stats.totalPower).toBe(400);
      expect(stats.totalHeat).toBe(1365);
      expect(stats.totalWeight).toBe(20);
      expect(stats.usedUnits).toBe(2);
      expect(stats.availableUnits).toBe(40);
    });
  });

  describe('棚板とモニターの組み合わせテスト', () => {
    it('棚板の上にモニターを設置できる', () => {
      const rack = createTestRack();
      const shelf = createShelfBasic();
      const monitor = createMonitor();
      
      // まず棚板を1Uに配置
      rack.equipment[1] = { ...shelf, startUnit: 1, endUnit: 1, isMainUnit: true };
      
      // モニターを2Uに配置（棚板の真上）
      const result = canPlaceEquipment(rack, 2, monitor);
      expect(result.canPlace).toBe(true);
    });


    it('棚板とモニターを含む混在ラックの統計計算', () => {
      const rack = createTestRack();
      const shelf = createShelfBasic();
      const monitor = createMonitor();
      
      // 棚板を1Uに配置
      rack.equipment[1] = { ...shelf, startUnit: 1, endUnit: 1, isMainUnit: true };
      // モニターを2Uに配置
      rack.equipment[2] = { ...monitor, startUnit: 2, endUnit: 2, isMainUnit: true };
      
      const stats = calculateRackStats(rack);
      expect(stats.totalPower).toBe(50); // モニターの電力消費
      expect(stats.totalHeat).toBe(170); // モニターの発熱
      expect(stats.totalWeight).toBe(6); // 棚板2kg + モニター4kg
      expect(stats.usedUnits).toBe(2); // 棚板1U + モニター1U
      expect(stats.availableUnits).toBe(40);
    });
  });

  describe('負荷分散装置の配置制約テスト', () => {
    it('ラック容量制限での配置確認', () => {
      const rack = createTestRack();
      const lb = createLoadBalancer2U();
      
      // 42Uに2U機器は配置できない（容量オーバー）
      const result = canPlaceEquipment(rack, 42, lb);
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('ラックの容量を超えています');
    });

    it('既存機器との干渉確認', () => {
      const rack = createTestRack();
      const lb1 = createLoadBalancer1U();
      const lb2 = createLoadBalancer2U();
      
      // 1Uに1U負荷分散装置を配置
      rack.equipment[1] = { ...lb1, startUnit: 1, endUnit: 1, isMainUnit: true };
      
      // 1Uに2U負荷分散装置は配置できない（干渉）
      const result = canPlaceEquipment(rack, 1, lb2);
      expect(result.canPlace).toBe(false);
      expect(result.reason).toContain('既に機器が設置されています');
    });
  });

  describe('エアフロー特性テスト', () => {
    it('棚板はnatural airflowを持つ', () => {
      const shelf = createShelfBasic();
      expect(shelf.airflow).toBe('natural');
      expect(shelf.cfm).toBe(0);
    });

    it('負荷分散装置はfront-to-rearエアフローを持つ', () => {
      const lb1 = createLoadBalancer1U();
      const lb2 = createLoadBalancer2U();
      
      expect(lb1.airflow).toBe('front-to-rear');
      expect(lb1.cfm).toBe(60);
      
      expect(lb2.airflow).toBe('front-to-rear');
      expect(lb2.cfm).toBe(120);
    });
  });
});