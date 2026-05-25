import { DOMAIN } from './config';

function getRenderServiceName() {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.onrender.com')) {
    return hostname.split('.')[0];
  }
  return null;
}

export function isSubdomainMode() {
  return !!DOMAIN;
}

export function getSubdomain() {
  if (!isSubdomainMode()) return null;
  const hostname = window.location.hostname;
  const domainParts = DOMAIN.split('.').length;
  const parts = hostname.split('.');
  if (parts.length > domainParts) {
    return parts.slice(0, parts.length - domainParts).join('.');
  }
  return null;
}

export function getAppType() {
  const serviceName = getRenderServiceName();
  if (serviceName) {
    if (serviceName.includes('owner')) return 'owner';
    if (serviceName.includes('admin')) return 'admin';
    return 'admin';
  }

  const subdomain = getSubdomain();
  if (!subdomain || subdomain === 'www' || subdomain === 'admin') return 'admin';
  if (subdomain === 'owner') return 'owner';
  return 'customer';
}

export function getRestaurantSlug() {
  if (getRenderServiceName()) return null;

  const subdomain = getSubdomain();
  if (!subdomain || subdomain === 'www' || subdomain === 'admin' || subdomain === 'owner') return null;
  return subdomain;
}
