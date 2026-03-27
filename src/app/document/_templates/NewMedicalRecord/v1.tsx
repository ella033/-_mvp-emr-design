'use client';

/**
 * @deprecated
 * 이 파일은 DocumentCenter(편집/발급 시스템)에 종속된 레거시 서식입니다.
 * '차트 출력'과 같이 즉시 출력이 필요한 경우 src/app/document/_reception_templates/MedicalRecordCopy 하위의 컴포넌트를 사용하십시오.
 * DocumentCenter의 신규 발급 로직이 전환 완료되면 이 파일은 삭제될 예정입니다.
 */
import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';
import { useDocumentContext } from '@/app/document/_contexts/DocumentContext';
import { useDoctorsStore } from '@/store/doctors-store';
import { useHospitalStore } from '@/store/hospital-store';
import { useHospitalImages } from '@/hooks/hospital/use-hospital-images';
import DOMPurify from 'dompurify';
import { formatDate } from '@/lib/date-utils';
import { formatPhoneNumber, getAgeOrMonth } from '@/lib/patient-utils';
import { formatRrnNumber, getUdeptDetailToUdept } from '@/lib/common-utils';
import { 보험구분Label } from "@/constants/common/common-enum";
import { InputType } from '@/types/chart/order-types';
import { getPrescriptionDetailType, 처방상세구분 } from '@/types/master-data/item-type';

type NewMedicalRecordSnapshot = {
  patient: {
    id: number | null;
    chartNumber: string;
    name: string;
    rrn: string;
    age: string;
    gender: string;
    phone: string;
    address: string;
  };
  hospital: {
    name: string;
    address: string;
    phone: string;
  };
  encounters: Array<{
    encounterId: string;
    visitDate: string;
    visitTime: string;
    visitType: string;
    insuranceType: string;
    doctorName: string;
    department: string;
    diagnoses: Array<{
      code: string;
      name: string;
      isPrimary: boolean;
      isSecondary: boolean;
      isExcluded: boolean;
    }>;
    orders: Array<{
      claimCode: string;
      name: string;
      dose: string;
      timesPerDay: string;
      days: string;
    }>;
    exams: Array<{
      claimCode: string;
      name: string;
      referenceValue: string;
      resultValue: string;
    }>;
    symptomText: string;
    vitals: {
      systolicBp: string;
      diastolicBp: string;
      pulse: string;
      bloodSugar: string;
      weight: string;
      height: string;
      bmi: string;
      temperature: string;
    };
  }>;
};

export function NewMedicalRecordContent() {
  const {
    margin,
    setTotalPages,
    selectedEncounter,
    selectedPatient,
    appliedEncounters,
    formBaselineRef,
    formMode,
    loadedIssuance,
  } = useDocumentContext();
  const { doctors } = useDoctorsStore();
  const { hospital: hospitalInfo } = useHospitalStore();
  const { sealImage } = useHospitalImages();

  const form = useFormContext<Record<string, unknown>>();
  const { reset } = form;

  const snapshot = useWatch() as unknown as NewMedicalRecordSnapshot | undefined;

  const encountersToRender = useMemo(() => {
    const hasAppliedEncounters = appliedEncounters.length > 0;
    if (hasAppliedEncounters) {
      return appliedEncounters;
    }

    const hasSelectedEncounter = Boolean(selectedEncounter);
    if (hasSelectedEncounter && selectedEncounter) {
      return [selectedEncounter];
    }

    return [];
  }, [appliedEncounters, selectedEncounter]);

  const doctorsById = useMemo(() => {
    const map = new Map<any, { id: any; name?: string }>();
    doctors.forEach((doctor) => {
      map.set(doctor.id, doctor);
    });
    return map;
  }, [doctors]);

  useEffect(function syncSnapshotForEditMode() {
    const isViewMode = formMode === 'view';
    if (isViewMode) return;

    const hasLoadedIssuance = Boolean(loadedIssuance?.issuanceId);
    if (hasLoadedIssuance) return;

    const patientId = selectedPatient?.id;
    const hasPatientId = typeof patientId === 'number' && patientId > 0;

    const currentSnapshot = (snapshot && typeof snapshot === 'object')
      ? (snapshot as any)
      : null;

    const nextEncounterIds = encountersToRender.map((encounter) => String(encounter.id));
    const currentEncounterIds: string[] = Array.isArray(currentSnapshot?.encounters)
      ? currentSnapshot.encounters.map((encounter: any) => String(encounter?.encounterId ?? ''))
      : [];

    const nextPatientId = hasPatientId ? patientId : null;
    const currentPatientId = currentSnapshot?.patient?.id ?? null;

    const isSamePatientId = currentPatientId === nextPatientId;
    const isSameEncounterIds =
      currentEncounterIds.length === nextEncounterIds.length &&
      currentEncounterIds.every((id, index) => id === nextEncounterIds[index]);

    if (isSamePatientId && isSameEncounterIds) {
      return;
    }

    const age = getAgeOrMonth(selectedPatient?.birthDate);
    const genderText = selectedPatient?.gender === 1 ? '남' : selectedPatient?.gender === 2 ? '여' : '';
    const rrn = formatRrnNumber(selectedPatient?.rrn);

    const nextSnapshot: NewMedicalRecordSnapshot = {
      patient: {
        id: hasPatientId ? patientId : null,
        chartNumber: String(selectedPatient?.id ?? ''),
        name: selectedPatient?.name ?? '',
        rrn,
        age: age ? `${age}` : '',
        gender: genderText,
        phone: formatPhoneNumber(selectedPatient?.phone1 ?? selectedPatient?.phone2 ?? ''),
        address: `${selectedPatient?.address1 ?? ''} ${selectedPatient?.address2 ?? ''}`.trim(),
      },
      hospital: {
        name: hospitalInfo?.name ?? '',
        address: `${hospitalInfo?.address1 ?? ''} ${hospitalInfo?.address2 ?? ''}`.trim(),
        phone: hospitalInfo?.phone ?? '',
      },
      encounters: encountersToRender.map((encounter) => {
        const dateTime = new Date(String(encounter?.encounterDateTime ?? ''));
        const isValidDate = !Number.isNaN(dateTime.getTime());
        const visitDate = isValidDate ? formatDate(encounter?.encounterDateTime, '-') : '';
        const visitTime = isValidDate ? dateTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
        const doctorName = doctorsById.get(encounter?.doctorId)?.name ?? '';

        const diagnoses = ((encounter?.diseases ?? []) as any[]).map((disease, idx) => ({
          code: String(disease?.code ?? ''),
          name: String(disease?.name ?? ''),
          isPrimary: idx === 0,
          isSecondary: idx > 0,
          isExcluded: false,
        }));

        // 구분선, 묶음헤더는 제외하고 실제 처방만 표시 (묶음 풀어서 단일 처방처럼 표현)
        const excludedInputTypes = [InputType.구분선, InputType.묶음헤더];
        const isActualPrescription = (order: any) =>
          !excludedInputTypes.includes(order?.inputType);
        const orders = ((encounter?.orders ?? []) as any[])
          .filter(isActualPrescription)
          .map((order) => ({
            claimCode: String(order?.claimCode ?? ''),
            name: String(order?.name ?? ''),
            dose: String(order?.dose ?? '-'),
            timesPerDay: String(order?.times ?? '-'),
            days: String(order?.days ?? '-'),
          }));

        const exams = ((encounter?.orders ?? []) as any[])
          .filter(isActualPrescription)
          .filter(order => getPrescriptionDetailType(order.itemType) === 처방상세구분.검사)
          .map((order) => {
            // 검사 결과값 및 참고치는 specimenDetail 등에서 가져올 수 있으나, 
            // 현재 Order 구조에 따라 간단히 매핑 (실제 데이터 위치에 따라 추후 보완 가능)
            const firstSpecimen = order?.specimenDetail?.[0];
            return {
              claimCode: String(order?.claimCode ?? ''),
              name: String(order?.name ?? ''),
              referenceValue: String(firstSpecimen?.referenceRange ?? '-'),
              resultValue: String(firstSpecimen?.resultValue ?? '-'),
            };
          });

        const symptomText = (() => {
          const raw = encounter?.symptom;
          const hasSymptom = typeof raw === 'string' && raw.length > 0;
          if (!hasSymptom) return '';
          return DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] });
        })();

        const encounterAny = encounter as any;
        const vitals = encounterAny?.vitals ?? {};
        const receptionType = encounter?.receptionType ?? encounter?.registration?.receptionType;
        const insuranceType = encounter?.registration?.insuranceType;

        return {
          encounterId: String(encounter.id),
          visitDate,
          visitTime,
          visitType: receptionType === 1 ? '초진' : '재진',
          insuranceType: insuranceType ? 보험구분Label[getUdeptDetailToUdept(insuranceType)] : "알 수 없음",
          doctorName,
          department: encounterAny?.departmentName ?? '내과',
          diagnoses,
          orders,
          exams,
          symptomText,
          vitals: {
            systolicBp: String(vitals?.systolicBp ?? vitals?.sbp ?? '-'),
            diastolicBp: String(vitals?.diastolicBp ?? vitals?.dbp ?? '-'),
            pulse: String(vitals?.pulse ?? vitals?.pr ?? '-'),
            bloodSugar: String(vitals?.bloodSugar ?? vitals?.bs ?? '-'),
            weight: String(vitals?.weight ?? vitals?.wt ?? '-'),
            height: String(vitals?.height ?? vitals?.ht ?? '-'),
            bmi: String(vitals?.bmi ?? '-'),
            temperature: String(vitals?.temperature ?? vitals?.bt ?? '-'),
          },
        };
      }),
    };

    reset(nextSnapshot as unknown as Record<string, unknown>);
    formBaselineRef.current = nextSnapshot as unknown as Record<string, unknown>;
  }, [
    doctorsById,
    encountersToRender,
    formBaselineRef,
    formMode,
    hospitalInfo,
    loadedIssuance?.issuanceId,
    snapshot,
    selectedPatient,
    reset,
  ]);

  const resolvedEncounters = snapshot?.encounters ?? [];
  const patient = snapshot?.patient;
  const hospital = snapshot?.hospital;

  // 피그마 디자인 기준 스타일 상수
  const COLORS = {
    BORDER: '#99a1af',
    HEADER_BG: '#f3f4f6',
    TEXT_MAIN: '#0a0a0a',
    TEXT_SUB: '#6a7282',
    STAMP: '#e7000b',
    TITLE_BORDER: '#1e2939',
  };

  const FONT_SIZES = {
    MAIN_TITLE: '16px',
    SECTION_TITLE: '11px',
    TABLE_HEADER: '10.5px',
    TABLE_CONTENT: '10.5px',
    VITAL_UNIT: '10px',
    HOSPITAL_INFO: '13px',
    STAMP_MAIN: '14px',
    STAMP_SUB: '12px',
  };

  const BASE_TEXT_STYLE = {
    fontSize: FONT_SIZES.TABLE_CONTENT,
    lineHeight: '20px',
    color: COLORS.TEXT_MAIN,
  };

  const TABLE_CELL_BASE = {
    border: `1px solid ${COLORS.BORDER}`,
    padding: '2px 9px', // 피그마의 여백을 반영하여 조정
    fontSize: FONT_SIZES.TABLE_CONTENT,
    lineHeight: '20px',
  };

  const TABLE_HEADER_CELL = {
    ...TABLE_CELL_BASE,
    backgroundColor: COLORS.HEADER_BG,
    fontWeight: 'normal',
  };

  const SECTION_TITLE_STYLE = {
    ...BASE_TEXT_STYLE,
    fontWeight: 600,
    fontSize: FONT_SIZES.SECTION_TITLE,
    marginBottom: '4px',
  };

  return (
    <PrintableDocument
      paper={PAPER_SIZES.A4}
      margin={{ top: margin, bottom: margin, left: margin, right: margin }}
      onPageCountChange={setTotalPages}
      observeDependencies={[margin, snapshot]}
    >
      {/* 문서 제목 */}
      <section
        style={{
          textAlign: 'center',
          marginBottom: '16px',
          borderBottom: `1px solid ${COLORS.TITLE_BORDER}`,
          paddingBottom: '8px',
          ...BASE_TEXT_STYLE,
        }}
      >
        <h1
          style={{
            fontSize: FONT_SIZES.MAIN_TITLE,
            fontWeight: 600,
            margin: 0,
          }}
        >
          진료기록 사본
        </h1>
      </section>

      {/* 환자정보 */}
      <section style={{ marginBottom: '16px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: `1px solid ${COLORS.BORDER}`,
            borderRadius: '3px',
            ...BASE_TEXT_STYLE,
          }}
        >
          <tbody>
            <tr>
              <td style={{ ...TABLE_HEADER_CELL, width: '16%' }}>차트번호</td>
              <td style={{ ...TABLE_CELL_BASE, width: '18%' }}>{patient?.chartNumber ?? ''}</td>
              <td style={{ ...TABLE_HEADER_CELL, width: '16%' }}>휴대폰번호</td>
              <td style={{ ...TABLE_CELL_BASE }}>{patient?.phone ?? ''}</td>
            </tr>
            <tr>
              <td style={TABLE_HEADER_CELL}>수진자명</td>
              <td style={TABLE_CELL_BASE} colSpan={3}>{patient?.name ?? ''}</td>
            </tr>
            <tr>
              <td style={TABLE_HEADER_CELL}>주민등록번호</td>
              <td style={TABLE_CELL_BASE}>{patient?.rrn ?? ''}</td>
              <td style={TABLE_HEADER_CELL}>나이/성별</td>
              <td style={TABLE_CELL_BASE}>{patient?.age && patient?.gender ? `${patient.age}/${patient.gender}` : ''}</td>
            </tr>
            <tr>
              <td style={TABLE_HEADER_CELL}>주소</td>
              <td style={TABLE_CELL_BASE} colSpan={3}>{patient?.address ?? ''}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {resolvedEncounters.flatMap((encounter, index) => [
        /* 내원정보 섹션 (타이틀 + 테이블) */
        <section key={`${encounter.encounterId}-visit`} style={{ marginTop: index > 0 ? '20px' : '0', marginBottom: '8px' }}>
          <div style={{ ...SECTION_TITLE_STYLE, fontSize: '12px' }}>내원정보</div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${COLORS.BORDER}`,
              borderRadius: '3px',
              ...BASE_TEXT_STYLE,
            }}
          >
            <tbody>
              <tr>
                <td style={{ ...TABLE_HEADER_CELL, width: '11%' }}>진료일자</td>
                <td style={{ ...TABLE_CELL_BASE, width: '14%' }}>{encounter.visitDate}</td>
                <td style={{ ...TABLE_HEADER_CELL, width: '11%' }}>진료시간</td>
                <td style={{ ...TABLE_CELL_BASE, width: '10%' }}>{encounter.visitTime}</td>
                <td style={{ ...TABLE_HEADER_CELL, width: '11%' }}>초/재진</td>
                <td style={{ ...TABLE_CELL_BASE, width: '10%' }}>{encounter.visitType}</td>
                <td style={{ ...TABLE_HEADER_CELL, width: '11%' }}>보험구분</td>
                <td style={{ ...TABLE_CELL_BASE }}>{encounter.insuranceType}</td>
              </tr>
              <tr>
                <td style={TABLE_HEADER_CELL}>진료의</td>
                <td style={TABLE_CELL_BASE}>{encounter.doctorName}</td>
                <td style={TABLE_HEADER_CELL}>진료과목</td>
                <td style={TABLE_CELL_BASE}>{encounter.department}</td>
                <td colSpan={4} style={{ ...TABLE_CELL_BASE, borderLeft: 'none' }}></td>
              </tr>
            </tbody>
          </table>
        </section>,

        /* 상병 섹션 (타이틀 + 테이블) */
        <section key={`${encounter.encounterId}-diagnoses`} style={{ marginBottom: '8px' }}>
          <div style={SECTION_TITLE_STYLE}>상병</div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${COLORS.BORDER}`,
              ...BASE_TEXT_STYLE,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...TABLE_HEADER_CELL, width: '15%', textAlign: 'left' }}>상병코드</th>
                <th style={{ ...TABLE_HEADER_CELL, textAlign: 'left' }}>상병명</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '8%', textAlign: 'center' }}>주상병</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '8%', textAlign: 'center' }}>부상병</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '10%', textAlign: 'center' }}>배제상병</th>
              </tr>
            </thead>
            <tbody>
              {encounter.diagnoses.length > 0 ? (
                encounter.diagnoses.map((diagnosis, idx) => (
                  <tr key={`${diagnosis.code}-${idx}`}>
                    <td style={TABLE_CELL_BASE}>{diagnosis.code}</td>
                    <td style={TABLE_CELL_BASE}>{diagnosis.name}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{diagnosis.isPrimary ? '✓' : ''}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{diagnosis.isSecondary ? '✓' : ''}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{diagnosis.isExcluded ? '✓' : ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ ...TABLE_CELL_BASE, textAlign: 'center', color: '#666' }}>
                    상병 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>,

        /* 처방 섹션 (타이틀 + 테이블) */
        <section key={`${encounter.encounterId}-orders`} style={{ marginBottom: '8px' }}>
          <div style={SECTION_TITLE_STYLE}>처방</div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${COLORS.BORDER}`,
              ...BASE_TEXT_STYLE,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...TABLE_HEADER_CELL, width: '17%', textAlign: 'left' }}>청구코드</th>
                <th style={{ ...TABLE_HEADER_CELL, textAlign: 'left' }}>명칭</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '8%', textAlign: 'center' }}>용량</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '8%', textAlign: 'center' }}>일투수</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '8%', textAlign: 'center' }}>일수</th>
              </tr>
            </thead>
            <tbody>
              {encounter.orders.length > 0 ? (
                encounter.orders.map((order, idx) => (
                  <tr key={`${order.claimCode}-${idx}`}>
                    <td style={TABLE_CELL_BASE}>{order.claimCode}</td>
                    <td style={TABLE_CELL_BASE}>{order.name}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{order.dose}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{order.timesPerDay}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{order.days}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ ...TABLE_CELL_BASE, textAlign: 'center', color: '#666' }}>
                    처방 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>,

        /* 검사 섹션 (타이틀 + 테이블) */
        <section key={`${encounter.encounterId}-exams`} style={{ marginBottom: '8px' }}>
          <div style={SECTION_TITLE_STYLE}>검사</div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${COLORS.BORDER}`,
              ...BASE_TEXT_STYLE,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...TABLE_HEADER_CELL, width: '17%', textAlign: 'left' }}>청구코드</th>
                <th style={{ ...TABLE_HEADER_CELL, textAlign: 'left' }}>명칭</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '15%', textAlign: 'center' }}>참고치</th>
                <th style={{ ...TABLE_HEADER_CELL, width: '15%', textAlign: 'center' }}>결과</th>
              </tr>
            </thead>
            <tbody>
              {encounter.exams && encounter.exams.length > 0 ? (
                encounter.exams.map((exam, idx) => (
                  <tr key={`${exam.claimCode}-${idx}`}>
                    <td style={TABLE_CELL_BASE}>{exam.claimCode}</td>
                    <td style={TABLE_CELL_BASE}>{exam.name}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{exam.referenceValue}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{exam.resultValue}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ ...TABLE_CELL_BASE, textAlign: 'center', color: '#666' }}>
                    검사 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>,

        /* 증상 섹션 (타이틀 + 내용) */
        <section key={`${encounter.encounterId}-symptoms`} style={{ marginBottom: '8px' }}>
          <div style={SECTION_TITLE_STYLE}>증상</div>
          <div
            style={{
              border: `1px solid ${COLORS.BORDER}`,
              padding: '4px 8px',
              minHeight: '40px',
              whiteSpace: 'pre-wrap',
              ...BASE_TEXT_STYLE,
            }}
          >
            {encounter.symptomText || '증상 정보가 없습니다.'}
          </div>
        </section>,

        /* 바이탈 섹션 (타이틀 + 테이블) */
        <section key={`${encounter.encounterId}-vitals`} style={{ marginBottom: '16px' }}>
          <div style={SECTION_TITLE_STYLE}>바이탈</div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${COLORS.BORDER}`,
              ...BASE_TEXT_STYLE,
            }}
          >
            <thead>
              <tr>
                {[
                  { label: '수축기 혈압', unit: 'mmHg' },
                  { label: '이완기 혈압', unit: 'mmHg' },
                  { label: '맥박', unit: 'bpm' },
                  { label: '혈당', unit: 'mg/dL' },
                  { label: '체중', unit: 'kg' },
                  { label: '신장', unit: 'cm' },
                  { label: 'BMI', unit: 'kg/m2' },
                  { label: '체온', unit: '℃' },
                ].map((item, idx) => (
                  <th key={idx} style={{ ...TABLE_HEADER_CELL, textAlign: 'center', width: '12.5%' }}>
                    <div>{item.label}</div>
                    <div style={{ fontSize: FONT_SIZES.VITAL_UNIT, color: COLORS.TEXT_SUB, fontWeight: 'bold' }}>{item.unit}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.systolicBp}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.diastolicBp}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.pulse}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.bloodSugar}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.weight}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.height}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.bmi}</td>
                <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter?.vitals?.temperature}</td>
              </tr>
            </tbody>
          </table>
        </section>,
      ])}

      {/* 하단 병원 정보 */}
      <section
        style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          ...BASE_TEXT_STYLE,
        }}
      >
        <div style={{ fontSize: FONT_SIZES.HOSPITAL_INFO, lineHeight: '22px' }}>
          <div>의료기관명: {hospital?.name ?? ''}</div>
          <div>의료기관 주소: {hospital?.address ?? ''}</div>
          <div>의료기관 전화번호: {formatPhoneNumber(hospital?.phone ?? '')}</div>
        </div>
        {sealImage && (
          <img
            src={sealImage}
            alt="병원직인"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
            }}
          />
        )}
      </section>
    </PrintableDocument>
  );
}

