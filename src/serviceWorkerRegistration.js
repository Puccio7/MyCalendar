<<<<<<< HEAD
=======
`javascript
>>>>>>> e36e8b5ba16e7719f3aa45cdc56e9aa6514b1e09
// Questo codice permette di registrare un service worker.
// Questo consente all'app di caricarsi più velocemente nelle visite successive e fornire
// funzionalità offline. Tuttavia, ciò significa anche che gli aggiornamenti dell'app
// arriveranno all'utente solo quando visiterà di nuovo la pagina e gli asset
// nel cache saranno aggiornati.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] è l'indirizzo localhost IPv6.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 sono considerati localhost per IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
<<<<<<< HEAD
      const swUrl = process.env.PUBLIC_URL + '/service-worker.js';
=======
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
>>>>>>> e36e8b5ba16e7719f3aa45cdc56e9aa6514b1e09

      if (isLocalhost) {
        // Siamo in localhost. Verifichiamo se esiste un service worker
        checkValidServiceWorker(swUrl, config);
      } else {
        // Non siamo in localhost. Registriamo il service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('Nuovo contenuto disponibile; aggiorna la pagina.');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Il contenuto è salvato nella cache per l\'uso offline.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Errore durante la registrazione del service worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Verifica se il service worker può essere trovato.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Verifica che il service worker esista e che siamo davvero ottenendo un file JS.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Nessun service worker trovato. Probabilmente l'app è su un host diverso.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker trovato. Procedi normalmente.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Nessuna connessione internet. L\'app sta funzionando in modalità offline.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> e36e8b5ba16e7719f3aa45cdc56e9aa6514b1e09
