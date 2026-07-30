import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Dispatch an event to the document so the UI can show a custom dialog
    const event = new CustomEvent('pwa-update-available', {
      detail: { update: () => updateSW(true) }
    });
    document.dispatchEvent(event);
  },
  onOfflineReady() {
    console.log('Aplikasi siap digunakan secara offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
