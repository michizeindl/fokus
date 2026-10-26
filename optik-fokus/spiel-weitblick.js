// Level 5 „Weitblick“ (MZ, 26.10.2026; Mechanik Phase 4): Blick vom Cafétisch über den Stadtplatz. Auf dem Tisch liegen
// Dinge (nah), auf der anderen Platzseite stehen Ziele (fern). Unten schaltet man zwischen Lesebrille und Fernbrille um –
// ohne passende Brille ist die jeweilige Ebene unscharf. Das Ziel wird als Geräusch angesagt (Kirchturmuhr schlägt,
// Bus zischt …); ohne Ton bzw. solange nur Platzhalter-Klänge da sind, steht es sofort klein als Text oben. Mit Ton und
// echter Aufnahme erscheint der Text erst nach `textNach` Sekunden (Hören gibt einen Vorsprung).
//   Treffer   passende Brille wählen und das Ziel antippen – Punkte nach Reaktion ab Ansage (bis `voll` 100, bis zur
//             Zeitgrenze linear auf 50)
//   falsch    das Ziel mit der falschen Brille antippen („Falsche Brille“) oder ein anderes Ding antippen
//   (vor der Ansage wird Tippen ignoriert – kein Fehler, MZ 26.10.2026)
//   verpasst  Zeitgrenze abgelaufen
//   Tippen ins Leere zählt nicht. Die Brille bleibt von Ziel zu Ziel, wie sie ist.
// Werte in daten.js (FOKUS.weitblick), Zonen am Stadtplatz-Bild eingemessen (daten.js level[4].zonen).
// Geräusche: Pool „weitblick“ (motive.js), echte Aufnahmen nach optik-fokus/klaenge/weitblick/<nr>-<name>.mp3.
(function () {
  'use strict';
  const D = window.FOKUS, SZ = window.FOKUS_SZENE, G = window.FOKUS_GEMEIN, TON = G.ton, T = D.texte;
  window.FOKUS_LEVEL = window.FOKUS_LEVEL || {};
  window.FOKUS_LINSE = window.FOKUS_LINSE || {};
  const { lerp, klemm, mischen } = G;
  const pool = () => ((window.FOKUS_POOLS && window.FOKUS_POOLS.weitblick) || []);

  // Brillen-Schalter unten (nur während Level 5)
  const BRILLE_NAH = '<svg viewBox="0 0 40 24" aria-hidden="true"><path d="M3 13h13M24 13h13M16 13c1.3-1.4 6.7-1.4 8 0"/><path d="M4 13c0 4 2 6 6 6s6-2 6-6M24 13c0 4 2 6 6 6s6-2 6-6"/><path d="M3 13 1 8M37 13l2-5"/></svg>';
  const BRILLE_FERN = '<svg viewBox="0 0 40 24" aria-hidden="true"><circle cx="10" cy="13" r="7"/><circle cx="30" cy="13" r="7"/><path d="M17 12c1.3-1.4 4.7-1.4 6 0M3 12 1 7M37 12l2-5"/></svg>';
  document.body.insertAdjacentHTML('beforeend', `<div id="fkBrille" hidden role="group" aria-label="${T.lesebrille} / ${T.fernbrille}">
    <button type="button" data-b="nah" aria-pressed="true">${BRILLE_NAH}<span>${T.lesebrille}</span></button>
    <button type="button" data-b="fern" aria-pressed="false">${BRILLE_FERN}<span>${T.fernbrille}</span></button></div>`);
  const $b = document.getElementById('fkBrille');

  function unscharf(quelle, px) {
    const c = document.createElement('canvas'); c.width = quelle.width; c.height = quelle.height;
    const g = c.getContext('2d');
    if (typeof g.filter === 'string') { g.filter = `blur(${px}px)`; g.drawImage(quelle, 0, 0); if (g.filter !== 'none') return c; }
    const f = 1 / (1 + px * 0.5), k = document.createElement('canvas');
    k.width = Math.max(1, Math.round(c.width * f)); k.height = Math.max(1, Math.round(c.height * f));
    k.getContext('2d').drawImage(quelle, 0, 0, k.width, k.height);
    g.imageSmoothingQuality = 'high'; g.drawImage(k, 0, 0, c.width, c.height);
    return c;
  }

  window.FOKUS_LEVEL[5] = function (api) {
    const W = D.weitblick, N = D.regeln.ziele, R = D.regeln;
    let B = 0, H = 0, dpr = 1, hgSchl = '', bgNah = null, bgFern = null, scharf = null, tischY = 0;
    let dinge = [], nr = 0, ziel = null, phase = 'aus', uhr = 0, aus = false, brille = W.brilleStart || 'nah', mix = 0, reihe = [], zuletzt = [];
    const fx = G.effekte(), tempo = api.tempo || 1;
    let tonGriff = null;

    function brilleSetzen(b, still) {
      if (b !== 'nah' && b !== 'fern') return;
      brille = b;
      $b.querySelectorAll('button').forEach(k => { const an = k.dataset.b === b; k.classList.toggle('an', an); k.setAttribute('aria-pressed', an); });
      if (!still) TON.effekt('brille');   // Brillenwechsel (Etui klappt)
    }
    $b.addEventListener('pointerdown', e => {
      const k = e.target.closest('button'); if (!k) return;
      e.preventDefault(); e.stopPropagation();
      if (phase !== 'aus' && phase !== 'start') brilleSetzen(k.dataset.b);
    });
    $b.addEventListener('click', e => { e.preventDefault(); });
    addEventListener('keydown', e => { if ($b.hidden) return; if (e.key === 'ArrowDown' || e.key === 'l') brilleSetzen('nah'); if (e.key === 'ArrowUp' || e.key === 'f') brilleSetzen('fern'); });

    const schalterOben = () => { const r = $b.getBoundingClientRect(); return r.height ? r.top : H - 64; };
    function baender() {
      const A = SZ.abbildung(5, B, H), Z = A.zonen || { fern: [0.5, 0.6], tisch: 0.63, nah: [0.8, 0.96] };
      const oben = api.oben() + 4, unten = Math.min(H - 8, schalterOben() - 8);
      tischY = klemm(A.y(Z.tisch), oben + 60, unten - 40);
      return { fern: [klemm(A.y(Z.fern[0]), oben + 30, tischY - 6), klemm(A.y(Z.fern[1]), oben + 40, tischY + 8)],
        nah: [klemm(A.y(Z.nah[0]), tischY + 30, unten), klemm(A.y(Z.nah[1]), tischY + 40, unten)], oben, unten };
    }
    function hgBauen() {
      scharf = SZ.levelBild(5, B, H, dpr);
      const weich = unscharf(scharf, W.unschaerfe * Math.min(B, H) * dpr * 0.6);
      baender();
      const naht = tischY * dpr, ueber = 18 * dpr;
      const zusammen = (oben, unten) => {
        const c = document.createElement('canvas'); c.width = scharf.width; c.height = scharf.height;
        const g = c.getContext('2d');
        g.drawImage(unten, 0, 0);
        // oberer Teil (bis zur Tischkante) mit weichem Übergang
        const m = document.createElement('canvas'); m.width = c.width; m.height = c.height;
        const mg = m.getContext('2d'); mg.drawImage(oben, 0, 0);
        mg.globalCompositeOperation = 'destination-in';
        const v = mg.createLinearGradient(0, naht - ueber, 0, naht + ueber); v.addColorStop(0, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)');
        mg.fillStyle = v; mg.fillRect(0, 0, m.width, m.height);
        g.drawImage(m, 0, 0);
        return c;
      };
      bgNah = zusammen(weich, scharf);    // Lesebrille: fern weich, nah scharf
      bgFern = zusammen(scharf, weich);   // Fernbrille: fern scharf, nah weich
    }
    function bereiten(m, k) {
      const fern = m.entfernung === 'fern', img = SZ.bild(m.bild), sv = img ? img.naturalWidth / img.naturalHeight : 1.2;
      const s = Math.min(B, H) * (fern ? W.groesseFern : W.groesseNah) * (1 - 0.12 * k / (N - 1));
      const h = klemm(s / Math.sqrt(sv), 26, H * 0.3), w = h * sv;
      const maxU = Math.max(4, W.unschaerfe * Math.min(B, H)) * (fern ? 0.32 : 0.8);   // ferne Dinge kleiner – weniger Unschärfe, damit man sieht, dass dort etwas steht
      const bild = SZ.motivBild(m, h, maxU * 2, dpr);
      return { m, fern, w, h, bild, st: SZ.stufen(bild.c, maxU * dpr, 6), t: 0, weg: 0 };
    }
    function platzieren(liste) {
      const b = baender(), belegt = { fern: [], nah: [] };
      return liste.filter(o => {
        const band = o.fern ? b.fern : b.nah, unterkante = band[0] + Math.random() * Math.max(0, band[1] - band[0]);
        const y0 = Math.max(b.oben, Math.min(unterkante, b.unten) - o.h);
        const bereich = { x: 8, y: y0, w: B - 16, h: Math.max(o.h, Math.min(b.unten, band[1]) - y0) };
        const p = G.platz(bereich, o.w, o.h, belegt[o.fern ? 'fern' : 'nah'], 12, 60);
        if (!p) return false;
        o.x = p.x; o.y = p.y; belegt[o.fern ? 'fern' : 'nah'].push(p);
        return true;
      });
    }
    function naechstes() {
      if (nr >= N) { aus = true; api.fertig(); return; }
      const k = nr;
      // Ziel: aus der gemischten Reihe; nicht mehr als zweimal hintereinander gleich weit weg
      let i = reihe.findIndex(m => !(zuletzt.length >= 2 && zuletzt.every(e => e === m.entfernung)));
      if (i < 0) i = 0;
      const m = reihe.splice(i, 1)[0];
      zuletzt.push(m.entfernung); if (zuletzt.length > 2) zuletzt.shift();
      const zahl = W.ziele[Math.min(k, W.ziele.length - 1)] || 3;
      const andere = mischen(pool().filter(p => p !== m && p.bild));
      // wie viele Dinge stehen fern (mit Ziel), der Rest liegt auf dem Tisch – je mindestens eines
      const fernGesamt = klemm(Math.round(zahl / 2 + (Math.random() - 0.5)), 1, zahl - 1), zielFern = m.entfernung === 'fern';
      const wahl = andere.filter(p => p.entfernung === 'fern').slice(0, fernGesamt - (zielFern ? 1 : 0))
        .concat(andere.filter(p => p.entfernung === 'nah').slice(0, zahl - fernGesamt - (zielFern ? 0 : 1)));
      const z = bereiten(m, k); z.ziel = true;
      let alle = [z].concat(wahl.slice(0, zahl - 1).map(p => bereiten(p, k)));
      alle = platzieren(alle);
      if (!alle.includes(z)) { z.x = B / 2 - z.w / 2; z.y = (z.fern ? baender().fern[0] : baender().nah[0]) - z.h; alle.unshift(z); }
      dinge = alle;
      ziel = { k, m, o: z, t: 0, ergebnis: null, ansageAb: W.ansageVor, zeit: lerp(W.zeit, k, N), voll: lerp(W.voll, k, N), textAb: null };
      api.ziel(k + 1, null);
      G.ansage.verbergen();
      phase = 'zeigen';
    }
    function ansagen() {
      const m = ziel.m, k = TON.klang({ name: m.geraeusch || m.name, ton: m.ton, laenge: 1.8 });
      const mitTon = TON.an() && !!m.geraeusch;
      if (mitTon) tonGriff = TON.spielen(k, 0.6, { hoechstens: 2.4 });
      // Text: sofort, außer mit Ton und echter Aufnahme (dann nach textNach)
      ziel.textAb = mitTon && k.echt ? ziel.t + W.textNach : ziel.t;
      ziel.tonBis = mitTon ? ziel.t + Math.min(2.4, k.dauer) : 0;
      phase = 'suchen';
    }
    function ergebnis(art, o, x, y, untergruppe) {
      const e = { ziel: ziel.k + 1, art, d: 0, name: ziel.m.name };
      if (art === 'treffer') { const rt = ziel.t - ziel.ansageAb; e.reaktion = rt; e.punkte = G.punkteNachZeit(rt, ziel.voll, ziel.zeit, R); }
      ziel.ergebnis = e;
      const q = o || ziel.o, cx = q.x + q.w / 2, cy = q.y + q.h / 2;
      const filter = art !== 'falsch' ? null : untergruppe === 'brille' ? (w => /brille/i.test(w)) : (w => !/brille/i.test(w));
      fx.neu(art, cx, cy, Math.max(q.w, q.h) * 0.6, api.rueckmeldung(art, e.punkte, filter), art === 'treffer' ? '+' + e.punkte : '');
      if (tonGriff) { tonGriff.aus(0.15); tonGriff = null; }
      // Name zeigen (falls er noch nicht stand), damit klar ist, was gesucht war
      G.ansage.zeigen({ bild: G.LAUTSPRECHER, text: ziel.m.name, klein: true });
      api.ergebnis(e);
      phase = 'pause'; uhr = W.pause + 0.3;
    }

    return {
      groesse(b, h, d) {
        B = b; H = h; dpr = d || 1;
        const s = B + 'x' + H + SZ.hgBereit(5, B, H);
        if (s !== hgSchl) { hgSchl = s; hgBauen(); }
      },
      vorladen() { if (window.FOKUS_SCHILDER) window.FOKUS_SCHILDER.laden(); pool().forEach(m => { SZ.bild(m.bild); if (m.ton) TON.klang({ name: m.geraeusch || m.name, ton: m.ton, laenge: 1.8 }); }); },
      neu(abZiel) {
        this.vorladen();
        reihe = mischen(pool()); zuletzt = [];
        dinge = []; fx.leeren(); aus = false; ziel = null;
        nr = Math.max(0, (abZiel || 1) - 1); phase = 'start'; uhr = 0.5;
        brilleSetzen(W.brilleStart || 'nah', true); mix = brille === 'fern' ? 1 : 0;
        $b.hidden = false;
        hgBauen();
      },
      stopp() { $b.hidden = true; G.ansage.verbergen(); if (tonGriff) { tonGriff.aus(0.1); tonGriff = null; } phase = 'aus'; },
      schritt(dt) {
        dt *= tempo;
        fx.schritt(dt);
        mix += ((brille === 'fern' ? 1 : 0) - mix) * Math.min(1, dt / 0.08);
        dinge.forEach(o => { o.t += dt; if (o.weg) o.weg += dt; });
        if (aus || api.abgebrochen()) { if (!aus && tonGriff) { tonGriff.aus(0.1); tonGriff = null; } aus = true; return; }
        if (phase === 'start') { uhr -= dt; if (uhr <= 0) naechstes(); return; }
        if (!ziel) return;
        ziel.t += dt;
        if (phase === 'zeigen' && ziel.t >= ziel.ansageAb) ansagen();
        if (phase === 'suchen') {
          if (ziel.textAb != null && ziel.t >= ziel.textAb && document.getElementById('fkAnsage').hidden) G.ansage.zeigen({ bild: G.LAUTSPRECHER, text: ziel.m.name, klein: true, hoert: ziel.t < ziel.tonBis });
          if (!document.getElementById('fkAnsage').hidden) G.ansage.hoert(ziel.t < ziel.tonBis);
          if (ziel.t - ziel.ansageAb >= ziel.zeit) ergebnis('verpasst', ziel.o);
        }
        if (phase === 'pause') {
          uhr -= dt;
          if (uhr < 0.45) dinge.forEach(o => { if (!o.weg) o.weg = 0.001; });
          if (uhr <= 0) { nr++; ziel = null; dinge = []; if (api.abgebrochen()) { aus = true; return; } naechstes(); }
        }
      },
      tipp(x, y) {
        if (!ziel || aus || (phase !== 'zeigen' && phase !== 'suchen')) return false;
        // oberstes Ding unter dem Finger (nahe Dinge liegen vorn)
        const treffer = dinge.filter(o => !o.weg && x >= o.x - 8 && x <= o.x + o.w + 8 && y >= o.y - 8 && y <= o.y + o.h + 8)
          .sort((a, b) => (a.fern === b.fern ? Math.hypot(x - a.x - a.w / 2, y - a.y - a.h / 2) - Math.hypot(x - b.x - b.w / 2, y - b.y - b.h / 2) : a.fern ? 1 : -1))[0];
        if (!treffer) return false;
        if (phase === 'zeigen') return false;   // vor der Ansage (ca. 0,6s): Tippen zählt nicht (MZ, 26.10.2026, Spielertest)
        if (treffer.ziel) {
          if ((treffer.fern ? 'fern' : 'nah') === brille) ergebnis('treffer', treffer, x, y);
          else ergebnis('falsch', treffer, x, y, 'brille');
        } else ergebnis('falsch', treffer, x, y, 'ziel');
        return true;
      },
      zeichne(g, b, h, laeuft) {
        if (!laeuft || !bgNah) { if (scharf) g.drawImage(scharf, 0, 0, B, H); return; }
        g.drawImage(bgNah, 0, 0, B, H);
        if (mix > 0.01) { g.save(); g.globalAlpha = mix; g.drawImage(bgFern, 0, 0, B, H); g.restore(); }
        // ferne Dinge zuerst, dann die nahen auf dem Tisch
        dinge.slice().sort((a, b2) => (a.fern === b2.fern ? 0 : a.fern ? -1 : 1)).forEach(o => {
          const rein = Math.min(1, o.t / 0.3), raus = o.weg ? Math.max(0, 1 - o.weg / 0.4) : 1;
          if (rein * raus <= 0) return;
          const u = o.fern ? 1 - mix : mix, pad = o.bild.pad;
          SZ.zeichneUnscharf(g, o.st, o.x - pad, o.y - pad, o.w + pad * 2, o.h + pad * 2, u, rein * raus);
        });
        fx.zeichne(g, B, H, api.oben(), schalterOben() - 4);
      },
      zustand() {
        if (!ziel) return { nr: nr + 1, phase, brille };
        const o = ziel.o;
        return { nr: ziel.k + 1, name: ziel.m.name, entfernung: ziel.m.entfernung, phase, t: ziel.t, ansageAb: ziel.ansageAb, zeit: ziel.zeit, brille,
          x: o.x + o.w / 2, y: o.y + o.h / 2, w: o.w, h: o.h, textAb: ziel.textAb,
          andere: dinge.filter(q => !q.ziel).map(q => ({ name: q.m.name, fern: q.fern, x: q.x + q.w / 2, y: q.y + q.h / 2 })),
          schalter: Array.from($b.querySelectorAll('button')).map(k => { const r = k.getBoundingClientRect(); return { b: k.dataset.b, x: r.x + r.width / 2, y: r.y + r.height / 2 }; }) };
      },
    };
  };

  // Startbild: ein fernes Ziel scharf in der Linse – seit der Schrift auf den Schildern (schilder.js) auch Schilder,
  // Plakate und Anzeigen; das Motiv kommt mit Schrift aus FOKUS_SZENE.motivBild. Sind die Schriften noch nicht geladen,
  // malt das Startbild die Linse neu, sobald sie da sind.
  let linsenZiel = null, nachladen = false;
  window.FOKUS_LINSE[5] = function (g, d, dpr) {
    const S = window.FOKUS_SCHILDER;
    const p = pool().filter(m => m.entfernung === 'fern' && m.bild && (S && S.hat(m) || !/schild|tafel|plakat|nummer|kennzeichen|schrift/i.test(m.name)));
    if (!linsenZiel || !p.includes(linsenZiel)) linsenZiel = p[Math.floor(Math.random() * p.length)];
    if (!linsenZiel) return;
    const img = SZ.bild(linsenZiel.bild); if (!img) return;
    const sv = img.naturalWidth / img.naturalHeight, h = Math.min(d * 0.5, d * 0.5 / Math.sqrt(sv) * 1.1), w = h * sv;
    const x = (d / 2 - w / 2) * dpr, y = (d * 0.6 - h / 2) * dpr;
    g.drawImage(SZ.motivBild(linsenZiel, h, 0, dpr).c, x, y, w * dpr, h * dpr);   // Motiv mit Schrift (motivBild trägt sie auf)
    if (S && S.hat(linsenZiel) && !S.bereit()) {
      if (!nachladen) { nachladen = true; S.beiBereit(() => { nachladen = false; if (window.FOKUS_SCHIRME && window.FOKUS_SCHIRME.malen) window.FOKUS_SCHIRME.malen(); }); }
    }
  };
})();
