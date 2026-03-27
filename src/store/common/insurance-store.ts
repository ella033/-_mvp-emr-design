import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  보험구분,
  보험구분상세,
  만성질환관리제,
  보훈등급,
  본인부담구분코드,
  차상위보험구분,
} from "@/constants/common/common-enum";

// 공유 함수: uDept 계산
export const calculateUDept = (
  uDeptDetail: number,
  차상위보험구분: number = 0
): 보험구분 => {
  switch (uDeptDetail) {
    case 보험구분상세.일반:
      return 보험구분.일반;
    case 보험구분상세.국민공단:
      return 보험구분.국민공단;
    case 보험구분상세.직장조합:
      return 보험구분.직장조합;
    case 보험구분상세.의료급여1종:
      return 보험구분.급여1종;
    case 보험구분상세.의료급여2종:
    case 보험구분상세.의료급여2종장애:
      return 보험구분.급여2종;
    case 보험구분상세.자보:
      return 보험구분.자보;
    case 보험구분상세.산재:
      return 보험구분.산재;
    case 보험구분상세.재해:
      return 보험구분.재해;
    case 보험구분상세.차상위1종:
    case 보험구분상세.차상위2종:
    case 보험구분상세.차상위2종장애:
      return 차상위보험구분 === 1 ? 보험구분.국민공단 : 보험구분.직장조합;
    default:
      return 보험구분.일반;
  }
};

// 보험 정보 전역 상태 관리

type InsuranceState = {
  // 기본 상태
  insuranceInfo: InsuranceInfo | null;
  isLoading: boolean;
  error: string | null;

  // 액션들
  setInsuranceInfo: (insuranceInfo: InsuranceInfo) => void;
  updateInsuranceInfo: (updates: Partial<InsuranceInfo>) => void;
  clearInsuranceInfo: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed 변수들 (실제로 필요한 것들만)
  getComputedFields: () => {
    uDept: 보험구분;
    만성질환관리제: 만성질환관리제;
    is만성질환관리버튼활성화여부: boolean;
  } | null;

  // 추가 Computed 변수들
  getAdditionalComputedFields: () => {
    uDept: 보험구분;
    veteranGradeForBinding: string;
    본인부담구분코드ForDisplay: string;
    차상위보험구분Description: string;
  } | null;

  // 복잡한 계산
  getInsuranceSummary: () => {
    isMedicalAid: boolean;
    isChronicDiseaseManagement: boolean;
    isVeteran: boolean;
    isIndustrialAccident: boolean;
    isObstacle: boolean;
    isPregnant: boolean;
    isInfertilityTreatment: boolean;
    isBaby: boolean;
    isPrivateInsurance: boolean;
    isSecondaryInsurance: boolean;
    insuranceType: 보험구분;
    insuranceTypeDetail: 보험구분상세;
    chronicDiseaseManagementType: 만성질환관리제;
  } | null;

  // 유틸리티 함수들
  isInsuranceValid: () => boolean;
  getInsuranceTypeName: () => string;
  getChronicDiseaseManagementName: () => string;
  isSecondaryInsuranceActive: () => boolean;
};

export const useInsuranceStore = create<InsuranceState>()(
  devtools(
    (set, get) => {
      // Private 함수: computed 필드 계산
      const calculateComputedFields = (insuranceInfo: InsuranceInfo) => {
        // UDept 계산
        let uDept: 보험구분 = 보험구분.일반;
        switch (insuranceInfo.uDeptDetail) {
          case 보험구분상세.일반:
            uDept = 보험구분.일반;
            break;
          case 보험구분상세.국민공단:
            uDept = 보험구분.국민공단;
            break;
          case 보험구분상세.직장조합:
            uDept = 보험구분.직장조합;
            break;
          case 보험구분상세.의료급여1종:
            uDept = 보험구분.급여1종;
            break;
          case 보험구분상세.의료급여2종:
          case 보험구분상세.의료급여2종장애:
            uDept = 보험구분.급여2종;
            break;
          case 보험구분상세.자보:
            uDept = 보험구분.자보;
            break;
          case 보험구분상세.산재:
            uDept = 보험구분.산재;
            break;
          case 보험구분상세.재해:
            uDept = 보험구분.재해;
            break;
          case 보험구분상세.차상위1종:
          case 보험구분상세.차상위2종:
          case 보험구분상세.차상위2종장애:
            uDept =
              insuranceInfo.차상위보험구분 === 차상위보험구분.국민공단
                ? 보험구분.국민공단
                : 보험구분.직장조합;
            break;
        }
        return {
          uDept,
        };
      };

      return {
        // 기본 상태
        insuranceInfo: null,
        isLoading: false,
        error: null,

        // 액션들
        setInsuranceInfo: (insuranceInfo) => {
          // computed 필드들을 자동으로 계산해서 추가
          const computedFields = calculateComputedFields(insuranceInfo);
          const finalInsuranceInfo = { ...insuranceInfo, ...computedFields };
          set(
            () => ({ insuranceInfo: finalInsuranceInfo }),
            false,
            "setInsuranceInfo"
          );
        },

        updateInsuranceInfo: (updates) => {
          set(
            (state) => {
              if (!state.insuranceInfo) return state;

              const updatedInsuranceInfo = {
                ...state.insuranceInfo,
                ...updates,
              };

              // computed 필드들을 자동으로 재계산
              const computedFields =
                calculateComputedFields(updatedInsuranceInfo);
              const finalInsuranceInfo = {
                ...updatedInsuranceInfo,
                ...computedFields,
              };

              return { insuranceInfo: finalInsuranceInfo };
            },
            false,
            "updateInsuranceInfo"
          );
        },

        clearInsuranceInfo: () =>
          set(() => ({ insuranceInfo: null }), false, "clearInsuranceInfo"),

        setLoading: (loading) =>
          set(() => ({ isLoading: loading }), false, "setLoading"),

        setError: (error) => set(() => ({ error }), false, "setError"),

        // Computed 변수들 (실제로 필요한 것들만)
        getComputedFields: () => {
          const { insuranceInfo } = get();
          if (!insuranceInfo) return null;

          return calculateComputedFields(insuranceInfo);
        },

        // 추가 Computed 변수들
        getAdditionalComputedFields: () => {
          const { insuranceInfo } = get();
          if (!insuranceInfo) return null;

          const computedFields = calculateComputedFields(insuranceInfo);

          return {

            // veteranGradeForBinding
            veteranGradeForBinding:
              insuranceInfo.veteranGrade?.toString() || "",

            // 본인부담구분코드ForDisplay
            본인부담구분코드ForDisplay: insuranceInfo.cfcd?.toString() || "",

            // 차상위보험구분Description
            차상위보험구분Description:
              insuranceInfo.차상위보험구분?.toString() || "",

            // 기존 computed 필드들도 포함
            ...computedFields,
          };
        },

        // 복잡한 계산
        getInsuranceSummary: () => {
          const { insuranceInfo } = get();
          if (!insuranceInfo) return null;

          const computedFields = calculateComputedFields(insuranceInfo);

          return {
            // 의료급여 여부
            isMedicalAid:
              computedFields.uDept === 3 || computedFields.uDept === 4, // 급여1종, 급여2종

            // 보훈 여부
            isVeteran: insuranceInfo.보훈여부,

            // 산재 후유증 여부
            isIndustrialAccident: insuranceInfo.산재후유,

            // 임신부 여부
            isPregnant: insuranceInfo.is임신부,

            // 난임치료 여부
            isInfertilityTreatment: insuranceInfo.is난임치료,

            // 아기 여부
            isBaby: insuranceInfo.isBaby,

            // 자보 여부
            isPrivateInsurance: computedFields.uDept === 6, // 자보

            // 차상위 여부
            isSecondaryInsurance:
              computedFields.uDept === 1 || computedFields.uDept === 2, // 국민공단, 직장조합

            // 보험구분 상세 정보
            insuranceType: computedFields.uDept,
            insuranceTypeDetail: insuranceInfo.uDeptDetail,
          };
        },

        // 유틸리티 함수들
        isInsuranceValid: () => {
          const { insuranceInfo } = get();
          return insuranceInfo !== null && insuranceInfo !== undefined;
        },

        getInsuranceTypeName: () => {
          const { insuranceInfo } = get();
          if (!insuranceInfo) return "";

          const computedFields = calculateComputedFields(insuranceInfo);
          return computedFields.uDept.toString();
        },

        // 차상위 보험 여부 확인
        isSecondaryInsuranceActive: () => {
          const { insuranceInfo } = get();
          if (!insuranceInfo) return false;

          const today = new Date();
          return (
            insuranceInfo.차상위승인일 <= today &&
            (!insuranceInfo.차상위종료일 || insuranceInfo.차상위종료일 >= today)
          );
        },
      };
    },
    {
      name: "insurance-store",
    }
  )
);
