import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Capture PWA install event early (before React mounts)
window.__deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__deferredPrompt = e;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
