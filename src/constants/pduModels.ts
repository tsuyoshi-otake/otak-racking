import { Equipment } from '../types';

export interface PDUModel {
  id: string;
  name: string;
  outletCount: number;
  outletType: string;
  height: number;
  power: number;
  description: string;
  specifications: Record<string, string>;
}

export const pduModels: Record<string, PDUModel> = {
  'basic-24': {
    id: 'basic-24',
    name: 'Basic PDU (24 Outlets)',
    outletCount: 24,
    outletType: 'IEC C13',
    height: 42,
    power: 0,
    description: '基本的な24口PDU。小規模から中規模ラック向け。',
    specifications: {
      outlets: 'IEC C13×24',
      input: '単相200V 30A',
      monitoring: '基本監視機能',
      mounting: '垂直設置'
    }
  },
  'high-density-42': {
    id: 'high-density-42',
    name: 'High-Density PDU (42 Outlets)',
    outletCount: 42,
    outletType: 'IEC C13',
    height: 42,
    power: 0,
    description: '高密度42口PDU。大型ラックや高密度環境向け。42Uラックに最適。',
    specifications: {
      outlets: 'IEC C13×42',
      input: '単相200V 50A',
      monitoring: '高度監視機能',
      mounting: '垂直設置',
      features: 'アウトレット別電流監視'
    }
  }
};

export const getDefaultPDUModel = (): PDUModel => {
  return pduModels['high-density-42']; // デフォルトで高密度PDUを使用
};

export const createPDUEquipment = (model: PDUModel, name: string, side: 'left' | 'right'): Equipment => {
  return {
    id: `pdu-equipment-${Date.now()}-${side}`,
    name: name,
    height: model.height,
    depth: 100,
    power: model.power,
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
    description: model.description,
    isPdu: true,
    outletCount: model.outletCount,
    pduModelId: model.id,
    specifications: model.specifications
  };
};