```markdown
# Design System Documentation: The Nocturnal Alchemist

## 1. Overview & Creative North Star
This design system is built to facilitate a high-end, editorial experience that bridges the gap between medical precision and culinary ritual. We are not building a standard utility app; we are crafting a digital sanctuary.

**Creative North Star: "The Nocturnal Alchemist"**
The aesthetic is defined by "Deep-Sea Depth"—a vast, OLED-black canvas where light is used sparingly and intentionally. We break the "template" look by utilizing intentional asymmetry, overlapping glass elements, and extreme typographic contrast. We favor the "Technical-Ritual" dichotomy: using sterile, mono-spaced labels alongside sweeping, high-contrast display type.

---

## 2. Color & Surface Architecture
The color palette is rooted in a high-contrast relationship between the void and vibrant, bio-luminescent accents.

### Color Tokens
*   **Background / Deepest Void:** `#131313` (Base) scaling down to `#000000` (OLED Custom).
*   **Primary (Ritual Orange):** `primary_container` (`#FF6B00`) – Used for primary actions and "active" ritual states.
*   **Secondary (Vital Green):** `secondary_container` (`#00FF66`) – Reserved for medical validation, health protocols, and fresh status indicators.
*   **The Neutral Tiers:** We utilize `surface_container_lowest` (`#0e0e0e`) through `surface_container_highest` (`#353535`) to create depth without borders.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. 
Boundaries must be defined solely through:
1.  **Background Shifts:** A `surface_container_low` card sitting on a `surface` background.
2.  **Tonal Transitions:** Using subtle `outline_variant` gradients (10-20% opacity) only if absolutely necessary for accessibility.

### The Glass & Gradient Rule
To move beyond a flat interface, floating elements (like protocol selectors) must use **Glassmorphism**.
*   **Glass Recipe:** `surface_variant` at 40% opacity + `backdrop-blur: 24px`.
*   **Signature Gradients:** Use a subtle linear transition from `primary` (`#ffb693`) to `primary_container` (`#FF6B00`) for hero CTAs to provide a "pulsing" organic soul.

---

## 3. Typography
Our typography strategy leverages a tripartite system to convey authority and elegance.

*   **Display & Headlines (Epilogue):** The "Voice." Use `display-lg` and `headline-lg` for onboarding headers. The tight kerning and geometric weight of Epilogue convey a premium, editorial feel. 
*   **Body & Titles (Manrope):** The "Narrative." Used for ritual descriptions and medical instructions. Manrope’s modern humanist qualities ensure high legibility in low-light (dark mode) environments.
*   **Technical Labels (Space Grotesk):** The "Data." Use `label-md` and `label-sm` for medical dosages, timestamps, and metadata. This mono-leaning typeface injects a sense of clinical precision.

---

## 4. Elevation & Depth
Depth in this system is a measure of "Physicality." We do not use traditional drop shadows.

*   **Tonal Layering:** Depth is achieved by "stacking." A `surface_container_highest` element feels closer to the user than a `surface_container_low` element.
*   **Ambient Glows:** Instead of black shadows, use "Ambient Glows." For a primary button, apply a drop shadow using the `primary` color at 10% opacity with a 32px blur. This simulates a neon light reflecting off a dark surface.
*   **Ghost Borders:** For selection states, use a `0.5px` stroke of `primary` at 30% opacity. It should feel like a faint wireframe, not a heavy container.

---

## 5. Components & Interaction Patterns

### Ritual Selection Cards (Premium Glass)
Instead of standard list items, use large-format glass cards for onboarding protocol selection.
*   **Surface:** `surface_container_low` with 12px blur.
*   **State:** When selected, the background shifts to `primary_container` at 10% opacity with a `primary` ghost border.
*   **Asymmetry:** Place the protocol name (`headline-sm`) in the top left and the medical dosage (`label-md`) in the bottom right to break the horizontal grid.

### Ritual Buttons
*   **Primary:** High-gloss gradient (`primary` to `primary_container`). Border radius: `DEFAULT` (0.25rem) for a sharp, architectural look.
*   **Secondary:** Ghost variant. No fill, `outline_variant` border (20% opacity), `primary` text.

### Selection Patterns (Medical Protocols)
*   **Radio Buttons/Checkboxes:** Never use standard OS-native circles/squares. Use a "Dim-to-Bright" toggle. An unselected state is `surface_container_highest`. A selected state is a solid `primary_container` dot with an outer glow.
*   **Input Fields:** Use "Underline Only" styling with `surface_container_highest`. Focus state transitions the underline to `primary` via a center-out animation.

### Lists & Dividers
*   **The Divider Ban:** Strictly forbid `hr` lines. Separate list items using `16px` of vertical white space or a subtle shift from `surface_container_lowest` to `surface_container_low`.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme vertical white space (e.g., `64px+`) between onboarding steps to create a sense of calm.
*   **DO** overlap elements. Let a glass card partially obscure a large `display-lg` background numeral to create depth.
*   **DO** use `secondary` (`#00FF66`) specifically for positive medical feedback (e.g., "Protocol Validated").

### Don't
*   **DON'T** use pure white text. Use `on_surface` (`#e2e2e2`) to reduce eye strain against the black background.
*   **DON'T** use rounded corners larger than `xl` (0.75rem) for main containers. We want "Sophisticated Precision," not "Bubbly Playfulness."
*   **DON'T** use standard "Material Design" blue or red. Use our specific `error` and `tertiary` tokens to maintain the brand’s nocturnal palette.

---

## 7. Onboarding Signature Pattern
During the "Medical Protocol" setup, use a **Progressive Disclosure** pattern.
1.  **The Question:** Displayed in `headline-lg` (Epilogue).
2.  **The Selection:** Large, asymmetric glass cards that "light up" (inner glow) when tapped.
3.  **The Transition:** Elements should slide vertically with a "Heavy-to-Light" easing (Cubic Bezier: 0.16, 1, 0.3, 1), making the UI feel like it has physical weight.```