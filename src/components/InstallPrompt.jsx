import React, { useState, useEffect, useMemo } from 'react';
import { Download, X } from 'lucide-react';
import { getAppType, getRestaurantSlug } from '../utils/subdomain';

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

const InstallPrompt = () => {
  const [show, setShow] = useState(false);

  const appName = useMemo(() => {
    const type = getAppType();
    if (type === 'owner') return 'FoodApp Owner';
    if (type === 'customer') {
      const slug = getRestaurantSlug();
      if (slug) return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return 'FoodApp';
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (deferredPrompt) setShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 max-w-lg mx-auto">
      <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center gap-3 shadow-2xl animate-slide-up">
        <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center text-lg flex-shrink-0">
          🍔
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Install {appName}</p>
          <p className="text-xs text-gray-400">Add to home screen for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2.5 bg-[#FF6B35] rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0"
        >
          <Download size={14} />
          Install
        </button>
        <button onClick={() => setShow(false)} className="p-1 text-gray-500 hover:text-white flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
