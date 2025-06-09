import { describe, it, expect, beforeEach } from '@jest/globals';
import { EquipmentPlacementManager } from '../../services/EquipmentPlacementManager';
import { canPlaceEquipmentAdvanced } from '../../utils';
import { Rack, Equipment } from '../../types';

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
    rails: {},
    partInventory: {},
    fans: { count: 4, rpm: 3000 },
    position: { row: 'A', column: 1 },
    cabling: { external: {}, overhead: {}, underfloor: {} },
    housing: { type: 'full', startUnit: 1, endUnit: 42, frontPanel: 'perforated', rearPanel: 'perforated' },
    environment: { ambientTemp: 22, humidity: 45, pressureDiff: 0.2 },
    pduPlacements: [],
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
    requiresRails: true,
    mountingMethod: 'rails' as const,
    requiresCageNuts: false,
    airflow: 'front-to-rear',
    cfm: 65,
    heatGeneration: 1024,
    description: '1Uサーバー統合テスト用'
  });




  describe('自動ゲージナット設置', () => {
    it('レール不要機器の自動ゲージナット設置', async () => {
      const server = { ...create1UServer(), requiresRails: false, mountingMethod: 'cage-nuts' as const, requiresCageNuts: true };

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
      const server1U = create1UServer();

      // 機器を設置
      await manager.placeEquipment(testRack, 4, server1U, { skipWarnings: true });

      const occupancy = manager.getRackOccupancy(testRack);

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