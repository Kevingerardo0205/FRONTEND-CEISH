export interface DocumentEntity {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadDate: Date;
  requirementId?: number;
  statusId?: number;
  status?: string;
  observations?: string;
  version?: number;
  originalPageCount?: number;
  pageCount?: number;
}
