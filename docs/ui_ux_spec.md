# minigame004 UI / UX Specification

## Purpose

This document fixes the current UI/UX rules before implementation work continues.

This is a planning specification. It is not a React implementation plan.

It exists to prevent layout, screen count, information density, SafeArea, and ad behavior from drifting during future work.

## Core UX

This game is not:

```txt
「敵を倒すRPG」
```

It is:

```txt
「あと1チェインだけ…」
```

The core emotion is:

```txt
あと1チェイン伸ばしたい
↓
でも借金が危険
↓
いや、行く
↓
助かった...！！
```

Every UI decision should support this feeling.

## Screen UX Summary

### Title

UX role:

- Introduce the world and contract/debt fantasy.
- Run preload inside the title experience.
- Send the player to Home with START.

Must avoid:

- Routing to CharacterSelectScreen.
- Adding dense menu panels before the first start.

### Home

UX role:

- Hub screen.
- Start or continue play.
- Review current build.
- Access contracts, achievements, settings, and version information.

Must avoid:

- Becoming another dense RPG management screen.
- Interrupting the Battle -> RewardModal -> Map loop.

### Map

UX role:

- Current situation review.
- Stage selection.
- Risk confirmation.
- Reward tendency confirmation.

Map is:

```txt
「現在状況を冷静に見る画面」
```

### Battle

UX role:

- Main "あと1チェインだけ..." experience.
- Make tracing, temptation, release, and debt gain feel immediate.

### RewardModal

UX role:

- Preserve Battle heat after victory.
- Offer a risky 3-card contract choice without a full screen transition.

### Settlement

UX role:

- Resolve the whole run.
- Show that boss defeat is not equal to survival.

### Result

UX role:

- Summarize the run.
- Encourage retry or return to Home.

## Battle Priority

Battle must prioritize:

```txt
1. 6×6盤面
2. debt gauge
3. selecting popover
4. chain line
5. piece glow
6. overdrive
```

Characters are not the main subject. They are support FX that encourage greed.

If the screen is cramped, reduce these:

```txt
- キャラ演出
- HUD
- 装飾
- 余白
```

Do not reduce the core board experience:

```txt
6×6盤面は絶対守る
```

## Battle UI

### Always Visible

- PLAYER HP.
- ENEMY HP.
- Enemy name.
- Debt gauge.
- 6x6 puzzle board.
- Small contract icons.

### Conditional During Selecting

Only while the player is tracing pieces:

- Chain line.
- Selected piece glow.
- Selecting popover.
- Pointer trace feeling.

Selecting popover content:

```txt
あとNマスで X CHAIN BONUS

今離す
利益 +...
借金 +...

伸ばすと
利益 +...
借金 +...
```

Rules:

- The popover appears only during selecting.
- It disappears immediately on release.
- It must not cover the full board.
- It should tempt, not explain.

### Release / Result FX

After release:

- Hide selecting popover.
- Clear selected pieces.
- Play cast FX.
- Show sparkle.
- Show profit popup.
- Show debt popup.
- Show damage popup.
- Reflect HP and debt changes quickly.

Tempo:

- Do not stall the player.
- Resolve quickly enough to keep Battle heat.

### Overdrive

Debt black state is not only danger. It is a fever state.

Overdrive should emphasize:

- Stronger debt gauge glow.
- Purple/blue pulse.
- Piece glow.
- Stronger chain line.
- Profit feeling.

Avoid:

- Horror tone.
- Blood or gore.
- Red/black-only presentation.
- Screen-covering special attacks.

## Reward UX

Reward is not a screen transition.

Reward uses:

```txt
RewardModal overlay
```

Reward flow:

```txt
Battle
↓
撃破！
↓
RewardModal
↓
契約選択
↓
Map
```

### RewardModal Display

```txt
- 撃破！
- 契約カード3択
- 現在の契約シナジー
- 現在のビルド傾向
- スキップ
```

### RewardModal Does Not Display

```txt
- 現在利益
- 現在借金
- 予測最終利益
- debt gauge
```

These are reviewed on Map.

Rules:

- Do not show four cards.
- Avoid long text.
- If details are needed, use tap detail later.
- RewardModal closes to Map after choose/skip.
- RewardModal must not push Battle layout down.
- RewardModal must stay inside SafeArea and ad reserve.

## Map UX

Map is:

```txt
「現在状況を冷静に見る画面」
```

### Map Display

```txt
- 現在利益
- 現在借金
- 予測最終利益
- 借金暴走度
```

### Map Layout

- 現在地ノードは画面中央より少し下.
- bottom sheet型詳細UI.
- 片手操作優先.
- 親指到達性優先.

### Node Detail

Node detail is shown in a bottom sheet after selecting the current node.

Contains:

- Stage type.
- Stage number.
- Temptation copy.
- Danger.
- Reward tendency.
- Proceed button.

Rules:

- Do not show all node details permanently.
- Current node should glow more strongly.
- Unavailable nodes should be darker and quieter.
- Boss nodes should be larger/special, but not horror.

## Overlay Responsibilities

Overlay types:

- RewardModal.
- Mock fullscreen ad.
- Future detail modal.

Rules:

- Overlay should not mutate layout behind it.
- Overlay must trap or block input while active.
- Overlay close must return to a safe state.
- If overlay appears during selecting, selecting is cancelled and popover is hidden.

RewardModal is the only gameplay reward overlay in the current adopted flow.

## Safe Area And Ad Reserve

This game assumes ads are present.

Required:

```txt
- 上部header reserve
- 下部banner reserve
- safe area
- popup/interstitial ad interruption
```

The UI must assume:

1. Top app/browser/ad SDK header area.
2. Bottom persistent banner ad.
3. Possible popup/fullscreen/modal ad interruption.

### Required Regions

```txt
[Top Safe Area / Header Reserve]
[Game Content Area]
[Bottom Banner Ad Reserve]
[Bottom Safe Area / Home Indicator]
```

Important UI must never be behind ads or OS safe area:

- 6x6 board.
- Chain operation area.
- Selecting popover.
- Debt gauge.
- PLAYER HP / ENEMY HP.
- Contract icons.
- Reward choice buttons.
- Progression buttons.
- Profit/debt/currency display.

### Required CSS Concepts For Later

- `100dvh` / `100svh`.
- `env(safe-area-inset-top)`.
- `env(safe-area-inset-bottom)`.
- Header reserve height.
- Banner reserve height.
- No important CTA at the physical screen edge.

### Header Reserve

Responsibility:

- Protect game UI from app/browser/ad SDK header areas.
- Keep HP, Map state, and Title/Home content below the unsafe top area.

### Bottom Banner Reserve

Responsibility:

- Protect CTAs, contract icons, reward buttons, and result buttons from a persistent banner ad.
- The banner reserve is always assumed to exist, even if a real ad SDK is not installed yet.

## Ad Interruption

During popup/fullscreen ad:

```js
isAdShowing = true
```

When `isAdShowing` is true:

```txt
- input停止
- timer停止
- battle停止
- reward停止
- pointer停止
```

Also:

- Cancel current selecting safely.
- Hide selecting popover.
- Clear chain path.
- Release pointer capture if needed.

After ad closes:

- Set `isAdShowing = false`.
- Resume from a safe state.
- Prefer returning Battle to idle if the ad interrupted selecting.

## Smartphone Operation Constraints

Required:

```txt
- pointercancel対応
- iOS swipe誤爆防止
- Android edge swipe誤爆防止
- overscroll制御
- touch-action調整
```

Important:

```txt
ピースselect中に、
ブラウザgestureでゲームが壊れないこと。
```

Battle board must support:

- Pointer events.
- Touch operation.
- Mouse drag operation.

Must avoid:

- Browser back gesture.
- Pull-to-refresh.
- Touch cancel leaving stale chain state.
- iOS edge swipe breaking selecting.
- Android edge swipe breaking selecting.

Required behavior:

- Board uses `touch-action: none`.
- Board uses `overscroll-behavior: contain` or stricter during Battle.
- Selecting calls `preventDefault`.
- `pointercancel` clears selecting state.
- If ad appears during selecting, treat it like cancel.

Battle input responsibilities:

- `pointerdown` starts selecting only if no overlay/ad is active.
- `pointermove` updates the chain only while selecting.
- `pointerup` confirms the chain immediately.
- `pointercancel` returns to idle safely.

There is no "confirm chain" button in Battle.

## Smartphone Layout Rules

- 9:16 vertical smartphone is the base.
- PC browser should center the smartphone ratio.
- Small devices should scroll only where the screen design allows it.
- Battle should avoid body scroll during puzzle operation.
- No horizontal scroll.
- CTAs must remain reachable above banner reserve.

## Information Density Rules

Use three layers:

### Always Visible

Only information required for the current decision.

### Conditional

Information needed during a temporary action, such as selecting.

### Detail

Bottom sheets, modal details, or future tap-to-expand.

Avoid turning Battle into an explanation screen.

## Not Implementing Yet

Do not start these yet:

```txt
- React大規模実装
- component大量分割
- CSS polish
- sprite最終差し替え
- asset pipeline最適化
```

Current priority:

```txt
仕様固定
```
