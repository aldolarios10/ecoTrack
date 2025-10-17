// Define un nombre y versión para el caché
const CACHE_NAME = 'ecotrack-cache-v4'; // Incrementamos la versión para forzar la actualización

// Lista de archivos que se guardarán en caché (el "App Shell")
// Se ha actualizado la lista de iconos a los nuevos tamaños.
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512x512.png',
  '/icon-128x128.png',
  '/widgets/ecotrack-template.json',
  '/widgets/ecotrack-data.json'
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
// Widget event handlers for PWA widget functionality
self.addEventListener("widgetinstall", event => {
  console.log("Widget installed:", event.widget.definition.tag);
  event.waitUntil(renderWidget(event.widget));
});

self.addEventListener("widgetuninstall", event => {
  console.log("Widget uninstalled:", event.widget.definition.tag);
});

self.addEventListener("widgetclick", event => {
  console.log("Widget clicked:", event.action);

  switch (event.action) {
    case 'logHabit':
      // Handle log habit action
      handleLogHabit();
      break;
    case 'viewDetails':
      // Open the main app
      event.waitUntil(clients.openWindow('/'));
      break;
  }
});

self.addEventListener("activate", event => {
  console.log('Service Worker: Activated, updating widgets');
  event.waitUntil(updateWidgets());
});

async function renderWidget(widget) {
  try {
    const templateUrl = widget.definition.msAcTemplate;
    const dataUrl = widget.definition.data;

    const templateResponse = await fetch(templateUrl);
    const dataResponse = await fetch(dataUrl);

    if (!templateResponse.ok || !dataResponse.ok) {
      console.error("Failed to fetch template or data");
      return;
    }

    const template = await templateResponse.text();
    const data = await dataResponse.text();

    await self.widgets.updateByTag(widget.definition.tag, { template, data });
    console.log("Widget rendered successfully");
  } catch (error) {
    console.error("Error rendering widget:", error);
  }
}

async function updateWidgets() {
  try {
    const widget = await self.widgets.getByTag("ecotrack");
    if (widget) {
      await renderWidget(widget);
    }
  } catch (error) {
    console.error("Error updating widgets:", error);
  }
}

async function handleLogHabit() {
  // Simulate logging a habit and updating data
  try {
    // In a real app, this would call your backend API
    const response = await fetch('/api/log-habit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit: 'eco_action' })
    });

    if (response.ok) {
      // Update widget data after successful log
      await updateWidgets();
    }
  } catch (error) {
    console.error("Error logging habit:", error);
  }
}
    })
  );
});

