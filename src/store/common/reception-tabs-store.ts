import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Reception } from "@/types/common/reception-types";
import type { Registration } from "@/types/registration-types";
import type { RcPatientBaseInfo } from "@/types/common/reception-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import {
  ReceptionInitialTab,
} from "@/constants/common/common-enum";
import { ReceptionService } from "@/services/reception-service";
import {
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
} from "@/lib/registration-utils";
import {
  applyInsuranceInfoUpdateToTabs,
  applyPatientBaseInfoUpdateToTabs,
} from "@/hooks/reception/patient-info/reception-tabs-domain-updaters";
import { useReceptionViewTabsStore } from "@/store/common/reception-view-tabs-store";
import { useReceptionStore } from "@/store/common/reception-store";

export interface ReceptionTabsState {
  openedReceptions: Reception[];
  openedReceptionId: string | null;

  /** 수납실(리스트)에서 현재 선택된 상태 탭 (PanelContainer의 paymentStatus) */
  paymentStatusFilter: string[];
  setPaymentStatusFilter: (statuses: string[]) => void;

  receptionChanges: Record<string, boolean>;
  disabledReceptions: Record<string, boolean>;

  hasReceptionChanges: (receptionId: string) => boolean;
  hasCurrentReceptionChanges: () => boolean;
  isReceptionDisabled: (receptionId: string) => boolean;
  isCurrentReceptionDisabled: () => boolean;

  setOpenedReceptions: (receptions: Reception[]) => void;
  setOpenedReceptionId: (id: string | null) => void;
  addOpenedReception: (reception: Reception, setAsActive?: boolean) => void;

  removeOpenedReception: (id: string, callback?: () => void) => void;

  /** 기존 탭 제거 후 새 reception으로 교체(추가 후 활성화). 동일 접수 덮어쓰기 공통 패턴 */
  replaceReceptionTab: (existingId: string, newReception: Reception) => void;

  updateOpenedReception: (id: string, updates: Partial<Reception>) => void;
  refreshOpenedReceptions: (registrations: Registration[] | null) => void;

  updatePatientBaseInfo: (updates: Partial<RcPatientBaseInfo>) => void;
  updateInsuranceInfo: (updates: Partial<InsuranceInfo>) => void;

  markReceptionAsChanged: (receptionId: string) => void;
  markReceptionAsUnchanged: (receptionId: string) => void;
  clearReceptionChanges: (receptionId: string) => void;

  setReceptionDisabled: (receptionId: string, disabled: boolean) => void;
  clearReceptionDisabled: (receptionId: string) => void;

  initialTab: ReceptionInitialTab | null;
  setInitialTab: (tab: ReceptionInitialTab | null) => void;

  calculateNewActiveReceptionId: (excludeIds: string[]) => string | null;

}

const initialTabsState: Pick<
  ReceptionTabsState,
  | "openedReceptions"
  | "openedReceptionId"
  | "paymentStatusFilter"
  | "receptionChanges"
  | "disabledReceptions"
  | "initialTab"
> = {
  openedReceptions: [],
  openedReceptionId: null,
  paymentStatusFilter: [],
  receptionChanges: {},
  disabledReceptions: {},
  initialTab: null,
};

export const useReceptionTabsStore = create<ReceptionTabsState>()(
  devtools(
    (set, get) => ({
      ...initialTabsState,

      setPaymentStatusFilter: (paymentStatusFilter: string[]) => {
        set({ paymentStatusFilter });
      },

      // ================================ Getter ================================
      hasReceptionChanges: (receptionId: string) => {
        const { receptionChanges } = get();
        return receptionChanges[receptionId] === true;
      },

      hasCurrentReceptionChanges: () => {
        const { openedReceptionId, receptionChanges } = get();
        if (!openedReceptionId) return false;
        return receptionChanges[openedReceptionId] === true;
      },

      isReceptionDisabled: (receptionId: string) => {
        const { disabledReceptions } = get();
        return disabledReceptions[receptionId] === true;
      },

      isCurrentReceptionDisabled: () => {
        const { openedReceptionId, disabledReceptions } = get();
        if (!openedReceptionId) return false;
        return disabledReceptions[openedReceptionId] === true;
      },

      // ================================ Tabs 관리 ================================
      setOpenedReceptions: (openedReceptions: Reception[]) => {
        set({ openedReceptions });
        // 각 접수에 대한 viewState 보정
        openedReceptions.forEach((rc) => {
          const id = rc.originalRegistrationId || REGISTRATION_ID_NEW;
          useReceptionViewTabsStore.getState().ensureTabState(id);
        });
      },

      setOpenedReceptionId: (openedReceptionId: string | null) => {
        set({ openedReceptionId });
        if (openedReceptionId === REGISTRATION_ID_NEW) {
          set({ initialTab: ReceptionInitialTab.환자정보 });
        }
      },

      addOpenedReception: (
        openedReception: Reception,
        setAsActive: boolean = true
      ) => {
        const {
          openedReceptions,
          markReceptionAsUnchanged,
          setOpenedReceptionId,
        } = get();

        const normalizedId = normalizeRegistrationId(
          openedReception.originalRegistrationId
        );

        const normalizedReception: Reception = {
          ...openedReception,
          originalRegistrationId: normalizedId,
        };

        let existingIndex = -1;

        existingIndex = openedReceptions.findIndex(
          (r) => r.originalRegistrationId === normalizedId
        );

        if (existingIndex !== -1) {
          // 이미 존재하면 업데이트
          const updatedReceptions = [...openedReceptions];
          updatedReceptions[existingIndex] = normalizedReception;
          set({
            openedReceptions: updatedReceptions,
          });

          if (setAsActive) {
            setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
          }

          markReceptionAsUnchanged(normalizedId || REGISTRATION_ID_NEW);
          useReceptionViewTabsStore.getState().ensureTabState(normalizedId || REGISTRATION_ID_NEW);
        } else {
          // 중복 제거: 같은 originalRegistrationId가 있는지 다시 확인
          const hasDuplicate = openedReceptions.some(
            (r) => r.originalRegistrationId === normalizedId
          );

          if (hasDuplicate) {
            console.warn(
              "[addOpenedReception] 중복된 reception이 감지되었습니다:",
              normalizedId
            );
            // 중복이 있으면 기존 것을 업데이트
            const duplicateIndex = openedReceptions.findIndex(
              (r) => r.originalRegistrationId === normalizedId
            );
            if (duplicateIndex !== -1) {
              const updatedReceptions = [...openedReceptions];
              updatedReceptions[duplicateIndex] = normalizedReception;
              set({
                openedReceptions: updatedReceptions,
              });

              if (setAsActive) {
                setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
              }

              markReceptionAsUnchanged(normalizedId || REGISTRATION_ID_NEW);
              useReceptionViewTabsStore.getState().ensureTabState(normalizedId || REGISTRATION_ID_NEW);
            }
            return;
          }

          if (openedReceptions.length >= 5) {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("maxReceptionsReached", {
                  detail: {
                    message: "최대 5명까지 환자를 열 수 있습니다",
                    currentCount: openedReceptions.length,
                  },
                })
              );
            }
            return;
          }

          const newReceptions = [...openedReceptions, normalizedReception];

          set({
            openedReceptions: newReceptions,
          });

          useReceptionViewTabsStore
            .getState()
            .resetTabState(normalizedId || REGISTRATION_ID_NEW);

          if (setAsActive) {
            setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
          }

          markReceptionAsUnchanged(normalizedId || REGISTRATION_ID_NEW);
          useReceptionViewTabsStore.getState().ensureTabState(normalizedId || REGISTRATION_ID_NEW);
        }
      },

      updateOpenedReception: (id: string, updates: Partial<Reception>) => {
        const { openedReceptions } = get();
        const previousReception = openedReceptions.find(
          (rc) => rc.originalRegistrationId === id
        );

        if (!previousReception) {
          return;
        }

        let updatedReception: Reception;

        if (updates.insuranceInfo) {
          const extraQualification =
            updates.insuranceInfo.extraQualification;

          const { extraQualification: __, ...restInsuranceInfo } =
            updates.insuranceInfo;
          const updatedInsuranceInfo = {
            ...previousReception.insuranceInfo,
            ...restInsuranceInfo,
          };

          if (extraQualification !== undefined) {
            // 기존 extraQualification에 병합하여, 업데이트에 없는 키(예: 임신부)가 누락되지 않도록 함
            const base =
              previousReception.insuranceInfo?.extraQualification ?? {};
            updatedInsuranceInfo.extraQualification = {
              ...base,
              ...extraQualification,
            };
          }

          const { insuranceInfo: ___, ...otherUpdates } = updates;
          updatedReception = {
            ...previousReception,
            ...otherUpdates,
            insuranceInfo: updatedInsuranceInfo,
          };
        } else {
          updatedReception = { ...previousReception, ...updates };
        }

        // receptionInfo의 paymentInfo를 깊은 병합 처리
        if (updates.receptionInfo?.paymentInfo) {
          updatedReception.receptionInfo = {
            ...updatedReception.receptionInfo,
            paymentInfo: {
              ...updatedReception.receptionInfo.paymentInfo,
              ...updates.receptionInfo.paymentInfo,
              // payments 배열은 완전히 교체 (부분 업데이트가 아닌 전체 교체)
              payments:
                updates.receptionInfo.paymentInfo.payments ??
                updatedReception.receptionInfo.paymentInfo?.payments ??
                [],
            },
          };
        }

        // bioMeasurementsInfo를 깊은 병합 처리
        if (updates.bioMeasurementsInfo) {
          updatedReception.bioMeasurementsInfo = {
            ...updatedReception.bioMeasurementsInfo,
            ...updates.bioMeasurementsInfo,
            // vital 배열은 완전히 교체 (부분 업데이트가 아닌 전체 교체)
            vital: updates.bioMeasurementsInfo.vital ?? updatedReception.bioMeasurementsInfo?.vital ?? [],
          };
        }

        const updatedReceptions = openedReceptions.map((rc) =>
          rc.originalRegistrationId === id ? updatedReception : rc
        );

        set({
          openedReceptions: updatedReceptions,
        });

        // updateOpenedReception은 데이터 저장만 담당
        // 변경 감지(markReceptionAsChanged)는 각 컴포넌트의 onChange에서 처리
      },

      removeOpenedReception: (id: string, callback?: () => void) => {
        const {
          openedReceptions,
          openedReceptionId,
          clearReceptionChanges,
          clearReceptionDisabled,
        } = get();

        let filteredReceptions: Reception[];
        let removedReception: Reception | undefined;
        if (id === REGISTRATION_ID_NEW) {
          removedReception = openedReceptions.find(
            (rc) => rc.originalRegistrationId === REGISTRATION_ID_NEW
          );

          if (!removedReception) {
            return;
          }

          filteredReceptions = openedReceptions.filter(
            (rc) => rc.originalRegistrationId !== REGISTRATION_ID_NEW
          );
        } else {
          removedReception = openedReceptions.find(
            (rc) => rc.originalRegistrationId === id
          );
          if (!removedReception) {
            return;
          }

          filteredReceptions = openedReceptions.filter(
            (rc) => rc.originalRegistrationId !== id
          );
        }

        let newOpenedReceptionId = openedReceptionId;
        const isRemovingActiveReception = openedReceptionId === id;
        if (isRemovingActiveReception) {
          const { calculateNewActiveReceptionId } = get();
          newOpenedReceptionId = calculateNewActiveReceptionId([id]);
        }

        set({
          openedReceptions: filteredReceptions,
          openedReceptionId: newOpenedReceptionId,
          // 활성화된 reception이 제거될 때 initialTab 초기화
          // (수납 취소 후 같은 환자를 다시 열 때 최초 오픈으로 인식하도록)
          initialTab: isRemovingActiveReception ? null : get().initialTab,
        });

        clearReceptionChanges(id);
        clearReceptionDisabled(id);

        if (callback) {
          callback();
        }

        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("clearRemainingReceptions", {
                detail: {
                  removedReceptionId: id,
                  remainingReceptions: filteredReceptions,
                  newActiveReceptionId: newOpenedReceptionId,
                },
              })
            );
          }
        }, 0);
      },

      replaceReceptionTab: (existingId: string, newReception: Reception) => {
        const { removeOpenedReception, addOpenedReception, setOpenedReceptionId } =
          get();
        removeOpenedReception(existingId);
        const normalizedId =
          normalizeRegistrationId(newReception.originalRegistrationId) ||
          REGISTRATION_ID_NEW;
        addOpenedReception({ ...newReception, originalRegistrationId: normalizedId });
        setOpenedReceptionId(normalizedId);
      },

      refreshOpenedReceptions: (registrations: Registration[] | null) => {
        const { openedReceptions, receptionChanges } =
          get();

        if (!registrations) {
          return;
        }

        const updatedReceptions = openedReceptions.map((opened) => {
          if (
            opened.originalRegistrationId &&
            receptionChanges[opened.originalRegistrationId] === true
          ) {
            return opened;
          }

          const updatedRegistration = registrations.find(
            (r) => r.id === opened.originalRegistrationId
          );

          if (updatedRegistration) {
            const convertedReception =
              ReceptionService.convertRegistrationToReception(
                updatedRegistration
              );
            // 등록(refresh)은 접수 목록/상태만 동기화. patientBaseInfo는 patient 소켓/로컬
            // 수정으로 이미 갱신된 탭 값을 유지 (API 스냅샷이 지연되면 덮어쓰면 소실됨)
            const existingBaseInfo = (opened as any).patientBaseInfo;
            return {
              ...convertedReception,
              patientBaseInfo:
                existingBaseInfo ??
                (convertedReception as any).patientBaseInfo,
            } as Reception;
          }

          return opened;
        });
        // 새롭게 동기화된 reception에도 viewState 보정
        updatedReceptions.forEach((rc) => {
          const id = rc.originalRegistrationId || REGISTRATION_ID_NEW;
          useReceptionViewTabsStore.getState().ensureTabState(id);
        });
        set({
          openedReceptions: updatedReceptions,
        });
      },

      // ================================ 변경 감지 / disabled ================================
      markReceptionAsChanged: (receptionId: string) => {
        const { receptionChanges } = get();
        set({
          receptionChanges: {
            ...receptionChanges,
            [receptionId]: true,
          },
        });
      },

      markReceptionAsUnchanged: (receptionId: string) => {
        const { receptionChanges } = get();
        set({
          receptionChanges: {
            ...receptionChanges,
            [receptionId]: false,
          },
        });
      },

      clearReceptionChanges: (receptionId: string) => {
        const { receptionChanges } = get();
        const newChanges = { ...receptionChanges };
        delete newChanges[receptionId];
        set({ receptionChanges: newChanges });
      },

      setReceptionDisabled: (receptionId: string, disabled: boolean) => {
        const { disabledReceptions } = get();
        set({
          disabledReceptions: {
            ...disabledReceptions,
            [receptionId]: disabled,
          },
        });
      },

      clearReceptionDisabled: (receptionId: string) => {
        const { disabledReceptions } = get();
        const newDisabled = { ...disabledReceptions };
        delete newDisabled[receptionId];
        set({ disabledReceptions: newDisabled });
      },

      // ================================ Initial Tab 관리 ================================
      setInitialTab: (tab: ReceptionInitialTab | null) => {
        set({ initialTab: tab });
      },

      // ================================ Patient / Insurance 업데이트 ================================
      updatePatientBaseInfo: (updates: Partial<RcPatientBaseInfo>) => {
        const {
          openedReceptions,
          openedReceptionId,
          markReceptionAsChanged,
        } = get();

        applyPatientBaseInfoUpdateToTabs(
          {
            openedReceptions,
            openedReceptionId,
            updates,
            setOpenedReceptions: (receptions: Reception[]) =>
              set({ openedReceptions: receptions }),
            markReceptionAsChanged,
          } as any
        );
      },

      updateInsuranceInfo: (updates: Partial<InsuranceInfo>) => {
        const {
          openedReceptions,
          openedReceptionId,
          markReceptionAsChanged,
        } = get();

        applyInsuranceInfoUpdateToTabs(
          {
            openedReceptions,
            openedReceptionId,
            updates,
            setOpenedReceptions: (receptions: Reception[]) =>
              set({ openedReceptions: receptions }),
            markReceptionAsChanged,
          } as any
        );
      },

      // ================================ 유틸리티 ================================
      calculateNewActiveReceptionId: (excludeIds: string[]) => {
        const { openedReceptions } = get();

        const remainingReceptions = openedReceptions.filter(
          (reception) =>
            !excludeIds.includes(reception.originalRegistrationId || "")
        );

        if (remainingReceptions.length === 0) {
          return null;
        }

        const lastReception =
          remainingReceptions[remainingReceptions.length - 1];
        return lastReception?.originalRegistrationId || null;
      },

    }),
    {
      name: "reception-tabs-store",
    }
  )
);

// ================================ Auto-sync ================================
// reception-store의 registrations가 변경되면 openedReceptions를 자동 동기화한다.
// hasChange(receptionChanges) 체크는 refreshOpenedReceptions 내부에서 처리됨.
useReceptionStore.subscribe((state, prevState) => {
  if (state.registrations !== prevState.registrations) {
    useReceptionTabsStore
      .getState()
      .refreshOpenedReceptions(state.registrations);
  }
});
