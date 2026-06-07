# Design Taste

## Modals & Overlays

**Backdrop: blur only, no darkening.**
Modal background overlays should use `backdropFilter: "blur(Xpx)"` with a fully transparent (or near-transparent) background — no `rgba(0,0,0,0.X)` darkening. The blur alone creates depth and focus without dimming the page behind it.

```css
/* ✅ preferred */
backdrop-filter: blur(8px);
background: transparent; /* or rgba(0,0,0,0) */

/* ❌ avoid */
backdrop-filter: blur(8px);
background: rgba(0,0,0,0.5);
```
