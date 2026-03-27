'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import InputDate from '@/components/ui/input-date';
import { cn } from '@/lib/utils';
import { useDocumentContext } from '../_contexts/DocumentContext';
import { useToastHelpers } from '@/components/ui/toast';
import type { IssuanceHistoryItem } from '../_types/issuance-history-types';
import { FormIssuancesService } from '@/services/form-issuances-service';
import { PatientsService } from '@/services/patients-service';
import { useHospitalStore } from '@/store/hospital-store';
import { useUsersStore } from '@/store/users-store';
import type { UserManager } from '@/types/user-types';
import type { Patient } from '@/types/patient-types';
import {
  IssuanceHistoryFormSearch,
  type IssuanceHistoryFormSearchValue,
} from './IssuanceHistoryFormSearch';
import { IssuanceHistoryPatientSearch } from './IssuanceHistoryPatientSearch';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export const ISSUANCE_HISTORY_QUERY_KEY = 'issuanceHistory';

type HistoryType = 'patient' | 'document';

export default function IssuanceHistoryTab() {
  const {
    selectedPatient,
    selectedFormId,
    trySetSelectedFormId,
    setLoadedIssuance,
    setCurrentPage,
    setTotalPages,
    setFormMode,
    setSelectedPatient,
  } = useDocumentContext();
  const toastHelpers = useToastHelpers();
  const toastHelpersRef = useRef(toastHelpers);

  const [historyType, setHistoryType] = useState<HistoryType>('patient');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedSearchForm, setSelectedSearchForm] =
    useState<IssuanceHistoryFormSearchValue | null>(null);
  const [selectedSearchPatient, setSelectedSearchPatient] = useState<Patient | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const hospital = useHospitalStore((state) => state.hospital);
  const getUserById = useUsersStore((state) => state.getUserById);
  const hospitalId = Number.isFinite(hospital?.id) ? String(hospital.id) : null;

  useEffect(function syncToastHelpersRef() {
    toastHelpersRef.current = toastHelpers;
  }, [toastHelpers]);

  // 초기 날짜 설정: 최근 1년
  useEffect(function initializeDateRange() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    setDateFrom(formatDate(oneYearAgo));
    setDateTo(formatDate(today));
  }, []);

  // 기간 설정 핸들러
  const setPeriod = (months: number) => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setMonth(today.getMonth() - months);

    setDateFrom(formatDate(targetDate));
    setDateTo(formatDate(today));
  };

  // 쿼리 활성화 조건 확인
  const isPatientHistory = historyType === 'patient';
  const isMissingPatient = isPatientHistory && !selectedPatient;
  const isMissingForm = historyType === 'document' && !selectedFormId;
  const canFetch = !isMissingPatient && !isMissingForm && Boolean(dateFrom) && Boolean(dateTo);

  // React Query로 발급 이력 조회
  const { data: rawHistoryList = [], isLoading } = useQuery({
    queryKey: [
      ISSUANCE_HISTORY_QUERY_KEY,
      historyType,
      dateFrom,
      dateTo,
      selectedPatient?.id,
      selectedFormId,
      selectedSearchPatient?.id,
      selectedSearchForm?.id,
    ],
    queryFn: async () => {
      const params = buildFormIssuancesParams({
        historyType,
        dateFrom,
        dateTo,
        requiredPatientId: selectedPatient?.id,
        requiredFormId: selectedFormId ?? undefined,
        searchPatientId: selectedSearchPatient?.id,
        searchFormId: selectedSearchForm?.id,
      });

      const data = await FormIssuancesService.getFormIssuances(params);
      const items = (data.items ?? []) as IssuanceHistoryItem[];
      const sortedHistory = items.sort((a, b) => {
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });

      return sortedHistory;
    },
    enabled: canFetch,
  });

  // 발급 이력 상세 조회 및 환자 정보 조회를 위한 mutation
  const selectIssuanceMutation = useMutation({
    mutationFn: async (issuanceId: number) => {
      const detail = await FormIssuancesService.getFormIssuanceById(issuanceId);

      // patientId가 있으면 환자 정보도 조회
      const patientId = (detail as any)?.patientId;
      let patient: Patient | null = null;
      if (typeof patientId === 'number' && patientId > 0) {
        try {
          patient = await PatientsService.getPatient(patientId);
        } catch (patientError) {
          console.warn('환자 정보 조회 실패:', patientError);
        }
      }

      return { detail, patient };
    },
    onSuccess: ({ detail, patient }) => {
      // 상세 응답 스키마에 status가 누락된 경우가 있어 런타임 값을 우선 사용 (없으면 임시저장으로 간주)
      const resolvedStatus = ((detail as any)?.status ?? 0) as any;
      const rawFormData = (detail as any)?.formData ?? {};

      // 발급번호가 있으면 formData에 포함
      const issuanceNo = (detail as any)?.issuanceNo;
      const enrichedFormData = { ...rawFormData };
      if (issuanceNo && typeof issuanceNo === 'string') {
        // formData에서 issuance_no로 시작하는 key를 찾아 발급번호 설정
        Object.keys(enrichedFormData).forEach((key) => {
          if (key.startsWith('issuance_no_')) {
            enrichedFormData[key] = issuanceNo;
          }
        });
      }

      setLoadedIssuance({
        issuanceId: detail.issuanceId,
        status: resolvedStatus,
        formId: detail.formId,
        formVersionId: detail.formVersionId,
        formData: enrichedFormData,
      });

      // 환자 정보가 있으면 설정
      if (patient) {
        setSelectedPatient(patient);
      }

      setFormMode('view');
      // dirty 체크 포함하여 서식 변경 시도
      trySetSelectedFormId(detail.formId);
      setCurrentPage(1);
      setTotalPages(0);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : '발급 이력 상세를 불러오지 못했습니다.';
      toastHelpersRef.current.error('불러오기 실패', errorMessage);
    },
  });

  const handleSelectIssuance = useCallback(
    function handleSelectIssuance(issuanceId: number) {
      const isValidIssuanceId = Number.isFinite(issuanceId) && issuanceId > 0;
      if (!isValidIssuanceId) {
        toastHelpersRef.current.error('선택 실패', '유효하지 않은 발급이력입니다.');
        return;
      }

      selectIssuanceMutation.mutate(issuanceId);
    },
    [selectIssuanceMutation]
  );

  const isSelecting = selectIssuanceMutation.isPending;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <div className="flex flex-col gap-[12px] p-[12px] pt-[16px]">
        {/* 토글 버튼 */}
        <div className="h-[32px] bg-[#eaebec] rounded-[4px] p-[2px] flex">
          <button
            onClick={() => setHistoryType('patient')}
            className={cn(
              "flex-1 rounded-[4px] text-[13px] font-medium transition-all flex items-center justify-center",
              historyType === 'patient'
                ? "bg-white text-[#180f38] shadow-sm border border-[#180f38]"
                : "text-[#989ba2] hover:text-[#70737c]"
            )}
          >
            환자별
          </button>
          <button
            onClick={() => setHistoryType('document')}
            className={cn(
              "flex-1 rounded-[4px] text-[13px] font-medium transition-all flex items-center justify-center",
              historyType === 'document'
                ? "bg-white text-[#180f38] shadow-sm border border-[#180f38]"
                : "text-[#989ba2] hover:text-[#70737c]"
            )}
          >
            서식별
          </button>
        </div>

        {/* 날짜 선택 */}
        <div className="flex items-center gap-[12px]">
          <div className="flex items-center gap-[6px] flex-1">
            <InputDate
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="YYYY-MM-DD"
              className="h-[32px] text-[13px] px-[8px] text-center"
              wrapperClassName="flex-1"
            />
            <span className="text-[#989ba2] text-[13px]">-</span>
            <InputDate
              value={dateTo}
              onChange={setDateTo}
              placeholder="YYYY-MM-DD"
              className="h-[32px] text-[13px] px-[8px] text-center"
              wrapperClassName="flex-1"
            />
          </div>
          <div className="flex gap-[4px]">
            {[1, 3, 6].map((month) => (
              <button
                key={month}
                onClick={() => setPeriod(month)}
                className="min-w-[50px] h-[32px] px-[8px] bg-white border border-[#dbdcdf] rounded-[4px] text-[13px] text-[#171719] font-medium hover:bg-gray-50"
              >
                {month}개월
              </button>
            ))}
          </div>
        </div>

        {/* 검색창 */}
        {historyType === 'patient' ? (
          <IssuanceHistoryFormSearch
            value={selectedSearchForm}
            onChange={(next) => setSelectedSearchForm(next)}
            disabled={!selectedPatient}
            onDisabledClick={() => setAlertMessage('환자를 선택해주세요.')}
          />
        ) : (
          <IssuanceHistoryPatientSearch
            value={selectedSearchPatient}
            onChange={(next) => setSelectedSearchPatient(next)}
            disabled={!selectedFormId}
            onDisabledClick={() => setAlertMessage('서식을 선택해주세요.')}
          />
        )}
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-hidden p-[12px] flex flex-col">
        <div className="border border-[#eaebec] rounded-[6px] flex-1 flex flex-col overflow-hidden">
          {/* 목록 */}
          <div className="overflow-y-auto flex-1 bg-white">
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex bg-[#f4f4f5] border-b border-[#eaebec]">
              <div className="w-[102px] py-[6.5px] px-[8px] text-center text-[12px] font-medium text-[#292a2d]">
                발급정보
              </div>
              {historyType === 'patient' ? (
                <div className="flex-1 py-[6.5px] px-[8px] text-center text-[12px] font-medium text-[#292a2d]">
                  서식명
                </div>
              ) : (
                <>
                  <div className="w-[80px] py-[6.5px] px-[8px] text-center text-[12px] font-medium text-[#292a2d]">
                    차트번호
                  </div>
                  <div className="flex-1 py-[6.5px] px-[8px] text-center text-[12px] font-medium text-[#292a2d]">
                    환자명
                  </div>
                </>
              )}
              <div className="w-[80px] py-[6.5px] px-[8px] text-center text-[12px] font-medium text-[#292a2d]">
                발급자
              </div>
            </div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-[#989ba2] text-[13px]">
                불러오는 중...
              </div>
            ) : rawHistoryList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#989ba2] text-[13px]">
                데이터가 없습니다.
              </div>
            ) : (
              rawHistoryList.map((item) => {
                const issuedByName = resolveIssuedByName({
                  hospitalId,
                  issuedBy: item.issuedBy,
                  getUserById,
                });

                return (
                  <div
                    key={item.issuanceId}
                    role="button"
                    tabIndex={0}
                    aria-disabled={isSelecting}
                    onClick={() => handleSelectIssuance(item.issuanceId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectIssuance(item.issuanceId);
                      }
                    }}
                    className={cn(
                      "flex hover:bg-gray-50 last:border-0",
                      isSelecting && "opacity-60 pointer-events-none"
                    )}
                  >
                    <div className="w-[102px] py-[6px] px-[8px] text-center text-[13px] text-[#46474c]">
                      {item.status === 0 ? '미출력' : formatDate(new Date(item.issuedAt))}
                    </div>
                    {historyType === 'patient' ? (
                      <div className="flex-1 py-[6px] px-[8px] text-center text-[13px] text-[#0b0b0b] truncate">
                        {item.formName ?? '-'}
                      </div>
                    ) : (
                      <>
                        <div className="w-[80px] py-[6px] px-[8px] text-center text-[13px] text-[#46474c]">
                          {item.patientId}
                        </div>
                        <div className="flex-1 py-[6px] px-[8px] text-center text-[13px] text-[#0b0b0b] truncate">
                          {item.patientName}
                        </div>
                      </>
                    )}
                    <div className="w-[80px] py-[6px] px-[8px] text-center text-[13px] text-[#0b0b0b]">
                      {issuedByName}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FIXME: 알림 팝업 디자인 수정 필요 */}
      {/* 알림 팝업 */}
      <AlertDialog
        open={alertMessage !== null}
        onOpenChange={(open) => {
          if (!open) setAlertMessage(null);
        }}
      >
        <AlertDialogContent>
          <p className="py-4 text-center text-[14px] text-foreground">
            {alertMessage}
          </p>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction onClick={() => setAlertMessage(null)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveIssuedByName({
  hospitalId,
  issuedBy,
  getUserById,
}: {
  hospitalId: string | null;
  issuedBy: number;
  getUserById: (hospitalId: string, userId: number) => UserManager | undefined;
}) {
  const hasHospitalId = Boolean(hospitalId);
  const isValidIssuedBy = Number.isFinite(issuedBy);
  const canResolveIssuedBy = hasHospitalId && isValidIssuedBy;

  return canResolveIssuedBy && hospitalId ? getUserById(hospitalId, issuedBy)?.name ?? '-' : '-';
}

function buildFormIssuancesParams({
  historyType,
  dateFrom,
  dateTo,
  requiredPatientId,
  requiredFormId,
  searchPatientId,
  searchFormId,
}: {
  historyType: HistoryType;
  dateFrom: string;
  dateTo: string;
  requiredPatientId?: number;
  requiredFormId?: number;
  searchPatientId?: number;
  searchFormId?: number;
}) {
  const isPatientHistory = historyType === 'patient';

  if (isPatientHistory) {
    return {
      from: dateFrom,
      to: dateTo,
      patientId: requiredPatientId,
      formId: searchFormId,
    };
  }

  return {
    from: dateFrom,
    to: dateTo,
    formId: requiredFormId,
    patientId: searchPatientId,
  };
}
