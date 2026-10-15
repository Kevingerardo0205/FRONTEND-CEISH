export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  category: 'VALIDATION' | 'ASSIGNMENT' | 'RESOLUTION' | 'FOLLOW_UP' | 'AMENDMENT' | 'SYSTEM';
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  lastModified: Date;
  variables: string[];
}
