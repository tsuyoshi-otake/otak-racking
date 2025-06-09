# OTAK Racking - データセンターラック設計ツール

[![Deploy to GitHub Pages](https://github.com/tsuyoshi-otake/otak-racking/actions/workflows/deploy.yml/badge.svg)](https://github.com/tsuyoshi-otake/otak-racking/actions/workflows/deploy.yml)

データセンター・サーバールーム向けのラック管理システム。機器の配置、電源管理、冷却計算、ケーブル管理などの包括的な機能を提供します。

## 🌐 ライブデモ

**[https://tsuyoshi-otake.github.io/otak-racking](https://tsuyoshi-otake.github.io/otak-racking)**

GitHub Pages経由で自動デプロイされています。

## ✨ 主な機能

### 基本機能
- **ラック管理**: 42Uラックの視覚化と機器配置
- **機器ライブラリ**: サーバー、ネットワーク機器、ストレージの管理
- **ドラッグ&ドロップ**: 直感的な機器配置操作
- **詳細設定**: 機器の仕様、電源、取り付け情報の管理
- **ズーム機能**: ラックビューの拡大・縮小（50%〜200%）

### 高度な機能
- **レール管理**: ケージナット、レール設置の詳細管理
- **PDU配置**: 電源分配ユニットの配置と管理
- **物理構造**: ラックの物理的構造の詳細設定
- **制約チェック**: 機器配置時の制約検証システム
- **プロモード**: 詳細な制約チェックと専門機能
- **マウント管理**: 機器の取り付け方法と必要部品の管理

### UI/UX
- **ダークモード**: 目に優しい表示モード
- **レスポンシブ**: 様々な画面サイズに対応
- **アクセシビリティ**: キーボード操作とスクリーンリーダー対応
- **ローカルストレージ**: 設定の自動保存

## 🛠️ 技術スタック

- **React** 18.2.0 - UIフレームワーク
- **TypeScript** 4.9.5 - 型安全性
- **Tailwind CSS** 3.3.3 - スタイリング
- **Lucide React** 0.263.1 - アイコンライブラリ
- **Jest** - テストフレームワーク
- **GitHub Actions** - CI/CDパイプライン

## 🚀 インストールと起動

### 必要な環境
- Node.js 18.x以上
- npm または yarn

### セットアップ

1. リポジトリのクローン:
```bash
git clone https://github.com/tsuyoshi-otake/otak-racking.git
cd otak-racking
```

2. 依存関係のインストール:
```bash
npm install
```

3. 開発サーバーの起動:
```bash
npm start
```

4. ブラウザで http://localhost:3000 にアクセス

### その他のコマンド

```bash
# プロダクションビルド
npm run build

# テスト実行
npm test

# テスト（カバレッジ付き）
npm test -- --coverage

# 設定のeject（非推奨）
npm run eject
```

## 📖 使用方法

### 基本操作

1. **機器の追加**: 左サイドバーの機器ライブラリから、ラック内の空いているユニットにドラッグ&ドロップ
2. **機器の移動**: 配置済み機器をドラッグして別のユニットに移動
3. **機器の詳細設定**: 配置済み機器をクリックして詳細モーダルを開く
4. **機器の削除**: 機器右上のゴミ箱アイコンをクリック
5. **ズーム操作**: ツールバーのズームボタンで表示倍率を調整

### ラック設定

- **ラック名の変更**: 右サイドバーでラック名を編集
- **ラック種類の選択**: 42U標準、深型、コンパクトなど
- **環境情報の管理**: 温度、湿度、電源容量の設定
- **フロア設定**: アクセスフロアの設定と管理

### プロモード

プロモードを有効にすると以下の機能が利用可能:
- **詳細制約チェック**: ケージナット、レールの要件チェック
- **物理構造管理**: ラックの詳細な物理構造設定
- **PDU管理**: 電源分配ユニットの詳細配置
- **マウント詳細**: 取り付け方法と必要部品の詳細管理

### 機器ライブラリ

現在サポートされている機器:
- **サーバー**: 1U/2U/4Uサーバー（各種メーカー対応）
- **ネットワーク**: スイッチ、ルーター、ファイアウォール
- **ストレージ**: 2U/4Uストレージアレイ
- **その他**: UPS、PDU、パッチパネル

各機器は以下の情報を含みます:
- 基本仕様（サイズ、重量、消費電力、発熱量）
- エアフロー情報（前面吸気/背面排気など）
- 取り付け要件（レール、ケージナット、シェルフ）
- 電源要件（単電源/冗長電源）

## 🏗️ プロジェクト構成

```
otak-racking/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD
├── public/
│   ├── index.html           # HTMLテンプレート
│   └── favicon.svg          # サーバーラックアイコン
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── EquipmentLibrary.tsx
│   │   ├── RackView.tsx
│   │   ├── RackUnit.tsx
│   │   ├── RailManager.tsx
│   │   └── ...
│   ├── hooks/              # カスタムHooks
│   │   ├── useRackState.ts
│   │   └── useDragAndDrop.ts
│   ├── services/           # ビジネスロジック
│   │   └── EquipmentPlacementManager.ts
│   ├── utils/              # ユーティリティ
│   │   └── localStorage.ts
│   ├── __tests__/          # テストファイル
│   │   ├── equipment/
│   │   ├── integration/
│   │   ├── rail/
│   │   └── unit/
│   ├── App.tsx             # メインアプリケーション
│   ├── types.ts            # TypeScript型定義
│   ├── constants.ts        # 定数定義
│   └── index.tsx           # エントリーポイント
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🧪 テスト

プロジェクトには包括的なテストスイートが含まれています:

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- --testPathPattern="equipment-placement"

# カバレッジレポート生成
npm test -- --coverage
```

### テストカテゴリ
- **Unit Tests**: 個別関数・コンポーネントのテスト
- **Integration Tests**: 複数コンポーネント間の連携テスト
- **Equipment Tests**: 機器配置ロジックのテスト
- **Rail Tests**: レール・マウント機能のテスト

## 🚀 デプロイ

### GitHub Pages（自動デプロイ）

mainブランチへのプッシュ時に自動的にGitHub Pagesにデプロイされます:

1. コードをmainブランチにプッシュ
2. GitHub Actionsが自動実行
3. テスト → ビルド → デプロイの順で処理
4. https://tsuyoshi-otake.github.io/otak-racking で公開

### 手動デプロイ

```bash
# ビルド
npm run build

# buildフォルダの内容を任意のWebサーバーにデプロイ
```

## 🏛️ アーキテクチャ

### 設計パターン
- **コンポーネント構成**: プレゼンテーション層とビジネスロジック層の分離
- **状態管理**: React Hooks（useRackState, useDragAndDrop）
- **制約システム**: PlacementConstraintによる拡張可能な制約チェック
- **型安全性**: TypeScriptによる完全な型定義

### 主要サービス
- **EquipmentPlacementManager**: 機器配置の制約チェックと実行
- **LocalStorageUtils**: 設定の永続化
- **RackIcons**: アイコン管理

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン
- TypeScriptの型定義を適切に行う
- テストを追加する（カバレッジ80%以上を目標）
- コミットメッセージは`.commit_template`に従う
- ESLintとPrettierの設定に従う

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 👨‍💻 作者

**tsuyoshi-otake**

- GitHub: [@tsuyoshi-otake](https://github.com/tsuyoshi-otake)
- Project Link: [https://github.com/tsuyoshi-otake/otak-racking](https://github.com/tsuyoshi-otake/otak-racking)

## 🙏 謝辞

- React チーム - 素晴らしいフレームワークの提供
- Tailwind CSS チーム - 効率的なスタイリングシステム
- Lucide チーム - 美しいアイコンライブラリ