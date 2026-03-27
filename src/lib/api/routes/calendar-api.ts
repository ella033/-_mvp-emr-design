export const calendarApi = {
  getHospitalSchedule: (year?: string, month?: string) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    const queryString = params.toString();
    return `/v1/calendar${queryString ? `?${queryString}` : ""}`;
  },
};
