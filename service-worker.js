// Define un nombre y versión para el caché
const CACHE_NAME = 'ecotrack-cache-v3'; // Incrementamos la versión para forzar la actualización

// Lista de archivos que se guardarán en caché (el "App Shell")
// Se ha actualizado la lista de iconos a los nuevos tamaños.
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512x512.png',
  '/icon-128x128.png'
];

// Evento 'install': Se dispara cuando el service worker se instala por primera vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  // Hacemos la instalación más robusta. Si un archivo (como un icono) falla,
  // los demás todavía se guardarán en caché.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo caché y guardando archivos del App Shell');
        const promises = urlsToCache.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
            // Si el archivo no se encuentra (404), simplemente lo ignoramos y continuamos.
            console.warn(`Service Worker: No se pudo cachear ${url}. Estado: ${response.status}`);
          }).catch(err => {
            // Ignoramos errores de fetch para archivos individuales (ej. iconos faltantes)
             console.error(`Service Worker: Falló el fetch para cachear ${url}`, err);
          });
        });
        return Promise.all(promises);
      })
  );
});

// Evento 'fetch': Se dispara cada vez que la aplicación hace una petición de red.
self.addEventListener('fetch', event => {
  // Ignoramos las peticiones a la API para que siempre vayan a la red
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Respondemos con una estrategia "Cache First" (Primero caché, si no, red)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en el caché, la devolvemos
        if (response) {
          return response;
        }

        // Si no está en caché, la pedimos a la red
        return fetch(event.request);
      })
  );
});

// Evento 'activate': Se usa para limpiar cachés antiguos si la versión cambia.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Elimina cualquier caché que no sea la actual
          return cacheName.startsWith('ecotrack-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

