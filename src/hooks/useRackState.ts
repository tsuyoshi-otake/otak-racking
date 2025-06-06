import { useState, useCallback } from 'react';
import { Rack, Equipment, FloorSettings } from '../types';
import { deepCopy, autoInstallCageNuts } from '../utils';
import { rackTypes } from '../constants';
import { placementManager } from '../services/EquipmentPlacementManager';

// 初期ラック設定
const createInitialRack = (id: string, name: string, rackCount: number): Rack => ({
  id,
  name,
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
  position: { row: 'A', column: rackCount + 1 },
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
    ambientTemp: 22,
    humidity: 45,
    pressureDiff: 0.2
  }
});

// 初期フロア設定
const initialFloorSettings: FloorSettings = {
  hasAccessFloor: true,
  floorHeight: 600,
  tileSize: 600,
  supportType: 'adjustable',
  loadCapacity: 'heavy',
  cableRouting: {
    power: 'underfloor',
    data: 'underfloor',
    fiber: 'overhead'
  }
};

export const useRackState = () => {
  const [racks, setRacks] = useState<Record<string, Rack>>({
    'rack-1': createInitialRack('rack-1', 'ラック #1', 0)
  });
  
  const [selectedRack, setSelectedRack] = useState<string>('rack-1');
  const [floorSettings, setFloorSettings] = useState<FloorSettings>(initialFloorSettings);

  // ラック追加
  const addRack = useCallback(() => {
    const rackCount = Object.keys(racks).length;
    const newRackId = `rack-${Date.now()}`;
    const newRack = createInitialRack(newRackId, `ラック #${rackCount + 1}`, rackCount);
    
    setRacks(prev => ({ ...prev, [newRackId]: newRack }));
    setSelectedRack(newRackId);
  }, [racks]);

  // ラック削除
  const removeRack = useCallback((rackId: string) => {
    if (Object.keys(racks).length <= 1) return;
    
    const newRacks = { ...racks };
    delete newRacks[rackId];
    setRacks(newRacks);
    
    if (selectedRack === rackId) {
      setSelectedRack(Object.keys(newRacks)[0]);
    }
  }, [racks, selectedRack]);

  // ラック複製
  const duplicateRack = useCallback((rackId: string) => {
    const sourceRack = racks[rackId];
    if (!sourceRack) return;
    
    const rackCount = Object.keys(racks).length;
    const newRackId = `rack-${Date.now()}`;
    
    const newRack: Rack = {
      ...deepCopy(sourceRack),
      id: newRackId,
      name: `${sourceRack.name} (コピー)`,
      position: { row: sourceRack.position.row, column: rackCount + 1 }
    };
    
    setRacks(prev => ({ ...prev, [newRackId]: newRack }));
    setSelectedRack(newRackId);
  }, [racks]);

  // ラック設定更新
  const updateRack = useCallback((rackId: string, updates: Partial<Rack>) => {
    setRacks(prev => {
      const updatedRack = { ...prev[rackId], ...updates };
      
      // ラック種類が変更された場合の追加処理
      if (updates.type) {
        const rackType = rackTypes[updates.type];
        updatedRack.units = rackType.units;
        updatedRack.depth = rackType.depth;
        updatedRack.width = rackType.width;
      }
      
      return {
        ...prev,
        [rackId]: updatedRack
      };
    });
  }, []);

  // 機器追加（新しいEquipmentPlacementManagerを使用）
  const addEquipment = useCallback(async (rackId: string, startUnit: number, equipment: Equipment) => {
    const currentRack = racks[rackId];
    if (!currentRack) return;

    try {
      // ラックのディープコピーを作成（Reactの不変性を保つため）
      const rackCopy = deepCopy(currentRack);
      
      // 新しいEquipmentPlacementManagerを使用して配置を試行
      const result = await placementManager.placeEquipment(rackCopy, startUnit, equipment, {
        autoInstallCageNuts: true // デフォルトで自動設置を有効にする
      });

      if (result.success) {
        // 配置が成功した場合、ラック状態を更新
        setRacks(prev => ({
          ...prev,
          [rackId]: rackCopy // 変更されたコピーを反映
        }));
      } else {
        // 配置が失敗した場合、エラーメッセージを表示
        console.error('機器の配置に失敗しました:', result.validation.errors);
        // TODO: ユーザーにエラーメッセージを表示する仕組みを追加
      }
    } catch (error) {
      console.error('機器配置中にエラーが発生しました:', error);
    }
  }, [racks]);

  // 機器削除（新しいEquipmentPlacementManagerを使用）
  const removeEquipment = useCallback(async (rackId: string, unit: number) => {
    const currentRack = racks[rackId];
    if (!currentRack) return;

    try {
      // ラックのディープコピーを作成（Reactの不変性を保つため）
      const rackCopy = deepCopy(currentRack);
      
      // 新しいEquipmentPlacementManagerを使用して削除を試行
      const result = await placementManager.removeEquipment(rackCopy, unit);

      if (result.success) {
        // 削除が成功した場合、ラック状態を更新
        setRacks(prev => ({
          ...prev,
          [rackId]: rackCopy // 変更されたコピーを反映
        }));
      } else {
        // 削除が失敗した場合、エラーメッセージを表示
        console.error('機器の削除に失敗しました:', result.validation.errors);
      }
    } catch (error) {
      console.error('機器削除中にエラーが発生しました:', error);
    }
  }, [racks]);

  // ラベル更新
  const updateLabel = useCallback((rackId: string, equipmentId: string, field: string, value: string) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      newRack.labels = newRack.labels || {};
      newRack.labels[equipmentId] = {
        ...newRack.labels[equipmentId],
        [field]: value
      };
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // 電源接続更新
  const updatePowerConnection = useCallback((rackId: string, equipmentId: string, field: string, value: any) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      newRack.powerConnections[equipmentId] = {
        ...newRack.powerConnections[equipmentId],
        [field]: value
      };
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // 取り付け設定更新
  const updateMountingOption = useCallback((rackId: string, equipmentId: string, field: string, value: any) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      newRack.mountingOptions[equipmentId] = {
        ...newRack.mountingOptions[equipmentId],
        [field]: value
      };
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // ゲージナット設置
  const installCageNut = useCallback((rackId: string, unit: number, side: string, position: string, nutType: string = 'm6') => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      if (!newRack.cageNuts[unit]) {
        newRack.cageNuts[unit] = { 
          frontLeft: { top: null, bottom: null }, 
          frontRight: { top: null, bottom: null },
          rearLeft: { top: null, bottom: null }, 
          rearRight: { top: null, bottom: null }
        };
      }
      (newRack.cageNuts[unit] as any)[side][position] = nutType;
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // ゲージナット削除
  const removeCageNut = useCallback((rackId: string, unit: number, side: string, position: string) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      if (newRack.cageNuts[unit] && (newRack.cageNuts[unit] as any)[side]) {
        (newRack.cageNuts[unit] as any)[side][position] = null;
      }
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // ゲージナット自動設置
  const autoInstallCageNutsForUnit = useCallback((rackId: string, unit: number, nutType: string = 'm6') => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      newRack.cageNuts[unit] = autoInstallCageNuts(unit, nutType);
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // 環境設定更新
  const updateEnvironment = useCallback((rackId: string, field: string, value: number) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      (newRack.environment as any)[field] = value;
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  return {
    // State
    racks,
    selectedRack,
    floorSettings,
    
    // Actions
    setSelectedRack,
    setFloorSettings,
    addRack,
    removeRack,
    duplicateRack,
    updateRack,
    addEquipment,
    removeEquipment,
    updateLabel,
    updatePowerConnection,
    updateMountingOption,
    installCageNut,
    removeCageNut,
    autoInstallCageNutsForUnit,
    updateEnvironment,
    
    // Computed
    currentRack: racks[selectedRack] || racks[Object.keys(racks)[0]]
  };
};