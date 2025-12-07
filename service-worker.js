const CACHE_NAME = 'pwa-geoweather-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instala e faz cache do "shell" da aplicação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Estratégia: cache-first para arquivos estáticos; network-first para a API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Se for chamada para a API de clima (open-meteo), tente a rede primeiro
  if (url.hostname.includes('api.open-meteo.com')) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          // opcional: clonar e salvar em cache se quiser
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para outros recursos: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(networkResp => {
        // Armazenar em cache para uso offline futuro
        return caches.open(CACHE_NAME).then(cache => {
          // Evitar cache de requisições cross-site ou data: URIs
          try {
            cache.put(event.request, networkResp.clone());
          } catch (e) {
            // ignorar quando não der para cachear
          }
          return networkResp;
        });
      });
    }).catch(() => {
      // fallback: se for navegação para página, retornar index.html
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
