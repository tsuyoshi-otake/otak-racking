import { useState, useCallback, useEffect } from 'react';
import { Rack, Equipment, FloorSettings, createDefaultPhysicalStructure, RailInstallation } from '../types';
import { deepCopy, autoInstallCageNuts } from '../utils';
import { rackTypes } from '../constants';
import { placementManager } from '../services/EquipmentPlacementManager';
import { loadAppState, saveAppState } from '../utils/localStorage';

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
  },
  pduPlacements: [
    {
      id: 'pdu-left-1',
      equipment: {
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
        needsRails: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 0,
        description: 'ラック左側に設置されたPDU'
      },
      position: 'left',
      offset: 50,
      orientation: 'vertical'
    },
    {
      id: 'pdu-right-1',
      equipment: {
        id: 'pdu-vertical-smart',
        name: 'スマートPDU',
        height: 42,
        depth: 100,
        power: 0,
        heat: 0,
        weight: 7,
        type: 'pdu',
        color: '#B91C1C',
        dualPower: false,
        needsRails: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 0,
        description: 'ラック右側に設置されたスマートPDU'
      },
      position: 'right',
      offset: 50,
      orientation: 'vertical'
    }
  ],
  railInstallations: {},
  physicalStructure: createDefaultPhysicalStructure()
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
  // LocalStorageから初期状態を読み込み
  const loadedState = loadAppState();
  
  const [racks, setRacks] = useState<Record<string, Rack>>(() => {
    if (loadedState.racks && Object.keys(loadedState.racks).length > 0) {
      // 既存のラックにphysicalStructureが存在しない場合は追加
      const updatedRacks: Record<string, Rack> = {};
      Object.entries(loadedState.racks).forEach(([id, rack]) => {
        updatedRacks[id] = {
          ...rack,
          physicalStructure: rack.physicalStructure || createDefaultPhysicalStructure()
        };
      });
      return updatedRacks;
    }
    return { 'rack-1': createInitialRack('rack-1', 'ラック #1', 0) };
  });
  
  const [selectedRack, setSelectedRack] = useState<string>(() => {
    if (loadedState.selectedRack && loadedState.racks && loadedState.racks[loadedState.selectedRack]) {
      return loadedState.selectedRack;
    }
    return Object.keys(racks)[0] || 'rack-1';
  });
  
  const [floorSettings, setFloorSettings] = useState<FloorSettings>(() => {
    return loadedState.floorSettings || initialFloorSettings;
  });

  // 状態変更時にLocalStorageに保存
  useEffect(() => {
    const stateToSave = {
      racks,
      selectedRack,
      floorSettings
    };
    saveAppState(stateToSave);
  }, [racks, selectedRack, floorSettings]);

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
      const rackCopy = JSON.parse(JSON.stringify(currentRack));
      const result = await placementManager.placeEquipment(rackCopy, startUnit, equipment, {
        autoInstallCageNuts: true
      });

      if (result.success && result.updatedRack) {
        const newRack = result.updatedRack;
        setRacks(prev => ({
          ...prev,
          [rackId]: newRack
        }));
      } else {
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
      const result = await placementManager.removeEquipment(currentRack, unit);

      if (result.success && result.updatedRack) {
        const newRack = result.updatedRack;
        setRacks(prev => ({
          ...prev,
          [rackId]: newRack
        }));
      } else {
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
        const equipment = Object.values(newRack.equipment).find(e => e.id === equipmentId);

        if (!equipment) return prev;

        // Update mounting option
        newRack.mountingOptions[equipmentId] = {
            ...newRack.mountingOptions[equipmentId],
            [field]: value
        };

        // if the type of mounting is being changed
        if (field === 'type') {
            const railType = value;
            const existingRailId = Object.keys(newRack.railInstallations).find(
                id => newRack.railInstallations[id].equipmentId === equipmentId
            );

            // Remove existing rail if it exists
            if (existingRailId) {
                delete newRack.railInstallations[existingRailId];
            }

            // Add new rail if a rail type is selected
            if (railType.includes('rail')) {
                const newRailId = `rail-${Date.now()}`;
                newRack.railInstallations[newRailId] = {
                    id: newRailId,
                    startUnit: equipment.startUnit!,
                    endUnit: equipment.endUnit!,
                    type: railType,
                    depth: equipment.depth,
                    equipmentId: equipmentId,
                    highlightPositions: ['top', 'bottom'],
                };
            }
        }

        return { ...prev, [rackId]: newRack };
    });
}, []);

  // ゲージナット設置
  const installCageNut = useCallback((rackId: string, unit: number, side: string, position: string, nutType: string = 'm6') => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      if (!newRack.cageNuts[unit]) {
        newRack.cageNuts[unit] = {
          frontLeft: { top: null, middle: null, bottom: null },
          frontRight: { top: null, middle: null, bottom: null },
          rearLeft: { top: null, middle: null, bottom: null },
          rearRight: { top: null, middle: null, bottom: null }
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

  const installRail = useCallback((rackId: string, equipmentId: string, startUnit: number, endUnit: number, type: 'slide' | 'fixed' | 'toolless', depth: number) => {
      setRacks(prev => {
        const newRacks = deepCopy(prev);
        const rack = newRacks[rackId];
        if (rack) {
          const newRailId = `rail-${Date.now()}`;
          rack.railInstallations[newRailId] = {
            id: newRailId,
            startUnit,
            endUnit,
            type,
            depth,
            equipmentId,
            highlightPositions: ['top', 'bottom'],
          };
        }
        return newRacks;
      });
    }, []);

  const removeRail = useCallback((rackId: string, railId: string) => {
    setRacks(prev => {
      const newRacks = deepCopy(prev);
      const rack = newRacks[rackId];
      if (rack && rack.railInstallations[railId]) {
        delete rack.railInstallations[railId];
      }
      return newRacks;
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
    installRail,
    removeRail,
    
    // Computed
    currentRack: racks[selectedRack] || racks[Object.keys(racks)[0]]
  };
};