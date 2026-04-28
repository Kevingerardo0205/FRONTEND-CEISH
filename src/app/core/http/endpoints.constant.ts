import { environment } from '../../../environments/environment';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${environment.apiUrl}/auth/login`,
    REGISTER: `${environment.apiUrl}/auth/register`,
    PROFILE: `${environment.apiUrl}/auth/profile`,
  },
  PROTOCOLS: {
    BASE: `${environment.apiUrl}/protocols`,
    BY_ID: (id: string) => `${environment.apiUrl}/protocols/${id}`,
  },
  DOCUMENTS: {
    BASE: `${environment.apiUrl}/documents`,
    UPLOAD: `${environment.apiUrl}/documents/upload`,
    BY_ID: (id: string) => `${environment.apiUrl}/documents/${id}`,
  },
  HEALTH: `${environment.apiUrl}/`
};
