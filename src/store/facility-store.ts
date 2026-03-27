import { Facility } from "@/types/facility-types";
import { create } from "zustand";

// 메모이제이션을 위한 캐시
const treatmentFacilitiesCache = new Map<string, Facility[]>();

// 공간 정보 전역 상태 관리 - hospital_id 기반 관리

type FacilityState = {
  // 현재 병원의 facility 데이터 (이미 hospitalId로 필터링된 상태)
  facilities: Facility[];

  // 데이터 설정
  setFacilities: (facilities: Facility[]) => void;

  // 개별 facility 추가/수정/삭제
  addFacility: (facility: Facility) => void;
  updateFacility: (facilityId: number, facility: Facility) => void;
  removeFacility: (facilityId: number) => void;

  getFacilities: () => Facility[];
  getFacilityById: (facilityId: number) => Facility | undefined;
  getTreatmentFacilities: (treatmentCode: number) => Facility[];

  // 호환성을 위한 deprecated 함수들 (설정 페이지에서 사용)
  facilitiesByHospital: Record<string, Facility[]>;
  setFacilitiesByHospital: (hospitalId: string, facilities: Facility[]) => void;
  getFacilitiesByHospital: (hospitalId: string) => Facility[];
};

export const useFacilityStore = create<FacilityState>((set, get) => ({
  // 현재 병원의 facility 데이터
  facilities: [],

  // 호환성을 위한 deprecated 데이터
  facilitiesByHospital: {},

  setFacilities: (facilities) =>
    set(() => {
      // 캐시 무효화
      treatmentFacilitiesCache.clear();
      return {
        facilities: facilities.sort((a, b) => a.id - b.id)
      };
    }),

  // 개별 facility 관리
  addFacility: (facility) =>
    set((state) => {
      treatmentFacilitiesCache.clear();
      return {
        facilities: [...state.facilities, facility].sort((a, b) => a.id - b.id)
      };
    }),

  updateFacility: (facilityId, updatedFacility) =>
    set((state) => {
      treatmentFacilitiesCache.clear();
      return {
        facilities: state.facilities.map(facility =>
          facility.id === facilityId ? updatedFacility : facility
        )
      };
    }),

  removeFacility: (facilityId) =>
    set((state) => {
      treatmentFacilitiesCache.clear();
      return {
        facilities: state.facilities.filter(facility => facility.id !== facilityId)
      };
    }),

  // 데이터 조회 헬퍼
  getFacilities: () => {
    const state = get();
    return state.facilities;
  },

  getFacilityById: (facilityId) => {
    const state = get();
    return state.facilities.find(facility => facility.id === facilityId);
  },

  getTreatmentFacilities: (treatmentCode) => {
    const cacheKey = `treatment-${treatmentCode}`;

    // 캐시에서 확인
    if (treatmentFacilitiesCache.has(cacheKey)) {
      return treatmentFacilitiesCache.get(cacheKey)!;
    }

    const state = get();
    const filteredFacilities = state.facilities.filter(facility => facility.facilityCode === treatmentCode);
    // 캐시에 저장
    treatmentFacilitiesCache.set(cacheKey, filteredFacilities);

    return filteredFacilities;
  },

  // 호환성을 위한 deprecated 함수들
  setFacilitiesByHospital: (hospitalId, facilities) =>
    set((state) => {
      // 캐시 무효화
      treatmentFacilitiesCache.clear();
      return {
        facilities: facilities.sort((a, b) => a.id - b.id), // 메인 데이터도 업데이트
        facilitiesByHospital: {
          ...state.facilitiesByHospital,
          [hospitalId]: facilities.sort((a, b) => a.id - b.id)
        }
      };
    }),

  getFacilitiesByHospital: (hospitalId) => {
    const state = get();
    return state.facilitiesByHospital[hospitalId] || [];
  },
}));
