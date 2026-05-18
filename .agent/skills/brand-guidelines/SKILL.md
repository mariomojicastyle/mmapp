---
name: brand-guidelines
description: Enforces the Mario Mojica platform brand identity, strictly requiring support for both the "Tech Ethos" (Primary Light Theme) and "Obsidian Teal" (Secondary Dark Theme) aesthetics. Use when designing UI components, setting up CSS/Tailwind, or styling any visual elements.
---

# Mario Mojica Platform Brand Guidelines

## Core Directive: Dual Theme Architecture
The platform was originally designed with **"Tech Ethos"** (Light Theme) as the primary identity. Over time, development drifted exclusively into **"Obsidian Teal"** (Dark Theme). 
**CRITICAL RULE:** All future UI development MUST support both themes. If a component is built or updated, it must be validated for its "Tech Ethos" light mode appearance first, then mapped to its "Obsidian Teal" dark mode equivalent.

---

## 1. Primary Theme: "Tech Ethos" (Light Mode)
*The default, clean, and highly legible interface.*

### Principles
- **Clarity over density:** High contrast, breathable whitespace, and legible typography.
- **Tech-forward minimalism:** Clean edges, subtle shadows for depth, not borders.

### Color Palette (Light)
*Note: These are inferred target values. Use semantic variables in CSS.*
- `background`: `#FAF9F5` (Off-white/Warm Light) or `#FFFFFF`
- `surface`: `#F4F5F7`
- `primary`: Clean Teal/Cyan (e.g., `#0088AA`)
- `text-primary`: `#141413` (Near Black)
- `text-secondary`: `#666666`

---

## 2. Secondary Theme: "Obsidian Teal" (Dark Mode)
*The "Digital Obsidian" high-density architectural environment.*

### Principles
- **Tonal Sculpting:** No 1px borders. Define space through background shifts.
- **Glass & Gradient:** Use backdrop-blur for floating elements. Main CTAs use subtle linear gradients.

### Color Palette (Dark)
- `surface`: `#111319` (The primary abyss)
- `surface-container-low`: `#191B22` (Sidebars)
- `surface-container`: `#1E1F26` (Card bodies)
- `surface-container-high`: `#282A30` (Active panels/hovers)
- `primary`: `#71D3F7`
- `primary-container`: `#2F9CBF`
- `text-primary` (`on-surface`): `#E2E2EB`
- `text-secondary` (`on-surface-variant`): `#BEC8CE`

---

## 3. Typography: Editorial Authority
**Font Family:** `Inter` (Sans-serif)
- **Display-LG (3.5rem):** Hero numbers. Tight tracking (-0.02em).
- **Headline-SM (1.5rem):** Page headers. Semi-bold. Editorial feel.
- **Body-MD (0.875rem):** Standard text.
- **Label-SM (0.6875rem):** All-caps, +0.05em tracking for micro-copy and metadata.

---

## 4. Component Rules
- **No-Divider Mandate:** Do not use 1px horizontal lines to separate lists. Use vertical whitespace (gap) or alternating subtle background tints (`surface-container-lowest`).
- **Ambient Shadows (Dark Mode):** Avoid black drop-shadows. Use colored shadows (e.g., `primary` with 8% opacity and 24px blur) for a monitor glow effect.
- **Ghost Borders:** If an outline is absolutely required for accessibility, use 15%-20% opacity borders.

## Implementation Workflow
1. **Always use CSS Variables:** Define `--bg-primary`, `--surface`, `--text-main`, etc.
2. **Media Query:** Use `@media (prefers-color-scheme: dark)` or a `.dark` class to toggle variables.
3. **Review:** Does it look good in "Tech Ethos" (Light)? Does it transition flawlessly to "Obsidian Teal" (Dark)?
