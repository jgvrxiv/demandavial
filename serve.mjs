// Servidor estático mínimo para desarrollo: node serve.mjs → http://localhost:4180
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
const raiz = process.cwd();
createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const archivo = normalize(join(raiz, ruta === "/" ? "index.html" : ruta));
  if (!archivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try { const d = await readFile(archivo); res.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream" }).end(d); }
  catch { res.writeHead(404).end("No encontrado"); }
}).listen(4180, () => console.log("DemandaVial en http://localhost:4180"));
