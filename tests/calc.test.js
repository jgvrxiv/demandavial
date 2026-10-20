// Pruebas del módulo de cálculo. Correr con:  node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const DV = require("../calc.js");
const { CASOS, correrCaso } = require("../casos.js");

const iv = (t, autos = 0, motos = 0, buses = 0, camiones = 0) => ({ t, autos, motos, buses, camiones });

// Ejercicios resueltos de fuentes citadas
for (const c of CASOS) {
  test(`Caso publicado: ${c.id}`, () => {
    const { ok, obtenido } = correrCaso(DV, c);
    assert.ok(ok, `esperado ${JSON.stringify(c.esperado)}, obtenido ${JSON.stringify(obtenido)}`);
  });
}

test("La hora pico es móvil: puede empezar en cualquier cuarto de hora", () => {
  const ivs = [iv("07:00", 10), iv("07:15", 10), iv("07:30", 50), iv("07:45", 60), iv("08:00", 70), iv("08:15", 40), iv("08:30", 5)];
  const r = DV.analizar({ intervalos: ivs });
  assert.equal(r.intervalos[r.pico.inicio].t, "07:30");
  assert.equal(r.pico.vhp, 220);
  assert.equal(r.pico.qmax, 70);
  assert.ok(Math.abs(r.pico.fhp - 220 / 280) < 1e-12);
});

test("Qmáx se toma dentro de la hora pico, no de todo el aforo", () => {
  // El 90 del primer intervalo queda fuera de la hora pico (índices 4 a 7)
  const vols = [90, 10, 10, 10, 80, 80, 80, 70];
  const p = DV.horaPico(vols);
  assert.equal(p.inicio, 4);
  assert.equal(p.vhp, 310);
  assert.equal(p.qmax, 80);
  assert.ok(Math.abs(p.fhp - 310 / 320) < 1e-12);
});

test("Con menos de 4 intervalos no hay hora pico", () => {
  assert.equal(DV.horaPico([10, 20, 30]), null);
});

test("Los huecos se rellenan con cero para mantener cuartos de hora consecutivos", () => {
  const r = DV.analizar({ intervalos: [iv("08:00", 5), iv("07:00", 1), iv("07:30", 3)] });
  assert.deepEqual(r.intervalos.map((x) => x.t), ["07:00", "07:15", "07:30", "07:45", "08:00"]);
  assert.deepEqual(r.vols, [1, 0, 3, 0, 5]);
});

test("Composición vehicular y porcentaje de pesados", () => {
  const c = DV.composicion([iv("07:00", 60, 20, 10, 10)]);
  assert.equal(c.total, 100);
  assert.equal(c.pct.autos, 60);
  assert.equal(c.pesados, 20);
  assert.equal(c.pctPesados, 20);
});

test("Proyección geométrica V·(1+i)^n", () => {
  assert.ok(Math.abs(DV.proyeccion(1000, 0.03, 10) - 1343.916379) < 1e-5);
  assert.equal(DV.proyeccion(1000, 0, 5), 1000);
  assert.equal(DV.proyeccion(1000, 0.03, -1), null);
});

test("Vehículos equivalentes solo con todos los factores ingresados", () => {
  const tot = { autos: 100, motos: 50, buses: 10, camiones: 5 };
  assert.equal(DV.equivalentes(tot, { autos: 1, motos: "", buses: 2, camiones: 2 }), null);
  assert.equal(DV.equivalentes(tot, null), null);
  assert.equal(DV.equivalentes(tot, { autos: 1, motos: 0.5, buses: 2, camiones: 3 }), 100 + 25 + 20 + 15);
});

test("Cuarto de hora actual", () => {
  assert.equal(DV.cuartoDeHora(7 * 60 + 44), "07:30");
  assert.equal(DV.cuartoDeHora(new Date(2026, 0, 1, 17, 15, 59)), "17:15");
});

test("CSV con separador ; y coma decimal", () => {
  const csv = DV.aCSV({ nombre: "Prueba", intervalos: CASOS[0].vols.map((v, i) => iv(DV.aHora(960 + 15 * i), v)) });
  assert.match(csv, /FHP;0,842/);
  assert.match(csv, /Hora pico;17:00-18:00/);
});
