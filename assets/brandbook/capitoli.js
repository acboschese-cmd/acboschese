/* Sempre Audaci — il caso studio a capitoli verticali.
   Lo scroll è quello normale della pagina (morbido solo con mouse e trackpad). In alto la linea dei capitoli
   si riempie col capitolo in corso; il fondo prende il colore del blocco al centro dello schermo.
   Il resto entra quando arriva sullo schermo (IntersectionObserver): nessun calcolo a ogni fotogramma sul telefono. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const narrow = matchMedia('(max-width: 900px)');
  const root = document.documentElement;

  /* lettere separate, per farle salire una alla volta (apertura) o cambiare al passaggio (la voce) */
  let k = 0;
  $$('.sp').forEach((el) => [...el.childNodes].forEach((n) => {
    if (n.nodeType !== 3) return;
    const f = document.createDocumentFragment();
    [...n.textContent].forEach((c) => { const i = document.createElement('i'); i.textContent = c; i.setAttribute('aria-hidden', 'true'); i.style.setProperty('--k', k++); f.append(i); });
    n.replaceWith(f);
  }));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { document.body.classList.add('is-ready'); measure(); });

  /* ---------- scroll ---------- */
  const lenis = !reduce && window.Lenis && fine ? new Lenis({ duration: 1.2, smoothWheel: true }) : null;
  const bar = () => $('.top').offsetHeight;
  const go = (el) => {
    const y = el.getBoundingClientRect().top + scrollY - (el.classList.contains('ch') ? 0 : bar());
    lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- la linea dei capitoli ---------- */
  const rail = $('.rail'), now = $('.rail__now'), fill = $('.rail__line i'), topN = $('.top__n b');
  const C = $$('.rail__list a').map((a) => ({ a, el: $(a.getAttribute('href')), n: a.querySelector('b').textContent, t: a.querySelector('span').textContent, y: 0, h: 0 }));
  /* col menu aperto la pagina sotto resta ferma */
  const open = (on) => { rail.classList.toggle('is-open', on); root.classList.toggle('is-menu', on && narrow.matches); now.setAttribute('aria-expanded', on); };
  now.addEventListener('click', () => open(!rail.classList.contains('is-open')));
  C.forEach((c) => c.a.addEventListener('click', (e) => { e.preventDefault(); open(false); go(c.el); history.replaceState(null, '', c.a.getAttribute('href')); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  document.addEventListener('click', (e) => { if (!rail.contains(e.target)) open(false); });

  let H = innerHeight, cur = -2;
  const measure = () => {
    H = innerHeight;
    C.forEach((c) => { const r = c.el.getBoundingClientRect(); c.y = r.top + scrollY; c.h = r.height; });
    tick(true);
  };
  new ResizeObserver(() => measure()).observe(document.body);

  /* il fondo: il colore del blocco che occupa il centro dello schermo */
  const tones = $$('[data-tone]');
  /* anche la barra del browser sul telefono prende il colore del blocco */
  const meta = $('meta[name="theme-color"]'), TONE = { bosco: '#1E4430', verde: '#107947', avorio: '#FFFDE9', oro: '#BDA360', pietra: '#D3D2C4' };
  let tone = '';
  const tick = (force) => {
    const y = scrollY, mid = y + H * .5;
    /* capitolo in corso e quanto ne hai letto */
    let i = -1, f = 0;
    C.forEach((c, n) => { if (mid >= c.y) { i = n; f = clamp((mid - c.y) / c.h); } });
    if (i !== cur || force) {
      cur = i;
      C.forEach((c, n) => { c.a.classList.toggle('is-on', n === i); c.a.classList.toggle('is-past', n < i); });
      const c = C[i];
      $('b', now).textContent = c ? c.n : '00'; $('span', now).textContent = c ? c.t : 'Capitoli';
      if (topN) topN.textContent = c ? c.n : '00';
      root.classList.toggle('is-hero', !c);
    }
    /* da computer la linea va da un pallino all'altro; sul telefono è la barra intera, divisa in sei */
    const p = i < 0 ? 0 : narrow.matches ? (i + f) / C.length : (i + f) / (C.length - 1);
    fill.style.transform = `scaleX(${clamp(p).toFixed(4)})`;
    let t = tone || 'bosco';
    for (const el of tones) { const r = el.getBoundingClientRect(); if (r.top < H * .5 && r.bottom > H * .5) { t = el.dataset.tone; break; } }
    if (t !== tone) { tone = t; root.dataset.tone = t; if (meta) meta.content = TONE[t]; }
    stickers(y);
    storyUpd();
  };

  /* ---------- quello che entra sullo schermo ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in'); io.unobserve(e.target);
    if (e.target.classList.contains('voice__m')) voiceLetters.forEach((i, n) => flash(i, 300 + n * 70));
  }), { rootMargin: '0px 0px -4% 0px' });
  $$('.rv, .ph, .cent, .voice__m').forEach((el) => io.observe(el));

  /* ---------- gli adesivi del muro: col mouse ognuno scorre a una velocità sua ---------- */
  const wall = $('.wall'), S = reduce || !fine ? [] : $$('.stk', wall).map((el) => ({ el, f: +el.dataset.f }));
  let wallOn = false;
  if (wall) new IntersectionObserver(([e]) => { wallOn = e.isIntersecting; }).observe(wall);
  const stickers = () => {
    if (!wallOn || !S.length) return;
    /* stretto, gli adesivi stanno sopra il testo: niente parallasse, non devono scendere sulle parole */
    if (narrow.matches) { if (S[0].el.style.transform) S.forEach((x) => (x.el.style.transform = '')); return; }
    const r = wall.getBoundingClientRect(), c = (r.top + r.height / 2 - H / 2);
    S.forEach((s) => (s.el.style.transform = `translate3d(0,${(c * s.f).toFixed(1)}px,0)`));
  };

  /* ---------- le date: una roulette legata allo scroll ----------
     La sezione resta ferma sullo schermo; scorrendo, l'anno gira cifra per cifra da una data alla successiva
     (ogni colonna va da 0 a 9), e a metà giro cambiano foto e testo. Fra un giro e l'altro la data resta ferma. */
  const story = $('.story');
  let storyUpd = () => {};
  if (story) {
    const spin = $('.story__pin', story), F = $$('.story__f', story), T = $$('.story__x', story);
    const dots = $$('.story__line button', story), sfill = $('.story__fill i', story), odo = $('.odo', story);
    const Y = dots.map((d) => d.textContent.trim()), N = Y.length;
    odo.innerHTML = [...Y[0]].map(() => '<span class="odo__d"><span>' + [...'0123456789'].map((d) => `<i>${d}</i>`).join('') + '</span></span>').join('');
    const cols = $$('.odo__d > span', odo);
    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let on = 0, lastP = -1;
    const show = (n) => {
      if (n === on) return; on = n;
      F.forEach((f, m) => f.classList.toggle('is-on', m === n));
      T.forEach((t, m) => { t.classList.toggle('is-on', m === n); t.toggleAttribute('inert', m !== n); });
      dots.forEach((d, m) => { d.classList.toggle('is-on', m === n); d.classList.toggle('is-past', m < n); d.setAttribute('aria-current', m === n ? 'true' : 'false'); });
    };
    const range = () => ({ top: story.getBoundingClientRect().top + scrollY - bar(), len: Math.max(1, story.offsetHeight - spin.offsetHeight) });
    storyUpd = () => {
      const { top, len } = range();
      const p = clamp((scrollY - top) / len) * (N - 1);
      if (Math.abs(p - lastP) < .0005) return; lastP = p;
      const i = Math.min(N - 2, Math.floor(p)), f = p - i;
      cols.forEach((c, k) => {
        const a = +Y[i][k], b = +Y[i + 1][k];
        const t = reduce ? (f > .5 ? 1 : 0) : ease(clamp((f - .2 - k * .06) / .42));
        c.style.transform = `translate3d(0,${-(a + (b - a) * t).toFixed(3)}em,0)`;
      });
      show(f > .5 ? i + 1 : i);
      sfill.style.transform = `scaleX(${(p / (N - 1)).toFixed(4)})`;
    };
    /* un clic su una data porta lo scroll al punto in cui quella data è ferma */
    dots.forEach((d, m) => d.addEventListener('click', () => {
      const { top, len } = range(), y = top + len * m / (N - 1);
      lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }));
  }

  /* ---------- approfondimenti: la pillola apre un pannello da destra ---------- */
  const drawer = $('.drawer'), dIn = $('.drawer__in'), dC = $('.drawer__c');
  let opener = null;
  const hold = (e) => { if (!dIn.contains(e.target)) e.preventDefault(); };
  const holdOpts = { passive: false };
  const openMore = (key, btn) => {
    const tpl = $('#more-' + key); if (!tpl) return;
    opener = btn; dC.replaceChildren(tpl.content.cloneNode(true)); dIn.scrollTop = 0;
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    addEventListener('wheel', hold, holdOpts); addEventListener('touchmove', hold, holdOpts);
    $$('video', dC).forEach((v) => { v.preload = 'auto'; v.play().catch(() => {}); });
    setTimeout(() => dIn.focus({ preventScroll: true }), 50);
  };
  const closeMore = () => {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    removeEventListener('wheel', hold, holdOpts); removeEventListener('touchmove', hold, holdOpts);
    $$('video', dC).forEach((v) => v.pause());
    if (opener) opener.focus({ preventScroll: true });
  };
  $$('.more').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); openMore(b.dataset.more, b); }));
  $$('[data-close]', drawer).forEach((el) => el.addEventListener('click', closeMore));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMore(); });

  /* ---------- apertura: si prende un adesivo dalla fila e lo si attacca sul motto ---------- */
  const intro = $('.hero'), title = $('.intro__t'), slap = $('.slap'), row = $('.tray__row');
  const STK = [['bb5-sticker-sempre-audaci', 1.15, 'Sempre Audaci'], ['bb5-sticker-scudetto', .62, 'Scudetto'], ['bb5-sticker-1928', 1.3, '1928'], ['bb13-sticker-tondo', .82, 'Audace Club'],
    ['bb5-sticker-gagliardetto', .66, 'Gagliardetto'], ['bb10-sticker-b-gotica', .32, 'B'], ['bb5-sticker-boschese-veloce', 1.7, 'Boschese'], ['bb10-sticker-rettangolo', .95, 'Audace Club Boschese'],
    ['bb5-sticker-boschese-ultras', 1.3, 'Boschese Ultras'],
    ['bb14-sticker-bollino', .82, 'Bollino Bosco Marengo'], ['bb14-sticker-boschese-corsivo', 1.25, 'Boschese corsivo'], ['bb14-sticker-gagliardetto', 1.15, 'Gagliardetto Sempre Audaci'],
    ['bb14-sticker-quadrifoglio', .85, 'Quadrifoglio'], ['bb14-sticker-scudo-100', .62, 'Cento'], ['bb14-sticker-sempre-audaci', 1.1, 'Sempre Audaci anni Novanta'],
    ['bb14-sticker-tondo-righe', .8, 'ACB a righe'], ['bb14-sticker-verdi-bianchi', 1.0, 'Verdi Bianchi']].map(([f, k, n]) => ({ src: `assets/brandbook/${f}.webp`, k: k * .7, n }));
  const fs = () => parseFloat(getComputedStyle(title).fontSize);
  const size = (s) => s.k * (narrow.matches ? .8 : 1); /* sul telefono il motto prende quasi tutta la larghezza: gli adesivi un po' meno */
  const tilt = () => +(Math.random() * 26 - 13).toFixed(1);
  const randSpot = () => { const r = title.getBoundingClientRect(); return [r.left + r.width * (.1 + Math.random() * .8), r.top + r.height * (.1 + Math.random() * .8)]; };
  const stick = (s, cx, cy, a) => {
    const r = title.getBoundingClientRect(), f = fs(), im = document.createElement('img');
    im.src = s.src; im.alt = '';
    im.style.left = (cx - r.left) / f + 'em'; im.style.top = (cy - r.top) / f + 'em';
    im.style.setProperty('--k', size(s)); im.style.setProperty('--a', a + 'deg');
    slap.append(im);
    if (slap.children.length > 24) { const old = slap.children[0]; old.classList.add('via'); setTimeout(() => old.remove(), 600); }
  };
  /* la fila degli adesivi va a capo in righe di lunghezza simile: mai un adesivo solo nell'ultima */
  let rowW = 0, balQ = 0;
  const balance = () => { if (!balQ) balQ = requestAnimationFrame(() => {
    balQ = 0; rowW = row.clientWidth;
    $$('.tray__br', row).forEach((br) => br.remove());
    const items = $$('.tray__i', row), gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const ws = items.map((b) => b.getBoundingClientRect().width + gap);
    const total = ws.reduce((a, w) => a + w, 0) - gap, rows = Math.ceil(total / rowW);
    if (!rowW || rows < 2) return;
    const target = total / rows; let acc = 0, n = 1;
    items.forEach((b, i) => {
      if (i && acc + ws[i] / 2 > target * n) { const br = document.createElement('i'); br.className = 'tray__br'; b.before(br); n++; }
      acc += ws[i];
    });
  }); };
  if (intro && row) {
    /* un solo adesivo in mano alla volta, seguito su tutta la finestra: non può restare appeso */
    let held = null;
    const end = (e) => {
      if (!held) return;
      const { s, b, peel, moved, a } = held; held = null;
      removeEventListener('pointermove', hmove); removeEventListener('pointerup', hup); removeEventListener('pointercancel', drop);
      if (!e) return peel.remove();
      const ir = intro.getBoundingClientRect(), tr = row.getBoundingClientRect();
      const inside = e.clientX > ir.left && e.clientX < ir.right && e.clientY > Math.max(ir.top, bar()) && e.clientY < tr.top - 10;
      if (!moved) { peel.remove(); stick(s, ...randSpot(), a); } /* un tocco: va sulla scritta, in un punto a caso */
      else if (inside) { peel.remove(); stick(s, e.clientX, e.clientY, a); }
      else { /* lasciato fuori: torna nella fila */
        const br = b.getBoundingClientRect(); peel.style.transition = '';
        requestAnimationFrame(() => { peel.style.left = br.left + br.width / 2 + 'px'; peel.style.top = br.top + br.height / 2 + 'px'; peel.classList.add('is-back'); });
        setTimeout(() => peel.remove(), 500);
      }
    };
    const hmove = (e) => {
      if (!held || e.pointerId !== held.id) return;
      held.moved = held.moved || Math.hypot(e.clientX - held.x, e.clientY - held.y) > 4;
      held.peel.style.left = e.clientX + 'px'; held.peel.style.top = e.clientY + 'px';
    };
    const hup = (e) => { if (held && e.pointerId === held.id) end(e); };
    const drop = () => end(null);
    addEventListener('blur', drop); document.addEventListener('visibilitychange', drop);
    STK.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tray__i'; b.setAttribute('aria-label', 'Attacca l\'adesivo ' + s.n);
      b.innerHTML = `<img src="${s.src}" alt="">`;
      /* la casella segue la forma dell'adesivo: quelli lunghi non diventano francobolli */
      const im = b.firstChild, fit = () => { b.style.setProperty('--r', Math.min(2.2, Math.max(1, im.naturalWidth / im.naturalHeight)).toFixed(2)); balance(); };
      im.complete ? fit() : im.addEventListener('load', fit, { once: true });
      row.append(b);
      b.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation(); drop();
        const a = tilt(), peel = document.createElement('img');
        peel.src = s.src; peel.alt = ''; peel.className = 'peel';
        peel.style.width = size(s) * fs() + 'px'; peel.style.rotate = a + 'deg'; peel.style.transition = 'none';
        peel.style.left = e.clientX + 'px'; peel.style.top = e.clientY + 'px'; document.body.append(peel);
        held = { s, b, peel, a, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        addEventListener('pointermove', hmove, { passive: true }); addEventListener('pointerup', hup); addEventListener('pointercancel', drop);
      });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stick(s, ...randSpot(), tilt()); } });
    });
    new ResizeObserver(() => { if (row.clientWidth !== rowW) balance(); }).observe(row);
  }

  /* ---------- la voce: le lettere passano all'Inline al passaggio, e una volta da sole quando entrano ---------- */
  const voiceLetters = $$('.voice__m i');
  const flash = (i, d = 0) => setTimeout(() => { i.classList.add('on'); clearTimeout(i._t); i._t = setTimeout(() => i.classList.remove('on'), 1500); }, d);
  voiceLetters.forEach((i) => i.addEventListener('pointerenter', () => flash(i)));

  /* ---------- a ogni fotogramma, solo se lo scroll è cambiato ---------- */
  addEventListener('load', () => { measure(); const t = location.hash && $(location.hash); if (t) go(t); });
  let last = -1;
  const frame = (t) => {
    if (lenis) lenis.raf(t);
    if (scrollY !== last) { last = scrollY; tick(); }
    requestAnimationFrame(frame);
  };
  measure();
  requestAnimationFrame(frame);
})();
