#!/usr/bin/env node
/**
 * Build ACB — genera le pagine HTML dai contenuti del CMS (content/).
 * Zero dipendenze: frontmatter + markdown essenziale.
 * Gira su Netlify a ogni deploy (vedi netlify.toml) o in locale: node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const shell = fs.readFileSync(path.join(ROOT, 'templates', 'shell.html'), 'utf8');

/* ---------- frontmatter ---------- */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, body: m[2].trim() };
}

/* ---------- markdown minimale ---------- */
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inline(s) {
  return s
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>'); /* em = accento oro, MAI corsivo (site.css) */
}
function md(src) {
  const out = [];
  const blocks = src.split(/\n{2,}/);
  for (const b of blocks) {
    const t = b.trim();
    if (!t) continue;
    if (/^###\s/.test(t)) out.push('<h4>' + inline(esc(t.slice(4))) + '</h4>');
    else if (/^##\s/.test(t)) out.push('<h3>' + inline(esc(t.slice(3))) + '</h3>');
    else if (/^#\s/.test(t)) out.push('<h2>' + inline(esc(t.slice(2))) + '</h2>');
    else if (/^>\s/.test(t)) out.push('<blockquote>' + inline(esc(t.replace(/^>\s?/gm, ''))) + '</blockquote>');
    else if (/^[-*]\s/m.test(t)) out.push('<ul>' + t.split('\n').map(l => '<li>' + inline(esc(l.replace(/^[-*]\s/, ''))) + '</li>').join('') + '</ul>');
    else if (/^!\[/.test(t)) out.push(inline(esc(t)));
    else out.push('<p>' + inline(esc(t)).replace(/\n/g, '<br />') + '</p>');
  }
  return out.join('\n');
}

function render(tokens) {
  let html = shell;
  for (const [k, v] of Object.entries(tokens)) html = html.split('{{' + k + '}}').join(v);
  return html;
}

function readCollection(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { data, body } = parseFrontmatter(fs.readFileSync(path.join(full, f), 'utf8'));
      return { slug: f.replace(/\.md$/, ''), data, body };
    });
}

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};

/* ---------- ARTICOLI ---------- */
const articoli = readCollection('content/articoli')
  .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));

if (articoli.length) {
  fs.mkdirSync(path.join(ROOT, 'articoli'), { recursive: true });

  for (const a of articoli) {
    const cover = a.data.cover ? `
  <section class="break break--short">
    <div class="break__media"><img src="${a.data.cover}" alt="${esc(a.data.title || '')}" /></div>
  </section>` : '';
    const content = `
  <header class="phero">
    <div class="eyebrow label">${esc(a.data.categoria || 'Off the Pitch')}${a.data.kicker ? ' — ' + esc(a.data.kicker) : ''}</div>
    <h1 class="display phero__title">${esc(a.data.title || a.slug)}</h1>
    <p class="phero__sub">${fmtDate(a.data.date)}</p>
  </header>
  ${cover}
  <section class="sec article-body" style="padding-top: clamp(30px, 6vh, 80px);">
    ${md(a.body)}
  </section>
  <section class="cta">
    <a class="cta__mail" href="/offthepitch.html">← Tutti gli articoli</a>
  </section>`;
    fs.writeFileSync(path.join(ROOT, 'articoli', a.slug + '.html'),
      render({ TITLE: (a.data.title || a.slug) + ' — Off the Pitch — Audace Club Boschese 1928', DESCRIPTION: esc(a.data.excerpt || ''), CONTENT: content, BASE: '/' }));
  }

  const cards = articoli.map((a, i) => `
      <a class="otp${i % 3 === 0 ? ' otp--wide' : ''}" href="/articoli/${a.slug}.html">
        ${a.data.cover ? `<div class="otp__media"><img src="${a.data.cover}" alt="${esc(a.data.title || '')}" loading="lazy" /></div>` : ''}
        <div class="otp__k label"><span>${esc(a.data.categoria || '')}</span><span>${esc(a.data.kicker || fmtDate(a.data.date))}</span></div>
        <div class="otp__t">${esc(a.data.title || a.slug)}</div>
      </a>`).join('\n');

  const listContent = `
  <header class="phero">
    <div class="eyebrow label">Journal</div>
    <h1 class="display phero__title">Off the<br /><em>Pitch</em></h1>
    <p class="phero__sub">Il calcio dura novanta minuti; tutto il resto è Off the Pitch.</p>
  </header>
  <section class="sec" style="padding-top: clamp(20px, 4vh, 60px);">
    <div class="otp-grid">${cards}
    </div>
  </section>`;
  fs.writeFileSync(path.join(ROOT, 'offthepitch.html'),
    render({ TITLE: 'Off the Pitch — Audace Club Boschese 1928', DESCRIPTION: 'Storie, cultura e vita di club oltre i novanta minuti.', CONTENT: listContent, BASE: '/' }));
  console.log(`✓ ${articoli.length} articoli → /articoli/ + offthepitch.html`);
} else {
  console.log('· nessun articolo: offthepitch non generato');
}

/* ---------- PAGINE LIBERE ---------- */
const pagine = readCollection('content/pagine');
if (pagine.length) {
  fs.mkdirSync(path.join(ROOT, 'pagine'), { recursive: true });
  for (const p of pagine) {
    const cover = p.data.cover ? `
  <section class="break break--short">
    <div class="break__media"><img src="${p.data.cover}" alt="${esc(p.data.title || '')}" /></div>
  </section>` : '';
    const content = `
  <header class="phero">
    <div class="eyebrow label">Audace Club Boschese</div>
    <h1 class="display phero__title">${esc(p.data.title || p.slug)}</h1>
    ${p.data.sottotitolo ? `<p class="phero__sub">${esc(p.data.sottotitolo)}</p>` : ''}
  </header>
  ${cover}
  <section class="sec article-body" style="padding-top: clamp(30px, 6vh, 80px);">
    ${md(p.body)}
  </section>`;
    fs.writeFileSync(path.join(ROOT, 'pagine', p.slug + '.html'),
      render({ TITLE: (p.data.title || p.slug) + ' — Audace Club Boschese 1928', DESCRIPTION: esc(p.data.sottotitolo || ''), CONTENT: content, BASE: '/' }));
  }
  console.log(`✓ ${pagine.length} pagine → /pagine/`);
}

console.log('Build completata.');
