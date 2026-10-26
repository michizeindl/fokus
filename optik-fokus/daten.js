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
  // darunter „Treffer schwach“ („Naja“), dazwischen „Treffer knapp“ („Gerade noch“) – MZ, 26.10.2026, alle Level
  schwachUnter: 65,

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
      // Linse im Startbild (MZ, 26.10.2026: Motive dürfen nicht in der Luft hängen): ein Motiv steht auf der linken
      // Fahrspur des Feldwegs. motive = echte Höhe in m (nur Motive, die sichtbar auf dem Boden stehen); je Bildform
      // kamera = Augenhöhe in m (am Weg nachgemessen, Weg ca. 3 m breit), flach = Abflachung des Schattens,
      // weg = Fußpunkte auf der Spur (Anteile des Bilds, von nah nach fern) – das Motiv steht am nächsten Punkt, an dem
      // es ganz in die Linse passt (große weiter hinten); ohne = im Hochformat zu breit (stünden nur winzig ganz hinten)
      linsenBuehne: {
        motive: { 'Radfahrer': 1.8, 'Rennradfahrerin': 1.75, 'Jogger': 1.8, 'Wanderer': 1.8, 'Reiterin': 2.4, 'Kinderwagen': 1.7,
          'Kuh': 1.45, 'Schaf': 0.85, 'Hund': 0.65, 'Traktor': 2.8 },
        hoch: { kamera: 2.6, flach: 0.26, ohne: ['Reiterin', 'Traktor'], weg: [[0.43, 0.8], [0.47, 0.75], [0.55, 0.7], [0.585, 0.67], [0.605, 0.65], [0.61, 0.62]] },
        quer: { kamera: 2.1, flach: 0.24, weg: [[0.405, 0.85], [0.42, 0.8], [0.435, 0.75], [0.45, 0.7], [0.47, 0.68], [0.49, 0.65]] },
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
      // quer: näher heran und etwas tiefer, damit das Ding auf dem Pflaster nicht winzig über viel Tisch steht (26.10.2026)
      linseForm: { quer: { punkt: [0.62, 0.44], zoom: 1.5 } },
      // Linse im Startbild (MZ, 27.10.2026: Haltestelle „naaaja“): nur Motive, die als Bild wirken – keine Pfosten-Schilder
      // (Haltestelle, Tempo, Ortsschild, Wegweiser), keine Tauben, Hund, Hahn (Rasensprenger seit 27.10.2026 gestrichen). Das Motiv steht auf dem Pflaster
      // (Fußpunkt unter der Linsenmitte, nächster Punkt, an dem es passt; Größe nach Perspektive) und ist ganz zu sehen:
      // luft = Abstand des Umrisses zum Linsenrand oben und seitlich (Anteil des Durchmessers), luftUnten = für Füße/Räder und
      // Kontaktschatten. ohne = passt in dieser Bildform nirgends mit Rand (gemessen 27.10.2026) – wird dort nicht gewählt;
      // passt ein Motiv beim Zeichnen doch nicht, wird es künftig in dieser Bildform übergangen.
      linsenBuehne: {
        motive: ['Akkordeonspieler', 'Postbotin', 'Straßenkehrer', 'Kinder mit Ball', 'Clown', 'Imker', 'Mopedfahrer', 'Radfahrer',
          'Schirm-Mann', 'Marktstand', 'Eiswagen', 'Popcornwagen', 'Litfaßsäule', 'Lastenrad', 'Seifenkiste', 'Musiker mit Gitarre',
          'Brunnenfigur', 'Trommler'],
        luft: 0.09, luftUnten: 0.03,
        hoch: { ohne: [] },
        quer: { ohne: [] },
      },
      // Geometrie des Stadtplatz-Bilds (eingemessen 26.10.2026, Anteile des Bilds: x der Breite, y der Höhe) für den
      // Fokusring: Dinge stehen in richtiger Perspektive auf Pflaster bzw. Tisch, jede Stelle hat eine Tiefe.
      //   horizont      Augenhöhe im Bild (Fluchtlinie)
      //   kamera        Augenhöhe über dem Pflaster in m (aus Bank, Haltestelle und Türen im Bild nachgemessen)
      //   tischAuge     Augenhöhe über der Tischplatte in m (Maßstab der Dinge auf dem Tisch)
      //   tischHinten   Abstand der hinteren Tischkante in m (legt die Brennweite fest)
      //   fassade       Fußlinie der Häuser (hier ist die Tiefe 1 = ganz fern)
      //   tischkante    hintere Kante der Tischplatte (Linie von links nach rechts); darunter liegt der Tisch
      //   hinten        hinterste Fußlinie für ferne Dinge (vor Brunnen, Pflanzkübeln, Haltestelle)
      //   sperren       Bereiche ohne Dinge [x0, y0, x1, y1] (z. B. Stuhllehne)
      //   fussSperren   Bereiche ohne Fußpunkte [x0, y0, x1, y1]: Stufen/Sockel des Brunnens, Pfosten-Füße der Haltestelle,
      //                 Kübel – jeweils mit ca. 1 % Bildhöhe Abstand davor, damit Füße sichtbar auf ebenem Pflaster stehen
      //                 (MZ, 26.10.2026: Fußball-Fan „leicht in der Luft“ vor der Brunnenstufe)
      zonen: {
        hoch: { horizont: 0.478, kamera: 0.83, tischAuge: 0.465, tischHinten: 1.1, fassade: 0.49,
          tischkante: [[0, 0.668], [0.08, 0.663], [0.15, 0.656], [0.2, 0.652], [0.3, 0.646], [0.4, 0.643], [0.5, 0.642], [0.6, 0.642], [0.7, 0.644], [0.8, 0.648], [0.9, 0.655], [0.95, 0.662], [1, 0.668]],
          hinten: [[0, 0.556], [0.47, 0.556], [0.48, 0.523], [0.78, 0.523], [0.79, 0.538], [1, 0.538]],
          sperren: [[0, 0.62, 0.09, 0.7]],
          fussSperren: [[0, 0.46, 0.475, 0.567], [0.545, 0.49, 0.79, 0.537], [0.79, 0.49, 1, 0.552]] },
        quer: { horizont: 0.437, kamera: 1.74, tischAuge: 0.365, tischHinten: 1.1, fassade: 0.495,
          tischkante: [[0, 0.716], [0.05, 0.706], [0.1, 0.696], [0.15, 0.686], [0.2, 0.676], [0.25, 0.667], [0.3, 0.66], [0.33, 0.656], [0.5, 0.656], [0.6, 0.657], [0.7, 0.66], [0.8, 0.664], [0.9, 0.67], [0.94, 0.674], [0.96, 0.7], [0.98, 0.725], [1, 0.75]],
          hinten: [[0, 0.551], [0.11, 0.551], [0.115, 0.589], [0.41, 0.589], [0.415, 0.563], [0.53, 0.563], [0.535, 0.541], [0.78, 0.541], [0.785, 0.596], [0.98, 0.596], [0.985, 0.566], [1, 0.566]],
          fussSperren: [[0, 0.5, 0.115, 0.562], [0.105, 0.5, 0.42, 0.603], [0.41, 0.5, 0.535, 0.572], [0.535, 0.5, 0.785, 0.553], [0.78, 0.5, 1, 0.607]] },
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
    // Größe je Motiv (Name wie im Entwurf) zusätzlich zur Größenklasse – damit kleine Dinge auch klein wirken (MZ, 26.10.2026:
    // „Münze deutlich kleiner“). 1 = wie die Klasse. Trefferfläche bleibt mindestens 40 × 40 px.
    faktor: {
      'Münze': 0.45, 'Kaulquappe': 0.6, 'Wasserschnecke': 0.6, 'Schlüsselbund': 0.7, 'Sonnenbrille': 0.6, 'Stichling': 0.7,
      'Moderlieschen': 0.7, 'Bitterling': 0.75, 'Teichmuschel': 0.8, 'Molch': 0.8, 'Taschenlampe': 0.85, 'Badeschuh': 0.85,
      'Flusskrebs': 0.85, 'Goldfisch': 0.85, 'Fußball': 0.75, 'Flaschenpost': 0.8,
    },
  },
  // Level 4 „Rauschen“: Zielgeräusch im gleichmäßigen Rauschen erkennen
  rauschen: {
    grundrauschen: null,         // Adresse einer Rausch-Aufnahme ab optik-fokus/; null = im Browser erzeugt (nahtlos, 0 KB)
    farbe: 0.35,                 // erzeugtes Rauschen: 0 = rosa (heller), 1 = braun (dumpfer), dazwischen gemischt
    // Lautstärke des Rauschens im Verhältnis zu einem typischen Zielgeräusch (1 = gleich laut, 0,5 = 6 dB leiser),
    // Ziel 1 → Ziel 10 (steigt). Größer = schwerer herauszuhören. MZ, 26.10.2026 („schwerer“): endet +3 dB über dem Ziel
    // (1,41; vorher 1,0) – gemessen mit Material/Skripte/rauschabstand.py: im besten Oktavband ragen die Ziele in ihren lauten
    // Momenten im Median 13,6 dB aus dem Rauschen (bei 1,0: 16,6 dB); die schwächsten stehen in leiseSpaet.
    pegelRauschen: [0.35, 1.41],
    pegelZiel: 0.55,             // Lautstärke der Geräusche
    vorhoeren: 1,                // nur Ziel 1: das Zielgeräusch erklingt vorher einmal zum Einprägen (MZ, 26.10.2026; vorher 1–4)
    ablenker: [0, 1, 1, 1, 2, 2, 2, 2, 3, 3],   // andere Geräusche vor dem Ziel
    // davon „Verwechsler“ (gleiches Paar wie das Ziel, motive.js `paar`, z. B. Türklingel/Fahrradklingel), je Ziel:
    // ganze Zahl = so viele sicher, Nachkommastelle = Wahrscheinlichkeit für einen weiteren (MZ, 26.10.2026: steigt, ab Ziel 6
    // mindestens einer, gegen Ende zwei). Ab Ziel 6 kommen dafür nur Ziele mit Paar-Partner dran (Partner ggf. zweimal).
    aehnlich: [0, 0, 0.25, 0.35, 0.5, 1, 1, 1.5, 2, 2],
    // Ziele, die bei lautem Rauschen (ab leiseSpaetAb, Ziel 7–10: Rauschen lauter als das Ziel) kaum noch herausragen
    // (rauschabstand.py: bester Bandabstand < 6 dB bei +3 dB) – kommen nur bei den Zielen davor dran
    leiseSpaet: ['Basketball prellt', 'Blinker klackt', 'Garagentor', 'Holzboden Schritte', 'Wanduhr schlägt', 'Schreibmaschine'],
    leiseSpaetAb: 7,
    teppich: [0, 0, 1, 1, 1, 1, 2, 2, 2, 2],    // lange Ablenk-Geräusche, die leise darunter liegen (zählen nicht als falsch)
    luecke: [[0.6, 1.2], [0.4, 0.9]],           // Stille zwischen zwei Geräuschen
    hoechstens: 2.6,             // Zielgeräusche werden höchstens so lang gespielt …
    hoechstensAblenker: 1.8,     // … andere Geräusche davor höchstens so lang
    nachlauf: 0.5,               // so lange nach Ende des Zielgeräuschs zählt Tippen noch
    voll: 0.6,                   // Reaktion ab Beginn des Zielgeräuschs: bis hier 100 Punkte …
    grenze: [2.2, 1.2],          // … bis hierhin linear auf 50
    pause: 0.9,
  },
  // Level 5 „Weitblick“ (überarbeitet 26.10.2026, MZ: Fokusring statt Brillen-Knöpfe, echte Szene statt Collage):
  // Der Fokusring unten stellt die Schärfe stufenlos von nah (Tisch, Tiefe 0) nach fern (Häuser, Tiefe 1). Jedes Ding hat
  // eine Tiefe (aus seinem Fußpunkt im Bild); scharf ist es nur in einem Bereich um seine Tiefe. Werte Ziel 1 → Ziel 10.
  weitblick: {
    ziele: [6, 6, 6, 6, 6, 7, 7, 7, 7, 7],      // Dinge gleichzeitig in der Szene (MZ, 26.10.2026: 6–7 bleiben)
    zeit: [9.0, 6.0],            // Sekunden ab der Ansage bis „verpasst“ (Ring drehen braucht Zeit)
    voll: [2.2, 1.5],            // Reaktion bis hier volle Tempo-Punkte, bis zur Zeitgrenze linear auf die Hälfte
    // Punkte je Ziel (MZ, 26.10.2026): Tempo bis 90 (Untergrenze 45, Kurve wie oben) + Schärfe bis 10 (genau in der Mitte
    // des Schärfebereichs 10, linear auf 0 am Rand der Toleranz); Summe höchstens 100. Ab perfektAb Schärfe-Punkten
    // Rückmeldung „Treffer perfekt“ („Gestochen scharf“) vor allen anderen. Angezeigt wird nur die Summe.
    punkteTempo: 90, punkteTempoMin: 45, punkteSchaerfe: 10, perfektAb: 9,
    textNach: 1.2,               // mit Ton und echter Aufnahme erscheint der Text erst nach so vielen Sekunden
    toleranz: [0.09, 0.045],     // so weit (Tiefe 0–1) darf der Ring beim Tippen neben dem Ziel stehen – gegen Ende empfindlicher
    weite: [0.42, 0.3],          // ab diesem Abstand (Tiefe) ist etwas ganz unscharf – kleiner = Schärfebereich schmaler
    unschaerfe: 0.026,           // volle Unschärfe (Halbmesser) als Anteil der kürzeren Bildschirmseite
    fokusStart: 0.15,            // Ring steht zu Beginn auf dem Tisch
    weich: 0.07,                 // Sekunden, mit denen die Schärfe dem Ring weich folgt (Überblendung, auch bei „Bewegung reduzieren“)
    ringWeg: 2.6,                // Drehung des Rings für den ganzen Weg nah → fern (Bogenmaß; etwa eine Wischbewegung)
    naechste: 0.35,              // Abstand in m, der Tiefe 0 entspricht (vorderer Tischrand)
    fernBand: 0.35,              // ferne Dinge stehen im hinteren Teil des Pflasters (Anteil von der hintersten Fußlinie zum Tisch)
    // Platzregel je Motiv: Name → Anteil des Pflasters ab der hintersten Fußlinie, in dem das Ding stehen darf (z. B. 0,06 =
    // nur ganz hinten bei den Häusern; statt fernBand). Zuerst für den Maibaum gebaut (MZ, 26.10.2026), der dann gestrichen wurde.
    nurHinten: {},
    // Gewölbte Unterkante (MZ, 27.10.2026: Hahn auf rundem Steinsockel wirkte schwebend): Name → Anteil der Motivhöhe über dem
    // tiefsten Punkt, bis zu dem die Unterkante als Standfläche zählt. Kontaktschatten folgt dann der ganzen Unterkante
    // (dunkler Kern direkt an der Kante, Hof und Schlagschatten mit ihrer Neigung), die Kante selbst wird leicht abgedunkelt.
    standKontur: { 'Hahn': 0.12 },
    dunst: 0.07,                 // ferne Dinge bekommen einen Hauch Luftdunst (passt sie ins Licht des Platzes)
    wechsel: 0.35,               // so oft verschwindet nach einem Ziel zusätzlich ein anderes Ding (die Szene lebt)
    pause: 0.8,
    ansageVor: 0.8,              // neue Dinge sind so lange zu sehen, bevor das Ziel angesagt wird
    // Höhe in m (wie hoch das Ding im Bild in Wirklichkeit ist) – bestimmt die Größe in der Perspektive. Ferne Dinge: Feld
    // „Höhe ca. … m“ im Entwurf des Text Writers (daten-bauen.py → motive.js hoehe, geht vor). Nahe Dinge: vorerst diese
    // Tabelle (Höhe, die das Ding im Bild „leicht von oben“ einnimmt). null = nicht im Spiel.
    hoehe: {
      'Handy': 0.12, 'Kassenbon': 0.12, 'Tischglocke': 0.08, 'Taschenrechner': 0.11, 'Armbanduhr': 0.06,
      'Kugelschreiber': 0.11, 'Wasserflasche': 0.22, 'Fotoapparat': 0.09, 'Kassettenrekorder': 0.1, 'Sparschwein': 0.11,
      'Brillenetui': 0.06, 'Tacker': 0.08, 'Marmeladenglas': 0.1, 'Teetasse': 0.1, 'Zahlenschloss': 0.09, 'Frühstücksei': 0.11,
      'Pfeffermühle': 0.17, 'Kochtopf': 0.17, 'Taschenuhr': 0.07, 'Spielkarten': 0.08,
      'Luftpolsterfolie': 0.13, 'Milchaufschäumer': 0.2, 'Sprühflasche': 0.25, 'Mundharmonika': 0.035, 'Strohhalm': 0.18,
      'Elektrorasierer': 0.13, 'Schlüsselbund': 0.08, 'Weinglas': 0.2, 'Brezel': 0.09, 'Piccolo': 0.2, 'Brausetablette': 0.13,
      'Nussschale': 0.08, 'Kaugummi': 0.07,
    },
    // Kleine Dinge auf dem Tisch erkennbar halten (MZ, 26.10.2026: Armbanduhr ca. 15 px, Kaugummi ca. 20 px waren zu winzig):
    //   ab/kurve  Dinge unter `ab` m werden sanft angehoben: ab × (Höhe/ab)^kurve (Reihenfolge bleibt: Mundharmonika < Uhr < Fotoapparat)
    //   px        Mindesthöhe im Bild bei 375 px kürzerer Seite (größere Bildschirme bis ×1,3) – kleine Dinge liegen dafür
    //             nur so weit vorn auf dem Tisch, dass sie diese Höhe erreichen (hinten nur größere Dinge)
    nahKlein: { ab: 0.09, kurve: 0.5, px: 40 },
    // Flach liegende Dinge: Bild beim Zeichnen nur in der Höhe stauchen (Faktor), Breite bleibt – sonst wirkt es senkrecht
    // stehend (MZ, 26.10.2026: Kassenbon). 0,57 ≈ sin 35° (Blick leicht von oben). Die Höhe in `hoehe` gilt ungestaucht;
    // Mindesthöhe (nahKlein.px) und Trefferfläche (≥ 44 px) zählen nach dem Stauchen.
    flach: { 'Kassenbon': 0.57 },
    hoeheStandard: { nah: 0.1, fern: 1.8 },   // neue Motive ohne Höhe (bis der Text Writer sie liefert)
    platzhalter: false,          // false = nur Motive mit Bild in die Szene (neue Bilder fehlen noch); true = fehlende als Kärtchen mit Namen
    // Schrift nur auf großen, flachen Schildern (MZ, 26.10.2026: auf Tasse, Gläsern, Etiketten, Dosen „ganz schlimm“).
    // Name beginnt mit einem dieser Wörter → Schrift aus weitblick-schrift.js; alle anderen Motive ohne Schrift.
    schriftNur: ['Ortsschild', 'Haltestelle', 'Temposchild', 'Biergartentafel', 'Wegweiser', 'Litfaßsäule', 'Marktstand'],
  },

  // Feste Wörter der Oberfläche (Knöpfe, Kopfzeile, Endbild)
  texte: {
    los: 'Los geht’s',
    menue: 'Zum Menü',
    weiter: 'Weiter',
    nochmal: 'Nochmal',
    tonEin: 'Ton einschalten',   // L4-Startbild bei Ton aus (MZ, 26.10.2026)
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
    // Level 5: Name des Fokusrings für Vorlesehilfen (nicht sichtbar)
    fokusring: 'Fokusring',
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
