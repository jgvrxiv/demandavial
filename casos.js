/* Casos de validación tomados de ejercicios resueltos publicados.
   Los usan las pruebas (tests/calc.test.js) y la sección «Validación» de la app. */
(function (root) {
  "use strict";
  const CASOS = [
    {
      id: "mathew-iitb",
      titulo: "Hora pico y FHP con conteos de 15 min (10 intervalos)",
      fuente:
        "Mathew, T. V. «Measurement at a Point», Lecture Notes in Transportation Systems Engineering, " +
        "Departamento de Ingeniería Civil, IIT Bombay (NPTEL). " +
        "https://www.civil.iitb.ac.in/tvm/nptel/521_TrVolume/web/web.html",
      inicio: "16:00",
      vols: [30, 26, 35, 40, 49, 55, 65, 50, 39, 30],
      esperado: { horaPico: "17:00", vhp: 219, qmax: 65, fhp: 0.84 },
      tolerancia: 0.005,
      nota: "La fuente redondea el FHP a 0,84 (219 / 260 = 0,842).",
    },
    {
      id: "calymayor-8-6",
      titulo: "FHMD de 15 min a partir de los 12 volúmenes de 5 min de la hora de máxima demanda",
      fuente:
        "Cal y Mayor, R. y Cárdenas, J. Ingeniería de tránsito: fundamentos y aplicaciones. " +
        "Alfaomega, capítulo 8, ejercicio 8.6 (datos del enunciado).",
      inicio: "00:00",
      // 30+36+40, 42+48+50, 52+58+56, 44+38+32 → 4 intervalos de 15 min
      vols: [106, 140, 166, 114],
      esperado: { horaPico: "00:00", vhp: 526, qmax: 166, fhp: 0.792 },
      tolerancia: 0.0005,
      nota:
        "Los volúmenes de 5 min se agregaron en cuartos de hora. El resultado sale de aplicar " +
        "FHMD15 = VHMD / (4·Qmáx15) a los datos del enunciado; el autor debe cotejarlo con la " +
        "solución impresa en la edición del libro que use.",
    },
    {
      id: "miovision-a",
      titulo: "FHP de una hora con un cuarto de hora dominante",
      fuente:
        "Miovision, «Peak Hour Factor (PHF) Explained», centro de ayuda. " +
        "https://help.miovision.com/s/article/Peak-Hour-Factor-PHF-Explained",
      inicio: "07:00",
      vols: [175, 200, 150, 125],
      esperado: { horaPico: "07:00", vhp: 650, qmax: 200, fhp: 0.81 },
      tolerancia: 0.005,
      nota: "La fuente redondea a 0,81 (650 / 800 = 0,8125).",
    },
    {
      id: "miovision-b",
      titulo: "FHP de una hora con flujo uniforme",
      fuente:
        "Miovision, «Peak Hour Factor (PHF) Explained», centro de ayuda. " +
        "https://help.miovision.com/s/article/Peak-Hour-Factor-PHF-Explained",
      inicio: "07:00",
      vols: [190, 200, 190, 190],
      esperado: { horaPico: "07:00", vhp: 770, qmax: 200, fhp: 0.96 },
      tolerancia: 0.005,
      nota: "La fuente redondea a 0,96 (770 / 800 = 0,9625).",
    },
  ];

  // Ejecuta un caso con el módulo de cálculo y devuelve el resultado comparado
  function correrCaso(DV, c) {
    const ini = DV.aMinutos(c.inicio);
    const intervalos = c.vols.map((v, i) => ({ t: DV.aHora(ini + 15 * i), autos: v, motos: 0, buses: 0, camiones: 0 }));
    const r = DV.analizar({ intervalos });
    const p = r.pico;
    const obtenido = p && {
      horaPico: r.intervalos[p.inicio].t, vhp: p.vhp, qmax: p.qmax, fhp: p.fhp,
    };
    const ok = !!p &&
      obtenido.horaPico === c.esperado.horaPico &&
      obtenido.vhp === c.esperado.vhp &&
      obtenido.qmax === c.esperado.qmax &&
      Math.abs(obtenido.fhp - c.esperado.fhp) <= c.tolerancia;
    return { ok, obtenido };
  }

  const API = { CASOS, correrCaso };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.DVCasos = API;
})(typeof window !== "undefined" ? window : globalThis);
