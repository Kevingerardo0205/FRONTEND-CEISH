export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
    VERIFY_OTP: '/auth/confirm-email',
    RESEND_OTP: '/auth/resend-confirmation',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SETUP_ACCOUNT: '/auth/setup-account',
    REFRESH: '/auth/refresh',
  },
  PROTOCOLS: {
    BASE: '/protocols',
    BY_ID: (id: string) => `/protocols/${id}`,
    ACCEPT_TIMELINE: (id: string) => `/protocols/${id}/accept-timeline`,
    CHECKLIST: (id: string) => `/reception/protocol/${id}`,
    REQUIREMENTS: '/protocols/requirements',
    UPLOAD_DOCUMENT: (id: string) => `/reception/protocol/${id}/document`,
    RECEPTION: {
      CREATE: '/protocols',
      LIST: '/reception/protocols',
      BULK_UPLOAD: (id: string) => `/reception/protocol/${id}/documents/bulk`,
      FINALIZE: (id: string) => `/reception/protocol/${id}/finalize`,
      CERTIFICATE: (id: string) => `/reception/protocol/${id}/certificate`,
      VALIDATE_DOC: (id: string) => `/reception/document/${id}/validate`,
      DOCUMENTS_HISTORY: (id: string) => `/reception/protocol/${id}/documents`,
      REQUIREMENT_STATUS: (protocolId: string, reqId: string) => `/reception/protocol/${protocolId}/requirement/${reqId}`,
      VERIFY: (protocolId: string) => `/reception/protocol/${protocolId}/verify`,
      VALIDATION_DETAIL: (id: string) => `/reception/protocol/${id}/validation-detail`,
    }
  },
  DOCUMENTS: {
    BASE: '/documents',
    UPLOAD: '/documents/upload',
    BY_ID: (id: string) => `/documents/${id}`,
  },
  EVALUATIONS: {
    DASHBOARD: '/evaluations/evaluators/dashboard',
    SUGGEST: '/evaluations/suggest',
    PENDING_SUGGESTIONS: '/evaluations/pending-suggestions',
    CONFIRM: '/evaluations/confirm-assignment',
    REJECT_SUGGESTION: (id: string) => `/evaluations/reject-suggestion/${id}`,
    MY_ASSIGNMENTS: '/evaluations/my-assignments',
    SUBMIT: '/evaluations/submit',
    PROFILES: '/evaluations/profiles',
    PROFILE_BY_ID: (id: number) => `/evaluations/profiles/${id}`,
    CONSOLIDATE: (id: string) => `/evaluations/consolidate/${id}`,
    PEER_ASSIGNMENTS: {
      PENDING_ASSIGNMENT: '/evaluations/protocols/pending-peer-assignment',
      ASSIGN_PEERS: (id: string) => `/evaluations/protocols/${id}/assign-peer-evaluators`,
      MY_PENDING: '/evaluations/peer-assignments/my-pending',
      SUBMIT_RISK: (id: string) => `/evaluations/peer-assignments/${id}/submit-risk`,
      ACTIVE_EVALUATORS: '/evaluations/evaluators/active'
    }
  },
  USERS: {
    BASE: '/auth/users',
    BY_ID: (id: string) => `/auth/users/${id}`,
    ROLES: '/auth/roles',
  },
  RESOLUTIONS: {
    BASE: '/resolutions',
  },
  HEALTH: '/'
};
