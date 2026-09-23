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
