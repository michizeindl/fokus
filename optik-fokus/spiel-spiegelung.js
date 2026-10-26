// Level 3 „Spiegelung“ (MZ, 26.10.2026; Mechanik Phase 4): Fische und Dinge ziehen durch den See, Spiegelungen auf
// dem Wasser verdecken sie. Der Polfilter wird in Abständen kurz klar (Anzeige unten: Filterscheibe dreht sich und füllt
// sich). Oben wird das gesuchte Ziel angesagt (Bild + Name).
//   Treffer   das angesagte Ziel antippen, solange der Filter klar ist – Punkte nach Reaktion ab Klarwerden
//             (bis `voll` 100, bis Ende des Klarblicks linear auf 50)
//   zu früh   ein Ziel antippen, solange es noch spiegelt
//   falsch    ein anderes Ziel antippen, solange es klar ist
//   verpasst  das Ziel schwimmt aus dem Bild bzw. taucht ab, ohne getippt zu werden
//   Tippen ins Leere zählt nicht.
// Von Ziel zu Ziel: kürzerer Klarblick, schneller, kleiner, mehr Ablenker, ab `aehnlichAb` von derselben Art.
// Werte in daten.js (FOKUS.spiegelung), Zonen (tief/flach) am See-Bild eingemessen (daten.js level[2].zonen).
(function () {
  'use strict';
  const D = window.FOKUS, SZ = window.FOKUS_SZENE, G = window.FOKUS_GEMEIN;
  window.FOKUS_LEVEL = window.FOKUS_LEVEL || {};
  window.FOKUS_LINSE = window.FOKUS_LINSE || {};
  const { lerp, klemm, mischen } = G;
  const GROESSE = { klein: 0.72, mittel: 1, 'groß': 1.3 };
  const ZONE_F = { tief: 0.78, flach: 1 };
  const art = m => (m.bewegung === 'schwimmt' ? 'tier' : 'ding');
  const ERSATZ = [{ name: 'Hecht', bewegung: 'schwimmt', zone: 'flach', groesse: 'groß' }, { name: 'Karpfen', bewegung: 'schwimmt', zone: 'tief', groesse: 'groß' },
    { name: 'Eimer', bewegung: 'liegt', zone: 'tief', groesse: 'mittel' }, { name: 'Strohhut', bewegung: 'treibt', zone: 'flach', groesse: 'mittel' }];
  const pool = () => (window.FOKUS_POOLS && window.FOKUS_POOLS.spiegelung) || ERSATZ;

  // Motiv unter Wasser: nur leicht eingefärbt (tief etwas mehr), NICHT weichgezeichnet – im klaren Moment soll das Ziel
  // scharf sein (MZ, 26.10.2026: Teichmuschel wirkte unscharf). Tiefe zeigt sich über Tönung und Größe (ZONE_F).
  function unterWasser(m, hoehe, zone, dpr) {
    const b = SZ.motivBild(m, hoehe, 4, dpr), c = b.c, g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = zone === 'tief' ? 'rgba(24,86,92,.22)' : 'rgba(40,120,120,.12)';
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-over';
    return { c, w: b.w, h: b.h, pad: b.pad };
  }

  window.FOKUS_LEVEL[3] = function (api) {
    const W = D.spiegelung, N = D.regeln.ziele, R = D.regeln;
    let B = 0, H = 0, dpr = 1, hg = null, hgSchl = '', glanz = null, glanzStreifen = null;
    let dinge = [], nr = 0, ziel = null, phase = 'aus', uhr = 0, aus = false, glanzWert = 1, filterWinkel = 0, zeit = 0, warKlar = false;
    const fx = G.effekte(), tempo = api.tempo || 1;

    function zonen() {
      const A = SZ.abbildung(3, B, H), Z = A.zonen || { wasser: 0.12, tief: [0.22, 0.47], flach: [0.5, 0.8] };
      const oben = api.oben() + 6, unten = H - 70;   // unten Platz für die Filteranzeige
      const z = (a, b) => [klemm(A.y(a), oben, unten), klemm(A.y(b), oben, unten)];
      return { tief: z(Z.tief[0], Z.tief[1]), flach: z(Z.flach[0], Z.flach[1]), wasser: Math.max(0, A.y(Z.wasser)) };
    }
    // Spiegelung: heller Himmel mit Wellen-Glanz, als Leinwand je Bildschirmgröße; die Streifen ziehen langsam weiter
    function glanzBauen() {
      const zw = zonen();
      glanz = document.createElement('canvas'); glanz.width = Math.round(B * dpr); glanz.height = Math.round(H * dpr);
      let g = glanz.getContext('2d'); g.scale(dpr, dpr);
      const y0 = zw.wasser;
      let v = g.createLinearGradient(0, y0, 0, H);
      v.addColorStop(0, 'rgba(236,246,252,.9)'); v.addColorStop(0.35, 'rgba(206,230,244,.84)'); v.addColorStop(1, 'rgba(178,214,232,.8)');
      g.fillStyle = v; g.fillRect(0, y0, B, H - y0);
      // Spiegelbild von Wolken (weiche Flecken)
      const r = SZ.zufall(31);
      for (let i = 0; i < 9; i++) { const x = r() * B, y = y0 + r() * (H - y0), s = Math.min(B, H) * (0.12 + r() * 0.2);
        const q = g.createRadialGradient(x, y, 0, x, y, s); q.addColorStop(0, 'rgba(255,255,255,.55)'); q.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = q; g.beginPath(); g.ellipse(x, y, s * 1.8, s * 0.6, 0, 0, 7); g.fill(); }
      glanzStreifen = document.createElement('canvas'); glanzStreifen.width = Math.round(B * 2 * dpr); glanzStreifen.height = Math.round(H * dpr);
      g = glanzStreifen.getContext('2d'); g.scale(dpr, dpr);
      g.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const y = y0 + Math.pow(r(), 0.8) * (H - y0), l = 30 + r() * 140 * (0.4 + (y - y0) / (H - y0)), x = r() * B * 2;
        g.strokeStyle = `rgba(255,255,255,${0.25 + r() * 0.4})`; g.lineWidth = 1 + r() * 3 * (0.5 + (y - y0) / (H - y0));
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3 - r() * 4, x + l, y); g.stroke();
      }
      // Streifen weich (wie Lichtglanz auf Wellen, nicht wie Striche)
      try {
        const w = document.createElement('canvas'); w.width = glanzStreifen.width; w.height = glanzStreifen.height;
        const wg = w.getContext('2d');
        if (typeof wg.filter === 'string') { wg.filter = `blur(${1.6 * dpr}px)`; wg.drawImage(glanzStreifen, 0, 0); if (wg.filter !== 'none') glanzStreifen = w; }
      } catch (e) { /* ohne Weichzeichnen */ }
    }
    function bereiten(m, k, alsAblenker) {
      const zw = zonen(), zone = m.zone === 'tief' ? 'tief' : 'flach';
      // faktor je Motiv (daten.js spiegelung.faktor, MZ 26.10.2026): z. B. Münze kleiner als ein Fisch der gleichen Größenklasse
      const basis = Math.min(B, H) * 0.25 * (GROESSE[m.groesse] || 1) * (ZONE_F[zone] || 1) * lerp(W.groesse, k, N) * (alsAblenker ? 0.95 : 1) * ((W.faktor || {})[m.name] || 1);
      const img = SZ.bild(m.bild), sv = img ? (img.naturalWidth / img.naturalHeight) : 2;
      const hoehe = klemm(basis / Math.sqrt(Math.max(0.3, sv)), 22, H * 0.22);
      const bild = unterWasser(m, hoehe, zone, dpr);
      const band = zw[zone], y = band[0] + Math.random() * Math.max(0, band[1] - band[0] - bild.h);
      const breit = bild.w + bild.pad * 2, rechts = Math.random() < 0.5;
      const dauer = lerp(W.dauer, k, N) * (m.bewegung === 'treibt' ? 1.5 : 1) * (alsAblenker ? 0.85 + Math.random() * 0.4 : 1);
      const o = { m, bild, rechts, y: y - bild.pad, dauer, t: 0, wob: Math.random() * 6, liegt: m.bewegung === 'liegt' };
      if (o.liegt) { o.x0 = o.x1 = 10 + Math.random() * Math.max(0, B - breit - 20); o.dauer = dauer * 0.8; }
      else { o.x0 = rechts ? -breit : B; o.x1 = rechts ? B : -breit; }
      return o;
    }
    function lage(o) {
      const u = klemm(o.t / o.dauer, 0, 1);
      const x = o.x0 + (o.x1 - o.x0) * u;
      const dy = o.liegt ? 0 : o.m.bewegung === 'treibt' ? Math.sin(o.t * 1.3 + o.wob) * o.bild.h * 0.05 : Math.sin(o.t * 2.2 + o.wob) * o.bild.h * 0.08;
      const w = o.bild.w + o.bild.pad * 2, h = o.bild.h + o.bild.pad * 2;
      const alpha = o.liegt ? Math.min(1, o.t / 0.5, (o.dauer - o.t) / 0.5) : 1;
      return { x, y: o.y + dy + (o.aus || 0), w, h, pad: o.bild.pad, alpha };   // aus = Ausweichen (spiel-gemein.js)
    }
    function kasten(o, e) { const l = lage(o); e = e || 0; return { x: l.x + l.pad - e, y: l.y + l.pad - e, w: l.w - l.pad * 2 + e * 2, h: l.h - l.pad * 2 + e * 2 }; }
    const drin = (k, x, y) => x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h;
    const mindestens = (k, m) => { const dw = Math.max(0, m - k.w) / 2, dh = Math.max(0, m - k.h) / 2; return { x: k.x - dw, y: k.y - dh, w: k.w + dw * 2, h: k.h + dh * 2 }; };
    // Wann ist das Ziel ganz im Bild? Erst dann beginnt der erste Klarblick
    function sichtbarAb(o) {
      if (o.liegt) return 0.5;
      const w = o.bild.w + o.bild.pad * 2;
      return o.dauer * (w * 0.85) / (B + w);
    }

    function ansageBild(m) {
      const img = SZ.bild(m.bild);
      if (!img) return null;
      // Größe in em (wächst mit der Schrift des Ansage-Bands), Auflösung reicht bis ca. 3×
      const c = document.createElement('canvas'), d = Math.min(window.devicePixelRatio || 1, 2.5) * 2.4, h = 26, w = Math.min(64, h * img.naturalWidth / img.naturalHeight);
      const hh = w * img.naturalHeight / img.naturalWidth;
      c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.width = (w / 16) + 'em'; c.style.height = (h / 16) + 'em';
      const g = c.getContext('2d'); g.drawImage(img, 0, (h - hh) / 2 * d, w * d, hh * d);
      return c;
    }
    let reihe = [];
    function naechstes() {
      if (nr >= N) { aus = true; api.fertig(); return; }
      const k = nr, m = reihe[k % reihe.length];
      const z = bereiten(m, k, false);
      z.k = k; z.ergebnis = null; z.weg = 0;
      const takt = lerp(W.takt, k, N), klar = lerp(W.klar, k, N);
      z.takt = takt; z.klar = klar; z.erster = Math.max(1.6, sichtbarAb(z) + 0.4);
      // genug Zeit für mindestens zwei Klarblicke, solange das Ziel zu sehen ist
      const mindest = z.erster + takt * 2 + klar + (z.liegt ? 0.5 : sichtbarAb(z));
      if (z.dauer < mindest) z.dauer = mindest;
      ziel = z;
      // Ablenker: vorher andere Art (Fisch ↔ Ding), ab aehnlichAb gleiche Art
      dinge = dinge.filter(o => o.t < o.dauer);
      ziel.ablenkerZahl = W.ablenker[Math.min(k, W.ablenker.length - 1)] || 0;
      G.ansage.zeigen({ bild: ansageBild(m), text: m.name });
      api.ziel(k + 1, null);
      phase = 'aktiv';
    }
    function ablenkerAuffuellen() {
      if (!ziel) return;
      const da = dinge.filter(o => o.t < o.dauer).length;
      if (da >= ziel.ablenkerZahl) return;
      const aehnlich = ziel.k + 1 >= W.aehnlichAb;
      const kand = pool().filter(p => p.name !== ziel.m.name && (aehnlich ? art(p) === art(ziel.m) : art(p) !== art(ziel.m)) && !dinge.some(o => o.m === p));
      const p = kand.length ? kand[Math.floor(Math.random() * kand.length)] : pool().find(q => q !== ziel.m);
      if (!p) return;
      const o = bereiten(p, ziel.k, true);
      o.t = o.liegt ? 0 : Math.random() * o.dauer * 0.35;
      dinge.push(o);
    }
    // Glanz: 1 = Spiegelung, 0 = Filter klar (weicher Übergang 0,15s)
    function klarAnteil() {
      if (!ziel || ziel.ergebnis) return 0;
      const t = ziel.t - ziel.erster;
      if (t < 0) return 0;
      const im = t % ziel.takt;
      return im < ziel.klar ? 1 : 0;
    }
    function fensterBeginn() { const t = ziel.t - ziel.erster; return t < 0 ? null : t % ziel.takt; }
    function ergebnis(art_, o, x, y) {
      const e = { ziel: ziel.k + 1, art: art_, d: 0, name: ziel.m.name };
      if (art_ === 'treffer') { const rt = fensterBeginn(); e.reaktion = rt; e.punkte = G.punkteNachZeit(rt, W.voll, ziel.klar, R); }
      ziel.ergebnis = e;
      const k = kasten(o || ziel);
      fx.neu(art_, k.x + k.w / 2, k.y + k.h / 2, Math.max(k.w, k.h) * 0.55, api.rueckmeldung(art_, e.punkte), art_ === 'treffer' ? '+' + e.punkte : '');
      api.ergebnis(e);
      phase = 'pause'; uhr = W.pause + 0.4;
    }

    return {
      groesse(b, h, d) {
        B = b; H = h; dpr = d || 1;
        const s = B + 'x' + H + SZ.hgBereit(3, B, H);
        if (s !== hgSchl) { hg = SZ.levelBild(3, B, H, dpr); hgSchl = s; glanzBauen(); }
      },
      vorladen() { pool().forEach(m => SZ.bild(m.bild)); },
      neu(abZiel) {
        this.vorladen();
        // Ziele: gemischt, aber nicht zweimal hintereinander dieselbe Art zu Beginn
        reihe = mischen(pool());
        dinge = []; fx.leeren(); aus = false; ziel = null; zeit = 0;
        nr = Math.max(0, (abZiel || 1) - 1); phase = 'start'; uhr = 0.5; glanzWert = 1;
        if (!glanz) glanzBauen();
      },
      stopp() { G.ansage.verbergen(); },
      schritt(dt) {
        dt *= tempo; zeit += dt;
        fx.schritt(dt);
        dinge.forEach(o => { o.t += dt; });
        if (ziel) ziel.t += dt;
        // Glanz folgt dem Filter (weich)
        const soll = 1 - klarAnteil();
        // Polfilter wird klar: heller Schimmer, so lang wie der Klarblick (MZ-Liste „Polfilter klar“)
        if (soll < 0.5 && !warKlar && ziel && phase === 'aktiv' && !aus) G.ton.effekt('klar', { hoechstens: ziel.klar + 0.3 });
        warKlar = soll < 0.5;
        glanzWert += (soll - glanzWert) * Math.min(1, dt / 0.06);
        filterWinkel += ((1 - glanzWert) * Math.PI / 2 - filterWinkel) * Math.min(1, dt / 0.08);
        if (aus || api.abgebrochen()) { aus = true; return; }
        if (phase === 'start') { uhr -= dt; if (uhr <= 0) naechstes(); return; }
        if (!ziel) return;
        ablenkerAuffuellen();
        // Ablenker weichen dem Ziel aus (andere Tiefe), damit es nie verdeckt ist (MZ, 26.10.2026)
        if (phase === 'aktiv') {
          const zw = zonen(), vz = ziel.liegt ? 0 : (ziel.x1 - ziel.x0) / ziel.dauer;
          G.ausweichen(kasten(ziel, 4), dinge.map(o => ({ o, k: kasten(o), vx: (o.liegt ? 0 : (o.x1 - o.x0) / o.dauer) - vz })), dt, zw.tief[0] - 10, zw.flach[1] + 10, 12);
        }
        if (phase === 'aktiv' && ziel.t >= ziel.dauer) ergebnis('verpasst', ziel);
        else if (phase === 'pause') {
          ziel.weg += dt; uhr -= dt;
          if (uhr <= 0) { nr++; const alt = ziel; ziel = null; if (!alt.liegt && alt.t < alt.dauer && alt.ergebnis && alt.ergebnis.art !== 'treffer') { /* schwimmt weiter als Ablenker */ dinge.push(alt); } if (api.abgebrochen()) { aus = true; return; } naechstes(); }
        }
        dinge = dinge.filter(o => o.t < o.dauer);
      },
      tipp(x, y) {
        if (!ziel || aus || phase !== 'aktiv') return false;
        // Trefferfläche des Ziels: Kasten + 10 px, mindestens 40 × 40 px (kleine Dinge wie die Münze bleiben antippbar)
        const zk = mindestens(kasten(ziel, 10), 40), aufZiel = ziel.t >= 0 && drin(zk, x, y);
        const ab = !aufZiel && dinge.find(o => drin(kasten(o, 4), x, y));
        if (!aufZiel && !ab) return false;
        if (glanzWert > 0.5) { ergebnis('frueh', aufZiel ? ziel : ab, x, y); return true; }
        if (aufZiel) ergebnis('treffer', ziel, x, y); else ergebnis('falsch', ab, x, y);
        return true;
      },
      zeichne(g, b, h, laeuft) {
        if (hg) g.drawImage(hg, 0, 0, B, H);
        if (!laeuft) return;
        // Ablenker nach Größe (kleine = weiter weg zuerst), das Ziel immer obenauf (MZ, 26.10.2026)
        const alle = dinge.map(o => ({ o })).sort((p, q) => p.o.bild.h - q.o.bild.h).concat(ziel ? [{ o: ziel, z: true }] : []);
        alle.forEach(({ o, z }) => {
          const l = lage(o);
          let a = l.alpha;
          if (z && o.ergebnis) a *= o.ergebnis.art === 'treffer' ? Math.max(0, 1 - o.weg / 0.6) : 1;
          if (a <= 0) return;
          g.save(); g.globalAlpha = a;
          if (!o.rechts && !o.liegt) { g.translate(l.x * 2 + l.w, 0); g.scale(-1, 1); }
          g.drawImage(o.bild.c, l.x, l.y, l.w, l.h);
          g.restore();
        });
        // Spiegelung darüber: deckt bis auf schwache Umrisse alles ab; Streifen ziehen langsam
        if (glanz && glanzWert > 0.01) {
          g.save();
          g.globalAlpha = 0.9 * glanzWert; g.drawImage(glanz, 0, 0, B, H);
          g.globalAlpha = 0.75 * glanzWert;
          const s = (zeit * 14) % B;
          g.drawImage(glanzStreifen, -s, 0, B * 2, H);
          g.restore();
        }
        // Filteranzeige unten: Scheibe mit Strichen dreht sich beim Klarwerden um 90° und füllt sich in der Kundenfarbe
        const r = Math.max(16, Math.min(24, Math.min(B, H) * 0.055)), cx = B / 2, cy = H - r - Math.max(14, H * 0.03);
        g.save();
        g.translate(cx, cy);
        g.fillStyle = `rgba(10,50,52,${0.45})`; g.beginPath(); g.arc(0, 0, r + 5, 0, 7); g.fill();
        g.fillStyle = Rahmen.mitAlpha ? Rahmen.mitAlpha(window.FK.farben.haupt, 0.25 + 0.75 * (1 - glanzWert)) : 'rgba(15,124,128,.8)';
        g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
        g.rotate(filterWinkel);
        g.save(); g.beginPath(); g.arc(0, 0, r - 2, 0, 7); g.clip();
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5;
        for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * r * 0.28, -r); g.lineTo(i * r * 0.28, r); g.stroke(); }
        g.restore(); g.restore();
        fx.zeichne(g, B, H, api.oben());
      },
      // Testhilfe (nur zur Laufzeit, FOKUS_TEST.ueberdecken()): ein Ablenker zieht genau mit dem Ziel und deckt dessen untere
      // Hälfte ab, ohne auszuweichen – zum Prüfen, dass ein Tipp auf das teilverdeckte Ziel als Treffer zählt
      testUeberdecken() {
        if (!ziel) return null;
        const p = pool().find(q => q !== ziel.m && q.bild) || pool().find(q => q !== ziel.m);
        const o = bereiten(p, ziel.k, true);
        Object.assign(o, { test: true, rechts: ziel.rechts, x0: ziel.x0, x1: ziel.x1, dauer: ziel.dauer, t: ziel.t, liegt: ziel.liegt, wob: ziel.wob,
          y: ziel.y + ziel.bild.h * 0.45 });
        dinge.push(o);
        const k = kasten(o);
        return { x: k.x + k.w / 2, y: k.y + k.h / 2, w: k.w, h: k.h };
      },
      zustand() {
        if (!ziel) return { nr: nr + 1, phase };
        const k = kasten(ziel);
        return { nr: ziel.k + 1, name: ziel.m.name, phase, t: ziel.t, dauer: ziel.dauer, erster: ziel.erster, takt: ziel.takt, klar: ziel.klar,
          istKlar: glanzWert <= 0.5, bisKlar: (() => { const t = ziel.t - ziel.erster; if (t < 0) return -t; const im = t % ziel.takt; return im < ziel.klar ? 0 : ziel.takt - im; })(),
          x: k.x + k.w / 2, y: k.y + k.h / 2, w: k.w, h: k.h, sichtbar: k.x + k.w > 0 && k.x < B,
          verdeckt: +G.verdeckt(k, dinge.map(o => kasten(o))).toFixed(3),
          ablenker: dinge.map(o => { const q = kasten(o); return { name: o.m.name, x: q.x + q.w / 2, y: q.y + q.h / 2, w: q.w, h: q.h }; }) };
      },
    };
  };

  // Startbild: ein Fisch unter Wasser in der Linse
  let linsenFisch = null;
  window.FOKUS_LINSE[3] = function (g, d, dpr) {
    const p = pool().filter(m => m.bewegung === 'schwimmt' && m.groesse !== 'klein' && m.bild);
    if (!linsenFisch || !p.includes(linsenFisch)) linsenFisch = p[Math.floor(Math.random() * p.length)];
    if (!linsenFisch || !SZ.bild(linsenFisch.bild)) return;
    const img = SZ.bild(linsenFisch.bild), w = d * 0.62, h = w * img.naturalHeight / img.naturalWidth;
    const b = unterWasser(linsenFisch, h, 'flach', dpr);
    g.drawImage(b.c, (d / 2 - b.w / 2 - b.pad) * dpr, (d * 0.56 - b.h / 2 - b.pad) * dpr, (b.w + b.pad * 2) * dpr, (b.h + b.pad * 2) * dpr);
  };
})();
