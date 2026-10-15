/* Consenso cookie — Audace Club Boschese 1928
   Oggi il sito usa solo memoria tecnica (sessionStorage): CATEGORIE è vuoto e il banner NON compare.
   Per aggiungere statistiche o pixel:
     1. aggiungere la categoria qui sotto (es. { id: 'statistiche', nome: 'Statistiche', testo: '…' });
     2. inserire lo script nella pagina così:
          <script type="text/plain" data-consent="statistiche" src="https://…"></script>
        (va bene anche inline): parte solo dopo il consenso a quella categoria.
   Il banner segue le linee guida del Garante (giugno 2021): "Accetta" e "Rifiuta" con lo stesso peso,
   la X equivale a rifiutare, nessuna casella preselezionata, la scelta vale 6 mesi. */
(() => {
  const CATEGORIE = [
    // { id: 'statistiche', nome: 'Statistiche', testo: 'Ci dicono quali pagine vengono lette, in forma aggregata.' },
  ];
  const KEY = 'acb-consent', VERSIONE = 1, DURATA = 180 * 864e5;
  const links = document.querySelectorAll('[data-consent-open]');
  if (!CATEGORIE.length) return;                       // niente da chiedere: il sito resta senza banner
  links.forEach((a) => { a.hidden = false; a.addEventListener('click', (e) => { e.preventDefault(); apri(true); }); });

  const leggi = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && v.v === VERSIONE && Date.now() - v.t < DURATA ? v.c : null; } catch { return null; } };
  const salva = (c) => { try { localStorage.setItem(KEY, JSON.stringify({ v: VERSIONE, t: Date.now(), c })); } catch {} };
  function attiva(c) {
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach((old) => {
      if (!c[old.dataset.consent] || old.dataset.consentDone) return;
      const s = document.createElement('script');
      for (const a of old.attributes) if (a.name !== 'type' && !a.name.startsWith('data-consent')) s.setAttribute(a.name, a.value);
      s.text = old.text; old.dataset.consentDone = '1'; old.after(s);
    });
  }

  const css = `
  .acbc{position:fixed;left:16px;bottom:16px;z-index:9999;width:min(440px,calc(100vw - 32px));background:#1E4430;color:#FFFDE9;
    font:400 14px/1.5 'Helvetica Neue',Helvetica,Arial,sans-serif;padding:22px 22px 20px;border:1px solid rgba(255,253,233,.18);box-shadow:0 18px 50px rgba(0,0,0,.35)}
  .acbc h2{margin:0 0 8px;font:500 12px/1.2 'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#BDA360}
  .acbc p{margin:0}.acbc a{color:#FFFDE9}
  .acbc__x{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:none;color:#FFFDE9;font-size:20px;cursor:pointer;opacity:.7}
  .acbc__btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
  .acbc__btns button{flex:1 1 auto;min-height:42px;padding:0 18px;border:1px solid #BDA360;background:none;color:#FFFDE9;font:inherit;font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
  .acbc__btns .acbc__ok{background:#BDA360;color:#1E4430}
  .acbc__more{margin-top:12px;background:none;border:0;padding:0;color:#FFFDE9;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer;opacity:.8}
  .acbc__cats{margin:14px 0 0;padding:0;list-style:none;border-top:1px solid rgba(255,253,233,.18)}
  .acbc__cats li{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(255,253,233,.18)}
  .acbc__cats small{display:block;opacity:.7;font-size:12px}
  .acbc__cats input{width:20px;height:20px;accent-color:#BDA360;flex:none;margin-top:2px}
  .acbc :focus-visible{outline:2px solid #BDA360;outline-offset:2px}`;

  let box;
  function apri(conPreferenze) {
    if (box) box.remove();
    if (!document.getElementById('acbc-css')) { const st = document.createElement('style'); st.id = 'acbc-css'; st.textContent = css; document.head.appendChild(st); }
    const cur = leggi() || {};
    box = document.createElement('div');
    box.className = 'acbc'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Preferenze cookie');
    box.innerHTML = `
      <button class="acbc__x" type="button" aria-label="Chiudi e rifiuta">×</button>
      <h2>Cookie</h2>
      <p>Usiamo cookie tecnici per far funzionare il sito e, solo con il tuo consenso, altri strumenti indicati qui sotto. Puoi cambiare idea quando vuoi dal link "Preferenze cookie" a fondo pagina. <a href="/privacy">Informativa</a>.</p>
      <ul class="acbc__cats" ${conPreferenze ? '' : 'hidden'}>${CATEGORIE.map((c) => `
        <li><label for="acbc-${c.id}"><b>${c.nome}</b><small>${c.testo}</small></label><input type="checkbox" id="acbc-${c.id}" data-id="${c.id}" ${cur[c.id] ? 'checked' : ''}></li>`).join('')}
      </ul>
      <div class="acbc__btns">
        <button type="button" class="acbc__no">Rifiuta</button>
        <button type="button" class="acbc__ok">Accetta</button>
        <button type="button" class="acbc__save" ${conPreferenze ? '' : 'hidden'}>Salva scelte</button>
      </div>
      <button type="button" class="acbc__more" ${conPreferenze ? 'hidden' : ''}>Preferenze</button>`;
    document.body.appendChild(box);
    const tutte = (val) => Object.fromEntries(CATEGORIE.map((c) => [c.id, val]));
    const chiudi = (c) => { salva(c); attiva(c); box.remove(); box = null; };
    box.querySelector('.acbc__x').onclick = () => chiudi(tutte(false));
    box.querySelector('.acbc__no').onclick = () => chiudi(tutte(false));
    box.querySelector('.acbc__ok').onclick = () => chiudi(tutte(true));
    box.querySelector('.acbc__save').onclick = () => chiudi(Object.fromEntries([...box.querySelectorAll('[data-id]')].map((i) => [i.dataset.id, i.checked])));
    box.querySelector('.acbc__more').onclick = () => apri(true);
    box.querySelector('.acbc__no').focus();
  }

  const scelta = leggi();
  if (scelta) attiva(scelta); else apri(false);
  window.acbConsent = { apri: () => apri(true) };
})();
