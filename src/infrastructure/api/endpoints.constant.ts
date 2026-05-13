export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
    VERIFY_OTP: '/auth/confirm-email',
    RESEND_OTP: '/auth/resend-confirmation',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  PROTOCOLS: {
    BASE: '/protocols',
    BY_ID: (id: string) => `/protocols/${id}`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    UPLOAD: '/documents/upload',
    BY_ID: (id: string) => `/documents/${id}`,
  },
  EVALUATIONS: {
    DASHBOARD: '/evaluations/evaluators/dashboard',
    SUGGEST: '/evaluations/suggest',
    CONFIRM: '/evaluations/confirm-assignment',
    MY_ASSIGNMENTS: '/evaluations/my-assignments',
    SUBMIT: '/evaluations/submit',
    PROFILES: '/evaluations/profiles',
    PROFILE_BY_ID: (id: number) => `/evaluations/profiles/${id}`,
  },
  RESOLUTIONS: {
    BASE: '/resolutions',
  },
  HEALTH: '/'
};
