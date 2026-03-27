import type { Registration } from "@/types/registration-types";
import { useState, useRef, useLayoutEffect } from "react";
import {
  보험구분상세,
  보험구분상세Label,
  초재진Label,
  type 초재진,
  당뇨병요양비대상자유형Label,
  급여제한여부Label,
  type 당뇨병요양비대상자유형,
  type 급여제한여부,
} from "@/constants/common/common-enum";
import { cn } from "@/lib/utils";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import { getAgeOrMonth, getGender } from "@/lib/patient-utils";
import type { Patient } from "@/types/patient-types";
import type { PatientGroup } from "@/types/patient-groups-types";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { getCancerDataFromExtraQualification, getDiseaseRegistrationFromExtraQualification, getNonFaceToFaceDiagnosisInfoFromExtraQualification, getPreInfantInfoFromExtraQualification, getSelfPreparationPersonInfoFromExtraQualification, getStringFieldKeysDataFromExtraQualification } from "@/hooks/medical-info/add-disreg-modal-utils";
import { formatDateByPattern } from "@/lib/date-utils";
import { PatientNewBadgeIcon } from "@/components/custom-icons";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { get임신부WeekAndDay } from "@/lib/extra-qualification-utils";

const COMMON_BADGE_CLASSES =
  "flex items-center justify-center rounded-[4px] px-[4px] py-[3px] text-[11px] font-[500] cursor-default leading-none";



export const NewPatientBadge = ({ isNewPatient }: { isNewPatient?: boolean }) => {
  return isNewPatient ? (
    <span className="shrink-0 w-[16px] h-[16px] flex items-center justify-center">
      <PatientNewBadgeIcon className="w-[16px] h-[16px]" />
    </span>
  ) : null;
}

export const PatientBasicInfoBadge = ({
  patient,
  nameClassName,
  isNewPatient,
}: {
  patient: Patient | undefined;
  nameClassName?: string;
  isNewPatient?: boolean;
}) => {
  const patientNoRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const genderAgeRef = useRef<HTMLDivElement>(null);
  const [isAnyTruncated, setIsAnyTruncated] = useState(false);

  useLayoutEffect(() => {
    const refs = [patientNoRef, nameRef, genderAgeRef];

    const check = () => {
      const truncated = refs.some(
        (r) => r.current && r.current.scrollWidth > r.current.clientWidth
      );
      setIsAnyTruncated(truncated);
    };

    check();
    const observers: ResizeObserver[] = [];
    refs.forEach((r) => {
      const el = r.current;
      if (!el) return;
      const observer = new ResizeObserver(check);
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [patient?.patientNo, patient?.name, patient?.gender, patient?.birthDate, nameClassName]);

  if (!patient) return null;

  const tooltipContent = isAnyTruncated
    ? `${patient.patientNo} | ${patient.name} | (${getGender(patient.gender || 0, "ko")}/${getAgeOrMonth(patient.birthDate || "", "en")})`
    : undefined;

  return (
    <MyTooltip content={tooltipContent}>
      <div className="flex items-center gap-[4px] min-w-0">
        <NewPatientBadge isNewPatient={isNewPatient} />
        <div
          ref={patientNoRef}
          className="text-[13px] font-[700] text-[var(--gray-100)] whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-3"
        >
          {patient.patientNo}
        </div>
        <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
        <div
          ref={nameRef}
          className={cn(
            "text-[13px] font-[700] text-[var(--gray-100)] whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-1",
            nameClassName,
            patient.name.length <= 2 ? "min-w-[24px]"
              : patient.name.length === 3 ? "min-w-[35px]"
                : "min-w-[48px]"
          )}
        >
          {patient.name}
        </div>
        <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
        <div
          ref={genderAgeRef}
          className="flex items-center text-[12px] font-[500] text-[var(--gray-300)] whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-2"
        >
          ({getGender(patient.gender || 0, "ko")}/{getAgeOrMonth(patient.birthDate || "", "en")})
        </div>
      </div>
    </MyTooltip>
  );
}

export const PatientReceptionTypeBadge = ({ receptionType }: { receptionType: 초재진 }) => {
  return (
    <div
      className={cn(COMMON_BADGE_CLASSES, "bg-[var(--bg-base)] text-[var(--gray-100)] border border-[var(--border-1)]")}
    >
      {초재진Label[receptionType]}
    </div>
  );
}

export const PatientInsuranceTypeBadge = ({
  insuranceType,
}: {
  insuranceType: 보험구분상세;
}) => {
  return (
    <div
      className={cn(COMMON_BADGE_CLASSES, "bg-[var(--blue-1)] text-[var(--blue-2)] border border-[var(--blue-1)]")}
    >
      {보험구분상세Label[insuranceType]}
    </div>
  );
};

export const PatientPregnantBadge = ({ registration, encounterDate }: { registration: Registration, encounterDate: string }) => {
  const pregnantData = get임신부WeekAndDay(registration.extraQualification, encounterDate);
  if (!pregnantData) return null;
  return (
    <MyTooltip content={`GA ${pregnantData.week}+${pregnantData.day} wks`}>
      <div className={cn(COMMON_BADGE_CLASSES, "bg-[var(--red-1)] text-[var(--red-2)] border border-[var(--red-1)]")}>임신부</div>
    </MyTooltip>
  );
};

export const PatientGroupBadge = ({ groupId }: { groupId: number | null }) => {
  const patientGroups = usePatientGroupsStore((s) => s.patientGroups);
  const group = groupId != null ? patientGroups.find((g: PatientGroup) => g.id === groupId) : null;
  if (!group) return null;
  return (
    <div className={cn(COMMON_BADGE_CLASSES, "bg-[var(--bg-3)] text-[var(--gray-100)] border border-[var(--border-1)]")}>
      {group.name}
    </div>
  );
};

interface ExtraQualificationBadgeData {
  name: string;
  tooltip: React.ReactNode;
}

// 날짜 값을 number로 변환 (number, string, 또는 빈 객체 처리)
const toDateNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return undefined;
};

// 산정특례 툴팁 아이템 컴포넌트: (특정기호): 등록일-종료일
const QualificationFromToTooltipItem = ({
  특정기호,
  등록일,
  종료일,
}: {
  특정기호?: unknown;
  등록일?: unknown;
  종료일?: unknown;
}) => {
  const startDate = toDateNumber(등록일);
  const endDate = toDateNumber(종료일);

  return (
    <div className="flex flex-row gap-1">
      <span className="font-bold">({String(특정기호 || "")}):</span>
      <span>
        {formatDateByPattern(String(startDate ?? ""), "YY.MM.DD")}-
        {formatDateByPattern(String(endDate ?? ""), "YY.MM.DD")}
      </span>
    </div>
  );
};

/** 한 항목 처리 중 오류가 나도 나머지 뱃지는 추가되도록 try-catch 래퍼 */
function tryAddBadge(add: () => void) {
  try {
    add();
  } catch {
    // 해당 항목만 스킵, 무한 로딩 방지
  }
}

export const PatientExtraQualificationBadges = ({
  registration: registration,
}: {
  registration: Registration;
}) => {
  const extraQualification = registration.extraQualification;
  const extraQualifications: ExtraQualificationBadgeData[] = [];
  if (!extraQualification || Object.keys(extraQualification).length === 0) {
    return null;
  }
  tryAddBadge(() => {
    const activeCancers = getCancerDataFromExtraQualification(extraQualification).filter((cancer) => cancer.등록일 || cancer.특정기호 || cancer.등록번호);
    if (activeCancers.length > 0) {
      extraQualifications.push({
        name: "중증암",
        tooltip: (
          <div className="flex flex-col">
            {activeCancers.map((cancer, index) => (
              <QualificationFromToTooltipItem
                key={`cancer-${index}`}
                특정기호={cancer.특정기호}
                등록일={cancer.등록일}
                종료일={cancer.종료일}
              />
            ))}
          </div>
        ),
      });
    }
  });

  tryAddBadge(() => {
    const burn = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례화상등록대상자") as any;
    if (burn) {
      extraQualifications.push({
        name: "중증화상",
        tooltip: (
          <QualificationFromToTooltipItem
            특정기호={burn.특정기호}
            등록일={burn.등록일}
            종료일={burn.종료일}
          />
        ),
      });
    }
  });

  tryAddBadge(() => {
    const rareDisease = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례희귀질환등록대상자") as any;
    if (rareDisease) {
      extraQualifications.push({
        name: "희귀난치",
        tooltip: <QualificationFromToTooltipItem
          특정기호={rareDisease.특정기호}
          등록일={rareDisease.등록일}
          종료일={rareDisease.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const rareDiseaseSupport = getDiseaseRegistrationFromExtraQualification(extraQualification, "희귀난치의료비지원대상자") as any;
    if (rareDiseaseSupport) {
      extraQualifications.push({
        name: "희귀난치-지원",
        tooltip: <QualificationFromToTooltipItem
          특정기호={rareDiseaseSupport.특정기호}
          등록일={rareDiseaseSupport.등록일}
          종료일={rareDiseaseSupport.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const intractableDisease = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례중증난치질환등록대상자") as any;
    if (intractableDisease) {
      extraQualifications.push({
        name: "중증난치",
        tooltip: <QualificationFromToTooltipItem
          특정기호={intractableDisease.특정기호}
          등록일={intractableDisease.등록일}
          종료일={intractableDisease.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const tuberculosis = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례결핵등록대상자") as any;
    if (tuberculosis) {
      extraQualifications.push({
        name: "결핵",
        tooltip: <QualificationFromToTooltipItem
          특정기호={tuberculosis.특정기호}
          등록일={tuberculosis.등록일}
          종료일={tuberculosis.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const severeDementia = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례중증치매등록대상자") as any;
    if (severeDementia) {
      extraQualifications.push({
        name: "중증치매",
        tooltip: <QualificationFromToTooltipItem
          특정기호={severeDementia.특정기호}
          등록일={severeDementia.등록일}
          종료일={severeDementia.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const ultraRareDisease = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례극희귀등록대상자") as any;
    if (ultraRareDisease) {
      extraQualifications.push({
        name: "극희귀",
        tooltip: <QualificationFromToTooltipItem
          특정기호={ultraRareDisease.특정기호}
          등록일={ultraRareDisease.등록일}
          종료일={ultraRareDisease.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const ultraRareDisease2 = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례상세불명희귀등록대상자") as any;
    if (ultraRareDisease2) {
      extraQualifications.push({
        name: "상세불명희귀",
        tooltip: <QualificationFromToTooltipItem
          특정기호={ultraRareDisease2.특정기호}
          등록일={ultraRareDisease2.등록일}
          종료일={ultraRareDisease2.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const otherChromosomal = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례기타염색체이상질환등록대상자") as any;
    if (otherChromosomal) {
      extraQualifications.push({
        name: "기타염색체",
        tooltip: <QualificationFromToTooltipItem
          특정기호={otherChromosomal.특정기호}
          등록일={otherChromosomal.등록일}
          종료일={otherChromosomal.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const latentTuberculosis = getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례잠복결핵등록대상자") as any;
    if (latentTuberculosis) {
      extraQualifications.push({
        name: "잠복결핵",
        tooltip: <QualificationFromToTooltipItem
          특정기호={latentTuberculosis.특정기호}
          등록일={latentTuberculosis.등록일}
          종료일={latentTuberculosis.종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const diabetes = getStringFieldKeysDataFromExtraQualification(extraQualification, "당뇨병요양비대상자유형") as any;
    if (diabetes && diabetes != "") {
      extraQualifications.push({
        name: "당뇨요양비",
        tooltip: diabetes,
      });
    }
  });

  tryAddBadge(() => {
    const nonCovered = getStringFieldKeysDataFromExtraQualification(extraQualification, "급여제한여부") as any;
    var nonCoveredLabel = 급여제한여부Label[Number(nonCovered) as unknown as 급여제한여부];
    if (nonCoveredLabel) {
      extraQualifications.push({
        name: "급여제한",
        tooltip: nonCoveredLabel,
      });
    }
  });

  tryAddBadge(() => {
    const traveler = getStringFieldKeysDataFromExtraQualification(extraQualification, "출국자여부") as any;
    if (String(traveler) === "Y") {
      extraQualifications.push({
        name: "출국자",
        tooltip: null,
      });
    }
  });

  tryAddBadge(() => {
    const nursingHospital = getStringFieldKeysDataFromExtraQualification(extraQualification, "요양병원입원여부") as any;
    if (String(nursingHospital) === "Y") {
      extraQualifications.push({
        name: "요양병원입원",
        tooltip: null,
      });
    }
  });

  tryAddBadge(() => {
    const preInfant = getPreInfantInfoFromExtraQualification(extraQualification) as any;
    if (preInfant) {
      extraQualifications.push({
        name: "조산아/저체중",
        tooltip: <QualificationFromToTooltipItem
          특정기호={preInfant.등록번호}
          등록일={preInfant.시작유효일자}
          종료일={preInfant.종료유효일자}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const selfReliance = getSelfPreparationPersonInfoFromExtraQualification(extraQualification) as any;
    if (selfReliance) {
      extraQualifications.push({
        name: "자립준비",
        tooltip: <QualificationFromToTooltipItem
          특정기호={selfReliance.특정기호}
          등록일={selfReliance.지원시작일}
          종료일={selfReliance.지원종료일}
        />,
      });
    }
  });

  tryAddBadge(() => {
    const differentialCost = getStringFieldKeysDataFromExtraQualification(extraQualification, "본인부담차등여부") as any;
    if (String(differentialCost) === "Y") {
      extraQualifications.push({
        name: "본인부담차등",
        tooltip: null,
      });
    }
  });

  tryAddBadge(() => {
    const nonFaceToFaceDiagnosis = getNonFaceToFaceDiagnosisInfoFromExtraQualification(extraQualification) as any;

    const reasons: string[] = [];
    if (String(nonFaceToFaceDiagnosis?.섬벽지거주여부) === "Y") reasons.push("A(섬벽지)");
    if (String(nonFaceToFaceDiagnosis?.장애등록여부) === "Y") reasons.push("B(장애등록)");
    if (String(nonFaceToFaceDiagnosis?.장기요양등급여부) === "Y") reasons.push("C(장기요양등급)");
    if (String(nonFaceToFaceDiagnosis?.응급취약지거주여부) === "Y") reasons.push("D(응급취약지거주)");
    if (reasons.length > 0) {
      extraQualifications.push({
        name: "비대면진료",
        tooltip: reasons.join(", "),
      });
    }
  });

  return (
    <>
      {extraQualifications.map((qualification) => (
        <MyTooltip key={qualification.name} content={qualification.tooltip}>
          <div
            className={cn(
              COMMON_BADGE_CLASSES,
              "bg-[var(--point)] text-[var(--gray-white)] border border-[var(--point)]"
            )}
          >
            {qualification.name}
          </div>
        </MyTooltip>
      ))}
    </>
  );
};