export interface ProtocolStats {
  type: string;
  count: number;
}

export interface StatusStats {
  status: string;
  count: number;
}

export interface EvaluationTimeStats {
  month: string;
  avgDays: number;
}

export interface WorkloadStats {
  evaluator: string;
  assignedCount: number;
  completedCount: number;
}

export interface SummaryStats {
  totalProtocols: number;
  approvalRate: number;
  avgEvaluationDays: number;
  pendingRenewals: number;
  adverseEventsCount: number;
}

export interface MSPReportData {
  sessions: {
    ordinary: number;
    extraordinary: number;
  };
  attendance: {
    member: string;
    percentage: number;
  }[];
  modalities: {
    exempt: number;
    expedited: number;
    full: number;
  };
  resolutions: {
    approved: number;
    conditioned: number;
    notApproved: number;
  };
  biologicalSamples: {
    yes: number;
    no: number;
  };
  vulnerablePopulations: {
    type: string;
    count: number;
  }[];
}
