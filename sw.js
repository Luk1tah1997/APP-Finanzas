// sw.js - Service Worker de Mis Finanzas
/* eslint-disable no-restricted-globals */

// Nombre de la caché. Actualizá el sufijo cuando cambies archivos estáticos importantes.
var CACHE_NAME = 'mis-finanzas-v3.0.0';

// Recursos que se precargan para poder trabajar offline.
var PRECACHE_URLS = [
  'index.html',
  'manifest.json',
  'css/styles.css',
  'img/logo.png',
  'img/logo.jpg',
  'img/logo-mf.svg',
  'js/app_legacy_v2.8.0.js',
  'js/backup.js',
  'js/calendario.js',
  'js/categorias.js',
  'js/config.js',
  'js/core.js',
  'js/dashboard.js',
  'js/filtros.js',
  'js/herramientas.js',
  'js/init.js',
  'js/movimientos.js',
  'js/timeline.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js'
];

// Instalación: precache de los recursos básicos.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );

  // Forzamos que el SW pase al estado "activate" lo antes posible
  self.skipWaiting();
});

// Activación: limpieza de cachés antiguas.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// Estrategia de fetch:
// - Para HTML (navegación): network-first con fallback a caché (offline).
// - Para el resto (CSS/JS/img, etc.): cache-first con actualización en segundo plano.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }

  var request = event.request;
  var acceptHeader = request.headers.get('accept') || '';

  // Peticiones de navegación / HTML
  if (acceptHeader.indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(request)
        .then(function (networkResponse) {
          // Guardamos la versión más reciente en caché
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(function () {
          // Sin conexión: devolvemos lo que haya en caché o el index.html
          return caches.match(request).then(function (cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('index.html');
          });
        })
    );
    return;
  }

  // Recursos estáticos: cache-first
  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(function (networkResponse) {
          // Guardamos en caché para próximas veces
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(function () {
          // Si falla y no lo teníamos en caché devolvemos el error por defecto
          return Promise.reject();
        });
    })
  );
});
