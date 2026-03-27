"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToastHelpers } from "@/components/ui/toast";
import { MyButton } from "@/components/yjg/my-button";
import { MyContextMenu } from "@/components/yjg/my-context-menu";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { MySwitch } from "@/components/yjg/my-switch";
import { useCreateLab, useCreateLabGrade, useDeleteLab, useDeleteLabGrade, useExternalLabs, useUpdateLabGrade, useUpdateLabMapping } from "@/hooks/api/use-external-lab";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, MoreVertical, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SpecimenQualityGrade } from "../model";
import { AddExternalLabDialog } from "./add-external-lab-dialog";
import { EditExternalLabDialog } from "./edit-external-lab-dialog";
import { EditQualityGradeDialog } from "./edit-quality-grade-dialog";
import { CERTIFICATION_STATUSES, formatCertified, formatQualityGrade, type CertificationStatus } from "./lab-constants";
import { QualityGradeManagementDialog } from "./quality-grade-management-dialog";
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

// 가장 최근 질가산등급 정보 가져오기
const getLatestQualityGrade = (
  grades: SpecimenQualityGrade[]
): SpecimenQualityGrade | null => {
  if (!grades || grades.length === 0) return null;
  // applyDate 기준으로 내림차순 정렬 (최신순)
  const sorted = [...grades].sort(
    (a, b) => new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime()
  );
  return sorted[0] || null;
};

// 고유 키 생성
const getUniqueKey = (lab: { id: string; isSystemProvided: boolean }): string => {
  return `${lab.isSystemProvided ? "system" : "hospital"}-${lab.id}`;
};

export const ExternalLab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditLabInfoDialogOpen, setIsEditLabInfoDialogOpen] = useState(false);
  const [isQualityGradeManagementOpen, setIsQualityGradeManagementOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLabUniqueKey, setSelectedLabUniqueKey] = useState<string | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [highlightedGradeIds, setHighlightedGradeIds] = useState<Set<string>>(new Set());
  const [isDeleteGradeModalOpen, setIsDeleteGradeModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    labUniqueKey: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    labUniqueKey: null,
  });

  const { data: labs, isLoading } = useExternalLabs();
  const updateLabMapping = useUpdateLabMapping();
  const createLab = useCreateLab();
  const createLabGrade = useCreateLabGrade();
  const deleteLab = useDeleteLab();
  const deleteLabGrade = useDeleteLabGrade();
  const updateLabGrade = useUpdateLabGrade();
  const toastHelpers = useToastHelpers();
  const previousLabsRef = useRef<string[]>([]);

  const selectedLab = useMemo(() => {
    if (!labs || !selectedLabUniqueKey) return null;
    return labs.find((lab) => getUniqueKey(lab) === selectedLabUniqueKey);
  }, [labs, selectedLabUniqueKey]);

  const latestQualityGrade = useMemo(() => {
    if (!selectedLab) return null;
    return selectedLab.currentGrade || getLatestQualityGrade(selectedLab.specimenQualityGrades);
  }, [selectedLab]);

  // 데이터 분류 (연동 / 직접 등록)
  const linkedLabs = useMemo(() => labs?.filter(lab => lab.isSystemProvided) || [], [labs]);
  const unlinkedLabs = useMemo(() => labs?.filter(lab => !lab.isSystemProvided) || [], [labs]);

  // 하이라이트 트리거
  const triggerHighlight = (id: string) => {
    setHighlightedIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  useEffect(() => {
    if (!labs || labs.length === 0) {
      previousLabsRef.current = [];
      return;
    }
    const currentKeys = labs.map((lab) => getUniqueKey(lab));
    const previousKeys = previousLabsRef.current;
    if (previousKeys.length === 0) {
      previousLabsRef.current = currentKeys;
      return;
    }
    const newKeys = currentKeys.filter((key) => !previousKeys.includes(key));
    if (newKeys.length > 0) {
      newKeys.forEach((key) => triggerHighlight(key));
    }
    previousLabsRef.current = currentKeys;
  }, [labs]);

  const handleToggleActive = (lab: { id: string; isSystemProvided: boolean; isEnabled: boolean }) => {
    const payload = { externalLabId: lab.id, isEnabled: !lab.isEnabled };
    const uniqueKey = getUniqueKey(lab);
    updateLabMapping.mutate(payload, { onSuccess: () => triggerHighlight(uniqueKey) });
  };


  const handleToggleHistory = (labId: string, currentGradeId?: string | null) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(labId)) {
        next.delete(labId);
      } else {
        next.add(labId);
        if (currentGradeId) {
          setHighlightedGradeIds((prev) => new Set(prev).add(currentGradeId));
          setTimeout(() => {
            setHighlightedGradeIds((prev) => {
              const next = new Set(prev);
              next.delete(currentGradeId);
              return next;
            });
          }, 2000);
        }
      }
      return next;
    });
  };

  const getSortedQualityGrades = (grades: SpecimenQualityGrade[]) => {
    if (!grades || grades.length === 0) return [];
    return [...grades].sort((a, b) => new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime());
  };

  const handleContextMenu = (e: React.MouseEvent, labUniqueKey: string, isSystemProvided: boolean) => {
    e.preventDefault();
    if (isSystemProvided) return;
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, labUniqueKey });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, labUniqueKey: null });

  const handleEditLabInfo = () => {
    const selected = labs?.find((l) => getUniqueKey(l) === contextMenu.labUniqueKey);
    if (selected) {
      setSelectedLabUniqueKey(getUniqueKey(selected));
      setIsEditLabInfoDialogOpen(true);
    }
    closeContextMenu();
  };

  const handleManageQualityGrade = () => {
    const selected = labs?.find((l) => getUniqueKey(l) === contextMenu.labUniqueKey);
    if (selected) {
      setSelectedLabUniqueKey(getUniqueKey(selected));
      setIsQualityGradeManagementOpen(true);
    }
    closeContextMenu();
  };

  const handleDeleteGradeConfirm = async () => {
    if (!selectedLab || !selectedGradeId) return;
    try {
      await deleteLabGrade.mutateAsync({ id: selectedLab.id, gradeId: selectedGradeId });
      toastHelpers.success("삭제 완료", "질가산등급이 삭제되었습니다.");
    } catch (error) {
      toastHelpers.error("삭제 실패", "질가산등급 삭제에 실패했습니다.");
    } finally {
      setIsDeleteGradeModalOpen(false);
      setSelectedGradeId(null);
    }
  };

  const handleDeleteLab = () => {
    const selected = labs?.find((l) => getUniqueKey(l) === contextMenu.labUniqueKey);
    if (selected) {
      setSelectedLabUniqueKey(getUniqueKey(selected));
      setIsDeleteModalOpen(true);
    }
    closeContextMenu();
  };

  const handleDeleteConfirm = async () => {
    const selected = labs?.find((l) => getUniqueKey(l) === selectedLabUniqueKey);
    if (!selected) return;
    try {
      await deleteLab.mutateAsync(selected.id);
      toastHelpers.success("삭제 완료", "수탁기관이 삭제되었습니다.");
      setSelectedLabUniqueKey(null);
    } catch (error) {
      toastHelpers.error("삭제 실패", "수탁기관 삭제에 실패했습니다.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };
  const handleSaveQualityGrade = async (data: {
    applyDate: string;
    qualityGrade: number;
    pathologyCertified: CertificationStatus | null;
    nuclearMedicineCertified: CertificationStatus | null;
  }) => {
    if (!selectedLab) return;

    try {
      const commonPayload = {
        qualityGrade: data.qualityGrade,
        isPathologyCertified: data.pathologyCertified?.value ?? false,
        isNuclearMedicineCertified: data.nuclearMedicineCertified?.value ?? false,
      };

      if (selectedGradeId) {
        await updateLabGrade.mutateAsync({
          id: selectedLab.id,
          gradeId: selectedGradeId,
          data: commonPayload,
        });
        toastHelpers.success("수정 완료", "질가산등급이 수정되었습니다.");
      } else {
        await createLabGrade.mutateAsync({
          id: selectedLab.id,
          data: {
            ...commonPayload,
            applyDate: data.applyDate,
          },
        });
        toastHelpers.success("등록 완료", "질가산등급이 등록되었습니다.");
      }
      setIsEditDialogOpen(false);
      setSelectedGradeId(null);
    } catch (error) {
      toastHelpers.error("저장 실패", "질가산등급 저장에 실패했습니다.");
    }
  };

  const handleDeleteQualityGrade = async () => {
    if (!selectedLab || !selectedGradeId) return;
    try {
      await deleteLabGrade.mutateAsync({ id: selectedLab.id, gradeId: selectedGradeId });
      toastHelpers.success("삭제 완료", "질가산등급이 삭제되었습니다.");
      setIsEditDialogOpen(false);
      setSelectedGradeId(null);
    } catch (error) {
      toastHelpers.error("삭제 실패", "질가산등급 삭제에 실패했습니다.");
    }
  };

  const renderLabList = (targetLabs: typeof labs, showMenu: boolean = true) => {
    if (!targetLabs || targetLabs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
          <div className="text-sm">등록된 수탁기관이 없습니다.</div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {targetLabs.map((lab) => {
          const uniqueKey = getUniqueKey(lab);
          const displayGrade = lab.currentGrade || getLatestQualityGrade(lab.specimenQualityGrades);
          const isHighlighted = highlightedIds.has(uniqueKey);
          const isExpanded = expandedIds.has(uniqueKey);

          return (
            <div
              key={uniqueKey}
              onContextMenu={(e) => handleContextMenu(e, uniqueKey, lab.isSystemProvided)}
              className={cn(
                "rounded-lg border border-[#E4E4E7] p-6 bg-white transition-all",
                isHighlighted && "bg-blue-50 border-blue-200"
              )}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#171719] text-[16px] font-bold">{lab.name}</span>
                    <span className="text-[#989BA2] text-[16px] font-normal">{lab.code}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#71717A] text-[12px]">사용 여부</span>
                      <MySwitch
                        checked={lab.isEnabled}
                        onCheckedChange={() => handleToggleActive(lab)}
                        disabled={updateLabMapping.isPending}
                      />
                    </div>
                    {showMenu && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-[#F4F4F5] rounded transition-colors">
                            <MoreVertical className="w-4 h-4 text-[#71717A]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedLabUniqueKey(uniqueKey);
                            setIsEditLabInfoDialogOpen(true);
                          }}>
                            수탁기관 정보 수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedLabUniqueKey(uniqueKey);
                            setIsQualityGradeManagementOpen(true);
                          }}>
                            질가산등급 관리
                          </DropdownMenuItem>
                          {!lab.isSystemProvided && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedLabUniqueKey(uniqueKey);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              수탁기관 삭제
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#F4F4F5] bg-white p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2 items-center">
                      <span className="text-[#171719] text-[16px] font-bold">질가산등급</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#EAF2FE] text-[#0066FF] text-[11px] font-medium">현재</span>
                    </div>
                    <div className="flex flex-wrap gap-x-12 gap-y-2">
                      <div className="flex gap-2 text-[13px]">
                        <span className="text-[#71717A]">적용일자</span>
                        <span className="text-[#171719] font-bold">{displayGrade ? formatDate(displayGrade.applyDate) : "-"}</span>
                      </div>
                      <div className="flex gap-2 text-[13px]">
                        <span className="text-[#71717A]">질가산등급</span>
                        <span className="text-[#171719] font-bold">{displayGrade ? formatQualityGrade(displayGrade.qualityGrade) : "-"}</span>
                      </div>
                      <div className="flex gap-2 text-[13px]">
                        <span className="text-[#71717A]">병리검사</span>
                        <span className="text-[#171719] font-bold">{displayGrade ? formatCertified(displayGrade.isPathologyCertified) : "-"}</span>
                      </div>
                      <div className="flex gap-2 text-[13px]">
                        <span className="text-[#71717A]">핵의학적검사</span>
                        <span className="text-[#171719] font-bold">{displayGrade ? formatCertified(displayGrade.isNuclearMedicineCertified) : "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-[#171719] text-[14px] font-bold">기간별 질가산등급</span>
                  {lab.specimenQualityGrades && lab.specimenQualityGrades.length > 0 && (
                    <button
                      onClick={() => handleToggleHistory(uniqueKey, lab.currentGrade?.id)}
                      className="flex items-center gap-1 text-[#71717A] text-[12px] hover:text-[#171719]"
                    >
                      <span>{isExpanded ? "접기" : "전체보기"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {isExpanded && lab.specimenQualityGrades && lab.specimenQualityGrades.length > 0 && (
                  <div className="rounded-md overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] bg-[#F4F4F5] h-8 items-center text-center text-[12px] font-medium text-[#71717A]">
                      <div>적용일자</div>
                      <div>질가산등급</div>
                      <div>병리검사</div>
                      <div>핵의학적검사</div>
                      <div />
                    </div>
                    <div className="flex flex-col">
                      {getSortedQualityGrades(lab.specimenQualityGrades).map((grade) => (
                        <div key={grade.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] h-9 items-center text-center text-[13px] text-[#3F3F46] hover:bg-[#F4F4F5] transition-colors">
                          <div className="flex items-center justify-center gap-1.5">
                            {lab.currentGrade?.id === grade.id && (
                              <span className="px-1 py-0.5 rounded bg-[#EAF2FE] text-[#0066FF] text-[10px] font-medium">현재</span>
                            )}
                            <span>{formatDate(grade.applyDate)}</span>
                          </div>
                          <div>{formatQualityGrade(grade.qualityGrade)}</div>
                          <div>{formatCertified(grade.isPathologyCertified)}</div>
                          <div>{formatCertified(grade.isNuclearMedicineCertified)}</div>
                          <div className="flex justify-center">
                            {showMenu && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 hover:bg-[#F4F4F5] rounded transition-colors">
                                    <MoreVertical className="w-3.5 h-3.5 text-[#71717A]" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedLabUniqueKey(uniqueKey);
                                    setSelectedGradeId(grade.id ?? null);
                                    setIsEditDialogOpen(true);
                                  }}>
                                    수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setSelectedLabUniqueKey(uniqueKey);
                                      setSelectedGradeId(grade.id ?? null);
                                      setIsDeleteGradeModalOpen(true);
                                    }}
                                  >
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-400">
        <div className="text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <SectionLayout
        className="!h-full !gap-6"
        header={<h2 className="text-[#171719] text-[16px] font-bold tracking-tight">수탁기관 관리</h2>}
        body={
          <Tabs defaultValue="linked" className="w-full flex flex-col h-full gap-6">
            <TabsList className="bg-transparent  h-auto p-0 rounded-none w-full justify-start shrink-0 ">
              <TabsTrigger
                value="linked"
                className="cursor-pointer rounded-none border-0 border-b-2 border-transparent h-[36px] border-b-[#EAEBEC] text-[13px] text-[#A1A1AA] data-[state=active]:font-bold data-[state=active]:border-b-[#171719] data-[state=active]:text-[#171719] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
              >
                연동 수탁기관 {linkedLabs.length}
              </TabsTrigger>
              <TabsTrigger
                value="unlinked"
                className="cursor-pointer rounded-none border-0 border-b-2 border-transparent h-[36px] border-b-[#EAEBEC] text-[13px]  text-[#A1A1AA] data-[state=active]:font-bold data-[state=active]:border-b-[#171719] data-[state=active]:text-[#171719] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
              >
                미연동 수탁기관 {unlinkedLabs.length}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="linked" className="mt-0 focus-visible:outline-none flex-1 overflow-y-auto min-h-0">
              {renderLabList(linkedLabs, false)}
            </TabsContent>

            <TabsContent value="unlinked" className="mt-0 focus-visible:outline-none flex flex-col gap-4 flex-1 overflow-y-auto min-h-0">
              <div className="flex justify-end shrink-0">
                <MyButton
                  onClick={() => setIsDialogOpen(true)}
                  className="h-8 bg-[#1A1A2E] hover:bg-[#252542] text-white px-3 gap-1.5"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  수탁기관 추가
                </MyButton>
              </div>
              {renderLabList(unlinkedLabs)}
            </TabsContent>
          </Tabs>
        }
      />

      <AddExternalLabDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreateLab={async (data) => {
          const result = await createLab.mutateAsync(data);
          return result;
        }}
        onCreateGrade={async (params) => {
          return await createLabGrade.mutateAsync(params);
        }}
      />
      <EditQualityGradeDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedGradeId(null);
        }}
        initialData={
          (() => {
            const gradeToEdit = selectedGradeId
              ? selectedLab?.specimenQualityGrades.find(g => g.id === selectedGradeId)
              : latestQualityGrade;

            return gradeToEdit ? {
              applyDate: formatDate(gradeToEdit.applyDate),
              qualityGrade: gradeToEdit.qualityGrade,
              pathologyCertified: CERTIFICATION_STATUSES.find((s) => s.value === gradeToEdit.isPathologyCertified) || null,
              nuclearMedicineCertified:
                CERTIFICATION_STATUSES.find((s) => s.value === gradeToEdit.isNuclearMedicineCertified) || null,
            } : undefined;
          })()
        }
        onSave={handleSaveQualityGrade}
        onDelete={handleDeleteQualityGrade}
      />
      <QualityGradeManagementDialog
        open={isQualityGradeManagementOpen}
        onOpenChange={setIsQualityGradeManagementOpen}
        lab={selectedLab || null}
        onSave={(_data) => {
          setSelectedLabUniqueKey(null);
        }}
        onDelete={() => {
          setSelectedLabUniqueKey(null);
        }}
      />
      <EditExternalLabDialog open={isEditLabInfoDialogOpen} onOpenChange={setIsEditLabInfoDialogOpen} lab={selectedLab || null} />
      <MyContextMenu
        isOpen={contextMenu.visible}
        onCloseAction={closeContextMenu}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        items={[
          { label: "수탁기관 정보 수정", onClick: handleEditLabInfo },
          { label: "질가산등급 관리", onClick: handleManageQualityGrade },
          { label: "수탁기관 삭제", onClick: handleDeleteLab, className: "text-destructive hover:text-destructive" },
        ]}
      />
      <MyPopupYesNo
        isOpen={isDeleteModalOpen}
        onCloseAction={() => setIsDeleteModalOpen(false)}
        title="수탁기관 삭제 확인"
        message={`수탁기관 "${selectedLab?.name || selectedLab?.code}"을(를) 정말 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.`}
        confirmText="확인"
        cancelText="취소"
        onConfirmAction={handleDeleteConfirm}
      />
      <MyPopupYesNo
        isOpen={isDeleteGradeModalOpen}
        onCloseAction={() => {
          setIsDeleteGradeModalOpen(false);
          setSelectedGradeId(null);
        }}
        title="질가산등급 삭제 확인"
        message="선택한 질가산등급 정보를 삭제하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        onConfirmAction={handleDeleteGradeConfirm}
      />
    </>
  );
};
