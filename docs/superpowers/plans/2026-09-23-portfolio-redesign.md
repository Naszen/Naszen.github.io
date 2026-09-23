# Rediseño del portfolio y CV — Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development (recomendada) o superpowers:executing-plans para ejecutar este plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** Rehacer naszen.github.io como portfolio oscuro «cinematográfico», bilingüe (ES/EN con selector real). Incluye páginas de producto, privacidad y soporte para 5 apps, un CV imprimible y GA4 con consentimiento.

**Arquitectura:** Sitio estático escrito a mano: HTML, un CSS de sistema de diseño y 3 módulos JS vanilla (`i18n.js`, `site.js` y `analytics.js`). No hay paso de build. Cada página contiene ambos idiomas en elementos `[data-lang]`, y el atributo `data-lang` de `<html>` oculta el idioma inactivo. La verificación automática la hace `tools/check.mjs` (Node, sin dependencias); la visual se hace en Chrome.

**Stack:** HTML5, CSS moderno (custom properties, `backdrop-filter`, `clamp`), JS ES2022 vanilla, Google Fonts, GA4 gtag, Node 26 (solo para las herramientas), Chrome sin interfaz (PDF del CV), `sips` (redimensionar iconos).

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-redesign-design.md`. **Todos los textos del sitio salen de ahí (§5–§8).** Cópialos literalmente.

## Restricciones globales

- Sin frameworks, librerías JS ni CSS de terceros. Solo Google Fonts (Inter Tight 600/800, Inter 400/500, JetBrains Mono 500) y gtag.
- Sin paso de build: cada archivo que se commitea es el que se sirve.
- Idiomas: ES por defecto; resolución `?lang` → `localStorage["lang"]` → `navigator.language` (`en*` → en) → `es`. Nunca se muestran los dos idiomas a la vez.
- Emails: portfolio y CV usan `davidtejedorayet@gmail.com`; legales y soporte de las apps usan `naszen013@gmail.com`. La cadena `outlook` no aparece en ningún archivo servido.
- El teléfono `+34 679 59 62 71` aparece **solo** en `/cv/` y en sus PDF.
- DropAlert no aparece en ningún archivo servido.
- GA4 `G-R2WHH3RXWM` solo en `/`, `/cv/` y `/<app>/` (nunca en `privacy/`, `support/` ni `404.html`).
- Deben existir y seguir sirviendo `/plantiario/privacy/` y `/plantiario/support/`.
- Slugs: `schede`, `keppi`, `plantiario`, `cooktribe`, `quicksound`.
- Colores de las apps: schede `#00C48C`, keppi `#F2A516`, plantiario `#3F8F6A`, cooktribe `#F0845C`, quicksound `#FF5C1A`.
- `prefers-reduced-motion: reduce` desactiva todas las animaciones.
- Sin scroll horizontal a 390 px; margen lateral de 16 px en móvil.
- Commits en español, con el estilo del repo (frase descriptiva, sin prefijo).

## Focos de revisión

1. **Primera visita con el navegador en otro idioma (fr, de…) o con `localStorage` bloqueado (navegación privada en Safari):** debe verse en español, sin errores de JS. → test en Task 2 (`resolveLang`).
2. **Enlace compartido con `?lang=en`:** al navegar a otra página interna se mantiene el inglés, porque se guarda en `localStorage`. Si el almacenamiento falla, los enlaces internos llevan `?lang` → verificación manual en Task 2, paso 7.
3. **Página vista sin JS o antes de que cargue:** solo un idioma visible (ES), nada invisible por animaciones `.reveal` → Task 1, check `no-js` en `check.mjs` (el `<html>` trae `data-lang="es"` y la clase `.js` la añade el script en línea, así que `.reveal` solo oculta si `.js` está presente).
4. **Traducción olvidada:** un `[data-lang="es"]` sin su hermano `en` hace que una frase desaparezca en inglés → check `pairs` en `check.mjs` (Task 1), aplicado a cada página.
5. **Visitante que rechaza cookies:** no se escribe ninguna cookie `_ga` y siguen funcionando los eventos sin cookies. Quien no decide nunca ve el aviso bloqueando contenido → test manual guiado en Task 4, y comprobación de `document.cookie` en local con `?gatest=1`.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `assets/css/site.css` | Tokens, reset, tipografía, nav, footer, botones, chips, bento, reveal, secciones de portada y de app, aviso de cookies |
| `assets/css/legal.css` | Maquetación de lectura para privacidad y soporte (importa tokens de `site.css`, que se enlaza antes) |
| `assets/css/cv.css` | CV en pantalla e impresión A4 |
| `assets/js/i18n.js` | Resolución y aplicación del idioma, selector, reescritura de enlaces, evento `langchange` |
| `assets/js/site.js` | Hero, resplandor, nav compacta, reveal, contadores, inclinación, línea de tiempo, copiar email |
| `assets/js/analytics.js` | Consentimiento, carga de gtag, tráfico interno, eventos declarativos (`data-ga`) y de sección |
| `tools/check.mjs` | Verificación estática del sitio (enlaces, pares i18n, cadenas prohibidas, reglas de GA) |
| `tools/serve.sh` | `python3 -m http.server 8000` en la raíz |
| `tools/cv-pdf.sh` | Genera `files/cv-es.pdf`, `files/cv-en.pdf` y `files/cv.pdf` |
| `tools/baseline/plantiario-{privacy,support}-{es,en}.txt` | Texto original de Plantiario para comparar |
| `index.html`, `cv/index.html`, `404.html`, `<app>/index.html`, `<app>/privacy/index.html`, `<app>/support/index.html` | Páginas |
| `README.md` | Cómo mantener el sitio, idioma, GA (filtro interno y dimensiones), regenerar el CV |

### Bloques HTML compartidos (se copian literalmente en cada página)

**Head común** (ajusta `ROOT` a la ruta relativa: `./`, `../` o `../../`):

```html
<!DOCTYPE html>
<html lang="es" data-lang="es" data-title-es="…" data-title-en="…" data-desc-es="…" data-desc-en="…">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>…título ES…</title>
<meta name="description" content="…descripción ES…">
<meta name="theme-color" content="#0A0A0F">
<link rel="icon" href="/favicon.ico">
<script>
/* i18n boot: fija el idioma antes del primer render (duplicado a propósito de i18n.js) */
(function(){var d=document.documentElement,l=null;d.classList.add('js');
try{l=new URLSearchParams(location.search).get('lang')}catch(e){}
if(l!=='es'&&l!=='en'){try{l=localStorage.getItem('lang')}catch(e){l=null}}
if(l!=='es'&&l!=='en'){l=/^en\b/i.test(navigator.language||'')?'en':'es'}
d.setAttribute('data-lang',l);d.lang=l;})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Inter+Tight:wght@600;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css">
<script src="/assets/js/i18n.js" defer></script>
</head>
```

Se usan rutas absolutas desde la raíz (`/assets/...`), porque el sitio es `naszen.github.io` y se sirve en la raíz. Así el mismo bloque vale en cualquier profundidad y se elimina `ROOT`.

**Nav común:**

```html
<a class="skip" href="#main"><span data-lang="es">Saltar al contenido</span><span data-lang="en">Skip to content</span></a>
<header class="nav" data-nav>
  <a class="nav__brand" href="/">David Tejedor<span class="nav__dot">.</span></a>
  <nav class="nav__links" aria-label="Principal">
    <!-- enlaces específicos de la página -->
  </nav>
  <div class="lang" role="group" aria-label="Idioma / Language">
    <button type="button" data-set-lang="es">ES</button><button type="button" data-set-lang="en">EN</button>
  </div>
</header>
```

**Footer común:**

```html
<footer class="footer">
  <p>© 2026 David Tejedor Ayet · <span data-lang="es">Hecho a mano, sin frameworks.</span><span data-lang="en">Handmade, no frameworks.</span></p>
  <p><a href="/">Portfolio</a> · <a href="https://www.linkedin.com/in/davidtejedorayet/">LinkedIn</a> · <a href="https://github.com/Naszen">GitHub</a><span data-ga-only> · <button type="button" class="linklike" data-consent-open><span data-lang="es">Preferencias de cookies</span><span data-lang="en">Cookie preferences</span></button></span></p>
</footer>
```

En las páginas sin GA (legales y 404) se omite el `<span data-ga-only>`.

---

### Task 1: Herramientas de verificación y línea base de Plantiario

**Archivos:**
- Crear: `tools/check.mjs`, `tools/serve.sh`, `tools/baseline/plantiario-privacy-es.txt`, `…-privacy-en.txt`, `…-support-es.txt`, `…-support-en.txt`, `tools/extract-lang.mjs`

**Interfaces:**
- Produce: `node tools/check.mjs` (sale con código 1 si hay errores e imprime `✗ <regla> <archivo>: <detalle>`); `node tools/extract-lang.mjs <file.html> <es|en>` (imprime el texto visible de ese idioma, normalizado).

- [ ] **Paso 1: Guardar la línea base de Plantiario desde el HTML ACTUAL (antes de tocar nada).** Las páginas actuales tienen `<article id="es">` y `<article id="en">`. Crea `tools/extract-lang.mjs`:

```js
// Uso: node tools/extract-lang.mjs <archivo.html> <es|en>
// Imprime el texto del idioma pedido, normalizado (una línea por bloque, espacios colapsados).
// Soporta dos formatos: el antiguo (<article id="es">) y el nuevo ([data-lang="es"]).
import { readFileSync } from 'node:fs';
const [file, lang] = process.argv.slice(2);
const html = readFileSync(file, 'utf8');
const other = lang === 'es' ? 'en' : 'es';

function stripTags(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/dt|\/dd|\/summary|\/div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}
function removeLang(s, l) {
  // elimina elementos con data-lang="l" (anidamiento simple: el mismo tag de apertura/cierre)
  const re = new RegExp(`<(\\w+)[^>]*data-lang="${l}"[^>]*>[\\s\\S]*?<\\/\\1>`, 'g');
  let prev; do { prev = s; s = s.replace(re, ''); } while (s !== prev);
  return s;
}
let body;
const legacy = html.match(new RegExp(`<article[^>]*id="${lang}"[\\s\\S]*?<\\/article>`));
if (legacy) body = legacy[0];
else {
  const main = html.match(/<main[\s\S]*?<\/main>/);
  body = removeLang(main ? main[0] : html, other);
}
const out = stripTags(body).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  // quita las líneas de navegación entre idiomas y de fecha, que cambian de formato legítimamente
  .map(l => l.replace(/\s*·\s*(English below|Versión en español)$/, ''))
  .filter(l => l && !/^(English below|Versión en español|Español|English)$/.test(l))
  .join('\n');
process.stdout.write(out + '\n');
```

Ejecuta:

```bash
mkdir -p tools/baseline
for p in privacy support; do for l in es en; do
  node tools/extract-lang.mjs plantiario/$p/index.html $l > tools/baseline/plantiario-$p-$l.txt
done; done
wc -l tools/baseline/*.txt
```

Esperado: 4 archivos no vacíos (privacy ≈ 30+ líneas, support ≈ 30+ líneas).

- [ ] **Paso 2: Aplicar el único cambio permitido a la línea base.** El email pasa de outlook a `naszen013@gmail.com`:

```bash
sed -i '' 's/david\.tejedor@outlook\.com/naszen013@gmail.com/g' tools/baseline/*.txt
grep -c naszen013 tools/baseline/*.txt
```

Esperado: cada archivo con ≥ 1 aparición.

- [ ] **Paso 3: Escribir `tools/check.mjs`:**

```js
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
```

Y `tools/serve.sh`:

```bash
#!/bin/sh
# Sirve el sitio en http://localhost:8000
cd "$(dirname "$0")/.." && exec python3 -m http.server 8000
```

`chmod +x tools/serve.sh`.

- [ ] **Paso 4: Ejecutar el check sobre el sitio antiguo para verificar que detecta fallos.**

Ejecuta: `node tools/check.mjs; echo exit=$?`
Esperado: `exit=1`, con errores `forbidden` (outlook, bootstrap), `phone` en `index.html`, `ga` y `required` (faltan las páginas de las apps nuevas). Así se demuestra que el check muerde.

- [ ] **Paso 5: Commit**

```bash
git add tools/
git commit -m "Añade herramientas de verificación del sitio y línea base del texto legal de Plantiario"
```

---

### Task 2: Sistema de diseño base, i18n e iconos

**Archivos:**
- Crear: `assets/css/site.css`, `assets/js/i18n.js`, `assets/img/apps/{schede,keppi,plantiario,quicksound}.png` (512) y `…-256.png`, `assets/img/apps/cooktribe.svg`, `assets/img/me.jpg`, `tools/test-i18n.mjs`
- Modificar: `404.html` (primera página con el sistema nuevo, sirve de prueba)

**Interfaces:**
- Produce:
  - Clases CSS: `.nav`, `.nav--compact`, `.lang`, `.btn`, `.btn--primary`, `.btn--ghost`, `.chip`, `.glass`, `.section`, `.section__title`, `.eyebrow`, `.container`, `.reveal`, `.is-in`, `.footer`, `.skip`, `.linklike`, `.tag-soon`, `.grad-text`.
  - Custom property `--app` (color de la app) en `<body style="--app:#…">`.
  - `window.I18N = { get lang(), set(lang) }`.
  - Evento `document` → `langchange` (`detail: {from, to}`).
  - Función pura exportable `resolveLang({query, stored, nav})` → `'es' | 'en'`.

- [ ] **Paso 1: Test de `resolveLang`** (`tools/test-i18n.mjs`):

```js
import assert from 'node:assert/strict';
import { resolveLang } from '../assets/js/i18n.js';
assert.equal(resolveLang({ query: 'en', stored: 'es', nav: 'es-ES' }), 'en');   // ?lang gana
assert.equal(resolveLang({ query: 'xx', stored: 'en', nav: 'es-ES' }), 'en');   // query inválida → stored
assert.equal(resolveLang({ query: null, stored: null, nav: 'en-GB' }), 'en');
assert.equal(resolveLang({ query: null, stored: null, nav: 'fr-FR' }), 'es');   // Foco 1
assert.equal(resolveLang({ query: null, stored: null, nav: '' }), 'es');
assert.equal(resolveLang({ query: null, stored: 'de', nav: 'de-DE' }), 'es');   // stored inválido
console.log('i18n OK');
```

Ejecuta: `node tools/test-i18n.mjs`
Esperado: FALLA con `Cannot find module …/assets/js/i18n.js`.

- [ ] **Paso 2: Escribir `assets/js/i18n.js`** (se carga como script clásico con `defer` en el navegador y se importa como módulo en Node; por eso la exportación está protegida):

```js
/* i18n: idioma del sitio. Carga clásica (defer) en navegador; importable en Node para tests. */
(function (global) {
  const LANGS = ['es', 'en'];
  const valid = l => LANGS.includes(l);

  function resolveLang({ query, stored, nav }) {
    if (valid(query)) return query;
    if (valid(stored)) return stored;
    return /^en\b/i.test(nav || '') ? 'en' : 'es';
  }

  function store(l) { try { localStorage.setItem('lang', l); return true; } catch { return false; } }
  function read() { try { return localStorage.getItem('lang'); } catch { return null; } }

  function apply(lang) {
    const d = document.documentElement;
    const from = d.getAttribute('data-lang');
    d.setAttribute('data-lang', lang);
    d.lang = lang;
    const t = d.getAttribute(`data-title-${lang}`); if (t) document.title = t;
    const desc = d.getAttribute(`data-desc-${lang}`);
    const meta = document.querySelector('meta[name="description"]'); if (desc && meta) meta.content = desc;
    document.querySelectorAll('[data-set-lang]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    // Localiza atributos: data-es-<attr> / data-en-<attr> (p. ej. aria-label, href del CV)
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      for (const attr of el.dataset.i18nAttr.split(',')) {
        const v = el.getAttribute(`data-${lang}-${attr}`); if (v != null) el.setAttribute(attr, v);
      }
    });
    return from;
  }

  function set(lang) {
    if (!valid(lang)) return;
    const persisted = store(lang);
    const from = apply(lang);
    // Foco 2: si no se puede guardar, los enlaces internos llevan ?lang
    if (!persisted) rewriteLinks(lang);
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', lang); history.replaceState(null, '', u); }
    if (from !== lang) document.dispatchEvent(new CustomEvent('langchange', { detail: { from, to: lang } }));
  }

  function rewriteLinks(lang) {
    document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(a => {
      const u = new URL(a.getAttribute('href'), location.href);
      if (u.origin !== location.origin || /\.(pdf|png|jpg|svg)$/.test(u.pathname)) return;
      u.searchParams.set('lang', lang);
      a.setAttribute('href', u.pathname + u.search + u.hash);
    });
  }

  if (typeof document !== 'undefined') {
    const q = new URLSearchParams(location.search).get('lang');
    const lang = resolveLang({ query: q, stored: read(), nav: navigator.language });
    if (valid(q)) { if (!store(q)) rewriteLinks(q); }
    apply(lang);
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-set-lang]'); if (b) set(b.dataset.setLang);
    });
    global.I18N = { get lang() { return document.documentElement.getAttribute('data-lang'); }, set };
  }
  global.__resolveLang = resolveLang;
})(typeof window !== 'undefined' ? window : globalThis);

export const resolveLang = globalThis.__resolveLang;
```

**Atención:** un `export` en un script clásico es un error de sintaxis. Por eso el navegador lo carga como `<script type="module" src="/assets/js/i18n.js">`, que ya es diferido por defecto; los módulos también se ejecutan tras el parseo. En el bloque de head común, sustituye `<script src="/assets/js/i18n.js" defer></script>` por `<script type="module" src="/assets/js/i18n.js"></script>`. El boot en línea del `<head>` es el que evita el parpadeo; el módulo solo añade el selector y la localización de atributos.

- [ ] **Paso 3: Ejecutar el test**

Ejecuta: `node tools/test-i18n.mjs`
Esperado: `i18n OK`.

- [ ] **Paso 4: Escribir `assets/css/site.css`.** Contenido mínimo obligatorio. Las secciones de portada y de app se añaden en las Tasks 3 y 5:

```css
/* ============ Tokens ============ */
:root{
  --bg:#0A0A0F; --bg-2:#101018; --surface:rgba(255,255,255,.06); --surface-2:rgba(255,255,255,.10);
  --border:rgba(255,255,255,.10); --text:#F4F2EE; --muted:rgba(244,242,238,.65); --faint:rgba(244,242,238,.42);
  --grad:linear-gradient(90deg,#00C48C,#3D8BFF,#8567FF,#F2A516);
  --app:#8567FF;
  --radius:22px; --radius-sm:12px;
  --maxw:1200px; --gutter:clamp(16px,4vw,40px);
  --f-display:"Inter Tight",system-ui,sans-serif; --f-body:"Inter",system-ui,sans-serif; --f-mono:"JetBrains Mono",ui-monospace,monospace;
  --ease:cubic-bezier(.2,.7,.2,1);
  color-scheme:dark;
}
/* ============ i18n ============ */
html[data-lang="es"] [data-lang="en"], html[data-lang="en"] [data-lang="es"]{display:none !important}
/* ============ Reset/base ============ */
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:88px}
body{margin:0;background:var(--bg);color:var(--text);font:400 17px/1.6 var(--f-body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img,svg{display:block;max-width:100%}
a{color:inherit}
h1,h2,h3{font-family:var(--f-display);font-weight:800;letter-spacing:-.03em;line-height:1.02;margin:0}
p{margin:0}
:focus-visible{outline:2px solid #3D8BFF;outline-offset:3px;border-radius:6px}
.container{width:100%;max-width:var(--maxw);margin-inline:auto;padding-inline:var(--gutter)}
.skip{position:absolute;left:-9999px;top:8px;z-index:100;background:#fff;color:#000;padding:8px 14px;border-radius:8px}
.skip:focus{left:8px}
.grad-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.eyebrow{font:500 12px/1 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.glass{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.chip{display:inline-flex;align-items:center;gap:6px;font:500 12px/1 var(--f-mono);padding:7px 10px;border-radius:99px;background:var(--surface);border:1px solid var(--border);color:var(--muted);white-space:nowrap}
.tag-soon{display:inline-flex;align-items:center;gap:8px;font:500 12px/1 var(--f-mono);padding:7px 12px;border-radius:99px;color:var(--text);background:color-mix(in srgb,var(--app) 22%,transparent);border:1px solid color-mix(in srgb,var(--app) 45%,transparent)}
.tag-soon::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--app);box-shadow:0 0 10px var(--app)}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 22px;border-radius:99px;font:600 15px/1 var(--f-body);text-decoration:none;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;transition:transform .2s var(--ease),background .2s}
.btn:hover{transform:translateY(-2px);background:var(--surface-2)}
.btn--primary{background:var(--text);color:#0A0A0F;border-color:transparent}
.btn--primary:hover{background:#fff}
.linklike{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}
/* ============ Nav ============ */
.nav{position:fixed;inset:12px var(--gutter) auto;z-index:50;display:flex;align-items:center;gap:16px;max-width:var(--maxw);margin-inline:auto;padding:10px 12px 10px 20px;border-radius:99px;border:1px solid transparent;transition:background .3s,border-color .3s,backdrop-filter .3s,padding .3s}
.nav--compact{background:rgba(16,16,24,.72);border-color:var(--border);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);padding-block:6px}
.nav__brand{font:800 17px/1 var(--f-display);letter-spacing:-.02em;text-decoration:none;margin-right:auto}
.nav__dot{color:#00C48C}
.nav__links{display:flex;gap:4px}
.nav__links a{font-size:14px;text-decoration:none;color:var(--muted);padding:8px 12px;border-radius:99px}
.nav__links a:hover{color:var(--text);background:var(--surface)}
.lang{display:flex;padding:3px;border-radius:99px;background:var(--surface);border:1px solid var(--border)}
.lang button{font:600 12px/1 var(--f-mono);color:var(--muted);background:none;border:0;padding:8px 10px;border-radius:99px;cursor:pointer;min-width:40px;min-height:32px}
.lang button[aria-pressed="true"]{background:var(--text);color:#0A0A0F}
@media (max-width:760px){.nav__links{display:none}}
/* ============ Secciones y reveal ============ */
.section{padding:clamp(80px,12vw,160px) 0}
.section__title{font-size:clamp(2.2rem,5vw,4rem);margin:14px 0 18px}
.section__lead{color:var(--muted);max-width:620px;font-size:1.1rem}
.js .reveal{opacity:0;transform:translateY(24px);filter:blur(6px);transition:opacity .9s var(--ease),transform .9s var(--ease),filter .9s var(--ease);transition-delay:calc(var(--i,0) * 80ms)}
.js .reveal.is-in{opacity:1;transform:none;filter:none}
/* ============ Footer ============ */
.footer{padding:48px var(--gutter) 64px;text-align:center;color:var(--faint);font-size:14px;display:grid;gap:8px;border-top:1px solid var(--border)}
.footer a{color:var(--muted)}
/* ============ Movimiento reducido ============ */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}
  .js .reveal{opacity:1;transform:none;filter:none}
}
```

- [ ] **Paso 5: Iconos y foto.** Copiar y redimensionar con `sips`, sin comprimir a mano:

```bash
P=/Users/david/proyectos/iOS/PERSONAL
mkdir -p assets/img/apps
cp "$P/Schede/Schede/Assets.xcassets/AppIcon.appiconset/AppIcon.png" assets/img/apps/schede.png
cp "$P/Keppi/Keppi/Assets.xcassets/AppIcon.appiconset/AppIcon.png" assets/img/apps/keppi.png
cp "$P/Plantiario/Plantiario/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png" assets/img/apps/plantiario.png
cp "$P/Quick Sound Repository/Quick Sound Repository/Assets.xcassets/AppIcon.appiconset/icon-1024.png" assets/img/apps/quicksound.png
for a in schede keppi plantiario quicksound; do
  sips -Z 512 assets/img/apps/$a.png >/dev/null
  sips -Z 256 assets/img/apps/$a.png --out assets/img/apps/$a-256.png >/dev/null
done
sips -s format jpeg -s formatOptions 82 images/me.png --out assets/img/me.jpg >/dev/null
ls -la assets/img/apps assets/img
```

Esperado: 8 PNG (4 de 512 y 4 de 256), todos < 400 KB, y `me.jpg`.

Icono provisional de CookTribe, `assets/img/apps/cooktribe.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="CookTribe">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0845C"/><stop offset="1" stop-color="#9A3412"/></linearGradient></defs>
  <rect width="512" height="512" rx="114" fill="url(#g)"/>
  <path d="M146 300c0-66 49-116 110-116s110 50 110 116H146z" fill="#FAF5EA"/>
  <rect x="126" y="300" width="260" height="22" rx="11" fill="#FAF5EA"/>
  <circle cx="256" cy="170" r="16" fill="#FAF5EA"/>
  <text x="256" y="408" text-anchor="middle" font-family="Inter Tight,Arial,sans-serif" font-weight="800" font-size="62" fill="#FAF5EA" letter-spacing="-2">CT</text>
</svg>
```

- [ ] **Paso 6: Reescribir `404.html` con el sistema nuevo.** Usa el head común con `data-title-es="Página no encontrada · David Tejedor"` y `data-title-en="Page not found · David Tejedor"`, el nav común sin enlaces y el footer sin `data-ga-only`. En `<main id="main" class="section container">` van un `404` gigante en `.grad-text`, el texto «Esta página no existe» / «This page doesn't exist» y los botones «Ir al portfolio» / «Go to portfolio» (`/`) y Plantiario (`/plantiario/`). Sin `analytics.js`.

- [ ] **Paso 7: Verificación en el navegador.** Arranca `tools/serve.sh` en segundo plano y abre `http://localhost:8000/404.html` en Chrome:
  - Ves ES; al pulsar EN cambian el texto y el título de la pestaña; al recargar se mantiene EN.
  - Con `http://localhost:8000/404.html?lang=es` vuelve a ES.
  - Con DevTools › Application › Local Storage borrado y el idioma de Chrome forzado a `fr` (`--lang=fr` o `navigator.language` sobreescrito en el panel Sensors): se ve ES.
  - Almacenamiento bloqueado (Foco 2): en la consola ejecuta `Storage.prototype.setItem = () => { throw new Error('blocked') }`, pulsa EN y comprueba que el enlace del nav a `/` pasa a `/?lang=en`.
  - La consola no muestra errores.

- [ ] **Paso 8: Commit**

```bash
git add assets/ tools/test-i18n.mjs 404.html
git commit -m "Añade el sistema de diseño base, el selector de idioma y los iconos de las apps"
```

---

### Task 3: Portada (`index.html`) e interacciones (`site.js`)

**Archivos:**
- Reescribir: `index.html`
- Crear: `assets/js/site.js`
- Modificar: `assets/css/site.css` (añadir la sección «Portada»)

**Interfaces:**
- Consume: clases y tokens de la Task 2; `langchange`.
- Produce:
  - Atributos que `site.js` reconoce: `data-nav`, `data-hero-title` (el texto de cada `<span data-lang>` se trocea en palabras), `data-glow`, `.reveal` (con `style="--i:n"`), `data-count="7" data-suffix="+"`, `data-tilt`, `data-timeline`, `data-copy="email"`.
  - Atributos que usará `analytics.js` (Task 4): `data-ga="cv_download"`, `data-ga="contact_click" data-ga-method="linkedin"`, `data-ga="app_open" data-ga-app="schede" data-ga-location="bento"` y `data-section="apps"` en cada `<section>`.
  - IDs de sección: `top`, `apps`, `como-trabajo`, `trayectoria`, `stack`, `contacto`.

- [ ] **Paso 1: Escribir `assets/js/site.js`:**

```js
/* Interacciones del sitio. Todo es mejora progresiva: sin JS, el contenido se ve completo. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

// Nav compacta
const nav = document.querySelector('[data-nav]');
if (nav) {
  const onScroll = () => nav.classList.toggle('nav--compact', scrollY > 80);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

// Titular del hero: palabra a palabra (cada idioma por separado)
document.querySelectorAll('[data-hero-title] [data-lang]').forEach(el => {
  if (reduce) return;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const s = document.createElement('span'); s.className = 'word'; s.textContent = w; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  el.querySelectorAll('.word').forEach((w, i) => w.style.setProperty('--w', i));
});
requestAnimationFrame(() => document.documentElement.classList.add('hero-in'));

// Resplandor que sigue al cursor
document.querySelectorAll('[data-glow]').forEach(el => {
  if (reduce || !finePointer) return;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Reveal + contadores + línea de tiempo
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    el.classList.add('is-in');
    if (el.hasAttribute('data-count')) countUp(el);
    io.unobserve(el);
  }
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
document.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el));

function countUp(el) {
  const to = Number(el.dataset.count), suffix = el.dataset.suffix || '';
  const fmt = n => n.toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'es-ES') + suffix;
  if (reduce) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 1400;
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(to * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
document.addEventListener('langchange', () =>
  document.querySelectorAll('[data-count].is-in').forEach(el => {
    el.textContent = Number(el.dataset.count).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'es-ES') + (el.dataset.suffix || '');
  }));

const timeline = document.querySelector('[data-timeline]');
if (timeline) {
  const update = () => {
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    timeline.style.setProperty('--progress', p.toFixed(3));
  };
  if (reduce) timeline.style.setProperty('--progress', 1);
  else { addEventListener('scroll', update, { passive: true }); update(); }
}

// Inclinación 3D + brillo
if (finePointer && !reduce) {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
      card.style.setProperty('--ry', `${(x - 0.5) * 8}deg`);
      card.style.setProperty('--gx', `${x * 100}%`);
      card.style.setProperty('--gy', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
}

// Copiar email
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const value = btn.dataset.copyValue;
    try { await navigator.clipboard.writeText(value); } catch { location.href = `mailto:${value}`; return; }
    btn.classList.add('is-copied');
    document.dispatchEvent(new CustomEvent('emailcopied'));
    setTimeout(() => btn.classList.remove('is-copied'), 1800);
  });
});

// CV del idioma activo
const syncCv = () => document.querySelectorAll('[data-cv-link]').forEach(a => {
  a.href = `/files/cv-${document.documentElement.getAttribute('data-lang')}.pdf`;
});
syncCv(); document.addEventListener('langchange', syncCv);
```

- [ ] **Paso 2: CSS de la portada en `site.css`**, bajo el comentario `/* ============ Portada ============ */`. Obligatorio:
  - `.hero`: `min-height:100svh`, un grid centrado verticalmente y dos fondos. El primero es un `radial-gradient` fijo morado arriba a la derecha (`#2a1b5e`); el segundo es `radial-gradient(600px circle at var(--mx,70%) var(--my,20%), rgba(133,103,255,.18), transparent 60%)` sobre `.hero::before`, para el resplandor.
  - Una textura de ruido sutil opcional con SVG `feTurbulence` en línea como `background-image` al 4 % de opacidad.
  - `.hero__title`: `font-size:clamp(2.6rem,7vw,6rem)`, `max-width:14ch`. Las `.word` hacen `opacity:0; transform:translateY(.4em); filter:blur(8px); display:inline-block; transition:… ; transition-delay:calc(var(--w)*60ms)`, y `html.hero-in .word` las lleva a `opacity:1; transform:none; filter:none`. Todo va condicionado a `.js`.
  - `.stats`: grid de 4 columnas (2 en ≤ 720 px), con números `font:800 clamp(2.4rem,5vw,3.6rem) var(--f-display)`.
  - `.marquee`: pista con `display:flex; width:max-content; animation:marquee 40s linear infinite`, con el contenido duplicado dentro (el segundo con `aria-hidden="true"`) y `:hover{animation-play-state:paused}`. Máscara con `mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)`.
  - `.bento`: `grid-template-columns:repeat(4,1fr)`, `grid-auto-rows:minmax(240px,auto)`, gap 16 px. `.bento__card--big` ocupa `grid-column:span 2; grid-row:span 2`. En ≤ 1000 px pasa a 2 columnas; en ≤ 720 px, a 1 columna y la grande queda `span 1`.
  - `.bento__card`: `.glass` más `position:relative; overflow:hidden; padding:24px; transform:perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0)); transition:transform .4s var(--ease)`. Lleva `::after` para el brillo (`radial-gradient(400px circle at var(--gx,50%) var(--gy,50%), color-mix(in srgb,var(--app) 30%,transparent), transparent 60%)`, `opacity:0`, que pasa a 1 con `:hover`) y `::before` con un degradado del color de la app en la esquina inferior. El icono mide 72 px (120 px en la tarjeta grande) y tiene `border-radius:22.5%` y `box-shadow:0 20px 40px -10px color-mix(in srgb,var(--app) 60%,transparent)`. El enlace cubre toda la tarjeta (`a.bento__link::before{content:"";position:absolute;inset:0}`).
  - `.pillars`: grid de 4 a 2 a 1 columnas, con tarjetas `.glass` y un icono SVG de trazo en `var(--grad)` (usa `stroke="url(#grad)"` con un `<svg>` oculto que define `linearGradient id="grad"` una sola vez en la página).
  - `.about`: grid con la foto (160 px, `border-radius:28px`, anillo de degradado) y el texto.
  - `.timeline`: `position:relative; padding-left:32px`. Una línea base `::before` al 12 % de blanco y una línea de progreso `::after` con `background:var(--grad); transform-origin:top; transform:scaleY(var(--progress,0))`. Cada `.timeline__item` lleva un punto que se ilumina con `.is-in`.
  - `.stack`: tres grupos de `.chip`.
  - `.contact`: título gigante `clamp(3rem,10vw,8rem)` en `.grad-text` y un botón email grande, con `.is-copied` mostrando «Copiado / Copied». Usa `[data-copied-label]`, visible solo con `.is-copied`.

- [ ] **Paso 3: Escribir `index.html`** con el head común:
  - `data-title-es="David Tejedor · Desarrollador iOS senior (SwiftUI)"` y `data-title-en="David Tejedor · Senior iOS Developer (SwiftUI)"`.
  - Descripciones: ES «Desarrollador iOS senior especializado en SwiftUI. Apps para Meliá, ONCE o Athletic Club, y cinco apps propias en camino.»; EN «Senior iOS developer specialised in SwiftUI. Apps for Meliá, ONCE and Athletic Club, and five apps of my own on the way.».
  - Añadir en el `<head>`: OG/Twitter (`og:title`, `og:description`, `og:image=https://naszen.github.io/assets/img/og.png`, `og:url`, `twitter:card=summary_large_image`), `<link rel="canonical" href="https://naszen.github.io/">`, `<link rel="alternate" hreflang="es" href="https://naszen.github.io/?lang=es">`, igual para `en` y `x-default`, y JSON-LD `Person`:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Person","name":"David Tejedor Ayet","jobTitle":"Senior iOS Developer","url":"https://naszen.github.io/","email":"mailto:davidtejedorayet@gmail.com","address":{"@type":"PostalAddress","addressLocality":"Madrid","addressCountry":"ES"},"sameAs":["https://www.linkedin.com/in/davidtejedorayet/","https://github.com/Naszen"],"knowsAbout":["Swift","SwiftUI","iOS","SwiftData","CloudKit"]}
</script>
```

  Antes de `</body>`: `<script type="module" src="/assets/js/site.js"></script>` y `<script src="/assets/js/analytics.js" defer></script>`. El segundo apunta a un archivo que se crea en la Task 4; hasta entonces el check marcará un enlace roto, lo cual es esperado.

  **Estructura** (los textos, literales de la spec §5):

```html
<body id="top">
<!-- skip + nav común; enlaces: #apps (Apps/Apps), #como-trabajo (Cómo trabajo/How I work), #trayectoria (Trayectoria/Experience), #contacto (Contacto/Contact), y un .btn pequeño "CV" → /cv/ -->
<main id="main">
  <section class="hero" data-glow data-section="hero">
    <div class="container">
      <p class="eyebrow reveal">Madrid, España / Madrid, Spain  (con data-lang)</p>
      <h1 class="hero__title" data-hero-title>
        <span data-lang="es">Apps iOS que se <span class="grad-text">sienten</span> nativas.</span>
        <span data-lang="en">iOS apps that truly <span class="grad-text">feel</span> native.</span>
      </h1>
      <p class="hero__lead reveal" style="--i:3">…subtítulo ES/EN de la spec…</p>
      <div class="hero__cta reveal" style="--i:4">
        <a class="btn btn--primary" href="#apps">Ver mis apps / See my apps</a>
        <a class="btn" href="/files/cv-es.pdf" data-cv-link data-ga="cv_download" download>Descargar CV / Download CV</a>
      </div>
    </div>
  </section>
  <section class="section" data-section="stats"> .stats (4 cifras con data-count: 7 "+", 5, 1400 "+"; la cuarta es texto "Swift 6") + .marquee "Han confiado en mi trabajo / Brands I've built for" </section>
  <section class="section" id="apps" data-section="apps"> eyebrow "Portfolio", título «Lo que estoy construyendo» / «What I'm building», .bento con 5 tarjetas en el orden Schede (big), Keppi, Plantiario, CookTribe, Quick Sound </section>
  <section class="section" id="como-trabajo" data-section="how"> .about (foto /assets/img/me.jpg, alt "David Tejedor") + .pillars (4) </section>
  <section class="section" id="trayectoria" data-section="experience"> .timeline data-timeline (4 empleos + bloque de formación) </section>
  <section class="section" id="stack" data-section="stack"> 3 grupos de chips </section>
  <section class="section contact" id="contacto" data-section="contact"> «¿Hablamos?» / «Let's talk.», botón email (data-copy data-copy-value="davidtejedorayet@gmail.com" data-ga="email_copy"), enlace mailto:, LinkedIn (data-ga="contact_click" data-ga-method="linkedin"), GitHub (…method="github"), CV </section>
</main>
<!-- footer común con data-ga-only -->
```

  **Tarjeta bento (repetir para cada app con sus datos de la spec §5):**

```html
<article class="bento__card bento__card--big glass reveal" style="--app:#00C48C;--i:0" data-tilt>
  <img class="bento__icon" src="/assets/img/apps/schede.png" srcset="/assets/img/apps/schede-256.png 256w, /assets/img/apps/schede.png 512w" sizes="120px" width="120" height="120" alt="" loading="lazy">
  <span class="tag-soon"><span data-lang="es">Próximamente</span><span data-lang="en">Coming soon</span></span>
  <h3><a class="bento__link" href="/schede/" data-ga="app_open" data-ga-app="schede" data-ga-location="bento">Schede</a></h3>
  <p><span data-lang="es">Tarjetas de idiomas que se crean solas, con IA que no sale de tu iPhone.</span><span data-lang="en">Language flashcards that make themselves, with AI that never leaves your iPhone.</span></p>
  <ul class="bento__chips"><li class="chip">Foundation Models</li><li class="chip">Live Activities</li><li class="chip">Safari Extension</li></ul>
</article>
```

  Para CookTribe se usa `src="/assets/img/apps/cooktribe.svg"`, sin `srcset`. El chip «6 idiomas» de Plantiario lleva par ES/EN («6 languages»).

  **Elemento de la línea de tiempo:**

```html
<li class="timeline__item reveal">
  <p class="eyebrow"><span data-lang="es">oct. 2021 – actualidad</span><span data-lang="en">Oct 2021 – present</span></p>
  <h3>O2O · MO2O Digital Business &amp; Transformation</h3>
  <p class="timeline__role"><span data-lang="es">Desarrollador iOS</span><span data-lang="en">iOS Developer</span></p>
  <ul><li>…3 viñetas ES…</li></ul> <!-- como bloque <ul data-lang="es"> y <ul data-lang="en"> -->
</li>
```

- [ ] **Paso 4: Ejecutar el check**

Ejecuta: `node tools/check.mjs`
Esperado: siguen fallando `required`, `forbidden` (los archivos viejos de `css/`, `js/` y `styles/` hasta la Task 9) y `link` por `/assets/js/analytics.js`. **No debe fallar `pairs` en `index.html`**, ni aparecer `phone` en `index.html`.

- [ ] **Paso 5: Verificación visual en Chrome** (`http://localhost:8000/`), a 1440 px y a 390 px:
  - El hero se revela palabra a palabra y el resplandor sigue al ratón.
  - La nav se compacta al hacer scroll.
  - Los contadores suben una vez.
  - La marquesina se mueve y se pausa con el cursor encima.
  - Las tarjetas se inclinan y brillan con el color de su app.
  - La línea de tiempo se dibuja.
  - «Copiar email» muestra «Copiado».
  - EN cambia todo, incluido el enlace del CV (`cv-en.pdf`).
  - A 390 px no hay scroll horizontal (`document.documentElement.scrollWidth === innerWidth`).
  - Con DevTools › Rendering › `prefers-reduced-motion: reduce` todo se ve estático.
  - Con JS desactivado (DevTools › Settings › Disable JavaScript) todo el contenido ES es visible (Foco 3).

- [ ] **Paso 6: Commit**

```bash
git add index.html assets/js/site.js assets/css/site.css
git commit -m "Rediseña la portada con estética oscura, rejilla de apps e interacciones"
```

---

### Task 4: Analítica GA4 con consentimiento

**Archivos:**
- Crear: `assets/js/analytics.js`
- Modificar: `assets/css/site.css` (aviso `.consent`)

**Interfaces:**
- Consume:
  - Atributos `data-ga`, `data-ga-*` y `data-section` (Task 3), y `data-consent-open`.
  - Los eventos `langchange` y `emailcopied`.
  - En `<body>`: `data-content-group="home|cv|app"` y, en las páginas de app, `data-app="schede"`.
- Produce: `window.track(name, params)`.

- [ ] **Paso 1: Escribir `assets/js/analytics.js`:**

```js
/* GA4 con Consent Mode v2. Solo se incluye en /, /cv/ y /<app>/. */
(function () {
  const ID = 'G-R2WHH3RXWM';
  const q = new URLSearchParams(location.search);
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  // Tráfico interno: ?internal=1 marca este navegador; ?internal=0 lo desmarca
  if (q.get('internal') === '1') ls.set('ga_internal', '1');
  if (q.get('internal') === '0') ls.set('ga_internal', null);
  const internal = ls.get('ga_internal') === '1';

  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  const disabled = q.get('noga') === '1' || (local && q.get('gatest') !== '1');

  const body = document.body;
  const group = body.dataset.contentGroup || 'other';
  const appName = body.dataset.app;
  const lang = () => document.documentElement.getAttribute('data-lang') || 'es';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  const stored = ls.get('consent'); // 'granted' | 'denied' | null
  gtag('consent', 'default', {
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    wait_for_update: 500,
  });

  const track = (name, params = {}) => {
    const p = { site_language: lang(), ...(appName ? { app_name: appName } : {}), ...params };
    if (disabled) { if (q.get('gadebug') === '1') console.debug('[ga]', name, p); return; }
    gtag('event', name, p);
  };
  window.track = track;

  if (!disabled) {
    gtag('js', new Date());
    gtag('config', ID, {
      send_page_view: false,
      content_group: group,
      ...(internal ? { traffic_type: 'internal' } : {}),
      ...(q.get('gadebug') === '1' ? { debug_mode: true } : {}),
    });
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
    document.head.appendChild(s);
  }
  // page_view manual, ya con el idioma aplicado
  track('page_view', { page_title: document.title, page_location: location.href, content_group: group });
  if (group === 'cv') track('cv_view', { language: lang() });
  if (group === 'app') track('app_page_view', { app_name: appName });

  // Eventos declarativos
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-ga]'); if (!el) return;
    const name = el.dataset.ga;
    if (name === 'email_copy') return; // se envía con 'emailcopied' tras copiar de verdad
    const params = {};
    for (const [k, v] of Object.entries(el.dataset)) {
      if (k.startsWith('ga') && k !== 'ga') params[k.slice(2).toLowerCase()] = v;
    }
    if (name === 'cv_download') params.language = lang();
    if (name === 'app_open' && params.app) { params.app_name = params.app; delete params.app; }
    track(name, params);
  });
  document.addEventListener('emailcopied', () => track('email_copy'));
  document.addEventListener('langchange', e => track('language_change', { from: e.detail.from, to: e.detail.to }));

  // Secciones vistas (una vez por página y visita, ≥40 %)
  const seen = new Set();
  const io = new IntersectionObserver(es => es.forEach(en => {
    const id = en.target.dataset.section;
    if (en.isIntersecting && !seen.has(id)) { seen.add(id); track('section_view', { section: id }); io.unobserve(en.target); }
  }), { threshold: 0.4 });
  document.querySelectorAll('[data-section]').forEach(s => io.observe(s));

  // Aviso de consentimiento
  const texts = {
    es: ['Uso Google Analytics para saber qué partes del portfolio interesan. Solo con tu permiso guarda cookies.', 'Aceptar', 'Rechazar'],
    en: ['I use Google Analytics to learn which parts of this portfolio people find useful. Cookies are only stored with your permission.', 'Accept', 'Decline'],
  };
  function banner() {
    if (document.querySelector('.consent')) return;
    const el = document.createElement('div');
    el.className = 'consent'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Cookies');
    el.innerHTML = ['es', 'en'].map(l =>
      `<div data-lang="${l}"><p>${texts[l][0]}</p><div class="consent__actions">` +
      `<button type="button" class="btn btn--primary" data-consent="granted">${texts[l][1]}</button>` +
      `<button type="button" class="btn" data-consent="denied">${texts[l][2]}</button></div></div>`).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-consent]'); if (!b) return;
      const v = b.dataset.consent;
      ls.set('consent', v);
      gtag('consent', 'update', { analytics_storage: v });
      el.remove();
    });
    document.body.appendChild(el);
  }
  if (!stored) banner();
  document.addEventListener('click', e => { if (e.target.closest('[data-consent-open]')) banner(); });
})();
```

- [ ] **Paso 2: CSS del aviso** en `site.css`:

```css
/* ============ Consentimiento ============ */
.consent{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;width:min(560px,calc(100% - 32px));padding:18px 20px;border-radius:20px;background:rgba(16,16,24,.9);border:1px solid var(--border);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font-size:14px;color:var(--muted);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.consent__actions{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.consent .btn{min-height:40px;padding:0 18px;font-size:14px}
```

  El aviso no bloquea el scroll ni superpone ningún contenido esencial, porque es un bloque flotante inferior de altura contenida (Foco 5).

- [ ] **Paso 3: Añadir `data-content-group="home"` al `<body>` de `index.html`** y ejecutar el check.

Ejecuta: `node tools/check.mjs`
Esperado: desaparece el error `link` de `analytics.js`. Solo quedan `required` y `forbidden` (archivos viejos).

- [ ] **Paso 4: Verificación en local** en `http://localhost:8000/?gatest=1&gadebug=1`, con DevTools abierto:
  - Aparece el aviso y cambia de idioma con el selector.
  - Pulsa **Rechazar**, recarga y comprueba que `document.cookie` no contiene `_ga` y que el aviso no reaparece (Foco 5).
  - Borra `localStorage.consent` y pulsa **Aceptar**: aparece `_ga` en las cookies y en Network hay peticiones a `google-analytics.com/g/collect` con `ep.site_language`.
  - Pulsa «Descargar CV», una tarjeta de app, LinkedIn y EN: en Network aparecen `en=cv_download`, `en=app_open` (con `ep.app_name`), `en=contact_click` y `en=language_change`.
  - En `http://localhost:8000/` (sin `gatest`) no hay ninguna petición a Google.
  - Limpieza: borra `localStorage` y las cookies de `localhost`.

- [ ] **Paso 5: Commit**

```bash
git add assets/js/analytics.js assets/css/site.css index.html
git commit -m "Añade Google Analytics 4 con consentimiento, eventos propios y exclusión de tráfico interno"
```

---

### Task 5: Páginas de las 5 apps (`/<app>/`)

**Archivos:**
- Crear: `schede/index.html`, `keppi/index.html`, `cooktribe/index.html`, `quicksound/index.html`
- Reescribir: `plantiario/index.html`
- Modificar: `assets/css/site.css` (sección «Página de app»)

**Interfaces:**
- Consume: head, nav y footer comunes; `site.js`; `analytics.js`; `--app`.
- Produce: `<body data-content-group="app" data-app="<slug>" style="--app:<color>">`.

- [ ] **Paso 1: CSS de la página de app** (`/* ============ Página de app ============ */`):
  - `.app-hero`: `min-height:88svh`, centrado. Fondo `radial-gradient(900px circle at 50% 0%, color-mix(in srgb,var(--app) 35%,transparent), transparent 60%)` más un segundo halo más pequeño.
  - `.app-hero__icon`: 160 px, `border-radius:22.5%`, sombra de color, y reflejo con `-webkit-box-reflect: below 8px linear-gradient(transparent 70%, rgba(255,255,255,.18))`.
  - `.app-hero__meta`: chips de plataforma e idiomas.
  - `.features`: grid `repeat(auto-fit,minmax(260px,1fr))` con tarjetas `.glass`. Cada tarjeta lleva un icono SVG de 28 px con `stroke:var(--app)`.
  - `.app-privacy`: tarjeta `.glass` con borde `color-mix(in srgb,var(--app) 40%,transparent)`, texto y dos `.btn`.

- [ ] **Paso 2: Escribir `schede/index.html`** como plantilla de referencia:
  - `data-title-es="Schede · Aprende idiomas con tarjetas que se crean solas"`, `data-title-en="Schede · Learn languages with flashcards that make themselves"`, y descripciones de 1 frase.
  - `<body data-content-group="app" data-app="schede" style="--app:#00C48C">`.
  - Nav: el brand lleva a `/` y hay un enlace «← Portfolio».
  - Estructura:

```html
<main id="main">
  <section class="app-hero" data-section="app-hero">
    <div class="container">
      <img class="app-hero__icon reveal" src="/assets/img/apps/schede.png" width="160" height="160" alt="Icono de Schede">
      <span class="tag-soon reveal" style="--i:1"><span data-lang="es">Próximamente en la App Store</span><span data-lang="en">Coming soon to the App Store</span></span>
      <h1 class="reveal" style="--i:2">Schede</h1>
      <p class="app-hero__tagline reveal" style="--i:3"><span data-lang="es">Aprende idiomas con tarjetas que se crean solas.</span><span data-lang="en">Learn languages with flashcards that make themselves.</span></p>
      <ul class="app-hero__meta reveal" style="--i:4"><li class="chip">iPhone</li><li class="chip">iOS 27</li><li class="chip"><span data-lang="es">Español</span><span data-lang="en">Spanish</span></li></ul>
    </div>
  </section>
  <section class="section" data-section="features"><div class="container">
    <p class="eyebrow">…Funciones / Features…</p><h2 class="section__title">…</h2>
    <div class="features"> 6 × <article class="glass reveal" style="--i:n"><svg …/><h3>…</h3><p>…</p></article> </div>
  </div></section>
  <section class="section" data-section="built-with"><div class="container"> «Hecho con» / «Built with» + chips: SwiftUI, SwiftData, CloudKit, Foundation Models, Translation, Image Playground, Vision, Speech, ActivityKit, WidgetKit, App Intents, Swift Testing </div></section>
  <section class="section" data-section="privacy"><div class="container"><div class="app-privacy glass">
    <h2>…Privacidad / Privacy…</h2>
    <p>…resumen de 1 frase de la spec §7…</p>
    <a class="btn" href="/schede/privacy/">Política de privacidad / Privacy policy</a>
    <a class="btn" href="/schede/support/">Soporte / Support</a>
  </div></div></section>
</main>
```

  Las 6 funciones de Schede, en ES y EN:
  1. Cursos por pareja de idiomas / Courses per language pair
  2. Traducción y ejemplos con Apple Intelligence / Translation and examples with Apple Intelligence
  3. Iconos creados con Image Playground / Icons made with Image Playground
  4. Repaso con repetición espaciada (FSRS) y modos estudio, lectura y examen / Spaced repetition (FSRS) with study, reading and exam modes
  5. Captura desde la cámara, fotos, Live Text y Safari / Capture from camera, photos, Live Text and Safari
  6. Widgets, Live Activity y práctica de pronunciación / Widgets, Live Activity and pronunciation practice

  Cada una va con una frase descriptiva sacada de la spec §6. Los iconos son SVG de trazo de 24×24 en línea, dibujados a mano (librito, globo, destello, reloj circular, cámara, widget), con `fill="none" stroke="currentColor" stroke-width="1.8"` y el color vía `color:var(--app)`.

- [ ] **Paso 3: Duplicar la plantilla para `keppi`, `cooktribe`, `quicksound` y `plantiario`.** Cambia solo:
  - el `data-app`, `--app`, el icono, los títulos y descripciones
  - las plataformas y los idiomas de la spec §6:
    - Keppi: iPhone, iPad, Mac; ES/EN
    - CookTribe: iPhone, iPad; ES/EN
    - Quick Sound: iPhone, iPad, Mac
    - Plantiario: iPhone, iPad; 6 idiomas
  - las funciones de la spec §6, 6 por app y en ES/EN; las marcadas «próximamente» llevan un `.chip` «Próximamente / Soon»
  - los chips «Hecho con»:
    - Keppi: SwiftUI, GRDB, SQLite FTS5, Supabase, Sign in with Apple, WidgetKit, App Intents, AppKit, Swift Testing
    - CookTribe: SwiftUI, SwiftData, CloudKit Sharing, Swift Testing
    - Quick Sound: SwiftUI, SwiftData, CloudKit, AVFoundation, AVAudioEngine, PhotosUI
    - Plantiario: SwiftUI, SwiftData, CloudKit, WidgetKit, App Intents, Foundation Models, VisionKit, BackgroundTasks, SQLite
  - el resumen de privacidad (spec §7)

  En `plantiario/index.html` añade además la insignia «Powered by Pl@ntNet» como texto con enlace a `https://plantnet.org`, sin imagen, junto a la función de identificación.

- [ ] **Paso 4: Ejecutar el check**

Ejecuta: `node tools/check.mjs`
Esperado: sin errores `pairs`, `ga` ni `link` en las 5 páginas de app. Los errores `required` de `privacy`/`support` de las 4 apps nuevas son esperados.

- [ ] **Paso 5: Verificación visual** de las 5 páginas a 1440 y 390 px, en ES y EN:
  - Cada una tiene su color.
  - Los iconos se ven nítidos.
  - Los enlaces a privacidad y soporte apuntan a su app.
  - No hay scroll horizontal.

- [ ] **Paso 6: Commit**

```bash
git add schede keppi cooktribe quicksound plantiario/index.html assets/css/site.css
git commit -m "Añade una página de producto para cada app"
```

---

### Task 6: Estilo legal y migración de Plantiario (privacidad y soporte)

**Archivos:**
- Crear: `assets/css/legal.css`
- Reescribir: `plantiario/privacy/index.html`, `plantiario/support/index.html`
- Borrar: `plantiario/plantiario.css`

**Interfaces:**
- Consume: head, nav y footer comunes (sin GA) y `i18n.js`.
- Produce: la plantilla legal que usará la Task 7:
  - `<body class="legal" style="--app:…">`
  - `<header class="legal__head">`: icono de 64 px, nombre de la app y tipo de página
  - `<div class="legal__layout">`, con un `<nav class="legal__toc">` pegajoso en ≥ 1000 px y `<article class="legal__body">`
  - un bloque `<div data-lang="es">` y otro `<div data-lang="en">` que envuelven **todo** el artículo y el índice de cada idioma
  - `<p class="legal__meta">` con la fecha

- [ ] **Paso 1: `assets/css/legal.css`:**

```css
/* Páginas de privacidad y soporte: lectura cómoda. Requiere site.css antes. */
.legal__head{padding:120px var(--gutter) 40px;text-align:center;background:radial-gradient(700px circle at 50% 0%,color-mix(in srgb,var(--app) 28%,transparent),transparent 65%)}
.legal__head img{width:64px;height:64px;border-radius:22.5%;margin:0 auto 16px}
.legal__head h1{font-size:clamp(2rem,5vw,3.2rem)}
.legal__head p{color:var(--muted);margin-top:8px}
.legal__head nav{margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.legal__layout{max-width:1080px;margin:0 auto;padding:0 var(--gutter) 80px;display:grid;gap:48px}
@media (min-width:1000px){.legal__layout{grid-template-columns:220px minmax(0,720px)}}
.legal__toc{font-size:14px}
@media (min-width:1000px){.legal__toc{position:sticky;top:96px;align-self:start}}
@media (max-width:999px){.legal__toc{display:none}}
.legal__toc a{display:block;color:var(--muted);text-decoration:none;padding:6px 0 6px 12px;border-left:2px solid var(--border)}
.legal__toc a:hover{color:var(--text);border-left-color:var(--app)}
.legal__body{max-width:720px;font-size:17px;line-height:1.7;color:rgba(244,242,238,.86)}
.legal__body h2{font-size:clamp(1.6rem,3vw,2rem);margin:0 0 6px}
.legal__body h3{font-size:1.2rem;letter-spacing:-.01em;margin:40px 0 12px;scroll-margin-top:96px}
.legal__body p,.legal__body ul,.legal__body ol{margin:0 0 16px}
.legal__body li{margin-bottom:10px}
.legal__body strong{color:var(--text)}
.legal__body a{color:color-mix(in srgb,var(--app) 70%,white)}
.legal__meta{color:var(--faint);font:500 13px/1.4 var(--f-mono);margin-bottom:24px}
.legal__body details{border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 18px;margin-bottom:10px;background:var(--surface)}
.legal__body summary{cursor:pointer;font-weight:500;color:var(--text)}
```

- [ ] **Paso 2: Reescribir `plantiario/privacy/index.html`:**
  - Head común con `site.css` y `legal.css`, `data-title-es="Plantiario · Política de privacidad"`, `data-title-en="Plantiario · Privacy Policy"`.
  - `<body class="legal" style="--app:#3F8F6A">`, nav común sin enlaces y cabecera con icono y título «Política de privacidad» / «Privacy Policy», con botones a `/plantiario/` y `/plantiario/support/`.
  - Luego `<main id="main" class="legal__layout">` con **dos bloques completos**, `<div data-lang="es" class="legal__lang">` y `<div data-lang="en" class="legal__lang">`.
  - Cada bloque contiene su `<nav class="legal__toc">` y su `<article class="legal__body">`. Para que la rejilla funcione con el envoltorio, `.legal__lang` usa `display:contents`; añádelo a `legal.css`.
  - **Copia literalmente el contenido de los `<article id="es">` y `<article id="en">` actuales**: los mismos párrafos, listas, `<strong>` y enlaces. Solo cambian:
    1. el email, que pasa a `naszen013@gmail.com`
    2. se eliminan los enlaces «English below» y «Versión en español», que ahora sobran
    3. los `<h3>` reciben `id` (`es-datos`, `es-plantnet`, `es-etiqueta`, `es-menores`, `es-contacto` y los mismos con `en-`) y el índice enlaza a ellos
  - Sin `analytics.js`.

- [ ] **Paso 3: Igual con `plantiario/support/index.html`.** Las preguntas frecuentes van como `<details><summary>` con el mismo texto; la primera, abierta (`open`). Email `naszen013@gmail.com`. Enlace a `/plantiario/privacy/`.

- [ ] **Paso 4: Borrar el CSS viejo y ejecutar el check**

```bash
git rm plantiario/plantiario.css
node tools/check.mjs 2>&1 | grep -i plantiario
```

Esperado: ninguna línea `✗ plantiario …`, es decir, el texto se conserva, y sin `outlook` en `plantiario/`. Si falla una línea, compara con `node tools/extract-lang.mjs plantiario/privacy/index.html es | diff tools/baseline/plantiario-privacy-es.txt -` y corrige el HTML, nunca la línea base.

- [ ] **Paso 5: Verificación visual:**
  - `http://localhost:8000/plantiario/privacy/` en ES solo muestra español y EN solo inglés.
  - `?lang=en` abre en inglés.
  - El índice lateral funciona en escritorio y a 390 px se oculta.
  - `…/support/`: los `<details>` se abren y cierran.

- [ ] **Paso 6: Commit**

```bash
git add assets/css/legal.css plantiario/
git commit -m "Migra la privacidad y el soporte de Plantiario al diseño nuevo con selector de idioma"
```

---

### Task 7: Privacidad y soporte de Schede, Keppi, CookTribe y Quick Sound

**Archivos:**
- Crear: `schede/privacy/index.html`, `schede/support/index.html`, `keppi/…`, `cooktribe/…`, `quicksound/…` (8 páginas)

**Interfaces:**
- Consume: la plantilla legal de la Task 6.

- [ ] **Paso 1: Privacidad.** Por cada app hay una página con la plantilla de la Task 6 y «Última actualización: 23 de septiembre de 2026» / «Last updated: September 23, 2026». Tiene las 8 secciones de la spec §7:
  1. Resumen
  2. Dónde están tus datos
  3. Servicios de terceros
  4. Permisos
  5. Etiqueta de privacidad del App Store
  6. Cómo borrar tus datos
  7. Menores
  8. Cambios y contacto (`naszen013@gmail.com`, enlace al soporte)

  Redacta en ES y EN con el tono y la estructura de Plantiario, sin inventar nada que no esté en la spec §7. Frases obligatorias por app:

  - **Schede:**
    - Resumen: «Schede no tiene servidores propios, ni cuentas, ni publicidad, ni analítica, ni rastreo. El desarrollador no recibe ningún dato tuyo.»
    - Extensión de Safari: «La extensión se ejecuta en las páginas que visitas para detectar el texto que seleccionas. Solo recuerda la última selección (hasta 120 caracteres, durante 60 segundos, en la memoria de la página) y nunca lee campos de contraseña. No lee el resto de la página. Solo cuando pulsas «Crear tarjeta» envía ese texto y el dominio de la web (sin la ruta) a la app.»
    - Permisos: cámara (escanear texto; las fotos no se guardan ni salen del dispositivo), micrófono y reconocimiento de voz (dictado y pronunciación, procesados en el dispositivo), movimiento (efecto de brillo de las tarjetas; no se guarda) y notificaciones (recordatorios de estudio).
    - Etiqueta: «Sin datos recopilados».
  - **Keppi:**
    - Resumen: «Keppi necesita una cuenta para sincronizar tus listas entre dispositivos. Guardamos lo mínimo para que funcione y nada más: sin publicidad, sin analítica de terceros y sin rastreo.»
    - Datos: email (Apple o Google), ID de usuario, contenido de las listas, mascota y XP, y fotos de fondo de lista, en Supabase (servidores en la UE, Frankfurt). Supabase actúa como encargado del tratamiento.
    - Apple: solo se pide el email, nunca el nombre.
    - Google: se piden `openid email profile`. Escribe «Google puede compartir tu nombre y foto de perfil; Keppi no los usa».
    - En el dispositivo: base de datos local y la sesión en el Llavero de ese dispositivo.
    - Borrado: Perfil › Eliminar cuenta, que borra los datos del servidor y las fotos y revoca el acceso de Sign in with Apple.
    - Etiqueta: email, ID de usuario, fotos y otro contenido del usuario; vinculados a ti; sin rastreo.
  - **CookTribe:**
    - Resumen: «Hoy CookTribe funciona sin conexión: tus recetas y fotos solo existen en tu dispositivo. No hay cuentas, servidores, publicidad, analítica ni rastreo.»
    - Fotos sin EXIF ni ubicación; cámara solo si la usas.
    - Sección «Funciones que llegarán»: iCloud y tribus compartidas, y exportación a Bring!. Esta política se actualizará antes de activarlas.
    - Etiqueta: «Sin datos recopilados».
  - **Quick Sound Repository:**
    - Resumen: «Sin cuentas, publicidad, analítica ni rastreo. Tus sonidos viven en tu dispositivo y en tu iCloud privado.»
    - Terceros, solo cuando tú lo pides:
      - La búsqueda de portadas envía el texto que escribes a Wikimedia Commons (`commons.wikimedia.org`), que ve tu IP. La imagen elegida se descarga de Wikimedia.
      - Si pegas o escribes una URL de audio o imagen, la app la descarga de ese servidor.
    - Permisos: ninguno especial. Los audios, vídeos y portadas se eligen con el selector del sistema.
    - Etiqueta: «Sin datos recopilados».

- [ ] **Paso 2: Soporte.** Por cada app: presentación de 2 frases, contacto (`naszen013@gmail.com`; en un error, indicar el modelo del dispositivo, la versión del sistema y los pasos), las FAQ de la spec §7 en `<details>` en ES y EN, y el enlace a privacidad. Respuestas concretas basadas en la spec:
  - **Schede:**
    - Idiomas: se descargan la primera vez desde Ajustes › Apps › Traducir o desde el aviso de la app.
    - Apple Intelligence: los ejemplos, iconos y listas por tema requieren un dispositivo compatible con Apple Intelligence activado; si no, esas funciones se ocultan. Perfil › Estado de los servicios.
    - Safari: Ajustes › Apps › Safari › Extensiones › Schede › Permitir y «Todos los sitios web».
    - iCloud: misma cuenta de Apple en todos los dispositivos; al cambiar de cuenta, la app pregunta qué hacer.
    - Importar y exportar: TXT, CSV o JSON.
    - Recordatorios: permiso de notificaciones.
    - Pronunciación: descarga voces en Ajustes › Accesibilidad › Contenido leído.
  - **Keppi:**
    - Por qué hace falta cuenta: para sincronizar y, más adelante, compartir.
    - Vincular Apple y Google.
    - Sin conexión: los cambios se guardan y se suben al volver la red.
    - Borrar la cuenta.
    - Widgets.
    - App de Mac.
    - Mascota y XP: nunca pierdes nada.
  - **CookTribe:**
    - Escalar raciones.
    - Lista de la compra por pasillos.
    - Fotos.
    - Tribus y Bring!: próximamente.
  - **Quick Sound:**
    - Importar audio desde archivos, vídeos o URL.
    - TikTok y YouTube no están permitidos por sus condiciones.
    - Portadas desde Wikimedia.
    - iCloud.
    - Tono, velocidad y efectos.
    - App de Mac.

- [ ] **Paso 3: Ejecutar el check**

Ejecuta: `node tools/check.mjs`
Esperado: ya no hay errores `required`. Solo quedan los `forbidden` de los archivos viejos, que se borran en la Task 9.

- [ ] **Paso 4: Revisión.** Lee cada página en ES y en EN en el navegador. Comprueba contra la spec §7 que no se afirma nada que el código no haga, que ningún texto aparece duplicado y que el email es `naszen013@gmail.com`.

- [ ] **Paso 5: Commit**

```bash
git add schede keppi cooktribe quicksound
git commit -m "Publica la privacidad y el soporte de Schede, Keppi, CookTribe y Quick Sound Repository"
```

---

### Task 8: CV (`/cv/`) y PDF

**Archivos:**
- Crear: `cv/index.html`, `assets/css/cv.css`, `tools/cv-pdf.sh`, `files/cv-es.pdf`, `files/cv-en.pdf`
- Reemplazar: `files/cv.pdf`

**Interfaces:**
- Consume: head común, `i18n.js`, `analytics.js` (`data-content-group="cv"`).
- Produce: los PDF enlazados desde la portada (`data-cv-link`).

- [ ] **Paso 1: `assets/css/cv.css`.** En pantalla: fondo `var(--bg)` y una hoja `.cv` blanca centrada con sombra. Para que escale igual en cualquier ancho, todas las medidas internas van en `cqw` (unidades del contenedor `.cv-wrap`, con `container-type:inline-size`) y la hoja mantiene `aspect-ratio:210/297`. Así la versión móvil es la misma hoja reducida y la impresión a `210mm` sale idéntica. Reglas:

```css
.cv-page{padding:96px 16px 64px;display:grid;justify-items:center;gap:20px}
.cv-toolbar{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.cv-wrap{width:min(210mm,100%);container-type:inline-size}
.cv{--ink:#12141A;--muted:#5A5F6B;--line:#E6E7EC;background:#fff;color:var(--ink);aspect-ratio:210/297;width:100%;
  font:400 1.72cqw/1.45 var(--f-body);display:grid;grid-template-columns:34% 1fr;overflow:hidden;border-radius:6px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.cv::before{content:"";grid-column:1/-1;height:.9cqw;background:var(--grad)}
.cv__side{background:#F4F5F9;padding:5cqw 4cqw}
.cv__main{padding:5cqw 5cqw 4cqw 4.5cqw}
.cv h1{font-size:5.4cqw;letter-spacing:-.04em}
.cv h2{font:600 1.5cqw/1 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:3.4cqw 0 1.6cqw;padding-bottom:.8cqw;border-bottom:1px solid var(--line)}
.cv h3{font-size:2.05cqw;letter-spacing:-.01em}
.cv__role{font:600 2.1cqw/1.2 var(--f-display);background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;margin-top:.8cqw}
.cv__job{margin-bottom:2.2cqw}
.cv__when{font:500 1.45cqw/1 var(--f-mono);color:var(--muted)}
.cv ul{margin:.8cqw 0 0;padding-left:2.2cqw}
.cv li{margin-bottom:.4cqw}
.cv__photo{width:14cqw;height:14cqw;border-radius:3.5cqw;object-fit:cover;margin-bottom:3cqw}
.cv__chips{display:flex;flex-wrap:wrap;gap:.8cqw}
.cv__chips span{font:500 1.35cqw/1 var(--f-mono);padding:.8cqw 1.1cqw;border-radius:99px;background:#fff;border:1px solid var(--line)}
@page{size:A4;margin:0}
@media print{
  html,body{background:#fff !important}
  .nav,.skip,.cv-toolbar,.consent,.footer{display:none !important}
  .cv-page{padding:0}
  .cv-wrap{width:210mm}
  .cv{box-shadow:none;border-radius:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
```

- [ ] **Paso 2: `cv/index.html`.**
  - Head común con `site.css` y `cv.css`, `data-title-es="CV · David Tejedor Ayet"`, `data-title-en="Résumé · David Tejedor Ayet"`.
  - `<body data-content-group="cv">`.
  - Nav común con enlace a `/`.
  - Barra de herramientas: «Descargar PDF» / «Download PDF» (`data-cv-link data-ga="cv_download" download`) e «Imprimir» / «Print» (`onclick="print()"`).
  - Una única hoja `.cv` con **todo el contenido duplicado por idioma a nivel de bloque**, para que cada PDF salga en un solo idioma:

  **Columna lateral (`.cv__side`):**
  - Foto.
  - «Contacto» / «Contact»: `davidtejedorayet@gmail.com`, `+34 679 59 62 71`, Madrid (España), `linkedin.com/in/davidtejedorayet`, `github.com/Naszen`, `naszen.github.io`.
  - «Competencias» / «Skills»: chips con Swift, SwiftUI, Swift Concurrency, SwiftData, CloudKit, UIKit, Objective-C, WidgetKit, App Intents, Foundation Models, Swift Testing, XCTest, MVVM y arquitectura limpia, Firebase, fastlane y TestFlight, Git y Scrum.
  - «Formación» / «Education»: los 3 títulos de la spec.
  - «Idiomas» / «Languages»: Español nativo / Spanish (native); Inglés B2 / English (B2).
  - «Además» / «Also»: ciberseguridad web (OWASP, pentesting).

  **Columna principal (`.cv__main`):**
  - Nombre y rol «Desarrollador iOS Senior · SwiftUI» / «Senior iOS Developer · SwiftUI».
  - Perfil en 3 líneas, ES: «Desarrollador iOS con más de 7 años llevando apps nativas a la App Store para marcas como Meliá, ONCE o el Athletic Club. Especializado en SwiftUI, Swift 6 y arquitecturas limpias con tests. Formación en ciberseguridad y obsesión por la privacidad y el detalle.» Traducción EN equivalente.
  - «Experiencia» / «Experience»: los 4 empleos de la spec §5.
  - «Apps propias» / «Personal apps»: 5 líneas «Nombre — frase corta · tecnologías clave».

  Estructura de idiomas: `<div class="cv__side"><div data-lang="es">…</div><div data-lang="en">…</div></div>`, y lo mismo en `.cv__main`.

- [ ] **Paso 3: `tools/cv-pdf.sh`:**

```bash
#!/bin/sh
# Genera files/cv-es.pdf, files/cv-en.pdf y files/cv.pdf (= es) desde /cv/.
set -eu
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8765
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
for L in es en; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 \
    --print-to-pdf="files/cv-$L.pdf" "http://localhost:$PORT/cv/?lang=$L&noga=1" 2>/dev/null
  PAGES=$(pdfinfo "files/cv-$L.pdf" | awk '/^Pages:/{print $2}')
  echo "cv-$L.pdf: $PAGES página(s)"
  [ "$PAGES" = "1" ] || { echo "✗ cv-$L.pdf debe tener 1 página"; exit 1; }
done
cp files/cv-es.pdf files/cv.pdf
echo "✓ PDFs generados"
```

`chmod +x tools/cv-pdf.sh`.

- [ ] **Paso 4: Generar y comprobar los PDF**

Ejecuta: `tools/cv-pdf.sh && pdftotext files/cv-en.pdf - | head -20 && pdftotext files/cv-es.pdf - | grep -c "Experiencia"`
Esperado:
- `cv-es.pdf: 1 página(s)`, `cv-en.pdf: 1 página(s)` y `✓ PDFs generados`.
- El texto EN está en inglés (sin «Experiencia») y el ES contiene «Experiencia».

Si ocupa 2 páginas, reduce el `font-size` base de `.cv` en pasos de `0.04cqw` o recorta viñetas, pero nunca bajes de `1.55cqw`.

- [ ] **Paso 5: Revisión visual** de los PDF (ábrelos con `open files/cv-es.pdf`) y de `/cv/` en el navegador a 1440 y 390 px:
  - Degradado visible.
  - La foto se ve.
  - Nada cortado.
  - El teléfono aparece.

- [ ] **Paso 6: Check y commit**

```bash
node tools/check.mjs   # no debe haber error 'phone' (solo se permite en /cv/)
git add cv assets/css/cv.css tools/cv-pdf.sh files/
git commit -m "Añade el CV en web y PDF en español e inglés"
```

---

### Task 9: Limpieza, imagen para compartir, README y verificación final

**Archivos:**
- Borrar: `css/`, `js/`, `styles/`, `scripts/`, `images/`, `docs/superpowers/`
- Crear: `assets/img/og.png`, `README.md`

- [ ] **Paso 1: Borrar los recursos antiguos**

```bash
git rm -r -q css js styles scripts images
node tools/check.mjs
```

Esperado: `✓ 18 páginas OK` (index, cv, 404 y 5 apps × 3). Si queda algún error, corrígelo antes de seguir.

- [ ] **Paso 2: `assets/img/og.png` (1200×630).** Crea `tools/og.html`, una página temporal con el hero sobre fondo `#0A0A0F`: nombre, «Senior iOS Developer · SwiftUI» y los 5 iconos. Captúrala así:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1200,630 \
  --screenshot=assets/img/og.png "http://localhost:8000/tools/og.html"
sips -g pixelWidth -g pixelHeight assets/img/og.png
```

Esperado: 1200×630. `tools/og.html` se queda en `tools/`, que no está enlazado desde el sitio.

- [ ] **Paso 3: `README.md`** (no se enlaza desde el sitio):
  - Estructura del sitio.
  - Cómo añadir una app: copiar las 3 páginas de una existente y cambiar el slug, el color, el icono y los textos. Después, añadir la tarjeta al bento y ejecutar `node tools/check.mjs`.
  - Cómo cambiar un texto en los dos idiomas.
  - Cómo pasar de «Próximamente» a la insignia de la App Store y usar `data-ga="store_click" data-ga-app="<slug>"`.
  - Cómo regenerar el CV (`tools/cv-pdf.sh`).
  - **GA:**
    1. Admin › Flujos de datos › Configurar etiqueta › Definir tráfico interno no es necesario, porque se marca con `?internal=1`. Basta con Admin › Recogida de datos › Filtros de datos › «Internal Traffic» → **Activo**.
    2. Abrir `https://naszen.github.io/?internal=1` una vez en cada navegador propio.
    3. Admin › Definiciones personalizadas: crear dimensiones de evento `site_language`, `app_name`, `section`, `method`, `location`, `language`, `from` y `to`.
    4. Informes › Engagement › Pages by content group.
    5. Depurar con `?gadebug=1` y DebugView.
  - URLs para App Store Connect: `https://naszen.github.io/<app>/privacy/` y `/support/`, más `?lang=en` si se quiere la versión en inglés.

- [ ] **Paso 4: Verificación final** (spec §12):
  1. `node tools/check.mjs` → OK; `node tools/test-i18n.mjs` → OK.
  2. Recorrer las 18 páginas en Chrome, en ES y EN, a 1440 y 390 px: sin texto duplicado, sin errores en consola y sin scroll horizontal.
  3. Lighthouse de la portada: `npx -y lighthouse http://localhost:8000/ --only-categories=performance,accessibility,seo --quiet --chrome-flags="--headless=new" --output=json --output-path=/tmp/lh.json`, y luego `node -e "const r=require('/tmp/lh.json');for(const[k,v]of Object.entries(r.categories))console.log(k,Math.round(v.score*100))"`. Objetivo: rendimiento ≥ 90, accesibilidad ≥ 95. Si no se alcanza, corrige lo que indique el informe (tamaño de imágenes, contraste, `alt`).
  4. `prefers-reduced-motion` emulado: todo visible.
  5. `pdfinfo files/cv-*.pdf | grep Pages` → 1 y 1.

- [ ] **Paso 5: Borrar la spec y el plan** (decisión 5 del usuario) y hacer el commit

```bash
git rm -r -q docs/superpowers 2>/dev/null || rm -rf docs/superpowers
rmdir docs 2>/dev/null || true
git add -A
git commit -m "Elimina los recursos antiguos y añade imagen para compartir y README"
```

No hagas push: el usuario decide cuándo publicar.
