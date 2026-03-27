export interface VisitHistoryItem {
  id: string;
  visitDate: string;
  patientName: string;
  summary: string;
  symptoms?: string;
  diagnoses?: Array<{
    code: string;
    name: string;
    note?: string;
  }>;
  prescriptions?: Array<{
    code: string;
    name: string;
    dosage?: string;
  }>;
  totalAmount?: number;
}

