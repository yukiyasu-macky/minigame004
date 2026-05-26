# Asset / UX TODO

## Blocking Or Missing Inputs

- `docs/design_sheet.md` is requested but currently missing from the repository.
- Confirm whether `assets/images/` is intended to be committed source art, or whether runtime art should live only under `public/assets/`.
- Confirm final sprite sheet padding rules: current manifest assumes horizontal strips with no padding between equal-size frames.
- Confirm whether generated PNGs should be produced by ChatGPT image generation, manual pixel art, or an external pixel tool.

## Asset Production Risks

- 64x64 character sprites may lose readability if prompts produce too much detail.
- Glow intensity can easily become too strong on mobile OLED screens.
- UI frames with embedded text should be avoided; dynamic Japanese text should remain in React/CSS.
- Reward card and result screen assets may become too dense for 360x640 if art frames are too ornate.
- Contract icons need strict silhouette clarity because they appear small in battle.

## Implementation Risks

- Current CSS placeholder sprites exist; replacing them with PNG sheets must preserve board priority.
- `image-rendering: pixelated` should remain enabled for all sprite assets.
- SVG chain line currently works as runtime overlay; image chain-line assets should be optional unless SVG cannot match art direction.
- Browser gesture prevention must be re-tested after any board or touch-layer changes.

## Validation Checklist

- 360x640: board remains playable and popover does not cover most of the board.
- 390x844: chain selection does not trigger browser back or pull-to-refresh.
- 430x932: sprites enhance the battle screen without becoming the main focus.
- Overdrive: black debt state feels like awakening, not horror.
- Reward screen: three contract cards remain readable.
- Final settlement: dynamic numbers remain text, not baked into images.

## Next Recommended Work

1. Generate MVP batch assets:
   - `pieces_normal_5color`
   - `pieces_selected_5color`
   - `debt_gauge_4state`
   - `popover_bg`
   - `contract_icons_core`
2. Generate character MVP batch:
   - Rent idle / chain_select / cast / overdrive / hit
   - Lunon idle_fly / chain_hype
   - Paladin idle / hit / defeat
3. Replace CSS placeholders with actual sprite images behind a feature flag or CSS fallback.
4. Verify on real iOS Safari and Android Chrome.

