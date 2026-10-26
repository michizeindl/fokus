// „Fokus“ – Ablauf der 5 Level (MZ, 26.10.2026): Startbild → Level-Titel (2–3s, Tippen überspringt) → 10 Ziele → Endbild.
// Regeln (gleich in allen Leveln): Treffer 50–100 Punkte je Ziel nach Nähe zum perfekten Moment; zu früh/zu spät/daneben/
// verpasst = 0 für dieses Ziel + Fehler; 3 Fehler = Abbruch (0 Punkte, nie Bestwert); geschafft = mindestens 1 Punkt und
// das nächste Level ist frei. Je Level eigener Bestwert (Rahmen speichert: mg:best:fokus-<n>:<firma>).
// Die Logik je Level steht in spiel-<level>.js (window.FOKUS_LEVEL[nr]): schaerfe, richtung, spiegelung, rauschen, weitblick
// (gemeinsame Bausteine der Level 2–5 in spiel-gemein.js). Jede Logik: groesse, neu, schritt, tipp, zeichne, zustand,
// optional vorladen (Startbild), stopp (Endbild/Abbruch: Töne aus).
//
// Testhilfen (Adresse):  #level=N  Level N öffnen (gesperrte nur mit #test)   #los  sofort starten (Titel läuft)
//   #ziel=N  ab Ziel N spielen (mit #los)   #tempo=0.5  langsamer   #titel  Level-Titel bleibt stehen
//   #ende=846  Beispiel-Endbild (&treffer=9&fehler=1&reaktion=0.62), nichts gespeichert   #abbruch=8  Beispiel-Abbruch
//   window.FOKUS_TEST: zustand(), titelUeberspringen(), ende(punkte, {treffer, reaktion}), abbruch(zielNr), ueberdecken() (L1/L3)
(function () {
  'use strict';
  const R_ = window.Rahmen, D = window.FOKUS, FK = window.FK, SCH = window.FOKUS_SCHIRME, T = D.texte;
  // Klänge (Phase 3): Effekte, Musik im Startbild, Raumklang je Level – alles über spiel-gemein.js (daten.js musik/klang)
  const TON = window.FOKUS_GEMEIN.ton;
  const hash = location.hash;
  const wert = (name, art) => { const m = new RegExp('[#&]' + name + '(?:=([^&]*))?(?:&|$)').exec(hash); return m ? (art === 'zahl' ? (m[1] != null ? +m[1] : null) : (m[1] != null ? m[1] : true)) : undefined; };
  const OPT = { level: wert('level', 'zahl'), los: !!wert('los'), ziel: wert('ziel', 'zahl'), tempo: wert('tempo', 'zahl'), titel: !!wert('titel'),
    ende: wert('ende', 'zahl'), abbruch: wert('abbruch', 'zahl'), test: !!wert('test'), treffer: wert('treffer', 'zahl'), fehler: wert('fehler', 'zahl'), reaktion: wert('reaktion', 'zahl') };

  const offen = n => { const l = D.level[n - 1]; return !!l && l.spielbar && (OPT.test || FK.frei(n)); };
  let lvNr = OPT.level && offen(OPT.level) ? OPT.level : 1;
  for (let n = lvNr; n >= 1 && !offen(n); n--) lvNr = n - 1 || 1;
  const lv = () => D.level[lvNr - 1];
  const sek = s => s.toFixed(2).replace('.', ',') + 's';

  let phase = 'start', B = innerWidth, H = innerHeight, dpr = 1;
  let stand = null;
  const logiken = {};
  function logik(n) {
    if (!logiken[n] && window.FOKUS_LEVEL && window.FOKUS_LEVEL[n]) { logiken[n] = window.FOKUS_LEVEL[n](api); logiken[n].groesse(B, H, dpr); }
    return logiken[n] || null;
  }

  // ---------- Schnittstelle für die Level ----------
  const api = {
    tempo: OPT.tempo > 0 ? OPT.tempo : 1,
    oben: () => Math.max(SCH.hud.unterkante() + 12, window.FOKUS_GEMEIN ? window.FOKUS_GEMEIN.ansage.unterkante() + 8 : 0),
    // Rückmeldung im Spiel aus texte.js (zufällige Variante): Treffer stark/knapp, zu früh, falsch, verpasst („zu spät“
    // getippt zählt wie verpasst – die Liste enthält auch „Zu spät“)
    // filter (optional): Wörter, die passen müssen (z. B. Level 5 „Falsche Brille“ nur bei falscher Brille)
    rueckmeldung(art, punkte, filter) {
      const r = lv().rueckmeldung || {};
      const fall = art === 'treffer' ? (punkte >= D.starkAb ? 'stark' : 'knapp') : art === 'spaet' ? 'verpasst' : art;
      let liste = r[fall] || [];
      if (filter) { const f = liste.filter(filter); if (f.length) liste = f; }
      return liste.length ? liste[Math.floor(Math.random() * liste.length)] : '';
    },
    abgebrochen: () => !!(stand && stand.abbruch),
    ziel(n, m) { stand.zielNr = n; SCH.hud.ziel(n, m && m.name); },
    ergebnis(e) {
      if (!stand || stand.abbruch) return;
      stand.ergebnisse.push(e);
      if (e.art === 'treffer') {
        stand.punkte += e.punkte; stand.treffer++; stand.reaktionen.push(e.reaktion); stand.abweichungen.push(Math.abs(e.d));
        SCH.hud.punkte(stand.punkte, true);
        TON.effekt(e.punkte >= D.starkAb ? 'stark' : 'treffer');
      } else {
        stand.fehler++;
        SCH.hud.fehler(stand.fehler, true);
        R_.vibrieren(90);
        TON.effekt(stand.fehler >= D.regeln.fehlerMax ? 'abbruch' : 'fehler');
        if (stand.fehler >= D.regeln.fehlerMax) {
          stand.abbruch = true; stand.endeBei = e.ziel; phase = 'auswertung';
          setTimeout(() => endbild(true), 1000);
        }
      }
    },
    fertig() { if (!stand || stand.abbruch || phase !== 'spiel') return; phase = 'auswertung'; TON.effekt('geschafft'); setTimeout(() => endbild(false), 800); },
  };

  // ---------- Ablauf ----------
  function levelBeginnen() {
    const l = logik(lvNr);
    if (l && l.stopp) l.stopp();
    stand = { punkte: 0, fehler: 0, treffer: 0, reaktionen: [], abweichungen: [], ergebnisse: [], zielNr: OPT.ziel || 1, abbruch: false };
    SCH.alleVerbergen();
    SCH.hud.ziel(stand.zielNr, ''); SCH.hud.punkte(0); SCH.hud.fehler(0); SCH.hud.zeigen(true);
    if (l) l.neu(OPT.ziel || 1);
    phase = 'titel';
    // Musik aus, Raumklang des Levels weich an, Wusch zum Level-Titel
    TON.musik(false); TON.raum(lvNr); TON.effekt('wusch');
    SCH.titel(lv(), () => { if (phase === 'titel') phase = 'spiel'; }, OPT.titel);
  }
  function startbild() {
    phase = 'start';
    SCH.hud.zeigen(false);
    const l = logik(lvNr);
    if (l && l.stopp) l.stopp();
    if (l && l.vorladen) l.vorladen();
    window.FOKUS_SZENE.vorladen(lvNr);
    // Startbild: Musik (auch nach „Weiter“), kein Raumklang; Raumklang des Levels schon laden
    TON.raum(0); TON.musik(true); TON.vorladen(lvNr);
    SCH.start(lv(), FK.best(lv().id));
  }
  function bilanzText(abbruch) {
    // Sätze aus texte.js: geschafft / fehlerfrei (10 von 10) bzw. Abbruch mit n = 2–7, n = 1, n = 0
    const n = stand.treffer, b = lv().bilanz, k = stand.endeBei || stand.zielNr;
    const satz = abbruch ? (n === 0 ? b.abbruch0 : n === 1 ? b.abbruch1 : b.abbruch) : (n >= D.regeln.ziele ? b.fehlerfrei : b.geschafft);
    return satz.replace(/\{n\}/g, n).replace(/\{k\}/g, k);
  }
  // Plakette: Schalter D.plakette ('genauigkeit' | 'reaktion')
  function plaketteText(s) { return (D.plakette === 'reaktion' ? T.plakette.reaktion : T.plakette.genauigkeit).replace('{s}', sek(s)); }
  function endbild(abbruch) {
    if (phase === 'ende') return;
    const l = lv(), alt = FK.best(l.id);
    const punkte = abbruch ? 0 : Math.max(1, Math.min(D.regeln.hoechst, Math.round(stand.punkte)));
    const lg = logik(lvNr);
    if (lg && lg.stopp) lg.stopp();
    TON.raum(0);   // Endbild: kein Raumklang, keine Musik – nur der Klang zur Bewertung
    R_.ende(punkte, { verzoegerung: 0 });   // Rahmen speichert den Bestwert (0 nie) und spielt „bestwert“
    phase = 'ende';
    SCH.hud.zeigen(false);
    const neu = !abbruch && (alt == null || punkte > alt);
    const naechstes = D.level[lvNr];
    const weiter = !abbruch && !!naechstes && naechstes.spielbar && FK.frei(naechstes.nr);
    const frei = !abbruch && !!naechstes && naechstes.spielbar && !(alt > 0) ? T.frei.replace('{n}', naechstes.nr) : '';
    const genau = D.plakette !== 'reaktion', r = genau ? stand.abweichungen : stand.reaktionen;
    SCH.ende({
      lv: l, punkte,
      bewertung: abbruch ? T.abbruch : FK.bewertung(l, punkte),
      plakette: !abbruch && r.length ? plaketteText(r.reduce((a, b) => a + b, 0) / r.length) : '',
      bilanz: bilanzText(abbruch), abbruchHinweis: abbruch ? lv().abbruchHinweis : '',
      bestText: neu ? (alt == null ? T.ersterBest : T.neuerBest) : T.bestwert + ': ' + FK.zahl(alt || 0) + '/' + FK.zahl(D.regeln.hoechst) + ' ' + T.punkte,
      neu, weiter, frei,
    });
    if (!abbruch) TON.effekt('bewertung', { verzoegerung: (D.klang || {}).bewertungNach || 0.5 });
  }

  SCH.knoepfe({
    los() { (document.getElementById(R_.zustand === 'start' ? 'losKnopf' : 'nochmalKnopf') || {}).click(); },
    nochmal() { document.getElementById('nochmalKnopf').click(); },
    weiter() {
      if (!offen(lvNr + 1)) { startbild(); return; }
      lvNr++; def.id = lv().id;
      try { history.replaceState(null, '', '#level=' + lvNr); } catch (e) { /* egal */ }
      document.title = D.name + ' – ' + lv().name + ' – ' + (K().kurzname || K().firma || '');
      startbild();
    },
  });

  // ---------- Anmeldung beim Rahmen ----------
  const def = {
    id: lv().id, wertung: 'hoch', hoechst: D.regeln.hoechst,
    format: p => FK.zahl(p) + ' ' + T.punkte,
    texte: { titel: D.name, untertitel: '', anleitung: '' },
    neu() { if (R_.zustand === 'spiel') levelBeginnen(); },
    schritt(dt) { if (phase === 'spiel' || phase === 'auswertung') { const l = logik(lvNr); if (l) l.schritt(dt); } },
    zeichne(g, b, h) {
      const l = logik(lvNr) || logik(1);
      if (l) l.zeichne(g, b, h, phase === 'spiel' || phase === 'auswertung');
      else { g.fillStyle = FK.farben.haupt; g.fillRect(0, 0, b, h); }
    },
    runter(x, y) {
      if (phase === 'titel') { SCH.titelEnde(); return; }
      if (phase === 'spiel') { const l = logik(lvNr); if (l) l.tipp(x, y); }
    },
    groesse(b, h) {
      B = b; H = h; dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      Object.values(logiken).forEach(l => l.groesse(B, H, dpr));
    },
  };
  R_.spiel(def);
  // Hintergründe vorab laden; ist eines fertig, Start-/Endbild und Spielfläche neu zeichnen
  window.FOKUS_SZENE.beiBild(() => { SCH.malen(); Object.values(logiken).forEach(l => l.groesse(B, H, dpr, true)); });
  window.FOKUS_SZENE.vorladen(lvNr);
  document.title = D.name + ' – ' + lv().name + ' – ' + (K().kurzname || K().firma || '');
  function K() { return FK.K || {}; }

  // ---------- Erster Bildschirm ----------
  if (OPT.ende != null || OPT.abbruch != null) {
    // Beispiel-Endbild: nichts wird gespeichert (Rahmen.ende wird nicht aufgerufen)
    const abbruch = OPT.abbruch != null, n = OPT.treffer != null ? OPT.treffer : (abbruch ? Math.max(0, OPT.abbruch - 3) : 9);
    stand = { punkte: OPT.ende || 0, treffer: n, fehler: abbruch ? 3 : (OPT.fehler || 0), reaktionen: [OPT.reaktion || 0.62], abweichungen: [OPT.reaktion || 0.03], zielNr: OPT.abbruch || 10, endeBei: OPT.abbruch };
    phase = 'ende';
    const p = abbruch ? 0 : Math.max(1, Math.min(1000, OPT.ende));
    SCH.ende({ lv: lv(), punkte: p, bewertung: abbruch ? T.abbruch : FK.bewertung(lv(), p),
      plakette: abbruch ? '' : plaketteText(OPT.reaktion != null ? OPT.reaktion : (D.plakette === 'reaktion' ? 0.62 : 0.03)), bilanz: bilanzText(abbruch), abbruchHinweis: abbruch ? lv().abbruchHinweis : '',
      bestText: abbruch ? T.bestwert + ': ' + FK.zahl(FK.best(lv().id) || 0) + '/1.000 ' + T.punkte : T.neuerBest, neu: !abbruch,
      weiter: !abbruch && !!D.level[lvNr] && D.level[lvNr].spielbar, frei: '' });
  } else {
    startbild();
    if (OPT.los) setTimeout(() => SCH.knoepfe && document.getElementById('fkLos').click(), 60);
  }

  // ---------- Testhilfe für QA/Specialist/Bots ----------
  window.FOKUS_TEST = {
    zustand() {
      const l = logik(lvNr);
      return { phase, level: lvNr, rahmen: R_.zustand, punkte: stand ? stand.punkte : 0, fehler: stand ? stand.fehler : 0,
        treffer: stand ? stand.treffer : 0, ergebnisse: stand ? stand.ergebnisse.slice() : [], ziel: l && phase !== 'start' ? l.zustand() : null };
    },
    titelUeberspringen: () => SCH.titelEnde(),
    // L1/L3: ein Ablenker deckt die untere Hälfte des Ziels ab und zieht mit (weicht nicht aus) → Lage des Ablenkers
    ueberdecken() { const l = logik(lvNr); return l && l.testUeberdecken ? l.testUeberdecken() : null; },
    ende(punkte, o) { o = o || {}; location.hash = 'level=' + lvNr + '&ende=' + punkte + (o.treffer != null ? '&treffer=' + o.treffer : '') + (o.reaktion != null ? '&reaktion=' + o.reaktion : ''); location.reload(); },
    abbruch(z) { location.hash = 'level=' + lvNr + '&abbruch=' + (z || 8); location.reload(); },
  };
})();
