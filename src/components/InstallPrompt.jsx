import { useEffect } from 'react';

const InstallPrompt = () => {
  useEffect(() => {
    let installed = false;

    const handler = async (e) => {
      e.preventDefault();
      if (installed) return;
      installed = true;
      try {
        e.prompt();
        await e.userChoice;
      } catch {
        // prompt rejected or unavailable
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return null;
};

export default InstallPrompt;
