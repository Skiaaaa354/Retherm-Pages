/*
 * RETHERM – UI-Logik (alle Seiten)
 * Sprachumschaltung, Navigation, Scroll-Reveals, Zähler,
 * Wirtschaftlichkeitsrechner und Formulare (mailto).
 *
 * Jedes Modul prüft selbst, ob seine Elemente auf der Seite existieren –
 * dieselbe Datei läuft auf Start-, Quellen- und Formularseiten.
 * Benötigt i18n.js (I18N); calc-core.js (CALC) nur auf Rechner-Seiten.
 */

'use strict';

(() => {

  const el = (id) => document.getElementById(id);
  const MAIL = 'info@ganzenmueller.de';

  /* ---------------- Sprache ---------------- */

  const LANG_KEY = 'retherm-lang';
  let lang = 'de';

  // Deutsche Originale beim ersten Umschalten aus dem DOM sichern
  const germanCache = new Map();

  function applyText(node, value) {
    if (value == null) return;
    // innerHTML auch bei Entities (&amp; …): der DE-Cache stammt aus innerHTML,
    // textContent würde sie doppelt escapen
    if (value.includes('<') || value.includes('&')) node.innerHTML = value;
    else node.textContent = value;
  }

  function setLang(next) {
    lang = next === 'en' ? 'en' : 'de';

    document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach((node) => {
      const key = node.getAttribute('data-i18n') || node.getAttribute('data-i18n-html');
      if (!germanCache.has(key)) germanCache.set(key, node.innerHTML);
      applyText(node, lang === 'en' ? I18N.en[key] : germanCache.get(key));
    });

    [['data-i18n-content', 'content'], ['data-i18n-placeholder', 'placeholder'], ['data-i18n-aria', 'aria-label'], ['data-i18n-alt', 'alt']].forEach(([attr, target]) => {
      document.querySelectorAll('[' + attr + ']').forEach((node) => {
        const key = node.getAttribute(attr);
        const cacheKey = 'attr:' + target + ':' + key;
        if (!germanCache.has(cacheKey)) germanCache.set(cacheKey, node.getAttribute(target));
        node.setAttribute(target, lang === 'en' ? (I18N.en[key] || '') : germanCache.get(cacheKey));
      });
    });

    document.documentElement.lang = lang;
    const de = el('lang-de'), en = el('lang-en');
    if (de) de.setAttribute('aria-pressed', String(lang === 'de'));
    if (en) en.setAttribute('aria-pressed', String(lang === 'en'));
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* Safari privat */ }

    refreshSliderLabels();
    if (typeof CALC !== 'undefined' && el('calc')) update();
  }

  function str(key) {
    return (I18N.str[lang] && I18N.str[lang][key]) || key;
  }

  /* ---------------- Formatierung ---------------- */

  function locale() { return lang === 'de' ? 'de-DE' : 'en-GB'; }

  function fmtInt(x) {
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(x);
  }

  function fmtDec(x, digits) {
    return new Intl.NumberFormat(locale(), {
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(x);
  }

  function fmtEuro(x) {
    const v = fmtInt(Math.round(x));
    return lang === 'de' ? v + ' €' : '€' + v;
  }

  function fmtYears(x) {
    return fmtDec(x, 1) + ' ' + (x < 1.05 && x >= 0.95 ? str('year1') : str('years'));
  }

  /* ---------------- Navigation ---------------- */

  function initNav() {
    const toggle = el('nav-toggle');
    const nav = el('site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Abgasquellen-Dropdown (Klick/Tastatur; Hover übernimmt CSS)
    document.querySelectorAll('.nav-item').forEach((item) => {
      const btn = item.querySelector('.nav-sub-toggle');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', (ev) => {
        if (!item.contains(ev.target)) {
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ---------------- Scroll-Reveals & Zähler ---------------- */

  function initReveals() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.rv');
    if (!targets.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach((t) => io.observe(t));
  }

  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Das HTML enthält bereits den Endzustand – bei reduzierter Bewegung
    // bleibt er einfach stehen.
    if (reduced || !('IntersectionObserver' in window)) return;

    function animate(node) {
      const target = parseFloat(node.getAttribute('data-count'));
      if (!Number.isFinite(target)) return;
      const finalHTML = node.innerHTML;
      const suffix = node.getAttribute('data-count-suffix') || '';
      const dur = 1100;
      const t0 = performance.now();
      function tick(t) {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = fmtInt(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else node.innerHTML = finalHTML;
      }
      requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
  }

  /* ---------------- Rechner ---------------- */

  const state = { mode: 'bakery', carrier: 'gas', company: 'small' };
  let lastResult = null;

  const sliders = [
    { input: 'in-consumption', label: 'val-consumption' },
    { input: 'in-temp', label: 'val-temp' },
    { input: 'in-flow', label: 'val-flow' },
    { input: 'in-hours', label: 'val-hours' },
  ];

  function refreshSliderLabels() {
    sliders.forEach(({ input, label }) => {
      const i = el(input), l = el(label);
      if (i && l) l.textContent = fmtInt(Number(i.value));
    });
  }

  function readPrice() {
    const raw = parseFloat(el('in-price').value);
    return Number.isFinite(raw) && raw > 0 ? raw : CALC.CARRIERS[state.carrier].price;
  }

  function update() {
    const input = {
      mode: state.mode,
      carrier: state.carrier,
      company: state.company,
      price: readPrice(),
      consumption: Number(el('in-consumption').value),
      tIn: Number(el('in-temp').value),
      flow: Number(el('in-flow').value),
      hours: Number(el('in-hours').value),
    };

    const r = CALC.evaluate(input);

    // Gesamtersparnis, auf 100 € gerundet – Scheinpräzision vermeiden
    el('out-saving').textContent = fmtInt(Math.round(r.totalSaving / 100) * 100);

    const rowPower = el('row-power');
    rowPower.hidden = state.mode !== 'industry';
    if (state.mode === 'industry') {
      el('out-power').textContent = fmtInt(Math.round(r.powerKW)) + ' kW';
    }

    const mwh = r.heatKWh / 1000;
    el('out-heat').textContent = (mwh < 100 ? fmtDec(mwh, 1) : fmtInt(Math.round(mwh))) + ' MWh/a';
    el('out-energy').textContent = fmtEuro(r.energyCost);

    // #out-co2t wird beim Sprachwechsel neu erzeugt – immer frisch abfragen
    const co2t = document.getElementById('out-co2t');
    if (co2t) co2t.textContent = fmtDec(r.co2Tonnes, 1);
    el('out-co2').textContent = fmtEuro(r.co2Cost);

    if (!Number.isFinite(r.paybackMid)) {
      el('out-payback').textContent = str('none');
    } else if (r.paybackMid > 25) {
      el('out-payback').textContent = '> 25 ' + str('years');
    } else if (r.paybackMax < 1) {
      el('out-payback').textContent = str('underOne');
    } else {
      el('out-payback').textContent = fmtDec(r.paybackMin, 1) + '–' + fmtDec(r.paybackMax, 1) + ' ' + str('years');
    }

    if (r.funding) {
      const tpl = r.funding.program === 'm4' ? str('fundM4') : str('fundM1');
      el('out-funding').textContent = tpl.replace('{rate}', Math.round(r.funding.rate * 100));
      el('out-payback-funded').textContent = Number.isFinite(r.paybackFunded)
        ? str('approx') + ' ' + fmtYears(r.paybackFunded)
        : str('none');
    } else {
      el('out-funding').textContent = r.totalSaving > 0 ? str('fundNone') : str('none');
      el('out-payback-funded').textContent = str('none');
    }

    const v = r.verdict;
    el('verdict').setAttribute('data-v', v);
    const map = { strong: 'Strong', good: 'Good', maybe: 'Maybe', weak: 'Weak' };
    el('verdict-title').textContent = str('v' + map[v] + 'T');
    el('verdict-text').textContent = str('v' + map[v] + 'P');

    lastResult = { input, r };
  }

  function bindSeg(containerId, dataAttr, onPick) {
    const box = el(containerId);
    if (!box) return;
    box.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        onPick(btn.getAttribute(dataAttr));
      });
    });
  }

  function initCalc() {
    if (typeof CALC === 'undefined' || !el('calc')) return;

    // Startmodus aus dem Markup übernehmen (vorausgewählter Tab)
    const activeTab = document.querySelector('.calc-tabs [role="tab"][aria-selected="true"]');
    if (activeTab) state.mode = activeTab.getAttribute('data-mode');

    sliders.forEach(({ input, label }) => {
      const i = el(input);
      if (!i) return;
      i.addEventListener('input', () => {
        el(label).textContent = fmtInt(Number(i.value));
        update();
      });
    });

    el('in-price').addEventListener('input', update);

    bindSeg('seg-carrier', 'data-carrier', (carrier) => {
      state.carrier = carrier;
      el('in-price').value = CALC.CARRIERS[carrier].price.toFixed(1);
      update();
    });

    bindSeg('seg-company', 'data-company', (company) => {
      state.company = company;
      update();
    });

    document.querySelectorAll('.calc-tabs [role="tab"]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.calc-tabs [role="tab"]').forEach((t) => {
          t.setAttribute('aria-selected', String(t === tab));
        });
        state.mode = tab.getAttribute('data-mode');
        el('calc-bakery').hidden = state.mode !== 'bakery';
        el('calc-industry').hidden = state.mode !== 'industry';
        update();
      });
    });

    // Ergebnis in den Potenzial-Check übernehmen
    const cta = el('calc-cta');
    if (cta) {
      cta.addEventListener('click', () => {
        const msg = el('ck-msg');
        if (msg) msg.value = buildSummary();
        const form = el('check-form');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth' });
          const name = el('ck-name');
          if (name) setTimeout(() => name.focus({ preventScroll: true }), 600);
        }
      });
    }

    refreshSliderLabels();
    update();
  }

  function buildSummary() {
    if (!lastResult) return '';
    const { input, r } = lastResult;
    const L = [];
    L.push(str('mailCalcHead'));
    L.push(str('mailMode') + ': ' + (input.mode === 'bakery' ? str('mailModeBakery') : str('mailModeIndustry')));
    if (input.mode === 'bakery') {
      L.push(str('mailConsumption') + ': ' + fmtInt(input.consumption) + ' kWh/a');
    } else {
      L.push(str('mailTemp') + ': ' + input.tIn + ' °C');
      L.push(str('mailFlow') + ': ' + fmtInt(input.flow) + ' m³/h');
      L.push(str('mailHours') + ': ' + fmtInt(input.hours) + ' h/a');
    }
    L.push(str('mailCarrier') + ': ' + (input.carrier === 'gas' ? str('carrierGas') : str('carrierOil')));
    L.push(str('mailPrice') + ': ' + fmtDec(input.price, 1) + ' ct/kWh');
    L.push(str('mailSaving') + ': ' + fmtEuro(Math.round(r.totalSaving / 100) * 100));
    if (Number.isFinite(r.paybackMid) && r.paybackMid <= 25) {
      L.push(str('mailPayback') + ': ' + fmtDec(r.paybackMin, 1) + '–' + fmtDec(r.paybackMax, 1) + ' ' + str('years'));
    }
    return L.join('\n');
  }

  /* ---------------- Potenzial-Check-Formular (mailto) ---------------- */

  function initCheckForm() {
    const form = el('check-form');
    if (!form) return;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = el('ck-name').value.trim();
      const email = el('ck-email').value.trim();
      if (!name || !email) {
        (!name ? el('ck-name') : el('ck-email')).focus();
        return;
      }
      const body = [
        str('mailName') + ': ' + name,
        str('mailCompany') + ': ' + (el('ck-company').value.trim() || '—'),
        str('mailMail') + ': ' + email,
        str('mailPhone') + ': ' + (el('ck-phone').value.trim() || '—'),
        str('mailZip') + ': ' + (el('ck-zip').value.trim() || '—'),
        '',
        str('mailMsg') + ':',
        el('ck-msg').value.trim() || str('prefillMsg'),
      ].join('\n');
      window.location.href = 'mailto:' + MAIL
        + '?subject=' + encodeURIComponent(str('mailSubjectCheck'))
        + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------------- Kontaktformular (mailto) ---------------- */

  function initContactForm() {
    const form = el('contact-form');
    if (!form) return;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = el('cf-name').value.trim();
      const email = el('cf-email').value.trim();
      if (!name || !email) {
        (!name ? el('cf-name') : el('cf-email')).focus();
        return;
      }
      const body = [
        str('mailName') + ': ' + name,
        str('mailCompany') + ': ' + (el('cf-company').value.trim() || '—'),
        str('mailMail') + ': ' + email,
        str('mailPhone') + ': ' + (el('cf-phone').value.trim() || '—'),
        '',
        str('mailMsg') + ':',
        el('cf-msg').value.trim(),
      ].join('\n');
      window.location.href = 'mailto:' + MAIL
        + '?subject=' + encodeURIComponent(str('mailSubject'))
        + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------------- Start ---------------- */

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveals();
    initCounters();
    initCalc();
    initCheckForm();
    initContactForm();

    const de = el('lang-de'), en = el('lang-en');
    if (de) de.addEventListener('click', () => setLang('de'));
    if (en) en.addEventListener('click', () => setLang('en'));

    let saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* egal */ }
    const initial = saved || ((navigator.language || 'de').startsWith('de') ? 'de' : 'en');
    if (initial === 'en') setLang('en');
  });

})();
