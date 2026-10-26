// Szene „Fokus“: Level-Bilder und Motive. Solange die gestalteten Bilder (Phase 2, Graphic Artist) fehlen, zeichnet diese
// Datei Platzhalter im Code: Landschaft (Niederbayern, flach-hügelig, keine Berge) und einfache Formen je Bewegungsart.
// Kommt ein Bild (daten.js level[].hintergrund bzw. motive.js bild), wird es geladen und statt des Platzhalters benutzt.
// Unschärfe: je Motiv einmal 8 Stufen vorberechnet (ctx.filter blur, sonst Verkleinern/Vergrößern), beim Zeichnen
// zwischen zwei Stufen überblendet – läuft auch auf schwachen Handys flüssig.
(function () {
  'use strict';
  const D = window.FOKUS;

  // ---------- Zufall mit Startwert (Platzhalter sehen bei jeder Größe gleich aus) ----------
  function zufall(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- Bilder laden (für später) ----------
  // bild(adresse, umfaerben): Bild (bzw. bei umfaerben eine einmal umgefärbte Leinwand: #00FF00 → Kundenfarbe) oder null,
  // solange es lädt. Ist ein Bild fertig, werden die mit beiBild() angemeldeten Funktionen aufgerufen (neu zeichnen).
  const bilder = {}, wartende = [];
  function bild(adresse, umfaerben) {
    if (!adresse) return null;
    const schluessel = adresse + (umfaerben ? '#um' : '');
    if (!bilder[schluessel]) {
      const i = new Image(), b = bilder[schluessel] = { img: i, bereit: false };
      i.onload = () => {
        try { if (umfaerben && window.Rahmen && window.Rahmen.umfaerben) b.img = window.Rahmen.umfaerben(i); } catch (e) { /* ohne Umfärben */ }
        b.bereit = true;
        wartende.slice().forEach(f => { try { f(adresse); } catch (e) { /* egal */ } });
      };
      // Fehler: Platzhalter bleibt – auch dann die Wartenden wecken (Startbild-Linse wartet sonst ewig)
      i.onerror = () => { b.fehler = true; wartende.slice().forEach(f => { try { f(adresse); } catch (e) { /* egal */ } }); };
      i.src = adresse;
    }
    const b = bilder[schluessel];
    return b.bereit ? b.img : null;
  }
  // fertig = Bild da oder Laden gescheitert (dann zeichnet der Platzhalter) – kein Zwischenstand, der sich sichtbar nachbaut
  function fertig(adresse, umfaerben) {
    if (!adresse) return true;
    bild(adresse, umfaerben);
    const b = bilder[adresse + (umfaerben ? '#um' : '')];
    return !!(b && (b.bereit || b.fehler));
  }
  // laden([[adresse, umfaerben], …]) → Promise, erfüllt, sobald alle fertig sind (geladen oder gescheitert)
  function laden(liste) {
    const offen = () => liste.filter(e => e && !fertig(e[0], e[1]));
    if (!offen().length) return Promise.resolve(true);
    return new Promise(ok => { const f = () => { if (!offen().length) { const i = wartende.indexOf(f); if (i >= 0) wartende.splice(i, 1); ok(true); } }; wartende.push(f); });
  }
  // Lage des sichtbaren Motivs im Bild (Alpha): oben/unten/links/rechts als Anteil, unten = Fußpunkt; fl/fr = Breite der
  // untersten Zeilen (Kontaktschatten unter Rädern/Füßen). Einmal je Bild. (Level 5 und Startbild-Linse)
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
  // Standfläche entlang der Unterkante (daten.js weitblick.standKontur, MZ 27.10.2026: Hahn auf rundem Sockel wirkte
  // schwebend – die Unterkante ist gewölbt, der Schatten am tiefsten Punkt lag nur unter einer Ecke): je Spalte der unterste
  // sichtbare Punkt, nur wo er höchstens `ab` (Anteil der Motivhöhe) über dem tiefsten Punkt liegt. Punkte [fx, fy] als
  // Anteil des Bilds, von links nach rechts. Einmal je Bild.
  const konturen = {};
  function kontur(img, ab) {
    const k = img.src + '|' + ab;
    if (konturen[k]) return konturen[k];
    const n = 96, s = n / Math.max(img.naturalWidth, img.naturalHeight), cw = Math.max(2, Math.round(img.naturalWidth * s)), ch = Math.max(2, Math.round(img.naturalHeight * s));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, cw, ch);
    let d;
    try { d = g.getImageData(0, 0, cw, ch).data; } catch (e) { return (konturen[k] = null); }
    const a = lage(img), grenze = (a.unten - (a.unten - a.oben) * ab) * ch, pts = [];
    for (let x = 0; x < cw; x++) {
      let u = -1;
      for (let y = ch - 1; y >= 0; y--) if (d[(y * cw + x) * 4 + 3] > 100) { u = y; break; }
      if (u >= 0 && u + 1 >= grenze) pts.push([(x + 0.5) / cw, (u + 1) / ch]);
    }
    return (konturen[k] = pts.length >= 3 ? pts : null);
  }
  // Umriss des sichtbaren Motivs (MZ, 27.10.2026: L5-Linse – Motiv nie angeschnitten, mit Luft zum Rand): je Spalte der
  // oberste und unterste, je Zeile der linkeste und rechteste sichtbare Punkt, als Anteil des Bilds. Einmal je Bild.
  const umrisse = {};
  function umriss(img) {
    const k = img.src;
    if (umrisse[k]) return umrisse[k];
    const n = 96, s = n / Math.max(img.naturalWidth, img.naturalHeight), cw = Math.max(2, Math.round(img.naturalWidth * s)), ch = Math.max(2, Math.round(img.naturalHeight * s));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, cw, ch);
    let d;
    try { d = g.getImageData(0, 0, cw, ch).data; } catch (e) { return (umrisse[k] = null); }
    const sicht = (x, y) => d[(y * cw + x) * 4 + 3] > 60, pts = [];
    for (let x = 0; x < cw; x++) {
      let o = -1, u = -1;
      for (let y = 0; y < ch; y++) if (sicht(x, y)) { if (o < 0) o = y; u = y; }
      if (o >= 0) { pts.push([(x + 0.5) / cw, o / ch]); pts.push([(x + 0.5) / cw, (u + 1) / ch]); }
    }
    for (let y = 0; y < ch; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < cw; x++) if (sicht(x, y)) { if (l < 0) l = x; r = x; }
      if (l >= 0) { pts.push([l / cw, (y + 0.5) / ch]); pts.push([(r + 1) / cw, (y + 0.5) / ch]); }
    }
    return (umrisse[k] = pts.length ? pts : null);
  }
  // Kontaktschatten entlang einer Linie (Punkte in Zeichen-Koordinaten): Kette weicher Flecken, Abstand ca. 0,6 × rx
  function kette(g, pts, rx, ry, a0, a1) {
    let vor = null;
    for (const p of pts) {
      if (vor && Math.hypot(p[0] - vor[0], p[1] - vor[1]) < rx * 0.6) continue;
      const v = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      v.addColorStop(0, `rgba(0,0,0,${a0})`); v.addColorStop(0.5, `rgba(0,0,0,${a1})`); v.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(p[0], p[1]); g.scale(Math.max(1, rx), Math.max(1, ry)); g.fillStyle = v; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
      vor = p;
    }
  }
  // Ausgleichsgerade durch die Punkte: Schwerpunkt und Neigung (Bogenmaß)
  function gerade(pts) {
    const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, sxy = 0;
    pts.forEach(p => { sxx += (p[0] - mx) * (p[0] - mx); sxy += (p[0] - mx) * (p[1] - my); });
    return { x: mx, y: my, winkel: sxx > 0 ? Math.atan(sxy / sxx) : 0 };
  }
  const breite = i => i.naturalWidth || i.width, hoehe = i => i.naturalHeight || i.height;
  function cover(g, img, w, h, fx, fy) {
    const s = Math.max(w / breite(img), h / hoehe(img)), iw = breite(img) * s, ih = hoehe(img) * s;
    g.drawImage(img, (w - iw) * (fx == null ? 0.5 : fx), (h - ih) * (fy == null ? 0.5 : fy), iw, ih);
  }

  // ---------- Level-Bild: Adresse je Bildschirmform und Lage auf dem Bildschirm ----------
  function hgAdresse(nr, w, h) {
    const lv = D.level[nr - 1] || {}, hg = lv.hintergrund;
    return hg && typeof hg === 'object' ? (h > w ? hg.hoch || hg.quer : hg.quer || hg.hoch) : hg;
  }
  // abbildung(nr, B, H): wie das Level-Bild („cover“, Ausschnitt position) auf dem Bildschirm liegt. x(fx)/y(fy) rechnen
  // einen Punkt im Bild (Anteil 0–1) in Bildschirm-Pixel um; zone(name) liefert die eingemessene Zone aus daten.js
  // (level[].zonen.hoch/quer, Anteile des Bilds). bereit = false, solange das Bild lädt (dann gilt der Platzhalter).
  function abbildung(nr, w, h) {
    const lv = D.level[nr - 1] || {}, adresse = hgAdresse(nr, w, h), img = bild(adresse, lv.umfaerben), pos = lv.position || [0.5, 0.5];
    const zonen = lv.zonen ? (h > w ? lv.zonen.hoch || lv.zonen.quer : lv.zonen.quer || lv.zonen.hoch) : null;
    if (!img) return { bereit: false, x: fx => fx * w, y: fy => fy * h, s: 1, zone: n => (zonen ? zonen[n] : null), zonen };
    const s = Math.max(w / breite(img), h / hoehe(img)), iw = breite(img) * s, ih = hoehe(img) * s;
    const ox = (w - iw) * pos[0], oy = (h - ih) * pos[1];
    return { bereit: true, x: fx => ox + fx * iw, y: fy => oy + fy * ih, s, iw, ih, zone: n => (zonen ? zonen[n] : null), zonen };
  }

  // ---------- Geometrie der Landschaft (Level 1) ----------
  // Horizont und Zonen als Anteil der Höhe; die Kopfzeile (ca. 100 px) bleibt frei.
  // Mit gestaltetem Bild: Zonen am Bild eingemessen (daten.js level[0].zonen), auf den Bildschirm umgerechnet.
  function geometrie(w, h) {
    const A = abbildung(1, w, h), Z = A.zonen;
    if (A.bereit && Z) {
      const oben = Math.max(h * 0.13, Math.min(112, h * 0.3)), y = A.y;
      const himmel = [Math.max(oben, y(Z.himmel[0])), Math.max(oben + 10, y(Z.himmel[1]))];
      const feld = [y(Z.feld[0]), Math.min(h * 0.86, y(Z.feld[1]))];
      return { horizont: y(Z.horizont), himmel, fern: y(Z.horizont) - h * 0.004, feld, weg: Math.min(h * 0.93, y(Z.weg)) };
    }
    const hoch = h > w;
    const horizont = h * (hoch ? 0.47 : 0.5);
    const oben = Math.max(h * 0.13, Math.min(112, h * 0.3));
    return {
      horizont,
      himmel: [oben, Math.max(oben + 10, horizont - h * 0.12)],
      fern: horizont - h * 0.012,
      feld: [horizont + h * 0.1, horizont + h * 0.25],
      weg: h * (hoch ? 0.83 : 0.84),
    };
  }

  // ---------- Platzhalter: Landschaft Niederbayern ----------
  function landschaft(g, w, h) {
    const r = zufall(7), G = geometrie(w, h), hz = G.horizont;
    // Himmel
    let v = g.createLinearGradient(0, 0, 0, hz);
    v.addColorStop(0, '#7fb6de'); v.addColorStop(0.7, '#bcdcef'); v.addColorStop(1, '#e6f1f2');
    g.fillStyle = v; g.fillRect(0, 0, w, hz + 2);
    // Sonne als weiches Licht
    const sx = w * 0.8, sy = hz * 0.32, sr = Math.min(w, h) * 0.35;
    v = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
    v.addColorStop(0, 'rgba(255,248,220,.95)'); v.addColorStop(0.12, 'rgba(255,244,210,.7)'); v.addColorStop(1, 'rgba(255,244,210,0)');
    g.fillStyle = v; g.fillRect(0, 0, w, hz);
    // Wolken
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 4; i++) {
      const cx = w * (0.1 + r() * 0.8), cy = hz * (0.2 + r() * 0.45), s = Math.min(w, h) * (0.05 + r() * 0.05);
      for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(cx + (k - 2) * s * 0.8, cy + Math.sin(k * 1.7) * s * 0.18, s * (1 - Math.abs(k - 2) * 0.18), s * 0.55, 0, 0, 7); g.fill(); }
    }
    // ferne Hügel (flach, bläulich) mit Waldsaum und Kirchturm mit Zwiebelhaube
    function huegel(y0, amp, farbe, seed, n) {
      const rr = zufall(seed);
      const ph = [rr() * 6, rr() * 6, rr() * 6];
      g.fillStyle = farbe; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w + 8; x += 8) {
        const u = x / w * n;
        g.lineTo(x, y0 - amp * (0.55 * Math.sin(u * 1.3 + ph[0]) + 0.3 * Math.sin(u * 2.7 + ph[1]) + 0.15 * Math.sin(u * 5.1 + ph[2])));
      }
      g.lineTo(w, h); g.closePath(); g.fill();
    }
    huegel(hz, h * 0.018, '#a9c0b4', 11, 3);
    // Waldsaum in der Ferne
    g.fillStyle = '#7f9e86';
    for (let x = -10; x < w + 10; x += Math.max(5, w / 90)) {
      if (r() < 0.45) continue;
      const s = h * (0.006 + r() * 0.01);
      g.beginPath(); g.ellipse(x, hz - h * 0.004 - s * 0.6, s * 1.2, s, 0, 0, 7); g.fill();
    }
    // Kirche (Dorf in der Ferne)
    const kx = w * 0.3, ky = hz - h * 0.004, ks = Math.max(6, h * 0.012);
    g.fillStyle = '#e9e4d8'; g.fillRect(kx - ks * 1.6, ky - ks * 1.3, ks * 3.2, ks * 1.3);   // Schiff
    g.fillStyle = '#b5523a'; g.beginPath(); g.moveTo(kx - ks * 1.8, ky - ks * 1.3); g.lineTo(kx, ky - ks * 2.1); g.lineTo(kx + ks * 1.8, ky - ks * 1.3); g.fill();
    g.fillStyle = '#f1ede3'; g.fillRect(kx + ks * 1.2, ky - ks * 4, ks * 0.9, ks * 4);         // Turm
    g.fillStyle = '#5c7464'; g.beginPath(); g.ellipse(kx + ks * 1.65, ky - ks * 4.35, ks * 0.62, ks * 0.55, 0, 0, 7); g.fill();   // Zwiebel
    g.fillRect(kx + ks * 1.62, ky - ks * 5.3, ks * 0.07, ks * 0.7);
    // Höfe
    for (let i = 0; i < 3; i++) {
      const hx = w * (0.55 + i * 0.13 + r() * 0.04), hs = ks * (0.8 + r() * 0.3);
      g.fillStyle = '#efe9dc'; g.fillRect(hx, ky - hs * 0.9, hs * 2.2, hs * 0.9);
      g.fillStyle = '#9c4a35'; g.beginPath(); g.moveTo(hx - hs * 0.2, ky - hs * 0.9); g.lineTo(hx + hs * 1.1, ky - hs * 1.6); g.lineTo(hx + hs * 2.4, ky - hs * 0.9); g.fill();
    }
    // Felder: Streifen bis zum Vordergrund
    const farben = ['#b9cf78', '#93b85e', '#d8c779', '#a6c46a', '#7fa955', '#c9d48a'];
    let y = hz;
    for (let i = 0; y < h; i++) {
      const dicke = h * 0.02 * Math.pow(1.55, i);
      g.fillStyle = farben[i % farben.length];
      g.beginPath(); g.moveTo(0, y + dicke + Math.sin(i) * h * 0.006);
      g.quadraticCurveTo(w * 0.5, y - h * 0.008, w, y + Math.cos(i) * h * 0.006);
      g.lineTo(w, h); g.lineTo(0, h); g.fill();
      y += dicke;
    }
    // Feldwege-Linien (Fahrspuren) im Mittelgrund
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(w * (0.1 + i * 0.16), hz + h * 0.02); g.lineTo(w * (-0.3 + i * 0.32), h); g.stroke(); }
    // Bäume am Rand
    function baum(x, yb, s) {
      g.fillStyle = '#6b4f37'; g.fillRect(x - s * 0.06, yb - s * 0.5, s * 0.12, s * 0.5);
      g.fillStyle = '#4f7a3f';
      [[0, -0.75, 0.42], [-0.22, -0.6, 0.3], [0.24, -0.62, 0.32], [0, -1.02, 0.3]].forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(x + dx * s, yb + dy * s, rr * s, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(x - s * 0.1, yb - s * 0.9, s * 0.18, 0, 7); g.fill();
    }
    baum(w * 0.08, hz + h * 0.06, h * 0.13);
    baum(w * 0.93, hz + h * 0.045, h * 0.1);
    baum(w * 0.74, hz + h * 0.012, h * 0.045);
    // Weg (Kiesweg) unten
    const wy = G.weg;
    g.fillStyle = '#d9cba5';
    g.beginPath(); g.moveTo(0, wy - h * 0.02); g.quadraticCurveTo(w * 0.5, wy - h * 0.05, w, wy - h * 0.025);
    g.lineTo(w, wy + h * 0.035); g.quadraticCurveTo(w * 0.5, wy + h * 0.005, 0, wy + h * 0.04); g.fill();
    g.fillStyle = 'rgba(120,100,70,.18)';
    for (let i = 0; i < 80; i++) { g.fillRect(r() * w, wy - h * 0.03 + r() * h * 0.06, 2, 1); }
    // Vordergrund: Gras
    v = g.createLinearGradient(0, wy + h * 0.03, 0, h);
    v.addColorStop(0, '#6e9d4a'); v.addColorStop(1, '#4b7a35');
    g.fillStyle = v;
    g.beginPath(); g.moveTo(0, wy + h * 0.04); g.quadraticCurveTo(w * 0.5, wy + h * 0.005, w, wy + h * 0.035); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.strokeStyle = 'rgba(40,70,30,.35)'; g.lineWidth = 1.2;
    for (let i = 0; i < w / 6; i++) { const x = r() * w, yy = wy + h * 0.05 + r() * (h - wy); g.beginPath(); g.moveTo(x, yy); g.lineTo(x + (r() - 0.5) * 6, yy - 6 - r() * 8); g.stroke(); }
  }

  // ---------- Platzhalter der anderen Level (nur Start-/Endbild, bis die Level gebaut sind) ----------
  function ringe(g, w, h) {   // Level 2: helle Wand mit Ringen
    let v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, '#f4f1ea'); v.addColorStop(1, '#dcd6ca');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    const r = zufall(3), s = Math.min(w, h) * 0.09;
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h, rr = s * (0.4 + r() * 0.8), a = Math.floor(r() * 4) * Math.PI / 2;
      g.strokeStyle = 'rgba(30,40,40,.8)'; g.lineWidth = rr * 0.38;
      g.beginPath(); g.arc(x, y, rr, a + 0.35, a + Math.PI * 2 - 0.35); g.stroke();
    }
  }
  function see(g, w, h) {      // Level 3: See mit Spiegelungen
    let v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, '#9fd0dc'); v.addColorStop(0.35, '#4f9fb0'); v.addColorStop(1, '#1f5f6e');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    const r = zufall(5);
    g.strokeStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, l = 20 + r() * 70; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke(); }
    for (let i = 0; i < 6; i++) { const x = r() * w, y = h * (0.4 + r() * 0.5), s = Math.min(w, h) * 0.05; g.fillStyle = 'rgba(230,140,60,.7)'; g.beginPath(); g.ellipse(x, y, s, s * 0.45, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + s, y); g.lineTo(x + s * 1.6, y - s * 0.4); g.lineTo(x + s * 1.6, y + s * 0.4); g.fill(); }
  }
  function kabine(g, w, h) {   // Level 4: stille Hörkabine
    let v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, '#e9e5dc'); v.addColorStop(1, '#c9c2b4');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)';
    for (let x = 0; x < w; x += 18) for (let y = 0; y < h * 0.7; y += 18) { g.beginPath(); g.arc(x + (y / 18 % 2) * 9, y, 2.4, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(15,124,128,.85)'; g.lineWidth = Math.max(3, w * 0.008); g.lineCap = 'round';
    const n = 26, bx = w * 0.15, bw = w * 0.7, y0 = h * 0.6;
    for (let i = 0; i < n; i++) { const x = bx + bw * i / (n - 1), a = h * 0.12 * Math.abs(Math.sin(i * 0.9)) * (1 - Math.abs(i / (n - 1) - 0.5)); g.beginPath(); g.moveTo(x, y0 - a); g.lineTo(x, y0 + a); g.stroke(); }
  }
  function nahFern(g, w, h) {  // Level 5: Straße in die Ferne, Lesekarte vorn
    landschaft(g, w, h);
    const G = geometrie(w, h);
    g.fillStyle = '#9a9a92'; g.beginPath(); g.moveTo(w * 0.47, G.horizont); g.lineTo(w * 0.53, G.horizont); g.lineTo(w * 0.85, h); g.lineTo(w * 0.15, h); g.fill();
    g.fillStyle = '#fff'; g.save(); g.translate(w * 0.2, h * 0.82); g.rotate(-0.12); g.fillRect(-w * 0.12, -h * 0.07, w * 0.24, h * 0.14);
    g.fillStyle = '#555'; for (let i = 0; i < 5; i++) g.fillRect(-w * 0.1, -h * 0.05 + i * h * 0.022, w * (0.2 - i * 0.02), h * 0.008); g.restore();
  }
  const MALER = { 1: landschaft, 2: ringe, 3: see, 4: kabine, 5: nahFern };
  // Bildausschnitt für die Linse im Startbild (Anteil von Breite/Höhe): Horizont mit Dorf bzw. Bildmitte
  const FOKUS_PUNKT = { 1: [0.42, 0.53], 2: [0.5, 0.5], 3: [0.5, 0.6], 4: [0.5, 0.6], 5: [0.3, 0.78] };

  // Level-Bild in eine Leinwand (w × h CSS-Pixel, dpr)
  function levelBild(nr, w, h, dpr) {
    dpr = dpr || 1;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lv = D.level[nr - 1] || {};
    // eine Adresse oder { hoch, quer } – passend zum Seitenverhältnis
    const adresse = hgAdresse(nr, w, h);
    const img = bild(adresse, lv.umfaerben), pos = lv.position || [0.5, 0.5];
    if (img) cover(g, img, w, h, pos[0], pos[1]); else (MALER[nr] || landschaft)(g, w, h);
    return c;
  }

  // ---------- Platzhalter-Motive ----------
  // Farben nach Stichwort (sonst aus dem Namen), Form nach Bewegungsart aus motive.js
  const FARBEN = [
    [/reh|fuchs|hase|eichh|pferd|reiter|hund|igel|fasan|bussard|milan/i, '#9a6034'], [/storch|schaf|lämm|ziege|gans|segel|papier|taube|seifen/i, '#efeee6'],
    [/kuh/i, '#3a3a3a'], [/traktor|mähdrescher|heuwagen|mähroboter/i, '#3f7d3a'], [/bus|zug|paket|müll|schiff/i, '#d0d4d8'],
    [/ballon|drachen|zeppelin/i, '#d9483b'], [/marienk|ahorn/i, '#c8452f'], [/hummel|schmetterling|libelle/i, '#d9a92b'],
    [/krähe|amsel|elster|schwalbe/i, '#2c2f33'], [/kranich|ente|frosch/i, '#6f8a5a'],
  ];
  const BUNT = ['#3b6ea8', '#c8452f', '#e0a43a', '#6d8f3c', '#8d5a9e', '#2f8f8b'];
  function farbe(m) {
    for (const [re, f] of FARBEN) if (re.test(m.name)) return f;
    return BUNT[hash(m.name) % BUNT.length];
  }
  const dunkler = (hex, f) => { const n = parseInt(hex.slice(1), 16); return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * f)).join(',')})`; };
  const MENSCH = /jogger|wanderer|radfahr|rennrad|skate|kinderwagen|roller|lastenrad/i;
  // Seitenverhältnis Breite : Höhe je Form
  function form(m) {
    const n = m.name;
    if (/ballon|seifen|pusteblume/i.test(n)) return 'ballon';
    if (/zeppelin/i.test(n)) return 'zeppelin';
    if (/drachen|papierflieger|ahorn/i.test(n)) return 'drachen';
    if (MENSCH.test(n)) return /radfahr|rennrad|lastenrad|roller/i.test(n) ? 'rad' : 'mensch';
    if (/zug/i.test(n)) return 'zug';
    switch (m.bewegung) {
      case 'fliegt': return /hummel|marienk|schmetterling|libelle/i.test(n) ? 'insekt' : 'vogel';
      case 'schwebt': return /segelflug/i.test(n) ? 'flieger' : 'ballon';
      case 'fährt': return 'fahrzeug';
      case 'hüpft': return 'huepfer';
      default: return 'vierbeiner';
    }
  }
  const SV = { ballon: 0.78, zeppelin: 2.4, drachen: 0.9, rad: 1.3, mensch: 0.55, zug: 4.2, insekt: 1.3, vogel: 1.7, flieger: 2.6, fahrzeug: 1.9, huepfer: 1.15, vierbeiner: 1.45 };

  // Form zeichnen, nach rechts schauend, in ein Kästchen w × h (Ursprung links oben)
  function malen(g, art, w, h, f) {
    const d = dunkler(f, 0.72), dd = dunkler(f, 0.5);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const ell = (x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.fill(); };
    switch (art) {
      case 'vogel':
        ell(w * 0.5, h * 0.55, w * 0.25, h * 0.16, f);
        ell(w * 0.78, h * 0.47, w * 0.09, h * 0.1, f);
        g.fillStyle = '#e0a43a'; g.beginPath(); g.moveTo(w * 0.86, h * 0.46); g.lineTo(w * 0.98, h * 0.5); g.lineTo(w * 0.86, h * 0.52); g.fill();
        g.fillStyle = d; g.beginPath(); g.moveTo(w * 0.42, h * 0.5); g.quadraticCurveTo(w * 0.3, h * 0.02, w * 0.12, h * 0.08); g.quadraticCurveTo(w * 0.35, h * 0.35, w * 0.58, h * 0.52); g.fill();
        g.fillStyle = f; g.beginPath(); g.moveTo(w * 0.27, h * 0.56); g.lineTo(w * 0.02, h * 0.5); g.lineTo(w * 0.05, h * 0.66); g.fill();
        ell(w * 0.8, h * 0.45, w * 0.012, h * 0.018, '#111');
        break;
      case 'insekt':
        ell(w * 0.35, h * 0.35, w * 0.2, h * 0.28, 'rgba(255,255,255,.6)', -0.4);
        ell(w * 0.55, h * 0.58, w * 0.3, h * 0.2, f);
        g.strokeStyle = dd; g.lineWidth = h * 0.06; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * (0.42 + i * 0.12), h * 0.42); g.lineTo(w * (0.42 + i * 0.12), h * 0.74); g.stroke(); }
        ell(w * 0.87, h * 0.55, w * 0.1, h * 0.13, dd);
        break;
      case 'ballon':
        ell(w * 0.5, h * 0.38, w * 0.48, h * 0.37, f);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(w * 0.5, h * 0.38, w * 0.16, h * 0.37, 0, 0, 7); g.fill();
        g.strokeStyle = dd; g.lineWidth = Math.max(1, w * 0.02); g.beginPath(); g.moveTo(w * 0.32, h * 0.7); g.lineTo(w * 0.42, h * 0.86); g.moveTo(w * 0.68, h * 0.7); g.lineTo(w * 0.58, h * 0.86); g.stroke();
        g.fillStyle = '#8a5a34'; g.fillRect(w * 0.4, h * 0.86, w * 0.2, h * 0.13);
        break;
      case 'zeppelin':
        ell(w * 0.5, h * 0.45, w * 0.48, h * 0.38, '#d8dadc');
        g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(w * 0.1, h * 0.45, w * 0.8, h * 0.06);
        g.fillStyle = '#9aa0a6'; g.beginPath(); g.moveTo(w * 0.04, h * 0.45); g.lineTo(-w * 0.02, h * 0.15); g.lineTo(w * 0.1, h * 0.4); g.fill();
        g.fillRect(w * 0.42, h * 0.82, w * 0.16, h * 0.12);
        break;
      case 'drachen':
        g.fillStyle = f; g.beginPath(); g.moveTo(w * 0.5, 0); g.lineTo(w * 0.95, h * 0.35); g.lineTo(w * 0.5, h * 0.75); g.lineTo(w * 0.05, h * 0.35); g.fill();
        g.strokeStyle = dd; g.lineWidth = Math.max(1, w * 0.025); g.beginPath(); g.moveTo(w * 0.5, h * 0.75); g.quadraticCurveTo(w * 0.3, h * 0.88, w * 0.45, h); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(w * 0.5, 0); g.lineTo(w * 0.5, h * 0.75); g.moveTo(w * 0.05, h * 0.35); g.lineTo(w * 0.95, h * 0.35); g.stroke();
        break;
      case 'flieger':
        ell(w * 0.5, h * 0.55, w * 0.42, h * 0.12, '#f4f4f0');
        g.fillStyle = '#e4e4de'; g.fillRect(w * 0.15, h * 0.42, w * 0.6, h * 0.08);
        g.fillStyle = '#c8452f'; g.beginPath(); g.moveTo(w * 0.1, h * 0.5); g.lineTo(w * 0.04, h * 0.15); g.lineTo(w * 0.16, h * 0.46); g.fill();
        ell(w * 0.72, h * 0.5, w * 0.07, h * 0.08, '#6fa3c9');
        break;
      case 'fahrzeug': {
        g.fillStyle = f; g.beginPath(); g.roundRect ? g.roundRect(w * 0.04, h * 0.3, w * 0.92, h * 0.48, h * 0.08) : g.rect(w * 0.04, h * 0.3, w * 0.92, h * 0.48); g.fill();
        g.fillStyle = dunkler(f, 0.85); g.fillRect(w * 0.6, h * 0.06, w * 0.3, h * 0.3);
        g.fillStyle = '#bfe0ee'; g.fillRect(w * 0.64, h * 0.1, w * 0.22, h * 0.2);
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(w * 0.04, h * 0.32, w * 0.92, h * 0.06);
        [0.22, 0.78].forEach(x => { ell(w * x, h * 0.8, h * 0.19, h * 0.19, '#222'); ell(w * x, h * 0.8, h * 0.08, h * 0.08, '#999'); });
        break;
      }
      case 'zug':
        for (let i = 0; i < 3; i++) { g.fillStyle = i ? '#b8423a' : '#d9dde0'; g.fillRect(w * (0.02 + i * 0.33), h * 0.2, w * 0.31, h * 0.62); g.fillStyle = '#9ec7da'; g.fillRect(w * (0.05 + i * 0.33), h * 0.3, w * 0.25, h * 0.18); }
        g.fillStyle = '#333'; g.fillRect(0, h * 0.82, w, h * 0.08);
        break;
      case 'rad':
        [0.22, 0.78].forEach(x => { g.strokeStyle = '#222'; g.lineWidth = h * 0.05; g.beginPath(); g.arc(w * x, h * 0.75, h * 0.2, 0, 7); g.stroke(); });
        g.strokeStyle = f; g.lineWidth = h * 0.05; g.beginPath(); g.moveTo(w * 0.22, h * 0.75); g.lineTo(w * 0.45, h * 0.5); g.lineTo(w * 0.7, h * 0.5); g.lineTo(w * 0.78, h * 0.75); g.moveTo(w * 0.45, h * 0.5); g.lineTo(w * 0.52, h * 0.75); g.stroke();
        g.strokeStyle = dd; g.lineWidth = h * 0.09; g.beginPath(); g.moveTo(w * 0.47, h * 0.44); g.lineTo(w * 0.6, h * 0.18); g.lineTo(w * 0.7, h * 0.45); g.stroke();
        ell(w * 0.63, h * 0.1, h * 0.08, h * 0.08, '#e7c3a0');
        break;
      case 'mensch':
        ell(w * 0.5, h * 0.09, w * 0.16, h * 0.08, '#e7c3a0');
        g.fillStyle = f; g.beginPath(); g.roundRect ? g.roundRect(w * 0.28, h * 0.18, w * 0.44, h * 0.38, w * 0.12) : g.rect(w * 0.28, h * 0.18, w * 0.44, h * 0.38); g.fill();
        g.strokeStyle = '#3d4a5c'; g.lineWidth = w * 0.18; g.beginPath(); g.moveTo(w * 0.45, h * 0.55); g.lineTo(w * 0.25, h * 0.96); g.moveTo(w * 0.55, h * 0.55); g.lineTo(w * 0.78, h * 0.94); g.stroke();
        break;
      case 'huepfer':
        ell(w * 0.45, h * 0.58, w * 0.32, h * 0.24, f, -0.2);
        ell(w * 0.78, h * 0.36, w * 0.15, h * 0.15, f);
        ell(w * 0.74, h * 0.1, w * 0.04, h * 0.14, d, -0.2); ell(w * 0.82, h * 0.1, w * 0.04, h * 0.14, d, 0.15);
        ell(w * 0.3, h * 0.82, w * 0.2, h * 0.08, d);
        ell(w * 0.85, h * 0.34, w * 0.015, h * 0.02, '#111');
        break;
      default:   // Vierbeiner
        ell(w * 0.47, h * 0.45, w * 0.32, h * 0.2, f);
        g.strokeStyle = d; g.lineWidth = w * 0.06;
        [[0.25, 0.2], [0.33, 0.36], [0.6, 0.66], [0.68, 0.8]].forEach(([a, b]) => { g.beginPath(); g.moveTo(w * a, h * 0.55); g.lineTo(w * b - w * 0.08, h * 0.97); g.stroke(); });
        ell(w * 0.84, h * 0.28, w * 0.12, h * 0.12, f);
        g.fillStyle = f; g.beginPath(); g.moveTo(w * 0.7, h * 0.38); g.lineTo(w * 0.8, h * 0.2); g.lineTo(w * 0.86, h * 0.36); g.fill();
        g.strokeStyle = f; g.lineWidth = w * 0.035; g.beginPath(); g.moveTo(w * 0.16, h * 0.4); g.quadraticCurveTo(w * 0.04, h * 0.45, w * 0.05, h * 0.62); g.stroke();
        ell(w * 0.89, h * 0.25, w * 0.012, h * 0.02, '#111');
    }
  }

  // Motiv als Leinwand (Gerätepixel), Höhe hCss, Rand pad für die Unschärfe. Gibt { c, w, h, pad } in CSS-Pixeln zurück.
  // wCss (optional): eigene Breite – Level 5 staucht flach liegende Dinge (Kassenbon) nur in der Höhe
  function motivBild(m, hCss, pad, dpr, wCss) {
    const img = bild(m.bild);
    const sv = img ? breite(img) / hoehe(img) : (SV[form(m)] || 1.4);
    const w = wCss > 0 ? wCss : hCss * sv, h = hCss;
    const c = document.createElement('canvas');
    c.width = Math.ceil((w + pad * 2) * dpr); c.height = Math.ceil((h + pad * 2) * dpr);
    // Motive mit Schrift: Leinwand im Arbeitsspeicher (schilder.js liest die Fläche einmal aus – sonst teures Zurücklesen von der Grafikkarte)
    const lesen = !!(img && window.FOKUS_SCHILDER && window.FOKUS_SCHILDER.hat(m));
    const g = c.getContext('2d', lesen ? { willReadFrequently: true } : undefined); g.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
    if (img) {
      g.drawImage(img, 0, 0, w, h);
      // Level 5: Schrift auf Schildern/Anzeigen als eigene Ebene (schilder.js) – vor dem Weichzeichnen, damit sie mitverschwimmt
      if (window.FOKUS_SCHILDER) window.FOKUS_SCHILDER.auftragen(c, m, pad * dpr, pad * dpr, w * dpr, h * dpr);
    }
    else {
      malen(g, form(m), w, h, farbe(m));
      if (/kuh/i.test(m.name)) { g.fillStyle = '#f4f4ef'; [[0.35, 0.42], [0.55, 0.5], [0.45, 0.36]].forEach(([x, y]) => { g.beginPath(); g.ellipse(w * x, h * y, w * 0.07, h * 0.07, 0, 0, 7); g.fill(); }); }
    }
    return { c, w, h, pad };
  }

  // ---------- Startbild-Linse: Motiv steht auf dem Boden (MZ, 26.10.2026: „Motive hängen in der Luft“) ----------
  // Maße eines Motivs mit sichtbarer Höhe hPx (CSS-px), alles relativ zum Fußpunkt (Mitte unten des sichtbaren Motivs)
  function stehendMass(m, hPx) {
    const img = m && m.bild ? bild(m.bild) : null; if (!img) return null;
    const a = lage(img), hb = hPx / Math.max(0.2, a.unten - a.oben), w = hb * breite(img) / hoehe(img), mitte = (a.links + a.rechts) / 2;
    return { img, a, hb, w, mitte, links: (a.links - mitte) * w, rechts: (a.rechts - mitte) * w, oben: -(a.unten - a.oben) * hb };
  }
  // Kontaktschatten (dichter Kern unter Füßen/Rädern, weicher Hof) und Schlagschatten nach rechts hinten (Licht von links
  // oben wie in den Level-Bildern), danach das Motiv. g in Gerätepixeln, x/y = Fußpunkt in CSS-px.
  // o.flach = Abflachung des Bodens (Augenhöhe/Abstand), o.wurf = Länge Schlagschatten (Anteil der Breite), o.staerke
  function stehendMalen(g, m, x, y, hPx, dpr, o) {
    o = o || {};
    const s = stehendMass(m, hPx); if (!s) return null;
    const { a, hb, w } = s, left = x - s.mitte * w, top = y - a.unten * hb, sw = (a.rechts - a.links) * w;
    const fuss = Math.max(4, (a.fr - a.fl) * w * 1.1, sw * 0.55), fx = left + (a.fl + a.fr) / 2 * w;
    const hoch = Math.max(2.5, fuss * (o.flach || 0.2)), st = o.staerke || 1, wurf = o.wurf == null ? 0.35 : o.wurf;
    g.save(); g.scale(dpr, dpr);
    const fleck = (cx, cy, rx, ry, a0, a1) => {
      const v = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      v.addColorStop(0, `rgba(0,0,0,${a0})`); v.addColorStop(0.5, `rgba(0,0,0,${a1})`); v.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(cx, cy); g.scale(Math.max(1, rx), Math.max(1, ry)); g.fillStyle = v; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
    };
    // gewölbte Unterkante (daten.js weitblick.standKontur, z. B. Hahn auf rundem Sockel): Schatten folgt der ganzen Kante
    const ab = D.weitblick && D.weitblick.standKontur && D.weitblick.standKontur[m.name];
    const kp = ab ? kontur(s.img, ab) : null;
    if (kp) {
      const pts = kp.map(p => [left + p[0] * w, top + p[1] * hb]), gr = gerade(pts);
      const kb = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0])), br = Math.max(fuss, kb * 1.08), ho = Math.max(2.5, br * (o.flach || 0.2));
      const rund = (cx, cy, rx, ry, a0, a1) => { g.save(); g.translate(cx, cy); g.rotate(gr.winkel); fleck(0, 0, rx, ry, a0, a1); g.restore(); };
      if (wurf > 0) { const ww = sw * wurf; rund(gr.x + ww * 0.5, gr.y - ho * 0.18, (br + ww) / 2, ho * 0.75, 0.3 * st, 0.16 * st); }
      rund(gr.x, gr.y, br / 2, ho * 0.55, 0.62 * st, 0.34 * st);
      const fh = Math.max(2, ho * 0.42);
      kette(g, pts.map(p => [p[0], p[1] - fh * 0.1]), fh * 1.3, fh / 2, Math.min(0.8, 0.55 * st), Math.min(0.5, 0.32 * st));
    } else {
      if (wurf > 0) { const ww = sw * wurf; fleck(fx + ww * 0.5, y - hoch * 0.18, (fuss + ww) / 2, hoch * 0.75, 0.3 * st, 0.16 * st); }
      fleck(fx, y, fuss / 2, hoch / 2, 0.62 * st, 0.34 * st);
      // Ansatz direkt unter Füßen/Rädern: dunkler, kompakter Kern (wie in Weitblick)
      const fb = Math.max(3, (a.fr - a.fl) * w);
      fleck(fx, y - hoch * 0.06, fb / 2, Math.max(1.2, Math.min(hoch * 0.22, fb * (o.flach || 0.2) * 0.45)), Math.min(0.9, 0.78 * st), Math.min(0.6, 0.48 * st));
    }
    g.restore();
    const mb = motivBild(m, hb, 0, dpr);   // Level 5: Schrift auf Schildern kommt mit
    if (kp) {   // Kante leicht abgedunkelt – sitzt im Pflaster
      const kg = mb.c.getContext('2d'); kg.save(); kg.setTransform(dpr, 0, 0, dpr, 0, 0); kg.globalCompositeOperation = 'source-atop';
      const r = Math.max(1.2, hPx * 0.04);
      kette(kg, kp.map(p => [p[0] * w, p[1] * hb]), r * 1.4, r, 0.42, 0.2);
      kg.restore();
    }
    g.drawImage(mb.c, left * dpr, top * dpr, w * dpr, hb * dpr);
    return { x, y, h: hPx, links: x + s.links, rechts: x + s.rechts, oben: y + s.oben };
  }
  // Fußpunkt wählen: punkte = Fußpunkte im Level-Bild (Anteile, von nah nach fern), meter(yf) = CSS-px je Meter an der
  // Fußlinie, hm = echte Höhe in m. Nimmt den nächsten Punkt, an dem das Motiv samt Schatten ganz in der Linse liegt und
  // höchstens o.maxH × Durchmesser hoch ist; passt es nirgends, steht es am fernsten Punkt und wird verkleinert.
  // o.luft (Anteil des Durchmessers, z. B. 0,09): strenger – jeder Punkt des Umrisses (szene.umriss) hält diesen Abstand zum
  // Linsenrand, nur Füße/Räder (unterste 10 % der Motivhöhe) und der Kontaktschatten dürfen bis o.luftUnten heran; passt
  // es nirgends, kommt { passt: false } zurück (nichts verkleinert – das Motiv wird dann nicht gewählt).
  function bodenWahl(ans, m, punkte, meter, hm, o) {
    o = o || {};
    const d = ans.d, r = d / 2 * (1 - (o.rand || 0.05)), maxH = (o.maxH || 0.55) * d;
    const drin = (x, y) => (x - d / 2) * (x - d / 2) + (y - d / 2) * (y - d / 2) <= r * r;
    const abst = (x, y) => d / 2 - Math.hypot(x - d / 2, y - d / 2);   // Abstand zum Linsenrand (innen positiv)
    const passtStreng = (x, y, h) => {
      const s = stehendMass(m, h), U = s && umriss(s.img); if (!U || h > maxH) return false;
      const lo = o.luft * d, lu = (o.luftUnten == null ? 0.03 : o.luftUnten) * d, fussAb = s.a.unten - (s.a.unten - s.a.oben) * 0.1;
      for (const [u, v] of U) {
        const px = x + (u - s.mitte) * s.w, py = y + (v - s.a.unten) * s.hb;
        if (abst(px, py) < (v >= fussAb ? lu : lo)) return false;
      }
      const fuss = Math.max(4, (s.a.fr - s.a.fl) * s.w * 1.1, (s.a.rechts - s.a.links) * s.w * 0.55), fx = x + ((s.a.fl + s.a.fr) / 2 - s.mitte) * s.w;
      return abst(fx - fuss / 2, y) >= lu && abst(fx + fuss / 2, y) >= lu && abst(fx, y + Math.max(3, h * 0.04)) >= lu;
    };
    const passt = (x, y, h) => {
      if (o.luft > 0) return passtStreng(x, y, h);
      const s = stehendMass(m, h); if (!s || h > maxH) return false;
      const sl = x + s.links, sr = x + s.rechts + (s.rechts - s.links) * 0.08, ob = y + s.oben, un = y + Math.max(3, h * 0.04);
      return drin(sl, ob) && drin(sr, ob) && drin(sl, un) && drin(sr, un) && drin(x, un);
    };
    // Punkte fein unterteilen (zwischen zwei Stützpunkten linear)
    const fein = [];
    for (let i = 0; i < punkte.length; i++) {
      if (i === 0) { fein.push(punkte[0]); continue; }
      const p = punkte[i - 1], q = punkte[i];
      for (let k = 1; k <= 6; k++) fein.push([p[0] + (q[0] - p[0]) * k / 6, p[1] + (q[1] - p[1]) * k / 6]);
    }
    for (const [fx, fy] of fein) { const x = ans.x(fx), y = ans.y(fy), h = hm * meter(fy); if (passt(x, y, h)) return { x, y, h, fx, fy, passt: true }; }
    const [fx, fy] = fein[fein.length - 1], x = ans.x(fx), y = ans.y(fy);
    if (o.luft > 0) return { x, y, h: hm * meter(fy), fx, fy, passt: false };
    let h = hm * meter(fy);
    for (let i = 0; i < 30 && !passt(x, y, h); i++) h *= 0.9;
    return { x, y, h, fx, fy, verkleinert: true };
  }

  // ---------- Unschärfe-Stufen ----------
  let filterGeht = null;
  function filterTest() {
    if (filterGeht == null) {
      const g = document.createElement('canvas').getContext('2d');
      filterGeht = !!g && typeof g.filter === 'string' && (g.filter = 'blur(2px)', g.filter === 'blur(2px)');
    }
    return filterGeht;
  }
  // n Stufen von scharf bis maxPx (Gerätepixel); Stufe k hat k/(n-1) der vollen Unschärfe
  function stufen(quelle, maxPx, n) {
    n = n || 8;
    const liste = [quelle];
    for (let k = 1; k < n; k++) {
      const r = maxPx * k / (n - 1), c = document.createElement('canvas');
      c.width = quelle.width; c.height = quelle.height;
      const g = c.getContext('2d');
      if (filterTest()) { g.filter = `blur(${r.toFixed(2)}px)`; g.drawImage(quelle, 0, 0); }
      else {   // ohne ctx.filter (ältere Safari): verkleinern und wieder vergrößern, zweimal
        const f = 1 / (1 + r * 0.6), k1 = document.createElement('canvas');
        k1.width = Math.max(1, Math.round(c.width * f)); k1.height = Math.max(1, Math.round(c.height * f));
        const g1 = k1.getContext('2d'); g1.imageSmoothingQuality = 'high'; g1.drawImage(quelle, 0, 0, k1.width, k1.height);
        g.imageSmoothingQuality = 'high'; g.drawImage(k1, 0, 0, c.width, c.height);
        g1.clearRect(0, 0, k1.width, k1.height); g1.drawImage(c, 0, 0, k1.width, k1.height);
        g.clearRect(0, 0, c.width, c.height); g.drawImage(k1, 0, 0, c.width, c.height);
      }
      liste.push(c);
    }
    return liste;
  }
  // Zeichnen mit Unschärfe-Anteil u (0 = scharf, 1 = volle Unschärfe): zwei Nachbarstufen genau gemischt
  // ((1−f)·A + f·B auf einer Zwischen-Leinwand mit „lighter“), damit es beim Stufenwechsel nicht springt
  const zw = document.createElement('canvas'), zg = zw.getContext('2d');
  function zeichneUnscharf(g, st, x, y, w, h, u, alpha) {
    const n = st.length, p = Math.max(0, Math.min(1, u)) * (n - 1), i = Math.min(n - 1, Math.floor(p)), f = p - i;
    g.save();
    g.globalAlpha = alpha == null ? 1 : alpha;
    if (f < 0.02 || i + 1 >= n) g.drawImage(st[i], x, y, w, h);
    else if (f > 0.98) g.drawImage(st[i + 1], x, y, w, h);
    else {
      const a = st[i];
      if (zw.width !== a.width || zw.height !== a.height) { zw.width = a.width; zw.height = a.height; }
      zg.globalCompositeOperation = 'copy'; zg.globalAlpha = 1 - f; zg.drawImage(a, 0, 0);
      zg.globalCompositeOperation = 'lighter'; zg.globalAlpha = f; zg.drawImage(st[i + 1], 0, 0);
      g.drawImage(zw, x, y, w, h);
    }
    g.restore();
  }

  window.FOKUS_SZENE = { zufall, hash, bild, fertig, laden, lage, kontur, umriss, kette, gerade, stehendMass, stehendMalen, bodenWahl, levelBild, geometrie, motivBild, stufen, zeichneUnscharf, form, fokusPunkt: nr => (D.level[nr - 1] && D.level[nr - 1].hintergrund && (D.level[nr - 1].linse || D.level[nr - 1].position)) || FOKUS_PUNKT[nr] || [0.5, 0.5],
    beiBild: f => wartende.push(f),
    abbildung, hgAdresse, hgBereit: (nr, w, h) => !!bild(hgAdresse(nr, w, h), (D.level[nr - 1] || {}).umfaerben),
    // Level-Hintergründe vorab laden (danach zeichnen Start-/Endbild und Spiel neu) – nur in der Form des Bildschirms
    // (hoch/quer); die andere Form lädt erst, wenn das Gerät gedreht wird. nur = ein Level zuerst.
    vorladen(nur) {
      const w = innerWidth, h = innerHeight;
      (nur ? [D.level[nur - 1]].concat(D.level) : D.level).forEach(lv => { if (lv) bild(hgAdresse(lv.nr, w, h), lv.umfaerben); });
    } };
})();
