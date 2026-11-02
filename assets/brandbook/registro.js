/* Audace Club Boschese — il caso studio come un manuale. JavaScript senza librerie:
   comparsa delle sezioni, indice laterale, vento, confronto, segni, palette, PIVS, maglie, video. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- comparsa: una volta sola, quando l'elemento entra ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv, .mono__plate').forEach((el) => io.observe(el));

  /* ---------- indice: capitolo attivo, barra di avanzamento, menu su mobile ---------- */
  const rail = $('.rail'), links = $$('.rail__nav a'), bar = $('.rail__bar i');
  const secs = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    const y = scrollY + innerHeight * .35;
    let cur = secs[0];
    secs.forEach((s) => { if (s.offsetTop <= y) cur = s; });
    links.forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === '#' + cur.id));
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  const menu = $('.rail__menu');
  menu.addEventListener('click', () => { const o = !rail.classList.contains('is-open'); rail.classList.toggle('is-open', o); menu.setAttribute('aria-expanded', o); });
  links.forEach((a) => a.addEventListener('click', () => { rail.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); }));

  /* ---------- i numeri della sfida contano quando entrano ---------- */
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count, from = to > 1000 ? to - 60 : 0;
    if (reduce) return;
    el.textContent = from;
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      const t0 = performance.now(), d = 1300;
      const step = (t) => { const k = Math.min(1, (t - t0) / d), ease = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * ease); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }).observe(el);
  });

  /* ---------- il vento piega la frase: «piegarci» si piega più di tutte, «abbatterci» resta dritta ---------- */
  const wind = $('#wind'), quote = $('#windQuote');
  if (wind && quote) {
    const split = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/( )/).forEach((p) => { if (p === ' ') f.append(' '); else if (p) { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; f.append(s); } });
        n.replaceWith(f);
      } else if (n.nodeType === 1) split(n);
    });
    split(quote);
    const words = $$('.w', quote);
    words.forEach((w, i) => { const t = w.textContent.toLowerCase(); w._k = t.startsWith('pieg') ? 1.7 : t.startsWith('abbatt') ? 0 : .55 + Math.sin(i * 2.3) * .2; });
    if (!reduce) {
      let v = 0, on = false, raf = 0;
      const tick = () => { v *= .92; if (Math.abs(v) < .01) v = 0; words.forEach((w) => { w.style.transform = `rotate(${v * w._k * .5}deg)`; }); raf = v ? requestAnimationFrame(tick) : 0; };
      new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(wind);
      wind.addEventListener('pointermove', (e) => { if (!on) return; v = Math.max(-30, Math.min(30, v + e.movementX * .12)); if (!raf) raf = requestAnimationFrame(tick); });
    }
  }

  /* ---------- confronto scudetto / sigillo ---------- */
  const cmp = $('#cmp');
  if (cmp) {
    let drag = false;
    const set = (p) => { p = Math.max(0, Math.min(100, p)); cmp.style.setProperty('--pos', p + '%'); cmp.setAttribute('aria-valuenow', Math.round(p)); };
    const at = (e) => { const r = cmp.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    cmp.addEventListener('pointerdown', (e) => { drag = true; cmp.setPointerCapture(e.pointerId); set(at(e)); });
    cmp.addEventListener('pointermove', (e) => { if (drag || e.pointerType === 'mouse') set(at(e)); });
    cmp.addEventListener('pointerup', () => { drag = false; });
    cmp.addEventListener('keydown', (e) => { const v = +cmp.getAttribute('aria-valuenow'); if (e.key === 'ArrowLeft') { set(v - 5); e.preventDefault(); } if (e.key === 'ArrowRight') { set(v + 5); e.preventDefault(); } });
    set(50);
  }

  /* ---------- i cinque segni: ognuno sul suo fondo, oppure tutti sullo stesso ---------- */
  const marks = $$('.mark__p'), chips = $$('.chips button');
  const paint = (c) => marks.forEach((m) => {
    const d = c || m.dataset;
    m.style.setProperty('--c-bg', d.bg); m.style.setProperty('--c-mark', d.mark); m.style.setProperty('--c-year', d.year);
  });
  chips.forEach((b) => b.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', x === b));
    paint(b.dataset.bg ? b.dataset : null);
  }));
  paint(null);

  /* ---------- palette: clic per copiare il codice ---------- */
  $$('.sw').forEach((b) => b.addEventListener('click', () => {
    navigator.clipboard?.writeText(b.dataset.hex).then(() => { b.classList.add('is-copied'); setTimeout(() => b.classList.remove('is-copied'), 1400); }).catch(() => {});
  }));

  /* ---------- PIVS: la lente scopre l'Inline; clic per vederlo tutto ---------- */
  const lens = $('#lens');
  if (lens) {
    const st = $('.lens__stage', lens);
    const move = (e) => { const r = st.getBoundingClientRect(); st.style.setProperty('--x', (e.clientX - r.left) + 'px'); st.style.setProperty('--y', (e.clientY - r.top) + 'px'); };
    st.addEventListener('pointerenter', (e) => { lens.classList.add('is-on'); move(e); });
    st.addEventListener('pointermove', move);
    st.addEventListener('pointerleave', () => lens.classList.remove('is-on'));
    st.addEventListener('click', (e) => { move(e); lens.classList.toggle('is-full'); });
  }
  const test = $('#tester');
  if (test) {
    const out = $('.tester__out', test), range = $('input[type=range]', test), val = $('output', test);
    if (out.contentEditable !== 'plaintext-only') out.contentEditable = 'true';
    const pick = (grp, b) => $$('button', grp).forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('[data-style]', test).forEach((b) => b.addEventListener('click', () => { pick(b.parentElement, b); out.dataset.style = b.dataset.style; }));
    $$('[data-case]', test).forEach((b) => b.addEventListener('click', () => { pick(b.parentElement, b); out.style.textTransform = b.dataset.case; }));
    const liga = $('[data-liga]', test);
    liga.addEventListener('click', () => { const on = liga.getAttribute('aria-pressed') !== 'true'; liga.setAttribute('aria-pressed', on); out.toggleAttribute('data-liga', on); });
    const size = () => { out.style.setProperty('--fs', range.value + 'px'); val.textContent = range.value; };
    range.addEventListener('input', size); size();
    $$('.tester__samples button', test).forEach((b) => b.addEventListener('click', () => {
      out.textContent = b.textContent;
      if (b.textContent.startsWith('ACB') && liga.getAttribute('aria-pressed') !== 'true') liga.click();
    }));
    out.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
  }

  /* ---------- maglie: home e portiere ---------- */
  $$('.kit-tabs button').forEach((b) => b.addEventListener('click', () => {
    $$('.kit-tabs button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('.kit').forEach((k) => k.classList.toggle('is-on', k.dataset.kit === b.dataset.kit));
  }));

  /* ---------- video: partono quando sono in vista ---------- */
  $$('video[data-autoplay]').forEach((v) => {
    v.muted = true;
    if (reduce) { v.controls = true; return; }
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => { v.controls = true; }); } else v.pause(); }, { threshold: .35 }).observe(v);
  });

  $('#toTop')?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
})();
