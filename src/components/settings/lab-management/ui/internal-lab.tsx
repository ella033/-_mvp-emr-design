"use client";

import { useState, useMemo } from "react";
import { MyButton } from "@/components/yjg/my-button";
import { Plus, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EditQualityGradeDialog } from "./edit-quality-grade-dialog";
import { cn } from "@/lib/utils";
import { formatCertified, CERTIFICATION_STATUSES, type CertificationStatus, formatQualityGrade } from "./lab-constants";
import { useInternalLab } from "../hooks/use-internal-lab";
import { useToastHelpers } from "@/components/ui/toast";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SpecimenQualityGrade } from "../model";
import { SectionLayout } from "../../commons/section-layout";

// 날짜 포맷팅 (ISO 문자열을 YYYY-MM-DD로 변환)
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

// 날짜를 ISO 형식으로 변환 (YYYY-MM-DD -> ISO 8601)
const formatDateToISO = (dateString: string): string => {
  if (!dateString) return "";
  // 이미 ISO 형식이면 그대로 반환
  if (dateString.includes("T")) return dateString;
  // YYYY-MM-DD 형식이면 ISO로 변환
  return `${dateString}T00:00:00Z`;
};

export const InternalLab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGradeIndex, setSelectedGradeIndex] = useState<number | null>(null);

  const { grades, currentGrade: serverCurrentGrade, isLoading, isEnabled, updateGrades } = useInternalLab();
  const toastHelpers = useToastHelpers();

  // 기간별 질가산등급 (전체 내역, 최신순)
  const historicalGrades = useMemo(() => {
    if (!grades || grades.length === 0) return [];
    return [...grades].sort(
      (a, b) => new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime()
    );
  }, [grades]);

  const selectedGrade = useMemo(() => {
    if (!grades || selectedGradeIndex === null) return null;
    return historicalGrades[selectedGradeIndex] || null;
  }, [grades, selectedGradeIndex, historicalGrades]);

  const handleAddGrade = () => {
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedGradeIndex === null || !grades) return;

    try {
      // 선택된 항목을 제외한 새 배열 생성
      const updatedGrades = historicalGrades.filter((_, index) => index !== selectedGradeIndex);

      // 배열이 비어있으면 null을 보내서 삭제, 아니면 업데이트된 배열 전송
      const payload = updatedGrades.length === 0
        ? null
        : {
          specimenQualityGrades: updatedGrades.map(grade => ({
            applyDate: grade.applyDate,
            qualityGrade: grade.qualityGrade,
            isPathologyCertified: grade.isPathologyCertified,
            isNuclearMedicineCertified: grade.isNuclearMedicineCertified,
          }))
        };

      await updateGrades.mutateAsync(payload);
      toastHelpers.success("삭제 완료", "질가산등급이 삭제되었습니다.");
      setSelectedGradeIndex(null);
    } catch (error) {
      console.error("삭제 실패:", error);
      toastHelpers.error("삭제 실패", "질가산등급 삭제에 실패했습니다.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleSaveGrade = async (data: {
    applyDate: string;
    qualityGrade: number;
    pathologyCertified: CertificationStatus | null;
    nuclearMedicineCertified: CertificationStatus | null;
  }) => {
    try {
      // 적용일자를 ISO 형식으로 변환
      const isoDate = formatDateToISO(data.applyDate);

      if (selectedGradeIndex !== null && grades) {
        // 수정 모드 - 선택된 항목을 업데이트
        const updatedGrades = historicalGrades.map((grade, index) => {
          if (index === selectedGradeIndex) {
            return {
              ...grade,
              applyDate: isoDate,
              qualityGrade: data.qualityGrade,
              isPathologyCertified: data.pathologyCertified?.value ?? false,
              isNuclearMedicineCertified: data.nuclearMedicineCertified?.value ?? false,
            };
          }
          return grade;
        });

        const payload = {
          specimenQualityGrades: updatedGrades.map(grade => ({
            applyDate: grade.applyDate,
            qualityGrade: grade.qualityGrade,
            isPathologyCertified: grade.isPathologyCertified,
            isNuclearMedicineCertified: grade.isNuclearMedicineCertified,
          }))
        };

        await updateGrades.mutateAsync(payload);
        toastHelpers.success("수정 완료", "질가산등급이 수정되었습니다.");
        setIsEditDialogOpen(false);
      } else {
        // 추가 모드 - 새 항목 추가
        const newGrade: SpecimenQualityGrade = {
          applyDate: isoDate,
          qualityGrade: data.qualityGrade,
          isPathologyCertified: data.pathologyCertified?.value ?? false,
          isNuclearMedicineCertified: data.nuclearMedicineCertified?.value ?? false,
        };

        const updatedGrades = [...historicalGrades, newGrade];
        const payload = {
          specimenQualityGrades: updatedGrades.map(grade => ({
            applyDate: grade.applyDate,
            qualityGrade: grade.qualityGrade,
            isPathologyCertified: grade.isPathologyCertified,
            isNuclearMedicineCertified: grade.isNuclearMedicineCertified,
          }))
        };

        await updateGrades.mutateAsync(payload);
        toastHelpers.success("등록 완료", "질가산등급이 등록되었습니다.");
        setIsDialogOpen(false);
      }
      setSelectedGradeIndex(null);
    } catch (error) {
      console.error("저장 실패:", error);
      toastHelpers.error("저장 실패", selectedGradeIndex !== null ? "질가산등급 수정에 실패했습니다." : "질가산등급 등록에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">원내 질가산등급 관리</h2>
          <MyButton onClick={handleAddGrade} className="h-[32px]" leftIcon={<Plus className="w-4 h-4" />}>
            등급 추가
          </MyButton>
        </div>
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <SectionLayout
        className="!h-auto !gap-[24px]"
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-[#171719] text-[16px] font-[700] tracking-[-0.16px]">원내 질가산등급 관리</h2>
            <MyButton onClick={handleAddGrade} className="h-[32px]" leftIcon={<Plus className="w-4 h-4" />}>
              등급 추가
            </MyButton>
          </div>
        }
        body={
          <>
            <div className="flex flex-col gap-[24px]">

              <SectionLayout
                className="!h-auto gap-[16px]"
                header={
                  <>
                    <div className="flex gap-[8px] items-center">
                      <div className="text-[#171719] text-[16px] font-[700] tracking-[-0.16px]">질가산등급</div>
                      <div className="flex px-[5px] justify-center items-center gap-[2px] rounded-[4px] bg-[#EAF2FE] text-[12px] font-[500] text-[#06F]">
                        현재
                      </div>
                    </div>
                  </>
                }
                body={
                  <>
                    {serverCurrentGrade ? (
                      <div className="flex flex-wrap gap-[16px]">
                        <div className="flex-1 min-w-[180px] flex gap-[4px] whitespace-nowrap">
                          <div className="text-[#171719] text-[13px] font-[400] leading-[1.25] tracking-[-0.13px]">적용일자</div>
                          <div className="text-[#171719] text-[13px] font-[700] leading-[1.25] tracking-[-0.13px]">{formatDate(serverCurrentGrade.applyDate)}</div>
                        </div>
                        <div className="flex-1 min-w-[180px] flex gap-[4px] whitespace-nowrap">
                          <div className="text-[#171719] text-[13px] font-[400] leading-[1.25] tracking-[-0.13px]">질가산등급</div>
                          <div className="text-[#171719] text-[13px] font-[700] leading-[1.25] tracking-[-0.13px]">{formatQualityGrade(serverCurrentGrade.qualityGrade)}</div>
                        </div>
                        <div className="flex-1 min-w-[180px] flex gap-[4px] whitespace-nowrap">
                          <div className="text-[#171719] text-[13px] font-[400] leading-[1.25] tracking-[-0.13px]">병리검사</div>
                          <div className="text-[#171719] text-[13px] font-[700] leading-[1.25] tracking-[-0.13px]">
                            {formatCertified(serverCurrentGrade.isPathologyCertified, serverCurrentGrade.pathologyAddOnRate)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-[180px] flex gap-[4px] whitespace-nowrap">
                          <div className="text-[#171719] text-[13px] font-[400] leading-[1.25] tracking-[-0.13px]">핵의학적검사</div>
                          <div className="text-[#171719] text-[13px] font-[700] leading-[1.25] tracking-[-0.13px]">
                            {formatCertified(serverCurrentGrade.isNuclearMedicineCertified, serverCurrentGrade.nuclearMedicineAddOnRate)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#171719] text-[13px] font-normal leading-[1.25] tracking-[-0.13px]">현재 등급이 없습니다.</div>
                    )}
                  </>
                }
              />
              <SectionLayout
                className="!border-none !p-0 !gap-[13px]"
                header={
                  <>
                    <div className="flex gap-[8px] items-center">
                      <div className="text-[#171719] text-[16px] font-[700] tracking-[-0.16px]">기간별 질가산등급</div>
                    </div>
                  </>
                }
                body={
                  <>
                    {historicalGrades.length > 0 ? (
                      <div className="self-stretch rounded-tl-md rounded-tr-md inline-flex flex-col justify-start items-start overflow-hidden">
                        <div className="self-stretch flex flex-col justify-start items-start">
                          {/* 헤더 */}
                          <div className="self-stretch h-[28px] inline-flex justify-start items-center bg-[#F4F4F5]">
                            <div className="flex-1 self-stretch  flex justify-center items-center gap-1">
                              <div className="text-center justify-center text-zinc-800 text-[12px] font-[500] leading-[12px]">진료일자</div>
                            </div>
                            <div className="flex-1 self-stretch flex justify-center items-center gap-1">
                              <div className="text-center justify-center text-black text-[12px] font-[500] leading-[12px]">질가산등급</div>
                            </div>
                            <div className="flex-1 self-stretch flex justify-center items-center gap-1">
                              <div className="text-center justify-center text-zinc-800 text-[12px] font-[500] leading-[12px]">병리검사</div>
                            </div>
                            <div className="flex-1 self-stretch flex justify-center items-center gap-1">
                              <div className="text-center justify-center text-zinc-800 text-[12px] font-[500] leading-[12px]">핵의학적검사</div>
                            </div>
                            <div className="w-8 self-stretch inline-flex flex-col justify-center items-center gap-1.5">
                              <div className="self-stretch h-[15px] px-2 inline-flex justify-center items-center gap-1.5" />
                            </div>
                          </div>

                          {/* 데이터 행 */}
                          {historicalGrades.map((grade, index) => (
                            <div
                              key={`${grade.applyDate}-${index}`}
                              className={cn(
                                "self-stretch h-[28px] inline-flex justify-start items-center overflow-hidden bg-white hover:bg-[#F4F4F5] transition-colors"
                              )}
                            >
                              <div className="flex-1 self-stretch   inline-flex flex-col justify-center items-center">
                                <div className="self-stretch px-2 py-1.5 inline-flex justify-center items-center gap-1.5">
                                  <div className="flex justify-start items-center gap-1.5">
                                    {serverCurrentGrade?.applyDate === grade.applyDate && (
                                      <div className="px-[5px] py-0.5 bg-indigo-50 rounded-sm flex justify-center items-center gap-0.5">
                                        <div className="text-center text-blue-600 text-[11px] font-medium font-['Pretendard'] leading-[15px]">현재</div>
                                      </div>
                                    )}
                                    <div className="text-center text-[#46474C] text-[13px] font-normal  leading-4 line-clamp-1">{formatDate(grade.applyDate)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 self-stretch  inline-flex flex-col justify-center items-center">
                                <div className="self-stretch px-2 py-1.5 inline-flex justify-center items-center gap-1.5">
                                  <div className="text-center text-[#46474C] text-[13px] font-normal leading-4 line-clamp-1">{formatQualityGrade(grade.qualityGrade)}</div>
                                </div>
                              </div>
                              <div className="flex-1 self-stretch    inline-flex flex-col justify-center items-center">
                                <div className="self-stretch px-2 py-1.5 inline-flex justify-center items-center gap-1.5">
                                  <div className="text-center text-[#46474C] text-[13px] font-normal leading-4 line-clamp-1">
                                    {formatCertified(grade.isPathologyCertified, grade.pathologyAddOnRate)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 self-stretch    inline-flex flex-col justify-center items-center">
                                <div className="self-stretch px-2 py-1.5 inline-flex justify-center items-center gap-1.5">
                                  <div className="text-center text-[#46474C] text-[13px] font-normal leading-4 line-clamp-1">
                                    {formatCertified(grade.isNuclearMedicineCertified, grade.nuclearMedicineAddOnRate)}
                                  </div>
                                </div>
                              </div>
                              <div className="w-8 self-stretch bg-white inline-flex flex-col justify-center items-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-full h-full flex justify-center items-center">
                                      <MoreVertical className="size-4 text-[#46474C]" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedGradeIndex(index);
                                      setIsEditDialogOpen(true);
                                    }}>
                                      수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedGradeIndex(index);
                                        setIsDeleteModalOpen(true);
                                      }}
                                    >
                                      삭제
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">
                          등록된 질가산등급 내역이 없습니다.
                        </div>
                      </Card>
                    )}
                  </>
                }
              ></SectionLayout>

            </div>
          </>
        }
      >

      </SectionLayout>


      {/* 등급 추가 다이얼로그 */}
      <EditQualityGradeDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedGradeIndex(null);
          }
        }}
        onSave={handleSaveGrade}
      />

      {/* 등급 수정 다이얼로그 */}
      <EditQualityGradeDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedGradeIndex(null);
          }
        }}
        initialData={
          selectedGrade
            ? {
              applyDate: formatDate(selectedGrade.applyDate),
              qualityGrade: selectedGrade.qualityGrade,
              pathologyCertified: CERTIFICATION_STATUSES.find(s => s.value === selectedGrade.isPathologyCertified) || null,
              nuclearMedicineCertified: CERTIFICATION_STATUSES.find(s => s.value === selectedGrade.isNuclearMedicineCertified) || null,
            }
            : undefined
        }
        onSave={handleSaveGrade}
      />

      {/* 컨텍스트 메뉴 제거됨 */}

      {/* 삭제 확인 모달 */}
      <MyPopupYesNo
        isOpen={isDeleteModalOpen}
        onCloseAction={() => setIsDeleteModalOpen(false)}
        title="삭제 확인"
        message="질가산등급을 삭제하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        onConfirmAction={handleDeleteConfirm}
      />
    </>
  );
};
