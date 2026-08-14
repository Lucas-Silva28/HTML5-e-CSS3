// OPT TAG PRO — SERVICE WORKER / PWA
// VERSÃO 4.1.14

const CACHE_NAME = "opt-tag-pro-v4.1.14";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./service-worker.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(name => name.startsWith("opt-tag-pro-") && name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (!event.request.url.startsWith("http")) return;

    const url = event.request.url;

    if (
        url.includes("firebaseio.com") ||
        url.includes("firestore.googleapis.com") ||
        url.includes("googleapis.com") ||
        url.includes("gstatic.com")
    ) return;

    if (new URL(url).pathname.endsWith("/version.json")) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type !== "opaque") {
                    const clone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, clone))
                        .catch(() => {});
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.mode === "navigate") return caches.match("./index.html");
                    return new Response("Conteúdo indisponível offline.", {
                        status: 503,
                        statusText: "Offline"
                    });
                })
            )
    );
});
