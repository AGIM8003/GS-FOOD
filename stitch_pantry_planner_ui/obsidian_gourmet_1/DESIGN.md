# Design System Specification: The Nocturnal Chef

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is not a utility; it is a high-end editorial experience designed to celebrate the artistry of food. We move away from the "grocery list" aesthetic of standard apps toward a "Chef’s Table" perspective. 

**The Creative North Star: The Digital Curator.**
The interface must feel like a premium gallery where the food is the art. We achieve this through "OLED-first" principles: pure black voids that make vibrant photography and glowing accents pop. We break the rigid, boxy grid by using intentional asymmetry, overlapping elements (like a dish image breaking the boundary of its container), and a high-contrast typography scale that feels like a luxury food magazine.

---

## 2. Colors & The Surface Philosophy
The palette is built for deep-contrast environments, utilizing the "True Black" of OLED screens to eliminate visual noise and save battery, while using vibrant neon-inspired accents to guide the eye.

### Color Tokens
*   **Primary (The Flame):** `#FFB693` (Base) | `#FF6B00` (Container/Accent). This represents heat and appetite. Use the `primary_container` for the "Glow" effect.
*   **Secondary (The Harvest):** `#EBFFE6` (Base) | `#00FE66` (Container/Accent). Used for freshness, organic options, and "Available Now" indicators.
*   **Neutral/Surface:** Base Background is `#131313` (Surface) transitioning to `#000000` for deep backgrounds.
*   **Urgency (The Heat):** `tertiary_container` (`#FF6858`). Reserved strictly for time-sensitive elements or "Limited Edition" dishes.

### The "No-Line" Rule
**Prohibit 1px solid structural borders.** You are forbidden from using lines to separate sections. Boundaries must be defined through:
1.  **Tonal Shifts:** Placing a `surface_container_low` section against a `surface` background.
2.  **Negative Space:** Using the Spacing Scale to create "voids" that act as dividers.

### Glass & Gradient Rule
To achieve "High-Tech" polish, use **Glassmorphism** for all floating elements. 
*   **Surface:** `white` at 10% opacity.
*   **Blur:** 20px - 40px Backdrop Blur.
*   **Signature Texture:** Apply a subtle radial gradient on the `primary_container` (Vibrant Orange) transitioning to a transparent core to create a "heat-map" glow behind hero dishes.

---

## 3. Typography: Editorial Authority
We use **Inter** exclusively, but we manipulate its tracking and weight to feel like custom typography.

*   **Display (Large/Medium):** `3.5rem` / `2.75rem`. Use for dish names. Tight letter-spacing (-0.02em). This conveys a bold, "chef-signature" feel.
*   **Headline (Small/Medium):** `1.5rem` / `1.75rem`. Used for category titles. High contrast against the black background.
*   **Title (Medium):** `1.125rem`. Use for card titles and prominent labels.
*   **Body (Large/Medium):** `1rem` / `0.875rem`. For descriptions. Increased line-height (1.6) to ensure readability against dark backgrounds.
*   **Labels:** `0.75rem`. Bold, uppercase for metadata (e.g., "KCAL," "PREP TIME").

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is not "up and down," it’s "light and dark." 

*   **The Layering Principle:** Stack `surface_container` tiers. 
    *   Base: `surface_dim` (#131313)
    *   Section: `surface_container_low` (#1b1b1b)
    *   Card: `surface_container` (#1f1f1f) or Glass.
*   **The Ghost Border:** If a container requires definition against a similar tone, use a **1px Ghost Border**: `outline_variant` (#5a4136) at 20% opacity.
*   **Ambient Glow (Shadows):** Replace standard black shadows with "Light Leaks." Use a large, 40px blur shadow tinted with `primary` (#FFB693) at 10% opacity to make cards look like they are sitting on a glowing warm surface.

---

## 5. Components: The Premium Kit

### Cards (The Hero Component)
*   **Design:** 24px corner radius (`lg`). 
*   **Constraint:** No dividers. Use 24px padding between content blocks inside the card.
*   **Interaction:** On hover/active, the `outline` token should glow slightly using the `primary` color at 40% opacity.

### Buttons (The Ignition)
*   **Primary:** Solid `primary_container` (#FF6B00) with a 20px "outer glow" shadow of the same color. 
*   **Tertiary:** Transparent background with the "Ghost Border" and `on_surface` text.
*   **Shape:** 9999px (pill-shaped) for a sleek, modern tech feel.

### Selection Chips
*   **State:** Unselected chips use `surface_container_highest`. Selected chips use the `secondary_container` (#00FE66) with black text for maximum contrast.

### Input Fields
*   **Style:** Minimalist. No bounding box—only a `surface_container_low` background with a 24px radius. 
*   **Active State:** The border glows with a 1px `primary` accent.

### Additional Signature Component: "The Chef’s Pulse"
A horizontal scrolling "live" indicator for order status, utilizing a `secondary` (Fresh Green) soft-pulsing glow effect to signify progress without using traditional progress bars.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Overlays:** Let high-quality PNGs of food spill over the edges of glass cards to create 3D depth.
*   **Embrace the Void:** Use generous padding (32px+) to let the OLED black breathe.
*   **Animate the Glow:** Use subtle "breathing" animations on primary CTAs.

### Don't:
*   **Don't use Divider Lines:** Never use a solid line to separate ingredients or menu items. Use white space.
*   **Don't use Grey Shadows:** Use tinted glows or tonal shifts. Pure grey shadows look "muddy" on OLED black.
*   **Don't use Standard Grids:** Offset images or text blocks occasionally to create an editorial, asymmetrical layout.
*   **Don't Over-illuminate:** Use the vibrant orange sparingly. If everything glows, nothing is important.