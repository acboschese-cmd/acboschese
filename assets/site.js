/* ============================================================
   AUDACE CLUB BOSCHESE 1928 — script condiviso
   Lenis smooth scroll · GSAP reveals · preloader · transizioni
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover)').matches;
  const firstVisit = !sessionStorage.getItem('acb-v');
  sessionStorage.setItem('acb-v', '1');

  const loader = document.getElementById('loader');
  const count = document.getElementById('count');
  const bar = document.getElementById('bar');
  const mark = document.getElementById('loaderMark');

  /* ---------- AVVIO ---------- */
  function startSite() {
    document.body.style.overflow = '';
    initLenis();
    initReveals();
    initParallax();
    initMarquee();
    initCounters();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function introContent() {
    /* home: titolo hero a tendina; pagine interne: page-hero */
    if (document.querySelector('.hero__title .line span')) {
      gsap.from('.hero__title .line span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
      gsap.from('.hero__top .label, .hero__tag, .hero__scroll', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.35 });
    }
    if (document.querySelector('.phero')) {
      gsap.from('.phero .eyebrow, .phero__title, .phero__sub', { y: 44, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1 });
    }
  }

  if (reduce || typeof gsap === 'undefined') {
    if (loader) loader.style.display = 'none';
    startSite();
  } else if (firstVisit && count) {
    /* prima visita: preloader completo con contatore */
    document.body.style.overflow = 'hidden';
    gsap.to(mark, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    let p = { v: 0 };
    gsap.to(p, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate: () => { count.textContent = Math.round(p.v); bar.style.width = p.v + '%'; },
      onComplete: () => {
        gsap.timeline()
          .to(mark, { opacity: 0, duration: 0.25 })
          .to(loader, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '-=0.05')
          .add(() => { loader.style.display = 'none'; startSite(); introContent(); }, '-=0.15');
      }
    });
  } else {
    /* visite successive / navigazione interna: velo rapido */
    document.body.style.overflow = 'hidden';
    if (count) count.style.display = 'none';
    if (bar) bar.style.display = 'none';
    gsap.to(mark, { opacity: 1, duration: 0.25 });
    gsap.timeline({ delay: 0.15 })
      .to(mark, { opacity: 0, duration: 0.2 }, '+=0.15')
      .to(loader, { yPercent: -100, duration: 0.7, ease: 'expo.inOut' }, '-=0.05')
      .add(() => { loader.style.display = 'none'; startSite(); introContent(); }, '-=0.12');
  }

  /* ---------- TRANSIZIONI DI PAGINA ---------- */
  function leaveTo(href) {
    if (reduce || typeof gsap === 'undefined' || !loader) { window.location.href = href; return; }
    loader.style.display = 'flex';
    if (mark) mark.style.opacity = 0;
    gsap.timeline()
      .fromTo(loader, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'expo.inOut' })
      .to(mark, { opacity: 1, duration: 0.2 }, '-=0.15')
      .add(() => { window.location.href = href; });
  }

  document.querySelectorAll('a[href$=".html"]').forEach((a) => {
    if (a.target === '_blank' || a.host !== location.host && a.host !== '') return;
    a.addEventListener('click', (e) => { e.preventDefault(); leaveTo(a.getAttribute('href')); });
  });

  /* ---------- LENIS ---------- */
  let lenis;
  function initLenis() {
    if (reduce || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6
    });
    window.lenis = lenis;
    lenis.on('scroll', () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
    function rafLoop(time) { lenis.raf(time); requestAnimationFrame(rafLoop); }
    requestAnimationFrame(rafLoop);

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: 0 }); closeMenu(); }
      });
    });
  }

  /* ---------- NAV ---------- */
  const nav = document.getElementById('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    if (!nav) return;
    const y = window.scrollY;
    nav.classList.toggle('solid', y > 60);
    if (y > lastY && y > 400) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });

  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  function closeMenu() { if (menu) { menu.classList.remove('open'); } if (burger) { burger.classList.remove('open'); } }
  if (burger && menu) burger.addEventListener('click', () => { menu.classList.toggle('open'); burger.classList.toggle('open'); });

  /* ---------- REVEALS ---------- */
  function initReveals() {
    if (reduce || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* testo manifesto: parola per parola */
    document.querySelectorAll('.manifest-text').forEach((el) => {
      const temp = document.createElement('div');
      temp.innerHTML = el.innerHTML;
      function wrap(node) {
        const out = document.createDocumentFragment();
        node.childNodes.forEach((child) => {
          if (child.nodeType === 3) {
            child.textContent.split(/(\s+)/).forEach((word) => {
              if (word.trim() === '') { out.appendChild(document.createTextNode(word)); return; }
              const s = document.createElement('span'); s.className = 'w'; s.textContent = word; out.appendChild(s);
            });
          } else if (child.nodeName === 'EM') {
            const em = document.createElement('em');
            em.appendChild(wrap(child));
            out.appendChild(em);
          } else { out.appendChild(child.cloneNode(true)); }
        });
        return out;
      }
      el.innerHTML = '';
      el.appendChild(wrap(temp));
      gsap.from(el.querySelectorAll('.w'), {
        opacity: 0.12, duration: 1, ease: 'power2.out', stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 60%', scrub: 0.6 }
      });
    });

    /* fade-up generico */
    gsap.utils.toArray('.eyebrow, .manifesto__foot p, .partners__row a, .card, .cta__big, .cta__sub, .cta__mail, .split__body, .contact-list, .contact-mail, .otp__k, .otp__t').forEach((el) => {
      gsap.from(el, {
        y: 34, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* REVEAL FOTO: sipario clip-path + scale */
    gsap.utils.toArray('.g-item, .split__media, .otp__media, .ph-reveal').forEach((el) => {
      const img = el.querySelector('img');
      if (!img) return;
      gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(img, { scale: 1.32 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
          gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
          gsap.to(img, { scale: 1, duration: 1.9, ease: 'expo.out', delay: 0.15, clearProps: 'scale' });
        }
      });
    });

    /* testo break */
    gsap.utils.toArray('.break__text .display').forEach((el) => {
      gsap.from(el, { scale: 1.15, opacity: 0, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: el.closest('.break'), start: 'top 60%' } });
    });
  }

  /* ---------- PARALLASSE ---------- */
  function initParallax() {
    if (reduce || !window.ScrollTrigger) return;

    if (document.getElementById('heroMedia')) {
      gsap.to('#heroMedia', { yPercent: 22, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    gsap.utils.toArray('.break__media').forEach((el) => {
      gsap.fromTo(el, { yPercent: -12 }, { yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: el.closest('.break'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    gsap.utils.toArray('.g-item').forEach((el) => {
      const speed = parseFloat(el.dataset.speed || 1);
      const img = el.querySelector('img');
      gsap.fromTo(img, { yPercent: (speed - 1) * -60 - 8 }, { yPercent: (speed - 1) * 60 + 8, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- MARQUEE (reattivo alla velocità di scroll) ---------- */
  function initMarquee() {
    const track = document.getElementById('marquee');
    if (!track || reduce) return;
    let x = 0, base = 0.6, vel = 0;
    const half = track.scrollWidth / 2;
    if (window.ScrollTrigger) {
      ScrollTrigger.create({ onUpdate: (self) => { vel = self.getVelocity(); } });
    }
    (function loop() {
      const boost = Math.min(Math.abs(vel) / 180, 6);
      x -= base + boost;
      if (x <= -half) x += half;
      track.style.transform = 'translateX(' + x + 'px)';
      vel *= 0.9;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- CAROSELLO ---------- */
  (function initCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const step = () => {
      const slide = track.querySelector('.carousel__slide');
      return slide ? slide.getBoundingClientRect().width + 20 : 400;
    };
    document.querySelectorAll('.carousel__btn').forEach((b) => {
      b.addEventListener('click', () => track.scrollBy({ left: step() * parseInt(b.dataset.dir, 10), behavior: 'smooth' }));
    });
    /* drag con il mouse (su touch scorre nativamente) */
    let down = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', () => { down = false; track.classList.remove('is-dragging'); });
  })();

  /* ---------- CONTATORI ---------- */
  function initCounters() {
    if (!window.ScrollTrigger) return;
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const isYear = target > 1500;
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
          if (reduce) { el.textContent = target; return; }
          const o = { v: isYear ? target - 40 : 0 };
          gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.round(o.v); } });
        }
      });
    });
  }

  /* ---------- CURSORE CUSTOM + MAGNETICI ---------- */
  if (hasFinePointer && !reduce) {
    const dot = document.getElementById('dot');
    const ring = document.getElementById('ring');
    if (dot && ring) {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let rx = mx, ry = my;
      window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)'; });
      (function ringLoop() { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)'; requestAnimationFrame(ringLoop); })();

      document.querySelectorAll('a, .nav__burger, .g-item, .card, .otp').forEach((el) => {
        el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
      });

      document.querySelectorAll('.nav__cta, .cta__mail, .nav__brand, .contact-mail').forEach((el) => {
        el.classList.add('magnetic');
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          el.style.transform = 'translate(' + (e.clientX - (r.left + r.width / 2)) * 0.3 + 'px,' + (e.clientY - (r.top + r.height / 2)) * 0.4 + 'px)';
        });
        el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
      });
    }
  }

  window.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted && loader) { loader.style.display = 'none'; document.body.style.overflow = ''; } });
})();
