import { AppointmentStatus } from "@/constants/common/common-enum";
import { AppointmentTypes } from "@/types/appointments/appointment-types";
import { Patient } from "@/types/patient-types";
import { DoctorType } from "@/types/doctor-type";
import { AppointmentRooms } from "@/types/appointments/appointment-rooms";

interface ExternalPlatform {
  id: number;
  platformCode: string;
  platformName: string;
}

export interface AppointmentBase {
  hospitalId: number;
  appointmentRoomId: number;
  patientId: number | null;
  appointmentTypeId: number | null;
  appointmentStartTime: Date;
  appointmentEndTime?: Date;
  status: AppointmentStatus;
  doctorId: number | null ;
  memo: string;
  platform: number;
  isSimplePatient: boolean;
  excludeAutoMessage: boolean;
  receptionistId: number;
  temporaryPatient: { name: string; phone1: string; birthDate: string } | null;
}

export interface Appointment extends AppointmentBase {
  id: number;
  createId: number;
  createDateTime: Date;
  updateId: number | null;
  updateDateTime: Date | null;
  appointmentType: AppointmentTypes | null;
  patient: Patient;
  doctor: DoctorType | null;
  appointmentRoom: AppointmentRooms;
  externalPlatform: ExternalPlatform | null;
  isNewPatient: boolean;
}

export interface CreateAppointmentRequest extends AppointmentBase {
  force?: boolean;
}
export interface CreateAppointmentResponse {
  id: number;
}
export interface UpdateAppointmentRequest extends Partial<Appointment> {
  force?: boolean;
}
export interface UpdateAppointmentResponse {
  id: number;
}
export interface DeleteAppointmentRequest { }
export interface DeleteAppointmentResponse {
  id: number;
}
