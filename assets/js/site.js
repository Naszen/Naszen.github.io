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
