/* ============================================================
   Rifiniture del pannello /admin che il solo CSS non può fare
   (Decap non espone hook per icone/branding custom nella UI):
   - icone per collezioni e gruppi di campi
   - badge colorati + icona per tipo di blocco nella lista "Blocchi"
   - cornice "browser" attorno all'anteprima, con toggle desktop/mobile
   Tutto via DOM enhancement non distruttivo (MutationObserver):
   se Decap cambia struttura interna, questo script semplicemente
   non trova più gli agganci e non fa nulla (nessun crash).
   ============================================================ */
(function () {
  var ICONS = {
    testo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    split: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="16" rx="1"/><path d="M15 4h6v6h-6zM15 14h6v6h-6z"/></svg>',
    statistiche: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>',
    galleria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    seo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    apertura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 9l4-2v10l-4-2z"/></svg>',
    cta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l16-7-6 16-3-6-6-3z"/></svg>',
    articoli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
    pagine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>',
    sito: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>',
    desktop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
    mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>'
  };

  function svg(name) { return ICONS[name] || ''; }

  /* ---------- 1. badge + colore per tipo, nella lista "Blocchi di contenuto" ---------- */
  function enhanceBlockItems(root) {
    root.querySelectorAll('[class*="NestedObjectLabel"]:not([data-acb-done])').forEach(function (el) {
      var text = el.textContent.trim();
      var m = text.match(/^(Testo|Split|Statistiche|Galleria)\s*(?:—\s*(.*))?$/i);
      if (!m) return;
      el.setAttribute('data-acb-done', '1');
      var key = m[1].toLowerCase();
      var rest = m[2] || '';
      var item = el.closest('[class*="SortableListItem"]');
      if (item) item.setAttribute('data-acb-block', key);
      el.innerHTML =
        '<span class="acb-badge" data-acb-icon="' + key + '">' + svg(key) + '</span>' +
        '<span class="acb-block-title">' + (rest ? rest : m[1]) + '</span>';
    });
  }

  /* ---------- 2. icone sui gruppi di campi principali ---------- */
  var FIELD_ICONS = {
    'SEO': 'seo',
    'APERTURA PAGINA': 'apertura',
    'VIDEO DI APERTURA (OPZIONALE)': 'video',
    'BLOCCHI DI CONTENUTO': 'testo',
    "CHIAMATA ALL'AZIONE FINALE": 'cta',
    "CHIAMATA ALL'AZIONE FINALE (OPZIONALE)": 'cta'
  };
  function enhanceFieldGroups(root) {
    root.querySelectorAll('[class*="ControlTopbar"] [class*="FieldLabel"]:not([data-acb-done])').forEach(function (el) {
      var key = FIELD_ICONS[el.textContent.trim().toUpperCase()];
      if (!key) return;
      el.setAttribute('data-acb-done', '1');
      el.insertAdjacentHTML('afterbegin', '<span class="acb-field-icon">' + svg(key) + '</span>');
    });
  }

  /* ---------- 3. icone nella sidebar delle collezioni ---------- */
  var COLLECTION_ICONS = { 'Off the Pitch — Articoli': 'articoli', 'Pagine libere': 'pagine', 'Pagine del sito': 'sito' };
  function enhanceSidebar(root) {
    root.querySelectorAll('[class*="SidebarContainer"] a:not([data-acb-done])').forEach(function (el) {
      var key = COLLECTION_ICONS[el.textContent.trim()];
      if (!key) return;
      el.setAttribute('data-acb-done', '1');
      el.insertAdjacentHTML('afterbegin', '<span class="acb-field-icon">' + svg(key) + '</span>');
    });
    var heading = root.querySelector('[class*="SidebarHeading"]:not([data-acb-logo])');
    if (heading) {
      heading.setAttribute('data-acb-logo', '1');
      heading.insertAdjacentHTML('beforebegin',
        '<div class="acb-sidebar-brand"><img src="/assets/brand/monogram-gold.svg" alt="" /></div>');
    }
  }

  /* ---------- 4. cornice "browser" + toggle desktop/mobile sull'anteprima ---------- */
  function enhancePreview(root) {
    root.querySelectorAll('[class*="PreviewPaneContainer"]:not([data-acb-chrome])').forEach(function (pane) {
      var iframe = pane.querySelector('iframe');
      if (!iframe) return;
      pane.setAttribute('data-acb-chrome', '1');
      var bar = document.createElement('div');
      bar.className = 'acb-preview-chrome';
      bar.innerHTML =
        '<span class="acb-dots"><i></i><i></i><i></i></span>' +
        '<span class="acb-preview-label">Anteprima live</span>' +
        '<span class="acb-preview-tools">' +
        '<button type="button" class="acb-view-btn is-active" data-w="">' + svg('desktop') + '</button>' +
        '<button type="button" class="acb-view-btn" data-w="390px">' + svg('mobile') + '</button>' +
        '</span>';
      pane.insertBefore(bar, iframe);
      pane.classList.add('acb-preview-pane');
      bar.querySelectorAll('.acb-view-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          bar.querySelectorAll('.acb-view-btn').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          iframe.style.width = btn.getAttribute('data-w') || '';
          iframe.style.margin = btn.getAttribute('data-w') ? '0 auto' : '';
        });
      });
    });
  }

  /* la distinzione campo-gruppo/campo-foglia è :has() puro in theme.css,
     niente JS: sempre corretta a ogni re-render, senza rincorrere i timing */

  function run() {
    enhanceBlockItems(document);
    enhanceFieldGroups(document);
    enhanceSidebar(document);
    enhancePreview(document);
  }

  var scheduled = false;
  var observer = new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; run(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  run();
})();
