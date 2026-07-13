# RETHERM – Website

Statische, mehrseitige Website für die RETHERM Wärmerückgewinnung aus Abgas,
aufgebaut nach der Marketing- & Wachstumsstrategie 2.1: branchenoffene
Positionierung („Überall, wo heißes Abgas nach außen geht…“), Unterseiten je
Abgasquelle, Abwärme-Potenzial-Check als Konversions-Kern, Vertrauensleiste
auf jeder Seite, durchgängig zweisprachig (DE/EN).

## Technik

- Reines HTML/CSS/JS, kein Build-Schritt, keine Frameworks, keine externen
  Abhängigkeiten zur Laufzeit (Fonts selbst gehostet – DSGVO, keine Cookies).
- Deploybar auf jedem statischen Host, z. B. GitHub Pages: Repository-Settings
  → Pages → Branch `main`, Ordner `/ (root)`. Es wird kein Server-Code
  benötigt; `.claude/serve.ps1` dient nur der lokalen Vorschau.

## Seiten

| Pfad | Inhalt |
|---|---|
| `index.html` | Start: physikalische Botschaft, Schnelltest, Quellen, Prinzip, Leistungstiefe |
| `abgas-industrieofen.html` … `-dampfkessel` / `-bhkw` / `-trocknung` / `-backofen` | Unterseiten je Abgasquelle (SEO: „Wärmerückgewinnung am …“) |
| `potenzial-check.html` | Konversions-Kern: Rechner + qualifizierte Anfrage |
| `foerderung.html` | EEW/KfW 295, goldene Regel „Antrag vor Auftrag“ |
| `referenzen.html` | Fallstudien-Struktur (echte Kennzahlen/Fotos ergänzen!) |
| `unternehmen.html`, `kontakt.html` | Ganzenmüller + WP-Partnerschaft, Kontaktformular |
| `impressum.html`, `datenschutz.html` | Rechtstexte (markierte Punkte prüfen!) |

## Architektur

- `assets/css/main.css` – komplettes Styling; Design-Tokens am Dateianfang.
- `assets/js/calc-core.js` – Rechenkern (reine Funktionen); alle Annahmen in
  `DEFAULTS`/`CARRIERS` – mit realen Anlagendaten abgleichen.
- `assets/js/app.js` – UI für alle Seiten (Module prüfen selbst, ob ihre
  Elemente existieren).
- `assets/js/i18n.js` – Kern-Wörterbuch EN (Deutsch steht im HTML);
  `assets/js/i18n/<seite>.js` – Seiten-Wörterbücher via `Object.assign`.
- Header/Footer sind bewusst in jede Seite kopiert (kein Build-Schritt).
  Bei Änderungen: in allen HTML-Dateien nachziehen (Suchen &amp; Ersetzen).

## SEO

- Seitenstruktur nach Abgasquelle fängt die kommerziellen Suchbegriffe der
  Strategie ab („Wärmerückgewinnung am Industrieofen/Dampfkessel/…");
  „Abgaswärmetauscher" und „Abwärmenutzung" sind in Titeln, Metas und
  Fließtext platziert.
- Strukturierte Daten: Organization + FAQPage (`index.html`),
  LocalBusiness (`kontakt.html`) – als JSON-LD, ohne Domain-Abhängigkeit.
- FAQ-Sektion auf der Startseite beantwortet die typischen Long-Tail-Fragen
  (Kosten, Förderung, Amortisation, Produktionssicherheit).
- `robots.txt` und `sitemap.xml` liegen bereit (Platzhalter-Domain!).

## Vor Go-Live (offene Punkte)

1. Impressum/Datenschutz: markierte TODO-Boxen klären (Betreiber, USt-ID, Hoster).
2. Referenzen: Kennzahlen und restliche Projektfotos einsetzen (`referenzen.html`) –
   laut SEO-Audit der sichtbarste Schwachpunkt („folgt“-Platzhalter direkt
   neben dem Anspruch „Zahlen verkaufen“).
3. TÜV-Süd-Nachweis: Zertifikatsnummer oder verlinktes Zertifikats-PDF
   ergänzen (mind. auf `unternehmen.html`) – stärkt E-E-A-T.
4. Rechner-Annahmen mit realen Anlagendaten abgleichen (`calc-core.js`).
5. Kontaktformulare: mailto funktioniert bei Webmail-Nutzern (Outlook Web,
   Gmail) oft nicht – vor Ads-Start echten Formularversand ergänzen
   (z. B. Formspree/serverless), sonst gehen Leads verloren.
6. Domain-Entscheidung (Strategie 2.1 offen); danach:
   - `sitemap.xml` + `robots.txt`: Platzhalter `https://IHRE-DOMAIN.de`
     ersetzen, Sitemap-Zeile in robots.txt aktivieren; `llms.txt` prüfen;
   - Canonical-Tags auf allen Seiten ergänzen (Muster:
     `<link rel="canonical" href="https://DOMAIN.de/seite.html">`);
   - Open-Graph/Twitter-Tags mit absoluter Bild-URL (1200×630-OG-Bild aus
     der RETHERM-Einheit erstellen), `logo`/`url` im Organization-Schema,
     BreadcrumbList- und WebSite-JSON-LD nachziehen;
   - Google Search Console einrichten und Sitemap einreichen.
7. Google-Ads-Conversion-Tracking erst nach Cookie-/Consent-Entscheidung –
   aktuell ist die Seite bewusst tracking-frei (Strategie verlangt Tracking
   vor dem ersten Ads-Euro; dafür braucht es dann eine Consent-Lösung).
8. Mittel-/langfristig (SEO international): Englisch liegt nur als
   JS-Umschaltung vor und ist für Google/AI-Crawler unsichtbar; bei Bedarf
   echte `/en/`-URLs mit hreflang einführen.
