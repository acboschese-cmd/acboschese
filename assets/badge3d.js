/* ============================================================
   SCUDETTO 3D — badge WebGL nel hero della home
   Corpo estruso dalla sagoma SVG + artwork come texture frontale.
   Desktop: parte a fianco di "SEMPRE AUDACI", poi a scroll scende
   in verticale (stessa X) compiendo un giro completo e si posa
   di fianco al testo "01 — Il Club". Mobile: resta in hero, sopra
   il titolo, senza viaggio (nessuna sezione abbastanza larga).
   ============================================================ */
(function () {
  const mount = document.getElementById('badge3d');
  if (!mount || typeof THREE === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RATIO = 346 / 442; /* proporzioni dello scudetto */
  const titleWrap = document.querySelector('.hero__title');

  /* stato condiviso tra layout() (misura) e applyProgress() (scroll-travel) */
  let isMobile = false;
  let badgeH = 0;
  let travelStartY = 0, travelEndY = 0, travelLeft = 0;
  let scrollSpin = 0;

  function computeLandDocY() {
    const text = document.querySelector('#club .manifest-text');
    if (!text) return null;
    /* la cima del badge si allinea con l'inizio del testo "Non è..." */
    return text.getBoundingClientRect().top + window.scrollY;
  }

  function layout() {
    const title = document.querySelector('.hero__title .display');
    const hero = document.querySelector('.hero');
    if (!title || !hero) return false;
    const h = hero.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 40;
    isMobile = h.width < 860;

    if (isMobile) {
      /* mobile: scudetto sopra il titolo, centrato; il titolo scende per non sovrapporsi mai.
         Nessun viaggio a scroll: coordinate documento, si scrolla via naturalmente con l'hero. */
      badgeH = Math.min(h.width * 0.34, 190);
      const badgeW = badgeH * RATIO;
      mount.style.display = 'block';
      mount.style.height = badgeH + 'px';
      mount.style.width = badgeW + 'px';
      mount.style.left = (h.left + window.scrollX + h.width / 2 - badgeW / 2) + 'px';
      mount.style.right = 'auto';
      mount.style.transform = 'none';
      if (titleWrap) {
        const bt = title.getBoundingClientRect();
        mount.style.top = (bt.top + window.scrollY - badgeH * 0.94) + 'px';
        titleWrap.style.marginTop = (badgeH * 0.72) + 'px';
      }
      return true;
    }
    if (titleWrap) titleWrap.style.marginTop = '';

    const t = title.getBoundingClientRect();
    /* il canvas è più alto dello scudetto: dà margine per rotazione/fluttuazione
       (lo scudetto vero riempie ~80% del canvas, vedi scala 3D) — così non si taglia mai */
    badgeH = t.height * 1.12;
    const badgeW = badgeH * RATIO;
    const gap = Math.max(16, (h.right - h.left) * 0.015); /* vicino al testo */
    let left = t.right + gap;
    const maxLeft = h.right - pad - badgeW;          /* non oltre il margine destro */
    if (left > maxLeft) left = maxLeft;
    if (left < t.right - badgeW * 0.15) { mount.style.display = 'none'; return false; }
    mount.style.display = 'block';
    mount.style.height = badgeH + 'px';
    mount.style.width = badgeW + 'px';
    mount.style.right = 'auto';
    mount.style.transform = 'none';

    /* coordinate DOCUMENTO (rect + scroll corrente): invarianti rispetto allo scroll,
       così valgono sia per il punto di partenza (hero) sia per quello di arrivo (Il Club) */
    travelLeft = left + window.scrollX;
    travelStartY = t.top + window.scrollY - t.height * 0.06; /* centrato sul titolo, come prima */
    const land = computeLandDocY();
    travelEndY = land !== null ? land : travelStartY; /* cima del badge = cima del testo */

    mount.style.left = travelLeft + 'px';
    mount.style.top = travelStartY + 'px'; /* valore iniziale; lo scroll-travel lo aggiorna da qui in poi */
    return true;
  }

  /* fallback statico se WebGL non c'è */
  function fallback() {
    const img = document.createElement('img');
    img.src = 'assets/brand/scudetto-sym.svg';
    img.alt = '';
    img.style.width = '100%';
    mount.appendChild(img);
  }
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return fallback();
  } catch (e) { return fallback(); }

  const W = () => mount.clientWidth;
  const H = () => mount.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 2000);
  camera.position.set(0, 0, 1150);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.outputEncoding = THREE.sRGBEncoding;
  mount.appendChild(renderer.domElement);

  /* luci: chiave calda + riempimento freddo + speculare oro */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xfff6dd, 1.15);
  key.position.set(-260, 340, 420);   /* radente dall'alto-sx: esalta il rilievo coniato */
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbda360, 0.6);
  rim.position.set(380, -160, 260);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  /* texture: rasterizzo l'SVG del crest ad alta risoluzione */
  const texSize = 1024;
  const texCanvas = document.createElement('canvas');
  texCanvas.width = texSize;
  texCanvas.height = Math.round(texSize * 442 / 346);
  const svgImg = new Image();
  svgImg.onload = () => {
    const ctx = texCanvas.getContext('2d');
    ctx.drawImage(svgImg, 0, 0, texCanvas.width, texCanvas.height);

    /* height-map per l'effetto "coniato": luminanza dell'artwork.
       Chiaro (crema/oro) = rilievo, verde/scuro = inciso; fondo neutro. */
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = texCanvas.width;
    bumpCanvas.height = texCanvas.height;
    const bctx = bumpCanvas.getContext('2d');
    const src = ctx.getImageData(0, 0, texCanvas.width, texCanvas.height);
    const dst = bctx.createImageData(texCanvas.width, texCanvas.height);
    const sd = src.data, dd = dst.data;
    for (let i = 0; i < sd.length; i += 4) {
      const a = sd[i + 3];
      let v = 128;
      if (a > 12) {
        const lum = 0.299 * sd[i] + 0.587 * sd[i + 1] + 0.114 * sd[i + 2];
        /* INVERTITO: gelso e scritte (verde/scuro) in rilievo, campo crema incavato */
        const contrast = Math.max(0, Math.min(255, (lum - 90) * 1.9 + 90));
        v = 255 - contrast;
      }
      dd[i] = dd[i + 1] = dd[i + 2] = v; dd[i + 3] = 255;
    }
    bctx.putImageData(dst, 0, 0);

    buildBadge(new THREE.CanvasTexture(texCanvas), new THREE.CanvasTexture(bumpCanvas));
  };
  svgImg.onerror = fallback;
  svgImg.src = 'assets/brand/scudetto-sym.svg';

  function buildBadge(texture, bumpTex) {
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    new THREE.SVGLoader().load('assets/brand/scudetto-sym.svg', (data) => {
      /* primo path = sagoma dello scudetto */
      const shapes = data.paths[0].toShapes(true);
      const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 26,
        bevelEnabled: true,
        bevelThickness: 7,
        bevelSize: 6,
        bevelSegments: 3,
        curveSegments: 64,
        steps: 1
      });
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      const w = bb.max.x - bb.min.x;
      const h = bb.max.y - bb.min.y;

      /* UV dei cap ricavate dalle posizioni: l'artwork combacia con la sagoma */
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (pos.getX(i) - bb.min.x) / w, 1 - (pos.getY(i) - bb.min.y) / h);
      }
      uv.needsUpdate = true;

      const front = new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: bumpTex,
        bumpScale: 8,     /* profondità del rilievo coniato */
        metalness: 0.3,
        roughness: 0.38
      });
      const side = new THREE.MeshStandardMaterial({ color: 0xfffde9, metalness: 0.35, roughness: 0.38 });
      const mesh = new THREE.Mesh(geo, [front, side]);

      /* centro e orientamento (SVG ha la Y verso il basso) */
      mesh.position.set(-w / 2 - bb.min.x, h / 2 + bb.min.y, 0);
      mesh.scale.y = -1;
      const holder = new THREE.Group();
      holder.add(mesh);

      /* lo scudetto riempie ~78% del canvas: il resto è margine anti-taglio */
      const s = 448 / h;
      holder.scale.set(s, s, s);
      group.add(holder);

      start();
    }, undefined, fallback);
  }

  /* interazione */
  let mx = 0, my = 0, vis = true, raf = null;
  if (!reduce) {
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  const io = new IntersectionObserver((en) => {
    vis = en[0].isIntersecting;
    if (vis && raf === null) loop(performance.now());
  }, { threshold: 0 });
  io.observe(mount);

  /* ---------- scroll-travel (solo desktop): hero -> "01 — Il Club" ---------- */
  function applyProgress(p) {
    if (isMobile || reduce) return;
    mount.style.top = (travelStartY + (travelEndY - travelStartY) * p) + 'px';
    mount.style.left = travelLeft + 'px';
    scrollSpin = p * Math.PI * 2; /* un giro completo lungo il tragitto, congruo a 0 all'arrivo */
  }

  let scrollST = null;
  function setupScrollTravel() {
    if (reduce || typeof ScrollTrigger === 'undefined' || scrollST) return;
    scrollST = ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      endTrigger: '#club',
      end: 'center center',
      scrub: true,
      onUpdate: (self) => applyProgress(self.progress)
    });
    applyProgress(scrollST.progress);
  }

  function resize() {
    if (!layout()) return;
    if (W() === 0 || H() === 0) return; /* viewport non ancora dimensionato (tab in background) */
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    if (scrollST) { ScrollTrigger.refresh(); applyProgress(scrollST.progress); }
  }
  window.addEventListener('resize', resize, { passive: true });
  new ResizeObserver(() => resize()).observe(document.querySelector('.hero__title') || mount);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize); /* Rector cambia l'altezza del titolo */

  let started = false;
  function start() { started = true; resize(); setupScrollTravel(); loop(performance.now()); }

  function loop(t) {
    if (!vis || document.hidden) { raf = null; return; }
    raf = requestAnimationFrame(loop);
    if (!started) return;
    const tt = t / 1000;
    if (reduce) {
      group.rotation.set(0, 0, 0);
    } else {
      /* rotazione pigra ± tilt dal mouse ± giro dato dallo scroll-travel, senza mai mostrare il retro a riposo */
      group.rotation.y = Math.sin(tt * 0.5) * 0.28 + mx * 0.2 + scrollSpin;
      group.rotation.x = Math.sin(tt * 0.33) * 0.06 + my * 0.12;
      group.position.y = Math.sin(tt * 0.8) * 5;
    }
    renderer.render(scene, camera);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && vis && raf === null) loop(performance.now());
  });
})();
