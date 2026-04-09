# Design System Document: The Editorial Pantry

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Sommelier"**
This design system moves away from the utilitarian, "utility-app" feel of typical pantry trackers. Instead, it adopts a **High-End Editorial** aesthetic—blending the tactile sophistication of a luxury cookbook with the seamless intelligence of a modern smart home.

The system breaks the "standard template" look through **Intentional Asymmetry** and **Tonal Depth**. Rather than a rigid grid of identical boxes, layouts should utilize staggered lists and overlapping imagery to create a rhythmic, organic flow. The goal is to make the user feel like they are curating a collection, not just managing inventory.

---

## 2. Colors: Tonal Sophistication
Our palette avoids the harshness of pure black and white, opting for "living" neutrals and deep, organic greens.

### Core Palette
*   **Primary (`#002d1c`):** Deep Forest Green. Used for core brand moments and high-contrast text.
*   **Background (`#fcf9f6`):** Soft Cream. A warm, paper-like canvas that feels more premium than pure white.
*   **Secondary (`#b52424`):** Earthy Crimson. Reserved for urgency and expiration alerts.
*   **Tertiary (`#342300`):** Burnt Ochre. Used for "warm" accents and artisanal highlights.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts.
*   Use `surface-container-low` for large section backgrounds.
*   Use `surface-container-lowest` (Pure White) for cards sitting atop those sections.
*   The transition between `#fcf9f6` (Background) and `#f0edea` (Surface Container) is the only "line" allowed.

### The "Glass & Gradient" Rule
To add "soul," primary CTAs and hero headers should use a subtle linear gradient: `primary` (#002d1c) to `primary_container` (#00452e). For floating navigation or modal overlays, apply a **Glassmorphic effect** using `surface` colors at 85% opacity with a `20px` backdrop blur.

---

## 3. Typography: The Editorial Mix
We pair the authority of a serif with the functional clarity of a geometric sans-serif.

*   **Display & Headlines (Noto Serif):** These are your "Editorial Voices." Use `display-lg` for hero recipe titles and `headline-sm` for pantry categories. High contrast in scale is encouraged—make headlines large and proud.
*   **Body & UI (Manrope):** The "Functional Voice." Use `body-lg` for ingredient lists and `label-md` for technical data (weights, dates). Manrope’s clean architecture ensures legibility even at small sizes on mobile screens.
*   **The Signature Hierarchy:** A `headline-lg` Noto Serif title should often be paired with a `label-md` Manrope subtitle in all caps with `0.1rem` letter spacing to create a high-fashion look.

---

## 4. Elevation & Depth: Tonal Layering
We reject heavy, muddy shadows in favor of light and atmosphere.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. Place a `surface_container_lowest` card on a `surface_container_low` background. This creates a natural "lift" without the need for a stroke.
*   **Ambient Shadows:** For floating elements (like an "Add Item" FAB), use a custom shadow: 
    *   `X: 0, Y: 8, Blur: 24, Color: rgba(28, 28, 26, 0.06)`
    *   Note the 6% opacity; it should feel like the element is hovering in a bright, sunlit kitchen.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in a high-glare environment), use the `outline_variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Staggered List Categories
Instead of a centered list, use an **Asymmetric Stagger**. 
*   Category headings (e.g., "Dairy," "Produce") should have extra top padding (`xl`).
*   Items within the category should have alternating left/right margins (e.g., Item 1: `margin-right: 1rem`, Item 2: `margin-left: 1rem`) to create a visual "zigzag" that mimics a hand-curated pantry.

### Expiration Status Indicators
Do not use standard icons. Use **Tonal Chips**:
*   **Urgent (Expiring Today):** `secondary_container` background with `on_secondary_container` text.
*   **Soon (2-3 Days):** `tertiary_fixed` background with `on_tertiary_fixed_variant` text.
*   **Safe (Fresh):** `primary_fixed` background with `on_primary_fixed_variant` text.
*   *Shape:* Use `full` roundedness (pills) to contrast against the `md` roundedness of item cards.

### Cards & Lists
*   **The Card:** Radius `md`. No border. Background: `surface_container_lowest`.
*   **Dividers:** Forbidden. Use `24px` of vertical whitespace to separate items. If separation is visually unclear, use a `surface-variant` background for every second item (zebra striping at 5% opacity).

### Interactive Elements
*   **Primary Button:** Gradient (`primary` to `primary_container`), `xl` roundedness, White text.
*   **Input Fields:** Minimalist. No bounding box. Only a `surface_variant` bottom-weighted "thick" line (2px) that turns `primary` on focus.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Whitespace:** If a screen feels "full," increase the padding. This system relies on "breathing room" to feel premium.
*   **Use Imagery:** Food items should use high-quality, transparent PNGs or professionally shot photography that "breaks" the container (e.g., a sprig of rosemary overlapping the edge of its card).
*   **Layer Neutrals:** Mix `surface`, `surface-dim`, and `surface-bright` to create visual interest without introducing new colors.

### Don't:
*   **Don't use 1px borders.** It immediately makes the UI look like a generic framework.
*   **Don't use pure Black (#000000).** Use `primary` or `on_surface` for dark tones; they contain the "warmth" required for the aesthetic.
*   **Don't center-align everything.** Use left-aligned typography for headers to maintain the editorial feel.
*   **Don't crowd the Expiration Indicators.** Give status chips room to breathe so the "Warning" color doesn't overwhelm the "Calm" forest green palette.