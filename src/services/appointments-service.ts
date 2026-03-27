import { AppointmentStatus } from "@/constants/common/common-enum";
import { ApiClient } from "@/lib/api/api-client";
import { appointmentsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  Appointment,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  DeleteAppointmentResponse,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
} from "@/types/appointments/appointments";
import type { AppointmentWithHistory } from "@/types/appointments/appointment-history";
import type {
  CheckHolidayConflictsRequest,
  CheckHolidayConflictsResponse,
} from "@/types/common/holiday-applications-types";

export class AppointmentsService {
  static async getAppointmentsByHospital(
    hospitalId: number,
    beginDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const validatedHospitalId = validateId(hospitalId, "hospitalId");
    try {
      return await ApiClient.get<Appointment[]>(
        appointmentsApi.listByHospital(validatedHospitalId, beginDate, endDate)
      ).then((appointments) => {
        return appointments.filter(
          (appointment): appointment is Appointment =>
            appointment.patient != null
        );
      });
    } catch (error: any) {
      throw error;
    }
  }

  static async getAppointmentsByPatient(
    patientId: number,
    beginDate: string,
    endDate: string
  ): Promise<any[]> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<any[]>(
        appointmentsApi.listByPatient(validatedPatientId, beginDate, endDate)
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async createAppointment(
    data: CreateAppointmentRequest
  ): Promise<CreateAppointmentResponse> {
    try {
      return await ApiClient.post<CreateAppointmentResponse>(
        appointmentsApi.create,
        data
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async updateAppointment(
    id: number,
    data: UpdateAppointmentRequest
  ): Promise<UpdateAppointmentResponse> {
    const validatedId = validateId(id, "appointmentId");
    try {
      return await ApiClient.put<UpdateAppointmentResponse>(
        appointmentsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async cancelAppointment(
    id: number,
    cancelMessage?: string
  ): Promise<UpdateAppointmentResponse> {
    const validatedId = validateId(id, "appointmentId");
    try {
      const body: { status: typeof AppointmentStatus.CANCELED; cancelMessage?: string } = {
        status: AppointmentStatus.CANCELED,
      };
      if (cancelMessage?.trim()) {
        body.cancelMessage = cancelMessage.trim();
      }
      return await ApiClient.patch<UpdateAppointmentResponse>(
        appointmentsApi.updateStatus(validatedId),
        body
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async deleteAppointment(
    id: number
  ): Promise<DeleteAppointmentResponse> {
    const validatedId = validateId(id, "appointmentId");
    try {
      return await ApiClient.delete<DeleteAppointmentResponse>(
        appointmentsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async getAppointment(id: number): Promise<Appointment> {
    const validatedId = validateId(id, "appointmentId");
    try {
      return await ApiClient.get<Appointment>(
        appointmentsApi.detail(validatedId)
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async updateAppointmentStatus(
    id: number,
    data: { status: number }
  ): Promise<UpdateAppointmentResponse> {
    const validatedId = validateId(id, "appointmentId");
    try {
      return await ApiClient.patch<UpdateAppointmentResponse>(
        appointmentsApi.updateStatus(validatedId),
        data
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async checkHolidayConfilicts(
    data: CheckHolidayConflictsRequest
  ): Promise<CheckHolidayConflictsResponse> {
    try {
      return await ApiClient.post<CheckHolidayConflictsResponse>(
        appointmentsApi.checkHolidayConflicts,
        data
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async getAppointmentHistoryByPatient(
    patientId: number
  ): Promise<AppointmentWithHistory[]> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<AppointmentWithHistory[]>(
        appointmentsApi.listHistoryByPatient(validatedPatientId)
      );
    } catch (error: any) {
      throw error;
    }
  }

  static async checkOperatingHoursConfilicts(
    data: { date: any }
  ): Promise<any> {
    try {
      return await ApiClient.post<any>(
        appointmentsApi.checkOperatingHoursConflicts,
        data
      );
    } catch (error: any) {
      throw error;
    }
  }
}

