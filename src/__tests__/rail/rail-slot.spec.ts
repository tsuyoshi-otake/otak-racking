import { describe, test, expect, beforeEach } from '@jest/globals';
import { Rack, createDefaultPhysicalStructure } from '../../types';

describe('Rail Slot Display Tests', () => {
  let testRack: Rack;

  beforeEach(() => {
    testRack = {
      id: 'rack1',
      name: 'Test Rack',
      type: '42U',
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
        rearPanel: 'perforated'
      },
      environment: {
        ambientTemp: 20,
        humidity: 50,
        pressureDiff: 0
      },
      pduPlacements: [],
      physicalStructure: createDefaultPhysicalStructure()
    };
  });

  test('レールスロットが正しく表示される', () => {
    // レール設定を追加
    testRack.rails[10] = {
      frontLeft: {
        installed: true,
        railType: '1u',
        startUnit: 10,
        endUnit: 10,
        railId: 'rail-1'
      },
      frontRight: {
        installed: true,
        railType: '1u',
        startUnit: 10,
        endUnit: 10,
        railId: 'rail-2'
      },
      rearLeft: {
        installed: false,
        railType: null,
        startUnit: null,
        endUnit: null,
        railId: null
      },
      rearRight: {
        installed: false,
        railType: null,
        startUnit: null,
        endUnit: null,
        railId: null
      }
    };

    // レール情報の確認
    expect(testRack.rails[10].frontLeft.installed).toBe(true);
    expect(testRack.rails[10].frontRight.installed).toBe(true);
    expect(testRack.rails[10].rearLeft.installed).toBe(false);
    expect(testRack.rails[10].rearRight.installed).toBe(false);
  });

  test('レールとケージナットの共存', () => {
    // ユニット15にケージナットを設定
    testRack.cageNuts[15] = {
      frontLeft: { top: 'm6', middle: 'm6', bottom: 'm6' },
      frontRight: { top: 'm6', middle: 'm6', bottom: 'm6' },
      rearLeft: { top: null, middle: null, bottom: null },
      rearRight: { top: null, middle: null, bottom: null }
    };

    // 同じユニットにレールも設定
    testRack.rails[15] = {
      frontLeft: {
        installed: true,
        railType: '1u',
        startUnit: 15,
        endUnit: 15,
        railId: 'rail-1u-1'
      },
      frontRight: {
        installed: true,
        railType: '1u',
        startUnit: 15,
        endUnit: 15,
        railId: 'rail-1u-2'
      },
      rearLeft: {
        installed: false,
        railType: null,
        startUnit: null,
        endUnit: null,
        railId: null
      },
      rearRight: {
        installed: false,
        railType: null,
        startUnit: null,
        endUnit: null,
        railId: null
      }
    };

    // ケージナットとレールの両方が存在することを確認
    expect(testRack.cageNuts[15].frontLeft.top).toBe('m6');
    expect(testRack.rails[15].frontLeft.installed).toBe(true);
  });

  test('レールタイプの検証', () => {
    const railTypes = ['1u'];
    
    railTypes.forEach((railType, index) => {
      const unit = 30 + index * 5;
      testRack.rails[unit] = {
        frontLeft: {
          installed: true,
          railType: railType,
          startUnit: unit,
          endUnit: unit + parseInt(railType) - 1,
          railId: `rail-${railType}-test`
        },
        frontRight: {
          installed: true,
          railType: railType,
          startUnit: unit,
          endUnit: unit + parseInt(railType) - 1,
          railId: `rail-${railType}-test-2`
        },
        rearLeft: {
          installed: false,
          railType: null,
          startUnit: null,
          endUnit: null,
          railId: null
        },
        rearRight: {
          installed: false,
          railType: null,
          startUnit: null,
          endUnit: null,
          railId: null
        }
      };

      expect(testRack.rails[unit].frontLeft.railType).toBe(railType);
      expect(testRack.rails[unit].frontLeft.endUnit).toBe(unit + parseInt(railType) - 1);
    });
  });
});