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
  // Cuenta como vista al ver el 40 % de la sección o, si es más alta que la pantalla, al ocupar el 40 % de la pantalla
  const io = new IntersectionObserver(es => es.forEach(en => {
    const id = en.target.dataset.section;
    const vh = en.rootBounds ? en.rootBounds.height : innerHeight;
    const needed = 0.4 * Math.min(en.boundingClientRect.height, vh);
    if (en.isIntersecting && en.intersectionRect.height >= needed && !seen.has(id)) {
      seen.add(id); track('section_view', { section: id }); io.unobserve(en.target);
    }
  }), { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
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
