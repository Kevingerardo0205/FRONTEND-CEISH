import { environment } from '../../../environments/environment';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${environment.apiUrl}/auth/login`,
    REGISTER: `${environment.apiUrl}/auth/register`,
    REFRESH: `${environment.apiUrl}/auth/refresh-token`,
    USERS: `${environment.apiUrl}/auth/users`
  },
  PROTOCOLS: `${environment.apiUrl}/protocols`,
  EVALUATIONS: `${environment.apiUrl}/evaluations`,
  DOCUMENTS: `${environment.apiUrl}/documents`
};
