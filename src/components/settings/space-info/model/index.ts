export type * from "@/types/facility-types";
export * from "@/constants/common/common-enum"; // Re-export enums
export type { DoctorType } from "@/types/doctor-type";

export interface AssignedDoctorInfo {
  facilityId: number;
  doctorIds: number[];
}

export interface SpaceGroupData {
  code: number; // 공간코드 (enum value is number)
  label: string;
  facilities: import("@/types/facility-types").Facility[];
}
