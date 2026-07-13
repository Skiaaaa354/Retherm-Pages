# RETHERM-Website: Anleitung für Florian

Alles, was du brauchst, um die Website **ohne Claude** zu pflegen und live zu
bringen. Kein Vorwissen nötig.

---

## Teil 1 – Die Website ansehen und bearbeiten (an jedem PC)

### Wo liegt die Website?

Der komplette Quellcode liegt bei GitHub:
**https://github.com/Skiaaaa354/Retherm-Pages**

GitHub ist die „Wahrheit“ – was dort auf dem Branch `main` liegt, ist der
aktuelle Stand. Von dort kann jeder PC den Stand holen, und später
veröffentlicht GitHub die Seite auch automatisch (siehe Teil 3).

### Der einfachste Weg: direkt im Browser bearbeiten

Für Textänderungen brauchst du nichts zu installieren:

1. Auf github.com einloggen und das Repository öffnen.
2. Die gewünschte Datei anklicken (z. B. `index.html`).
3. Oben rechts auf das **Stift-Symbol** klicken.
4. Text ändern → grüner Knopf **„Commit changes“** → kurze Beschreibung
   eintragen → bestätigen. Fertig – die Änderung ist gespeichert und (sobald
   die Seite live ist) nach 1–2 Minuten online.

Profi-Tipp: Auf der Repository-Seite die Taste **`.`** (Punkt) drücken –
dann öffnet sich ein kompletter Editor (VS Code) im Browser.

### Der komfortable Weg: am eigenen PC arbeiten

1. **GitHub Desktop** installieren (desktop.github.com) und einloggen.
2. „Clone repository“ → `Skiaaaa354/Retherm-Pages` → Ordner wählen.
3. Dateien mit einem Editor bearbeiten (empfohlen: **VS Code**, kostenlos).
4. **Vorschau:** Im Website-Ordner die Datei **`vorschau.cmd`** doppelklicken –
   der Browser öffnet die Seite unter `http://localhost:8123`. (Alternativ
   reicht für schnelle Blicke auch ein Doppelklick auf `index.html`.)
5. Wenn alles passt: In GitHub Desktop unten links Beschreibung eintragen →
   **Commit to main** → oben **Push origin**. Damit ist die Änderung auf
   GitHub (und live, sobald veröffentlicht).

### Wo steht was? (Spickzettel)

| Ich will ändern … | Datei |
|---|---|
| Startseite | `index.html` |
| Abgasquellen-Übersicht / Detailseiten | `abgasquellen.html`, `abgas-*.html` |
| Rechner-Seite | `potenzial-check.html` |
| Förderung / Referenzen / Unternehmen / Kontakt | gleichnamige `.html` |
| Rechner-Annahmen (Preise, Fördersätze, Investitionsspanne) | `assets/js/calc-core.js` (oben, `DEFAULTS` und `CARRIERS`) |
| Farben, Schriften, Abstände | `assets/css/main.css` (Tokens ganz oben) |
| Bilder | `assets/img/` (Format WebP; zum Umwandeln: squoosh.app) |

### Die drei goldenen Regeln beim Bearbeiten

1. **Deutsch + Englisch:** Der deutsche Text steht direkt in der HTML-Datei.
   Die englische Übersetzung steht in `assets/js/i18n/<seite>.js`
   (z. B. `home.js` für die Startseite). Jedes Textelement hat ein
   `data-i18n="schlüssel"` – wenn du den deutschen Text änderst, such den
   gleichen Schlüssel in der i18n-Datei und passe das Englische an.
   Die Attribute `data-i18n=…` selbst **nie löschen**.
2. **Header und Footer sind auf jeder Seite kopiert.** Eine Änderung am Menü
   oder Footer musst du in **allen** HTML-Dateien machen (Suchen & Ersetzen
   über alle Dateien, in VS Code: `Strg+Umschalt+H`).
3. **Zahlen nur mit Quelle.** Fördersätze, Preise und Temperaturbereiche
   stehen bewusst mehrfach auf der Seite (Texte, FAQ, Schema-Blöcke am
   Dateiende, `llms.txt`) – bei Änderungen alle Stellen mitziehen, sonst
   widerspricht sich die Seite. Im Zweifel: Claude machen lassen.

### Die wichtigste inhaltliche Baustelle

In `referenzen.html` stehen vier Fallstudien-Karten mit **„folgt“** als
Platzhalter. Sobald du echte Kennzahlen hast (Leistung, MWh/Jahr,
CO₂-Einsparung, Amortisation) und Projektfotos: dort eintragen bzw.
eintragen lassen. Das ist laut SEO-Audit der größte einzelne Hebel für
Vertrauen und Abschlussquote.

---

## Teil 2 – Was VOR dem Live-Gang erledigt sein muss

Kurz und ehrlich – zwei Dinge sind Pflicht, der Rest kann nachgezogen werden:

1. **Impressum vervollständigen** (`impressum.html`): Die USt-IdNr. eintragen
   und prüfen, ob die Ganzenmüller GmbH als Betreiberin stimmt. Eine
   geschäftliche Website ohne vollständiges Impressum ist in Deutschland
   abmahnfähig – deshalb Pflicht **vor** dem Live-Gang.
2. **Datenschutz** (`datenschutz.html`): Beim Abschnitt „Hosting“ den
   tatsächlichen Anbieter eintragen (bei GitHub Pages: „GitHub Inc., USA“ –
   Textvorschlag kann Claude liefern).

Empfohlen, aber kein Blocker: TÜV-Zertifikatsnummer auf der
Unternehmensseite, erste Referenz-Kennzahlen.

---

## Teil 3 – Live gehen, Schritt für Schritt

### Schritt 1: Kostenlos veröffentlichen mit GitHub Pages (5 Minuten)

1. Repository auf github.com öffnen → **Settings** → links **Pages**.
2. Bei „Build and deployment“ → Source: **Deploy from a branch** →
   Branch: **main**, Ordner: **/ (root)** → **Save**.
3. Nach 1–2 Minuten ist die Seite erreichbar unter:
   **https://skiaaaa354.github.io/Retherm-Pages/**
4. Hinweis: Dafür muss das Repository **öffentlich** sein
   (Settings → General → ganz unten „Change visibility“). Öffentlich heißt:
   Der Quellcode ist einsehbar – bei einer Website ist das unkritisch, der
   HTML-Code ist ohnehin öffentlich.

Ab jetzt gilt: **Jeder Commit auf `main` ist nach 1–2 Minuten live.**

### Schritt 2: Domain kaufen (~10–20 €/Jahr)

Bei einem deutschen Anbieter (z. B. IONOS, Strato, united-domains) die
Wunschdomain registrieren. Laut Marketingstrategie vorher kurz prüfen, ob
„Retherm“ markenrechtlich frei ist (DPMA-Recherche, dpma.de) – eine Stunde
Recherche, die Ärger sparen kann.

### Schritt 3: Domain mit GitHub Pages verbinden

1. GitHub: Settings → Pages → „Custom domain“ → `www.deine-domain.de`
   eintragen → Save.
2. Beim Domain-Anbieter im DNS:
   - `www` als **CNAME** auf `skiaaaa354.github.io` zeigen lassen,
   - die nackte Domain (ohne www) als **A-Records** auf
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`.
3. Zurück bei GitHub Pages: Haken bei **„Enforce HTTPS“** setzen (erscheint,
   sobald das Zertifikat da ist – kann bis zu einem Tag dauern).

### Schritt 4: Domain-Rollout im Code

Sobald die Domain feststeht, müssen die Platzhalter ersetzt und ein paar
SEO-Dinge ergänzt werden (Canonical-Links, Vorschaubild für LinkedIn/WhatsApp,
weitere Schema-Blöcke). **Einfachster Weg: Claude sagen „Die Domain ist X,
mach den Domain-Rollout“** – die komplette Liste steht in der `README.md`
unter „Vor Go-Live“. Manuell wäre es: `IHRE-DOMAIN.de` in `sitemap.xml`,
`robots.txt` und `llms.txt` ersetzen und die Sitemap-Zeile in `robots.txt`
einkommentieren.

### Schritt 5: Bei Google anmelden

1. **Google Search Console** (search.google.com/search-console): Property
   für die Domain anlegen, per DNS-Eintrag bestätigen (der Anbieter zeigt
   dir wie), dann unter „Sitemaps“ die `sitemap.xml` einreichen.
2. Optional, aber für regionale Anfragen wertvoll: **Google Unternehmensprofil**
   (business.google.com) für die Ganzenmüller GmbH anlegen/übernehmen und
   die neue Website eintragen.

### Schritt 6: Kontaktformular scharf schalten

Aktuell öffnen die Formulare das E-Mail-Programm des Besuchers (mailto).
Das scheitert bei vielen Firmen-PCs mit Webmail. Vor der ersten
Werbe-Kampagne: kostenloses Konto bei **formspree.io** anlegen (Free-Tarif
reicht für den Start), die Formular-ID notieren und Claude sagen:
„Bau die Formulare auf Formspree um, ID ist XYZ.“

### Schritt 7: Danach (aus der Marketingstrategie)

- Die PfA-Anschreiben (Plattform für Abwärme) können sofort raus – die
  Landingpage, auf der die Angeschriebenen landen, existiert jetzt.
- Google Ads erst starten, wenn Conversion-Tracking + Consent-Lösung
  stehen (die Seite ist bewusst noch tracking-frei).

---

## Notfall-Wissen

- **Etwas kaputt gemacht?** Auf GitHub hat jede Datei eine „History“ – dort
  jede frühere Version ansehen und wiederherstellen. Lokal:
  `git checkout -- dateiname` verwirft ungespeicherte Änderungen.
- **Seite sieht nach Änderung komisch aus?** Browser-Cache leeren
  (`Strg+F5`) bevor du suchst.
- **Claude fragen geht immer:** einfach den Ordner `Retherm Pages` als
  Projekt öffnen – das Projektgedächtnis kennt alle Konventionen.
