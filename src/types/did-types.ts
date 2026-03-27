export type DidPatientStatus = "WAITING" | "IN_TREATMENT";

export interface DidPatient {
  id: number;
  name: string;
  status: DidPatientStatus;
  calledAt: string | null;
}

export interface DidQueueRoom {
  roomPanel: string;
  doctorName: string | null;
  patients: DidPatient[];
}

export type DidQueuesResponse = DidQueueRoom[];
