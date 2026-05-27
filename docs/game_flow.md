# minigame004 Game Flow Specification

## Purpose

This document fixes the currently adopted screen structure, screen responsibilities, removed screens, and navigation flow for `minigame004`.

This is a planning specification. It is not a React implementation plan.

The game is not primarily an enemy-defeat RPG. It is a desire-management link puzzle where the player repeatedly thinks:

> あと1チェインだけ...

The flow must preserve Battle heat while giving the player a calm place to review risk between Battles.

## Scope

This document fixes:

- Current screen list.
- Screen responsibilities.
- Navigation.
- Modal responsibility.
- Battle flow.
- Reward flow.
- Settlement flow.
- Removed screens and cleanup policy.

This document does not define:

- CSS details.
- Component split.
- Sprite final implementation.
- Asset pipeline optimization.

## Current Navigation Flow

```txt
Title
↓
Home
↓
Map
↓
Battle
  ↓
  RewardModal（overlay）
↓
Map
↓
Boss Battle
↓
Settlement
↓
Result
↓
Home
```

## Adopted Screens

### Title

Responsibility:

- 起動.
- 世界観提示.
- START導線.
- 初回asset preload.
- 小型背景演出.

Structure:

```txt
- TitleScreen / title
  ├ ゲームタイトル
  ├ 世界観コピー
  ├ 契約書風UI
  ├ 「あと1チェインだけ…！」
  │
  ├ START
  │
  ├ 小型背景演出
  │   ├ ピース浮遊
  │   ├ chain line
  │   ├ debt gauge pulse
  │   └ 青紫発光
  │
  ├ 初回ロード演出
  │   ├ loading progress bar
  │   ├ preload %
  │   ├ 「契約確認中...」
  │   ├ 「魔力計算中...」
  │   └ asset preload
  │
  └ START → Home
```

Navigation:

- START -> Home.

Rules:

- Preload is contained inside Title.
- Title does not route to CharacterSelectScreen.
- Title should be lightweight after initial load.

### Home

Responsibility:

- ハブ画面.
- プレイ導線.
- 契約確認.
- 実績.
- 設定.
- 現在build確認.

Structure:

```txt
- HomeScreen / home
  ├ 現在build確認
  │   ├ 現在キャラ / 固定キャラ
  │   ├ 所持契約
  │   ├ 現在利益
  │   └ 現在借金
  │
  ├ プレイ導線
  │   └ Mapへ進む
  │
  ├ MENU
  │   ├ 遊び方
  │   ├ 実績
  │   ├ 設定
  │   └ Ver表示
  │
  └ MapScreenへ遷移
```

Navigation:

- Play / Continue -> Map.
- Result -> Home.

Rules:

- Home is the place for non-Battle utility.
- Home may later host character/build changes.
- Home should not interrupt Battle reward flow.

### Map

Responsibility:

- 現在状況確認.
- ステージ選択.
- リスク確認.
- 報酬傾向確認.

Structure:

```txt
- MapScreen / map
  ├ 現在利益
  ├ 現在借金
  ├ 予測最終利益
  ├ 借金暴走度
  │
  ├ ステージノード一覧
  │   ├ 通常戦
  │   ├ 小ボス
  │   ├ 中ボス
  │   └ ラスボス
  │
  ├ 現在地ノード
  │   └ 画面中央より少し下
  │
  ├ 選択中ステージ詳細
  │   ├ ステージ種別
  │   ├ STAGE番号
  │   ├ 誘惑文
  │   ├ 危険度
  │   ├ 報酬傾向
  │   └ 進む
  │
  ├ bottom sheet型詳細UI
  └ BattleScreenへ遷移
```

Navigation:

- Current node detail -> Battle.

Rules:

- Map is the calm risk review screen.
- Current node appears slightly below screen center.
- Long node details are shown in a bottom sheet, not permanently on the map.
- Map shows the economic information that RewardModal intentionally omits.

### Battle

Responsibility:

- メインゲームプレイ.
- 6×6 puzzle.
- chain.
- debt gauge.
- overdrive.
- selecting popover.

Structure:

```txt
- BattleScreen / battle
  ├ PLAYER HP
  ├ ENEMY HP
  ├ 敵名
  ├ 小型キャラスプライト
  │   ├ レント
  │   ├ ルノン
  │   └ 敵
  │
  ├ debt gauge
  │   ├ 青
  │   ├ 黄
  │   ├ 赤
  │   └ 黒 / overdrive
  │
  ├ 6×6 puzzle board
  │   ├ 5色ピース
  │   ├ selected glow
  │   ├ overdrive glow
  │   ├ chain line
  │   └ pointer trace
  │
  ├ selecting中popover
  │   ├ 今離す
  │   ├ 伸ばすと
  │   └ あとNマスで BONUS
  │
  ├ release演出
  │   ├ cast
  │   ├ sparkle
  │   ├ damage popup
  │   ├ debt popup
  │   └ profit popup
  │
  ├ 契約アイコン
  ├ overdrive演出
  ├ 撃破演出
  │
  └ RewardModal表示
```

Navigation:

- Normal or boss defeat -> RewardModal overlay on top of Battle.
- Last boss defeat -> Settlement.
- Player defeat -> Result.

Rules:

- Battle should not transition to a separate reward screen after normal victories.
- Battle heat is preserved by showing RewardModal as an overlay.
- The 6x6 board, debt gauge, selecting popover, and chain line are the highest-priority UI elements.

### RewardModal

Responsibility:

- Battle後の報酬選択.
- overlay表示.
- Battle熱量維持.

Structure:

```txt
- RewardModal / reward
  ├ 「撃破！」
  ├ 契約カード3択
  │   ├ card1
  │   ├ card2
  │   └ card3
  │
  ├ 現在の契約シナジー
  ├ 現在のビルド傾向
  ├ スキップ
  │
  └ 閉じる → MapScreen
```

Navigation:

- Choose one or skip -> close overlay -> Map.

Rules:

- RewardModal is a modal overlay, not a full screen.
- RewardModal appears after Battle victory except final Settlement flow.
- RewardModal must be compact enough for smartphone play and ad reserve.
- RewardModal intentionally does not replace Map's risk review role.

### Settlement

Responsibility:

- 精算.
- 利息徴収.
- 借金徴収.
- 最終利益表示.

Structure:

```txt
- SettlementScreen / settlement
  ├ 魔力契約書
  ├ 請求明細
  ├ 総利益
  ├ 利息徴収
  ├ 借金徴収
  ├ 契約ボーナス
  ├ 最終利益
  ├ CLEAR
  ├ BANKRUPT
  │
  ├ 精算演出
  │   ├ 利益count up
  │   ├ 利息徴収
  │   ├ 借金減算
  │   └ 最終利益表示
  │
  └ ResultScreenへ
```

Navigation:

- Continue -> Result.

Rules:

- Boss defeat does not mean clear.
- Final profit > 0 means clear.
- Final profit <= 0 means bankrupt.

### Result

Responsibility:

- run結果表示.
- 最大chain.
- 最大借金.
- 使用契約.
- 再挑戦.

Structure:

```txt
- ResultScreen / result
  ├ RESULT
  ├ 最終利益
  ├ 最大チェイン
  ├ 最大借金
  ├ 到達ステージ
  ├ 使用契約一覧
  ├ CLEAR / BANKRUPT結果
  │
  ├ 再挑戦
  └ Homeへ戻る
```

Navigation:

- Retry -> Map or Home depending on retry design.
- Return -> Home.

### Common Overlay / System

Responsibility:

- Protect gameplay UI from OS safe area, browser chrome, and ads.
- Stop input and game progression during ads.

Structure:

```txt
- Common Overlay / system
  ├ SafeArea
  ├ Header Reserve
  ├ Bottom Banner Reserve
  ├ Mock Ad Overlay
  ├ isAdShowing
  ├ input lock
  ├ pause game loop
  └ resume game loop
```

## Battle Flow

```txt
idle
↓
pointer down on piece
↓
selecting
  - show chain line
  - show selecting popover
  - glow selected pieces
↓
pointer release
↓
release
  - hide popover
  - resolve chain
  - clear pieces
  - play cast/sparkle/popups
↓
result
  - add profit
  - add debt
  - apply damage
  - enemy action if alive
↓
idle / RewardModal / Settlement / Result
```

## Reward Flow

```txt
Battle
↓
撃破！
↓
RewardModal
↓
契約選択 or スキップ
↓
Map
```

Rules:

- Reward is an overlay, not a full screen transition.
- Display exactly three cards.
- Skip must be available.
- Do not show four choices in MVP UI.

## Settlement Flow

```txt
Last boss defeated
↓
Settlement
  1. show total profit
  2. collect interest
  3. collect debt
  4. apply contract bonus
  5. show final profit
  6. judge CLEAR / BANKRUPT
↓
Result
```

## Removed Screens

The following screens are not part of the current adopted flow:

- CharacterSelectScreen.
- InterimReportScreen.
- FinalContractScreen.

## Removed Screen Reasons

### CharacterSelectScreen

Reason:

- 起動テンポを悪くする.
- 現時点ではキャラ固定でよい.
- 将来的にはHome/Menu側で変更.

Allowed to keep:

- Character data definitions for future expansion.
- Character effect data if already used by balance logic.

Not allowed in current UX:

- A separate character selection step before Map.
- START -> CharacterSelectScreen routing.

### InterimReportScreen

Reason:

- Battle後の熱量を切る.
- RewardModalで代替可能.
- 情報量過多.

Replacement responsibility:

- Map shows current profit, debt, predicted final profit, and debt overdrive.
- RewardModal handles the immediate post-victory contract choice.

### FinalContractScreen

Reason:

- 最後に追加選択を入れる必要性が薄い.
- 欲張り感情はBattle中に完結する.
- Boss後はSettlement直行の方が気持ち良い.

Replacement responsibility:

- Last boss defeat goes directly to Settlement.

## Implementation Guardrails For Later

When implementation begins, changes should follow this order:

1. Add Home as the hub.
2. Remove obsolete routing.
3. Convert reward from screen to overlay.
4. Preserve existing Battle mechanics.
5. Keep SafeArea/ad reserve behavior intact.
6. Then simplify layout and components.

Do not begin broad CSS polish or sprite finalization before this flow is reflected in code.
