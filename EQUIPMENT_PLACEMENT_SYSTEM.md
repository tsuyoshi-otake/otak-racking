# 機器設置システム v2.0

## 概要

OTAKラック設計システムに新しい機器設置管理システムを導入しました。このシステムは従来の問題を解決し、より堅牢で拡張性のある機器配置機能を提供します。

## 主な改善点

### 1. 2Uサーバー配置問題の修正

**従来の問題：**
- 3-4Uに2Uサーバー設置後、1-2Uに別の2Uサーバーが設置できない
- 機器の占有チェックが不正確
- 設置ロジックが複雑で予測困難

**修正内容：**
- 新しい`EquipmentPlacementManager`クラスで統一された配置ロジック
- 正確な占有状況管理
- 機器の`startUnit`、`endUnit`、`isMainUnit`プロパティの適切な管理

### 2. 制約ベースの検証システム

**制約の種類：**
1. **ユニット範囲制約** - ラック容量内での配置
2. **容量制約** - 重量制限チェック
3. **占有制約** - 既存機器との重複チェック
4. **棚板要求制約** - 神棚などの特殊機器
5. **ゲージナット制約** - 取り付け要件チェック

**優先度システム：**
```typescript
// 制約は優先度順に実行される
const constraints = [
  { id: 'unit-range', priority: 1 },      // 最優先
  { id: 'capacity', priority: 2 },
  { id: 'occupancy', priority: 3 },
  { id: 'shelf-requirement', priority: 4 },
  { id: 'cage-nut', priority: 5 }
];
```

### 3. 詳細なエラー・警告システム

**エラーレベル：**
- **error**: 設置不可能（必須制約違反）
- **warning**: 設置可能だが注意が必要

**例：**
```typescript
// ゲージナット不足の警告
{
  code: 'CAGE_NUT_MISSING',
  message: 'ユニット 1 にゲージナットが不足しています',
  affectedUnits: [1],
  suggestion: '自動設置オプションを有効にするか、事前にゲージナットを設置してください'
}
```

### 4. 自動ゲージナット設置

**機能：**
- `autoInstallCageNuts`オプションで自動設置
- レール不要機器に対応
- 棚板や神棚などは除外

**使用例：**
```typescript
const result = await placementManager.placeEquipment(rack, 1, equipment, {
  autoInstallCageNuts: true  // 自動設置を有効化
});
```

## API仕様

### EquipmentPlacementManager

#### placeEquipment()
```typescript
async placeEquipment(
  rack: Rack,
  startUnit: number,
  equipment: Equipment,
  options: PlacementOptions = {}
): Promise<PlacementResult>
```

**オプション：**
- `validateOnly`: 検証のみ実行
- `autoInstallCageNuts`: 自動ゲージナット設置
- `skipWarnings`: 警告を無視
- `forceOverride`: 強制設置

#### removeEquipment()
```typescript
async removeEquipment(rack: Rack, unit: number): Promise<PlacementResult>
```

#### validatePlacement()
```typescript
async validatePlacement(context: PlacementContext): Promise<PlacementValidation>
```

### Utils関数

#### canPlaceEquipmentAdvanced()
```typescript
async canPlaceEquipmentAdvanced(
  rack: Rack,
  startUnit: number,
  equipment: Equipment
): Promise<{ canPlace: boolean; reason?: string; warnings?: string[] }>
```

## テストカバレッジ

### 基本配置テスト
- ✅ 1Uサーバーの配置
- ✅ 2Uサーバーの配置
- ✅ 複数機器の配置

### 2Uサーバー問題修正確認
- ✅ 3-4Uに2Uサーバー設置後、1-2Uに別の2Uサーバー設置
- ✅ 2-3Uに2Uサーバー設置後、1Uに1Uサーバー設置
- ✅ 占有チェックの正確性

### 制約チェックテスト
- ✅ ラック容量超過の拒否
- ✅ 無効なユニット番号の拒否
- ✅ 占有ユニットへの配置拒否

### 特殊機器テスト
- ✅ 神棚の棚板要求チェック
- ✅ 棚板上への神棚設置

### 自動機能テスト
- ✅ 自動ゲージナット設置
- ✅ 機器削除時の関連設定削除

## パフォーマンス

### 制約チェック最適化
- 優先度順実行で早期終了
- 非同期処理でUI応答性維持
- メモリ効率的な状態管理

### 変更履歴追跡
```typescript
interface PlacementChange {
  type: 'equipment' | 'cagenut' | 'power' | 'mounting' | 'label';
  action: 'add' | 'remove' | 'update';
  target: string;
  oldValue?: any;
  newValue?: any;
}
```

## 互換性

### 後方互換性
- 既存の`canPlaceEquipment`関数は同期版として維持
- 既存のラックデータ構造をそのまま使用
- 段階的な移行が可能

### 新機能への移行
```typescript
// 従来（同期版）
const result = canPlaceEquipment(rack, unit, equipment);

// 新版（非同期版、高機能）
const result = await canPlaceEquipmentAdvanced(rack, unit, equipment);
```

## 今後の拡張予定

### 1. AIベース配置提案
- 最適配置アルゴリズム
- 冷却効率最適化
- 電源効率最適化

### 2. 3Dビジュアライゼーション
- 立体的な配置確認
- 干渉チェック
- ケーブル配線可視化

### 3. 規制準拠チェック
- データセンター標準
- 安全規格準拠
- 環境規制対応

## 使用方法

### 基本的な機器設置
```typescript
import { placementManager } from './services/EquipmentPlacementManager';

// 機器設置
const result = await placementManager.placeEquipment(rack, 1, server, {
  autoInstallCageNuts: true
});

if (result.success) {
  console.log('設置完了:', result.appliedChanges);
} else {
  console.error('設置失敗:', result.validation.errors);
}
```

### 設置前の検証
```typescript
// 検証のみ実行
const validation = await placementManager.placeEquipment(rack, 1, server, {
  validateOnly: true
});

if (validation.success) {
  // 実際の設置を実行
  await placementManager.placeEquipment(rack, 1, server);
}
```

### カスタム制約の追加
```typescript
// 新しい制約を定義
const customConstraint: PlacementConstraint = {
  id: 'custom-rule',
  name: 'カスタムルール',
  priority: 10,
  validate: (rack, position, equipment) => {
    // カスタム検証ロジック
    return { isValid: true, errors: [], warnings: [] };
  }
};

// 制約を追加（将来の拡張機能）
manager.addConstraint(customConstraint);
```

## トラブルシューティング

### よくある問題

**Q: 2Uサーバーが設置できない**
A: 以下を確認してください：
1. 対象ユニットが空いているか
2. ラック容量を超えていないか
3. ゲージナットが設置されているか（`autoInstallCageNuts: true`を試す）

**Q: 警告が表示されて設置できない**
A: 以下のオプションを試してください：
- `skipWarnings: true` - 警告を無視
- `autoInstallCageNuts: true` - ゲージナット自動設置

**Q: 機器削除後も占有状態が残る**
A: `removeEquipment`関数を使用してください。これにより関連設定も正しく削除されます。

## 貢献

バグ報告や機能要望は、GitHubのIssueでお知らせください。テストの追加や新機能の実装も歓迎します。

## ライセンス

このプロジェクトは既存のOTAKラック設計システムのライセンスに従います。