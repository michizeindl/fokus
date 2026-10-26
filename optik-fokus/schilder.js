// Schrift auf den Weitblick-Motiven (Level 5, MZ 26.10.2026): Schilder, Anzeigen, Etiketten, Zettel und Banner sind in den
// gestalteten Bildern leer. Hier wird die Schrift als eigene Ebene darübergelegt – nicht ins Bild eingebrannt, sondern
// beim Aufbau der Motiv-Leinwand (FOKUS_SZENE.motivBild) bzw. in der Linse des Startbilds aufgetragen. Danach wird sie mit
// dem Motiv zusammen weichgezeichnet (Unschärfe-Stufen), ist also bei falscher Brille genauso unscharf wie das Bild.
//
// Daten: optik-fokus/weitblick-schrift.js (ERZEUGT von Material/Skripte/daten-bauen.py) – Text aus dem Entwurf
// (Material/Texte/fokus-weitblick-entwurf.md, Feld „was erkannt werden muss“), Lage/Stil aus
// Material/Skripte/weitblick-schrift-lage.json. Ecken in Prozent des Motivbilds, perspektivisch über vier Ecken
// (Homographie), mit 3×3-Überabtastung; das Licht der Fläche wird übernommen (Schatten, Glanz).
// Schriften (alle SIL OFL 1.1, lokal als WOFF2-Teilmenge in ../schrift/weitblick/) werden erst geladen, wenn Level 5
// sie braucht (FontFace), Poppins kommt aus ../schrift/poppins.css. Siebensegment und Punktmatrix zeichnet der Code.
(function () {
  'use strict';
  const daten = () => window.FOKUS_SCHRIFT || {};
  // nur Weitblick-Motive (gleiche Namen in anderen Leveln, z. B. „Radfahrer“ in Schärfe, bekommen keine Schrift)
  // Schrift nur auf großen, flachen Schildern (MZ, 26.10.2026): Name beginnt mit einem Wort aus daten.js weitblick.schriftNur
  const erlaubt = m => { const l = (window.FOKUS && window.FOKUS.weitblick && window.FOKUS.weitblick.schriftNur) || null; return !l || l.some(w => m.name.startsWith(w)); };
  const eintrag = m => (m && m.bild && /(^|\/)weitblick\//.test(m.bild) && erlaubt(m) && daten()[m.name]) || null;
  const BASIS = '../schrift/weitblick/';
  const DATEIEN = {
    FkVerkehr: 'encode/encodesanssemicondensed-semibold.woff2',   // Encode Sans Semi Condensed SemiBold – Verkehrsschild-Anmutung
    FkHand: 'patrick/patrickhand-regular.woff2',                  // Patrick Hand – Zettel, Etiketten, Kreide
    FkFraktur: 'unifraktur/unifrakturmaguntia-book.woff2',        // UnifrakturMaguntia – Gasthausschild
    FkKlassisch: 'abril/abrilfatface-regular.woff2',              // Abril Fatface – Plakate, Banner, Goldschrift
  };
  const STIL = {
    verkehr: ['600', 'FkVerkehr'], bon: ['600', 'FkVerkehr'], led: ['600', 'FkVerkehr'],
    hand: ['400', 'FkHand'], kreide: ['400', 'FkHand'], fraktur: ['400', 'FkFraktur'],
    klassisch: ['400', 'FkKlassisch'], gold: ['400', 'FkKlassisch'],
    druck: ['700', 'Poppins'], handy: ['400', 'Poppins'],
  };
  const ERSATZ = { FkVerkehr: 'Arial Narrow, Arial, sans-serif', FkHand: 'Comic Sans MS, cursive', FkFraktur: 'serif', FkKlassisch: 'Georgia, serif', Poppins: 'Arial, sans-serif' };
  const schrift = (stil, px) => { const s = STIL[stil] || STIL.druck; return `${s[0]} ${px}px '${s[1]}', ${ERSATZ[s[1]]}`; };

  let bereit = false, laden = null;
  const danach = [];
  function schriftenLaden() {
    if (laden) return laden;
    const ff = Object.entries(DATEIEN).map(([name, datei]) => {
      if (!window.FontFace || !document.fonts) return Promise.resolve();
      const f = new FontFace(name, `url(${BASIS}${datei}) format('woff2')`, { display: 'block' });
      document.fonts.add(f);
      return f.load().catch(() => {});
    });
    if (document.fonts && document.fonts.load) ff.push(document.fonts.load("700 20px 'Poppins'").catch(() => {}), document.fonts.load("400 20px 'Poppins'").catch(() => {}));
    laden = Promise.all(ff).then(() => { bereit = true; danach.splice(0).forEach(f => { try { f(); } catch (e) { /* egal */ } }); });
    return laden;
  }

  // ---------- Hilfen ----------
  function zufall(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  function hex(f) {
    const m = /^#?([0-9a-f]{6})$/i.exec(f || '') ; const n = m ? parseInt(m[1], 16) : 0x222222;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  // Homographie Einheitsquadrat → Viereck (p0 oben-links, p1 oben-rechts, p2 unten-rechts, p3 unten-links)
  function quadrat(P) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = P;
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    const d = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / d, h = (dx1 * sy - sx * dy1) / d;
    return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
  }
  function umkehren(m) {
    const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
      C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  }
  const misch = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function teilViereck(P, t) {   // Ausschnitt [u0, v0, u1, v1] der Fläche
    const pkt = (u, v) => misch(misch(P[0], P[1], u), misch(P[3], P[2], u), v);
    return [pkt(t[0], t[1]), pkt(t[2], t[1]), pkt(t[2], t[3]), pkt(t[0], t[3])];
  }
  const abst = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // ---------- Schrift auf eine flache Leinwand ----------
  // Text in höchstens n Zeilen so groß wie möglich (Umbruch nur an Leerzeichen)
  function einpassen(x, text, stil, W, H, rand, nMax, faktor) {
    const worte = text.split(' '), lh = stil === 'hand' || stil === 'kreide' ? 1.0 : 1.08;
    const varianten = [[text]];
    if (worte.length > 1 && nMax >= 2) for (let i = 1; i < worte.length; i++) varianten.push([worte.slice(0, i).join(' '), worte.slice(i).join(' ')]);
    if (worte.length > 2 && nMax >= 3) for (let i = 1; i < worte.length - 1; i++) for (let j = i + 1; j < worte.length; j++) varianten.push([worte.slice(0, i).join(' '), worte.slice(i, j).join(' '), worte.slice(j).join(' ')]);
    const innenW = W - 2 * rand * H, innenH = H * (1 - 2 * rand);
    let best = null;
    varianten.forEach(z => {
      x.font = schrift(stil, 100);
      const breit = Math.max(...z.map(t => x.measureText(t).width));
      const px = Math.min(innenH / (z.length * lh) / 0.78, innenW / breit * 100);   // 0,78 ≈ Höhe der Großbuchstaben + Unterlänge
      if (!best || px > best.px * 1.04) best = { z, px };
    });
    best.px *= faktor || 1; best.lh = lh;
    return best;
  }
  function textZeichnen(x, e, W, H) {
    const stil = e.stil || 'druck', farbe = e.farbe || '#222', rand = e.rand == null ? 0.12 : e.rand;
    let text = e.text;
    if (stil === 'bon') return bonZeichnen(x, e, W, H);
    if (stil === 'kennzeichen') return kennzeichenZeichnen(x, e, W, H);
    if (stil === 'segment') return segmentZeichnen(x, text, W, H, farbe, rand, e);
    if (stil === 'led') return ledZeichnen(x, text, W, H, farbe, rand);
    const f = einpassen(x, text, stil, W, H, rand, e.zeilen || 2, e.groesse);
    x.font = schrift(stil, f.px);
    x.textBaseline = 'middle';
    const al = e.ausrichtung || 'mitte';
    x.textAlign = al === 'links' ? 'left' : al === 'rechts' ? 'right' : 'center';
    const tx = al === 'links' ? rand * H : al === 'rechts' ? W - rand * H : W / 2;
    const zh = f.px * f.lh * 0.92, y0 = H / 2 - (f.z.length - 1) * zh / 2 + f.px * 0.04;
    if (stil === 'gold') {
      const v = x.createLinearGradient(0, H / 2 - f.px / 2, 0, H / 2 + f.px / 2);
      v.addColorStop(0, '#fbe7a1'); v.addColorStop(0.45, farbe); v.addColorStop(0.55, '#a8761f'); v.addColorStop(1, '#f1d27c');
      x.lineJoin = 'round'; x.lineWidth = f.px * 0.07; x.strokeStyle = 'rgba(70,45,10,0.85)';
      f.z.forEach((t, i) => x.strokeText(t, tx, y0 + i * zh));
      x.fillStyle = v;
    } else x.fillStyle = farbe;
    f.z.forEach((t, i) => x.fillText(t, tx, y0 + i * zh));
    if (stil === 'kreide') {   // Kreide: Körnung (kleine Lücken), gleich bei jedem Aufbau
      const r = zufall(text.length * 7919 + 17), n = Math.round(W * H / (f.px * f.px) * 90);
      x.save(); x.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < n; k++) { x.globalAlpha = 0.35 + r() * 0.5; x.fillRect(r() * W, r() * H, f.px * 0.035 * (0.5 + r()), f.px * 0.03 * (0.5 + r())); }
      x.restore();
    }
  }
  function bonZeichnen(x, e, W, H) {
    const t = e.text, i = t.lastIndexOf(' '), links = (i > 0 ? t.slice(0, i) : '').toUpperCase(), rechts = i > 0 ? t.slice(i + 1) : t;
    const r = zufall(31), rand = W * 0.06;
    // angedeutete Posten (ohne Inhalt): graue Striche links, kurze rechts
    x.fillStyle = 'rgba(60,60,60,0.38)';
    const zeile = H * 0.085;
    for (let k = 0; k < 5; k++) {
      const y = H * 0.06 + k * zeile * 1.45;
      x.fillRect(rand, y, W * (0.3 + r() * 0.25), zeile * 0.55);
      x.fillRect(W - rand - W * 0.2, y, W * 0.2, zeile * 0.55);
    }
    x.fillStyle = 'rgba(60,60,60,0.5)';
    for (let px = rand; px < W - rand; px += W * 0.05) x.fillRect(px, H * 0.68, W * 0.028, Math.max(1, H * 0.012));
    x.font = schrift('bon', 100);
    const noetig = x.measureText((links ? links + '   ' : '') + rechts).width / 100;
    const groesse = Math.min(H * 0.2, (W - 2 * rand) / noetig);
    x.font = schrift('bon', groesse); x.textBaseline = 'middle'; x.fillStyle = e.farbe || '#222';
    x.textAlign = 'left'; if (links) x.fillText(links, rand, H * 0.83);
    x.textAlign = 'right'; x.fillText(rechts, W - rand, H * 0.83);
  }
  // Kennzeichen-Anmutung: schmaler blauer Streifen links (ohne Sterne, ohne Länderkennung), schwarze Schrift, keine Plaketten
  function kennzeichenZeichnen(x, e, W, H) {
    const streifen = W * 0.085;
    x.fillStyle = '#1f4ea8'; x.fillRect(0, 0, streifen, H);
    const rand = H * (e.rand == null ? 0.12 : e.rand), innenW = W - streifen - 2 * rand, innenH = H - 2 * rand;
    x.font = schrift('verkehr', 100);
    const px = Math.min(innenH / 0.74, innenW / (x.measureText(e.text).width / 100));
    x.font = schrift('verkehr', px); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = e.farbe || '#111';
    x.fillText(e.text, streifen + rand + innenW / 2, H / 2 + px * 0.04);
  }
  // Siebensegment: a oben, b rechts oben, c rechts unten, d unten, e links unten, f links oben, g Mitte
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
  function segmentZeichnen(x, text, W, H, farbe, rand, e) {
    const leuchtet = e.mischung === 'leuchten';
    if (e.hintergrund) { x.fillStyle = e.hintergrund; x.fillRect(0, 0, W, H); }
    const h = H * (1 - 2 * rand), zw = h * 0.52, abstand = h * 0.16, dick = h * 0.12, schraeg = h * 0.1;
    const zeichen = [...text];
    const breite = z => (/[0-9-]/.test(z) ? zw + abstand : /[:.,]/.test(z) ? abstand * 1.6 : zw * 0.6);
    let gesamt = zeichen.reduce((s, z) => s + breite(z), 0) - abstand;
    let s = 1; if (gesamt > W - 2 * rand * H) { s = (W - 2 * rand * H) / gesamt; }
    const al = e.ausrichtung || 'mitte';
    let px = al === 'rechts' ? W - rand * H - gesamt * s : al === 'links' ? rand * H : (W - gesamt * s) / 2;
    const oben = (H - h * s) / 2;
    const [r, g, b] = hex(farbe);
    const seg = (x0, y0, w, h0, an) => {
      x.fillStyle = an ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${leuchtet ? 0.07 : 0.09})`;
      x.beginPath();
      const k = Math.min(w, h0) / 2;
      if (w > h0) { x.moveTo(x0, y0 + k); x.lineTo(x0 + k, y0); x.lineTo(x0 + w - k, y0); x.lineTo(x0 + w, y0 + k); x.lineTo(x0 + w - k, y0 + h0); x.lineTo(x0 + k, y0 + h0); }
      else { x.moveTo(x0 + k, y0); x.lineTo(x0 + w, y0 + k); x.lineTo(x0 + w, y0 + h0 - k); x.lineTo(x0 + k, y0 + h0); x.lineTo(x0, y0 + h0 - k); x.lineTo(x0, y0 + k); }
      x.closePath(); x.fill();
    };
    if (leuchtet) { x.shadowColor = `rgba(${r},${g},${b},0.8)`; x.shadowBlur = h * s * 0.12; }
    zeichen.forEach(z => {
      const w = breite(z) * s;
      x.save(); x.translate(px, oben); x.transform(1, 0, -schraeg / h, 1, schraeg * s, 0);
      const Z = zw * s, Hh = h * s, D = dick * s, L = Z - D * 0.4;
      if (/[0-9-]/.test(z)) {
        const an = SEG[z] || '';
        const S = { a: [D * 0.6, 0, L - D * 0.2, D], g: [D * 0.6, Hh / 2 - D / 2, L - D * 0.2, D], d: [D * 0.6, Hh - D, L - D * 0.2, D],
          f: [0, D * 0.6, D, Hh / 2 - D * 0.7], e: [0, Hh / 2 + D * 0.1, D, Hh / 2 - D * 0.7],
          b: [Z - D * 0.2, D * 0.6, D, Hh / 2 - D * 0.7], c: [Z - D * 0.2, Hh / 2 + D * 0.1, D, Hh / 2 - D * 0.7] };
        Object.entries(S).forEach(([n, q]) => seg(q[0], q[1], q[2], q[3], an.includes(n)));
      } else if (z === ':') { x.fillStyle = `rgb(${r},${g},${b})`; [0.3, 0.7].forEach(f => x.fillRect(abstand * 0.4 * s, Hh * f - D / 2, D, D)); }
      else if (z === '.' || z === ',') { x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(abstand * 0.3 * s, Hh - D, D, D); }
      x.restore();
      px += w;
    });
    x.shadowBlur = 0;
  }
  // Punktmatrix (Zielanzeige im Bus): Text klein rastern, jede Zelle ein Leuchtpunkt
  function ledZeichnen(x, text, W, H, farbe, rand) {
    const reihen = 9, innenH = H * (1 - 2 * rand), p = innenH / reihen, spalten = Math.floor((W - 2 * rand * H) / p);
    const k = document.createElement('canvas'); k.width = spalten; k.height = reihen;
    const kg = k.getContext('2d');
    kg.font = schrift('led', 10); kg.textBaseline = 'alphabetic'; kg.textAlign = 'center';
    const breit = kg.measureText(text).width, f = Math.min(1, (spalten - 2) / breit);
    kg.save(); kg.translate(spalten / 2, reihen - 1.5); kg.scale(f, 1); kg.fillStyle = '#fff'; kg.fillText(text, 0, 0); kg.restore();
    const d = kg.getImageData(0, 0, spalten, reihen).data, [r, g, b] = hex(farbe);
    const x0 = (W - spalten * p) / 2, y0 = (H - reihen * p) / 2;
    for (let j = 0; j < reihen; j++) for (let i = 0; i < spalten; i++) {
      const an = d[(j * spalten + i) * 4 + 3] > 100;
      x.fillStyle = an ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},0.09)`;
      x.beginPath(); x.arc(x0 + (i + 0.5) * p, y0 + (j + 0.5) * p, p * 0.36, 0, 7); x.fill();
    }
  }

  // ---------- Auftragen ----------
  // c = Leinwand, auf der das Motivbild in Gerätepixeln bei (x0, y0) mit Größe w × h liegt. Gibt true zurück, wenn
  // Schrift aufgetragen wurde (false: keine Schrift für dieses Motiv bzw. Schriften laden noch).
  function auftragen(c, m, x0, y0, w, h) {
    const e = eintrag(m), liste = e && (e.flaechen || [e]);
    if (!liste || !liste.some(f => f.text && f.ecken)) return false;
    if (!bereit) { schriftenLaden(); return false; }
    let ok = false;
    liste.forEach(f => { if (f.text && f.ecken && flaecheAuftragen(c, f, x0, y0, w, h)) ok = true; });
    return ok;
  }
  // eine Schriftfläche (Ecken in % des Motivbilds) auftragen
  function flaecheAuftragen(c, e, x0, y0, w, h) {
    let P = e.ecken.map(p => [x0 + p[0] / 100 * w, y0 + p[1] / 100 * h]);
    if (e.teil) P = teilViereck(P, e.teil);
    const dreh = e.drehen === 90;
    let FW = Math.max(abst(P[0], P[1]), abst(P[3], P[2])), FH = Math.max(abst(P[0], P[3]), abst(P[1], P[2]));
    if (FH < 2 || FW < 3) return false;
    // flache Schriftfläche, 3-fach aufgelöst (Überabtastung), höchstens ~1200 px breit
    const S = Math.min(3, 1200 / Math.max(FW, FH));
    const T = document.createElement('canvas'); T.width = Math.max(2, Math.ceil(FW * S)); T.height = Math.max(2, Math.ceil(FH * S));
    const tg = T.getContext('2d', { willReadFrequently: true });
    if (dreh) { tg.translate(T.width, 0); tg.rotate(Math.PI / 2); textZeichnen(tg, e, T.height, T.width); }
    else textZeichnen(tg, e, T.width, T.height);
    const td = tg.getImageData(0, 0, T.width, T.height).data, TW = T.width, TH = T.height;
    // Zielbereich
    const bx0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[0])))), by0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[1]))));
    const bx1 = Math.min(c.width, Math.ceil(Math.max(...P.map(p => p[0])))), by1 = Math.min(c.height, Math.ceil(Math.max(...P.map(p => p[1]))));
    const bw = bx1 - bx0, bh = by1 - by0;
    if (bw < 1 || bh < 1) return false;
    const g = c.getContext('2d'), bild = g.getImageData(bx0, by0, bw, bh), d = bild.data;
    const M = umkehren(quadrat(P));
    const zyl = e.zylinder || 0, sinA = Math.sin(zyl), bogen = e.bogen || 0;
    const st = (px, py) => {
      const X = M[0] * px + M[1] * py + M[2], Y = M[3] * px + M[4] * py + M[5], Z = M[6] * px + M[7] * py + M[8];
      return [X / Z, Y / Z];
    };
    // Licht der Fläche: mittlere Helligkeit im Viereck
    let summe = 0, n = 0;
    for (let j = 0; j < bh; j += 2) for (let i = 0; i < bw; i += 2) {
      const [s, t] = st(bx0 + i + 0.5, by0 + j + 0.5);
      if (s < 0 || s > 1 || t < 0 || t > 1) continue;
      const k = (j * bw + i) * 4; if (d[k + 3] < 128) continue;
      summe += lum(d[k], d[k + 1], d[k + 2]); n++;
    }
    const ref = n ? Math.max(20, summe / n) : 128;
    const art = e.mischung || 'tinte', deck = e.deckkraft == null ? 1 : e.deckkraft;
    const O = [1 / 6, 1 / 2, 5 / 6];
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      const k = (j * bw + i) * 4, ba = d[k + 3];
      if (ba < 8) continue;
      let ar = 0, ag = 0, ab = 0, aa = 0;
      for (const oy of O) for (const ox of O) {
        let [s, t] = st(bx0 + i + ox, by0 + j + oy);
        if (s < 0 || s > 1 || t < 0 || t > 1) continue;
        if (zyl) s = 0.5 + Math.asin(Math.max(-1, Math.min(1, (2 * s - 1) * sinA))) / (2 * zyl);
        if (bogen) t -= bogen * (1 - (2 * s - 1) * (2 * s - 1));
        if (t < 0 || t > 1) continue;
        const q = (Math.min(TH - 1, Math.floor(t * TH)) * TW + Math.min(TW - 1, Math.floor(s * TW))) * 4, a = td[q + 3];
        if (!a) continue;
        ar += td[q] * a; ag += td[q + 1] * a; ab += td[q + 2] * a; aa += a;
      }
      if (!aa) continue;
      const a = Math.min(1, aa / (255 * 9)) * deck * (ba / 255);
      let r = ar / aa, gg = ag / aa, b = ab / aa;
      if (art !== 'leuchten') {   // Licht übernehmen: Schatten und Glanz der Fläche wirken auf die Schrift
        const l = Math.max(0.55, Math.min(1.25, lum(d[k], d[k + 1], d[k + 2]) / ref)), f = art === 'deck' ? Math.sqrt(l) : l;
        r *= f; gg *= f; b *= f;
      }
      d[k] = Math.min(255, d[k] * (1 - a) + r * a);
      d[k + 1] = Math.min(255, d[k + 1] * (1 - a) + gg * a);
      d[k + 2] = Math.min(255, d[k + 2] * (1 - a) + b * a);
    }
    g.putImageData(bild, bx0, by0);
    return true;
  }

  window.FOKUS_SCHILDER = {
    laden: schriftenLaden,
    bereit: () => bereit,
    beiBereit: f => { if (bereit) f(); else { danach.push(f); schriftenLaden(); } },
    hat: m => { const e = eintrag(m); return !!(e && (e.flaechen || [e]).some(f => f.text)); },
    auftragen,
  };
})();
