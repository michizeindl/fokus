// Level 5 „Weitblick“ – überarbeitet 26.10.2026 (MZ: „cool, aber für unsere Verhältnisse schlecht umgesetzt“).
// Blick vom Cafétisch über den Stadtplatz wie durch eine Kamera: Unten liegt ein Fokusring (MZ-Wahl A), den man durch
// Ziehen links/rechts dreht. Er stellt die Schärfe stufenlos von nah (Tisch, Tiefe 0) nach fern (Häuser, Tiefe 1).
// Alles hat eine Tiefe: die Dinge (aus ihrem Fußpunkt) und der Hintergrund (Tischplatte, Pflaster, Fassaden – je Bildzeile).
// Die Unschärfe wächst stufenlos mit dem Abstand zur eingestellten Tiefe – Bild und Schrift.
//
// Szene statt Collage: Nahe Dinge liegen auf der Tischplatte, ferne stehen auf dem Pflaster – jeweils mit dem Fußpunkt
// auf dem Boden, perspektivisch richtig groß (Höhe in m × Maßstab an der Fußlinie, daten.js level[4].zonen) und mit
// weichem Kontaktschatten. Nichts überlappt, nichts ragt über die Tischkante. Die Szene bleibt von Ziel zu Ziel stehen;
// nach jedem Ziel geht das Ziel (und manchmal ein weiteres Ding), Neues kommt an freien Stellen dazu (6–7 Dinge, MZ).
//
// Ablauf je Ziel: Ansage als Geräusch (ohne Ton bzw. Platzhalter sofort klein als Text; mit echter Aufnahme Text erst nach
// `textNach`). Treffer = Ziel antippen, während es scharf genug ist (Ring höchstens `toleranz` neben seiner Tiefe; gegen
// Ende schmaler). Punkte nach Reaktion ab Ansage (bis `voll` 100, bis `zeit` linear auf 50).
//   falsch  Ziel angetippt, aber noch unscharf (Entwurf „Rückmeldung unscharf“ → texte.js) oder anderes Ding
//   verpasst  Zeitgrenze abgelaufen. Tippen vor der Ansage und ins Leere zählt nicht.
// Synchron mit dem Ton (MZ, 26.10.2026): mit Ton zählen Reaktion, Text-Einblendung und Zeitgrenze ab dem Moment, in dem die
// Ansage am Ohr hörbar wird (Start im AudioContext + hörbarer Einsatz + Ausgabe-Latenz, TON.hoerJetzt); ist die Aufnahme
// noch nicht entschlüsselt, wartet die Ansage (höchstens WARTEN).
// Motive: Pool „weitblick“ (motive.js, über den Namen aus dem Entwurf), Höhe aus motive.js `hoehe` oder daten.js
// weitblick.hoehe (null = nicht im Spiel). Fehlt ein Bild, steht ein Platzhalter-Kärtchen mit dem Namen da.
(function () {
  'use strict';
  const D = window.FOKUS, SZ = window.FOKUS_SZENE, G = window.FOKUS_GEMEIN, TON = G.ton, T = D.texte;
  window.FOKUS_LEVEL = window.FOKUS_LEVEL || {};
  window.FOKUS_LINSE = window.FOKUS_LINSE || {};
  const { lerp, klemm, mischen } = G;
  const W = D.weitblick;
  const ruhig = () => /[#&]ruhig/.test(location.hash) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Motive ----------
  const hoeheVon = m => {
    if (m.hoehe > 0) return m.hoehe;
    const t = W.hoehe || {};
    if (Object.prototype.hasOwnProperty.call(t, m.name)) return t[m.name] || 0;   // null = nicht im Spiel
    return (W.hoeheStandard || {})[m.entfernung] || (m.entfernung === 'fern' ? 1.8 : 0.1);
  };
  // Höhe in der Szene: nahe, sehr kleine Dinge (unter `nahKlein.ab` m) werden sanft angehoben – Wurzel-Kurve, die
  // Reihenfolge bleibt (Mundharmonika < Armbanduhr < Fotoapparat), damit sie auf dem Handy erkennbar bleiben (MZ, 26.10.2026)
  const hoeheSzene = m => {
    const h = hoeheVon(m), k = W.nahKlein;
    if (m.entfernung !== 'nah' || !k || !(h > 0) || h >= k.ab) return h;
    return k.ab * Math.pow(h / k.ab, k.kurve);
  };
  const flachVon = m => (m.entfernung === 'nah' && W.flach && W.flach[m.name] > 0) ? W.flach[m.name] : 1;
  // platzhalter: false (daten.js) = nur Motive mit Bild in die Szene (solange die neuen Bilder fehlen); true = fehlende als Kärtchen
  const pool = () => ((window.FOKUS_POOLS && window.FOKUS_POOLS.weitblick) || []).filter(m => (m.entfernung === 'nah' || m.entfernung === 'fern') && hoeheVon(m) > 0 && (m.bild || W.platzhalter));
  const allePool = () => ((window.FOKUS_POOLS && window.FOKUS_POOLS.weitblick) || []);

  // Lage des sichtbaren Motivs im Bild (Alpha): oben/unten/links/rechts als Anteil, unten = Fußpunkt; fuss = Breite der
  // untersten Zeilen (Kontaktschatten unter Rädern/Füßen). Einmal je Bild.
  const lagen = {};
  function lage(img) {
    const k = img.src;
    if (lagen[k]) return lagen[k];
    const n = 96, s = n / Math.max(img.naturalWidth, img.naturalHeight), cw = Math.max(2, Math.round(img.naturalWidth * s)), ch = Math.max(2, Math.round(img.naturalHeight * s));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, cw, ch);
    let d;
    try { d = g.getImageData(0, 0, cw, ch).data; } catch (e) { return (lagen[k] = { oben: 0, unten: 1, links: 0, rechts: 1, fl: 0.3, fr: 0.7 }); }
    let o = ch, u = -1, l = cw, r = -1;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 60) { if (y < o) o = y; if (y > u) u = y; if (x < l) l = x; if (x > r) r = x; }
    if (u < 0) return (lagen[k] = { oben: 0, unten: 1, links: 0, rechts: 1, fl: 0.3, fr: 0.7 });
    let fl = cw, fr = -1;
    const ab = Math.max(1, Math.round((u - o + 1) * 0.05));
    for (let y = u - ab; y <= u; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 100) { if (x < fl) fl = x; if (x > fr) fr = x; }
    if (fr < 0) { fl = l; fr = r; }
    return (lagen[k] = { oben: o / ch, unten: (u + 1) / ch, links: l / cw, rechts: (r + 1) / cw, fl: fl / cw, fr: (fr + 1) / cw });
  }
  // Platzhalter-Kärtchen für Motive ohne Bild (neue Ziele, bis der Graphic Artist liefert)
  function platzhalter(m, hCss, pad, dpr) {
    const sv = m.entfernung === 'fern' ? 0.55 : 1.25, w = hCss * sv, h = hCss;
    const c = document.createElement('canvas'); c.width = Math.ceil((w + pad * 2) * dpr); c.height = Math.ceil((h + pad * 2) * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
    const r = Math.min(w, h) * 0.12;
    g.fillStyle = '#e4ded3'; g.strokeStyle = 'rgba(60,50,40,.45)'; g.lineWidth = Math.max(1, h * 0.015);
    g.beginPath(); if (g.roundRect) g.roundRect(1, 1, w - 2, h - 2, r); else g.rect(1, 1, w - 2, h - 2); g.fill(); g.stroke();
    g.fillStyle = '#5b5248'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = Math.max(7, Math.min(w / Math.max(4, m.name.length) * 1.6, h * 0.16));
    g.font = `600 ${fs}px Poppins, system-ui, sans-serif`;
    g.fillText(m.name, w / 2, h / 2, w * 0.9);
    return { c, w, h, pad, lage: { oben: 0, unten: 1, links: 0, rechts: 1, fl: 0.08, fr: 0.92 } };
  }

  // ---------- Hintergrund: Unschärfe-Stufen (verkleinert, Unschärfe braucht keine volle Auflösung) ----------
  function weich(quelle, r, s) {
    // quelle in Gerätepixeln; Ergebnis s-fach der CSS-Größe (s ≤ 1), Rand gespiegelt fortgesetzt (kein dunkler Saum)
    const Wc = Math.max(1, Math.round(quelle.width * s)), Hc = Math.max(1, Math.round(quelle.height * s)), p = Math.ceil(r * 2.5) + 2;
    const t = document.createElement('canvas'); t.width = Wc + 2 * p; t.height = Hc + 2 * p;
    const tg = t.getContext('2d');
    tg.drawImage(quelle, 0, 0, t.width, t.height);            // gestreckt als Rand
    tg.drawImage(quelle, p, p, Wc, Hc);
    const c = document.createElement('canvas'); c.width = Wc; c.height = Hc;
    const g = c.getContext('2d');
    if (typeof g.filter === 'string') { g.filter = `blur(${r.toFixed(2)}px)`; g.drawImage(t, -p, -p); if (g.filter !== 'none') return c; }
    // ohne ctx.filter: verkleinern und wieder vergrößern (zweimal)
    const f = 1 / (1 + r * 0.6), k = document.createElement('canvas');
    k.width = Math.max(1, Math.round(t.width * f)); k.height = Math.max(1, Math.round(t.height * f));
    const kg = k.getContext('2d'); kg.imageSmoothingQuality = 'high'; kg.drawImage(t, 0, 0, k.width, k.height);
    g.imageSmoothingQuality = 'high'; g.drawImage(k, p * f, p * f, Wc * f, Hc * f, 0, 0, Wc, Hc);
    return c;
  }

  // ---------- Fokusring (DOM + Leinwand) ----------
  document.body.insertAdjacentHTML('beforeend', `<div id="fkRing" hidden role="slider" tabindex="0" aria-label="${T.fokusring || 'Fokusring'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="15"><canvas></canvas></div>`);
  const $r = document.getElementById('fkRing'), $rc = $r.querySelector('canvas');
  // Hinweis „am Ring ziehen“ (MZ, 26.10.2026, nach Spielertest): beim ersten Ziel jedes Durchgangs wackelt der Ring ca. 1,2s
  // sanft hin und her (nur die Zeichnung, die Schärfe bleibt), darüber ein kleiner Doppelpfeil ‹ › mit Fingerpunkt, der
  // mitwandert. Verschwindet, sobald man am Ring zieht (oder das erste Ziel vorbei ist). „Bewegung reduzieren“: nur der Pfeil.
  document.body.insertAdjacentHTML('beforeend', `<div id="fkRingHinweis" hidden aria-hidden="true"><svg viewBox="0 0 76 30">
    <path class="pfeil" d="M14 8 L6 15 L14 22 M62 8 L70 15 L62 22"/><path class="bahn" d="M22 15 H54"/><g class="finger"><circle cx="38" cy="15" r="7.5"/><circle class="kern" cx="38" cy="15" r="3.2"/></g></svg></div>`);
  const $h = document.getElementById('fkRingHinweis'), $hFinger = $h.querySelector('.finger');
  const HINWEIS = { verzoegerung: 0.35, dauer: 1.2, weite: 0.055 };   // Wackeln: Start nach 0,35s, 1,2s lang, ±0,055 Ring-Einheiten

  // Symbole an den Enden (fest): links nah (Tasse auf dem Tisch), rechts fern (Häuser mit Kirchturm)
  function symbolNah(g, x, y, s, a) {
    g.save(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = s * 0.09; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - s * 0.34, y - s * 0.12); g.lineTo(x - s * 0.3, y + s * 0.2); g.quadraticCurveTo(x - s * 0.28, y + s * 0.3, x - s * 0.12, y + s * 0.3);
    g.lineTo(x + s * 0.08, y + s * 0.3); g.quadraticCurveTo(x + s * 0.22, y + s * 0.3, x + s * 0.24, y + s * 0.2); g.lineTo(x + s * 0.28, y - s * 0.12); g.closePath(); g.stroke();
    g.beginPath(); g.arc(x + s * 0.32, y + s * 0.03, s * 0.1, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.5, y + s * 0.42); g.lineTo(x + s * 0.5, y + s * 0.42); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.1, y - s * 0.26); g.quadraticCurveTo(x - s * 0.02, y - s * 0.36, x - s * 0.08, y - s * 0.46); g.stroke();
    g.restore();
  }
  function symbolFern(g, x, y, s, a) {
    g.save(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = s * 0.09; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(x - s * 0.5, y + s * 0.42); g.lineTo(x - s * 0.5, y + s * 0.02); g.lineTo(x - s * 0.3, y - s * 0.16); g.lineTo(x - s * 0.1, y + s * 0.02); g.lineTo(x - s * 0.1, y + s * 0.42);
    g.moveTo(x - s * 0.1, y + s * 0.42); g.lineTo(x - s * 0.1, y - s * 0.22); g.lineTo(x + s * 0.02, y - s * 0.36); g.lineTo(x + s * 0.14, y - s * 0.22); g.lineTo(x + s * 0.14, y + s * 0.42);
    g.moveTo(x + s * 0.02, y - s * 0.36); g.lineTo(x + s * 0.02, y - s * 0.5);
    g.moveTo(x + s * 0.14, y + s * 0.42); g.lineTo(x + s * 0.14, y + s * 0.08); g.lineTo(x + s * 0.32, y - s * 0.08); g.lineTo(x + s * 0.5, y + s * 0.08); g.lineTo(x + s * 0.5, y + s * 0.42);
    g.moveTo(x - s * 0.56, y + s * 0.42); g.lineTo(x + s * 0.56, y + s * 0.42);
    g.stroke(); g.restore();
  }
  // Ring zeichnen: f = eingestellte Tiefe (0–1). Skala und Griffrillen laufen mit dem Finger (Zylinder in Aufsicht),
  // Marke in der Mitte bleibt stehen. Ziehen nach rechts = fern (zum Häuser-Symbol), nach links = nah (zur Tasse).
  function ringMalen(f) {
    const r = $r.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if ($rc.width !== Math.round(w * dpr) || $rc.height !== Math.round(h * dpr)) { $rc.width = Math.round(w * dpr); $rc.height = Math.round(h * dpr); }
    const g = $rc.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const ende = Math.min(46, h * 0.95), x0 = ende, x1 = w - ende, cx = w / 2, R = (x1 - x0) / 2;
    // Körper: dunkles Metall, oben Lichtkante, an den Seiten dunkler (Zylinder)
    let v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, '#454b4e'); v.addColorStop(0.18, '#2a2f31'); v.addColorStop(0.62, '#171b1c'); v.addColorStop(1, '#0c0e0f');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    // Griffrillen (unteres Drittel) – laufen mit
    const rillenOben = h * 0.64, SPAN = W.ringWeg || 2.6;
    const winkel = -(f * SPAN);
    const schritt = 0.055;
    for (let a = Math.ceil((winkel - 1.6) / schritt) * schritt; a < winkel + 1.6; a += schritt) {
      const th = a - winkel; if (Math.abs(th) > 1.52) continue;
      const x = cx + R * Math.sin(th) * 1.04, c = Math.cos(th);
      g.fillStyle = `rgba(255,255,255,${0.05 + 0.13 * c})`; g.fillRect(x - 0.7 * c, rillenOben, Math.max(0.5, 1.4 * c), h - rillenOben - 4);
      g.fillStyle = `rgba(0,0,0,${0.35 * c})`; g.fillRect(x + 0.8 * c, rillenOben, Math.max(0.5, 1.1 * c), h - rillenOben - 4);
    }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, rillenOben - 1.5, w, 1.5);
    // Skala: 50 Teilstriche über den ganzen Weg, lange alle 5; Anschläge bei 0 und 1 kräftiger
    const oben = 5, lang = h * 0.3, kurz = h * 0.17;
    for (let i = 0; i <= 50; i++) {
      const t = i / 50, th = (f - t) * SPAN;
      if (Math.abs(th) > 1.5) continue;
      const x = cx + R * Math.sin(th), c = Math.cos(th);
      const anschlag = i === 0 || i === 50, l = anschlag ? lang * 1.15 : i % 5 === 0 ? lang : kurz;
      g.fillStyle = `rgba(255,255,255,${(anschlag ? 1 : i % 5 === 0 ? 0.92 : 0.6) * (0.25 + 0.75 * c)})`;
      const bw = (anschlag ? 3.2 : i % 5 === 0 ? 2 : 1.3) * (0.4 + 0.6 * c);
      g.fillRect(x - bw / 2, oben + 3, bw, l);
    }
    // Zylinder-Schatten an den Seiten
    v = g.createLinearGradient(0, 0, w, 0);
    v.addColorStop(0, 'rgba(0,0,0,.92)'); v.addColorStop(ende / w, 'rgba(0,0,0,.72)'); v.addColorStop(0.5 - (0.5 - ende / w) * 0.45, 'rgba(0,0,0,0)');
    v.addColorStop(0.5 + (0.5 - ende / w) * 0.45, 'rgba(0,0,0,0)'); v.addColorStop(1 - ende / w, 'rgba(0,0,0,.72)'); v.addColorStop(1, 'rgba(0,0,0,.92)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(0, 0, w, 1.2);
    // Marke in der Mitte (fest)
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - 6, 0); g.lineTo(cx + 6, 0); g.lineTo(cx, 7); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(cx - 0.9, 0, 1.8, oben + 3 + lang + 2);
    // Symbole an den Enden, leicht heller in der Richtung, in die es noch geht
    const s = Math.min(ende * 0.62, h * 0.52);
    symbolNah(g, ende * 0.52, h * 0.42, s, f > 0.02 ? 0.95 : 0.4);
    symbolFern(g, w - ende * 0.52, h * 0.42, s, f < 0.98 ? 0.95 : 0.4);
    $r.setAttribute('aria-valuenow', Math.round(f * 100));
  }

  const WARTEN = 2.5;   // höchstens so lange wartet die Ansage, bis ihr Geräusch wirklich erklingen kann

  window.FOKUS_LEVEL[5] = function (api) {
    const N = D.regeln.ziele, R = D.regeln;
    const uhrTon = TON.takt();
    let B = 0, H = 0, dpr = 1, hgSchl = '', scharf = null, stufenHg = [], hgC = null, hgStand = '', geo = null;
    let dinge = [], nr = 0, ziel = null, phase = 'aus', uhr = 0, aus = false, reihe = [], zuletzt = [];
    let fokus = W.fokusStart || 0.15, fokusZiel = fokus, ringStand = -1;
    // Ring-Hinweis: null = aus, sonst { t } (Sekunden seit Start); hinweisGezeigt = in diesem Durchgang schon gezeigt
    let hinweis = null, hinweisGezeigt = false, wackeln = 0;
    function hinweisStart() {
      if (hinweisGezeigt) return;
      hinweisGezeigt = true; hinweis = { t: 0 };
      $h.classList.toggle('ruhig', ruhig()); $h.classList.remove('weg'); $h.hidden = false; hinweisLage();
    }
    function hinweisEnde() {
      if (!hinweis) return;
      hinweis = null; wackeln = 0; ringStand = -1; $hFinger.style.transform = '';
      $h.classList.add('weg'); setTimeout(() => { if (!hinweis) $h.hidden = true; }, 350);
    }
    function hinweisLage() {
      const r = $r.getBoundingClientRect();
      if (r.height) { $h.style.left = (r.left + r.width / 2) + 'px'; $h.style.top = (r.top - 6) + 'px'; }
    }
    function hinweisSchritt(dt) {
      if (!hinweis) return;
      hinweis.t += dt;
      hinweisLage();
      if (ruhig()) { wackeln = 0; return; }
      const u = (hinweis.t - HINWEIS.verzoegerung) / HINWEIS.dauer;
      // zwei weiche Schwünge hin und her, an- und abschwellend
      wackeln = u > 0 && u < 1 ? HINWEIS.weite * Math.sin(u * Math.PI * 2) * Math.sin(u * Math.PI) : 0;
      // Fingerpunkt wandert mit der Skala (mehr Schärfe-Wert = Skala nach rechts, wie beim Ziehen nach rechts)
      $hFinger.style.transform = `translateX(${(wackeln / HINWEIS.weite * 9).toFixed(2)}px)`;
    }
    const fx = G.effekte(), tempo = api.tempo || 1;
    let tonGriff = null;
    const kNow = () => Math.min(nr, N - 1);
    const toleranz = () => lerp(W.toleranz, kNow(), N), weite = () => lerp(W.weite, kNow(), N);
    const bmax = () => Math.max(3, (W.unschaerfe || 0.026) * Math.min(B, H));
    // Mindesthöhe naher Dinge in px (bei 375 px kürzerer Seite `nahKlein.px`, auf größeren Bildschirmen etwas mehr, höchstens ×1,3)
    const nahMinPx = () => { const k = W.nahKlein; return k ? k.px * klemm(Math.min(B, H) / 375, 1, 1.3) : 0; };
    // hinterste Fußlinie (Bildschirm-y), ab der ein nahes Ding mindestens nahMinPx hoch ist – kleine Dinge liegen vorn
    const nahAb = m => { const h = hoeheSzene(m) * flachVon(m), p = nahMinPx(); return p > 0 && h > 0 ? geo.sy(geo.hz + p * geo.ta / (geo.ih * h)) : -Infinity; };

    // ---------- Fokusring: Bedienung ----------
    let zug = null;
    const spielt = () => phase !== 'aus' && !$r.hidden;
    const pxJeEinheit = () => { const r = $r.getBoundingClientRect(), ende = Math.min(46, r.height * 0.95); return (r.width - 2 * ende) / 2 * (W.ringWeg || 2.6); };
    function fokusSetzen(f) { fokusZiel = klemm(f, 0, 1); }
    $r.addEventListener('pointerdown', e => {
      if (!spielt()) return;
      e.preventDefault(); e.stopPropagation();
      zug = { id: e.pointerId, x: e.clientX, f: fokusZiel };
      hinweisEnde();
      try { $r.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
      $r.classList.add('zieht');
    });
    $r.addEventListener('pointermove', e => {
      if (!zug || e.pointerId !== zug.id) return;
      e.preventDefault();
      fokusSetzen(zug.f + (e.clientX - zug.x) / pxJeEinheit());
    });
    const los = e => { if (zug && e.pointerId === zug.id) { zug = null; $r.classList.remove('zieht'); } };
    $r.addEventListener('pointerup', los); $r.addEventListener('pointercancel', los); $r.addEventListener('lostpointercapture', los);
    $r.addEventListener('wheel', e => { if (!spielt()) return; e.preventDefault(); hinweisEnde(); fokusSetzen(fokusZiel + (e.deltaX - e.deltaY) * 0.0009); }, { passive: false });
    addEventListener('keydown', e => {
      if (!spielt()) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { hinweisEnde(); fokusSetzen(fokusZiel + 0.03); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { hinweisEnde(); fokusSetzen(fokusZiel - 0.03); e.preventDefault(); }
    });
    const ringRechteck = () => { const r = $r.getBoundingClientRect(); return r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: B / 2 - 150, y: H - 68, w: 300, h: 58 }; };

    // ---------- Geometrie (Bild ↔ Bildschirm, Tiefe, Maßstab) ----------
    function linie(pts, x) {
      if (!pts || !pts.length) return 0.6;
      if (x <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i], u = (x - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; }
      return pts[pts.length - 1][1];
    }
    function geometrie() {
      const A = SZ.abbildung(5, B, H), Z = A.zonen || {};
      const ih = A.bereit ? A.ih : H, iw = A.bereit ? A.iw : B;
      const ox = A.x(0), oy = A.y(0);
      const hz = Z.horizont != null ? Z.horizont : 0.46, kam = Z.kamera || 1.2, ta = Z.tischAuge || 0.45;
      const kante = x => linie(Z.tischkante || [[0, 0.65], [1, 0.65]], x), hinten = x => linie(Z.hinten || [[0, 0.55], [1, 0.55]], x);
      const fBr = (Z.tischHinten || 1.1) * (kante(0.5) - hz) / ta;            // Brennweite in Bildhöhen
      const zTisch = yf => fBr * ta / Math.max(0.003, yf - hz), zPlatz = yf => fBr * kam / Math.max(0.003, yf - hz);
      const zMin = W.naechste || 0.35, zMax = zPlatz(Z.fassade || 0.49), lg = Math.log(zMax / zMin);
      const tiefe = z => klemm(Math.log(Math.max(zMin, z) / zMin) / lg, 0, 1);
      const bx = x => (x - ox) / iw, by = y => (y - oy) / ih, sx = fx2 => ox + fx2 * iw, sy = fy => oy + fy * ih;
      return {
        A, Z, ih, iw, hz, kam, ta, fBr, kante, hinten, bx, by, sx, sy,
        // Tiefe einer Bildschirmzeile außerhalb des Tischs (Pflaster, darüber Fassaden) bzw. auf dem Tisch
        tAussen: y => { const yf = by(y); return yf <= (Z.fassade || 0.49) ? 1 : tiefe(zPlatz(yf)); },
        tTisch: y => tiefe(zTisch(by(y))),
        tiefeVon: (fern, yS) => tiefe(fern ? zPlatz(by(yS)) : zTisch(by(yS))),
        // Pixel je Meter Höhe an der Fußlinie (Bildschirm)
        meter: (fern, yS) => ih * Math.max(0.002, by(yS) - hz) / (fern ? kam : ta),
        // Abflachung eines Kreises auf dem Boden (Schatten): Augenhöhe / Abstand
        flach: yS => klemm((by(yS) - hz) / fBr, 0.05, 0.55),
        aufTisch: (xS, yS) => yS >= sy(kante(bx(xS))),
        sperre: (x0, y0, x1, y1) => (Z.sperren || []).some(s => x1 > sx(s[0]) && x0 < sx(s[2]) && y1 > sy(s[1]) && y0 < sy(s[3])),
      };
    }

    // ---------- Hintergrund in Tiefen-Ebenen ----------
    // Stufen: 0 = scharf (Gerätepixel), danach weichgezeichnet mit wachsendem Halbmesser (bei Unschärfe ab 3 Stufen halb aufgelöst)
    const STUFEN = [0, 0.07, 0.16, 0.3, 0.48, 0.72, 1.0];
    function hgBauen() {
      scharf = SZ.levelBild(5, B, H, dpr);
      geo = geometrie();
      const bm = bmax();
      stufenHg = STUFEN.map((a, i) => {
        if (i === 0) return { c: scharf, s: dpr, r: 0 };
        const s = a >= 0.3 ? 0.5 : 1, r = a * bm;
        return { c: weich(scharf, r * s, s / dpr), s, r };
      });
      // Tiefe je Bildschirmzeile (außen = Pflaster/Fassaden, Tisch = Tischplatte) und Umriss der Tischplatte
      const tA = new Float32Array(Math.ceil(H) + 1), tT = new Float32Array(Math.ceil(H) + 1);
      for (let y = 0; y <= H; y++) { tA[y] = geo.tAussen(y + 0.5); tT[y] = geo.tTisch(y + 0.5); }
      geo.zeilen = { tA, tT };
      const p = new Path2D(), n = 48;
      let tischOben = H;
      for (let i = 0; i <= n; i++) {
        const xs = -2 + (B + 4) * i / n, ys = geo.sy(geo.kante(geo.bx(xs)));
        tischOben = Math.min(tischOben, ys);
        if (i === 0) p.moveTo(xs, ys); else p.lineTo(xs, ys);
      }
      p.lineTo(B + 2, H + 2); p.lineTo(-2, H + 2); p.closePath();
      geo.tisch = p; geo.tischOben = Math.max(0, tischOben);
      const dC = Math.min(dpr, 2);
      hgC = document.createElement('canvas'); hgC.width = Math.round(B * dC); hgC.height = Math.round(H * dC); hgC.dC = dC;
      hgStand = '';
    }
    // Zusammensetzen für die eingestellte Tiefe f: Zeilenstreifen, je Streifen die passende Mischung zweier Stufen
    function hgZusammen(f) {
      const ws = weite(), st = (f.toFixed(4) + '|' + ws.toFixed(3));
      if (st === hgStand || !hgC) return;
      hgStand = st;
      const g = hgC.getContext('2d'), dC = hgC.dC, bm = bmax();
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      const radius = t => bm * Math.min(1, Math.abs(t - f) / ws);
      const streifen = (y0, y1, r) => {
        let i = 0; while (i < stufenHg.length - 2 && stufenHg[i + 1].r < r) i++;
        const a = stufenHg[i], b = stufenHg[i + 1], u = b.r > a.r ? klemm((r - a.r) / (b.r - a.r), 0, 1) : 0;
        const ziehen = (L, al) => { g.globalAlpha = al; g.drawImage(L.c, 0, y0 * L.s, L.c.width, Math.max(1, (y1 - y0) * L.s), 0, Math.floor(y0 * dC), hgC.width, Math.ceil((y1 - y0) * dC) + 1); };
        if (u < 0.985) ziehen(a, 1);
        if (u > 0.015) ziehen(b, u < 0.985 ? u : 1);
        g.globalAlpha = 1;
      };
      const bahn = (arr, von, bis) => {
        let y0 = von, r0 = radius(arr[Math.min(arr.length - 1, Math.floor(von))]);
        for (let y = von + 2; y <= bis; y += 2) {
          const r = radius(arr[Math.min(arr.length - 1, y)]);
          if (Math.abs(r - r0) > 0.22 || y >= bis) { streifen(y0, Math.min(bis, y), (r0 + r) / 2); y0 = y; r0 = r; }
        }
        if (y0 < bis) streifen(y0, bis, r0);
      };
      bahn(geo.zeilen.tA, 0, Math.ceil(H));
      g.save(); g.setTransform(dC, 0, 0, dC, 0, 0); g.clip(geo.tisch); g.setTransform(1, 0, 0, 1, 0, 0);
      bahn(geo.zeilen.tT, Math.floor(geo.tischOben), Math.ceil(H));
      g.restore();
    }

    // ---------- Dinge in die Szene stellen ----------
    function bauen(m, fern, xs, ys, img, ana) {
      // flach liegende Dinge (daten.js weitblick.flach): nur die Höhe gestaucht, Breite wie ungestaucht
      const meter = geo.meter(fern, ys), f = flachVon(m), hu = hoeheSzene(m) * meter, hv = hu * f;
      const hb = hu / Math.max(0.2, ana.unten - ana.oben), sv = img ? img.naturalWidth / img.naturalHeight : (fern ? 0.55 : 1.25), w = hb * sv, h = hb * f;
      const x = xs - (ana.links + ana.rechts) / 2 * w, y = ys - ana.unten * h;
      const box = { x: x + ana.links * w, y: y + ana.oben * h, w: (ana.rechts - ana.links) * w, h: hv };
      return { m, fern, xs, ys, x, y, w, h, hv, box, ana };
    }
    function passt(o, belegt) {
      const b = o.box, oben = api.oben() + 4, ring = ringRechteck();
      if (b.h < 9 || b.x < 6 || b.x + b.w > B - 6 || b.y < oben || o.ys > H - 6) return false;
      // nicht unter dem Ring (mit Rand) und nicht in gesperrten Bereichen
      if (b.x < ring.x + ring.w + 8 && b.x + b.w > ring.x - 8 && o.ys + 4 > ring.y - 8) return false;
      if (geo.sperre(geo.bx(b.x), geo.by(b.y), geo.bx(b.x + b.w), geo.by(o.ys + 4))) return false;
      if (o.fern) {
        // Fuß auf dem Pflaster: über der Tischkante (ganze Breite) und nicht hinter Brunnen/Kübeln/Haltestelle
        for (const xx of [b.x + 2, o.xs, b.x + b.w - 2]) {
          const xf = geo.bx(xx);
          if (o.ys > geo.sy(geo.kante(xf)) - 5) return false;
          if (o.ys < geo.sy(geo.hinten(xf))) return false;
        }
      } else {
        // liegt ganz auf der Tischplatte: vorderer Rand und der hintere Rand der Auflagefläche (Schatten) auf dem Tisch
        const tief = Math.max(4, o.hv * 0.32);
        for (const xx of [b.x + 2, o.xs, b.x + b.w - 2]) if (!geo.aufTisch(xx, o.ys - tief - 3)) return false;
      }
      return !belegt.some(q => b.x < q.x + q.w + 12 && b.x + b.w + 12 > q.x && b.y < q.y + q.h + 10 && b.y + b.h + 10 > q.y);
    }
    function stellen(m, fern, belegt) {
      const img = m.bild ? SZ.bild(m.bild) : null;
      if (m.bild && !img) return null;   // Bild lädt noch – später
      const ana = img ? lage(img) : { oben: 0, unten: 1, links: 0, rechts: 1, fl: 0.08, fr: 0.92 };
      const ring = ringRechteck();
      for (let i = 0; i < 90; i++) {
        const xs = 14 + Math.random() * (B - 28), xf = geo.bx(xs);
        let ys;
        if (fern) {
          const hi = geo.sy(geo.hinten(xf)) + 3, ka = geo.sy(geo.kante(xf)) - 6;
          if (ka - hi < 4) continue;
          const band = (W.nurHinten && W.nurHinten[m.name]) || W.fernBand || 0.55;   // nurHinten: Platzregel je Motiv
          ys = hi + Math.random() * (ka - hi) * band;
        } else {
          const ka = geo.sy(geo.kante(xf));
          const unterRing = xs > ring.x - 30 && xs < ring.x + ring.w + 30;
          const bis = Math.min(H - 8, unterRing ? ring.y - 10 : H - 8), von = Math.max(ka + 10, nahAb(m));
          if (bis - von < 4) continue;
          ys = von + Math.random() * (bis - von);
        }
        const o = bauen(m, fern, xs, ys, img, ana);
        if (passt(o, belegt)) { o.img = img; return o; }
      }
      return null;
    }
    // Leinwände eines Dings: Motiv (mit Schrift nur auf großen Schildern), Unschärfe-Stufen, Kontaktschatten
    function bereiten(o) {
      const bm = bmax(), pad = Math.ceil(bm) + 2, d = Math.min(dpr, 2);
      const b = o.img ? SZ.motivBild(o.m, o.h, pad, d, o.w) : platzhalter(o.m, o.h, pad, d);
      if (o.fern && W.dunst > 0) {   // Luftdunst: ferne Dinge einen Hauch heller und weicher im Kontrast
        const g = b.c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
        g.fillStyle = `rgba(214,222,230,${W.dunst})`; g.fillRect(0, 0, b.c.width, b.c.height); g.restore();
      }
      o.bild = b; o.st = SZ.stufen(b.c, bm * d, 8);
      o.tiefe = geo.tiefeVon(o.fern, o.ys);
      o.schatten = schatten(o, d, bm);
      o.t = 0; o.weg = 0;
      return o;
    }
    function schatten(o, d, bm) {
      const fl = geo.flach(o.ys), a = o.ana;
      // fern: Standfläche mindestens 60 % der Breite (Füße, Räder, Pfosten-Fuß – sonst nur ein Strich unter dem tiefsten Punkt)
      const breit = o.fern ? Math.max(8, (a.fr - a.fl) * o.w * 1.15, o.box.w * 0.6) : Math.max(8, o.box.w * 1.02);
      const hoch = o.fern ? Math.max(5, breit * fl * 1.1) : Math.max(4, Math.min(o.hv * 0.6, breit * fl * 1.4 + o.hv * 0.12));
      const pad = Math.ceil(bm + Math.max(4, breit * 0.12)) + 2;
      // ferne Dinge: zusätzlich ein weicher Schlagschatten nach rechts hinten (Licht von links oben wie im Platz-Bild)
      const wurf = o.fern ? Math.max(4, o.box.w * 0.45 + o.hv * 0.18) : 0;
      const cw = breit + wurf + pad * 2, ch = hoch + pad * 2;
      const c = document.createElement('canvas'); c.width = Math.ceil(cw * d); c.height = Math.ceil(ch * d);
      const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
      const mx = pad + breit / 2, my = pad + hoch / 2;
      const weichPx = Math.max(1.5, breit * (o.fern ? 0.06 : 0.05));
      if (typeof g.filter === 'string') g.filter = `blur(${weichPx.toFixed(1)}px)`;
      if (!o.fern && o.img) {
        // liegende Dinge: flach gedrückter Umriss als Schatten auf der Platte
        const t = document.createElement('canvas'); t.width = Math.max(2, Math.ceil(breit * d)); t.height = Math.max(2, Math.ceil(hoch * d));
        const tg = t.getContext('2d');
        tg.drawImage(o.img, a.links * o.img.naturalWidth, a.oben * o.img.naturalHeight, (a.rechts - a.links) * o.img.naturalWidth, (a.unten - a.oben) * o.img.naturalHeight, 0, 0, t.width, t.height);
        tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#000'; tg.fillRect(0, 0, t.width, t.height);
        g.globalAlpha = 0.34; g.drawImage(t, pad, pad, breit, hoch);
      }
      // Kontaktschatten: dichter Kern unter der Auflage, weicher Hof (Verläufe sind schon weich – ohne Filter, der würde
      // im skalierten Koordinatensystem mitwachsen)
      g.globalAlpha = 1; if (typeof g.filter === 'string') g.filter = 'none';
      let v = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      if (o.fern) {
        const w2 = g.createRadialGradient(0, 0, 0, 0, 0, 1);
        w2.addColorStop(0, 'rgba(0,0,0,.34)'); w2.addColorStop(0.6, 'rgba(0,0,0,.18)'); w2.addColorStop(1, 'rgba(0,0,0,0)');
        g.save(); g.translate(mx + wurf * 0.5, pad + hoch * 0.42); g.scale((breit + wurf) / 2, Math.max(2, hoch * 0.6)); g.fillStyle = w2; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
      }
      v.addColorStop(0, `rgba(0,0,0,${o.fern ? 0.62 : 0.5})`); v.addColorStop(0.5, `rgba(0,0,0,${o.fern ? 0.34 : 0.26})`); v.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(mx, pad + hoch * (o.fern ? 0.5 : 0.78)); g.scale(breit / 2, Math.max(1.5, (o.fern ? hoch : hoch * 0.4) / 2)); g.fillStyle = v; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
      // Fußpunkt (Bildschirm) liegt bei: fern Mitte der Ellipse, nah im unteren Viertel
      const fussY = o.fern ? pad + hoch * 0.5 : pad + hoch * 0.78;
      return { c, st: SZ.stufen(c, bm * d, 4), x: o.xs - mx + (o.fern ? 0 : o.box.w * 0.03), y: o.ys - fussY + (o.fern ? 0 : 1), w: cw, h: ch };
    }

    const belegtVon = ohne => dinge.filter(o => o !== ohne && !(o.weg > 0.4)).map(o => o.box);
    function neuesDing(fern) {
      const da = new Set(dinge.map(o => o.m.name));
      for (let versuch = 0; versuch < 8; versuch++) {
        let i = reihe.findIndex(m => m.entfernung === (fern ? 'fern' : 'nah') && !da.has(m.name) && (!m.bild || SZ.bild(m.bild)));
        if (i < 0) { reihe = reihe.concat(mischen(pool().filter(m => !da.has(m.name) && !reihe.includes(m)))); i = reihe.findIndex(m => m.entfernung === (fern ? 'fern' : 'nah') && !da.has(m.name) && (!m.bild || SZ.bild(m.bild))); }
        if (i < 0) return null;
        const m = reihe.splice(i, 1)[0];
        const o = stellen(m, fern, belegtVon());
        if (o) { bereiten(o); dinge.push(o); return o; }
        reihe.push(m);   // passt gerade nicht – später wieder
      }
      return null;
    }
    // Szene auf die Zahl für Ziel k auffüllen, nah und fern etwa halb-halb
    function fuellen(k) {
      const soll = W.ziele[Math.min(k, W.ziele.length - 1)] || 6;
      let n = 0;
      while (dinge.filter(o => !o.weg).length < soll && n++ < 12) {
        const da = dinge.filter(o => !o.weg), fern = da.filter(o => o.fern).length, nah = da.length - fern;
        const sollFern = Math.round(soll / 2);
        const wunsch = fern < sollFern && (nah >= soll - sollFern || Math.random() < 0.5);
        if (!neuesDing(wunsch) && !neuesDing(!wunsch)) break;
      }
    }

    function naechstes() {
      if (nr >= N) { aus = true; api.fertig(); return; }
      const k = nr, tol = toleranz();
      // Ziel aus der Szene: nicht mehr als zweimal hintereinander gleich weit weg; bevorzugt eines, das gerade nicht
      // scharf ist (man muss den Ring drehen)
      let kand = dinge.filter(o => !o.weg && !(zuletzt.length >= 2 && zuletzt.every(e => e === (o.fern ? 'fern' : 'nah'))));
      if (!kand.length) kand = dinge.filter(o => !o.weg);
      if (!kand.length) { fuellen(k); kand = dinge.filter(o => !o.weg); }
      if (!kand.length) { aus = true; api.fertig(); return; }
      const weit = kand.filter(o => Math.abs(o.tiefe - fokusZiel) > tol * 2.2);
      const wahl = (weit.length ? weit : kand)[Math.floor(Math.random() * (weit.length ? weit : kand).length)];
      zuletzt.push(wahl.fern ? 'fern' : 'nah'); if (zuletzt.length > 2) zuletzt.shift();
      dinge.forEach(o => { o.ziel = o === wahl; });
      ziel = { k, m: wahl.m, o: wahl, t: 0, ergebnis: null, ansageAb: W.ansageVor, zeit: lerp(W.zeit, k, N), voll: lerp(W.voll, k, N), textAb: null,
        t0: null, einsatz: 0, tonLen: 0, textNach: 0, gewartet: 0 };
      api.ziel(k + 1, null);
      G.ansage.verbergen();
      phase = 'zeigen';
      hinweisStart();   // nur beim ersten Ziel des Durchgangs (danach hinweisGezeigt)
    }
    // Ansage: false = Geräusch kann noch nicht erklingen (wartet, höchstens WARTEN)
    function ansagen(d) {
      const m = ziel.m, k = TON.klang({ name: m.geraeusch || m.name, ton: m.ton, laenge: 1.8 });
      const mitTon = TON.an() && !!m.geraeusch;
      if (mitTon && !TON.bereit(k) && ziel.gewartet < WARTEN) { ziel.gewartet += d; return false; }
      ziel.ansageAb = ziel.t;
      if (mitTon) {
        ziel.tonLen = Math.min((k.einsatz || 0) + 2.4, k.dauer);
        tonGriff = TON.spielen(k, 0.6, { hoechstens: ziel.tonLen });
        if (tonGriff.laeuft) { ziel.t0 = tonGriff.t0; ziel.einsatz = k.einsatz || 0; }
      }
      ziel.textNach = ziel.t0 != null && k.echt ? W.textNach : 0;
      ziel.textAb = ziel.t + ziel.textNach;   // nur Anzeige für Testhilfen (gezählt wird mit seitAnsage)
      phase = 'suchen';
      return true;
    }
    function seitAnsage() {
      if (ziel.t0 != null) return TON.hoerJetzt() - (ziel.t0 + ziel.einsatz);
      return ziel.t - ziel.ansageAb;
    }
    function tonHoerbar() { if (ziel.t0 == null) return false; const r = TON.hoerJetzt() - ziel.t0; return r >= 0 && r < ziel.tonLen; }
    function ergebnis(art, o, grund) {
      const e = { ziel: ziel.k + 1, art, d: 0, name: ziel.m.name };
      if (grund) e.grund = grund;
      if (art === 'treffer') { const rt = Math.max(0, seitAnsage()); e.reaktion = rt; e.punkte = G.punkteNachZeit(rt, ziel.voll, ziel.zeit, R); }
      ziel.ergebnis = e;
      hinweisEnde();
      const q = o || ziel.o, cx = q.box.x + q.box.w / 2, cy = q.box.y + q.box.h / 2;
      let text;
      if (grund === 'unscharf') text = api.rueckmeldung('unscharf') || api.rueckmeldung('frueh');
      else text = api.rueckmeldung(art, e.punkte);
      fx.neu(art, cx, cy, Math.max(22, Math.max(q.box.w, q.box.h) * 0.6), text, art === 'treffer' ? '+' + e.punkte : '');
      if (tonGriff) { tonGriff.aus(0.15); tonGriff = null; }
      G.ansage.zeigen({ bild: G.LAUTSPRECHER, text: ziel.m.name, klein: true });
      api.ergebnis(e);
      phase = 'pause'; uhr = W.pause + 0.3;
    }

    // gezeichnet wird die Schärfe plus das Wackeln des Hinweises (das Wackeln ändert die Schärfe nicht)
    function ringZeichnen() { const f = fokus + wackeln; if (!$r.hidden && Math.abs(f - ringStand) > 0.0004) { ringStand = f; ringMalen(f); } }

    return {
      groesse(b, h, d) {
        B = b; H = h; dpr = d || 1;
        const s = B + 'x' + H + SZ.hgBereit(5, B, H);
        if (s !== hgSchl) {
          hgSchl = s; hgBauen();
          // Szene neu aufbauen (andere Bildschirmform → andere Fußlinien); das laufende Ziel bleibt Ziel
          if (dinge.length) {
            const alt = dinge.filter(o => !o.weg), zielName = ziel && ziel.o && ziel.o.m.name;
            dinge = [];
            alt.forEach(o => { const n = stellen(o.m, o.fern, belegtVon()); if (n) { bereiten(n); n.t = 1; dinge.push(n); if (ziel && n.m.name === zielName) { n.ziel = true; ziel.o = n; } } });
            if (ziel && !dinge.includes(ziel.o)) { const n = stellen(ziel.o.m, ziel.o.fern, belegtVon()); if (n) { bereiten(n); n.t = 1; n.ziel = true; dinge.push(n); ziel.o = n; } }
          }
          ringStand = -1;
        }
      },
      vorladen() { if (window.FOKUS_SCHILDER) window.FOKUS_SCHILDER.laden(); pool().forEach(m => { if (m.bild) SZ.bild(m.bild); if (m.ton) TON.klang({ name: m.geraeusch || m.name, ton: m.ton, laenge: 1.8 }); }); },
      neu(abZiel) {
        this.vorladen();
        reihe = mischen(pool()); zuletzt = [];
        dinge = []; fx.leeren(); aus = false; ziel = null;
        nr = Math.max(0, (abZiel || 1) - 1); phase = 'start'; uhr = 0.5; uhrTon.zurueck();
        fokus = fokusZiel = klemm(W.fokusStart != null ? W.fokusStart : 0.15, 0, 1);
        $r.hidden = false; ringStand = -1;
        hinweis = null; hinweisGezeigt = false; wackeln = 0; $h.hidden = true;
        hgBauen();
        fuellen(nr);
        dinge.forEach(o => { o.t = 1; });   // steht schon da, wenn der Level-Titel verschwindet
        ringZeichnen();
      },
      stopp() { $r.hidden = true; zug = null; hinweis = null; wackeln = 0; $h.hidden = true; G.ansage.verbergen(); if (tonGriff) { tonGriff.aus(0.1); tonGriff = null; } phase = 'aus'; dinge = []; ziel = null; },
      schritt(dt) {
        // Schärfe folgt dem Ring weich (Überblendung, keine Bewegung – daher auch bei „Bewegung reduzieren“) – in echter Zeit
        fokus += (fokusZiel - fokus) * Math.min(1, dt / Math.max(0.01, W.weich || 0.07));
        dt *= tempo;
        fx.schritt(dt);
        if (Math.abs(fokusZiel - fokus) < 0.0005) fokus = fokusZiel;
        hinweisSchritt(dt);
        ringZeichnen();
        dinge.forEach(o => { o.t += dt; if (o.weg) o.weg += dt; });
        if (aus || api.abgebrochen()) { if (!aus && tonGriff) { tonGriff.aus(0.1); tonGriff = null; } aus = true; hinweisEnde(); return; }
        if (phase === 'start') { uhr -= dt; if (uhr <= 0) naechstes(); return; }
        if (!ziel) return;
        const d = uhrTon.schritt(dt / tempo) * tempo;   // Spieluhr folgt der Audiouhr, solange Ton läuft
        ziel.t += d;
        if (phase === 'zeigen' && ziel.t >= ziel.ansageAb) ansagen(d);
        if (phase === 'suchen') {
          const seit = seitAnsage(), $a = document.getElementById('fkAnsage');
          if (seit >= ziel.textNach && $a.hidden) G.ansage.zeigen({ bild: G.LAUTSPRECHER, text: ziel.m.name, klein: true, hoert: tonHoerbar() });
          if (!$a.hidden) G.ansage.hoert(tonHoerbar());
          if (seit >= ziel.zeit) ergebnis('verpasst', ziel.o);
        }
        if (phase === 'pause') {
          const vorher = uhr;
          uhr -= dt;
          // das Ziel geht (und manchmal ein weiteres Ding), danach kommt Neues an freie Stellen
          if (vorher >= 0.5 && uhr < 0.5) {
            ziel.o.weg = 0.001;
            if (Math.random() < (W.wechsel || 0)) { const andere = dinge.filter(o => !o.weg && !o.ziel); if (andere.length > 3) andere[Math.floor(Math.random() * andere.length)].weg = 0.001; }
          }
          if (uhr <= 0) {
            dinge = dinge.filter(o => !o.weg); dinge.forEach(o => { o.ziel = false; });
            nr++; ziel = null;
            if (api.abgebrochen()) { aus = true; return; }
            if (nr < N) fuellen(nr);
            naechstes();
          }
        }
      },
      tipp(x, y) {
        if (!ziel || aus || (phase !== 'zeigen' && phase !== 'suchen')) return false;
        // Trefferfläche mindestens 44 × 44 px; liegt der Finger auf dem Ziel, zählt das Ziel (Treffer-Vorrang)
        const flaeche = o => { const b = o.box, w = Math.max(44, b.w + 12), h = Math.max(44, b.h + 12), cx = b.x + b.w / 2, cy = b.y + b.h / 2; return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy }; };
        const unter = dinge.filter(o => !o.weg && o.t > 0.2).map(o => ({ o, f: flaeche(o) })).filter(({ f }) => x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h);
        const z = unter.find(u => u.o.ziel) || unter.sort((a, b) => Math.hypot(x - a.f.cx, y - a.f.cy) - Math.hypot(x - b.f.cx, y - b.f.cy))[0];
        if (!z) return false;
        if (phase === 'zeigen') return false;   // vor der Ansage zählt Tippen nicht (MZ, 26.10.2026, Spielertest)
        if (z.o.ziel) {
          if (Math.abs(z.o.tiefe - fokus) <= toleranz()) ergebnis('treffer', z.o);
          else ergebnis('falsch', z.o, 'unscharf');
        } else ergebnis('falsch', z.o, 'ziel');
        return true;
      },
      zeichne(g, b, h, laeuft) {
        if (!scharf) return;
        if (!dinge.length && !laeuft) { g.drawImage(scharf, 0, 0, B, H); return; }
        hgZusammen(fokus);
        g.drawImage(hgC, 0, 0, B, H);
        const bm = bmax(), ws = weite();
        // von hinten nach vorn: erst Schatten, dann Ding
        dinge.slice().sort((p, q) => p.ys - q.ys).forEach(o => {
          const rein = Math.min(1, o.t / (ruhig() ? 0.25 : 0.5)), raus = o.weg ? Math.max(0, 1 - o.weg / 0.45) : 1, al = rein * raus;
          if (al <= 0) return;
          const u = Math.min(1, Math.abs(o.tiefe - fokus) / ws), pad = o.bild.pad, s = o.schatten;
          SZ.zeichneUnscharf(g, s.st, s.x, s.y, s.w, s.h, u, al);
          SZ.zeichneUnscharf(g, o.st, o.x - pad, o.y - pad, o.w + pad * 2, o.h + pad * 2, u, al);
        });
        fx.zeichne(g, B, H, api.oben(), ringRechteck().y - 4);
        void bm;
      },
      // Testhilfe: diese Motive (Namen, auch ohne Bild = Kärtchen) nebeneinander auf dieselbe Fußlinie stellen; anteil =
      // Lage im Band (fern: 0 = hinterste Fußlinie … 1 = Tischkante; nah: 0 = Tischkante … 1 = unten) oder y = Fußlinie in px
      // für alle gleich; Ring auf ihre Tiefe
      // Testhilfe: jedes nahe Motiv (oder die genannten) n-mal auf leeren Platz stellen (echte Platzwahl) → kleinste/größte Höhe in px
      testPlaetze(n, namen) {
        n = n || 40;
        const nah = pool().filter(m => (namen ? namen.includes(m.name) : m.entfernung === 'nah'));
        return { minPx: +nahMinPx().toFixed(1), motive: nah.map(m => {
          let lo = Infinity, hi = 0, yLo = Infinity, yHi = 0, ok = 0, anteil = 0;
          for (let i = 0; i < n; i++) {
            const q = stellen(m, m.entfernung === 'fern', []); if (!q) continue;
            ok++; lo = Math.min(lo, q.hv); hi = Math.max(hi, q.hv); yLo = Math.min(yLo, q.ys); yHi = Math.max(yHi, q.ys);
            if (q.fern) { const xf = geo.bx(q.xs), h0 = geo.sy(geo.hinten(xf)), k0 = geo.sy(geo.kante(xf)); anteil = Math.max(anteil, (q.ys - h0) / Math.max(1, k0 - h0)); }
          }
          // anteilMax (nur fern): größter Abstand von der hintersten Fußlinie als Anteil des Pflasters (0 = ganz hinten, 1 = Tischkante)
          return { name: m.name, hoehe: hoeheVon(m), szene: +hoeheSzene(m).toFixed(3), gestellt: ok, minPx: Math.round(lo), maxPx: Math.round(hi), fussVon: Math.round(yLo), fussBis: Math.round(yHi), anteilMax: +anteil.toFixed(3) };
        }) };
      },
      testSzene(namen, o) {
        o = o || {};
        const liste = namen.map(n => allePool().find(m => m.name === n)).filter(Boolean);
        if (!liste.length) return null;
        dinge = []; if (ziel) { ziel = null; } phase = 'test';
        const n = liste.length, ring = ringRechteck();
        liste.forEach((m, i) => {
          const fern = m.entfernung === 'fern', xs = B * (i + 1) / (n + 1), xf = geo.bx(xs);
          const a = o.anteil != null ? o.anteil : 0.5;
          const ys = o.y != null ? o.y : fern ? geo.sy(geo.hinten(xf)) + a * (geo.sy(geo.kante(xf)) - geo.sy(geo.hinten(xf))) : geo.sy(geo.kante(xf)) + a * (Math.min(H, ring.y) - geo.sy(geo.kante(xf)));
          const img = m.bild ? SZ.bild(m.bild) : null;
          // frei: true = echte Platzwahl (Platzregeln, keine Überlappung) statt fester Fußlinie
          const ob = o.frei ? stellen(m, fern, belegtVon()) : bauen(m, fern, xs, ys, img, img ? lage(img) : { oben: 0, unten: 1, links: 0, rechts: 1, fl: 0.08, fr: 0.92 });
          if (!ob) return;
          ob.img = img; bereiten(ob); ob.t = 1; dinge.push(ob);
        });
        if (!dinge.length) return [];
        fokus = fokusZiel = o.fokus != null ? o.fokus : dinge[0].tiefe; ringStand = -1; hgStand = '';
        return dinge.map(q => ({ name: q.m.name, hoehe: hoeheVon(q.m), szene: +hoeheSzene(q.m).toFixed(3), sichtbarPx: Math.round(q.hv), fussY: Math.round(q.ys), tiefe: +q.tiefe.toFixed(3), bild: !!q.img }));
      },
      zustand() {
        const rr = ringRechteck(), ring = { x: rr.x + rr.w / 2, y: rr.y + rr.h / 2, w: rr.w, h: rr.h, pxJeEinheit: pxJeEinheit() };
        const liste = dinge.filter(o => !o.weg).map(o => ({ name: o.m.name, fern: o.fern, ziel: !!o.ziel, tiefe: +o.tiefe.toFixed(3), x: o.box.x + o.box.w / 2, y: o.box.y + o.box.h / 2,
          w: o.box.w, h: o.box.h, fussX: o.xs, fussY: o.ys, hoehe: hoeheVon(o.m), bild: !!o.img }));
        const ringHinweis = hinweis ? { t: +hinweis.t.toFixed(2), wackeln: +wackeln.toFixed(4), sichtbar: !$h.hidden } : { aus: true, gezeigt: hinweisGezeigt, sichtbar: !$h.hidden };
        if (!ziel) return { nr: nr + 1, phase, fokus, fokusZiel, ring, ringHinweis, dinge: liste };
        const o = ziel.o, jetzt = performance.now();
        const hoerbarPerf = phase === 'zeigen' ? null : ziel.t0 != null ? jetzt + (ziel.t0 + ziel.einsatz - TON.hoerJetzt()) * 1000 : jetzt + (ziel.ansageAb - ziel.t) * 1000 / tempo;
        return { nr: ziel.k + 1, name: ziel.m.name, entfernung: ziel.m.entfernung, phase, t: ziel.t, ansageAb: ziel.ansageAb, zeit: ziel.zeit,
          fokus, fokusZiel, tiefe: o.tiefe, toleranz: toleranz(), weite: weite(), scharf: Math.abs(o.tiefe - fokus) <= toleranz(),
          mitTon: ziel.t0 != null, einsatz: ziel.einsatz, gewartet: ziel.gewartet, hoerbarPerf, seit: phase === 'zeigen' ? null : seitAnsage(), latenz: TON.latenz(),
          x: o.box.x + o.box.w / 2, y: o.box.y + o.box.h / 2, w: o.box.w, h: o.box.h, textAb: ziel.textAb, ring, ringHinweis,
          andere: liste.filter(q => !q.ziel), dinge: liste };
      },
    };
  };

  // Startbild: ein fernes Ding scharf in der Linse (mit Schrift, wenn es ein großes Schild ist)
  let linsenZiel = null, nachladen = false;
  window.FOKUS_LINSE[5] = function (g, d, dpr) {
    const S = window.FOKUS_SCHILDER;
    const p = pool().filter(m => m.entfernung === 'fern' && m.bild);
    if (!linsenZiel || !p.includes(linsenZiel)) linsenZiel = p[Math.floor(Math.random() * p.length)];
    if (!linsenZiel) return;
    const img = SZ.bild(linsenZiel.bild); if (!img) return;
    const sv = img.naturalWidth / img.naturalHeight, h = Math.min(d * 0.5, d * 0.5 / Math.sqrt(sv) * 1.1), w = h * sv;
    const x = (d / 2 - w / 2) * dpr, y = (d * 0.6 - h / 2) * dpr;
    g.drawImage(SZ.motivBild(linsenZiel, h, 0, dpr).c, x, y, w * dpr, h * dpr);
    if (S && S.hat(linsenZiel) && !S.bereit()) {
      if (!nachladen) { nachladen = true; S.beiBereit(() => { nachladen = false; if (window.FOKUS_SCHIRME && window.FOKUS_SCHIRME.malen) window.FOKUS_SCHIRME.malen(); }); }
    }
  };
})();
