// Gemeinsame Helfer der Sammlung „Fokus“ für Startseite und Spiel: Kundenfarben als CSS-Variablen, Logo einbetten,
// Bestwerte und Freischaltung lesen, Klang-Angaben (MP3-Zuschnitt, Musik-Stelle). Braucht kunde/kunde.js (window.KUNDE) und
// optik-fokus/daten.js (window.FOKUS), für Klänge optik-fokus/klaenge.js (window.FOKUS_KLAENGE).
(function () {
  'use strict';
  const K = window.KUNDE || {}, D = window.FOKUS || { level: [], stufen: [900, 800, 700, 550] };
  const F = Object.assign({ haupt: '#0F7C80', hauptText: '#ffffff' }, K.farben);

  function abstufung(hex, f) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map(v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('');
  }
  // hell = Mitte des Verlaufs, dunkel = Rand bzw. Schrift auf Weiß, blass = Flächen auf Weiß (Plakette, leere Balken)
  function mischen(hex, weiss) {
    const h = String(hex).replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16) || 0;
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * weiss).toString(16).padStart(2, '0')).join('');
  }
  const wurzel = document.documentElement.style;
  wurzel.setProperty('--haupt', F.haupt);
  wurzel.setProperty('--haupt-hell', abstufung(F.haupt, 1.22));
  wurzel.setProperty('--haupt-dunkel', abstufung(F.haupt, 0.72));
  wurzel.setProperty('--haupt-tief', abstufung(F.haupt, 0.55));
  wurzel.setProperty('--haupt-blass', mischen(F.haupt, 0.86));
  wurzel.setProperty('--haupt-zart', mischen(F.haupt, 0.93));
  wurzel.setProperty('--haupt-text', F.hauptText || '#fff');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', F.haupt);

  // Logo als eingebettetes SVG (Farben per CSS-Variablen --mf-zeichen/--mf-schrift, Gruppen #zeichen/#schriftzug fürs Intro).
  // Nur wenn es wirklich ein SVG ohne Skript ist; über file:// (kein fetch) oder bei Fehlern als <img>.
  // ids: true = ids behalten (nur einmal je Seite, Startseite fürs Intro), sonst entfernt (mehrere Kopien im Spiel).
  const svgTexte = {};
  function logoText(adresse) {
    if (!svgTexte[adresse]) {
      svgTexte[adresse] = location.protocol === 'file:' ? Promise.resolve(null)
        : fetch(adresse).then(r => r.ok ? r.text() : null).catch(() => null);
    }
    return svgTexte[adresse];
  }
  function logoEinbetten(platz, adresse, opt) {
    opt = opt || {};
    return logoText(adresse).then(t => {
      const sauber = t && /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(t) && !/<script|on\w+\s*=|javascript:/i.test(t);
      platz.textContent = '';
      if (sauber) {
        platz.innerHTML = t.replace(/^\s*<\?xml[^>]*>\s*/, '').replace(/<title>[\s\S]*?<\/title>/, '');
        const svg = platz.querySelector('svg');
        if (!opt.ids) platz.querySelectorAll('[id]').forEach(e => { e.setAttribute('data-teil', e.id); e.removeAttribute('id'); });
        if (svg) { svg.setAttribute('aria-hidden', 'true'); svg.removeAttribute('width'); svg.removeAttribute('height'); }
        if (opt.zeichen) platz.style.setProperty('--mf-zeichen', opt.zeichen);
        if (opt.schrift) platz.style.setProperty('--mf-schrift', opt.schrift);
        return svg;
      }
      const img = document.createElement('img');
      img.src = adresse; img.alt = '';
      platz.append(img);
      return img;
    });
  }

  // Bestwerte: wie der Rahmen sie speichert (mg:best:<id>:<firma>); 0 Punkte zählen nie (Abbruch)
  function best(id) {
    try { const v = localStorage.getItem('mg:best:' + id + ':' + (K.firma || '')); return v == null ? null : +v; } catch (e) { return null; }
  }
  const zahl = p => Math.round(p).toLocaleString('de-DE');
  // Schärfe-Balken (0–5) aus dem Bestwert: ein Balken je erreichter Stufe (550/700/800/900), einer fürs Schaffen
  function balken(p) {
    if (!p || p <= 0) return 0;
    return 1 + D.stufen.filter(g => p >= g).length;
  }
  // Freigeschaltet: Level 1 immer, sonst wenn das vorige Level einmal geschafft ist (Bestwert > 0)
  function frei(nr) {
    if (nr <= 1) return true;
    const vor = D.level[nr - 2];
    return !!vor && (best(vor.id) || 0) > 0;
  }
  function bewertung(lv, p) {
    const i = D.stufen.findIndex(g => p >= g);
    return lv.bewertungen[i < 0 ? 4 : i];
  }

  // ---------- Klänge (Phase 3): Angaben aus optik-fokus/klaenge.js (erzeugt von Material/Skripte/klaenge-bauen.py) ----------
  // klangInfo(adresse) → { proben, dauer, lautheit } oder null. Schlüssel in klaenge.js = Adresse ab dem Sammlungsordner;
  // gesucht wird über das Ende des Pfads, so passt es auf der Startseite ('klaenge/musik.mp3') und im Spiel ('../klaenge/…').
  const klangCache = {};
  function klangInfo(adresse) {
    if (!adresse) return null;
    if (adresse in klangCache) return klangCache[adresse];
    let pfad = '';
    try { pfad = decodeURIComponent(new URL(adresse, location.href).pathname); } catch (e) { pfad = String(adresse); }
    const KL = window.FOKUS_KLAENGE || {};
    const k = Object.keys(KL).find(s => pfad === '/' + s || pfad.endsWith('/' + s));
    return (klangCache[adresse] = k ? KL[k] : null);
  }
  // MP3 bringt vorn 1105 Proben Stille (bei 22,05 kHz) und hinten Füllstille mit; Chrome schneidet sie nicht weg. Mit der echten
  // Länge (proben) wird genau zugeschnitten – sonst stocken Schleifen und kurze Klänge kommen 50 ms zu spät (wie rahmen.js).
  function mp3Zuschnitt(b, proben, ctx) {
    if (!b || !proben) return b;
    const RATE = 22050, VORLAUF = 1105, ueber = b.duration * RATE - proben;
    if (ueber < 2) return b;
    const ab = Math.round((ueber >= VORLAUF - 4 ? VORLAUF : 0) / RATE * b.sampleRate);
    const laenge = Math.max(1, Math.min(b.length - ab, Math.round(proben / RATE * b.sampleRate)));
    let neu;
    try { neu = ctx.createBuffer(b.numberOfChannels, laenge, b.sampleRate); } catch (e) { return b; }
    for (let k = 0; k < b.numberOfChannels; k++) neu.getChannelData(k).set(b.getChannelData(k).subarray(ab, ab + laenge));
    return neu;
  }
  // Musik läuft beim Wechsel Startseite ↔ Startbild an derselben Stelle weiter (sessionStorage, nur diese Sitzung).
  // merken(pos, laufend): laufend = Seitenwechsel (Musik „läuft“ weiter, die Zeit bis zur neuen Seite zählt mit, höchstens 4s);
  // sonst (Ton aus, Level beginnt) geht es genau an der Stelle weiter, an der sie aufgehört hat.
  const MUSIK_SCHL = 'mg:musik:fokus:' + (K.firma || '');
  const musikStelle = {
    lesen(dauer) {
      try {
        const s = JSON.parse(sessionStorage.getItem(MUSIK_SCHL) || 'null');
        if (!s || !(dauer > 0)) return 0;
        const weg = (Date.now() - s.zeit) / 1000;
        return ((s.pos + (s.laufend && weg >= 0 && weg < 4 ? weg : 0)) % dauer + dauer) % dauer;
      } catch (e) { return 0; }
    },
    merken(pos, laufend) { try { sessionStorage.setItem(MUSIK_SCHL, JSON.stringify({ pos: Math.max(0, pos || 0), zeit: Date.now(), laufend: !!laufend })); } catch (e) { /* privat */ } },
  };

  window.FK = { K, D, farben: F, abstufung, logoEinbetten, best, zahl, balken, frei, bewertung, klangInfo, mp3Zuschnitt, musikStelle,
    ruhig: () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || /[#&]ruhig\b/.test(location.hash) };
})();
