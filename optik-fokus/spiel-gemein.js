// „Fokus“ – gemeinsame Bausteine der Level 2–5 (Phase 4, 26.10.2026): Rechenhilfen, Rückmeldungs-Effekte, Ansage-Band
// unter der Kopfzeile, Platzsuche für Ziele und ein eigener kleiner Ton-Baustein für Geräusche (Level 4 „Rauschen“ und
// Level 5 „Weitblick“).
//
// Ton-Baustein (FOKUS_GEMEIN.ton): eigener AudioContext neben dem Rahmen (der Rahmen gibt seinen nicht heraus). Folgt dem
// Ton-Knopf des Rahmens (localStorage mg:ton = 'aus'). Geräusche kommen aus den Pools in motive.js: Feld `ton` = Adresse
// einer echten Aufnahme (klaenge/<level>/<nr>-<name>.mp3, setzt daten-bauen.py, sobald die Datei im Spielordner liegt).
// Fehlt sie, wird ein Platzhalter-Klang im Browser erzeugt (je Name immer gleich, grob nach Art: Glocke, Tier, Klopfen,
// Motor, Wasser, Rascheln …). Für die sichtbare Schallwelle hat jeder Klang eine Hülle (Lautstärke je 1/40s), die auch
// ohne Ton funktioniert.
// Phase 3 (26.10.2026): alle Klänge des Spiels laufen hier – Effekte (effekt), Musik im Startbild (musik), Raumklang je
// Level (raum), Grundrauschen L4 (erzeugt). MP3-Zuschnitt und Lautheit aus klaenge.js; Werte in daten.js `musik`/`klang`.
(function () {
  'use strict';
  const SZ = window.FOKUS_SZENE, D = window.FOKUS;
  const lerp = (w, k, n) => Array.isArray(w) && w.length === 2 ? w[0] + (w[1] - w[0]) * (n <= 1 ? 0 : k / (n - 1)) : (Array.isArray(w) ? w[Math.min(k, w.length - 1)] : w);
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  function mischen(liste) { const a = liste.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Punkte nach Reaktionszeit: bis `voll` Sekunden 100, dann linear bis 50 bei `grenze`, danach 50 (Treffer bleibt Treffer)
  function punkteNachZeit(rt, voll, grenze, R) {
    const max = R.punkteMax, min = R.punkteMin;
    return Math.round(max - (max - min) * klemm((rt - voll) / Math.max(0.05, grenze - voll), 0, 1));
  }

  // ---------- Rückmeldungen auf der Spielfläche (wie Level 1): Wort, bei Treffern Punkte darunter ----------
  // Lage der Rückmeldung (Wort + ggf. Punkte darunter): an der Motivposition, aber ganz im sichtbaren Bereich zwischen
  // Kopfzeile (oben) und unterem Rand bzw. Bedienleiste (unten) – auch bei 320×640 und 568×320 (MZ, 26.10.2026).
  // g.font muss schon die Schrift des Worts haben; Rand = halbe Strichstärke + etwas Luft.
  function textLage(g, f, B, H, oben, unten, wunschY) {
    const fs = Math.round(Math.min(B, H) * 0.075), gr = Math.round(Math.min(B, H) * 0.055);
    const ueber = fs * 0.55 + 4, unter = (f.zahl ? (f.text ? gr * 1.3 : 0) + gr * 0.6 : fs * 0.55) + 4;
    const o = (oben || 0) + 6, un = Math.min(H, unten == null ? H : unten) - 6;
    const ty = Math.max(o + ueber, Math.min(un - unter, wunschY));
    const halb = Math.max(f.text ? g.measureText(f.text).width : 0, 1) / 2 + 8, tx = Math.max(halb, Math.min(B - halb, f.cx));
    return { tx, ty };
  }
  function effekte() {
    let liste = [];
    return {
      neu(art, x, y, r, text, zahl) { liste.push({ art, cx: x, cy: y, r: r || 40, t: 0, text: text || '', zahl: zahl || '' }); },
      leeren() { liste = []; },
      schritt(dt) { liste.forEach(f => { f.t += dt; }); liste = liste.filter(f => f.t < 1.1); },
      zeichne(g, B, H, oben, unten) {
        liste.forEach(f => {
          const u = Math.min(1, f.t / 1.1);
          g.save();
          if (f.art === 'treffer') {
            if (f.t < 0.18) { g.fillStyle = `rgba(255,255,255,${0.3 * (1 - f.t / 0.18)})`; g.fillRect(0, 0, B, H); }
            g.strokeStyle = `rgba(255,255,255,${1 - u})`; g.lineWidth = 3;
            g.beginPath(); g.arc(f.cx, f.cy, f.r * (0.8 + u * 0.6), 0, 7); g.stroke();
          } else if (f.t < 0.3) {
            g.strokeStyle = `rgba(255,138,101,${1 - f.t / 0.3})`; g.lineWidth = 3;
            g.beginPath(); g.arc(f.cx, f.cy, f.r * (0.9 + f.t), 0, 7); g.stroke();
          }
          g.globalAlpha = 1 - Math.pow(u, 3);
          g.font = `800 ${Math.round(Math.min(B, H) * 0.075)}px Poppins, system-ui, sans-serif`;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineWidth = 5; g.lineJoin = 'round';
          g.strokeStyle = f.art === 'treffer' ? 'rgba(10,60,62,.75)' : 'rgba(60,20,10,.7)';
          g.fillStyle = f.art === 'treffer' ? '#fff' : '#ffe2d6';
          const { tx, ty } = textLage(g, f, B, H, oben, unten, f.cy - f.r - 14 - u * 34);
          if (f.text) { g.strokeText(f.text, tx, ty); g.fillText(f.text, tx, ty); }
          if (f.zahl) {
            const gr = Math.round(Math.min(B, H) * 0.055), zy = f.text ? ty + gr * 1.3 : ty;
            g.font = `700 ${gr}px Poppins, system-ui, sans-serif`;
            g.strokeText(f.zahl, tx, zy); g.fillText(f.zahl, tx, zy);
          }
          g.restore();
        });
      },
    };
  }

  // ---------- Ansage-Band unter der Kopfzeile: was gesucht ist (Richtung, Fisch, Geräusch, Ziel) ----------
  document.body.insertAdjacentHTML('beforeend',
    '<div id="fkAnsage" hidden aria-live="polite"><span class="fk-a-bild" aria-hidden="true"></span><span class="fk-a-text"></span><span class="fk-a-phase" hidden></span></div>' +
    '<div id="fkZusatz" hidden aria-live="polite"></div>');
  const $a = document.getElementById('fkAnsage'), $z = document.getElementById('fkZusatz');
  let zusatzUhr = 0;
  const ansage = {
    // bild: Leinwand, SVG-Text oder null; klein: kleines Band (Level 5); text leer = nur Bild
    zeigen(o) {
      const b = $a.querySelector('.fk-a-bild');
      b.textContent = '';
      if (o.bild instanceof HTMLCanvasElement) b.append(o.bild); else if (o.bild) b.innerHTML = o.bild;
      b.hidden = !o.bild;
      $a.querySelector('.fk-a-text').textContent = o.text || '';
      const ph = $a.querySelector('.fk-a-phase'); ph.hidden = !o.phase; ph.textContent = o.phase || ''; ph.classList.toggle('jetzt', !!o.jetzt);
      $a.classList.toggle('klein', !!o.klein);
      $a.classList.toggle('hoert', !!o.hoert);
      $a.hidden = false;
      $a.classList.remove('neu'); void $a.offsetWidth; $a.classList.add('neu');
    },
    hoert(an) { $a.classList.toggle('hoert', !!an); },
    // Phase im Band wechseln (L4: „Erst anhören“ → „Jetzt hinhören“), dezent überblendet; jetzt = gewertete Phase
    phase(text, jetzt) {
      const ph = $a.querySelector('.fk-a-phase');
      if (!text) { ph.hidden = true; return; }
      if (ph.textContent === text && !ph.hidden) return;
      ph.textContent = text; ph.hidden = false; ph.classList.toggle('jetzt', !!jetzt);
      ph.classList.remove('wechsel'); void ph.offsetWidth; ph.classList.add('wechsel');
    },
    verbergen() { $a.hidden = true; $z.hidden = true; },
    // kurzer Zusatz in der Mitte („Neue Richtung“), verschwindet nach ca. 1,4s
    // bild (optional): Leinwand, z. B. das neue Ring-Symbol; dauer in Sekunden (Standard 1,5)
    zusatz(text, bild, dauer) {
      if (!text) return;
      $z.textContent = '';
      if (bild instanceof HTMLCanvasElement) { const s = document.createElement('span'); s.className = 'fk-z-bild'; s.append(bild); $z.append(s); }
      const t = document.createElement('span'); t.textContent = text; $z.append(t);
      $z.hidden = false;
      $z.style.setProperty('--dauer', (dauer || 1.5) + 's');
      $z.classList.remove('neu'); void $z.offsetWidth; $z.classList.add('neu');
      clearTimeout(zusatzUhr); zusatzUhr = setTimeout(() => { $z.hidden = true; }, (dauer || 1.5) * 1000);
    },
    // Band pulsiert einmal (Richtungswechsel)
    puls() { if ($a.hidden) return; $a.classList.remove('puls'); void $a.offsetWidth; $a.classList.add('puls'); },
    unterkante() { if ($a.hidden) return 0; const r = $a.getBoundingClientRect(); return r.bottom; },
  };
  const LAUTSPRECHER = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';

  // ---------- Platzsuche: Kreise/Kästchen ohne Überlappung in einem Bereich ----------
  function platz(bereich, w, h, belegt, abstand, versuche) {
    const a = abstand || 8;
    for (let i = 0; i < (versuche || 40); i++) {
      const x = bereich.x + Math.random() * Math.max(0, bereich.w - w), y = bereich.y + Math.random() * Math.max(0, bereich.h - h);
      if (!belegt.some(b => x < b.x + b.w + a && x + w + a > b.x && y < b.y + b.h + a && y + h + a > b.y)) return { x, y, w, h };
    }
    return null;
  }

  // ---------- Ausweichen (MZ, 26.10.2026, Handytest L3: Ziel von einem anderen Ding verdeckt) ----------
  // Ablenker halten Abstand zum Ziel: kreuzt einer (jetzt oder in den nächsten 0,9s) die Bahn des Ziels, gleitet er weich
  // nach oben oder unten weg (andere Tiefe), so weit der Bereich oben…unten es zulässt. Je Ablenker: o.aus = Versatz in px
  // (die Level rechnen ihn in lage() zur y-Lage dazu). liste: [{ o, k (Kasten jetzt), vx (px/s relativ zum Ziel) }].
  // o.test = true (Testhilfe „ueberdecken“) weicht nicht aus.
  function ausweichen(zk, liste, dt, oben, unten, abstand) {
    const a = abstand == null ? 10 : abstand;
    liste.forEach(({ o, k, vx }) => {
      if (o.aus == null) o.aus = 0;
      if (o.ausSoll == null) o.ausSoll = o.aus;
      if (!o.test && zk) {
        const v = (vx || 0) * 0.9, x0 = Math.min(k.x, k.x + v), x1 = Math.max(k.x + k.w, k.x + k.w + v);
        const quer = x0 < zk.x + zk.w + a && x1 > zk.x - a, hoch = k.y < zk.y + zk.h + a && k.y + k.h > zk.y - a;
        if (quer && hoch) {
          const rauf = k.y + k.h - (zk.y - a), runter = zk.y + zk.h + a - k.y;
          const raumOben = k.y - oben, raumUnten = unten - (k.y + k.h);
          let d;
          if (rauf <= raumOben && (rauf <= runter || runter > raumUnten)) d = -rauf;
          else if (runter <= raumUnten) d = runter;
          else d = raumOben > raumUnten ? -Math.max(0, raumOben) : Math.max(0, raumUnten);   // nicht ganz frei: so weit es geht
          o.ausSoll = o.aus + d;
        }
      }
      o.aus += (o.ausSoll - o.aus) * Math.min(1, dt * 7);
    });
  }
  // Anteil der Zielfläche, den das größte überlappende Ding verdeckt (0–1) – für Testhilfe und Prüfung
  function verdeckt(zk, kaesten) {
    if (!zk || !(zk.w > 0 && zk.h > 0)) return 0;
    let m = 0;
    kaesten.forEach(k => {
      const w = Math.min(zk.x + zk.w, k.x + k.w) - Math.max(zk.x, k.x), h = Math.min(zk.y + zk.h, k.y + k.h) - Math.max(zk.y, k.y);
      if (w > 0 && h > 0) m = Math.max(m, (w * h) / (zk.w * zk.h));
    });
    return m;
  }

  // ---------- Bildschirm-Lage eines Punkts im Level-Bild (gleich wie szene.levelBild „cover“) ----------
  function abbildung(nr, B, H) { return SZ.abbildung(nr, B, H); }

  // ---------- Ton ----------
  const RATE = 22050;
  let ctx = null, master = null;
  const tonAn = () => { try { return localStorage.getItem('mg:ton') !== 'aus'; } catch (e) { return true; } };
  function audio() {
    if (!tonAn()) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC(); master = ctx.createGain(); master.gain.value = 1;
        // sanfter Begrenzer: Rauschen + Geräusch + Raumklang zusammen übersteuern nicht
        const b = ctx.createDynamicsCompressor();
        b.threshold.value = -6; b.knee.value = 6; b.ratio.value = 12; b.attack.value = 0.003; b.release.value = 0.15;
        master.connect(b).connect(ctx.destination);
        // sobald der Ton frei ist (erstes Tippen, zurück aus dem Hintergrund): Musik/Raumklang wie gewünscht
        ctx.addEventListener('statechange', () => { if (ctx && ctx.state === 'running') anwenden(); });
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  // erstes Tippen gibt den Ton frei; dann auch Musik (Startbild) bzw. Raumklang (Level) starten, falls gewünscht
  ['pointerdown', 'pointerup', 'keydown'].forEach(e => addEventListener(e, () => {
    const ua = navigator.userActivation;
    if (!ua || ua.hasBeenActive) { if (audio()) setTimeout(anwenden, 0); }
  }, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { musikMerken(); ctx.suspend().catch(() => {}); } else if (tonAn()) ctx.resume().catch(() => {});
  });

  // Zufall je Name (Platzhalter klingen bei jedem Spiel gleich)
  const zufallVon = name => SZ.zufall(SZ.hash(String(name)));
  // einfache Filter im Probenbereich
  function tiefpass(d, f) { const a = Math.exp(-2 * Math.PI * f / RATE); let y = 0; for (let i = 0; i < d.length; i++) { y = (1 - a) * d[i] + a * y; d[i] = y; } }
  function hochpass(d, f) { const a = Math.exp(-2 * Math.PI * f / RATE); let y = 0, x0 = 0; for (let i = 0; i < d.length; i++) { y = a * (y + d[i] - x0); x0 = d[i]; d[i] = y; } }
  function bandpass(d, f) { hochpass(d, f * 0.7); tiefpass(d, f * 1.4); }
  // Platzhalter-Klang nach Art (grob aus dem Namen), Länge in Sekunden
  const ARTEN = [
    ['glocke', /glock|klingel|gong|triangel|bimmel|schelle/i],
    ['piepen', /telefon|handy|wecker|timer|piep|scanner|mikrowelle|digital|nachricht|rechner|haltewunsch|ping|kasse/i],
    ['tier', /bellt|miaut|kräht|blökt|quakt|schnatter|wiehert|ruft|singt|gurr|zirp|taube|kuckuck|vogel|amsel|grille|muh|hahn|meise|eule|möwe|schnurr/i],
    ['melodie', /melodie|musik|akkordeon|blas|mundharmonika|spieluhr|eiswagen|kapelle|pfeif|summt ein|gitarre|klavier|flöte/i],
    ['motor', /motor|traktor|föhn|staubsauger|rasenmäher|bus\b|auto\b|moped|mixer|maschine|drucker|kehr|zug|flugzeug|ventilator|kühlschrank|fliege|mischer|lüfter|summ/i],
    ['wasser', /wasser|regen|dusche|bach|plätscher|tropf|gieß|kaffee|zapf|brunnen|kocher|gluck|spray|sprüh|spül|wellen|see\b|heizung/i],
    ['klatschen', /applaus|klatsch/i],
    ['rascheln', /papier|rascheln|laub|blätter|folie|karten|kies|wind|fahne|popcorn|feuer|knister|brutzel|reißver|zerreiß|besen|schnee|sand|murmeln|stimmen|fernseh/i],
    ['klopfen', /klopf|hammer|specht|schritt|hufe|klick|schloss|tür|tacker|würfel|klack|kronkorken|blinker|tick|schlag|freilauf|stempel|schere|tasta|maus|löffel|ei\b|knarz|quietsch|treppe|schlüssel|münz|klimper|deckel|dose|glas|ball|stöcke/i],
  ];
  function artVon(name) { for (const [art, re] of ARTEN) if (re.test(name)) return art; return 'motiv'; }
  function erzeugen(name, laenge, artVorgabe) {
    const r = zufallVon(name), art = artVorgabe || artVon(name);
    const L = klemm(laenge || 1.6, 0.6, 6), n = Math.round(L * RATE), d = new Float32Array(n);
    const sin = Math.sin, PI2 = Math.PI * 2;
    const ton = (t0, dauer, f, pegel, obert, abkl, vib) => {
      const a = Math.round(t0 * RATE), e = Math.min(n, a + Math.round(dauer * RATE));
      for (let i = a; i < e; i++) {
        const t = (i - a) / RATE, env = Math.min(1, t / 0.008) * Math.exp(-t * (abkl || 3));
        const ff = f * (1 + (vib ? vib[0] * sin(PI2 * vib[1] * t) : 0));
        let s = 0; (obert || [[1, 1]]).forEach(([m, p]) => { s += p * sin(PI2 * ff * m * t); });
        d[i] += s * env * pegel;
      }
    };
    const rauschStoss = (t0, dauer, pegel, abkl) => {
      const a = Math.round(t0 * RATE), e = Math.min(n, a + Math.round(dauer * RATE));
      for (let i = a; i < e; i++) { const t = (i - a) / RATE; d[i] += (Math.random() * 2 - 1) * pegel * Math.min(1, t / 0.004) * Math.exp(-t * (abkl || 30)); }
    };
    switch (art) {
      case 'glocke': {
        const f = 330 + r() * 1100, schlaege = 1 + Math.floor(r() * 3), ab = L / schlaege;
        for (let k = 0; k < schlaege; k++) ton(k * ab, Math.min(L - k * ab, 2.5), f * (k % 2 && r() < 0.6 ? 0.8 : 1), 0.32, [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.9, 0.1]], 2.2 + r() * 2);
        break;
      }
      case 'piepen': {
        const f = 900 + r() * 1400, lang = 0.06 + r() * 0.12, pause = 0.05 + r() * 0.2, gruppe = 1 + Math.floor(r() * 4);
        for (let t = 0, k = 0; t < L - lang; k++) { ton(t, lang, f * (k % 2 && r() < 0.5 ? 1.25 : 1), 0.22, [[1, 1], [3, 0.15]], 2); t += lang + (k % gruppe === gruppe - 1 ? pause * 4 : pause); }
        break;
      }
      case 'tier': {
        const f = 250 + r() * 900, rufe = 1 + Math.floor(r() * 3), lang = Math.min(0.7, L / rufe * 0.7);
        for (let k = 0; k < rufe; k++) {
          const t0 = k * (L / rufe), a = Math.round(t0 * RATE), e = Math.min(n, a + Math.round(lang * RATE)), hoch = 0.4 + r() * 0.8;
          for (let i = a; i < e; i++) {
            const t = (i - a) / RATE, u = t / lang, env = sin(Math.PI * u) ** 1.5;
            const ff = f * (1 + hoch * sin(Math.PI * u) * (r() < 0.02 ? 1 : 1)) * (1 + 0.03 * sin(PI2 * 28 * t));
            d[i] += (sin(PI2 * ff * t) + 0.5 * sin(PI2 * 2 * ff * t) + 0.25 * sin(PI2 * 3 * ff * t)) * env * 0.18;
          }
        }
        break;
      }
      case 'melodie': {
        const grund = 300 + r() * 300, stufen = [0, 2, 4, 5, 7, 9, 12], note = 0.18 + r() * 0.15;
        for (let t = 0; t < L - note; t += note) ton(t, note * 1.3, grund * Math.pow(2, stufen[Math.floor(r() * stufen.length)] / 12), 0.22, [[1, 1], [2, 0.3], [3, 0.12]], 4);
        break;
      }
      case 'motor': {
        const f = 35 + r() * 110, mod = 2 + r() * 12;
        for (let i = 0; i < n; i++) {
          const t = i / RATE, env = Math.min(1, t / 0.15, (L - t) / 0.2);
          const saw = ((f * t) % 1) * 2 - 1;
          d[i] = (saw * 0.5 + (Math.random() * 2 - 1) * 0.25) * (0.7 + 0.3 * sin(PI2 * mod * t)) * env * 0.35;
        }
        tiefpass(d, 900 + r() * 1500);
        break;
      }
      case 'wasser': {
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1);
        bandpass(d, 600 + r() * 1800);
        for (let i = 0; i < n; i++) { const t = i / RATE; d[i] *= 0.5 * Math.min(1, t / 0.2, (L - t) / 0.3) * (0.7 + 0.3 * sin(PI2 * 0.7 * t)); }
        for (let k = 0; k < L * (4 + r() * 8); k++) { const t0 = r() * (L - 0.1), f = 500 + r() * 900; const a = Math.round(t0 * RATE); for (let i = 0; i < 0.05 * RATE && a + i < n; i++) { const t = i / RATE; d[a + i] += sin(PI2 * f * (1 + t * 12) * t) * Math.exp(-t * 70) * 0.25; } }
        break;
      }
      case 'klatschen': {
        for (let k = 0; k < L * 18; k++) rauschStoss(r() * (L - 0.05), 0.05, 0.28 + r() * 0.2, 60);
        hochpass(d, 700);
        break;
      }
      case 'rascheln': {
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1);
        hochpass(d, 1500 + r() * 2500);
        let env = 0;
        for (let i = 0; i < n; i++) { if (i % 400 === 0) env = 0.2 + Math.random() * 0.8; const t = i / RATE; d[i] *= env * 0.35 * Math.min(1, t / 0.05, (L - t) / 0.1); }
        break;
      }
      case 'klopfen': {
        const f = 120 + r() * 1500, takt = 0.12 + r() * 0.35, schlaege = Math.max(1, Math.floor(L / takt));
        for (let k = 0; k < schlaege; k++) { const t0 = k * takt + (r() - 0.5) * 0.02; if (t0 < 0 || t0 > L - 0.05) continue; rauschStoss(t0, 0.06, 0.55, 70); ton(t0, 0.12, f, 0.3, [[1, 1], [1.6, 0.5]], 35); }
        bandpass(d, f * 1.5 + 300);
        for (let i = 0; i < n; i++) d[i] *= 2.2;
        break;
      }
      default: {
        const f = 400 + r() * 800, f2 = f * (r() < 0.5 ? 1.335 : 0.75);
        ton(0, Math.min(0.5, L / 2), f, 0.24, [[1, 1], [2, 0.3]], 3); ton(Math.min(0.5, L / 2), Math.min(0.6, L / 2), f2, 0.24, [[1, 1], [2, 0.3]], 3);
      }
    }
    // weich ein/aus, Spitze auf 0,9
    let spitze = 0;
    for (let i = 0; i < n; i++) spitze = Math.max(spitze, Math.abs(d[i]));
    const f = spitze > 0 ? 0.9 / spitze : 1;
    for (let i = 0; i < n; i++) { const t = i / RATE; d[i] *= f * Math.min(1, t / 0.005, (L - t) / 0.03); }
    return d;
  }
  // Hülle (0–1) je 1/40s – für die Schallwelle, auch ohne Ton
  function huelleVon(daten, rate) {
    const schritt = Math.max(1, Math.round(rate / 40)), h = [];
    let max = 0;
    for (let i = 0; i < daten.length; i += schritt) {
      let s = 0; const e = Math.min(daten.length, i + schritt);
      for (let k = i; k < e; k++) s += daten[k] * daten[k];
      const v = Math.sqrt(s / Math.max(1, e - i)); h.push(v); max = Math.max(max, v);
    }
    return h.map(v => (max > 0 ? v / max : 0));
  }
  // Hörbarer Einsatz in Sekunden (MZ, 26.10.2026): erster 10-ms-Block, dessen Spitze 25 % der eigenen Spitze erreicht –
  // gleiche Regel wie Material/Skripte/einsatz.py (Wert dort in klaenge.js; hier am entschlüsselten Klang nachgemessen)
  function einsatzVon(daten, rate) {
    const b = Math.max(1, Math.round(rate * 0.01)), env = [];
    let sp = 0;
    for (let i = 0; i < daten.length; i += b) {
      let m = 0; const e = Math.min(daten.length, i + b);
      for (let k = i; k < e; k++) { const v = daten[k] < 0 ? -daten[k] : daten[k]; if (v > m) m = v; }
      env.push(m); if (m > sp) sp = m;
    }
    if (!(sp > 0)) return 0;
    for (let i = 0; i < env.length; i++) if (env[i] >= 0.25 * sp) return i * b / rate;
    return 0;
  }
  // ---------- Dateien laden (MP3-Zuschnitt über klaenge.js) ----------
  // Entschlüsseln geht auch vor dem ersten Tippen (eigener stiller Offline-Kontext, 22,05 kHz) – dann ist alles bereit.
  let dekoder = null;
  function dek() {
    if (ctx) return ctx;
    if (!dekoder) { const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; dekoder = OAC ? new OAC(1, RATE, RATE) : null; }
    return dekoder;
  }
  const dateiPuffer = {};
  function ladePuffer(adresse) {
    if (!adresse || location.protocol === 'file:') return Promise.resolve(null);
    if (!dateiPuffer[adresse]) {
      const info = window.FK && FK.klangInfo(adresse);
      dateiPuffer[adresse] = fetch(adresse).then(r => (r.ok ? r.arrayBuffer() : null)).then(b => {
        const d = b && dek();
        if (!d) return null;
        return new Promise((ok, nein) => d.decodeAudioData(b, ok, nein)).then(p => FK.mp3Zuschnitt(p, info && info.proben, d));
      }).catch(() => null);
    }
    return dateiPuffer[adresse];
  }
  // Lautheit angleichen (daten.js klang.angleichen): Faktor aus der gemessenen Lautheit (klaenge.js), ×0,4 … ×2
  function angleich(adresse) {
    const KL = D.klang || {}, info = window.FK && FK.klangInfo(adresse);
    if (!KL.angleichen || !info || !(info.lautheit > 0)) return 1;
    return klemm((KL.bezug || 0.14) / info.lautheit, 0.4, 2);
  }

  // Klang je Eintrag (Pool): { daten (Float32Array, RATE), dauer, huelle, puffer (AudioBuffer, sobald Ton an), faktor }
  const klaenge = {};
  function klang(e, artVorgabe) {
    const schluessel = (e.ton || '') + '|' + e.name;
    if (klaenge[schluessel]) return klaenge[schluessel];
    const info = e.ton && window.FK ? FK.klangInfo(e.ton) : null;
    // einsatz = Sekunden bis zum hörbaren Einsatz (ab hier zählt die Reaktion), erst aus klaenge.js, nach dem Laden gemessen
    const k = { dauer: info ? info.dauer : klemm(e.laenge || 1.6, 0.6, 6), huelle: null, puffer: null, daten: null, echt: false, fertig: null, faktor: 1,
      einsatz: info && info.einsatz > 0 ? info.einsatz : 0 };
    const erzeugt = () => { const d = erzeugen(e.name, k.dauer, artVorgabe); k.daten = d; k.huelle = huelleVon(d, RATE); k.dauer = d.length / RATE; k.einsatz = einsatzVon(d, RATE); };
    if (e.ton) {
      // echte Aufnahme: laden und entschlüsseln (auch ohne Ton – für die Hülle); bis dahin eine ruhige Ersatz-Hülle.
      // Lädt sie nicht, wird der Platzhalter erzeugt.
      k.huelle = new Array(Math.round(k.dauer * 40)).fill(0.6);
      k.faktor = angleich(e.ton);
      k.fertig = ladePuffer(e.ton).then(p => {
        if (!p) return;
        k.puffer = p; k.echt = true; k.dauer = p.duration; k.huelle = huelleVon(p.getChannelData(0), p.sampleRate);
        k.einsatz = einsatzVon(p.getChannelData(0), p.sampleRate);
      }).then(() => { if (!k.echt) { k.faktor = 1; erzeugt(); } });
    } else erzeugt();
    klaenge[schluessel] = k;
    return k;
  }
  function puffer(k) {
    if (k.puffer) return k.puffer;
    const a = ctx; if (!a || !k.daten) return null;
    const p = a.createBuffer(1, k.daten.length, RATE); p.getChannelData(0).set(k.daten); k.puffer = p;
    return p;
  }
  // abspielen: gibt { start (Kontextzeit), aus() } zurück; ohne Ton ein Griff ohne Wirkung.
  // pegel wird mit k.faktor (Angleichen) und k.skal (Grundrauschen) verrechnet.
  function spielen(k, pegel, o) {
    o = o || {};
    const a = audio();
    const griff = { aus() {}, pegel() {}, laeuft: false };
    if (!a || a.state !== 'running') return griff;
    const p = puffer(k); if (!p) return griff;
    const f = (k.faktor || 1) * (k.skal || 1), voll = Math.max(0.0001, pegel * f);
    const q = a.createBufferSource(), v = a.createGain();
    q.buffer = p; q.loop = !!o.schleife;
    const t = a.currentTime + (o.verzoegerung || 0);
    v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(voll, t + (o.einblenden || 0.01));
    if (o.hoechstens && !o.schleife && p.duration > o.hoechstens) { v.gain.setValueAtTime(voll, t + Math.max(0.02, o.hoechstens - 0.25)); v.gain.linearRampToValueAtTime(0.0001, t + o.hoechstens); }
    q.connect(v).connect(master);
    const ab = o.ab != null ? o.ab : (o.schleife && o.zufall ? Math.random() * p.duration : 0);
    q.start(t, ab); if (!o.schleife) q.stop(t + Math.min(p.duration, o.hoechstens || 99) + 0.05);
    griff.laeuft = true; griff.q = q; griff.t0 = t; griff.ab = ab;
    griff.aus = (weich) => { try { v.gain.cancelScheduledValues(a.currentTime); v.gain.setTargetAtTime(0.0001, a.currentTime, weich || 0.05); q.stop(a.currentTime + (weich || 0.05) * 6); } catch (e) { /* egal */ } griff.laeuft = false; };
    griff.pegel = (p2, zeit) => { try { v.gain.setTargetAtTime(Math.max(0.0001, p2 * f), a.currentTime, zeit || 0.2); } catch (e) { /* egal */ } };
    return griff;
  }
  // ---------- Hör-Uhr (MZ, 26.10.2026: „Ton und Punktevergabe nicht sauber synchron“) ----------
  // Alle Zeiten auf der Skala von AudioContext.currentTime. Ein Geräusch, das spielen() bei griff.t0 startet, kommt bei
  // griff.t0 + k.einsatz hörbar am Ohr an. hoerJetzt() = die Kontextzeit, die gerade am Ohr ankommt: aus
  // getOutputTimestamp() (glatt, enthält die Ausgabe-Latenz des Geräts), sonst currentTime − (baseLatency + outputLatency).
  // Gemessen in Edge (26.10.2026): beide Wege stimmen auf ±5 ms überein (Latenz 0,05s am PC; Handy oft 0,05–0,15s, Bluetooth
  // mehr – soweit der Browser sie meldet).
  function latenz() {
    if (!ctx) return 0;
    const o = ctx.outputLatency, b = ctx.baseLatency;
    let l = (o > 0 ? o : 0) + (b > 0 ? b : 0);
    if (!(o > 0) && ctx.getOutputTimestamp) {   // Safari meldet outputLatency nicht: aus dem Zeitstempel schätzen
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime > 0 && ts.contextTime > 0) { const d = ctx.currentTime - (ts.contextTime + (performance.now() - ts.performanceTime) / 1000); if (d > l && d < 1) l = d; }
    }
    return klemm(l, 0, 1);
  }
  function hoerJetzt() {
    if (!ctx) return 0;
    if (ctx.getOutputTimestamp && ctx.state === 'running') {
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime > 0 && ts.contextTime > 0) {
        const h = ts.contextTime + (performance.now() - ts.performanceTime) / 1000, d = ctx.currentTime - h;
        if (d > -0.02 && d < 1) return h;
      }
    }
    return ctx.currentTime - latenz();
  }
  // Kann ein Klang jetzt wirklich erklingen? (Ton an, Kontext läuft, Puffer entschlüsselt.) Ton aus = immer bereit.
  function bereit(k) {
    if (!tonAn()) return true;
    const a = audio();
    if (!a) return true;
    return a.state === 'running' && !!(k.puffer || k.daten);
  }
  // Spieluhr an die Audiouhr koppeln: der Rahmen begrenzt dt auf 0,05s je Bild – auf langsamen Handys (< 20 Bilder/s)
  // liefe die Spielzeit sonst hinter dem Ton her. Solange Ton läuft, zählt der Fortschritt von currentTime.
  function takt() {
    let letzt = null;
    return {
      schritt(dt) {
        if (ctx && ctx.state === 'running' && tonAn()) {
          const c = ctx.currentTime, d = letzt == null ? dt : klemm(c - letzt, 0, 0.25);
          letzt = c; return d;
        }
        letzt = null; return dt;
      },
      zurueck() { letzt = null; },
    };
  }

  // Grundrauschen der Hörkabine (MZ, 26.10.2026: technisch erzeugt): Mischung aus rosa und braunem Rauschen (daten.js
  // rauschen.farbe), 8s, nahtlose Schleife (Ende mit gleicher Leistung in den Anfang überblendet), Lautstärke so geeicht, dass
  // rauschen.pegelRauschen = Verhältnis zu einem typischen Zielgeräusch ist. Alternativ eine Datei (rauschen.grundrauschen).
  let rauschK = null;
  function grundrauschen(adresse) {
    if (rauschK) return rauschK;
    const W = D.rauschen || {}, bezug = ((D.klang || {}).bezug || 0.14) * (W.pegelZiel || 0.55);
    if (adresse) {
      rauschK = klang({ name: 'grundrauschen', laenge: 4, ton: adresse });
      const info = window.FK && FK.klangInfo(adresse);
      rauschK.faktor = 1; rauschK.skal = bezug / ((info && info.lautheit) || 0.3);
      return rauschK;
    }
    const L = RATE * 8, X = Math.round(RATE * 0.5), n = L + X, rosa = new Float32Array(n), braun = new Float32Array(n);
    let b0 = 0, b1 = 0, b2 = 0, br = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; rosa[i] = b0 + b1 + b2 + w * 0.05;
      br = 0.995 * br + w * 0.1; braun[i] = br;
    }
    const rms = d => { let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / d.length) || 1; };
    const farbe = klemm(W.farbe != null ? W.farbe : 0.35, 0, 1), ra = Math.sqrt(1 - farbe) / rms(rosa), bb = Math.sqrt(farbe) / rms(braun);
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) m[i] = rosa[i] * ra + braun[i] * bb;
    // Gleichanteil weg (braunes Rauschen wandert), dann auf Effektivwert 1
    let mittel = 0; for (let i = 0; i < n; i++) mittel += m[i];
    mittel /= n;
    for (let i = 0; i < n; i++) m[i] -= mittel;
    const r = rms(m);
    const daten = new Float32Array(L);
    for (let i = 0; i < L; i++) daten[i] = m[i] / r;
    for (let i = 0; i < X; i++) { const u = i / X; daten[i] = (m[i] * Math.sqrt(u) + m[L + i] * Math.sqrt(1 - u)) / r; }
    rauschK = { daten, dauer: L / RATE, huelle: [], puffer: null, echt: false, faktor: 1, skal: bezug };
    return rauschK;
  }

  // ---------- Effekte (daten.js klang.effekte) ----------
  const effektPuffer = {};
  // erst laden, wenn die Linse im Startbild steht (spiel.js) bzw. spätestens nach 3s oder beim Levelstart – vorher würden die
  // kleinen Dateien das Level-Bild bremsen (MZ, 26.10.2026: Linse lädt spät); bis dahin gilt der erzeugte Ersatzton
  let effekteGeladen = false;
  function effekteLaden() {
    if (effekteGeladen) return; effekteGeladen = true;
    Object.entries((D.klang || {}).effekte || {}).forEach(([name, e]) => { ladePuffer(e.datei).then(b => { effektPuffer[name] = b || false; }); });
  }
  setTimeout(effekteLaden, 3000);
  // name: treffer, stark, fehler, abbruch, geschafft, bewertung, wusch, brille, klar; o: { pegel (Faktor), hoechstens, verzoegerung }
  function effekt(name, o) {
    o = o || {};
    const e = ((D.klang || {}).effekte || {})[name];
    if (!e || !tonAn()) return;
    const b = effektPuffer[name], a = audio();
    if (b && a && a.state === 'running') { spielen({ puffer: b }, (e.pegel != null ? e.pegel : 0.5) * (o.pegel || 1), o); return; }
    // Datei fehlt (oder noch nicht geladen): erzeugter Ton des Rahmens (wartet selbst kurz auf die Freigabe)
    if (e.ersatz && !b && window.Rahmen) { if (o.verzoegerung) setTimeout(() => window.Rahmen.ton(e.ersatz), o.verzoegerung * 1000); else window.Rahmen.ton(e.ersatz); }
  }

  // ---------- Musik im Startbild und Raumklang im Level ----------
  // Das Spiel sagt nur, was gewünscht ist (musik(true/false), raum(nr|0)); dieser Teil setzt es um, sobald der Ton frei ist,
  // folgt dem Ton-Knopf und blendet weich über. Musik spielt an der Stelle weiter, an der sie auf der Startseite war.
  const M = D.musik, KL = D.klang || {};
  let musikSoll = false, musikL = null, musikWartet = false, raumSoll = 0, raumL = null;
  const musikAdresse = () => (M ? '../' + M.datei : null);
  function musikStelle() { if (!musikL || !ctx) return 0; const d = musikL.q.buffer.duration; return ((musikL.ab + ctx.currentTime - musikL.t0) % d + d) % d; }
  function musikMerken(seitenwechsel) { if (musikL && window.FK) FK.musikStelle.merken(musikStelle(), seitenwechsel); }
  function musikStopp(weich) {
    if (!musikL) return;
    musikMerken();
    musikL.aus(weich != null ? weich : (M.ausblenden || 0.8) / 3); musikL = null;
  }
  async function musikAnwenden() {
    if (!M) return;
    if (!musikSoll || !tonAn() || document.hidden) { musikStopp(); return; }
    if (musikL || musikWartet) return;
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;   // vor dem ersten Tippen nicht versuchen (Browser-Regel)
    const a = audio(); if (!a) return;
    musikWartet = true;
    const b = await ladePuffer(musikAdresse());
    try { await a.resume(); } catch (e) { /* noch nicht frei */ }
    musikWartet = false;
    if (!b || !musikSoll || !tonAn() || musikL || a.state !== 'running') return;
    musikL = spielen({ puffer: b }, M.pegel || 0.4, { schleife: true, einblenden: M.einblenden || 1.5, ab: FK.musikStelle.lesen(b.duration) });
    if (!musikL.laeuft) musikL = null;
  }
  function raumAnwenden() {
    const soll = tonAn() ? raumSoll : 0;
    if (raumL && raumL.nr === soll) return;
    if (raumL) { const w = (KL.raumAusblenden || 1) / 3; raumL.griffe.forEach(g => g.aus(w)); raumL.weg = true; raumL = null; }
    const liste = soll && (KL.raum || {})[soll];
    if (!liste || !liste.length) return;
    const a = audio(); if (!a || a.state !== 'running') return;   // nach dem ersten Tippen erneut
    const L = raumL = { nr: soll, griffe: [], weg: false };
    liste.forEach(r => ladePuffer(r.datei).then(b => {
      if (!b || L.weg || raumL !== L) return;
      L.griffe.push(spielen({ puffer: b }, r.pegel != null ? r.pegel : 0.15, { schleife: true, zufall: true, einblenden: KL.raumEinblenden || 1.5 }));
    }));
  }
  function anwenden() { musikAnwenden(); raumAnwenden(); }
  function musik(an) { musikSoll = !!an; anwenden(); }
  function raum(nr) { raumSoll = nr || 0; anwenden(); }
  // Startbild: Musik und den Raumklang des Levels schon laden (entschlüsseln geht ohne Ton)
  function vorladen(nr) { if (M) ladePuffer(musikAdresse()); ((KL.raum || {})[nr] || []).forEach(r => ladePuffer(r.datei)); }
  // Ton-Knopf des Rahmens: nach seinem Umschalten (mg:ton) Musik/Raumklang an- bzw. ausschalten
  // Ton aus = sofort still (Musik, Raumklang, Effekte, Geräusche über den gemeinsamen Ausgang), Ton an = Musik läuft an der
  // gemerkten Stelle weiter (MZ, 26.10.2026)
  function tonUmschalten() {
    const an = tonAn();
    if (ctx && master) { try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(an ? 1 : 0, ctx.currentTime, an ? 0.05 : 0.008); } catch (e) { /* egal */ } }
    if (!an) { musikStopp(0.01); raumAnwenden(); }
    anwenden();
  }
  const knopf = document.getElementById('tonKnopf');
  if (knopf) knopf.addEventListener('click', () => setTimeout(tonUmschalten, 0));
  addEventListener('pagehide', () => musikMerken(true));

  window.FOKUS_GEMEIN = { textLage, lerp, klemm, mischen, punkteNachZeit, effekte, ansage, platz, abbildung, ausweichen, verdeckt, LAUTSPRECHER,
    ton: { an: tonAn, audio, klang, spielen, grundrauschen, artVon, effekt, effekteLaden, musik, raum, vorladen, ladePuffer, latenz, hoerJetzt, bereit, takt, einsatzVon,
      get laeuft() { return !!ctx && ctx.state === 'running'; },
      // Testhilfe: was gerade klingt
      stand() { return { kontext: ctx ? ctx.state : 'keiner', musik: musikL ? { stelle: +musikStelle().toFixed(2) } : null, musikSoll,
        raum: raumL ? { nr: raumL.nr, schleifen: raumL.griffe.length } : null, raumSoll,
        effekte: Object.keys(effektPuffer).filter(n => effektPuffer[n]).length }; } } };
})();
