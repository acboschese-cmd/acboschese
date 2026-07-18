/* ============================================================
   Anteprima live per il CMS (Decap) — usa lo stesso CSS del sito
   e la stessa logica di rendering di build.js, così l'editor vede
   esattamente la pagina reale mentre scrive.
   NB: se cambi i renderer in build.js, aggiorna anche qui.
   ============================================================ */
(function () {
  if (typeof CMS === 'undefined') return;

  /* ---------- mini-markdown (stessa logica di build.js) ---------- */
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* l'iframe di anteprima ha come base /admin/: i percorsi relativi vanno resi assoluti */
  function assetUrl(p) {
    p = String(p || '');
    if (!p || p.indexOf('/') === 0 || /^https?:\/\//.test(p)) return p;
    return '/' + p;
  }
  function inline(s) {
    return s
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }
  function inlineTitle(s) { return inline(esc(s || '')).replace(/\n/g, '<br />'); }
  function para(s) { return '<p>' + inline(esc(s)) + '</p>'; }

  function splitMedia(b) {
    var tall = b.aspetto === 'alta';
    return '<div class="split__media' + (tall ? ' split__media--tall' : '') + '"' + (tall ? '' : ' style="aspect-ratio: 1/1;"') + '>' +
      '<img src="' + esc(assetUrl(b.immagine)) + '" alt="' + esc(b.immagineAlt || '') + '" /></div>';
  }

  function renderHero(h) {
    h = h || {};
    return '<header class="phero">' +
      '<div class="eyebrow label">' + esc(h.eyebrow || '') + '</div>' +
      '<h1 class="display phero__title">' + inlineTitle(h.titolo) + '</h1>' +
      '<p class="phero__sub">' + inline(esc(h.sottotitolo || '')) + '</p>' +
      '</header>';
  }

  function renderVideo(v) {
    if (!v || !v.src) return '';
    return '<section class="break break--short"><div class="break__media">' +
      '<video src="' + esc(assetUrl(v.src)) + '" autoplay muted loop playsinline preload="metadata" poster="' + esc(assetUrl(v.poster || '')) + '"></video>' +
      '</div></section>';
  }

  function renderManifesto(b, pad) {
    var hasSplit = !!b.immagine;
    var foot = (!hasSplit && b.paragrafi && b.paragrafi.length)
      ? '<div class="manifesto__foot">' + b.paragrafi.map(para).join('') + '</div>' : '';
    var split = hasSplit
      ? '<div class="split' + (b.invertito ? ' split--rev' : '') + '" style="margin-top: clamp(40px, 6vw, 80px);">' +
        splitMedia(b) +
        '<div class="split__body"><h3>' + inlineTitle(b.titoloSplit) + '</h3>' +
        (b.paragrafiSplit || []).map(para).join('') + '</div></div>'
      : '';
    return '<section class="sec"' + pad + '>' +
      '<div class="eyebrow label">' + esc(b.eyebrow || '') + '</div>' +
      '<p class="manifest-text">' + inline(esc(b.testo || '')) + '</p>' + foot + split +
      '</section>';
  }

  function renderSplit(b, pad) {
    var outside = (b.eyebrowFuoriSplit && b.eyebrow) ? '<div class="eyebrow label">' + esc(b.eyebrow) + '</div>' : '';
    var inside = (!b.eyebrowFuoriSplit && b.eyebrow) ? '<div class="eyebrow label" style="margin-bottom: 24px;">' + esc(b.eyebrow) + '</div>' : '';
    return '<section class="sec"' + pad + '>' + outside +
      '<div class="split' + (b.invertito ? ' split--rev' : '') + '">' +
      splitMedia(b) +
      '<div class="split__body">' + inside + '<h3>' + inlineTitle(b.titolo) + '</h3>' +
      (b.paragrafi || []).map(para).join('') + '</div></div></section>';
  }

  function renderStats(b, pad) {
    var items = (b.voci || []).map(function (v) {
      return '<div class="stat"><div class="stat__num">' + esc(v.numero) + '</div><div class="stat__label">' + esc(v.etichetta) + '</div></div>';
    }).join('');
    return '<section class="sec"' + pad + '><div class="stats">' + items + '</div></section>';
  }

  function renderGalleria(b, pad) {
    var slides = (b.immagini || []).map(function (im) {
      return '<figure class="carousel__slide"><img src="' + esc(assetUrl(im.immagine)) + '" alt="' + esc(im.alt || '') + '" /></figure>';
    }).join('');
    return '<section class="sec"' + pad + '>' +
      '<div class="eyebrow label">' + esc(b.eyebrow || '') + '</div>' +
      '<div class="carousel"><div class="carousel__track">' + slides + '</div></div></section>';
  }

  function renderCta(c) {
    if (!c) return '';
    var sub = c.sottotitolo ? '<p class="cta__sub label">' + inline(esc(c.sottotitolo)) + '</p>' : '';
    return '<section class="cta"><h2 class="display cta__big">' + inlineTitle(c.titolo) + '</h2>' + sub +
      '<a class="cta__mail" href="' + esc(c.link || '#') + '">' + esc(c.testoLink || '') + '</a></section>';
  }

  var RENDERERS = { manifesto: renderManifesto, split: renderSplit, stats: renderStats, galleria: renderGalleria };

  var ClubPreview = createClass({
    render: function () {
      var data = this.props.entry.get('data');
      var d = data && data.toJS ? data.toJS() : {};
      var blocchi = d.blocchi || [];
      var body = blocchi.map(function (b, i) {
        var fn = RENDERERS[b.type];
        if (!fn) return '';
        var pad = (i === 0 || b.spazioExtra) ? '' : ' style="padding-top:0;"';
        return fn(b, pad);
      }).join('');
      var html = renderHero(d.hero) + renderVideo(d.video) + body + renderCta(d.cta);
      return h('div', { className: 'grain-wrap' },
        h('div', { dangerouslySetInnerHTML: { __html: html } })
      );
    }
  });

  CMS.registerPreviewStyle('/assets/site.css');
  CMS.registerPreviewTemplate('club', ClubPreview);
})();
