import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useAppointmentStore } from "@/store/appointment-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { useReceptionTabsStore } from "@/store/reception";
import { ConsentPrivacyType } from "@/constants/common/common-enum";
import type { Patient } from "@/types/patient-types";
import type { Appointment } from "@/types/appointments/appointments";
import type { Registration } from "@/types/registration-types";
import type { Reception } from "@/types/common/reception-types";

/**
 * 환자(patient) 테이블 변경 소켓 이벤트 리스너.
 * @description
 * 백엔드에서 db.* 이벤트로 table === "patient" 변경을 발행하면,
 * 접수 화면에서 의존하는 appointments / registrations의 "해당 환자" 정보만 부분 업데이트하여
 * 리스트/카드 UI가 즉시 최신 상태로 수렴되게 한다.
 *
 * - patient 이벤트는 보통 카드에 표시되는 patient 필드(name/phone/address 등)만 바뀌므로
 *   전체 refetch(appointments/registrations)는 과도할 수 있다.
 * - registration/appointment 자체 변경(상태/정렬/수납 등)은 기존 reception socket listener에서 refetch로 처리한다.
 */
export function usePatientSocket() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { hospital } = useHospitalStore();

  // 소켓 이벤트가 연속으로 들어올 때 과도한 업데이트를 방지 (짧은 쿨다운)
  const syncInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);

  const coerceConsentPrivacy = (value: unknown): ConsentPrivacyType | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return ConsentPrivacyType.미동의;
    if (typeof value === "boolean") {
      return value ? ConsentPrivacyType.동의 : ConsentPrivacyType.미동의;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    if (n === ConsentPrivacyType.미동의 || n === ConsentPrivacyType.동의 || n === ConsentPrivacyType.거부) {
      return n as ConsentPrivacyType;
    }
    return undefined;
  };

  const coerceMarketingBool = (value: unknown): boolean | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      if (value === "1" || value.toLowerCase() === "true") return true;
      if (value === "0" || value.toLowerCase() === "false") return false;
    }
    return undefined;
  };

  const mergeConsent = (
    prev: Patient["consent"] | undefined,
    incoming: unknown
  ): Patient["consent"] | undefined => {
    if (incoming === undefined) return prev;
    if (incoming === null) return null;
    if (!incoming || typeof incoming !== "object") return prev;

    const prevObj = prev && typeof prev === "object" ? (prev as any) : null;
    const nextObj = incoming as any;

    const privacy = coerceConsentPrivacy(nextObj?.privacy) ?? prevObj?.privacy;
    const marketing = coerceMarketingBool(nextObj?.marketing) ?? prevObj?.marketing;

    const merged: any = {
      ...(prevObj ?? {}),
      ...nextObj,
    };
    if (privacy !== undefined) merged.privacy = privacy;
    if (marketing !== undefined) merged.marketing = marketing;
    return merged as Patient["consent"];
  };

  const applyConsentToReceptionPatientBaseInfoPatch = (
    patch: Record<string, any>,
    incoming: unknown
  ) => {
    if (incoming === undefined) return;
    if (incoming === null) {
      patch.isPrivacy = ConsentPrivacyType.미동의;
      patch.recvMsg = 1;
      return;
    }
    if (!incoming || typeof incoming !== "object") return;

    const privacy = coerceConsentPrivacy((incoming as any)?.privacy);
    if (privacy !== undefined) patch.isPrivacy = privacy;

    const marketing = coerceMarketingBool((incoming as any)?.marketing);
    if (marketing !== undefined) patch.recvMsg = marketing ? 1 : 0;
  };

  const getPatientRecordFromPayload = (payload: any): Partial<Patient> | null => {
    const record =
      payload?.new ??
      payload?.record ??
      payload?.data ??
      payload?.patient ??
      payload;
    if (!record || typeof record !== "object") return null;
    return record as Partial<Patient>;
  };

  const getPatientIdFromRecord = (record: Partial<Patient> | null, payload: any) => {
    const raw =
      (record as any)?.id ??
      (record as any)?.patientId ??
      payload?.patientId ??
      payload?.id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const buildReceptionPatientBaseInfoPatch = (record: Partial<Patient>) => {
    const patch: Record<string, any> = {};
    if ((record as any).id != null) patch.patientId = String((record as any).id);
    if (record.name != null) patch.name = record.name;
    if (record.rrn !== undefined) patch.rrn = record.rrn;
    if (record.gender !== undefined) patch.gender = record.gender;
    if (record.birthDate !== undefined) patch.birthDate = record.birthDate;
    if (record.phone1 != null) patch.phone1 = record.phone1;
    if (record.phone2 !== undefined) patch.phone2 = record.phone2;
    if ((record as any).address1 !== undefined) patch.address = (record as any).address1;
    if ((record as any).address2 !== undefined) patch.address2 = (record as any).address2;
    if ((record as any).zipcode !== undefined) patch.zipcode = (record as any).zipcode;
    if (record.doctorId !== undefined) patch.doctorId = record.doctorId;
    if (record.groupId !== undefined) patch.groupId = record.groupId;
    if ((record as any).patientNo !== undefined) patch.patientNo = (record as any).patientNo;
    if ((record as any).memo !== undefined) patch.memo = (record as any).memo;
    if ((record as any).clinicalMemo !== undefined) patch.clinicalMemo = (record as any).clinicalMemo;
    applyConsentToReceptionPatientBaseInfoPatch(patch, (record as any).consent);
    return patch;
  };

  const patchAppointmentsInStore = (patientId: number, record: Partial<Patient>) => {
    const { appointments, setAppointments } = useReceptionStore.getState();
    const { setAppointments: setAppointmentsOnly } = useAppointmentStore.getState();
    const current = Array.isArray(appointments) ? (appointments as Appointment[]) : [];
    if (current.length === 0) return;

    let changed = false;
    const next = current.map((apt) => {
      const aptPatientId = Number((apt as any).patientId ?? apt?.patient?.id ?? 0);
      if (aptPatientId !== patientId) return apt;
      changed = true;
      const { consent: _consent, ...recordRest } = record as any;
      const nextConsent =
        (record as any).consent !== undefined
          ? mergeConsent((apt.patient as any)?.consent, (record as any).consent)
          : (apt.patient as any)?.consent;
      return {
        ...apt,
        patient: {
          ...(apt.patient as any),
          ...recordRest,
          ...( (record as any).consent !== undefined ? { consent: nextConsent } : {} ),
        },
      };
    });

    if (changed) {
      setAppointments(next as any);
      setAppointmentsOnly(next as any);
    }
  };

  const patchRegistrationsInStore = (patientId: number, record: Partial<Patient>) => {
    const { registrations, setRegistrations, currentRegistration, updateCurrentRegistration } =
      useReceptionStore.getState();
    if (!Array.isArray(registrations) || registrations.length === 0) return;

    let changed = false;
    const nextRegs = (registrations as Registration[]).map((reg) => {
      const regPatientId = Number((reg as any).patientId ?? reg?.patient?.id ?? 0);
      if (regPatientId !== patientId) return reg;
      if (!reg.patient) return reg;
      changed = true;
      const { consent: _consent, ...recordRest } = record as any;
      const nextConsent =
        (record as any).consent !== undefined
          ? mergeConsent((reg.patient as any)?.consent, (record as any).consent)
          : (reg.patient as any)?.consent;
      return {
        ...reg,
        patient: {
          ...(reg.patient as any),
          ...recordRest,
          ...( (record as any).consent !== undefined ? { consent: nextConsent } : {} ),
        },
      };
    });

    if (changed) {
      setRegistrations(nextRegs);
    }

    // 현재 선택된 registration도 동기화
    if (
      currentRegistration?.patientId === patientId &&
      (currentRegistration as any)?.patient
    ) {
      const currentPatient = (currentRegistration as any).patient ?? {};
      const { consent: _consent, ...recordRest } = record as any;
      const nextConsent =
        (record as any).consent !== undefined
          ? mergeConsent((currentPatient as any)?.consent, (record as any).consent)
          : (currentPatient as any)?.consent;
      updateCurrentRegistration({
        patient: {
          ...currentPatient,
          ...recordRest,
          ...( (record as any).consent !== undefined ? { consent: nextConsent } : {} ),
        },
      } as any);
    }
  };

  const patchOpenedReceptionsInTabsStore = (
    patientId: number,
    record: Partial<Patient>
  ) => {
    const { openedReceptions, setOpenedReceptions, receptionChanges } =
      useReceptionTabsStore.getState() as any;
    if (!Array.isArray(openedReceptions) || openedReceptions.length === 0) return;

    const patientBaseInfoPatch = buildReceptionPatientBaseInfoPatch(record);
    if (Object.keys(patientBaseInfoPatch).length === 0) return;

    let changed = false;
    const next = (openedReceptions as Reception[]).map((opened) => {
      const regId = (opened as any)?.originalRegistrationId;
      if (regId && receptionChanges?.[regId] === true) {
        return opened;
      }

      const openedPatientId = Number((opened as any)?.patientBaseInfo?.patientId ?? 0);
      if (openedPatientId !== patientId) return opened;

      changed = true;
      return {
        ...(opened as any),
        patientBaseInfo: {
          ...((opened as any).patientBaseInfo ?? {}),
          ...patientBaseInfoPatch,
        },
      };
    });

    if (changed) {
      setOpenedReceptions(next);
    }
  };

  const patchReactQueryCaches = (patientId: number, record: Partial<Patient>) => {
    // appointments 리스트 캐시: 해당 patient만 patient 필드 병합
    queryClient.setQueriesData(
      {
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === "appointments";
        },
      },
      (old: unknown) => {
        if (!Array.isArray(old)) return old;
        let changed = false;
        const next = (old as Appointment[]).map((apt) => {
          const pid = Number((apt as any).patientId ?? apt?.patient?.id ?? 0);
          if (pid !== patientId) return apt;
          changed = true;
          const { consent: _consent, ...recordRest } = record as any;
          const nextConsent =
            (record as any).consent !== undefined
              ? mergeConsent((apt.patient as any)?.consent, (record as any).consent)
              : (apt.patient as any)?.consent;
          return {
            ...apt,
            patient: {
              ...(apt.patient as any),
              ...recordRest,
              ...( (record as any).consent !== undefined ? { consent: nextConsent } : {} ),
            },
          };
        });
        return changed ? next : old;
      }
    );

    // registrations 리스트 캐시: 해당 patient만 patient 필드 병합
    queryClient.setQueriesData(
      {
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === "registrations";
        },
      },
      (old: unknown) => {
        if (!Array.isArray(old)) return old;
        let changed = false;
        const next = (old as Registration[]).map((reg) => {
          const pid = Number((reg as any).patientId ?? reg?.patient?.id ?? 0);
          if (pid !== patientId) return reg;
          if (!reg.patient) return reg;
          changed = true;
          const { consent: _consent, ...recordRest } = record as any;
          const nextConsent =
            (record as any).consent !== undefined
              ? mergeConsent((reg.patient as any)?.consent, (record as any).consent)
              : (reg.patient as any)?.consent;
          return {
            ...reg,
            patient: {
              ...(reg.patient as any),
              ...recordRest,
              ...( (record as any).consent !== undefined ? { consent: nextConsent } : {} ),
            },
          };
        });
        return changed ? next : old;
      }
    );
  };

  useEffect(() => {
    if (!socket) return;

    const handleAnyMessage = async (eventName: string, ...args: any[]) => {
      const payload = args?.[0];
      const isDbEvent =
        typeof eventName === "string" && eventName.startsWith("db.");
      if (!isDbEvent) return;

      if (payload?.table !== "patient") return;

      // hospital 컨텍스트가 맞지 않으면 무시 (가능한 필드들에서 hospitalId 추출)
      if (hospital?.id) {
        const evtHospitalId =
          payload?.hospitalId ??
          payload?.hospital?.id ??
          payload?.data?.hospitalId ??
          payload?.data?.hospital_id ??
          payload?.new?.hospitalId ??
          payload?.record?.hospitalId ??
          payload?.patient?.hospitalId ??
          payload?.patient?.hospital_id;

        if (evtHospitalId && Number(evtHospitalId) !== Number(hospital.id)) {
          return;
        }
      }

      const now = Date.now();
      if (syncInFlightRef.current || now - lastSyncAtRef.current < 800) {
        return;
      }

      syncInFlightRef.current = true;
      lastSyncAtRef.current = now;
      try {
        const record = getPatientRecordFromPayload(payload);
        const patientId = getPatientIdFromRecord(record, payload);

        if (!record || !patientId) {
          // payload에 환자 정보가 충분하지 않으면, 여기서 무리하게 전체 refetch를 하진 않는다.
          // (필요 시: patient 이벤트 payload 포맷 확정 후 PatientsService.getPatient(patientId)로 1건 조회로 보완 가능)
          return;
        }

        patchAppointmentsInStore(patientId, record);
        patchRegistrationsInStore(patientId, record);
        patchOpenedReceptionsInTabsStore(patientId, record);
        patchReactQueryCaches(patientId, record);
      } finally {
        syncInFlightRef.current = false;
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
  }, [
    socket,
    hospital?.id,
    queryClient,
  ]);
}

