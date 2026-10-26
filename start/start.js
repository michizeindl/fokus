// Startseite „Fokus“ – Layout C „Fokusring“ (MZ, 26.10.2026): volle Kundenfarbe, große Linse mit Skala und „Fokus“,
// Gesamt-Bestwert, 5 Level-Knöpfe (Nummer im Kreis, Name, Bestwert, 5 Schärfe-Balken), Logo weiß oben rechts,
// Ton-Knopf oben links, Kontaktdaten im Footer (nur unterstrichen, nichts verlinkt).
// Testhilfen: #frei (alle gebauten Level offen, nur Anzeige), #best=860,720,830 (Beispiel-Bestwerte nur anzeigen, nichts
// gespeichert), #intro / #intro=1.4 / #ruhig (siehe intro.js).
(function () {
  'use strict';
  const { K, D } = window.FK, FK = window.FK;
  const $ = s => document.querySelector(s);
  const el = (tag, klasse, text) => { const e = document.createElement(tag); if (klasse) e.className = klasse; if (text != null) e.textContent = text; return e; };
  const hash = location.hash;

  // ---------- Linse: dunkle Fassung mit weißer Skala, Glas mit Verlauf ----------
  (function fassung() {
    const svg = $('#linse .fassung');
    let striche = '';
    for (let k = 0; k < 72; k++) {
      const lang = k % 6 === 0, r = 246;
      striche += `<line x1="0" y1="${-r}" x2="0" y2="${-r + (lang ? 18 : 10)}" transform="translate(256,256) rotate(${k * 5})"${lang ? ' class="lang"' : ''}/>`;
    }
    svg.innerHTML = `<defs><radialGradient id="fkRand" cx="50%" cy="45%" r="55%"><stop offset=".78" stop-color="#2b3334"/><stop offset="1" stop-color="#121617"/></radialGradient></defs>` +
      `<circle cx="256" cy="256" r="256" fill="url(#fkRand)"/>` +
      `<g class="skala">${striche}</g>` +
      `<circle cx="256" cy="256" r="217" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="6"/>`;
  })();

  // ---------- Logo (weiß, oben rechts) ----------
  window.FK_LOGO = FK.logoEinbetten($('#logo'), K.logo || 'kunde/logo-quer-weiss.svg', { ids: true, zeichen: '#fff', schrift: '#fff' });

  // ---------- Bestwerte, Level-Knöpfe ----------
  const beispiel = /[#&]best=([\d,]+)/.exec(hash);
  const beispielWerte = beispiel ? beispiel[1].split(',').map(Number) : null;
  const alleFrei = /[#&]frei\b/.test(hash);
  const bestVon = (lv, i) => beispielWerte ? (beispielWerte[i] > 0 ? beispielWerte[i] : null) : FK.best(lv.id);
  const T = D.texte;
  let summe = 0;
  const stufen = $('#stufen');
  D.level.forEach((lv, i) => {
    const b = bestVon(lv, i);
    if (b > 0) summe += b;
    const frei = lv.spielbar && (alleFrei || (beispielWerte ? (i === 0 || bestVon(D.level[i - 1], i - 1) > 0) : FK.frei(lv.nr)));
    const knopf = el(frei ? 'a' : 'div', 'stufe' + (frei ? '' : ' aus'));
    if (frei) knopf.href = 'optik-fokus/#level=' + lv.nr;
    else knopf.setAttribute('aria-disabled', 'true');
    knopf.style.setProperty('--i', i);
    const punkt = el('span', 'punkt', String(lv.nr));
    const txt = el('span', 'txt');
    txt.append(el('span', 'lname', lv.name),
      el('span', 'lbest', T.bestwert + ': ' + (b > 0 ? FK.zahl(b) + '/' + FK.zahl(D.regeln.hoechst) + ' ' + T.punkte : '–')));
    const n = FK.balken(b), schaerfe = el('span', 'schaerfe');
    schaerfe.setAttribute('aria-label', 'Schärfe ' + n + ' von 5');
    schaerfe.dataset.wert = n;
    for (let k = 0; k < 5; k++) schaerfe.append(el('i', k < n ? 'an' : ''));
    knopf.append(punkt, txt, schaerfe);
    knopf.setAttribute('aria-label', T.level + ' ' + lv.nr + ' – ' + lv.name);
    stufen.append(knopf);
  });
  const gesamt = $('#gesamt');
  gesamt.append(T.gesamt + ': ', el('b', '', FK.zahl(summe)), '/' + FK.zahl(D.level.length * D.regeln.hoechst) + ' ' + T.punkte);

  // Sanfter Übergang ins Spiel statt hartem Sprung
  stufen.addEventListener('click', e => {
    const a = e.target.closest('a.stufe');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || FK.ruhig()) return;
    e.preventDefault();
    a.classList.add('gedrueckt');
    document.body.classList.add('weg');
    setTimeout(() => { location.href = a.href; }, 220);
  });
  // Zurück aus dem Spiel (Seite aus dem Verlauf): wieder sichtbar machen
  addEventListener('pageshow', () => { document.body.classList.remove('weg'); document.querySelectorAll('.gedrueckt').forEach(a => a.classList.remove('gedrueckt')); });

  // ---------- Footer: Kontaktdaten, nichts verlinkt ----------
  (function fuss() {
    // Jeder Teil bleibt beisammen („94999 Musterstadt“ nie getrennt), umbrochen wird nur nach einem Gedankenstrich
    const f = $('#fuss'), s = ' – ';
    const stueck = (t, tag) => { const e = el(tag || 'span', '', t); e.style.whiteSpace = 'nowrap'; return e; };
    const zeile = liste => { const p = el('p'); liste.forEach((e, i) => { if (i) p.append(s); p.append(e); }); return p; };
    // Drei Zeilen (MZ, 26.10.2026): 1 Firmenname, 2 Anschrift, 3 Telefon – Internetadresse – Datenschutz – Impressum
    // (Internetadresse, Datenschutz, Impressum unterstrichen, nichts verlinkt, nicht fett; „Datenschutz – Impressum“ bleibt beisammen)
    const kontakt = K.kontakt || [];
    const z1 = zeile(kontakt.slice(0, 1).map(t => stueck(t)));
    const z1b = kontakt.length > 1 ? zeile(kontakt.slice(1).map(t => stueck(t))) : null;
    const recht = (K.rechtliches || []).length ? zeile((K.rechtliches || []).map(r => stueck(r.text, 'u'))) : null;
    const paar = recht ? (() => { const r = el('span'); r.style.whiteSpace = 'nowrap'; r.append(...[...recht.childNodes]); return r; })() : null;
    const z2 = zeile([K.telefon ? stueck(K.telefon) : null, K.web ? stueck(K.web, 'u') : null, paar].filter(Boolean));
    f.append(...[z1, z1b, z2].filter(Boolean));
  })();

  // ---------- Ton-Knopf und Musik der Sammlung (Phase 3: FOKUS.musik) ----------
  const SYM = {
    an: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
    aus: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  };
  const lesen = () => { try { return localStorage.getItem('mg:ton'); } catch (e) { return null; } };
  let tonAn = lesen() !== 'aus';
  const tk = $('#tonKnopf');
  const symbol = () => { tk.innerHTML = tonAn ? SYM.an : SYM.aus; tk.setAttribute('aria-pressed', tonAn ? 'true' : 'false'); };
  symbol();
  // Musik „Acoustic“ (MZ, 26.10.2026): läuft auf der Startseite und im Startbild der Level (dort spielt sie optik-fokus/
  // spiel-gemein.js an derselben Stelle weiter, FK.musikStelle). Erst nach dem ersten Tippen (Browser-Regel), folgt dem
  // Ton-Knopf, blendet weich ein und aus. Datei, Pegel: daten.js FOKUS.musik; echte Länge (MP3-Zuschnitt): klaenge.js.
  let ac = null, puffer = null, laeuft = null;
  const M = D.musik;
  function musikLaden() {
    if (!M || puffer || location.protocol === 'file:') return Promise.resolve(puffer);
    // schon beim Öffnen entschlüsseln (stiller Offline-Kontext, braucht kein Tippen) – dann startet die Musik beim ersten
    // Tippen sofort statt erst nach ca. 2s
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.resolve(null);
    const dek = new OAC(1, 22050, 22050), info = FK.klangInfo(M.datei);
    puffer = fetch(M.datei).then(r => r.ok ? r.arrayBuffer() : null)
      .then(b => b ? new Promise((ok, nein) => dek.decodeAudioData(b, ok, nein)) : null)
      .then(b => FK.mp3Zuschnitt(b, info && info.proben, dek)).catch(() => null);
    return puffer;
  }
  function kontext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ac && AC) ac = new AC();
    return ac;
  }
  const stelle = () => laeuft ? (laeuft.ab + ac.currentTime - laeuft.t0) % laeuft.q.buffer.duration : 0;
  async function musikAn() {
    if (!M || !tonAn || laeuft || document.hidden) return;
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    const b = await musikLaden();
    if (!b || laeuft || !tonAn || document.hidden || !kontext()) return;
    try { await ac.resume(); } catch (e) { return; }
    if (laeuft || ac.state !== 'running') return;
    const q = ac.createBufferSource(), v = ac.createGain();
    q.buffer = b; q.loop = true;
    const ab = FK.musikStelle.lesen(b.duration), t0 = ac.currentTime;
    v.gain.setValueAtTime(0.0001, t0);
    v.gain.exponentialRampToValueAtTime(M.pegel || 0.5, t0 + (M.einblenden || 1.5));
    q.connect(v).connect(ac.destination); q.start(t0, ab);
    laeuft = { q, v, ab, t0 };
  }
  function musikAus(weich, seitenwechsel) {
    if (!laeuft) return;
    FK.musikStelle.merken(stelle(), seitenwechsel);
    const { q, v } = laeuft; laeuft = null;
    const z = weich != null ? weich : (M.ausblenden || 0.8) / 3;
    try { v.gain.cancelScheduledValues(ac.currentTime); v.gain.setTargetAtTime(0.0001, ac.currentTime, z); q.stop(ac.currentTime + z * 6); } catch (e) { /* egal */ }
  }
  tk.addEventListener('click', () => {
    tonAn = !tonAn;
    try { localStorage.setItem('mg:ton', tonAn ? 'an' : 'aus'); } catch (e) { /* privat */ }
    symbol();
    if (tonAn) musikAn(); else musikAus(0.01);   // aus = sofort still, an = weiter an der gemerkten Stelle
  });
  ['pointerup', 'keydown'].forEach(n => addEventListener(n, () => { if (tonAn) setTimeout(musikAn, 0); }, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) musikAus(0.05); else if (tonAn) musikAn(); });
  // Wechsel ins Spiel: Stelle merken, damit das Startbild dort weiterspielt; zurück aus dem Verlauf: wieder an
  addEventListener('pagehide', () => { if (laeuft) FK.musikStelle.merken(stelle(), true); });
  addEventListener('pageshow', e => { if (e.persisted && tonAn) musikAn(); });
  stufen.addEventListener('click', e => { if (e.target.closest('a.stufe')) musikAus(0.07, true); });
  // Testhilfe: läuft die Musik, an welcher Stelle, mit welchem Pegel
  // Musik vorab entschlüsseln; kommt man aus dem Spiel zurück (Browser erlaubt Ton schon), läuft sie gleich weiter
  if (M && tonAn) setTimeout(() => { musikLaden(); musikAn(); }, 400);
  window.FK_MUSIK = () => laeuft ? { laeuft: true, stelle: +stelle().toFixed(2), pegel: +laeuft.v.gain.value.toFixed(3), kontext: ac.state } : { laeuft: false };
  window.FK_START = { musikAn, musikAus };
})();
