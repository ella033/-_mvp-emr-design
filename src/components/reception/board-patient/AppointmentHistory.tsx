import AppointmentHistoryIndex, {
  type AppointmentHistoryIndexProps,
} from "./(appointment-history)/appointment-history-index";

export interface AppointmentHistoryProps
  extends AppointmentHistoryIndexProps {}

/**
 * 예약 현황 탭
 */
export function AppointmentHistory(props: AppointmentHistoryProps) {
  return <AppointmentHistoryIndex {...props} />;
}
