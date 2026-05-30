import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { getAppType, getRestaurantSlug } from '../utils/subdomain';

const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const appName = useMemo(() => {
    const type = getAppType();
    if (type === 'owner') return 'FoodApp Owner';
    if (type === 'customer') {
      const slug = getRestaurantSlug();
      if (slug) return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return 'FoodApp';
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    try {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        console.log('App installed successfully');
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
    } finally {
      deferredPrompt.current = null;
      setShow(false);
    }
  };

  const handleDismiss = () => {
    deferredPrompt.current = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 max-w-lg mx-auto">
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
          className="px-4 py-2.5 bg-[#FF6B35] rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
        >
          <Download size={14} />
          Install
        </button>
        <button onClick={handleDismiss} className="p-1 text-gray-500 hover:text-white flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
