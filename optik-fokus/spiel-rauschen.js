// Level 4 „Rauschen“ (MZ, 26.10.2026; Mechanik Phase 4): In der Hörkabine rauscht es gleichmäßig. Oben wird ein
// Zielgeräusch angesagt (Name). Bei den ersten Zielen (`vorhoeren`) erklingt es vorher einmal zum Einprägen. Dann kommen
// nacheinander andere Geräusche und zuletzt das Ziel; leise darunter liegen ab Ziel 3 lange Ablenk-Geräusche (Teppich).
//   Treffer   tippen (irgendwo), während das Zielgeräusch klingt (bis `nachlauf` danach, mindestens FENSTER_MIN nach dem
//             hörbaren Einsatz) – Punkte nach Reaktion ab dem hörbaren Einsatz (bis `voll` 100, bis `grenze` linear auf 50)
//   falsch    tippen, während ein anderes Geräusch klingt (gleiches Fenster wie beim Ziel)
//   zu früh   tippen in der Stille davor
//   verpasst  das Fenster des Zielgeräuschs ist vorbei, ohne dass getippt wurde
// Synchron mit dem Ton (MZ, 26.10.2026): Zeiten zählen ab dem Moment, in dem ein Geräusch am Ohr hörbar wird – Start im
// AudioContext + hörbarer Einsatz der Datei (klaenge.js `einsatz`, nachgemessen) + Ausgabe-Latenz (TON.hoerJetzt). Die
// Spieluhr folgt der Audiouhr (TON.takt). Ist ein Klang beim Start noch nicht entschlüsselt oder der Ton noch nicht frei,
// wartet der Ablauf (höchstens WARTEN). Erste SCHONZEIT der Hörphase: Tippen wird ignoriert (Vorführung klingt nach).
// Ohne Ton: gleiche Regeln auf der Spieluhr, Einsatz aus der Hülle.
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

  const FENSTER_MIN = 1.2;   // Fenster endet frühestens so lange nach dem hörbaren Einsatz (auch bei sehr kurzen Klängen)
  const SCHONZEIT = 0.5;     // so lange nach Beginn der Hörphase wird Tippen ignoriert
  const WARTEN = 2.5;        // höchstens so lange wartet ein Geräusch, bis es wirklich erklingen kann

  window.FOKUS_LEVEL[4] = function (api) {
    const W = D.rauschen, N = D.regeln.ziele, R = D.regeln;
    const uhrTon = TON.takt();
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
    // Länge, Einsatz und Ende lesen den Klang jedes Mal neu (nach dem Entschlüsseln genau). Gespielt wird ab dem hörbaren
    // Einsatz höchstens `hoechstens` lang.
    function ereignis(m, start, istZiel) {
      const k = TON.klang(m);
      return { m, k, start, ziel: istZiel, griff: null, gespielt: false, at: null, t0: null, gewartet: 0,
        get einsatz() { return k.einsatz || 0; },
        get len() { return Math.min(k.dauer, (k.einsatz || 0) + (istZiel ? W.hoechstens : (W.hoechstensAblenker || 1.8))); },
        get ende() { return this.start + this.len; } };
    }
    // Sekunden, seit das Geräusch begonnen hat – so, wie es am Ohr ankommt (null = noch nicht begonnen)
    function rel(e) {
      if (!e || !e.gespielt) return null;
      return e.t0 != null ? TON.hoerJetzt() - e.t0 : ziel.t - e.at;
    }
    const fensterEnde = e => Math.max(e.len + W.nachlauf, e.einsatz + FENSTER_MIN);
    // alles ab Zeitpunkt `ab` um d Sekunden nach hinten schieben (Geräusch wartet auf Ton/Puffer, Vorführung verspätet)
    function verschieben(ab, d) {
      if (!(d > 0)) return;
      if (ziel.vor && !ziel.vor.gespielt && ziel.vor.start >= ab) ziel.vor.start += d;
      if (ziel.hoerenAb >= ab) ziel.hoerenAb += d;
      ziel.ereignisse.forEach(e => { if (!e.gespielt && e.start >= ab) e.start += d; });
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
        t = ziel.vor.ende + 0.9 + TON.latenz();   // Hörphase erst nach dem hörbaren Ende der Vorführung (+ Latenz)
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
    // Welle zeigt, was gerade am Ohr ankommt (gleiche Uhr wie die Wertung)
    function huelle(e) { const r = rel(e); if (r == null) return 0; const i = Math.floor(r * 40); return i >= 0 && i < e.k.huelle.length && r < e.len ? e.k.huelle[i] : 0; }
    function pegelJetzt() {
      if (!ziel) return 0;
      let p = 0;
      if (ziel.vor) p = Math.max(p, huelle(ziel.vor));
      ziel.ereignisse.forEach(e => { if (!(ziel.ergebnis && e.ziel)) p = Math.max(p, huelle(e)); });
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
        nr = Math.max(0, (abZiel || 1) - 1); phase = 'start'; uhr = 0.4; uhrTon.zurueck();
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
        const d = uhrTon.schritt(dt / tempo) * tempo;   // Spieluhr folgt der Audiouhr, solange Ton läuft
        ziel.t += d;
        const t = ziel.t;
        // Ton-Knopf kann mitten im Level umgestellt werden
        if (!TON.an() && rauschGriff) allesAus();
        // Geräusche zur rechten Zeit starten
        // Geräusch erst starten, wenn es wirklich erklingen kann (Puffer da, Ton frei) – sonst wartet der Ablauf
        const starten = e => {
          if (e.gespielt || t < e.start || (ziel.ergebnis && e.ziel)) return;
          if (!TON.bereit(e.k) && e.gewartet < WARTEN) { e.gewartet += d; verschieben(e.start, d); return; }
          e.gespielt = true; e.at = t;
          if (TON.an()) {
            e.griff = TON.spielen(e.k, W.pegelZiel, { hoechstens: e.len });
            if (e.griff.laeuft) { e.t0 = e.griff.t0; laufend.push(e); }
          }
          // Vorführung: Hörphase erst nach ihrem hörbaren Ende (gemessene Latenz) + 0,9s
          if (e === ziel.vor) verschieben(t + 0.001, Math.max(0, e.at + e.len + 0.9 + (e.t0 != null ? TON.latenz() : 0) - ziel.hoerenAb));
        };
        if (ziel.vor) {
          starten(ziel.vor);
          if (phase === 'vorhoeren') {
            const r = rel(ziel.vor);
            G.ansage.hoert(r != null && r >= 0 && r < ziel.vor.len);
            rauschenStellen(t < ziel.vor.ende + 0.3 ? lerp(W.pegelRauschen, ziel.k, N) * 0.35 : lerp(W.pegelRauschen, ziel.k, N), 0.25);
            if (t >= ziel.hoerenAb) { phase = 'hoeren'; G.ansage.phase((D.level[3].phasen || {}).hoeren, true); }
          }
        } else if (phase === 'ansage' && t >= ziel.hoerenAb) phase = 'hoeren';
        if (phase === 'hoeren') {
          teppichStellen(ziel.k);
          ziel.ereignisse.forEach(starten);
          const rz = rel(ziel.zielE);
          if (!ziel.ergebnis && rz != null && rz > fensterEnde(ziel.zielE)) ergebnis('verpasst');
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
        if (ziel.t - ziel.hoerenAb < SCHONZEIT) return false;   // Vorführung bzw. Ansage klingt noch nach: nicht werten
        // es zählt das zuletzt begonnene Geräusch, das schon am Ohr angekommen ist – in seinem Fenster: Ziel = Treffer
        // (Reaktion ab hörbarem Einsatz), anderes Geräusch = falsch; sonst Stille = zu früh
        let x = null;
        ziel.ereignisse.forEach(e => { const r = rel(e); if (r != null && r >= 0 && (!x || e.start > x.e.start)) x = { e, r }; });
        if (x && x.r <= fensterEnde(x.e)) {
          if (x.e.ziel) ergebnis('treffer', Math.max(0, x.r - x.e.einsatz));
          else ergebnis('falsch');
        } else ergebnis('frueh');
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
        const z = ziel.zielE, jetzt = performance.now(), hj = TON.hoerJetzt();
        // perf = performance.now()-Zeit, zu der etwas am Ohr ankommt (für Bots): hörbarer Einsatz bzw. Ende
        const perf = (e, s) => (!e.gespielt ? null : e.t0 != null ? jetzt + (e.t0 + s - hj) * 1000 : jetzt + (e.at + s - ziel.t) * 1000 / tempo);
        const info = e => ({ name: e.m.name, start: e.start, ende: e.ende, len: e.len, einsatz: e.einsatz, ziel: e.ziel, gespielt: e.gespielt,
          mitTon: e.t0 != null, gewartet: +e.gewartet.toFixed(3), hoerbarPerf: perf(e, e.einsatz), endePerf: perf(e, e.len), fensterEnde: fensterEnde(e), rel: rel(e) });
        return { nr: ziel.k + 1, name: ziel.m.name, phase, t: ziel.t, hoerenAb: ziel.hoerenAb, vorhoeren: !!ziel.vor, latenz: TON.latenz(),
          hoerenAbPerf: jetzt + (ziel.hoerenAb - ziel.t) * 1000 / tempo, schonzeit: SCHONZEIT,
          ziel: Object.assign(info(z), { echt: z.k.echt }), bisZiel: z.start - ziel.t, vor: ziel.vor ? info(ziel.vor) : null,
          ereignisse: ziel.ereignisse.map(info),
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
