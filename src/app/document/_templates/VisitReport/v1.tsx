'use client';

import { useMemo, useEffect } from 'react';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';
import { useDocumentContext } from '@/app/document/_contexts/DocumentContext';

interface VisitRow {
  id: string;
  date: string;
  department: string;
  doctor: string;
  notes: string;
}

interface VisitReportFormData {
  rows: VisitRow[];
  newRow: Omit<VisitRow, 'id'>;
}

const inputClassName =
  'w-full bg-transparent border-none px-0 py-0 text-[11px] leading-snug text-slate-900 focus:outline-none focus:ring-0';
const editOnlyClass = 'printable-edit-only';
const deleteButtonClassName =
  'rounded border border-red-200 bg-white px-2 py-0.5 text-[10px] font-medium text-red-600 shadow-sm hover:bg-red-50';

export function VisitReportContent() {
  const { margin, setTotalPages, formBaselineRef } = useDocumentContext();
  const form = useFormContext<VisitReportFormData>();
  const { control, watch, reset, getValues } = form;

  const initialRows = useMemo(() => {
    const base = ['내과', '외과', '안과', '정형외과', '재활의학과'];
    return Array.from({ length: 30 }).map((_, index) => ({
      // NOTE: noUncheckedIndexedAccess 대응 (항상 fallback 제공)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: randomUUID(),
      date: `2025-10-${String((index % 28) + 1).padStart(2, '0')}`,
      department: base[index % base.length] ?? '내과',
      doctor: `${base[index % base.length] ?? '내과'} 전문의`,
      notes: index % 3 === 0 ? '검사 결과 설명 및 투약 조정' : '추가 이상 소견 없음',
    }));
  }, []);

  const defaultValues: VisitReportFormData = useMemo(() => ({
    rows: initialRows,
    newRow: {
      date: '2025-11-01',
      department: '내과',
      doctor: '내과 전문의',
      notes: '직접 입력',
    },
  }), [initialRows]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rows',
  });

  const formValues = watch();

  useEffect(function initializeDefaultValuesIfEmpty() {
    const currentValues = getValues();
    const isEmpty =
      !currentValues ||
      typeof currentValues !== 'object' ||
      Object.keys(currentValues as unknown as Record<string, unknown>).length === 0;

    if (!isEmpty) return;

    formBaselineRef.current = defaultValues as unknown as Record<string, unknown>;
    reset(defaultValues);
  }, [defaultValues, formBaselineRef, getValues, reset]);

  function handleRemoveRow(index: number) {
    remove(index);
  }

  function handleAddRow() {
    const newRowValue = watch('newRow');
    append({
      id: randomUUID(),
      ...newRowValue,
    });
  }

  function header() {
    return (
      <header
        style={{
          fontSize: '12px',
          fontWeight: 600,
          paddingBottom: '4px',
          borderBottom: '1px solid #d4d4d8',
          width: '100%',
        }}
      >
        <div>
          <div>웰케어 의원</div>
          <div style={{ fontWeight: 400, fontSize: '11px' }}>
            02-1234-5678 · 서울시 어딘가 123
          </div>
          <div
            className={`text-sm text-slate-600 relative ${editOnlyClass}`}
            style={{
              display: 'block',
              margin: 0,
              padding: 0,
              position: 'relative',
              minHeight: '36px',
              width: '680px',
              minWidth: '680px',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '12px',
                fontSize: '12.25px',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.25px',
                }}
              >
                날짜
                <Controller
                  name="newRow.date"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="date"
                      className={`${inputClassName} ${editOnlyClass}`}
                      style={{ width: '80px' }}
                      {...field}
                    />
                  )}
                />
              </label>
            </div>
            <div
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '12px',
                fontSize: '12.25px',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.25px',
                }}
              >
                진료과
                <Controller
                  name="newRow.department"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      className={`${inputClassName} ${editOnlyClass}`}
                      style={{ width: '80px' }}
                      {...field}
                    />
                  )}
                />
              </label>
            </div>
            <div
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '12px',
                fontSize: '12.25px',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.25px',
                }}
              >
                담당의
                <Controller
                  name="newRow.doctor"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      className={`${inputClassName} ${editOnlyClass}`}
                      style={{ width: '80px' }}
                      {...field}
                    />
                  )}
                />
              </label>
            </div>
            <div
              style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '12px',
                fontSize: '12.25px',
                width: '180px',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  fontSize: '12.25px',
                }}
              >
                메모
                <Controller
                  name="newRow.notes"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      className={`${inputClassName} ${editOnlyClass}`}
                      style={{ width: '100px' }}
                      {...field}
                    />
                  )}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className={`rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${editOnlyClass}`}
              style={{
                position: 'absolute',
                right: 0,
                top: '-30px',
                zIndex: 10,
              }}
            >
              행 추가
            </button>
          </div>
        </div>
      </header>
    );
  }

  function footer() {
    return (
      <footer
        style={{
          fontSize: '11px',
          borderTop: '1px solid #d4d4d8',
          paddingTop: '4px',
          width: '100%',
          position: 'relative',
          height: '18px',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '5px',
          }}
        >
          웰케어 의원 · www.wellcare.co.kr
        </span>
        <span
          style={{
            position: 'absolute',
            right: 0,
            top: '5px',
          }}
        >
          CONFIDENTIAL
        </span>
      </footer>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      <PrintableDocument
        paper={PAPER_SIZES.A4}
        margin={{ top: margin, bottom: margin, left: margin, right: margin }}
        header={header}
        footer={footer}
        sectionSpacing={4}
        observeDependencies={[margin, formValues.rows]}
        onPageCountChange={setTotalPages}
      >
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>외래 경과 보고서</h1>
          <p style={{ fontSize: '12px', color: '#475569' }}>
            환자 상태 및 진료 히스토리를 프린트 전용 양식으로 확인합니다. 임상 소견과 투약 정보를
            실시간으로 편집한 뒤 페이지네이션 결과를 즉시 확인할 수 있습니다.
          </p>
        </section>

        <section
          style={{
            width: '100%',
            marginBottom: '0px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'separate' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', width: '50%', padding: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                    최근 진단
                  </div>
                  <div style={{ fontSize: '11px' }}>상기도 감염, 알레르기성 비염</div>
                </td>
                <td style={{ verticalAlign: 'top', width: '50%', padding: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>투약</div>
                  <div style={{ fontSize: '11px' }}>
                    항히스타민제, 비충혈 완화제, 비강 스프레이
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            marginTop: '8px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                }}
              >
                방문일
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                }}
              >
                진료과
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                }}
              >
                담당의
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                }}
              >
                메모
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id}>
                <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                  <Controller
                    name={`rows.${index}.date`}
                    control={control}
                    render={({ field: inputField }) => (
                      <input
                        type="text"
                        {...inputField}
                        className={`${inputClassName} ${editOnlyClass}`}
                      />
                    )}
                  />
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                  <Controller
                    name={`rows.${index}.department`}
                    control={control}
                    render={({ field: inputField }) => (
                      <input
                        type="text"
                        {...inputField}
                        className={`${inputClassName} ${editOnlyClass}`}
                      />
                    )}
                  />
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                  <Controller
                    name={`rows.${index}.doctor`}
                    control={control}
                    render={({ field: inputField }) => (
                      <input
                        type="text"
                        {...inputField}
                        className={`${inputClassName} ${editOnlyClass}`}
                      />
                    )}
                  />
                </td>
                <td
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Controller
                      name={`rows.${index}.notes`}
                      control={control}
                      render={({ field: inputField }) => (
                        <input
                          type="text"
                          {...inputField}
                          className={`${inputClassName} ${editOnlyClass}`}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className={`${deleteButtonClassName} ${editOnlyClass}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-48px',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section style={{ fontSize: '11px', lineHeight: 1.5 }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>추가 메모</h2>
          <p>
            비충혈에 대한 환자 자가 관리 교육을 지속하며, 자극 요인을 줄이는 생활 습관 개선을
            강조합니다. 필요 시 이비인후과 협진을 진행하며, 약물 순응도를 주기적으로 점검합니다.
          </p>
        </section>
      </PrintableDocument>
    </div>
  );
}

// crypto.randomUUID 폴리필
function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴리필: 간단한 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

