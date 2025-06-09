import { EquipmentPlacementManager } from '../../services/EquipmentPlacementManager';
import { Rack, Equipment } from '../../types';

describe('DirectMountEquipmentConstraint', () => {
  let placementManager: EquipmentPlacementManager;
  let testRack: Rack;

  beforeEach(() => {
    placementManager = new EquipmentPlacementManager();
    
    // テスト用ラックの初期化
    testRack = {
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
      fans: {
        intake: { count: 0, cfm: 0 },
        exhaust: { count: 0, cfm: 0 }
      },
      position: { x: 0, y: 0, rotation: 0 },
      cabling: {
        powerCables: [],
        dataCables: [],
        managementCables: []
      },
      housing: {
        frontDoor: { type: 'glass', isOpen: false },
        rearDoor: { type: 'perforated', isOpen: false },
        sidePanels: { left: true, right: true }
      },
      environment: {
        temperature: { min: 18, max: 27, current: 22 },
        humidity: { min: 45, max: 55, current: 50 },
        airflow: { direction: 'front-to-rear', velocity: 2.5 }
      },
      pduPlacements: [],
      physicalStructure: {
        frame: { type: 'standard', material: 'steel', finish: 'black' },
        frontDoor: { type: 'glass', lock: true, handle: 'right' },
        rearDoor: { type: 'perforated', lock: true, handle: 'left' },
        leftPanel: { type: 'solid', removable: true },
        rightPanel: { type: 'solid', removable: true },
        mountingPosts: {},
        base: { type: 'adjustable', casters: true },
        top: { type: 'solid', cable_entry: true },
        dimensions: { height: 2000, width: 600, depth: 1000 },
        weight: { empty: 120, max_load: 1500 },
        ventilation: { front: 65, rear: 80, sides: 0 }
      }
    };
  });

  describe('1Uスイッチのレール競合チェック', () => {
    const switch1U: Equipment = {
      id: 'switch-1u',
      name: 'ネットワークスイッチ (1U)',
      height: 1,
      depth: 400,
      power: 150,
      heat: 512,
      weight: 8,
      type: 'network',
      role: 'network',
      color: '#1E40AF',
      opacity: 30,
      dualPower: true,
      airflow: 'side-to-side',
      cfm: 45,
      heatGeneration: 512,
      description: '1Uアクセススイッチ',
      specifications: {},
      mountingMethod: 'cage-nuts',
      requiresRails: false,
      requiresCageNuts: true
    };

    it('レールが設置されていないユニットには1Uスイッチを配置できる', async () => {
      const result = await placementManager.placeEquipment(
        testRack,
        1,
        switch1U,
        {},
        false
      );

      expect(result.success).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
    });

    it('レールが設置されているユニットには1Uスイッチを配置できない', async () => {
      // ユニット1にレールを設置
      testRack.rails[1] = {
        frontLeft: { installed: true, railType: '1u', startUnit: 1, endUnit: 1, railId: 'rail-1' },
        frontRight: { installed: true, railType: '1u', startUnit: 1, endUnit: 1, railId: 'rail-1' },
        rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
        rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        switch1U,
        {},
        false
      );

      expect(result.success).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].code).toBe('RAIL_EQUIPMENT_CONFLICT');
      expect(result.validation.errors[0].message).toContain('レールを必要としません');
      expect(result.validation.errors[0].message).toContain('レールが設置されているユニット 1 には配置できません');
    });

    it('複数ユニットにまたがる場合、一部でもレールがあれば配置できない', async () => {
      const switch2U: Equipment = {
        ...switch1U,
        id: 'switch-2u',
        name: 'ネットワークスイッチ (2U)',
        height: 2,
        mountingMethod: 'cage-nuts',
        requiresRails: false
      };

      // ユニット2のみにレールを設置
      testRack.rails[2] = {
        frontLeft: { installed: true, railType: '1u', startUnit: 2, endUnit: 2, railId: 'rail-2' },
        frontRight: { installed: true, railType: '1u', startUnit: 2, endUnit: 2, railId: 'rail-2' },
        rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
        rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        switch2U,
        {},
        false
      );

      expect(result.success).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].code).toBe('RAIL_EQUIPMENT_CONFLICT');
      expect(result.validation.errors[0].affectedUnits).toContain(2);
    });
  });

  describe('レール必要機器は影響を受けない', () => {
    const server1U: Equipment = {
      id: 'server-1u',
      name: 'ラックマウントサーバー (1U)',
      height: 1,
      depth: 650,
      power: 300,
      heat: 1024,
      weight: 15,
      type: 'server',
      role: 'compute',
      color: '#7943a8',
      opacity: 30,
      dualPower: true,
      airflow: 'front-to-rear',
      cfm: 65,
      heatGeneration: 1024,
      description: '汎用的な1Uラックマウントサーバー',
      specifications: {},
      mountingMethod: 'rails',
      requiresRails: true,
      requiresCageNuts: false
    };

    it('レール必要機器はレール設置済みユニットに配置できる（通常モード）', async () => {
      // ユニット1にレールを設置
      testRack.rails[1] = {
        frontLeft: { installed: true, railType: '1u', startUnit: 1, endUnit: 1, railId: 'rail-1' },
        frontRight: { installed: true, railType: '1u', startUnit: 1, endUnit: 1, railId: 'rail-1' },
        rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
        rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        server1U,
        {},
        false
      );

      expect(result.success).toBe(true);
      expect(result.validation.errors.filter(e => e.code === 'RAIL_EQUIPMENT_CONFLICT')).toHaveLength(0);
    });
  });

  describe('mountingMethod による判定', () => {
    it('mountingMethod が "direct" の機器はレール設置済みユニットに配置できない', async () => {
      const directMountEquipment: Equipment = {
        id: 'direct-mount-1u',
        name: '直接マウント機器 (1U)',
        height: 1,
        depth: 400,
        power: 100,
        heat: 300,
        weight: 5,
        type: 'other',
        role: 'accessory',
        color: '#6B7280',
        opacity: 30,
        dualPower: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 300,
        description: '直接マウント機器',
        specifications: {},
        mountingMethod: 'direct',
        requiresRails: false,
        requiresCageNuts: false
      };

      // ユニット1にレールを設置
      testRack.rails[1] = {
        frontLeft: { installed: true, railType: '1u', startUnit: 1, endUnit: 1, railId: 'rail-1' },
        frontRight: { installed: true, railType: '1u', startUnit: 1, endUnit: 1, railId: 'rail-1' },
        rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
        rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        directMountEquipment,
        {},
        false
      );

      expect(result.success).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].code).toBe('RAIL_EQUIPMENT_CONFLICT');
    });
  });

  describe('エラーメッセージの確認', () => {
    it('適切なエラーメッセージが表示される', async () => {
      const switch1U: Equipment = {
        id: 'switch-1u',
        name: 'ネットワークスイッチ (1U)',
        height: 1,
        depth: 400,
        power: 150,
        heat: 512,
        weight: 8,
        type: 'network',
        role: 'network',
        color: '#1E40AF',
        opacity: 30,
        dualPower: true,
        airflow: 'side-to-side',
        cfm: 45,
        heatGeneration: 512,
        description: '1Uアクセススイッチ',
        specifications: {},
        mountingMethod: 'cage-nuts',
        requiresRails: false,
        requiresCageNuts: true
      };

      // ユニット5にレールを設置
      testRack.rails[5] = {
        frontLeft: { installed: true, railType: '1u', startUnit: 5, endUnit: 5, railId: 'rail-5' },
        frontRight: { installed: true, railType: '1u', startUnit: 5, endUnit: 5, railId: 'rail-5' },
        rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
        rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
      };

      const result = await placementManager.placeEquipment(
        testRack,
        5,
        switch1U,
        {},
        false
      );

      expect(result.success).toBe(false);
      expect(result.validation.errors[0].message).toBe(
        'ネットワークスイッチ (1U)はレールを必要としません。レールが設置されているユニット 5 には配置できません。'
      );
      expect(result.validation.errors[0].affectedUnits).toEqual([5]);
      expect(result.validation.errors[0].severity).toBe('error');
    });
  });
});