import type { HolidayInstancesTypes } from "./holiday-instances-types";

export interface HolidayMasterTypes {
  holidayName: string;
  startMonthDay: string | null;
  endMonthDay: string | null;
  group: string | null;
  description: string | null;
  isLunar: boolean;
  isTemp: boolean;
  holidayInstances: HolidayInstancesTypes[];
}
export interface HolidayMasterTypesResponse extends HolidayMasterTypes {
  id: number;
}
export interface CreateHolidayMasterTypesRequest extends HolidayMasterTypes {
  createdAt: Date;
}

export interface CreateHolidayMasterTypesResponse extends HolidayMasterTypes {
  id: number;
}

export interface UpdateHolidayMasterTypesRequest
  extends Partial<HolidayMasterTypes> {}

export interface UpdateHolidayMasterTypesResponse extends HolidayMasterTypes {
  id: number;
}

export interface DeleteHolidayMasterTypesResponse {
  id: number;
}
