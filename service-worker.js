// ============================================================
// OPT TAG PRO — SERVICE WORKER / PWA
// VERSÃO 4.1.1
// ============================================================

const CACHE_NAME = "opt-tag-pro-v4.1.1";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./service-worker.js"
];

// ============================================================
// INSTALAÇÃO
// ============================================================
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ============================================================
// ATIVAÇÃO
// REMOVE CACHES DE VERSÕES ANTIGAS.
// ============================================================
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames =>
                Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ============================================================
// REQUISIÇÕES
// ============================================================
self.addEventListener("fetch", event => {

    if (!event.request.url.startsWith("http")) {
        return;
    }

    const url = event.request.url;

    // NÃO INTERCEPTAR COMUNICAÇÕES DO FIREBASE.
    if (
        url.includes("firebaseio.com") ||
        url.includes("firestore.googleapis.com") ||
        url.includes("googleapis.com") ||
        url.includes("gstatic.com")
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {

                if (
                    response &&
                    response.status === 200 &&
                    response.type !== "opaque"
                ) {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseClone);
                        });
                }

                return response;
            })
            .catch(() => {

                return caches.match(event.request)
                    .then(cachedResponse => {

                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        if (event.request.mode === "navigate") {
                            return caches.match("./index.html");
                        }

                        return new Response(
                            "Conteúdo indisponível offline.",
                            {
                                status: 503,
                                statusText: "Offline"
                            }
                        );
                    });
            })
    );
});
