# Design

Visuelles System der RETHERM-Website. Quelle der Wahrheit für Tokens ist
`assets/css/main.css` (Abschnitt „Tokens"); dieses Dokument beschreibt die
Absicht dahinter.

## Theme

Industrielle Zweiflächigkeit: warmes Papiergrau (`--paper #f2f0ec`) und
Anthrazit (`--coal #16181b`) wechseln sektionsweise – hell für Erklärung,
dunkel für Anlage, Ergebnis und Kontakt. Ein einziger heißer Akzent
(`--heat #e8501e`, Thermo-Orange) markiert Wärme, Werte und Handlung;
Stahlblau (`--steel #4a6577`) ist die Kaltseite (Wasser, gekühltes Abgas)
und tritt nur funktional auf. Scharfe Kanten (border-radius 0 überall),
1px-Haarlinien (`--line`, `--line-dark`) statt Schatten. Farbstrategie:
Committed – die dunklen Flächen und der Orange-Akzent tragen die Marke.

## Farben

| Token | Wert | Rolle |
|---|---|---|
| `--paper` / `--paper-raised` | `#f2f0ec` / `#faf9f7` | Helle Flächen, Panels |
| `--coal` / `--coal-raised` | `#16181b` / `#1e2125` | Dunkle Sektionen, Header, Footer |
| `--ink` / `--ink-soft` / `--muted` | `#1d2126` / `#4b5157` / `#6b7178` | Text hell-auf-dunkel abgestuft |
| `--heat` / `--heat-deep` | `#e8501e` / `#c23f12` | Akzent: Wärme, CTAs, Werte |
| `--steel` | `#4a6577` | Wasserkreis, gekühltes Abgas |
| `--ok` / `--mid` / `--bad` | `#33763f` / `#b06f10` / `#a33018` | Rechner-Urteile (gedeckte Signalfarben) |

Temperaturverlauf Orange→Stahlblau als wiederkehrendes Motiv (Hero-Randleiste,
Schema): heiß rein, kalt raus – die Physik des Produkts als Farblogik.

## Typografie

- **Barlow Condensed 600/700** – Headlines, Buttons, Navigation. DIN-1451-
  Anmutung: deutsche Industrie-Beschilderung, nicht Werbeschrift.
- **Barlow 400/500/600** – Fließtext.
- **IBM Plex Mono 400/500** – ausschließlich funktional: Messwerte, Einheiten,
  Sektions- und Komponenten-Nummern, Trust-Leiste. Mono ist hier kein
  Tech-Kostüm, sondern Zitat von Messprotokoll und Typenschild.

Alle Schriften selbst gehostet (`assets/fonts/`, woff2 latin). Diese drei
Familien sind committete Markenidentität – bei Erweiterungen beibehalten.
H1 clamp bis 84px, `text-wrap: balance` auf Headlines.

## Layout & Grammatik

- `--w-max: 1180px`, fluides Padding `clamp(20px, 4vw, 48px)`.
- **Messprotokoll-Grammatik** (bewusstes, benanntes System): nummerierte
  Sektions-Tags (`01 — Ausgangslage`), Komponenten-Nummern (K·01, U·01, L·01),
  Mono-Uppercase-Labels. Das ist die Ingenieurs-Stimme der Marke – auf
  neuen Seiten fortführen, nicht durch generische Eyebrows ersetzen.
- Raster mit 1px-Fugen (`gap: 1px` auf Linienfarbe) statt Karten mit Schatten:
  comp-grid (dunkel), use-grid, src-grid, steps, fund-table.
- Split-Layouts (5/4) mit `loss-list` (Wert in Mono + Erklärung) für
  Zahlenargumente.

## Komponenten

Header (sticky, Anthrazit, Dropdown „Abgasquellen", oranger CTA
„Potenzial-Check", DE/EN-Umschalter) · Trust-Leiste (5 Mono-Claims, auf jeder
Seite identisch) · page-head mit Breadcrumbs und Temperatur-Randleiste ·
Rechner (`.calc`: helle Eingabe, dunkles Ergebnis-Panel, Urteils-Box mit
Signalfarben-Kante) · Anlagenschema (Inline-SVG, Strichzeichnung mit
animierten Medienflüssen) · check-form / contact-form · ref-Karten mit
Foto-Slot · Footer.

## 3D-Hero

Startseite: Three.js-Szene (Vendored, kein Build) nach den Produktrenderings –
Kamineingang hinten, Kaminausgang mit Saugzug-Motor vorne, Vor-/Rücklauf
seitlich, Pufferspeicher mit Schichtungs-Shader. GSAP-ScrollTrigger scrubbt
eine Kamerafahrt durch sechs Kapitel (Sticky-Stage, 560vh); Partikel tragen
die Farbdramaturgie: Abgas Rot→Grau, Wasser Dunkelblau→Türkis→Gold im
Gegenstrom. Innenleben nur als generische Leuchtspur („beispielhafte
Darstellung") – nie die reale Tauschergeometrie. Fallback: statischer Hero
(Partikel-CSS) ohne WebGL/bei reduced motion.

## Motion

Zurückhaltend, physikalisch begründet: aufsteigende Glut-Partikel im Hero
(Wärme), abwärts fließende Wasser-Partikel (Kaltseite), fließende Dash-Medien
im Anlagenschema, zählende Kennzahlen (einmalig, IntersectionObserver),
Scroll-Reveals (translateY 16px, 0.55s ease-out). Keine Bounce-/Elastic-Kurven.
`prefers-reduced-motion: reduce` schaltet global alles ab (`* { animation:
none; transition: none }` in main.css); Inhalte sind ohne Motion vollständig
sichtbar.

## Bildsprache

Echte Anlagenfotos (Edelstahl-Wärmetauscher, Backstuben, Steuerung) in
`assets/img/` – dokumentarisch, nicht gestellt. Fotos sitzen in
`figure`/`ref__media`-Rahmen mit Haarlinie; keine Stockfoto-Glätte, keine
Filter. Wo noch kein Foto freigegeben ist: ehrlicher Platzhalter
(„Projektfoto folgt"), nie Deko-Ersatz.

## Sprache

Deutsch im Markup (SEO), Englisch als Wörterbuch (`assets/js/i18n.js` +
`assets/js/i18n/<seite>.js`). Zahlenformate lokalisiert (Intl.NumberFormat).
Ton: kurze Hauptsätze, keine Superlative, Zahlen mit Quelle.
