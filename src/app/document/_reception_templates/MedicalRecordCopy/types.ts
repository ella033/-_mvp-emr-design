import { Patient } from '@/types/patient-types';
import { Encounter } from '@/types/chart/encounter-types';

export type MedicalRecordCopyData = {
  patient: {
    id: number | null;
    chartNumber: string;
    name: string;
    rrn: string;
    age: string;
    gender: string;
    phone: string;
    address: string;
  };
  hospital: {
    name: string;
    address: string;
    phone: string;
  };
  encounters: Array<{
    encounterId: string;
    visitDate: string;
    visitTime: string;
    visitType: string;
    insuranceType: string;
    doctorName: string;
    department: string;
    diagnoses: Array<{
      code: string;
      name: string;
      isPrimary: boolean;
      isSecondary: boolean;
      isExcluded: boolean;
    }>;
    orders: Array<{
      claimCode: string;
      name: string;
      dose: string;
      timesPerDay: string;
      days: string;
    }>;
    exams: Array<{
      claimCode: string;
      name: string;
      referenceValue: string;
      resultValue: string;
    }>;
    symptomText: string;
    vitals: {
      systolicBp: string;
      diastolicBp: string;
      pulse: string;
      bloodSugar: string;
      weight: string;
      height: string;
      bmi: string;
      temperature: string;
    };
  }>;
};

export interface MedicalRecordCopyProps {
  patient: Patient;
  encounters: Encounter[];
  margin?: number;
  onPageCountChange?: (count: number) => void;
}
