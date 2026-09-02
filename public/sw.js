// Service worker de Neotérmica (PWA del área privada: admin y técnicos).
// Solo interviene en /administrator y /tecnico. El front público queda intacto.
// Sube CACHE_VERSION al cambiar la estrategia.
const CACHE_VERSION = "neotermica-priv-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ¿Pertenece la URL al área privada gestionada por la PWA?
function esAreaPrivada(pathname) {
  return (
    pathname.startsWith("/administrator") || pathname.startsWith("/tecnico")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const dentroDelArea = esAreaPrivada(url.pathname);

  // Navegaciones del área privada: red primero → caché → página offline.
  if (request.mode === "navigate") {
    if (!dentroDelArea) return; // Front público: sin intervención.
    // No cachear API bajo el área.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Estáticos de Next (chunks/CSS) e iconos: caché primero con refresco.
  // Compartidos por todo el sitio, así que la app privada funcione offline.
  const esEstatico =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);

  if (!esEstatico) return; // API y datos: siempre red.

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
