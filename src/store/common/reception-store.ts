import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import { AppointmentStatus } from "@/constants/common/common-enum";
import { ProhibitedDrugsService } from "@/services/prohibited-drugs-service";
import { comparePositionString } from "@/lib/sort-position";
import { syncWithBroadcast } from "@/lib/broadcast-sync";

// ================================ Reception Store State ================================
export interface ReceptionState {
  // 접수 데이터
  registrations: Registration[];
  isInitialized: boolean;
  currentRegistration: Registration | null;
  /**
   * /medical 등에서 registrations 리스트에 없는 차트를 "외부에서" 열어 currentRegistration을 세팅한 경우 true
   * - registrations가 갱신되더라도 currentRegistration을 null로 강제 동기화하지 않기 위한 플래그
   */
  isCurrentRegistrationExternal: boolean;
  pendingStatusUpdate: { id: string; status: number } | null;
  /**
   * 이 클라이언트가 방금 updateRegistration으로 수정한 접수.
   * 소켓 이벤트가 같은 접수에 대한 것이면 refetch를 건너뛰기 위해 사용.
   */
  lastLocalRegistrationUpdate: { registrationId: string; at: number } | null;

  appointments: Appointment[];

  // 접수 관련 setter
  setInitialData: (data: {
    registrations: Registration[];
    appointments: Appointment[];
  }) => void;
  setInitialized: (isInitialized: boolean) => void;
  setRegistrations: (registrations: Registration[]) => void;
  setCurrentRegistration: (registration: Registration | null) => Promise<void>;
  setCurrentRegistrationExternal: (
    registration: Registration | null
  ) => Promise<void>;
  updateCurrentRegistration: (updates: Partial<Registration>) => void;
  updateRegistration: (id: string, updates: Partial<Registration>, options?: { skipLocalUpdateGuard?: boolean }) => void;
  setLastLocalRegistrationUpdate: (
    update: { registrationId: string; at: number } | null
  ) => void;
  setPendingStatusUpdate: (
    update: { id: string; status: number } | null
  ) => void;

  // 예약 관련 setter
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
}

// ================================ 초기 상태 ================================
const initialState = {
  registrations: [],
  isInitialized: false,
  currentRegistration: null,
  isCurrentRegistrationExternal: false,
  pendingStatusUpdate: null,
  lastLocalRegistrationUpdate: null as { registrationId: string; at: number } | null,
  appointments: [],
};

const sortRegistrations = (registrations: Registration[]) => {
  return [...registrations].sort((a, b) =>
    comparePositionString(a.position ?? "", b.position ?? "")
  );
};

const sortAppointments = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) => {
    const aIsCanceled = a.status === AppointmentStatus.CANCELED;
    const bIsCanceled = b.status === AppointmentStatus.CANCELED;

    if (aIsCanceled && !bIsCanceled) return 1;
    if (!aIsCanceled && bIsCanceled) return -1;

    const timeA = new Date(a.appointmentStartTime).getTime();
    const timeB = new Date(b.appointmentStartTime).getTime();
    return timeA - timeB;
  });
};

// ================================ Reception Store ================================
export const useReceptionStore = create<ReceptionState>()(
  syncWithBroadcast("reception-store",
  devtools(
    (set, get) => ({
      ...initialState,

      setInitialData: (data) => {
        const { currentRegistration, isCurrentRegistrationExternal } = get();
        const sortedRegistrations = sortRegistrations(data.registrations || []);
        const sortedAppointments = sortAppointments(data.appointments || []);

        let nextCurrentRegistration = currentRegistration;
        if (currentRegistration) {
          const updated = sortedRegistrations.find(
            (reg) => reg.id?.toString() === currentRegistration.id?.toString()
          );

          if (updated) {
            nextCurrentRegistration = {
              ...updated,
              prohibitedDrugs: (currentRegistration as any).prohibitedDrugs,
            } as Registration;
          } else if (!isCurrentRegistrationExternal) {
            nextCurrentRegistration = null;
          }
        }

        set({
          registrations: sortedRegistrations,
          appointments: sortedAppointments,
          isInitialized: true,
          currentRegistration: nextCurrentRegistration,
          isCurrentRegistrationExternal:
            nextCurrentRegistration ? isCurrentRegistrationExternal : false,
        });
      },

      setInitialized: (isInitialized: boolean) => {
        set({ isInitialized });
      },

      // 접수 관련 setter
      // API 등에서 가져온 registrations 리스트는 position 오름차순으로 정렬하여 저장
      // 이 때, 현재 선택된 환자(currentRegistration)가 존재하면 동일한 id를 가진 registration으로 동기화한다.
      setRegistrations: (registrations: Registration[]) => {
        const { currentRegistration, isCurrentRegistrationExternal } = get();
        const sortedRegistrations = sortRegistrations(registrations);

        // currentRegistration 이 선택되어 있으면, 동일한 id 를 갖는 최신 registration 으로 동기화
        let nextCurrentRegistration = currentRegistration;
        if (currentRegistration) {
          const updated = sortedRegistrations.find(
            (reg) => reg.id?.toString() === currentRegistration.id?.toString()
          );

          if (updated) {
            // 금기약(prohibitedDrugs)처럼 currentRegistration 에만 존재하는 확장 필드는 유지
            nextCurrentRegistration = {
              ...updated,
              prohibitedDrugs: (currentRegistration as any).prohibitedDrugs,
            } as Registration;
          } else if (!isCurrentRegistrationExternal) {
            // (기본 동작) 리스트에 더 이상 존재하지 않으면 선택도 해제
            nextCurrentRegistration = null;
          }
        }

        set({
          registrations: sortedRegistrations,
          currentRegistration: nextCurrentRegistration,
          // currentRegistration이 해제되면 external 플래그도 같이 해제
          isCurrentRegistrationExternal:
            nextCurrentRegistration ? isCurrentRegistrationExternal : false,
        });
      },

      setCurrentRegistration: async (registration: Registration | null) => {
        if (registration) {
          try {
            const prohibitedDrugs =
              await ProhibitedDrugsService.getProhibitedDrugs(
                registration.patientId
              );
            set({
              currentRegistration: {
                ...registration,
                prohibitedDrugs,
              },
              isCurrentRegistrationExternal: false,
            });
          } catch (error) {
            // 에러 발생 시 prohibitedDrugs 없이 설정
            set({
              currentRegistration: {
                ...registration,
                prohibitedDrugs: null,
              },
              isCurrentRegistrationExternal: false,
            });
          }
        } else {
          set({ currentRegistration: null, isCurrentRegistrationExternal: false });
        }
      },

      // /medical 등에서 "registrations 리스트에 없는" 차트를 열 때 사용하는 setter
      setCurrentRegistrationExternal: async (registration: Registration | null) => {
        if (registration) {
          try {
            const prohibitedDrugs =
              await ProhibitedDrugsService.getProhibitedDrugs(
                registration.patientId
              );
            set({
              currentRegistration: {
                ...registration,
                prohibitedDrugs,
              },
              isCurrentRegistrationExternal: true,
            });
          } catch (error) {
            set({
              currentRegistration: {
                ...registration,
                prohibitedDrugs: null,
              },
              isCurrentRegistrationExternal: true,
            });
          }
        } else {
          set({ currentRegistration: null, isCurrentRegistrationExternal: false });
        }
      },

      updateCurrentRegistration: (updates: Partial<Registration>) => {
        const { currentRegistration } = get();
        if (currentRegistration) {
          set({
            currentRegistration: { ...currentRegistration, ...updates },
          });
        }
      },

      updateRegistration: (id: string, updates: Partial<Registration>, options?: { skipLocalUpdateGuard?: boolean }) => {
        const { registrations, currentRegistration } = get();
        const updatedRegistrations = registrations.map((reg) =>
          reg.id === id ? { ...reg, ...updates } : reg
        );
        set({
          registrations: updatedRegistrations,
          currentRegistration:
            currentRegistration?.id === id
              ? { ...currentRegistration, ...updates }
              : currentRegistration,
          ...(options?.skipLocalUpdateGuard
            ? {}
            : { lastLocalRegistrationUpdate: { registrationId: id, at: Date.now() } }),
        });
      },

      setLastLocalRegistrationUpdate: (
        update: { registrationId: string; at: number } | null
      ) => {
        set({ lastLocalRegistrationUpdate: update });
      },

      setPendingStatusUpdate: (
        update: { id: string; status: number } | null
      ) => {
        set({ pendingStatusUpdate: update });
      },

      // 예약 관련 setter
      // appointments는 기본적으로 시간순서대로 오름차순 정렬
      // 단, 취소 내역은 가장 마지막 순서로 이동 (최우선)
      setAppointments: (appointments: Appointment[]) => {
        const sortedAppointments = sortAppointments(appointments);

        set({ appointments: sortedAppointments });
      },

      addAppointment: (appointment: Appointment) => {
        const { appointments } = get();
        set({
          appointments: [...appointments, appointment],
        });
      },

      updateAppointment: (id: string, updates: Partial<Appointment>) => {
        const { appointments } = get();
        set({
          appointments: appointments.map((apt) =>
            apt.id.toString() === id ? { ...apt, ...updates } : apt
          ),
        });
      },

      removeAppointment: (id: string) => {
        const { appointments } = get();
        set({
          appointments: appointments.filter((apt) => apt.id.toString() !== id),
        });
      },
    }),
    {
      name: "reception-store",
    }
  ), {
    pick: ["currentRegistration", "isCurrentRegistrationExternal"],
  })
);
