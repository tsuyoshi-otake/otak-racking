import React, { useState } from 'react';
import { Server, Network, Zap, Thermometer, Weight, Trash2, Settings, Fan, Cable, AlertTriangle, Package, Wrench, Move, Plus, Copy, Minus, Building, Tag, X, ZoomIn, ZoomOut, Maximize, Moon, Sun, Power, Ruler, CircleCheck, AlertCircle, XCircle, HelpCircle, Settings2, Bolt, Shield, HardDrive, Archive, Monitor, Eye, Flame, Snowflake, Database, Router, Globe, Activity, BarChart3, Gauge, Calculator, Wind, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, Square, Info, MapPin, Layers, Construction, Home, ArrowUpFromLine, ArrowDownToLine, Grid3X3, Waves, FileText } from 'lucide-react';

const RackDesigner = () => {
  const [racks, setRacks] = useState({
    'rack-1': {
      id: 'rack-1',
      name: 'ラック #1',
      type: '42u-standard',
      units: 42,
      depth: 1000,
      width: 600,
      equipment: {},
      powerConnections: {},
      mountingOptions: {},
      labels: {},
      cageNuts: {}, // ゲージナット設置状況 unit: { frontLeft: { top: 'm6', bottom: 'm6' }, frontRight: { top, bottom }, rearLeft: { top, bottom }, rearRight: { top, bottom } }
      railInventory: {}, // レール在庫管理
      partInventory: {}, // 部品在庫管理
      fans: { count: 4, rpm: 3000 },
      position: { row: 'A', column: 1 },
      cabling: {
        external: {}, // 外部ケーブリング
        overhead: {}, // 天井配線
        underfloor: {} // 床下配線
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
    }
  });
  
  const [selectedRack, setSelectedRack] = useState('rack-1');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showPowerView, setShowPowerView] = useState(false);
  const [showMountingView, setShowMountingView] = useState(false);
  const [showLabelView, setShowLabelView] = useState(false);
  const [showAirflowView, setShowAirflowView] = useState(false);
  const [showTemperatureView, setShowTemperatureView] = useState(false);
  const [showCablingView, setShowCablingView] = useState(false);
  const [showFloorView, setShowFloorView] = useState(false);
  const [showCageNutView, setShowCageNutView] = useState(false);
  const [showRackManager, setShowRackManager] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showEquipmentInfo, setShowEquipmentInfo] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [darkMode, setDarkMode] = useState(false);

  // フリーアクセスフロア設定
  const [floorSettings, setFloorSettings] = useState({
    hasAccessFloor: true,
    floorHeight: 600, // mm
    tileSize: 600, // mm
    supportType: 'adjustable', // adjustable, fixed, string
    loadCapacity: 'heavy', // light, medium, heavy
    cableRouting: {
      power: 'underfloor', // underfloor, overhead, wall
      data: 'underfloor',
      fiber: 'overhead'
    }
  });

  // ラック種類ライブラリ
  const rackTypes = {
    '42u-standard': { name: '42U 標準ラック', units: 42, depth: 1000, width: 600, maxWeight: 1500, price: 150000, description: '最も一般的なサーバーラック。幅600mm、奥行1000mmで多くの機器に対応' },
    '42u-deep': { name: '42U 深型ラック', units: 42, depth: 1200, width: 600, maxWeight: 1800, price: 180000, description: '深い機器や大型ストレージ用。奥行1200mmで余裕のあるケーブル配線が可能' },
    '45u-standard': { name: '45U 標準ラック', units: 45, depth: 1000, width: 600, maxWeight: 1600, price: 170000, description: '高密度配置用の高いラック。天井高に余裕がある場合に選択' },
    '36u-compact': { name: '36U コンパクト', units: 36, depth: 800, width: 600, maxWeight: 1200, price: 120000, description: '小規模環境や低天井環境用。コンパクトながら必要十分な容量' },
    '42u-wide': { name: '42U ワイド', units: 42, depth: 1000, width: 800, maxWeight: 1500, price: 200000, description: '幅広機器や特殊用途向け。通常より200mm幅が広い特殊ラック' },
    '24u-wall': { name: '24U 壁掛け', units: 24, depth: 600, width: 600, maxWeight: 800, price: 80000, description: '壁面設置用の小型ラック。軽量機器や小規模環境向け' },
  };

  // 機器ライブラリ（詳細説明付き）
  const equipmentLibrary = [
    // サーバー類
    { 
      id: 'server-1u', 
      name: '1Uサーバー', 
      height: 1, 
      depth: 650, 
      power: 300, 
      heat: 1024, 
      weight: 15, 
      type: 'server', 
      color: '#4F46E5', 
      dualPower: true, 
      needsRails: true, 
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
      mountingNotes: 'スライドレール必須。ケーブルアーム推奨。'
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
      color: '#7C3AED', 
      dualPower: true, 
      needsRails: true, 
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
      mountingNotes: '重量があるため、しっかりとしたレール必須。'
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
      color: '#5B21B6', 
      dualPower: true, 
      needsRails: true, 
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
      mountingNotes: '大型・重量機器。設置前に床耐荷重要確認。'
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
      color: '#1E1B4B', 
      dualPower: true, 
      needsRails: true, 
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
      mountingNotes: '専用レール必須。設置前配線計画要検討。'
    },
    
    // ネットワーク機器
    { 
      id: 'switch-1u', 
      name: '1Uスイッチ', 
      height: 1, 
      depth: 400, 
      power: 150, 
      heat: 512, 
      weight: 8, 
      type: 'network', 
      color: '#059669', 
      dualPower: true, 
      needsRails: false, 
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
      mountingNotes: '軽量のため簡易取り付け可能。前面アクセス要確保。'
    },
    { 
      id: 'switch-2u', 
      name: '2Uスイッチ', 
      height: 2, 
      depth: 450, 
      power: 250, 
      heat: 853, 
      weight: 12, 
      type: 'network', 
      color: '#0D9488', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'front-to-rear', 
      cfm: 80, 
      heatGeneration: 853,
      description: 'フロアスイッチ用途。高密度ポート搭載でPoE++対応。IP電話やAP電源供給可能。',
      specifications: {
        ports: 'Gigabit×48',
        uplink: '10GbE×8',
        poe: 'PoE++対応',
        power: '最大740W PoE予算',
        features: 'L3ルーティング対応'
      },
      mountingNotes: 'PoE使用時は電力計算要注意。'
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
      color: '#047857', 
      dualPower: true, 
      needsRails: false, 
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
      mountingNotes: '重要機器につき耐震対策必須。'
    },
    { 
      id: 'load-balancer', 
      name: '負荷分散装置', 
      height: 1, 
      depth: 450, 
      power: 200, 
      heat: 683, 
      weight: 12, 
      type: 'network', 
      color: '#065F46', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'front-to-rear', 
      cfm: 60, 
      heatGeneration: 683,
      description: 'Webサービスの負荷分散とSSL終端を行う。高可用性システムの要となる機器。',
      specifications: {
        throughput: '最大10Gbps',
        connections: '同時接続数100万',
        ssl: 'SSL/TLS終端対応',
        health: 'ヘルスチェック機能',
        ha: 'HA構成対応'
      },
      mountingNotes: 'HA構成時は2台での冗長配置推奨。'
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
      color: '#DC2626', 
      dualPower: true, 
      needsRails: false, 
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
      mountingNotes: 'セキュリティ機器につき物理アクセス制限要検討。'
    },
    { 
      id: 'router', 
      name: 'ルーター', 
      height: 2, 
      depth: 450, 
      power: 300, 
      heat: 1024, 
      weight: 15, 
      type: 'network', 
      color: '#16A34A', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'front-to-rear', 
      cfm: 90, 
      heatGeneration: 1024,
      description: 'エンタープライズルーター。WAN接続とルーティング処理を担当。BGP、OSPF等の動的ルーティング対応。',
      specifications: {
        wan: 'T1/E1/DS3/OC-3対応',
        routing: 'BGP/OSPF/EIGRP',
        throughput: '最大2Gbps',
        qos: 'トラフィック制御',
        redundancy: '冗長WAN対応'
      },
      mountingNotes: 'WAN回線工事との調整要。'
    },
    
    // ストレージ
    { 
      id: 'storage-2u', 
      name: '2Uストレージ', 
      height: 2, 
      depth: 700, 
      power: 400, 
      heat: 1365, 
      weight: 30, 
      type: 'storage', 
      color: '#2563EB', 
      dualPower: true, 
      needsRails: true, 
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
      mountingNotes: 'ドライブ交換頻度を考慮し前面アクセス確保。'
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
      color: '#1D4ED8', 
      dualPower: true, 
      needsRails: true, 
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
      mountingNotes: '大容量・重量機器。床荷重要確認。'
    },
    { 
      id: 'san-switch', 
      name: 'SANスイッチ', 
      height: 1, 
      depth: 450, 
      power: 200, 
      heat: 683, 
      weight: 8, 
      type: 'storage', 
      color: '#1E40AF', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'side-to-side', 
      cfm: 50, 
      heatGeneration: 683,
      description: 'ファイバーチャネルSANスイッチ。ストレージとサーバー間の高速接続を提供。',
      specifications: {
        ports: '16Gb FC×24',
        fabric: 'ファブリック構成対応',
        zoning: 'ゾーニング機能',
        management: 'SAN管理ソフト連携',
        performance: '低遅延設計'
      },
      mountingNotes: 'FC配線は曲げ半径に注意。'
    },
    { 
      id: 'nas-storage', 
      name: 'NASストレージ', 
      height: 2, 
      depth: 650, 
      power: 350, 
      heat: 1194, 
      weight: 25, 
      type: 'storage', 
      color: '#3730A3', 
      dualPower: true, 
      needsRails: true, 
      airflow: 'front-to-rear', 
      cfm: 95, 
      heatGeneration: 1194,
      description: 'ネットワーク接続ストレージ。ファイル共有とバックアップ用途。CIFS/NFS対応。',
      specifications: {
        drives: '3.5インチSATA×8',
        protocols: 'CIFS/NFS/FTP/rsync',
        backup: '自動バックアップ機能',
        snapshot: 'ファイルスナップショット',
        users: '最大500ユーザー'
      },
      mountingNotes: 'ファイル共有用途では常時稼働前提。'
    },
    { 
      id: 'lto-library', 
      name: 'LTOライブラリ', 
      height: 6, 
      depth: 800, 
      power: 500, 
      heat: 1707, 
      weight: 60, 
      type: 'storage', 
      color: '#312E81', 
      dualPower: true, 
      needsRails: true, 
      airflow: 'front-to-rear', 
      cfm: 200, 
      heatGeneration: 1707,
      description: 'テープライブラリシステム。長期アーカイブとバックアップ用。LTO-8カートリッジ対応。',
      specifications: {
        slots: 'カートリッジ×24',
        drives: 'LTO-8ドライブ×2',
        capacity: '最大300TB',
        robotics: 'ロボティクスアーム',
        software: 'バックアップソフト連携'
      },
      mountingNotes: 'メンテナンス頻度高いため前面アクセス重要。'
    },
    
    // 電源・UPS・電力制御（詳細化）
    { 
      id: 'pdu-vertical-basic', 
      name: '縦型PDU (基本)', 
      height: 0, 
      depth: 100, 
      power: 0, 
      heat: 0, 
      weight: 5, 
      type: 'pdu', 
      color: '#DC2626', 
      dualPower: false, 
      system: 'A', 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック背面縦型PDU。基本的な配電機能を提供。16A/100V対応。',
      specifications: {
        outlets: 'C13×12, C19×4',
        input: '単相100V 16A',
        mounting: 'ラック背面縦型',
        protection: 'ブレーカー内蔵',
        monitoring: '基本電流監視'
      },
      mountingNotes: 'ラック背面に縦型設置。ケーブル長要確認。',
      pduType: 'vertical-basic'
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
      color: '#B91C1C', 
      dualPower: false, 
      system: 'A', 
      needsRails: false, 
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
      pduType: 'vertical-smart'
    },
    { 
      id: 'pdu-horizontal', 
      name: '横型PDU (コンセントバー)', 
      height: 1, 
      depth: 100, 
      power: 0, 
      heat: 0, 
      weight: 3, 
      type: 'pdu', 
      color: '#7F1D1D', 
      dualPower: false, 
      system: 'A', 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック内横型設置PDU。機器近くでの電源供給に適している。',
      specifications: {
        outlets: 'C13×8',
        input: '単相100V 15A',
        mounting: 'ラック内横型',
        length: '600mm',
        protection: 'ヒューズ内蔵'
      },
      mountingNotes: '各ユニット近くに設置。配線最短化可能。',
      pduType: 'horizontal'
    },
    { 
      id: 'oa-tap-6', 
      name: 'OAタップ (6口)', 
      height: 1, 
      depth: 200, 
      power: 0, 
      heat: 0, 
      weight: 1, 
      type: 'power', 
      color: '#991B1B', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: '小型機器用OAタップ。ネットワーク機器や小型サーバー用。',
      specifications: {
        outlets: '3P×6',
        rating: '15A 100V',
        cord: '2m電源コード',
        features: '個別スイッチ付',
        safety: '雷サージ保護'
      },
      mountingNotes: '軽量機器用。過負荷注意。',
      pduType: 'oa-tap'
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
      color: '#991B1B', 
      dualPower: false, 
      needsRails: false, 
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
      mountingNotes: 'バッテリー交換要スペース確保。'
    },
    { 
      id: 'ups-6u', 
      name: '6U UPS', 
      height: 6, 
      depth: 700, 
      power: 0, 
      heat: 683, 
      weight: 80, 
      type: 'ups', 
      color: '#7F1D1D', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'front-to-rear', 
      cfm: 160, 
      heatGeneration: 683,
      description: '大容量UPS。重要システム用長時間バックアップ対応。3kVA容量。',
      specifications: {
        capacity: '3kVA/2.7kW',
        backup: '15-30分（負荷率50%時）',
        outlets: 'C13×12, C19×4',
        battery: '拡張バッテリー対応',
        redundancy: 'N+1構成可能'
      },
      mountingNotes: '重量物。設置前床耐荷重確認必須。'
    },
    { 
      id: 'cvcf-3u', 
      name: '3U CVCF装置', 
      height: 3, 
      depth: 650, 
      power: 100, 
      heat: 341, 
      weight: 35, 
      type: 'power', 
      color: '#EF4444', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'front-to-rear', 
      cfm: 70, 
      heatGeneration: 341,
      description: '定電圧定周波数電源装置。電源品質が重要な機器用。ノイズ除去・安定化機能。',
      specifications: {
        capacity: '1kVA',
        regulation: '電圧±1%, 周波数±0.01%',
        thd: '全高調波歪率3%以下',
        isolation: '絶縁トランス内蔵',
        protection: '過負荷・短絡保護'
      },
      mountingNotes: '高精度機器用。専用配線推奨。'
    },
    { 
      id: 'distribution-panel', 
      name: '分電盤', 
      height: 4, 
      depth: 500, 
      power: 0, 
      heat: 0, 
      weight: 40, 
      type: 'power', 
      color: '#B91C1C', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック用分電盤。複数回路への配電とブレーカー制御。200V/100V両対応。',
      specifications: {
        input: '三相200V 60A',
        output: '単相100V×12回路',
        breakers: '20A×12, 30A×4',
        metering: '電力量計内蔵',
        safety: '漏電ブレーカー'
      },
      mountingNotes: '電気工事要資格者による設置必須。'
    },
    { 
      id: 'power-monitor', 
      name: '電力監視装置', 
      height: 1, 
      depth: 300, 
      power: 50, 
      heat: 171, 
      weight: 6, 
      type: 'power', 
      color: '#7F1D1D', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'side-to-side', 
      cfm: 25, 
      heatGeneration: 171,
      description: 'ラック単位での電力監視装置。使用量・効率をリアルタイム監視。',
      specifications: {
        monitoring: '電圧・電流・電力・力率',
        accuracy: '±1%',
        logging: 'データロギング機能',
        alarm: '閾値アラーム',
        interface: 'Web/SNMP/Modbus'
      },
      mountingNotes: 'ネットワーク接続必要。'
    },
    
    // レール・取り付け部品
    { 
      id: 'slide-rail-standard', 
      name: 'スライドレール (標準)', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 4, 
      type: 'mounting', 
      color: '#6366F1', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: '標準的なスライドレール。サーバーやストレージの引き出し機構を提供。',
      specifications: {
        extension: '最大700mm',
        loadCapacity: '45kg',
        type: 'ボールベアリング',
        mounting: '前面・背面4点固定',
        compatibility: '1U-4U機器対応'
      },
      mountingNotes: 'ゲージナット事前設置必要。重量制限確認。',
      railType: 'slide-standard'
    },
    { 
      id: 'slide-rail-heavy', 
      name: 'ヘビーデューティレール', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 8, 
      type: 'mounting', 
      color: '#4F46E5', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: '重量機器用スライドレール。大型サーバーやストレージアレイ用。',
      specifications: {
        extension: '最大800mm',
        loadCapacity: '100kg',
        type: 'テレスコピック',
        features: 'ロック機構・緩衝器',
        compatibility: '4U以上推奨'
      },
      mountingNotes: '大型機器専用。床耐荷重要確認。',
      railType: 'slide-heavy'
    },
    { 
      id: 'fixed-rail', 
      name: '固定レール', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 2, 
      type: 'mounting', 
      color: '#7C3AED', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: '固定設置用レール。ネットワーク機器や軽量機器用。引き出し不可。',
      specifications: {
        loadCapacity: '30kg',
        type: '固定設置専用',
        mounting: '前面2点固定',
        material: 'スチール製',
        depth: '400-800mm対応'
      },
      mountingNotes: 'メンテナンス時の配線考慮。',
      railType: 'fixed'
    },
    { 
      id: 'toolless-rail', 
      name: 'ツールレスレール', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 3, 
      type: 'mounting', 
      color: '#8B5CF6', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ツール不要の簡易レール。素早い設置・取り外しが可能。',
      specifications: {
        extension: '最大600mm',
        loadCapacity: '25kg',
        type: 'クリップ式',
        features: 'ワンタッチ着脱',
        installation: '工具不要'
      },
      mountingNotes: '軽量機器専用。頻繁な付け替え用途。',
      railType: 'toolless'
    },
    { 
      id: 'cage-nut-m6', 
      name: 'ゲージナット M6', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 0.01, 
      type: 'mounting', 
      color: '#64748B', 
      dualPower: false, 
      needsRails: false, 
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
      nutType: 'm6'
    },
    { 
      id: 'cage-nut-m5', 
      name: 'ゲージナット M5', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 0.008, 
      type: 'mounting', 
      color: '#475569', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'M5ネジ用ゲージナット。軽量機器や小型パネル用。ドラッグでユニットに一括設置。',
      specifications: {
        thread: 'M5×0.8',
        material: '亜鉛メッキ鋼',
        hole: '7.1mm角穴用',
        thickness: '1.0mm',
        package: '100個入り'
      },
      mountingNotes: '軽量機器専用。過締付注意。',
      nutType: 'm5'
    },
    { 
      id: 'rack-screw-m6', 
      name: 'ラックネジ M6×16', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 0.005, 
      type: 'mounting', 
      color: '#334155', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'M6×16mmラックネジ。ゲージナットと組み合わせて機器固定に使用。',
      specifications: {
        thread: 'M6×1.0×16mm',
        head: '皿頭',
        material: 'ステンレス',
        drive: 'プラスドライブ',
        package: '50本入り'
      },
      mountingNotes: 'ゲージナットとセット使用。適正トルク管理。',
      screwType: 'm6-16'
    },
    { 
      id: 'rack-washer', 
      name: 'ラック用ワッシャー', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 0.002, 
      type: 'mounting', 
      color: '#1E293B', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック用平ワッシャー。機器固定時の面圧分散用。',
      specifications: {
        size: 'M6用（内径6.5mm）',
        material: 'ステンレス',
        thickness: '1.0mm',
        outer: '12mm',
        package: '100枚入り'
      },
      mountingNotes: '締付時の傷防止。均等な面圧確保。',
      washerType: 'm6'
    },

    // ケーブル管理・配線部品
    { 
      id: 'cable-guide-vertical', 
      name: '縦型ケーブルガイド', 
      height: 2, 
      depth: 150, 
      power: 0, 
      heat: 0, 
      weight: 3, 
      type: 'cable', 
      color: '#10B981', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック内縦型配線用ガイド。ケーブルを整理し、エアフロー確保に貢献。',
      specifications: {
        capacity: 'ケーブル50本程度',
        material: '難燃性プラスチック',
        mounting: 'ラック柱取付',
        features: '着脱式フィンガー',
        size: '幅100mm×深度150mm'
      },
      mountingNotes: 'ケーブル重量考慮し固定。'
    },
    { 
      id: 'cable-guide-horizontal', 
      name: '横型ケーブルガイド', 
      height: 1, 
      depth: 300, 
      power: 0, 
      heat: 0, 
      weight: 2, 
      type: 'cable', 
      color: '#059669', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ユニット間の横型配線ガイド。各機器からのケーブルを効率的に誘導。',
      specifications: {
        capacity: 'ケーブル30本程度',
        mounting: 'ラック前面・背面',
        features: 'ヒンジ構造',
        material: '金属製',
        coating: '静電塗装'
      },
      mountingNotes: '機器メンテナンス時の開閉考慮。'
    },
    { 
      id: 'cable-arm', 
      name: 'ケーブルアーム', 
      height: 0, 
      depth: 0, 
      power: 0, 
      heat: 0, 
      weight: 2, 
      type: 'cable', 
      color: '#047857', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'サーバー引き出し時のケーブル保護用アーム。メンテナンス時の断線防止。',
      specifications: {
        extension: '最大700mm伸縮',
        capacity: 'ケーブル20本程度',
        material: 'スチール製',
        mounting: 'スライドレール連動',
        features: '多関節構造'
      },
      mountingNotes: 'スライドレールと同時設置。'
    },
    { 
      id: 'cable-tray', 
      name: 'ケーブルトレイ', 
      height: 1, 
      depth: 600, 
      power: 0, 
      heat: 0, 
      weight: 8, 
      type: 'cable', 
      color: '#065F46', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック上部配線用トレイ。天井配線からラック内への引き込み用。',
      specifications: {
        size: '幅600mm×高100mm',
        material: '亜鉛メッキ鋼板',
        load: '最大50kg',
        mounting: 'ラック天面取付',
        features: '分離可能構造'
      },
      mountingNotes: 'ラック天面耐荷重確認要。'
    },
    
    // パッチパネル・配線
    { 
      id: 'patch-panel-cat6', 
      name: 'Cat6パッチパネル', 
      height: 1, 
      depth: 300, 
      power: 0, 
      heat: 0, 
      weight: 3, 
      type: 'network', 
      color: '#6B7280', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'Cat6対応24ポートパッチパネル。構内LANの中継接続点。',
      specifications: {
        ports: 'RJ45×24',
        category: 'Cat6 250MHz',
        termination: '110打込式',
        labeling: 'ポート番号印刷済',
        compliance: 'TIA/EIA-568-B準拠'
      },
      mountingNotes: '前面アクセス必要。ラベリング重要。'
    },
    { 
      id: 'patch-panel-cat6a', 
      name: 'Cat6Aパッチパネル', 
      height: 1, 
      depth: 300, 
      power: 0, 
      heat: 0, 
      weight: 3.5, 
      type: 'network', 
      color: '#374151', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'Cat6A対応24ポートパッチパネル。10GBASE-T対応。',
      specifications: {
        ports: 'RJ45×24',
        category: 'Cat6A 500MHz',
        termination: '110打込式',
        shielding: 'STP対応',
        bandwidth: '10Gbps対応'
      },
      mountingNotes: '10Gbps用途では配線品質重要。'
    },
    { 
      id: 'fiber-panel-sc', 
      name: '光パッチパネル (SC)', 
      height: 1, 
      depth: 300, 
      power: 0, 
      heat: 0, 
      weight: 3, 
      type: 'network', 
      color: '#8B5CF6', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'SC型光ファイバーパッチパネル。24芯対応。シングル・マルチモード両対応。',
      specifications: {
        connectors: 'SC×24',
        fiber: 'SM/MM対応',
        loss: '挿入損失0.2dB以下',
        splice: 'スプライス収納',
        radius: '最小曲げ半径管理'
      },
      mountingNotes: '光ファイバー曲げ半径厳守。'
    },
    { 
      id: 'fiber-panel-lc', 
      name: '光パッチパネル (LC)', 
      height: 1, 
      depth: 300, 
      power: 0, 
      heat: 0, 
      weight: 2.5, 
      type: 'network', 
      color: '#7C3AED', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'LC型光ファイバーパッチパネル。高密度48芯対応。',
      specifications: {
        connectors: 'LC×48 (24デュプレックス)',
        fiber: 'SM/MM対応',
        density: '高密度実装',
        adapter: 'LC-LC アダプター',
        management: 'ファイバー管理機構'
      },
      mountingNotes: 'LC端子は小型のため取扱注意。'
    },
    
    // 環境・冷却
    { 
      id: 'cooling-fan-1u', 
      name: '1U冷却ファンユニット', 
      height: 1, 
      depth: 400, 
      power: 150, 
      heat: 0, 
      weight: 6, 
      type: 'cooling', 
      color: '#0EA5E9', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'rear-to-front', 
      cfm: 300, 
      heatGeneration: -500,
      description: 'ラック内追加冷却用ファンユニット。高発熱機器近くでの局所冷却。',
      specifications: {
        fans: '120mm×2',
        speed: '可変速制御',
        cfm: '最大300CFM',
        noise: '45dB以下',
        control: '温度センサー連動'
      },
      mountingNotes: 'エアフロー方向要確認。'
    },
    { 
      id: 'ac-unit-3u', 
      name: '3U小型空調ユニット', 
      height: 3, 
      depth: 600, 
      power: 800, 
      heat: 0, 
      weight: 40, 
      type: 'cooling', 
      color: '#0284C7', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'front-to-rear', 
      cfm: 500, 
      heatGeneration: -2000,
      description: 'ラック組み込み型空調機。局所的な高密度冷却に対応。',
      specifications: {
        cooling: '2kW冷却能力',
        refrigerant: 'R410A',
        control: 'PID制御',
        monitoring: 'SNMP監視',
        drainage: 'ドレン処理機構'
      },
      mountingNotes: '冷媒配管工事必要。ドレン配管要。'
    },
    
    // コンソール・監視
    { 
      id: 'lcd-console-17', 
      name: '1U LCDコンソール (17")', 
      height: 1, 
      depth: 650, 
      power: 50, 
      heat: 171, 
      weight: 8, 
      type: 'console', 
      color: '#374151', 
      dualPower: false, 
      needsRails: true, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 171,
      description: '17インチLCD、キーボード、マウス一体型コンソール。省スペースでの操作環境を提供。',
      specifications: {
        display: '17インチ LCD 1280×1024',
        keyboard: '日本語キーボード',
        mouse: 'タッチパッド',
        interface: 'VGA/USB',
        features: '折りたたみ構造'
      },
      mountingNotes: 'スライドレール必須。操作スペース要確保。'
    },
    { 
      id: 'kvm-switch-8', 
      name: '8ポートKVMスイッチ', 
      height: 1, 
      depth: 300, 
      power: 30, 
      heat: 102, 
      weight: 3, 
      type: 'console', 
      color: '#4B5563', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'side-to-side', 
      cfm: 10, 
      heatGeneration: 102,
      description: '8台のサーバーを1組のコンソールで操作可能。ホットキー切り替え対応。',
      specifications: {
        ports: '8ポート',
        resolution: '最大1920×1200',
        interface: 'VGA/USB',
        switching: 'ホットキー/OSD',
        cascade: 'カスケード接続対応'
      },
      mountingNotes: 'ケーブル配線多数。管理用ラベル必須。'
    },
    { 
      id: 'monitoring-unit', 
      name: 'ラック監視装置', 
      height: 1, 
      depth: 400, 
      power: 100, 
      heat: 341, 
      weight: 5, 
      type: 'monitoring', 
      color: '#6B7280', 
      dualPower: true, 
      needsRails: false, 
      airflow: 'side-to-side', 
      cfm: 30, 
      heatGeneration: 341,
      description: '温度・湿度・電流・振動を総合監視。アラート通知機能付き。',
      specifications: {
        sensors: '温度・湿度・振動・ドア開閉',
        accuracy: '温度±0.5℃, 湿度±3%',
        interface: 'Web/SNMP/email',
        power: 'PoE給電対応',
        logging: 'データ保存・グラフ表示'
      },
      mountingNotes: 'センサー配置位置重要。ネットワーク接続必要。'
    },
    
    // その他・棚板
    { 
      id: 'shelf-standard', 
      name: '標準棚板', 
      height: 1, 
      depth: 800, 
      power: 0, 
      heat: 0, 
      weight: 2, 
      type: 'shelf', 
      color: '#8B5CF6', 
      dualPower: false, 
      needsRails: false, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: '汎用機器設置用棚板。非ラックマウント機器の設置に使用。',
      specifications: {
        material: 'スチール製',
        load: '最大20kg',
        surface: '滑り止め加工',
        mounting: '4点固定',
        size: '幅600mm×奥行800mm'
      },
      mountingNotes: '荷重分散考慮。滑り止め確認。'
    },
    { 
      id: 'shelf-sliding', 
      name: 'スライド棚板', 
      height: 1, 
      depth: 800, 
      power: 0, 
      heat: 0, 
      weight: 4, 
      type: 'shelf', 
      color: '#7C3AED', 
      dualPower: false, 
      needsRails: true, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'スライド機構付き棚板。メンテナンス頻度が高い機器用。',
      specifications: {
        extension: '最大700mm',
        load: '最大15kg',
        rails: 'ボールベアリングレール',
        locking: 'ロック機構付',
        surface: '穴あき加工'
      },
      mountingNotes: 'レール耐荷重確認。引き出し時クリアランス要。'
    },
    { 
      id: 'kamidana', 
      name: '神棚', 
      height: 1, 
      depth: 200, 
      power: 0, 
      heat: 0, 
      weight: 1, 
      type: 'spiritual', 
      color: '#F59E0B', 
      dualPower: false, 
      needsRails: false, 
      requiresShelf: true, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'データセンターの安全祈願用。システム安定稼働を願い設置。',
      specifications: {
        material: '桧材',
        size: '幅300mm×奥行200mm×高70mm',
        features: '御札収納可能',
        maintenance: '年1回清掃推奨',
        placement: '上位ユニット推奨'
      },
      mountingNotes: '棚板上設置必須。清掃アクセス考慮。'
    },
    { 
      id: 'tool-drawer', 
      name: '工具引き出し', 
      height: 2, 
      depth: 600, 
      power: 0, 
      heat: 0, 
      weight: 10, 
      type: 'other', 
      color: '#6B7280', 
      dualPower: false, 
      needsRails: true, 
      airflow: 'natural', 
      cfm: 0, 
      heatGeneration: 0,
      description: 'ラック内工具収納用引き出し。メンテナンス工具の現場保管用。',
      specifications: {
        drawers: '2段引き出し',
        capacity: '最大10kg/段',
        lock: 'キーロック付',
        divider: '仕切り板調整可',
        material: 'スチール製'
      },
      mountingNotes: '工具重量考慮。セキュリティ要検討。'
    },
    { 
      id: 'blank-panel-1u', 
      name: '1Uブランクパネル', 
      height: 1, 
      depth: 50, 
      power: 0, 
      heat: 0, 
      weight: 0.5, 
      type: 'other', 
      color: '#9CA3AF', 
      dualPower: false, 
      needsRails: false, 
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
      mountingNotes: 'エアフロー遮断効果あり。全空きユニット設置推奨。'
    }
  ];

  // 現在選択されているラック
  const currentRack = selectedRack === 'all' ? racks[Object.keys(racks)[0]] : racks[selectedRack];
  const currentRackType = rackTypes[currentRack?.type];

  // スタイル関数
  const getContainerStyle = () => {
    return darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
  };

  const getSidebarStyle = () => {
    return darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  };

  const getButtonStyle = (isActive = false) => {
    if (isActive) {
      return darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white';
    }
    return darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  // ズーム機能
  const zoomLevels = [50, 75, 100];
  const currentZoomIndex = zoomLevels.indexOf(zoomLevel);

  const handleZoomIn = () => {
    const nextIndex = Math.min(currentZoomIndex + 1, zoomLevels.length - 1);
    setZoomLevel(zoomLevels[nextIndex]);
  };

  const handleZoomOut = () => {
    const prevIndex = Math.max(currentZoomIndex - 1, 0);
    setZoomLevel(zoomLevels[prevIndex]);
  };

  const handleZoomFit = () => {
    if (selectedRack === 'all') {
      const layout = calculateLayoutDimensions();
      const viewportWidth = window.innerWidth - 400;
      const viewportHeight = window.innerHeight - 200;
      
      const widthBasedZoom = Math.floor((viewportWidth / layout.totalContentWidth) * 100);
      const heightBasedZoom = Math.floor((viewportHeight / (42 * 32 + 200)) * 100);
      
      const optimalZoom = Math.min(75, Math.max(30, Math.min(widthBasedZoom, heightBasedZoom)));
      setZoomLevel(optimalZoom);
    } else {
      const viewportHeight = window.innerHeight - 200;
      const rackHeight = currentRack.units * 32 + 200;
      const optimalZoom = Math.min(100, Math.floor((viewportHeight / rackHeight) * 100));
      setZoomLevel(Math.max(30, optimalZoom));
    }
  };

  const calculateLayoutDimensions = () => {
    const rackCount = Object.keys(racks).length;
    const rackWidth = 320;
    const rackGap = 32;
    const totalContentWidth = (rackWidth * rackCount) + (rackGap * (rackCount - 1));
    
    return {
      rackCount,
      rackWidth,
      rackGap,
      totalContentWidth,
      needsScroll: totalContentWidth > (window.innerWidth - 400)
    };
  };

  const getLayoutStyle = () => {
    const scale = zoomLevel / 100;
    const layout = calculateLayoutDimensions();
    
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      width: layout.totalContentWidth,
      minWidth: 'fit-content'
    };
  };

  const getContainerLayoutStyle = () => {
    const layout = calculateLayoutDimensions();
    const scale = zoomLevel / 100;
    const scaledWidth = layout.totalContentWidth * scale;
    
    return {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      width: '100%',
      minHeight: '100%',
      paddingBottom: '2rem'
    };
  };

  const getZoomedUnitHeight = () => {
    return Math.max(16, (32 * zoomLevel) / 100);
  };

  const getZoomedFontSize = () => {
    const baseFontSize = 12;
    return Math.max(8, (baseFontSize * zoomLevel) / 100);
  };

  // ラック追加
  const addRack = () => {
    const rackCount = Object.keys(racks).length;
    const newRackId = `rack-${Date.now()}`;
    const newRack = {
      id: newRackId,
      name: `ラック #${rackCount + 1}`,
      type: '42u-standard',
      units: 42,
      depth: 1000,
      width: 600,
      equipment: {},
      powerConnections: {},
      mountingOptions: {},
      labels: {},
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
    };
    
    setRacks(prev => ({ ...prev, [newRackId]: newRack }));
    setSelectedRack(newRackId);
  };

  // ラック削除
  const removeRack = (rackId) => {
    if (Object.keys(racks).length <= 1) return;
    
    const newRacks = { ...racks };
    delete newRacks[rackId];
    setRacks(newRacks);
    
    if (selectedRack === rackId) {
      setSelectedRack(Object.keys(newRacks)[0]);
    }
  };

  // ラック複製
  const duplicateRack = (rackId) => {
    const sourceRack = racks[rackId];
    const rackCount = Object.keys(racks).length;
    const newRackId = `rack-${Date.now()}`;
    
    const newRack = {
      ...sourceRack,
      id: newRackId,
      name: `${sourceRack.name} (コピー)`,
      position: { row: sourceRack.position.row, column: rackCount + 1 }
    };
    
    setRacks(prev => ({ ...prev, [newRackId]: newRack }));
    setSelectedRack(newRackId);
  };

  // ラック設定更新
  const updateRack = (rackId, updates) => {
    setRacks(prev => ({
      ...prev,
      [rackId]: { ...prev[rackId], ...updates }
    }));
    
    if (updates.type) {
      const rackType = rackTypes[updates.type];
      setRacks(prev => ({
        ...prev,
        [rackId]: { 
          ...prev[rackId], 
          ...updates,
          units: rackType.units,
          depth: rackType.depth,
          width: rackType.width
        }
      }));
    }
  };

  // 電源系統検索
  const getPowerSources = () => {
    const pdus = Object.values(currentRack.equipment).filter(item => item.type === 'pdu' && item.isMainUnit);
    const upses = Object.values(currentRack.equipment).filter(item => item.type === 'ups' && item.isMainUnit);
    const cvcfs = Object.values(currentRack.equipment).filter(item => (item.id.includes('cvcf') || item.name.includes('CVCF')) && item.isMainUnit);
    const distributionPanels = Object.values(currentRack.equipment).filter(item => item.id.includes('distribution-panel') && item.isMainUnit);
    
    return {
      pdus,
      upses,
      cvcfs,
      distributionPanels,
      all: [...pdus, ...upses, ...cvcfs, ...distributionPanels]
    };
  };

  // 全体統計計算
  const calculateTotalStats = () => {
    let totalPower = 0;
    let totalHeat = 0;
    let totalWeight = 0;
    let totalUsedUnits = 0;
    let totalAvailableUnits = 0;
    let totalCost = 0;

    Object.values(racks).forEach(rack => {
      const equipmentArray = Object.values(rack.equipment).filter(item => item.isMainUnit || !item.startUnit);
      totalPower += equipmentArray.reduce((sum, item) => sum + (item.power || 0), 0);
      totalHeat += equipmentArray.reduce((sum, item) => sum + (item.heat || 0), 0);
      totalWeight += equipmentArray.reduce((sum, item) => sum + (item.weight || 0), 0);
      totalUsedUnits += equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
      totalAvailableUnits += rack.units - equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
      totalCost += rackTypes[rack.type].price;
    });

    return {
      totalPower,
      totalHeat,
      totalWeight,
      totalUsedUnits,
      totalAvailableUnits,
      totalCost,
      rackCount: Object.keys(racks).length
    };
  };

  // 個別ラック統計計算
  const calculateRackStats = (rack) => {
    const equipmentArray = Object.values(rack.equipment).filter(item => item.isMainUnit || !item.startUnit);
    const totalPower = equipmentArray.reduce((sum, item) => sum + (item.power || 0), 0);
    const totalHeat = equipmentArray.reduce((sum, item) => sum + (item.heat || 0), 0);
    const totalWeight = equipmentArray.reduce((sum, item) => sum + (item.weight || 0), 0);
    const usedUnits = equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
    const availableUnits = rack.units - usedUnits;
    
    return { 
      totalPower, 
      totalHeat, 
      totalWeight, 
      usedUnits, 
      availableUnits
    };
  };

  // 冷却・エアフロー計算
  const calculateCoolingStats = (rack) => {
    const equipmentArray = Object.values(rack.equipment).filter(item => item.isMainUnit || !item.startUnit);
    
    let totalHeatGeneration = 0;
    let totalCFM = 0;
    let totalCoolingCapacity = 0;
    let airflowIssues = [];
    
    const temperatureMap = {};
    let currentTemp = rack.environment.ambientTemp;
    
    for (let unit = 1; unit <= rack.units; unit++) {
      const item = rack.equipment[unit];
      if (item && item.isMainUnit) {
        totalHeatGeneration += item.heatGeneration || 0;
        totalCFM += item.cfm || 0;
        
        if (item.type === 'cooling') {
          totalCoolingCapacity += Math.abs(item.heatGeneration || 0);
        }
        
        const heatDensity = (item.heatGeneration || 0) / (item.cfm || 100);
        const tempRise = heatDensity * 0.1;
        currentTemp += tempRise;
        
        if (item.airflow === 'front-to-rear' && item.cfm < (item.heatGeneration || 0) / 10) {
          airflowIssues.push({
            unit,
            item: item.name,
            issue: '冷却能力不足',
            severity: 'high'
          });
        }
        
        if (item.airflow === 'blocking') {
          airflowIssues.push({
            unit,
            item: item.name,
            issue: 'エアフロー阻害',
            severity: 'medium'
          });
        }
      }
      
      temperatureMap[unit] = Math.round(currentTemp * 10) / 10;
      
      if (!item) {
        currentTemp = Math.max(currentTemp - 0.1, rack.environment.ambientTemp);
      }
    }
    
    const coolingEfficiency = totalCoolingCapacity > 0 ? 
      Math.min((totalCoolingCapacity / totalHeatGeneration) * 100, 100) : 0;
    
    const maxTemp = Math.max(...Object.values(temperatureMap));
    const minTemp = Math.min(...Object.values(temperatureMap));
    const avgTemp = Object.values(temperatureMap).reduce((a, b) => a + b, 0) / Object.values(temperatureMap).length;
    
    return {
      totalHeatGeneration,
      totalCFM,
      totalCoolingCapacity,
      coolingEfficiency: Math.round(coolingEfficiency),
      maxTemp: Math.round(maxTemp * 10) / 10,
      minTemp: Math.round(minTemp * 10) / 10,
      avgTemp: Math.round(avgTemp * 10) / 10,
      temperatureMap,
      airflowIssues,
      pressureDrop: Math.round(totalCFM * 0.001 * 100) / 100,
      thermalDesignPoint: totalHeatGeneration / (rack.units * 100)
    };
  };

  // ゲージナット設置・管理
  const installCageNut = (unit, side, position, nutType = 'm6') => {
    const newRack = { ...currentRack };
    if (!newRack.cageNuts[unit]) {
      newRack.cageNuts[unit] = { 
        frontLeft: { top: null, bottom: null }, 
        frontRight: { top: null, bottom: null },
        rearLeft: { top: null, bottom: null }, 
        rearRight: { top: null, bottom: null }
      };
    }
    newRack.cageNuts[unit][side][position] = nutType;
    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
  };

  const removeCageNut = (unit, side, position) => {
    const newRack = { ...currentRack };
    if (newRack.cageNuts[unit] && newRack.cageNuts[unit][side]) {
      newRack.cageNuts[unit][side][position] = null;
    }
    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
  };

  const autoInstallCageNuts = (unit, nutType = 'm6') => {
    const newRack = { ...currentRack };
    newRack.cageNuts[unit] = {
      frontLeft: { top: nutType, bottom: nutType },
      frontRight: { top: nutType, bottom: nutType },
      rearLeft: { top: nutType, bottom: nutType },
      rearRight: { top: nutType, bottom: nutType }
    };
    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
  };

  const getCageNutStatus = (unit) => {
    const cageNuts = currentRack.cageNuts[unit] || {
      frontLeft: { top: null, bottom: null },
      frontRight: { top: null, bottom: null },
      rearLeft: { top: null, bottom: null },
      rearRight: { top: null, bottom: null }
    };
    
    const allPositions = [
      cageNuts.frontLeft?.top, cageNuts.frontLeft?.bottom,
      cageNuts.frontRight?.top, cageNuts.frontRight?.bottom,
      cageNuts.rearLeft?.top, cageNuts.rearLeft?.bottom,
      cageNuts.rearRight?.top, cageNuts.rearRight?.bottom
    ];
    
    const installed = allPositions.filter(Boolean).length;
    return { installed, total: 8, isComplete: installed === 8 };
  };

  // ドラッグ&ドロップ処理
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, startUnit) => {
    e.preventDefault();
    if (!draggedItem) return;

    // ゲージナットの場合は該当ユニットに自動設置
    if (draggedItem.nutType) {
      autoInstallCageNuts(startUnit, draggedItem.nutType);
      alert(`${startUnit}Uに${draggedItem.name}を8個設置しました。\n（前面4穴・背面4穴）`);
      setDraggedItem(null);
      return;
    }

    // その他の取り付け部品（ネジ等）の場合は在庫に追加
    if (draggedItem.screwType || draggedItem.washerType) {
      alert(`${draggedItem.name}を部品在庫に追加しました。\n取り付け設定で各機器に割り当ててください。`);
      setDraggedItem(null);
      return;
    }

    // レール類の場合は仮想設置（実際のユニットは占有しない）
    if (draggedItem.railType) {
      const equipmentId = `${draggedItem.id}-${Date.now()}`;
      const newRack = { ...currentRack };
      
      // レール情報をラック設定に追加
      if (!newRack.railInventory) {
        newRack.railInventory = {};
      }
      newRack.railInventory[equipmentId] = {
        ...draggedItem,
        assignedUnit: startUnit,
        installed: false
      };
      
      setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
      alert(`${draggedItem.name}を${startUnit}Uエリアに仮設置しました。\n機器設定で実際の取り付けを行ってください。`);
      setDraggedItem(null);
      return;
    }

    const endUnit = startUnit + draggedItem.height - 1;
    
    if (draggedItem.requiresShelf) {
      const shelfUnit = startUnit + 1;
      const shelfItem = currentRack.equipment[shelfUnit];
      if (!shelfItem || shelfItem.type !== 'shelf') {
        alert('神棚は棚板の上にのみ設置できます。まず棚板を設置してください。');
        setDraggedItem(null);
        return;
      }
    }
    
    // 機器設置前にゲージナットの確認
    if (selectedEquipment?.needsRails === false || draggedItem.type !== 'mounting') {
      let missingCageNuts = [];
      for (let unit = startUnit; unit <= endUnit; unit++) {
        const status = getCageNutStatus(unit);
        if (!status.isComplete) {
          missingCageNuts.push(unit);
        }
      }
      
      if (missingCageNuts.length > 0) {
        const proceed = confirm(`${missingCageNuts.join('U, ')}Uにゲージナットが不足しています。\n設置を続行しますか？\n（後でゲージナットを設置する必要があります）`);
        if (!proceed) {
          setDraggedItem(null);
          return;
        }
      }
    }
    
    let canPlace = true;
    for (let unit = startUnit; unit <= endUnit; unit++) {
      if (currentRack.equipment[unit]) {
        canPlace = false;
        break;
      }
    }

    if (canPlace && endUnit <= currentRack.units) {
      const equipmentId = `${draggedItem.id}-${Date.now()}`;
      
      const newRack = { ...currentRack };
      for (let unit = startUnit; unit <= endUnit; unit++) {
        newRack.equipment[unit] = {
          ...draggedItem,
          id: equipmentId,
          startUnit,
          endUnit,
          isMainUnit: unit === startUnit
        };
      }
      
      if (draggedItem.dualPower) {
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
      
      newRack.mountingOptions[equipmentId] = {
        type: draggedItem.needsRails ? 'none' : 'direct',
        hasShelf: false,
        hasCableArm: false
      };
      
      newRack.labels[equipmentId] = {
        customName: '',
        ipAddress: '',
        serialNumber: '',
        owner: '',
        purpose: '',
        installDate: new Date().toISOString().split('T')[0],
        notes: ''
      };
      
      setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
    } else {
      if (!canPlace) {
        alert('このユニットには既に機器が設置されています。');
      } else {
        alert('ラックの容量を超えています。');
      }
    }
    
    setDraggedItem(null);
  };

  // 機器削除
  const removeEquipment = (unit) => {
    const item = currentRack.equipment[unit];
    if (!item) return;

    const newRack = { ...currentRack };
    
    for (let u = item.startUnit; u <= item.endUnit; u++) {
      delete newRack.equipment[u];
    }
    
    delete newRack.powerConnections[item.id];
    delete newRack.mountingOptions[item.id];
    delete newRack.labels[item.id];
    
    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
    setSelectedEquipment(null);
    setShowEquipmentModal(false);
  };

  // ラベル更新
  const updateLabel = (equipmentId, field, value) => {
    const newRack = { ...currentRack };
    newRack.labels = newRack.labels || {};
    newRack.labels[equipmentId] = {
      ...newRack.labels[equipmentId],
      [field]: value
    };
    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
  };

  // 電源接続変更
  const updatePowerConnection = (equipmentId, field, value) => {
    const newRack = { ...currentRack };
    newRack.powerConnections[equipmentId] = {
      ...newRack.powerConnections[equipmentId],
      [field]: value
    };
    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
  };

  // ラックユニット表示
  const renderRackUnit = (unit, rack = currentRack) => {
    const item = rack.equipment[unit];
    const isEmpty = !item;
    const isMainUnit = item?.isMainUnit;
    const cageNutStatus = getCageNutStatus(unit);
    const cageNuts = rack.cageNuts[unit] || {
      frontLeft: { top: null, bottom: null },
      frontRight: { top: null, bottom: null },
      rearLeft: { top: null, bottom: null },
      rearRight: { top: null, bottom: null }
    };

    let powerStatus = '';
    let mountingStatus = '';
    let airflowStatus = '';
    let temperatureStatus = '';
    let cageNutDisplay = '';
    let displayName = '';
    
    if (item && isMainUnit) {
      const labels = rack.labels?.[item.id] || {};
      
      if (labels.customName) {
        displayName = labels.customName;
      } else {
        displayName = item.name;
      }
      
      if (showLabelView) {
        if (labels.ipAddress) {
          displayName += ` (${labels.ipAddress})`;
        } else if (labels.serialNumber) {
          displayName += ` (SN:${labels.serialNumber})`;
        }
      }
      
      if (item.dualPower) {
        const connections = rack.powerConnections[item.id] || {};
        const hasPrimary = connections.primarySource;
        const hasSecondary = connections.secondarySource;
        if (hasPrimary && hasSecondary) {
          powerStatus = <CircleCheck size={12} className="text-green-500" />;
        } else if (hasPrimary || hasSecondary) {
          powerStatus = <AlertCircle size={12} className="text-yellow-500" />;
        } else {
          powerStatus = <XCircle size={12} className="text-red-500" />;
        }
      } else {
        const connections = rack.powerConnections[item.id] || {};
        const hasPrimary = connections.primarySource;
        if (hasPrimary) {
          powerStatus = <CircleCheck size={12} className="text-green-500" />;
        } else {
          powerStatus = <XCircle size={12} className="text-red-500" />;
        }
      }
      
      const mounting = rack.mountingOptions[item.id] || {};
      const mountIcons = {
        'slide-rail': <Settings2 size={12} className="text-purple-400" title="スライドレール" />,
        'fixed-rail': <Ruler size={12} className="text-blue-400" title="固定レール" />,
        'toolless-rail': <Move size={12} className="text-green-400" title="ツールレスレール" />,
        'shelf': <Package size={12} className="text-yellow-400" title="棚板設置" />,
        'direct': <Wrench size={12} className="text-orange-400" title="直接取付" />,
        'none': selectedEquipment?.needsRails ? 
          <AlertTriangle size={12} className="text-red-400" title="レール未設定" /> :
          <HelpCircle size={12} className="text-gray-400" title="取付未設定" />
      };
      mountingStatus = mountIcons[mounting.type] || mountIcons['none'];
      
      const airflowIcons = {
        'front-to-rear': <ArrowRight size={12} className="text-blue-400" />,
        'rear-to-front': <ArrowLeft size={12} className="text-green-400" />,
        'side-to-side': <ArrowUp size={12} className="text-yellow-400" />,
        'intake': <ArrowDown size={12} className="text-cyan-400" />,
        'exhaust': <ArrowUp size={12} className="text-orange-400" />,
        'blocking': <Square size={12} className="text-red-400" />,
        'natural': <Wind size={12} className="text-gray-400" />
      };
      airflowStatus = airflowIcons[item.airflow] || airflowIcons['natural'];
      
      if (showTemperatureView) {
        const coolingStats = calculateCoolingStats(rack);
        const unitTemp = coolingStats.temperatureMap[unit] || rack.environment.ambientTemp;
        if (unitTemp > 30) {
          temperatureStatus = <Thermometer size={12} className="text-red-500" />;
        } else if (unitTemp > 25) {
          temperatureStatus = <Thermometer size={12} className="text-yellow-500" />;
        } else {
          temperatureStatus = <Thermometer size={12} className="text-green-500" />;
        }
      }
    }

    // ゲージナット表示
    if (showCageNutView) {
      if (cageNutStatus.isComplete) {
        cageNutDisplay = <CircleCheck size={12} className="text-green-500" title="ゲージナット完備" />;
      } else if (cageNutStatus.installed > 0) {
        cageNutDisplay = <AlertCircle size={12} className="text-yellow-500" title={`ゲージナット ${cageNutStatus.installed}/8`} />;
      } else {
        cageNutDisplay = <XCircle size={12} className="text-red-500" title="ゲージナット未設置" />;
      }
    }

    const unitHeight = getZoomedUnitHeight();
    const fontSize = getZoomedFontSize();

    const unitBorderClass = darkMode ? 'border-gray-600' : 'border-gray-300';
    const emptyUnitClass = darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100';
    const unitNumClass = darkMode ? 'text-gray-400' : 'text-gray-500';

    // ラック柱の取り付け穴を描画
    const renderMountingHoles = () => {
      const holeSize = Math.max(4, unitHeight * 0.12);
      
      return (
        <>
          {/* 前面左ラック柱 */}
          {/* 上穴 */}
          <div 
            className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
              cageNuts.frontLeft?.top ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
            }`}
            style={{ 
              width: `${holeSize}px`, 
              height: `${holeSize}px`,
              left: `-${holeSize + 2}px`,
              top: `2px`
            }}
            title={cageNuts.frontLeft?.top ? `前面左上: ${cageNuts.frontLeft.top.toUpperCase()}` : '前面左上: 空き穴'}
            onClick={(e) => {
              e.stopPropagation();
              if (cageNuts.frontLeft?.top) {
                removeCageNut(unit, 'frontLeft', 'top');
              } else {
                installCageNut(unit, 'frontLeft', 'top', 'm6');
              }
            }}
          >
            {cageNuts.frontLeft?.top && (
              <div className="w-full h-full flex items-center justify-center">
                <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
              </div>
            )}
          </div>

          {/* 下穴 */}
          <div 
            className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
              cageNuts.frontLeft?.bottom ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
            }`}
            style={{ 
              width: `${holeSize}px`, 
              height: `${holeSize}px`,
              left: `-${holeSize + 2}px`,
              bottom: `2px`
            }}
            title={cageNuts.frontLeft?.bottom ? `前面左下: ${cageNuts.frontLeft.bottom.toUpperCase()}` : '前面左下: 空き穴'}
            onClick={(e) => {
              e.stopPropagation();
              if (cageNuts.frontLeft?.bottom) {
                removeCageNut(unit, 'frontLeft', 'bottom');
              } else {
                installCageNut(unit, 'frontLeft', 'bottom', 'm6');
              }
            }}
          >
            {cageNuts.frontLeft?.bottom && (
              <div className="w-full h-full flex items-center justify-center">
                <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
              </div>
            )}
          </div>

          {/* 前面右ラック柱 */}
          {/* 上穴 */}
          <div 
            className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
              cageNuts.frontRight?.top ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
            }`}
            style={{ 
              width: `${holeSize}px`, 
              height: `${holeSize}px`,
              right: `-${holeSize + 2}px`,
              top: `2px`
            }}
            title={cageNuts.frontRight?.top ? `前面右上: ${cageNuts.frontRight.top.toUpperCase()}` : '前面右上: 空き穴'}
            onClick={(e) => {
              e.stopPropagation();
              if (cageNuts.frontRight?.top) {
                removeCageNut(unit, 'frontRight', 'top');
              } else {
                installCageNut(unit, 'frontRight', 'top', 'm6');
              }
            }}
          >
            {cageNuts.frontRight?.top && (
              <div className="w-full h-full flex items-center justify-center">
                <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
              </div>
            )}
          </div>

          {/* 下穴 */}
          <div 
            className={`absolute border cursor-pointer hover:scale-110 transition-transform ${
              cageNuts.frontRight?.bottom ? 'bg-green-500 border-green-600' : darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-gray-400'
            }`}
            style={{ 
              width: `${holeSize}px`, 
              height: `${holeSize}px`,
              right: `-${holeSize + 2}px`,
              bottom: `2px`
            }}
            title={cageNuts.frontRight?.bottom ? `前面右下: ${cageNuts.frontRight.bottom.toUpperCase()}` : '前面右下: 空き穴'}
            onClick={(e) => {
              e.stopPropagation();
              if (cageNuts.frontRight?.bottom) {
                removeCageNut(unit, 'frontRight', 'bottom');
              } else {
                installCageNut(unit, 'frontRight', 'bottom', 'm6');
              }
            }}
          >
            {cageNuts.frontRight?.bottom && (
              <div className="w-full h-full flex items-center justify-center">
                <div className={`w-1 h-1 bg-white rounded-full ${holeSize < 6 ? 'hidden' : ''}`}></div>
              </div>
            )}
          </div>

          {/* 背面ラック柱（内側に小さく表示） */}
          {/* 背面左 */}
          <div 
            className={`absolute border cursor-pointer hover:scale-110 transition-transform opacity-70 ${
              cageNuts.rearLeft?.top || cageNuts.rearLeft?.bottom ? 'bg-green-400 border-green-500' : darkMode ? 'bg-gray-500 border-gray-400' : 'bg-gray-200 border-gray-300'
            }`}
            style={{ 
              width: `${Math.max(3, holeSize * 0.7)}px`, 
              height: `${unitHeight - 4}px`,
              left: `${holeSize + 4}px`,
              top: `2px`
            }}
            title={`背面左: ${(cageNuts.rearLeft?.top || cageNuts.rearLeft?.bottom) ? '設置済み' : '未設置'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (cageNuts.rearLeft?.top || cageNuts.rearLeft?.bottom) {
                removeCageNut(unit, 'rearLeft', 'top');
                removeCageNut(unit, 'rearLeft', 'bottom');
              } else {
                installCageNut(unit, 'rearLeft', 'top', 'm6');
                installCageNut(unit, 'rearLeft', 'bottom', 'm6');
              }
            }}
          >
          </div>

          {/* 背面右 */}
          <div 
            className={`absolute border cursor-pointer hover:scale-110 transition-transform opacity-70 ${
              cageNuts.rearRight?.top || cageNuts.rearRight?.bottom ? 'bg-green-400 border-green-500' : darkMode ? 'bg-gray-500 border-gray-400' : 'bg-gray-200 border-gray-300'
            }`}
            style={{ 
              width: `${Math.max(3, holeSize * 0.7)}px`, 
              height: `${unitHeight - 4}px`,
              right: `${holeSize + 4}px`,
              top: `2px`
            }}
            title={`背面右: ${(cageNuts.rearRight?.top || cageNuts.rearRight?.bottom) ? '設置済み' : '未設置'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (cageNuts.rearRight?.top || cageNuts.rearRight?.bottom) {
                removeCageNut(unit, 'rearRight', 'top');
                removeCageNut(unit, 'rearRight', 'bottom');
              } else {
                installCageNut(unit, 'rearRight', 'top', 'm6');
                installCageNut(unit, 'rearRight', 'bottom', 'm6');
              }
            }}
          >
          </div>
        </>
      );
    };

    return (
      <div
        key={unit}
        className={`relative border flex items-center justify-between px-2 ${unitBorderClass} ${
          isEmpty ? emptyUnitClass : ''
        } ${
          item && !isMainUnit ? 'border-t-0 bg-opacity-50' : ''
        }`}
        style={{ 
          height: `${unitHeight}px`,
          fontSize: `${fontSize}px`
        }}
        onDragOver={isEmpty && selectedRack !== 'all' ? handleDragOver : undefined}
        onDrop={isEmpty && selectedRack !== 'all' ? (e) => handleDrop(e, unit) : undefined}
        onContextMenu={(e) => {
          if (selectedRack !== 'all' && isEmpty) {
            e.preventDefault();
            // 右クリックメニューでゲージナット設置
            const action = confirm(`${unit}Uにゲージナットを設置しますか？\n（前面4穴・背面4穴、計8個のM6ナット）`);
            if (action) {
              autoInstallCageNuts(unit, 'm6');
            }
          }
        }}
        onClick={() => {
          if (item && selectedRack !== 'all') {
            setSelectedEquipment(item);
            setShowEquipmentModal(true);
          }
        }}
      >
        <div className="flex items-center gap-1">
          <span className={`font-mono ${unitNumClass}`}>{unit}</span>
          {showCageNutView && (
            <div className="flex gap-0.5">
              {/* ゲージナット状態インジケーター（8つの穴） */}
              <div className="flex flex-col gap-0.5" title={`ゲージナット: ${cageNutStatus.installed}/8`}>
                <div className="flex gap-0.5">
                  {/* 前面4穴 */}
                  {[
                    cageNuts.frontLeft?.top,
                    cageNuts.frontLeft?.bottom,
                    cageNuts.frontRight?.top,
                    cageNuts.frontRight?.bottom
                  ].map((nut, i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-1 rounded-full ${
                        nut ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-0.5">
                  {/* 背面4穴 */}
                  {[
                    cageNuts.rearLeft?.top,
                    cageNuts.rearLeft?.bottom,
                    cageNuts.rearRight?.top,
                    cageNuts.rearRight?.bottom
                  ].map((nut, i) => (
                    <div 
                      key={i + 4} 
                      className={`w-1 h-1 rounded-full ${
                        nut ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ラック柱の取り付け穴 */}
        {(showCageNutView || isEmpty) && renderMountingHoles()}
        
        {item && isMainUnit && (
          <div 
            className={`absolute inset-0 flex items-center justify-between px-2 ${
              showPowerView ? 'border-2 border-dashed border-yellow-400' : ''
            } ${
              showMountingView ? 'border-2 border-dashed border-purple-400' : ''
            } ${
              showLabelView ? 'border-2 border-dashed border-green-400' : ''
            } ${
              showCablingView ? 'border-2 border-dashed border-blue-400' : ''
            } ${
              showCageNutView ? 'border-2 border-dashed border-red-400' : ''
            }`}
            style={{ 
              backgroundColor: item.color, 
              height: `${item.height * unitHeight}px`,
              zIndex: 10
            }}
          >
            <div className="text-white font-medium truncate flex-1 text-center flex items-center justify-center gap-1">
              <span>{displayName}</span>
              {showPowerView && powerStatus && <span className="ml-1">{powerStatus}</span>}
              {showMountingView && <span className="ml-1">{mountingStatus}</span>}
              {showAirflowView && <span className="ml-1">{airflowStatus}</span>}
              {showTemperatureView && <span className="ml-1">{temperatureStatus}</span>}
              {showCageNutView && <span className="ml-1">{cageNutDisplay}</span>}
            </div>
            <div className="flex gap-1 items-center">
              {item.type === 'server' && <Server size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'network' && <Network size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'security' && <Shield size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'storage' && <HardDrive size={Math.max(10, fontSize)} className="text-white" />}
              {(item.type === 'pdu' || item.type === 'ups') && <Zap size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'power' && <Activity size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'console' && <Monitor size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'monitoring' && <Eye size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'cooling' && <Snowflake size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'shelf' && <Package size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'spiritual' && <Flame size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'cable' && <Cable size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'mounting' && <Wrench size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'panel' && <Square size={Math.max(10, fontSize)} className="text-white" />}
              {item.type === 'other' && <Settings size={Math.max(10, fontSize)} className="text-white" />}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeEquipment(unit);
                }}
                className="text-white hover:text-red-200 ml-1"
              >
                <Trash2 size={Math.max(8, fontSize - 2)} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalStats = calculateTotalStats();
  const rackStats = calculateRackStats(currentRack);

  return (
    <div className={`flex h-screen ${getContainerStyle()}`}>
      <div className="flex h-screen w-full">
        {/* サイドバー */}
        <div className={`w-80 border-r p-4 overflow-y-auto ${getSidebarStyle()}`}>
          {/* ダークモード切り替え */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold">データセンター設計</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors ${getButtonStyle()}`}
              title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
          </div>

          {/* フリーアクセスフロア設定 */}
          <div className={`mb-6 p-3 border rounded-lg ${
            darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Layers className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={16} />
              フリーアクセスフロア
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={floorSettings.hasAccessFloor}
                  onChange={(e) => setFloorSettings(prev => ({ ...prev, hasAccessFloor: e.target.checked }))}
                  className="rounded"
                />
                <label>フリーアクセスフロア使用</label>
              </div>
              {floorSettings.hasAccessFloor && (
                <>
                  <div>
                    <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>フロア高:</label>
                    <select
                      value={floorSettings.floorHeight}
                      onChange={(e) => setFloorSettings(prev => ({ ...prev, floorHeight: parseInt(e.target.value) }))}
                      className={`w-full p-1 border rounded text-sm ${
                        darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value={400}>400mm (標準)</option>
                      <option value={500}>500mm (高床)</option>
                      <option value={600}>600mm (超高床)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>配線ルート:</label>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div>電源: {floorSettings.cableRouting.power}</div>
                      <div>データ: {floorSettings.cableRouting.data}</div>
                      <div>光: {floorSettings.cableRouting.fiber}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ラック管理セクション */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                ラック管理
              </h2>
              <button
                onClick={() => setShowRackManager(!showRackManager)}
                className={`text-sm px-2 py-1 rounded transition-colors ${getButtonStyle(true)}`}
              >
                {showRackManager ? '閉じる' : '管理'}
              </button>
            </div>
            
            {showRackManager && (
              <div className={`mb-4 p-3 border rounded-lg ${
                darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={addRack}
                    className={`flex-1 text-white py-1 px-2 rounded text-sm flex items-center justify-center gap-1 transition-colors ${
                      darkMode ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <Plus size={14} />
                    追加
                  </button>
                  <button
                    onClick={() => duplicateRack(selectedRack)}
                    className={`flex-1 text-white py-1 px-2 rounded text-sm flex items-center justify-center gap-1 transition-colors ${
                      darkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Copy size={14} />
                    複製
                  </button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.values(racks).map(rack => (
                    <div key={rack.id} className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRack(rack.id)}
                        className={`flex-1 p-2 rounded text-sm text-left transition-colors ${
                          selectedRack === rack.id 
                            ? getButtonStyle(true)
                            : getButtonStyle()
                        }`}
                      >
                        {rack.name}
                      </button>
                      {Object.keys(racks).length > 1 && (
                        <button
                          onClick={() => removeRack(rack.id)}
                          className={`p-1 rounded transition-colors ${
                            darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 現在のラック設定 */}
          <div className={`mb-6 p-3 border rounded-lg ${
            darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-bold mb-2">現在のラック設定</h3>
            <div className="space-y-2">
              <div>
                <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ラック名:</label>
                <input
                  type="text"
                  value={currentRack.name}
                  onChange={(e) => updateRack(selectedRack, { name: e.target.value })}
                  className={`w-full p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ラック種類:</label>
                <select
                  value={currentRack.type}
                  onChange={(e) => updateRack(selectedRack, { type: e.target.value })}
                  className={`w-full p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {Object.entries(rackTypes).map(([key, type]) => (
                    <option key={key} value={key}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div>サイズ: {currentRackType.units}U × {currentRackType.width}mm × {currentRackType.depth}mm</div>
                <div>最大荷重: {currentRackType.maxWeight}kg</div>
                <div>価格: ¥{currentRackType.price.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 機器ライブラリ */}
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
            機器ライブラリ
          </h2>
          
          <div className="space-y-4 mb-6">
            {/* サーバー類 */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Server size={14} />
                サーバー
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => item.type === 'server').map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    }`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height}U</span>
                        {item.dualPower && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <Bolt size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          <div><strong>消費電力:</strong> {item.power}W</div>
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          <div><strong>奥行:</strong> {item.depth}mm</div>
                          <div><strong>冷却:</strong> {item.cfm}CFM</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ネットワーク・セキュリティ */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Network size={14} />
                ネットワーク・セキュリティ
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => ['network', 'security'].includes(item.type)).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    }`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === 'network' && <Network size={14} className={darkMode ? 'text-green-400' : 'text-green-600'} />}
                        {item.type === 'security' && <Shield size={14} className={darkMode ? 'text-red-400' : 'text-red-600'} />}
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height}U</span>
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          <div><strong>消費電力:</strong> {item.power}W</div>
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          <div><strong>エアフロー:</strong> {item.airflow}</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ストレージ */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <HardDrive size={14} />
                ストレージ
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => item.type === 'storage').map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    }`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height}U</span>
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          <div><strong>消費電力:</strong> {item.power}W</div>
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          <div><strong>冷却能力:</strong> {item.cfm}CFM</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 電源・UPS・電力制御 */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Zap size={14} />
                電源・UPS・電力制御
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => ['pdu', 'ups', 'power'].includes(item.type)).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    } ${item.pduType ? 'border-dashed' : ''}`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(item.type === 'pdu' || item.type === 'ups') && <Zap size={14} className={darkMode ? 'text-red-400' : 'text-red-600'} />}
                        {item.type === 'power' && <Activity size={14} className={darkMode ? 'text-red-400' : 'text-red-600'} />}
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height || '0'}U</span>
                        {item.dualPower && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <Bolt size={10} />
                          </span>
                        )}
                        {item.pduType && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                          }`} title="特殊配電">
                            <Power size={8} />
                          </span>
                        )}
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          {item.power > 0 && <div><strong>消費電力:</strong> {item.power}W</div>}
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* レール・取り付け部品 */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Wrench size={14} />
                レール・取り付け部品
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => item.type === 'mounting').map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    } ${item.nutType || item.screwType || item.washerType ? 'border-dotted' : ''}`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.railType && <Settings2 size={14} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />}
                        {(item.nutType || item.screwType || item.washerType) && <Package size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {item.height > 0 ? (
                          <span className={`text-xs px-1 py-0.5 rounded ${
                            darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                          }`}>{item.height}U</span>
                        ) : (
                          <span className={`text-xs px-1 py-0.5 rounded ${
                            darkMode ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>部品</span>
                        )}
                        {item.railType && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                          }`} title={`レール: ${item.railType}`}>
                            <Settings2 size={8} />
                          </span>
                        )}
                        {(item.nutType || item.screwType) && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                          }`} title="取り付け部品">
                            <Bolt size={8} />
                          </span>
                        )}
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ケーブル管理・配線 */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Cable size={14} />
                ケーブル管理・配線
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => item.type === 'cable').map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    }`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cable size={14} className={darkMode ? 'text-teal-400' : 'text-teal-600'} />
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height}U</span>
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* パッチパネル・ネットワーク配線 */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Globe size={14} />
                パッチパネル・ネットワーク配線
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => item.id.includes('patch-panel') || item.id.includes('fiber-panel')).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    }`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height}U</span>
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* その他・棚板・パネル */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Settings size={14} />
                その他・棚板・パネル
              </h3>
              <div className="space-y-2">
                {equipmentLibrary.filter(item => ['console', 'monitoring', 'cooling', 'shelf', 'spiritual', 'panel', 'other'].includes(item.type)).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-2 border rounded-lg cursor-move transition-shadow hover:shadow-md ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 hover:shadow-lg' 
                        : 'border-gray-200 bg-white'
                    } ${item.requiresShelf ? 'border-dashed' : ''}`}
                    style={{ borderLeft: `4px solid ${item.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === 'console' && <Monitor size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                        {item.type === 'monitoring' && <Eye size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                        {item.type === 'cooling' && <Snowflake size={14} className={darkMode ? 'text-cyan-400' : 'text-cyan-600'} />}
                        {item.type === 'shelf' && <Package size={14} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />}
                        {item.type === 'spiritual' && <Flame size={14} className={darkMode ? 'text-orange-400' : 'text-orange-600'} />}
                        {item.type === 'panel' && <Square size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                        {item.type === 'other' && <Settings size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                        <span className="font-medium text-xs">{item.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEquipmentInfo(showEquipmentInfo === item.id ? null : item.id);
                          }}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="詳細情報"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>{item.height}U</span>
                        {item.requiresShelf && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-orange-800 text-orange-200' : 'bg-orange-100 text-orange-800'
                          }`} title="棚板が必要">
                            <Package size={8} />
                          </span>
                        )}
                        {item.airflow && item.airflow !== 'natural' && (
                          <span className={`text-xs px-0.5 py-0.5 rounded flex items-center ${
                            darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
                          }`} title={`エアフロー: ${item.airflow}`}>
                            <Wind size={8} />
                          </span>
                        )}
                      </div>
                    </div>
                    {showEquipmentInfo === item.id && (
                      <div className={`mt-2 p-2 border rounded text-xs ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium mb-1">{item.description}</div>
                        <div className="space-y-1">
                          {item.power > 0 && <div><strong>消費電力:</strong> {item.power}W</div>}
                          <div><strong>重量:</strong> {item.weight}kg</div>
                          {item.cfm > 0 && <div><strong>風量:</strong> {item.cfm}CFM</div>}
                          {item.specifications && (
                            <div className="mt-2">
                              <div className="font-medium">主要仕様:</div>
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                          {item.mountingNotes && (
                            <div className="mt-1 text-orange-600 dark:text-orange-400">
                              <strong>設置注意:</strong> {item.mountingNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className={`p-4 border rounded-lg ${
            darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-bold mb-3">データセンター統計</h3>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>総ラック数</span>
                <span className="font-mono">{totalStats.rackCount}本</span>
              </div>
              <div className="flex justify-between">
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Zap size={14} className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                  総消費電力
                </span>
                <span className="font-mono">{totalStats.totalPower}W</span>
              </div>
              <div className="flex justify-between">
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Thermometer size={14} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                  総発熱量
                </span>
                <span className="font-mono">{totalStats.totalHeat.toFixed(0)}BTU/h</span>
              </div>
              <div className="flex justify-between">
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Weight size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  総重量
                </span>
                <span className="font-mono">{totalStats.totalWeight.toFixed(1)}kg</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>総ユニット</span>
                <span className="font-mono">{totalStats.totalUsedUnits}/{totalStats.totalUsedUnits + totalStats.totalAvailableUnits}U</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>ラック費用</span>
                <span className="font-mono">¥{totalStats.totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className={`border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h4 className="font-medium mb-2">現在のラック</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>使用率</span>
                  <span className="font-mono">{((rackStats.usedUnits / currentRack.units) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>消費電力</span>
                  <span className="font-mono">{rackStats.totalPower}W</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>発熱量</span>
                  <span className="font-mono">{rackStats.totalHeat.toFixed(0)}BTU/h</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>重量</span>
                  <span className="font-mono">{rackStats.totalWeight.toFixed(1)}kg</span>
                </div>
              </div>
            </div>
            
            {/* 冷却統計 */}
            <div className={`border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Snowflake size={14} className={darkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                冷却統計
              </h4>
              <div className="space-y-1 text-sm">
                {(() => {
                  const coolingStats = calculateCoolingStats(currentRack);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>平均温度</span>
                        <span className="font-mono">{coolingStats.avgTemp}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>最高温度</span>
                        <span className="font-mono">{coolingStats.maxTemp}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>総CFM</span>
                        <span className="font-mono">{coolingStats.totalCFM}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>冷却効率</span>
                        <span className="font-mono">{coolingStats.coolingEfficiency}%</span>
                      </div>
                      {coolingStats.airflowIssues.length > 0 && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-xs">
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle size={12} />
                            エアフロー警告 ({coolingStats.airflowIssues.length}件)
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* ゲージナット統計 */}
            <div className={`border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Package size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                ゲージナット
              </h4>
              <div className="space-y-1 text-sm">
                {(() => {
                  let totalInstalled = 0;
                  let totalRequired = 0;
                  let completeUnits = 0;
                  
                  for (let unit = 1; unit <= currentRack.units; unit++) {
                    const status = getCageNutStatus(unit);
                    totalInstalled += status.installed;
                    totalRequired += status.total;
                    if (status.isComplete) completeUnits++;
                  }
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>設置済み</span>
                        <span className="font-mono">{totalInstalled}/{totalRequired}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>完了ユニット</span>
                        <span className="font-mono">{completeUnits}/{currentRack.units}U</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>設置率</span>
                        <span className="font-mono">{Math.round((totalInstalled/totalRequired)*100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>ラック柱</span>
                        <span className="font-mono text-xs">前面4穴・背面4穴/ユニット</span>
                      </div>
                      {totalInstalled < totalRequired && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded text-xs">
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                            <AlertTriangle size={12} />
                            ゲージナット不足 ({totalRequired - totalInstalled}個)
                          </div>
                          <div className="mt-1 text-yellow-700 dark:text-yellow-500">
                            空きユニットを右クリックで一括設置
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 取り付け部品統計 */}
            <div className={`border-t pt-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Wrench size={14} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                取り付け部品
              </h4>
              <div className="space-y-1 text-sm">
                {(() => {
                  const equipmentArray = Object.values(currentRack.equipment).filter(item => item.isMainUnit || !item.startUnit);
                  const totalUnits = equipmentArray.reduce((sum, item) => sum + (item.height || 0), 0);
                  const requiredCageNuts = totalUnits * 2; // 前面・背面各2個ずつ
                  const requiredScrews = requiredCageNuts;
                  const railRequiredCount = equipmentArray.filter(item => item.needsRails).length;
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>必要ゲージナット</span>
                        <span className="font-mono">{requiredCageNuts}個</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>必要ラックネジ</span>
                        <span className="font-mono">{requiredScrews}本</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>レール必要機器</span>
                        <span className="font-mono">{railRequiredCount}台</span>
                      </div>
                      {railRequiredCount > 0 && (
                        <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded text-xs">
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <Settings2 size={12} />
                            レール設置計画要確認
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPowerView(!showPowerView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showPowerView 
                    ? darkMode ? 'bg-yellow-500 text-white' : 'bg-yellow-600 text-white'
                    : getButtonStyle()
                }`}
              >
                電源表示
              </button>
              <button
                onClick={() => setShowMountingView(!showMountingView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showMountingView 
                    ? darkMode ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white'
                    : getButtonStyle()
                }`}
              >
                取り付け表示
              </button>
              <button
                onClick={() => setShowCageNutView(!showCageNutView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showCageNutView 
                    ? darkMode ? 'bg-gray-500 text-white' : 'bg-gray-600 text-white'
                    : getButtonStyle()
                }`}
              >
                ゲージナット
              </button>
              <button
                onClick={() => setShowFloorView(!showFloorView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showFloorView 
                    ? darkMode ? 'bg-green-500 text-white' : 'bg-green-600 text-white'
                    : getButtonStyle()
                }`}
              >
                床下表示
              </button>
              <button
                onClick={() => setShowCablingView(!showCablingView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showCablingView 
                    ? darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                    : getButtonStyle()
                }`}
              >
                配線表示
              </button>
              <button
                onClick={() => setShowAirflowView(!showAirflowView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showAirflowView 
                    ? darkMode ? 'bg-cyan-500 text-white' : 'bg-cyan-600 text-white'
                    : getButtonStyle()
                }`}
              >
                エアフロー
              </button>
              <button
                onClick={() => setShowTemperatureView(!showTemperatureView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showTemperatureView 
                    ? darkMode ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
                    : getButtonStyle()
                }`}
              >
                温度表示
              </button>
              <button
                onClick={() => setShowLabelView(!showLabelView)}
                className={`py-2 px-2 rounded text-xs transition-colors ${
                  showLabelView 
                    ? darkMode ? 'bg-orange-500 text-white' : 'bg-orange-600 text-white'
                    : getButtonStyle()
                }`}
                title="IP・SN表示"
              >
                詳細表示
              </button>
            </div>
          </div>
        </div>

        {/* メインエリア - ラック表示 */}
        <div className={`flex-1 p-6 overflow-x-auto ${getContainerStyle()}`}>
          {/* ラック選択タブとズームコントロール */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedRack('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRack === 'all' 
                    ? getButtonStyle(true)
                    : `${getButtonStyle()} border`
                }`}
              >
                すべてのラック
                <div className="text-xs opacity-75">
                  {Object.keys(racks).length}台表示
                </div>
              </button>
              {Object.values(racks).map(rack => (
                <button
                  key={rack.id}
                  onClick={() => setSelectedRack(rack.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRack === rack.id 
                      ? getButtonStyle(true)
                      : `${getButtonStyle()} border`
                  }`}
                >
                  {rack.name}
                  <div className="text-xs opacity-75">
                    {rackTypes[rack.type].name}
                  </div>
                </button>
              ))}
            </div>

            {/* ズームコントロール */}
            <div className={`flex items-center gap-2 border rounded-lg p-2 ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}>
              <button
                onClick={handleZoomOut}
                disabled={currentZoomIndex === 0}
                className={`p-1 rounded transition-colors ${
                  currentZoomIndex === 0 
                    ? darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                    : darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="ズームアウト"
              >
                <ZoomOut size={16} />
              </button>
              
              <span className="px-2 text-sm font-mono min-w-12 text-center">
                {zoomLevel}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={currentZoomIndex === zoomLevels.length - 1}
                className={`p-1 rounded transition-colors ${
                  currentZoomIndex === zoomLevels.length - 1 
                    ? darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                    : darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="ズームイン"
              >
                <ZoomIn size={16} />
              </button>
              
              <div className={`w-px h-4 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              
              <button
                onClick={handleZoomFit}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="画面にフィット"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>

          {/* フロア表示 */}
          {showFloorView && floorSettings.hasAccessFloor && (
            <div className={`mb-4 p-3 border rounded-lg ${
              darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Grid3X3 className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={16} />
                フリーアクセスフロア (高さ: {floorSettings.floorHeight}mm)
              </h3>
              <div className="text-sm grid grid-cols-3 gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>電源ケーブル ({floorSettings.cableRouting.power})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>データケーブル ({floorSettings.cableRouting.data})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>光ファイバー ({floorSettings.cableRouting.fiber})</span>
                </div>
              </div>
            </div>
          )}

          {/* ラック表示エリア */}
          {selectedRack === 'all' ? (
            /* 全ラック表示 */
            <div style={getContainerLayoutStyle()}>
              <div 
                className="flex gap-8"
                style={getLayoutStyle()}
              >
                {Object.values(racks).map(rack => (
                  <div key={rack.id} className="flex-shrink-0">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold">{rack.name}</h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{rackTypes[rack.type].name}</p>
                      <div className="mt-2 text-xs grid grid-cols-2 gap-2">
                        {(() => {
                          const rackStats = calculateRackStats(rack);
                          return (
                            <>
                              <div className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                使用率: {((rackStats.usedUnits / rack.units) * 100).toFixed(1)}%
                              </div>
                              <div className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                電力: {rackStats.totalPower}W
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* 天井配線表示 */}
                    {showCablingView && (
                      <div className={`mb-2 p-2 border rounded-lg flex items-center justify-between text-xs ${
                        darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-100 border-gray-300'
                      }`}>
                        <div className="flex items-center gap-1">
                          <ArrowUpFromLine className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={12} />
                          <span>天井配線</span>
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                          {floorSettings.cableRouting.fiber === 'overhead' ? '光ファイバー' : '未使用'}
                        </span>
                      </div>
                    )}
                    
                    {/* ラックファン表示 */}
                    <div className={`mb-4 p-2 border rounded-lg flex items-center justify-between text-sm ${
                      darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-100 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Fan className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={14} />
                        <span className="font-medium">ファン x{rack.fans.count}</span>
                      </div>
                      <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{rack.fans.rpm}RPM</span>
                    </div>
                    
                    {/* ラック枠 */}
                    <div 
                      className={`border-4 rounded-lg overflow-hidden shadow-lg w-80 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600' 
                          : 'bg-white border-gray-800'
                      } cursor-pointer hover:shadow-xl transition-shadow`}
                      onClick={() => setSelectedRack(rack.id)}
                      title={`${rack.name}を選択`}
                    >
                      {Array.from({ length: rack.units }, (_, i) => rack.units - i).map((unit) =>
                        renderRackUnit(unit, rack)
                      )}
                    </div>

                    {/* 床下配線表示 */}
                    {showFloorView && floorSettings.hasAccessFloor && (
                      <div className={`mt-2 p-2 border rounded-lg flex items-center justify-between text-xs ${
                        darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center gap-1">
                          <ArrowDownToLine className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={12} />
                          <span>床下配線</span>
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          {[
                            floorSettings.cableRouting.power === 'underfloor' ? '電源' : null,
                            floorSettings.cableRouting.data === 'underfloor' ? 'データ' : null
                          ].filter(Boolean).join('・') || '未使用'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 単一ラック表示 */
            <div style={getContainerLayoutStyle()}>
              <div style={{ ...getLayoutStyle(), width: 'auto' }}>
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold">{currentRack.name}</h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{rackTypes[currentRack.type].name}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>ズーム: {zoomLevel}%</p>
                </div>
                
                {/* 天井配線表示 */}
                {showCablingView && (
                  <div className={`mb-4 p-3 border rounded-lg flex items-center justify-between ${
                    darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                      <span className="font-medium">天井配線</span>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {floorSettings.cableRouting.fiber === 'overhead' ? '光ファイバー配線' : '配線なし'}
                    </span>
                  </div>
                )}
                
                {/* ラックファン表示 */}
                <div className={`mb-4 p-3 border rounded-lg flex items-center justify-between ${
                  darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-100 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Fan className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <span className="font-medium">排気ファン x{currentRack.fans.count}</span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{currentRack.fans.rpm}RPM</span>
                </div>
                
                {/* ラック枠 */}
                <div className={`border-4 rounded-lg overflow-hidden shadow-lg w-80 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-800'
                }`}>
                  {Array.from({ length: currentRack.units }, (_, i) => currentRack.units - i).map((unit) =>
                    renderRackUnit(unit)
                  )}
                </div>

                {/* 床下配線表示 */}
                {showFloorView && floorSettings.hasAccessFloor && (
                  <div className={`mt-4 p-3 border rounded-lg flex items-center justify-between ${
                    darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                      <span className="font-medium">床下配線 ({floorSettings.floorHeight}mm)</span>
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {[
                        floorSettings.cableRouting.power === 'underfloor' ? '電源' : null,
                        floorSettings.cableRouting.data === 'underfloor' ? 'データ' : null
                      ].filter(Boolean).join('・') || '配線なし'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 機器設定モーダル */}
        {selectedEquipment && showEquipmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border ${
              darkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              {/* モーダルヘッダー */}
              <div className={`sticky top-0 border-b p-4 flex items-center justify-between rounded-t-lg ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings size={20} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                  機器設定 - {selectedEquipment.name}
                </h3>
                <button
                  onClick={() => {
                    setShowEquipmentModal(false);
                    setSelectedEquipment(null);
                  }}
                  className={`p-1 transition-colors rounded-md ${
                    darkMode 
                      ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title="閉じる"
                >
                  <X size={20} />
                </button>
              </div>

              {/* モーダル内容 */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左カラム：基本情報・仕様 */}
                  <div className="space-y-6">
                    {/* 基本情報 */}
                    <div className={`p-4 border rounded-lg ${
                      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`font-medium mb-3 flex items-center gap-2 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <Info size={18} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                        基本情報
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>機器名:</strong> {selectedEquipment.name}
                          </div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>タイプ:</strong> {selectedEquipment.type}
                          </div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>サイズ:</strong> {selectedEquipment.height}U × {selectedEquipment.depth}mm
                          </div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>配置位置:</strong> {selectedEquipment.startUnit}U ~ {selectedEquipment.endUnit}U
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>消費電力:</strong> {selectedEquipment.power}W
                          </div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>重量:</strong> {selectedEquipment.weight}kg
                          </div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>エアフロー:</strong> {selectedEquipment.airflow}
                          </div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            <strong>風量:</strong> {selectedEquipment.cfm}CFM
                          </div>
                        </div>
                      </div>
                      
                      {/* 機器説明 */}
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">機器説明</h5>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedEquipment.description}
                        </p>
                      </div>
                      
                      {/* 技術仕様 */}
                      {selectedEquipment.specifications && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">技術仕様</h5>
                          <div className="grid grid-cols-1 gap-1 text-sm">
                            {Object.entries(selectedEquipment.specifications).map(([key, value]) => (
                              <div key={key} className={`flex justify-between ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">{key}:</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 設置注意事項 */}
                      {selectedEquipment.mountingNotes && (
                        <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded">
                          <h5 className="font-medium mb-1 text-orange-800 dark:text-orange-300">設置注意事項</h5>
                          <p className="text-sm text-orange-700 dark:text-orange-400">
                            {selectedEquipment.mountingNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右カラム：設定 */}
                  <div className="space-y-6">
                    {/* ラベル設定 */}
                    <div className={`p-4 border rounded-lg ${
                      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`font-medium mb-3 flex items-center gap-2 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <Tag size={18} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                        ラベル設定
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>カスタム名</label>
                          <input
                            type="text"
                            value={currentRack.labels?.[selectedEquipment.id]?.customName || ''}
                            onChange={(e) => updateLabel(selectedEquipment.id, 'customName', e.target.value)}
                            placeholder="例: Web-Server-01"
                            className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                              darkMode 
                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>IPアドレス</label>
                            <input
                              type="text"
                              value={currentRack.labels?.[selectedEquipment.id]?.ipAddress || ''}
                              onChange={(e) => updateLabel(selectedEquipment.id, 'ipAddress', e.target.value)}
                              placeholder="192.168.1.100"
                              className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                darkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>シリアル番号</label>
                            <input
                              type="text"
                              value={currentRack.labels?.[selectedEquipment.id]?.serialNumber || ''}
                              onChange={(e) => updateLabel(selectedEquipment.id, 'serialNumber', e.target.value)}
                              placeholder="SN123456789"
                              className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                darkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>担当者</label>
                            <input
                              type="text"
                              value={currentRack.labels?.[selectedEquipment.id]?.owner || ''}
                              onChange={(e) => updateLabel(selectedEquipment.id, 'owner', e.target.value)}
                              placeholder="田中太郎"
                              className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                darkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>設置日</label>
                            <input
                              type="date"
                              value={currentRack.labels?.[selectedEquipment.id]?.installDate || ''}
                              onChange={(e) => updateLabel(selectedEquipment.id, 'installDate', e.target.value)}
                              className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                darkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                              }`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>用途・備考</label>
                          <textarea
                            value={currentRack.labels?.[selectedEquipment.id]?.notes || ''}
                            onChange={(e) => updateLabel(selectedEquipment.id, 'notes', e.target.value)}
                            placeholder="機器の用途や特記事項"
                            rows={3}
                            className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                              darkMode 
                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 取り付け設定 */}
                    <div className={`p-4 border rounded-lg ${
                      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`font-medium mb-3 flex items-center gap-2 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        <Wrench size={18} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                        取り付け設定
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>取り付け方法</label>
                          <select
                            value={currentRack.mountingOptions[selectedEquipment.id]?.type || 'none'}
                            onChange={(e) => {
                              const newRack = { ...currentRack };
                              newRack.mountingOptions[selectedEquipment.id] = {
                                ...newRack.mountingOptions[selectedEquipment.id],
                                type: e.target.value
                              };
                              setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
                            }}
                            className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                              darkMode 
                                ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                            }`}
                          >
                            <option value="none">未設定</option>
                            <option value="slide-rail">スライドレール</option>
                            <option value="fixed-rail">固定レール</option>
                            <option value="toolless-rail">ツールレスレール</option>
                            <option value="shelf">棚板設置</option>
                            <option value="direct">直接取付</option>
                          </select>
                        </div>
                        
                        {/* レール詳細設定 */}
                        {['slide-rail', 'fixed-rail', 'toolless-rail'].includes(currentRack.mountingOptions[selectedEquipment.id]?.type) && (
                          <div className={`p-3 border rounded ${
                            darkMode ? 'bg-gray-600/50 border-gray-600' : 'bg-blue-50 border-blue-200'
                          }`}>
                            <h5 className="font-medium mb-2 text-sm">レール設定</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>レール重量制限</label>
                                <select className={`w-full p-1 border rounded text-xs ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                                }`}>
                                  <option value="25kg">25kg (軽量)</option>
                                  <option value="45kg">45kg (標準)</option>
                                  <option value="100kg">100kg (重量)</option>
                                </select>
                              </div>
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>伸長距離</label>
                                <select className={`w-full p-1 border rounded text-xs ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                                }`}>
                                  <option value="600mm">600mm</option>
                                  <option value="700mm">700mm</option>
                                  <option value="800mm">800mm</option>
                                </select>
                              </div>
                            </div>
                            <div className="mt-2">
                              <label className="flex items-center gap-2 text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={currentRack.mountingOptions[selectedEquipment.id]?.hasCableArm || false}
                                  onChange={(e) => {
                                    const newRack = { ...currentRack };
                                    newRack.mountingOptions[selectedEquipment.id] = {
                                      ...newRack.mountingOptions[selectedEquipment.id],
                                      hasCableArm: e.target.checked
                                    };
                                    setRacks(prev => ({ ...prev, [selectedRack]: newRack }));
                                  }}
                                  className="rounded"
                                />
                                ケーブルアーム取り付け
                              </label>
                            </div>
                          </div>
                        )}

                        {/* ゲージナット設定 */}
                        <div className={`p-3 border rounded ${
                          darkMode ? 'bg-gray-600/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <h5 className="font-medium mb-2 text-sm">ゲージナット設定</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>ナットサイズ</label>
                              <select className={`w-full p-1 border rounded text-xs ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300'
                              }`}>
                                <option value="m6">M6 (標準)</option>
                                <option value="m5">M5 (軽量機器)</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>必要数量</label>
                              <input 
                                type="number" 
                                min="4" 
                                max="12" 
                                defaultValue={selectedEquipment.height * 2}
                                className={`w-full p-1 border rounded text-xs ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            推奨: {selectedEquipment.height}Uあたり前面2個・背面2個 = {selectedEquipment.height * 2}個
                          </div>
                        </div>

                        {/* 取り付け状態表示 */}
                        <div className={`p-3 rounded-md border ${
                          darkMode ? 'bg-gray-600/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`text-sm flex items-center gap-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <strong className={darkMode ? 'text-gray-200' : 'text-gray-800'}>取り付け状態:</strong>
                            {(() => {
                              const mounting = currentRack.mountingOptions[selectedEquipment.id] || {};
                              const mountType = mounting.type || 'none';
                              
                              if (mountType === 'none') {
                                return (
                                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                    <XCircle size={16} />
                                    未設定
                                  </span>
                                );
                              } else if (selectedEquipment.needsRails && !['slide-rail', 'fixed-rail', 'toolless-rail'].includes(mountType)) {
                                return (
                                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                                    <AlertCircle size={16} />
                                    レール必須機器
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                    <CircleCheck size={16} />
                                    適切に設定済み
                                  </span>
                                );
                              }
                            })()}
                          </div>
                          
                          {/* 取り付け詳細 */}
                          <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {(() => {
                              const mounting = currentRack.mountingOptions[selectedEquipment.id] || {};
                              const mountType = mounting.type || 'none';
                              
                              const mountingDescriptions = {
                                'slide-rail': 'スライドレール使用 - メンテナンス時引き出し可能',
                                'fixed-rail': '固定レール使用 - 省スペース設置',
                                'toolless-rail': 'ツールレスレール使用 - 簡易着脱',
                                'shelf': '棚板設置 - 非ラックマウント機器用',
                                'direct': '直接取付 - ゲージナット+ネジ固定',
                                'none': '取り付け方法が設定されていません'
                              };
                              
                              return (
                                <div>
                                  {mountingDescriptions[mountType]}
                                  {mounting.hasCableArm && <div>+ ケーブルアーム装備</div>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 電源接続設定 */}
                    {(selectedEquipment.dualPower || currentRack.powerConnections[selectedEquipment.id]) && (
                      <div className={`p-4 border rounded-lg ${
                        darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h4 className={`font-medium mb-3 flex items-center gap-2 ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          <Cable size={18} className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                          電源接続設定
                        </h4>
                        
                        {/* 主電源系統 */}
                        <div className="mb-4">
                          <h5 className={`text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>主電源系統</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>電源種別</label>
                              <select
                                value={currentRack.powerConnections[selectedEquipment.id]?.primaryType || 'pdu'}
                                onChange={(e) => updatePowerConnection(selectedEquipment.id, 'primaryType', e.target.value)}
                                className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                  darkMode 
                                    ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                }`}
                              >
                                <option value="pdu">PDU</option>
                                <option value="ups">UPS</option>
                                <option value="cvcf">CVCF</option>
                                <option value="distribution">分電盤</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>電源機器</label>
                              <select
                                value={currentRack.powerConnections[selectedEquipment.id]?.primarySource || ''}
                                onChange={(e) => updatePowerConnection(selectedEquipment.id, 'primarySource', e.target.value)}
                                className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                  darkMode 
                                    ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                }`}
                              >
                                <option value="" className={darkMode ? 'text-gray-400' : 'text-gray-500'}>未接続</option>
                                {getPowerSources().all.map(source => (
                                  <option key={source.id} value={source.id} className={darkMode ? 'text-white' : 'text-gray-900'}>
                                    {source.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 冗長電源系統（デュアル電源機器のみ） */}
                        {selectedEquipment.dualPower && (
                          <div className="mb-4">
                            <h5 className={`text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>冗長電源系統</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>電源種別</label>
                                <select
                                  value={currentRack.powerConnections[selectedEquipment.id]?.secondaryType || 'pdu'}
                                  onChange={(e) => updatePowerConnection(selectedEquipment.id, 'secondaryType', e.target.value)}
                                  className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                    darkMode 
                                      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                  }`}
                                >
                                  <option value="pdu">PDU</option>
                                  <option value="ups">UPS</option>
                                  <option value="cvcf">CVCF</option>
                                  <option value="distribution">分電盤</option>
                                </select>
                              </div>
                              <div>
                                <label className={`block text-sm font-medium mb-1 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>電源機器</label>
                                <select
                                  value={currentRack.powerConnections[selectedEquipment.id]?.secondarySource || ''}
                                  onChange={(e) => updatePowerConnection(selectedEquipment.id, 'secondarySource', e.target.value)}
                                  className={`w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                    darkMode 
                                      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                  }`}
                                >
                                  <option value="" className={darkMode ? 'text-gray-400' : 'text-gray-500'}>未接続</option>
                                  {getPowerSources().all.map(source => (
                                    <option key={source.id} value={source.id} className={darkMode ? 'text-white' : 'text-gray-900'}>
                                      {source.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 電源ステータス表示 */}
                        <div className={`p-3 rounded-md border ${
                          darkMode ? 'bg-gray-600/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`text-sm flex items-center gap-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <strong className={darkMode ? 'text-gray-200' : 'text-gray-800'}>電源構成ステータス:</strong>
                            {(() => {
                              const connections = currentRack.powerConnections[selectedEquipment.id] || {};
                              const hasPrimary = connections.primarySource;
                              const hasSecondary = connections.secondarySource;
                              
                              if (selectedEquipment.dualPower) {
                                if (hasPrimary && hasSecondary) {
                                  return (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                      <CircleCheck size={16} />
                                      完全冗長化
                                    </span>
                                  );
                                } else if (hasPrimary || hasSecondary) {
                                  return (
                                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                                      <AlertCircle size={16} />
                                      片系統のみ
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                      <XCircle size={16} />
                                      未接続
                                    </span>
                                  );
                                }
                              } else {
                                if (hasPrimary) {
                                  return (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                      <CircleCheck size={16} />
                                      単系統接続
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                      <XCircle size={16} />
                                      未接続
                                    </span>
                                  );
                                }
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* アクションボタン */}
                <div className={`flex gap-3 pt-6 mt-6 border-t ${
                  darkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <button
                    onClick={() => {
                      if (window.confirm('この機器を削除しますか？\n削除すると設定情報も一緒に削除されます。')) {
                        removeEquipment(selectedEquipment.startUnit);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      darkMode 
                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <Trash2 size={16} />
                    機器を削除
                  </button>
                  <button
                    onClick={() => {
                      setShowEquipmentModal(false);
                      setSelectedEquipment(null);
                    }}
                    className={`flex-1 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    設定を保存して閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RackDesigner;