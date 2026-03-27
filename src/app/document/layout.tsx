'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MySplitPane from '@/components/yjg/my-split-pane';
import { MyLoadingSpinner } from '@/components/yjg/my-loading-spinner';
import { DocumentProvider, useDocumentContext } from './_contexts/DocumentContext';
import DocumentLNB from './_components/DocumentLNB';
import DocumentRNB from './_components/DocumentRNB';
import DocumentCenter from './_components/DocumentCenter';
import DocumentToolbar from './_components/DocumentToolbar';
import DocumentPatientSearchBar from './_components/DocumentPatientSearchBar';
import { DocumentFormDirtyConfirmDialog } from './_components/DocumentFormDirtyConfirmDialog';
import { usePatient } from '@/hooks/patient/use-patient';
import { useEncounter } from '@/hooks/encounter/use-encounter';
import { useReceptionStore } from '@/store/common/reception-store';
import { useUserStore } from '@/store/user-store';
import { useHospitalStore } from '@/store/hospital-store';
import { useRegistrationsByHospital } from '@/hooks/registration/use-registrations-by-hospital';
import { 접수상태 } from '@/constants/common/common-enum';

function DocumentLayoutContent({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const {
    selectedFormId,
    setSelectedFormId,
    setSelectedPatient,
    setSelectedEncounter,
  } = useDocumentContext();

  const patientIdParam = searchParams?.get('patientId');
  const encounterIdParam = searchParams?.get('encounterId');
  const documentIdParam = searchParams?.get('documentId');

  const patientId = patientIdParam ? Number(patientIdParam) : 0;
  const { data: patientData, isLoading: isLoadingPatient } = usePatient(patientId);
  const { data: encounterData, isLoading: isLoadingEncounter } = useEncounter(encounterIdParam || '');

  // documentId가 있으면 서식 선택 (초기 로드 시에만, selectedFormId가 없을 때만)
  useEffect(function initializeFromUrl() {
    if (!searchParams || selectedFormId !== null) return;

    const documentId = searchParams.get('documentId');
    if (documentId) {
      const numericFormId = Number(documentId);
      const isValidFormId = Number.isFinite(numericFormId);
      if (isValidFormId) {
        setSelectedFormId(numericFormId);
      }
    }
  }, [searchParams, selectedFormId, setSelectedFormId]);

  // 환자 데이터 로드 후 자동 선택
  useEffect(function setPatientFromUrl() {
    if (patientData) {
      setSelectedPatient(patientData);
    }
  }, [patientData, setSelectedPatient]);

  // 내원이력 데이터 로드 후 자동 선택
  useEffect(function setEncounterFromUrl() {
    if (encounterData) {
      setSelectedEncounter(encounterData);
    }
  }, [encounterData, setSelectedEncounter]);

  // 차트 열린 환자 또는 진료중 환자 자동 선택 (URL 파라미터 없을 때)
  const { currentRegistration, registrations } = useReceptionStore();
  const { user } = useUserStore();
  const { hospital } = useHospitalStore();

  const hasStoreRegistrations = registrations.length > 0;
  const shouldFetchRegistrations = !hasStoreRegistrations && !patientIdParam;
  const { data: fetchedRegistrations } = useRegistrationsByHospital(
    shouldFetchRegistrations ? (hospital?.id?.toString() ?? '') : '',
  );

  const hasAutoSelectedRef = useRef(false);

  useEffect(function selectInTreatmentPatient() {
    if (hasAutoSelectedRef.current) return;
    if (patientIdParam) return;

    // 1차: currentRegistration(차트 열린 환자 또는 진료중 환자)이 있으면 바로 사용
    if (currentRegistration?.patient) {
      hasAutoSelectedRef.current = true;
      setSelectedPatient(currentRegistration.patient);
      return;
    }

    // 2차: registrations 목록에서 진료중 환자 검색
    const allRegistrations = hasStoreRegistrations
      ? registrations
      : (fetchedRegistrations ?? []);

    if (allRegistrations.length === 0) return;

    const inTreatmentReg = allRegistrations.find(
      (reg) => reg.updateId === user?.id && reg.status === 접수상태.진료중
    );

    if (inTreatmentReg?.patient) {
      hasAutoSelectedRef.current = true;
      setSelectedPatient(inTreatmentReg.patient);
      return;
    }

    // store 데이터에서도 못 찾으면 최종 잠금 (API 데이터만 있을 땐 store 대기)
    if (hasStoreRegistrations) {
      hasAutoSelectedRef.current = true;
    }
  }, [
    currentRegistration,
    registrations,
    fetchedRegistrations,
    hasStoreRegistrations,
    user?.id,
    patientIdParam,
    setSelectedPatient,
  ]);

  // URL 파라미터가 있고 로딩 중이면 로더 표시
  const hasUrlParams = !!(patientIdParam || encounterIdParam || documentIdParam);
  const isLoading = hasUrlParams && (isLoadingPatient || isLoadingEncounter);

  // ⚠️ [임시 코드] 불필요해질 경우 삭제 예정
  // next 서버에서 프린트 수행시 브라우저를 미리 launch하여 PDF 초기 생성 속도 향상하기 위한 코드
  // useEffect(function warmupBrowser() {
  //   // 페이지 진입 시 브라우저를 미리 launch하여 PDF 생성 속도 향상
  //   fetch('/api/printable-demo/pdf/warmup')
  //     .then((response) => {
  //       if (response.ok) {
  //         console.log('[Document] Browser warmup successful');
  //       } else {
  //         console.warn('[Document] Browser warmup failed:', response.status);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error('[Document] Browser warmup error:', error);
  //     });
  // }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <MyLoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      <MySplitPane
        splitPaneId="document-module-layout"
        isVertical={false}
        minPaneRatio={0.15}
        initialRatios={[0.2, 0.8]}
        panes={[
          <DocumentLNB key="lnb" />,
          <div className='w-full h-full flex flex-col' key="content">
            <DocumentPatientSearchBar />
            <DocumentToolbar />
            <div className="flex-1 overflow-hidden p-[8px]">
              <MySplitPane
                splitPaneId="document-inner-split"
                isVertical={false}
                minPaneRatio={0.18}
                initialRatios={[0.75, 0.25]}
                panes={[
                  <DocumentCenter key="center" />,
                  <DocumentRNB key="rnb" />
                ]} />
            </div>
          </div>
        ]}
      />
    </div>
  );
}

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocumentProvider>
      <Suspense fallback={
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
          <MyLoadingSpinner size="md" />
        </div>
      }>
        <DocumentLayoutContent>{children}</DocumentLayoutContent>
      </Suspense>
      <DocumentFormDirtyConfirmDialog />
    </DocumentProvider>
  );
}

