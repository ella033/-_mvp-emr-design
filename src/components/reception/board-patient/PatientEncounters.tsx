import PatientEncountersIndex, {
  type PatientEncountersIndexProps,
} from "./(patient-encounters)/patient-encounters-index";

export interface PatientEncountersProps extends PatientEncountersIndexProps { }

/**
 * 환자 처방 조회 탭
 */
export function PatientEncounters(props: PatientEncountersProps) {
  return <PatientEncountersIndex {...props} />;
}

