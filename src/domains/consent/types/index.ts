export interface ConsentRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientBirthDate?: string;
  requestedAt: string;
  requestedBy: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ConsentData {
  requestId: string;
  patientId: string;
  consentItems: ConsentItem[];
  signature?: string;
  completedAt: string;
}

export interface ConsentItem {
  id: string;
  title: string;
  content: string;
  agreed: boolean;
  required: boolean;
}

export type ConsentStatus = ConsentRequest['status'];