# minigame004 Asset / Visual Generation Specification

## Purpose

This document fixes the visual and asset generation rules for `minigame004`.

All future UI, sprites, FX, and generated assets must follow the attached reference:

```txt
スプライトデザインシート（参考デザイン）
ドット絵 / HD-2D風 / スマホ縦画面 9:16想定
```

Treat this reference sheet as the official visual baseline for the project.

## Most Important Rule

When creating, editing, generating, or integrating any of the following, match the reference design sheet:

```txt
- UI
- スプライト
- パズルピース
- チェインライン
- 借金ゲージ
- selecting中popover
- 契約アイコン
- 報酬カード
- FX
- 背景
- バトル演出
```

New assets must not look like they belong to a different game.

## Reference Elements

Use these elements from the design sheet as the visual standard:

```txt
- 64x64ベースの小型ドットキャラ
- 2Dドット絵 / HD-2D風
- 黒UI
- 青 / シアン / 紫の発光
- 太めアウトライン
- 高コントラスト
- 小型でも読みやすいシルエット
- 5色パズルピースの丸角・光沢
- selected glow の外周発光
- overdrive時の紫青発光
- chain line の青白発光
- 借金ゲージ4段階
- selecting中popover
- 契約アイコン
- 暗め背景
- スマホRPG感
```

## Visual Direction

Adopt:

```txt
- 2D pixel art
- HD-2D inspired
- casual smartphone RPG
- dark navy / black UI
- cyan glow
- purple glow
- glossy pixel pieces
- readable icon design
- thick dark outline
- compact character sprites
- game asset first
```

Avoid anything that makes the game feel like horror, debt collection flyers, realistic 3D, or a different genre.

## Gameplay Visual Priority

This game is not:

```txt
「敵を倒すRPG」
```

It is:

```txt
「あと1チェインだけ…」
```

The visual subject priority is:

```txt
1. 6×6盤面
2. chain line
3. debt gauge
4. selecting中popover
5. piece glow
6. overdrive
```

Characters are support FX. They should encourage greed, but they must not dominate the board.

## Puzzle Piece Rules

The five puzzle pieces must follow the reference sheet direction:

```txt
- blue water
- green leaf
- yellow light/star
- red fire
- purple magic/swirl
```

Design requirements:

```txt
- 丸角
- 光沢あり
- 太めアウトライン
- 高コントラスト
- 64x64でも判別可能
- 通常時は静か
- selecting時は外周発光
- overdrive時は紫青の脈動
```

## Chain Line Rules

Chain line is a core pleasure element.

Required:

```txt
- 青白発光
- 太め
- 視認性高め
- 選択中ピースを気持ちよく接続
- 長チェインほど少し強く発光
- overdrive時は紫青発光を追加
```

Do not cover too much of the board.

## Debt Gauge Rules

Debt gauge has four states:

```txt
1. 青
2. 黄
3. 赤
4. 黒
```

Important:

```txt
黒状態は「危険」ではなく「覚醒 / フィーバー」
```

Black gauge visuals should use purple/blue glow and make the player want to continue, even though it is risky.

## Selecting Popover Rules

The selecting popover is a temporary temptation UI.

It appears only while selecting pieces.

Expected runtime content:

```txt
今離す：
利益 +xxx
借金 +xxx

伸ばすと：
利益 +xxx
借金 +xxx

あとNマスで BONUS
```

Design requirements:

```txt
- 黒UI
- 青 / 紫ネオン枠
- 文字はReact側で載せる
- 画像には文字を焼き込まない
- 盤面を邪魔しない
- 小さくても読める
```

## Character Sprite Rules

Character sprites follow the sheet's compact 64x64 scale.

General rules:

```txt
- 64x64ベース
- 小型
- 太めアウトライン
- 横向きバトル
- 盤面を邪魔しない
- 常時派手にしない
```

### Rent

```txt
- 黒髪
- 紫魔導書
- 青白魔力
- selecting中に目や本が発光
- overdrive時は紫青オーラ
```

### Lunon

```txt
- 小型サポート妖精
- 青 / シアン発光
- selecting中に活性化
```

### Enemy

```txt
- 小型敵スプライト
- 主役化しない
- hit / defeat だけ分かればよい
```

## UI Generation Rules

UI follows the reference sheet's black UI with blue/purple glow.

Required:

```txt
- 黒 / 濃紺ベース
- 青紫ネオン
- 太め枠
- 高コントラスト
- 情報量少なめ
- スマホ縦画面で読みやすい
```

Forbidden:

```txt
- 長文を常時表示
- ボーナス一覧の常時表示
- UI過密
- 盤面を圧迫する装飾
```

## Background Rules

Backgrounds are not the subject.

Use:

```txt
- 暗め
- 魔力回廊
- 魔法都市
- 契約路
- 青紫の控えめ発光
- 盤面の視認性を邪魔しない
```

Do not push toward horror.

## Image Generation Rules

When generating assets:

```txt
- 1アセット1画像を基本にする
- デザインシート形式にしない
- 文字を焼き込まない
- file_name / size / label を画像内に入れない
- UIフレームは空欄にする
- React側で文字を載せる
- 透過PNG前提
- image-rendering: pixelated 前提
```

## Sprite Sheet Rules

When converting to sprite sheets:

```txt
- 横一列
- 各フレーム同サイズ
- no padding
- no margin
- PNG
- transparent
```

Examples:

```txt
piece_normal_5color_64x64_5f.png
rent_idle_64x64_4f.png
chain_line_short.png
```

## Codex Processing Policy

If ChatGPT-generated images are not implementation-ready, Codex should process them.

Current practical route:

```txt
ChatGPT画像生成
↓
tools/sprite_pipeline.py
↓
背景除去 / auto crop / 64x64 fit
↓
横一列sprite sheet化
↓
assets/images/ または public/assets/ へ出力
↓
manifest / React 接続
```

Before custom processing, check whether Game Studio / sprite-pipeline utilities are available.

If unavailable, use:

```txt
tools/sprite_pipeline.py
```

## Forbidden Directions

Do not use:

```txt
- ホラー
- 血
- グロ
- 闇金チラシ風
- 赤黒過多
- 写実
- 3Dレンダー
- キャラ巨大化
- 盤面を覆う必殺技
- 常時派手すぎる演出
- 読めない細かすぎる装飾
- UIに文字を焼き込む
- デザインシートをそのまま実装素材扱いする
```

## MVP Asset Priority

Generate and integrate in this order:

```txt
1. 5色パズルピース normal
2. 5色パズルピース selected glow
3. 5色パズルピース overdrive
4. chain line
5. debt gauge 4 state
6. selecting popover
7. clear sparkle
8. profit / debt / damage popup
9. contract icons
10. rent / lunon / enemy MVP sprites
```

## Final Rule

The attached reference design sheet is the official visual baseline for `minigame004`.

Every new UI, asset, FX, and sprite must match its:

```txt
- ドット密度
- 発光量
- アウトライン太さ
- 色設計
- UIの黒基調
- 青紫ネオン
- 小型スプライト感
- スマホRPG感
```

Assets that look like another game are not allowed.
