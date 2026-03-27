import type { Patient } from "./patient-types";

export interface PatientFormProps {
  isRegister?: boolean;
  isEdit?: boolean;
  patient?: Patient;
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  children?: React.ReactNode;
}
