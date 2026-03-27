import { useCallback, useEffect, useState } from "react";
import { useBenefitsStore } from "@/store/benefits-store";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import { patientManagementApi } from "../api/patient-management.api";
import type {
  Benefit,
  CreateBenefitRequest,
  CreatePatientGroupRequest,
  PatientGroup,
  UpdateBenefitRequest,
  UpdatePatientGroupRequest,
} from "../model";

const DEFAULT_ERROR_MESSAGE =
  "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

export function usePatientManagement() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [patientGroups, setPatientGroups] = useState<PatientGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [benefitRows, groupRows] = await Promise.all([
        patientManagementApi.getBenefits(),
        patientManagementApi.getPatientGroups(),
      ]);
      setBenefits(benefitRows);
      setPatientGroups(groupRows);

      useBenefitsStore.getState().setBenefits(benefitRows as never[]);
      usePatientGroupsStore.getState().setPatientGroups(groupRows as never[]);
    } catch (err) {
      console.error(err);
      setError(DEFAULT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runMutation = useCallback(async (task: () => Promise<void>) => {
    setIsMutating(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (err) {
      console.error(err);
      setError("작업 처리 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const createBenefit = useCallback(
    async (payload: CreateBenefitRequest) => {
      const ok = await runMutation(async () => {
        await patientManagementApi.createBenefit(payload);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  const updateBenefit = useCallback(
    async (id: number, payload: UpdateBenefitRequest) => {
      const ok = await runMutation(async () => {
        await patientManagementApi.updateBenefit(id, payload);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  const deleteBenefit = useCallback(
    async (id: number) => {
      const ok = await runMutation(async () => {
        await patientManagementApi.deleteBenefit(id);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  const createPatientGroup = useCallback(
    async (payload: CreatePatientGroupRequest) => {
      const ok = await runMutation(async () => {
        await patientManagementApi.createPatientGroup(payload);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  const updatePatientGroup = useCallback(
    async (id: number, payload: UpdatePatientGroupRequest) => {
      const ok = await runMutation(async () => {
        await patientManagementApi.updatePatientGroup(id, payload);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  const deletePatientGroup = useCallback(
    async (id: number) => {
      const ok = await runMutation(async () => {
        await patientManagementApi.deletePatientGroup(id);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  return {
    benefits,
    patientGroups,
    isLoading,
    isMutating,
    error,
    reload: load,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    createPatientGroup,
    updatePatientGroup,
    deletePatientGroup,
  };
}
