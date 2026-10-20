/* DemandaVial — interfaz. Depende de calc.js (DV) y casos.js (DVCasos). */
(function () {
  "use strict";
  const { TIPOS, aMinutos, aHora, cuartoDeHora } = DV;
  const STORE = "demandavial.v1";
  const TEMA = "demandavial.tema";
  const NOMBRES = { autos: "Autos", motos: "Motos", buses: "Buses", camiones: "Camiones" };

  /* ---------- Iconos SVG inline ---------- */
  const P = {
    autos: '<path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17v-4l2-5h11l3 5h2v4"/><path d="M6 13h13"/>',
    motos: '<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M5.5 16.5 10 9h4l4.5 7.5M12 9 10.5 6H8M14 9h3"/>',
    buses: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v2M16 18v2M8 14.5h.01M16 14.5h.01"/>',
    camiones: '<path d="M2 6h11v10H2zM13 9h4l3 4v3h-7z"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    deshacer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    campo: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tabla: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    graf: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    datos: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    imp: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
    csv: '<path d="M14 3v5h5M14 3H6v18h12V8z"/><path d="M9 14h6M9 17h4"/>',
    basura: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    atras: '<path d="M15 18 9 12l6-6"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const ico = (k, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[k]}</svg>`;

  /* ---------- Utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (x, d = 0) => (x == null || !Number.isFinite(x) ? "—" : x.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const rango = (t, min = 15) => `${t}–${aHora(aMinutos(t) + min)}`;
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2200);
  }

  /* ---------- Almacenamiento ---------- */
  let db = { aforos: [] };
  function cargar() {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && Array.isArray(s.aforos)) db = s; } catch (e) { /* sin almacenamiento */ }
  }
  function guardar() {
    try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (e) { toast("No se pudo guardar en este navegador"); }
  }
  const getAforo = (id) => db.aforos.find((a) => a.id === id);

  function nuevoAforo(datos) {
    const a = {
      id: uid(), nombre: datos.nombre || "Aforo sin nombre", lugar: datos.lugar || "", fecha: datos.fecha || hoy(),
      sentido: datos.sentido || "", intervalos: [], log: [],
      proy: { i: "", n: "" }, factores: { autos: "", motos: "", buses: "", camiones: "" }, fuenteFactores: "",
      creado: Date.now(),
    };
    db.aforos.unshift(a); guardar(); return a;
  }
  function intervalo(a, t, crear = true) {
    let iv = a.intervalos.find((x) => x.t === t);
    if (!iv && crear) { iv = { t, autos: 0, motos: 0, buses: 0, camiones: 0 }; a.intervalos.push(iv); a.intervalos.sort((x, y) => aMinutos(x.t) - aMinutos(y.t)); }
    return iv;
  }

  /* ---------- Tema ---------- */
  function aplicarTema(t) {
    document.documentElement.dataset.tema = t;
    const b = $("#btn-tema");
    b.innerHTML = ico(t === "oscuro" ? "sol" : "luna");
    b.setAttribute("aria-label", t === "oscuro" ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    $('meta[name="theme-color"]').content = t === "oscuro" ? "#0f1520" : "#f3f6fa";
  }
  let tema = "oscuro";
  try { tema = localStorage.getItem(TEMA) || "oscuro"; } catch (e) { /* */ }
  aplicarTema(tema);
  $("#btn-tema").onclick = () => { tema = tema === "oscuro" ? "claro" : "oscuro"; aplicarTema(tema); try { localStorage.setItem(TEMA, tema); } catch (e) { /* */ } };

  /* ---------- Router ---------- */
  let relojT = null;
  function route() {
    clearInterval(relojT);
    const h = location.hash.replace(/^#/, "");
    const m = h.match(/^aforo\/([^/]+)(?:\/(\w+))?$/);
    if (m && getAforo(m[1])) vistaAforo(getAforo(m[1]), m[2] || "campo");
    else vistaInicio();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* ---------- Vista: inicio ---------- */
  function vistaInicio() {
    document.title = "DemandaVial — Aforos y demanda de tránsito";
    const items = db.aforos.map((a) => {
      const r = DV.analizar(a);
      return `<a class="item" href="#aforo/${a.id}/${a.intervalos.length ? "res" : "campo"}">
        <div><b>${esc(a.nombre)}</b><div class="meta">${esc([a.lugar, a.fecha, a.sentido && "Sentido " + a.sentido].filter(Boolean).join(" · "))}</div></div>
        <div class="num">${r.pico ? fmt(r.pico.vhp) + " veh/h" : fmt(r.comp.total) + " veh"}<small>${r.pico ? "Hora pico " + rango(r.intervalos[r.pico.inicio].t, 60) : r.intervalos.length + " intervalos"}</small></div>
      </a>`;
    }).join("");

    $("#app").innerHTML = `
    <div class="hero">
      <div class="eyebrow">Ingeniería de tránsito · herramienta preliminar</div>
      <h1>Aforos y demanda de tránsito</h1>
      <p class="muted" style="max-width:680px;margin:0">Registra conteos vehiculares por intervalos de 15 minutos, en campo o digitados, y obtén la hora pico móvil, el factor de hora pico (FHP), la composición vehicular y una proyección de la demanda. Todo queda guardado en este navegador.</p>
    </div>

    <section class="grid g2">
      <div class="card">
        <h3>Nuevo aforo</h3>
        <form id="f-nuevo">
          <label class="f">Nombre<input name="nombre" required placeholder="Ej.: Av. Caracas con calle 45 — mañana" maxlength="90"></label>
          <label class="f">Lugar<input name="lugar" placeholder="Ej.: Bogotá, Teusaquillo" maxlength="90"></label>
          <div class="f2">
            <label class="f">Fecha<input name="fecha" type="date" value="${hoy()}"></label>
            <label class="f">Sentido<input name="sentido" placeholder="Ej.: Norte–Sur" maxlength="40"></label>
          </div>
          <div class="row" style="margin-top:6px">
            <button class="btn pri" name="modo" value="campo">${ico("campo")}Contar en campo</button>
            <button class="btn" name="modo" value="tabla">${ico("tabla")}Digitar conteos</button>
          </div>
        </form>
        <p class="tiny" style="margin:14px 0 0">¿Quieres probar la herramienta? <a href="#" id="btn-ejemplo">Carga el aforo de ejemplo</a> (ejercicio publicado de la sección «Validación»).</p>
      </div>
      <div class="card">
        <h3>Aforos guardados</h3>
        <div class="lista">${items || '<div class="vacio">Aún no hay aforos. Crea uno con el formulario.</div>'}</div>
      </div>
    </section>

    <section class="card">
      <h3>Cómo se calcula</h3>
      <div class="grid g2" style="gap:10px 28px;font-size:14px">
        <div><b>Volumen horario móvil.</b> Suma de 4 intervalos consecutivos de 15 min. Se calcula desde cada cuarto de hora, no solo en horas en punto.</div>
        <div><b>Hora pico.</b> La hora móvil de mayor volumen (VHP). Si hay empate, se toma la primera.</div>
        <div><b>FHP.</b> VHP / (4 × Qmáx15), donde Qmáx15 es el mayor volumen de 15 min <i>dentro</i> de la hora pico. Vale entre 0,25 y 1.</div>
        <div><b>Composición.</b> Porcentaje de cada tipo sobre el total y porcentaje de pesados (buses + camiones).</div>
        <div><b>Proyección.</b> V·(1+i)<sup>n</sup>, con la tasa <i>i</i> y los años <i>n</i> que ingresa el usuario. Es una estimación.</div>
        <div><b>Vehículos equivalentes (opcional).</b> Σ conteo × factor. La herramienta no trae factores por defecto: los ingresa el usuario con su fuente.</div>
      </div>
    </section>

    <section class="card" id="validacion">
      <h3>Validación con ejercicios publicados</h3>
      <p class="muted" style="margin-top:0;font-size:14px">Estos casos se recalculan con el mismo código de la app cada vez que abres esta página, y también corren como pruebas automáticas en el repositorio.</p>
      <div>${DVCasos.CASOS.map((c) => {
        const { ok, obtenido } = DVCasos.correrCaso(DV, c);
        return `<div class="caso">
          <span class="pill ${ok ? "ok" : "bad"}">${ico(ok ? "check" : "x")}${ok ? "Coincide" : "No coincide"}</span>
          <div><b>${esc(c.titulo)}</b><br>
          <span class="muted">Esperado: hora pico ${c.esperado.horaPico}, VHP ${c.esperado.vhp}, Qmáx ${c.esperado.qmax}, FHP ${fmt(c.esperado.fhp, c.esperado.fhp.toString().split(".")[1].length)} · Obtenido: ${obtenido ? `${obtenido.horaPico}, ${obtenido.vhp}, ${obtenido.qmax}, ${fmt(obtenido.fhp, 3)}` : "—"}</span><br>
          <span class="tiny">${esc(c.fuente)}${c.nota ? " " + esc(c.nota) : ""}</span></div>
        </div>`;
      }).join("")}</div>
    </section>

    <section class="card">
      <h3>Fuentes</h3>
      <ul class="fuentes">
        <li>Transportation Research Board (TRB). <i>Highway Capacity Manual</i>, 7.ª ed. National Academies, 2022. Definición del factor de hora pico y de la tasa de flujo de 15 minutos.</li>
        <li>Cal y Mayor, R. y Cárdenas, J. <i>Ingeniería de tránsito: fundamentos y aplicaciones</i>. Alfaomega. Capítulo 8, volúmenes de tránsito y factor de la hora de máxima demanda (FHMD).</li>
        <li>Mathew, T. V. <i>Measurement at a Point</i>. Lecture Notes in Transportation Systems Engineering, IIT Bombay (NPTEL). <a href="https://www.civil.iitb.ac.in/tvm/nptel/521_TrVolume/web/web.html">Enlace</a>.</li>
        <li>Miovision. <i>Peak Hour Factor (PHF) Explained</i>. <a href="https://help.miovision.com/s/article/Peak-Hour-Factor-PHF-Explained">Enlace</a>.</li>
      </ul>
    </section>`;

    $("#f-nuevo").onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const a = nuevoAforo(Object.fromEntries(fd));
      location.hash = `aforo/${a.id}/${e.submitter?.value || "campo"}`;
    };
    $("#btn-ejemplo").onclick = (e) => {
      e.preventDefault();
      const c = DVCasos.CASOS[0];
      const a = nuevoAforo({ nombre: "Ejemplo — Mathew (IIT Bombay)", lugar: "Datos de un ejercicio publicado", sentido: "Único" });
      // Se reparte el volumen publicado en tipos solo para ilustrar la composición; el total por intervalo es el de la fuente.
      a.intervalos = c.vols.map((v, i) => {
        const camiones = Math.round(v * 0.06), buses = Math.round(v * 0.08), motos = Math.round(v * 0.22);
        return { t: aHora(aMinutos("16:00") + 15 * i), autos: v - camiones - buses - motos, motos, buses, camiones };
      });
      guardar(); location.hash = `aforo/${a.id}/res`;
    };
  }

  /* ---------- Vista: aforo ---------- */
  function vistaAforo(a, tab) {
    document.title = `${a.nombre} — DemandaVial`;
    const tabs = [["campo", "Campo", "campo"], ["tabla", "Tabla", "tabla"], ["res", "Resultados", "graf"], ["datos", "Datos", "datos"]];
    $("#app").innerHTML = `
      <div class="cab">
        <a class="btn ghost no-print" href="#inicio" style="padding-left:6px;margin-bottom:10px">${ico("atras")}Aforos</a>
        <div class="eyebrow">${esc([a.lugar, a.fecha, a.sentido && "Sentido " + a.sentido].filter(Boolean).join(" · ") || "Aforo vehicular")}</div>
        <h1 style="margin-top:4px">${esc(a.nombre)}</h1>
      </div>
      <nav class="tabs" role="tablist">${tabs.map(([k, l, i]) => `<button role="tab" aria-selected="${k === tab}" data-tab="${k}">${ico(i)}${l}</button>`).join("")}</nav>
      <div data-panel="${tab}" style="margin-top:18px"></div>`;
    $(".tabs").onclick = (e) => { const b = e.target.closest("[data-tab]"); if (b) location.hash = `aforo/${a.id}/${b.dataset.tab}`; };
    const panel = $(`[data-panel]`);
    ({ campo: panelCampo, tabla: panelTabla, res: panelRes, datos: panelDatos }[tab] || panelCampo)(a, panel);
  }

  /* Captura en campo: el intervalo sale de la hora actual */
  function panelCampo(a, el) {
    el.innerHTML = `
      <div class="card">
        <div class="reloj">
          <div><div class="tiny">Intervalo actual (automático)</div><div class="iv" id="c-iv"></div></div>
          <div class="tot" id="c-tot"></div>
        </div>
        <div class="contadores">${TIPOS.map((t) => `
          <button class="cnt ${t}" data-t="${t}" aria-label="Sumar un ${NOMBRES[t].toLowerCase().replace(/s$/, "")}">
            <span class="mas">+1</span><span class="n" data-n="${t}">0</span><span class="l">${ico(t)}${NOMBRES[t]}</span>
          </button>`).join("")}
        </div>
        <button class="btn deshacer" id="c-undo">${ico("deshacer")}<span>Deshacer</span></button>
        <p class="tiny" style="margin:12px 0 0">Cada toque suma 1 al cuarto de hora en curso según el reloj del celular. Al cambiar de cuarto de hora, el conteo sigue en el intervalo nuevo. Los datos se guardan al instante.</p>
      </div>`;

    let actual = "";
    function pintar() {
      actual = cuartoDeHora(new Date());
      const iv = intervalo(a, actual, false) || {};
      $("#c-iv").textContent = rango(actual);
      for (const t of TIPOS) $(`[data-n="${t}"]`).textContent = iv[t] || 0;
      $("#c-tot").textContent = `${DV.volumenIntervalo(iv)} veh en este intervalo · ${DV.composicion(a.intervalos).total} en total`;
      const u = a.log[a.log.length - 1];
      $("#c-undo").disabled = !u;
      $("#c-undo span").textContent = u ? `Deshacer: ${NOMBRES[u.tipo].toLowerCase()} (${u.t})` : "Deshacer";
    }
    el.querySelector(".contadores").addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]"); if (!b) return;
      const t = cuartoDeHora(new Date());
      intervalo(a, t)[b.dataset.t]++;
      a.log.push({ t, tipo: b.dataset.t });
      if (a.log.length > 500) a.log.shift();
      guardar(); pintar();
      b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash");
      if (navigator.vibrate) navigator.vibrate(12);
    });
    $("#c-undo").onclick = () => {
      const u = a.log.pop(); if (!u) return;
      const iv = intervalo(a, u.t, false);
      if (iv && iv[u.tipo] > 0) iv[u.tipo]--;
      guardar(); pintar(); toast(`Se quitó un registro de ${NOMBRES[u.tipo].toLowerCase()} (${u.t})`);
    };
    pintar();
    relojT = setInterval(() => { if (cuartoDeHora(new Date()) !== actual) pintar(); }, 5000);
  }

  /* Captura digitada */
  function panelTabla(a, el) {
    const ivs = DV.normalizar(a.intervalos);
    a.intervalos = ivs; // los huecos quedan como intervalos en cero, visibles y editables
    const filas = ivs.map((iv, i) => `<tr data-i="${i}">
        <td>${rango(iv.t)}</td>
        ${TIPOS.map((t) => `<td><input type="number" inputmode="numeric" min="0" step="1" data-t="${t}" value="${iv[t] || 0}" aria-label="${NOMBRES[t]} ${iv.t}"></td>`).join("")}
        <td class="b" data-tot>${DV.volumenIntervalo(iv)}</td>
        <td><button class="btn ico ghost danger" data-del aria-label="Eliminar intervalo ${iv.t}">${ico("basura")}</button></td>
      </tr>`).join("");
    const ult = ivs.length ? aHora(aMinutos(ivs[ivs.length - 1].t) + 15) : "07:00";
    el.innerHTML = `
      <div class="card">
        <div class="row" style="justify-content:space-between;margin-bottom:14px">
          <h2 style="margin:0">Conteos por intervalo de 15 min</h2>
          <button class="btn pri" id="t-add">${ico("mas")}Agregar ${rango(ult)}</button>
        </div>
        ${ivs.length ? `<div class="tw"><table>
          <thead><tr><th>Intervalo</th>${TIPOS.map((t) => `<th>${NOMBRES[t]}</th>`).join("")}<th>Total</th><th></th></tr></thead>
          <tbody>${filas}</tbody></table></div>` : `
          <div class="vacio">
            <p style="margin-top:0">Crea la tabla indicando la hora de inicio y cuántos intervalos vas a digitar.</p>
            <div class="row" style="justify-content:center">
              <label class="f" style="margin:0">Hora de inicio<input type="time" step="900" id="t-ini" value="07:00"></label>
              <label class="f" style="margin:0">N.º de intervalos<input type="number" min="1" max="96" id="t-n" value="8" inputmode="numeric"></label>
              <button class="btn pri" id="t-crear" style="align-self:flex-end">Crear tabla</button>
            </div>
          </div>`}
        <p class="tiny" style="margin:12px 0 0">Las horas se ajustan al cuarto de hora (00, 15, 30, 45). Si falta un intervalo entre dos, se agrega en cero para que la hora móvil sea continua.</p>
      </div>`;

    el.oninput = (e) => {
      const inp = e.target.closest("input[data-t]"); if (!inp) return;
      const tr = inp.closest("tr"); const iv = a.intervalos[+tr.dataset.i];
      iv[inp.dataset.t] = Math.max(0, Math.floor(Number(inp.value) || 0));
      tr.querySelector("[data-tot]").textContent = DV.volumenIntervalo(iv);
      guardar();
    };
    el.onclick = (e) => {
      const d = e.target.closest("[data-del]"); if (!d) return;
      const i = +d.closest("tr").dataset.i;
      a.intervalos.splice(i, 1); a.log = a.log.filter((l) => intervalo(a, l.t, false));
      guardar(); panelTabla(a, el);
    };
    const add = $("#t-add", el);
    add.onclick = () => { intervalo(a, ult); guardar(); panelTabla(a, el); };
    const crear = $("#t-crear", el);
    if (crear) crear.onclick = () => {
      const ini = cuartoDeHora(aMinutos($("#t-ini", el).value || "07:00"));
      const n = Math.min(96, Math.max(1, Math.floor(+$("#t-n", el).value || 1)));
      for (let i = 0; i < n; i++) intervalo(a, aHora(aMinutos(ini) + 15 * i));
      guardar(); panelTabla(a, el);
    };
  }

  /* Gráfica SVG de volumen por intervalo, con la hora pico resaltada */
  function grafica(r) {
    const n = r.vols.length; if (!n) return "";
    const W = 760, H = 290, ml = 44, mr = 12, mt = 26, mb = 40;
    const max = Math.max(...r.vols, 1);
    // Paso "redondo" (1, 2 o 5 × 10^k) para unas 4 divisiones
    const bruto = max / 4, mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const paso = [1, 2, 5, 10].map((f) => f * mag).find((x) => x >= bruto);
    const div = Math.ceil(max / paso), tope = paso * div;
    const bw = (W - ml - mr) / n;
    const y = (v) => mt + (H - mt - mb) * (1 - v / tope);
    const pk = r.pico ? r.pico.inicio : -1;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Volumen por intervalo de 15 minutos">`;
    for (let k = 0; k <= div; k++) {
      const v = paso * k;
      s += `<line class="eje" x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}"/><text x="${ml - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    if (pk >= 0) s += `<rect x="${ml + pk * bw}" y="${mt - 22}" width="${bw * 4}" height="${H - mt - mb + 22}" fill="var(--acbg)" rx="4"/><text x="${ml + (pk + 2) * bw}" y="${mt - 8}" text-anchor="middle" style="fill:var(--ac);font-weight:700">Hora pico</text>`;
    const cada = Math.max(1, Math.ceil(n / 12));
    r.vols.forEach((v, i) => {
      const enPico = i >= pk && i < pk + 4 && pk >= 0;
      const h = (H - mt - mb) * (v / tope);
      s += `<rect x="${ml + i * bw + bw * 0.15}" y="${y(v)}" width="${bw * 0.7}" height="${Math.max(h, 0)}" rx="3" fill="${enPico ? "var(--ac)" : "var(--tx3)"}" opacity="${enPico ? 1 : 0.55}"><title>${rango(r.intervalos[i].t)}: ${v} veh</title></rect>`;
      if (i % cada === 0) s += `<text x="${ml + i * bw + bw / 2}" y="${H - mb + 16}" text-anchor="middle">${r.intervalos[i].t}</text>`;
    });
    s += `<text x="${ml}" y="${H - 4}">Inicio del intervalo · veh/15 min</text></svg>`;
    return s;
  }

  function barraComp(c) {
    return `<div class="barra">${TIPOS.map((t) => `<span style="width:${c.pct[t]}%;background:var(--c-${t})" title="${NOMBRES[t]} ${fmt(c.pct[t], 1)} %"></span>`).join("")}</div>
      <div class="ley">${TIPOS.map((t) => `<div><i style="background:var(--c-${t})"></i>${NOMBRES[t]}: <b>${fmt(c.pct[t], 1)} %</b> <span class="tiny">(${fmt(c.totales[t])})</span></div>`).join("")}</div>`;
  }

  /* Resultados */
  function panelRes(a, el) {
    const r = DV.analizar(a);
    if (!r.intervalos.length) {
      el.innerHTML = `<div class="vacio">Aún no hay conteos. Registra datos en <a href="#aforo/${a.id}/campo">Campo</a> o en <a href="#aforo/${a.id}/tabla">Tabla</a>.</div>`;
      return;
    }
    const p = r.pico;
    const iniP = p ? r.intervalos[p.inicio].t : null;
    const filas = r.intervalos.map((iv, i) => `<tr class="${p && i >= p.inicio && i < p.inicio + 4 ? "pk" : ""}">
      <td>${rango(iv.t)}</td>${TIPOS.map((t) => `<td>${fmt(iv[t] || 0)}</td>`).join("")}<td class="b">${fmt(r.vols[i])}</td><td>${r.horas[i] != null ? fmt(r.horas[i]) : ""}</td></tr>`).join("");

    el.innerHTML = `
      <div class="solo-print" style="margin-bottom:10px"><h1>${esc(a.nombre)}</h1><p class="muted">${esc([a.lugar, a.fecha, a.sentido && "Sentido " + a.sentido].filter(Boolean).join(" · "))} · Generado con DemandaVial (herramienta preliminar y académica).</p></div>
      <div class="row no-print" style="justify-content:flex-end;margin-bottom:14px">
        <button class="btn" id="r-csv">${ico("csv")}Exportar CSV</button>
        <button class="btn" id="r-imp">${ico("imp")}Imprimir o PDF</button>
      </div>
      <div class="kpis">
        <div class="kpi ac"><small>Hora pico</small><b>${p ? rango(iniP, 60) : "—"}</b><span>${p ? "Hora móvil de mayor volumen" : "Se necesitan 4 intervalos"}</span></div>
        <div class="kpi"><small>Volumen hora pico</small><b>${p ? fmt(p.vhp) : "—"}</b><span>veh/h</span></div>
        <div class="kpi ac"><small>FHP</small><b>${p && p.fhp != null ? fmt(p.fhp, 3) : "—"}</b><span>${p ? `${fmt(p.vhp)} / (4 × ${fmt(p.qmax)})` : ""}</span></div>
        <div class="kpi"><small>Máx. 15 min en hora pico</small><b>${p ? fmt(p.qmax) : "—"}</b><span>${p ? `Flujo equivalente ${fmt(p.tasaFlujo)} veh/h` : ""}</span></div>
        <div class="kpi"><small>Volumen total</small><b>${fmt(r.comp.total)}</b><span>${r.intervalos.length} intervalos (${fmt(r.intervalos.length / 4, 2)} h)</span></div>
        <div class="kpi"><small>Pesados</small><b>${fmt(r.comp.pctPesados, 1)} %</b><span>Buses + camiones</span></div>
      </div>

      <section class="card chart"><h3>Volumen por intervalo de 15 minutos</h3>${grafica(r)}</section>

      <section class="grid g2">
        <div class="card"><h3>Composición vehicular — aforo completo</h3>${barraComp(r.comp)}</div>
        <div class="card"><h3>Composición vehicular — hora pico</h3>${r.picoComp ? barraComp(r.picoComp) + `<p class="tiny" style="margin:10px 0 0">Pesados en la hora pico: <b>${fmt(r.picoComp.pctPesados, 1)} %</b></p>` : '<p class="muted">Se necesitan al menos 4 intervalos.</p>'}</div>
      </section>

      <section class="grid g2">
        <div class="card" id="proy">
          <h3>Proyección de la demanda <span class="pill est" style="margin-left:6px;letter-spacing:0;text-transform:none">Estimación</span></h3>
          <div class="f2">
            <label class="f">Tasa de crecimiento anual i (%)<input type="number" step="0.1" inputmode="decimal" data-p="i" value="${esc(a.proy.i)}" placeholder="Ej.: 3"></label>
            <label class="f">Años n<input type="number" step="1" min="0" inputmode="numeric" data-p="n" value="${esc(a.proy.n)}" placeholder="Ej.: 10"></label>
          </div>
          <div id="proy-out"></div>
          <div class="nota">V<sub>n</sub> = V·(1+i)<sup>n</sup> supone crecimiento geométrico constante. La tasa debe justificarse con series históricas o estudios de la zona; el resultado es una estimación preliminar.</div>
        </div>
        <div class="card" id="equiv">
          <h3>Vehículos equivalentes (opcional)</h3>
          <p class="tiny" style="margin-top:0">Ingresa un factor para cada tipo y la fuente de donde lo tomas. La herramienta no propone valores.</p>
          <div class="f2">${TIPOS.map((t) => `<label class="f">Factor ${NOMBRES[t].toLowerCase()}<input type="number" step="0.01" min="0" inputmode="decimal" data-f="${t}" value="${esc(a.factores[t])}"></label>`).join("")}</div>
          <label class="f">Fuente de los factores<input data-ff value="${esc(a.fuenteFactores)}" placeholder="Ej.: libro, manual o estudio, con página o tabla" maxlength="160"></label>
          <div id="equiv-out"></div>
        </div>
      </section>

      <section class="card">
        <h3>Tabla resumen</h3>
        <div class="tw"><table>
          <thead><tr><th>Intervalo</th>${TIPOS.map((t) => `<th>${NOMBRES[t]}</th>`).join("")}<th>Total 15 min</th><th>Hora móvil desde aquí</th></tr></thead>
          <tbody>${filas}</tbody>
          <tfoot><tr><td class="b">Total</td>${TIPOS.map((t) => `<td class="b">${fmt(r.comp.totales[t])}</td>`).join("")}<td class="b">${fmt(r.comp.total)}</td><td></td></tr></tfoot>
        </table></div>
        <p class="tiny" style="margin:10px 0 0">Las filas resaltadas forman la hora pico. «Hora móvil desde aquí» es la suma de ese intervalo y los tres siguientes.</p>
      </section>
      <p class="tiny">Resultados preliminares con fines académicos. FHP según la definición del Highway Capacity Manual (TRB) y el FHMD de Cal y Mayor y Cárdenas; ver fuentes en la página de inicio.</p>`;

    function proy() {
      const i = parseFloat(String(a.proy.i).replace(",", ".")), n = parseFloat(a.proy.n);
      const out = $("#proy-out", el);
      if (!p || !Number.isFinite(i) || !Number.isFinite(n)) { out.innerHTML = `<p class="muted" style="margin:0">${p ? "Ingresa i y n para estimar el volumen de la hora pico futura." : "Se necesita una hora pico."}</p>`; return; }
      const vT = DV.proyeccion(r.comp.total, i / 100, n), vP = DV.proyeccion(p.vhp, i / 100, n);
      out.innerHTML = vP == null ? '<p class="muted">Valores no válidos.</p>' : `<div class="kpis" style="margin-top:4px">
        <div class="kpi"><small>Hora pico en ${fmt(n)} años</small><b>≈ ${fmt(vP)}</b><span>veh/h (estimado)</span></div>
        <div class="kpi"><small>Volumen del periodo aforado</small><b>≈ ${fmt(vT)}</b><span>veh (estimado)</span></div></div>`;
    }
    function equiv() {
      const out = $("#equiv-out", el);
      const e = DV.equivalentes(r.comp.totales, a.factores);
      const eP = r.picoComp ? DV.equivalentes(r.picoComp.totales, a.factores) : null;
      out.innerHTML = e == null ? '<p class="muted" style="margin:0">Completa los cuatro factores para calcular.</p>' : `<div class="kpis">
        <div class="kpi"><small>Equivalentes en hora pico</small><b>${eP == null ? "—" : fmt(eP, 1)}</b><span>veh eq/h</span></div>
        <div class="kpi"><small>Equivalentes en el aforo</small><b>${fmt(e, 1)}</b><span>veh eq</span></div></div>
        ${a.fuenteFactores ? `<p class="tiny" style="margin:8px 0 0">Factores tomados de: ${esc(a.fuenteFactores)}</p>` : '<p class="tiny" style="margin:8px 0 0;color:var(--warn)">Indica la fuente de los factores.</p>'}`;
    }
    proy(); equiv();
    el.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.p) { a.proy[t.dataset.p] = t.value; guardar(); proy(); }
      else if (t.dataset.f) { a.factores[t.dataset.f] = t.value; guardar(); equiv(); }
      else if ("ff" in t.dataset) { a.fuenteFactores = t.value; guardar(); equiv(); }
    });
    $("#r-imp", el).onclick = () => window.print();
    $("#r-csv", el).onclick = () => {
      const blob = new Blob(["﻿" + DV.aCSV(a)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = (a.nombre || "aforo").replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, "").trim().replace(/\s+/g, "_") + ".csv";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }

  /* Datos del aforo */
  function panelDatos(a, el) {
    el.innerHTML = `
      <div class="card" style="max-width:620px">
        <h3>Datos del aforo</h3>
        <form id="f-datos">
          <label class="f">Nombre<input name="nombre" value="${esc(a.nombre)}" required maxlength="90"></label>
          <label class="f">Lugar<input name="lugar" value="${esc(a.lugar)}" maxlength="90"></label>
          <div class="f2">
            <label class="f">Fecha<input name="fecha" type="date" value="${esc(a.fecha)}"></label>
            <label class="f">Sentido<input name="sentido" value="${esc(a.sentido)}" maxlength="40"></label>
          </div>
          <div class="row"><button class="btn pri">Guardar cambios</button></div>
        </form>
        <hr style="border:0;border-top:1px solid var(--line);margin:22px 0">
        <h3 style="color:var(--bad)">Eliminar</h3>
        <p class="tiny" style="margin-top:0">Se borra este aforo de este navegador. No se puede recuperar; exporta el CSV antes si lo necesitas.</p>
        <button class="btn danger" id="d-del">${ico("basura")}Eliminar aforo</button>
      </div>`;
    $("#f-datos", el).onsubmit = (e) => {
      e.preventDefault();
      Object.assign(a, Object.fromEntries(new FormData(e.target)));
      guardar(); toast("Datos guardados"); route();
    };
    $("#d-del", el).onclick = () => {
      if (!confirm(`¿Eliminar el aforo «${a.nombre}»? Esta acción no se puede deshacer.`)) return;
      db.aforos = db.aforos.filter((x) => x.id !== a.id); guardar(); location.hash = "inicio";
    };
  }

  cargar();
  route();
})();
