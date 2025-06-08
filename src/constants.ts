import { RackType, Equipment } from './types';

// 基本サイズ定義
export const BASE_UNIT_HEIGHT = 32; // 1Uの基本高さ (px)
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
    name: '1Uサーバー',
    height: 1,
    depth: 650,
    power: 300,
    heat: 1024,
    weight: 15,
    type: 'server',
    role: 'compute',
    color: '#4F46E5',
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
  },
  {
    id: 'server-2u',
    name: '2Uサーバー',
    height: 2,
    depth: 700,
    power: 500,
    heat: 1707,
    weight: 25,
    type: 'server',
    role: 'compute',
    color: '#7C3AED',
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 120,
    heatGeneration: 1707,
    description: '高性能サーバー用。データベースサーバーや仮想化基盤として使用。拡張性に優れ、多くのドライブベイを搭載可能。',
    specifications: {
      cpu: '最大2ソケット',
      memory: '最大1TB',
      storage: '2.5インチ×8台または3.5インチ×4台',
      network: 'Gigabit×4, 10GbE×2',
      expansion: 'PCIeスロット×3'
    },
    mountingNotes: '重量があるため、しっかりとしたレール必須。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  },
  {
    id: 'server-4u',
    name: '4Uサーバー',
    height: 4,
    depth: 750,
    power: 800,
    heat: 2730,
    weight: 40,
    type: 'server',
    role: 'compute',
    color: '#5B21B6',
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 200,
    heatGeneration: 2730,
    description: '高密度ストレージサーバー。大容量データベースやファイルサーバー用。多数のドライブベイと高い拡張性を提供。',
    specifications: {
      cpu: '最大4ソケット',
      memory: '最大2TB',
      storage: '3.5インチ×12台',
      network: '10GbE×4, InfiniBand対応',
      expansion: 'PCIeスロット×6'
    },
    mountingNotes: '大型・重量機器。設置前に床耐荷重要確認。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  },
{
      id: 'blade-chassis',
      name: 'ブレードシャーシ',
      height: 10,
      depth: 800,
      power: 2000,
      heat: 6826,
      weight: 80,
      type: 'server',
      role: 'compute',
      color: '#1E1B4B',
      dualPower: true,
      airflow: 'front-to-rear',
      cfm: 450,
      heatGeneration: 6826,
      description: '高密度仮想化環境用。最大16枚のブレードサーバーを収容可能。共有電源・冷却システムで効率的な運用を実現。',
      specifications: {
        blades: '最大16枚',
        power: '冗長電源×6',
        cooling: '可変速ファン×8',
        network: '内蔵スイッチ対応',
        management: '統合管理コンソール'
      },
      mountingNotes: '専用レール必須。設置前配線計画要検討。',
      mountingMethod: 'rails',
      requiresRails: true,
      requiresCageNuts: false
    },
];

// ネットワーク機器
export const networkEquipment: Equipment[] = [
  {
    id: 'switch-1u',
    name: '1Uスイッチ',
    height: 1,
    depth: 400,
    power: 150,
    heat: 512,
    weight: 8,
    type: 'network',
    role: 'network',
    color: '#059669',
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
    id: 'switch-1u-rail',
    name: '1Uスイッチ (レール対応)',
    height: 1,
    depth: 400,
    power: 150,
    heat: 512,
    weight: 8,
    type: 'network',
    role: 'network',
    color: '#059669',
    dualPower: true,
    airflow: 'side-to-side',
    cfm: 45,
    heatGeneration: 512,
    description: 'レール取り付け対応の1Uスイッチ。メンテナンス性を重視する場合に選択。',
    specifications: {
      ports: 'Gigabit×24-48',
      uplink: '10GbE×4',
      stackable: '最大8台',
      power: 'PoE+対応',
      management: 'Web/CLI/SNMP'
    },
    mountingNotes: 'レール使用でメンテナンス性向上。前面アクセス要確保。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  },
{
      id: 'core-switch',
      name: 'コアスイッチ',
      height: 3,
      depth: 500,
      power: 400,
      heat: 1365,
      weight: 20,
      type: 'network',
      role: 'network',
      color: '#047857',
      dualPower: true,
      airflow: 'front-to-rear',
      cfm: 150,
      heatGeneration: 1365,
      description: 'データセンターコア用高性能スイッチ。高スループットと低遅延を実現。モジュラー設計で柔軟な拡張が可能。',
      specifications: {
        capacity: '最大3.2Tbps',
        ports: '10GbE×48, 40GbE×8',
        latency: '1μs未満',
        redundancy: '冗長電源・制御部',
        modules: '拡張モジュール対応'
      },
      mountingNotes: '重要機器につき耐震対策必須。',
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
    color: '#DC2626',
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
    color: '#0891B2',
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 60,
    heatGeneration: 683,
    description: 'アプリケーション負荷分散装置。複数サーバーへのトラフィック分散とヘルスチェック機能を提供。高可用性とパフォーマンス向上を実現。',
    specifications: {
      throughput: '最大10Gbps',
      connections: '最大100万同時接続',
      algorithms: 'Round Robin/Least Connections/IP Hash',
      healthcheck: 'L3/L4/L7ヘルスチェック',
      ssl: 'SSL終端・オフロード対応',
      management: 'Web UI/CLI/API管理'
    },
    mountingNotes: 'ネットワーク配線計画要検討。冗長構成推奨。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  }
];

// ストレージ機器
export const storageEquipment: Equipment[] = [
  {
    id: 'storage-2u',
    name: '2Uストレージ',
    height: 2,
    depth: 700,
    power: 400,
    heat: 1365,
    weight: 30,
    type: 'storage',
    role: 'storage',
    color: '#2563EB',
    dualPower: true,
    airflow: 'front-to-rear',
    cfm: 110,
    heatGeneration: 1365,
    description: '汎用ストレージアレイ。SASドライブを最大12本搭載可能。RAID構成でデータ冗長化を実現。',
    specifications: {
      drives: '2.5インチSAS×12',
      capacity: '最大24TB',
      raid: 'RAID0/1/5/6/10',
      interface: 'FC/iSCSI/SAS',
      controller: '冗長コントローラー'
    },
    mountingNotes: 'ドライブ交換頻度を考慮し前面アクセス確保。',
    mountingMethod: 'rails',
    requiresRails: true,
    requiresCageNuts: false
  },
{
      id: 'storage-4u',
      name: '4Uストレージ',
      height: 4,
      depth: 750,
      power: 600,
      heat: 2048,
      weight: 50,
      type: 'storage',
      role: 'storage',
      color: '#1D4ED8',
      dualPower: true,
      airflow: 'front-to-rear',
      cfm: 180,
      heatGeneration: 2048,
      description: '大容量ストレージシステム。3.5インチドライブ24本搭載で最大容量を実現。',
      specifications: {
        drives: '3.5インチSAS×24',
        capacity: '最大480TB',
        raid: '全RAIDレベル対応',
        snapshot: 'スナップショット機能',
        replication: 'リモートレプリケーション'
      },
      mountingNotes: '大容量・重量機器。床荷重要確認。',
      mountingMethod: 'rails',
      requiresRails: true,
      requiresCageNuts: false
    },
];

// 電源機器
export const powerEquipment: Equipment[] = [
  {
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
    system: 'A',
    airflow: 'natural',
    cfm: 0,
    heatGeneration: 0,
    description: 'ラック左右・背面に設置する縦型PDU。基本的な配電機能を提供。16A/100V対応。',
    specifications: {
      outlets: 'C13×12, C19×4',
      input: '単相100V 16A',
      mounting: 'ラック左右・背面縦型',
      protection: 'ブレーカー内蔵',
      monitoring: '基本電流監視'
    },
    mountingNotes: 'ラック左右または背面に縦型設置。ケーブル長要確認。',
    pduType: 'vertical-basic',
    mountingMethod: 'direct',
    requiresRails: false,
    requiresCageNuts: false
  },
  {
    id: 'ups-3u',
    name: '3U UPS',
    height: 3,
    depth: 600,
    power: 0,
    heat: 341,
    weight: 45,
    type: 'ups',
    role: 'power-source',
    color: '#991B1B',
    dualPower: false,
    airflow: 'front-to-rear',
    cfm: 85,
    heatGeneration: 341,
    description: 'ラックマウント型無停電電源装置。瞬停・停電対策用。1.5kVA容量。',
    specifications: {
      capacity: '1.5kVA/1.35kW',
      backup: '5-10分（負荷率50%時）',
      outlets: 'C13×8, C19×2',
      battery: 'シール鉛蓄電池',
      monitoring: 'SNMP/USB監視'
    },
    mountingNotes: 'バッテリー交換要スペース確保。',
    mountingMethod: 'cage-nuts',
    requiresRails: false,
    requiresCageNuts: true
  },
{
      id: 'pdu-vertical-smart',
      name: '縦型スマートPDU',
      height: 0,
      depth: 100,
      power: 0,
      heat: 0,
      weight: 7,
      type: 'pdu',
      role: 'power-distribution',
      color: '#B91C1C',
      dualPower: false,
      system: 'A',
      airflow: 'natural',
      cfm: 0,
      heatGeneration: 0,
      description: 'ネットワーク監視機能付き縦型PDU。リモートでの電力監視・制御が可能。',
      specifications: {
        outlets: 'C13×16, C19×6',
        input: '単相100V 20A',
        monitoring: 'アウトレット別監視',
        network: 'SNMP/Web管理',
        control: 'リモート電源制御'
      },
      mountingNotes: 'ネットワーク配線必要。管理用IPアドレス要設定。',
      pduType: 'vertical-smart',
      mountingMethod: 'direct',
      requiresRails: false,
      requiresCageNuts: false
    },
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
    color: '#64748B',
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
    id: 'blank-panel-1u',
    name: '1Uブランクパネル',
    height: 1,
    depth: 50,
    power: 0,
    heat: 0,
    weight: 0.5,
    type: 'panel',
    role: 'accessory',
    color: '#9CA3AF',
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
    name: '1U棚板 (標準)',
    height: 1,
    depth: 450,
    power: 0,
    heat: 0,
    weight: 3,
    type: 'shelf',
    role: 'accessory',
    color: '#6B7280',
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
    name: '1U棚板 (通気孔付き)',
    height: 1,
    depth: 450,
    power: 0,
    heat: 0,
    weight: 2.5,
    type: 'shelf',
    role: 'accessory',
    color: '#9CA3AF',
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