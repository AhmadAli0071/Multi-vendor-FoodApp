export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '';
export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
export const DOMAIN = import.meta.env.VITE_DOMAIN || '';

export function getCustomerAppUrl(slug) {
  if (DOMAIN) {
    return `https://${slug}.${DOMAIN}`;
  }
  return `${APP_URL}/r/${slug}`;
}
