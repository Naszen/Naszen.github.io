// Verificación estática del sitio. Uso: node tools/check.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const IGNORE = new Set(['.git', 'docs', 'tools', 'node_modules', '.superpowers']);
const errors = [];
const err = (rule, file, msg) => errors.push(`✗ ${rule} ${relative(ROOT, file)}: ${msg}`);

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (IGNORE.has(n)) continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
const files = walk(ROOT);
const html = files.filter(f => f.endsWith('.html'));
const text = files.filter(f => /\.(html|css|js|txt|md|json|xml)$/.test(f));

// 1. Cadenas prohibidas en archivos servidos
for (const f of text) {
  const s = readFileSync(f, 'utf8');
  if (/outlook/i.test(s)) err('forbidden', f, 'contiene "outlook"');
  if (/dropalert/i.test(s)) err('forbidden', f, 'menciona DropAlert');
  if (/bootstrap|jquery|now-ui|aos\.js/i.test(s)) err('forbidden', f, 'referencia a dependencias antiguas');
  if (/679\s?59\s?62\s?71|679596271/.test(s) && !f.includes(`${'/'}cv${'/'}`)) err('phone', f, 'teléfono fuera de /cv/');
}

// 2. Enlaces y recursos locales
const resolveLocal = (from, url) => {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return null;
  const base = clean.startsWith('/') ? join(ROOT, clean) : join(dirname(from), clean);
  if (existsSync(base) && statSync(base).isDirectory()) return join(base, 'index.html');
  return base;
};
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u)) continue;
    const target = resolveLocal(f, u);
    if (target && !existsSync(target)) err('link', f, `roto → ${u}`);
  }
  for (const m of s.matchAll(/href="#([^"]+)"/g)) {
    if (!new RegExp(`id="${m[1]}"`).test(s)) err('anchor', f, `ancla sin destino #${m[1]}`);
  }
}

// 3. i18n: <html> correcto y pares es/en equilibrados
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  if (!/<html[^>]*data-lang="es"/.test(s)) err('i18n', f, '<html> sin data-lang="es"');
  for (const a of ['data-title-es', 'data-title-en']) if (!s.includes(a)) err('i18n', f, `falta ${a}`);
  const es = (s.match(/data-lang="es"/g) || []).length - 1; // menos el de <html>
  const en = (s.match(/data-lang="en"/g) || []).length;
  if (es !== en) err('pairs', f, `data-lang es=${es} en=${en}`);
  if (!s.includes('data-set-lang="en"')) err('i18n', f, 'sin selector de idioma');
}

// 4. Reglas de analítica
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f);
  const hasGA = s.includes('/assets/js/analytics.js');
  const mustNot = /(privacy|support)\/index\.html$/.test(rel) || rel === '404.html';
  if (mustNot && hasGA) err('ga', f, 'analítica en página legal/404');
  if (!mustNot && !hasGA) err('ga', f, 'falta analytics.js');
  if (/googletagmanager/.test(s)) err('ga', f, 'gtag en línea: debe cargarse solo desde analytics.js');
}

// 5. Páginas obligatorias
const required = ['index.html', 'cv/index.html', '404.html', '.nojekyll',
  ...['schede', 'keppi', 'plantiario', 'cooktribe', 'quicksound'].flatMap(a => [`${a}/index.html`, `${a}/privacy/index.html`, `${a}/support/index.html`])];
for (const r of required) if (!existsSync(join(ROOT, r))) errors.push(`✗ required ${r}: no existe`);

// 6. Plantiario: el texto legal se conserva literal (salvo email)
for (const p of ['privacy', 'support']) for (const l of ['es', 'en']) {
  const page = join(ROOT, 'plantiario', p, 'index.html');
  const base = join(ROOT, 'tools', 'baseline', `plantiario-${p}-${l}.txt`);
  if (!existsSync(page) || !existsSync(base)) continue;
  const now = execFileSync('node', [join(ROOT, 'tools', 'extract-lang.mjs'), page, l], { encoding: 'utf8' });
  const want = readFileSync(base, 'utf8');
  const missing = want.split('\n').filter(line => line && !now.includes(line));
  if (missing.length) errors.push(`✗ plantiario ${p}/${l}: ${missing.length} líneas cambiadas, p. ej. «${missing[0].slice(0, 80)}»`);
}

if (errors.length) { console.log(errors.join('\n')); console.log(`\n${errors.length} errores`); process.exit(1); }
console.log(`✓ ${html.length} páginas OK`);
