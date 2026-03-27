'use client';

import { useMemo } from 'react';
import { PrintableDocument, PAPER_SIZES, renderHtmlBlocks } from '@/lib/printable';
import { useDoctorsStore } from '@/store/doctors-store';
import { useHospitalStore } from '@/store/hospital-store';
import { useHospitalImages } from '@/hooks/hospital/use-hospital-images';
import { formatPhoneNumber } from '@/lib/patient-utils';
import { MedicalRecordCopyProps } from './types';
import { transformToMedicalRecordCopyData } from './utils';
import '@/components/yjg/my-tiptap-editor/my-tiptap-editor.scss';

export function MedicalRecordCopy({
  patient,
  encounters,
  margin = 15,
  onPageCountChange
}: MedicalRecordCopyProps) {
  const { doctors } = useDoctorsStore();
  const { hospital: hospitalInfo } = useHospitalStore();
  const { sealImage } = useHospitalImages();

  const data = useMemo(() =>
    transformToMedicalRecordCopyData({
      patient,
      encounters,
      hospitalInfo,
      doctors,
    }),
    [patient, encounters, hospitalInfo, doctors]
  );

  const resolvedEncounters = data.encounters;
  const patientData = data.patient;
  const hospitalData = data.hospital;

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
    padding: '2px 9px',
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
      onPageCountChange={onPageCountChange}
      observeDependencies={[margin, data]}
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
              <td style={{ ...TABLE_CELL_BASE, width: '18%' }}>{patientData.chartNumber}</td>
              <td style={{ ...TABLE_HEADER_CELL, width: '16%' }}>휴대폰번호</td>
              <td style={{ ...TABLE_CELL_BASE }}>{patientData.phone}</td>
            </tr>
            <tr>
              <td style={TABLE_HEADER_CELL}>수진자명</td>
              <td style={TABLE_CELL_BASE} colSpan={3}>{patientData.name}</td>
            </tr>
            <tr>
              <td style={TABLE_HEADER_CELL}>주민등록번호</td>
              <td style={TABLE_CELL_BASE}>{patientData.rrn}</td>
              <td style={TABLE_HEADER_CELL}>나이/성별</td>
              <td style={TABLE_CELL_BASE}>{patientData.age && patientData.gender ? `${patientData.age}/${patientData.gender}` : ''}</td>
            </tr>
            <tr>
              <td style={TABLE_HEADER_CELL}>주소</td>
              <td style={TABLE_CELL_BASE} colSpan={3}>{patientData.address}</td>
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

        /* 상병 섹션 (데이터가 있을 때만 렌더링) */
        ...(encounter.diagnoses && encounter.diagnoses.length > 0 ? [
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
                {encounter.diagnoses.map((diagnosis, idx) => (
                  <tr key={`${diagnosis.code}-${idx}`}>
                    <td style={TABLE_CELL_BASE}>{diagnosis.code}</td>
                    <td style={TABLE_CELL_BASE}>{diagnosis.name}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{diagnosis.isPrimary ? '✓' : ''}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{diagnosis.isSecondary ? '✓' : ''}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{diagnosis.isExcluded ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ] : []),

        /* 처방 섹션 (데이터가 있을 때만 렌더링) */
        ...(encounter.orders && encounter.orders.length > 0 ? [
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
                {encounter.orders.map((order, idx) => (
                  <tr key={`${order.claimCode}-${idx}`}>
                    <td style={TABLE_CELL_BASE}>{order.claimCode}</td>
                    <td style={TABLE_CELL_BASE}>{order.name}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{order.dose}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{order.timesPerDay}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{order.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ] : []),

        /* 검사 섹션 - 데이터가 있을 때만 렌더링 */
        ...(encounter.exams && encounter.exams.length > 0 ? [
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
                {encounter.exams.map((exam, idx) => (
                  <tr key={`${exam.claimCode}-${idx}`}>
                    <td style={TABLE_CELL_BASE}>{exam.claimCode}</td>
                    <td style={TABLE_CELL_BASE}>{exam.name}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{exam.referenceValue}</td>
                    <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{exam.resultValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>,
        ] : []),

        /* 증상 섹션 - 데이터가 있을 때만 렌더링 */
        ...(encounter.symptomText ? [
          <div key={`${encounter.encounterId}-symptoms-title`} style={SECTION_TITLE_STYLE}>증상</div>,
          ...renderHtmlBlocks({
            html: encounter.symptomText,
            keyPrefix: `${encounter.encounterId}-symptoms`,
            borderColor: COLORS.BORDER,
            style: BASE_TEXT_STYLE,
          }),
        ] : []),

        // [임시 처리] 바이탈(신체계측) 섹션은 현재 사용하지 않으므로 전체 주석 처리함.
        /*
        ...(encounter.vitals ? [
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
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.systolicBp}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.diastolicBp}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.pulse}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.bloodSugar}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.weight}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.height}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.bmi}</td>
                  <td style={{ ...TABLE_CELL_BASE, textAlign: 'center' }}>{encounter.vitals.temperature}</td>
                </tr>
              </tbody>
            </table>
          </section>,
        ] : []),
        */
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
          <div>의료기관명: {hospitalData.name}</div>
          <div>의료기관 주소: {hospitalData.address}</div>
          <div>의료기관 전화번호: {formatPhoneNumber(hospitalData.phone)}</div>
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
