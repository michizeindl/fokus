// Level 4 „Rauschen“ (MZ, 26.10.2026; Mechanik Phase 4): In der Hörkabine rauscht es gleichmäßig. Oben wird ein
// Zielgeräusch angesagt (Name). Bei den ersten Zielen (`vorhoeren`) erklingt es vorher einmal zum Einprägen. Dann kommen
// nacheinander andere Geräusche und zuletzt das Ziel; leise darunter liegen ab Ziel 3 lange Ablenk-Geräusche (Teppich).
//   Treffer   tippen (irgendwo), während das Zielgeräusch klingt (bis `nachlauf` danach) – Punkte nach Reaktion ab Beginn
//             (bis `voll` 100, bis `grenze` linear auf 50)
//   falsch    tippen, während ein anderes Geräusch klingt
//   zu früh   tippen in der Stille davor
//   verpasst  das Zielgeräusch ist vorbei, ohne dass getippt wurde
// Hilfe: eine dezente Schallwelle zeigt, wann etwas klingt (aus der Hülle der Geräusche – auch ohne Ton).
// Geräusche: Pool „rauschen“ in motive.js (70 Ziele, 30 Ablenker, Paare = ähnlich klingend). Echte Aufnahmen (Sound
// Artist, Phase 3) nach optik-fokus/klaenge/rauschen/<nr>-<name>.mp3 legen und daten-bauen.py laufen lassen – bis dahin
// erzeugt spiel-gemein.js Platzhalter-Klänge. Rauschen: daten.js rauschen.grundrauschen (Datei) oder erzeugt.
(function () {
  'use strict';
  const D = window.FOKUS, SZ = window.FOKUS_SZENE, G = window.FOKUS_GEMEIN, TON = G.ton;
  window.FOKUS_LEVEL = window.FOKUS_LEVEL || {};
  window.FOKUS_LINSE = window.FOKUS_LINSE || {};
  const { lerp, klemm, mischen } = G;
  const ERSATZ = [{ name: 'Türklingel', art: 'ziel', laenge: 2 }, { name: 'Hund bellt', art: 'ziel', laenge: 2 }, { name: 'Kuhglocke', art: 'ziel', laenge: 3 },
    { name: 'Hammer klopft', art: 'ziel', laenge: 2 }, { name: 'Regen auf dem Dach', art: 'ablenker', laenge: 5 }];
  const pool = () => (window.FOKUS_POOLS && window.FOKUS_POOLS.rauschen) || ERSATZ;

  // Schallwelle als Balken (für Spiel und Linse)
  function welle(g, x, y, w, h, werte, farbe) {
    const n = werte.length, s = w / n, bw = Math.max(2, s * 0.56);
    g.save(); g.fillStyle = farbe || 'rgba(255,255,255,.9)';
    for (let i = 0; i < n; i++) {
      const a = Math.max(0.04, werte[i]) * h / 2, bx = x + i * s + (s - bw) / 2;
      g.beginPath(); g.roundRect ? g.roundRect(bx, y - a, bw, a * 2, bw / 2) : g.rect(bx, y - a, bw, a * 2); g.fill();
    }
    g.restore();
  }

  window.FOKUS_LEVEL[4] = function (api) {
    const W = D.rauschen, N = D.regeln.ziele, R = D.regeln;
    let B = 0, H = 0, dpr = 1, hg = null, hgSchl = '';
    let nr = 0, ziel = null, phase = 'aus', uhr = 0, aus = false, zeit = 0;
    let rauschGriff = null, teppiche = [], laufend = [], verlauf = [], verlaufUhr = 0, reiheZiele = [];
    const fx = G.effekte(), tempo = api.tempo || 1;
    const ziele = () => pool().filter(p => p.art === 'ziel');
    const ablenkPool = () => pool().filter(p => p.art === 'ablenker');

    function rauschenStellen(p, zeitK) {
      if (!TON.an()) { if (rauschGriff) { rauschGriff.aus(0.2); rauschGriff = null; } return; }
      if (!rauschGriff || !rauschGriff.laeuft) rauschGriff = TON.spielen(TON.grundrauschen(W.grundrauschen), p, { schleife: true, einblenden: 0.6 });
      else rauschGriff.pegel(p, zeitK || 0.3);
    }
    function allesAus() {
      laufend.forEach(e => e.griff && e.griff.aus(0.05)); laufend = [];
      teppiche.forEach(t => t.griff && t.griff.aus(0.3)); teppiche = [];
      if (rauschGriff) { rauschGriff.aus(0.3); rauschGriff = null; }
    }
    // ein Geräusch auf die Zeitleiste: { k (Klang), start, ende, ziel }
    function ereignis(m, start, istZiel) {
      const k = TON.klang(m);
      const len = Math.min(k.dauer, istZiel ? W.hoechstens : (W.hoechstensAblenker || 1.8));
      return { m, k, start, ende: start + len, len, ziel: istZiel, griff: null, gespielt: false };
    }
    function ablenkerWaehlen(m, zahl, aehnlich) {
      const andere = pool().filter(p => p.name !== m.name);
      let kand = [];
      if (aehnlich && m.paar) kand = mischen(andere.filter(p => p.paar === m.paar));
      return kand.concat(mischen(andere.filter(p => p.art === 'ziel' && !kand.includes(p)))).slice(0, zahl);
    }
    function naechstes() {
      if (nr >= N) { aus = true; api.fertig(); return; }
      const k = nr, m = reiheZiele[k % reiheZiele.length];
      ziel = { k, m, t: 0, ergebnis: null, ereignisse: [], vor: null };
      api.ziel(k + 1, null);
      const PH = D.level[3].phasen || {};
      G.ansage.zeigen({ bild: G.LAUTSPRECHER, text: m.name, phase: k < W.vorhoeren ? PH.vorhoeren : PH.hoeren, jetzt: k >= W.vorhoeren });
      rauschenStellen(lerp(W.pegelRauschen, k, N));
      // vorhören: das Ziel einmal klar, Rauschen leiser
      let t = 0.7;
      if (k < W.vorhoeren) {
        ziel.vor = ereignis(m, t, true);
        t = ziel.vor.ende + 0.9;
      }
      ziel.hoerenAb = t;
      t += 0.7;
      const zahl = W.ablenker[Math.min(k, W.ablenker.length - 1)] || 0;
      ablenkerWaehlen(m, zahl, k + 1 >= W.aehnlichAb).forEach(p => {
        const e = ereignis(p, t, false); ziel.ereignisse.push(e);
        const [a, b] = [lerp([W.luecke[0][0], W.luecke[1][0]], k, N), lerp([W.luecke[0][1], W.luecke[1][1]], k, N)];
        t = e.ende + a + Math.random() * (b - a);
      });
      ziel.zielE = ereignis(m, t, true);
      ziel.ereignisse.push(ziel.zielE);
      phase = ziel.vor ? 'vorhoeren' : 'ansage';
    }
    function teppichStellen(k) {
      const soll = W.teppich[Math.min(k, W.teppich.length - 1)] || 0;
      teppiche = teppiche.filter(t => t.laeuft);
      while (teppiche.length < soll) {
        const frei = ablenkPool().filter(p => !teppiche.some(t => t.m === p));
        const m = frei[Math.floor(Math.random() * frei.length)];
        if (!m) break;
        const kl = TON.klang(m);
        teppiche.push({ m, k: kl, t: Math.random() * kl.dauer, laeuft: true, griff: TON.spielen(kl, W.pegelZiel * 0.28, { schleife: true, einblenden: 1.2 }) });
      }
    }
    // aktuelle Lautstärke für die Welle (0–1), aus den Hüllen
    function huelle(e, t) { const i = Math.floor((t - e.start) * 40); return i >= 0 && i < e.k.huelle.length && t < e.ende ? e.k.huelle[i] : 0; }
    function pegelJetzt() {
      if (!ziel) return 0;
      let p = 0;
      const t = ziel.t;
      if (ziel.vor) p = Math.max(p, huelle(ziel.vor, t));
      ziel.ereignisse.forEach(e => { if (!(ziel.ergebnis && e.ziel)) p = Math.max(p, huelle(e, t)); });
      teppiche.forEach(tp => { const i = Math.floor(((zeit + tp.t) % tp.k.dauer) * 40); p = Math.max(p, (tp.k.huelle[i] || 0) * 0.28); });
      return p;
    }
    function ergebnis(art, rt) {
      const e = { ziel: ziel.k + 1, art, d: 0, name: ziel.m.name };
      if (art === 'treffer') { e.reaktion = rt; e.punkte = G.punkteNachZeit(rt, W.voll, lerp(W.grenze, ziel.k, N), R); }
      ziel.ergebnis = e;
      // nach dem Ergebnis: laufende Geräusche sanft aus
      laufend.forEach(x => x.griff && x.griff.aus(0.12)); laufend = [];
      const y = welleY();
      fx.neu(art, B / 2, y, Math.min(B, H) * 0.12, api.rueckmeldung(art, e.punkte), art === 'treffer' ? '+' + e.punkte : '');
      api.ergebnis(e);
      phase = 'pause'; uhr = W.pause;
    }
    const welleY = () => Math.max(api.oben() + 70, Math.min(H - 70, H * (B > H ? 0.68 : 0.64)));

    return {
      groesse(b, h, d) {
        B = b; H = h; dpr = d || 1;
        const s = B + 'x' + H + SZ.hgBereit(4, B, H);
        if (s !== hgSchl) { hg = SZ.levelBild(4, B, H, dpr); hgSchl = s; }
      },
      vorladen() { pool().forEach(m => { if (m.ton) TON.klang(m); }); },   // echte Aufnahmen vorab laden (Platzhalter erst bei Bedarf)
      neu(abZiel) {
        allesAus();
        reiheZiele = mischen(ziele());
        fx.leeren(); aus = false; ziel = null; zeit = 0; verlauf = new Array(64).fill(0);
        nr = Math.max(0, (abZiel || 1) - 1); phase = 'start'; uhr = 0.4;
        TON.audio();
        rauschenStellen(lerp(W.pegelRauschen, nr, N));
      },
      stopp() { allesAus(); G.ansage.verbergen(); },
      schritt(dt) {
        dt *= tempo; zeit += dt;
        fx.schritt(dt);
        // Welle: alle 1/24s ein Balken
        verlaufUhr += dt;
        while (verlaufUhr > 1 / 24) { verlaufUhr -= 1 / 24; verlauf.push(pegelJetzt() * (0.85 + Math.random() * 0.15) + (rauschGriff || !TON.an() ? 0.05 + Math.random() * 0.05 : 0.03)); verlauf.shift(); }
        if (aus || api.abgebrochen()) { if (!aus) allesAus(); aus = true; return; }
        if (phase === 'start') { uhr -= dt; if (uhr <= 0) naechstes(); return; }
        if (!ziel) return;
        ziel.t += dt;
        const t = ziel.t;
        // Ton-Knopf kann mitten im Level umgestellt werden
        if (!TON.an() && rauschGriff) allesAus();
        // Geräusche zur rechten Zeit starten
        const starten = e => {
          if (e.gespielt || t < e.start || (ziel.ergebnis && e.ziel)) return;
          e.gespielt = true;
          if (TON.an()) { e.griff = TON.spielen(e.k, W.pegelZiel, { hoechstens: e.len }); laufend.push(e); }
        };
        if (ziel.vor) {
          starten(ziel.vor);
          if (phase === 'vorhoeren') {
            G.ansage.hoert(t >= ziel.vor.start && t < ziel.vor.ende);
            rauschenStellen(t < ziel.vor.ende + 0.3 ? lerp(W.pegelRauschen, ziel.k, N) * 0.35 : lerp(W.pegelRauschen, ziel.k, N), 0.25);
            if (t >= ziel.hoerenAb) { phase = 'hoeren'; G.ansage.phase((D.level[3].phasen || {}).hoeren, true); }
          }
        } else if (phase === 'ansage' && t >= ziel.hoerenAb) phase = 'hoeren';
        if (phase === 'hoeren') {
          teppichStellen(ziel.k);
          ziel.ereignisse.forEach(starten);
          if (!ziel.ergebnis && t > ziel.zielE.ende + W.nachlauf) ergebnis('verpasst');
        }
        if (phase === 'pause') {
          uhr -= dt;
          if (uhr <= 0) {
            nr++; ziel = null;
            if (api.abgebrochen()) { allesAus(); aus = true; return; }
            naechstes();
          }
        }
        laufend = laufend.filter(e => t < e.ende + 0.1);
      },
      tipp() {
        if (!ziel || aus || phase !== 'hoeren' || ziel.ergebnis) return false;
        const t = ziel.t, z = ziel.zielE;
        if (t >= z.start && t <= z.ende + W.nachlauf) ergebnis('treffer', t - z.start);
        else if (ziel.ereignisse.some(e => !e.ziel && t >= e.start && t <= e.ende)) ergebnis('falsch');
        else ergebnis('frueh');
        return true;
      },
      zeichne(g, b, h, laeuft) {
        if (hg) g.drawImage(hg, 0, 0, B, H);
        if (!laeuft) return;
        g.fillStyle = 'rgba(8,30,32,.22)'; g.fillRect(0, 0, B, H);
        // dezente Schallwelle in einer Kapsel
        const w = Math.min(B * 0.84, 560), hh = Math.max(70, Math.min(130, H * 0.16)), x = (B - w) / 2, y = welleY();
        g.save();
        g.fillStyle = 'rgba(10,50,52,.45)';
        g.beginPath(); g.roundRect ? g.roundRect(x - 14, y - hh / 2 - 10, w + 28, hh + 20, 22) : g.rect(x - 14, y - hh / 2 - 10, w + 28, hh + 20); g.fill();
        welle(g, x, y, w, hh, verlauf, 'rgba(255,255,255,.85)');
        g.restore();
        fx.zeichne(g, B, H, api.oben());
      },
      zustand() {
        if (!ziel) return { nr: nr + 1, phase };
        const z = ziel.zielE;
        return { nr: ziel.k + 1, name: ziel.m.name, phase, t: ziel.t, hoerenAb: ziel.hoerenAb, vorhoeren: !!ziel.vor,
          ziel: { start: z.start, ende: z.ende, echt: z.k.echt }, bisZiel: z.start - ziel.t,
          ereignisse: ziel.ereignisse.map(e => ({ name: e.m.name, start: e.start, ende: e.ende, ziel: e.ziel })),
          ton: TON.laeuft, rauschen: !!rauschGriff, teppiche: teppiche.map(t => t.m.name) };
      },
    };
  };

  // Startbild: Schallwelle in der Linse
  window.FOKUS_LINSE[4] = function (g, d, dpr) {
    g.save(); g.scale(dpr, dpr);
    g.fillStyle = 'rgba(10,50,52,.4)'; g.beginPath(); g.arc(d / 2, d / 2, d * 0.32, 0, 7); g.fill();
    const werte = []; for (let i = 0; i < 15; i++) werte.push(0.15 + 0.85 * Math.pow(Math.sin(i / 14 * Math.PI), 1.6) * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7))));
    welle(g, d * 0.24, d / 2, d * 0.52, d * 0.4, werte, '#fff');
    g.restore();
  };
})();
