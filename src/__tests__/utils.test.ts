import { describe, it, expect } from '@jest/globals';
import { 
  calculateRackStats, 
  calculateCoolingStats, 
  calculateTotalStats,
  getCageNutStatus 
} from '../utils';
import { Rack, Equipment } from '../types';

describe('ラック統計計算', () => {
  const mockRack: Rack = {
    id: 'rack-1',
    name: 'テストラック',
    type: '42u-standard',
    units: 42,
    depth: 1000,
    width: 600,
    equipment: {
      1: {
        id: 'server-1',
        name: '1Uサーバー',
        height: 1,
        power: 300,
        heat: 1024,
        weight: 15,
        type: 'server',
        isMainUnit: true,
        startUnit: 1,
        endUnit: 1,
        heatGeneration: 1024,
        cfm: 65
      } as Equipment
    },
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
  };

  it('個別ラック統計を正しく計算する', () => {
    const stats = calculateRackStats(mockRack);
    
    expect(stats.totalPower).toBe(300);
    expect(stats.totalHeat).toBe(1024);
    expect(stats.totalWeight).toBe(15);
    expect(stats.usedUnits).toBe(1);
    expect(stats.availableUnits).toBe(41);
  });

  it('冷却統計を正しく計算する', () => {
    const coolingStats = calculateCoolingStats(mockRack);
    
    expect(coolingStats.totalHeatGeneration).toBe(1024);
    expect(coolingStats.totalCFM).toBe(65);
    expect(coolingStats.avgTemp).toBeGreaterThan(22);
  });

  it('ゲージナット状態を正しく取得する', () => {
    const status = getCageNutStatus(1, mockRack);
    
    expect(status.installed).toBe(0);
    expect(status.total).toBe(8);
    expect(status.isComplete).toBe(false);
  });
});

describe('全体統計計算', () => {
  const mockRacks = {
    'rack-1': {
      id: 'rack-1',
      name: 'ラック1',
      type: '42u-standard',
      units: 42,
      equipment: {
        1: { power: 300, heat: 1024, weight: 15, height: 1, isMainUnit: true } as Equipment
      }
    } as Rack,
    'rack-2': {
      id: 'rack-2', 
      name: 'ラック2',
      type: '42u-standard',
      units: 42,
      equipment: {
        1: { power: 500, heat: 1707, weight: 25, height: 2, isMainUnit: true } as Equipment
      }
    } as Rack
  };

  it('全体統計を正しく計算する', () => {
    const stats = calculateTotalStats(mockRacks);
    
    expect(stats.totalPower).toBe(800);
    expect(stats.totalHeat).toBe(2731);
    expect(stats.totalWeight).toBe(40);
    expect(stats.rackCount).toBe(2);
  });
});