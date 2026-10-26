// ERZEUGT von Material/Skripte/daten-bauen.py aus Material/Texte/fokus-*-entwurf.md.
// Nicht von Hand ändern, sondern den Entwurf ändern und das Skript neu laufen lassen.
// Rahmentexte je Level: Platzhalter {n} = erwischte Ziele, {k} = Ziel, bei dem das Level endete.
window.FOKUS_TEXTE = {
 "alle": {
  "abbruchBewertung": "Fokus verloren"
 },
 "1": {
  "titel": "Level 1 – Schärfe",
  "anleitungen": [
   "Die Motive ziehen unscharf vorbei. Tippe irgendwo, sobald das markierte Motiv ganz scharf ist – drei Fehler, und das Level endet.",
   "Tippe irgendwo auf den Bildschirm, wenn das Motiv am schärfsten ist. Zu früh, daneben oder verpasst: ein Fehler, bei drei ist Schluss."
  ],
  "rueckmeldung": {
   "stark": [
    "Scharf",
    "Gestochen",
    "Volltreffer"
   ],
   "knapp": [
    "Fast scharf",
    "Gerade so",
    "Naja"
   ],
   "frueh": [
    "Noch unscharf",
    "Zu früh",
    "Noch Dunst"
   ],
   "falsch": [
    "Daneben",
    "Falsches Motiv",
    "Anderes Motiv"
   ],
   "verpasst": [
    "Vorbei",
    "Verpasst",
    "Zu spät",
    "Weitergezogen"
   ]
  },
  "bilanz": {
   "geschafft": [
    "{n} von 10 Motiven scharf erwischt",
    "{n} von 10 Motiven im Fokus"
   ],
   "fehlerfrei": [
    "Alle 10 Motive scharf erwischt",
    "10 von 10 Motiven im Fokus – kein Fehler"
   ],
   "abbruch": [
    "{n} Ziele erwischt – Ende bei Ziel {k} von 10",
    "Ende bei Ziel {k} von 10 – {n} Motive scharf erwischt"
   ],
   "abbruch1": [
    "1 Ziel erwischt – Ende bei Ziel {k} von 10",
    "Ein Motiv scharf – Ende bei Ziel {k} von 10"
   ],
   "abbruch0": [
    "Kein Ziel erwischt – Ende bei Ziel {k} von 10",
    "Noch nichts erwischt – Ende bei Ziel {k} von 10"
   ]
  },
  "abbruchHinweis": [
   "Punkte zählen nur, wenn du das Level schaffst.",
   "Ohne geschafftes Level gibt es keine Punkte."
  ]
 },
 "2": {
  "titel": "Level 2 – Richtung",
  "anleitungen": [
   "Eine Richtung wird angesagt. Warte auf den passenden Ring und tippe nur Ringe mit dieser Öffnung – drei Fehler, und das Level endet.",
   "Warte auf den passenden Ring. Tippe den Ring mit der angesagten Öffnung. Falscher oder verpasster Ring: ein Fehler, bei drei ist Schluss."
  ],
  "rueckmeldung": {
   "stark": [
    "Treffer",
    "Genau",
    "Richtig"
   ],
   "knapp": [
    "Gerade noch",
    "Naja",
    "Fast verpasst"
   ],
   "frueh": [
    "Noch nicht",
    "Zu früh"
   ],
   "falsch": [
    "Falsche Öffnung",
    "Verdreht",
    "Andere Richtung",
    "Falsch herum"
   ],
   "verpasst": [
    "Ring weg",
    "Verpasst",
    "Zu langsam",
    "Vorbei"
   ]
  },
  "bilanz": {
   "geschafft": [
    "{n} von 10 Ringen richtig getroffen",
    "{n} von 10 Ringen in der richtigen Richtung"
   ],
   "fehlerfrei": [
    "Alle 10 Ringe richtig getroffen",
    "10 von 10 Ringen – kein Fehler"
   ],
   "abbruch": [
    "{n} Ziele erwischt – Ende bei Ziel {k} von 10",
    "Ende bei Ziel {k} von 10 – {n} Ringe richtig getroffen"
   ],
   "abbruch1": [
    "1 Ziel erwischt – Ende bei Ziel {k} von 10",
    "Ein Ring richtig getroffen – Ende bei Ziel {k} von 10"
   ],
   "abbruch0": [
    "Kein Ziel erwischt – Ende bei Ziel {k} von 10",
    "Noch nichts erwischt – Ende bei Ziel {k} von 10"
   ]
  },
  "abbruchHinweis": [
   "Punkte zählen nur, wenn du das Level schaffst.",
   "Ohne geschafftes Level gibt es keine Punkte."
  ],
  "richtungen": [
   {
    "richtung": "oben",
    "lang": "Öffnung nach oben",
    "kurz": "Oben"
   },
   {
    "richtung": "unten",
    "lang": "Öffnung nach unten",
    "kurz": "Unten"
   },
   {
    "richtung": "links",
    "lang": "Öffnung nach links",
    "kurz": "Links"
   },
   {
    "richtung": "rechts",
    "lang": "Öffnung nach rechts",
    "kurz": "Rechts"
   },
   {
    "richtung": "oben links",
    "lang": "Öffnung nach links oben",
    "kurz": "Links oben"
   },
   {
    "richtung": "oben rechts",
    "lang": "Öffnung nach rechts oben",
    "kurz": "Rechts oben"
   },
   {
    "richtung": "unten links",
    "lang": "Öffnung nach links unten",
    "kurz": "Links unten"
   },
   {
    "richtung": "unten rechts",
    "lang": "Öffnung nach rechts unten",
    "kurz": "Rechts unten"
   }
  ],
  "zusatzansagen": [
   "Neue Richtung",
   "Jetzt schneller"
  ]
 },
 "3": {
  "titel": "Level 3 – Spiegelung",
  "anleitungen": [
   "Spiegelungen verdecken die Fische. Tippe auf das richtige Ziel im See, sobald der Filter klar ist – drei Fehler, und das Level endet. Die Scheibe unten zeigt, wann der Filter klar ist.",
   "Tippe das angesagte Ziel, sobald der Filter klar ist. Die Scheibe unten ist kein Knopf – sie zeigt, wann der Filter klar ist. Zu früh, falsch oder verpasst: ein Fehler, bei drei ist Schluss."
  ],
  "rueckmeldung": {
   "stark": [
    "Klar",
    "Glasklar",
    "Gefunden"
   ],
   "knapp": [
    "Fast klar",
    "Gerade so",
    "Naja"
   ],
   "frueh": [
    "Noch Glanz",
    "Zu früh",
    "Spiegelt noch"
   ],
   "falsch": [
    "Falsches Ziel",
    "Anderer Fisch",
    "Daneben"
   ],
   "verpasst": [
    "Abgetaucht",
    "Verschwunden",
    "Verpasst",
    "Zu spät"
   ]
  },
  "bilanz": {
   "geschafft": [
    "{n} von 10 Zielen im See gefunden",
    "{n} von 10 Zielen durch die Spiegelung erwischt"
   ],
   "fehlerfrei": [
    "Alle 10 Ziele im See gefunden",
    "10 von 10 Zielen – kein Fehler"
   ],
   "abbruch": [
    "{n} Ziele erwischt – Ende bei Ziel {k} von 10",
    "Ende bei Ziel {k} von 10 – {n} Ziele im See gefunden"
   ],
   "abbruch1": [
    "1 Ziel erwischt – Ende bei Ziel {k} von 10",
    "Ein Ziel im See gefunden – Ende bei Ziel {k} von 10"
   ],
   "abbruch0": [
    "Kein Ziel erwischt – Ende bei Ziel {k} von 10",
    "Noch nichts erwischt – Ende bei Ziel {k} von 10"
   ]
  },
  "abbruchHinweis": [
   "Punkte zählen nur, wenn du das Level schaffst.",
   "Ohne geschafftes Level gibt es keine Punkte."
  ]
 },
 "4": {
  "titel": "Level 4 – Rauschen",
  "anleitungen": [
   "Tippe irgendwo, sobald du das gesuchte Geräusch hörst. Bei den ersten Zielen wird es erst vorgespielt – drei Fehler, und das Level endet.",
   "Tippe irgendwo, sobald das angesagte Geräusch erklingt. Anfangs hörst du es vorab. Falsch, zu früh oder verpasst: ein Fehler, bei drei ist Schluss."
  ],
  "rueckmeldung": {
   "stark": [
    "Erkannt",
    "Genau das",
    "Gefunden"
   ],
   "knapp": [
    "Fast",
    "Gerade noch",
    "Naja"
   ],
   "frueh": [
    "Zu früh",
    "Noch nicht"
   ],
   "falsch": [
    "Anderes Geräusch",
    "Falsches Geräusch",
    "Reingefallen",
    "Daneben"
   ],
   "verpasst": [
    "Geräusch verpasst",
    "Verpasst",
    "Vorbei",
    "Zu spät"
   ]
  },
  "bilanz": {
   "geschafft": [
    "{n} von 10 Geräuschen herausgehört",
    "{n} von 10 Zielgeräuschen im Rauschen erwischt"
   ],
   "fehlerfrei": [
    "Alle 10 Geräusche herausgehört",
    "10 von 10 Geräuschen – kein Fehler"
   ],
   "abbruch": [
    "{n} Geräusche erkannt – Ende bei Ziel {k} von 10",
    "Ende bei Ziel {k} von 10 – {n} Geräusche herausgehört"
   ],
   "abbruch1": [
    "1 Geräusch erkannt – Ende bei Ziel {k} von 10",
    "Ein Geräusch herausgehört – Ende bei Ziel {k} von 10"
   ],
   "abbruch0": [
    "Kein Geräusch erkannt – Ende bei Ziel {k} von 10",
    "Noch nichts herausgehört – Ende bei Ziel {k} von 10"
   ]
  },
  "phasen": {
   "vorhoeren": [
    "Erst anhören",
    "Zum Anhören"
   ],
   "hoeren": [
    "Jetzt hinhören",
    "Jetzt zählt’s"
   ]
  },
  "abbruchHinweis": [
   "Punkte zählen nur, wenn du das Level schaffst.",
   "Ohne geschafftes Level gibt es keine Punkte."
  ],
  "tonHinweise": [
   "Am besten mit Ton spielen",
   "Dieses Level lebt vom Ton – am besten mit Ton spielen",
   "Ton an, Kopfhörer helfen"
  ]
 },
 "5": {
  "titel": "Level 5 – Weitblick",
  "anleitungen": [
   "Hör hin, was gesucht ist: Nah sieht man mit der Lesebrille, fern mit der Fernbrille. Tippe das Ziel – drei Fehler, und das Level endet.",
   "Das Ziel wird als Geräusch angesagt. Nah brauchst du die Lesebrille, fern die Fernbrille – bei drei Fehlern ist Schluss."
  ],
  "rueckmeldung": {
   "stark": [
    "Getroffen",
    "Scharf",
    "Richtig"
   ],
   "knapp": [
    "Gerade noch",
    "Naja",
    "Fast zu spät"
   ],
   "frueh": [
    "Zu früh",
    "Noch unscharf"
   ],
   "falsch": [
    "Falsches Ziel",
    "Falsch gelesen",
    "Falsche Brille",
    "Daneben"
   ],
   "verpasst": [
    "Zu spät",
    "Verpasst",
    "Vorbei"
   ]
  },
  "bilanz": {
   "geschafft": [
    "{n} von 10 Zielen erkannt",
    "{n} von 10 Zielen nah und fern erwischt"
   ],
   "fehlerfrei": [
    "Alle 10 Ziele erkannt",
    "10 von 10 Zielen – kein Fehler"
   ],
   "abbruch": [
    "{n} Ziele erwischt – Ende bei Ziel {k} von 10",
    "Ende bei Ziel {k} von 10 – {n} Ziele erkannt"
   ],
   "abbruch1": [
    "1 Ziel erwischt – Ende bei Ziel {k} von 10",
    "Ein Ziel erkannt – Ende bei Ziel {k} von 10"
   ],
   "abbruch0": [
    "Kein Ziel erwischt – Ende bei Ziel {k} von 10",
    "Noch nichts erwischt – Ende bei Ziel {k} von 10"
   ]
  },
  "abbruchHinweis": [
   "Punkte zählen nur, wenn du das Level schaffst.",
   "Ohne geschafftes Level gibt es keine Punkte."
  ]
 }
};
