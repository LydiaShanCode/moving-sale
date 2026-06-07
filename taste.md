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

**No autoFocus inside modals.**
Never use `autoFocus` on any input inside a modal or overlay. On mobile, `autoFocus` immediately triggers the keyboard, which pushes the modal up or partially offscreen before the user has a chance to read it. Let users tap into fields when they're ready.

```tsx
/* ✅ preferred */
<input value={name} onChange={...} placeholder="Alex" />

/* ❌ avoid */
<input autoFocus value={name} onChange={...} placeholder="Alex" />
```
