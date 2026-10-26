// Service Worker der Sammlung „Fokus“: macht die Sammlung auf Android als App installierbar (ohne Chrome-Zeichen) und hält
// die Dateien für den Fall ohne Netz bereit. Strategie „zuerst Netz“: jede Anfrage geht ans Netz (Neues kommt sofort an);
// nur wenn das Netz fehlt, antwortet die Kopie aus dem Zwischenspeicher. Nur eigene Dateien, keine fremden Server.
// Beim ersten Besuch wird das Gerüst (Startseite + Spiel) vorab abgelegt, damit das Spiel auch offline startet.
// Bei Änderungen an dieser Datei VERSION erhöhen – alte Zwischenspeicher dieser Sammlung (Präfix „fokus-“) werden gelöscht.
const PREFIX = 'fokus-';
const VERSION = PREFIX + 'v28';   // v28: Spielertest-Funde – L5 Ring-Hinweis beim ersten Ziel (wackelt, Doppelpfeil), Anleitung „Zieh am Fokusring“, „Falsch gelesen“ raus, fünf Ziele umbenannt (Wasserflasche, Teetasse, Kochtopf, Sparschwein, Trommler – Bild/Ton-Dateien mit), L4 „Dieses Level braucht Ton“ + Knopf „Ton einschalten“, Startseite quer Gesamt-Bestwert einzeilig, Leben-Kreise 15 px; v27: Weitblick – neue Bilder Tischglocke, Sparschwein (Spardose), Kochtopf (Topfdeckel) ohne leere Schildchen/Anhänger/Zettel, Tischglocke 0,08 m; v26: Weitblick – Höhen nach Maßstabsprüfung (Schirm-Mann, Fußball-Fan, Trommler, Hahn, Katze, Lastenrad, Kutsche, Rasensprenger), Würfel und Gießkanne gestrichen (33 nah/34 fern), Kassenbon liegt flach; v25: Maibaum gestrichen (34 ferne Ziele, Nummern bleiben); v24: Maibaum steht nur ganz hinten bei den Häusern (Platzregel nurHinten); v23: Weitblick – Texte Fokusring (Anleitung, „Erst scharfstellen“), kleine Tisch-Dinge mindestens 40 px (vorn auf dem Tisch, sanft angehoben), Klänge Litfaßsäule, Ortsschild, Maibaum; v22: Weitblick überarbeitet – Fokusring statt Brillen-Knöpfe, Schärfentiefe stufenlos (Dinge und Hintergrund in Ebenen), Dinge perspektivisch auf Tisch und Pflaster mit Kontaktschatten, Schrift nur auf großen Schildern, Ziel-Liste Fassung 3 (35 nah/35 fern, Bilder und Töne über den Namen); L4 nur Ziel 1 vorgespielt, Rauschen lauter (L4-Developer); v21: Startseite passt in jede Höhe ohne Scrollen (Linse nimmt den Rest, Knöpfe nach dvh), Footer drei Zeilen mit Linie; v20: Ton und Wertung synchron (Geräusche L4/L5 auf hörbaren Einsatz zugeschnitten, Reaktion ab hörbarem Einsatz + Ausgabe-Latenz, Spieluhr an Audiouhr gekoppelt, L4 Fenster ≥ 1,2s, Schonzeit nach der Vorführung); v19: Ziel nie verdeckt (Ablenker weichen aus, Ziel obenauf, Treffer hat Vorrang – L1/L3/L5); v18: Manifest-Datei umbenannt in fokus.webmanifest (Zwischenspeicher umgehen); v17: neue Manifest-id „fokus-optik-app“ (Geister-Installation am Handy, Lösung wie Rohrbruch); v16: Sammlung verkleinert (Musik-Schleife 63s, Geräusche 32 kbit/s, Motive 400 px/Q80, Hintergründe Q70); v15: Knöpfe oben links (Menü, Ton, Vollbild) auch über Start-/Endbild, Ton aus sofort still; v14: Klänge (Musik, Raumklang je Level, Effekte, 156 Geräusche L4/L5, klaenge.js); v13: Schrift in Linsen (Level-Titel, Endbild) mit 12 % Randabstand; v12: Texte „drei Fehler“, Abbruch-Bewertung aus dem Entwurf, geschützte Leerzeichen in „Ziel 3 von 10“; v11: L2 Richtungswechsel mit Einblendung + Pause, Ansage-Band quer größer, Abbruch-Überschrift/-Hinweis, „Zum Menü“ als Knopf, neue Anleitungen L3/L5; v10: Rückmeldungen bleiben im sichtbaren Bereich, Abstände um die Bestwert-Zeile, „Naja“; v9: Weitblick – Tasse neu ausgeschnitten, Schrift auf Kennzeichen, Haltestelle (H), Bank („Spaßkasse“), Zahlenschloss; v8: „FOKUS“ in der Linse gesperrte Versalien (Variante A); v7: „Fokus“ in der Startseiten-Linse 5 % kleiner; v6: Firmierung „Guntram Muster Optik & Akustik GmbH“, Logo-Slogan „Sehen & Hören“, Brillen-Zeichen mit Ohren, neue App-Icons; v5: Schrift auf den Weitblick-Motiven (schilder.js, weitblick-schrift.js, 4 Schriften in schrift/weitblick/); v4: Phase 4 – gestaltete Bilder (Motive, Landschaft/See/Stadtplatz), Level 2–5 spielbar; v3: Abbruch-Bewertung „Fokus verloren“ aus texte.js; v2: Texte des Text Writers (texte.js), Pools aller Level, Plakette umschaltbar, Hintergründe L2/L4; v1: Phase 1 (Startseite, Intro, App, Start-/Endbild, Level 1 mit Platzhaltern)

const GERUEST = [
  './', 'index.html', 'fokus.webmanifest',
  'start/start.css', 'start/start.js', 'start/intro.js', 'start/fokus-basis.js', 'start/fokus-icon.js',
  'kunde/kunde.js', 'kunde/logo-quer.svg', 'kunde/logo-quer-weiss.svg', 'kunde/logo-hoch.svg', 'kunde/zeichen.svg', 'kunde/zeichen-weiss.svg',
  'schrift/poppins.css', 'schrift/poppins-regular.woff2', 'schrift/poppins-semibold.woff2', 'schrift/poppins-bold.woff2', 'schrift/poppins-extrabold.woff2',
  'schrift/weitblick/encode/encodesanssemicondensed-semibold.woff2', 'schrift/weitblick/patrick/patrickhand-regular.woff2',
  'schrift/weitblick/unifraktur/unifrakturmaguntia-book.woff2', 'schrift/weitblick/abril/abrilfatface-regular.woff2',
  'icons/icon.svg', 'icons/favicon.png', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-maskable-192.png',
  'optik-fokus/', 'optik-fokus/index.html', 'optik-fokus/rahmen.css', 'optik-fokus/rahmen.js', 'optik-fokus/fokus.css',
  'optik-fokus/texte.js', 'optik-fokus/daten.js', 'optik-fokus/klaenge.js', 'optik-fokus/motive.js', 'optik-fokus/weitblick-schrift.js', 'optik-fokus/schilder.js', 'optik-fokus/szene.js', 'optik-fokus/schirme.js',
  'optik-fokus/spiel-schaerfe.js', 'optik-fokus/spiel-gemein.js', 'optik-fokus/spiel-richtung.js', 'optik-fokus/spiel-spiegelung.js',
  'optik-fokus/spiel-rauschen.js', 'optik-fokus/spiel-weitblick.js', 'optik-fokus/spiel.js',
  'optik-fokus/bilder/hintergrund/richtung-schaufenster.webp', 'optik-fokus/bilder/hintergrund/rauschen-hoerkabine.webp',
  'optik-fokus/bilder/hintergrund/schaerfe-landschaft-hoch.webp', 'optik-fokus/bilder/hintergrund/schaerfe-landschaft-quer.webp',
  'optik-fokus/bilder/hintergrund/spiegelung-see-hoch.webp', 'optik-fokus/bilder/hintergrund/spiegelung-see-quer.webp',
  'optik-fokus/bilder/hintergrund/weitblick-stadtplatz-hoch.webp', 'optik-fokus/bilder/hintergrund/weitblick-stadtplatz-quer.webp',
];
// Motive und Geräusche stehen in motive.js (bild/ton), alle Tondateien (Musik, Raumklang, Effekte, Geräusche) in klaenge.js –
// nach dem Gerüst im Hintergrund mit ablegen (Bilder ca. 2 MB, Ton ca. 2,8 MB), damit alle Level auch ohne Netz vollständig
// sind. Neue Bilder/Töne kommen so ohne Änderung dieser Liste mit.
function inhalteAblegen() {
  const lesen = a => fetch(new URL(a, self.location.href).href).then(r => (r.ok ? r.text() : '')).catch(() => '');
  return Promise.all([lesen('optik-fokus/motive.js'), lesen('optik-fokus/klaenge.js')]).then(([m, k]) => {
    const bilder = (m.match(/"(?:bilder|klaenge)\/[^"]+\.(?:webp|png|mp3)"/g) || []).map(a => 'optik-fokus/' + a.slice(1, -1));
    const toene = (k.match(/"(?:optik-fokus\/)?klaenge\/[^"]+\.mp3"/g) || []).map(a => a.slice(1, -1));   // ab Sammlungsordner
    return ablegen(Array.from(new Set(bilder.concat(toene))));
  }).catch(() => {});
}

// einzeln ablegen: fehlt eine Datei (z. B. anderes Kundenlogo), bricht nicht alles ab
function ablegen(adressen) {
  return caches.open(VERSION).then(c => Promise.all(adressen.map(a => {
    const url = new URL(a, self.location.href).href;
    return fetch(url).then(r => (r.status === 200 && r.type === 'basic') ? c.put(url, r) : null).catch(() => null);
  })));
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(ablegen(GERUEST).catch(() => {}).then(inhalteAblegen));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(namen => Promise.all(namen.filter(n => n.startsWith(PREFIX) && n !== VERSION).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const anfrage = e.request, adresse = new URL(anfrage.url);
  if (anfrage.method !== 'GET' || adresse.origin !== self.location.origin) return;
  e.respondWith(fetch(anfrage).then(antwort => {
    // nur vollständige eigene Antworten merken (keine Teilantworten, keine Fehlerseiten)
    if (antwort.status === 200 && antwort.type === 'basic' && !anfrage.headers.has('range')) {
      const kopie = antwort.clone();
      e.waitUntil(caches.open(VERSION).then(c => c.put(anfrage, kopie)).catch(() => {}));
    }
    return antwort;
  }).catch(() => caches.open(VERSION).then(c => c.match(anfrage, { ignoreSearch: true })).then(t => t || Response.error())));
});
