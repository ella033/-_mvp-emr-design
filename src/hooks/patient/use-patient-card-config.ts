// types/patient-card-types.ts
export interface PatientCardConfig {
  showNewPatientBadge: boolean;
  showVitalSigns: boolean;
  showCallButton: boolean;
  bodyType: PanelTypeKey;
}

// hooks/usePatientCardConfig.ts
import { useMemo } from "react";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import { PANEL_TYPE, type PanelTypeKey } from "@/constants/reception";

export const usePatientCardConfig = (data: Registration | Appointment): PatientCardConfig => {
  return useMemo(() => {
    // Appointment 타입인지 확인 (appointmentType 속성 존재)
    if ('appointmentType' in data) {
      return {
        showNewPatientBadge: true,
        showVitalSigns: false,
        showCallButton: false,
        bodyType: PANEL_TYPE.APPOINTMENT
      };
    }
    // Registration 타입인 경우
    const registration = data as Registration;
    // treatment 관련 패턴 체크 (treatment, treatment-1, treatment-2 등)
    if (registration.roomPanel === PANEL_TYPE.TREATMENT ||
      (registration.roomPanel && registration.roomPanel.startsWith("treatment-"))) {
      return {
        showNewPatientBadge: true,
        showVitalSigns: false,
        showCallButton: false,
        bodyType: PANEL_TYPE.TREATMENT
      };
    }

    switch (registration.roomPanel) {
      case PANEL_TYPE.PAYMENT:
        return {
          showNewPatientBadge: true,
          showVitalSigns: false,
          showCallButton: false,
          bodyType: PANEL_TYPE.PAYMENT
        };

      default:
        return {
          showNewPatientBadge: true,
          showVitalSigns: true,
          showCallButton: true,
          bodyType: PANEL_TYPE.TREATMENT
        };
    }
  }, [data]);
};