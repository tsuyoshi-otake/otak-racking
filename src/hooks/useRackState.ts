import { useState, useCallback, useEffect } from 'react';
import { Rack, Equipment, FloorSettings, createDefaultPhysicalStructure, RailType } from '../types';
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
  rails: {},
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
        role: 'power-distribution',
        color: '#DC2626',
        dualPower: false,
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
        role: 'power-distribution',
        color: '#B91C1C',
        dualPower: false,
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

  const [isProMode, setIsProMode] = useState<boolean>(() => loadedState.isProMode || false);

  // 状態変更時にLocalStorageに保存
  useEffect(() => {
    const stateToSave = {
      racks,
      selectedRack,
      floorSettings,
      isProMode,
    };
    // saveAppState(stateToSave); // App.tsx に移動したためコメントアウト
  }, [racks, selectedRack, floorSettings, isProMode]);

  const toggleProMode = () => {
    setIsProMode(prev => {
      const newValue = !prev;
      console.log('Pro Mode toggled:', newValue);
      return newValue;
    });
  };

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
    if (!currentRack) {
      // エラーハンドリングを改善
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            code: 'RACK_NOT_FOUND',
            message: '指定されたラックが見つかりません。',
            affectedUnits: [],
            severity: 'error' as const
          }],
          warnings: []
        },
        appliedChanges: [],
      };
    }

    try {
      const rackCopy = JSON.parse(JSON.stringify(currentRack));
      const result = await placementManager.placeEquipment(rackCopy, startUnit, equipment, {
        autoInstallCageNuts: !isProMode
      }, isProMode);

      if (result.success && result.updatedRack) {
        setRacks(prev => ({
          ...prev,
          [rackId]: result.updatedRack!
        }));
      }
      // 失敗した場合でも result を返すことで、UI側でエラーメッセージをハンドリングできるようにする
      return result;
    } catch (error) {
      console.error('機器配置中に予期せぬエラーが発生しました:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            code: 'UNEXPECTED_ERROR',
            message: '予期せぬエラーが発生しました。',
            affectedUnits: [startUnit],
            severity: 'error' as const
          }],
          warnings: []
        },
        appliedChanges: [],
      };
    }
  }, [racks, isProMode]);

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

  // 全機器削除（ラッククリア）
  const clearAllEquipment = useCallback(async (rackId: string) => {
    const currentRack = racks[rackId];
    if (!currentRack) return;

    try {
      const result = await placementManager.clearAllEquipment(currentRack);

      if (result.success && result.updatedRack) {
        const newRack = result.updatedRack;
        setRacks(prev => ({
          ...prev,
          [rackId]: newRack
        }));
      } else {
        console.error('ラッククリアに失敗しました:', result.validation.errors);
      }
    } catch (error) {
      console.error('ラッククリア中にエラーが発生しました:', error);
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

  // 機器の色を更新
  const updateEquipmentColor = useCallback((rackId: string, equipmentId: string, color: string) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      const equipment = Object.values(newRack.equipment).find(e => e.id === equipmentId);
      if (equipment) {
        equipment.color = color;
      }
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


  // 環境設定更新
  const updateEnvironment = useCallback((rackId: string, field: string, value: number) => {
    setRacks(prev => {
      const newRack = deepCopy(prev[rackId]);
      (newRack.environment as any)[field] = value;
      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // レール設置（左右独立）
  const installRail = useCallback(
    (rackId: string, unit: number, side: 'left' | 'right', railType: RailType) => {
      setRacks(prev => {
        const rack = prev[rackId];
        if (!rack) return prev;

        const railUnits = parseInt(railType);
        const newRails = { ...rack.rails };
        const newCageNuts = { ...rack.cageNuts };

        // レールが占有するユニット範囲を設定
        for (let u = unit; u < unit + railUnits && u <= rack.units; u++) {
          if (!newRails[u]) {
            newRails[u] = {
              frontLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
              frontRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
              rearLeft: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null },
              rearRight: { installed: false, railType: null, startUnit: null, endUnit: null, railId: null }
            };
          }

          // レール固定用のケージナット穴を自動的に「rail-fixed」として記録
          // レールの最初と最後のユニットにケージナットを設置
          if (u === unit || u === unit + railUnits - 1) {
            if (!newCageNuts[u]) {
              newCageNuts[u] = {
                frontLeft: { top: null, middle: null, bottom: null },
                frontRight: { top: null, middle: null, bottom: null },
                rearLeft: { top: null, middle: null, bottom: null },
                rearRight: { top: null, middle: null, bottom: null }
              };
            }

            // レール固定用のマーカーを設定（実際のケージナットではなく、レール固定を示す）
            if (side === 'left') {
              // 前面と背面の左側に固定マーカーを設定
              newCageNuts[u].frontLeft = { top: 'rail-fixed', middle: 'rail-fixed', bottom: 'rail-fixed' };
              newCageNuts[u].rearLeft = { top: 'rail-fixed', middle: 'rail-fixed', bottom: 'rail-fixed' };
            } else {
              // 前面と背面の右側に固定マーカーを設定
              newCageNuts[u].frontRight = { top: 'rail-fixed', middle: 'rail-fixed', bottom: 'rail-fixed' };
              newCageNuts[u].rearRight = { top: 'rail-fixed', middle: 'rail-fixed', bottom: 'rail-fixed' };
            }
          }

          // 指定された側のレールのみを設置
          if (side === 'left') {
            newRails[u].frontLeft = {
              installed: true,
              railType: railType,
              startUnit: unit,
              endUnit: unit + railUnits - 1,
              railId: `rail-${railType}-${unit}-left`
            };
            newRails[u].rearLeft = {
              installed: true,
              railType: railType,
              startUnit: unit,
              endUnit: unit + railUnits - 1,
              railId: `rail-${railType}-${unit}-rear-left`
            };
          } else {
            newRails[u].frontRight = {
              installed: true,
              railType: railType,
              startUnit: unit,
              endUnit: unit + railUnits - 1,
              railId: `rail-${railType}-${unit}-right`
            };
            newRails[u].rearRight = {
              installed: true,
              railType: railType,
              startUnit: unit,
              endUnit: unit + railUnits - 1,
              railId: `rail-${railType}-${unit}-rear-right`
            };
          }
        }

        return {
          ...prev,
          [rackId]: {
            ...rack,
            rails: newRails,
            cageNuts: newCageNuts
          }
        };
      });
    },
    []
  );

  // レール削除（左右独立）
  const removeRail = useCallback(
    (rackId: string, unit: number, side: 'left' | 'right') => {
      setRacks(prev => {
        const rack = prev[rackId];
        if (!rack || !rack.rails[unit]) return prev;

        const railConfig = rack.rails[unit];
        const leftStartUnit = railConfig.frontLeft?.startUnit || unit;
        const leftEndUnit = railConfig.frontLeft?.endUnit || unit;
        const rightStartUnit = railConfig.frontRight?.startUnit || unit;
        const rightEndUnit = railConfig.frontRight?.endUnit || unit;

        const newRails = { ...rack.rails };
        const newCageNuts = { ...rack.cageNuts };

        if (side === 'left') {
          // 左側のレールが占有していたユニット範囲をクリア
          for (let u = leftStartUnit; u <= leftEndUnit && u <= rack.units; u++) {
            if (newRails[u]) {
              newRails[u].frontLeft = { installed: false, railType: null, startUnit: null, endUnit: null, railId: null };
              newRails[u].rearLeft = { installed: false, railType: null, startUnit: null, endUnit: null, railId: null };
              
              // レール固定用のケージナットマーカーもクリア（最初と最後のユニット）
              if ((u === leftStartUnit || u === leftEndUnit) && newCageNuts[u]) {
                // rail-fixedマーカーをクリア
                if (newCageNuts[u].frontLeft?.top === 'rail-fixed') {
                  newCageNuts[u].frontLeft = { top: null, middle: null, bottom: null };
                }
                if (newCageNuts[u].rearLeft?.top === 'rail-fixed') {
                  newCageNuts[u].rearLeft = { top: null, middle: null, bottom: null };
                }
              }
              
              // 右側にもレールがない場合は、エントリ自体を削除
              if (!newRails[u].frontRight.installed && !newRails[u].rearRight.installed) {
                delete newRails[u];
              }
            }
          }
        } else {
          // 右側のレールが占有していたユニット範囲をクリア
          for (let u = rightStartUnit; u <= rightEndUnit && u <= rack.units; u++) {
            if (newRails[u]) {
              newRails[u].frontRight = { installed: false, railType: null, startUnit: null, endUnit: null, railId: null };
              newRails[u].rearRight = { installed: false, railType: null, startUnit: null, endUnit: null, railId: null };
              
              // レール固定用のケージナットマーカーもクリア（最初と最後のユニット）
              if ((u === rightStartUnit || u === rightEndUnit) && newCageNuts[u]) {
                // rail-fixedマーカーをクリア
                if (newCageNuts[u].frontRight?.top === 'rail-fixed') {
                  newCageNuts[u].frontRight = { top: null, middle: null, bottom: null };
                }
                if (newCageNuts[u].rearRight?.top === 'rail-fixed') {
                  newCageNuts[u].rearRight = { top: null, middle: null, bottom: null };
                }
              }
              
              // 左側にもレールがない場合は、エントリ自体を削除
              if (!newRails[u].frontLeft.installed && !newRails[u].rearLeft.installed) {
                delete newRails[u];
              }
            }
          }
        }

        return {
          ...prev,
          [rackId]: {
            ...rack,
            rails: newRails,
            cageNuts: newCageNuts
          }
        };
      });
    },
    []
  );

  return {
    // State
    racks,
    selectedRack,
    floorSettings,
    isProMode,
    
    // Actions
    setSelectedRack,
    setFloorSettings,
    addRack,
    removeRack,
    duplicateRack,
    updateRack,
    addEquipment,
    removeEquipment,
    clearAllEquipment,
    updateLabel,
    updateEquipmentColor,
    updatePowerConnection,
    updateMountingOption,
    installCageNut,
    removeCageNut,
    autoInstallCageNutsForUnit,
    updateEnvironment,
    installRail,
    removeRail,
    toggleProMode,
    
    // Computed
    currentRack: racks[selectedRack] || racks[Object.keys(racks)[0]]
  };
};