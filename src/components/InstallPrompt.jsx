import { useEffect, useRef } from 'react';

const InstallPrompt = () => {
  const deferredPrompt = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const beforeInstallHandler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    const autoTrigger = async () => {
      if (triggered.current || !deferredPrompt.current) return;
      triggered.current = true;
      try {
        deferredPrompt.current.prompt();
        await deferredPrompt.current.userChoice;
      } catch {
        // silently fail if prompt rejected
      } finally {
        deferredPrompt.current = null;
      }
    };

    const handleInteraction = () => autoTrigger();
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return null;
};

export default InstallPrompt;
