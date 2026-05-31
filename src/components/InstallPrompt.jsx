import { useState, useEffect } from 'react';
import { Download, X, Share2 } from 'lucide-react';
import { getAppType } from '../utils/subdomain';

const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa_dismissed') === 'true');
  const [supportsNative, setSupportsNative] = useState(false);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  useEffect(() => {
    if (getAppType() === 'admin' || isStandalone || dismissed) return;

    if (window.__deferredPrompt) {
      setSupportsNative(true);
      setShow(true);
      return;
    }

    const handler = () => {
      if (window.__deferredPrompt) {
        setSupportsNative(true);
        setShow(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    const timer = setTimeout(() => {
      if (!window.__deferredPrompt) {
        setShow(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [dismissed]);

  const handleInstall = () => {
    const dp = window.__deferredPrompt;
    if (dp) {
      dp.prompt();
      dp.userChoice.finally(() => {
        window.__deferredPrompt = null;
        setShow(false);
        localStorage.setItem('pwa_dismissed', 'true');
      });
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!show) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[99999] p-3 max-w-lg mx-auto" style={{bottom: 'env(safe-area-inset-bottom, 0px)'}}>
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center text-lg flex-shrink-0">
            🍔
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Install App</p>
            <p className="text-xs text-gray-400">Add to home screen for faster access</p>
          </div>
          <button onClick={handleDismiss} className="p-1 text-gray-500 hover:text-white flex-shrink-0 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        {supportsNative ? (
          <button
            onClick={handleInstall}
            className="w-full py-2.5 bg-[#FF6B35] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-[#e55a2b] transition-colors"
          >
            <Download size={14} />
            Install
          </button>
        ) : (
          <div className="text-xs text-gray-400 space-y-1.5">
            {isIOS ? (
              <div className="flex items-center gap-2">
                <Share2 size={14} className="text-blue-400" />
                <span>Tap <strong className="text-white">Share</strong> → <strong className="text-white">Add to Home Screen</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download size={14} className="text-green-400" />
                <span>Chrome menu <strong className="text-white">⋮</strong> → <strong className="text-white">Install App</strong> or <strong className="text-white">Add to Home Screen</strong></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;