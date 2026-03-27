"use client";

import React, { useEffect, useState } from "react";
import { FileService } from "@/services/file-service";
// import { FileUploadResponse } from "@/types/file-types";
import type { Hospital } from "@/types/hospital-types";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFileUrl } from "@/lib/file-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface LogoSealProps {
  onImageUpload?: (
    type: "logo" | "hospitalSeal" | "directorSeal",
    fileInfo?: any
  ) => void;
  savedImages?: {
    logo?: string;
    hospitalSeal?: string;
    directorSeal?: string;
  };
  hospital?: Hospital;
}

export default function LogoSeal({
  onImageUpload,
  savedImages,
  hospital,
}: LogoSealProps) {
  const [isSelecting, setIsSelecting] = useState<
    "logo" | "hospitalSeal" | "directorSeal" | null
  >(null);
  const [selectedImages, setSelectedImages] = useState<{
    logo?: string;
    hospitalSeal?: string;
    directorSeal?: string;
  }>(savedImages || {});

  // savedImages가 변경될 때 selectedImages 업데이트
  useEffect(() => {
    if (savedImages) {
      setSelectedImages((prev) => ({
        ...prev,
        ...savedImages,
      }));
    }
  }, [savedImages]);

  // hospital 정보가 변경될 때 이미지 URL 가져오기
  useEffect(() => {
    const newImages = {
      logo: getFileUrl(hospital?.logoFileinfo?.uuid),
      hospitalSeal: getFileUrl(hospital?.sealFileinfo?.uuid),
      directorSeal: getFileUrl(hospital?.directorSealFileinfo?.uuid),
    };

    setSelectedImages((prev) => ({
      ...prev,
      ...newImages,
    }));

  }, [hospital?.logoFileinfo?.uuid, hospital?.sealFileinfo?.uuid, hospital?.directorSealFileinfo?.uuid]);

  /* const [uploadedFiles, setUploadedFiles] = useState<{
    logo?: string;
    hospitalSeal?: string;
    directorSeal?: string;
  }>({}); */
  const [, setUploadedFiles] = useState<{
    logo?: string;
    hospitalSeal?: string;
    directorSeal?: string;
  }>({});

  const handleDeleteImage = async (type: "logo" | "hospitalSeal" | "directorSeal") => {
    // 삭제 로직은 V1 유지 (id 기반 삭제)
    if (!hospital) {
      console.error("병원 정보가 없습니다.");
      return;
    }

    try {
      // 파일명 가져오기
      let uuid: string | undefined;
      if (type === "logo" && hospital.logoFileinfo?.uuid) {
        uuid = hospital.logoFileinfo.uuid;
      } else if (type === "hospitalSeal" && hospital.sealFileinfo?.uuid) {
        uuid = hospital.sealFileinfo.uuid;
      } else if (type === "directorSeal" && hospital.directorSealFileinfo?.uuid) {
        uuid = hospital.directorSealFileinfo.uuid;
      }

      if (uuid) {
        // FileService를 사용하여 서버에서 파일 삭제
        await FileService.deleteFileV2(uuid);

        // 삭제 성공 시 (에러가 발생하지 않음) 병원 정보 업데이트
        onImageUpload?.(type, null);
      }

      // UI에서 이미지 제거
      setSelectedImages((prev) => ({
        ...prev,
        [type]: undefined,
      }));
      setUploadedFiles((prev) => ({
        ...prev,
        [type]: undefined,
      }));
    } catch (error) {
      console.error(`${type} 파일 삭제 실패:`, error);
    }
  };

  const handleImageUpload = async (type: "logo" | "hospitalSeal" | "directorSeal") => {
    setIsSelecting(type);

    // 파일 선택 창 열기
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // 선택한 이미지를 미리보기로 표시
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setSelectedImages((prev) => ({
              ...prev,
              [type]: result,
            }));
          };
          reader.readAsDataURL(file);
          const uploadResponse = await FileService.uploadFileV2({
            file,
            makeTransparent: true
          });

          if (uploadResponse && uploadResponse.uuid) {
            const fileInfo = {
              id: uploadResponse.id,
              uuid: uploadResponse.uuid,
              filename: uploadResponse.originalName, // 또는 uploadResponse.uuid (확인 필요)
              mimetype: uploadResponse.mimeType,
              size: parseInt(uploadResponse.fileSize),
            };

            setUploadedFiles((prev) => ({
              ...prev,
              [type]: fileInfo.filename,
            }));

            // 부모 컴포넌트에 업로드 완료 알림
            onImageUpload?.(type, fileInfo);

            console.log(`${type} 파일 업로드 성공 (V2):`, uploadResponse);
          } else {
            console.error(`${type} 파일 업로드 실패`);
            // 업로드 실패 시 미리보기도 제거
            setSelectedImages((prev) => ({
              ...prev,
              [type]: undefined,
            }));
          }
        } catch (error) {
          console.error(`${type} 파일 업로드 중 오류:`, error);
          // 오류 발생 시 미리보기 제거
          setSelectedImages((prev) => ({
            ...prev,
            [type]: undefined,
          }));
        }
      }
      setIsSelecting(null);
    };
    input.oncancel = () => {
      setIsSelecting(null);
    };
    input.click();
  };

  const renderUploadBox = (type: "logo" | "hospitalSeal" | "directorSeal", label: string) => {
    const isSelected = isSelecting === type;
    const hasImage = Boolean(selectedImages[type]);
    const imageSrc = selectedImages[type];

    return (
      <div className="flex flex-col items-left">
        {/* Label */}
        <span className="mb-2 font-pretendard text-[13px] font-bold leading-[125%] tracking-[-0.13px] text-[#333]">{label}</span>

        {/* Wrapper for positioning context */}
        <div className="relative w-[120px] h-[120px]">
          {/* Box */}
          <div
            className={`w-full h-full p-3 flex flex-col items-center justify-center rounded-[6px] bg-gray-50 overflow-hidden group cursor-pointer border relative ${hasImage ? "border-solid" : "border-dashed"
              } ${isSelected ? "border-[#333]" : "border-[#DBDCDF] hover:bg-gray-100"}`}
            onClick={() => handleImageUpload(type)}
          >
            {hasImage ? (
              <img
                src={imageSrc}
                alt={label}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="text-3xl text-gray-300 font-light">+</span>
            )}

            {/* Clear Button (Top Right, visible on hover if image exists) */}
            {hasImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(type);
                }}
                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Camera Icon Button (Positioned bottom right independent of box overflow) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="absolute bottom-[-6px] right-[-6px] w-8 h-8 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.125 5.1875H4.6875C4.98587 5.1875 5.27202 5.06897 5.483 4.858C5.69397 4.64702 5.8125 4.36087 5.8125 4.0625C5.8125 3.91332 5.87176 3.77024 5.97725 3.66475C6.08274 3.55926 6.22582 3.5 6.375 3.5H9.75C9.89918 3.5 10.0423 3.55926 10.1477 3.66475C10.2532 3.77024 10.3125 3.91332 10.3125 4.0625C10.3125 4.36087 10.431 4.64702 10.642 4.858C10.853 5.06897 11.1391 5.1875 11.4375 5.1875H12C12.2984 5.1875 12.5845 5.30603 12.7955 5.517C13.0065 5.72798 13.125 6.01413 13.125 6.3125V11.375C13.125 11.6734 13.0065 11.9595 12.7955 12.1705C12.5845 12.3815 12.2984 12.5 12 12.5H4.125C3.82663 12.5 3.54048 12.3815 3.3295 12.1705C3.11853 11.9595 3 11.6734 3 11.375V6.3125C3 6.01413 3.11853 5.72798 3.3295 5.517C3.54048 5.30603 3.82663 5.1875 4.125 5.1875Z" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.375 8.5625C6.375 9.01005 6.55279 9.43928 6.86926 9.75574C7.18572 10.0722 7.61495 10.25 8.0625 10.25C8.51005 10.25 8.93928 10.0722 9.25574 9.75574C9.57221 9.43928 9.75 9.01005 9.75 8.5625C9.75 8.11495 9.57221 7.68572 9.25574 7.36926C8.93928 7.05279 8.51005 6.875 8.0625 6.875C7.61495 6.875 7.18572 7.05279 6.86926 7.36926C6.55279 7.68572 6.375 8.11495 6.375 8.5625Z" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[150]">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleImageUpload(type)}
              >
                이미지 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => handleDeleteImage(type)}
              >
                이미지 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    );
  };

  return (
    <SectionLayout
      header={
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">로고 및 직인</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_5680_30500)">
                    <path d="M2 8C2 8.78793 2.15519 9.56815 2.45672 10.2961C2.75825 11.0241 3.20021 11.6855 3.75736 12.2426C4.31451 12.7998 4.97595 13.2417 5.7039 13.5433C6.43185 13.8448 7.21207 14 8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 6.4087 13.3679 4.88258 12.2426 3.75736C11.1174 2.63214 9.5913 2 8 2C6.4087 2 4.88258 2.63214 3.75736 3.75736C2.63214 4.88258 2 6.4087 2 8Z" stroke="#46474C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8 5.33301V7.99967" stroke="#46474C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8 10.667H8.00556" stroke="#46474C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                  <defs>
                    <clipPath id="clip0_5680_30500">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white border-slate-800 max-w-xs" side="top">
              <p>jpg, png 형식의 5 MB 이하 이미지를 업로드할 수 있습니다.</p>
              <p className="mt-1 text-slate-300">로고 권장 해상도는 가로 600px 이상, 직인 권장 해상도는 400x400px 입니다.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      }
      body={
        <>
          {/* Images Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[20px]">
            {renderUploadBox("logo", "로고")}
            {renderUploadBox("hospitalSeal", "병원 직인")}
            {renderUploadBox("directorSeal", "병원장 직인")}
          </div>
        </>
      }
    />
  );
}
