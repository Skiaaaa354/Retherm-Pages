/*
 * RETHERM Wirtschaftlichkeitsrechner – Rechenkern
 *
 * Reine Funktionen ohne DOM-Zugriff, damit der Kern unabhängig von der
 * Oberfläche getestet werden kann (Node oder Browser).
 *
 * Zwei Modi:
 *
 *  bakery   – Ausgangspunkt ist der Jahresverbrauch der Ofenanlage.
 *             Rückgewinnung = garantiertes Viertel (25 %) der eingesetzten
 *             Energie (Herstellerangabe WP/Ganzenmüller).
 *
 *  industry – Ausgangspunkt sind Abgasdaten (Temperatur, Volumenstrom,
 *             Betriebsstunden). Sensible Wärme, konservativ – Kondensations-
 *             gewinne feuchter Abgase werden bewusst NICHT eingerechnet:
 *
 *             Q̇ [kW] = V̇/3600 · ρ(T_ein) · cp · (T_ein − T_aus) · η_WT
 *
 *             ρ(T) über ideales Gasgesetz korrigiert, da Anlagendaten
 *             üblicherweise Betriebskubikmeter angeben.
 *
 * Förderung (Stand 2026, BAFA-Merkblatt EEW v7.4):
 *  - EEW Modul 4 Premium (Abwärmenutzung, reine Klimaschutzmaßnahme):
 *    45 % klein / 35 % mittel / 25 % groß – setzt Amortisation OHNE
 *    Förderung > 3 Jahre voraus.
 *  - EEW Modul 1 Querschnittstechnologien (nur KMU): 25 % klein / 20 % mittel,
 *    max. 200.000 € Zuschuss – ohne 3-Jahres-Bedingung.
 *  Der Rechner wählt automatisch das Programm, das zur errechneten
 *  Amortisation passt.
 */

'use strict';

const CALC = (() => {

  // Stoffwerte Abgas Erdgas-/Ölfeuerung (Näherung, λ ≈ 1,1–1,3)
  const RHO_NORM = 1.26;    // kg/Nm³ bei 0 °C
  const CP = 1.08;          // kJ/(kg·K) im Bereich 60–250 °C; bei höheren
                            // Temperaturen (real bis ~1,15) bewusst konservativ

  // Anlagenannahmen – mit realen RETHERM-Betriebsdaten abgleichbar
  const DEFAULTS = {
    recoveryShare: 0.25,    // garantiertes Viertel (Bäckerei-Modus)
    tOut: 60,               // °C Restwärme nach Wärmetauscher (Industrie-Modus)
    etaHX: 0.70,            // Wirkungsgrad Wärmeübertrager, sensibel, konservativ
    etaBoiler: 0.90,        // Wirkungsgrad des ersetzten Wärmeerzeugers
    investMin: 60000,       // € Komplettsystem, untere Grenze (Richtwert)
    investMax: 80000,       // € Komplettsystem, obere Grenze (Richtwert)
    co2PricePerTonne: 65,   // €/t CO₂ – nEHS-Korridor 2026: 55–65 €/t
  };

  // Energieträger: Preis ct/kWh netto (Gewerbe, Destatis/BDEW 2025/26),
  // CO₂-Faktor kg/kWh (BAFA-Infoblatt 2025), nehs = nationale CO₂-Bepreisung
  const CARRIERS = {
    gas: { price: 8.0,  co2: 0.201, nehs: true },
    oil: { price: 10.5, co2: 0.266, nehs: true },
  };

  // Förderquoten nach Unternehmensgröße (EU-KMU-Definition)
  const FUNDING = {
    small:  { m4: 0.45, m1: 0.25 },
    medium: { m4: 0.35, m1: 0.20 },
    large:  { m4: 0.25, m1: 0 },
  };
  const M1_CAP = 200000;    // € max. Zuschuss Modul 1
  const M4_MIN_PAYBACK = 3; // Jahre – darunter ist Modul 4 ausgeschlossen

  // Dichte bei Betriebstemperatur (ideales Gas, Umgebungsdruck)
  function density(tCelsius) {
    return RHO_NORM * 273.15 / (273.15 + tCelsius);
  }

  // Rückgewinnbare thermische Leistung aus Abgasdaten [kW]
  function recoveryPower(tIn, flow, a) {
    const dT = Math.max(0, tIn - a.tOut);
    return (flow / 3600) * density(tIn) * CP * dT * a.etaHX;
  }

  /**
   * @param {object} input
   * @param {string} input.mode         'bakery' | 'industry'
   * @param {string} input.carrier      'gas' | 'oil'
   * @param {number} [input.price]      Energiepreis ct/kWh (überschreibt Vorgabe)
   * @param {string} [input.company]    'small' | 'medium' | 'large' (Förderung)
   * @param {number} [input.consumption] Bäckerei: Jahresverbrauch Ofenanlage kWh/a
   * @param {number} [input.tIn]        Industrie: Abgastemperatur °C
   * @param {number} [input.flow]       Industrie: Volumenstrom m³/h (Betrieb)
   * @param {number} [input.hours]      Industrie: Betriebsstunden pro Jahr
   * @param {object} [assumptions]      überschreibt DEFAULTS
   */
  function evaluate(input, assumptions) {
    const a = Object.assign({}, DEFAULTS, assumptions);
    const carrier = CARRIERS[input.carrier] || CARRIERS.gas;
    const price = (input.price != null ? input.price : carrier.price) / 100; // €/kWh

    // Nutzwärme pro Jahr [kWh]
    let heatKWh, powerKW = null;
    if (input.mode === 'industry') {
      powerKW = recoveryPower(input.tIn, input.flow, a);
      heatKWh = powerKW * input.hours;
    } else {
      heatKWh = (input.consumption || 0) * a.recoveryShare;
    }

    // Ersetzte Endenergie: der verdrängte Wärmeerzeuger hat < 100 % Wirkungsgrad
    const fuelKWh = heatKWh / a.etaBoiler;

    const energyCost = fuelKWh * price;
    const co2Tonnes = fuelKWh * carrier.co2 / 1000;
    const co2Cost = carrier.nehs ? co2Tonnes * a.co2PricePerTonne : 0;
    const totalSaving = energyCost + co2Cost;

    const investMid = (a.investMin + a.investMax) / 2;
    const paybackMin = totalSaving > 0 ? a.investMin / totalSaving : Infinity;
    const paybackMax = totalSaving > 0 ? a.investMax / totalSaving : Infinity;
    const paybackMid = totalSaving > 0 ? investMid / totalSaving : Infinity;

    // Förderlogik: Modul 4 nur bei Amortisation ohne Förderung > 3 Jahre,
    // sonst Modul 1 (nur KMU, gedeckelt)
    const rates = FUNDING[input.company] || FUNDING.small;
    let funding = null;
    if (totalSaving > 0) {
      if (paybackMid > M4_MIN_PAYBACK && rates.m4 > 0) {
        funding = { program: 'm4', rate: rates.m4, grant: investMid * rates.m4 };
      } else if (rates.m1 > 0) {
        funding = { program: 'm1', rate: rates.m1, grant: Math.min(investMid * rates.m1, M1_CAP) };
      }
    }
    const paybackFunded = funding
      ? (investMid - funding.grant) / totalSaving
      : paybackMid;

    let verdict;
    if (paybackMid <= 3) verdict = 'strong';        // lohnt sich klar
    else if (paybackMid <= 6) verdict = 'good';     // lohnt sich
    else if (paybackMid <= 10) verdict = 'maybe';   // bedingt
    else verdict = 'weak';                          // eher nicht

    return {
      powerKW, heatKWh, fuelKWh,
      energyCost, co2Tonnes, co2Cost, totalSaving,
      investMid, paybackMin, paybackMax, paybackMid,
      funding, paybackFunded,
      verdict,
      assumptions: a,
      priceCt: price * 100,
    };
  }

  return { evaluate, density, recoveryPower, CARRIERS, DEFAULTS, FUNDING, CP, RHO_NORM };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CALC;
