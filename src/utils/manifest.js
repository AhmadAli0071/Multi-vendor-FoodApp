export function updateManifest({ name, shortName, icon }) {
  const manifest = {
    name: name || 'FoodApp',
    short_name: shortName || name || 'FoodApp',
    description: 'Order food from ' + (name || 'your favorite restaurants'),
    start_url: window.location.pathname + window.location.search,
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#D81B60',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  let link = document.querySelector('link[rel="manifest"]');
  if (link) {
    URL.revokeObjectURL(link.href);
    link.href = url;
  } else {
    link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);
  }

  document.title = name || 'FoodApp';

  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitle) {
    appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitle);
  }
  appleTitle.content = shortName || name || 'FoodApp';
}
