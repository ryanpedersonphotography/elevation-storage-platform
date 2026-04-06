# Sub-Agent Team — Landing Page Builder

Six specialized agents that Forge dispatches to build landing pages. Each is launched via the Agent tool with a focused prompt. They work on isolated tasks and report back.

## Team Overview

```
Forge (Planner)
  ├── Registry Builder      — catalogs sections into registry
  ├── Recipe Extractor      — copies recipe-tier sections (own files)
  ├── Page Carver           — carves page-inline sections into standalone components
  ├── Dependency Resolver   — builds dependency graph, resolves conflicts
  ├── Page Assembler        — composes the final Next.js project
  └── QA Smoker             — validates the output builds and renders
```

## Agent Definitions

### 1. Registry Builder

**Purpose:** Scan a candidate's source code and populate `_builder/registry/sections.json` with normalized entries for every extractable section.

**When to dispatch:** When the registry is empty, outdated, or a new candidate needs cataloging.

**Dispatch pattern:**
```
Agent(subagent_type="Explore", prompt="""
Scan {candidate_path} and produce a JSON array of section entries following the registry format in _builder/SPEC.md.

For each page-level section or recipe, output ALL fields including:
- id, candidate, name, archetype, tier, description
- source: { component, styles, dependencies, tokens }
- contentSlots, configSlots
- npmDeps: list ALL npm packages imported by this section (not just in-tree files)
- stylingSystem, animation, framework
- extractable: TRUE only if the section has its own component file (not inline in a page)
- selfContained: TRUE only if the section has no hidden dependencies on parent page layout
- extractionComplexity: "ready" (own files, can copy), "requires-refactor" (inline but isolatable), "requires-rewrite" (deep integration, framework mismatch)
- extractionNotes: honest description of what extraction actually requires
- layoutRelationships: any overlap, negative margin, z-index, or CSS variable dependencies
- peerSections: sections that naturally pair with this one
- phase: which builder phase this section belongs to

Be honest about extractability. Page-inline sections embedded in monolithic page files are NOT extractable — they require refactoring or rewriting.
""")
```

**Output:** Updated `sections.json` entries for that candidate.

---

### 2. Recipe Extractor

**Purpose:** Copy recipe-tier sections (those with their own component directory and CSS module) from a candidate into the output project, refactoring hardcoded content to accept props.

**When to dispatch:** During page generation, for each section with `extractionComplexity: "ready"`.

**Dispatch pattern:**
```
Agent(subagent_type="general-purpose", prompt="""
Extract the recipe-tier section "{registryId}" for use in a generated landing page.

Source component: candidates/{candidate}/{source.component}
Source styles: candidates/{candidate}/{source.styles[0]}
Registry entry: {full registry JSON}
Content overrides: {content from page config}

This section has its own component directory — extraction is a copy + refactor operation.

Tasks:
1. Copy the component TSX file to {output_dir}/sections/{sectionName}/
2. Copy its co-located CSS module to the same directory
3. Identify all hardcoded content (text strings, image paths, data arrays) in the component
4. Refactor the component to accept these as props, using the content overrides as defaults
5. Create a types file with the props interface
6. List ALL imports in the component — both in-tree (atoms, utils) and npm packages
7. For each in-tree dependency, record: { path, type: "atom"|"util"|"recipe", candidate }

PATH SAFETY: Verify all source paths resolve within candidates/{candidate}/. Reject any path containing "..".

Output a JSON manifest:
{
  "files": ["list of files created"],
  "inTreeDeps": [{ "path": "...", "type": "...", "candidate": "..." }],
  "npmDeps": ["package-name"],
  "tokenFiles": ["list of token CSS files needed"]
}
""")
```

**Output:** Extracted section files + dependency manifest.

---

### 3. Page Carver

**Purpose:** For page-inline sections (JSX fragments inside monolithic page files), carve the relevant JSX and CSS into a new standalone component.

**When to dispatch:** During page generation, for sections with `extractionComplexity: "requires-refactor"`. These have been pre-identified as isolatable but need component creation.

**Pre-condition:** The 4 sidebar-glass-gsap page-inline sections should ideally be pre-carved into `_builder/extracted/` during V1 setup, not carved on-the-fly. If pre-extracted versions exist, use those instead of dispatching this agent.

**Dispatch pattern:**
```
Agent(subagent_type="general-purpose", prompt="""
Carve the page-inline section "{registryId}" into a standalone React component.

Source page: candidates/{candidate}/{source.component}
Source CSS module: candidates/{candidate}/{source.styles[0]}
Registry entry: {full registry JSON}
Content overrides: {content from page config}

This section is currently inline JSX inside a page file. You must:
1. Read the source page file and identify the JSX block for this section (look for the section id="{sectionId}" or the className matching the registry description)
2. Extract that JSX block into a new component file at {output_dir}/sections/{sectionName}/{SectionName}.tsx
3. Extract the relevant CSS classes from the source CSS module into a new {SectionName}.module.css file
4. Create a props interface for content that was hardcoded in the page
5. Apply content overrides as default prop values
6. List all imports and dependencies

IMPORTANT: Do NOT extract unrelated CSS classes. Only extract classes used by this specific section.
IMPORTANT: Preserve the exact visual output. If the section uses negative margins or z-index for overlap effects (check layoutRelationships in the registry), document these in the component's comments so the Page Assembler can preserve them.

Output the same manifest format as Recipe Extractor.
""")
```

**Output:** New standalone component files + manifest.

---

### 4. Dependency Resolver

**Purpose:** Given manifests from all extracted sections, build a complete transitive dependency graph, detect conflicts, aggregate npm packages, and produce a unified dependency manifest.

**When to dispatch:** After all Recipe Extractor and Page Carver agents complete.

**Dispatch pattern:**
```
Agent(subagent_type="general-purpose", prompt="""
Resolve dependencies for a generated landing page.

Section manifests: {array of manifests from extractors}
Candidate source: candidates/{candidate}/

Tasks:
1. Collect all in-tree dependencies from all section manifests
2. For each dependency, recursively walk ITS imports to find transitive dependencies
3. Detect naming conflicts: if two sections reference different implementations of the same atom name (e.g., both have "Button" but from different candidates), report as ERROR
4. Deduplicate: if multiple sections share the same atom (same file path), copy it once
5. Copy all resolved atoms to {output_dir}/system/atoms/
6. Copy all resolved utilities to {output_dir}/system/utils/
7. Collect all token file paths from manifests, verify they exist
8. Copy token files to {output_dir}/styles/tokens/
9. Aggregate all npmDeps from all manifests into one array, check for version conflicts
10. Generate {output_dir}/dependency-manifest.json with:
    - atoms: [{ name, sourcePath, usedBy: [sectionIds] }]
    - utils: [{ name, sourcePath }]
    - tokens: [paths]
    - npmDeps: { "package": "version" }
    - conflicts: [] (empty if none, otherwise details)

PATH SAFETY: All paths must resolve within candidates/{candidate}/. Reject any containing "..".

If there are unresolvable conflicts (different atom implementations needed by different sections), report them clearly and STOP. Do not guess which implementation to use.
""")
```

**Output:** `dependency-manifest.json` + copied atom/util/token files.

---

### 5. Page Assembler

**Purpose:** Compose the final Next.js project from extracted sections, resolved dependencies, and the page config.

**When to dispatch:** After Dependency Resolver completes successfully (no conflicts).

**Dispatch pattern:**
```
Agent(subagent_type="general-purpose", prompt="""
Assemble a complete Next.js landing page project.

Page config: {page config JSON}
Extracted sections: {output_dir}/sections/
Resolved dependencies: {output_dir}/dependency-manifest.json
Atoms: {output_dir}/system/atoms/
Tokens: {output_dir}/styles/tokens/
Base candidate: candidates/sidebar-glass-gsap/

Tasks:
1. Create {output_dir}/app/layout.tsx:
   - Import fonts from next/font/google matching the base candidate (Playfair Display, Lato, Libre Franklin, Parisienne)
   - Set up metadata from config.meta
   - Theme initialization script (data-theme attribute on html, localStorage persistence)
   - If ProSidebar section is included: wrap children with sidebar, set --glass-toolbar-offset

2. Create {output_dir}/app/page.tsx:
   - Import each section component
   - Render sections in config order
   - Pass content props from config to each section
   - Respect layoutRelationships: if sections have overlap dependencies, preserve the CSS structure (negative margins, z-index)

3. Create {output_dir}/app/globals.css:
   - Import all token files from styles/tokens/
   - Import layout-utilities.css from base candidate
   - CSS reset matching base candidate

4. Create {output_dir}/package.json:
   - Include all npmDeps from dependency-manifest.json
   - Include next, react, react-dom, typescript
   - Include @heroicons/react if ProSidebar is present
   - Set scripts: dev, build, start, lint

5. Create {output_dir}/next.config.mjs:
   - Configure images.remotePatterns if content includes external URLs
   - Set up path aliases matching tsconfig

6. Create {output_dir}/tsconfig.json:
   - Path alias @/ pointing to src or root
   - Strict mode

7. If any form section (TourForm) is included:
   - Create {output_dir}/app/api/schedule-tour/route.ts
   - Minimal POST handler that logs form data and returns success
   - Add a TODO comment for real backend integration

The generated project MUST be buildable with: npm install && npm run build
""")
```

**Output:** Complete Next.js project in the output directory.

---

### 6. QA Smoker

**Purpose:** Validate that the generated landing page builds, renders, and looks correct.

**When to dispatch:** After Page Assembler completes.

**Dispatch pattern:**
```
Agent(subagent_type="general-purpose", prompt="""
Validate the generated landing page at {output_dir}.

Tasks:
1. Run `npm install` in {output_dir} — report any dependency errors
2. Run `npm run build` in {output_dir} — report any build/type errors
   - If build fails: read error output, identify which file and line caused it, check if it's a missing import/dependency, suggest fix
3. Run `npm run dev` in background, wait for server ready (check stdout for "Ready")
4. Use Playwright or curl to:
   a. Load http://localhost:3000 — verify response is not empty/error
   b. Check for console errors — report any
   c. For each section in the config, verify its expected content text appears in the page HTML
   d. Take a full-page screenshot → {output_dir}/qa/full-page.png
   e. If form section present: submit with test data, verify no crash
   f. If nav section present: verify section links exist
5. Kill the dev server
6. Write results to {output_dir}/qa/report.json:
   {
     "status": "PASS" | "FAIL",
     "checks": [
       { "name": "install", "status": "PASS|FAIL", "details": "..." },
       { "name": "build", "status": "PASS|FAIL", "details": "..." },
       { "name": "render", "status": "PASS|FAIL", "details": "..." },
       { "name": "content-{sectionId}", "status": "PASS|FAIL", "details": "..." }
     ],
     "screenshot": "qa/full-page.png",
     "errors": []
   }

If build fails, DO NOT proceed to render checks. Focus on diagnosing the build failure.
If build succeeds but render fails, capture whatever screenshot is possible.
""")
```

**Output:** QA report JSON + screenshots.

---

## Dispatch Orchestration

When generating a page, Forge dispatches agents in this order:

```
Phase 0 (if needed):  Registry Builder (if registry is stale)
Phase 1 (parallel):   Recipe Extractor × N (one per "ready" section)
                      Page Carver × M (one per "requires-refactor" section)
                      — OR use pre-extracted versions from _builder/extracted/ if available
Phase 2 (sequential): Dependency Resolver (needs all Phase 1 manifests)
Phase 3 (sequential): Page Assembler (needs Phase 2 output)
Phase 4 (sequential): QA Smoker (needs Phase 3 output)
```

Use `run_in_background: true` for Phase 1 agents to maximize parallelism. Phases 2-4 are sequential — each depends on the previous.

**Important:** Phase 1 extractors write to separate directories (`sections/{name}/`) so they cannot conflict. The Dependency Resolver in Phase 2 handles deduplication of shared atoms.

## Error Handling

| Error | Action |
|-------|--------|
| Registry entry not found | Offer to run Registry Builder for that candidate |
| Section has `phase` > current | Warn user this section isn't V1-ready, suggest V1 alternative |
| Section has `extractionComplexity: "requires-rewrite"` | Reject — this section cannot be extracted without framework rewrite |
| Atom naming conflict (different implementations) | Fail build with clear error listing the conflicting atoms and which sections need them |
| Path traversal detected | Reject the registry entry, warn user |
| npm dependency version conflict | Report both versions, suggest resolution |
| Build fails | QA Smoker diagnoses root cause with file/line reference |
| Section renders blank | Check dependency manifest — likely missing atom or token import |
| Layout overlap broken | Check layoutRelationships — sections may have been reordered incorrectly |
