# Design System Specification: High-End Editorial Dark Mode

## 1. Overview & Creative North Star: "The Neon Curator"
The Creative North Star for this design system is **"The Neon Curator."** We are moving away from the "standard app" aesthetic toward a high-end, editorial digital experience that mirrors the energy of creator culture and the sophistication of luxury streetwear. 

To achieve this, the design system rejects the rigid, "boxed-in" layout of traditional e-commerce. Instead, we utilize **Intentional Asymmetry** and **Tonal Depth**. By overlapping elements and using extreme typography scales, we create a sense of movement. This system doesn't just display "deals"; it curates a premium lifestyle through soft glass surfaces and high-contrast neon accents.

---

## 2. Color Theory & Surface Strategy
Our palette is rooted in a deep, "ink-pool" grey (`#131316`), avoiding the flat, dated feel of pure `#000000`.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or cards. Visual boundaries must be achieved exclusively through:
1.  **Tonal Shifts:** Placing a `surface-container-high` element against a `surface` background.
2.  **Shadow Depth:** Using ambient, diffused shadows to lift an element.
3.  **Negative Space:** Using the `Spacing Scale` (specifically tokens 8 through 16) to create breathing room between content clusters.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent layers:
*   **Base Layer (`surface`):** The foundation of the experience.
*   **Nested Containers:** Use `surface-container-low` for large content areas and `surface-container-highest` for interactive elements like input fields or active cards. This creates a "molded" look rather than a "pasted" look.

### The "Glass & Gradient" Rule
To capture the "Instagram x Shopify" vibe, use **Glassmorphism** for floating headers, navigation bars, and overlays. 
*   **Token:** Use `surface-variant` at 60% opacity with a `20px` backdrop-blur.
*   **Signature Textures:** Main CTAs must use a linear gradient: `primary` (#ffabf3) to `primary_container` (#8a2387) at a 135° angle. This adds "soul" and a neon glow that flat colors cannot replicate.

---

## 3. Typography: Editorial Authority
The typography system balances the structural clarity of **Inter** with the bold, expressive personality of **Plus Jakarta Sans**.

*   **Display & Headlines (Plus Jakarta Sans):** Used for "The Hook." These should be set with tight letter-spacing (-0.02em) to feel authoritative and premium.
*   **Body & Labels (Inter):** Used for "The Details." Inter provides maximum readability at small scales (`body-sm` and `label-md`).
*   **Hierarchy Note:** Use `display-lg` (3.5rem) sparingly to anchor hero sections. The contrast between a massive `display` header and a refined `body-md` description creates the "Editorial" feel.

---

## 4. Elevation & Depth: The Layering Principle
Depth is our primary tool for hierarchy, replacing traditional lines and dividers.

### Ambient Shadows
For floating cards or high-priority modals, use "Ambient Shadows":
*   **Formula:** `0px 24px 48px rgba(0, 0, 0, 0.4)` tinted with a hint of `primary_container`. 
*   The goal is a soft, natural lift that mimics a light source from the top-center.

### The "Ghost Border" Fallback
If an element requires a boundary for accessibility (e.g., a search bar), use a **Ghost Border**:
*   **Token:** `outline-variant` at 15% opacity.
*   **Rule:** Never use 100% opaque borders. They break the fluid, glass-like aesthetic of the system.

---

## 5. Components & Primitive Styles

### Buttons (The "Pulse" of the Hub)
*   **Primary:** Gradient (`primary` to `primary_container`), `xl` roundedness (1.5rem), and a subtle `surface_tint` outer glow on hover.
*   **Secondary:** `surface-container-highest` background with `on_surface` text. No border.
*   **Tertiary:** Ghost style; text-only with `primary` color, switching to a low-opacity `primary_container` background on hover.

### Cards & Collections
*   **Geometry:** Always use `lg` roundedness (1rem/16px) for main product cards.
*   **Styling:** Forbid dividers. Separate header from body text using a `3` (1rem) spacing gap.
*   **Hover State:** Cards should subtly scale (1.02x) and shift from `surface-container-low` to `surface-container-high`.

### Input Fields
*   **Style:** Filled, not outlined. Use `surface-container-highest`.
*   **Bottom Indicator:** Instead of a full border, use a 2px high `primary` gradient line that animates from the center outward only when the field is focused.

### Creator Chips
*   **Usage:** For filtering "Deals by Creator."
*   **Style:** Semi-transparent `surface-variant` with a `sm` (0.25rem) radius. When selected, apply the signature neon gradient.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 5.5rem on the left, 7rem on the right) for editorial layouts to create visual interest.
*   **Do** use `surface-bright` for hover states on dark backgrounds to create a "lit from within" effect.
*   **Do** ensure text on neon gradients is either `on_primary_fixed_variant` or pure white for maximum legibility.

### Don't:
*   **Don't** use 1px dividers. Use vertical white space (`spacing-8` or `spacing-10`) to separate content sections.
*   **Don't** use pure black `#000000`. It kills the depth of the glassmorphism effects.
*   **Don't** use sharp corners. Every interactive element must have at least a `DEFAULT` (0.5rem) radius to maintain the "Soft Premium" feel.
*   **Don't** over-saturate. Use neon gradients only for 10% of the screen real estate to ensure they act as true focal points.