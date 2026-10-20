# DemandaVial — decisiones del proyecto

App web de una sola página para el **análisis preliminar de aforos y demanda de tránsito**. La hace
Julián García (estudiante de Ingeniería Civil, UNAL Bogotá) como parte de su postulación a un
posgrado en vías y tránsito. Sigue el estilo de trabajo de su app anterior, **Malla**
(https://malla-un.netlify.app, github.com/jgvrxiv/malla-un).

> **Idioma:** todo (app, docs, comentarios, commits) en español colombiano, **sin voseo**
> ("ingresa", no "ingresá").

## Reglas que no se negocian

- **Herramienta preliminar y académica.** Nada de lenguaje de "cumplimiento normativo", "según
  norma", "aprobado" ni parecido. Los resultados son de apoyo.
- **No inventar valores técnicos.** No hay factores de equivalencia por defecto: los ingresa el
  usuario con su fuente. Lo mismo para la tasa de crecimiento.
- **Toda fórmula con fuente citable**, citada en la app (sección Fuentes de la página de inicio) y
  en el README.
- **Validación con ejercicios publicados** en `casos.js`. Si se agrega o cambia un cálculo, se
  agrega un caso o una prueba. `npm test` debe pasar antes de cada commit.
- **Autoría honesta:** concepción, reglas técnicas, validación y pruebas son del autor; la
  implementación se hizo con asistencia de IA (Claude, de Anthropic). Así aparece en el pie de la
  app, el README y el PDF de soporte.
- **Estética de Malla:** Montserrat, tema oscuro por defecto con alternador a claro, **sin emojis**,
  iconos SVG inline (objeto `P` en `app.js`).
- Sin frameworks, sin build, sin dependencias en tiempo de ejecución (solo la fuente de Google Fonts).

## Estructura

- `index.html`: HTML y todo el CSS (variables en `:root` y `[data-tema="claro"]`, `@media print`).
- `calc.js`: funciones puras (`window.DV` en el navegador, `module.exports` en Node).
- `casos.js`: casos de validación (`window.DVCasos`) y `correrCaso()`; los usan las pruebas y la
  sección «Validación» de la app.
- `app.js`: interfaz. Router por hash: `#inicio` y `#aforo/<id>/<pestaña>` con pestañas `campo`,
  `tabla`, `res` (resultados) y `datos`.
- `tests/calc.test.js`: `node --test tests/`.
- `serve.mjs`: servidor estático de desarrollo (puerto 4180). `.claude/launch.json` lo usa.

## Decisiones técnicas

- **Intervalo = cuarto de hora**, identificado por su hora de inicio `"HH:MM"` (00, 15, 30, 45).
- **Hora pico móvil:** se evalúan todas las ventanas de 4 intervalos consecutivos; gana la de
  mayor volumen y, si hay empate, la primera. `Qmáx15` se toma **dentro** de la hora pico
  (no del aforo completo). FHP = VHP / (4·Qmáx15). Con menos de 4 intervalos no hay hora pico.
- **Huecos:** `normalizar()` rellena con intervalos en cero los cuartos de hora que falten entre el
  primero y el último, para que la ventana móvil sea continua. La tabla los muestra y se pueden
  editar o eliminar.
- **No se manejan aforos que crucen la medianoche** (el orden es por minutos del día).
- **Captura en campo:** cada toque guarda `{t, tipo}` en `aforo.log` (máx. 500) para deshacer en
  orden inverso, aunque el toque haya sido en un intervalo anterior. El intervalo se recalcula cada
  5 s con el reloj del dispositivo.
- **Proyección:** `V·(1+i)^n` sobre el VHP y sobre el volumen total del periodo. Siempre con la
  etiqueta «Estimación».
- **Equivalentes:** `DV.equivalentes()` devuelve `null` si falta cualquier factor.
- **CSV:** separador `;`, coma decimal y BOM UTF-8 para que Excel en español lo abra bien.
- **Imprimir/PDF:** `@media print` deja solo el panel de resultados con encabezado del aforo.
- **Almacenamiento:** `localStorage["demandavial.v1"] = { aforos: [...] }` y
  `localStorage["demandavial.tema"]`. Si se cambia el esquema, subir la versión de la clave y
  migrar.

## Pendientes conocidos

- El caso de Cal y Mayor (ej. 8.6) usa los datos del enunciado; el autor debe cotejar el resultado
  (FHMD15 = 0,792) con la solución impresa de su edición del libro.
- Ideas: aforo por movimientos en intersección, importar CSV, varias estaciones en un mismo
  estudio.

## Publicación

- Repositorio público `github.com/jgvrxiv/demandavial`, commits con el correo noreply de GitHub
  (`334745040+jgvrxiv@users.noreply.github.com`).
- Netlify conectado al repositorio (rama `main`, sin build, `netlify.toml`).
