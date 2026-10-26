// App-Icon „Brille im Fokusring“ (Variante 1, MZ 26.10.2026) – Maße an EINER Stelle.
// Benutzt von Material/Skripte/icons-bauen.js (Node, erzeugt icons/) und vom Intro der Startseite (start/intro.js).
// Raster 512 × 512. Alles Wichtige liegt im Kreis mit Radius 204,8 (Schutzzone für runde/maskierte Icons):
// Ring außen 190 + halbe Strichstärke 4 = 194.
(function (wurzel) {
  'use strict';
  const I = {
    N: 512,
    ring: { r: 190, w: 16 },                       // Radius des Fokusrings, Grundmaß der Skala (wie Vorschau/app-icon/bauen.py)
    // weiße Brille mit Ohren (Logo-Zeichen, viewBox -28,16 0 333,42 100 seit 26.10.2026), Mitte 256/256; Ohren bei ±146 –
    // Abstand zu den langen Skalenstrichen (Spitze bei r 164, runde Kappe bis ca. 161,6) ca. 15 (vorher ohne Ohren: breite 280, x 116, y 205)
    brille: { breite: 292, x: 110, y: 212.2 },
  };

  // Farbe heller/dunkler: f > 1 heller (kräftiger), f < 1 dunkler – wie #18989c / #0F7C80 / #0a5a5d bei Petrol
  I.abstufung = function (hex, f) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map(v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('');
  };

  // Ring mit Skala (60 Striche, jeder fünfte länger) als SVG-Teile im 512er Raster, weiß
  I.ringSvg = function (farbe) {
    const c = farbe || '#fff', r = I.ring.r, w = I.ring.w, m = I.N / 2;
    let striche = '';
    for (let k = 0; k < 60; k++) {
      const l = k % 5 === 0 ? w * 1.6 : w;
      striche += `<line x1="0" y1="${-r}" x2="0" y2="${(-r + l).toFixed(1)}" transform="translate(${m},${m}) rotate(${k * 6})"/>`;
    }
    return `<circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="${c}" stroke-width="${w * 0.5}" opacity=".9"/>` +
      `<g stroke="${c}" stroke-width="${(w * 0.35).toFixed(1)}" stroke-linecap="round" opacity=".85">${striche}</g>`;
  };

  // Hintergrund des Icons: radialer Verlauf aus der Kundenfarbe
  I.hintergrundSvg = function (haupt, id) {
    const g = id || 'fkVerlauf';
    return `<defs><radialGradient id="${g}" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${I.abstufung(haupt, 1.22)}"/>` +
      `<stop offset=".55" stop-color="${haupt}"/><stop offset="1" stop-color="${I.abstufung(haupt, 0.72)}"/></radialGradient></defs>` +
      `<rect width="${I.N}" height="${I.N}" fill="url(#${g})"/>`;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = I; else wurzel.FOKUS_ICON = I;
})(typeof window !== 'undefined' ? window : this);
