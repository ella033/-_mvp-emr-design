import type { Reception } from "@/types/common/reception-types";
import type { ReceptionInitialTab } from "@/constants/common/common-enum";
import type { BoardPatientDirtyController } from "./board-patient-runtime-context";

// 외부에서 사용하는 Reception 타입 별칭
export type ExternalReception = Reception;

export type BoardPatientTabId = ReceptionInitialTab;

// BoardPatient 및 하위 공용 컴포넌트에서 사용하는 공통 Props
export interface BoardPatientExternalProps {
  /**
   * dirty(unsaved) 상태 컨트롤러를 외부에서 주입할 수 있다.
   * - 미지정 시 /reception 기본: reception-tabs-store 기반 컨트롤러를 사용
   * - /medical 등 단독 화면에서는 로컬(draft/baseline) 기반 컨트롤러로 분리 가능
   */
  dirtyController: BoardPatientDirtyController;

  /** 현재 선택된/편집 중인 Reception */
  reception: ExternalReception | null;
  /** registrationId 또는 originalRegistrationId 등 식별자 */
  receptionId?: string | null;
  /** 진료 중 등으로 입력 불가 상태인지 여부 */
  isDisabled?: boolean;

  /** 최초 진입 시 보여줄 탭 (null이면 기본값 사용) */
  initialTab?: BoardPatientTabId | null;

  /** 탭 변경 시 상위로 알림 */
  onTabChange?: (tab: BoardPatientTabId) => void;

  /**
   * 필드 변경 시 상위로 partial 업데이트 전달
   * - 예: patientBaseInfo, insuranceInfo, receptionInfo, patientStatus 등
   */
  onReceptionChange?: (updates: Partial<ExternalReception>) => void;

  /**
   * 주요 도메인 액션
   * - create: 신규 접수
   * - update: 기존 접수 수정
   * - cancel: 접수 취소 (접수 취소 submit)
   * - clear: Reception 초기화 및 신규환자 탭 닫기 (return/clear)
   */
  onSubmit?: (
    action: "create" | "update" | "cancel" | "clear",
    reception: ExternalReception
  ) => Promise<void> | void;

  /** 결제 정보 상세 열기 등 /paymentInfo 탭에서 사용할 수 있는 선택적 액션 */
  onOpenPaymentDetail?: () => void;

  /** 출력센터 탭에서 사용할 수 있는 출력 액션 */
  onPrint?: (printType: string) => void;

  /** UI 상태 (선택적) */
  checkMsg?: string | null;
  saveStatus?: "idle" | "saving" | "saved" | "failed";
  showUnsavedChangesConfirm?: boolean;
  onConfirmUnsavedChanges?: () => void;
  onCancelUnsavedChanges?: () => void;

  /** 이미 접수된 환자 확인 팝업 관련 (선택적) */
  showDuplicateReceptionConfirm?: boolean;
  onConfirmDuplicateReception?: () => void;
  onCancelDuplicateReception?: () => void;

  /** 자격조회 비교 팝업 관련 (선택적) */
  showQualificationComparePopup?: boolean;
  qualificationCompareData?: {
    oldInsuranceInfo: any;
    newInsuranceInfo: any;
    parsedData: any;
    reception: ExternalReception;
    eligibilityResponse: any;
  } | null;
  handleQualificationCompareApplyPromise?: () => void;
  handleQualificationCompareCancelPromise?: () => void;
}


