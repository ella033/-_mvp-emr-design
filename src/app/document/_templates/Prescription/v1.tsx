'use client';

import { useMemo } from 'react';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';
import { useDocumentContext } from '@/app/document/_contexts/DocumentContext';
import { getPrescriptionDetailType } from '@/types/master-data/item-type';
import { 처방상세구분 } from '@/types/master-data/item-type';
import { useDoctorsStore } from '@/store/doctors-store';
import { useHospitalStore } from '@/store/hospital-store';

// ── 스타일 상수 ──────────────────────────────────────────────
const STYLES = {
  headerSection: {
    textAlign: 'center' as const,
    marginBottom: '20px',
    borderBottom: '2px solid #000',
    paddingBottom: '10px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginBottom: '5px',
  },
  headerInfo: { fontSize: '10px', marginTop: '5px' },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: '1px solid #000',
    fontSize: '11px',
  },
  labelCell: {
    fontWeight: 'bold' as const,
    padding: '8px',
    borderRight: '1px solid #ddd',
  },
  valueCell: { padding: '8px' },
  th: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
    fontSize: '11px',
  },
  td: {
    border: '1px solid #000',
    padding: '8px',
    fontSize: '11px',
  },
  tdCenter: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'center' as const,
    fontSize: '11px',
  },
  sectionTitle: {
    fontWeight: 'bold' as const,
    marginBottom: '10px',
    fontSize: '12px',
    borderBottom: '1px solid #000',
    paddingBottom: '5px',
  },
  emptyMessage: {
    padding: '20px',
    textAlign: 'center' as const,
    border: '1px solid #ddd',
    color: '#666',
    fontSize: '11px',
  },
  footerSection: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    fontSize: '11px',
  },
} as const;

export function PrescriptionContent() {
  const {
    margin,
    setTotalPages,
    selectedEncounter,
    selectedPatient,
  } = useDocumentContext();
  const { doctors } = useDoctorsStore();
  const { hospital } = useHospitalStore();

  // 병원 정보
  const hospitalName = hospital?.name || '';
  const hospitalAddress =
    `${hospital?.address1 || ''} ${hospital?.address2 || ''}`.trim();
  const hospitalPhone = hospital?.phone || '';

  // 처방전에 표시할 약품만 필터링 (처방상세구분.약)
  const prescriptionOrders = useMemo(() => {
    if (!selectedEncounter?.orders) return [];
    return selectedEncounter.orders.filter(
      (order) => getPrescriptionDetailType(order.itemType) === 처방상세구분.약
    );
  }, [selectedEncounter]);

  // 의사 정보
  const doctor = useMemo(() => {
    if (!selectedEncounter?.doctorId) return null;
    return doctors.find((d) => d.id === selectedEncounter.doctorId);
  }, [selectedEncounter, doctors]);

  // 발급일자
  const issueDate = useMemo(() => {
    if (!selectedEncounter?.encounterDateTime) {
      return new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
    const date = new Date(selectedEncounter.encounterDateTime);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, [selectedEncounter]);

  // 환자 생년월일 포맷팅
  const patientBirthDate = useMemo(() => {
    if (!selectedPatient?.birthDate) return '';
    const date = new Date(selectedPatient.birthDate);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, [selectedPatient]);

  // 환자 성별 표시
  const patientGender = useMemo(() => {
    if (selectedPatient?.gender === 1) return '남';
    if (selectedPatient?.gender === 2) return '여';
    return '';
  }, [selectedPatient]);

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      <PrintableDocument
        paper={PAPER_SIZES.A4}
        margin={{ top: margin, bottom: margin, left: margin, right: margin }}
        onPageCountChange={setTotalPages}
        observeDependencies={[margin, prescriptionOrders, selectedPatient, selectedEncounter]}
      >
        {/* 병원 정보 헤더 */}
        <section style={STYLES.headerSection}>
          <h1 style={STYLES.headerTitle}>
            원외 처방전
          </h1>
          <div style={STYLES.headerInfo}>
            <div>{hospitalName}</div>
            <div>{hospitalAddress}</div>
            {hospitalPhone && <div>TEL: {hospitalPhone}</div>}
          </div>
        </section>

        {/* 환자 정보 */}
        <section style={{ marginBottom: '20px' }}>
          <table style={STYLES.table}>
            <tbody>
              <tr>
                <td
                  style={{
                    width: '15%',
                    ...STYLES.labelCell,
                  }}
                >
                  성명
                </td>
                <td style={{ width: '25%', ...STYLES.valueCell }}>
                  {selectedPatient?.name || ''}
                </td>
                <td
                  style={{
                    width: '15%',
                    ...STYLES.labelCell,
                    borderLeft: '1px solid #ddd',
                  }}
                >
                  성별
                </td>
                <td style={{ width: '15%', ...STYLES.valueCell }}>
                  {patientGender}
                </td>
                <td
                  style={{
                    width: '15%',
                    fontWeight: 'bold',
                    padding: '8px',
                    borderLeft: '1px solid #ddd',
                  }}
                >
                  생년월일
                </td>
                <td style={{ width: '15%', ...STYLES.valueCell }}>
                  {patientBirthDate}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    ...STYLES.labelCell,
                    borderTop: '1px solid #ddd',
                  }}
                >
                  주소
                </td>
                <td
                  colSpan={5}
                  style={{
                    ...STYLES.valueCell,
                    borderTop: '1px solid #ddd',
                  }}
                >
                  {selectedPatient?.address1 || ''} {selectedPatient?.address2 || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 처방 내용 */}
        <section style={{ marginBottom: '20px' }}>
          <div style={STYLES.sectionTitle}>
            처방 내용
          </div>
          {prescriptionOrders.length > 0 ? (
            <table style={STYLES.table}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={STYLES.th}>약품명</th>
                  <th style={STYLES.th}>용법</th>
                  <th style={STYLES.th}>용량</th>
                  <th style={STYLES.th}>일수</th>
                  <th style={STYLES.th}>횟수</th>
                </tr>
              </thead>
              <tbody>
                {prescriptionOrders.map((order, index) => (
                  <tr key={order.id || index}>
                    <td style={STYLES.td}>
                      {order.name}
                    </td>
                    <td style={STYLES.td}>
                      {order.usage || '-'}
                    </td>
                    <td style={STYLES.tdCenter}>
                      {order.dose || '-'}
                    </td>
                    <td style={STYLES.tdCenter}>
                      {order.days || '-'}일
                    </td>
                    <td style={STYLES.tdCenter}>
                      {order.times || '-'}회
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={STYLES.emptyMessage}>
              처방된 약품이 없습니다.
            </div>
          )}
        </section>

        {/* 하단 정보 */}
        <section style={STYLES.footerSection}>
          <div>
            <div>발급일자: {issueDate}</div>
            <div style={{ marginTop: '20px', fontSize: '10px' }}>
              <div>※ 본 처방전은 발급일로부터 7일 이내에 조제하여야 합니다.</div>
              <div>※ 처방전에 기재된 약품은 의사의 지시에 따라 복용하시기 바랍니다.</div>
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              minWidth: '150px',
            }}
          >
            <div
              style={{
                borderTop: '1px solid #000',
                paddingTop: '5px',
                marginBottom: '5px',
                fontSize: '11px',
              }}
            >
              처방의
            </div>
            <div
              style={{
                marginTop: '30px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {doctor?.name || '의사'}
            </div>
            <div style={{ fontSize: '10px', marginTop: '5px' }}>
              (서명)
            </div>
          </div>
        </section>
      </PrintableDocument>
    </div>
  );
}
