export const closingsApi = {
  daily: (date: string) => {
    return `/closings/daily?date=${date}`;
  }
}