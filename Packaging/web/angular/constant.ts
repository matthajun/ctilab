import { environment } from '@env/environment';

export const MOBILE = (typeof window !== 'undefined') ? (window.screen.availWidth < 800) : true;
export const API_BASE_URL = environment.NodeServer ? '' : `${environment.apiUrl}:${environment.apiPort}`;
export const CURRENT_MENU = 'CURRENT.MENU';
export const TIMEZONE = 'TIMEZONE';
