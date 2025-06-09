import { RackType, Equipment } from './types';

// 基本サイズ定義
export const BASE_UNIT_HEIGHT = 32; // 1ユニットの基本高さ (px)
export const BASE_FONT_SIZE = 12; // 基本フォントサイズ (px)
export const BASE_MARGIN_LEFT = 24; // U番号の基本左マージン (px)
export const BASE_CAGE_NUT_SIZE = 16; // ケージナットの基本サイズ (px)
// ラック種類ライブラリ
export const rackTypes: Record<string, RackType> = {
  '42u-standard': { 
    name: '42U 標準ラック', 
    units: 42, 
    depth: 1000, 
    width: 600, 
    maxWeight: 1500, 
    price: 150000, 
    description: '最も一般的なサーバーラック。幅600mm、奥行1000mmで多くの機器に対応' 
  },
  '42u-deep': { 
    name: '42U 深型ラック', 
    units: 42, 
    depth: 1200, 
    width: 600, 
    maxWeight: 1800, 
    price: 180000, 
    description: '深い機器や大型ストレージ用。奥行1200mmで余裕のあるケーブル配線が可能' 
  },
  '45u-standard': { 
    name: '45U 標準ラック', 
    units: 45, 
    depth: 1000, 
    width: 600, 
    maxWeight: 1600, 
    price: 170000, 
    description: '高密度配置用の高いラック。天井高に余裕がある場合に選択' 
  },
  '36u-compact': { 
    name: '36U コンパクト', 
    units: 36, 
    depth: 800, 
    width: 600, 
    maxWeight: 1200, 
    price: 120000, 
    description: '小規模環境や低天井環境用。コンパクトながら必要十分な容量' 
  },
  '42u-wide': { 
    name: '42U ワイド', 
    units: 42, 
    depth: 1000, 
    width: 800, 
    maxWeight: 1500, 
    price: 200000, 
    description: '幅広機器や特殊用途向け。通常より200mm幅が広い特殊ラック' 
  },
  '24u-wall': { 
    name: '24U 壁掛け', 
    units: 24, 
    depth: 600, 
    width: 600, 
    maxWeight: 800, 
    price: 80000, 
    description: '壁面設置用の小型ラック。軽量機器や小規模環境向け' 
  },
};

// 機器ライブラリ（サーバー類）
export const serverEquipment: Equipment[] = [
  {
    id: 'server-1u',
    name: 'ラックマウントサーバー',
    height: 1,
    depth: 650,
    power: 300,
    heat: 1024,
    weight: 15,
    type: 'server',
    role: 'compute',
    color: '#374151',
    opacity: 0,
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 65,
    heatGeneration: 1024,
    description: '汎用的なラックマウントサーバー。Webサーバーやアプリケーションサーバーとして広く使用される。前面から背面へのエアフローで効率的な冷却を実現。',
    specifications: {
      cpu: '最大2ソケット',
      memory: '最大512GB',
      storage: '2.5インチ×4台',
      network: 'Gigabit×2, 10GbE対応',
      powerSupply: '冗長電源対応'
    },
    mountingNotes: 'スライドレール必須。ケーブルアーム推奨。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  }
];

// ネットワーク機器
export const networkEquipment: Equipment[] = [
  {
    id: 'switch-1u',
    name: 'ネットワークスイッチ',
    height: 1,
    depth: 400,
    power: 150,
    heat: 512,
    weight: 8,
    type: 'network',
    role: 'network',
    color: '#374151',
    opacity: 0,
    dualPower: true,
    airflow: 'side-to-side',
    cfm: 45,
    heatGeneration: 512,
    description: 'アクセススイッチとして使用される小型スイッチ。24-48ポートのGigabitEthernetを提供。',
    specifications: {
      ports: 'Gigabit×24-48',
      uplink: '10GbE×4',
      stackable: '最大8台',
      power: 'PoE+対応',
      management: 'Web/CLI/SNMP'
    },
    mountingNotes: '軽量のため簡易取り付け可能。前面アクセス要確保。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  },
  {
    id: 'firewall',
    name: 'ファイアウォール',
    height: 1,
    depth: 400,
    power: 180,
    heat: 614,
    weight: 10,
    type: 'security',
    role: 'security',
    color: '#374151',
    opacity: 0,
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 55,
    heatGeneration: 614,
    description: '次世代ファイアウォール。アプリケーション制御、IPS、アンチウイルス機能を統合。',
    specifications: {
      throughput: '最大5Gbps',
      rules: '最大10万ルール',
      features: 'IPS/AV/URL filtering',
      vpn: 'SSL-VPN/IPsec対応',
      management: '統合管理コンソール'
    },
    mountingNotes: 'セキュリティ機器につき物理アクセス制限要検討。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  },
  {
    id: 'load-balancer',
    name: 'ロードバランサー',
    height: 1,
    depth: 450,
    power: 200,
    heat: 683,
    weight: 12,
    type: 'network',
    role: 'network',
    color: '#003366',
    opacity: 0,
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 60,
    heatGeneration: 683,
    description: 'F5 BIG-IP アプリケーション配信コントローラ。高度な負荷分散、SSL処理、アプリケーションファイアウォール機能を統合。エンタープライズ向け高性能ADC。',
    specifications: {
      throughput: '最大40Gbps',
      connections: '最大800万同時接続',
      algorithms: 'Round Robin/Least Connections/Ratio/Priority/Fastest/Observed',
      healthcheck: 'L3/L4/L7ヘルスチェック + カスタムモニタ',
      ssl: 'SSL終端・オフロード・フルプロキシ対応',
      management: 'TMSH/WebUI/iControl REST API',
      features: 'iRules/ASM/APM/GTM対応',
      platform: 'TMOS OS搭載'
    },
    mountingNotes: '冗長構成必須。管理・データネットワーク分離推奨。スライドレール必須。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  }
];

// ストレージ機器
export const storageEquipment: Equipment[] = [
  // 単一ユニット機器のみに限定するため、ストレージ機器は一旦空配列とする
];

// 電源機器
export const powerEquipment: Equipment[] = [
  {
    id: 'ups-rackmount',
    name: 'ラックマウントUPS',
    height: 1,
    depth: 600,
    power: 50,
    heat: 171,
    weight: 45,
    type: 'ups',
    role: 'power-source',
    color: '#2D3748',
    opacity: 0,
    dualPower: false,
    airflow: 'front-to-rear',
    cfm: 80,
    heatGeneration: 171,
    description: '無停電電源装置。停電時の電力供給とサージ保護を提供。Smart-UPS 3000VA相当。',
    specifications: {
      capacity: '3000VA/2700W',
      runtime: '約10分（フル負荷時）',
      outlets: 'C13×6, C19×2',
      input: '単相100V 15A',
      battery: 'シールド型鉛蓄電池',
      management: 'ネットワーク管理カード対応',
      protection: 'サージ保護、ノイズフィルタ'
    },
    mountingNotes: 'スライドレール必須。バッテリー交換時の前面アクセス要確保。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  }
];

// 取り付け部品
export const mountingEquipment: Equipment[] = [
  {
    id: 'cage-nut-m6',
    name: 'ゲージナット M6',
    height: 0,
    depth: 0,
    power: 0,
    heat: 0,
    weight: 0.01,
    type: 'mounting',
    role: 'accessory',
    color: '#374151',
    opacity: 0,
    dualPower: false,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: 'M6ネジ用ゲージナット。ラック柱への機器取り付けに必須。ドラッグでユニットに一括設置。',
    specifications: {
      thread: 'M6×1.0',
      material: '亜鉛メッキ鋼',
      hole: '9.5mm角穴用',
      thickness: '1.2mm',
      package: '50個入り'
    },
    mountingNotes: '事前配置計画必要。取り付け位置正確性重要。',
    nutType: 'm6',
    mountingMethod: 'direct',
    requiresRails: false,
    requiresCageNuts: false
  }
];

// その他機器
export const otherEquipment: Equipment[] = [
  {
    id: 'lcd-console-1u',
    name: 'LCDコンソール',
    height: 1,
    depth: 650,
    power: 45,
    heat: 154,
    weight: 7,
    type: 'console',
    role: 'monitoring',
    color: '#374151',
    opacity: 0,
    dualPower: false,
    airflow: 'front-to-rear',
    cfm: 20,
    heatGeneration: 154,
    description: 'KVM機能付きLCDコンソール。引き出し式でキーボード・マウス一体型。サーバー管理とメンテナンス作業用。',
    specifications: {
      display: '17インチ TFT液晶',
      resolution: '1280×1024 SXGA',
      kvm: 'PS/2・USB対応',
      ports: '最大16台接続',
      keyboard: '日本語109キー',
      mouse: 'タッチパッド内蔵',
      rail: 'スライドレール付属'
    },
    mountingNotes: 'スライドレール必須。引き出し時の前面スペース要確保。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  },
  {
    id: 'blank-panel-1u',
    name: 'ブランクパネル',
    height: 1,
    depth: 50,
    power: 0,
    heat: 0,
    weight: 0.5,
    type: 'panel',
    role: 'accessory',
    color: '#374151',
    opacity: 0,
    dualPower: false,
    airflow: 'blocking',
    cfm: 0,
    heatGeneration: 0,
    description: '空きユニット封鎖用パネル。エアフロー制御と外観統一のため必須。',
    specifications: {
      material: 'アルミ製',
      mounting: 'ネジ固定',
      finish: 'アルマイト処理',
      ventilation: '通気孔なし',
      compliance: 'EIA規格準拠'
    },
    mountingNotes: 'エアフロー遮断効果あり。全空きユニット設置推奨。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  },
  {
    id: 'shelf-1u-standard',
    name: '棚板 (標準)',
    height: 1,
    depth: 450,
    power: 0,
    heat: 0,
    weight: 3,
    type: 'shelf',
    role: 'accessory',
    color: '#374151',
    opacity: 0,
    dualPower: false,
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: '汎用ラック棚板。軽量機器や小型機器の設置用。19インチラック標準対応。',
    specifications: {
      material: 'スチール製（粉体塗装）',
      loadCapacity: '20kg',
      mounting: '前面・背面固定',
      surface: '滑り止め加工',
      compliance: 'EIA規格準拠'
    },
    mountingNotes: '耐荷重20kg以下の機器用。固定ネジ確実に締付け。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  },
  {
    id: 'shelf-1u-vented',
    name: '棚板 (通気孔付き)',
    height: 1,
    depth: 450,
    power: 0,
    heat: 0,
    weight: 2.5,
    type: 'shelf',
    role: 'accessory',
    color: '#374151',
    opacity: 0,
    dualPower: false,
    airflow: 'intake',
    cfm: 15,
    heatGeneration: 0,
    description: '通気孔付きラック棚板。エアフロー確保が必要な機器用。冷却効率向上。',
    specifications: {
      material: 'アルミ製（アルマイト処理）',
      loadCapacity: '15kg',
      ventilation: '通気孔（40%開口率）',
      mounting: '前面・背面固定',
      airflow: '自然通気対応'
    },
    mountingNotes: '通気が必要な機器下部に設置。開口部清掃定期実施。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  }
];

// 全機器ライブラリの統合
export const equipmentLibrary: Equipment[] = [
  ...serverEquipment,
  ...networkEquipment,
  ...storageEquipment,
  ...powerEquipment,
  ...mountingEquipment,
  ...otherEquipment
];

// ズームレベル
export const zoomLevels = [75, 100, 125];

// エアフロー方向アイコンマッピング
export const airflowIcons = {
  'front-to-rear': 'ArrowRight',
  'rear-to-front': 'ArrowLeft',
  'side-to-side': 'ArrowUp',
  'intake': 'ArrowDown',
  'exhaust': 'ArrowUp',
  'blocking': 'Square',
  'natural': 'Wind'
};

// 機器タイプアイコンマッピング
export const equipmentTypeIcons = {
  'server': 'Server',
  'network': 'Network',
  'security': 'Shield',
  'storage': 'HardDrive',
  'pdu': 'Zap',
  'ups': 'Zap',
  'power': 'Activity',
  'console': 'Monitor',
  'monitoring': 'Eye',
  'cooling': 'Snowflake',
  'shelf': 'Package',
  'spiritual': 'Flame',
  'cable': 'Cable',
  'mounting': 'Wrench',
  'rail': 'Move',
  'panel': 'Square',
  'other': 'Settings'
};