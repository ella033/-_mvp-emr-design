export const ddocdocApi = {
  jobs: () => `/ddocdoc/jobs`,
  updateReservation: (reservationId: string) =>
    `/ddocdoc/reservations/${reservationId}`,
  healthCheckUrl: (appointmentId: string) =>
    `/ddocdoc-handler/health-check-url/${appointmentId}`,
};
