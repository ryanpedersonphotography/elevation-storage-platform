#!/usr/bin/env node
/**
 * Landing page generator CLI entry point.
 * Usage: node generate.mjs [--config <path>] [--out <dir>] [--validate] [--list-sections]
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { values } = parseArgs({
  options: {
    config: { type: 'string', short: 'c' },
    out: { type: 'string', short: 'o', default: 'dist' },
    validate: { type: 'boolean' },
    'list-sections': { type: 'boolean' },
  },
  allowPositionals: false,
});

// ── --list-sections ────────────────────────────────────────────────────────────
if (values['list-sections']) {
  const registryPath = resolve(__dirname, '../registry/sections.json');
  const sections = JSON.parse(readFileSync(registryPath, 'utf8'));
  const v1 = sections.filter((s) => s.phase === 'v1');

  const COL_ID = 40;
  const COL_ARCH = 14;
  const COL_STATUS = 12;

  const pad = (str, len) => String(str).padEnd(len);
  const header = `${pad('ID', COL_ID)}${pad('ARCHETYPE', COL_ARCH)}STATUS`;
  const divider = '-'.repeat(COL_ID + COL_ARCH + COL_STATUS);

  console.log(`\nV1 Sections (${v1.length} total)\n`);
  console.log(header);
  console.log(divider);

  for (const s of v1) {
    const ready = s.extractable && s.selfContained;
    const status = ready ? 'READY' : 'NEEDS WORK';
    console.log(`${pad(s.id, COL_ID)}${pad(s.archetype, COL_ARCH)}${status}`);
  }

  console.log('');
  process.exit(0);
}

// ── No --config: print usage ────────────────────────────────────────────────
if (!values.config) {
  console.error(`
Usage: node generate.mjs --config <path> [--out <dir>] [--validate] [--list-sections]

Options:
  -c, --config <path>    Path to page config JSON/YAML (required)
  -o, --out <dir>        Output directory (default: dist)
      --validate         Validate config only, do not generate
      --list-sections    List all V1-ready sections and exit
`);
  process.exit(1);
}

// ── Config provided: not yet implemented ────────────────────────────────────
console.log(`Config:  ${values.config}`);
console.log(`Out dir: ${values.out}`);
console.log('\nGeneration not yet implemented.');
process.exit(0);
