export function updateManifest({ name, shortName }) {
  document.title = name || 'FoodApp';

  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitle) {
    appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitle);
  }
  appleTitle.content = shortName || name || 'FoodApp';
}
