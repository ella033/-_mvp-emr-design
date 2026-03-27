import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionTabsStore, useSelectedDateStore } from "@/store/reception";
import { useReceptionStore } from "@/store/common/reception-store";
import { VitalSignMeasurementsService } from "@/services/vital-sign-measurements-service";
import { formatDateByPattern } from "@/lib/date-utils";
import { getIsVitalToday } from "@/lib/registration-utils";
import type { VitalReceptionInfoType } from "@/types/common/reception-types";
import type { VitalSignMeasurement } from "@/types/vital/vital-sign-measurement-types";

function mapVitalToReceptionInfo(v: VitalSignMeasurement): VitalReceptionInfoType {
  return {
    id: v.id,
    measurementDateTime: v.measurementDateTime,
    itemId: v.itemId,
    value: v.value?.toString() ?? "0",
    memo: v.memo ?? "",
    vitalSignItem: v.vitalSignItem ?? ({} as VitalReceptionInfoType["vitalSignItem"]),
  };
}

/**
 * 바이탈 소켓 수신 후 해당 환자(patientId)의 reception/registration 스토어를 최신 바이탈로 갱신.
 * - useReceptionTabsStore: 해당 patientId의 openedReception들 bioMeasurementsInfo.vital 덮어쓰기
 * - useReceptionStore: 해당 patientId의 registration들 patient.vitalSignMeasurements 덮어쓰기, currentRegistration 동기화
 */
function updateReceptionsForVital(
  patientId: number,
  vitals: VitalSignMeasurement[]
): void {
  const vitalReceptionList: VitalReceptionInfoType[] =
    vitals.map(mapVitalToReceptionInfo);

  // useReceptionTabsStore: openedReceptions
  const {
    openedReceptions,
    updateOpenedReception,
    receptionChanges,
  } = useReceptionTabsStore.getState();

  (openedReceptions ?? []).forEach((opened: any) => {
    const regId = opened?.originalRegistrationId;
    if (regId && receptionChanges?.[regId] === true) return;
    const openedPatientId = Number(opened?.patientBaseInfo?.patientId ?? 0);
    if (openedPatientId !== patientId) return;

    const receptionDateTime =
      opened?.receptionDateTime instanceof Date
        ? opened.receptionDateTime
        : opened?.receptionDateTime
          ? new Date(opened.receptionDateTime)
          : null;
    const isVitalToday = getIsVitalToday(
      receptionDateTime ?? undefined,
      vitalReceptionList
    );

    updateOpenedReception(regId, {
      bioMeasurementsInfo: {
        ...(opened.bioMeasurementsInfo ?? {}),
        vital: vitalReceptionList,
        modifyItemList: opened.bioMeasurementsInfo?.modifyItemList ?? [],
      },
      patientBaseInfo: {
        ...(opened.patientBaseInfo ?? {}),
        isVitalToday,
      },
    });
  });

  // useReceptionStore: registrations + currentRegistration
  const {
    registrations,
    currentRegistration,
    updateRegistration,
    updateCurrentRegistration,
  } = useReceptionStore.getState();

  (registrations ?? []).forEach((reg: any) => {
    const regPatientId = Number(reg?.patientId ?? reg?.patient?.id ?? 0);
    if (regPatientId !== patientId) return;
    if (!reg.id) return;

    updateRegistration(reg.id, {
      patient: {
        ...(reg.patient ?? {}),
        vitalSignMeasurements: vitals,
      },
    } as any);
  });

  if (currentRegistration) {
    const currentPatientId = Number(
      (currentRegistration as any)?.patientId ?? (currentRegistration as any)?.patient?.id ?? 0
    );
    if (currentPatientId === patientId && (currentRegistration as any)?.patient) {
      updateCurrentRegistration({
        patient: {
          ...((currentRegistration as any).patient ?? {}),
          vitalSignMeasurements: vitals,
        },
      } as any);
    }
  }
}

/**
 * 바이탈 사인 측정(vital_sign_measurement) 소켓 이벤트 리스너.
 * db.vital_sign_measurement 이벤트 수신 시:
 * - 해당 환자의 vital-sign-measurements 쿼리를 무효화하여 VitalMain / VitalGrid 등에서 최신 데이터를 표시하고,
 * - useReceptionTabsStore의 해당 patientId reception들의 bioMeasurementsInfo를 최신 바이탈로 덮어씌운다.
 */
export function useVitalSocketListener() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { hospital } = useHospitalStore();

  const refetchVitalQueries = useCallback(
    (patientId?: number | string) => {
      const pid = patientId != null ? Number(patientId) : null;
      const predicate = (query: { queryKey: readonly unknown[] }) => {
        const key = query.queryKey;
        if (!Array.isArray(key) || key[0] !== "vital-sign-measurements")
          return false;
        if (pid == null) return true;
        const keyPatientId = key[1] === "pivot" ? key[2] : key[1];
        return Number(keyPatientId) === pid;
      };
      queryClient.invalidateQueries({ predicate });
      // type 생략 → active/inactive 모두 refetch. 접수에서 수정 시 의료(patient-info-bar) 쿼리는
      // 그때 unmount 상태일 수 있어 inactive이므로, 전부 refetch 해야 캐시가 갱신되고 의료 쪽에도 반영됨
      queryClient.refetchQueries({ predicate });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!socket) return;

    const handleAnyMessage = async (eventName: string, ...args: any[]) => {
      const payload = args?.[0];
      const isDbEvent =
        typeof eventName === "string" && eventName.startsWith("db.");
      if (!isDbEvent) return;

      const table = payload?.table;
      if (table !== "vital_sign_measurement")
        return;

      if (hospital?.id) {
        const evtHospitalId =
          payload?.hospitalId ??
          payload?.hospital?.id ??
          payload?.new?.hospitalId ??
          payload?.record?.hospitalId;
        if (evtHospitalId && Number(evtHospitalId) !== Number(hospital.id)) {
          return;
        }
      }

      const record =
        payload?.new ?? payload?.record ?? payload?.data ?? payload;
      const patientIdRaw =
        record?.patientId ??
        payload?.patientId ??
        record?.patient?.id ??
        payload?.patient?.id;
      const patientId =
        patientIdRaw != null ? Number(patientIdRaw) : null;

      try {
        refetchVitalQueries(patientId != null ? patientId : undefined);

        if (patientId != null && Number.isFinite(patientId)) {
          const selectedDate =
            useSelectedDateStore.getState().selectedDate ?? new Date();
          const dateStr = formatDateByPattern(selectedDate, "YYYY-MM-DD");
          if (dateStr) {
            const vitals = await VitalSignMeasurementsService.getVitalSignMeasurements(
              patientId,
              dateStr,
              dateStr
            );
            updateReceptionsForVital(patientId, vitals);
          }
        }
      } catch (err) {
        console.error("[vitalSocketListener] vital 쿼리 갱신 실패:", err);
      }
    };

    const handleConnect = () => {
      socket.onAny(handleAnyMessage);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      if (socket.connected) {
        socket.offAny(handleAnyMessage);
      }
    };
  }, [socket, hospital?.id, refetchVitalQueries]);
}
