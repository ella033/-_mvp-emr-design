import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { RegistrationsService } from "@/services/registrations-service";

/**
 * encounter 관련 테이블(encounter, order, disease 등) 소켓 이벤트 리스너.
 *
 * db.* 이벤트 수신 시 해당 encounterId를 가진 registration을 재조회하여
 * receptionStore / receptionTabsStore / React Query 캐시를 최신 상태로 갱신한다.
 */
export function useEncounterSocketListener() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { hospital } = useHospitalStore();

  const syncInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);
  // 쿨다운 중 수신된 마지막 이벤트 (trailing-edge 처리용)
  const pendingEventRef = useRef<{ table: string; payload: any } | null>(null);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * registrations 목록에서 patientId를 추출하는 헬퍼.
   */
  const getPatientIdFromStore = useCallback(
    (registrationId: string): number => {
      const { registrations } = useReceptionStore.getState();
      const reg = registrations.find((r) => String(r.id) === registrationId);
      if (!reg) return 0;
      return Number(reg.patientId ?? (reg.patient as any)?.id ?? 0);
    },
    []
  );

  /**
   * encounterId로 registrations 목록에서 해당 registration을 찾아 반환.
   */
  const findRegistrationByEncounterId = useCallback(
    (encounterId: string): { registrationId: string; patientId: number } | null => {
      const { registrations } = useReceptionStore.getState();
      for (const reg of registrations) {
        const encounters = (reg as any).encounters;
        if (!Array.isArray(encounters)) continue;

        const match = encounters.some(
          (enc: any) => String(enc?.id) === encounterId
        );
        if (match && reg.id) {
          const patientId = Number(reg.patientId ?? (reg.patient as any)?.id ?? 0);
          return { registrationId: reg.id, patientId };
        }
      }
      return null;
    },
    []
  );

  /**
   * 단일 registration을 재조회하여 store(receptionStore, receptionTabsStore) 및 캐시를 갱신.
   * 소켓 이벤트 컨텍스트에서 호출되므로 lastLocalRegistrationUpdate 가드를 설정하지 않는다.
   */
  const refreshRegistrationById = useCallback(
    async (registrationId: string) => {
      try {
        const refreshed = await RegistrationsService.getRegistration(registrationId);
        if (!refreshed) return;

        // receptionStore: registrations 목록 내 해당 항목 부분 갱신
        // skipLocalUpdateGuard: 소켓 이벤트에 의한 갱신이므로 registration 소켓 리스너 가드를 설정하지 않음
        const { updateRegistration, currentRegistration, updateCurrentRegistration } =
          useReceptionStore.getState();

        updateRegistration(registrationId, refreshed as any, { skipLocalUpdateGuard: true });

        // currentRegistration 동기화
        if (currentRegistration && (currentRegistration as any).id === registrationId) {
          updateCurrentRegistration(refreshed as any);
        }

        // receptionTabsStore: openedReceptions 동기화는
        // reception-tabs-store의 subscribe가 자동 처리
      } catch (err) {
        console.error("[encounterSocketListener] registration 재조회 실패:", err);
      }
    },
    []
  );

  /**
   * encounter 쿼리 캐시 무효화 + refetch.
   */
  const invalidateEncounterQuery = useCallback(
    (encounterId: string) => {
      const key = ["encounter", encounterId];
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.refetchQueries({ queryKey: key, type: "all" });
    },
    [queryClient]
  );

  /**
   * patient charts 쿼리 캐시 무효화.
   * PatientCard의 receptionEncounter, EncounterHistory 등이 usePatientCharts(["patient", patientId, "charts", ...])를
   * 사용하므로, encounter/order/disease 변경 시 해당 patient의 charts 쿼리를 무효화해야 UI가 갱신된다.
   */
  const invalidatePatientChartsQuery = useCallback(
    (patientId: number) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "patient" &&
            Number(key[1]) === patientId &&
            key[2] === "charts"
          );
        },
      });
    },
    [queryClient]
  );

  // ── 테이블별 핸들러 ──

  /**
   * encounter 테이블 이벤트 처리.
   * payload.data.encounterId (또는 payload에서 추출 가능한 encounterId)를 기준으로
   * 해당 registration을 재조회하여 store를 갱신한다.
   */
  /**
   * 공통: registration 재조회 후 관련 쿼리 캐시를 무효화.
   * registration store 갱신 → openedReceptions 동기화가 완료된 뒤에
   * 쿼리를 무효화해야, 컴포넌트 리마운트로 인한 stale 캐시 사용을 방지한다.
   */
  const refreshAndInvalidate = useCallback(
    async (
      registrationId: string | null,
      encounterId: string,
      extraInvalidate?: () => void
    ) => {
      // 1) registration 재조회 → store 갱신 (openedReceptions 포함)
      if (registrationId) {
        await refreshRegistrationById(registrationId);
      }

      // 2) store 갱신 완료 후 쿼리 캐시 무효화 (컴포넌트가 새 데이터를 구독)
      invalidateEncounterQuery(encounterId);
      extraInvalidate?.();

      // 3) patient charts 무효화 (patientId를 store에서 확보)
      const pid = registrationId
        ? getPatientIdFromStore(registrationId)
        : (findRegistrationByEncounterId(encounterId)?.patientId ?? 0);
      if (pid > 0) {
        invalidatePatientChartsQuery(pid);
      }
    },
    [refreshRegistrationById, invalidateEncounterQuery, invalidatePatientChartsQuery, getPatientIdFromStore, findRegistrationByEncounterId]
  );

  const handleEncounterTableEvent = useCallback(
    async (payload: any) => {
      const record = payload?.data ?? payload?.new ?? payload?.record ?? payload;
      const registrationId =
        record?.registrationId ?? payload?.registrationId;
      const encounterId =
        record?.encounterId ?? record?.id ?? payload?.encounterId;
      if (!encounterId) return;

      const eid = String(encounterId);
      const rid = registrationId
        ? String(registrationId)
        : (findRegistrationByEncounterId(eid)?.registrationId ?? null);

      console.log(`[encounterSocketListener] handleEncounter: eid=${eid} rid=${rid}`);
      await refreshAndInvalidate(rid, eid);
    },
    [findRegistrationByEncounterId, refreshAndInvalidate]
  );

  /**
   * order 테이블 이벤트 처리.
   */
  const handleOrderTableEvent = useCallback(
    async (payload: any) => {
      const record = payload?.data ?? payload?.new ?? payload?.record ?? payload;
      const registrationId =
        record?.registrationId ?? payload?.registrationId;
      const encounterId =
        record?.encounterId ?? payload?.encounterId;
      if (!encounterId) return;

      const eid = String(encounterId);
      const rid = registrationId
        ? String(registrationId)
        : (findRegistrationByEncounterId(eid)?.registrationId ?? null);

      console.log(`[encounterSocketListener] handleOrder: eid=${eid} rid=${rid}`);
      await refreshAndInvalidate(rid, eid, () => {
        queryClient.invalidateQueries({ queryKey: ["orders", eid] });
        queryClient.refetchQueries({ queryKey: ["orders", eid], type: "all" });
      });
    },
    [queryClient, findRegistrationByEncounterId, refreshAndInvalidate]
  );

  /**
   * disease 테이블 이벤트 처리.
   */
  const handleDiseaseTableEvent = useCallback(
    async (payload: any) => {
      const record = payload?.data ?? payload?.new ?? payload?.record ?? payload;
      const registrationId =
        record?.registrationId ?? payload?.registrationId;
      const encounterId =
        record?.encounterId ?? payload?.encounterId;
      if (!encounterId) return;

      const eid = String(encounterId);
      const rid = registrationId
        ? String(registrationId)
        : (findRegistrationByEncounterId(eid)?.registrationId ?? null);

      console.log(`[encounterSocketListener] handleDisease: eid=${eid} rid=${rid}`);
      await refreshAndInvalidate(rid, eid);
    },
    [findRegistrationByEncounterId, refreshAndInvalidate]
  );

  // ── 테이블 → 핸들러 매핑 ──

  const TABLE_HANDLERS: Record<string, (payload: any) => Promise<void>> = {
    encounter: handleEncounterTableEvent,
    order: handleOrderTableEvent,
    disease: handleDiseaseTableEvent,
  };

  useEffect(() => {
    if (!socket) return;

    const COOLDOWN_MS = 500;

    /**
     * 실제 이벤트 처리 실행.
     * 완료 후 쿨다운 중 쌓인 마지막 이벤트(pendingEventRef)를
     * trailing-edge로 처리한다.
     */
    const processEvent = async (table: string, payload: any) => {
      syncInFlightRef.current = true;
      lastSyncAtRef.current = Date.now();
      try {
        await TABLE_HANDLERS[table]!(payload);
      } catch (err) {
        console.error("[encounterSocketListener] 처리 실패:", err);
      } finally {
        syncInFlightRef.current = false;
        // 쿨다운 중 쌓인 마지막 이벤트를 trailing-edge로 처리
        drainPending();
      }
    };

    /**
     * 큐에 쌓인 마지막 이벤트를 쿨다운 후 처리.
     * 여러 이벤트가 연속으로 오면 마지막 것만 처리되므로
     * 가장 최신 데이터(예: syncEncounterClaimDetail 이후)로 갱신된다.
     */
    const drainPending = () => {
      const pending = pendingEventRef.current;
      if (!pending) return;

      pendingEventRef.current = null;
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
      }

      const elapsed = Date.now() - lastSyncAtRef.current;
      const delay = Math.max(0, COOLDOWN_MS - elapsed);

      trailingTimerRef.current = setTimeout(() => {
        trailingTimerRef.current = null;
        if (!syncInFlightRef.current && TABLE_HANDLERS[pending.table]) {
          processEvent(pending.table, pending.payload);
        }
      }, delay);
    };

    const handleAnyMessage = async (eventName: string, ...args: any[]) => {
      const payload = args?.[0];
      const isDbEvent =
        typeof eventName === "string" && eventName.startsWith("db.");
      if (!isDbEvent) return;

      const table = payload?.table;
      if (!table || !TABLE_HANDLERS[table]) return;

      console.log(
        `[encounterSocketListener] 수신: event=${eventName} table=${table}`,
        JSON.stringify(payload, null, 2)
      );

      // hospital 컨텍스트 확인
      if (hospital?.id) {
        const evtHospitalId =
          payload?.hospitalId ??
          payload?.hospital?.id ??
          payload?.data?.hospitalId ??
          payload?.new?.hospitalId ??
          payload?.record?.hospitalId;
        if (evtHospitalId && Number(evtHospitalId) !== Number(hospital.id)) {
          console.log(`[encounterSocketListener] hospital 불일치 - 무시: evt=${evtHospitalId} my=${hospital.id}`);
          return;
        }
      }

      // 쿨다운 / in-flight 체크: 스킵 대신 마지막 이벤트를 큐잉
      const now = Date.now();
      if (syncInFlightRef.current || now - lastSyncAtRef.current < COOLDOWN_MS) {
        // 최신 이벤트로 큐 갱신 (마지막 이벤트만 보존 → trailing-edge)
        pendingEventRef.current = { table, payload };
        console.log(
          `[encounterSocketListener] 쿨다운 중 큐잉: table=${table} inFlight=${syncInFlightRef.current} elapsed=${now - lastSyncAtRef.current}ms`
        );
        // sync가 진행 중이 아니면 타이머로 pending 처리 예약
        if (!syncInFlightRef.current) {
          drainPending();
        }
        return;
      }

      await processEvent(table, payload);
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
      // trailing timer 정리
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
    };
  }, [
    socket,
    hospital?.id,
    handleEncounterTableEvent,
    handleOrderTableEvent,
    handleDiseaseTableEvent,
  ]);
}
