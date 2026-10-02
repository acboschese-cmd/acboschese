/* AC Boschese — Brand Book
   GSAP + ScrollTrigger + Lenis (self-hosted). Sezioni "pinnate" con position:sticky,
   le timeline sono scrub sulla lunghezza della sezione. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const C = { verde: '#107947', bosco: '#1E4430', gelso: '#185A3A', pietra: '#D3D2C4', avorio: '#FFFDE9', oro: '#BDA360' };

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce) {
    // stessa sensazione di scroll del resto del sito (site.js)
    lenis = new Lenis({ duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const goTo = (target) => lenis ? lenis.scrollTo(target, { duration: 1.6 }) : (typeof target === 'number' ? scrollTo(0, target) : target.scrollIntoView());

  /* ---------- toast ---------- */
  const toast = $('#toast'); let toastT;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 1800);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); showToast('Copiato ' + text); }
    catch { showToast(text); }
  }

  /* ---------- accordion mobile: sposta i contenuti dentro la voce aperta ---------- */
  const mqAcc = matchMedia('(max-width: 900px)');
  function accPlace(accs, idx, nodes, restore, scrollTo) {
    if (mqAcc.matches) {
      accs.forEach((a, k) => { a.classList.toggle('is-open', k === idx); });
      const target = accs[idx];
      const before = target.offsetHeight;
      nodes.forEach((n) => target.appendChild(n));
      if (!reduce) gsap.fromTo(target, { height: before }, { height: 'auto', duration: .6, ease: 'power3.inOut', clearProps: 'height', onComplete: () => ScrollTrigger.refresh() });
      else ScrollTrigger.refresh();
      if (scrollTo && lenis) lenis.scrollTo(scrollTo, { offset: -70, duration: 1 });
    } else {
      accs.forEach((a) => a.classList.remove('is-open'));
      restore();
    }
  }

  /* ---------- loader ---------- */
  const loader = $('#loader');
  const ldCount = $('#ldCount');
  let seen = false;
  try { seen = sessionStorage.getItem('acb-bb') === '1'; sessionStorage.setItem('acb-bb', '1'); } catch {}
  const LD = reduce ? 200 : seen ? 900 : 2100;
  document.body.classList.add('is-loading');
  const t0 = performance.now();
  const ldTimer = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / (LD * 0.8));
    const e = 1 - Math.pow(1 - p, 3);
    ldCount.textContent = String(Math.round(1928 * e)).padStart(4, '0');
    if (p >= 1) clearInterval(ldTimer);
  }, 30);
  setTimeout(() => {
    loader.classList.add('is-out');
    document.body.classList.remove('is-loading');
    if (lenis) lenis.start();
    heroIntro();
    setTimeout(() => loader.remove(), 1100);
  }, LD);

  /* ---------- HUD, indice, progress ---------- */
  const hudNum = $('#hudNum'), hudName = $('#hudName');
  let curChapter = '';
  function setHud(el) {
    const name = el.dataset.chapter;
    if (name === curChapter) return;
    curChapter = name;
    hudNum.textContent = el.dataset.num;
    hudName.textContent = name;
    gsap.fromTo(hudName, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' });
  }
  $$('[data-chapter]').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && setHud(el) });
  });
  const bar = $('#progressBar');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleY(${s.progress})`; } });

  const index = $('#index'), menuBtn = $('#menuBtn'), list = $('#indexList');
  $$('section[id][data-chapter]').forEach((s) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${s.id}"><span>${s.dataset.num}</span><b>${s.dataset.chapter}</b></a>`;
    list.appendChild(li);
  });
  function toggleIndex(open) {
    const o = open ?? !index.classList.contains('is-open');
    menuBtn.setAttribute('aria-expanded', o);
    menuBtn.querySelector('span').textContent = o ? 'Chiudi' : 'Indice';
    if (o) {
      index.hidden = false; requestAnimationFrame(() => index.classList.add('is-open')); lenis && lenis.stop();
      setTimeout(() => { const f = list.querySelector('a'); f && f.focus(); }, 60);
    } else {
      index.classList.remove('is-open'); lenis && lenis.start();
      setTimeout(() => { if (!index.classList.contains('is-open')) index.hidden = true; }, 800);
      menuBtn.focus();
    }
  }
  menuBtn.addEventListener('click', () => toggleIndex());
  list.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    e.preventDefault(); toggleIndex(false);
    const target = document.querySelector(a.getAttribute('href'));
    setTimeout(() => goTo(target), 350);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && index.classList.contains('is-open')) toggleIndex(false); });
  $('#toTop').addEventListener('click', () => goTo(0));

  /* ---------- cursore ---------- */
  const cursor = $('#cursor'), cLabel = $('#cursorLabel');
  if (finePointer && !reduce) {
    const cx = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); cursor.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      cursor.classList.toggle('is-big', !!t);
      cLabel.textContent = t ? t.dataset.cursor : '';
    });
  }

  /* ---------- reveal & fluttuazione ---------- */
  if (!reduce) {
    gsap.set('[data-reveal]', { opacity: 0, y: 40 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .09 }),
    });
    // "fluttuazione": è il contenitore che si muove rispetto alla pagina
    $$('[data-float]').forEach((el) => {
      const a = +el.dataset.float || 50;
      gsap.fromTo(el, { y: a }, { y: -a, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    });
    // foto di storia (Santa Croce, Vasari): l'immagine scorre dentro la cornice, con inerzia
    $$('.sc__img img, .vas__frame img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, { yPercent: 7, scale: 1.16, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.4 } });
    });
  }

  /* ==========================================================
     00 HERO — il sigillo diventa un portale
     ========================================================== */
  const hero = $('#top'), portal = $('#heroPortal'), seal = $('#heroSeal'), sealIn = $('#heroSealIn');
  function portalStart() {
    const r = seal.getBoundingClientRect();
    return { rx: r.width * 0.326, ry: r.height * 0.358 };
  }
  const p0 = portalStart();
  gsap.set(portal, { '--rx': p0.rx + 'px', '--ry': p0.ry + 'px' });

  function heroIntro() {
    if (reduce) return;
    gsap.from('.hero__line', { yPercent: 60, opacity: 0, duration: 1.4, ease: 'power4.out', stagger: .12 });
    gsap.from(seal, { scale: .6, opacity: 0, duration: 1.6, ease: 'power4.out', delay: .1 });
    gsap.from('.hero__hint, .hero__meta', { opacity: 0, duration: 1, delay: .6 });
  }

  if (!reduce) {
    const diag = () => Math.hypot(innerWidth, innerHeight) * 0.75;
    const htl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true },
    });
    htl.to('.hero__line--a', { x: () => -innerWidth * .4, opacity: 0, duration: .5, ease: 'power1.in' }, 0)
       .to('.hero__line--b', { x: () => innerWidth * .4, opacity: 0, duration: .5, ease: 'power1.in' }, 0)
       .to('.hero__hint, .hero__meta', { opacity: 0, duration: .12 }, 0)
       .to(seal, { scale: 5, opacity: 0, duration: .55, ease: 'power2.in' }, 0)
       .fromTo(portal, { '--rx': () => portalStart().rx + 'px', '--ry': () => portalStart().ry + 'px' },
                       { '--rx': () => diag() + 'px', '--ry': () => diag() + 'px', duration: .62, ease: 'power2.in' }, 0)
       .to('#heroPortal img', { scale: 1, duration: .8 }, 0)
       .to(portal, { '--shade': 1, duration: .2 }, .5)
       .fromTo('#heroIntro', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: .22, ease: 'power2.out' }, .64)
       .to({}, { duration: .14 });

    if (finePointer) {
      const rx = gsap.quickTo(sealIn, 'rotationX', { duration: .9, ease: 'power3' });
      const ry = gsap.quickTo(sealIn, 'rotationY', { duration: .9, ease: 'power3' });
      hero.addEventListener('pointermove', (e) => {
        ry((e.clientX / innerWidth - .5) * 34);
        rx(-(e.clientY / innerHeight - .5) * 24);
      });
    }
  } else {
    gsap.set('#heroIntro', { autoAlpha: 1 });
  }

  /* ==========================================================
     01 RADICI — il contatore degli anni
     ========================================================== */
  const YEARS = [1566, 1928, 2025, 2028];
  const THEMES = [[C.pietra, C.bosco], [C.verde, C.avorio], [C.bosco, C.avorio], [C.oro, C.bosco]];
  const odo = $('#odo');
  const cols = String(YEARS[0]).split('').map((d) => {
    const w = document.createElement('span'); w.className = 'odo__d';
    const col = document.createElement('span'); col.className = 'odo__col';
    col.innerHTML = Array.from({ length: 10 }, (_, i) => `<span>${i}</span>`).join('');
    w.appendChild(col); odo.appendChild(w);
    gsap.set(col, { yPercent: -d * 10 });
    return col;
  });
  const radici = $('#radici');
  const steps = $$('#radiciSteps li');
  const figs = $$('.radici__media figure');
  const arts = $$('.radici__copy article');
  let curStep = 0;
  function setStep(i) {
    if (i === curStep) return;
    curStep = i; steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
  }
  if (!reduce) {
    const rtl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: radici, start: 'top top', end: 'bottom bottom', scrub: .7,
        onUpdate: () => {
          const t = rtl.time(); let i = 0;
          for (let k = 1; k < YEARS.length; k++) if (t >= .3 + (k - 1) * 1.25 + .5) i = k;
          setStep(i);
        },
      },
    });
    rtl.to({}, { duration: .3 });
    for (let i = 1; i < YEARS.length; i++) {
      const at = .3 + (i - 1) * 1.25;
      String(YEARS[i]).split('').forEach((d, k) => rtl.to(cols[k], { yPercent: -d * 10, duration: 1 }, at + k * .04));
      rtl.to(radici, { backgroundColor: THEMES[i][0], color: THEMES[i][1], duration: .8 }, at + .1)
         .fromTo(figs[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power3.inOut' }, at)
         .fromTo(figs[i].querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 1.1, ease: 'power2.out' }, at)
         .to(arts[i - 1], { autoAlpha: 0, y: -30, duration: .35, ease: 'power2.in' }, at)
         .fromTo(arts[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out' }, at + .5);
    }
    rtl.to({}, { duration: .4 });
  }

  /* ==========================================================
     02 GELSO — il vento piega le parole
     ========================================================== */
  const quote = $('#windQuote');
  function splitWords(node) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/( )/).forEach((part) => {
          if (part === ' ') frag.appendChild(document.createTextNode(' '));
          else if (part) { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
  }
  splitWords(quote);
  const words = $$('.w', quote);
  // "piegare" si piega più di tutte, "abbatte" resta dritta: il vento non ci abbatte
  words.forEach((w, i) => {
    const t = w.textContent.toLowerCase();
    w._k = t.startsWith('piegare') ? 1.7 : t.startsWith('abbatte') ? 0 : .55 + Math.sin(i * 2.3) * .2;
  });
  if (!reduce) {
    gsap.fromTo(words, { opacity: .14 }, { opacity: 1, stagger: .12, ease: 'none', scrollTrigger: { trigger: quote, start: 'top 82%', end: 'bottom 50%', scrub: true } });
    let wind = 0, inView = false;
    const gimg = $('#gelsoImg');
    ScrollTrigger.create({ trigger: '#gelso', start: 'top bottom', end: 'bottom top', onToggle: (s) => { inView = s.isActive; } });
    addEventListener('pointermove', (e) => { if (inView) wind = gsap.utils.clamp(-30, 30, wind + e.movementX * .12); }, { passive: true });
    gsap.ticker.add(() => {
      if (!inView) return;
      wind *= .92;
      if (Math.abs(wind) < .01) wind = 0;
      for (const w of words) w.style.transform = `rotate(${wind * w._k * .5}deg)`;
      gimg.style.transform = `rotate(${wind * .05}deg) scale(1.04)`;
    });
  }

  /* ==========================================================
     03 EVOLUZIONE — schizzi e confronto
     ========================================================== */
  const sketch = $('#evoSketch img');
  gsap.set(sketch, { yPercent: -50 });
  if (!reduce) {
    gsap.fromTo(sketch, { x: () => innerWidth * .04 }, {
      x: () => -(sketch.offsetWidth - innerWidth * .96), ease: 'none',
      scrollTrigger: { trigger: '#evoSketch', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  }
  const cmp = $('#compare');
  let cmpPos = 50, dragging = false;
  function setCmp(p) {
    cmpPos = gsap.utils.clamp(0, 100, p);
    cmp.style.setProperty('--pos', cmpPos + '%');
    cmp.setAttribute('aria-valuenow', Math.round(cmpPos));
    cmp.setAttribute('aria-valuetext', `Scudetto ${Math.round(cmpPos)}%, sigillo ${100 - Math.round(cmpPos)}%`);
  }
  const fromEvent = (e) => { const r = cmp.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  cmp.addEventListener('pointerdown', (e) => { dragging = true; cmp.setPointerCapture(e.pointerId); setCmp(fromEvent(e)); });
  cmp.addEventListener('pointermove', (e) => { if (dragging || e.pointerType === 'mouse') setCmp(fromEvent(e)); });
  cmp.addEventListener('pointerup', () => { dragging = false; });
  cmp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { setCmp(cmpPos - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setCmp(cmpPos + 5); e.preventDefault(); }
  });
  setCmp(50);
  if (!reduce) {
    const o = { p: 92 };
    ScrollTrigger.create({ trigger: cmp, start: 'top 70%', once: true, onEnter: () => {
      gsap.fromTo(o, { p: 92 }, { p: 50, duration: 1.8, ease: 'power3.inOut', onUpdate: () => setCmp(o.p) });
    } });
  }

  /* ==========================================================
     04 LABORATORIO MARCHI
     ========================================================== */
  const MARKS = [
    { id: 'sigillo', name: 'Il sigillo', tag: 'Firma primaria', sym: 'oval', ratio: '356/422',
      desc: 'Il monogramma ACB racchiuso nell\'ovale, con il nome completo e l\'anno di fondazione. È la firma istituzionale del club.',
      uso: 'Comunicazione ufficiale, insegne, tribuna, social', car: 'Ortus + Rector' },
    { id: 'monogramma', name: 'Il monogramma', tag: 'Segno breve', sym: 'monogram', ratio: '140/160',
      desc: 'A, C e B intrecciate in un unico segno verticale. Nasce dal blackletter dei sigilli papali e lo porta nel presente.',
      uso: 'Maglia, ricami, avatar, favicon', car: 'Ortus' },
    { id: 'logotipo', name: 'Il logotipo', tag: 'Nome per esteso', sym: 'wordmark', ratio: '604/173', wide: true,
      desc: 'Audace Club Boschese composto in Rector su due righe, con l\'anno di fondazione in oro. La voce rinascimentale del club.',
      uso: 'Intestazioni, sciarpe, manifesti, merchandising', car: 'Rector' },
    { id: '1928', name: '19/28', tag: 'Brand del centenario', n1928: true,
      desc: 'L\'anno di fondazione scomposto e sfalsato su due righe: un sigillo dedicato al cammino verso il 2028.',
      uso: 'Collezione del centenario, dettagli in oro, celebrazioni', car: 'Rector' },
    { id: 'scudetto', name: 'Lo scudetto', tag: 'Memoria storica', img: 'assets/brand/scudetto.svg',
      desc: 'Lo stemma con il gelso e la scritta A.C. Boschese. Resta nel sistema come segno della tradizione.',
      uso: 'Archivio, occasioni celebrative, maglia', car: 'Storico' },
  ];
  const BGS = [
    { k: 'verde', bg: C.verde, mark: C.avorio, year: C.oro },
    { k: 'avorio', bg: C.avorio, mark: C.verde, year: C.oro },
    { k: 'bosco', bg: C.bosco, mark: C.verde, year: C.oro },
    { k: 'gelso', bg: C.gelso, mark: C.avorio, year: C.oro },
    { k: 'pietra', bg: C.pietra, mark: C.verde, year: C.bosco },
    { k: 'oro', bg: C.oro, mark: C.avorio, year: C.bosco },
  ];
  const stage = $('#labStage'), markBox = $('#labMark'), info = $('#labInfo'), tabs = $('#labTabs'), sw = $('#labSwatches');
  let curMark = 0, curBg = 0;
  const labBtns = [], labAccs = [];
  MARKS.forEach((m, i) => {
    const b = document.createElement('button');
    b.className = 'lab__tab'; b.dataset.i = i; b.setAttribute('aria-controls', 'labAcc' + i);
    b.innerHTML = `<b>${m.name}</b><span>0${i + 1}</span>`;
    const a = document.createElement('div');
    a.className = 'lab__acc'; a.id = 'labAcc' + i;
    tabs.append(b, a); labBtns.push(b); labAccs.push(a);
  });
  const labPanel = $('#labPanel');
  BGS.forEach((b, i) => {
    const s = document.createElement('button');
    s.className = 'swatch'; s.style.setProperty('--sw', b.bg); s.dataset.i = i;
    s.setAttribute('aria-label', 'Fondo ' + b.k);
    sw.appendChild(s);
  });
  function renderMark(i, animate = true) {
    curMark = i; const m = MARKS[i];
    labBtns.forEach((t, k) => t.setAttribute('aria-expanded', k === i));
    let html;
    if (m.sym) html = `<svg viewBox="0 0 ${m.ratio.replace('/', ' ')}" aria-label="${m.name}"><use href="#${m.sym}"/></svg>`;
    else if (m.n1928) html = `<div class="lab__n1928" aria-label="1928"><span>19</span><span>28</span></div>`;
    else html = `<img src="${m.img}" alt="${m.name}">`;
    markBox.className = 'lab__mark' + (m.wide ? ' is-wide' : '');
    markBox.innerHTML = html;
    info.innerHTML = `<p class="eyebrow">${m.tag}</p><p>${m.desc}</p><dl><dt>Uso</dt><dd>${m.uso}</dd><dt>Carattere</dt><dd>${m.car}</dd></dl>`;
    accPlace(labAccs, i, [info], () => labPanel.appendChild(info));
    if (animate && !reduce) {
      gsap.fromTo(markBox.firstElementChild, { scale: .86, opacity: 0, rotate: -4 }, { scale: 1, opacity: 1, rotate: 0, duration: .9, ease: 'expo.out' });
      gsap.fromTo(info.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: 'power3.out' });
    }
  }
  function renderBg(i) {
    curBg = i; const b = BGS[i];
    stage.style.setProperty('--c-bg', b.bg);
    stage.style.setProperty('--c-mark', b.mark);
    stage.style.setProperty('--c-year', b.year);
    $$('.swatch', sw).forEach((s, k) => s.setAttribute('aria-pressed', k === i));
  }
  tabs.addEventListener('click', (e) => { const t = e.target.closest('.lab__tab'); if (t && (+t.dataset.i !== curMark || !mqAcc.matches)) renderMark(+t.dataset.i); });
  tabs.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const n = (curMark + (e.key === 'ArrowDown' ? 1 : -1) + MARKS.length) % MARKS.length;
    renderMark(n); labBtns[n].focus();
  });
  sw.addEventListener('click', (e) => { const s = e.target.closest('.swatch'); if (s) renderBg(+s.dataset.i); });
  $('#gridBtn').addEventListener('click', (e) => {
    const on = stage.classList.toggle('show-grid');
    e.currentTarget.setAttribute('aria-pressed', on);
    e.currentTarget.textContent = on ? 'Nascondi griglia' : 'Mostra griglia';
  });
  if (finePointer) {
    const coord = $('#labCoord');
    stage.addEventListener('pointermove', (e) => {
      if (!stage.classList.contains('show-grid')) return;
      const r = stage.getBoundingClientRect();
      coord.textContent = `x ${Math.round((e.clientX - r.left) / r.width * 100)} · y ${Math.round((e.clientY - r.top) / r.height * 100)}`;
    });
  }
  renderMark(0, false); renderBg(0);

  /* ==========================================================
     05 PALETTE
     ========================================================== */
  const PAL = [
    { n: 'Verde Audace', hex: '#107947', t: C.avorio, role: 'Il colore primario del club: maglia, sigillo e comunicazione.' },
    { n: 'Verde Bosco', hex: '#1E4430', t: C.avorio, role: 'Il verde più profondo, per fondi e superfici istituzionali.' },
    { n: 'Verde Gelso', hex: '#185A3A', t: C.avorio, role: 'Il tono intermedio, per i tono su tono e i dettagli ricamati.' },
    { n: 'Pietra', hex: '#D3D2C4', t: C.bosco, role: 'Il neutro caldo, per carta, fondi editoriali e respiro.' },
    { n: 'Avorio', hex: '#FFFDE9', t: C.verde, role: 'Il bianco del biancoverde, ammorbidito.' },
    { n: 'Oro', hex: '#BDA360', t: C.bosco, role: 'Nobilita il brand: riservato al centenario e ai dettagli preziosi.' },
  ];
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' · ');
  const cmyk = (h) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const k = 1 - Math.max(r, g, b);
    if (k >= 1) return '0 · 0 · 0 · 100';
    return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((v) => Math.round(v * 100)).join(' · ');
  };
  const bars = $('#palBars');
  PAL.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'bar'; b.style.setProperty('--c', p.hex); b.style.setProperty('--t', p.t);
    b.dataset.cursor = 'Copia';
    b.setAttribute('aria-label', `${p.n}, ${p.hex}. Copia il codice`);
    b.innerHTML = `<span class="bar__idx">0${i + 1}</span><span class="bar__copy">Clicca per copiare</span>
      <span class="bar__hex">${p.hex.slice(1)}</span>
      <span class="bar__info"><span class="bar__name">${p.n}</span><span class="bar__role">${p.role}</span>
      <span class="bar__codes"><span>HEX</span><span>${p.hex}</span><span>RGB</span><span>${rgb(p.hex)}</span><span>CMYK</span><span>${cmyk(p.hex)}</span></span></span>`;
    b.addEventListener('click', () => {
      const narrow = innerWidth <= 900;
      if (narrow && !b.classList.contains('is-open')) {
        $$('.bar', bars).forEach((x) => x.classList.toggle('is-open', x === b));
        return;
      }
      copy(p.hex);
    });
    bars.appendChild(b);
  });
  const chips = $('#palChips');
  [{ n: 'Verde Web', hex: '#016938' }, { n: 'Menta', hex: '#1DFA93' }].forEach((c) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.style.setProperty('--c', c.hex); b.dataset.cursor = 'Copia';
    b.innerHTML = `<i></i>${c.n} ${c.hex}`;
    b.addEventListener('click', () => copy(c.hex));
    chips.appendChild(b);
  });
  if (!reduce) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      gsap.fromTo('.bar', { scaleY: 0 }, { scaleY: 1, ease: 'power2.out', stagger: .1, scrollTrigger: { trigger: bars, start: 'top 92%', end: 'top 30%', scrub: .6 } });
    });
    mm.add('(max-width: 900px)', () => {
      gsap.fromTo('.bar', { xPercent: -100 }, { xPercent: 0, ease: 'power2.out', stagger: .1, scrollTrigger: { trigger: bars, start: 'top 90%', end: 'center 60%', scrub: .6 } });
    });
  }

  /* ==========================================================
     06 TIPOGRAFIA — tester e glifi
     ========================================================== */
  const SETS = {
    rector: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&?!«»',
    avant: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&?!',
  };
  const CLS = { rector: 'f-rector', avant: 'f-avant' };
  let font = 'rector';
  const tIn = $('#testerInput'), tOut = $('#testerOut'), tSize = $('#testerSize');
  const gGrid = $('#glyphGrid'), gBig = $('#glyphBig'), gCode = $('#glyphCode');
  const clean = (s) => font === 'rector' ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() : s;
  function renderTester() {
    tOut.className = 'tester__out ' + CLS[font];
    tOut.textContent = clean(tIn.value) || ' ';
    const v = +tSize.value;
    tOut.style.fontSize = `min(${v}px, ${(v / 12).toFixed(2)}vw)`;
  }
  function setGlyph(ch) {
    gBig.textContent = ch; gBig.className = CLS[font];
    gCode.textContent = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    $$('button', gGrid).forEach((b) => b.classList.toggle('is-on', b.textContent === ch));
  }
  function renderGlyphs() {
    gGrid.className = 'glyphs__grid ' + CLS[font];
    gGrid.innerHTML = [...SETS[font]].map((c) => `<button type="button" aria-label="Glifo ${c}">${c}</button>`).join('');
    setGlyph(SETS[font][0]);
  }
  gGrid.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b) setGlyph(b.textContent); });
  gGrid.addEventListener('focusin', (e) => { const b = e.target.closest('button'); if (b) setGlyph(b.textContent); });
  $$('.tester__fonts .pill').forEach((p) => p.addEventListener('click', () => {
    font = p.dataset.f;
    $$('.tester__fonts .pill').forEach((x) => { x.classList.toggle('is-on', x === p); x.setAttribute('aria-checked', x === p); });
    renderTester(); renderGlyphs();
    if (!reduce) gsap.fromTo(tOut, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' });
  }));
  $$('.tcard').forEach((c) => c.addEventListener('click', () => { const b = $(`.tester__fonts [data-f="${c.dataset.font}"]`); if (b) b.click(); }));
  tIn.addEventListener('input', renderTester);
  tSize.addEventListener('input', renderTester);
  renderTester(); renderGlyphs();

  /* ==========================================================
     07 CENTENARIO — 19 e 28 si incontrano
     ========================================================== */
  const years = $('#centYears');
  if (!reduce) {
    const countUp = () => {
      const p = gsap.utils.clamp(0, 1, (ctl.time() - 1.25) / .6);
      years.textContent = Math.round(100 * (1 - (1 - p) * (1 - p)));
    };
    const ctl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: countUp, scrollTrigger: {
      trigger: '#centenario', start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true, onUpdate: countUp,
    } });
    ctl.fromTo('#n19', { x: () => -innerWidth * .42, yPercent: 50 }, { x: 0, yPercent: 0, duration: 1, ease: 'power3.inOut' }, 0)
       .fromTo('#n28', { x: () => innerWidth * .42, yPercent: -50 }, { x: 0, yPercent: 0, duration: 1, ease: 'power3.inOut' }, 0)
       .to('.cent__num', { scale: .72, yPercent: -12, duration: .6, ease: 'power2.inOut' }, 1.05)
       .to('#centCopy', { opacity: 1, duration: .4 }, 1.3)
       .fromTo('#centCount', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .3 }, 1.2)
       .to({}, { duration: .3 });
    gsap.fromTo('.fullbleed__img', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.fullbleed', start: 'top bottom', end: 'bottom top', scrub: true } });
  } else {
    years.textContent = '100';
    gsap.set('#centCopy, #centCount', { opacity: 1 });
  }

  /* ==========================================================
     09 SOCIETAS — le divise
     ========================================================== */
  const KITS = [
    { k: 'home', name: 'Home', tag: 'Forto Pro — Home',
      desc: 'Il verde più profondo del bosco, i pannelli laterali in verde foglia e il monogramma ACB in oro, con le cuciture a vista che disegnano il busto. Al collo, la fettuccia Societas.',
      sw: [['Verde Bosco', '#1E4430'], ['Verde foglia', '#17A355'], ['Oro', '#BDA360']] },
    { k: 'portiere', name: 'Portiere', tag: 'Forto Pro — Portiere',
      desc: 'Corallo acceso, colletto nero e inserti bordeaux: il portiere si riconosce da lontano. Il monogramma ACB è in nero.',
      sw: [['Corallo', '#FF5F4F'], ['Nero', '#151515'], ['Bordeaux', '#7A1E25']] },
  ];
  const socTabs = $('#socTabs'), socInfo = $('#socInfo');
  const socSets = $$('.soc__set');
  let curKit = 0;
  const socBtns = [], socAccs = [];
  const socStage = $('#socStage'), socBody = $('.soc__body'), socPanel = $('#socPanel');
  KITS.forEach((kt, i) => {
    const b = document.createElement('button');
    b.className = 'soc__tab'; b.dataset.i = i; b.setAttribute('aria-controls', 'socAcc' + i);
    b.innerHTML = `<span>0${i + 1}</span><b>${kt.name}</b>`;
    const a = document.createElement('div');
    a.className = 'soc__acc'; a.id = 'socAcc' + i;
    socTabs.append(b, a); socBtns.push(b); socAccs.push(a);
  });
  function renderKit(i, animate = true) {
    curKit = i; const kt = KITS[i];
    socBtns.forEach((t, n) => t.setAttribute('aria-expanded', n === i));
    socSets.forEach((s) => {
      const on = s.dataset.kit === kt.k;
      s.classList.toggle('is-on', on); s.setAttribute('aria-hidden', !on);
      if (on && animate && !reduce) {
        gsap.fromTo(s.querySelectorAll('.soc__f'), { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.inOut', stagger: .08 });
        gsap.fromTo(s.querySelectorAll('img'), { scale: 1.15 }, { scale: 1, duration: 1.4, ease: 'power3.out', stagger: .08 });
      }
    });
    socInfo.innerHTML = `<p class="eyebrow">${kt.tag}</p><p>${kt.desc}</p>
      <ul class="soc__sw">${kt.sw.map(([n, c]) => `<li><i style="background:${c}"></i><span>${n}</span></li>`).join('')}</ul>`;
    accPlace(socAccs, i, [socInfo, socStage], () => { socBody.prepend(socStage); socPanel.appendChild(socInfo); }, animate ? socBtns[i] : null);
    if (animate && !reduce) gsap.fromTo(socInfo.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: 'power3.out' });
  }
  socTabs.addEventListener('click', (e) => { const t = e.target.closest('.soc__tab'); if (t && +t.dataset.i !== curKit) renderKit(+t.dataset.i); });
  socTabs.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const n = (curKit + (['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1) + KITS.length) % KITS.length;
    renderKit(n); socBtns[n].focus();
  });
  renderKit(0, false);
  // al cambio breakpoint rimetto i contenuti al posto giusto
  mqAcc.addEventListener('change', () => { renderMark(curMark, false); renderKit(curKit, false); ScrollTrigger.refresh(); });

  /* ==========================================================
     08 APPLICAZIONI — scroll orizzontale
     ========================================================== */
  const apps = $('#applicazioni'), track = $('#appsTrack');
  const appFigs = $$('.app', track);
  const appsNow = $('#appsNow');
  $('#appsTot').textContent = String(appFigs.length).padStart(2, '0');
  function nearestApp() {
    const mid = innerWidth / 2; let best = 0, d = Infinity;
    appFigs.forEach((f, i) => { const r = f.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - mid); if (dd < d) { d = dd; best = i; } });
    appsNow.textContent = String(best + 1).padStart(2, '0');
  }
  const mmA = gsap.matchMedia();
  mmA.add('(min-width: 901px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const setH = () => { apps.style.height = (dist() + innerHeight) + 'px'; };
    setH();
    ScrollTrigger.addEventListener('refreshInit', setH);
    const tw = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: apps, start: 'top top', end: 'bottom bottom', scrub: reduce ? true : .6, invalidateOnRefresh: true, onUpdate: nearestApp },
    });
    return () => { ScrollTrigger.removeEventListener('refreshInit', setH); apps.style.height = ''; tw.kill(); };
  });
  track.addEventListener('scroll', nearestApp, { passive: true });

  /* ---------- immagini caricate → ricalcolo ---------- */
  let rT;
  const refresh = () => { clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 200); };
  addEventListener('load', refresh);
  $$('img[loading="lazy"]').forEach((img) => img.addEventListener('load', refresh, { once: true }));
})();
