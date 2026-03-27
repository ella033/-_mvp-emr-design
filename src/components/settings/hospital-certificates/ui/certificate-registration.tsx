"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, X } from "lucide-react";
import { useState, useCallback } from "react";
import { CertFiles } from "../model/types";
import { useToastHelpers } from "@/components/ui/toast";
import { SectionLayout } from "../../commons/section-layout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CertificateRegistrationProps {
  onRegister: (files: CertFiles, password: string) => void;
  isRegistering: boolean;
}

export function CertificateRegistration({ onRegister, isRegistering }: CertificateRegistrationProps) {
  const { error: toastError } = useToastHelpers();

  const [files, setFiles] = useState<CertFiles>({
    signCert: null,
    signKey: null,
    kmCert: null,
    kmKey: null,
  });

  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Helper to identify file type by name/extension
  const identifyFileSlot = (file: File): keyof CertFiles | null => {
    const name = file.name.toLowerCase();

    // Naming conventions (adjust if needed)
    // usually: signCert.der, signKey.key, kmCert.der, kmKey.key
    if (name.includes("signcert") && name.endsWith(".der")) return "signCert";
    if (name.includes("signpri") && name.endsWith(".key")) return "signKey"; // support legacy name check or just strict
    if (name.includes("signkey") && name.endsWith(".key")) return "signKey";
    if (name.includes("kmcert") && name.endsWith(".der")) return "kmCert";
    if (name.includes("kmpri") && name.endsWith(".key")) return "kmKey";
    if (name.includes("kmkey") && name.endsWith(".key")) return "kmKey";

    // Fallback simple extension check if name doesn't contain 'sign'/'km'
    // This is risky, so better to rely on Drag/Drop specific targets or strict naming
    // But user prompt implied strict file names: "signCert.der", "signPri.key"...
    return null;
  };

  const handleFiles = useCallback((incomingFiles: File[]) => {
    const newFiles = { ...files };
    let updated = false;

    incomingFiles.forEach(file => {
      const slot = identifyFileSlot(file);
      if (slot) {
        newFiles[slot] = file;
        updated = true;
      }
    });

    if (updated) {
      setFiles(newFiles);
    } else {
      // If minimal matching failed, maybe warn user?
      // Only warn if they dropped something that matched NOTHING
      const matched = incomingFiles.some(f => identifyFileSlot(f) !== null);
      if (!matched && incomingFiles.length > 0) {
        toastError("파일 인식 실패", "파일명이 올바르지 않습니다. (예: signCert.der, signKey.key)");
      }
    }
  }, [files, toastError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // Reset input
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = (key: keyof CertFiles) => {
    setFiles(prev => ({ ...prev, [key]: null }));
  };

  // Validation: signCert + signKey are MANDATORY
  const isReady = !!files.signCert && !!files.signKey && !!password;

  // Validation: KM should be pair if present (User said: if KM missing, 2 files ok. But if 1 KM file present?)
  // Usually we enforce pairs. If kmCert exists, kmKey must exist, and vice versa.
  const isKmValid = (!files.kmCert && !files.kmKey) || (!!files.kmCert && !!files.kmKey);

  const canSubmit = isReady && isKmValid && !isRegistering;

  const FileSlot = ({
    slotKey,
    label,
    required = false,
  }: {
    slotKey: keyof CertFiles,
    label: string,
    required?: boolean,
  }) => {
    const file = files[slotKey];
    const isFilled = !!file;

    let borderColorKey = "";
    let bgColorClass = "";
    let Icon = null;

    if (isFilled) {
      // Green
      borderColorKey = "#00BF40";
      bgColorClass = "bg-[#F2FBF5]";
      Icon = (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.599609 1.9885C0.599609 1.62014 0.745938 1.26687 1.00641 1.00641C1.26687 0.745938 1.62014 0.599609 1.9885 0.599609H11.7107C12.0791 0.599609 12.4323 0.745938 12.6928 1.00641C12.9533 1.26687 13.0996 1.62014 13.0996 1.9885V11.7107C13.0996 12.0791 12.9533 12.4323 12.6928 12.6928C12.4323 12.9533 12.0791 13.0996 11.7107 13.0996H1.9885C1.62014 13.0996 1.26687 12.9533 1.00641 12.6928C0.745938 12.4323 0.599609 12.0791 0.599609 11.7107V1.9885Z" stroke="#00BF40" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.7666 6.84983L6.15549 8.23872L8.93327 5.46094" stroke="#00BF40" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else if (required && showErrors) {
      // Red
      borderColorKey = "#FF4242";
      bgColorClass = "bg-white";
      Icon = (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.599609 1.9885C0.599609 1.62014 0.745938 1.26687 1.00641 1.00641C1.26687 0.745938 1.62014 0.599609 1.9885 0.599609H11.7107C12.0791 0.599609 12.4323 0.745938 12.6928 1.00641C12.9533 1.26687 13.0996 1.62014 13.0996 1.9885V11.7107C13.0996 12.0791 12.9533 12.4323 12.6928 12.6928C12.4323 12.9533 12.0791 13.0996 11.7107 13.0996H1.9885C1.62014 13.0996 1.26687 12.9533 1.00641 12.6928C0.745938 12.4323 0.599609 12.0791 0.599609 11.7107V1.9885Z" stroke="#FF4242" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.46094 5.46094L8.23872 8.23872M8.23872 5.46094L5.46094 8.23872" stroke="#FF4242" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else {
      // Default Grey
      borderColorKey = "#989BA2";
      bgColorClass = "bg-white";
      Icon = (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.599609 1.9885C0.599609 1.62014 0.745938 1.26687 1.00641 1.00641C1.26687 0.745938 1.62014 0.599609 1.9885 0.599609H11.7107C12.0791 0.599609 12.4323 0.745938 12.6928 1.00641C12.9533 1.26687 13.0996 1.62014 13.0996 1.9885V11.7107C13.0996 12.0791 12.9533 12.4323 12.6928 12.6928C12.4323 12.9533 12.0791 13.0996 11.7107 13.0996H1.9885C1.62014 13.0996 1.26687 12.9533 1.00641 12.6928C0.745938 12.4323 0.599609 12.0791 0.599609 11.7107V1.9885Z" stroke="#989BA2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    return (
      <div className={`self-stretch p-4 rounded-md outline outline-1 outline-offset-[-1px] inline-flex flex-col justify-start items-start gap-6 ${`outline-[${borderColorKey}]`} ${bgColorClass}`} style={{ outlineColor: borderColorKey }}>
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch inline-flex justify-start items-start">
            <div className="flex-1 inline-flex flex-col justify-start items-start">
              <div className="self-stretch inline-flex justify-start items-start">
                <div className="flex-1 self-stretch min-h-6 flex justify-start items-center gap-1">
                  <div className="size-5 relative flex items-center justify-center">
                    {Icon}
                  </div>
                  <div className="flex-1 justify-start text-neutral-900 text-base font-medium font-['Pretendard'] leading-[22.40px]">{label}</div>
                </div>
              </div>
              <div className="self-stretch flex flex-col justify-start items-start gap-1">
                <div className="self-stretch h-6 min-h-6 inline-flex justify-start items-center gap-2">
                  <div className="flex-1 justify-start text-zinc-400 text-sm font-normal font-['Pretendard'] leading-[17.50px] truncate" title={isFilled ? file.name : undefined}>
                    {isFilled ? file.name : (required ? "파일을 등록해주세요" : "선택 사항")}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start items-center gap-2">
              {isFilled ? (
                <>
                  <div className="flex justify-start items-center gap-0.5">
                    <div className="size-1.5 bg-green-600 rounded-full" />
                    <div className="justify-center text-green-600 text-xs font-medium font-['Pretendard'] leading-[15px]">등록됨</div>
                  </div>
                  <button onClick={() => clearFile(slotKey)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex justify-start items-center gap-0.5 opacity-0">
                  {/* Placeholder to keep height if needed, or just empty */}
                  <div className="size-1.5 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SectionLayout

      className="!gap-[24px]"
      header={
        <div className="flex items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">새 인증서 등록</h3>
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
                  <p>DUR, 청구 기능 사용을 위해서 병원 공동인증서를 등록하세요.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-[#989BA2] text-[12px] font-normal leading-[1.5]">
              DUR, 청구 기능 사용을 위해서 병원 공동인증서를 등록하세요.
            </div>
          </div>
          <div>
            <Button
              onClick={() => window.open("https://www.kica.co.kr/kica/service/certify/formMain.sg", "_blank")}
              className="flex items-center justify-center gap-1 px-3 py-2 h-auto rounded-[4px] border border-[#180F38] bg-white text-[#180F38] text-[13px] font-medium leading-[1.25] tracking-[-0.13px] overflow-hidden hover:bg-slate-50"
            >
              인증서 발급 받기
            </Button>
          </div>

        </div>

      }

      body={
        <>
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-2">
              <label className="text-[#171719] text-[13px] font-normal leading-[1.25] tracking-[-0.13px] mb-[12px]">
                인증서 파일 <span className="text-[#FF4242]">*</span>
              </label>
              <div
                className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept=".der,.key"
                />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="p-2 bg-muted rounded-full">
                    <Copy className="w-6 h-6" />
                  </div>
                  <p>파일들을 드래그하여 놓거나 클릭해서 선택하세요.</p>
                  <p className="text-xs">(signCert.der, signKey.key 등)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[#171719] text-[13px] font-normal leading-[1.25] tracking-[-0.13px] mb-[12px]">
                  필수 등록 파일 <span className="text-[#FF4242]">*</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileSlot slotKey="signCert" label="서명 인증서 (.der)" required />
                <FileSlot slotKey="signKey" label="서명 키 (.key)" required />

                {/* Optional - KM */}
                <FileSlot slotKey="kmCert" label="KM 인증서 (.der)" />
                <FileSlot slotKey="kmKey" label="KM 키 (.key)" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col mb-[16px]">
                <div className="text-[#171719] text-[16px] font-bold leading-[1.4] tracking-[-0.16px]">비밀번호</div>
                <div className="text-[#989BA2] font-['Noto_Sans_KR'] text-[12px] font-normal leading-[1.5]">
                  인증서 사용을 위한 비밀번호를 입력해주세요.
                </div>
              </div>
              <div className=" flex flex-col gap-[8px]">
                <label className="text-[#171719] text-[13px] font-normal leading-[1.25] tracking-[-0.13px]">
                  인증서 비밀번호 <span className="text-[#FF4242]">*</span>
                </label>
                <div className="relative w-[50%]">
                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="비밀번호를 입력해주세요."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-[8px] h-[32px] border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"

                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute  right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {isPasswordVisible ? (<div className="text-xs">숨기기</div>) : (<div className="text-xs">보기</div>)}
                  </button>
                </div>
              </div>
            </div>



          </div>

        </>
      }
      footer={
        <>
          <div className="pt-4 flex items-center justify-between">
            <p className="text-destructive text-sm flex items-center gap-1">
              {!isReady && (
                <>
                  <span className="border border-destructive rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">!</span>
                  필수 파일(서명용 2개)과 비밀번호를 입력하세요.
                </>
              )}
              {isReady && !isKmValid && (
                <>
                  <span className="border border-destructive rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">!</span>
                  KM 파일은 쌍으로(Cert+Key) 등록해야 합니다.
                </>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                className="bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  if (canSubmit) {
                    onRegister(files, password);
                  } else {
                    setShowErrors(true);
                  }
                }}
                disabled={isRegistering}
              >
                {isRegistering ? "등록 중..." : "등록"}
              </Button>
            </div>
          </div>
        </>
      }
    >

    </SectionLayout>
    // <Card className="flex w-full flex-col p-4 items-start flex-[1_0_0] self-stretch rounded-[6px] border border-[#DBDCDF] bg-white">
    //   <CardHeader>
    //     <div className="flex justify-between items-center">
    //       <div>
    //         <CardTitle>새 인증서 등록</CardTitle>
    //         <CardDescription className="mt-1">
    //           DUR, 청구 기능 사용을 위해서 병원 공동인증서를 등록하세요.
    //         </CardDescription>
    //       </div>
    //     </div>
    //   </CardHeader>
    //   <CardContent className="space-y-6 flex-1 flex flex-col">
    //     {/* File Upload Area */}
    //     <div className="space-y-2">
    //       <label className="text-sm font-medium text-destructive">인증서 파일 (최대 4개) *</label>
    //       <div
    //         className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
    //         onDrop={handleDrop}
    //         onDragOver={handleDragOver}
    //       >
    //         <input
    //           type="file"
    //           multiple
    //           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    //           onChange={handleFileChange}
    //           accept=".der,.key"
    //         />
    //         <div className="flex flex-col items-center gap-2 text-muted-foreground">
    //           <div className="p-2 bg-muted rounded-full">
    //             <Copy className="w-6 h-6" />
    //           </div>
    //           <p>파일들을 드래그하여 놓거나 클릭해서 선택하세요.</p>
    //           <p className="text-xs">(signCert.der, signKey.key 등)</p>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Files Grid */}
    //     <div className="space-y-2">
    //       <div className="flex justify-between">
    //         <label className="text-sm font-medium">등록 파일 확인</label>
    //       </div>
    //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //         {/* Essential - Sign */}
    //         <FileSlot slotKey="signCert" label="서명 인증서 (.der)" required />
    //         <FileSlot slotKey="signKey" label="서명 키 (.key)" required />

    //         {/* Optional - KM */}
    //         <FileSlot slotKey="kmCert" label="KM 인증서 (.der)" colorClass="border-orange-100 bg-orange-50/30" />
    //         <FileSlot slotKey="kmKey" label="KM 키 (.key)" colorClass="border-orange-100 bg-orange-50/30" />
    //       </div>
    //     </div>

    //     {/* Password */}
    //     <div className="space-y-4 pt-4 border-t mt-auto">
    //       <div className="space-y-2">
    //         <label className="text-sm font-medium text-destructive">인증서 비밀번호 *</label>
    //         <div className="relative">
    //           <Input
    //             type={isPasswordVisible ? "text" : "password"}
    //             placeholder="비밀번호를 입력해주세요."
    //             value={password}
    //             onChange={(e) => setPassword(e.target.value)}
    //           />
    //           <button
    //             type="button"
    //             onClick={() => setIsPasswordVisible(!isPasswordVisible)}
    //             className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    //           >
    //             {isPasswordVisible ? (<div className="text-xs">숨기기</div>) : (<div className="text-xs">보기</div>)}
    //           </button>
    //         </div>
    //       </div>
    //     </div>

    //     <div className="pt-4 flex items-center justify-between">
    //       <p className="text-destructive text-sm flex items-center gap-1">
    //         {!isReady && (
    //           <>
    //             <span className="border border-destructive rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">!</span>
    //             필수 파일(서명용 2개)과 비밀번호를 입력하세요.
    //           </>
    //         )}
    //         {isReady && !isKmValid && (
    //           <>
    //             <span className="border border-destructive rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">!</span>
    //             KM 파일은 쌍으로(Cert+Key) 등록해야 합니다.
    //           </>
    //         )}
    //       </p>
    //       <div className="flex gap-2">
    //         <Button
    //           className="bg-slate-900 text-white hover:bg-slate-800"
    //           onClick={() => onRegister(files, password)}
    //           disabled={!canSubmit}
    //         >
    //           {isRegistering ? "등록 중..." : "등록"}
    //         </Button>
    //       </div>
    //     </div>

    //   </CardContent>
    // </Card>
  );
}
