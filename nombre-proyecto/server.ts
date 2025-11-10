import { handleApiRequest } from "./backend/routes.ts";

Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);
  let filepath = url.pathname;

  // Manejar rutas de API
  if (filepath.startsWith("/api/")) {
    return await handleApiRequest(req);
  }

  // Si es la raíz, servir index.html
  if (filepath === "/") {
    filepath = "/index.html";
  }

  try {
    let file;
    let realPath;

    // Determinar desde qué carpeta servir
    if (filepath.startsWith("/styles/")) {
      realPath = `.${filepath}`;
    } else {
      realPath = `./frontend${filepath}`;
    }

    file = await Deno.readFile(realPath);

    const contentType = getContentType(filepath);

    return new Response(file, {
      headers: { "content-type": contentType },
    });
  } catch {
    return new Response("404 - Página no encontrada", { status: 404 });
  }
});

function getContentType(path: string): string {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "text/plain";
}

console.log("🦕 Servidor corriendo en http://localhost:3000");
console.log("📡 API disponible en http://localhost:3000/api/tasks");