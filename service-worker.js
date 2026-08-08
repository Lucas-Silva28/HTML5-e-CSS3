// ============================================================
// OPT TAG PRO — SERVICE WORKER / PWA
// VERSÃO 4.1.1
// RESPONSÁVEL PELO CACHE E FUNCIONAMENTO BÁSICO OFFLINE
// ============================================================

// NOME DO CACHE.
// ALTERE A VERSÃO QUANDO PRECISAR FORÇAR UMA ATUALIZAÇÃO.
const CACHE_NAME = "opt-tag-pro-v4.1.1";

// ARQUIVOS PRINCIPAIS QUE PODEM SER ARMAZENADOS EM CACHE.
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./service-worker.js"
];

// ============================================================
// INSTALAÇÃO DO SERVICE WORKER
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
// REMOVE CACHES ANTIGOS PARA EVITAR CONFLITOS ENTRE VERSÕES.
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
// INTERCEPTAÇÃO DAS REQUISIÇÕES
//
// PRIMEIRO TENTA PEGAR O CONTEÚDO DA INTERNET.
// SE ESTIVER OFFLINE, USA O CACHE.
// ============================================================
self.addEventListener("fetch", event => {

    // NÃO INTERCEPTAR REQUISIÇÕES QUE NÃO SEJAM HTTP/HTTPS.
    if (!event.request.url.startsWith("http")) {
        return;
    }

    // NÃO INTERCEPTAR REQUISIÇÕES DO FIREBASE/FIRESTORE.
    // O FIREBASE PRECISA GERENCIAR SUA PRÓPRIA COMUNICAÇÃO.
    const url = event.request.url;

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

                // SALVA UMA CÓPIA DAS RESPOSTAS VÁLIDAS.
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

                // SEM INTERNET:
                // TENTA RECUPERAR O ARQUIVO DO CACHE.
                return caches.match(event.request)
                    .then(cachedResponse => {

                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // SE FOR UMA NAVEGAÇÃO E NÃO EXISTIR CACHE,
                        // TENTA ENTREGAR O INDEX.HTML.
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
