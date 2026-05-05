export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'ASSIGN' | 'VALIDATE';
  entity: 'Protocol' | 'User' | 'Evaluation' | 'Resolution' | 'Amendment';
  recordId: string;
  ipAddress: string;
  changes?: {
    before: any;
    after: any;
  };
  details?: string;
}

export interface ProtocolTrailEvent {
  id: string;
  date: Date;
  responsible: string;
  action: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CONDITIONED';
  comments?: string;
  documents?: { name: string, url: string }[];
  integrityHash: string;
}
