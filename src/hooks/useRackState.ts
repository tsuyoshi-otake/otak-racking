import { useState, useCallback } from 'react';
import { Rack, Equipment, FloorSettings } from '../types';
import { deepCopy, autoInstallCageNuts } from '../utils';
import { rackTypes } from '../constants';

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

  // 機器追加
  const addEquipment = useCallback((rackId: string, startUnit: number, equipment: Equipment) => {
    const endUnit = startUnit + equipment.height - 1;
    const equipmentId = `${equipment.id}-${Date.now()}`;
    
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      
      // 機器をユニットに配置
      for (let unit = startUnit; unit <= endUnit; unit++) {
        newRack.equipment[unit] = {
          ...equipment,
          id: equipmentId,
          startUnit,
          endUnit,
          isMainUnit: unit === startUnit
        };
      }
      
      // 電源接続設定
      if (equipment.dualPower) {
        newRack.powerConnections[equipmentId] = { 
          primarySource: null,
          primaryType: 'pdu',
          secondarySource: null,
          secondaryType: 'pdu',
          powerPath: 'redundant'
        };
      } else {
        newRack.powerConnections[equipmentId] = {
          primarySource: null,
          primaryType: 'pdu',
          powerPath: 'single'
        };
      }
      
      // 取り付け設定
      newRack.mountingOptions[equipmentId] = {
        type: equipment.needsRails ? 'none' : 'direct',
        hasShelf: false,
        hasCableArm: false
      };
      
      // ラベル設定
      newRack.labels[equipmentId] = {
        customName: '',
        ipAddress: '',
        serialNumber: '',
        owner: '',
        purpose: '',
        installDate: new Date().toISOString().split('T')[0],
        notes: ''
      };
      
      return {
        ...prev,
        [rackId]: newRack
      };
    });
  }, []);

  // 機器削除
  const removeEquipment = useCallback((rackId: string, unit: number) => {
    setRacks(prev => {
      const rack = prev[rackId];
      const item = rack.equipment[unit];
      if (!item) return prev;

      const newRack = deepCopy(rack);
      
      // 機器をすべてのユニットから削除
      for (let u = item.startUnit!; u <= item.endUnit!; u++) {
        delete newRack.equipment[u];
      }
      
      // 関連設定も削除
      delete newRack.powerConnections[item.id];
      delete newRack.mountingOptions[item.id];
      delete newRack.labels[item.id];
      
      return {
        ...prev,
        [rackId]: newRack
      };
    });
  }, []);

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