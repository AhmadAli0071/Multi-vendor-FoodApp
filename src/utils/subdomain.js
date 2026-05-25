export function getSubdomain() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export function getAppType() {
  const subdomain = getSubdomain();
  if (!subdomain || subdomain === 'www' || subdomain === 'admin') return 'admin';
  if (subdomain === 'owner') return 'owner';
  return 'customer';
}

export function getRestaurantSlug() {
  const subdomain = getSubdomain();
  if (!subdomain || subdomain === 'www' || subdomain === 'admin' || subdomain === 'owner') return null;
  return subdomain;
}
