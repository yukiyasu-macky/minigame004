# MVP Sprite / UI / FX Asset Plan

## Source Status

- Primary visual reference: attached design sheet image, `ChatGPT Image 2026年5月26日 17_39_41.png`.
- Requested local source: `docs/design_sheet.md`.
- Current repository status: `docs/design_sheet.md` is not present in the repo at planning time.
- Game Studio plugin/skill: searched through available tools; no Game Studio plugin or skill is currently available in this Codex environment.

Because the local markdown source is missing, this plan treats the attached design sheet and the user's implementation instruction as the authoritative design source. The missing file is tracked in `TODO.md`.

## Design Direction

- 2D pixel / HD-2D inspired mobile RPG UI.
- 9:16 portrait smartphone layout.
- Black UI panels with blue, cyan, and purple neon glow.
- Casual RPG readability, not horror and not loan-shark flyer style.
- Board, chain line, debt gauge, and selecting popover are the priority visual elements.
- Character sprites support the temptation loop but must not dominate the board.
- Normal state should stay calm; glow intensifies only during selecting, long chains, and overdrive.

## Engine And Implementation

- Existing stack: React + Vite + CSS.
- Use existing React state and board structure.
- Use CSS sprite animation and SVG overlays.
- Do not introduce Canvas or a second renderer.
- Asset paths in the manifest are planned under `assets/images/`.
- Runtime implementation can later copy finalized PNGs into `public/assets/...` or load through a small asset loader if the project chooses to keep source assets in root `assets/images/`.

## Production Flow

1. Create asset manifest and reusable image prompts.
2. Generate or draw MVP transparent PNG assets in batches.
3. Save source/generated PNG files under `assets/images/` using manifest file names.
4. Move runtime-ready assets to `public/assets/...` or wire a build-time loader.
5. Replace CSS placeholder sprites with PNG sprite sheets.
6. Verify battle screen on 360x640, 390x844, and 430x932.
7. Tune glow opacity and animation timing after real-device testing.

## Asset Batch Order

1. Battle essentials:
   - Puzzle pieces, chain line, selected glow, debt gauge, popover.
2. Character MVP:
   - Rent idle, chain_select, cast, overdrive, hit.
   - Lunon idle_fly, chain_hype.
   - Enemy paladin idle, hit, defeat.
3. UI/HUD:
   - HP bars, contract frames, turn badge, chain counter.
4. Contract icons:
   - Core contract set first, then extended pool.
5. Stage/background:
   - Battle background variants after the board and HUD are stable.

## Reusable Prompt Rules

All prompts should include:

- Transparent PNG sprite asset.
- 2D pixel art, HD-2D inspired, weak antialiasing.
- Smartphone RPG UI readability.
- Thick dark outline, high contrast, blue/cyan/purple glow.
- No blood, no gore, no horror, no photorealism.
- Keep small silhouettes readable at 64x64.
- For sprite sheets: horizontal strip, equal frame width, no padding between frames unless specified.

Negative prompt:

```text
photorealistic, 3D render, horror, gore, blood, realistic finance ad, loan shark flyer, noisy text, unreadable typography, huge character, full-screen attack, excessive bloom, blurry, low contrast
```

## Implementation Notes

- Keep `image-rendering: pixelated`.
- Use `anchor: bottom-center` for characters and `center` for UI/effects.
- Keep battle layout priority:
  1. 6x6 board
  2. Debt gauge
  3. Selecting popover
  4. Chain line
  5. HP
  6. Character acting
  7. Contract icons
- Selecting popover appears only while dragging and must disappear on release or pointercancel.
- Overdrive should feel like awakening, not pure danger.

