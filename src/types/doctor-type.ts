export type DoctorType = {
  id: number;
  hospitalId: number;
  type: number;
  name: string;
  email: string;
  mobile: string;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  isActive: boolean;
};
