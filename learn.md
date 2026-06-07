# Debugging Learnings

---

## ⚠️ IMPORTANT RULE — Ask before acting when instructions are ambiguous

**If you are unsure what the user means, or their instructions could be read more than one way, ask for clarification before making changes.**

Do not guess. Do not assume you know which component, property, or scope they mean — even if recent conversation context makes one interpretation seem likely.

**Example (printer mouth, Jun 2026):** User asked for the printer mouth to be "20% bigger." The correct change was increasing the slot/receipt width from `66%` → `79%` of the printer body. Instead, the entire printer container was scaled from `340px` → `408px`, which changed the wrong thing while leaving the mouth proportion unchanged.

**When to ask:**
- "Bigger/smaller" without a clear subject (mouth vs whole component vs text vs image)
- References to a "view" when multiple views exist (grid vs picnic/street)
- "Fix X" when X could live in more than one file or layer

**How to ask:** One short question with 2–3 concrete options, e.g. *"Do you mean widen the paper slot (66% → 79%) or scale the whole printer?"*

---

## Visual bugs are structural storytelling bugs

**What happened:** User wanted receipt paper to look like it was coming out of the printer **mouth line**, not from below the whole printer body. The first fix was a `-7px` negative margin to align the feed with the slot. It didn't work — the paper still visibly started at the bottom edge of the gray printer hood.

**Root cause:** The layout was telling the wrong story. The printer had an opaque "chin" — gray body extending ~7px below the mouth slot. Paper sat *behind* that chin until the hood ended, so no margin tweak could make it read as emerging from the slot. Alignment was a symptom; **occlusion and geometry** were the cause.

**Fix:** Reshape the structure to match the intent:
- Hood ends at the mouth — no material below the slot
- Paper starts at the slot (1px tuck under the hood)
- Layer order: paper (1) → hood (2) → mouth line (3)

**Higher-level takeaway:**

1. **Intent before adjustment.** The design goal was "emerges from slot," not "move element up 7px." Name the intent in rules so future changes don't accidentally undo it.

2. **Layering is part of the design.** Position alone doesn't create an illusion. If opaque material sits where the user expects continuity, spacing won't fix the read.

3. **Anti-patterns matter as much as patterns.** The useful rule isn't "use absolute positioning" — it's "don't put a chin below the mouth."

4. **Document principles, not patches.** Magic numbers (`-7`, `48px`) are implementation details. "Paper emerges from the slot; hood ends at the slot" survives refactors.

**When to apply:** Before tweaking spacing or sizes on a visual bug, ask *what story is the UI telling?* If the structure contradicts the intended read, fix the model first.

---

## Transparent PNG images still showing grey card background

**Symptom:** Item cards had a visible grey rounded rectangle behind each product photo, even after setting `background: "transparent"` on the card component.

**Root cause:** Two things combined to cause the grey:
1. The image container div had a hardcoded `background: "#f5f5f5"` — this was the actual grey color showing through the transparent areas of the PNG.
2. The card had `overflow: "hidden"` + `borderRadius: 12`, which clipped the image to a rounded box, making the grey background visible as a distinct shape even when the PNG had transparent edges.

**Fix:**
- Remove the hardcoded `background: "#f5f5f5"` from the image container div → set to `"transparent"`.
- Remove `overflow: "hidden"` and `borderRadius` from the card for non-admin view — since images now have transparent backgrounds (via remove.bg), there's no need to clip them. The products float freely on the page background.
- Keep `overflow: "hidden"` and `borderRadius` for admin mode where the card boundary needs to be visible.

**Lesson:** When switching from opaque JPGs to transparent PNGs, audit every container in the component tree for background colors and `overflow: hidden` — both become visible in ways they weren't before.

---

## Next.js image cache doesn't update when files change on disk

**Symptom:** Rotated/replaced image files in `public/images/items/` but the app kept showing the old versions.

**Fix:** Delete `.next/cache/images/` and restart the dev server. Next.js caches optimized images aggressively and won't re-process them just because the source file changed.

```bash
rm -rf .next/cache/images && npm run dev
```

Also do a hard refresh in the browser (`Cmd+Shift+R`) to clear the browser-level cache too.

---

## `sips` rotation direction on macOS

**Symptom:** Tried rotating images with `sips -r -90` (clockwise) but needed multiple attempts to land on the right orientation.

**Reference:**
- `sips -r 90` = counterclockwise 90°
- `sips -r -90` = clockwise 90°
- `sips -r 180` = flip upside down

**Tip:** Always verify the actual file result by opening the raw file directly in the browser (`localhost:3000/images/items/filename.jpg`) before checking via the Next.js app — this bypasses the image optimization cache and shows the true file state.

---

## Misinterpreting "grid view on top of the blanket" — UI view naming

**What happened:** User said the starburst centering wasn't working and asked to "change objects to be in a grid view on top of the blanket." I interpreted this as replacing the starburst hover effect with a gradient label overlay on the item cards in the main grid view. That was wrong — the user wanted the starburst to stay and was talking about a completely different view.

**Actual context:** There are two named views in this app:
- **Grid view** — the default clean CSS grid (`sale-canvas.tsx`) with starburst hover on desktop
- **Street view / Picnic view** — the `GarageSaleView` component accessed via the globe icon, which shows items on a blanket texture

The user's phrase "grid view on top of the blanket" referred to the **street/picnic view** (items on the blanket), and they wanted that view to use an orderly grid layout instead of scattered absolute positioning. It had nothing to do with the main grid view or the starburst.

**Misinterpretation:** I read "grid view" as the main grid and "blanket" as metaphor, rather than recognizing it as a description of the existing picnic/street view component.

**How to interpret next time:**
- When the user references two separate views, confirm which one they mean before changing anything.
- "On top of the blanket" = literally the `GarageSaleView` component which renders a blanket.png texture.
- If a user says "fix X in view Y", ask which view Y maps to if there are multiple named views in the codebase before making changes to the wrong component.
