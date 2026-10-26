// Intro der Startseite „Fokus“ (MZ, 26.10.2026), ca. 3s Code-Animation, das App-Icon wird zur Startseite:
//  0,0–0,6s  Fläche in Kundenfarbe, Icon (Fokusring + Brille) mittig leicht unscharf, zieht scharf (Ring dreht wie beim Scharfstellen)
//  0,6–1,5s  die Brille hebt sich aus dem Ring, „schaut“ kurz links/rechts, setzt sich oben rechts an ihren Platz im Logo,
//            der Schriftzug blendet ein (Logo am Ende vollständig und unverändert)
//  1,5–2,4s  der Ring wächst zur großen Linse der Startseite und dreht leicht, darin wird „Fokus“ scharf; die Fläche geht
//            in den Hintergrund der Startseite über
//  2,4–3,0s  die 5 Level-Knöpfe gleiten gestaffelt herein, die Schärfe-Balken füllen sich kurz
// Nur beim ersten Öffnen je Sitzung (Kopf-Skript in index.html), Tippen/Taste überspringt, ohne Ton,
// reduced-motion (oder #ruhig) = Icon kurz still, dann weiche Überblendung.
// Testhilfen: #intro (immer abspielen), #intro=1.4 (Standbild bei 1,4s, endet nicht), #intro&ruhig.
// Jedes Teil rechnet seine Lage allein aus der Zeit t (bild(t)); Zielpunkte werden in jedem Bild neu gemessen.
(function () {
  'use strict';
  const html = document.documentElement;
  if (!html.classList.contains('intro')) return;
  const FK = window.FK, I = window.FOKUS_ICON, K = FK.K;
  const SCHLUESSEL = 'mg:intro:fokus:' + (K.firma || '');
  const standM = /^#intro=([\d.]+)/.exec(location.hash);
  const stand = standM ? +standM[1] : null;
  const ruhig = FK.ruhig();
  if (/[#&]ruhig\b/.test(location.hash)) html.classList.add('ruhig');
  const DAUER = ruhig ? 1.4 : 3.0;

  const $ = s => document.querySelector(s);
  const kopf = $('.kopf'), ton = $('#tonKnopf'), linse = $('#linse'), name = $('#name'), gesamt = $('#gesamt'), fuss = $('#fuss');
  const stufen = [...document.querySelectorAll('.stufe')];
  const klamm = v => Math.max(0, Math.min(1, v));
  const teil = (t, a, b) => klamm((t - a) / (b - a));
  const weich = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const raus = u => 1 - Math.pow(1 - u, 3);
  const mix = (a, b, u) => a + (b - a) * u;

  // ---------- Bühne ----------
  const buehne = document.createElement('div');
  buehne.className = 'buehne';
  buehne.setAttribute('aria-hidden', 'true');
  const flaeche = document.createElement('div'); flaeche.className = 'flaeche';
  const NS = 'http://www.w3.org/2000/svg';
  const ring = document.createElementNS(NS, 'svg');
  ring.setAttribute('viewBox', '0 0 512 512');
  ring.innerHTML = I.ringSvg('#fff');
  const brille = document.createElement('div');
  brille.style.cssText = 'position:absolute;left:0;top:0;transform-origin:50% 50%;will-change:transform,opacity';
  buehne.append(flaeche, ring, brille);
  // Fläche zuerst in der Kundenfarbe mit dem Verlauf des Icons
  flaeche.style.background = `radial-gradient(circle at 50% 38%, ${FK.abstufung(FK.farben.haupt, 1.22)}, ${FK.farben.haupt} 55%, ${FK.abstufung(FK.farben.haupt, 0.72)})`;
  document.body.append(buehne);
  html.style.overflow = 'hidden';

  // Brille: weißes Zeichen als SVG (Seitenverhältnis aus der viewBox), sonst Bild
  let brilleSV = 100 / 333.42;   // Ersatz, bis die viewBox des Zeichens gelesen ist (Brille mit Ohren)
  const brilleBereit = (location.protocol === 'file:' ? Promise.resolve(null)
    : fetch(K.zeichenWeiss || 'kunde/zeichen-weiss.svg').then(r => r.ok ? r.text() : null).catch(() => null))
    .then(t => {
      if (t && /<svg[\s>]/i.test(t) && !/<script|on\w+\s*=|javascript:/i.test(t)) {
        brille.innerHTML = t.replace(/^\s*<\?xml[^>]*>\s*/, '').replace(/<title>[\s\S]*?<\/title>/, '');
        const s = brille.querySelector('svg'), vb = s && (s.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
        if (vb && vb[2] && vb[3]) brilleSV = vb[3] / vb[2];
        if (s) { s.style.cssText = 'display:block;width:100%;height:100%;position:static;overflow:visible'; s.querySelectorAll('[fill]').forEach(e => { if (e.getAttribute('fill') !== 'none') e.setAttribute('fill', '#fff'); }); }
      } else {
        const img = document.createElement('img');
        img.src = K.zeichenWeiss || 'kunde/zeichen-weiss.svg'; img.alt = '';
        img.style.cssText = 'display:block;width:100%;height:100%';
        brille.append(img);
      }
    });

  // ---------- Ziele messen ----------
  function logoTeile() {
    const box = $('#logo');
    return { box, zeichen: box.querySelector('#zeichen'), schrift: box.querySelector('#schriftzug') };
  }
  function rechteck(e) { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }

  // ---------- ein Bild zur Zeit t ----------
  function setze(e, opac, trans, filt) {
    if (!e) return;
    e.style.opacity = opac == null ? '' : String(opac);
    e.style.transform = trans || '';
    e.style.filter = filt || '';
  }
  function balken(t) {
    stufen.forEach((s, i) => {
      const w = +((s.querySelector('.schaerfe') || {}).dataset || {}).wert || 0;
      const u = (t - 2.55 - i * 0.05) / 0.25;
      let n = w;
      if (u > 0 && t < 2.88 + i * 0.03) n = Math.max(w, Math.min(5, Math.ceil(u * 5)));
      s.querySelectorAll('.schaerfe i').forEach((b, k) => b.classList.toggle('an', k < n));
    });
  }
  function bild(t) {
    const B = innerWidth, H = innerHeight, S0 = Math.min(B, H) * 0.56, cx = B / 2, cy = H / 2;
    const lt = logoTeile(), L = rechteck(linse);
    L.w = linse.offsetWidth || L.w;   // ohne Drehung messen (die Linse dreht sich im Intro)
    if (ruhig) {   // still, dann weich überblenden
      const u = weich(teil(t, 0.4, 1.4));
      ring.style.cssText = `width:${S0}px;height:${S0}px;transform:translate(${cx - S0 / 2}px,${cy - S0 / 2}px)`;
      const bw = S0 * I.brille.breite / I.N;
      brille.style.width = bw + 'px'; brille.style.height = bw * brilleSV + 'px';
      brille.style.transform = `translate(${cx - bw / 2}px,${cy - bw * brilleSV / 2}px)`;
      buehne.style.opacity = String(1 - u);
      [kopf, linse, gesamt, fuss].concat(stufen).forEach(e => setze(e, u));
      if (lt.zeichen) setze(lt.zeichen, 1); if (lt.schrift) setze(lt.schrift, 1);
      lt.box.querySelectorAll('img').forEach(e => setze(e, 1));
      return;
    }
    // 1) Scharfziehen
    const u1 = raus(teil(t, 0, 0.6));
    const unschaerfe = 9 * (1 - u1);
    const drehung = -32 * (1 - u1);
    // 3) Ring → Linse (Zielgröße: Skala des Icons r=190 auf die Skala der Linse r=246/512)
    const u3 = weich(teil(t, 1.5, 2.15));
    const S1 = L.w * (246 / 512) * (I.N / I.ring.r);
    const rs = mix(S0, S1, u3), rx = mix(cx, L.x, u3), ry = mix(cy, L.y, u3), rr = drehung + 28 * u3;
    const ringDeck = 1 - teil(t, 2.05, 2.4);
    ring.style.width = ring.style.height = rs + 'px';
    ring.style.transform = `translate(${rx - rs / 2}px,${ry - rs / 2}px) rotate(${rr}deg)`;
    ring.style.transformOrigin = `${rs / 2}px ${rs / 2}px`;
    ring.style.opacity = String(ringDeck);
    ring.style.filter = unschaerfe > 0.05 ? `blur(${unschaerfe}px)` : '';
    // 2) Brille: heben, schauen, fliegen
    const bw0 = S0 * I.brille.breite / I.N;
    let bx = cx, by = cy, bw = bw0, bdreh = 0, bdeck = 1;
    const heben = raus(teil(t, 0.6, 0.85));
    by -= 0.07 * S0 * heben; bw *= 1 + 0.1 * heben;
    const schau = teil(t, 0.85, 1.15);
    if (schau > 0 && schau < 1) { bx += 0.05 * S0 * Math.sin(schau * Math.PI * 2); bdreh = 4 * Math.sin(schau * Math.PI * 2); }
    const flug = weich(teil(t, 1.15, 1.5));
    if (lt.zeichen || lt.box) {
      const Z = rechteck(lt.zeichen || lt.box.querySelector('img') || lt.box);
      const zw = lt.zeichen ? Z.w : Z.h / brilleSV * 0.9;
      const sx = bx, sy = by, sw = bw;
      bx = mix(sx, Z.x, flug); by = mix(sy, Z.y, flug) - Math.sin(flug * Math.PI) * 0.08 * H; bw = mix(sw, zw, flug);
    }
    if (t >= 1.5) bdeck = 0;
    brille.style.width = bw + 'px'; brille.style.height = bw * brilleSV + 'px';
    brille.style.transform = `translate(${bx - bw / 2}px,${by - bw * brilleSV / 2}px) rotate(${bdreh}deg)`;
    brille.style.opacity = String(bdeck);
    brille.style.filter = unschaerfe > 0.05 ? `blur(${unschaerfe}px)` : '';
    // Logo: Zeichen übernimmt bei 1,5s, Schriftzug blendet ein; Logo-Kasten selbst sichtbar
    setze(kopf, 1); setze(ton, teil(t, 2.5, 2.8));
    if (lt.zeichen) setze(lt.zeichen, t >= 1.5 ? 1 : 0);
    if (lt.schrift) setze(lt.schrift, teil(t, 1.3, 1.65));
    lt.box.querySelectorAll('img').forEach(e => setze(e, teil(t, 1.4, 1.7)));
    // Fläche geht in den Hintergrund der Startseite über
    flaeche.style.opacity = String(1 - weich(teil(t, 1.5, 2.2)));
    // Linse der Seite übernimmt den Ring, „Fokus“ wird scharf
    const ld = teil(t, 2.0, 2.3);
    setze(linse, ld, `rotate(${-14 * (1 - weich(teil(t, 2.0, 2.4)))}deg)`);
    const nu = teil(t, 2.0, 2.45);
    setze(name, 1, '', nu < 1 ? `blur(${(5 * (1 - nu)).toFixed(2)}px)` : '');
    setze(gesamt, teil(t, 2.25, 2.55));
    stufen.forEach((s, i) => { const u = raus(teil(t, 2.4 + i * 0.08, 2.72 + i * 0.08)); setze(s, u, `translateY(${(1 - u) * 18}px)`); });
    balken(t);
    setze(fuss, teil(t, 2.7, 3.0));
  }

  // ---------- Ablauf ----------
  let start = 0, fertig = false, rahmen = 0;
  function aufraeumen(uebersprungen) {
    if (fertig) return;
    fertig = true;
    cancelAnimationFrame(rahmen);
    try { if (stand == null) sessionStorage.setItem(SCHLUESSEL, '1'); } catch (e) { /* privat */ }
    const lt = logoTeile();
    const alle = [kopf, ton, linse, name, gesamt, fuss, lt.zeichen, lt.schrift].concat(stufen, [...lt.box.querySelectorAll('img')]).filter(Boolean);
    // Beim Überspringen: Gezeigtes bleibt, Rest blendet gestaffelt ein (CSS-Animationen der Seite)
    alle.forEach(e => {
      const sichtbar = !uebersprungen || (+e.style.opacity >= 0.99 && !e.style.filter);
      if (sichtbar) e.setAttribute('data-gezeigt', '');
      e.style.opacity = ''; e.style.transform = ''; e.style.filter = '';
    });
    stufen.forEach(s => { const w = +s.querySelector('.schaerfe').dataset.wert || 0; s.querySelectorAll('.schaerfe i').forEach((b, k) => b.classList.toggle('an', k < w)); });
    html.classList.remove('intro');
    html.style.overflow = '';
    buehne.style.transition = 'opacity .35s ease';
    buehne.style.opacity = '0';
    // Bühne fängt den Rest des Überspring-Tipps noch ab (sonst landet der Klick auf einem Level-Knopf darunter)
    buehne.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
    setTimeout(() => buehne.remove(), 400);
  }
  const ueberspringen = () => { if (stand == null) aufraeumen(true); };
  buehne.addEventListener('pointerdown', ueberspringen);
  addEventListener('keydown', ueberspringen, { once: true });

  function schleife(jetzt) {
    if (fertig) return;
    const t = stand != null ? stand : (jetzt - start) / 1000;
    bild(Math.min(t, DAUER));
    if (stand == null && t >= DAUER) { aufraeumen(false); return; }
    if (stand == null) rahmen = requestAnimationFrame(schleife);
  }
  bild(0);
  // auf Logo und Brille höchstens 0,6s warten, dann ohne
  Promise.race([Promise.all([window.FK_LOGO || Promise.resolve(), brilleBereit]), new Promise(ok => setTimeout(ok, 600))])
    .then(() => { if (html.classList.contains('intro') && !fertig) { bild(stand || 0); start = performance.now(); rahmen = requestAnimationFrame(schleife); } });
  if (stand != null) addEventListener('resize', () => bild(stand));
  window.FK_INTRO = { bild, ende: () => aufraeumen(true) };
})();
