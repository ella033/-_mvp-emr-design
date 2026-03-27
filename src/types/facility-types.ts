import { 공간코드 } from "@/constants/common/common-enum";
import { DoctorType } from "@/types/doctor-type";

export interface FacilityBase {
  hospitalId: number;
  facilityCode: 공간코드;
  name: string;
}

export interface Facility extends FacilityBase {
  id: number;
  appointmentRooms?: {
    id: number;
    user?: DoctorType;
  }[];
}

export interface CreateFacilityRequest extends FacilityBase {
  doctorIds?: number[];
}
export interface CreateFacilityResponse extends Facility { }

export interface UpdateFacilityRequest extends Partial<FacilityBase> { }
export interface UpdateFacilityResponse extends Facility { }
