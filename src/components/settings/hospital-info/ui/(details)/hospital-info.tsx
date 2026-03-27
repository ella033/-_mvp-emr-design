"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import DaumPostcode from "react-daum-postcode";
import { CircleHelp } from "lucide-react";
import { useToastHelpers } from "@/components/ui/toast";
import { BubbleTooltip } from "@/components/ui/bubble-tooltip";
import { formatPhoneNumber, unformatPhoneNumber } from "@/lib/patient-utils";
import { HospitalsService } from "@/services/hospitals-service";
import { useHospitalStore } from "@/store/hospital-store";
import { 진료과목, 진료과목Label } from "@/constants/common/common-enum";
import type { Hospital } from "@/types/hospital-types";
import { SectionLayout } from "@/components/settings/commons/section-layout";

interface HospitalInfoProps {
  formData: Partial<Hospital>;
  onInputChange: (
    field: keyof Hospital,
    value: string | boolean | number | number[]
  ) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaveRequest?: (saveFn: () => Promise<boolean>) => void;
  onCancelRequest?: (cancelFn: () => void) => void;
  onValidationErrorsChange?: (errors: string[]) => void;
}

export default function HospitalInfo({
  formData,
  onInputChange,
  onDirtyChange,
  onSaveRequest,
  onCancelRequest,
  onValidationErrorsChange,
}: HospitalInfoProps) {
  // ... inside HospitalInfo component ...
  const formDataRef = useRef(formData);

  // formData 최신값 유지
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Rest of state
  const { success } = useToastHelpers();
  const successRef = useRef(success);

  useEffect(() => {
    successRef.current = success;
  }, [success]);

  const [originalData, setOriginalData] = useState<Partial<Hospital>>({});
  const [isDirty, setIsDirty] = useState(false);
  const { hospital, setHospital } = useHospitalStore();
  const hospitalRef = useRef(hospital);

  useEffect(() => {
    hospitalRef.current = hospital;
  }, [hospital]);

  const [isSearchAddressOpen, setIsSearchAddressOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const validationErrorsRef = useRef(validationErrors);

  // 필수 입력값 검증 함수
  const validateHospitalInfo = useCallback((): string[] => {
    const currentData = formDataRef.current;
    const errors: string[] = [];

    if (!currentData.name || currentData.name.trim() === "") {
      errors.push("요양기관명(국문)은 필수 입력항목입니다.");
    }
    if (!currentData.director || currentData.director.trim() === "") {
      errors.push("대표자명(국문)은 필수 입력항목입니다.");
    }
    if (!currentData.number || currentData.number.trim() === "") {
      errors.push("요양기관번호는 필수 입력항목입니다.");
    }
    if (!currentData.bizRegNumber || currentData.bizRegNumber.trim() === "") {
      errors.push("사업자등록번호는 필수 입력항목입니다.");
    }
    if (!currentData.phone || currentData.phone.trim() === "") {
      errors.push("전화번호는 필수 입력항목입니다.");
    }
    if (!currentData.address1 || currentData.address1.trim() === "") {
      errors.push("주소는 필수 입력항목입니다.");
    }
    if (!currentData.departments || currentData.departments.length === 0) {
      errors.push("진료과목은 최소 1개 이상 선택해야 합니다.");
    }

    return errors;
  }, []);

  const handleDaumPostComplete = (data: any) => {
    onInputChange("zipcode", data.zonecode);
    onInputChange("address1", data.roadAddress);
    setIsSearchAddressOpen(false);
  };

  // ... (useEffect for originalData, isDirty, onDirtyChange remains same)
  // ... (useEffect for onValidationErrorsChange remains same)

  // 마운트 시 원본 데이터 저장 (Cancel 기능용)
  useEffect(() => {
    if (Object.keys(originalData).length === 0 && Object.keys(formData).length > 0) {
      setOriginalData({ ...formData });
    }
  }, [formData, originalData]);

  // 변경사항 감지
  useEffect(() => {
    const hasChanges = Object.keys(formData).some((key) => {
      const field = key as keyof Hospital;
      const currentValue = formData[field];
      const originalValue = originalData[field];

      if (Array.isArray(currentValue) || Array.isArray(originalValue)) {
        const currentArray = (currentValue as number[]) || [];
        const originalArray = (originalValue as number[]) || [];

        if (currentArray.length !== originalArray.length) {
          return true;
        }
        return currentArray.some(
          (value) => !originalArray.includes(value as number)
        );
      }

      const normCurrent = currentValue === null || currentValue === undefined ? "" : currentValue;
      const normOriginal = originalValue === null || originalValue === undefined ? "" : originalValue;

      return normCurrent !== normOriginal;
    });
    setIsDirty(hasChanges);
  }, [formData, originalData]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // 변경사항 감지 및 전파 (Deep Equal Check)
  useEffect(() => {
    const prevErrors = JSON.stringify(validationErrorsRef.current);
    const currentErrors = JSON.stringify(validationErrors);

    if (prevErrors !== currentErrors) {
      onValidationErrorsChange?.(validationErrors);
      validationErrorsRef.current = validationErrors;
    }
  }, [validationErrors, onValidationErrorsChange]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    // formDataRef, hospitalRef, successRef 최신값 사용
    const currentData = formDataRef.current;
    const currentHospital = hospitalRef.current;

    if (!currentHospital) {
      console.error("병원 정보가 없습니다.");
      return false;
    }

    const errors = validateHospitalInfo();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return false;
    }

    try {
      const hospitalUpdateData: Partial<Hospital> = {
        name: currentData.name,
        nameEn: currentData.nameEn,
        director: currentData.director,
        directorEn: currentData.directorEn,
        number: currentData.number,
        bizRegNumber: currentData.bizRegNumber,
        zipcode: currentData.zipcode,
        address1: currentData.address1,
        address2: currentData.address2,
        address1En: currentData.address1En,
        address2En: currentData.address2En,
        phone: currentData.phone ? unformatPhoneNumber(currentData.phone) : "",
        mobile: currentData.mobile
          ? unformatPhoneNumber(currentData.mobile)
          : undefined,
        fax: currentData.fax ? unformatPhoneNumber(currentData.fax) : "",
        email: currentData.email,
        isPharmacyException: currentData.isPharmacyException,
        isMoonlightChildHospital: currentData.isMoonlightChildHospital,
        departments: currentData.departments ?? [],
        beds: currentData.beds,
        type: currentData.type ?? currentHospital.type,
        locationType: currentData.locationType ?? currentHospital.locationType,
        isActive: currentData.isActive ?? currentHospital.isActive ?? true,
      };

      const updatedHospital = await HospitalsService.updateHospital(
        currentHospital.id,
        hospitalUpdateData
      );

      setHospital(updatedHospital);
      setOriginalData({ ...currentData });
      setIsDirty(false);
      setValidationErrors([]);
      successRef.current("저장 완료", "병원 정보가 성공적으로 저장되었습니다.");
      return true;
    } catch (error) {
      console.error("병원 정보 저장 실패:", error);
      return false;
    }
  }, [setHospital, validateHospitalInfo]);

  const handleCancel = useCallback(() => {
    const shouldCancel = window.confirm(
      "변경사항을 취소하시겠습니까? 저장하지 않은 내용은 사라집니다."
    );
    if (shouldCancel) {
      Object.keys(originalData).forEach((key) => {
        const field = key as keyof Hospital;
        onInputChange(field, originalData[field] as any);
      });
      setIsDirty(false);
      setValidationErrors([]);
    }
  }, [originalData, onInputChange]);

  // 저장/취소 함수 등록 - 의존성에서 함수들이 이제 stable하므로(혹은 덜 자주 변함) 성능 이슈 완화
  useEffect(() => {
    if (onSaveRequest) {
      onSaveRequest(handleSave);
    }
    if (onCancelRequest) {
      onCancelRequest(handleCancel);
    }
  }, [onSaveRequest, onCancelRequest, handleSave, handleCancel]);

  useEffect(() => {
    if (!isSearchAddressOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(e.target as Node)
      ) {
        setIsSearchAddressOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSearchAddressOpen]);

  return (
    <SectionLayout
      header={
        <div className="mb-[28px]">
          <h2 className="text-lg font-bold text-gray-900">기본 정보</h2>
        </div>
      }
      className="!gap-0"
      body={
        <>
          <div className="space-y-4">
            {/* ... (form content remains same) ... */}
            {/* Row 1: Hospital Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  요양기관명 (국문) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  data-testid="settings-hospital-info-name-input"
                  value={formData.name || ""}
                  maxLength={10}
                  onChange={(e) => onInputChange("name", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="유비내과의원"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  요양기관명 (영문)
                </label>
                <input
                  type="text"
                  value={formData.nameEn || ""}
                  maxLength={50}
                  onChange={(e) => onInputChange("nameEn", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="UB Clinic"
                />
              </div>
            </div>

            {/* Row 2: Directors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  대표자명 (국문) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.director || ""}
                  maxLength={10}
                  onChange={(e) => onInputChange("director", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  대표자명 (영문)
                </label>
                <input
                  type="text"
                  value={formData.directorEn || ""}
                  maxLength={50}
                  onChange={(e) => onInputChange("directorEn", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="Hong"
                />
              </div>
            </div>

            {/* Row 3: Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  요양기관번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.number || ""}
                  onChange={(e) => onInputChange("number", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  사업자등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bizRegNumber || ""}
                  onChange={(e) => onInputChange("bizRegNumber", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="111-11-111111"
                />
              </div>
            </div>

            {/* Row 4: Departments */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                진료과목 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    className="w-full h-10 pl-3 pr-10 appearance-none border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors text-gray-700 bg-white"
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!value || isNaN(value)) return;

                      const current = formData.departments || [];
                      // 이미 선택된 항목이면 무시
                      if (current.includes(value)) return;

                      const next = [...current, value];
                      onInputChange("departments", next);
                      e.target.value = ""; // 선택 후 초기화
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>진료 과목 선택</option>
                    {Object.values(진료과목)
                      .filter((value) => typeof value === "number")
                      .map((dept) => {
                        const typedDept = dept as number;
                        const isSelected = formData.departments?.includes(typedDept);
                        // 이미 선택된 항목은 비활성화 또는 숨김 처리 (기획에 따라 다름, 여기선 보이지만 선택 시 무시 로직은 위에서 처리)
                        return (
                          <option key={typedDept} value={typedDept} disabled={isSelected}>
                            {진료과목Label[typedDept as 진료과목]}
                          </option>
                        );
                      })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_6287_6476)">
                        <path d="M3.53809 6L7.53809 10L11.5381 6" stroke="#46474C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                      <defs>
                        <clipPath id="clip0_6287_6476">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2">
                  {formData.departments && formData.departments.length > 0 ? (
                    formData.departments.map((dept) => (
                      <div
                        key={dept}
                        onClick={() => {
                          const current = formData.departments || [];
                          const next = current.filter((d) => d !== dept);
                          onInputChange("departments", next);
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded border border-gray-300 bg-white text-sm text-gray-700 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors group"
                      >
                        <span>{진료과목Label[dept as 진료과목]}</span>
                        <span className="ml-2 text-gray-400 group-hover:text-red-400 transition-colors">
                          ×
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400">선택된 진료과목이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 5: Address */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                주소 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    readOnly
                    type="text"
                    value={formData.zipcode || ""}
                    className="w-24 h-10 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed focus:outline-none"
                    placeholder="우편번호"
                  />
                  <div className="relative">
                    <button
                      ref={searchBtnRef}
                      type="button"
                      data-testid="settings-hospital-info-address-search-button"
                      onClick={() => setIsSearchAddressOpen((v) => !v)}
                      className="h-10 px-4 bg-slate-800 text-white rounded-md hover:bg-slate-700 flex items-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <img
                        src="/settings/white-search-icon.svg"
                        alt="search"
                        className="w-4 h-4"
                      />
                      주소검색
                    </button>
                    {isSearchAddressOpen && (
                      <div
                        ref={menuRef}
                        className="absolute left-0 top-full z-50 mt-1"
                      >
                        <div className="border rounded-lg shadow-xl bg-white overflow-hidden w-[300px] sm:w-[400px]">
                          <DaumPostcode
                            onComplete={handleDaumPostComplete}
                            autoClose
                            style={{ width: "100%", height: 400 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    readOnly
                    type="text"
                    value={formData.address1 || ""}
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 focus:outline-none"
                    placeholder="기본 주소"
                  />
                </div>
                <input
                  type="text"
                  value={formData.address2 || ""}
                  onChange={(e) => onInputChange("address2", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="상세 주소 입력"
                />
              </div>
            </div>

            {/* Row 6: Address En */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                주소 (영문)
              </label>
              <input
                type="text"
                value={formData.address1En || ""}
                onChange={(e) => onInputChange("address1En", e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                placeholder="영문 주소"
              />
            </div>

            {/* Row 7: Phone/Fax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone ? formatPhoneNumber(formData.phone) : ""}
                  maxLength={13}
                  onChange={(e) => onInputChange("phone", e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="02-0000-0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  팩스번호
                </label>
                <input
                  type="tel"
                  value={formData.fax ? formatPhoneNumber(formData.fax) : ""}
                  onChange={(e) => onInputChange("fax", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="02-0000-0000"
                />
              </div>
            </div>

            {/* Row 8: Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                이메일
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => onInputChange("email", e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                placeholder="example@hospital.com"
              />
            </div>

            {/* Row 9: Toggles */}
            <div className="flex flex-wrap gap-8 py-2">
              <div className="flex items-center gap-3">
                {/* Design shows a toggle switch. Implementing a custom toggle or standard checkbox styled as toggle. */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(formData.isPharmacyException)}
                    onChange={(e) => onInputChange("isPharmacyException", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">의약분업 예외지역</span>
              </div>
              {/* 의약분업 예외지역 */}
              {/* 의약분업 예외지역 종료료 */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(formData.isAttachedClinic)}
                    onChange={(e) => onInputChange("isAttachedClinic", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">사업장 부속 요양기관</span>
                <BubbleTooltip
                  side="right"
                  align="start"
                  content={
                    <div className="text-xs leading-5">
                      <p className="font-semibold mb-1">사업장 부속 요양기관으로 설정 시 아래 항목이 자동 적용됩니다.</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>진찰료: 초진 인정 불가(전 건 재진 처리)</li>
                        <li>가산 적용: 야간·공휴 등 각종 가산 적용 불가</li>
                        <li>수탁검사 가산: 수탁기관 종별가산 포함 불가</li>
                        <li>본인부담금: 청구 시 환자 본인부담금 0원 처리</li>
                      </ul>
                    </div>
                  }
                >
                  <CircleHelp className="h-4 w-4 text-gray-400 cursor-help" />
                </BubbleTooltip>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(formData.isMoonlightChildHospital)}
                    onChange={(e) => onInputChange("isMoonlightChildHospital", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">달빛어린이병원</span>
              </div>
            </div>
          </div>
        </>
      }
    />
  );

}
