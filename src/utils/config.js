export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '';
export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
export const DOMAIN = import.meta.env.VITE_DOMAIN || window.location.hostname;

export function getCustomerAppUrl(slug) {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `${APP_URL}/r/${slug}`;
  }
  const parts = hostname.split('.');
  const baseDomain = parts.slice(1).join('.');
  return `https://${slug}.${baseDomain}`;
}
