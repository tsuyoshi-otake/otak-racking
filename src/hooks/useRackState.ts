import { useState, useCallback, useEffect, useMemo } from 'react';
import { Rack, Equipment, FloorSettings, createDefaultPhysicalStructure, RailType, PowerOutlet } from '../types';
import { deepCopy, autoInstallCageNuts } from '../utils';
import { rackTypes } from '../constants';
import { placementManager } from '../services/EquipmentPlacementManager';
import { loadAppState } from '../utils/localStorage';
import { loadDataFromUrl } from '../utils/shareUtils';
import { getDefaultPDUModel, createPDUEquipment } from '../constants/pduModels';

const createPduOutlets = (count: number, type: string): PowerOutlet[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    type: type,
    inUse: false,
    connectedEquipmentId: null,
  }));
};

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
      id: `pdu-left-${id}`,
      equipment: {
        id: `pdu-equipment-left-${id}`,
        name: 'PDU A系統',
        height: 42,
        depth: 100,
        power: 0,
        heat: 0,
        weight: 8,
        type: 'pdu',
        role: 'power-distribution',
        color: '#374151',
        opacity: 100,
        dualPower: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 0,
        description: 'ラックの左側に設置されたPDU A系統',
        powerOutlets: createPduOutlets(42, 'IEC C13'), // デフォルトで42口に変更
        isPdu: true,
        outletCount: 42,
        pduModelId: 'high-density-42'
      },
      position: 'left',
      offset: 0, // renderPDUsで再計算するため、仮の値
      orientation: 'vertical',
      modelId: 'high-density-42',
      outletCount: 42
    },
    {
      id: `pdu-right-${id}`,
      equipment: {
        id: `pdu-equipment-right-${id}`,
        name: 'PDU B系統',
        height: 42,
        depth: 100,
        power: 0,
        heat: 0,
        weight: 8,
        type: 'pdu',
        role: 'power-distribution',
        color: '#374151',
        opacity: 100,
        dualPower: false,
        airflow: 'natural',
        cfm: 0,
        heatGeneration: 0,
        description: 'ラックの右側に設置されたPDU B系統',
        powerOutlets: createPduOutlets(42, 'IEC C13'), // デフォルトで42口に変更
        isPdu: true,
        outletCount: 42,
        pduModelId: 'high-density-42'
      },
      position: 'right',
      offset: 0, // renderPDUsで再計算するため、仮の値
      orientation: 'vertical',
      modelId: 'high-density-42',
      outletCount: 42
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
  // URLからの共有データを優先的に読み込み
  const sharedData = loadDataFromUrl();
  const loadedState = sharedData || loadAppState();
  const [isSharedDataLoaded] = useState(() => !!sharedData);
  
  const [racks, setRacks] = useState<Record<string, Rack>>(() => {
    if (loadedState.racks && Object.keys(loadedState.racks).length > 0) {
      // 既存のラックにphysicalStructureが存在しない場合は追加
      // また、古いPDUデータを新しい形式に変換
      const updatedRacks: Record<string, Rack> = {};
      Object.entries(loadedState.racks).forEach(([id, rack]) => {
        const updatedRack = {
          ...rack,
          physicalStructure: rack.physicalStructure || createDefaultPhysicalStructure()
        };

        // PDUPlacementの互換性チェックと更新
        if (updatedRack.pduPlacements) {
          updatedRack.pduPlacements = updatedRack.pduPlacements.map((pdu: any) => {
            // 古い形式のPDUPlacementを新しい形式に変換
            if (!pdu.modelId || !pdu.outletCount) {
              const defaultModel = getDefaultPDUModel();
              return {
                ...pdu,
                modelId: defaultModel.id,
                outletCount: defaultModel.outletCount,
                equipment: {
                  ...pdu.equipment,
                  isPdu: true,
                  outletCount: defaultModel.outletCount,
                  pduModelId: defaultModel.id,
                  powerOutlets: pdu.equipment.powerOutlets || createPduOutlets(defaultModel.outletCount, defaultModel.outletType)
                }
              };
            }
            return pdu;
          });
        }

        updatedRacks[id] = updatedRack;
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

  // 共有データが読み込まれた場合、URLパラメータをクリア
  useEffect(() => {
    if (sharedData) {
      const url = new URL(window.location.href);
      url.searchParams.delete('data');
      window.history.replaceState({}, '', url.toString());
    }
  }, [sharedData]);

  // 状態変更時にLocalStorageに保存
  useEffect(() => {
    // saveAppState処理はApp.tsxに移動したため、このeffectは不要
    // const stateToSave = {
    //   racks,
    //   selectedRack,
    //   floorSettings,
    //   isProMode,
    // };
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

  // ラック設定更新（最適化版）
  const updateRack = useCallback((rackId: string, updates: Partial<Rack>) => {
    setRacks(prev => {
      // 変更がない場合は早期リターン
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 浅い比較で変更チェック
      let hasChanges = false;
      for (const key in updates) {
        if (updates[key as keyof Rack] !== currentRack[key as keyof Rack]) {
          hasChanges = true;
          break;
        }
      }
      
      if (!hasChanges) return prev;
      
      const updatedRack = { ...currentRack, ...updates };
      
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

  // 機器移動（新しいEquipmentPlacementManagerを使用）
  const moveEquipment = useCallback(async (rackId: string, fromUnit: number, toUnit: number) => {
    const currentRack = racks[rackId];
    if (!currentRack) {
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            code: 'RACK_NOT_FOUND',
            message: '指定されたラックが見つかりません。',
            affectedUnits: [fromUnit, toUnit],
            severity: 'error' as const
          }],
          warnings: []
        },
        appliedChanges: [],
      };
    }

    try {
      const rackCopy = JSON.parse(JSON.stringify(currentRack));
      const result = await placementManager.moveEquipment(rackCopy, fromUnit, toUnit, {
        autoInstallCageNuts: !isProMode
      }, isProMode);

      if (result.success && result.updatedRack) {
        setRacks(prev => ({
          ...prev,
          [rackId]: result.updatedRack!
        }));
      } else {
        console.error('機器の移動に失敗しました:', result.validation.errors);
      }
      return result;
    } catch (error) {
      console.error('機器移動中にエラーが発生しました:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [{
            code: 'UNEXPECTED_ERROR',
            message: '予期せぬエラーが発生しました。',
            affectedUnits: [fromUnit, toUnit],
            severity: 'error' as const
          }],
          warnings: []
        },
        appliedChanges: [],
      };
    }
  }, [racks, isProMode]);

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

  // ラベル更新（最適化版）
  const updateLabel = useCallback((rackId: string, equipmentId: string, field: string, value: string) => {
    setRacks(prev => {
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 値が変わらない場合は早期リターン
      const currentLabel = currentRack.labels?.[equipmentId];
      if (currentLabel && (currentLabel as any)[field] === value) return prev;
      
      return {
        ...prev,
        [rackId]: {
          ...currentRack,
          labels: {
            ...currentRack.labels,
            [equipmentId]: {
              ...currentRack.labels?.[equipmentId],
              [field]: value
            }
          }
        }
      };
    });
  }, []);

  // 機器の色を更新（最適化版）
  const updateEquipmentColor = useCallback((rackId: string, equipmentId: string, color: string) => {
    setRacks(prev => {
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 該当機器を探す
      let targetUnit: number | null = null;
      let targetEquipment: Equipment | null = null;
      
      for (const [unit, equipment] of Object.entries(currentRack.equipment)) {
        if (equipment.id === equipmentId) {
          targetUnit = parseInt(unit);
          targetEquipment = equipment;
          break;
        }
      }
      
      if (!targetUnit || !targetEquipment || targetEquipment.color === color) {
        return prev;
      }
      
      return {
        ...prev,
        [rackId]: {
          ...currentRack,
          equipment: {
            ...currentRack.equipment,
            [targetUnit]: {
              ...targetEquipment,
              color
            }
          }
        }
      };
    });
  }, []);

  // 機器の透過度を更新（最適化版）
  const updateEquipmentOpacity = useCallback((rackId: string, equipmentId: string, opacity: number) => {
    setRacks(prev => {
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 該当機器を探す
      let targetUnit: number | null = null;
      let targetEquipment: Equipment | null = null;
      
      for (const [unit, equipment] of Object.entries(currentRack.equipment)) {
        if (equipment.id === equipmentId) {
          targetUnit = parseInt(unit);
          targetEquipment = equipment;
          break;
        }
      }
      
      if (!targetUnit || !targetEquipment || targetEquipment.opacity === opacity) {
        return prev;
      }
      
      return {
        ...prev,
        [rackId]: {
          ...currentRack,
          equipment: {
            ...currentRack.equipment,
            [targetUnit]: {
              ...targetEquipment,
              opacity
            }
          }
        }
      };
    });
  }, []);

  // 機器の仕様（power, cfm, weight）を更新
  const updateEquipmentSpecs = useCallback((rackId: string, equipmentId: string, field: 'power' | 'cfm' | 'weight', value: number) => {
    setRacks(prev => {
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 該当機器を探す
      let targetUnit: number | null = null;
      let targetEquipment: Equipment | null = null;
      
      for (const [unit, equipment] of Object.entries(currentRack.equipment)) {
        if (equipment.id === equipmentId) {
          targetUnit = parseInt(unit);
          targetEquipment = equipment;
          break;
        }
      }
      
      if (!targetUnit || !targetEquipment || targetEquipment[field] === value) {
        return prev;
      }
      
      // powerが変更された場合、heatも自動計算
      let updatedEquipment = {
        ...targetEquipment,
        [field]: value
      };
      
      if (field === 'power') {
        // 消費電力からBTU/hへの変換（1W = 3.412 BTU/h）
        updatedEquipment.heat = Math.round(value * 3.412);
      }
      
      return {
        ...prev,
        [rackId]: {
          ...currentRack,
          equipment: {
            ...currentRack.equipment,
            [targetUnit]: updatedEquipment
          }
        }
      };
    });
  }, []);


  // 電源接続更新
  const updatePowerConnection = useCallback((rackId: string, equipmentId: string, field: string, value: any) => {
    setRacks(prev => {
      const rack = prev[rackId];
      if (!rack) return prev;

      const newRack = deepCopy(rack);
      const equipment = Object.values(newRack.equipment).find(e => e.id === equipmentId);
      if (!equipment) return prev;

      // useSecondaryPowerフィールドの場合は機器のプロパティを直接更新
      if (field === 'useSecondaryPower') {
        // 該当機器を探して更新
        for (const [unit, eq] of Object.entries(newRack.equipment)) {
          if (eq.id === equipmentId) {
            newRack.equipment[parseInt(unit)] = {
              ...eq,
              useSecondaryPower: value
            };
            
            // セカンダリ電源を使用しない場合、既存のセカンダリ電源接続をクリア
            if (!value && newRack.powerConnections[equipmentId]) {
              const connection = newRack.powerConnections[equipmentId];
              if (connection.secondaryPduId) {
                // 古いPDUのアウトレットを解放
                const oldPdu = newRack.pduPlacements.find(p => p.equipment.id === connection.secondaryPduId)?.equipment;
                if (oldPdu && oldPdu.powerOutlets) {
                  const oldOutletIndex = oldPdu.powerOutlets.findIndex(o => o.connectedEquipmentId === equipmentId);
                  if (oldOutletIndex > -1) {
                    oldPdu.powerOutlets[oldOutletIndex].inUse = false;
                    oldPdu.powerOutlets[oldOutletIndex].connectedEquipmentId = null;
                  }
                }
                
                // セカンダリ電源接続をクリア
                newRack.powerConnections[equipmentId] = {
                  ...connection,
                  secondaryPduId: null,
                  secondaryPduOutlet: null
                };
              }
            }
            break;
          }
        }
        return { ...prev, [rackId]: newRack };
      }

      const connection = newRack.powerConnections[equipmentId] || {};
      const oldPduId = field === 'primarySource' ? connection.primaryPduId : connection.secondaryPduId;
      
      // 接続情報を更新
      const updatedConnection = {
        ...connection,
        [field]: value,
      };

      let pduToUpdateId: string | undefined;
      let pduToUpdate: Equipment | undefined;

      // PDU接続が変更された場合の処理
      if (field === 'primaryPduId' || field === 'secondaryPduId') {
        const pduId = value;
        const outletField = field === 'primaryPduId' ? 'primaryPduOutlet' : 'secondaryPduOutlet';
        
        // 古いPDUのアウトレットを解放
        if (oldPduId) {
          const oldPdu = newRack.pduPlacements.find(p => p.equipment.id === oldPduId)?.equipment;
          if (oldPdu && oldPdu.powerOutlets) {
            const oldOutletIndex = oldPdu.powerOutlets.findIndex(o => o.connectedEquipmentId === equipmentId);
            if (oldOutletIndex > -1) {
              oldPdu.powerOutlets[oldOutletIndex].inUse = false;
              oldPdu.powerOutlets[oldOutletIndex].connectedEquipmentId = null;
            }
          }
        }

        // 新しいPDUの最初のアベイラブルなアウトレットに接続
        if (pduId) {
          pduToUpdate = newRack.pduPlacements.find(p => p.equipment.id === pduId)?.equipment;
          if (pduToUpdate && pduToUpdate.powerOutlets) {
            const availableOutlet = pduToUpdate.powerOutlets.find(o => !o.inUse);
            if (availableOutlet) {
              availableOutlet.inUse = true;
              availableOutlet.connectedEquipmentId = equipmentId;
              updatedConnection[outletField] = availableOutlet.id;
              pduToUpdateId = pduToUpdate.id;
            } else {
              // 空きがない場合は接続しない
              updatedConnection[outletField] = null;
            }
          }
        } else {
          // PDUから切断
          updatedConnection[outletField] = null;
        }
      }
      
      newRack.powerConnections[equipmentId] = updatedConnection;

      // PDUの状態を更新
      if (pduToUpdateId && pduToUpdate) {
        const pduPlacementIndex = newRack.pduPlacements.findIndex(p => p.equipment.id === pduToUpdateId);
        if (pduPlacementIndex > -1) {
          newRack.pduPlacements[pduPlacementIndex].equipment = pduToUpdate;
        }
      }

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

  // PDUをスロットに設置
  const addPduToSlot = useCallback((rackId: string, side: 'left' | 'right', top: number, modelId?: string) => {
    setRacks(prev => {
      const rack = prev[rackId];
      if (!rack) return prev;

      const newRack = deepCopy(rack);
      const newPduId = `pdu-${side}-${Date.now()}`;
      
      // デフォルトで高密度PDUモデルを使用
      const pduModel = getDefaultPDUModel();
      const newPduEquipment = createPDUEquipment(
        pduModel,
        `PDU ${side === 'left' ? 'A' : 'B'}系統`,
        side
      );

      // PowerOutletsを作成
      newPduEquipment.powerOutlets = createPduOutlets(pduModel.outletCount, pduModel.outletType);

      if (!newRack.pduPlacements) {
        newRack.pduPlacements = [];
      }

      newRack.pduPlacements.push({
        id: newPduId,
        equipment: newPduEquipment,
        position: side,
        offset: top, // RackPDUから渡されたtop値をオフセットとして使用
        orientation: 'vertical',
        modelId: pduModel.id,
        outletCount: pduModel.outletCount
      });

      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // PDUを削除
  const removePdu = useCallback((rackId: string, pduId: string) => {
    setRacks(prev => {
      const rack = prev[rackId];
      if (!rack || !rack.pduPlacements) return prev;

      const newRack = deepCopy(rack);
      newRack.pduPlacements = newRack.pduPlacements.filter(p => p.id !== pduId);

      return { ...prev, [rackId]: newRack };
    });
  }, []);

  // 計算値をメモ化
  const currentRack = useMemo(() =>
    racks[selectedRack] || racks[Object.keys(racks)[0]],
    [racks, selectedRack]
  );

  // 機器のヘルス状態をトグル
  const toggleEquipmentHealth = useCallback((rackId: string, equipmentId: string) => {
    setRacks(prev => {
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 該当機器を探す
      let targetUnit: number | null = null;
      let targetEquipment: Equipment | null = null;
      
      for (const [unit, equipment] of Object.entries(currentRack.equipment)) {
        if (equipment.id === equipmentId) {
          targetUnit = parseInt(unit);
          targetEquipment = equipment;
          break;
        }
      }
      
      if (!targetUnit || !targetEquipment) {
        return prev;
      }
      
      // ヘルス状態をトグル
      const newHealthStatus = targetEquipment.healthStatus === 'error' ? 'normal' : 'error';
      
      return {
        ...prev,
        [rackId]: {
          ...currentRack,
          equipment: {
            ...currentRack.equipment,
            [targetUnit]: {
              ...targetEquipment,
              healthStatus: newHealthStatus
            }
          }
        }
      };
    });
  }, []);

  // 機器の電源状態をトグル
  const toggleEquipmentPower = useCallback((rackId: string, equipmentId: string) => {
    setRacks(prev => {
      const currentRack = prev[rackId];
      if (!currentRack) return prev;
      
      // 該当機器を探す
      let targetUnit: number | null = null;
      let targetEquipment: Equipment | null = null;
      
      for (const [unit, equipment] of Object.entries(currentRack.equipment)) {
        if (equipment.id === equipmentId) {
          targetUnit = parseInt(unit);
          targetEquipment = equipment;
          break;
        }
      }
      
      if (!targetUnit || !targetEquipment) {
        return prev;
      }
      
      // 電源状態をトグル（デフォルトはON）
      const newPowerState = targetEquipment.powerOn === false ? true : false;
      
      return {
        ...prev,
        [rackId]: {
          ...currentRack,
          equipment: {
            ...currentRack.equipment,
            [targetUnit]: {
              ...targetEquipment,
              powerOn: newPowerState
            }
          }
        }
      };
    });
  }, []);

  return {
    // State
    racks,
    selectedRack,
    floorSettings,
    isProMode,
    isSharedDataLoaded,
    
    // Actions
    setSelectedRack,
    setFloorSettings,
    addRack,
    removeRack,
    duplicateRack,
    updateRack,
    addEquipment,
    removeEquipment,
    moveEquipment,
    clearAllEquipment,
    updateLabel,
    updateEquipmentColor,
    updateEquipmentOpacity,
    updateEquipmentSpecs,
    updatePowerConnection,
    updateMountingOption,
    installCageNut,
    removeCageNut,
    autoInstallCageNutsForUnit,
    updateEnvironment,
    installRail,
    removeRail,
    toggleProMode,
    addPduToSlot,
    removePdu,
    toggleEquipmentHealth,
    toggleEquipmentPower,
    
    // Computed
    currentRack
  };
};