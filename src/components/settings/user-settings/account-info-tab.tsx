"use client";

import { useUserStore } from "@/store/user-store";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import React, { useEffect, useRef, useState } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import { MyAccountService, type MyAccountProfile, type UpdateMyAccountProfileRequest } from "@/services/my-account-service";
import { FileService } from "@/services/file-service";
import DaumPostcode from "react-daum-postcode";
import { 진료과목, 진료과목Label, 사용자유형, 사용자유형Label } from "@/constants/common/common-enum";
import InputDate from "@/components/ui/input-date";
import { formatPhoneNumber, unformatPhoneNumber } from "@/lib/patient-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userAgent } from "next/server";
import { getFileUrl } from "@/lib/file-utils";


// Helper function (can be placed outside component or imported)
const formatDateForInput = (dateStr: string | number | null | undefined) => {
  if (!dateStr) return "";
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  }
  return str;
};

// ... inside component ...




export function AccountInfoTab() {
  const { success, error: errorToast } = useToastHelpers();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyAccountProfile | null>(null);
  const [formData, setFormData] = useState<Partial<MyAccountProfile>>({});

  const { setUser, user } = useUserStore(); // userStore 사용

  // 주소 검색 상태
  const [isSearchAddressOpen, setIsSearchAddressOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // 주소 검색 외부 클릭 처리
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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await MyAccountService.getProfile();
      setProfile(data);
      setFormData(data);
    } catch (e) {
      console.error("프로필 조회 실패", e);
      errorToast("프로필 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MyAccountProfile, value: any) => {
    setFormData((prev) => {
      const update = { ...prev, [field]: value };

      // 직업 변경 시 관련 필드 초기화 로직
      if (field === "type") {
        // 직업이 변경되면 면허번호, 전문의 과목, 전문의 자격번호 초기화
        update.licenseNo = ""; // 빈 문자열 또는 null로 초기화
        update.specialty = undefined;
        update.specialtyCertNo = undefined;
      }
      return update;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 업로드
      const uploadResponse = await MyAccountService.uploadProfileImage(file);

      if (uploadResponse && uploadResponse.uuid) {
        // 성공 시 미리보기 업데이트 및 폼 데이터 갱신
        const newFileInfo = {
          id: uploadResponse.id,
          uuid: uploadResponse.uuid
        };

        const updatedProfile = {
          ...formData, // 현재 폼 데이터 (이전 프로필 + 수정 사항)
          profileFileInfo: newFileInfo
        } as MyAccountProfile;

        setFormData(prev => ({
          ...prev,
          profileFileInfo: newFileInfo
        }));

        // 전역 상태 및 로컬 스토리지 업데이트
        const updatedUser = { ...user, ...updatedProfile };
        setUser(updatedUser as any);
        safeLocalStorage.setItem("user", JSON.stringify(updatedUser as any));

        success("프로필 이미지가 변경되었습니다.");
      }

    } catch (e) {
      console.error("이미지 업로드 실패", e);
      errorToast("이미지 업로드에 실패했습니다.");
    }

    // Reset file input
    e.target.value = "";
  };

  const handleDeleteImage = async () => {
    try {
      await MyAccountService.deleteProfileImage();

      const updatedProfile = {
        ...formData,
        profileFileInfo: null
      } as MyAccountProfile;

      setFormData(prev => ({
        ...prev,
        profileFileInfo: null
      }));

      // 전역 상태 및 로컬 스토리지 업데이트
      const updatedUser = { ...user, ...updatedProfile };
      setUser(updatedUser as any);
      safeLocalStorage.setItem("user", JSON.stringify(updatedUser));

      success("프로필 이미지가 삭제되었습니다.");
    } catch (e) {
      console.error("이미지 삭제 실패", e);
      errorToast("이미지 삭제에 실패했습니다.");
    }
  };

  const handleSealImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadResponse = await MyAccountService.uploadSealImage(file);

      if (uploadResponse && uploadResponse.uuid) {
        const newFileInfo = {
          id: uploadResponse.id,
          uuid: uploadResponse.uuid
        };

        const updatedProfile = {
          ...formData,
          sealFileInfo: newFileInfo
        } as MyAccountProfile;

        setFormData(prev => ({
          ...prev,
          sealFileInfo: newFileInfo
        }));

        const updatedUser = { ...user, ...updatedProfile };
        setUser(updatedUser as any);
        safeLocalStorage.setItem("user", JSON.stringify(updatedUser as any));

        success("직인 이미지가 등록되었습니다.");
      }

    } catch (e) {
      console.error("직인 업로드 실패", e);
      errorToast("직인 이미지 업로드에 실패했습니다.");
    }
    e.target.value = "";
  };

  const handleDeleteSealImage = async () => {
    try {
      await MyAccountService.deleteSealImage();

      const updatedProfile = {
        ...formData,
        sealFileInfo: null
      } as MyAccountProfile;

      setFormData(prev => ({
        ...prev,
        sealFileInfo: null
      }));

      const updatedUser = { ...user, ...updatedProfile };
      setUser(updatedUser as any);
      safeLocalStorage.setItem("user", JSON.stringify(updatedUser));

      success("직인 이미지가 삭제되었습니다.");
    } catch (e) {
      console.error("직인 삭제 실패", e);
      errorToast("직인 이미지 삭제에 실패했습니다.");
    }
  };

  // UI 표시 여부 계산
  const isDoctor = formData.type === 사용자유형.의사;
  const isNurse = formData.type === 사용자유형.간호사;

  // 면허번호 표시: 의사, 간호사일 때 (요청사항 기준). 다른 의료직도 필요할 수 있으나 요청에 충실히 구현.
  const showLicense = isDoctor || isNurse;
  // 전문의 정보 표시: 의사일 때만
  const showSpecialty = isDoctor;

  const handleDaumPostComplete = (data: any) => {
    handleInputChange("zipcode", data.zonecode);
    handleInputChange("address1", data.roadAddress);
    setIsSearchAddressOpen(false);
  };

  const handleCancel = () => {
    if (!profile) return;
    setFormData(profile);
    // 이미지 URL도 원래대로 복구하려면 다시 fetch하거나 원래 uuid로 다시 로드해야 함. 
    // 편의상 fetchProfile 다시 호출
    fetchProfile();
  };

  const handleSave = async () => {
    if (!formData.name) {
      errorToast("이름(국문)은 필수 입력값입니다.");
      return;
    }

    try {
      const updateData: UpdateMyAccountProfileRequest = {
        name: formData.name,
        nameEn: formData.nameEn,
        mobile: formData.mobile ? unformatPhoneNumber(formData.mobile) : null,
        birthDate: formData.birthDate ? String(formData.birthDate) : null, // number -> string 변환
        zipcode: formData.zipcode,
        address1: formData.address1,
        address2: formData.address2,
        type: formData.type,
        licenseNo: formData.licenseNo ? String(formData.licenseNo) : null,
        specialty: formData.specialty,
        specialtyCertNo: formData.specialtyCertNo
      };

      await MyAccountService.updateProfile(updateData);

      // 최신 프로필 정보 다시 조회하여 전역 상태 업데이트
      // updateProfile API가 업데이트된 객체를 반환하지 않으므로, fetchProfile() 또는 formData 기반 병합 필요.
      // 여기서는 fetchProfile()을 통해 확실한 서버 데이터를 가져오는 것이 안전하지만, 
      // 사용자 요청("전부 바뀐 컬럼 수정되도록 해줘")에 따라 즉시 반영을 위해 로컬 데이터 병합 우선 적용

      const updatedUser = { ...user, ...formData, ...updateData }; // formData에는 이미 UI값들이 있음
      // formData의 타입이 Partial<MyAccountProfile>이므로 AuthUserType | User 와 호환되도록 주의
      // user-store의 setUser 타입은 (user: AuthUserType | User) => void

      setUser(updatedUser as any);
      safeLocalStorage.setItem("user", JSON.stringify(updatedUser));

      success("계정 정보가 저장되었습니다.");
      fetchProfile(); // 최신 데이터 갱신 (비동기)
    } catch (e) {
      console.error("저장 실패", e);
      errorToast("저장에 실패했습니다.");
    }
  };



  if (loading) {
    return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div className="space-y-6">
        <h3 className="text-lg font-bold">계정 정보</h3>

        {/* 프로필 이미지 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">프로필 이미지 <span className="text-red-500">*</span></label>
          <div className="relative group w-24 h-24">
            <div className="w-24 h-24 bg-gray-50 rounded-md flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
              {formData.profileFileInfo?.uuid ? (
                <img src={getFileUrl(formData.profileFileInfo.uuid)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-400 font-light">+</span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="absolute bottom-[-6px] right-[-6px] w-8 h-8 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_10181_12688)">
                      <path d="M4.125 5.1875H4.6875C4.98587 5.1875 5.27202 5.06897 5.483 4.858C5.69397 4.64702 5.8125 4.36087 5.8125 4.0625C5.8125 3.91332 5.87176 3.77024 5.97725 3.66475C6.08274 3.55926 6.22582 3.5 6.375 3.5H9.75C9.89918 3.5 10.0423 3.55926 10.1477 3.66475C10.2532 3.77024 10.3125 3.91332 10.3125 4.0625C10.3125 4.36087 10.431 4.64702 10.642 4.858C10.853 5.06897 11.1391 5.1875 11.4375 5.1875H12C12.2984 5.1875 12.5845 5.30603 12.7955 5.517C13.0065 5.72798 13.125 6.01413 13.125 6.3125V11.375C13.125 11.6734 13.0065 11.9595 12.7955 12.1705C12.5845 12.3815 12.2984 12.5 12 12.5H4.125C3.82663 12.5 3.54048 12.3815 3.3295 12.1705C3.11853 11.9595 3 11.6734 3 11.375V6.3125C3 6.01413 3.11853 5.72798 3.3295 5.517C3.54048 5.30603 3.82663 5.1875 4.125 5.1875Z" stroke="#46474C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M6.375 8.5625C6.375 9.01005 6.55279 9.43928 6.86926 9.75574C7.18572 10.0722 7.61495 10.25 8.0625 10.25C8.51005 10.25 8.93928 10.0722 9.25574 9.75574C9.57221 9.43928 9.75 9.01005 9.75 8.5625C9.75 8.11495 9.57221 7.68572 9.25574 7.36926C8.93928 7.05279 8.51005 6.875 8.0625 6.875C7.61495 6.875 7.18572 7.05279 6.86926 7.36926C6.55279 7.68572 6.375 8.11495 6.375 8.5625Z" stroke="#46474C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_10181_12688">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>

                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[1100]">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => document.getElementById("profile-image-upload")?.click()}
                >
                  이미지 변경
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleDeleteImage}
                >
                  이미지 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              onClick={(e) => (e.currentTarget.value = "")}
            />
          </div>
        </div>

        {/* Row 1: Names */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">이름 (국문) <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name || ""}
              maxLength={10}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              placeholder="김이름"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">이름 (영문)</label>
            <input
              type="text"
              value={formData.nameEn || ""}
              maxLength={50}
              onChange={(e) => handleInputChange("nameEn", e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              placeholder="Kim Name"
            />
          </div>
        </div>

        {/* Row 2: ID & Phone */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">아이디 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.email || ""} // ID is email in this context? JSON says 'email' and 'isOwner'. Usually loginId is needed. But JSON only has email. Let's use Email as ID for now as per JSON.
              readOnly
              className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-gray-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">전화번호</label>
            <input
              type="tel"
              value={formData.mobile ? formatPhoneNumber(formData.mobile) : ""}
              maxLength={13}
              onChange={(e) => handleInputChange("mobile", e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        {/* Row 3: BirthDate */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">생년월일</label>
            <InputDate
              value={formatDateForInput(formData.birthDate)}
              onChange={(val) => handleInputChange("birthDate", val.replace(/-/g, ""))}
              placeholder="YYYY-MM-DD"
              className="h-10"
            />
          </div>
        </div>
        {/* Row 4: Address */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">주소</label>
          <div className="flex gap-2">
            <input
              readOnly
              type="text"
              value={formData.zipcode || ""}
              className="w-32 h-10 px-3 border border-gray-300 rounded-md text-gray-500 focus:outline-none bg-white"
              placeholder="우편번호"
            />
            <div className="relative">
              <button
                ref={searchBtnRef}
                type="button"
                onClick={() => setIsSearchAddressOpen((v) => !v)}
                className="h-10 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" />
                  <path d="M11 11L14.5 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
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
              className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none bg-white"
              placeholder="기본 주소"
            />
          </div>
          <input
            type="text"
            value={formData.address2 || ""}
            onChange={(e) => handleInputChange("address2", e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            placeholder="상세 주소 입력"
          />
        </div>

        {/* Row 5: Job & License */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">직업</label>
            <div className="relative">
              <select
                value={formData.type || ""}
                onChange={(e) => handleInputChange("type", Number(e.target.value))}
                className="w-full h-10 px-3 appearance-none border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="" disabled>직업 선택</option>
                {Object.values(사용자유형)
                  .filter((value) => typeof value === "number")
                  .map((type) => (
                    <option key={type} value={type}>
                      {사용자유형Label[type as 사용자유형]}
                    </option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          {showLicense && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">면허번호</label>
              <input
                type="text"
                value={formData.licenseNo || ""}
                onChange={(e) => handleInputChange("licenseNo", e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                placeholder="0000000"
              />
            </div>
          )}
        </div>

        {/* Row 6: Specialty & CertNo */}
        {
          showSpecialty && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">전문의 과목</label>
                <div className="relative">
                  <select
                    value={formData.specialty || ""}
                    onChange={(e) => handleInputChange("specialty", Number(e.target.value))}
                    className="w-full h-10 px-3 appearance-none border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="" disabled>전문의 선택</option>
                    {Object.values(진료과목)
                      .filter((value) => typeof value === "number")
                      .map((dept) => (
                        <option key={dept} value={dept}>
                          {진료과목Label[dept as 진료과목]}
                        </option>
                      ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">전문의 자격번호</label>
                <input
                  type="text"
                  value={formData.specialtyCertNo || ""}
                  onChange={(e) => handleInputChange("specialtyCertNo", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                  placeholder="0000000"
                />
              </div>
            </div>
          )
        }

        {/* Row 7: Dates */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">사용 시작일</label>
            <div className="relative">
              <input
                type="text"
                value={formData.hireDate || ""}
                readOnly
                className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-gray-500 focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.6667 2.66667H11.3333V2H10V2.66667H6V2H4.66667V2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667ZM12.6667 13.3333H3.33333V6H12.6667V13.3333ZM12.6667 4.66667H3.33333V4H4.66667V4.66667H6V4H10V4.66667H11.3333V4H12.6667V4.66667Z" fill="#9CA3AF" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">사용 종료일</label>
            <div className="relative">
              <input
                type="text"
                value={formData.resignationDate || ""}
                readOnly
                className="w-full h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-gray-500 focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.6667 2.66667H11.3333V2H10V2.66667H6V2H4.66667V2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667ZM12.6667 13.3333H3.33333V6H12.6667V13.3333ZM12.6667 4.66667H3.33333V4H4.66667V4.66667H6V4H10V4.66667H11.3333V4H12.6667V4.66667Z" fill="#9CA3AF" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Seal Image (Doctors Only) */}
      {isDoctor && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">직인 이미지</label>
          <div className="relative group w-24 h-24">
            <div className="w-24 h-24 bg-gray-50 rounded-md flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
              {formData.sealFileInfo?.uuid ? (
                <img src={getFileUrl(formData.sealFileInfo.uuid)} alt="Seal" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-2xl text-gray-400 font-light">+</span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="absolute bottom-[-6px] right-[-6px] w-8 h-8 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_seal_edit)">
                      <path d="M4.125 5.1875H4.6875C4.98587 5.1875 5.27202 5.06897 5.483 4.858C5.69397 4.64702 5.8125 4.36087 5.8125 4.0625C5.8125 3.91332 5.87176 3.77024 5.97725 3.66475C6.08274 3.55926 6.22582 3.5 6.375 3.5H9.75C9.89918 3.5 10.0423 3.55926 10.1477 3.66475C10.2532 3.77024 10.3125 3.91332 10.3125 4.0625C10.3125 4.36087 10.431 4.64702 10.642 4.858C10.853 5.06897 11.1391 5.1875 11.4375 5.1875H12C12.2984 5.1875 12.5845 5.30603 12.7955 5.517C13.0065 5.72798 13.125 6.01413 13.125 6.3125V11.375C13.125 11.6734 13.0065 11.9595 12.7955 12.1705C12.5845 12.3815 12.2984 12.5 12 12.5H4.125C3.82663 12.5 3.54048 12.3815 3.3295 12.1705C3.11853 11.9595 3 11.6734 3 11.375V6.3125C3 6.01413 3.11853 5.72798 3.3295 5.517C3.54048 5.30603 3.82663 5.1875 4.125 5.1875Z" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.375 8.5625C6.375 9.01005 6.55279 9.43928 6.86926 9.75574C7.18572 10.0722 7.61495 10.25 8.0625 10.25C8.51005 10.25 8.93928 10.0722 9.25574 9.75574C9.57221 9.43928 9.75 9.01005 9.75 8.5625C9.75 8.11495 9.57221 7.68572 9.25574 7.36926C8.93928 7.05279 8.51005 6.875 8.0625 6.875C7.61495 6.875 7.18572 7.05279 6.86926 7.36926C6.55279 7.68572 6.375 8.11495 6.375 8.5625Z" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_seal_edit">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[1100]">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => document.getElementById("seal-image-upload")?.click()}
                >
                  이미지 변경
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleDeleteSealImage}
                >
                  이미지 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              id="seal-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSealImageUpload}
              onClick={(e) => (e.currentTarget.value = "")}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 bg-white"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          저장
        </button>
      </div>
    </div>
  );
}
