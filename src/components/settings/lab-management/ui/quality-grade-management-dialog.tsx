"use client";

import { useState, useEffect, useMemo } from "react";
import MyPopUp, { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import InputDate from "@/components/ui/input-date";
import { Plus } from "lucide-react";

import type {
  SpecimenQualityGrade,
  ExternalLab,
} from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";
import {
  useDeleteLab,
  useCreateLabGrade,
  useUpdateLabGrade,
} from "@/hooks/api/use-external-lab";
import { useToastHelpers } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  QUALITY_GRADES,
  formatQualityGrade,
  CERTIFICATION_STATUSES,
  formatCertified,
} from "./lab-constants";


// 날짜 포맷팅
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

// 날짜를 ISO 8601 형식으로 변환 (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss+09:00)
const formatDateToISO = (dateString: string): string => {
  if (!dateString) return "";
  return `${dateString}T00:00:00+09:00`;
};

// 드롭다운 값에서 등급 숫자 추출
const parseQualityGrade = (value: string): number | null => {
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
};

interface QualityGradeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: ExternalLab | null;
  onSave?: (data: {
    grades: Array<{
      id: string;
      applyDate: string;
      qualityGrade: number;
      isPathologyCertified: boolean;
      isNuclearMedicineCertified: boolean;
    }>;
  }) => void;
  onDelete?: () => void;
}

export const QualityGradeManagementDialog = ({
  open,
  onOpenChange,
  lab,
  onSave,
  onDelete,
}: QualityGradeManagementDialogProps) => {
  const [editedGrades, setEditedGrades] = useState<SpecimenQualityGrade[]>([]);
  const [initialGrades, setInitialGrades] = useState<SpecimenQualityGrade[]>(
    []
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const deleteLab = useDeleteLab();
  const createGrade = useCreateLabGrade();
  const updateGrade = useUpdateLabGrade();
  const queryClient = useQueryClient();
  const toastHelpers = useToastHelpers();

  // 현재 질가산등급 (가장 최신)
  const currentGrade = useMemo(() => {
    if (
      !lab ||
      !lab.specimenQualityGrades ||
      lab.specimenQualityGrades.length === 0
    )
      return null;
    const sorted = [...lab.specimenQualityGrades].sort(
      (a, b) =>
        new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime()
    );
    return sorted[0] || null;
  }, [lab]);

  // 기간별 질가산등급 (전체 내역, 최신순)
  const historicalGrades = useMemo(() => {
    if (
      !lab ||
      !lab.specimenQualityGrades ||
      lab.specimenQualityGrades.length === 0
    )
      return [];
    return [...lab.specimenQualityGrades].sort(
      (a, b) =>
        new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime()
    );
  }, [lab]);

  useEffect(() => {
    if (open && lab) {
      // 모달이 열릴 때 초기 데이터 설정
      const initial = [...historicalGrades];
      setInitialGrades(initial);
      setEditedGrades(initial);
    }
  }, [open, lab, historicalGrades]);

  // 신규 항목인지 확인 (임시 ID로 시작하는 항목)
  const isNewGrade = (grade: SpecimenQualityGrade): boolean => {
    return grade.id.startsWith("new-");
  };

  // 변경 감지: 초기 데이터와 현재 데이터 비교
  const hasChanges = useMemo(() => {
    if (initialGrades.length !== editedGrades.length) return true;

    // 신규 항목이 있는지 확인
    const hasNewItems = editedGrades.some((grade) => isNewGrade(grade));
    if (hasNewItems) return true;

    return initialGrades.some((initial, index) => {
      const edited = editedGrades[index];
      if (!edited) return true;

      // 신규 항목이면 변경된 것으로 간주
      if (isNewGrade(edited)) return true;

      return (
        initial.qualityGrade !== edited.qualityGrade ||
        initial.isPathologyCertified !== edited.isPathologyCertified ||
        initial.isNuclearMedicineCertified !==
        edited.isNuclearMedicineCertified ||
        initial.applyDate !== edited.applyDate
      );
    });
  }, [initialGrades, editedGrades]);

  // 적용일자 중복 체크
  const hasDuplicateApplyDate = useMemo(() => {
    const applyDates = editedGrades
      .map((grade) => formatDate(grade.applyDate))
      .filter((date) => date !== "");

    return applyDates.length !== new Set(applyDates).size;
  }, [editedGrades]);

  // 특정 적용일자가 중복되는지 확인
  const isDuplicateApplyDate = (gradeId: string): boolean => {
    const grade = editedGrades.find((g) => g.id === gradeId);
    if (!grade) return false;
    const currentDate = formatDate(grade.applyDate || "");
    if (!currentDate) return false;

    const duplicateCount = editedGrades.filter(
      (g) => formatDate(g.applyDate) === currentDate
    ).length;

    return duplicateCount > 1;
  };

  const handleQualityGradeChange = (gradeId: string, value: string) => {
    const grade = parseQualityGrade(value);
    if (grade === null) return;

    setEditedGrades((prev) => {
      return prev.map((item) => {
        if (item.id === gradeId) {
          return {
            ...item,
            qualityGrade: grade,
          };
        }
        return item;
      });
    });
  };

  const handlePathologyChange = (gradeId: string, value: string | number) => {
    // value를 숫자로 변환하여 1이면 true, 0이면 false
    const numValue = typeof value === "string" ? Number(value) : value;
    const boolValue = numValue === 1;
    const status = CERTIFICATION_STATUSES.find((s) => s.value === boolValue);
    if (status) {
      setEditedGrades((prev) => {
        return prev.map((item) => {
          if (item.id === gradeId) {
            return {
              ...item,
              isPathologyCertified: status.value,
            };
          }
          return item;
        });
      });
    }
  };

  const handleNuclearMedicineChange = (
    gradeId: string,
    value: string | number
  ) => {
    // value를 숫자로 변환하여 1이면 true, 0이면 false
    const numValue = typeof value === "string" ? Number(value) : value;
    const boolValue = numValue === 1;
    const status = CERTIFICATION_STATUSES.find((s) => s.value === boolValue);
    if (status) {
      setEditedGrades((prev) => {
        return prev.map((item) => {
          if (item.id === gradeId) {
            return {
              ...item,
              isNuclearMedicineCertified: status.value,
            };
          }
          return item;
        });
      });
    }
  };

  const handleApplyDateChange = (gradeId: string, value: string) => {
    setEditedGrades((prev) => {
      return prev.map((item) => {
        if (item.id === gradeId) {
          // ISO 형식으로 변환
          const isoDate = value ? formatDateToISO(value) : "";
          return {
            ...item,
            applyDate: isoDate,
          };
        }
        return item;
      });
    });
  };

  const handleAddGrade = () => {
    const newGrade: SpecimenQualityGrade = {
      id: `new-${Date.now()}`,
      applyDate: "",
      qualityGrade: 1,
      isPathologyCertified: false,
      isNuclearMedicineCertified: false,
    };
    setEditedGrades((prev) => [newGrade, ...prev]);
  };

  const handleSave = async () => {
    if (!lab || !hasChanges) return;

    // 적용일자 중복 체크
    if (hasDuplicateApplyDate) {
      toastHelpers.error(
        "저장 실패",
        "동일한 적용일자가 중복됩니다. 적용일자를 확인해주세요."
      );
      return;
    }

    // 신규 항목 필수 필드 검증
    const newGrades = editedGrades.filter((grade) => isNewGrade(grade));
    for (const grade of newGrades) {
      if (!grade.applyDate || !formatDate(grade.applyDate)) {
        toastHelpers.error("저장 실패", "신규 항목의 적용일자를 입력해주세요.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];

      // 신규 항목은 POST로 생성
      const newGrades = editedGrades.filter((grade) => isNewGrade(grade));
      for (const grade of newGrades) {
        promises.push(
          createGrade.mutateAsync({
            id: lab.id,
            data: {
              qualityGrade: grade.qualityGrade,
              isPathologyCertified: grade.isPathologyCertified,
              isNuclearMedicineCertified: grade.isNuclearMedicineCertified,
              applyDate: grade.applyDate,
            },
          })
        );
      }

      // 기존 항목 중 변경된 항목은 PATCH로 업데이트
      const existingGrades = editedGrades.filter((grade) => !isNewGrade(grade));
      for (const edited of existingGrades) {
        const initial = initialGrades.find((g) => g.id === edited.id);
        if (!initial) continue;

        // 변경된 항목인지 확인
        const isChanged =
          initial.qualityGrade !== edited.qualityGrade ||
          initial.isPathologyCertified !== edited.isPathologyCertified ||
          initial.isNuclearMedicineCertified !==
          edited.isNuclearMedicineCertified ||
          initial.applyDate !== edited.applyDate;

        if (!isChanged) continue;

        // 변경된 항목만 PATCH 요청
        promises.push(
          updateGrade.mutateAsync({
            id: lab.id,
            gradeId: edited.id,
            data: {
              qualityGrade: edited.qualityGrade,
              isPathologyCertified: edited.isPathologyCertified,
              isNuclearMedicineCertified: edited.isNuclearMedicineCertified,
            },
          })
        );
      }

      await Promise.all(promises);

      // 리스트 갱신을 위해 캐시 무효화
      await queryClient.invalidateQueries({
        queryKey: ["external-lab", "labs"],
      });

      toastHelpers.success("저장 완료", "질가산등급이 저장되었습니다.");

      if (onSave) {
        onSave({
          grades: editedGrades.map((grade) => ({
            id: grade.id,
            applyDate: grade.applyDate,
            qualityGrade: grade.qualityGrade,
            isPathologyCertified: grade.isPathologyCertified,
            isNuclearMedicineCertified: grade.isNuclearMedicineCertified,
          })),
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("저장 실패:", error);
      toastHelpers.error("저장 실패", "질가산등급 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // 변경사항 취소하고 원래 데이터로 복원
    if (lab) {
      setEditedGrades([...historicalGrades]);
    }
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lab) return;

    try {
      await deleteLab.mutateAsync(lab.id);
      toastHelpers.success("삭제 완료", "수탁기관이 삭제되었습니다.");
      if (onDelete) {
        onDelete();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("삭제 실패:", error);
      toastHelpers.error("삭제 실패", "수탁기관 삭제에 실패했습니다.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!lab) return null;

  return (
    <MyPopUp
      isOpen={open}
      onCloseAction={() => {
        if (!isSaving) onOpenChange(false);
      }}
      title="질가산등급 관리"
      fitContent={true}
    >
      <div className="flex flex-col w-[800px] h-[700px]">
        {/* Header - Lab Code */}
        <div className="px-[20px] pb-[10px] text-[13px] text-muted-foreground font-medium border-b border-border">
          {lab.code}
        </div>

        <div className="flex flex-1 flex-col gap-[20px] p-[20px] overflow-y-auto">
          {/* 현재 질가산등급 섹션 */}
          <div className="flex flex-col gap-[10px]">
            <h3 className="text-[14px] font-bold text-foreground">현재 질가산등급</h3>
            {currentGrade ? (
              <div className="bg-muted/50 rounded-[6px] p-[16px]">
                <div className="grid grid-cols-4 gap-[4px] text-[13px] text-muted-foreground">
                  <div>{formatDate(currentGrade.applyDate)}</div>
                  <div>{formatQualityGrade(currentGrade.qualityGrade)}</div>
                  <div>
                    {formatCertified(currentGrade.isPathologyCertified)}
                  </div>
                  <div>
                    {formatCertified(currentGrade.isNuclearMedicineCertified)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-[6px] p-[16px] text-[13px] text-muted-foreground text-center">
                등록된 질가산등급이 없습니다.
              </div>
            )}
          </div>

          {/* 기간별 질가산등급 섹션 */}
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-foreground">기간별 질가산등급</h3>
              <button
                onClick={handleAddGrade}
                className="flex items-center gap-[4px] px-[8px] py-[4px] border border-border rounded-[4px] bg-background text-[12px] text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="w-3 h-3" />
                추가
              </button>
            </div>

            {editedGrades.length > 0 ? (
              <div className="flex flex-col border border-border rounded-[6px] text-[13px]">
                {/* 헤더 */}
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_20px] gap-[12px] p-[12px] bg-muted/50 border-b border-border font-medium text-muted-foreground">
                  <div>적용일자</div>
                  <div>질가산등급</div>
                  <div>병리검사</div>
                  <div>핵의학적검사</div>
                  <div></div>
                </div>
                {/* 데이터 행들 */}
                <div className="max-h-[300px] overflow-y-auto">
                  {editedGrades.map((grade, index) => (
                    <div
                      key={grade.id}
                      className={`grid grid-cols-[1fr_1fr_1fr_1fr_20px] gap-[12px] p-[12px] items-center border-b border-border last:border-0 hover:bg-muted/10 transition-colors`}
                    >
                      {/* 적용일자 */}
                      {isNewGrade(grade) ? (
                        <div className="!h-[32px]">
                          <InputDate
                            value={formatDate(grade.applyDate)}
                            onChange={(value) =>
                              handleApplyDateChange(grade.id, value)
                            }
                            min={getTodayDate()}
                            className="w-full px-[8px] bg-background border border-border rounded-[4px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"

                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "px-[8px]",
                          isDuplicateApplyDate(grade.id) && "text-destructive font-medium"
                        )}>
                          {formatDate(grade.applyDate)}
                        </div>
                      )}

                      {/* 질가산등급 */}
                      <div className="relative h-[32px]">
                        <select
                          className="w-full h-full px-[8px] bg-background border border-border rounded-[4px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
                          value={String(grade.qualityGrade)}
                          onChange={(e) =>
                            handleQualityGradeChange(grade.id, e.target.value)
                          }
                        >
                          {QUALITY_GRADES.map((g) => (
                            <option key={g.value} value={String(g.value)} className="text-foreground">
                              {g.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>

                      {/* 병리검사 */}
                      <div className="relative h-[32px]">
                        <select
                          className="w-full h-full px-[8px] bg-background border border-border rounded-[4px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
                          value={grade.isPathologyCertified ? "true" : "false"}
                          onChange={(e) => {
                            const boolValue = e.target.value === "true";
                            handlePathologyChange(grade.id, boolValue ? 1 : 0);
                          }}
                        >
                          {CERTIFICATION_STATUSES.map((status) => (
                            <option key={String(status.value)} value={String(status.value)} className="text-foreground">
                              {formatCertified(status.value)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>

                      {/* 핵의학검사 */}
                      <div className="relative h-[32px]">
                        <select
                          className="w-full h-full px-[8px] bg-background border border-border rounded-[4px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
                          value={grade.isNuclearMedicineCertified ? "true" : "false"}
                          onChange={(e) => {
                            const boolValue = e.target.value === "true";
                            handleNuclearMedicineChange(grade.id, boolValue ? 1 : 0);
                          }}
                        >
                          {CERTIFICATION_STATUSES.map((status) => (
                            <option key={String(status.value)} value={String(status.value)} className="text-foreground">
                              {formatCertified(status.value)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>

                      <div></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-muted-foreground text-center py-[20px] bg-muted/50 rounded-[6px]">
                등록된 질가산등급 내역이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-[20px] pt-0">
          <button
            onClick={handleDeleteClick}
            className="h-[32px] px-[12px] border border-destructive rounded-[4px] bg-background text-[13px] text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            삭제
          </button>
          <div className="flex gap-[8px]">
            <button
              onClick={handleCancel}
              className="h-[32px] px-[12px] border border-border rounded-[4px] bg-background text-[13px] text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || hasDuplicateApplyDate}
              className="h-[32px] px-[12px] rounded-[4px] bg-primary text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <MyPopupYesNo
        isOpen={isDeleteModalOpen}
        onCloseAction={() => setIsDeleteModalOpen(false)}
        title="삭제 확인"
        message={`수탁기관 "${lab?.name || lab?.code}"을(를) 삭제하시겠습니까?`}
        confirmText="확인"
        cancelText="취소"
        onConfirmAction={handleDeleteConfirm}
      />
    </MyPopUp>
  );
};
