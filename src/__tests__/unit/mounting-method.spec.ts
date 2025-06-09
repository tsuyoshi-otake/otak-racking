import { describe, it, test, expect, beforeEach } from '@jest/globals';
import { Equipment } from '../../types';
import { EquipmentPlacementManager } from '../../services/EquipmentPlacementManager';
import { rackTypes } from '../../constants';

describe('機器取り付け方法テスト', () => {
  let placementManager: EquipmentPlacementManager;
  let testRack: any;

  beforeEach(() => {
    placementManager = new EquipmentPlacementManager();
    
    // テスト用ラックを作成
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
      fans: { count: 0, rpm: 0 },
      position: { row: 'A', column: 1 },
      cabling: { external: {}, overhead: {}, underfloor: {} },
      housing: { type: 'full', startUnit: 1, endUnit: 42, frontPanel: 'mesh', rearPanel: 'mesh' },
      environment: { ambientTemp: 25, humidity: 50, pressureDiff: 0 },
      pduPlacements: [],
      physicalStructure: {} as any
    };
  });

  describe('サーバー - レール取り付け', () => {
    test('1Uサーバーはレールが必要な警告が表示される', async () => {
      const server: Equipment = {
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
        airflow: 'front-to-rear',
        cfm: 65,
        heatGeneration: 1024,
        description: 'テスト用1Uサーバー',
        mountingMethod: 'rails',
        requiresRails: true,
        requiresCageNuts: false
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        server,
        { validateOnly: true }
      );

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('RAILS_REQUIRED');
      expect(result.validation.warnings[0].message).toContain('スライドレールが必要');
    });

  });

  describe('ネットワーク機器 - ケージナット取り付け', () => {
    test('1Uスイッチはケージナットが必要な警告が表示される', async () => {
      const switch1u: Equipment = {
        id: 'switch-1u',
        name: '1Uスイッチ',
        height: 1,
        depth: 400,
        power: 150,
        heat: 512,
        weight: 8,
        type: 'network',
        color: '#059669',
        dualPower: true,
        airflow: 'side-to-side',
        cfm: 45,
        heatGeneration: 512,
        description: 'テスト用1Uスイッチ',
        mountingMethod: 'cage-nuts',
        requiresRails: false,
        requiresCageNuts: true
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        switch1u,
        { validateOnly: true }
      );

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
      expect(result.validation.warnings[0].message).toContain('ケージナットで固定');
    });

    test('ファイアウォールはケージナットが必要な警告が表示される', async () => {
      const firewall: Equipment = {
        id: 'firewall',
        name: 'ファイアウォール',
        height: 1,
        depth: 400,
        power: 180,
        heat: 614,
        weight: 10,
        type: 'security',
        color: '#DC2626',
        dualPower: true,
        airflow: 'front-to-rear',
        cfm: 55,
        heatGeneration: 614,
        description: 'テスト用ファイアウォール',
        mountingMethod: 'cage-nuts',
        requiresRails: false,
        requiresCageNuts: true
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        firewall,
        { validateOnly: true }
      );

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
    });
  });

  describe('パネル - ケージナット取り付け', () => {
    test('ブランクパネルはケージナットが必要な警告が表示される', async () => {
      const blankPanel: Equipment = {
        id: 'blank-panel-1u',
        name: '1Uブランクパネル',
        height: 1,
        depth: 50,
        power: 0,
        heat: 0,
        weight: 0.5,
        type: 'panel',
        color: '#9CA3AF',
        dualPower: false,
        airflow: 'blocking',
        cfm: 0,
        heatGeneration: 0,
        description: 'テスト用ブランクパネル',
        mountingMethod: 'cage-nuts',
        requiresRails: false,
        requiresCageNuts: true
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        blankPanel,
        { validateOnly: true }
      );

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
    });
  });

  describe('ケージナット自動設置', () => {
    test('ケージナットが必要な機器で自動設置が動作する', async () => {
      const switch1u: Equipment = {
        id: 'switch-1u',
        name: '1Uスイッチ',
        height: 1,
        depth: 400,
        power: 150,
        heat: 512,
        weight: 8,
        type: 'network',
        color: '#059669',
        dualPower: true,
        airflow: 'side-to-side',
        cfm: 45,
        heatGeneration: 512,
        description: 'テスト用1Uスイッチ',
        mountingMethod: 'cage-nuts',
        requiresRails: false,
        requiresCageNuts: true
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        switch1u,
        { autoInstallCageNuts: true }
      );

      expect(result.success).toBe(true);
      expect(result.appliedChanges.some(change => change.type === 'cagenut')).toBe(true);
      expect(testRack.cageNuts[1]).toBeDefined();
    });

    test('レールが必要な機器では自動ケージナット設置がされない', async () => {
      const server: Equipment = {
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
        airflow: 'front-to-rear',
        cfm: 65,
        heatGeneration: 1024,
        description: 'テスト用1Uサーバー',
        mountingMethod: 'rails',
        requiresRails: true,
        requiresCageNuts: false
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        server,
        { autoInstallCageNuts: true }
      );

      // 通常モードではレール警告を無視して設置成功するように修正
      expect(result.success).toBe(true);
      // レールが必要な機器なのでケージナットは自動設置されない
      expect(result.appliedChanges.some(change => change.type === 'cagenut')).toBe(false);
      expect(testRack.cageNuts[1]).toBeUndefined();
      // レールが必要という警告は出る
      expect(result.validation.warnings.some(w => w.code === 'RAILS_REQUIRED')).toBe(true);
    });
  });

  describe('棚板の取り付け', () => {
    test('棚板はケージナットが必要な警告が表示される', async () => {
      const shelf: Equipment = {
        id: 'shelf-1u-standard',
        name: '1U棚板 (標準)',
        height: 1,
        depth: 450,
        power: 0,
        heat: 0,
        weight: 3,
        type: 'shelf',
        color: '#6B7280',
        dualPower: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 0,
        description: 'テスト用棚板',
        mountingMethod: 'cage-nuts',
        requiresRails: false,
        requiresCageNuts: true
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        shelf,
        { validateOnly: true }
      );

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0].code).toBe('CAGE_NUT_MISSING');
    });
  });

  describe('PDU - 直接取り付け', () => {
    test('縦型PDUは警告なしで設置可能', async () => {
      const pdu: Equipment = {
        id: 'pdu-vertical-basic',
        name: '縦型PDU (基本)',
        height: 42,
        depth: 100,
        power: 0,
        heat: 0,
        weight: 5,
        type: 'pdu',
        color: '#DC2626',
        dualPower: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 0,
        description: 'テスト用縦型PDU',
        mountingMethod: 'direct',
        requiresRails: false,
        requiresCageNuts: false
      };

      const result = await placementManager.placeEquipment(
        testRack,
        1,
        pdu,
        { validateOnly: true }
      );

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toHaveLength(0);
    });
  });
});