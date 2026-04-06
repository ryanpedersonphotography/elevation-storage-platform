# Section Registry Reference

## Registry Location

`{project-root}/_builder/registry/sections.json`

## Section Archetypes

Sections are classified by archetype — their role in a landing page's visual rhythm.

| Archetype | Role in Page | Count |
|-----------|-------------|-------|
| hero | Opening impact — grabs attention, sets tone | 4 |
| stats | Trust signal — numbers that build credibility | 3 |
| features | Value communication — what makes the venue special | 5 |
| gallery | Visual showcase — spaces, events, portfolio | 4 |
| banner | Emotional pause — cinematic break between content | 1 |
| timeline | Story arc — chronological narrative | 2 |
| form | Conversion — lead capture, tour scheduling | 4 |
| map | Practical — location, directions, contact | 4 |
| nav | Navigation — header bar, sidebar, mobile menu | 4 |
| footer | Closure — final links, branding, contact | 2 |
| testimonials | Social proof — reviews, couple stories | 1 |
| vendors | Ecosystem — preferred vendor directory | 1 |
| chat | Engagement — AI assistant or live chat | 1 |
| detail | Content — long-form info (events, history, accommodations) | 3+ |

## Cross-Candidate Sections by Archetype

### Hero (4 variants)

| ID | Candidate | Style | Features |
|----|-----------|-------|----------|
| `classic-clean:hero` | classic-clean | Custom CSS | Romantic overlay, script accent, CTA, scroll indicator |
| `landing-version:hero` | landing-version | Tailwind | 3-image composition, facts grid, inline form |
| `sidebar-glass:home-hero` | sidebar-glass | CSS Modules | Background image, Framer Motion slide-up text |
| `sidebar-glass-gsap:home-hero` | sidebar-glass-gsap | CSS Modules | 7-slide carousel, scrim, vellum glass, dot nav |

### Gallery (4 variants)

| ID | Candidate | Style | Features |
|----|-----------|-------|----------|
| `classic-clean:gallery` | classic-clean | Custom CSS | Masonic layout, lightbox, category tabs, 51 photos |
| `landing-version:spaces-grid` | landing-version | Tailwind | 2x2 cards with kicker badges, feature points |
| `sidebar-glass:venue-showcase` | sidebar-glass | CSS Modules | Tabbed interface, carousel per tab, fade transitions |
| `sidebar-glass-gsap:gallery-carousel` | sidebar-glass-gsap | CSS Modules | 3-col staggered grid, hover gild, JewelFrame |

### Form (4 variants)

| ID | Candidate | Style | Features |
|----|-----------|-------|----------|
| `classic-clean:schedule-tour-form` | classic-clean | Custom CSS | 9 fields, Netlify integration, vendor variant |
| `landing-version:leadgen-form` | landing-version | Tailwind | 4 fields with icons, amber CTA, inline hero |
| `sidebar-glass:schedule-tour-form` | sidebar-glass | CSS Modules | 5 fields, glassmorphic surface, API endpoint |
| `sidebar-glass-gsap:tour-form` | sidebar-glass-gsap | CSS Modules | 5 fields, glass-plate backdrop, bronze focus |

### Features (5 variants)

| ID | Candidate | Style | Features |
|----|-----------|-------|----------|
| `classic-clean:feature-blocks` | classic-clean | Custom CSS | Alternating image/text, numbered |
| `classic-clean:experience-cards` | classic-clean | Custom CSS | Icon cards (3-up) |
| `landing-version:value-props` | landing-version | Tailwind | 3-card grid, glassmorphic cards |
| `sidebar-glass:feature-sequence` | sidebar-glass | CSS Modules | 3 numbered blocks, slide-up animation |
| `sidebar-glass-gsap:setting-section` | sidebar-glass-gsap | CSS Modules | Split layout, JewelFrame image, checklist |

## Styling System Compatibility

| Mixing | Complexity | Bridge Required |
|--------|-----------|-----------------|
| sidebar-glass + sidebar-glass-gsap | Low | Token mapping only (same architecture) |
| landing-version + sidebar-glass-gsap | Medium | Tailwind → CSS custom properties |
| classic-clean + sidebar-glass-gsap | Medium | Custom properties remapping |
| classic-clean + landing-version | High | Custom CSS + Tailwind in same page |
| Any 3+ candidates | High | Multiple bridges, potential conflicts |

**Recommendation:** For V1, prefer mixing at most 2 candidates per page. Use `sidebar-glass-gsap` as the base candidate when possible (richest token system).

## Content Slot Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Plain text | Title, description, button label |
| `string[]` | Array of strings | Feature bullet points, checklist items |
| `image` | Single image path | Hero background, banner image |
| `image[]` | Array of image paths | Carousel slides, gallery cards |
| `card` | Object with title + description | Feature card, value prop |
| `card[]` | Array of cards | Card grid sections |
| `richCard` | Card + image + extras | Gallery card with src, alt, title, description |
| `richCard[]` | Array of rich cards | Spaces showcase, venue discovery |
