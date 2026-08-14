// ============================================================
// OPT TAG PRO — SERVICE WORKER / PWA
// VERSÃO 4.1.13
// ============================================================

// ALTERE ESTA VERSÃO A CADA RELEASE DO APLICATIVO.
// O SERVICE WORKER E O APP SHELL SÃO ARQUIVOS DA APLICAÇÃO.
// DADOS DE PRODUTOS FICAM NO LOCALSTORAGE/FIRESTORE E NÃO SÃO
// APAGADOS POR ESTE SERVICE WORKER.
const CACHE_NAME = "opt-tag-pro-v4.1.13";

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
// MENSAGEM DO APLICATIVO
// PERMITE QUE O BOTÃO "ATUALIZAR AGORA" ATIVE O NOVO WORKER.
// ============================================================
self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// ============================================================
// ATIVAÇÃO
// REMOVE SOMENTE CACHES ANTIGOS DO PRÓPRIO APLICATIVO.
// NÃO TOCA EM LOCALSTORAGE, INDEXEDDB OU FIRESTORE.
// ============================================================
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames =>
                Promise.all(
                    cacheNames
                        .filter(cacheName =>
                            cacheName.startsWith("opt-tag-pro-") &&
                            cacheName !== CACHE_NAME
                        )
                        .map(cacheName => caches.delete(cacheName))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ============================================================
// REQUISIÇÕES
// ESTRATÉGIA:
// 1. FIREBASE/GOOGLE: NÃO INTERCEPTAR.
// 2. NAVEGAÇÃO: REDE PRIMEIRO; CACHE COMO FALLBACK.
// 3. DEMAIS RECURSOS: REDE PRIMEIRO; CACHE COMO FALLBACK.
// 4. RESPOSTAS VÁLIDAS SÃO ARMAZENADAS NO CACHE ATUAL.
// ============================================================
self.addEventListener("fetch", event => {
    if (!event.request.url.startsWith("http")) {
        return;
    }

    const url = event.request.url;

    // NÃO INTERCEPTAR COMUNICAÇÕES DO FIREBASE/GOOGLE.
    if (
        url.includes("firebaseio.com") ||
        url.includes("firestore.googleapis.com") ||
        url.includes("googleapis.com") ||
        url.includes("gstatic.com")
    ) {
        return;
    }

    // NÃO CACHEAR version.json.
    // O INDEX.HTML JÁ FAZ A CONSULTA COM cache:'no-store'.
    if (new URL(url).pathname.endsWith("/version.json")) {
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
                        .then(cache => cache.put(event.request, responseClone))
                        .catch(() => {});
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
