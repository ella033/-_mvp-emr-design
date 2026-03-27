import { useMutation } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type {
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
} from "@/types/appointments/appointments";

// 접수 정보 업데이트 API 요청 함수
async function updateAppointmentApi(
  id: number,
  appointment: UpdateAppointmentRequest
): Promise<UpdateAppointmentResponse> {
  const data = {
    hospitalId: appointment.hospitalId,
    patientId: appointment.patientId,
    appointmentStartTime: appointment.appointmentStartTime,
    appointmentEndTime: appointment.appointmentEndTime,
    status: appointment.status,
    doctorId: appointment.doctorId,
    receptionistId: appointment.receptionistId,
    memo: appointment.memo,
  };
  return AppointmentsService.updateAppointment(id, data);
}

// 접수 정보 업데이트용 커스텀 훅
export function useUpdateAppointment(options?: {
  onSuccess?: (data: UpdateAppointmentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAppointmentRequest;
    }) => {
      return await updateAppointmentApi(id, data);
    },
    ...options,
  });
}
