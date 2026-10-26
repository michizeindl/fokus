// „Fokus“ – Start- und Endbild Stil 1 „Durch die Linse“ (MZ, 26.10.2026), Level-Titel und Kopfzeile im Spiel.
// Startbild: Level-Bild unscharf im Hintergrund, runde Linse mit weißem Rand zeigt den scharfen Ausschnitt, darunter weiße
// Karte (Level, Name in Kundenfarbe, Anleitung, Bestwert, „Los geht’s“, „Zum Menü“).
// Endbild: Punkte groß in der Linse (Fläche Kundenfarbe) mit Ring als Anteil von 1.000, Karte mit Bewertung, Plakette,
// Bilanz, Bestwert, „Weiter“ (nächstes Level), „Nochmal“, „Zum Menü“. Logo überall oben rechts auf weißem Schild.
(function () {
  'use strict';
  const D = window.FOKUS, FK = window.FK, SZ = window.FOKUS_SZENE, K = FK.K, T = D.texte;
  const menue = K.startseite || '../';
  const UHR = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4"/></svg>';
  const el = (tag, klasse, text) => { const e = document.createElement(tag); if (klasse) e.className = klasse; if (text != null) e.textContent = text; return e; };

  document.body.insertAdjacentHTML('beforeend', `
    <div class="fk-logo" id="fkLogo" role="img" aria-label=""></div>
    <div id="fkHud" hidden>
      <span class="fk-chip fk-ziel"><span class="fk-zn"></span><span class="fk-motiv"></span></span>
      <span class="fk-chip fk-pkt"><b>0</b> ${T.punkte}</span>
      <span class="fk-chip fk-fehler" aria-label="Fehler"><i></i><i></i><i></i></span>
    </div>
    <div id="fkTitel" hidden><div class="fk-tlinse"><span class="klein"></span><span class="gross"></span></div></div>
    <section class="fk-schirm" id="fkStart" hidden aria-labelledby="fkStartTitel">
      <canvas class="fk-hg" aria-hidden="true"></canvas>
      <div class="fk-buehne">
        <div class="fk-linse"><canvas aria-hidden="true"></canvas></div>
        <div class="fk-karte">
          <p class="fk-dach"></p>
          <h1 class="fk-titel" id="fkStartTitel"></h1>
          <p class="fk-anleitung"></p>
          <p class="fk-regel"></p>
          <p class="fk-hinweis" hidden></p>
          <div class="fk-links fk-tonein"><button class="fk-link fk-tonan" id="fkTonEin" type="button">${T.tonEin || 'Ton einschalten'}</button></div>
          <p class="fk-best"></p>
          <button class="fk-knopf" id="fkLos" type="button">${T.los}</button>
          <div class="fk-links"><button class="fk-link fk-tonan fk-ton2" type="button">${T.tonEin || 'Ton einschalten'}</button><button class="fk-link fk-menue" type="button">${T.menue}</button></div>
        </div>
      </div>
    </section>
    <section class="fk-schirm" id="fkEnde" hidden aria-labelledby="fkEndeTitel">
      <canvas class="fk-hg" aria-hidden="true"></canvas>
      <div class="fk-buehne">
        <div class="fk-linse fk-punkte" role="img">
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="spur" cx="50" cy="50" r="46"/><circle class="bogen" cx="50" cy="50" r="46"/></svg>
          <div class="fk-zahl">0</div><div class="fk-von">${T.von}</div>
        </div>
        <div class="fk-karte">
          <p class="fk-dach"></p>
          <h1 class="fk-bewertung" id="fkEndeTitel"></h1>
          <p class="fk-plakette" hidden>${UHR}<span></span></p>
          <p class="fk-bilanz"></p>
          <p class="fk-abbruch-hinweis" hidden></p>
          <p class="fk-bestzeile"></p>
          <p class="fk-frei" hidden></p>
          <button class="fk-knopf" id="fkWeiter" type="button">${T.weiter}</button>
          <div class="fk-links"><button class="fk-link" id="fkNochmal" type="button">${T.nochmal}</button><button class="fk-link fk-menue" type="button">${T.menue}</button></div>
        </div>
      </div>
    </section>`);
  const $ = s => document.querySelector(s);
  // „Zum Menü“ ist ein echter Knopf (QA, 26.10.2026: einheitlich mit „Nochmal“) – führt zur Startseite der Sammlung
  document.querySelectorAll('.fk-menue').forEach(k => k.addEventListener('click', () => { location.href = menue; }));
  // Level mit Ton-Hinweis (L4): Ist der Ton aus, steht unter dem Hinweis „Ton einschalten“ (MZ, 26.10.2026). Der Knopf macht
  // dasselbe wie der Ton-Knopf oben (klickt ihn) und verschwindet dann. Schaltet man oben um, folgt er.
  const tonIstAn = () => { try { return localStorage.getItem('mg:ton') !== 'aus'; } catch (e) { return true; } };
  let tonKnopfZeigen = false;
  function tonEinAnpassen() {
    const zeigen = tonKnopfZeigen && !tonIstAn(), s = $('#fkStart');   // sichtbar über die Klasse fk-eng (fokus.css)
    if (s.classList.contains('fk-eng') !== zeigen) { s.classList.toggle('fk-eng', zeigen); if (aktiv === s) malen(); }   // Linse kleiner → neu malen
  }
  document.querySelectorAll('.fk-tonan').forEach(k => k.addEventListener('click', () => {
    const oben = document.getElementById('tonKnopf');
    if (oben && !tonIstAn()) oben.click();
    setTimeout(tonEinAnpassen, 0);
  }));
  const obenKnopf = document.getElementById('tonKnopf');
  if (obenKnopf) obenKnopf.addEventListener('click', () => setTimeout(tonEinAnpassen, 0));
  const logoBox = $('#fkLogo');
  logoBox.setAttribute('aria-label', K.firma || '');
  FK.logoEinbetten(logoBox, K.logoAufHell || '../kunde/logo-quer.svg', { zeichen: FK.farben.haupt, schrift: FK.farben.haupt });

  // ---------- Bilder in Hintergrund und Linse ----------
  // Spätes Laden (MZ, 26.10.2026): Hintergrund und Linse werden erst gezeichnet und eingeblendet, wenn ihre Bilder fertig
  // sind (Level-Bild in der Form des Bildschirms + Motiv der Linse, L5 auch die Schilder-Schriften). Bis dahin ist die Linse
  // unsichtbar (Platz bleibt, Karte springt nicht) und der Hintergrund ruhig in Kundenfarbe (Klasse fk-laedt) – kein
  // Platzhalter, der sich sichtbar nachbaut. Gescheiterte Bilder zählen als fertig (dann Platzhalter im Code).
  let aktiv = null, aktivNr = 1;
  const wahl = {};   // gewähltes Linsen-Motiv je Level (bleibt bis zum nächsten Startbild dieses Levels)
  const linse = nr => { const f = window.FOKUS_LINSE && window.FOKUS_LINSE[nr]; return typeof f === 'function' ? { malen: f } : (f || null); };
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  // Ausschnitt der Linse: Level-Bild in Wv × Hv, Punkt fokus in der Mitte; x(fx)/y(fy) rechnen Anteile des Level-Bilds in
  // Linsen-Pixel (CSS) um, meter() gibt Pixel je Meter an einer Fußlinie (aus Horizont und Augenhöhe der Zonen)
  function ansicht(nr, d) {
    const lv = D.level[nr - 1] || {}, foto = !!lv.hintergrund, hochkant = foto && innerHeight > innerWidth && typeof lv.hintergrund === 'object' && lv.hintergrund.hoch;
    // Platzhalter im Code: nach Bildschirmform; gestaltetes Bild: in seinem eigenen Seitenverhältnis (sonst zu stark vergrößert)
    // linseForm (daten.js, je Bildform): eigener Punkt und Vergrößerung, z. B. L5 quer näher heran (sonst Tisch und winzige Dinge)
    const lf = (foto && lv.linseForm && lv.linseForm[hochkant ? 'hoch' : 'quer']) || {}, zoom = lf.zoom || 1;
    const Wv = d / (hochkant ? 0.72 : foto ? 0.55 : 0.42) * zoom, Hv = hochkant ? Wv * 1.5 : foto ? Wv / 1.5 : Wv * Math.max(0.75, Math.min(1.6, innerHeight / innerWidth));
    let [fx, fy] = lf.punkt || SZ.fokusPunkt(nr);
    // Ausschnitt bleibt im Bild (sonst ein leerer Streifen am Rand der Linse)
    fx = d < Wv ? klemm(fx, d / 2 / Wv, 1 - d / 2 / Wv) : 0.5; fy = d < Hv ? klemm(fy, d / 2 / Hv, 1 - d / 2 / Hv) : 0.5;
    const A = SZ.abbildung(nr, Wv, Hv), ox = d / 2 - fx * Wv, oy = d / 2 - fy * Hv;
    return { nr, lv, d, Wv, Hv, fx, fy, ox, oy, A, form: Hv > Wv ? 'hoch' : 'quer', zonen: A.zonen || {}, adresse: SZ.hgAdresse(nr, Wv, Hv),
      x: f => ox + A.x(f), y: f => oy + A.y(f), bx: x => ((x - ox) - A.x(0)) / Math.max(1, (A.iw || Wv)),
      meter: (yf, hz, kam) => (A.ih || Hv) * Math.max(0.002, yf - hz) / kam };
  }
  // Größe ohne Transform (die Einblend-Animation skaliert die Linse kurz auf 85 %)
  const linsenGroesse = schirm => { const c = schirm.querySelector('.fk-linse canvas'); return c ? Math.max(40, c.clientWidth || c.getBoundingClientRect().width) : 0; };
  // Was muss für Level nr fertig sein? (Hintergrund in Bildschirmform, Level-Bild der Linse, Motiv der Linse)
  function bedarf(nr, mitLinse, d) {
    const lv = D.level[nr - 1] || {}, liste = [[SZ.hgAdresse(nr, innerWidth + 48, innerHeight + 48), lv.umfaerben]];
    if (mitLinse) {
      const L = linse(nr), an = ansicht(nr, d || 200);
      liste.push([an.adresse, lv.umfaerben]);
      if (L && L.waehlen && !wahl[nr]) wahl[nr] = L.waehlen() || { leer: true };
      if (L && L.bilder) (L.bilder(wahl[nr]) || []).forEach(a => liste.push([a, false]));
    }
    return liste;
  }
  function bereitMachen(nr, mitLinse, d) {
    const liste = bedarf(nr, mitLinse, d), L = linse(nr);
    const extra = mitLinse && L && L.warten ? L.warten(wahl[nr]) : null;   // z. B. Schriften (L5)
    const fertig = liste.every(e => SZ.fertig(e[0], e[1])) && !extra;
    return { fertig, versprechen: fertig ? Promise.resolve(true) : Promise.all([SZ.laden(liste), extra || true]) };
  }
  // nächstes Level (für „Weiter“) schon vorbereiten: Motiv wählen und Bilder laden, ohne zu zeichnen
  const vorbereitet = new Set();
  function vorbereiten(nr) {
    if (!D.level[nr - 1]) return Promise.resolve(false);
    vorbereitet.add(nr);
    return bereitMachen(nr, true, linsenGroesse($('#fkStart')) || 200).versprechen;
  }
  function hgMalen(schirm, nr) {
    const c = schirm.querySelector('.fk-hg'), B = innerWidth + 48, H = innerHeight + 48;
    const quelle = SZ.levelBild(nr, B / 2, H / 2, 1);   // halbe Größe reicht – wird ohnehin weichgezeichnet
    c.width = quelle.width; c.height = quelle.height;
    c.getContext('2d').drawImage(quelle, 0, 0);
  }
  function linseMalen(schirm, nr) {
    const c = schirm.querySelector('.fk-linse canvas');
    if (!c) return;
    const d = linsenGroesse(schirm), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.round(d * dpr); c.height = Math.round(d * dpr);
    const g = c.getContext('2d'), an = ansicht(nr, d);
    const bild = SZ.levelBild(nr, an.Wv, an.Hv, dpr);
    g.drawImage(bild, an.ox * dpr, an.oy * dpr);
    // Motiv der Linse je Level (Ring, Fisch, Schallwelle, Ding auf dem Platz; Level 1 hier unten)
    const L = linse(nr);
    if (L && L.malen) { try { L.malen(g, d, dpr, an, wahl[nr]); } catch (e) { /* nur Schmuck */ } }
  }
  // Level 1: ein Motiv steht scharf auf dem Feldweg – Fußpunkt auf dem Weg, Größe nach Perspektive, Kontaktschatten.
  // Auswahl und Weg-Punkte in daten.js level[0].linsenBuehne (nur Motive, die sichtbar auf dem Boden stehen).
  window.FOKUS_LINSE = window.FOKUS_LINSE || {};
  window.FOKUS_LINSE[1] = window.FOKUS_LINSE[1] || {
    waehlen() {
      const lb = (D.level[0] || {}).linsenBuehne || {}, namen = Object.keys(lb.motive || {});
      const ohne = ((lb[innerHeight > innerWidth ? 'hoch' : 'quer'] || {}).ohne) || [];   // zu breit für diese Bildform
      const pool = ((window.FOKUS_POOLS && window.FOKUS_POOLS.schaerfe) || []).filter(m => m.bild && namen.includes(m.name) && !ohne.includes(m.name));
      return { m: pool[Math.floor(Math.random() * pool.length)] || null };
    },
    bilder: w => (w && w.m ? [w.m.bild] : []),
    malen(g, d, dpr, an, w) {
      const lb = (D.level[0] || {}).linsenBuehne, z = lb && lb[an.form], hz = an.zonen.horizont;
      if (!w || !w.m || !z || hz == null) return;
      const p = SZ.bodenWahl(an, w.m, z.weg, yf => an.meter(yf, hz, z.kamera), lb.motive[w.m.name], { maxH: 0.55 });
      SZ.stehendMalen(g, w.m, p.x, p.y, p.h, dpr, { flach: z.flach || 0.24, wurf: 0.35, staerke: 1.25 });
      w.lage = p;   // Testhilfe
    },
  };
  let malNr = 0, gemalt = '';
  // zeichnet, sobald alles fertig ist; bis dahin bleibt der alte Stand (beim Drehen) bzw. die Linse unsichtbar
  function malen() {
    if (!aktiv) return;
    const schirm = aktiv, nr = aktivNr, mitLinse = schirm.id === 'fkStart', b = bereitMachen(nr, mitLinse, linsenGroesse(schirm));
    // schon fertig gezeichnet (gleiches Level, gleiche Größe, gleiches Motiv)? Dann nicht neu – beiBild ruft malen() bei
    // jedem geladenen Bild des Levels auf
    const schl = () => [schirm.id, nr, innerWidth, innerHeight, linsenGroesse(schirm), schirm.classList.contains('fk-eng'), wahl[nr] && wahl[nr].m && wahl[nr].m.name].join('|');
    if (b.fertig && gemalt === schl() && !schirm.classList.contains('fk-laedt')) return b.versprechen;
    const n = ++malNr;
    const jetzt = () => { hgMalen(schirm, nr); if (mitLinse) linseMalen(schirm, nr); gemalt = schl(); };
    if (b.fertig) { jetzt(); schirm.classList.remove('fk-laedt'); return b.versprechen; }
    return b.versprechen.then(() => {
      if (n !== malNr || aktiv !== schirm || aktivNr !== nr) return false;
      jetzt();
      // erst jetzt sichtbar: Linse und Hintergrund blenden weich ein (Animation startet beim Entfernen der Klasse)
      requestAnimationFrame(() => schirm.classList.remove('fk-laedt'));
      return true;
    });
  }
  let warten = 0;
  addEventListener('resize', () => { clearTimeout(warten); warten = setTimeout(malen, 120); });

  function zeigen(schirm, nr) {
    ['#fkStart', '#fkEnde'].forEach(s => { $(s).hidden = true; });
    aktiv = schirm; aktivNr = nr;
    const mitLinse = schirm.id === 'fkStart';
    // fehlt noch etwas, bleiben Linse und Hintergrund verborgen, bis es fertig ist
    schirm.classList.toggle('fk-laedt', !bereitMachen(nr, mitLinse, 200).fertig);
    gemalt = '';
    schirm.hidden = false;
    // Animationen neu starten
    schirm.querySelectorAll('.fk-linse, .fk-karte, .fk-karte > *').forEach(e => { e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; });
    const v = malen();
    schirm.scrollTop = 0;
    return v || Promise.resolve(true);
  }
  function alleVerbergen() { ['#fkStart', '#fkEnde'].forEach(s => { $(s).hidden = true; }); aktiv = null; }

  // ---------- Startbild ----------
  function start(lv, best) {
    const s = $('#fkStart');
    s.querySelector('.fk-dach').textContent = T.level + ' ' + lv.nr;
    s.querySelector('.fk-titel').textContent = lv.name;
    s.querySelector('.fk-anleitung').textContent = (K.texte && K.texte[lv.nr] && K.texte[lv.nr].anleitung) || lv.anleitung || '';
    const rz = s.querySelector('.fk-regel');   // Regelzeile nur, falls die Anleitung die Regel nicht schon nennt
    rz.textContent = lv.regelzeile || ''; rz.hidden = !lv.regelzeile;
    const h = s.querySelector('.fk-hinweis');
    h.hidden = !lv.hinweis; h.textContent = lv.hinweis || '';
    if (lv.hinweis) h.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>');
    tonKnopfZeigen = !!lv.hinweis; tonEinAnpassen();
    const b = s.querySelector('.fk-best');
    b.textContent = T.bestwert + ': ';
    b.append(el('b', '', FK.zahl(best > 0 ? best : 0) + '/' + FK.zahl(D.regeln.hoechst)), ' ' + T.punkte);
    // jedes Startbild wählt sein Linsen-Motiv neu – außer es wurde schon vorbereitet (für „Weiter“ vorab geladen)
    if (!vorbereitet.has(lv.nr)) delete wahl[lv.nr];
    vorbereitet.delete(lv.nr);
    return zeigen(s, lv.nr);
  }

  // ---------- Endbild ----------
  let zaehlen = 0;
  function ende(info) {
    const s = $('#fkEnde'), lv = info.lv;
    s.querySelector('.fk-dach').textContent = T.level + ' ' + lv.nr + ' – ' + lv.name;
    const bw = s.querySelector('.fk-bewertung');
    bw.textContent = info.bewertung;
    bw.classList.remove('rein'); void bw.offsetWidth; bw.classList.add('rein');
    const pl = s.querySelector('.fk-plakette');
    pl.hidden = !info.plakette; pl.querySelector('span').textContent = info.plakette || '';
    s.querySelector('.fk-bilanz').textContent = info.bilanz || '';
    const ah = s.querySelector('.fk-abbruch-hinweis');
    ah.hidden = !info.abbruchHinweis; ah.textContent = info.abbruchHinweis || '';
    const bz = s.querySelector('.fk-bestzeile');
    bz.textContent = info.bestText || ''; bz.classList.toggle('neu', !!info.neu);
    const fr = s.querySelector('.fk-frei');
    fr.hidden = !info.frei; fr.textContent = info.frei || '';
    const weiter = $('#fkWeiter'), nochmal = $('#fkNochmal');
    // Ohne „Weiter“ (Abbruch, letztes Level, nächstes noch nicht gebaut) wird „Nochmal“ zum Hauptknopf
    if (info.weiter) {
      weiter.textContent = T.weiter; weiter.dataset.art = 'weiter';
      nochmal.hidden = false;
    } else {
      weiter.textContent = T.nochmal; weiter.dataset.art = 'nochmal';
      nochmal.hidden = true;
    }
    s.querySelector('.fk-punkte').setAttribute('aria-label', FK.zahl(info.punkte) + ' ' + T.von);
    zeigen(s, lv.nr);
    // Punkte zählen hoch, Ring läuft mit
    const bogen = s.querySelector('.bogen'), U = 2 * Math.PI * 46, zahlEl = s.querySelector('.fk-zahl');
    bogen.style.strokeDasharray = U.toFixed(1);
    bogen.style.transition = 'none'; bogen.style.strokeDashoffset = U.toFixed(1); void bogen.getBoundingClientRect();
    cancelAnimationFrame(zaehlen);
    const ziel = Math.max(0, Math.min(D.regeln.hoechst, info.punkte));
    zahlEl.classList.toggle('lang', ziel >= 1000);
    if (FK.ruhig()) { zahlEl.textContent = FK.zahl(ziel); bogen.style.strokeDashoffset = (U * (1 - ziel / D.regeln.hoechst)).toFixed(1); return; }
    bogen.style.transition = '';
    setTimeout(() => { bogen.style.strokeDashoffset = (U * (1 - ziel / D.regeln.hoechst)).toFixed(1); }, 150);
    const t0 = performance.now() + 150, dauer = 1200;
    const schritt = jetzt => {
      const u = Math.max(0, Math.min(1, (jetzt - t0) / dauer)), e = 1 - Math.pow(1 - u, 3);
      zahlEl.textContent = FK.zahl(ziel * e);
      if (u < 1) zaehlen = requestAnimationFrame(schritt);
    };
    zahlEl.textContent = '0';
    zaehlen = requestAnimationFrame(schritt);
  }

  // ---------- Level-Titel ----------
  let titelUhr = 0, titelFertig = null;
  // Schrift in einer Linse (MZ, 26.10.2026): links und rechts mindestens 12 % des Linsendurchmessers Luft, gemessen am
  // längsten Text der Reihe – so sind alle Level-Namen gleich groß. Ergebnis = Anteil von --d (Linsendurchmesser) für
  // font-size, höchstens `grenze` (bisherige Wunschgröße). Gemessen mit Poppins (gleiche Schrift wie im CSS).
  const messG = document.createElement('canvas').getContext('2d');
  function linsenAnteil(texte, gewicht, grenze, luft) {
    messG.font = `${gewicht} 100px Poppins, system-ui, sans-serif`;
    const breit = Math.max(1, ...texte.filter(Boolean).map(t => messG.measureText(t).width)) / 100;   // Breite je 1px Schriftgröße
    return Math.min(grenze, (1 - 2 * (luft == null ? 0.12 : luft)) / breit);
  }
  function linsenSchrift() {
    const namen = D.level.map(l => { const t = String(l.titel || '').split(/\s* ?–\s*/); return t.length > 1 ? t.slice(1).join(' – ') : l.name; });
    document.documentElement.style.setProperty('--fk-tname', linsenAnteil(namen, 800, 0.16).toFixed(4));
    document.documentElement.style.setProperty('--fk-tklein', linsenAnteil(D.level.map(l => (String(l.titel || '').split(/\s* ?–\s*/)[0] || '').toUpperCase()), 600, 0.06, 0.2).toFixed(4));
    // Endbild: Punkte („1.000“ ist der längste Wert) und „von 1.000 Punkten“; der innere Ring liegt bei ca. 10 % vom Rand → 24 % Luft (= ca. 12 % zum Ring)
    document.documentElement.style.setProperty('--fk-zahl', linsenAnteil(['1.000'], 800, 0.215, 0.24).toFixed(4));
    document.documentElement.style.setProperty('--fk-zahlk', linsenAnteil(['000'], 800, 0.27, 0.24).toFixed(4));
    document.documentElement.style.setProperty('--fk-von', linsenAnteil([T.von], 400, 0.055, 0.2).toFixed(4));
  }
  linsenSchrift();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("800 20px 'Poppins'"), document.fonts.load("600 20px 'Poppins'"), document.fonts.load("400 20px 'Poppins'")]).then(linsenSchrift, () => {});
  function titel(lv, fertig, stehen) {
    const t = $('#fkTitel');
    // Level-Titel aus texte.js („Level 1 – Schärfe“): Teil vor dem Strich klein, danach groß
    const teile = String(lv.titel || '').split(/\s* ?–\s*/);
    t.querySelector('.klein').textContent = teile.length > 1 ? teile[0] : T.level + ' ' + lv.nr;
    t.querySelector('.gross').textContent = teile.length > 1 ? teile.slice(1).join(' – ') : lv.name;
    t.setAttribute('aria-label', lv.titel || lv.name);
    t.classList.toggle('stand', !!stehen);
    t.hidden = false;
    t.querySelectorAll('.fk-tlinse, .gross').forEach(e => { e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; });
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    titelFertig = fertig;
    clearTimeout(titelUhr);
    if (!stehen) titelUhr = setTimeout(titelEnde, FK.ruhig() ? 2100 : 2500);
  }
  function titelEnde() {
    clearTimeout(titelUhr);
    const t = $('#fkTitel');
    if (t.hidden) return;
    t.hidden = true;
    const f = titelFertig; titelFertig = null;
    if (f) f();
  }
  $('#fkTitel').addEventListener('pointerdown', e => { e.preventDefault(); titelEnde(); });
  addEventListener('keydown', e => { if (!$('#fkTitel').hidden && (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')) { e.preventDefault(); titelEnde(); } });

  // ---------- Kopfzeile ----------
  const hud = {
    zeigen(an) { $('#fkHud').hidden = !an; },
    ziel(n, name) { $('#fkHud .fk-zn').textContent = T.ziel + ' ' + n + '/' + D.regeln.ziele; $('#fkHud .fk-motiv').textContent = name ? ' – ' + name : ''; },
    punkte(p, plus) {
      $('#fkHud .fk-pkt b').textContent = FK.zahl(p);
      if (plus) { const c = $('#fkHud .fk-pkt'); c.classList.remove('plus'); void c.offsetWidth; c.classList.add('plus'); }
    },
    fehler(n, neu) {
      $('#fkHud .fk-fehler').querySelectorAll('i').forEach((e, i) => e.classList.toggle('an', i < n));
      if (neu) { const c = $('#fkHud .fk-fehler'); c.classList.remove('wackeln'); void c.offsetWidth; c.classList.add('wackeln'); }
    },
    unterkante() { const r = $('#fkHud .fk-chip').getBoundingClientRect(); return r.bottom > 0 ? r.bottom : 90; },
  };

  window.FOKUS_SCHIRME = { start, ende, titel, titelEnde, alleVerbergen, hud, malen, vorbereiten, ansicht,
    knoepfe(f) {
      $('#fkLos').addEventListener('click', f.los);
      $('#fkWeiter').addEventListener('click', () => ($('#fkWeiter').dataset.art === 'weiter' ? f.weiter : f.nochmal)());
      $('#fkNochmal').addEventListener('click', f.nochmal);
    } };
})();
