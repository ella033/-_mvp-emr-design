import type { Encounter } from "@/types/chart/encounter-types";
import { useEffect, useState } from "react";
import { MyButton } from "@/components/yjg/my-button";
import { cn } from "@/lib/utils";
import DrugSeparationExceptionCodePopup from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-popup";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import EncounterPayInfo from "../../widgets/encounter-pay-info";
import {
  ClockIcon,
  DispensingNotePlusIcon,
  PatientExceptionIcon,
  PrescriptionBlockIcon,
  SpecificDetailIcon,
  SpecificDetailEmptyIcon,
} from "@/components/custom-icons";
import ScheduledOrderPopup from "./scheduled-order/scheduled-order-popup";
import { useScheduledOrdersByPatient } from "@/hooks/scheduled-order/use-scheduled-order";
import { formatDate } from "@/lib/date-utils";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { ScheduledOrder } from "@/types/scheduled-order-types";
import SpecificDetailPopup from "@/components/library/specific-detail/specific-detail-popup";
import {
  SpecificDetailCodeType,
  type SpecificDetail,
} from "@/types/chart/specific-detail-code-type";
import { getSpecificDetailEmptyContentInfo } from "@/components/disease-order/order/order-util";
import { useReceptionStore } from "@/store/common/reception-store";
import { useEncounterStore } from "@/store/encounter-store";
import PatientProhibitedDrugsPopup from "@/app/medical/_components/panels/(patient-prohibited-drugs)/patient-prohibited-drugs-popup";
import DispensingNotePopup from "./dispensing-note-popup";

const BUTTON_SIZE_CLASS = "px-[4px] py-[2px] text-[12px] rounded-[4px]";
const NUMBER_CLASS = "rounded-[4px] px-[4px] py-[0px]";

export interface FooterTopValues {
  patientExceptionCode: string;
  statementSpecificDetail: SpecificDetail[]; // 명세서 단위 특정내역
}

export function FooterTop({
  encounter,
  pharmacyNotes,
  onPharmacyNotesChange,
  addOrderLibrary,
  onValuesChange,
  onSaveAndTransmit,
  onPrintAndTransmit,
  isChartCheck = false,
}: {
  encounter: Encounter;
  pharmacyNotes: string;
  onPharmacyNotesChange: (value: string) => void;
  addOrderLibrary: (
    order: any,
    isScheduledOrder: boolean,
    scheduledOrderMemo: string
  ) => void;
  onValuesChange?: (values: FooterTopValues) => void;
  onSaveAndTransmit?: () => void;
  onPrintAndTransmit?: () => void;
  isChartCheck?: boolean;
}) {
  const [openScheduledOrder, setOpenScheduledOrder] = useState(false);
  const [openSpecificDetail, setOpenSpecificDetail] = useState(false);
  const [openExceptionCode, setOpenExceptionCode] = useState(false);
  const [openDispensingNote, setOpenDispensingNote] = useState(false);
  const [openPatientProhibitedDrugs, setOpenPatientProhibitedDrugs] =
    useState(false);
  const { data: scheduledOrders, isLoading: isLoadingScheduledOrders } =
    useScheduledOrdersByPatient(
      encounter.patientId || -1,
      formatDate(encounter.encounterDateTime || "", "-")
    );
  const [localScheduledOrders, setLocalScheduledOrders] = useState<
    ScheduledOrder[]
  >([]);

  // Registration에서 환자예외코드 가져오기
  const { currentRegistration } = useReceptionStore();
  const prohibitedDrugsCount = currentRegistration?.prohibitedDrugs?.length ?? 0;

  const {
    draftStatementSpecificDetail,
    setDraftStatementSpecificDetail,
  } = useEncounterStore();

  // 로컬 상태 관리
  const [patientExceptionCode, setPatientExceptionCode] = useState(
    currentRegistration?.exceptionCode || ""
  );
  // 특정내역은 encounter-store의 draft로 단일 소스 (번들 추가 시 머지, 팝업에서 추가/삭제)
  const statementSpecificDetail = draftStatementSpecificDetail;

  // specificDetail 배열의 항목 개수
  const specificDetailCount = statementSpecificDetail.length;

  const specificDetailEmptyInfo = getSpecificDetailEmptyContentInfo(statementSpecificDetail);
  const { hasEmptyContent: hasSpecificDetailEmptyContent, emptyContentTooltipMessage: specificDetailEmptyTooltip } =
    specificDetailEmptyInfo;

  useEffect(() => {
    setLocalScheduledOrders(scheduledOrders || []);
  }, [scheduledOrders]);

  // encounter가 변경되면 store의 draft는 setSelectedEncounter에서 초기화됨 (상위에서 호출)

  // Registration이 변경되면 환자예외코드 초기화
  useEffect(() => {
    setPatientExceptionCode(currentRegistration?.exceptionCode || "");
  }, [currentRegistration?.exceptionCode]);

  // 로컬 상태가 변경되면 부모에게 알림 (저장 시 footerTopValues 사용)
  useEffect(() => {
    onValuesChange?.({
      patientExceptionCode,
      statementSpecificDetail,
    });
  }, [patientExceptionCode, statementSpecificDetail, onValuesChange]);

  return (
    <div className={cn(
      "flex flex-wrap flex-row justify-between items-center px-2 py-1 border-[var(--border-1)]",
      isChartCheck ? "border rounded-sm" : "border-t"
    )}>
      <div className="flex flex-row items-center gap-1">
        <MyButton
          variant="ghost"
          className={cn(
            BUTTON_SIZE_CLASS,
            openDispensingNote ? "bg-[var(--bg-3)]" : ""
          )}
          tooltip={
            pharmacyNotes
              ? `조제시참고사항: ${pharmacyNotes}`
              : "약사에게 전달할 조제시참고사항을 입력해주세요."
          }
          onClick={() => setOpenDispensingNote(true)}
        >
          <IconLabelContainer isDataExist={!!pharmacyNotes}>
            <DispensingNotePlusIcon />
            조제메모
          </IconLabelContainer>
        </MyButton>
        {openDispensingNote && (
          <DispensingNotePopup
            isOpen={openDispensingNote}
            onCloseAction={() => setOpenDispensingNote(false)}
            value={pharmacyNotes}
            onChangeAction={onPharmacyNotesChange}
          />
        )}

        <MyButton
          variant="ghost"
          className={cn(
            BUTTON_SIZE_CLASS,
            openScheduledOrder ? "bg-[var(--bg-3)]" : ""
          )}
          tooltip="환자에게 다음 내원일에 내릴 처방을 미리 입력해주세요."
          onClick={() => setOpenScheduledOrder(true)}
        >
          <IconLabelContainer isDataExist={localScheduledOrders.length > 0}>
            <ClockIcon />
            {isLoadingScheduledOrders ? (
              <MyLoadingSpinner size="sm" />
            ) : (
              <div className="flex flex-row items-center gap-[4px]">
                예약처방
                {localScheduledOrders.length > 0 && (
                  <div className={cn(NUMBER_CLASS, "text-[var(--violet-2)] bg-[var(--violet-1)]")}>
                    {localScheduledOrders.length}
                  </div>
                )}
              </div>
            )}
          </IconLabelContainer>
        </MyButton>
        {openScheduledOrder && (
          <ScheduledOrderPopup
            encounter={encounter}
            scheduledOrders={localScheduledOrders}
            addOrderLibrary={addOrderLibrary}
            setOpen={setOpenScheduledOrder}
          />
        )}

        <MyButton
          variant="ghost"
          data-testid="medical-specific-detail-button"
          className={cn(
            BUTTON_SIZE_CLASS,
            openSpecificDetail ? "bg-[var(--bg-3)]" : ""
          )}
          tooltip={
            hasSpecificDetailEmptyContent
              ? specificDetailEmptyTooltip
              : "특정내역에 대한 내용을 작성해주세요."
          }
          onClick={() => setOpenSpecificDetail(true)}
        >
          <IconLabelContainer isDataExist={specificDetailCount > 0}>
            {specificDetailCount > 0 && hasSpecificDetailEmptyContent ? (
              <SpecificDetailEmptyIcon />
            ) : (
              <SpecificDetailIcon />
            )}
            <div className="flex flex-row items-center gap-[4px]">
              특정내역
              {specificDetailCount > 0 && (
                <div className={cn(NUMBER_CLASS, "text-[var(--violet-2)] bg-[var(--violet-1)]")}>
                  {specificDetailCount}
                </div>
              )}
            </div>
          </IconLabelContainer>
        </MyButton>
        {openSpecificDetail && (
          <SpecificDetailPopup
            type={SpecificDetailCodeType.Statement}
            currentSpecificDetails={statementSpecificDetail}
            setOpen={setOpenSpecificDetail}
            onChange={setDraftStatementSpecificDetail}
          />
        )}
        <MyButton
          variant="ghost"
          className={cn(
            BUTTON_SIZE_CLASS,
            openExceptionCode ? "bg-[var(--bg-3)]" : ""
          )}
          onClick={() => setOpenExceptionCode(true)}
          tooltip={
            patientExceptionCode
              ? `의약분업 환자 예외코드: ${patientExceptionCode}`
              : "의약분업 환자 예외코드를 입력해주세요."
          }
        >
          <IconLabelContainer isDataExist={!!patientExceptionCode}>
            <PatientExceptionIcon />
            환자예외
          </IconLabelContainer>
        </MyButton>
        <MyButton
          variant="ghost"
          className={cn(
            BUTTON_SIZE_CLASS,
            openPatientProhibitedDrugs ? "bg-[var(--bg-3)]" : ""
          )}
          tooltip="처방금지약품을 등록합니다."
          tooltipDelayDuration={500}
          onClick={() => setOpenPatientProhibitedDrugs(true)}
        >
          <div className="flex flex-row items-center gap-1">
            <PrescriptionBlockIcon className={cn(
              "w-[14px] h-[14px]",
              prohibitedDrugsCount > 0 && "text-red-500"
            )} />
            <div className={cn(
              "flex flex-row items-center",
              prohibitedDrugsCount > 0 ? "text-red-500" : ""
            )}>
              처방금지
            </div>
          </div>
        </MyButton>
        {openExceptionCode && (
          <DrugSeparationExceptionCodePopup
            type={DrugSeparationExceptionCodeType.Patient}
            setOpen={setOpenExceptionCode}
            currentExceptionCode={patientExceptionCode}
            setExceptionCode={(value: string) => {
              setPatientExceptionCode(value);
            }}
          />
        )}
        {openPatientProhibitedDrugs && (
          <PatientProhibitedDrugsPopup
            setOpen={setOpenPatientProhibitedDrugs}
          />
        )}
      </div>
      <EncounterPayInfo encounter={encounter} onSaveAndTransmit={onSaveAndTransmit} onPrintAndTransmit={onPrintAndTransmit} />
    </div>
  );
}

export function IconLabelContainer({
  children,
  isDataExist,
}: {
  children: React.ReactNode;
  isDataExist: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-1",
        isDataExist ? "text-[var(--violet-2)]" : ""
      )}
    >
      {children}
    </div>
  );
}
