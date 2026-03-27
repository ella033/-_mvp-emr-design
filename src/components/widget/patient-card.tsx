// components/PatientCard.tsx (한 파일로 모든 것 관리)
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { getAgeOrMonth, getGender } from "@/lib/patient-utils";
import { formatDateWithDay, formatDateTime } from "@/lib/date-utils";
import type { Registration } from "@/types/registration-types";
import { Fragment } from "react";
import { PatientBadge } from "./patient-badge";
import StatusBadge from "./status-badge";
import { useReceptionTabsStore } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import {
  isToday,
  normalizeRegistrationId,
  REGISTRATION_ID_NEW,
} from "@/lib/registration-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VitalSignMeasurement } from "@/types/vital/vital-sign-measurement-types";
import { 보험구분Label } from "@/constants/common/common-enum";
import { usePatientCardConfig } from "@/hooks/patient/use-patient-card-config";

interface PatientCardProps {
  registration: Registration;
  onCall?: () => void;
  className?: string;
  onCardClick?: () => void;
}

export default function PatientCard({
  registration,
  onCall,
  className,
  onCardClick,
}: PatientCardProps) {
  const { addOpenedReception, openedReceptions, setOpenedReceptionId } =
    useReceptionTabsStore();

  const config = usePatientCardConfig(registration);

  if (!registration) return null;

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    } else if (registration) {
      const reception =
        ReceptionService.convertRegistrationToReception(registration);
      const normalizedId = normalizeRegistrationId(
        reception.originalRegistrationId
      );
      const existingReception = openedReceptions.find(
        (r) => r.originalRegistrationId === normalizedId
      );

      if (existingReception) {
        setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
      } else {
        addOpenedReception({ ...(reception as any), originalRegistrationId: normalizedId });
        setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
      }
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCall?.();
  };

  return (
    <Card
      className={clsx(
        "p-0 h-fit w-full transition-all duration-300 cursor-pointer hover:scale-102 shadow-none hover:border-[#5395FF] min-w-70",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="flex flex-col gap-2 px-3 py-2">
        {/* Header */}
        <div className="flex flex-row flex-1 items-center justify-between">
          <div className="flex flex-row flex-1 items-center gap-1 flex-wrap">
            {config.showNewPatientBadge &&
              registration.patient?.createDateTime &&
              isToday(registration.patient.createDateTime) && (
                <div className="bg-amber-600 text-white w-4 h-4 p-1 text-xs font-bold flex items-center justify-center rounded-xs">
                  N
                </div>
              )}
            <div className="text-base font-bold">
              {registration.patient?.name}
            </div>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-sm flex items-center gap-1">
                  {getAgeOrMonth(registration.patient?.birthDate || "", "en")}{" "}
                  {getGender(registration.patient?.gender || 0, "en")}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-2 p-1">
                  <div className="text-sm text-center">
                    {formatDateWithDay(registration.patient?.birthDate)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <PatientBadge registration={registration} />
          </div>
          <StatusBadge registration={registration} />
        </div>

        {/* Body - roomPanel에 따른 내용 */}
        <PatientCardBody registration={registration} config={config} />

        {/* Footer */}
        <div className="flex flex-row flex-1 gap-2">
          <div className="flex-1 text-sm max-w-[300px] max-h-[100px] whitespace-pre-wrap items-center my-scroll">
            {registration.memo}
          </div>
          {config.showCallButton && onCall && (
            <div className="flex justify-end items-end">
              <Button
                className="text-xs text-white bg-black rounded-full px-2 py-1.5 hover:bg-red-500 cursor-pointer"
                style={{ minWidth: 0, height: "auto" }}
                onClick={handleCallClick}
              >
                호출
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Body 부분만 별도 컴포넌트로 (하지만 같은 파일 내에)
function PatientCardBody({
  registration,
  config,
}: {
  registration: Registration;
  config: ReturnType<typeof usePatientCardConfig>;
}) {
  const reception =
    ReceptionService.convertRegistrationToReception(registration);

  // 예약 화면
  if (config.bodyType === "appointment") {
    const infoItems = [
      { value: reception.insuranceInfo.cardNumber },
      { value: reception.patientBaseInfo.rrn },
      { value: reception.patientBaseInfo.roomPanel },
      {
        value:
          registration.patient?.phone1 === ""
            ? "010-1234-5678"
            : registration.patient?.phone1,
      },
    ];

    return (
      <div className="flex gap-1 items-center text-xs">
        {infoItems.map((item, idx) => (
          <Fragment key={idx}>
            <span>{item.value}</span>
            {idx < infoItems.length - 1 && (
              <span className="text-gray-300">|</span>
            )}
          </Fragment>
        ))}
      </div>
    );
  }

  // 수납실 화면
  if (config.bodyType === "payment") {
    return (
      <div className="flex gap-1 items-center text-xs">
        <span>{reception.insuranceInfo.cardNumber}</span>
        <span>
          총 금액 <b>5,000</b>원
        </span>
        <span className="text-gray-300">|</span>
        <span>
          미수금 <b className="text-red-500">0</b>원
        </span>
        <span className="text-gray-300">|</span>
        <span>
          환불금 <b className="text-blue-500">0</b>원
        </span>
      </div>
    );
  }

  // 접수 화면 (기본)
  const vitalSigns = reception?.bioMeasurementsInfo?.vital || [];
  const vitalSignComponents: React.ReactNode[] = [];

  let btMeasurement: any;
  let bpsMeasurement: any;
  let bpdMeasurement: any;

  for (const measurement of vitalSigns) {
    switch (measurement.itemId) {
      case 1: // 체온
        btMeasurement = measurement;
        break;
      case 2: // 혈압(수축기)
        bpsMeasurement = measurement;
        break;
      case 3: // 혈압(이완기)
        bpdMeasurement = measurement;
        break;
    }
  }

  if (btMeasurement) {
    vitalSignComponents.push(
      <VitalSignValue key="BT" vitalSignMeasurement={btMeasurement} />
    );
  }

  if (bpsMeasurement && bpdMeasurement) {
    vitalSignComponents.push(
      <VitalSignBloodPressure
        key="BP"
        bpsMeasurement={bpsMeasurement}
        bpdMeasurement={bpdMeasurement}
      />
    );
  }

  const hasVitalSigns = vitalSignComponents.length > 0;

  return (
    <div className="flex gap-1 items-center text-sm flex-wrap max-w-[300px]">
      <span>{보험구분Label[reception?.insuranceInfo?.uDept] || ""}</span>
      {config.showVitalSigns && hasVitalSigns && <span> | </span>}
      {config.showVitalSigns && (
        <div className="flex gap-1 items-center">
          {vitalSignComponents.map((component, index) => (
            <Fragment key={index}>
              {component}
              {index < vitalSignComponents.length - 1 && <span> | </span>}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// 유틸 컴포넌트들 (같은 파일 내에)
const VitalSignValue = ({
  vitalSignMeasurement,
}: {
  vitalSignMeasurement: VitalSignMeasurement;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span>
          {vitalSignMeasurement.value}
          {vitalSignMeasurement.vitalSignItem?.unit}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <table>
          <tbody>
            <tr>
              <td className="text-xs p-1 font-bold">
                {vitalSignMeasurement.vitalSignItem?.name}
              </td>
            </tr>
            <tr>
              <td className="text-xs p-1">
                {formatDateTime(vitalSignMeasurement.measurementDateTime, true)}
              </td>
            </tr>
            {vitalSignMeasurement.memo && (
              <tr>
                <td className="text-xs p-1">{vitalSignMeasurement.memo}</td>
              </tr>
            )}
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  );
};

const VitalSignBloodPressure = ({
  bpsMeasurement,
  bpdMeasurement,
}: {
  bpsMeasurement: VitalSignMeasurement;
  bpdMeasurement: VitalSignMeasurement;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span>
          {bpsMeasurement.value}/{bpdMeasurement.value}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <table>
          <tbody>
            <tr>
              <td className="text-xs p-1 font-bold">
                {bpsMeasurement.vitalSignItem?.name}
              </td>
              <td className="text-xs p-1 font-bold">
                {bpdMeasurement.vitalSignItem?.name}
              </td>
            </tr>
            <tr>
              <td className="text-xs p-1">
                {formatDateTime(bpsMeasurement.measurementDateTime, true)}
              </td>
              <td className="text-xs p-1">
                {formatDateTime(bpdMeasurement.measurementDateTime, true)}
              </td>
            </tr>
            {(bpsMeasurement.memo || bpdMeasurement.memo) && (
              <tr>
                <td className="text-xs p-1">{bpsMeasurement.memo}</td>
                <td className="text-xs p-1">{bpdMeasurement.memo}</td>
              </tr>
            )}
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  );
};
