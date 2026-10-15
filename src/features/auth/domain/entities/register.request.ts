export interface RegisterInvestigadorRequest {
  email: string;
  password: string;
  nationalId: string;
  documentType: string;
  firstName: string;
  middleName?: string;
  firstLastName: string;
  secondLastName?: string;
  nationality: string;
  phone: string;
  acceptsTerms: boolean;
  acceptsRegulations: boolean;
}

export interface RegisterInvestigadorResponse {
  success: boolean;
  message: string;
  data?: any;
}
