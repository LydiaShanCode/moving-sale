# Debugging Learnings

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
