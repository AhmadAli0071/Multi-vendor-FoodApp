export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '';
export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
export const DOMAIN = import.meta.env.VITE_DOMAIN || '';

export const OWNER_URL = import.meta.env.VITE_OWNER_URL || `${APP_URL}/owner`;
export const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || APP_URL;

export function getCustomerAppUrl(slug) {
  if (DOMAIN) {
    return `https://${slug}.${DOMAIN}`;
  }
  return `${CUSTOMER_URL}/r/${slug}`;
}
