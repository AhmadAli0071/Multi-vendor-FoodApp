import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { getAppType } from '../utils/subdomain';

const InstallPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (getAppType() === 'admin') return;

    if (window.__deferredPrompt) {
      setShow(true);
      return;
    }

    const handler = () => {
      if (window.__deferredPrompt) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    const dp = window.__deferredPrompt;
    if (!dp) return;
    dp.prompt();
    dp.userChoice.finally(() => {
      window.__deferredPrompt = null;
      setShow(false);
    });
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[99999] p-3 max-w-lg mx-auto" style={{bottom: 'env(safe-area-inset-bottom, 0px)'}}>
      <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center text-lg flex-shrink-0">
          🍔
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Install App</p>
          <p className="text-xs text-gray-400">Add to home screen</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2.5 bg-[#FF6B35] rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer"
        >
          <Download size={14} />
          Install
        </button>
        <button onClick={() => setShow(false)} className="p-1 text-gray-500 hover:text-white flex-shrink-0 cursor-pointer">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;