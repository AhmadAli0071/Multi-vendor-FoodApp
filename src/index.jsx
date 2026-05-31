import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.__deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__deferredPrompt = e;
  const trigger = () => {
    const dp = window.__deferredPrompt;
    if (!dp) return;
    dp.prompt();
    dp.userChoice.finally(() => { window.__deferredPrompt = null; });
    document.removeEventListener('click', trigger);
    document.removeEventListener('touchstart', trigger);
  };
  document.addEventListener('click', trigger, { once: true });
  document.addEventListener('touchstart', trigger, { once: true });
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
