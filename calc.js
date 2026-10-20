/* DemandaVial — módulo de cálculo (funciones puras, sin DOM).
   Se usa en el navegador (window.DV) y en Node para las pruebas (module.exports). */
(function (root) {
  "use strict";

  const TIPOS = ["autos", "motos", "buses", "camiones"];
  const PESADOS = ["buses", "camiones"];

  // "07:15" -> 435 (minutos desde medianoche)
  function aMinutos(hhmm) {
    const [h, m] = String(hhmm).split(":").map(Number);
    return h * 60 + m;
  }
  function aHora(min) {
    const m = ((min % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }
  // Inicio del cuarto de hora que contiene la hora dada (Date o minutos)
  function cuartoDeHora(fecha) {
    const min = typeof fecha === "number" ? fecha : fecha.getHours() * 60 + fecha.getMinutes();
    return aHora(Math.floor(min / 15) * 15);
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  // Volumen total de un intervalo (suma de los tipos de vehículo)
  function volumenIntervalo(iv) {
    return TIPOS.reduce((s, t) => s + num(iv[t]), 0);
  }

  // Intervalos ordenados por hora, con huecos rellenados en cero para que la
  // hora móvil siempre recorra cuartos de hora consecutivos.
  function normalizar(intervalos) {
    const ord = intervalos.slice().sort((a, b) => aMinutos(a.t) - aMinutos(b.t));
    if (!ord.length) return [];
    const out = [];
    let esperado = aMinutos(ord[0].t);
    for (const iv of ord) {
      const m = aMinutos(iv.t);
      while (esperado < m) {
        out.push({ t: aHora(esperado), autos: 0, motos: 0, buses: 0, camiones: 0 });
        esperado += 15;
      }
      out.push(iv);
      esperado = m + 15;
    }
    return out;
  }

  // Volumen horario móvil: suma de 4 intervalos consecutivos que empiezan en i.
  function horasMoviles(vols) {
    const out = [];
    for (let i = 0; i + 4 <= vols.length; i++) {
      out.push(vols[i] + vols[i + 1] + vols[i + 2] + vols[i + 3]);
    }
    return out;
  }

  /* Hora pico como hora móvil: los 4 intervalos consecutivos de 15 min con
     mayor volumen (pueden empezar en cualquier cuarto de hora).
     FHP = VHP / (4 · Qmáx15), con Qmáx15 el mayor intervalo DENTRO de esa hora.
     En empate gana la primera hora. Devuelve null si hay menos de 4 intervalos. */
  function horaPico(vols) {
    const hm = horasMoviles(vols);
    if (!hm.length) return null;
    let k = 0;
    for (let i = 1; i < hm.length; i++) if (hm[i] > hm[k]) k = i;
    const vhp = hm[k];
    const qmax = Math.max(vols[k], vols[k + 1], vols[k + 2], vols[k + 3]);
    return {
      inicio: k,
      vhp,
      qmax,
      fhp: qmax > 0 ? vhp / (4 * qmax) : null,
      tasaFlujo: 4 * qmax, // flujo equivalente del cuarto de hora pico (veh/h)
    };
  }

  // Totales por tipo y composición en % (incluye % de pesados = buses + camiones)
  function composicion(intervalos) {
    const tot = { autos: 0, motos: 0, buses: 0, camiones: 0 };
    for (const iv of intervalos) for (const t of TIPOS) tot[t] += num(iv[t]);
    const total = TIPOS.reduce((s, t) => s + tot[t], 0);
    const pct = {};
    for (const t of TIPOS) pct[t] = total ? (100 * tot[t]) / total : 0;
    const pesados = PESADOS.reduce((s, t) => s + tot[t], 0);
    return { totales: tot, total, pct, pesados, pctPesados: total ? (100 * pesados) / total : 0 };
  }

  // Proyección geométrica V·(1+i)^n — i en fracción (0.03 = 3 %). Es una estimación.
  function proyeccion(V, i, n) {
    if (![V, i, n].every(Number.isFinite) || i <= -1 || n < 0) return null;
    return V * Math.pow(1 + i, n);
  }

  /* Vehículos equivalentes con factores que ingresa el usuario.
     Solo se calcula si TODOS los tipos tienen factor (no hay valores por defecto). */
  function equivalentes(totales, factores) {
    if (!factores) return null;
    let s = 0;
    for (const t of TIPOS) {
      const f = Number(factores[t]);
      if (factores[t] === "" || factores[t] == null || !Number.isFinite(f) || f < 0) return null;
      s += num(totales[t]) * f;
    }
    return s;
  }

  // Resumen completo de un aforo
  function analizar(aforo) {
    const ivs = normalizar(aforo.intervalos || []);
    const vols = ivs.map(volumenIntervalo);
    const pico = horaPico(vols);
    const comp = composicion(ivs);
    let picoComp = null;
    if (pico) picoComp = composicion(ivs.slice(pico.inicio, pico.inicio + 4));
    return { intervalos: ivs, vols, horas: horasMoviles(vols), pico, comp, picoComp };
  }

  // CSV con separador ';' (Excel en español usa coma decimal)
  function aCSV(aforo) {
    const r = analizar(aforo);
    const dec = (x, d = 2) => (x == null ? "" : x.toFixed(d).replace(".", ","));
    const esc = (s) => '"' + String(s ?? "").replace(/"/g, '""') + '"';
    const L = [];
    L.push(["Aforo", esc(aforo.nombre)].join(";"));
    L.push(["Lugar", esc(aforo.lugar)].join(";"));
    L.push(["Fecha", esc(aforo.fecha)].join(";"));
    L.push(["Sentido", esc(aforo.sentido)].join(";"));
    L.push("");
    L.push("Inicio;Fin;Autos;Motos;Buses;Camiones;Total 15 min;Volumen horario móvil (desde este intervalo)");
    r.intervalos.forEach((iv, i) => {
      L.push([iv.t, aHora(aMinutos(iv.t) + 15), num(iv.autos), num(iv.motos), num(iv.buses),
        num(iv.camiones), r.vols[i], r.horas[i] ?? ""].join(";"));
    });
    L.push("");
    if (r.pico) {
      const ini = r.intervalos[r.pico.inicio].t;
      L.push(["Hora pico", ini + "-" + aHora(aMinutos(ini) + 60)].join(";"));
      L.push(["Volumen hora pico (veh/h)", r.pico.vhp].join(";"));
      L.push(["Volumen máximo 15 min", r.pico.qmax].join(";"));
      L.push(["FHP", dec(r.pico.fhp, 3)].join(";"));
    }
    L.push(["Volumen total", r.comp.total].join(";"));
    for (const t of TIPOS) L.push(["% " + t, dec(r.comp.pct[t], 1)].join(";"));
    L.push(["% pesados (buses + camiones)", dec(r.comp.pctPesados, 1)].join(";"));
    return L.join("\r\n");
  }

  const DV = {
    TIPOS, PESADOS, aMinutos, aHora, cuartoDeHora, volumenIntervalo, normalizar,
    horasMoviles, horaPico, composicion, proyeccion, equivalentes, analizar, aCSV,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = DV;
  else root.DV = DV;
})(typeof window !== "undefined" ? window : globalThis);
