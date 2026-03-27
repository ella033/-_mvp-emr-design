"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "./switch";
import { Certificate, LoginSettings } from "../model/types";
import { useState } from "react";
import { CertsService } from "@/services/certs-service";
import { useToastHelpers } from "@/components/ui/toast";
import { SectionLayout } from "../../commons/section-layout";

interface RegisteredCertificatesProps {
  certificate: Certificate | null;
  loginSettings: LoginSettings;
  handlers: {
    onRenew: () => void;
    onDelete: () => void;
  };
}

export function RegisteredCertificates({
  certificate,
  loginSettings,
  handlers
}: RegisteredCertificatesProps) {
  const { success, error: toastError } = useToastHelpers();

  // Local state for Login Settings (Auto Login) 
  // User asked to exclude saving it for now, so we just toggle switch locally
  // or disable it? User said "Login settings save -> exclude". 
  // So we will just show the UI but maybe disabled or non-functional for API?
  // Let's implement local only or dummy.
  const [localAutoLogin, setLocalAutoLogin] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="flex flex-col">

      <SectionLayout
        className=""
        header={
          <>
            <div className="flex flex-col items-left">
              <h3 className="text-lg font-bold text-gray-900">등록된 인증서</h3>
              <div className="text-xs font-normal leading-[1.5] text-[#989BA2]">인증서 만료일 전 갱신이 필요합니다.</div>
            </div>
          </>
        }
        body={
          <>
            <div className="space-y-4">
              {certificate ? (
                <div className="self-stretch px-3 py-4 rounded-md outline outline-1 outline-offset-[-1px] outline-neutral-400 inline-flex flex-col justify-start items-start gap-[16px] w-full">
                  <div className="self-stretch inline-flex justify-between items-center">
                    <div className="w-20 self-stretch min-h-6 flex justify-start items-center gap-2">
                      <div className="justify-start text-neutral-900 text-base font-bold font-['Pretendard'] leading-[22.40px]">현재 인증서</div>
                    </div>
                    {certificate.status === 'active' ? (
                      <div className="flex justify-start items-center gap-0.5">
                        <div className="flex justify-start items-center gap-0.5">
                          <div className="px-1.5 py-[2.50px] bg-lime-100 rounded-[36px] flex justify-center items-center gap-0.5">
                            <div className="size-1.5 bg-green-600 rounded-full" />
                            <div className="justify-center text-green-600 text-xs font-medium font-['Pretendard'] leading-[15px]">정상</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start items-center gap-0.5">
                        <div className="flex justify-start items-center gap-0.5">
                          <div className="px-1.5 py-[2.50px] bg-red-100 rounded-[36px] flex justify-center items-center gap-0.5">
                            <div className="size-1.5 bg-red-600 rounded-full" />
                            <div className="justify-center text-red-600 text-xs font-medium font-['Pretendard'] leading-[15px]">만료</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="self-stretch grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)] items-center">
                    <div className="flex justify-start items-center gap-2 min-w-0">
                      <div className="justify-start text-zinc-500 text-[13px] font-normal font-['Pretendard'] leading-4 shrink-0">파일명</div>
                      <div className="justify-start text-neutral-900 text-[13px] font-bold font-['Pretendard'] leading-4 truncate pr-[5px]" title={certificate.alias || certificate.fileName}>{certificate.signMeta?.subject}</div>
                    </div>
                    <div className="flex justify-start items-center gap-2 min-w-0">
                      <div className="justify-start text-zinc-500 text-[13px] font-normal font-['Pretendard'] leading-4 shrink-0">등록일</div>
                      <div className="justify-start text-neutral-900 text-[13px] font-bold font-['Pretendard'] leading-4 truncate">{certificate.signMeta?.notBefore ? new Date(certificate.signMeta.notBefore).toISOString().split('T')[0] : '-'}</div>
                    </div>
                    <div className="flex justify-start items-center gap-2 min-w-0">
                      <div className="justify-start text-zinc-500 text-[13px] font-normal font-['Pretendard'] leading-4 shrink-0">만료일</div>
                      <div className={`justify-start text-[13px] font-bold font-['Pretendard'] leading-4 truncate ${certificate.status === 'active' ? 'text-neutral-900' : 'text-red-400'}`}>{certificate.signMeta?.notAfter ? new Date(certificate.signMeta.notAfter).toISOString().split('T')[0] : '-'}</div>
                    </div>
                    <div className="flex justify-start items-center gap-2 min-w-0">
                      <div className="justify-start text-zinc-500 text-[13px] font-normal font-['Pretendard'] leading-4 shrink-0">남은 기간</div>
                      <div className="justify-start text-neutral-900 text-[13px] font-bold font-['Pretendard'] leading-4 truncate">{certificate.daysToExpire}일</div>
                    </div>
                  </div>
                  <div className="self-stretch py-1.5 flex flex-col justify-start items-start gap-2.5">
                    <div className="self-stretch h-0 border border-zinc-300"></div>
                  </div>
                  <div className="self-stretch inline-flex justify-start items-center gap-3">
                    <div
                      onClick={() => window.open("https://www.kica.co.kr/kica/service/certify/formMain.sg", "_blank")}
                      className="cursor-pointer px-3 py-2 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-slate-900 flex justify-center items-center gap-1 hover:bg-slate-50"
                    >
                      <div className="flex justify-center items-center gap-1">
                        <div className="max-h-4 min-h-4 text-center justify-start text-slate-900 text-[13px] font-medium font-['Pretendard'] leading-4 line-clamp-1">인증서 갱신하기</div>
                      </div>
                    </div>
                    <div className="flex-1 inline-flex flex-col justify-start items-start gap-1.5">
                      <div className="self-stretch h-6 min-h-6 inline-flex justify-start items-center gap-2">
                        <div className="flex-1 justify-start text-zinc-400 text-xs font-normal font-['Noto_Sans_KR'] leading-[18px]">인증서 갱신 후 기존 인증서를 삭제하고 새 인증서로 등록해주세요.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
                  등록된 인증서가 없습니다.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={handlers.onDelete} disabled={!certificate} className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10">
                  인증서 삭제
                </Button>
              </div>
            </div>
          </>
        }
      ></SectionLayout>
      <div className="flex-1"></div>
    </div>
    // <div className="space-y-6">
    //   <Card>
    //     <CardHeader>
    //       <CardTitle>등록된 인증서</CardTitle>
    //       <CardDescription>인증서 만료일 전 갱신이 필요합니다.</CardDescription>
    //     </CardHeader>
    //     <CardContent className="space-y-4">
    //       {certificate ? (
    //         <div className="border rounded-lg p-5">
    //           <div className="flex justify-between items-start mb-4">
    //             <h3 className="font-bold text-lg">현재 인증서</h3>
    //             <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${certificate.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
    //               {certificate.status === 'active' ? '● 정상' : '● 만료'}
    //             </span>
    //           </div>

    //           <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center text-sm py-2">
    //             <div className="flex flex-col">
    //               <span className="text-muted-foreground text-xs mb-1">인증서 명</span>
    //               <span className="font-medium truncate" title={certificate.alias || certificate.fileName}>{certificate.alias || certificate.fileName} ({certificate.id})</span>
    //               <span className="text-xs text-muted-foreground truncate">{certificate.signMeta?.subject}</span>
    //             </div>
    //             <div className="flex flex-col">
    //               <span className="text-muted-foreground text-xs mb-1">유효기간 시작</span>
    //               <span>{certificate.signMeta?.notBefore}</span>
    //             </div>
    //             <div className="flex flex-col">
    //               <span className="text-muted-foreground text-xs mb-1">만료일</span>
    //               <span className="text-destructive font-medium">{certificate.signMeta?.notAfter}</span>
    //             </div>
    //             <div className="flex flex-col">
    //               <span className="text-muted-foreground text-xs mb-1">남은 기간</span>
    //               <span className="font-bold">{certificate.daysToExpire}일</span>
    //             </div>
    //           </div>

    //           <div className="mt-6 flex items-center gap-3 pt-6 border-t">
    //             <p className="text-xs text-muted-foreground">
    //               인증서 갱신이 필요한 경우, 기존 인증서를 삭제하고 새 인증서를 등록해주세요.
    //             </p>
    //           </div>
    //         </div>
    //       ) : (
    //         <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
    //           등록된 인증서가 없습니다.
    //         </div>
    //       )}

    //       <div className="flex justify-end pt-2">
    //         <Button variant="outline" size="sm" onClick={handlers.onDelete} disabled={!certificate} className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10">
    //           인증서 삭제
    //         </Button>
    //       </div>
    //     </CardContent>
    //   </Card>

    //   <Card className="opacity-80 relative">
    //     <CardHeader>
    //       <div className="flex justify-between">
    //         <CardTitle>인증서 로그인 설정</CardTitle>
    //         <span className="text-xs text-muted-foreground border px-2 py-1 rounded">준비 중</span>
    //       </div>
    //       <CardDescription>권한이 있는 사용자가 비밀번호 입력 없이 청구/DUR을 사용할 수 있습니다.</CardDescription>
    //     </CardHeader>
    //     <CardContent className="space-y-6 pointer-events-none select-none grayscale-[0.5]">
    //       <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/20">
    //         <span className="font-medium">자동 로그인</span>
    //         <Switch
    //           checked={localAutoLogin}
    //           onCheckedChange={setLocalAutoLogin}
    //         />
    //       </div>

    //       <div className="space-y-4">
    //         <div className="space-y-2">
    //           <label className="text-sm font-medium">인증서 비밀번호</label>
    //           <div className="relative">
    //             <Input
    //               type="password"
    //               placeholder="비밀번호 설정 (미지원)"
    //               value={localPassword}
    //               readOnly
    //             />
    //           </div>
    //         </div>
    //       </div>
    //     </CardContent>
    //   </Card>
    // </div>
  );
}
