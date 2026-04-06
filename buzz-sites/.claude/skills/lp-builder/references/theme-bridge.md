# Theme Bridge Reference

## V1: No Bridge Needed

All V1 sections come from **sidebar-glass-gsap** and share the same 4-tier token system:

```
primitives.css → semantic.css → treatments.css → component.css
```

No cross-candidate bridging required. All sections consume the same CSS custom properties, same spacing scale, same color palette, same font stack.

## V1.5: Token-to-Token Bridge (sidebar-glass)

sidebar-glass uses a single `tokens.css` file vs sidebar-glass-gsap's 4-tier split. The token names are nearly identical (same architecture), with minor differences:

| sidebar-glass | sidebar-glass-gsap | Notes |
|--------------|-------------------|-------|
| `--color-bg-base` | `--color-bg-base` | Same |
| `--color-text-primary` | `--color-text-primary` | Same |
| `--color-accent` | `--color-accent` | Same |
| `--surface-default` | `--color-surface-default` | Minor naming |
| `--space-*` | `--space-*` | Same scale |

**Bridge approach:** A minimal `tokens-to-tokens.css` that aliases the few naming differences. Low risk — same design system, same architecture.

**Additional requirement:** sidebar-glass sections use **Framer Motion** for animations. The output project needs `framer-motion` as an npm dependency when including these sections.

## V2+: Cross-System Bridges (Deferred)

### Why Cross-Candidate Bridging Failed in V1 Design

Three reviewers (Claude, Gemini, Codex) independently identified fundamental problems:

#### 1. Tailwind Utility Classes Cannot Be Bridged with CSS Variables

**Problem:** landing-version components use Tailwind utility classes like `bg-amber-600`, `rounded-[2rem]`, `backdrop-blur-md` directly in JSX. These classes are compiled by Tailwind's CSS compiler — they don't exist as CSS rules until Tailwind processes them.

**Why CSS variable bridges fail:** A `.bridge-landing-version { --foreground: var(--color-text-primary); }` wrapper can map CSS variables, but cannot make Tailwind utility classes resolve. The classes simply won't exist in the output CSS.

**V3 solution:** Include the full Tailwind build pipeline in the output project when landing-version sections are used. The output project would have both CSS Modules and Tailwind configured.

#### 2. Monolith CSS Cannot Be Scoped by Wrapper Class

**Problem:** classic-clean's `CohesiveDesign.css` is 4,439 lines with no namespacing. It uses global selectors (`body`, `html`, `button`, `*`), element selectors, and high-specificity rules.

**Why wrapper scoping fails:** A `.bridge-classic-clean` wrapper cannot prevent:
- Global selectors from affecting the entire page
- `!important` rules from overriding base styles
- Element selectors (e.g., `button { ... }`) from bleeding outside the wrapper

**V2 solution:** During pre-extraction, carve relevant CSS rules from the monolith into scoped CSS Modules per section. This is a manual, one-time effort per section.

#### 3. React Router Components Need Framework Rewrite

**Problem:** classic-clean components import from `react-router-dom` (`Link`, `useNavigate`), use client-side data fetching hooks (`useContentfulHomePage`), and assume a Vite build system.

**V2 solution:** Rewrite each classic-clean component for Next.js App Router during pre-extraction. Replace `Link` imports, remove CMS hooks, adapt to Server Components.

### Token Mapping Tables (for future reference)

#### landing-version → sidebar-glass-gsap (V3)

| Tailwind / landing-version | sidebar-glass-gsap | Notes |
|---------------------------|-------------------|-------|
| `text-foreground` → `--foreground` | `--color-text-primary` | Requires Tailwind config mapping |
| `bg-background` → `--background` | `--color-bg-base` | |
| `rounded-[2rem]` | `var(--radius-4)` | Explicit value → token |
| `bg-amber-600` | `var(--color-accent)` | Amber → accent |
| `backdrop-blur-md` | `var(--treatment-surface-glass-light)` | |
| Geist Sans | Lato / Libre Franklin | Font substitution |

#### classic-clean → sidebar-glass-gsap (V2)

| classic-clean | sidebar-glass-gsap | Notes |
|--------------|-------------------|-------|
| `--sage-green` | `--color-accent` | Color intent mapping |
| `--warm-walnut` | `--color-text-primary` | |
| `--dusty-rose` | `--color-accent-secondary` | |
| `--warm-cream` | `--color-bg-base` | Light theme only |
| `--gold-accent` | `--color-accent` | |
| `--font-display` (Playfair) | `var(--font-display)` (Playfair) | Same font |
| `.section` padding | `var(--space-section)` | Spacing mapping |
| `.content-wrapper` | `.container` | Max-width mapping |

### Font Reconciliation

| Base Candidate | Display | Body | UI | Script |
|---------------|---------|------|-----|--------|
| sidebar-glass-gsap | Playfair Display | Lato | Libre Franklin | Parisienne |
| sidebar-glass | Cormorant Garamond | Source Serif 4 | Libre Franklin | Parisienne |
| landing-version | Geist Sans | Geist Sans | Geist Sans | — |
| classic-clean | Playfair Display | System sans | System sans | — |

V1/V1.5: All sections use the base candidate's font stack. No per-section font overrides.
