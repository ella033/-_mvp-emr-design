'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useDocumentContext } from '../_contexts/DocumentContext';
import { useToastHelpers } from '@/components/ui/toast';
import { FormIssuancesService } from '@/services/form-issuances-service';
import { mapSnapshotToFormData } from '../_utils/form-data-mapper';
import { createPdfBlobFromCaptureTasks } from '@/lib/pdf/client-pdf-generator';
import { serializeDomToSelfContainedHtml, serializeDomFragmentToHtml } from '@/lib/html/serialize-dom-to-html';
import { buildPrintHtmlTemplate } from '@/lib/html/build-print-html-template';
import { usePrintPopupStore } from '@/store/print-popup-store';
import { OutputTypeCode } from '@/types/printer-types';
import { ISSUANCE_HISTORY_QUERY_KEY } from './IssuanceHistoryTab';
import { FormRenderType, FormIssuanceStatus } from '../_types/document-enums';
import type { components } from '@/generated/api/types';
import AlertModal from '@/app/claims/commons/alert-modal';

type FormFieldDto = components['schemas']['FormFieldDto'];
type CreateFormIssuanceDto = components['schemas']['CreateFormIssuanceDto'];
type UpdateFormIssuanceDto = components['schemas']['UpdateFormIssuanceDto'];

export default function DocumentToolbar() {
  const {
    zoomLevel,
    setZoomLevel,
    totalPages,
    currentPage,
    setCurrentPage,
    formResetRef,
    formSnapshotRef,
    selectedFormDetail,
    selectedPatient,
    selectedEncounter,
    appliedEncounters,
    loadedIssuance,
    setLoadedIssuance,
    formMode,
    setFormMode,
  } = useDocumentContext();

  const [isNoPatientAlertOpen, setIsNoPatientAlertOpen] = useState(false);

  const handleNoPatientConfirm = useCallback(() => {
    setIsNoPatientAlertOpen(false);
  }, []);

  const queryClient = useQueryClient();
  const { success, error: showError } = useToastHelpers();
  const { openPrintPopup } = usePrintPopupStore();

  // 발급 이력 생성 mutation
  const createIssuanceMutation = useMutation({
    mutationFn: (body: CreateFormIssuanceDto) =>
      FormIssuancesService.createFormIssuance(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ISSUANCE_HISTORY_QUERY_KEY] });
    },
  });

  // 발급 이력 수정 mutation
  const updateIssuanceMutation = useMutation({
    mutationFn: ({
      issuanceId,
      body,
    }: {
      issuanceId: number;
      body: UpdateFormIssuanceDto;
    }) => FormIssuancesService.updateFormIssuance(issuanceId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ISSUANCE_HISTORY_QUERY_KEY] });
    },
  });

  const isSaving = createIssuanceMutation.isPending || updateIssuanceMutation.isPending;

  function handleZoomIn() {
    setZoomLevel(Math.min(zoomLevel + 10, 200));
  }

  function handleZoomOut() {
    setZoomLevel(Math.max(zoomLevel - 10, 50));
  }

  function handleReset() {
    setZoomLevel(100);
  }

  function handleClearInput() {
    const isViewMode = formMode === 'view';

    const rawComponentPath = (selectedFormDetail?.componentPath as any) ?? null;
    const isMedicalRecordComponent =
      typeof rawComponentPath === 'string' && rawComponentPath === 'MedicalRecordContent';

    const shouldDisableClearInput = isViewMode || isMedicalRecordComponent;
    if (shouldDisableClearInput) {
      return;
    }

    if (window.confirm('작성한 내용을 초기화하시겠습니까?')) {
      formResetRef.current?.();
    }
  }

  async function handleSave() {
    if (formMode === 'view') {
      showError('저장 불가', <p>발급 이력 조회 화면에서는 편집을 시작해 주세요.</p>);
      return;
    }

    const rawPatientId = selectedPatient?.id;
    const hasPatientId = typeof rawPatientId === 'number' && rawPatientId > 0;
    if (!hasPatientId) {
      setIsNoPatientAlertOpen(true);
      return;
    }

    const hasSelectedFormDetail = Boolean(selectedFormDetail);
    if (!hasSelectedFormDetail || !selectedFormDetail) {
      showError('저장 실패', <p>서식을 선택해 주세요.</p>);
      return;
    }

    const snapshotGetter = formSnapshotRef.current;
    const hasSnapshotGetter = typeof snapshotGetter === 'function';
    if (!hasSnapshotGetter) {
      showError('저장 실패', <p>저장 가능한 입력 데이터가 없습니다.</p>);
      return;
    }

    if (isSaving) {
      return;
    }

    const snapshot = snapshotGetter();
    const formData = mapSnapshotToFormData({ snapshot });

    const patientId = rawPatientId;

    const encounterIds = resolveEncounterIds({
      appliedEncounters,
      selectedEncounter,
    });

    const loadedStatus = loadedIssuance?.status;
    const isLoadedDraft = loadedStatus === FormIssuanceStatus.Draft;
    const loadedIssuanceId = loadedIssuance?.issuanceId ?? null;
    const hasLoadedIssuanceId =
      typeof loadedIssuanceId === 'number' && Number.isFinite(loadedIssuanceId) && loadedIssuanceId > 0;
    const shouldPatchExistingDraft = isLoadedDraft && hasLoadedIssuanceId;

    try {
      if (shouldPatchExistingDraft) {
        await updateIssuanceMutation.mutateAsync({
          issuanceId: loadedIssuanceId,
          body: {
            patientId,
            encounterId: encounterIds.length ? encounterIds : undefined,
            formData,
            status: FormIssuanceStatus.Draft,
          } as any,
        });

        // 기존 draft 업데이트 시 loadedIssuance의 formData만 갱신
        setLoadedIssuance({
          issuanceId: loadedIssuanceId,
          status: FormIssuanceStatus.Draft,
          formId: selectedFormDetail.formId,
          formVersionId: selectedFormDetail.formVersionId,
          formData,
        });

        success('임시저장 완료', <p>발급 이력이 업데이트되었습니다.</p>);
        return;
      }

      await createIssuanceMutation.mutateAsync({
        formId: selectedFormDetail.formId,
        formVersionId: selectedFormDetail.formVersionId,
        patientId,
        encounterId: encounterIds.length ? encounterIds : undefined,
        formData,
        status: FormIssuanceStatus.Draft,
      } as any);

      // 새로 생성된 draft를 조회하여 loadedIssuance 설정 (재저장 시 patch 가능하도록)
      try {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);

        const params = {
          from: formatDateForApi(oneMonthAgo),
          to: formatDateForApi(today),
          formId: selectedFormDetail.formId,
          ...(patientId ? { patientId } : {}),
        };

        const response = await FormIssuancesService.getFormIssuances(params);
        const items = response.items ?? [];
        // 가장 최근 draft (status: 0) 찾기
        const latestDraft = items
          .filter((item: any) => item.status === FormIssuanceStatus.Draft)
          .sort((a: any, b: any) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];

        if (latestDraft) {
          setLoadedIssuance({
            issuanceId: latestDraft.issuanceId,
            status: FormIssuanceStatus.Draft,
            formId: selectedFormDetail.formId,
            formVersionId: selectedFormDetail.formVersionId,
            formData,
          });
        }
      } catch (fetchError) {
        // 조회 실패해도 저장은 완료된 상태이므로 무시
        console.warn('저장된 draft 조회 실패:', fetchError);
      }

      success('임시저장 완료', <p>발급 이력이 저장되었습니다.</p>);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '저장에 실패했습니다.';
      showError('저장 실패', <p>{errorMessage}</p>);
    }
  }

  // API용 날짜 포맷 (YYYY-MM-DD)
  function formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function handleOfficialPrint() {
    const rawPatientId = selectedPatient?.id;
    const hasPatientId = typeof rawPatientId === 'number' && rawPatientId > 0;
    if (!hasPatientId) {
      setIsNoPatientAlertOpen(true);
      return;
    }

    const hasSelectedFormDetail = Boolean(selectedFormDetail);
    if (!hasSelectedFormDetail || !selectedFormDetail) {
      showError('출력 실패', <p>서식을 선택해 주세요.</p>);
      return;
    }

    const snapshotGetterForPreview = formSnapshotRef.current;
    const hasSnapshotGetterForPreview = typeof snapshotGetterForPreview === 'function';
    if (!hasSnapshotGetterForPreview) {
      showError('출력 실패', <p>출력 가능한 데이터가 없습니다.</p>);
      return;
    }

    if (isSaving) {
      return;
    }

    const isPdfRenderType = selectedFormDetail.renderType === FormRenderType.Pdf;
    const isIssuedStatus = loadedIssuance?.status === FormIssuanceStatus.Issued;
    const isAlreadyIssued = formMode === 'view' && isIssuedStatus;

    // 발급 완료 여부 추적 (onClose에서 편집모드 복구 판단용)
    let actionCompleted = false;

    try {
      if (!isAlreadyIssued) {
        // 발급은 팝업의 "PDF 저장/출력" 클릭 시점에 수행하되,
        // 미리보기는 조회모드 기반 DOM으로 생성되도록 뷰 전환만 먼저 수행
        setFormMode('view');
        await waitForTwoAnimationFrames();
        await wait(100);
      }

      // 미리보기 팝업 오픈
      openPrintPopup({
        config: {
          title: '서식출력', // GetFormByIdResponseDto에 formName이 없음
          outputTypeCode: OutputTypeCode.CERTIFICATE,
          fileNamePrefix: 'document',
          outputMode: 'html' as const,
        },
        beforeAction: async () => {
          const isAlreadyIssuedNow = loadedIssuance?.status === FormIssuanceStatus.Issued;
          if (isAlreadyIssuedNow) {
            return { shouldRegeneratePdf: false };
          }

          const hasSelectedFormDetail = Boolean(selectedFormDetail);
          if (!hasSelectedFormDetail || !selectedFormDetail) {
            throw new Error('서식을 선택해 주세요.');
          }

          const snapshotGetter = formSnapshotRef.current;
          const hasSnapshotGetter = typeof snapshotGetter === 'function';
          if (!hasSnapshotGetter) {
            throw new Error('출력 가능한 데이터가 없습니다.');
          }

          const snapshot = snapshotGetter();
          const formData = mapSnapshotToFormData({ snapshot });

          // 발급번호 필드가 formData에 포함되도록 보장 (발급번호 값은 나중에 설정됨)
          const fields = (selectedFormDetail.fields ?? []) as unknown as FormFieldDto[];
          const issuanceNoField = fields.find((f: any) => f.dataSource === 'document.issuanceNo');
          const hasIssuanceNoKey = Boolean(issuanceNoField) && issuanceNoField!.key in formData;
          if (issuanceNoField && !hasIssuanceNoKey) {
            formData[issuanceNoField.key] = '';
          }

          const patientId = rawPatientId;

          const encounterIds = resolveEncounterIds({
            appliedEncounters,
            selectedEncounter,
          });

          const loadedIssuanceId = loadedIssuance?.issuanceId;
          const isDraft = loadedIssuance?.status === FormIssuanceStatus.Draft;
          const shouldUpdateDraftToIssued = isDraft && typeof loadedIssuanceId === 'number';

          let issuanceResult: { issuanceId: number; issuanceNo: string };

          if (shouldUpdateDraftToIssued) {
            issuanceResult = await updateIssuanceMutation.mutateAsync({
              issuanceId: loadedIssuanceId,
              body: {
                patientId,
                encounterId: encounterIds.length ? encounterIds : undefined,
                formData,
                status: FormIssuanceStatus.Issued,
              } as any,
            });
          } else {
            issuanceResult = await createIssuanceMutation.mutateAsync({
              formId: selectedFormDetail.formId,
              formVersionId: selectedFormDetail.formVersionId,
              patientId,
              encounterId: encounterIds.length ? encounterIds : undefined,
              formData,
              status: FormIssuanceStatus.Issued,
            } as any);
          }

          // API 응답에서 발급번호를 직접 사용
          const { issuanceNo } = issuanceResult;
          const hasIssuanceNo = typeof issuanceNo === 'string' && issuanceNo.length > 0;
          if (hasIssuanceNo && issuanceNoField) {
            formData[issuanceNoField.key] = issuanceNo;
            (snapshot as Record<string, unknown>)[issuanceNoField.key] = issuanceNo;
          }

          setLoadedIssuance({
            issuanceId: issuanceResult.issuanceId,
            status: FormIssuanceStatus.Issued,
            formId: selectedFormDetail.formId,
            formVersionId: selectedFormDetail.formVersionId,
            formData,
          });

          setFormMode('view');

          actionCompleted = true;
          success('발급 완료', <p>발급 이력이 생성되었습니다.</p>);

          // HTML 모드: DOM 재렌더 후 HTML 재생성으로 발급번호를 반영
          return {
            shouldRegeneratePdf: true,
          };
        },
        onClose: () => {
          // 출력/저장을 하지 않고 팝업을 닫은 경우 편집모드로 복구
          if (!actionCompleted && !isAlreadyIssued) {
            setFormMode('edit');
          }
        },
        generatePdf: async () => {
          if (isPdfRenderType) {
            return await generateHtmlFromPdfRenderType({
              totalPages,
              currentPage,
              setCurrentPage,
            });
          }

          const printableRoot = resolveClientPdfRoot();
          if (!printableRoot) {
            throw new Error('출력할 콘텐츠를 찾을 수 없습니다.');
          }

          const { restore } = showAllPrintablePages(printableRoot);
          try {
            return await serializeDomToSelfContainedHtml({
              root: printableRoot,
              mode: 'preview',
            });
          } finally {
            restore();
          }
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '발급 처리에 실패했습니다.';
      showError('출력 실패', <p>{errorMessage}</p>);
    }
  }

  function handlePreviousPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  const zoomOptions = [50, 75, 100, 125, 150, 175, 200];
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);

  const isPrintDisabled = isSaving;

  return (
    <div className="w-full h-12 bg-[#fbfaff] border-b border-gray-300 flex items-center justify-between px-4 shadow-sm">
      {/* 좌측: 페이지네이션, 배율 선택 */}
      <div className="flex items-center gap-2">
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="bg-white border border-[#c2c4c8] rounded px-2 py-2 h-8 min-w-[32px] hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 text-[#292a2d]" />
            </Button>
            <div className="flex items-center justify-center rounded-lg w-13 h-8">
              <span className="text-sm text-[#292a2d] text-center">
                {currentPage} / {totalPages}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-white border border-[#c2c4c8] rounded px-2 py-2 h-8 min-w-[32px] hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4 text-[#292a2d]" />
            </Button>
          </div>
        )}

        {/* 배율 선택 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
            className="bg-white border border-[#c2c4c8] rounded-md h-8 px-2 flex items-center justify-between gap-2 w-20 text-[13px] text-[#171719] hover:bg-gray-50"
          >
            <span>{zoomLevel}%</span>
            <ChevronDown className="w-4 h-4 text-[#46474c]" />
          </button>
          {isZoomDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#c2c4c8] rounded-md shadow-lg z-50 min-w-[80px]">
              {zoomOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setZoomLevel(option);
                    setIsZoomDropdownOpen(false);
                  }}
                  className={`w-full px-2 py-1.5 text-left text-[13px] hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${zoomLevel === option ? 'bg-gray-100 font-medium' : ''
                    }`}
                >
                  {option}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 기존 배율 조정 버튼들 (Figma에 없지만 유지) */}
        <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="hidden"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="hidden"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="hidden">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* 현재 모드 표시 배지 */}
        <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
          {formMode === 'view' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
              조회 모드
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
              편집 모드
            </span>
          )}
        </div>
      </div>

      {/* 우측: 입력 초기화, 저장, 출력 및 기타 기능 */}
      <div className="flex items-center gap-2">
        {/* 입력 초기화 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearInput}
          disabled={(() => {
            const isViewMode = formMode === 'view';
            const rawComponentPath = (selectedFormDetail?.componentPath as any) ?? null;
            const isMedicalRecordComponent =
              typeof rawComponentPath === 'string' && rawComponentPath === 'MedicalRecordContent';
            return isViewMode || isMedicalRecordComponent;
          })()}
          className="bg-white border border-[#180f38] text-[#180f38] text-[13px] font-medium px-3 py-2 h-8 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          입력 초기화
        </Button>

        {/* FIXME: 편집 시작 버튼 불필요시 삭제 */}
        {/* {formMode === 'view' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
            className="bg-white border border-[#180f38] text-[#180f38] text-[13px] font-medium px-2 py-2 h-8 w-20 hover:bg-gray-50"
          >
            편집 시작
          </Button>
        )} */}

        {/* 저장 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || formMode === 'view'}
          className="bg-white border border-[#180f38] text-[#180f38] text-[13px] font-medium px-2 py-2 h-8 w-16 hover:bg-gray-50"
        >
          저장
        </Button>

        {/* 출력 */}
        <Button
          variant="default"
          size="sm"
          onClick={handleOfficialPrint}
          disabled={isPrintDisabled}
          className="bg-[#180f38] text-white text-[13px] font-medium px-2 py-2 h-8 w-16 hover:bg-[#180f38]/90"
        >
          출력
        </Button>

        {/* FIXME: 개발용 옵션 주석처리 */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={handleClientPdfDownload}
          disabled={isSaving || isClientPdfGenerating}
          className="bg-white border border-[#180f38] text-[#180f38] text-[13px] font-medium px-2 py-2 h-8 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClientPdfGenerating ? '생성중...' : '클라이언트 PDF'}
        </Button> */}

        {/* <Button
          variant="default"
          size="sm"
          onClick={handlePrint}
          className="bg-[#180f38] text-white text-[13px] font-medium px-2 py-2 h-8 w-16 hover:bg-[#180f38]/90 hidden"
        >
          브라우저 출력
        </Button> */}

        {/* 기존 기능들 (Figma에 없지만 유지) */}
        {/* FIXME: 여백 조절 기능 불필요시 완전 제거 */}
        {/* <label className="flex items-center gap-2 text-sm text-gray-700">
          <span className="sr-only">여백(mm)</span>
          <input
            type="number"
            value={margin}
            onChange={(event) => setMargin(Number(event.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-right text-sm"
            min="0"
            placeholder="여백"
          />
        </label> */}
        {/* <Button variant="outline" size="sm" onClick={handleGenerateServerPdf}>
          PDF 생성(개발용)
        </Button> */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAgentPrintDialogOpen(true)}
          disabled={isPrinting}
        >
          <Printer className="w-4 h-4 mr-1" />
          {isPrinting ? '출력 중...' : 'agent 프린트(개발용)'}
        </Button> */}
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isZoomDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsZoomDropdownOpen(false)}
        />
      )}

      {/* 환자 미선택 알림 팝업 */}
      <AlertModal
        open={isNoPatientAlertOpen}
        onOpenChange={setIsNoPatientAlertOpen}
        title="알림"
        message="환자를 선택해 주세요."
        showCancel={false}
        onConfirm={handleNoPatientConfirm}
      />
    </div>
  );
}

function resolveEncounterIds(params: {
  appliedEncounters: { id: string }[];
  selectedEncounter: { id: string } | null;
}) {
  const applied = params.appliedEncounters ?? [];
  const appliedIds = applied
    .map((encounter) => Number(encounter.id))
    .filter((value) => Number.isFinite(value) && value > 0);

  const hasApplied = appliedIds.length > 0;
  if (hasApplied) {
    return appliedIds;
  }

  const selectedId = params.selectedEncounter?.id;
  const resolvedSelectedId = selectedId ? Number(selectedId) : NaN;
  const hasSelectedNumericId = Number.isFinite(resolvedSelectedId) && resolvedSelectedId > 0;
  if (hasSelectedNumericId) {
    return [resolvedSelectedId];
  }

  return [];
}

function resolveClientPdfRoot(): HTMLElement | null {
  // 클라이언트 캡처는 "화면에 보이는" preview-root가 우선.
  // PrintableDocument styles.css에서 data-print-root는 화면에서 display:none 이라 백지 캡처가 발생할 수 있음.
  const previewRoot = document.querySelector<HTMLElement>("[data-print-preview-root='true']");
  if (previewRoot) return previewRoot;

  const printRoot = document.querySelector<HTMLElement>("[data-print-root='true']");
  if (printRoot) return printRoot;

  return null;
}

function showAllPrintablePages(root: HTMLElement): { restore: () => void } {
  const pages = root.querySelectorAll<HTMLElement>('.printable-page');
  if (pages.length === 0) {
    return { restore: () => undefined };
  }

  const originalDisplays: Array<string> = [];
  pages.forEach((page) => {
    originalDisplays.push(page.style.display);
    page.style.display = 'flex';
  });

  return {
    restore: () => {
      pages.forEach((page, idx) => {
        page.style.display = originalDisplays[idx] ?? '';
      });
    },
  };
}

async function generateHtmlFromPdfRenderType(params: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}): Promise<string> {
  const { totalPages, currentPage, setCurrentPage } = params;

  const captureRoot = document.querySelector<HTMLElement>("[data-client-pdf-root='true']");
  if (!captureRoot) {
    throw new Error('캡처 영역을 찾을 수 없습니다.');
  }

  const resolvedTotalPages = totalPages > 0 ? totalPages : 1;
  const originalPage = currentPage;
  const pageHtmlParts: string[] = [];

  try {
    for (let i = 0; i < resolvedTotalPages; i++) {
      setCurrentPage(i + 1);
      await waitForPdfRenderStable(captureRoot);

      // react-pdf CSS 변수에서 총 스케일 팩터 읽기
      // --scale-factor × --user-unit = totalScaleFactor (예: 1 × 3 = 3)
      const reactPdfPage = captureRoot.querySelector<HTMLElement>('.react-pdf__Page');
      const scaleFactor = reactPdfPage
        ? parseFloat(getComputedStyle(reactPdfPage).getPropertyValue('--scale-factor')) || 1
        : 1;
      const userUnit = reactPdfPage
        ? parseFloat(getComputedStyle(reactPdfPage).getPropertyValue('--user-unit')) || 1
        : 1;
      const totalScale = scaleFactor * userUnit;

      // canvas CSS 크기에서 PDF 페이지 물리 크기(mm) 계산
      // canvas.width는 픽셀 버퍼 크기(DPR 포함)이므로 사용하면 안 됨
      // canvas.style.width가 실제 CSS 표시 크기
      const canvas = captureRoot.querySelector('canvas') as HTMLCanvasElement | null;
      const canvasCssW = parseFloat(canvas?.style.width || '0') || canvas?.clientWidth || 1786;
      const canvasCssH = parseFloat(canvas?.style.height || '0') || canvas?.clientHeight || 2526;

      const PT_TO_MM = 25.4 / 72;
      const pdfPageWidthPt = canvasCssW / totalScale;
      const pdfPageHeightPt = canvasCssH / totalScale;
      const wMm = Math.round(pdfPageWidthPt * PT_TO_MM * 100) / 100;
      const hMm = Math.round(pdfPageHeightPt * PT_TO_MM * 100) / 100;

      // zoom: CSS 픽셀 콘텐츠를 mm 페이지에 맞추는 축소 비율
      const zoomFactor = 96 / (totalScale * 72);

      // DOM fragment 직렬화 (canvas→img 변환 포함)
      const fragmentHtml = await serializeDomFragmentToHtml({
        source: captureRoot,
      });

      pageHtmlParts.push(
        `<div class="printable-page" style="width: ${wMm}mm; height: ${hMm}mm; position: relative; overflow: hidden;">` +
        `<div style="zoom: ${zoomFactor};">` +
        fragmentHtml +
        `</div></div>`
      );
    }
  } finally {
    setCurrentPage(originalPage);
  }

  return buildPrintHtmlTemplate({
    bodyHtml: pageHtmlParts.join('\n'),
    mode: 'preview',
    extraCss: PDF_RENDER_TYPE_TAILWIND_CSS,
  });
}

/**
 * PDF 렌더 타입 서식의 FormFieldOverlay가 사용하는 Tailwind 유틸리티 CSS.
 * self-contained HTML에서는 Tailwind CSS가 없으므로 필요한 유틸리티만 인라인 정의.
 */
const PDF_RENDER_TYPE_TAILWIND_CSS = `
  .relative { position: relative; }
  .absolute { position: absolute; }
  .top-0 { top: 0px; }
  .left-0 { left: 0px; }
  .z-2 { z-index: 2; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .overflow-hidden { overflow: hidden; }
  .whitespace-nowrap { white-space: nowrap; }
  .pointer-events-none { pointer-events: none; }
  .pointer-events-auto { pointer-events: auto; }
`;

// 이미지 캡처 방식 (롤백용으로 보존 — outputMode 조건만 변경하면 즉시 롤백 가능)
// @ts-expect-error TS6133: 롤백용 함수 보존
async function _generateClientPdfFromPdfRenderType(params: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}): Promise<Blob> {
  const { totalPages, currentPage, setCurrentPage } = params;

  const captureRoot = document.querySelector<HTMLElement>("[data-client-pdf-root='true']");
  if (!captureRoot) {
    throw new Error('PDF 캡처 영역을 찾을 수 없습니다.');
  }

  const resolvedTotalPages = totalPages > 0 ? totalPages : 1;
  const originalPage = currentPage;

  try {
    const tasks = Array.from({ length: resolvedTotalPages }, (_, idx) => {
      const targetPage = idx + 1;
      return async () => {
        setCurrentPage(targetPage);
        await waitForPdfRenderStable(captureRoot);
        return captureRoot;
      };
    });

    return await createPdfBlobFromCaptureTasks({
      captureTasks: tasks,
      options: {
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        quality: 1.0,
      },
    });
  } finally {
    setCurrentPage(originalPage);
  }
}

async function waitForPdfRenderStable(root: HTMLElement): Promise<void> {
  const TIMEOUT_MS = 4000;
  const POLL_MS = 60;
  const startedAt = Date.now();

  await waitForTwoAnimationFrames();

  while (Date.now() - startedAt < TIMEOUT_MS) {
    const canvas = root.querySelector('canvas') as HTMLCanvasElement | null;
    const hasCanvas = Boolean(canvas);
    const isCanvasReady = hasCanvas && (canvas?.width ?? 0) > 0 && (canvas?.height ?? 0) > 0;
    if (isCanvasReady) {
      await waitForTwoAnimationFrames();
      return;
    }
    await wait(POLL_MS);
  }

  // timeout이어도 캡처는 시도 (사용자가 PDF가 보이는 상태일 수 있음)
  await waitForTwoAnimationFrames();
}

async function waitForTwoAnimationFrames(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
