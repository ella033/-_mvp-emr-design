'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';
import { useDocumentContext } from '@/app/document/_contexts/DocumentContext';
import { useDoctorsStore } from '@/store/doctors-store';
import DOMPurify from 'dompurify';
import { formatDate } from '@/lib/date-utils';

type MedicalRecordSnapshot = {
  patient: {
    id: number | null;
    name: string;
    gender: string;
    birthDate: string;
    address: string;
  };
  encounters: Array<{
    encounterId: string;
    visitDate: string;
    doctorName: string;
    diagnoses: Array<{ code: string; name: string }>;
    orders: Array<{
      name: string;
      usage: string;
      dose: string;
      days: string;
      times: string;
    }>;
    symptomText: string;
  }>;
};

export function MedicalRecordContent() {
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

  const form = useFormContext<Record<string, unknown>>();
  const { reset } = form;

  // NOTE: medicalRecordSnapshot key 없이, form root 값 자체를 snapshot으로 사용합니다.
  const snapshot = useWatch() as unknown as MedicalRecordSnapshot | undefined;

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

    const nextSnapshot: MedicalRecordSnapshot = {
      patient: {
        id: hasPatientId ? patientId : null,
        name: selectedPatient?.name ?? '',
        gender:
          selectedPatient?.gender === 1 ? '남' : selectedPatient?.gender === 2 ? '여' : '',
        birthDate: formatDate(selectedPatient?.birthDate, '.'),
        address: `${selectedPatient?.address1 ?? ''} ${selectedPatient?.address2 ?? ''}`.trim(),
      },
      encounters: encountersToRender.map((encounter) => {
        const visitDate = formatEncounterDateTime(encounter?.encounterDateTime);
        const doctorName = doctorsById.get(encounter?.doctorId)?.name ?? '';

        const diagnoses = ((encounter?.diseases ?? []) as any[]).map((disease) => ({
          code: String(disease?.code ?? ''),
          name: String(disease?.name ?? ''),
        }));

        const orders = ((encounter?.orders ?? []) as any[]).map((order) => ({
          name: String(order?.name ?? ''),
          usage: String(order?.usage ?? '-'),
          dose: String(order?.dose ?? '-'),
          days: String(order?.days ?? '-'),
          times: String(order?.times ?? '-'),
        }));

        const symptomText = (() => {
          const raw = encounter?.symptom;
          const hasSymptom = typeof raw === 'string' && raw.length > 0;
          if (!hasSymptom) return '';
          return DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] });
        })();

        return {
          encounterId: String(encounter.id),
          visitDate,
          doctorName,
          diagnoses,
          orders,
          symptomText,
        };
      }),
    };

    // NOTE: 최초 신규발급에서는 encounter/patient로 snapshot 생성 후, 그 snapshot만으로 렌더링합니다.
    // 발급이력 조회 시에는 DocumentFormHost가 reset으로 이미 snapshot을 넣어줍니다.
    reset(nextSnapshot as unknown as Record<string, unknown>);
    formBaselineRef.current = nextSnapshot as unknown as Record<string, unknown>;
  }, [
    doctorsById,
    encountersToRender,
    formBaselineRef,
    formMode,
    loadedIssuance?.issuanceId,
    snapshot,
    selectedPatient,
    reset,
  ]);
  const resolvedEncounters = snapshot?.encounters ?? [];

  return (
    <PrintableDocument
      paper={PAPER_SIZES.A4}
      margin={{ top: margin, bottom: margin, left: margin, right: margin }}
      onPageCountChange={setTotalPages}
      observeDependencies={[margin, snapshot]}
    >
      {/* 병원 정보 헤더 */}
      <section
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #000',
          paddingBottom: '10px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '5px',
          }}
        >
          진료기록사본
        </h1>
        {/* <div style={{ fontSize: '10px', marginTop: '5px' }}>
            <div>의사랑의원</div>
            <div>서울특별시 강남구 테헤란로 123</div>
            <div>TEL: 02-1234-5678</div>
          </div> */}
      </section>

      {/* 환자 정보 */}
      <section style={{ marginBottom: '20px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: '12%',
                  fontWeight: 'bold',
                  padding: '8px',
                  borderRight: '1px solid #ddd',
                  backgroundColor: '#f5f5f5',
                }}
              >
                성명
              </td>
              <td style={{ width: '20%', padding: '8px' }}>
                {snapshot?.patient?.name ?? ''}
              </td>
              <td
                style={{
                  width: '12%',
                  fontWeight: 'bold',
                  padding: '8px',
                  borderRight: '1px solid #ddd',
                  borderLeft: '1px solid #ddd',
                  backgroundColor: '#f5f5f5',
                }}
              >
                성별
              </td>
              <td style={{ width: '12%', padding: '8px' }}>
                {snapshot?.patient?.gender ?? ''}
              </td>
              <td
                style={{
                  width: '12%',
                  fontWeight: 'bold',
                  padding: '8px',
                  borderLeft: '1px solid #ddd',
                  backgroundColor: '#f5f5f5',
                }}
              >
                생년월일
              </td>
              <td style={{ width: '32%', padding: '8px' }}>
                {snapshot?.patient?.birthDate ?? ''}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  fontWeight: 'bold',
                  padding: '8px',
                  borderRight: '1px solid #ddd',
                  borderTop: '1px solid #ddd',
                  backgroundColor: '#f5f5f5',
                }}
              >
                주소
              </td>
              <td
                colSpan={5}
                style={{
                  padding: '8px',
                  borderTop: '1px solid #ddd',
                }}
              >
                {snapshot?.patient?.address ?? ''}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {resolvedEncounters.flatMap((encounter, index) => {
        const isFirst = index === 0;
        const isLast = index === resolvedEncounters.length - 1;
        const visitDate = encounter.visitDate;
        const doctorName = encounter.doctorName;
        const diagnoses = encounter.diagnoses;
        const orders = encounter.orders;
        const symptomText = encounter.symptomText;

        return [
          // Encounter Header (block)
          <div
            key={`enc-${encounter.encounterId}-header`}
            style={{
              ...(isFirst ? {} : { marginTop: '16px' }),
              marginBottom: '12px',
              fontFamily: 'Arial, sans-serif',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>내원이력</div>
            <div style={{ fontSize: '11px', color: '#333' }}>
              <span style={{ marginRight: '10px' }}>내원일자: {visitDate}</span>
              <span>담당의: {doctorName}</span>
            </div>
          </div>,

          // Diagnosis Title (block)
          <div
            key={`enc-${encounter.encounterId}-dx-title`}
            style={{
              fontWeight: 'bold',
              marginBottom: '10px',
              fontSize: '12px',
              borderBottom: '1px solid #000',
              paddingBottom: '5px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            진단명
          </div>,

          // Diagnosis Table (table => row-splittable)
          diagnoses.length > 0 ? (
            <table
              key={`enc-${encounter.encounterId}-dx-table`}
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #000',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                marginBottom: '20px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      width: '20%',
                    }}
                  >
                    진단코드
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    진단명
                  </th>
                </tr>
              </thead>
              <tbody>
                {diagnoses.map((disease, idx) => (
                  <tr key={`${disease.code}-${idx}`}>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                      }}
                    >
                      {disease.code || '-'}
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        fontSize: '11px',
                      }}
                    >
                      {disease.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              key={`enc-${encounter.encounterId}-dx-empty`}
              style={{
                padding: '14px',
                textAlign: 'center',
                border: '1px solid #ddd',
                color: '#666',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                marginBottom: '20px',
              }}
            >
              진단명이 없습니다.
            </div>
          ),

          // Symptom Title (block)
          <div
            key={`enc-${encounter.encounterId}-symptom-title`}
            style={{
              fontWeight: 'bold',
              marginBottom: '10px',
              fontSize: '12px',
              borderBottom: '1px solid #000',
              paddingBottom: '5px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            증상/소견
          </div>,

          // Symptom Body (block)
          <div
            key={`enc-${encounter.encounterId}-symptom-body`}
            style={{
              border: '1px solid #000',
              padding: '12px',
              minHeight: '80px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px',
            }}
          >
            {symptomText || '증상/소견이 없습니다.'}
          </div>,

          // Orders Title (block)
          <div
            key={`enc-${encounter.encounterId}-orders-title`}
            style={{
              fontWeight: 'bold',
              marginBottom: '10px',
              fontSize: '12px',
              borderBottom: '1px solid #000',
              paddingBottom: '5px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            처방 내용
          </div>,

          // Orders Table (table => row-splittable)
          orders.length > 0 ? (
            <table
              key={`enc-${encounter.encounterId}-orders-table`}
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #000',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    처방명
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    용법
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    용량
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    일수
                  </th>
                  <th
                    style={{
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    횟수
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={`${order.name}-${idx}`}>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        fontSize: '11px',
                      }}
                    >
                      {order.name}
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        fontSize: '11px',
                      }}
                    >
                      {order.usage || '-'}
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                      }}
                    >
                      {order.dose || '-'}
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                      }}
                    >
                      {order.days || '-'}일
                    </td>
                    <td
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                      }}
                    >
                      {order.times || '-'}회
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              key={`enc-${encounter.encounterId}-orders-empty`}
              style={{
                padding: '14px',
                textAlign: 'center',
                border: '1px solid #ddd',
                color: '#666',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
              }}
            >
              처방 내용이 없습니다.
            </div>
          ),

          // Divider / spacing between encounters (block)
          <div
            key={`enc-${encounter.encounterId}-divider`}
            style={{
              marginTop: '16px',
              marginBottom: isLast ? '20px' : '28px',
              paddingBottom: isLast ? '0px' : '16px',
              borderBottom: isLast ? 'none' : '1px solid #ddd',
            }}
          />,
        ];
      })}

      {/* 하단 정보 */}
      <section
        style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
        }}
      >
        <div>
          <div>발급일자: {formatIssueDate()}</div>
          <div style={{ marginTop: '20px', fontSize: '10px' }}>
            <div>※ 본 진료기록사본은 의료법에 따라 발급된 것입니다.</div>
            <div>※ 진료기록의 내용은 환자 본인 또는 법정대리인만 열람할 수 있습니다.</div>
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
            담당의
          </div>
          <div
            style={{
              marginTop: '30px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            의사
          </div>
          <div style={{ fontSize: '10px', marginTop: '5px' }}>
            (서명)
          </div>
        </div>
      </section>
    </PrintableDocument>
  );
}

function formatEncounterDateTime(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatIssueDate(): string {
  const date = new Date();
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

