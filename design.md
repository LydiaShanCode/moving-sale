# Design System

## Receipt Modals

Receipt modals (`ReceiptModal` and everything printed on the paper) follow a strict thermal-printer aesthetic.

### Typography

**Geist Mono for all receipt copy.**

Every label, input, button, body text, and heading inside the receipt paper uses Geist Mono — not the site’s default Geist sans.

```css
font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

Applied via `.receipt-print-body` in `globals.css` and the shared `RECEIPT_FONT` / `receiptInput` / `receiptLabel` exports in `components/receipt-modal.tsx`.

### Paper

**White background — `#fff`.**

Receipt paper is pure white, not cream or off-white. The torn-edge clip-path and shadow provide texture; the fill stays clean.

```css
background: #fff;
```

### Icons

**Black-and-white stroke icons only — no coloured emoji.**

Use the shared icons in `components/receipt-icons.tsx` (Feather-style SVG, `stroke="#000"`). Never use coloured emoji (📦, etc.) or Unicode symbols (✓, ◌) inside receipt modals.

| Use case | Icon |
|----------|------|
| Package / pickup | `ReceiptPackageIcon` |
| Success / bid placed | `ReceiptCheckIcon` |
| Add photo | `ReceiptPlusIcon` |
| Loading | `ReceiptLoaderIcon` |

Muted secondary icons (e.g. empty photo drop zone) may use `#bbb` stroke to match receipt label colour.

### Torn edge

**Organic rip at the bottom — textured, not spiky.**

The receipt paper bottom edge uses a `clip-path` polygon to simulate a torn tear. The edge should feel hand-ripped: lots of small bumps with irregular spacing and mixed depths — never a uniform zigzag or deep sawtooth.

**Rules:**

- **Many bumps** — roughly 40–50 points along the bottom edge
- **Irregular spacing** — vary horizontal distance between bumps (~1–2.5% width); avoid perfectly even intervals
- **Mixed depths** — alternate short (2px), medium (3–4px), and longer (5px) tears; cap depth at **5px** so it stays textured without sharp spikes
- **Depth 0 = full tear** — points at `100%` y sit at the bottom; non-zero depth uses `calc(100% - Npx)` for the bump peak

Defined in `RECEIPT_TEAR_BUMPS` in `components/receipt-modal.tsx`:

```ts
// [x%, tear depth in px] — 0 = full tear to bottom edge
[100, 3], [98.5, 0], [97.2, 5], [95.8, 0], ...
```

```css
/* ✅ preferred — organic, varied */
clip-path: polygon(0 0, 100% 0, 100% calc(100% - 3px), 98.5% 100%, 97.2% calc(100% - 5px), ...);

/* ❌ avoid — uniform spacing + deep spikes */
clip-path: polygon(..., 97.5% 100%, 95% calc(100% - 10px), 92.5% 100%, ...);
```

When adjusting the edge, tweak individual bump pairs in `RECEIPT_TEAR_BUMPS` rather than regenerating a symmetric pattern.


**Backdrop: blur only, no darkening.**

Modal background overlays should use `backdropFilter: "blur(Xpx)"` with a fully transparent background — no `rgba(0,0,0,0.X)` darkening. The blur alone creates depth and focus without dimming the page behind it.

```css
/* ✅ preferred */
backdrop-filter: blur(8px);
background: transparent;

/* ❌ avoid */
backdrop-filter: blur(8px);
background: rgba(0,0,0,0.5);
```
