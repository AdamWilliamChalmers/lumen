# Lumen — Brand Mark & Animation

Two files. One static reference, one animated. Everything Cursor needs to implement the mark across the extension and web app.

---

## Files

| File | Purpose |
|---|---|
| `logo-static.html` | Master mark, all variants, light/dark, FAB sizes — visual reference |
| `logo-animated.html` | Animated mark — hero, wordmark lockup, FAB, thinking state, scale strip |

---

## The mark

Two offset squares. The solid square is the user. The outline square (teal) is the AI. The overlap zone is Lumen — the space where evaluation happens.

```
┌──────────┐
│          │
│   YOU    │
│       ┌──┼──────────┐
│       │░░│           │
└───────┼──┘    AI     │
        │              │
        └──────────────┘

░░ = intersection (teal fill, low opacity at rest, flares on animation)
```

### Tokens

```css
--lumen-dark:  #181816   /* backgrounds, FAB container */
--lumen-gray:  #2C2C2A   /* solid square (dark bg), FAB shell */
--lumen-teal:  #1D9E75   /* AI square stroke + intersection fill */
--lumen-white: #ffffff   /* solid square (dark bg) */
```

On light backgrounds: swap `--lumen-white` for `--lumen-gray` on the solid square.

---

## How to build the mark in code

The mark is three absolutely-positioned elements inside a relative container. No SVG needed — pure CSS.

```html
<!-- Container: set width/height to desired mark size -->
<div class="lumen-mark" style="width:40px; height:40px;" aria-label="Lumen">
  <!-- Intersection glow (behind both squares) -->
  <div class="lm-inter"></div>
  <!-- Solid square (you) — top-left -->
  <div class="lm-you"></div>
  <!-- Outline square (AI) — bottom-right -->
  <div class="lm-ai"></div>
</div>
```

```css
.lumen-mark { position: relative; flex-shrink: 0; }

.lumen-mark > div { position: absolute; }

/* Proportions — all values as % of container size:
   sq-you:  55% × 55%,  offset top/left: 10%
   sq-ai:   55% × 55%,  offset top/left: 35%
   inter:   ~30% × 30%, offset top/left: 35%
   border-radius: ~11% of size
   sq-ai border-width: ~3.4% of size  */

.lm-you {
  width: 55%; height: 55%;
  top: 10%; left: 10%;
  background: #ffffff;               /* or #2C2C2A on light bg */
  border-radius: 11%;
}
.lm-ai {
  width: 55%; height: 55%;
  top: 35%; left: 35%;
  border: 3.4% solid #1D9E75;
  border-radius: 11%;
  background: transparent;
}
.lm-inter {
  width: 30%; height: 30%;
  top: 35%; left: 35%;
  border-radius: 5%;
  background: #1D9E75;
  opacity: 0.20;
  pointer-events: none;
}
```

> **Note on border-width:** At very small sizes (≤24px) set border-width to 1.5px fixed rather than using the percentage — sub-pixel borders disappear.

---

## Animation

The animation lives entirely in `logo-animated.html`. The keyframes to copy into your codebase:

```css
:root { --dur: 3.2s; --ease: cubic-bezier(0.37, 0, 0.63, 1); }

@keyframes lumen-you {
  0%,  30% { transform: translate(0,0)        rotate(0deg)  scale(1);           opacity: 1; }
  50%       { transform: translate(22px,22px)  rotate(7deg)  scale(0.97);        opacity: 1; }
  58%       { transform: translate(22px,22px)  rotate(2deg)  scale(1.03);        opacity: 0.9; }
  64%       { transform: translate(22px,22px)  rotate(0deg)  scaleX(0) scaleY(1.03); opacity: 0.55; }
  70%       { transform: translate(22px,22px)  rotate(-2deg) scale(1.03);        opacity: 0.9; }
  84%       { transform: translate(0,0)         rotate(0deg)  scale(1);           opacity: 1; }
  100%      { transform: translate(0,0)         rotate(0deg)  scale(1);           opacity: 1; }
}

@keyframes lumen-ai {
  0%,  30% { transform: translate(0,0)          rotate(0deg)   scale(1);           opacity: 1; }
  50%       { transform: translate(-22px,-22px)  rotate(-7deg)  scale(0.97);        opacity: 1; }
  58%       { transform: translate(-22px,-22px)  rotate(-2deg)  scale(1.03);        opacity: 0.9; }
  64%       { transform: translate(-22px,-22px)  rotate(0deg)   scaleX(0) scaleY(1.03); opacity: 0.55; }
  70%       { transform: translate(-22px,-22px)  rotate(2deg)   scale(1.03);        opacity: 0.9; }
  84%       { transform: translate(0,0)           rotate(0deg)   scale(1);           opacity: 1; }
  100%      { transform: translate(0,0)           rotate(0deg)   scale(1);           opacity: 1; }
}

@keyframes lumen-inter {
  0%,  28%  { opacity: 0;    transform: scale(0.5); }
  52%        { opacity: 0.28; transform: scale(1);   }
  64%        { opacity: 0.65; transform: scale(1.12); }
  76%        { opacity: 0.18; transform: scale(0.9); }
  88%        { opacity: 0;    transform: scale(0.5); }
  100%       { opacity: 0;    transform: scale(0.5); }
}
```

Apply to elements:
```css
.lm-you  { animation: lumen-you   var(--dur) var(--ease) infinite; transform-origin: center; }
.lm-ai   { animation: lumen-ai    var(--dur) var(--ease) infinite; transform-origin: center; }
.lm-inter{ animation: lumen-inter var(--dur) var(--ease) infinite; }
```

> **Translate values:** The `22px` offset in the keyframes assumes a ~160px mark. For other sizes, scale proportionally: offset = mark_size × 0.14. For the 40px FAB mark, offset ≈ 5.5px.

Always respect reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  .lm-you, .lm-ai, .lm-inter { animation: none; }
  .lm-inter { opacity: 0.18; transform: scale(1); }
}
```

---

## Where to use each state

| Context | State | Notes |
|---|---|---|
| `lumen.so` hero | Animated, 160px | Loop continuously |
| Page header / nav | Static lockup, 32–48px | No animation in nav |
| Extension popup header | Static lockup, 32px | |
| Extension FAB (page overlay) | Animated at rest | Idle = static; processing = animate |
| "Thinking" indicator | Animated, 28px + label | `thinking-text` label fades in sync |
| Extension icon (toolbar) | Static, 16–32px | Chrome toolbar icons must be PNG/SVG — export from static file |
| Favicon | Static, 16px | Export as PNG |

---

## FAB — replacing the white dot

The current FAB uses a white circle. Replace with the `.lumen-mark` component at 30px inside the existing FAB shell.

```html
<!-- Before -->
<div class="fab">
  <div class="fab-dot"></div>
</div>

<!-- After -->
<div class="fab">
  <div class="lumen-mark" style="width:30px;height:30px;" aria-hidden="true">
    <div class="lm-inter" style="..."></div>
    <div class="lm-you"   style="..."></div>
    <div class="lm-ai"    style="..."></div>
  </div>
</div>
```

Trigger the animation when a signal fires or Lumen is actively scoring a message. Return to static (remove animation class) when idle. Example:

```js
// In your signal-detection callback:
fabMark.classList.add('is-active')   // starts animation
setTimeout(() => fabMark.classList.remove('is-active'), 3200)  // one loop
```

```css
.lumen-mark .lm-you  { animation: none; }
.lumen-mark .lm-ai   { animation: none; }
.lumen-mark .lm-inter{ animation: none; opacity: 0.18; }

.lumen-mark.is-active .lm-you  { animation: lumen-you   var(--dur) var(--ease) 1; }
.lumen-mark.is-active .lm-ai   { animation: lumen-ai    var(--dur) var(--ease) 1; }
.lumen-mark.is-active .lm-inter{ animation: lumen-inter var(--dur) var(--ease) 1; }
```

---

## React component (optional)

If the web app is Next.js/React, wrap as a component:

```tsx
// components/LumenMark.tsx
import { useEffect, useRef } from 'react'

interface Props {
  size?: number
  animate?: boolean
  className?: string
}

export function LumenMark({ size = 40, animate = false, className }: Props) {
  const sq = size * 0.55
  const offset = size * 0.35
  const origin = size * 0.10
  const inter = size * 0.30
  const bw = Math.max(1.5, size * 0.034)
  const br = size * 0.11

  return (
    <div
      className={`lumen-mark${animate ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      aria-label="Lumen"
    >
      <div className="lm-inter" style={{
        position: 'absolute', width: inter, height: inter,
        top: offset, left: offset,
        borderRadius: br * 0.45,
        background: '#1D9E75', opacity: 0.20, pointerEvents: 'none'
      }} />
      <div className="lm-you" style={{
        position: 'absolute', width: sq, height: sq,
        top: origin, left: origin,
        background: '#ffffff', borderRadius: br
      }} />
      <div className="lm-ai" style={{
        position: 'absolute', width: sq, height: sq,
        top: offset, left: offset,
        border: `${bw}px solid #1D9E75`,
        borderRadius: br, background: 'transparent'
      }} />
    </div>
  )
}
```

Usage:
```tsx
<LumenMark size={160} animate />          // hero
<LumenMark size={48} />                   // nav lockup
<LumenMark size={30} animate={isActive} /> // FAB
<LumenMark size={28} animate />           // thinking state
```

---

## Checklist for Cursor

- [ ] Copy keyframe CSS into global stylesheet (or `globals.css` in Next.js)
- [ ] Replace FAB white dot with `LumenMark` at 30px
- [ ] Add `.is-active` trigger to FAB when signal fires (one loop, not infinite)
- [ ] Use infinite loop for `lumen.so` hero only
- [ ] Export 16×16 and 32×32 PNGs from `logo-static.html` for Chrome extension manifest icons
- [ ] Add `prefers-reduced-motion` rule to global CSS
- [ ] Confirm FAB border-width is fixed at 1.5px (not percentage) — it's 30px total
