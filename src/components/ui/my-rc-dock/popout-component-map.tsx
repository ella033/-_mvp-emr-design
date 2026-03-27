import PatientSymptom from "@/app/medical/_components/panels/patient-symptom";
import PatientClinicMemo from "@/app/medical/_components/panels/patient-clinic-memo";
import PatientMemo from "@/app/medical/_components/panels/patient-memo";
import AiPredictionsPanel from "@/app/medical/_components/panels/(ai-predictions)/ai-predictions-panel";
import EncounterHistory from "@/app/medical/_components/panels/(patient-history)/(encounter-history)/encounter-history";
import PatientDiagnosisPrescription from "@/app/medical/_components/panels/(patient-diagnosis-prescription)/patient-diagnosis-prescription";
import MedicalBundle from "@/app/medical/_components/panels/(medical-bundle)/medical-bundle";

/** tabId → 탭 제목 매핑 */
export const POPOUT_TAB_TITLES: Record<string, string> = {
  symptom: "증상",
  "clinic-memo": "임상 메모",
  "patient-memo": "환자 메모",
  memo: "환자 진료이력 요약",
  visit: "내원이력",
  record: "진단 및 처방",
  bundle: "묶음처방",
};

/** tabId → React 컴포넌트 매핑 (popout 페이지에서 사용) */
export const POPOUT_COMPONENT_MAP: Record<string, React.ReactElement> = {
  symptom: <PatientSymptom />,
  "clinic-memo": <PatientClinicMemo />,
  "patient-memo": <PatientMemo />,
  memo: <AiPredictionsPanel />,
  visit: <EncounterHistory />,
  record: <PatientDiagnosisPrescription />,
  bundle: <MedicalBundle />,
};

/** 유효한 탭 ID인지 확인 */
export function isValidPopoutTabId(tabId: string): boolean {
  return tabId in POPOUT_COMPONENT_MAP;
}

/** 탭 제목 조회 */
export function getPopoutTabTitle(tabId: string): string {
  return POPOUT_TAB_TITLES[tabId] ?? `Unknown: ${tabId}`;
}
