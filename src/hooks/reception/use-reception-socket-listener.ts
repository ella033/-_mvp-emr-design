import { useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useReceptionStore } from "@/store/common/reception-store";
import { useAppointmentStore } from "@/store/appointment-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useSelectedDateStore } from "@/store/reception";
import { convertKSTDateToUTCRange } from "@/lib/date-utils";
import { registrationKeys } from "@/lib/query-keys/registrations";
import { RegistrationsService } from "@/services/registrations-service";
import { AppointmentsService } from "@/services/appointments-service";
import { PaymentsServices } from "@/services/payments-services";
import type { ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";
import { 접수상태 } from "@/constants/common/common-enum";


export function useReceptionSocketListener() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { setRegistrations, setAppointments: setReceptionAppointments } =
    useReceptionStore();
  const { setAppointments: setStoreAppointments } = useAppointmentStore();
  const { hospital } = useHospitalStore();
  const { selectedDate } = useSelectedDateStore();
  const selectedDateKey = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const refetchRegistrations = useCallback(async () => {
    if (!hospital?.id) return;
    try {
      // 클로저에 캡처된 selectedDate 대신 store에서 최신 값을 직접 읽어온다.
      const currentSelectedDate = useSelectedDateStore.getState().selectedDate;
      const { beginUTC, endUTC } = convertKSTDateToUTCRange(currentSelectedDate);
      const registrations =
        await RegistrationsService.getRegistrationsByHospital(
          hospital.id.toString(),
          beginUTC,
          endUTC
        );

      setRegistrations(registrations as any);

      // 소켓 리스너가 이미 store를 직접 갱신했으므로,
      // React Query 캐시도 동일 데이터로 동기화한다.
      // 주의: invalidateQueries(registrationKeys.all)를 사용하면
      //   initial-data-fetcher / management-page 등 다른 컴포넌트의
      //   쿼리까지 무효화되어 store를 덮어쓰는 경쟁 조건이 발생할 수 있으므로,
      //   동일 날짜 범위의 특정 키만 setQueryData로 갱신한다.
      const queryKey = registrationKeys.byHospital(
        hospital.id.toString(),
        beginUTC,
        endUTC
      );
      queryClient.setQueryData(queryKey, registrations);
    } catch (error) {
      console.error("[receptionSocketListener] registrations 재조회 실패:", error);
    }
  }, [
    hospital?.id,
    setRegistrations,
    queryClient,
  ]);

  const receiptSyncInFlightRef = useRef(false);
  const lastReceiptSyncAtRef = useRef(0);
  const registrationRefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRegistrationPayloadRef = useRef<any>(null);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const invalidateEncounterQueryByPayload = (payload: any) => {
      const registrationPayload =
        payload?.registration ?? payload?.data ?? payload?.new ?? payload?.record ?? payload;
      if (!registrationPayload) return;

      const encounterId =
        registrationPayload?.encounterId ??
        PaymentsServices.getLatestEncounterId(registrationPayload?.encounters) ??
        registrationPayload?.encounter?.id;

      if (!encounterId) return;

      const key = ["encounter", String(encounterId)];
      // inactive(캐시에만 존재) 쿼리도 포함해 refetch하여,
      // 라우트 이동(/medical → /reception) 후에도 encounter(orders/symptom)가 최신으로 수렴하도록 처리
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.refetchQueries({ queryKey: key, type: "all" });
    };

    const receiptQueryPredicate = (query: { queryKey: readonly unknown[] }) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === "activeReceiptDetails";
    };

    const getReceiptQueryKey = (patientId: string, encounterId: string) => [
      "activeReceiptDetails",
      patientId,
      encounterId,
    ];

    const getReceiptSignature = (receipts: ReceiptDetailsResponse[] = []) =>
      receipts
        .map((r) => String(r?.id ?? ""))
        .filter(Boolean)
        .sort()
        .join("|");

    const kstDayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const toKstDateKey = (value: unknown): string | null => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(String(value));
      if (Number.isNaN(date.getTime())) return null;
      return kstDayFormatter.format(date);
    };

    const shouldSyncSelectedDateOnly = (
      payload: any,
      table: "registration" | "appointment"
    ) => {
      const base = payload?.registration ?? payload?.data ?? payload?.new ?? payload?.record ?? payload;

      const candidates =
        table === "registration"
          ? [
              base?.receptionDateTime,
              payload?.new?.receptionDateTime,
              payload?.old?.receptionDateTime,
              payload?.data?.receptionDateTime,
            ]
          : [
              base?.appointmentStartTime,
              payload?.new?.appointmentStartTime,
              payload?.old?.appointmentStartTime,
              payload?.data?.appointmentStartTime,
            ];

      for (const candidate of candidates) {
        const eventDateKey = toKstDateKey(candidate);
        if (!eventDateKey) continue;
        return eventDateKey === selectedDateKey;
      }

      // payload에서 날짜를 식별할 수 없으면 기존 동작 유지(호환성 우선)
      return true;
    };

    const invalidateActiveReceiptDetails = () => {
      queryClient.invalidateQueries({
        predicate: receiptQueryPredicate,
      });
    };

    // registration 이벤트 직후 receipt 조회가 아직 반영되지 않은 케이스(일시적 eventual consistency)를 위해
    // "해당 환자/encounter" 쿼리만 재시도하며, 결과가 바뀌면 중단
    let deferredReceiptSyncTimers: Array<ReturnType<typeof setTimeout>> = [];

    // per-encounter throttle: 동일 encounter에 대한 receipt sync가 짧은 시간 내 중복 실행되는 것을 방지
    const receiptSyncLastAt = new Map<string, number>();
    const RECEIPT_SYNC_THROTTLE_MS = 3000;

    const refetchReceiptUntilChanged = async (
      patientId: string,
      encounterId: string,
      attemptsLeft: number
    ) => {
      if (attemptsLeft <= 0) return;

      const queryKey = getReceiptQueryKey(patientId, encounterId);
      const prev = queryClient.getQueryData<ReceiptDetailsResponse[]>(queryKey) ?? [];
      const prevSignature = getReceiptSignature(prev);

      const next = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => PaymentsServices.getActiveReceiptDetails(patientId, encounterId),
        staleTime: 0,
      });
      const nextSignature = getReceiptSignature(next ?? []);

      if (nextSignature !== prevSignature) {
        return;
      }

      const delaysMs = [300, 800, 2000];
      const delay = delaysMs[delaysMs.length - attemptsLeft] ?? 2000;
      const timer = setTimeout(() => {
        refetchReceiptUntilChanged(patientId, encounterId, attemptsLeft - 1);
      }, delay);
      deferredReceiptSyncTimers.push(timer);
    };

    const tryTargetedReceiptSync = async (payload: any) => {
      const registrationPayload =
        payload?.registration ?? payload?.data ?? payload?.new ?? payload?.record ?? payload;
      if (!registrationPayload) return false;

      const patientId =
        registrationPayload?.patientId ??
        registrationPayload?.patient?.id ??
        registrationPayload?.patientBaseInfo?.patientId;
      const encounterId =
        registrationPayload?.encounterId ??
        PaymentsServices.getLatestEncounterId(registrationPayload?.encounters) ??
        registrationPayload?.encounter?.id;

      if (!patientId || !encounterId) return false;

      const shouldSyncReceipts =
        registrationPayload?.hasReceipt === true ||
        registrationPayload?.status === 접수상태.수납완료;
      if (!shouldSyncReceipts) return false;

      // per-encounter throttle: 최근 동일 encounter에 대해 receipt sync가 실행되었으면 skip
      const syncKey = `${patientId}:${encounterId}`;
      const lastAt = receiptSyncLastAt.get(syncKey) ?? 0;
      if (Date.now() - lastAt < RECEIPT_SYNC_THROTTLE_MS) {
        return true;
      }
      receiptSyncLastAt.set(syncKey, Date.now());

      await refetchReceiptUntilChanged(String(patientId), String(encounterId), 3);
      return true;
    };

    // 선택된 날짜의 appointments API 재조회 및 store 업데이트
    const refetchAppointments = async () => {
      if (!hospital?.id) return;

      try {
        const { beginUTC, endUTC } = convertKSTDateToUTCRange(selectedDate);
        const appointments = await AppointmentsService.getAppointmentsByHospital(
          hospital.id,
          beginUTC,
          endUTC
        );

        // store 업데이트 (single source of truth)
        setStoreAppointments(appointments);
        setReceptionAppointments(appointments);

        // 예약 캘린더(예약 라우트) 강제 리로드를 위해 커스텀 이벤트 발생
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("appointmentCreated"));
        }

        // 다른 페이지/컴포넌트가 React Query로 직접 구독하는 경우를 위해
        // 해당 hospital의 appointments 쿼리를 무효화
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              Array.isArray(key) &&
              key[0] === "appointments" &&
              key[1] === "hospital" &&
              Number(key[2]) === Number(hospital.id)
            );
          },
        });
      } catch (error) {
        console.error("[receptionSocketListener] appointments 재조회 실패:", error);
      }
    };

    // 선택된 날짜의 registrations API 재조회 및 store 업데이트
    const refetchRegistrationsFromSocket = async () => {
      await refetchRegistrations();
    };

    // 모든 소켓 메시지 수신
    const handleAnyMessage = async (eventName: string, ...args: any[]) => {
      try {
        const payload = args?.[0];

        // hospital 스코프가 맞지 않으면 무시
        if (hospital?.id) {
          const evtHospitalId =
            payload?.hospitalId ??
            payload?.hospital?.id ??
            payload?.appointment?.hospitalId ??
            payload?.registration?.hospitalId;
          if (evtHospitalId && Number(evtHospitalId) !== Number(hospital.id)) {
            return;
          }
        }
        // DB 이벤트: 서버가 db.patch 등으로 확장될 수 있어 prefix 기반으로 처리
        const isDbEvent = typeof eventName === "string" && eventName.startsWith("db.");

        if (isDbEvent) {
          const table = payload?.table;


        // appointment 관련 이벤트: 선택된 날짜의 API 재조회 + 예약 캘린더 캐시 무효화
        if (table === "appointment") {
          if (shouldSyncSelectedDateOnly(payload, "appointment")) {
            await refetchAppointments(); // store 갱신 + appointmentCreated 디스패치
          } else {
            // 다른 날짜의 예약 이벤트여도 예약 페이지(contents-panel) 캐시 무효화
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("appointmentCreated"));
            }
          }
        }

        // registration 관련 이벤트: 선택된 날짜의 API 재조회
        if (table === "registration") {
          if (!shouldSyncSelectedDateOnly(payload, "registration")) {
            return;
          }
          // 이 클라이언트가 방금 updateRegistration으로 수정한 접수면 소켓 refetch 생략 (이중 갱신 방지)
          const registrationPayload =
            payload?.registration ?? payload?.data ?? payload?.new ?? payload?.record ?? payload;
          const eventRegistrationId = registrationPayload?.id?.toString?.() ?? registrationPayload?.id;
          const { lastLocalRegistrationUpdate } = useReceptionStore.getState();
          const RECENT_MS = 2000;
          if (
            eventRegistrationId &&
            lastLocalRegistrationUpdate &&
            lastLocalRegistrationUpdate.registrationId === eventRegistrationId &&
            Date.now() - lastLocalRegistrationUpdate.at < RECENT_MS
          ) {
            // null 초기화하지 않음 — RECENT_MS(2초) 동안 동일 registrationId의 모든 소켓 이벤트를 차단
            return;
          }
          // 연속 소켓 이벤트를 800ms debounce로 병합하여 API 중복 호출 방지
          if (registrationRefetchTimerRef.current) {
            clearTimeout(registrationRefetchTimerRef.current);
          }
          pendingRegistrationPayloadRef.current = payload;
          registrationRefetchTimerRef.current = setTimeout(async () => {
            registrationRefetchTimerRef.current = null;
            const latestPayload = pendingRegistrationPayloadRef.current;
            await refetchRegistrationsFromSocket();
            // receipts 기반 UI(patient-card/paymentInfo)가 최신 상태로 수렴하도록 activeReceiptDetails 동기화
            if (deferredReceiptSyncTimers.length > 0) {
              deferredReceiptSyncTimers.forEach((timer) => clearTimeout(timer));
              deferredReceiptSyncTimers = [];
            }
            const didTargetedSync = await tryTargetedReceiptSync(latestPayload);
            if (!didTargetedSync) {
              invalidateActiveReceiptDetails();
            }
            // registration 업데이트로 encounter(orders/symptom)가 바뀌는 케이스가 있어
            // 해당 encounter 쿼리도 무효화/갱신하여 PaymentOrders 등이 최신으로 수렴하도록 한다.
            invalidateEncounterQueryByPayload(latestPayload);
          }, 800);
        }
      }
      } catch (error) {
        console.error('[useReceptionSocketListener] error in handleAnyMessage:', error);
        // 에러가 발생해도 다른 리스너가 호출될 수 있도록 에러를 다시 throw하지 않음
      }
    };

    // 소켓 연결 시에만 리스너 등록
    const handleConnect = () => {
      socket.onAny(handleAnyMessage);
    };

    // 이미 연결되어 있으면 바로 등록
    if (socket.connected) {
      handleConnect();
    }

    // 연결 이벤트 구독
    socket.on("connect", handleConnect);

    return () => {
      // 리스너 해제
      socket.off("connect", handleConnect);
      if (socket.connected) {
        socket.offAny(handleAnyMessage);
      }
      if (deferredReceiptSyncTimers.length > 0) {
        deferredReceiptSyncTimers.forEach((timer) => clearTimeout(timer));
      }
      if (registrationRefetchTimerRef.current) {
        clearTimeout(registrationRefetchTimerRef.current);
        registrationRefetchTimerRef.current = null;
      }
    };
  }, [
    socket,
    queryClient,
    hospital,
    selectedDate,
    selectedDateKey,
    setRegistrations,
    setReceptionAppointments,
    setStoreAppointments,
    refetchRegistrations,
  ]);

  // receipt 상세는 React Query로 보정. store와 불일치 시 registrations를 재조회
  useEffect(() => {
    const queryCache = queryClient.getQueryCache();
    const unsubscribe = queryCache.subscribe((event) => {
      const query = event?.query;
      const key = query?.queryKey;
      if (!Array.isArray(key) || key[0] !== "activeReceiptDetails") {
        return;
      }

      const patientId = String(key[1] ?? "");
      const encounterId = String(key[2] ?? "");
      if (!patientId || !encounterId) return;

      const data = query?.state?.data as ReceiptDetailsResponse[] | undefined;
      const hasReceipts = Array.isArray(data) && data.length > 0;
      if (!hasReceipts) return;

      const { registrations } = useReceptionStore.getState();
      const matched = registrations.find((reg) => {
        const regPatientId = reg.patientId ?? reg.patient?.id;
        if (!regPatientId || String(regPatientId) !== patientId) return false;
        const regEncounterId =
          PaymentsServices.getLatestEncounterId(reg.encounters as any) ??
          (reg as any)?.encounter?.id ??
          (reg as any)?.encounterId;
        if (!regEncounterId) return false;
        return String(regEncounterId) === encounterId;
      });

      if (!matched) return;

      const hasReceipt = (matched as any)?.hasReceipt === true;
      const isPaymentCompleted = matched.status === 접수상태.수납완료;
      if (hasReceipt && isPaymentCompleted) return;

      const now = Date.now();
      if (receiptSyncInFlightRef.current || now - lastReceiptSyncAtRef.current < 1500) {
        return;
      }

      receiptSyncInFlightRef.current = true;
      lastReceiptSyncAtRef.current = now;
      refetchRegistrations()
        .catch(() => undefined)
        .finally(() => {
          receiptSyncInFlightRef.current = false;
        });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, refetchRegistrations]);

  // selectedDate 변경 시 해당 날짜의 React Query 쿼리만 무효화
  useEffect(() => {
    if (!hospital?.id) {
      return;
    }

    const { beginUTC, endUTC } = convertKSTDateToUTCRange(selectedDate);

    // appointments 쿼리 무효화 (정확한 begin/end를 갖는 쿼리만)
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key[0] === "appointments" &&
          key[1] === "hospital" &&
          key[2] === hospital.id && // hospitalId 일치
          key[3] === beginUTC &&
          key[4] === endUTC
        );
      },
    });

    // registrations 쿼리 무효화 (정확한 begin/end를 갖는 쿼리만)
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key[0] === "registrations" &&
          key[1] === "hospital" &&
          key[2] === hospital.id.toString() && // hospitalId 일치
          key[3] === beginUTC &&
          key[4] === endUTC
        );
      },
    });
  }, [selectedDate, hospital?.id, queryClient]);
}
