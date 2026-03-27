import type { Reception } from "@/types/common/reception-types";
import type { RcPatientBaseInfo } from "@/types/common/reception-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";

interface TabsSnapshotBase {
  openedReceptions: Reception[];
  openedReceptionId: string | null;
}

interface PatientBaseInfoUpdateDeps extends TabsSnapshotBase {
  updates: Partial<RcPatientBaseInfo>;
  setOpenedReceptions: (receptions: Reception[]) => void;
  markReceptionAsChanged: (receptionId: string) => void;
}

interface InsuranceInfoUpdateDeps extends TabsSnapshotBase {
  updates: Partial<InsuranceInfo>;
  setOpenedReceptions: (receptions: Reception[]) => void;
  markReceptionAsChanged: (receptionId: string) => void;
}

/**
 * tabs-store 밖으로 분리된 PatientBaseInfo 업데이트 도메인 로직
 * - store에서는 이 헬퍼에 현재 스냅샷과 setter 콜백만 전달
 */
export function applyPatientBaseInfoUpdateToTabs({
  openedReceptions,
  openedReceptionId,
  updates,
  setOpenedReceptions,
  markReceptionAsChanged,
}: PatientBaseInfoUpdateDeps) {
  if (!openedReceptionId) return;

  const previousReception = openedReceptions.find(
    (reception) => reception.originalRegistrationId === openedReceptionId,
  );

  if (!previousReception) return;

  const updatedPatientBaseInfo: RcPatientBaseInfo = {
    ...previousReception.patientBaseInfo,
    ...updates,
  };

  const hasChanged =
    JSON.stringify(previousReception.patientBaseInfo) !==
    JSON.stringify(updatedPatientBaseInfo);

  const next = openedReceptions.map((reception) =>
    reception.originalRegistrationId === openedReceptionId
      ? {
        ...reception,
        patientBaseInfo: updatedPatientBaseInfo,
      }
      : reception,
  );

  setOpenedReceptions(next);

  if (hasChanged) {
    markReceptionAsChanged(openedReceptionId);
  }
}

/**
 * tabs-store 밖으로 분리된 InsuranceInfo 업데이트 도메인 로직
 */
export function applyInsuranceInfoUpdateToTabs({
  openedReceptions,
  openedReceptionId,
  updates,
  setOpenedReceptions,
  markReceptionAsChanged,
}: InsuranceInfoUpdateDeps) {
  if (!openedReceptionId) return;

  const previousReception = openedReceptions.find(
    (reception) => reception.originalRegistrationId === openedReceptionId,
  );

  if (!previousReception) return;

  const updatedInsuranceInfo: InsuranceInfo = {
    ...previousReception.insuranceInfo,
    ...updates,
  };

  const hasChanged =
    JSON.stringify(previousReception.insuranceInfo) !==
    JSON.stringify(updatedInsuranceInfo);

  const next = openedReceptions.map((reception) =>
    reception.originalRegistrationId === openedReceptionId
      ? {
        ...reception,
        insuranceInfo: updatedInsuranceInfo,
      }
      : reception,
  );

  setOpenedReceptions(next);

  if (hasChanged) {
    markReceptionAsChanged(openedReceptionId);
  }
}

