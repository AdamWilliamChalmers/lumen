# Lumen — Brand & Design System Style Guide

## The aesthetic in one sentence

Light cones as the product UI system. Aurora over ocean as the marketing and hero imagery. Monochrome precision everywhere, with the four signal colours as the only chromatic elements in the entire system.

---

## Brand philosophy

Lumen is named after the unit of light output — the scientific measure of how much light a source actually emits, as opposed to how much energy it consumes. That distinction is the product metaphor: Lumen measures cognitive output, not just AI usage. It is precise, calibrated, and scientific in character.

The visual language follows from this. A lumen chart shows cones of light graduating in intensity from a dark ground. That image — dark, measured, precise, with light as the signal rather than the background — is the aesthetic foundation of everything Lumen builds.

**Anti-slop is a design principle.** Aurora aesthetics, warm gradients, bokeh, particle clouds, iridescent effects — these are the visual vocabulary of 2024–2026 consumer apps. Lumen uses none of them in its product UI. The product is monochrome. The only colour is signal.

---

## The two visual registers

### Register 1: Product UI (extension + web app)

Near-monochrome. Black ground. White/off-white light. The four signal dots as the only colour. Precision and restraint.

This is what the user sees 100% of the time while using Lumen. It should never feel decorative. Every element earns its place.

### Register 2: Brand / marketing (lumen.so landing page, social, press)

Aurora over ocean. Deep navy, magenta-rose light column, violet upper sky, star white. Emotional, distinctive, memorable. Used for hero images, social cards, the landing page backdrop — surfaces where Lumen speaks to the world rather than sitting inside someone else's product.

The two registers never mix inside the product UI. The aurora palette does not appear in the extension or the dashboard. The monochrome system does not appear in marketing hero imagery. They serve different jobs.

---

## Colour system

### Product UI palette — monochrome base

```
--lm-void:       #080808   /* True near-black. Page background. */
--lm-surface:    #0f0f0f   /* Elevated surfaces. Cards, popups. */
--lm-raised:     #161616   /* Double-raised. Hover states, active. */
--lm-border:     #222222   /* All borders and dividers. */
--lm-muted:      #3a3a3a   /* Disabled states, placeholders. */
--lm-secondary:  #6a6a6a   /* Secondary labels, captions. */
--lm-primary:    #c8c8c8   /* Primary body text. */
--lm-bright:     #f0f0f0   /* Headings, emphasis, active labels. */
--lm-white:      #ffffff   /* Pure white. Used sparingly — signal only. */
```

### The four signal colours — the only colour in the system

These are the only non-monochrome colours permitted anywhere in the product UI. Each is used exclusively for its signal type. Never repurposed. Never decorative.

```
--lm-loop:       #4caf50   /* Green.  Loop signal. Focused state. */
--lm-drift:      #f0a500   /* Amber.  Drift signal. Longitudinal warning. */
--lm-mismatch:   #8040c0   /* Violet. Mismatch signal. User's own intention. */
--lm-depth:      #4a9fd4   /* Blue.   Depth signal. Invitation to think. */
```

Signal colours appear only as:
- The signal dot on the inline strip (7px circle)
- The FAB dot (8px circle)
- The FAB score number
- Bar fills on the weekly card
- The signal label text on the strip (at 70% opacity of the signal colour)

Nowhere else. Not in buttons, not in backgrounds, not in borders, not in headings.

### Marketing / brand palette — aurora register

Used on lumen.so landing page, social cards, press imagery, and the weekly shareable card hero background only.

```
--lm-aurora-void:    #07070f   /* Deep space black */
--lm-aurora-navy:    #0d0d20   /* Dark ocean */
--lm-aurora-violet:  #2d1060   /* Upper sky violet */
--lm-aurora-rose:    #c8386a   /* Aurora light column — brand accent */
--lm-aurora-pink:    #e86090   /* Aurora diffusion */
--lm-aurora-star:    #e8e8ff   /* Star white */
```

Aurora rose (`#c8386a`) is Lumen's brand colour. It appears in the logo, the Chrome Web Store icon, the lumen.so wordmark, and the marketing layer. It does not appear anywhere in the product UI.

---

## Typography

### Typeface

**Inter** — the only typeface used across the entire product. Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Inter is chosen for its optical precision at small sizes — the product operates at 10–14px in the extension, where most typefaces degrade. Inter holds. It also carries no personality of its own, which is intentional. The design system should feel like an instrument, not an identity.

### Scale

```
--lm-text-xs:    10px / 400  /* Labels, captions, tokens */
--lm-text-sm:    11px / 500  /* Strip messages, badge text */
--lm-text-base:  12px / 400  /* Body, card descriptions */
--lm-text-md:    13px / 500  /* Card titles, popup headings */
--lm-text-lg:    15px / 500  /* Section headings */
--lm-text-xl:    18px / 600  /* Page headings (lumen.so only) */
--lm-text-hero:  28px / 600  /* Hero text (marketing only) */
```

### Letter spacing

```
Labels (uppercase):    0.06em
Body:                  0
Wordmark "Lumen":      0.08em
```

### Rules

- Sentence case everywhere. Never title case. Never all-caps except labels.
- Two weights in the product UI: 400 (regular) and 500 (medium). Weight 600 appears only in page headings on lumen.so.
- No italic in the UI. The intervention cards use a slightly lighter opacity, not italic, for the body text.
- Line height: 1.5 for UI elements. 1.7 for longer reading text (lumen.so only).

---

## The light cone motif

The core visual symbol of Lumen is the light cone — a beam of light emerging from a precise point source into darkness, graduating from bright centre to soft edge. This motif is used:

- As the lumen.so hero background (four cones at different intensities, referencing the lumens diagram)
- As the Chrome Web Store icon (single cone, near-monochrome)
- As section dividers on lumen.so (thin horizontal light gradient)
- As the onboarding illustration (cone intensifies as the user engages more critically)

### Construction rules for light cone elements

The cone is always:
- A radial gradient from white/near-white at the point source to transparent at the edges
- On a near-black or pure black background
- Never filled with colour — the cone itself is always white/grey
- The point source is always at the bottom or edge of the frame, not centred
- Multiple cones are permitted but should vary in intensity, not colour

```css
/* Light cone gradient — CSS implementation */
background: radial-gradient(
  ellipse at 50% 100%,
  rgba(255, 255, 255, 0.85) 0%,
  rgba(255, 255, 255, 0.15) 40%,
  rgba(255, 255, 255, 0.0) 70%
);
```

---

## Component specifications

### The inline strip

The primary product UI element. Appears below every user message bubble in the conversation thread.

```
Layout:         flex row, justify-content: flex-end
Height:         20px
Padding:        3px 0 10px
Alignment:      right-aligned, matching user bubble
Visibility:     always present on every user message
```

```
"Lumen"  ●  [signal message]
  ↑      ↑        ↑
10px   7px      11px
#2a2a2a dot    signal colour at 70%
500wt         opacity, italic off
0.3em
letter-spacing
```

The wordmark "Lumen" is always in `--lm-muted` (`#3a3a3a`). Never coloured. Never larger. It is ambient, not prominent.

The dot is 7px. No border. No shadow. Solid fill using the signal colour.

The message is 11px, `font-weight: 400`. Colour is the signal colour at 70% opacity — never full saturation, never white.

### The FAB (floating action button)

Moved to bottom-left in v3. Fixed position. Not draggable in v3.

```
Position:       fixed, bottom: 20px, left: 20px
Layout:         flex row, align-items: center, gap: 8px
Background:     --lm-surface (#0f0f0f)
Border:         0.5px solid --lm-border (#222222)
Border-radius:  24px (pill)
Padding:        8px 14px
Z-index:        2147483646
```

Contents:
1. Signal dot: 8px circle, signal colour, no border
2. Wordmark: "Lumen" — 11px, `--lm-secondary` (#6a6a6a), weight 600, letter-spacing 0.06em
3. Score: session composite score as integer — 12px, weight 700, signal colour

On hover: border brightens to `#333333`. No other change. No shadow. No scale.

On click: opens the extension popup.

```css
#lumen-fab {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f0f0f;
  border: 0.5px solid #222222;
  border-radius: 24px;
  padding: 8px 14px;
  z-index: 2147483646;
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: 'Inter', sans-serif;
}
#lumen-fab:hover { border-color: #333333; }
#lumen-fab .lm-fab-dot { width: 8px; height: 8px; border-radius: 50%; }
#lumen-fab .lm-fab-word { font-size: 11px; font-weight: 600; color: #6a6a6a; letter-spacing: 0.06em; }
#lumen-fab .lm-fab-score { font-size: 12px; font-weight: 700; }
```

### Intervention cards (Mismatch, Depth, Overwhelmed, Stuck)

Cards appear below the strip, never as banners above the input. They are always dismissible. They never block sending.

```
Background:     signal colour at 6% opacity on --lm-void
Border:         0.5px solid [signal colour at 25% opacity]
Border-radius:  10px
Padding:        12px 14px
Max-width:      84% of conversation width
```

Header: 11px, signal colour, weight 600, letter-spacing 0.04em
Body: 12px, signal colour at 60% opacity, weight 400, line-height 1.6
Buttons: transparent bg, 1px border at signal colour 30% opacity, 6px border-radius, 11px, signal colour 70%

The card background tint uses the signal colour very lightly so each card type is instantly recognisable at a glance without being loud.

```css
/* Mismatch card example */
.lm-card-mismatch {
  background: rgba(128, 64, 192, 0.06);
  border: 0.5px solid rgba(128, 64, 192, 0.25);
  border-radius: 10px;
  padding: 12px 14px;
}
```

### The weekly card

Shareable artifact. Lives on lumen.so. Also rendered as an OG image for social sharing.

```
Background:     --lm-surface (#0f0f0f)
Border:         1px solid #1a1a1a
Border-radius:  16px
Padding:        24px
Width:          380px (fixed for sharing)
```

The only decorative element permitted on the weekly card: a very subtle light cone gradient in the bottom-right corner, pure white, opacity 3–5%. This references the light cone motif without being visible at normal reading distance — it only reads on the shared image at full size.

Bar fills use the four signal colours. Bars are 4px tall, `border-radius: 2px`. Track is `#1a1a1a`.

Shape badge: 44px × 44px, `border-radius: 10px`, signal colour at 8% opacity background, signal colour icon.

### The popup (extension)

```
Width:          380px
Max-height:     480px
Background:     --lm-void (#080808)
Border:         1px solid #1a1a1a (top only, where it meets the browser chrome)
Font:           Inter
```

Three sections separated by 1px `#161616` dividers. No section headers with background colour. Labels are uppercase, 10px, `--lm-secondary`, letter-spacing 0.06em.

---

## Spacing system

```
--lm-space-1:    4px
--lm-space-2:    8px
--lm-space-3:    12px
--lm-space-4:    16px
--lm-space-5:    20px
--lm-space-6:    24px
--lm-space-8:    32px
--lm-space-12:   48px
```

All component internal padding uses the spacing system. No arbitrary values.

---

## Border radius system

```
--lm-radius-sm:   6px    /* Buttons, small tags */
--lm-radius-md:   8px    /* Input fields, small cards */
--lm-radius-lg:   12px   /* Cards, popups */
--lm-radius-xl:   16px   /* Weekly card, large surfaces */
--lm-radius-pill: 24px   /* FAB, status pills */
--lm-radius-full: 9999px /* Dots, avatars */
```

---

## Border widths

```
Component borders:    0.5px solid --lm-border
Hover borders:        0.5px solid #333333
Active/featured:      1px solid [signal colour at 40%]
Card borders:         1px solid #1a1a1a
```

Never 2px borders in the product UI. Never coloured borders except the active/featured exception.

---

## Motion

Lumen moves minimally. Motion communicates state change — nothing more.

```
--lm-transition-fast:    0.12s ease
--lm-transition-base:    0.18s ease
--lm-transition-slow:    0.3s ease
```

Permitted animations:
- Opacity transitions on card appearance (fade in over 0.18s)
- Border colour transitions on hover (0.12s)
- FAB dot colour transition on score change (0.3s)

Forbidden animations:
- Scale transforms (no "pop" or "bounce")
- Slide transitions (no panels sliding in)
- Any animation longer than 0.4s in the product UI
- Pulse or glow effects on signal dots (they are static)

The signal dots do not animate. They are not attention-seeking. They are measured readings.

---

## Iconography

No icon library. Lumen uses three visual elements only:

1. **The dot** — the primary signal indicator. Circle. 6px (strip), 7px (strip active), 8px (FAB), 10px (card headers). Always solid fill, signal colour. No border. No shadow.

2. **The cone** — the decorative/brand element. Used as described in the light cone motif section. Never interactive.

3. **Text symbols** — the feedback buttons use `↑` and `↓` (Unicode arrows), never icon libraries. The dismiss button uses `✕`. The share button uses `↗`.

If an icon is genuinely needed (the popup settings section), use Tabler outline icons at 16px, colour `--lm-secondary`. Never decorative use. Only functional use where text alone is insufficient.

---

## What is never permitted in Lumen's UI

This list is as important as the positive rules.

- **Gradients** — except the light cone element and bar fills. No background gradients. No button gradients. No text gradients.
- **Shadows** — no drop shadows, box shadows, or glow effects anywhere. The only permitted shadow-like element is the light cone gradient, which is structural not decorative.
- **Blur** — no backdrop-filter blur, no frosted glass, no blur on any element.
- **Aurora palette in product UI** — aurora rose, aurora violet, aurora navy are marketing colours only. They do not appear inside the extension or the lumen.so dashboard.
- **Colour for decoration** — signal colours appear only when a signal is active. A green button is not permitted. A violet heading is not permitted.
- **Rounded corners above 16px** — the pill (24px) is the only exception, and it applies only to the FAB and status pills.
- **Typography above 600 weight in product UI** — weight 600 is for lumen.so page headings only. Extension and dashboard UI uses 400 and 500 only.
- **Animation on signal dots** — dots are static. They do not pulse, breathe, spin, or glow.
- **The word "Lumen" in any colour other than --lm-secondary inside the product** — the wordmark in the strip and FAB is always muted grey. It is ambient.

---

## The wordmark

**Lumen** — set in Inter, weight 500, letter-spacing 0.08em, colour context-dependent:

- In the extension strip: `--lm-muted` (#3a3a3a) — invisible at a glance, readable on hover
- In the FAB: `--lm-secondary` (#6a6a6a) — visible but not prominent
- In the popup header: `--lm-bright` (#f0f0f0) — legible heading
- On lumen.so: `--lm-aurora-star` (#e8e8ff) — on dark background
- On lumen.so (light sections): `#0a0a14` — near-black

No logomark exists in v1. The wordmark is the logo. A logomark (the light cone reduced to a glyph) may be developed in v2 once the system is established.

---

## Application to ChatGPT's interface

Lumen injects into a dark UI (#212121 background, #2f2f2f bubble background). The Lumen system is calibrated for this environment.

The `--lm-void` background (#080808) is slightly darker than ChatGPT's base, which means Lumen elements recede naturally into the interface rather than competing with it.

The FAB at bottom-left sits outside ChatGPT's own UI patterns (which favour top-right and bottom-right). This ensures no visual conflict with ChatGPT's own controls.

The inline strip's right-alignment matches the user bubble alignment, making it feel like a continuation of the user's own message rather than an intrusion from outside.

CSS scoping: all Lumen styles are scoped under `#lumen-root` and `.lm-*` class prefix. No global selectors. No style leakage.

---

## Application to lumen.so

lumen.so is a dark-mode-first web app. The body background is `--lm-void` (#080808).

The landing page hero uses the aurora register: a full-bleed aurora image (dark navy, magenta light column) with the Lumen wordmark in `--lm-aurora-star` centred over it. This is the only place in the product ecosystem where the aurora palette appears in a layout context rather than as a background image.

The dashboard and all authenticated pages use the monochrome product UI system only. No aurora elements inside the app.

The weekly card uses `--lm-surface` (#0f0f0f) with the subtle light cone watermark. When shared on social media, the OG image adds the aurora backdrop behind the card — the card itself remains monochrome.

---

## CSS custom properties — complete reference

```css
:root {
  /* Base */
  --lm-void:           #080808;
  --lm-surface:        #0f0f0f;
  --lm-raised:         #161616;
  --lm-border:         #222222;
  --lm-muted:          #3a3a3a;
  --lm-secondary:      #6a6a6a;
  --lm-primary:        #c8c8c8;
  --lm-bright:         #f0f0f0;
  --lm-white:          #ffffff;

  /* Signals — the only colour */
  --lm-loop:           #4caf50;
  --lm-drift:          #f0a500;
  --lm-mismatch:       #8040c0;
  --lm-depth:          #4a9fd4;

  /* Aurora — marketing only */
  --lm-aurora-void:    #07070f;
  --lm-aurora-navy:    #0d0d20;
  --lm-aurora-violet:  #2d1060;
  --lm-aurora-rose:    #c8386a;
  --lm-aurora-pink:    #e86090;
  --lm-aurora-star:    #e8e8ff;

  /* Typography */
  --lm-font:           'Inter', -apple-system, sans-serif;
  --lm-text-xs:        10px;
  --lm-text-sm:        11px;
  --lm-text-base:      12px;
  --lm-text-md:        13px;
  --lm-text-lg:        15px;
  --lm-text-xl:        18px;
  --lm-text-hero:      28px;

  /* Spacing */
  --lm-space-1:        4px;
  --lm-space-2:        8px;
  --lm-space-3:        12px;
  --lm-space-4:        16px;
  --lm-space-5:        20px;
  --lm-space-6:        24px;
  --lm-space-8:        32px;
  --lm-space-12:       48px;

  /* Radius */
  --lm-radius-sm:      6px;
  --lm-radius-md:      8px;
  --lm-radius-lg:      12px;
  --lm-radius-xl:      16px;
  --lm-radius-pill:    24px;
  --lm-radius-full:    9999px;

  /* Motion */
  --lm-transition-fast:  0.12s ease;
  --lm-transition-base:  0.18s ease;
  --lm-transition-slow:  0.3s ease;
}
```
