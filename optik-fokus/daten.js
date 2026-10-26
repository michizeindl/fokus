// Daten der Sammlung „Fokus“: Level, Regeln, Schwierigkeit, Schalter. Startseite (../index.html) und Spiel lesen beide diese Datei.
// Die Spieltexte (Titel, Anleitungen, Rückmeldungen, Bilanz-Sätze, Richtungsansagen, Ton-Hinweise) stehen in texte.js, die
// Ziel-Pools in motive.js – beide ERZEUGT aus Material/Texte/fokus-*-entwurf.md mit Material/Skripte/daten-bauen.py.
// texte.js muss vor dieser Datei geladen sein; fehlt sie (z. B. Startseite), bleiben nur die Namen.
window.FOKUS = {
  name: 'Fokus',

  // Musik der Sammlung: läuft auf der Startseite und im Startbild (auch nach „Weiter“), nicht in den Leveln und nicht im
  // Endbild (MZ, 26.10.2026). „Acoustic“ von PaulYudin (Pixabay). Adresse ab dem Sammlungsordner; null = keine Musik.
  // pegel 0–1, einblenden/ausblenden in Sekunden. Die Datei baut Material/Skripte/klaenge-bauen.py (Einbauliste).
  musik: { datei: 'klaenge/musik.mp3', pegel: 0.4, einblenden: 1.5, ausblenden: 0.8 },

  // Klänge im Spiel (Phase 3, 26.10.2026) – alle Dateien baut Material/Skripte/klaenge-bauen.py aus
  // Material/Klaenge-Einbauliste.md (Adressen ab optik-fokus/). pegel = Lautstärke 0–1. Fehlt eine Datei, nimmt das Spiel
  // den erzeugten Ton des Rahmens (ersatz) bzw. bleibt still.
  klang: {
    effekte: {
      treffer:   { datei: 'klaenge/effekte/treffer.mp3', pegel: 0.5, ersatz: 'gut' },     // Treffer
      stark:     { datei: 'klaenge/effekte/stark.mp3', pegel: 0.45, ersatz: 'gut' },      // Treffer ab starkAb Punkten
      fehler:    { datei: 'klaenge/effekte/fehler.mp3', pegel: 0.35, ersatz: 'fehler' },  // zu früh, falsch, verpasst
      abbruch:   { datei: 'klaenge/effekte/abbruch.mp3', pegel: 0.5, ersatz: 'fehler' },  // dritter Fehler
      geschafft: { datei: 'klaenge/effekte/geschafft.mp3', pegel: 0.45, ersatz: 'sieg' }, // alle 10 Ziele durch
      bewertung: { datei: 'klaenge/effekte/bewertung.mp3', pegel: 0.5 },                  // Endbild mit Bewertung
      wusch:     { datei: 'klaenge/effekte/wusch.mp3', pegel: 0.6 },                      // Level-Titel
      brille:    { datei: 'klaenge/effekte/brille.mp3', pegel: 0.55, ersatz: 'klick' },   // Level 5 Lese-/Fernbrille
      klar:      { datei: 'klaenge/effekte/klar.mp3', pegel: 0.22 },                      // Level 3 Polfilter wird klar
    },
    bewertungNach: 0.5,          // Sekunden nach dem Erscheinen des Endbilds
    // Raumklang je Level: leise Schleife unter dem Spiel (ab Level-Titel bis Endbild), weich ein- und ausgeblendet.
    // Pegel so gewählt, dass die Geräusche etwa gleich leise wirken (Lautheit in klaenge.js); L4 fast still.
    raum: {
      1: [{ datei: 'klaenge/raum/1-wiese.mp3', pegel: 0.13 }],
      2: [{ datei: 'klaenge/raum/2-laden.mp3', pegel: 0.5 }],
      3: [{ datei: 'klaenge/raum/3-see.mp3', pegel: 0.27 }],
      4: [{ datei: 'klaenge/raum/4-hoerkabine.mp3', pegel: 0.6 }],
      5: [{ datei: 'klaenge/raum/5-stadtplatz.mp3', pegel: 0.17 }, { datei: 'klaenge/raum/5-brunnen.mp3', pegel: 0.08 }],
    },
    raumEinblenden: 1.5, raumAusblenden: 1.0,
    // Geräusche in Level 4/5 auf ähnliche Lautheit bringen (leise Klicks lauter, laute Rufe leiser, höchstens ×2 bzw. ×0,4).
    // bezug = typische Lautheit eines Geräuschs (Mittelwert der Zielgeräusche, gemessen von klaenge-bauen.py)
    angleichen: true, bezug: 0.14,
  },

  // Spielregeln (MZ, 26.10.2026: „passen so“) – gleich in allen 5 Leveln
  regeln: { ziele: 10, fehlerMax: 3, punkteMax: 100, punkteMin: 50, hoechst: 1000 },
  // Stufengrenzen der Bewertung (gemeinsam für alle Mini-Games) und Schärfe-Balken auf der Startseite (5 = ab 900)
  stufen: [900, 800, 700, 550],

  // Welche der Varianten aus dem Text-Entwurf gilt (0 = erste, 1 = zweite) – für Anleitung, Bilanz-Sätze und Ton-Hinweis.
  // MZ wählt; bis dahin die erste. Rückmeldungen im Spiel (Treffer/zu früh/falsch/verpasst) wechseln zufällig.
  textVariante: 0,
  // Rückmeldung „Treffer stark“ ab so vielen Punkten für das Ziel, darunter „Treffer knapp“
  starkAb: 80,

  // Plakette im Endbild (MZ, 26.10.2026): 'reaktion' = „Ø 0,52s Reaktion“ (vom Scharfwerden bis zum Tippen).
  // Schalter bleibt: 'genauigkeit' = „Ø 0,03s neben dem schärfsten Moment“ (Abstand des Tipps zum perfekten Moment)
  plakette: 'reaktion',

  // spielbar: false = auf der Startseite abgegraut (kein „demnächst“), auch wenn das Level schon freigeschaltet wäre
  // hintergrund: Level-Bild ab optik-fokus/ – eine Adresse oder { hoch, quer }; null = Platzhalter im Code.
  // umfaerben: true = Flächen in #00FF00 werden in der Kundenfarbe gezeigt. position = Bildausschnitt [x, y] (0–1) beim
  // Zuschneiden und für die Linse im Startbild.
  level: [
    {
      nr: 1, id: 'fokus-1', name: 'Schärfe', spielbar: true,
      // Bewertungen ab 900/800/700/550/darunter (MZ, 26.10.2026)
      bewertungen: ['Gestochen scharf', 'Klare Sicht', 'Gut im Bild', 'Leicht verschwommen', 'Viel im Dunst'],
      // gestaltetes Bild (Graphic Artist, Phase 2); Zonen am Bild eingemessen (Anteile der Bildhöhe, 26.10.2026)
      hintergrund: { hoch: 'bilder/hintergrund/schaerfe-landschaft-hoch.webp', quer: 'bilder/hintergrund/schaerfe-landschaft-quer.webp' },
      position: [0.45, 0.62],
      zonen: {
        hoch: { himmel: [0.07, 0.38], horizont: 0.462, feld: [0.52, 0.64], weg: 0.86 },
        quer: { himmel: [0.08, 0.36], horizont: 0.5, feld: [0.6, 0.72], weg: 0.88 },
      },
    },
    {
      nr: 2, id: 'fokus-2', name: 'Richtung', spielbar: true,
      bewertungen: ['Treffsicher', 'Gut orientiert', 'Meist richtig', 'Etwas verdreht', 'Ziemlich verdreht'],
      // Platzhalter-Bild der Musterfirma (Schaufenster), für Kunden tauschbar
      hintergrund: 'bilder/hintergrund/richtung-schaufenster.webp', umfaerben: true, position: [0.5, 0.45],
    },
    {
      nr: 3, id: 'fokus-3', name: 'Spiegelung', spielbar: true,
      bewertungen: ['Glasklar', 'Gut durchschaut', 'Fische gefunden', 'Noch etwas Glanz', 'Viel Spiegelung'],
      hintergrund: { hoch: 'bilder/hintergrund/spiegelung-see-hoch.webp', quer: 'bilder/hintergrund/spiegelung-see-quer.webp' },
      position: [0.5, 0.55],
      // tief = weiter weg (oben, kleiner, dunkler), flach = vorn über dem hellen Grund; Steg unten links bleibt frei
      zonen: {
        hoch: { wasser: 0.12, tief: [0.22, 0.47], flach: [0.5, 0.8] },
        quer: { wasser: 0.12, tief: [0.2, 0.45], flach: [0.48, 0.84] },
      },
    },
    {
      nr: 4, id: 'fokus-4', name: 'Rauschen', spielbar: true,
      bewertungen: ['Klar herausgehört', 'Gut herausgehört', 'Meist erwischt', 'Etwas überhört', 'Viel im Rauschen'],
      // Platzhalter-Bild der Musterfirma (Hörkabine), für Kunden tauschbar
      hintergrund: 'bilder/hintergrund/rauschen-hoerkabine.webp', umfaerben: true, position: [0.68, 0.42],
    },
    {
      nr: 5, id: 'fokus-5', name: 'Weitblick', spielbar: true,
      bewertungen: ['Weitblick bewiesen', 'Nah und fern im Griff', 'Gut umgestellt', 'Etwas gezögert', 'Oft daneben'],
      hintergrund: { hoch: 'bilder/hintergrund/weitblick-stadtplatz-hoch.webp', quer: 'bilder/hintergrund/weitblick-stadtplatz-quer.webp' },
      position: [0.5, 0.78], linse: [0.62, 0.4],   // linse = Ausschnitt in der Linse des Startbilds (Häuser, Kirchturm)
      // fern = Fußlinie der fernen Ziele (Pflaster vor den Häusern), nah = Fußlinie auf dem Cafétisch, tisch = Tischkante
      zonen: {
        hoch: { fern: [0.5, 0.6], tisch: 0.63, nah: [0.8, 0.96] },
        quer: { fern: [0.53, 0.63], tisch: 0.665, nah: [0.8, 0.97] },
      },
    },
  ],

  // Schwierigkeit Level 1 „Schärfe“: Werte für Ziel 1 → Ziel 10 (dazwischen gleichmäßig). Erklärung in spiel-schaerfe.js.
  schaerfe: {
    dauer: [10, 6],           // Sekunden, die ein Motiv für den Weg über das Bild braucht (schneller)
    atem: [6.0, 1.7],         // Sekunden für einen „Atemzug“ der Schärfe (kürzer = kürzeres scharfes Fenster, mehr Fast-scharf-Momente)
    rest: [0.62, 0.32],       // Restunschärfe in den Fast-scharf-Momenten (kleiner = leichter zu verwechseln)
    toleranz: [0.22, 0.12],   // so unscharf darf es beim Tippen höchstens sein (Anteil der vollen Unschärfe)
    groesse: [1.0, 0.68],     // Größe des Motivs (kleiner)
    ablenker: [0, 0, 0, 0, 1, 1, 1, 2, 2, 2],   // weitere, nie scharfe Motive im Bild (Antippen = Fehler „falsch“)
    pause: 1.0,               // Sekunden zwischen zwei Zielen
  },

  // Schwierigkeit Level 2 „Richtung“ (Werte Ziel 1 → Ziel 10): Ringe mit Öffnung über dem Schaufenster
  richtung: {
    wechsel: [1, 4, 6, 8, 10],   // bei diesen Zielen wird eine neue Richtung angesagt (ab 6 auch schräge Richtungen)
    schneller: 6,                // ab diesem Ziel „Jetzt schneller“ (Zusatzansage)
    wechselPause: 1.3,           // Sekunden „Neue Richtung“ mittig mit Ring-Symbol; Ringe und Uhr stehen, Tippen zählt nicht (MZ, 26.10.2026)
    schraegAb: 6,
    ablenker: [3, 3, 4, 4, 5, 5, 6, 6, 7, 7],   // Ringe mit anderer Öffnung gleichzeitig im Bild
    sicht: [3.0, 1.4],           // Sekunden, die der passende Ring sichtbar bleibt (danach „verpasst“)
    warten: [[1.6, 3.4], [1.2, 2.8]],   // Zeitspanne bis der passende Ring kommt (Ziel 1 bzw. Ziel 10) – Level dauert so ca. 50s
    groesse: [0.105, 0.062],     // Ring-Halbmesser als Anteil der kürzeren Bildschirmseite
    voll: 0.5,                   // bis zu dieser Reaktionszeit 100 Punkte, bis zum Ende der Sichtzeit linear auf 50
    pause: 0.6,
  },
  // Level 3 „Spiegelung“: Spiegelung verdeckt das Wasser, der Polfilter wird in Abständen kurz klar
  spiegelung: {
    takt: [2.5, 1.7],            // Sekunden von Klarblick zu Klarblick
    klar: [1.5, 0.6],            // so lange ist der Filter klar
    dauer: [9, 6],               // Sekunden für den Weg durchs Bild (liegende Dinge: so lange sichtbar)
    ablenker: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
    aehnlichAb: 5,               // ab diesem Ziel sehen Ablenker dem Ziel ähnlicher (gleiche Art: Fisch bzw. Ding)
    groesse: [1.0, 0.75],
    voll: 0.35,                  // Reaktion ab Klarwerden: bis hier 100 Punkte, bis Ende des Klarblicks linear auf 50
    pause: 0.8,
  },
  // Level 4 „Rauschen“: Zielgeräusch im gleichmäßigen Rauschen erkennen
  rauschen: {
    grundrauschen: null,         // Adresse einer Rausch-Aufnahme ab optik-fokus/; null = im Browser erzeugt (nahtlos, 0 KB)
    farbe: 0.35,                 // erzeugtes Rauschen: 0 = rosa (heller), 1 = braun (dumpfer), dazwischen gemischt
    // Lautstärke des Rauschens im Verhältnis zu einem typischen Zielgeräusch (1 = gleich laut, 0,5 = 6 dB leiser),
    // Ziel 1 → Ziel 10 (steigt). Größer = schwerer herauszuhören.
    pegelRauschen: [0.35, 1.0],
    pegelZiel: 0.55,             // Lautstärke der Geräusche
    vorhoeren: 4,                // Ziel 1–4: das Zielgeräusch erklingt vorher einmal zum Einprägen
    ablenker: [0, 1, 1, 1, 2, 2, 2, 2, 3, 3],   // andere Geräusche vor dem Ziel (ab aehnlichAb bevorzugt ähnliche Paare)
    aehnlichAb: 6,
    teppich: [0, 0, 1, 1, 1, 1, 2, 2, 2, 2],    // lange Ablenk-Geräusche, die leise darunter liegen (zählen nicht als falsch)
    luecke: [[0.6, 1.2], [0.4, 0.9]],           // Stille zwischen zwei Geräuschen
    hoechstens: 2.6,             // Zielgeräusche werden höchstens so lang gespielt …
    hoechstensAblenker: 1.8,     // … andere Geräusche davor höchstens so lang
    nachlauf: 0.5,               // so lange nach Ende des Zielgeräuschs zählt Tippen noch
    voll: 0.6,                   // Reaktion ab Beginn des Zielgeräuschs: bis hier 100 Punkte …
    grenze: [2.2, 1.2],          // … bis hierhin linear auf 50
    pause: 0.9,
  },
  // Level 5 „Weitblick“: Lese- und Fernbrille, Ziel wird als Geräusch angesagt (ohne Ton als Text)
  weitblick: {
    ziele: [3, 3, 4, 4, 5, 5, 6, 6, 6, 7],      // Dinge gleichzeitig im Bild (nah + fern zusammen)
    zeit: [7.0, 3.8],            // Sekunden ab der Ansage bis „verpasst“
    voll: [1.1, 0.8],            // Reaktion bis hier 100 Punkte, bis zur Zeitgrenze linear auf 50
    textNach: 1.2,               // mit Ton und echter Aufnahme erscheint der Text erst nach so vielen Sekunden
    groesseFern: 0.19,           // Größe (Wurzel aus Breite × Höhe) als Anteil der kürzeren Bildschirmseite
    groesseNah: 0.26,
    unschaerfe: 0.03,            // Unschärfe ohne passende Brille (Anteil der kürzeren Seite)
    brilleStart: 'nah',
    pause: 0.8,
    ansageVor: 0.6,              // Dinge sind so lange zu sehen, bevor das Ziel angesagt wird
  },

  // Feste Wörter der Oberfläche (Knöpfe, Kopfzeile, Endbild)
  texte: {
    los: 'Los geht’s',
    menue: 'Zum Menü',
    weiter: 'Weiter',
    nochmal: 'Nochmal',
    level: 'Level',
    bestwert: 'Dein Bestwert',
    gesamt: 'Dein Gesamt-Bestwert',
    punkte: 'Punkte',
    von: 'von 1.000 Punkten',
    ziel: 'Ziel',
    neuerBest: 'Neuer Bestwert',
    ersterBest: 'Dein erster Bestwert',
    frei: 'Level {n} freigeschaltet',
    plakette: { genauigkeit: 'Ø {s} neben dem schärfsten Moment', reaktion: 'Ø {s} Reaktion' },
    // Level 5: Schalter der Brillen (Wörter aus Auftrag/Anleitung „Lese- oder Fernbrille“)
    lesebrille: 'Lesebrille',
    fernbrille: 'Fernbrille',
  },
};

// Texte aus texte.js in die Level übernehmen (gewählte Variante); Ersatz nur, falls texte.js fehlt
(function () {
  'use strict';
  const D = window.FOKUS, TX = window.FOKUS_TEXTE || {}, v = D.textVariante || 0;
  // Bewertung im Endbild bei Abbruch (3 Fehler), für alle Level gleich – aus texte.js („alle“)
  // Fehlt die Zeile im Entwurf (fokus-rahmen-entwurf.md: „Abbruch-Bewertung (alle Level) | …“), gilt die Entscheidung von MZ
  // (26.10.2026) „Fokus verloren“ – sonst stünde das Abbruch-Endbild ohne Überschrift da (Fund Spielertest 26.10.2026).
  D.texte.abbruch = (TX.alle && TX.alle.abbruchBewertung) || 'Fokus verloren';
  const wahl = (liste, ersatz) => (liste && liste.length ? liste[Math.min(v, liste.length - 1)] : ersatz);
  D.level.forEach(lv => {
    const t = TX[lv.nr] || {};
    lv.titel = t.titel || D.texte.level + ' ' + lv.nr + ' – ' + lv.name;
    lv.abbruchHinweis = wahl(t.abbruchHinweis, '');   // klein im Abbruch-Endbild unter der Bilanz (MZ, 26.10.2026)
    lv.anleitung = wahl(t.anleitungen, '');
    lv.anleitungen = t.anleitungen || [];
    lv.rueckmeldung = t.rueckmeldung || {};
    const b = t.bilanz || {};
    lv.bilanz = { geschafft: wahl(b.geschafft, '{n} von 10'), fehlerfrei: wahl(b.fehlerfrei, '10 von 10'),
      abbruch: wahl(b.abbruch, 'Ende bei Ziel {k} von 10'), abbruch1: wahl(b.abbruch1, 'Ende bei Ziel {k} von 10'),
      abbruch0: wahl(b.abbruch0, 'Ende bei Ziel {k} von 10') };
    if (t.tonHinweise) lv.hinweis = wahl(t.tonHinweise, '');
    if (t.phasen) lv.phasen = { vorhoeren: wahl(t.phasen.vorhoeren, ''), hoeren: wahl(t.phasen.hoeren, '') };   // L4: Anzeige im Ansage-Band
    if (t.richtungen) { lv.richtungen = t.richtungen; lv.zusatzansagen = t.zusatzansagen || []; }
  });
})();
