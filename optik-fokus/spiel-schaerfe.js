// Level 1 „Schärfe“ (MZ, 26.10.2026): Motive ziehen unscharf durch die Landschaft, die Schärfe „atmet“; im schärfsten
// Moment tippen. 10 Ziele, von Ziel zu Ziel schwerer (schneller, kleiner, kürzeres scharfes Fenster, Fast-scharf-Momente,
// ab Ziel 5 Ablenker, die nie scharf werden). Werte in daten.js (FOKUS.schaerfe).
//
// Schärfe-Verlauf eines Ziels (u = Anteil der vollen Unschärfe, 0 = scharf), d = Zeit seit dem schärfsten Moment tp:
//   atmen  b(d) = sin²(π·d/P)                         P = „atem“ (Sekunden je Atemzug)
//   rest   r(d) = rest · min(1, |d|/(P/2))²            in allen anderen Atemzügen bleibt eine Restunschärfe („fast scharf“)
//   u(d)   = max(b, r)                                  nur bei d = 0 ganz scharf
// Treffer, wenn beim Tippen u ≤ toleranz, d. h. |d| ≤ halb (halbe Fensterbreite, aus der Toleranz errechnet).
// Punkte = 100 − 50 · |d|/halb (genau im schärfsten Moment 100, am Fensterrand 50). Reaktion = Zeit vom Beginn des
// Fensters (Motiv wird scharf genug) bis zum Tippen.
// Fehler: tippen, solange es noch zu unscharf ist („Zu früh“) bzw. nach dem Fenster („Zu spät“), einen Ablenker antippen
// („Daneben“), Motiv verlässt ungetippt das Bild („Verpasst“).
(function () {
  'use strict';
  const D = window.FOKUS, SZ = window.FOKUS_SZENE;
  window.FOKUS_LEVEL = window.FOKUS_LEVEL || {};

  const lerp = (w, k, n) => Array.isArray(w) && w.length === 2 ? w[0] + (w[1] - w[0]) * (n <= 1 ? 0 : k / (n - 1)) : w;

  function unschaerfe(d, P, rest) {
    const b = Math.pow(Math.sin(Math.PI * d / P), 2);
    const r = rest * Math.pow(Math.min(1, Math.abs(d) / (P / 2)), 2);
    return Math.max(b, r);
  }
  function halbesFenster(P, rest, tol) {   // |d| mit u(d) = tol (u steigt auf [0, P/2])
    let a = 0, b = P / 2;
    for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (unschaerfe(m, P, rest) < tol) a = m; else b = m; }
    return a;
  }

  // Pool mischen; ohne Pool aus motive.js eine kleine Platzhalter-Liste
  const ERSATZ = [
    { name: 'Reh', bewegung: 'läuft', zone: 'feld', groesse: 'mittel' }, { name: 'Storch', bewegung: 'fliegt', zone: 'himmel', groesse: 'mittel' },
    { name: 'Traktor', bewegung: 'fährt', zone: 'feld', groesse: 'groß' }, { name: 'Heißluftballon', bewegung: 'schwebt', zone: 'himmel', groesse: 'groß' },
    { name: 'Radfahrer', bewegung: 'fährt', zone: 'weg', groesse: 'mittel' }, { name: 'Feldhase', bewegung: 'hüpft', zone: 'feld', groesse: 'klein' },
  ];
  const GROESSE = { klein: 0.68, mittel: 1, 'groß': 1.35 };
  const ZONE_F = { himmel: 0.95, horizont: 0.62, feld: 1, weg: 1.12 };

  window.FOKUS_LEVEL[1] = function (api) {
    const W = D.schaerfe, N = D.regeln.ziele;
    let B = 0, H = 0, dpr = 1, hg = null, hgGroesse = '';
    let pool = [], ziele = [], nr = 0, ziel = null, ablenker = [], warte = 0, effekte = [], aus = false;
    const tempo = api.tempo || 1;

    function mischen(liste) { const a = liste.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function zonenY(zone, h) {
      const G = SZ.geometrie(B, H);
      switch (zone) {
        case 'himmel': return G.himmel[0] + Math.random() * (G.himmel[1] - G.himmel[0]);
        case 'horizont': return G.fern - h * 0.5;
        case 'weg': return G.weg - h * 0.45;
        default: return G.feld[0] + Math.random() * (G.feld[1] - G.feld[0]) - h * 0.5;
      }
    }
    // Ein Motiv vorbereiten: Bild, Unschärfe-Stufen, Weg über das Bild
    function bereiten(m, k, alsAblenker) {
      const basis = Math.min(B, H) * 0.2;
      const zone = m.zone || 'feld';
      const hoehe = Math.max(26, Math.min(H * 0.24, B * 0.3, basis * (GROESSE[m.groesse] || 1) * (ZONE_F[zone] || 1) * lerp(W.groesse, k, N) * (alsAblenker ? 0.9 : 1)));
      const maxU = Math.max(5, hoehe * 0.12);
      const bildM = SZ.motivBild(m, hoehe, maxU * 2.2, dpr);
      const st = SZ.stufen(bildM.c, maxU * dpr, 8);
      const rechts = Math.random() < 0.5;
      const breit = bildM.w + bildM.pad * 2;
      const x0 = rechts ? -breit : B, x1 = rechts ? B : -breit;
      const y = Math.max(api.oben(), Math.min(H - bildM.h - 8, zonenY(zone, bildM.h))) - bildM.pad;
      return { m, st, bild: bildM, rechts, x0, x1, y, wob: Math.random() * 6 };
    }
    function naechstes() {
      if (nr >= N) { aus = true; api.fertig(); return; }
      const k = nr;
      const m = pool[k % pool.length];
      const z = bereiten(m, k, false);
      z.k = k;
      z.dauer = lerp(W.dauer, k, N);
      z.P = lerp(W.atem, k, N);
      z.rest = lerp(W.rest, k, N);
      z.tol = lerp(W.toleranz, k, N);
      z.halb = halbesFenster(z.P, z.rest, z.tol);
      z.tp = z.dauer * (0.33 + Math.random() * 0.37);
      z.t = 0; z.ergebnis = null; z.weg = 0;
      ziel = z;
      // Ablenker: andere Motive, nie scharf, eigenes Tempo
      ablenker = [];
      const zahl = Array.isArray(W.ablenker) ? (W.ablenker[k] || 0) : 0;
      const andere = mischen(pool.filter(p => p !== m && p.zone !== m.zone)).concat(pool.filter(p => p !== m));
      for (let i = 0; i < zahl; i++) {
        const a = bereiten(andere[i % andere.length], k, true);
        a.dauer = z.dauer * (0.8 + Math.random() * 0.5);
        a.t = -Math.random() * 0.25 * z.dauer;
        a.P = z.P * (0.7 + Math.random() * 0.6);
        a.min = Math.max(0.45, z.tol * 3);
        ablenker.push(a);
      }
      api.ziel(k + 1, m);
    }
    function lage(o) {
      const u = Math.max(0, Math.min(1, o.t / o.dauer));
      const x = o.x0 + (o.x1 - o.x0) * u;
      const art = SZ.form(o.m);
      let dy = 0;
      if (o.m.bewegung === 'hüpft' || art === 'huepfer') dy = -Math.abs(Math.sin(o.t * 4 + o.wob)) * o.bild.h * 0.18;
      else if (o.m.bewegung === 'fliegt' || o.m.bewegung === 'schwebt') dy = Math.sin(o.t * 1.6 + o.wob) * o.bild.h * 0.08;
      else dy = -Math.abs(Math.sin(o.t * 6 + o.wob)) * o.bild.h * 0.025;
      return { x, y: o.y + dy + (o.aus || 0), w: o.bild.w + o.bild.pad * 2, h: o.bild.h + o.bild.pad * 2, pad: o.bild.pad };   // aus = Ausweichen
    }
    // Kästchen ohne Rand (das, was man sieht), etwas großzügiger zum Antippen
    function kasten(o, extra) {
      const l = lage(o), e = extra || 0;
      return { x: l.x + l.pad - e, y: l.y + l.pad - e, w: l.w - l.pad * 2 + e * 2, h: l.h - l.pad * 2 + e * 2 };
    }
    const drin = (k, x, y) => x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h;

    function ergebnis(art, x, y) {
      const z = ziel, d = z.t - z.tp;
      const e = { ziel: z.k + 1, art, d, name: z.m.name };
      if (art === 'treffer') {
        e.punkte = Math.round(D.regeln.punkteMax - (D.regeln.punkteMax - D.regeln.punkteMin) * Math.min(1, Math.abs(d) / z.halb));
        e.reaktion = Math.max(0, z.t - (z.tp - z.halb));
      }
      z.ergebnis = e;
      const k = kasten(z);
      effekte.push({ art, x: x != null ? x : k.x + k.w / 2, y: y != null ? y : k.y + k.h / 2, cx: k.x + k.w / 2, cy: k.y + k.h / 2, r: Math.max(k.w, k.h) * 0.6, t: 0, text: api.rueckmeldung(art, e.punkte), zahl: art === 'treffer' ? '+' + e.punkte : '' });
      api.ergebnis(e);
    }

    return {
      groesse(b, h, d, neu) {
        B = b; H = h; dpr = d || 1;
        const sch = B + 'x' + H;
        if (sch !== hgGroesse || neu) { hg = SZ.levelBild(1, B, H, dpr); hgGroesse = sch; }
      },
      neu(abZiel) {
        pool = mischen((window.FOKUS_POOLS && window.FOKUS_POOLS.schaerfe) || ERSATZ);
        pool.forEach(m => SZ.bild(m.bild));   // gestaltete Motive vorab laden (sonst Platzhalter)
        nr = Math.max(0, (abZiel || 1) - 1); ziel = null; ablenker = []; effekte = []; aus = false; warte = 0.4;
      },
      // Level läuft erst nach dem Level-Titel los
      schritt(dt) {
        dt *= tempo;
        effekte.forEach(f => { f.t += dt; });
        effekte = effekte.filter(f => f.t < 1.1);
        if (aus) return;
        if (!ziel) { warte -= dt; if (warte <= 0) naechstes(); return; }
        ziel.t += dt;
        ablenker.forEach(a => { a.t += dt; });
        // Ablenker (ab Ziel 5) weichen dem Ziel aus, damit es nie verdeckt ist (MZ, 26.10.2026) – erst wenn sie im Bild sind
        if (!ziel.ergebnis && window.FOKUS_GEMEIN) {
          const vz = (ziel.x1 - ziel.x0) / ziel.dauer;
          window.FOKUS_GEMEIN.ausweichen(kasten(ziel, 4), ablenker.filter(a => a.t > -0.6).map(a => ({ o: a, k: kasten(a), vx: (a.x1 - a.x0) / a.dauer - vz })),
            dt, api.oben(), H - 8, 12);
        }
        if (!ziel.ergebnis && ziel.t >= ziel.dauer) ergebnis('verpasst');
        if (ziel.ergebnis) {
          ziel.weg += dt;
          if (ziel.weg > 0.55 || ziel.t >= ziel.dauer) {
            if (ziel.weg > 0.55) { nr++; ziel = null; ablenker = []; warte = W.pause; if (api.abgebrochen()) aus = true; }
          }
        }
      },
      tipp(x, y) {
        if (!ziel || ziel.ergebnis || aus) return false;
        const zk = kasten(ziel, 10);
        if (!drin(zk, x, y) && ablenker.some(a => a.t > 0 && drin(kasten(a, 4), x, y))) { ergebnis('falsch', x, y); return true; }
        const d = ziel.t - ziel.tp;
        if (Math.abs(d) <= ziel.halb) ergebnis('treffer', x, y);
        else ergebnis(d < 0 ? 'frueh' : 'spaet', x, y);
        return true;
      },
      zeichne(g, b, h, laeuft) {
        if (hg) g.drawImage(hg, 0, 0, B, H);
        if (!laeuft) return;
        // Ablenker hinter dem Ziel, wenn sie weiter weg sind (kleiner)
        // Ablenker nach Größe, das Ziel immer obenauf (MZ, 26.10.2026)
        const alle = ablenker.filter(a => a.t > 0).map(a => ({ o: a, ab: true })).sort((p, q) => p.o.bild.h - q.o.bild.h).concat(ziel ? [{ o: ziel }] : []);
        alle.forEach(({ o, ab }) => {
          const l = lage(o);
          let u, alpha = 1;
          if (ab) u = o.min + (1 - o.min) * Math.pow(Math.sin(Math.PI * o.t / o.P), 2);
          else if (o.ergebnis) { u = o.ergebnis.art === 'treffer' ? 0 : unschaerfe(o.t - o.tp, o.P, o.rest); alpha = Math.max(0, 1 - o.weg / 0.55); }
          else u = unschaerfe(o.t - o.tp, o.P, o.rest);
          g.save();
          if (!o.rechts) { g.translate(l.x * 2 + l.w, 0); g.scale(-1, 1); }
          SZ.zeichneUnscharf(g, o.st, l.x, l.y, l.w, l.h, u, alpha);
          g.restore();
        });
        // Sucher-Ecken um das Ziel (zeigt nur, welches Motiv gemeint ist – nicht, wann es scharf ist)
        if (ziel && !ziel.ergebnis) {
          const k = kasten(ziel, 8), e = Math.min(16, k.w * 0.22, k.h * 0.3);
          g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.lineCap = 'round';
          g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3;
          g.beginPath();
          [[k.x, k.y, 1, 1], [k.x + k.w, k.y, -1, 1], [k.x, k.y + k.h, 1, -1], [k.x + k.w, k.y + k.h, -1, -1]].forEach(([x, y, sx, sy]) => {
            g.moveTo(x, y + sy * e); g.lineTo(x, y); g.lineTo(x + sx * e, y);
          });
          g.stroke(); g.restore();
        }
        // Treffer: Auslöser-Blitz und Ring, Punkte steigen auf; Fehler: Wort
        effekte.forEach(f => {
          const u = Math.min(1, f.t / 1.1);
          g.save();
          if (f.art === 'treffer') {
            if (f.t < 0.18) { g.fillStyle = `rgba(255,255,255,${0.35 * (1 - f.t / 0.18)})`; g.fillRect(0, 0, B, H); }
            g.strokeStyle = `rgba(255,255,255,${1 - u})`; g.lineWidth = 3;
            g.beginPath(); g.arc(f.cx, f.cy, f.r * (0.7 + u * 0.6), 0, 7); g.stroke();
          }
          g.globalAlpha = 1 - Math.pow(u, 3);
          g.font = `800 ${Math.round(Math.min(B, H) * 0.075)}px Poppins, system-ui, sans-serif`;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineWidth = 5; g.strokeStyle = f.art === 'treffer' ? 'rgba(10,60,62,.75)' : 'rgba(60,20,10,.7)';
          g.fillStyle = f.art === 'treffer' ? '#fff' : '#ffe2d6';
          // Rückmeldung (z. B. „Scharf“, „Zu früh“), bei Treffern darunter die Punkte – nie über den Rand (oben, unten, Seiten)
          const { tx, ty } = window.FOKUS_GEMEIN.textLage(g, f, B, H, api.oben(), H, f.cy - f.r * 0.9 - u * 34);
          if (f.text) { g.strokeText(f.text, tx, ty); g.fillText(f.text, tx, ty); }
          if (f.zahl) {
            const gr = Math.round(Math.min(B, H) * 0.055), zy = f.text ? ty + gr * 1.3 : ty;
            g.font = `700 ${gr}px Poppins, system-ui, sans-serif`;
            g.strokeText(f.zahl, tx, zy); g.fillText(f.zahl, tx, zy);
          }
          g.restore();
        });
      },
      // Testhilfe (nur zur Laufzeit, FOKUS_TEST.ueberdecken()): ein Ablenker zieht genau mit dem Ziel und deckt dessen untere
      // Hälfte ab, ohne auszuweichen
      testUeberdecken() {
        if (!ziel) return null;
        const a = bereiten(pool.find(p => p !== ziel.m) || ziel.m, ziel.k, true);
        Object.assign(a, { test: true, rechts: ziel.rechts, x0: ziel.x0, x1: ziel.x1, dauer: ziel.dauer, t: ziel.t, wob: ziel.wob,
          P: ziel.P, min: Math.max(0.45, ziel.tol * 3), y: ziel.y + ziel.bild.h * 0.45 });
        ablenker.push(a);
        const k = kasten(a);
        return { x: k.x + k.w / 2, y: k.y + k.h / 2, w: k.w, h: k.h };
      },
      // Testhilfe: Lage und Zeiten des aktuellen Ziels
      zustand() {
        if (!ziel) return { ziel: null, nr: nr + 1, warte };
        const k = kasten(ziel);
        return { nr: ziel.k + 1, name: ziel.m.name, t: ziel.t, tp: ziel.tp, halb: ziel.halb, P: ziel.P, dauer: ziel.dauer,
          bisScharf: ziel.tp - ziel.t, u: unschaerfe(ziel.t - ziel.tp, ziel.P, ziel.rest), erledigt: !!ziel.ergebnis,
          x: k.x + k.w / 2, y: k.y + k.h / 2, w: k.w, h: k.h,
          verdeckt: window.FOKUS_GEMEIN ? +window.FOKUS_GEMEIN.verdeckt(k, ablenker.filter(a => a.t > 0).map(a => kasten(a))).toFixed(3) : 0,
          ablenker: ablenker.filter(a => a.t > 0).map(a => { const q = kasten(a); return { x: q.x + q.w / 2, y: q.y + q.h / 2, w: q.w, h: q.h }; }) };
      },
      unschaerfe, halbesFenster,
    };
  };
})();
