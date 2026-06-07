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

**Use `100dvh` instead of `100vh` for full-height elements.**
`100vh` on iOS Safari is calculated from the full viewport (ignoring the keyboard and browser chrome), causing a white gap when the keyboard opens. Always use `100dvh` (dynamic viewport height) for any element that should fill the screen — backgrounds, modals, overlays, backdrops.

```tsx
/* ✅ preferred */
style={{ minHeight: "100dvh" }}
style={{ height: "100dvh" }}

/* ❌ avoid */
style={{ minHeight: "100vh" }}
style={{ height: "100vh" }}
```

`100dvh` is supported on iOS 15.4+ and Android Chrome 108+. It shrinks correctly when the keyboard is open.

**No autoFocus inside modals.**
Never use `autoFocus` on any input inside a modal or overlay. On mobile, `autoFocus` immediately triggers the keyboard, which pushes the modal up or partially offscreen before the user has a chance to read it. Let users tap into fields when they're ready.

```tsx
/* ✅ preferred */
<input value={name} onChange={...} placeholder="Alex" />

/* ❌ avoid */
<input autoFocus value={name} onChange={...} placeholder="Alex" />
```
