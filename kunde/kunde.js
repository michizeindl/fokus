// Kundendaten der Sammlung „Fokus“ (Baukasten A3 Optiker/Hörakustiker) – nur diese Datei und die Logos in diesem Ordner
// ändern sich pro Kunde. Startseite und Spiel laden beide genau diese Datei (keine Kopie im Spielordner).
// Musterfirma: „Guntram Muster Optik & Akustik GmbH“, Slogan im Logo „Sehen & Hören“ (alles erfunden, MZ 26.10.2026;
// vorher „Optik & Hören Muster“).
(function () {
  'use strict';
  // Adressen der Logos gelten ab diesem Ordner – egal, ob die Startseite oder das Spiel (eine Ebene tiefer) lädt
  var basis = 'kunde/';
  try { if (document.currentScript && document.currentScript.src) basis = new URL('.', document.currentScript.src).href; } catch (e) { /* alter Browser */ }

  window.KUNDE = {
    firma: 'Guntram Muster Optik & Akustik GmbH',
    // Kurzname für Seitentitel im Browser-Tab („Fokus – Guntram Muster Optik & Akustik“, ohne GmbH – zu lang)
    kurzname: 'Guntram Muster Optik & Akustik',

    // Logos (SVG). logo = weiß für Flächen in Hausfarbe (Startseite), logoAufHell = in Hausfarbe für helle Flächen
    // (weißes Schild oben rechts im Start-/Endbild und im Spiel). zeichen/zeichenWeiss = nur die Brille (Icon, Intro).
    // Das Logo steht überall oben rechts (wie auf der Website des Kunden prüfen; Musterfirma: MZ 26.10.2026).
    // Ein SVG mit der Gruppe id="zeichen" (Brille) und id="schriftzug" nutzt das Intro: die Brille fliegt an ihren Platz.
    logo: basis + 'logo-quer-weiss.svg',
    logoAufHell: basis + 'logo-quer.svg',
    logoHoch: basis + 'logo-hoch.svg',
    zeichen: basis + 'zeichen.svg',
    zeichenWeiss: basis + 'zeichen-weiss.svg',

    // Farben: haupt = Markenfarbe (Fläche der Startseite, Knöpfe, Überschriften; #00FF00 in gestalteten Bildern wird
    // darin umgefärbt). Hellere und dunklere Abstufungen rechnet die Seite selbst aus.
    farben: { haupt: '#0F7C80', hauptText: '#ffffff', akzent: '#f2c14e', dunkel: '#0a3f41', hell: '#ffffff' },

    // Kontaktdaten im Footer der Startseite (MZ, 26.10.2026). Nichts davon ist verlinkt oder anklickbar.
    // Telefon: Film-Rufnummer der Bundesnetzagentur (klingelt bei niemandem); Internetadresse ohne „www.“ (MZ).
    kontakt: ['Guntram Muster Optik & Akustik GmbH', 'Stadtplatz 7', '94999 Musterstadt'],
    telefon: 'Tel. 089 99998 130',
    web: 'muster-optik.de',
    // Datenschutz/Impressum: nur unterstrichen (Musterfirma). Ein echter Kunde trägt hier später seine Adressen ein.
    rechtliches: [{ text: 'Datenschutz', link: '' }, { text: 'Impressum', link: '' }],

    // Texte überschreiben (optional, je Level): { 1: { titel, anleitung }, … }
    texte: {},

    // Knopf im Endbild zur Kunden-Website (leer = kein Knopf; Musterfirma ohne Link)
    knopf: null,
  };
})();
