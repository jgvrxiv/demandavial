# DemandaVial

Herramienta web, preliminar y académica, para registrar **aforos vehiculares** por intervalos de
15 minutos y obtener la **hora pico móvil**, el **factor de hora pico (FHP)**, la **composición
vehicular** y una **proyección** de la demanda.

- Sitio: <https://demandavial.netlify.app>
- Funciona en el celular, sin cuentas ni servidor: los datos quedan en el navegador (`localStorage`).

> DemandaVial es un apoyo para el análisis preliminar y el estudio de la ingeniería de tránsito.
> No reemplaza un estudio de tránsito ni el criterio profesional, y no constituye una verificación
> normativa.

## Funciones

**Captura**
- **En campo:** cuatro botones grandes (autos, motos, buses, camiones) que suman +1 al cuarto de
  hora en curso según el reloj del celular, con botón para deshacer.
- **Digitada:** tabla por intervalos de 15 minutos para conteos ya hechos.
- Varios aforos guardados, cada uno con nombre, lugar, fecha y sentido.

**Cálculos**
- Volumen por intervalo y volumen horario móvil (desde cada cuarto de hora).
- **Hora pico:** los 4 intervalos consecutivos de mayor volumen; puede empezar en cualquier cuarto
  de hora. Si hay empate, se toma la primera.
- **FHP = VHP / (4 × Qmáx15)**, con Qmáx15 el mayor volumen de 15 min dentro de la hora pico.
- Composición vehicular en % y porcentaje de pesados (buses + camiones), del aforo completo y de
  la hora pico.
- **Proyección** `V·(1+i)^n`, con la tasa `i` y los años `n` que ingresa el usuario. Se presenta
  como estimación.
- **Vehículos equivalentes (opcional):** solo con factores que ingresa el usuario junto con su
  fuente. La herramienta no trae valores por defecto.

**Salida**
- Gráfica SVG propia de volumen por intervalo con la hora pico resaltada.
- Tabla resumen, impresión o PDF desde el navegador y exportación a CSV (separador `;`, coma
  decimal, se abre directo en Excel en español).

## Validación

Los cálculos se comparan con ejercicios resueltos publicados. Los casos están en
[`casos.js`](casos.js), corren como pruebas automáticas y también se recalculan en vivo en la
sección «Validación» de la app.

| Caso | Fuente | Resultado esperado |
|---|---|---|
| 10 intervalos de 15 min (16:00–18:30) | Mathew, IIT Bombay (NPTEL) | Hora pico 17:00–18:00, VHP 219, Qmáx 65, FHP 0,84 |
| 12 volúmenes de 5 min agregados en cuartos de hora | Cal y Mayor y Cárdenas, ej. 8.6 | VHMD 526, Qmáx15 166, FHMD15 0,792 * |
| Hora con un cuarto de hora dominante | Miovision | VHP 650, Qmáx 200, FHP 0,81 |
| Hora con flujo uniforme | Miovision | VHP 770, Qmáx 200, FHP 0,96 |

\* El resultado del caso de Cal y Mayor se obtuvo aplicando la fórmula del libro a los datos del
enunciado. Falta cotejarlo con la solución impresa en la edición que se use.

Además hay pruebas propias (22 en total) que cubren:

- **FHP:** Qmáx15 tomado dentro de la hora pico; FHP = 0,25 cuando todo el volumen cae en un solo
  cuarto de hora.
- **Hora pico móvil:** ventana de 4 intervalos que empieza fuera de la hora en punto; relleno de
  huecos con ceros para que la ventana sea continua.
- **Proyección:** crecimiento compuesto año a año (igual a multiplicar n veces por 1+i y mayor que
  el lineal); datos no válidos no dan número.
- **Composición:** los porcentajes suman 100 %, y los mostrados con un decimal suman exactamente
  100,0 % (redondeo por residuos mayores).
- **Entradas vacías o en cero:** campos vacíos, texto o negativos cuentan como cero; un aforo sin
  vehículos no reporta hora pico, FHP ni composición; ningún resultado ni el CSV contiene NaN o
  infinito.

```bash
npm test
```

(Requiere Node.js 18 o superior; no hay dependencias.)

## Fuentes

1. Transportation Research Board (TRB). *Highway Capacity Manual*, 7.ª ed. National Academies,
   2022. Definición del factor de hora pico y de la tasa de flujo de 15 minutos.
2. Cal y Mayor, R. y Cárdenas, J. *Ingeniería de tránsito: fundamentos y aplicaciones*.
   Alfaomega. Capítulo 8: volúmenes de tránsito y factor de la hora de máxima demanda (FHMD).
3. Mathew, T. V. *Measurement at a Point*. Lecture Notes in Transportation Systems Engineering,
   Departamento de Ingeniería Civil, IIT Bombay (NPTEL).
   <https://www.civil.iitb.ac.in/tvm/nptel/521_TrVolume/web/web.html>
4. Miovision. *Peak Hour Factor (PHF) Explained*.
   <https://help.miovision.com/s/article/Peak-Hour-Factor-PHF-Explained>

## Desarrollo

```bash
npm run dev     # http://localhost:4180
```

No hay paso de compilación. Archivos:

- `index.html`: estructura y estilos (tema oscuro por defecto, alternador a claro).
- `calc.js`: cálculos como funciones puras, compartidas por la app y las pruebas.
- `casos.js`: casos de validación con su fuente.
- `app.js`: interfaz (rutas, captura, tablas, gráfica, exportación).
- `tests/calc.test.js`: pruebas con `node:test`.

La publicación se hace en Netlify desde la rama `main`, sin build (`netlify.toml`).

## Autoría

Concepción del producto, reglas técnicas, validación y pruebas: **Julián García**, estudiante de
Ingeniería Civil de la Universidad Nacional de Colombia (Bogotá). La implementación se hizo con
asistencia de inteligencia artificial (Claude, de Anthropic).

Proyecto independiente con fines académicos. Licencia MIT.
