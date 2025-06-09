import { describe, it, expect } from '@jest/globals';
import { calculateRackStats, canPlaceEquipment } from '../../utils';
import { otherEquipment } from '../../constants';
import { Rack, Equipment, createDefaultPhysicalStructure } from '../../types';

describe('棚板のテスト', () => {
  const createTestRack = (): Rack => ({
    id: 'test-rack',
    name: 'テストラック',
    type: '42u-standard',
    units: 42,
    depth: 1000,
    width: 600,
    equipment: {},
    cageNuts: {},
    rails: {},
    powerConnections: {},
    labels: {},
    mountingOptions: {},
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

  const getShelfEquipment = () => {
    const standardShelf = otherEquipment.find(eq => eq.id === 'shelf-1u-standard');
    const ventedShelf = otherEquipment.find(eq => eq.id === 'shelf-1u-vented');
    
    if (!standardShelf || !ventedShelf) {
      throw new Error('棚板が見つかりません');
    }
    
    return { standardShelf, ventedShelf };
  };

  describe('棚板の基本仕様確認', () => {
    it('標準1U棚板が機器ライブラリに存在する', () => {
      const { standardShelf } = getShelfEquipment();
      
      expect(standardShelf).toBeDefined();
      expect(standardShelf.name).toBe('1U棚板 (標準)');
      expect(standardShelf.type).toBe('shelf');
      expect(standardShelf.height).toBe(1);
    });

    it('通気孔付き1U棚板が機器ライブラリに存在する', () => {
      const { ventedShelf } = getShelfEquipment();
      
      expect(ventedShelf).toBeDefined();
      expect(ventedShelf.name).toBe('1U棚板 (通気孔付き)');
      expect(ventedShelf.type).toBe('shelf');
      expect(ventedShelf.height).toBe(1);
      expect(ventedShelf.airflow).toBe('intake');
    });

    it('各棚板の仕様が正しく設定されている', () => {
      const { standardShelf, ventedShelf } = getShelfEquipment();
      
      // 標準棚板
      expect(standardShelf.specifications?.loadCapacity).toBe('20kg');
      expect(standardShelf.specifications?.material).toBe('スチール製（粉体塗装）');
      
      // 通気孔付き棚板
      expect(ventedShelf.specifications?.loadCapacity).toBe('15kg');
      expect(ventedShelf.specifications?.ventilation).toBe('通気孔（40%開口率）');
    });
  });

  describe('棚板の配置テスト', () => {
    it('空のラックに標準棚板を配置できる', () => {
      const rack = createTestRack();
      const { standardShelf } = getShelfEquipment();
      
      const result = canPlaceEquipment(rack, 1, standardShelf);
      
      expect(result.canPlace).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('棚板を配置後、統計が正しく計算される', () => {
      const rack = createTestRack();
      const { standardShelf } = getShelfEquipment();
      
      // 標準棚板を1Uに配置
      rack.equipment[1] = {
        ...standardShelf,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      const stats = calculateRackStats(rack);
      
      expect(stats.usedUnits).toBe(1);
      expect(stats.totalPower).toBe(0); // 棚板は電力消費なし
      expect(stats.totalHeat).toBe(0);  // 棚板は発熱なし
      expect(stats.totalWeight).toBe(3); // 標準棚板は3kg
    });


    it('複数の棚板を配置できる', () => {
      const rack = createTestRack();
      const { standardShelf, ventedShelf } = getShelfEquipment();
      
      // 1Uに標準棚板
      rack.equipment[1] = {
        ...standardShelf,
        startUnit: 1,
        endUnit: 1,
        isMainUnit: true
      };
      
      // 3Uに通気孔付き棚板
      rack.equipment[3] = {
        ...ventedShelf,
        id: 'shelf-1u-vented-secondary',
        startUnit: 3,
        endUnit: 3,
        isMainUnit: true
      };
      
      const stats = calculateRackStats(rack);
      
      expect(stats.usedUnits).toBe(2);
      expect(stats.totalWeight).toBe(5.5); // 3kg + 2.5kg
    });
  });

  describe('棚板のエアフロー特性', () => {
    it('標準棚板は自然エアフロー', () => {
      const { standardShelf } = getShelfEquipment();
      
      expect(standardShelf.airflow).toBe('natural');
      expect(standardShelf.cfm).toBe(0);
    });

    it('通気孔付き棚板は吸気エアフロー', () => {
      const { ventedShelf } = getShelfEquipment();
      
      expect(ventedShelf.airflow).toBe('intake');
      expect(ventedShelf.cfm).toBe(15);
    });

  });

  describe('棚板の耐荷重特性', () => {
    it('標準棚板は20kg耐荷重', () => {
      const { standardShelf } = getShelfEquipment();
      
      expect(standardShelf.weight).toBe(3);
      expect(standardShelf.specifications?.loadCapacity).toBe('20kg');
    });

    it('通気孔付き棚板は15kg耐荷重（軽量化のため）', () => {
      const { ventedShelf } = getShelfEquipment();
      
      expect(ventedShelf.weight).toBe(2.5);
      expect(ventedShelf.specifications?.loadCapacity).toBe('15kg');
    });

  });

  describe('棚板の設置要件', () => {
    it('全ての棚板はレール不要', () => {
      const { standardShelf, ventedShelf } = getShelfEquipment();
      
      expect(standardShelf.requiresRails).toBe(false);
      expect(ventedShelf.requiresRails).toBe(false);
    });

    it('全ての棚板は電力不要', () => {
      const { standardShelf, ventedShelf } = getShelfEquipment();
      
      expect(standardShelf.power).toBe(0);
      expect(standardShelf.dualPower).toBe(false);
      expect(ventedShelf.power).toBe(0);
      expect(ventedShelf.dualPower).toBe(false);
    });

    it('棚板の奥行きが適切である', () => {
      const { standardShelf, ventedShelf } = getShelfEquipment();
      
      // 標準と通気孔付きは450mm
      expect(standardShelf.depth).toBe(450);
      expect(ventedShelf.depth).toBe(450);
      
      // 全て標準ラック奥行き1000mm以下
      expect(standardShelf.depth).toBeLessThan(1000);
      expect(ventedShelf.depth).toBeLessThan(1000);
    });
  });
});