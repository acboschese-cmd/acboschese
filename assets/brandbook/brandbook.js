/* AC Boschese — Sempre Audaci, caso studio
   GSAP + ScrollTrigger + Lenis (self-hosted). Sezioni "pinnate" con position:sticky,
   le timeline sono scrub sulla lunghezza della sezione. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const C = { verde: '#107947', bosco: '#1E4430', gelso: '#185A3A', pietra: '#D3D2C4', avorio: '#FFFDE9', oro: '#BDA360' };

  gsap.registerPlugin(ScrollTrigger);
  // su mobile la barra degli indirizzi cambia l'altezza: niente refresh (eviterebbe salti a metà scroll)
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  // smooth scroll solo con mouse/trackpad: su touch lo scroll nativo è già fluido e Lenis interferirebbe con accordion e salti
  if (!reduce && finePointer) {
    // stessa sensazione di scroll del resto del sito (site.js)
    lenis = new Lenis({ duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const goTo = (target) => lenis ? lenis.scrollTo(target, { duration: 1.6 }) : (typeof target === 'number' ? scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- accordion mobile: sposta i contenuti dentro la voce aperta ---------- */
  const mqAcc = matchMedia('(max-width: 900px)');
  // ricalcola i trigger senza mai spostare la pagina
  function safeRefresh() {
    const y = scrollY;
    ScrollTrigger.refresh();
    if (Math.abs(scrollY - y) > 1) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }
  }
  // la voce si apre dove si trova e spinge giù il resto; se sopra se ne chiude un'altra, la voce toccata resta ferma
  function accPlace(accs, idx, nodes, restore, anchor, yStart) {
    if (mqAcc.matches) {
      const y0 = yStart ?? (anchor ? anchor.getBoundingClientRect().top : 0);
      accs.forEach((a, k) => { a.classList.toggle('is-open', k === idx); });
      const target = accs[idx];
      nodes.forEach((n) => target.appendChild(n));
      if (anchor) {
        const dy = anchor.getBoundingClientRect().top - y0;
        if (Math.abs(dy) > 1) { const y = scrollY + dy; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }
      }
      if (!reduce) gsap.fromTo(target, { height: 0 }, { height: 'auto', duration: .55, ease: 'power3.out', clearProps: 'height', onComplete: safeRefresh });
      else safeRefresh();
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
  // su touch niente mix-blend (costoso): il colore dell'HUD segue la luminosità della sezione
  const hudEl = $('.hud');
  function hudTheme(el) {
    const m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return;
    const [r, g, b] = m.map(Number);
    hudEl.classList.toggle('is-light', (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5);
  }
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
    // colore dell'HUD: conta la sezione che passa sotto la barra, non quella a metà schermo
    ScrollTrigger.create({ trigger: el, start: 'top 28px', end: 'bottom 28px', onToggle: (s) => s.isActive && hudTheme(el) });
  });
  const bar = $('#progressBar');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleY(${s.progress})`; } });

  const index = $('#index'), menuBtn = $('#menuBtn'), list = $('#indexList');
  $$('section[id][data-chapter]:not([data-noindex])').forEach((s) => {
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
      // su mobile la fluttuazione è più contenuta: le sezioni sono più strette in verticale
      const a = (+el.dataset.float || 50) * (innerWidth <= 900 ? .4 : 1);
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
     ATTO I — i numeri contano quando entrano in scena
     ========================================================== */
  $$('.stat dd[data-count]').forEach((dd) => {
    const to = +dd.dataset.count, from = to > 1000 ? to - 60 : 0, o = { v: from };
    if (reduce) return;
    dd.textContent = from;
    ScrollTrigger.create({ trigger: dd, start: 'top 88%', once: true, onEnter: () => {
      gsap.to(o, { v: to, duration: to > 1000 ? 1.4 : 1.1, ease: 'power3.out', onUpdate: () => { dd.textContent = Math.round(o.v); } });
    } });
  });

  /* ==========================================================
     ATTO III — il monogramma si disegna con lo scroll
     ========================================================== */
  // il profilo si compone progressivamente (prima A·C, poi B), poi il riempimento entra in dissolvenza
  const drawStrokes = $$('#drawMono .draw__s'), drawFills = $$('#drawMono .draw__f');
  if (!reduce) {
    gsap.set(drawFills, { opacity: 0 });
    const dtl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#monogramma', start: 'top top', end: 'bottom bottom', scrub: 1 } });
    dtl.fromTo(drawStrokes[0], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7 }, 0)
       .fromTo(drawStrokes[1], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .9 }, .55)
       .to(drawFills, { opacity: 1, duration: .5, ease: 'power1.inOut' }, 1.5)
       .to(drawStrokes, { strokeOpacity: 0, duration: .35, ease: 'power1.inOut' }, 1.75)
       .fromTo('#drawCopy', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out' }, 1.7)
       .to({}, { duration: .35 });
  } else {
    gsap.set(drawStrokes, { strokeDashoffset: 0, strokeOpacity: 0 });
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
    setTimeout(() => hudTheme(radici), 450);
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
  // desktop: gli schizzi scorrono di lato; mobile: immagine intera e ferma, si vedono tutti i loghi
  gsap.matchMedia().add('(min-width: 901px)', () => {
    gsap.set(sketch, { yPercent: -50 });
    const tw = reduce ? null : gsap.fromTo(sketch, { x: () => innerWidth * .04 }, {
      x: () => -(sketch.offsetWidth - innerWidth * .96), ease: 'none',
      scrollTrigger: { trigger: '#evoSketch', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
    return () => { tw && tw.scrollTrigger && tw.scrollTrigger.kill(); tw && tw.kill(); gsap.set(sketch, { clearProps: 'all' }); };
  });
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
  // ogni insegna ha il suo fondo; su desktop scorrono da sole come in una sequenza, il click ferma la riproduzione
  const MARKS = [
    { name: 'Il sigillo', tag: 'La firma ufficiale', sym: 'oval', ratio: '356/422', bg: C.verde, mark: C.avorio, year: C.oro,
      desc: 'Il monogramma dentro un ovale, con il nome per intero e l\'anno di fondazione. Firma i comunicati, l\'insegna dello stadio e i social.' },
    { name: 'Il monogramma', tag: 'Il segno breve', sym: 'monogram', ratio: '140/160', bg: C.avorio, mark: C.verde, year: C.oro,
      desc: 'A, C e B in un solo segno verticale. Lo trovate sulle maglie, sui ricami e ovunque ci sia poco spazio.' },
    { name: 'Il logotipo', tag: 'Il nome per intero', sym: 'wordmark', ratio: '604/173', bg: C.bosco, mark: C.avorio, year: C.oro,
      desc: 'Audace Club Boschese in Rector, su due righe, con il 1928 in oro. Sta sulle sciarpe, sui manifesti e sulle intestazioni.' },
    { name: '19/28', tag: 'Il centenario', sym: 'm1928', ratio: '147/160', small: true, bg: C.oro, mark: C.avorio, year: C.avorio,
      desc: 'Il 19 sopra, il 28 sotto. Lo useremo per tutta la stagione del centenario.' },
    { name: 'Lo scudetto', tag: 'La memoria', img: 'assets/brand/scudetto.svg', bg: C.pietra, mark: C.verde, year: C.oro,
      desc: 'Lo stemma storico con il gelso. Lo teniamo per le occasioni importanti.' },
  ];
  const stage = $('#labStage'), markBox = $('#labMark'), info = $('#labInfo'), tabs = $('#labTabs');
  let curMark = 0;
  const labBtns = [], labAccs = [];
  MARKS.forEach((m, i) => {
    const b = document.createElement('button');
    b.className = 'lab__tab'; b.dataset.i = i; b.setAttribute('aria-controls', 'labAcc' + i);
    b.innerHTML = `<b>${m.name}</b><span>0${i + 1}</span>`;
    const a = document.createElement('div');
    a.className = 'lab__acc'; a.id = 'labAcc' + i;
    tabs.append(b, a); labBtns.push(b); labAccs.push(a);
  });
  const labPanel = $('#labPanel'), labViz = $('.lab__viz'), labBody = $('.lab__body');
  // mobile: ogni voce aperta contiene anteprima e testo; -1 = tutte chiuse
  let labOpen = -1;
  const labRestore = () => { labBody.prepend(labViz); labPanel.appendChild(info); };
  function labPlace(i, scroll, yStart) {
    labOpen = i;
    labBtns.forEach((t, k) => t.setAttribute('aria-expanded', k === i));
    if (i < 0) { labAccs.forEach((a) => a.classList.remove('is-open')); labRestore(); safeRefresh(); return; }
    accPlace(labAccs, i, [labViz, info], labRestore, labBtns[i], yStart);
  }
  function renderMark(i, animate = true) {
    const yStart = labBtns[i].getBoundingClientRect().top;   // prima di cambiare testo e stili
    curMark = i; const m = MARKS[i];
    stage.style.setProperty('--c-bg', m.bg);
    stage.style.setProperty('--c-mark', m.mark);
    stage.style.setProperty('--c-year', m.year);
    // ogni insegna vive in un livello proprio: la vecchia esce, la nuova si rivela dal basso
    const layer = document.createElement('div');
    layer.className = 'lab__m' + (m.small ? ' is-small' : '');
    layer.innerHTML = m.sym
      ? `<svg viewBox="0 0 ${m.ratio.replace('/', ' ')}" role="img" aria-label="${m.name}"><use href="#${m.sym}"/></svg>`
      : `<img src="${m.img}" alt="${m.name}">`;
    const old = [...markBox.children];
    markBox.appendChild(layer);
    info.innerHTML = `<p class="eyebrow">${m.tag}</p><p>${m.desc}</p>`;
    if (mqAcc.matches) labPlace(i, animate, yStart);
    else { labRestore(); labBtns.forEach((t, k) => t.setAttribute('aria-expanded', k === i)); }
    if (!animate || reduce) old.forEach((o) => o.remove());
    if (animate && !reduce) {
      old.forEach((o) => gsap.to(o, { opacity: 0, yPercent: -6, duration: .35, ease: 'power2.in', onComplete: () => o.remove() }));
      gsap.fromTo(layer, { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 5 }, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: .95, delay: .15, ease: 'expo.out' });
      gsap.fromTo(info.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: 'power3.out' });
    }
  }
  // riproduzione automatica (solo desktop, solo quando la sezione è visibile, si ferma al primo click)
  const labProg = $('#labProgress');
  let labAuto = !reduce, labInView = false, labTween = null;
  function labNext() {
    if (!labAuto || !labInView || mqAcc.matches) return;
    labTween = gsap.fromTo(labProg, { scaleX: 0 }, { scaleX: 1, duration: 3.6, ease: 'none', onComplete: () => { renderMark((curMark + 1) % MARKS.length); labNext(); } });
  }
  function labStop() { labAuto = false; labTween && labTween.kill(); gsap.set(labProg, { scaleX: 0 }); }
  ScrollTrigger.create({ trigger: stage, start: 'top 75%', end: 'bottom 25%', onToggle: (s) => { labInView = s.isActive; if (s.isActive) labNext(); else { labTween && labTween.kill(); gsap.set(labProg, { scaleX: 0 }); } } });
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('.lab__tab'); if (!t) return;
    const i = +t.dataset.i;
    labStop();
    if (mqAcc.matches && i === labOpen) { labPlace(-1); return; }   // tocco sulla voce aperta: si chiude
    renderMark(i);
  });
  tabs.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault(); labStop();
    const n = (curMark + (e.key === 'ArrowDown' ? 1 : -1) + MARKS.length) % MARKS.length;
    renderMark(n); labBtns[n].focus();
  });
  renderMark(0, false);
  if (mqAcc.matches) labPlace(-1);

  /* ==========================================================
     05 PALETTE
     ========================================================== */
  const PAL = [
    { n: 'Verde Audace', hex: '#107947', t: C.avorio, role: 'Il colore delle maglie e del sigillo.' },
    { n: 'Verde Bosco', hex: '#1E4430', t: C.avorio, role: 'Il verde più scuro, per i fondi.' },
    { n: 'Verde Gelso', hex: '#185A3A', t: C.avorio, role: 'Sta in mezzo: lo usiamo per i tono su tono.' },
    { n: 'Pietra', hex: '#D3D2C4', t: C.bosco, role: 'Il neutro: carta, manifesti, pagine come questa.' },
    { n: 'Avorio', hex: '#FFFDE9', t: C.verde, role: 'Il nostro bianco.' },
    { n: 'Oro', hex: '#BDA360', t: C.bosco, role: 'Solo per il centenario e per i dettagli.' },
  ];
  const bars = $('#palBars');
  PAL.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'bar'; b.style.setProperty('--c', p.hex); b.style.setProperty('--t', p.t);
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-label', `${p.n}. ${p.role}`);
    b.innerHTML = `<span class="bar__idx">0${i + 1}</span><span class="bar__hex">${p.hex.slice(1)}</span>
      <span class="bar__info"><span class="bar__name">${p.n}</span><span class="bar__role">${p.role}</span><span class="bar__code">${p.hex}</span></span>`;
    b.addEventListener('click', () => {
      $$('.bar', bars).forEach((x) => { const on = x === b && !b.classList.contains('is-open'); x.classList.toggle('is-open', on); x.setAttribute('aria-expanded', on); });
    });
    bars.appendChild(b);
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
     I CARATTERI
     ========================================================== */
  // la riga in Rector attraversa lo schermo mentre scorri
  if (!reduce) {
    gsap.fromTo('#typeBig', { xPercent: 8 }, { xPercent: -38, ease: 'none', scrollTrigger: { trigger: '#typeBig', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  }

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
    ctl.fromTo('#n19', { x: () => -innerWidth * .42, yPercent: 22 }, { x: 0, yPercent: 0, duration: 1, ease: 'power3.inOut' }, 0)
       .fromTo('#n28', { x: () => innerWidth * .42, yPercent: -22 }, { x: 0, yPercent: 0, duration: 1, ease: 'power3.inOut' }, 0)
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
      desc: 'La maglia che indossiamo in casa: verde bosco, mesh verde foglia, monogramma e profili in oro.',
      sw: [['Verde Bosco', '#1E4430'], ['Verde foglia', '#17A355'], ['Oro', '#BDA360']] },
    { k: 'portiere', name: 'Portiere', tag: 'Forto Pro — Portiere',
      desc: 'Corallo, colletto nero e inserti bordeaux. Qui il monogramma è nero.',
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
    const yStart = socBtns[i].getBoundingClientRect().top;
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
    accPlace(socAccs, i, [socInfo, socStage], () => { socBody.prepend(socStage); socPanel.appendChild(socInfo); }, socBtns[i], yStart);
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
  mqAcc.addEventListener('change', () => { if (mqAcc.matches) labPlace(-1); else renderMark(curMark, false); renderKit(curKit, false); ScrollTrigger.refresh(); });

  /* ==========================================================
     08 APPLICAZIONI — scroll orizzontale
     ========================================================== */
  const track = $('#appsTrack');
  const appFigs = $$('.app', track);
  const appsNow = $('#appsNow'), appsPrev = $('#appsPrev'), appsNext = $('#appsNext');
  $('#appsTot').textContent = String(appFigs.length).padStart(2, '0');
  let appCur = 0;
  function appsState() {
    const r0 = track.getBoundingClientRect(), x = r0.left + parseFloat(getComputedStyle(track).paddingLeft);
    let best = 0, d = Infinity;
    appFigs.forEach((f, i) => { const dd = Math.abs(f.getBoundingClientRect().left - x); if (dd < d) { d = dd; best = i; } });
    const max = track.scrollWidth - track.clientWidth;
    if (track.scrollLeft >= max - 2) best = appFigs.length - 1;
    if (track.scrollLeft <= 2) best = -1;
    appCur = best;
    appsNow.textContent = String(Math.max(best, 0) + 1).padStart(2, '0');
    appsPrev.disabled = track.scrollLeft <= 2;
    appsNext.disabled = track.scrollLeft >= max - 2;
  }
  // indice -1 = inizio della striscia (il testo introduttivo)
  function appsGo(i) {
    i = gsap.utils.clamp(-1, appFigs.length - 1, i);
    const left = i < 0 ? 0 : appFigs[i].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft);
    track.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
  }
  appsPrev.addEventListener('click', () => appsGo(appCur - 1));
  appsNext.addEventListener('click', () => appsGo(appCur + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); appsGo(appCur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); appsGo(appCur - 1); }
  });
  track.addEventListener('scroll', appsState, { passive: true });
  addEventListener('resize', appsState);
  // trascinamento con il mouse (su touch lo scroll è nativo)
  let drag = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    track.classList.add('is-drag');
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    track.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    track.classList.remove('is-drag');
    if (moved) appsState();
  });
  track.addEventListener('dragstart', (e) => e.preventDefault());
  appsState();

  /* ---------- immagini caricate → ricalcolo ---------- */
  // le immagini hanno width/height: lo spazio è già riservato, basta un refresh a pagina caricata
  addEventListener('load', () => ScrollTrigger.refresh());
})();
