// =================================================================
// SERVICE WORKER - OPT TAG PRO 2.0 ENTERPRISE (KODA SISTEMAS)
// Motor Offline: cacheia o app e as bibliotecas externas (CDN) na
// primeira abertura, garantindo funcionamento mesmo sem internet
// (galpões, depósitos, subsolos, etc).
// =================================================================

const CACHE_NAME = 'koda-tagpro-v2';

// Arquivos do próprio app + bibliotecas locais (não dependem mais de CDN).
// Copie os arquivos das bibliotecas pra pasta libs/ com esses nomes exatos.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './libs/jsbarcode.min.js',
    './libs/html5-qrcode.min.js'
];

// --- INSTALAÇÃO: GRAVA O CACHE INICIAL ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .catch((err) => console.warn('[KODA SW] Falha ao pré-cachear algum recurso:', err))
    );
    self.skipWaiting();
});

// --- ATIVAÇÃO: REMOVE CACHES DE VERSÕES ANTERIORES DO APP ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// --- INTERCEPTAÇÃO DE REDE: CACHE-FIRST COM FALLBACK OFFLINE ---
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Só intercepta GET. POST/PUT/DELETE seguem direto pra rede
    // (não fazem sentido em cache e este app não usa nenhum).
    if (request.method !== 'GET') return;

    // Ignora esquemas que o Cache API não suporta (ex: chrome-extension://)
    if (!request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(request)
                .then((networkResponse) => {
                    // Guarda uma cópia no cache pra próxima vez que
                    // estiver offline (só respostas válidas).
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Sem rede e sem cache: se for navegação de página,
                    // devolve o index.html pra o app continuar abrindo.
                    if (request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});
