javascript
/* eslint-disable no-restricted-globals */

// Questo service worker è una versione semplificata
// È possibile personalizzarlo ulteriormente a seconda delle esigenze

const CACHE_NAME = 'turni-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Installa e precacheia le risorse
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Attiva e pulisci le vecchie cache
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Gestisci le richieste di rete con strategia "Cache, falling back to network"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // La risorsa è nella cache
        if (response) {
          return response;
        }

        // Non è nella cache, recuperala dalla rete
        return fetch(event.request)
          .then((response) => {
            // Controlla se abbiamo ricevuto una risposta valida
            if (!response  response.status !== 200  response.type !== 'basic') {
              return response;
            }

            // Clona la risposta
            const responseToCache = response.clone();
// Aggiungi la risposta alla cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});
