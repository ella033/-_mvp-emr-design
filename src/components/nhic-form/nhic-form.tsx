import React, { useMemo, useEffect } from "react";
import NhicMedicalAidForm from "./nhic-medical-aid-form";
import NhicChoiceHospitalForm from "./nhic-choice-hospital-form";
import NhicEtcInfoForm from "./nhic-etc-info-form";
import {
  의료급여자격여부,
  수진자자격조회메시지,
} from "@/constants/common/common-enum";
import { components } from "@/generated/api/types";
import {
  getStringData,
  getNumberData,
  calculateComputedFieldsFromParsedData,
  getAllEtcInfoComputedFieldsFromParsedData,
  get본인부담구분코드ToString,
} from "@/lib/nhic-form-utils";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";

type EligibilityCheckResponseDto = components["schemas"]["EligibilityCheckResponseDto"];

interface NhicFormProps {
  isOpen: boolean;
  onApply: (eligibilityCheck: EligibilityCheck) => void;
  onCancel: () => void;
  onClose: () => void;
  isCompareMode?: boolean; // 비교 모드 여부 (기존 정보와 비교 시 true)
  parsedData?: EligibilityCheckResponseDto; // parsedData (우선 사용)
  rawData?: Record<string, never> | null; // rawData (보관용)
  eligibilityCheck?: EligibilityCheck; // 전체 EligibilityCheck 객체 (id, checkDateTime 등 포함)
}

const NhicForm: React.FC<NhicFormProps> = ({
  isOpen,
  onApply,
  onCancel,
  isCompareMode = false,
  parsedData,
  rawData,
  eligibilityCheck,
}) => {
  // parsedData가 없으면 null 반환
  if (!parsedData) {
    return null;
  }

  // parsedData에서 직접 computedFields 계산
  const computedFields = useMemo(() => {
    const baseComputedFields = calculateComputedFieldsFromParsedData(parsedData, rawData);

    // 비대면진료 문자열 변환 (parsedData에서만 가져올 수 있음)
    const 비대면진료대상정보 = parsedData["비대면진료대상정보"];
    // 빈 객체 {}인 경우도 체크해야 함
    const 비대면진료대상정보유효 = 비대면진료대상정보 &&
      typeof 비대면진료대상정보 === "object" &&
      Object.keys(비대면진료대상정보).length > 0;
    const 비대면진료여부 = 비대면진료대상정보유효
      ? `예${(비대면진료대상정보 as any)["섬벽지거주여부"] === "Y" ? "섬" : ""}${(비대면진료대상정보 as any)["장애등록여부"] === "Y" ? "장" : ""}${(비대면진료대상정보 as any)["장기요양등급여부"] === "Y" ? "요" : ""}${(비대면진료대상정보 as any)["응급취약지거주여부"] === "Y" ? "응" : ""}`
      : "아니오";

    return {
      ...baseComputedFields,
      비대면진료여부,
    };
  }, [parsedData]);

  // etcInfoList는 parsedData에서 직접 계산
  const etcInfoList = useMemo(
    () => getAllEtcInfoComputedFieldsFromParsedData(parsedData),
    [parsedData]
  );


  // 키보드 이벤트 처리 및 포커스 관리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        // EligibilityCheck 형태로 전달
        const eligibilityCheckData: EligibilityCheck = eligibilityCheck || {
          parsedData,
          rawData,
          checkDateTime: new Date().toISOString(),
        };
        onApply(eligibilityCheckData);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);

      // 모달이 열릴 때 정보적용 버튼에 포커스 (스타일은 숨김)
      setTimeout(() => {
        const applyButton = document.querySelector('button[class*="bg-[var(--main-color)]"]') as HTMLButtonElement;
        if (applyButton) {
          applyButton.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onApply, onCancel, parsedData, rawData, eligibilityCheck]);

  // HTML 태그를 React JSX로 변환하는 함수
  const parseHtmlToJsx = (htmlString: string): React.ReactNode => {
    if (!htmlString) return "";

    // <b> 태그를 <strong>으로 변환
    let jsxString = htmlString
      .replace(/<b>/g, "<strong>")
      .replace(/<\/b>/g, "</strong>");

    // <color=blue> 태그를 <span style="color: blue;">로 변환 (닫는 태그는 </color>)
    jsxString = jsxString
      .replace(/<color=#4F29E5>/g, '<span style="color: #4F29E5;">')
      .replace(/<\/color>/g, "</span>");

    // <color=red> 태그를 <span style="color: red;">로 변환 (닫는 태그는 </color>)
    jsxString = jsxString
      .replace(/<color=red>/g, '<span style="color: red;">')
      .replace(/<\/color>/g, "</span>");

    // <color=#4F29E5> 태그를 <span style="color: #4F29E5;">로 변환 (닫는 태그는 </color>)
    jsxString = jsxString
      .replace(/<color=#70737C>/g, '<span style="color: #70737C;">')
      .replace(/<\/color>/g, "</span>");

    // \n을 <br />로 변환
    jsxString = jsxString.replace(/\n/g, "<br />");

    // dangerouslySetInnerHTML을 사용하여 HTML을 렌더링
    return <span dangerouslySetInnerHTML={{ __html: jsxString }} />;
  };

  // 환자 자격 기본 정보 텍스트 생성 함수
  const getPatientBasicInfoText = (): React.ReactNode => {
    const name = computedFields?.수진자성명 || "";
    if (!name) return "";

    let basicInfoText = "";

    // parsedData에서 직접 추출
    const 자격여부Num = parseInt(getStringData(parsedData["자격여부"])) || 0;
    const 선택요양기관제도선택 = computedFields?.선택요양기관제도선택 === "예";
    const choiceHospitalList = computedFields?.선택요양기관목록 || [];

    // 의료급여자격여부에 따른 기본 정보
    switch (자격여부Num) {
      case 의료급여자격여부.의료급여1종:
      case 의료급여자격여부.의료급여2종:
        if (
          선택요양기관제도선택 &&
          choiceHospitalList &&
          !choiceHospitalList.some((x: any) => x.code === "99999999")
        ) {
          basicInfoText =
            수진자자격조회메시지.의료급여대상환자선택의료기관
              .replace("{0}", name)
              .split("\n")[0] || ""; // 첫 번째 줄만 기본 정보로 사용
        } else {
          basicInfoText = 수진자자격조회메시지.의료급여대상환자.replace(
            "{0}",
            name
          );
        }
        break;
      case 의료급여자격여부.지역세대주:
      case 의료급여자격여부.지역세대원:
      case 의료급여자격여부.임의계속직장가입자:
      case 의료급여자격여부.직장가입자:
      case 의료급여자격여부.직장피부양자:
        basicInfoText =
          수진자자격조회메시지.건강보험가입자
            .replace("{0}", name)
            .split("\n")[0] || ""; // 첫 번째 줄만 기본 정보로 사용
        break;
      case 의료급여자격여부.해당없음:
        basicInfoText =
          수진자자격조회메시지.건강보험가입자
            .replace("{0}", name)
            .split("\n")[0] || ""; // 첫 번째 줄만 기본 정보로 사용
        break;
    }

    return parseHtmlToJsx(basicInfoText);
  };

  // 환자 자격 세부 정보 텍스트 생성 함수
  const getPatientDetailInfoText = (): React.ReactNode => {
    const name = computedFields?.수진자성명 || "";
    if (!name) return "";

    let detailInfoText = "";

    // parsedData에서 직접 추출
    const 자격여부Num = parseInt(getStringData(parsedData["자격여부"])) || 0;
    const 선택요양기관제도선택 = computedFields?.선택요양기관제도선택 === "예";
    const 선택요양기관여부 = computedFields?.선택요양기관여부 === "예";
    const choiceHospitalList = computedFields?.선택요양기관목록 || [];

    // 의료급여자격여부에 따른 세부 정보 (두 번째 줄 이후)
    switch (자격여부Num) {
      case 의료급여자격여부.의료급여1종:
      case 의료급여자격여부.의료급여2종:
        if (
          선택요양기관제도선택 &&
          choiceHospitalList &&
          !choiceHospitalList.some((x: any) => x.code === "99999999")
        ) {
          const fullText =
            수진자자격조회메시지.의료급여대상환자선택의료기관.replace(
              "{0}",
              name
            );
          const lines = fullText.split("\n");
          detailInfoText = lines.slice(1).join("\n"); // 두 번째 줄부터 세부 정보
        }
        break;
      case 의료급여자격여부.지역세대주:
      case 의료급여자격여부.지역세대원:
      case 의료급여자격여부.임의계속직장가입자:
      case 의료급여자격여부.직장가입자:
      case 의료급여자격여부.직장피부양자:
        const healthInsuranceText = 수진자자격조회메시지.건강보험가입자.replace(
          "{0}",
          name
        );
        const healthLines = healthInsuranceText.split("\n");
        detailInfoText = healthLines.slice(1).join("\n"); // 두 번째 줄부터 세부 정보
        break;
      case 의료급여자격여부.해당없음:
        const noQualText = 수진자자격조회메시지.건강보험가입자.replace(
          "{0}",
          name
        );
        const noQualLines = noQualText.split("\n");
        detailInfoText = noQualLines.slice(1).join("\n"); // 두 번째 줄부터 세부 정보
        break;
    }

    // 추가 정보들 (parsedData 기반)
    // 산전지원금 대상자
    const 산전지원금잔액 = getNumberData(parsedData["의료급여산전지원금잔액"]);
    if (산전지원금잔액 > 0) {
      detailInfoText += 수진자자격조회메시지.산전지원금대상자
        .replace("{0}", name)
        .replace("{1}", 산전지원금잔액.toLocaleString());
    }

    // 출국환자
    const 출국자여부 = getStringData(parsedData["출국자여부"]);
    if (출국자여부 === "Y") {
      detailInfoText += 수진자자격조회메시지.출국환자.replace("{0}", name);
    }

    // 장애환자
    const 장애여부 = getStringData(parsedData["장애여부"]);
    if (장애여부 === "Y") {
      detailInfoText += 수진자자격조회메시지.장애환자.replace("{0}", name);
    }

    // 행려환자 (본인부담여부 M001)
    const 본인부담여부 = getStringData(parsedData["본인부담여부"]);
    if (본인부담여부.includes("M001")) {
      detailInfoText += 수진자자격조회메시지.행려환자.replace("{0}", name);
    }

    // 급여제한대상자
    const 급여제한여부 = getStringData(parsedData["급여제한여부"]);
    if (급여제한여부 && 급여제한여부 !== "00") {
      detailInfoText += 수진자자격조회메시지.급여제한대상자.replace("{0}", name);
    }

    // 선택의료기관이 아닌 환자
    if (선택요양기관제도선택 && !선택요양기관여부) {
      detailInfoText += 수진자자격조회메시지.선택의료기관아닌환자.replace(
        "{0}",
        name
      );
    }

    // 방문진료본인부담경감환자 (parsedData에 직접 필드가 없음 - TODO)
    // 본인부담차등제환자
    const 본인부담차등여부 = getStringData(parsedData["본인부담차등여부"]);
    if (본인부담차등여부 === "Y") {
      detailInfoText += 수진자자격조회메시지.본인부담차등제환자.replace(
        "{0}",
        name
      );
    }

    const 자립준비청년여부 = parsedData["자립준비청년대상자"] ? "Y" : "N";
    if (자립준비청년여부 === "Y") {
    }

    return detailInfoText ? parseHtmlToJsx(detailInfoText) : null;
  };
  if (!isOpen) return null;

  return (
    <div
      className="bg-white flex flex-col overflow-hidden h-full"
      role="dialog"
      aria-modal="true"
    >
      {/* 최상단 컨텐츠 */}
      <div className="p-2">
        <div className="text-lg pb-0 p-2">
          <div className="text-md text-gray-900 text-left pb-0">
            {getPatientBasicInfoText()}
          </div>
          {getPatientDetailInfoText() && (
            <div className="text-sm text-[var(--gray-400)] text-left">
              {getPatientDetailInfoText()}
            </div>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="p-3">
        <div className="bg-[var(--bg-1)] rounded-xs p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">수진자 성명</span>
              <span className="font-semibold text-gray-900">
                {computedFields?.수진자성명 || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">주민등록번호</span>
              <span className="font-semibold text-gray-900">
                {computedFields?.주민등록번호 || ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* 보험자격정보 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-800">
              보험자격정보
            </h3>
            <span className="text-sm text-gray-500">
              {computedFields?.조회기준일 || ""}
            </span>
          </div>
          <div className="bg-white border-t border-[var(--bg-4)]">
            <div className="grid grid-cols-3">
              {/* 첫 번째 열 */}
              <div className="space-y-0">
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    자격여부
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[7rem]">
                    {computedFields?.의료급여자격여부 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    세대주
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[7rem]">
                    {computedFields?.세대주성명 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    관할지사
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[7rem]">
                    {computedFields?.보장기관명 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    본인확인예외
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[7rem]">
                    {computedFields?.본인확인예외 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    비대면진료
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[7rem]">
                    {computedFields?.비대면진료여부 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    방문진료경감
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[7rem]">
                    {computedFields?.방문진료본인부담경감대상자여부 || ""}
                  </div>
                </div>
              </div>

              {/* 두 번째 열 */}
              <div className="space-y-0">
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    시설기호
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[8rem]">
                    {computedFields?.시설기호 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    취득일
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[8rem]">
                    {computedFields?.자격취득일 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    급여제한여부
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 truncate max-w-[8rem]">
                    {computedFields?.급여제한여부}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    출국자
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[8rem]">
                    {computedFields?.출국자여부 || ""}
                  </div>
                </div>

                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    자립준비청년
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[8rem]">
                    {computedFields?.자립준비청년여부 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    국적구분
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[8rem]">
                    {computedFields?.국적구분 || ""}
                  </div>
                </div>
              </div>

              {/* 세 번째 열 */}
              <div className="space-y-0">
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    보장기관기호
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[6.5rem]">
                    {computedFields?.보장기관기호 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    &nbsp;
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[6.5rem]">
                    &nbsp;
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    급여제한일
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[6.5rem]">
                    {computedFields?.급여제한일자 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    요양병원입원
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[6.5rem]">
                    {computedFields?.요양병원입원여부 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    본인부담차등
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[6.5rem]">
                    {computedFields?.본인부담차등여부 || ""}
                  </div>
                </div>
                <div className="flex border-b border-[var(--border-1)]">
                  <div className="w-26 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                    &nbsp;
                  </div>
                  <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[6.5rem]">
                    &nbsp;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 의료급여자격정보 */}
        {computedFields?.의료급여여부 ? (
          <NhicMedicalAidForm
            선택요양기관제도선택ToString={computedFields?.선택요양기관제도선택}
            선택요양기관지정일ToString={computedFields?.선택요양기관지정일}
            본인부담구분코드ToString={get본인부담구분코드ToString(
              computedFields?.본인부담구분코드,
              { fallbackToCode: true }
            )}
            선택요양기관여부ToString={computedFields?.선택요양기관여부}
            건강생활유지비지원금={computedFields?.건강생활유지비지원금 || ""}
            본인부담구분코드={computedFields?.본인부담구분코드}
          />
        ) : null}

        {/* 선택요양기관정보 */}
        {computedFields?.선택요양기관제도선택 === "예" ? (
          <NhicChoiceHospitalForm
            choiceHospitalList={computedFields?.선택요양기관목록 || []}
          />
        ) : null}

        {/* 기타자격정보 */}
        {computedFields?.기타자격정보여부 ? (
          <NhicEtcInfoForm etcInfoList={etcInfoList as any} />
        ) : null}
      </div>

      {/* 푸터 버튼 */}
      <div className="flex justify-end gap-2 p-4 border-t border-gray-200 mt-auto">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-[var(--gray-100)] bg-[var(--bg-main)] border border-[var(--border-1)] rounded-sm hover:bg-[var(--gray-200)] transition-colors"
        >
          {isCompareMode ? "미적용" : "적용안함"}
        </button>
        <button
          onClick={() => {
            // EligibilityCheck 형태로 전달
            const eligibilityCheckData: EligibilityCheck = eligibilityCheck || {
              parsedData,
              rawData,
              checkDateTime: new Date().toISOString(),
            };
            onApply(eligibilityCheckData);
          }}
          className="px-4 py-2 text-xs font-medium text-white bg-[var(--main-color)] border-[var(--main-color)] rounded-sm hover:bg-[var(--main-color)] transition-colors focus:outline-none"
        >
          {isCompareMode ? "변경적용" : "정보적용"}
        </button>
      </div>
    </div>
  );
};

export default NhicForm;
