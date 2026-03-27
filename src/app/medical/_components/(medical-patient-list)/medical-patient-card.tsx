import {
  PatientBasicInfoBadge,
} from "../widgets/medical-patient-badge";
import type { Registration } from "@/types/registration-types";
import type { PatientListPosition } from "./medical-patient-list";
import clsx from "clsx";
import {
  보험구분상세Label,
  초재진,
  초재진Label,
  보험구분상세,
} from "@/constants/common/common-enum";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { MyButton } from "@/components/yjg/my-button";
import { formatDateByPattern, isSameCalendarDay } from "@/lib/date-utils";
import { useMemo, useState, useEffect } from "react";
import { 접수상태 } from "@/constants/common/common-enum";
import { useUsersStore } from "@/store/users-store";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { useVitalSignItems } from "@/hooks/vital-sign-item/use-vital-sign-items";
import { useVitalSignMeasurementsPivot } from "@/hooks/vital-sign-measurement/use-vital-sign-measurements";
import { getLatestEncounter } from "@/lib/encounter-util";
import type { Encounter } from "@/types/chart/encounter-types";
import { getMedicalBillItems } from "@/lib/calc-result-data-util";
import { cn } from "@/lib/utils";
import { MyContextMenu } from "@/components/yjg/my-context-menu";
import { MoneyIcon } from "@/components/custom-icons";
import { toKRW } from "@/lib/patient-utils";

function CallButtonWithTooltip({
  onCallClick,
  treatingUser,
  status,
}: {
  onCallClick: () => void;
  treatingUser: { id: number; name: string } | undefined;
  status: 접수상태;
}) {
  const button = (
    <MyButton
      className="absolute inset-0 w-full h-full rounded-[100px] text-[12px] font-[400] bg-[#7C5CFA] hover:bg-[#180F38]"
      onClick={(e) => {
        e.stopPropagation();
        onCallClick();
      }}
    >
      {status === 접수상태.진료중 ? "재호출" : "호출"}
    </MyButton>
  );

  if (treatingUser) {
    return (
      <MyTooltip
        content={<div className="text-[12px] whitespace-nowrap">
          진료중({treatingUser.name})
        </div>}
        side="top"
      >
        {button}
      </MyTooltip>
    );
  }

  return button;
}


function PatientReceptionTypeBadge({ receptionType }: { receptionType: 초재진 | undefined }) {
  if (receptionType === undefined) return null;
  return (
    <div className={cn(
      "text-[12px] whitespace-nowrap",
      receptionType === 초재진.초진 ? "text-[var(--main-color-2-1)]" : "text-[var(--gray-400)]"
    )}>
      {초재진Label[receptionType as 초재진] || "알 수 없음"}
    </div>
  );
}

function PatientInsuranceTypeBadge({ insuranceType }: { insuranceType: 보험구분상세 | undefined }) {
  if (insuranceType === undefined) return null;
  return (
    <>
      <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
      <div className={cn(
        "text-[12px] whitespace-nowrap",
        insuranceType === 보험구분상세.일반 ? "text-[var(--blue-2)]" : "text-[var(--gray-400)]"
      )}>
        {보험구분상세Label[insuranceType] || "알 수 없음"}
      </div>
    </>
  );
}

const BT_NORMAL_MAX_DEFAULT = 37.5;

/** 바이탈 측정값이 하나라도 있으면 V/S 표시, 체온이 정상 범위 밖이면 값 표시 */
function PatientVitalSignSection({ registration }: { registration: Registration }) {
  const registrationDate = formatDateByPattern(
    registration.receptionDateTime ?? "",
    "YYYY-MM-DD"
  );
  const { data: vitalSignItems = [] } = useVitalSignItems();
  const { data: vitalSignMeasurementsPivot = [] } = useVitalSignMeasurementsPivot(
    registration.patientId ?? 0,
    registrationDate,
    registrationDate
  );

  const hasAnyMeasurement = useMemo(
    () =>
      vitalSignMeasurementsPivot.some(
        (group) => group.measurements != null && group.measurements.length > 0
      ),
    [vitalSignMeasurementsPivot]
  );

  const btItem = useMemo(
    () => vitalSignItems.find((item) => item.code === "BT"),
    [vitalSignItems]
  );
  const normalMax = btItem?.normalMaxValue ?? BT_NORMAL_MAX_DEFAULT;

  const btValue = useMemo(() => {
    const firstMeasurement = vitalSignMeasurementsPivot[0];
    const value = firstMeasurement?.measurements?.find(
      (m) => m.itemCode === "BT"
    )?.value;
    if (value == null || value === "") return null;
    const num = parseFloat(value);
    return Number.isNaN(num) ? null : num;
  }, [vitalSignMeasurementsPivot]);

  // 정상 범위 초과(고열)인 경우에만 표시
  const showBtHighOnly = btValue != null && btValue > normalMax;
  const btColorClass = "text-[var(--red-2)]";

  if (!hasAnyMeasurement && !showBtHighOnly) return null;
  if (registration.status === 접수상태.수납대기 || registration.status === 접수상태.수납완료) return null;

  return (
    <>
      {hasAnyMeasurement && (
        <>
          <MyDivideLine
            orientation="vertical"
            size="sm"
            color="bg-[var(--border-2)]"
            className="h-[10px]"
          />
          <div className="text-[12px] whitespace-nowrap text-[var(--cyan-2)]">
            V/S
          </div>
        </>
      )}
      {showBtHighOnly && btValue != null && (
        <>
          <MyDivideLine
            orientation="vertical"
            size="sm"
            color="bg-[var(--border-2)]"
            className="h-[10px]"
          />
          <MyTooltip content="체온">
            <div className={cn("text-[12px]", btColorClass)}>{btValue}°C</div>
          </MyTooltip>
        </>
      )}
    </>
  );
}

/** 접수 메모. listPosition에 따라 툴팁 방향 조정 */
function RegistrationMemo({
  memo,
  listPosition,
}: {
  memo: string | undefined;
  listPosition: PatientListPosition;
}) {
  if (memo === undefined || memo === null || memo.trim() === "") return null;
  const tooltipSide = listPosition === "left" ? "right" : "left";
  return (
    <>
      <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
      <MyTooltip content={<div className="text-[12px] whitespace-pre-wrap break-words">
        {memo}
      </div>} side={tooltipSide}>
        <div
          className="text-[12px] text-[var(--gray-400)] min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {memo}
        </div>
      </MyTooltip>
    </>
  );
}

/** 접수 기준 최신 encounter의 수납 정보(총액/본인부담) 표시. encounter 비동기 로드 */
function RegistrationEncounterPayInfo({ registration, onClickAction }: { registration: Registration; onClickAction?: () => void }) {
  const [encounter, setEncounter] = useState<Encounter | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLatestEncounter(registration.patientId ?? 0, registration).then((enc) => {
      if (!cancelled) setEncounter(enc ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [registration.id, registration.patientId, registration.receptionDateTime]);

  if (!encounter) return null;
  const { totals } = getMedicalBillItems(encounter.calcResultData);
  const totalAmount = totals.selfPayment + totals.corporationPayment + totals.fullSelfPayment + totals.nonBenefit;

  return (
    <div
      className="flex flex-row items-center justify-end cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClickAction?.();
      }}
    >
      <div className="flex items-center flex-row gap-[4px]">
        <MoneyIcon className={"w-[14px] h-[14px]"} />
        <div
          className="text-[12px] text-[var(--gray-200)] font-bold"
        >
          {toKRW(totalAmount)}
        </div>
      </div>
    </div>
  );
}

export default function MedicalPatientCard({
  registration,
  onCardClick,
  onCallClick,
  isSelected = false,
  listPosition,
  onHoldClick,
  onReturnToWaitingClick,
  onCreateChartClick,
  onClinicalMemoClick,
}: {
  registration: Registration;
  onCardClick: () => void;
  onCallClick: () => void;
  isSelected?: boolean;
  listPosition: PatientListPosition;
  /** 우클릭 메뉴: 보류 (대기 환자일 때) */
  onHoldClick?: () => void;
  /** 우클릭 메뉴: 진료대기 (보류 환자일 때) */
  onReturnToWaitingClick?: () => void;
  /** 우클릭 메뉴: 차트생성 */
  onCreateChartClick?: () => void;
  /** 우클릭 메뉴: 임상메모 */
  onClinicalMemoClick?: () => void;
}) {
  const status: 접수상태 = registration.status ?? 접수상태.대기;
  const showStatusAndCall =
    status === 접수상태.대기 || status === 접수상태.진료중;
  const [waitingMinutes, setWaitingMinutes] = useState<number>(0);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const isEncounterExist = useMemo(() => {
    return registration.encounters && registration.encounters.length > 0;
  }, [registration.encounters]);
  const getUserById = useUsersStore((s) => s.getUserById);
  const treatingUser =
    status === 접수상태.진료중 &&
      registration.updateId != null &&
      registration.hospitalId != null
      ? getUserById(String(registration.hospitalId), registration.updateId)
      : undefined;



  useEffect(() => {
    if (status !== 접수상태.대기 || !registration.receptionDateTime) {
      setWaitingMinutes(0);
      return;
    }

    const calculateWaitingTime = () => {
      if (!registration.receptionDateTime) return;
      const createdTime = new Date(registration.receptionDateTime);
      const currentTime = new Date();
      const diffInMs = currentTime.getTime() - createdTime.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      setWaitingMinutes(diffInMinutes);
    };

    calculateWaitingTime();
    const interval = setInterval(calculateWaitingTime, 30000);

    return () => clearInterval(interval);
  }, [status, registration.receptionDateTime]);

  const displayText =
    status === 접수상태.대기
      ? registration.receptionDateTime &&
        isSameCalendarDay(new Date(registration.receptionDateTime), new Date())
        ? `${waitingMinutes}분`
        : ""
      : status === 접수상태.진료중
        ? "진료중"
        : "";

  const contextMenuItems = [
    ...(onHoldClick && (status === 접수상태.대기 || status === 접수상태.진료중)
      ? [
        {
          label: "보류",
          onClick: () => {
            setContextMenuOpen(false);
            onHoldClick();
          },
        },
      ]
      : []),
    ...(onReturnToWaitingClick && status === 접수상태.보류
      ? [
        {
          label: "진료대기",
          onClick: () => {
            setContextMenuOpen(false);
            onReturnToWaitingClick();
          },
        },
      ]
      : []),
    ...(onCreateChartClick && status === 접수상태.대기 && !isEncounterExist
      ? [
        {
          label: "차트생성",
          onClick: () => {
            setContextMenuOpen(false);
            onCreateChartClick();
          },
        },
      ]
      : []),
    ...(onClinicalMemoClick && !isSelected
      ? [
        {
          label: "임상메모",
          onClick: () => {
            setContextMenuOpen(false);
            onClinicalMemoClick();
          },
        },
      ]
      : []),
  ];

  return (
    <div
      className={clsx(
        "flex flex-col bg-[var(--bg-2)] justify-between p-[8px] cursor-pointer",
        isSelected
          ? "border-y border-[var(--main-color-2-1)] bg-[var(--gray-white)]"
          : "border-b border-[var(--border-2)]"
      )}
      data-testid="medical-patient-card"
      data-patient-name={registration.patient?.name ?? ""}
      data-registration-id={registration.id ?? ""}
      data-status={String(status)}
      data-selected={isSelected ? "true" : "false"}
      onClick={onCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (contextMenuItems.length > 0) {
          setContextMenuPosition({ x: e.clientX, y: e.clientY });
          setContextMenuOpen(true);
        }
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <div className="flex gap-2 justify-between items-center">
        <div data-testid="medical-patient-name">
          <PatientBasicInfoBadge
            patient={registration.patient}
            nameClassName={cn("max-w-[50px]", status === 접수상태.대기 && isEncounterExist ? "text-[var(--chart-waiting-name)]" : "")}
            isNewPatient={registration.isNewPatient}
          />
        </div>
        {showStatusAndCall && (
          <div
            className={clsx(
              "flex justify-center items-center shrink-0 h-[25px] font-[500] text-[12px] relative",
              status === 접수상태.대기 && "text-[var(--gray-100)] w-[40px]",
              status === 접수상태.진료중 && "text-[#06F] w-[50px]"
            )}
          >
            {!isCardHovered && <span className="truncate">{displayText}</span>}
            {isCardHovered && (
              <CallButtonWithTooltip
                onCallClick={onCallClick}
                treatingUser={treatingUser}
                status={status}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex gap-[4px] items-center flex-nowrap overflow-hidden text-ellipsis">
        <PatientReceptionTypeBadge receptionType={registration.receptionType} />
        <PatientInsuranceTypeBadge insuranceType={registration.insuranceType} />
        <PatientVitalSignSection registration={registration} />
        <RegistrationMemo memo={registration.memo} listPosition={listPosition} />
      </div>
      {(status === 접수상태.수납대기 || status === 접수상태.수납완료) && (
        <RegistrationEncounterPayInfo registration={registration} onClickAction={onCardClick} />
      )}
      <MyContextMenu
        isOpen={contextMenuOpen}
        onCloseAction={() => setContextMenuOpen(false)}
        items={contextMenuItems}
        position={contextMenuPosition}
      />
    </div>
  );
}
