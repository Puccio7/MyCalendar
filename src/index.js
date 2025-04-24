import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registra il service worker per la funzionalità offline
<<<<<<< HEAD
serviceWorkerRegistration.register();
=======
serviceWorkerRegistration.register();
>>>>>>> e36e8b5ba16e7719f3aa45cdc56e9aa6514b1e09
