// Level 2 „Richtung“ (MZ, 26.10.2026; Mechanik Phase 4): Ringe mit Öffnung (wie beim Landolt-Ring) schweben über dem
// Schaufenster. Oben wird eine Richtung angesagt („Öffnung nach links“). Nur der Ring mit dieser Öffnung zählt.
//   Treffer   den passenden Ring antippen – Punkte nach Reaktionszeit (bis `voll` 100, bis Ende der Sichtzeit linear auf 50)
//   falsch    einen Ring mit anderer Öffnung antippen (Fehler, Ziel beendet)
//   verpasst  der passende Ring verschwindet ungetippt
//   Tippen ins Leere zählt nicht.
// Ein Ziel = ein passender Ring. Bis er kommt, schweben nur andere Ringe (Versuchung). Von Ziel zu Ziel: kleinere Ringe,
// kürzere Sichtzeit, mehr andere Ringe; Richtungswechsel bei den Zielen in `wechsel` („Neue Richtung“), ab `schraegAb`
// auch schräge Richtungen und Ablenker mit fast gleicher Öffnung (45° daneben), ab `schneller` „Jetzt schneller“.
// Werte in daten.js (FOKUS.richtung).
(function () {
  'use strict';
  const D = window.FOKUS, SZ = window.FOKUS_SZENE, G = window.FOKUS_GEMEIN;
  window.FOKUS_LEVEL = window.FOKUS_LEVEL || {};
  window.FOKUS_LINSE = window.FOKUS_LINSE || {};
  const { lerp, klemm, mischen } = G;

  const WINKEL = { rechts: 0, 'unten rechts': Math.PI / 4, unten: Math.PI / 2, 'unten links': 3 * Math.PI / 4, links: Math.PI,
    'oben links': -3 * Math.PI / 4, oben: -Math.PI / 2, 'oben rechts': -Math.PI / 4 };
  const GERADE = ['oben', 'unten', 'links', 'rechts'];
  const ERSATZ = Object.keys(WINKEL).map(r => ({ richtung: r, lang: 'Öffnung nach ' + r, kurz: r }));

  // Ring zeichnen: weiße Scheibe (wie ein Sehzeichen-Plättchen) mit dunklem Ring, Öffnung in Richtung w
  function ring(g, x, y, R, w, alpha, farbe) {
    g.save();
    g.globalAlpha = alpha == null ? 1 : alpha;
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = R * 0.25; g.shadowOffsetY = R * 0.08;
    g.fillStyle = 'rgba(255,255,255,.94)';
    g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
    g.shadowColor = 'transparent';
    const ro = R * 0.7, st = ro * 0.4, rc = ro - st / 2, luecke = Math.asin(Math.min(0.99, (st / 2) / rc));
    g.strokeStyle = farbe || '#1b2a2b'; g.lineWidth = st; g.lineCap = 'butt';
    g.beginPath(); g.arc(x, y, rc, w + luecke, w + Math.PI * 2 - luecke); g.stroke();
    g.restore();
  }
  // kleines Sehzeichen für das Ansage-Band
  // Ring-Symbol fürs Ansage-Band; Größe in em (wächst mit der Schrift des Bands, z. B. quer am PC), Auflösung reicht bis ca. 3×
  function ansageBild(w, em) {
    const c = document.createElement('canvas'), d = Math.min(window.devicePixelRatio || 1, 2.5) * 2.4, s = 26;
    c.width = c.height = Math.round(s * d); c.style.width = c.style.height = (em || 1.6) + 'em';
    const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    const ro = s * 0.45, st = ro * 0.4, rc = ro - st / 2, l = Math.asin((st / 2) / rc);
    g.strokeStyle = '#fff'; g.lineWidth = st; g.beginPath(); g.arc(s / 2, s / 2, rc, w + l, w + Math.PI * 2 - l); g.stroke();
    return c;
  }

  window.FOKUS_LEVEL[2] = function (api) {
    const W = D.richtung, N = D.regeln.ziele, R = D.regeln, lv = D.level[1];
    const richtungen = (lv.richtungen && lv.richtungen.length ? lv.richtungen : ERSATZ).filter(r => WINKEL[r.richtung] != null);
    const zusatz = lv.zusatzansagen || [];
    let B = 0, H = 0, dpr = 1, hg = null, hgSchl = '';
    let ringe = [], nr = 0, ziel = null, richtung = null, phase = 'aus', uhr = 0, nachschub = 0, aus = false;
    const fx = G.effekte(), tempo = api.tempo || 1;

    const kurzSeite = () => Math.min(B, H);
    function bereich() {
      const oben = api.oben() + 4, rand = 10;
      return { x: rand, y: oben, w: B - rand * 2, h: Math.max(80, H - oben - rand - 6) };
    }
    function neuerRing(dir, istZiel, k, leben) {
      const r = Math.max(22, kurzSeite() * lerp(W.groesse, k, N) * (istZiel ? 1 : 0.92 + Math.random() * 0.16));
      const a = bereich(), belegt = ringe.filter(q => !q.weg).map(q => ({ x: q.x - q.r, y: q.y - q.r, w: q.r * 2, h: q.r * 2 }));
      const p = G.platz(a, r * 2, r * 2, belegt, 10, 50);
      if (!p) return null;
      const v = 6 + Math.random() * 14, wv = Math.random() * Math.PI * 2;
      const q = { x: p.x + r, y: p.y + r, r, dir, w: WINKEL[dir], ziel: istZiel, t: 0, leben, vx: Math.cos(wv) * v, vy: Math.sin(wv) * v, weg: 0, puls: Math.random() * 6 };
      ringe.push(q);
      return q;
    }
    // andere Öffnung: ab schraegAb gern 45° daneben (sieht fast gleich aus)
    function andereRichtung(k) {
      const alle = k + 1 >= W.schraegAb ? Object.keys(WINKEL) : GERADE;
      const ohne = alle.filter(d => d !== richtung.richtung);
      if (k + 1 >= W.schraegAb && Math.random() < 0.5) {
        const nah = ohne.filter(d => Math.abs(Math.atan2(Math.sin(WINKEL[d] - WINKEL[richtung.richtung]), Math.cos(WINKEL[d] - WINKEL[richtung.richtung]))) < 0.8);
        if (nah.length) return nah[Math.floor(Math.random() * nah.length)];
      }
      return ohne[Math.floor(Math.random() * ohne.length)];
    }
    function ablenkerAuffuellen(k) {
      const soll = W.ablenker[Math.min(k, W.ablenker.length - 1)] || 0;
      const da = ringe.filter(q => !q.ziel && !q.weg).length;
      if (da < soll && nachschub <= 0) {
        neuerRing(andereRichtung(k), false, k, (1.6 + Math.random() * 2.2) * lerp([1, 0.75], k, N));
        nachschub = 0.15 + Math.random() * 0.5;
      }
    }
    function richtungWaehlen(k) {
      const erlaubt = richtungen.filter(r => k + 1 >= W.schraegAb ? true : GERADE.includes(r.richtung));
      const ohne = erlaubt.filter(r => !richtung || r.richtung !== richtung.richtung);
      richtung = ohne[Math.floor(Math.random() * ohne.length)] || erlaubt[0];
      // vorhandene Ringe mit der neuen Richtung verschwinden (sonst wären sie auf einmal „richtig“)
      ringe.forEach(q => { if (q.dir === richtung.richtung && !q.weg) q.weg = 0.001; });
      G.ansage.zeigen({ bild: ansageBild(WINKEL[richtung.richtung]), text: richtung.lang });
    }
    function naechstes() {
      if (nr >= N) { aus = true; api.fertig(); return; }
      const k = nr, neueRichtung = !richtung || W.wechsel.includes(k + 1);
      const wechsel = neueRichtung && k > 0;
      if (neueRichtung) {
        richtungWaehlen(k);
        // deutliche Info beim Wechsel (MZ, 26.10.2026): mittig Text aus texte.js + neues Ring-Symbol, Band pulsiert einmal,
        // Ringe und Uhr stehen so lange still, Tippen zählt nicht
        if (wechsel) {
          G.ansage.zusatz(k + 1 === W.schneller && zusatz[1] ? zusatz[1] : zusatz[0], ansageBild(WINKEL[richtung.richtung], 1.5), W.wechselPause || 1.3);
          G.ansage.puls();
        }
      }
      const a = lerp([W.warten[0][0], W.warten[1][0]], k, N), b = lerp([W.warten[0][1], W.warten[1][1]], k, N);
      ziel = { k, warten: a + Math.random() * (b - a), ring: null, ergebnis: null, t: 0 };
      phase = wechsel ? 'wechsel' : 'warten'; uhr = wechsel ? (W.wechselPause || 1.3) : 0;
      api.ziel(k + 1, null);
    }
    function ergebnis(art, q, x, y, rt) {
      const e = { ziel: ziel.k + 1, art, d: 0, name: richtung.kurz };
      if (art === 'treffer') { e.reaktion = rt; e.punkte = G.punkteNachZeit(rt, W.voll, ziel.ring.leben, R); }
      ziel.ergebnis = e;
      const cx = q ? q.x : (x != null ? x : B / 2), cy = q ? q.y : (y != null ? y : H / 2);
      fx.neu(art, cx, cy, q ? q.r : 40, api.rueckmeldung(art, e.punkte), art === 'treffer' ? '+' + e.punkte : '');
      if (ziel.ring) ziel.ring.weg = 0.001;
      if (q && q !== ziel.ring) q.weg = 0.001;
      api.ergebnis(e);
      phase = 'pause'; uhr = W.pause;
    }

    return {
      groesse(b, h, d) {
        B = b; H = h; dpr = d || 1;
        const s = B + 'x' + H + SZ.hgBereit(2, B, H);
        if (s !== hgSchl) { hg = SZ.levelBild(2, B, H, dpr); hgSchl = s; }
        ringe.forEach(q => { q.x = klemm(q.x, q.r, B - q.r); q.y = klemm(q.y, q.r, H - q.r); });
      },
      neu(abZiel) {
        ringe = []; fx.leeren(); richtung = null; aus = false; nachschub = 0.3;
        nr = Math.max(0, (abZiel || 1) - 1); ziel = null; phase = 'start'; uhr = 0.3;
      },
      stopp() { G.ansage.verbergen(); },
      schritt(dt) {
        dt *= tempo;
        fx.schritt(dt);
        // Ringe schweben, prallen sanft am Rand ab, verschwinden nach ihrer Zeit
        const a = bereich(), steht = phase === 'wechsel';   // beim Richtungswechsel stehen Ringe und Uhr
        ringe.forEach(q => {
          if (q.weg) q.weg += dt;
          if (steht) return;
          q.t += dt; q.puls += dt;
          q.x += q.vx * dt; q.y += q.vy * dt;
          if (q.x < a.x + q.r || q.x > a.x + a.w - q.r) { q.vx = -q.vx; q.x = klemm(q.x, a.x + q.r, a.x + a.w - q.r); }
          if (q.y < a.y + q.r || q.y > a.y + a.h - q.r) { q.vy = -q.vy; q.y = klemm(q.y, a.y + q.r, Math.max(a.y + q.r, a.y + a.h - q.r)); }
          if (!q.weg && q.t >= q.leben && !q.ziel) q.weg = 0.001;
        });
        ringe = ringe.filter(q => !(q.weg > 0.3));
        if (aus || api.abgebrochen()) { aus = true; return; }
        nachschub -= dt;
        if (phase === 'start') { uhr -= dt; if (uhr <= 0) naechstes(); return; }
        if (!ziel) return;
        if (steht) { uhr -= dt; if (uhr <= 0) phase = 'warten'; return; }
        ablenkerAuffuellen(ziel.k);
        ziel.t += dt;
        if (phase === 'warten' && ziel.t >= ziel.warten) {
          const q = neuerRing(richtung.richtung, true, ziel.k, lerp(W.sicht, ziel.k, N));
          if (q) { ziel.ring = q; phase = 'aktiv'; }
        } else if (phase === 'aktiv' && ziel.ring.t >= ziel.ring.leben) {
          ergebnis('verpasst', ziel.ring);
        } else if (phase === 'pause') {
          uhr -= dt;
          if (uhr <= 0) { nr++; ziel = null; if (api.abgebrochen()) { aus = true; return; } naechstes(); }
        }
      },
      tipp(x, y) {
        if (!ziel || aus || phase === 'pause' || phase === 'start' || phase === 'wechsel') return false;
        let best = null, abst = 1e9;
        ringe.forEach(q => {
          if (q.weg || q.t < 0.08) return;
          const d = Math.hypot(x - q.x, y - q.y);
          if (d <= Math.max(q.r * 1.12, 24) && d < abst) { best = q; abst = d; }
        });
        if (!best) return false;
        if (best.ziel) ergebnis('treffer', best, x, y, best.t);
        else ergebnis('falsch', best, x, y);
        return true;
      },
      zeichne(g, b, h, laeuft) {
        if (hg) g.drawImage(hg, 0, 0, B, H);
        if (!laeuft) return;
        // leichte Abdunklung, damit die Plättchen klar vor dem Schaufenster stehen
        g.fillStyle = 'rgba(8,30,32,.18)'; g.fillRect(0, 0, B, H);
        ringe.forEach(q => {
          const rein = Math.min(1, q.t / 0.22), raus = q.weg ? Math.max(0, 1 - q.weg / 0.3) : 1;
          const s = (0.6 + 0.4 * (1 - Math.pow(1 - rein, 3))) * (1 + 0.015 * Math.sin(q.puls * 3)) * (q.weg && q.ziel && ziel && ziel.ergebnis && ziel.ergebnis.art === 'treffer' ? 1 + q.weg : 1);
          // gegen Ende der Sichtzeit verblasst der Ring leicht (kündigt das Verschwinden an)
          const ende = q.leben - q.t < 0.4 ? 0.55 + 0.45 * Math.max(0, (q.leben - q.t) / 0.4) : 1;
          ring(g, q.x, q.y, q.r * s, q.w, rein * raus * ende);
        });
        fx.zeichne(g, B, H, api.oben());
      },
      zustand() {
        return { nr: ziel ? ziel.k + 1 : nr + 1, phase, richtung: richtung && richtung.richtung,
          ringe: ringe.filter(q => !q.weg).map(q => ({ x: q.x, y: q.y, r: q.r, dir: q.dir, ziel: q.ziel, t: q.t, leben: q.leben })) };
      },
    };
  };

  // Startbild: ein Ring scharf in der Linse
  window.FOKUS_LINSE[2] = function (g, d, dpr) {
    g.save(); g.scale(dpr, dpr);
    ring(g, d / 2, d * 0.52, d * 0.2, Math.PI);
    g.restore();
  };
})();
