// Service minimal : permet d'installer la page comme une application.
// Rien n'est mis en cache : la page vient toujours du réseau (toujours la dernière version).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><body style='font-family:sans-serif;background:#0B1724;color:#fff;text-align:center;padding:3rem 1rem'><h2>Hors ligne</h2><p>Vérifiez la connexion Internet, puis réessayez.</p>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
