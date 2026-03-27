"use client";

import React, { useState, useRef, useMemo } from "react";
import type { HospitalBase } from "@/types/hospital-types";
import DaumPostcode from "react-daum-postcode";
import { formatPhoneNumber } from "@/lib/patient-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 진료과목 } from "@/constants/common/common-enum";

interface CreateHospitalProps {
  onCreateHospitalAction: (hospital: HospitalBase) => void;
  isLoading?: boolean;
}

export function CreateHospital({
  onCreateHospitalAction,
  isLoading,
}: CreateHospitalProps) {
  const [formData, setFormData] = useState<Partial<HospitalBase>>({
    isPharmacyException: false,
    isMoonlightChildHospital: false,
  });
  const [isSearchAddressOpen, setIsSearchAddressOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  const onInputChange = (
    field: keyof HospitalBase,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDaumPostComplete = (data: any) => {
    onInputChange("zipcode", data.zonecode);
    onInputChange("address1", data.roadAddress);
    onInputChange("address2", "");
    setIsSearchAddressOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    const hospitalData: HospitalBase = {
      ...formData,
      // TODO: 병원유형, 위치, 진료과 이후 정의
      type: 1,
      locationType: 1,
      departments: [진료과목.내과],
      isActive: true,
    } as HospitalBase;

    onCreateHospitalAction(hospitalData);
  };

  const isFormValid = useMemo(() => {
    const requiredFields = [
      "name",
      "director",
      "number",
      "bizRegNumber",
      "zipcode",
      "address1",
      "phone",
    ] as const;
    return requiredFields.every((field) => {
      const value = formData[field];
      return value && value.toString().trim() !== "";
    });
  }, [formData]);

  return (
    <div className="w-full max-w-2xl">
      {/* 제목 */}
      <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2">
        병원 생성
      </h1>
      <p className="text-base text-[var(--gray-500)] mb-8">
        EMR 사용을 위해 필요한 정보입니다. 추후 환경설정에서 수정하실 수
        있습니다.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            요양기관명 (국문) <span className="text-[var(--negative)]">*</span>
          </label>
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => onInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="요양기관명"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            요양기관명 (영문)
          </label>
          <input
            type="text"
            value={formData.nameEn || ""}
            onChange={(e) => onInputChange("nameEn", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="영문 요양기관명"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            대표자명 (국문) <span className="text-[var(--negative)]">*</span>
          </label>
          <input
            type="text"
            value={formData.director || ""}
            onChange={(e) => onInputChange("director", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="대표자명"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            대표자명 (영문)
          </label>
          <input
            type="text"
            value={formData.directorEn || ""}
            onChange={(e) => onInputChange("directorEn", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="영문 이름"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            요양기관번호 <span className="text-[var(--negative)]">*</span>
          </label>
          <input
            type="text"
            value={formData.number || ""}
            onChange={(e) => onInputChange("number", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="요양기관번호"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            사업자등록번호 <span className="text-[var(--negative)]">*</span>
          </label>
          <input
            type="text"
            value={formData.bizRegNumber || ""}
            onChange={(e) => onInputChange("bizRegNumber", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="사업자등록번호"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            주소 <span className="text-[var(--negative)]">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.zipcode || ""}
                onChange={(e) => onInputChange("zipcode", e.target.value)}
                className="flex-1 px-3 py-2 border w-[80px] border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
                placeholder="우편번호"
              />
              <div className="relative">
                <button
                  ref={searchBtnRef}
                  className="px-3 bg-[var(--main-color)] text-white rounded-md hover:bg-[var(--main-color-hover)] text-base w-[100px] flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    paddingTop: "8px",
                    paddingBottom: "8px",
                  }}
                  onClick={() => setIsSearchAddressOpen((v) => !v)}
                >
                  <img
                    src="/settings/white-search-icon.svg"
                    alt="search"
                    className="w-4 h-4"
                  />
                  <span>주소검색</span>
                </button>
                {isSearchAddressOpen && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 top-full z-50 mt-2 bg-white rounded-lg border shadow-lg"
                    style={{ width: 400 }}
                  >
                    <DaumPostcode
                      onComplete={handleDaumPostComplete}
                      autoClose
                      style={{ width: 400, height: 400 }}
                    />
                  </div>
                )}
              </div>
              <input
                type="text"
                value={formData.address1 || ""}
                onChange={(e) => onInputChange("address1", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
                placeholder="기본 주소"
              />
            </div>
            <input
              type="text"
              value={formData.address2 || ""}
              onChange={(e) => onInputChange("address2", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
              placeholder="상세 주소"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            주소 (영문)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.address1En || ""}
              onChange={(e) => onInputChange("address1En", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
              placeholder="영문 주소"
            />
            <input
              type="text"
              value={formData.address2En || ""}
              onChange={(e) => onInputChange("address2En", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
              placeholder="영문 주소2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            전화번호 <span className="text-[var(--negative)]">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone ? formatPhoneNumber(formData.phone) : ""}
            onChange={(e) => onInputChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="전화번호"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            팩스번호
          </label>
          <input
            type="tel"
            value={formData.fax ? formatPhoneNumber(formData.fax) : ""}
            onChange={(e) => onInputChange("fax", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="팩스번호"
          />
        </div>

        <div className="space-y-2 w-full md:col-span-2 md:w-1/2">
          <label className="block text-base font-medium text-[var(--setting-text-color)]">
            이메일
          </label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => onInputChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] text-base font-medium text-[var(--setting-text-color)]"
            placeholder="이메일"
          />
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center justify-between min-w-[140px]">
              <label className="block text-base font-medium text-[var(--setting-text-color)]">
                의약분업 예외지역
              </label>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isPharmacyException)}
                  onChange={(e) =>
                    onInputChange("isPharmacyException", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#333333]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between min-w-[125px]">
              <label className="block text-base font-medium text-[var(--setting-text-color)]">
                달빛어린이병원
              </label>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isMoonlightChildHospital)}
                  onChange={(e) =>
                    onInputChange("isMoonlightChildHospital", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#333333]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="w-full flex justify-center mt-10">
        <div className="w-full max-w-md">
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            onClick={handleSubmit}
            className={cn(
              "w-full py-3 text-base font-medium text-white rounded-md transition-colors",
              isFormValid && !isLoading
                ? "bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
                : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
            )}
          >
            {isLoading ? "생성 중..." : "완료"}
          </Button>
        </div>
      </div>
    </div>
  );
}
