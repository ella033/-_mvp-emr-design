export interface HolidayInstancesTypes {
  id: number;
  holidayMasterId: number;
  year: number;
  actualDate: Date;
  startDate: Date;
  endDate: Date;
  isConfirmed: boolean;
}

export interface CreateHolidayInstancesTypesRequest extends HolidayInstancesTypes {
  createdAt: Date;
}
export interface CreateHolidayInstancesTypesResponse extends HolidayInstancesTypes {
  id: number;
}
