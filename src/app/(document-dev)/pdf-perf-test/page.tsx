'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Receipt } from '@/app/document/_reception_templates/Receipt/Receipt';
import { MedicalRecordCopy } from '@/app/document/_reception_templates/MedicalRecordCopy/MedicalRecordCopy';
import { MedicalExpense, transformToMedicalExpenseData } from '@/app/document/_reception_templates/MedicalExpense';
import { PdfWithFieldOverlay } from '@/app/document/_components/shared/PdfWithFieldOverlay';
import { buildRhfDefaultsFromFields } from '@/app/document/_utils/form-initialization';
import { useFormById } from '@/hooks/forms/use-form-by-id';
import { useFormsHierarchy } from '@/hooks/forms/use-forms-hierarchy';
import { useDownloadFileV2 } from '@/hooks/file/use-download-file-v2';
import { Patient } from '@/types/patient-types';
import { Encounter } from '@/types/chart/encounter-types';
import { MedicalBillReceiptResponseDto } from '@/types/receipt/medical-bill-receipt-types';
import { InputType } from '@/types/chart/order-types';
import {
  createPdfBlobFromDom,
  createPdfBlobFromHtml,
  createPdfBlobFromCaptureTasks,
  type ClientPdfCaptureOptions,
  type PdfGenerationMetrics,
  type PdfPageMetrics,
} from '@/lib/pdf/client-pdf-generator';
import { buildPrescriptionHtml, type KoreanPrescriptionData } from '@/lib/prescription/build-prescription-html-client';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

type TemplateId = 'Receipt' | 'MedicalRecordCopy' | 'MedicalExpense' | 'Prescription' | 'PdfForm';
type PrescriptionScenario = 'single' | 'multi';
type ImageFormat = 'jpeg' | 'png';

interface HtmlToImageAdvancedOptions {
  skipFonts: boolean;
  skipAutoScale: boolean;
  cacheBust: boolean;
  preferredFontFormat: string;
  canvasWidth: string;
  canvasHeight: string;
}

interface RunResult {
  id: number;
  template: TemplateId;
  pixelRatio: number;
  quality: number;
  captureDelay: number;
  imageFormat: ImageFormat;
  pdfRenderScale?: number;
  metrics: PdfGenerationMetrics;
  /** 첫 번째 페이지 캡처 이미지 data URL (미리보기용) */
  capturedImageUrl?: string;
  /** 캡처 이미지 바이트 크기 */
  capturedImageSizeKB?: number;
  timestamp: number;
}

// ────────────────────────────────────────────────
// Mock Data (document-test/page.tsx에서 재사용)
// ────────────────────────────────────────────────

const mockPatient: Patient = {
  id: 239,
  patientNo: 239,
  uuid: 'mock-uuid-123',
  name: '재후존',
  rrn: '900101-1234567',
  birthDate: '1990-01-01',
  gender: 1,
  phone1: '010-1234-5678',
  phone2: null,
  address1: '경기도 용인시 기흥구 보정동',
  address2: '123-45',
  zipcode: '12345',
  hospitalId: 1,
  isActive: true,
  isTemporary: false,
  groupId: 1,
  idType: 1 as any,
  idNumber: null,
  patientType: 0,
  createId: 1,
  createDateTime: '2025-01-01T00:00:00Z',
  updateId: null,
  updateDateTime: null,
  consent: null,
  vitalSignMeasurements: [],
  fatherRrn: '',
  identityVerifiedAt: null,
  eligibilityCheck: {} as any,
  lastEncounterDate: new Date(),
  loginId: null,
  password: null,
  rrnView: '900101-1******',
  rrnHash: 'hash',
  nextAppointmentDateTime: null,
};

const mockEncounter: Encounter = {
  id: 'enc-123',
  registrationId: 'reg-123',
  patientId: 239,
  encounterDateTime: '2025-09-01T10:00:00Z',
  doctorId: 1,
  receptionType: 1 as any,
  timeCategory: 1 as any,
  diseases: [{ code: 'I10', name: '본태성(원발성) 고혈압' } as any],
  orders: [
    {
      id: 'order-1',
      claimCode: '01010',
      name: '진찰료',
      inputType: InputType.일반,
      insurancePrice: 15000,
      itemType: '01',
      dose: 1,
      times: 1,
      days: 1,
    } as any,
  ],
  calcResultData: {
    항목별내역s: [
      { 항목구분: '0101', 본인부담금: 3948, 공단부담금: 9212, 전액본인부담금: 0, 비급여금: 0 },
      { 항목구분: '0201', 본인부담금: 9945, 공단부담금: 23205, 전액본인부담금: 0, 비급여금: 1610 },
    ],
  } as any,
  startDateTime: '2025-09-01T10:00:00Z',
  endDateTime: '2025-09-01T10:30:00Z',
  createId: 1,
  createDateTime: '2025-09-01T10:00:00Z',
  updateId: null,
  updateDateTime: null,
} as any;

const mockPaymentAmount = { insuredCopay: 3948, insuredFullPay: 0, insurerPayment: 9212, uninsured: 0 };
const mockZeroPaymentAmount = { insuredCopay: 0, insuredFullPay: 0, insurerPayment: 0, uninsured: 0 };

const mockReceiptDetail: MedicalBillReceiptResponseDto = {
  header: {
    patientNo: String(mockPatient.patientNo),
    patientName: mockPatient.name,
    treatmentPeriod: { startDate: '2025-09-01', endDate: '2025-09-01' },
    visitType: '외래',
    isInterimBill: false,
    nightVisit: false,
    holidayVisit: false,
    department: '가정의학과',
    drgNo: '',
    roomType: '',
    patientCategory: '건강보험',
    receiptNo: '2509-00004',
  },
  items: {
    basic: {
      consultation: mockPaymentAmount,
      hospitalization: {
        singleRoom: mockZeroPaymentAmount,
        twoThreePersonRoom: mockZeroPaymentAmount,
        fourPlusPersonRoom: mockZeroPaymentAmount,
      },
      meals: mockZeroPaymentAmount,
      medicationService: mockZeroPaymentAmount,
      medicationDrug: mockZeroPaymentAmount,
      injectionService: mockZeroPaymentAmount,
      injectionDrug: mockZeroPaymentAmount,
      anesthesia: mockZeroPaymentAmount,
      procedureSurgery: mockZeroPaymentAmount,
      labTest: { insuredCopay: 9945, insuredFullPay: 0, insurerPayment: 23205, uninsured: 1610 },
      imaging: mockZeroPaymentAmount,
      radiationTherapy: mockZeroPaymentAmount,
      medicalSupplies: mockZeroPaymentAmount,
      rehabilitation: mockZeroPaymentAmount,
      mentalHealth: mockZeroPaymentAmount,
      bloodProducts: mockZeroPaymentAmount,
    },
    elective: {
      ct: mockZeroPaymentAmount,
      mri: mockZeroPaymentAmount,
      pet: mockZeroPaymentAmount,
      ultrasound: mockZeroPaymentAmount,
      prostheticsOrthodontics: mockZeroPaymentAmount,
      certificates: mockZeroPaymentAmount,
      selectiveCoverage: mockZeroPaymentAmount,
      seniorFixedRate: mockZeroPaymentAmount,
      longTermCareFixed: mockZeroPaymentAmount,
      palliativeCareFixed: mockZeroPaymentAmount,
      drgPackage: mockZeroPaymentAmount,
      other: mockZeroPaymentAmount,
    },
    totals: { insuredCopay: 13893, insuredFullPay: 0, insurerPayment: 32417, uninsured: 1610 },
  },
  summary: {
    totalMedicalExpense: 47920,
    insurerPayment: 32417,
    patientPayment: 15503,
    ceilingExcess: 0,
    previouslyPaid: 15403,
    amountDue: 0,
  },
  payment: {
    card: 11510,
    cashReceipt: 3893,
    cash: 3893,
    total: 15403,
    outstanding: 0,
    cashReceiptIdentifier: '01012345678',
    cashReceiptApprovalNo: 'A123456',
  },
  issuance: {
    issueDate: '2025-09-01',
    facilityType: '의원급·보건기관',
    businessRegistrationNo: '135-81-05009',
    facilityName: '(주)녹십자홀딩스 부속의원',
    phone: '031-123-4567',
    address: '경기도 용인시 기흥구 보정동',
    representativeName: '허용준',
  },
};

function createMockMedicalExpenseData(testRowCount: number) {
  const safeTestRowCount = Math.max(0, testRowCount);
  const mockMedicalExpenseEncounters = [
    {
      ...mockEncounter,
      encounterDateTime: '2025-01-17T10:00:00Z',
      patient: mockPatient,
      calcResultData: {
        항목별내역s: [
          { 항목: '검사료', 코드: '30000', 명칭: 'influenza A&B Ag', 금액: 30000, 횟수: 1, 일수: 1, 총액: 30000, 본인부담금: 30000, 전액본인부담금: 0, 비급여금: 0 },
          { 항목: '주사료', 코드: '-2-1(20)', 명칭: 'IVDr3(2)', 금액: 84000, 횟수: 1, 일수: 1, 총액: 84000, 본인부담금: 84000, 전액본인부담금: 0, 비급여금: 0 },
          { 항목: '진찰료', 코드: 'AA254', 명칭: '재진진찰료-의원', 금액: 13160, 횟수: 1, 일수: 1, 총액: 13160, 본인부담금: 13160, 전액본인부담금: 0, 비급여금: 0 },
          ...Array.from({ length: safeTestRowCount }).map((_, i) => ({
            항목: '검사료',
            코드: `TEST-${i + 1}`,
            명칭: `테스트 항목 ${i + 1} - 페이지 분할 테스트용 데이터`,
            금액: 1000, 횟수: 1, 일수: 1, 총액: 1000, 본인부담금: 1000, 전액본인부담금: 0, 비급여금: 0,
          })),
        ],
      },
    },
    {
      ...mockEncounter,
      encounterDateTime: '2025-07-08T14:00:00Z',
      patient: mockPatient,
      calcResultData: {
        항목별내역s: [
          { 항목: '주사료', 코드: '0176', 명칭: '이이비글로불린에스앤주', 금액: 100000, 횟수: 2, 일수: 1, 총액: 200000, 본인부담금: 0, 전액본인부담금: 0, 비급여금: 200000 },
          { 항목: '주사료', 코드: '0172', 명칭: '아스코르브산', 금액: 800, 횟수: 1, 일수: 1, 총액: 800, 본인부담금: 0, 전액본인부담금: 0, 비급여금: 800 },
        ],
      },
    },
  ];
  return transformToMedicalExpenseData({
    encounters: mockMedicalExpenseEncounters,
    hospitalInfo: { name: '(주)녹십자홀딩스 부속의원', representative: '허용준' },
  });
}

function createMockKoreanPrescriptionData(params: {
  outMedicineCount: number;
  injectionCount: number;
}): KoreanPrescriptionData {
  const { outMedicineCount, injectionCount } = params;
  const outMedicines = Array.from({ length: outMedicineCount }).map((_, i) => ({
    청구코드: `RX-${String(i + 1).padStart(3, '0')}`,
    명칭: `테스트 원외약품 ${i + 1} (페이지 분할 테스트)`,
    투여량1회: '1',
    투여횟수1일: '3',
    총투약일수: String((i % 7) + 1),
    용법: '식후 30분 1정',
  }));
  const injections = Array.from({ length: injectionCount }).map((_, i) => ({
    청구코드: `INJ-${String(i + 1).padStart(3, '0')}`,
    명칭: `테스트 주사제 ${i + 1} (페이지 분할 테스트)`,
    투여량1회: '1',
    투여횟수1일: '1',
    총투약일수: '1',
    용법: '정맥주사',
  }));
  return {
    교부번호: '20260120000123',
    사용기간: '3',
    조제시참고사항: '다페이지 테스트용 참고사항입니다.',
    병원: {
      요양기관명: '(주)녹십자홀딩스 부속의원',
      요양기관번호: '12345678',
      주소1: '경기도 용인시 기흥구 보정동',
      주소2: '123-45',
      전화번호: '031-123-4567',
      팩스번호: '031-987-6543',
      이메일: 'test@hospital.example',
    },
    환자: { 성명: '재후존', 주민등록번호: '900101-1234567' },
    접수: { 보험구분: 1 },
    의사: { 이름: '허용준', 면허번호: '12345', 직인이미지Base64: null, 직인이미지: null },
    상병목록: [{ 코드: 'I10' }, { 코드: 'E11' }],
    주사제처방내역원내조제여부: true,
    주사제처방내역원외처방여부: false,
    원외약품처방목록: [{ 페이지: 1, 목록: outMedicines }],
    주사제처방목록: [{ 페이지: 1, 목록: injections }],
  };
}

// ────────────────────────────────────────────────
// Helper: 처방전 HTML 페이지 수 세기
// ────────────────────────────────────────────────

function countPrescriptionPages(html: string): number {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Math.max(doc.querySelectorAll('.A4').length, 1);
  } catch {
    return 1;
  }
}

// ────────────────────────────────────────────────
// Helper: PDF 렌더 안정화 대기 (DocumentToolbar.tsx 패턴)
// ────────────────────────────────────────────────

async function waitForTwoAnimationFrames(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  await waitForTwoAnimationFrames();
}

// ────────────────────────────────────────────────
// Component: 구간별 소요시간 바 차트
// ────────────────────────────────────────────────

const SEGMENT_COLORS: Record<keyof PdfPageMetrics, string> = {
  waitFramesMs: '#94a3b8',
  cloneMs: '#60a5fa',
  toJpegMs: '#f87171',
  imgSizeMs: '#fbbf24',
  addImageMs: '#34d399',
};

const SEGMENT_LABELS: Record<keyof PdfPageMetrics, string> = {
  waitFramesMs: 'waitFrames',
  cloneMs: 'clone',
  toJpegMs: 'toImage',
  imgSizeMs: 'imgSize',
  addImageMs: 'addImage',
};

function MetricsBarChart({ metrics }: { metrics: PdfGenerationMetrics }) {
  const segments = Object.keys(SEGMENT_COLORS) as (keyof PdfPageMetrics)[];

  // 전체 합산
  const totals = new Map<string, number>();
  for (const seg of segments) {
    totals.set(seg, metrics.pages.reduce((acc, p) => acc + p[seg], 0));
  }
  totals.set('outputMs', metrics.outputMs);
  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-1.5">
      {/* 전체 바 */}
      <div className="flex h-6 w-full rounded overflow-hidden border border-gray-200">
        {segments.map((seg) => {
          const val = totals.get(seg) ?? 0;
          const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={seg}
              style={{ width: `${pct}%`, backgroundColor: SEGMENT_COLORS[seg] }}
              className="flex items-center justify-center text-[10px] text-white font-medium overflow-hidden whitespace-nowrap"
              title={`${SEGMENT_LABELS[seg]}: ${val.toFixed(0)}ms (${pct.toFixed(1)}%)`}
            >
              {pct > 8 ? `${SEGMENT_LABELS[seg]} ${val.toFixed(0)}ms` : ''}
            </div>
          );
        })}
        {/* output */}
        {(() => {
          const outVal = totals.get('outputMs') ?? 0;
          const outPct = grandTotal > 0 ? (outVal / grandTotal) * 100 : 0;
          if (outPct < 0.5) return null;
          return (
            <div
              style={{ width: `${outPct}%`, backgroundColor: '#a78bfa' }}
              className="flex items-center justify-center text-[10px] text-white font-medium overflow-hidden whitespace-nowrap"
              title={`output: ${metrics.outputMs.toFixed(0)}ms`}
            >
              {outPct > 8 ? `output ${metrics.outputMs.toFixed(0)}ms` : ''}
            </div>
          );
        })()}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        {segments.map((seg) => (
          <span key={seg} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SEGMENT_COLORS[seg] }} />
            {SEGMENT_LABELS[seg]}: {(totals.get(seg) ?? 0).toFixed(0)}ms
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#a78bfa' }} />
          output: {metrics.outputMs.toFixed(0)}ms
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Component: 히스토리 테이블
// ────────────────────────────────────────────────

function sumPageMetric(pages: PdfPageMetrics[], key: keyof PdfPageMetrics): number {
  return pages.reduce((a, p) => a + p[key], 0);
}

function HistoryTable({ runs }: { runs: RunResult[] }) {
  if (runs.length === 0) return <div className="text-sm text-gray-400">실행 기록이 없습니다.</div>;

  return (
    <div className="overflow-auto max-h-72">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-2 py-1.5 text-left font-medium">#</th>
            <th className="px-2 py-1.5 text-left font-medium">템플릿</th>
            <th className="px-2 py-1.5 text-left font-medium">format</th>
            <th className="px-2 py-1.5 text-right font-medium">pxRatio</th>
            <th className="px-2 py-1.5 text-right font-medium">pdfScale</th>
            <th className="px-2 py-1.5 text-right font-medium">quality</th>
            <th className="px-2 py-1.5 text-right font-medium">delay</th>
            <th className="px-2 py-1.5 text-right font-medium">페이지</th>
            <th className="px-2 py-1.5 text-right font-medium">전체(ms)</th>
            <th className="px-2 py-1.5 text-right font-medium">평균/p</th>
            <th className="px-2 py-1.5 text-right font-medium">크기(KB)</th>
            <th className="px-2 py-1.5 text-right font-medium text-gray-400">wait</th>
            <th className="px-2 py-1.5 text-right font-medium text-blue-500">clone</th>
            <th className="px-2 py-1.5 text-right font-medium text-red-500">toImage</th>
            <th className="px-2 py-1.5 text-right font-medium text-yellow-600">imgSize</th>
            <th className="px-2 py-1.5 text-right font-medium text-emerald-600">addImg</th>
            <th className="px-2 py-1.5 text-right font-medium text-purple-500">output</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const { pages, outputMs, totalMs } = r.metrics;
            const waitVal = sumPageMetric(pages, 'waitFramesMs');
            const clone = sumPageMetric(pages, 'cloneMs');
            const toImageVal = sumPageMetric(pages, 'toJpegMs');
            const imgSize = sumPageMetric(pages, 'imgSizeMs');
            const addImg = sumPageMetric(pages, 'addImageMs');
            return (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-1">{r.id}</td>
                <td className="px-2 py-1">{r.template}</td>
                <td className="px-2 py-1">{r.imageFormat}</td>
                <td className="px-2 py-1 text-right">{r.pixelRatio}</td>
                <td className="px-2 py-1 text-right">{r.pdfRenderScale ?? '-'}</td>
                <td className="px-2 py-1 text-right">{r.quality}</td>
                <td className="px-2 py-1 text-right">{r.captureDelay}</td>
                <td className="px-2 py-1 text-right">{r.metrics.pageCount}</td>
                <td className="px-2 py-1 text-right font-mono font-semibold">{totalMs.toFixed(0)}</td>
                <td className="px-2 py-1 text-right font-mono">
                  {r.metrics.pageCount > 0 ? (totalMs / r.metrics.pageCount).toFixed(0) : '-'}
                </td>
                <td className="px-2 py-1 text-right font-mono">{r.metrics.fileSizeKB.toFixed(1)}</td>
                <td className="px-2 py-1 text-right font-mono text-gray-400">{waitVal.toFixed(0)}</td>
                <td className="px-2 py-1 text-right font-mono text-blue-500">{clone.toFixed(0)}</td>
                <td className="px-2 py-1 text-right font-mono text-red-500">{toImageVal.toFixed(0)}</td>
                <td className="px-2 py-1 text-right font-mono text-yellow-600">{imgSize.toFixed(0)}</td>
                <td className="px-2 py-1 text-right font-mono text-emerald-600">{addImg.toFixed(0)}</td>
                <td className="px-2 py-1 text-right font-mono text-purple-500">{outputMs.toFixed(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────
// Component: 캡처 이미지 비교
// ────────────────────────────────────────────────

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function buildImageFilename(r: RunResult, pageIndex?: number): string {
  const parts = [
    `run${r.id}`,
    r.template,
    r.imageFormat,
    `q${r.quality}`,
    `px${r.pixelRatio}`,
  ];
  if (r.pdfRenderScale != null) parts.push(`s${r.pdfRenderScale}`);
  if (pageIndex != null) parts.push(`p${pageIndex + 1}`);
  const ext = r.imageFormat === 'png' ? 'png' : 'jpg';
  return `${parts.join('_')}.${ext}`;
}

function CapturedImageComparison({ runs }: { runs: RunResult[] }) {
  const runsWithImages = runs.filter((r) => r.capturedImageUrl);
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const first2 = runsWithImages.slice(0, 2).map((r) => r.id);
    return first2;
  });
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id].slice(-4) // 최대 4개
    );
  };

  const handleDownload = (r: RunResult) => {
    if (!r.capturedImageUrl) return;
    downloadDataUrl(r.capturedImageUrl, buildImageFilename(r, 0));
  };

  const handleDownloadAll = (r: RunResult) => {
    const urls = r.metrics.capturedDataUrls;
    if (!urls?.length) return;
    urls.forEach((url, idx) => {
      // 브라우저 연속 다운로드를 위해 약간의 딜레이
      setTimeout(() => downloadDataUrl(url, buildImageFilename(r, idx)), idx * 100);
    });
  };

  const selectedRuns = runsWithImages.filter((r) => selectedIds.includes(r.id));

  return (
    <div className="pt-2 border-t space-y-2">
      <h3 className="text-xs font-semibold text-gray-600">캡처 이미지 비교 (1페이지)</h3>

      {/* 실행 선택 체크박스 */}
      <div className="flex flex-wrap gap-1.5">
        {runsWithImages.map((r) => (
          <label key={r.id} className="flex items-center gap-1 text-[11px] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.includes(r.id)}
              onChange={() => toggleSelection(r.id)}
              className="w-3 h-3"
            />
            #{r.id} {r.imageFormat.toUpperCase()} q={r.quality} px={r.pixelRatio}{r.pdfRenderScale != null ? ` s=${r.pdfRenderScale}` : ''}
          </label>
        ))}
      </div>

      {/* 이미지 비교 그리드 */}
      {selectedRuns.length > 0 && (
        <div className={`grid gap-2 ${selectedRuns.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {selectedRuns.map((r) => {
            const totalPages = r.metrics.capturedDataUrls?.length ?? 0;
            return (
              <div key={r.id} className="border rounded overflow-hidden bg-gray-50">
                <div className="px-2 py-1 bg-gray-100 text-[10px] text-gray-600 flex justify-between items-center">
                  <span className="font-medium">#{r.id} {r.imageFormat.toUpperCase()}</span>
                  <span>
                    q={r.quality} px={r.pixelRatio}{r.pdfRenderScale != null && ` s=${r.pdfRenderScale}`}
                    {r.capturedImageSizeKB != null && ` | img=${r.capturedImageSizeKB.toFixed(0)}KB`}
                    {` | pdf=${r.metrics.fileSizeKB.toFixed(0)}KB`}
                    {` | ${r.metrics.totalMs.toFixed(0)}ms`}
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.capturedImageUrl}
                  alt={`캡처 #${r.id}`}
                  className="w-full h-auto cursor-zoom-in"
                  onClick={() => setZoomedUrl(r.capturedImageUrl ?? null)}
                />
                {/* 다운로드 버튼 */}
                <div className="px-2 py-1 bg-gray-100 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownload(r)}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                  >
                    1페이지 다운로드
                  </button>
                  {totalPages > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDownloadAll(r)}
                      className="text-[10px] px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      전체 {totalPages}장 다운로드
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 줌 모달 */}
      {zoomedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoomedUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedUrl}
            alt="확대 보기"
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Page Component
// ────────────────────────────────────────────────

const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: 'Receipt', name: '영수증' },
  { id: 'MedicalRecordCopy', name: '진료기록' },
  { id: 'MedicalExpense', name: '진료비내역서' },
  { id: 'Prescription', name: '처방전' },
  { id: 'PdfForm', name: 'PDF 서식' },
];

const DEFAULT_MEDICAL_EXPENSE_TEST_ROW_COUNT = 30;
const DEFAULT_ADVANCED_OPTIONS: HtmlToImageAdvancedOptions = {
  skipFonts: false,
  skipAutoScale: false,
  cacheBust: false,
  preferredFontFormat: '',
  canvasWidth: '',
  canvasHeight: '',
};

export default function PdfPerfTestPage() {
  // ── 파라미터 상태 ──
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('Receipt');
  const [pixelRatio, setPixelRatio] = useState(3);
  const [quality, setQuality] = useState(1.0);
  const [captureDelay, setCaptureDelay] = useState(500);
  const [imageFormat, setImageFormat] = useState<ImageFormat>('jpeg');
  const [advancedOptions, setAdvancedOptions] = useState<HtmlToImageAdvancedOptions>(DEFAULT_ADVANCED_OPTIONS);
  const [prescriptionScenario, setPrescriptionScenario] = useState<PrescriptionScenario>('single');
  const [medicalExpenseTestRowCount, setMedicalExpenseTestRowCount] = useState(DEFAULT_MEDICAL_EXPENSE_TEST_ROW_COUNT);

  // ── PDF 서식 상태 ──
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [loadedFormId, setLoadedFormId] = useState<number | null>(null);
  const [pdfFormTotalPages, setPdfFormTotalPages] = useState(1);
  const pdfFormCurrentPageRef = useRef(1);
  const [pdfRenderScale, setPdfRenderScale] = useState(1.5);

  // ── 실행 상태 ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<PdfGenerationMetrics | null>(null);
  const [history, setHistory] = useState<RunResult[]>([]);
  const runIdRef = useRef(0);

  // ── 파생 데이터 ──
  const medicalExpenseData = useMemo(() => createMockMedicalExpenseData(medicalExpenseTestRowCount), [medicalExpenseTestRowCount]);

  const prescriptionData = useMemo(
    () =>
      createMockKoreanPrescriptionData(
        prescriptionScenario === 'multi'
          ? { outMedicineCount: 40, injectionCount: 20 }
          : { outMedicineCount: 6, injectionCount: 3 },
      ),
    [prescriptionScenario],
  );

  const [prescriptionHtml, setPrescriptionHtml] = useState('');
  useEffect(() => {
    buildPrescriptionHtml(prescriptionData).then(setPrescriptionHtml);
  }, [prescriptionData]);
  const prescriptionPageCount = useMemo(() => countPrescriptionPages(prescriptionHtml), [prescriptionHtml]);

  // ── html-to-image 옵션 빌드 ──
  const buildHtmlToImageOptions = useCallback((): ClientPdfCaptureOptions['htmlToImageOptions'] => {
    const opts: ClientPdfCaptureOptions['htmlToImageOptions'] = {};
    if (advancedOptions.skipFonts) opts.skipFonts = true;
    if (advancedOptions.skipAutoScale) opts.skipAutoScale = true;
    if (advancedOptions.cacheBust) opts.cacheBust = true;
    if (advancedOptions.preferredFontFormat) opts.preferredFontFormat = advancedOptions.preferredFontFormat;
    const cw = parseInt(advancedOptions.canvasWidth, 10);
    if (cw > 0) opts.canvasWidth = cw;
    const ch = parseInt(advancedOptions.canvasHeight, 10);
    if (ch > 0) opts.canvasHeight = ch;
    return Object.keys(opts).length > 0 ? opts : undefined;
  }, [advancedOptions]);

  // ── PDF 생성 ──
  const handleGeneratePdf = useCallback(async () => {
    try {
      setIsGenerating(true);

      let metricsResult: PdfGenerationMetrics | null = null;
      const onMetrics = (m: PdfGenerationMetrics) => {
        metricsResult = m;
      };

      const pdfOptions: ClientPdfCaptureOptions = {
        pixelRatio,
        quality,
        backgroundColor: '#ffffff',
        imageFormat,
        htmlToImageOptions: buildHtmlToImageOptions(),
        collectDataUrls: true,
        onMetrics,
      };

      let blob: Blob;
      if (selectedTemplate === 'Prescription') {
        blob = await createPdfBlobFromHtml({
          html: prescriptionHtml,
          options: { ...pdfOptions, pageSelector: '.A4' },
        });
      } else if (selectedTemplate === 'PdfForm') {
        // PDF 서식: 페이지 순회 캡처 (DocumentToolbar 패턴)
        const captureRoot = document.querySelector<HTMLElement>("[data-client-pdf-root='true']");
        if (!captureRoot) {
          alert('서식을 먼저 로드해주세요.');
          return;
        }

        // 페이지 변경 버튼을 통해 페이지 이동 (PdfWithFieldOverlay 내부 navigation 사용)
        const totalPages = pdfFormTotalPages;

        const tasks = Array.from({ length: totalPages }, (_, idx) => {
          const targetPage = idx + 1;
          return async () => {
            if (pdfFormCurrentPageRef.current !== targetPage) {
              // CustomEvent로 PdfFormTestSectionWithPageSync에 페이지 변경 요청
              const pageChangeEvent = new CustomEvent('pdf-perf-page-change', { detail: { page: targetPage } });
              window.dispatchEvent(pageChangeEvent);
              pdfFormCurrentPageRef.current = targetPage;
            }
            // 페이지 렌더 안정화 대기
            await waitForPdfRenderStable(captureRoot);
            return captureRoot;
          };
        });

        blob = await createPdfBlobFromCaptureTasks({
          captureTasks: tasks,
          options: pdfOptions,
        });
      } else {
        // captureDelay 동안 대기 (DOM 안정화)
        if (captureDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, captureDelay));
        }
        const printableRoot = document.querySelector('[data-print-preview-root="true"]') as HTMLElement;
        if (!printableRoot) {
          alert('출력할 요소를 찾을 수 없습니다.');
          return;
        }
        blob = await createPdfBlobFromDom({
          root: printableRoot,
          options: pdfOptions,
        });
      }

      // PDF를 새 탭에서 열기
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      // 메트릭 기록
      // NOTE: metricsResult는 onMetrics 콜백에서 할당되므로 TS control flow가 추적 불가 → as 단언 사용
      const resolvedMetrics = metricsResult as PdfGenerationMetrics | null;
      if (resolvedMetrics) {
        setLastMetrics(resolvedMetrics);
        runIdRef.current += 1;

        // 첫 페이지 캡처 이미지 정보
        const firstDataUrl = resolvedMetrics.capturedDataUrls?.[0];
        const imgSizeKB = firstDataUrl
          ? (firstDataUrl.length - (firstDataUrl.indexOf(',') + 1)) * 0.75 / 1024
          : undefined;

        const run: RunResult = {
          id: runIdRef.current,
          template: selectedTemplate,
          pixelRatio,
          quality,
          captureDelay,
          imageFormat,
          pdfRenderScale: selectedTemplate === 'PdfForm' ? pdfRenderScale : undefined,
          metrics: resolvedMetrics,
          capturedImageUrl: firstDataUrl,
          capturedImageSizeKB: imgSizeKB,
          timestamp: Date.now(),
        };
        setHistory((prev) => [run, ...prev]);
      }
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, pixelRatio, quality, captureDelay, imageFormat, buildHtmlToImageOptions, prescriptionHtml, medicalExpenseData, pdfFormTotalPages, pdfRenderScale]);

  // ── A vs B 비교: 현재 설정 → (pixelRatio=2, quality=0.92) ──
  const handleCompare = useCallback(async () => {
    // 현재 설정으로 한 번
    await handleGeneratePdf();

    // 비교 설정
    const prevPixelRatio = pixelRatio;
    const prevQuality = quality;
    setPixelRatio(2);
    setQuality(0.92);

    // state가 반영된 후 실행하기 위해 setTimeout 사용
    setTimeout(async () => {
      await handleGeneratePdf();
      // 원래 값 복원
      setPixelRatio(prevPixelRatio);
      setQuality(prevQuality);
    }, 100);
  }, [handleGeneratePdf, pixelRatio, quality]);

  // ── PDF 서식 선택 ──
  const handleSelectForm = useCallback((formId: number, _formName: string) => {
    setLoadedFormId(formId);
    pdfFormCurrentPageRef.current = 1;
  }, []);

  // ── PDF 서식: 페이지 변경 이벤트 리스너 ──
  // PdfFormTestSection에서 totalPages 변경을 감지
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.totalPages) {
        setPdfFormTotalPages(detail.totalPages);
      }
    };
    window.addEventListener('pdf-perf-total-pages', handler);
    return () => window.removeEventListener('pdf-perf-total-pages', handler);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ── 좌측 패널: 파라미터 조절 ── */}
      <div className="w-72 bg-white border-r flex flex-col overflow-y-auto shrink-0">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">PDF 성능 테스트</h1>
          <p className="text-xs text-gray-500 mt-1">pixelRatio / quality / format 튜닝 비교</p>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* 템플릿 선택 */}
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-gray-700">템플릿</legend>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
                    selectedTemplate === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 이미지 포맷 */}
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-gray-700">이미지 포맷</legend>
            <div className="flex gap-1.5">
              {(['jpeg', 'png'] as ImageFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setImageFormat(fmt)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    imageFormat === fmt ? 'bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-gray-400">
              {imageFormat === 'jpeg' ? 'JPEG: quality 조절 가능, 작은 파일 크기' : 'PNG: 무손실, quality 무시됨, 큰 파일 크기'}
            </div>
          </fieldset>

          {/* pixelRatio */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">
              pixelRatio: <span className="font-mono text-blue-600">{pixelRatio}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={pixelRatio}
              onChange={(e) => setPixelRatio(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1</span><span>3</span><span>5</span><span>7</span><span>10</span>
            </div>
          </div>

          {/* quality */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">
              quality: <span className="font-mono text-blue-600">{quality.toFixed(2)}</span>
              {imageFormat === 'png' && <span className="text-gray-400 ml-1">(PNG - 무시됨)</span>}
            </label>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.02}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
              disabled={imageFormat === 'png'}
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0.50</span><span>0.75</span><span>1.00</span>
            </div>
          </div>

          {/* captureDelay */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">
              captureDelay: <span className="font-mono text-blue-600">{captureDelay}ms</span>
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              step={50}
              value={captureDelay}
              onChange={(e) => setCaptureDelay(Math.max(0, Number(e.target.value) || 0))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          {/* html-to-image 고급 옵션 */}
          <details className="border rounded bg-gray-50">
            <summary className="px-2.5 py-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
              html-to-image 고급 옵션
            </summary>
            <div className="px-2.5 pb-2.5 space-y-2">
              <label className="flex items-center gap-2 text-[11px] text-gray-600">
                <input
                  type="checkbox"
                  checked={advancedOptions.skipFonts}
                  onChange={(e) => setAdvancedOptions((prev) => ({ ...prev, skipFonts: e.target.checked }))}
                />
                skipFonts <span className="text-gray-400">(폰트 임베드 스킵)</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-gray-600">
                <input
                  type="checkbox"
                  checked={advancedOptions.skipAutoScale}
                  onChange={(e) => setAdvancedOptions((prev) => ({ ...prev, skipAutoScale: e.target.checked }))}
                />
                skipAutoScale <span className="text-gray-400">(자동 스케일 스킵)</span>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-gray-600">
                <input
                  type="checkbox"
                  checked={advancedOptions.cacheBust}
                  onChange={(e) => setAdvancedOptions((prev) => ({ ...prev, cacheBust: e.target.checked }))}
                />
                cacheBust <span className="text-gray-400">(URL 캐시 버스팅)</span>
              </label>
              <div className="space-y-0.5">
                <label className="text-[11px] text-gray-600">preferredFontFormat</label>
                <select
                  value={advancedOptions.preferredFontFormat}
                  onChange={(e) => setAdvancedOptions((prev) => ({ ...prev, preferredFontFormat: e.target.value }))}
                  className="w-full border rounded px-1.5 py-1 text-xs"
                >
                  <option value="">미지정</option>
                  <option value="woff2">woff2</option>
                  <option value="woff">woff</option>
                  <option value="truetype">truetype</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-0.5">
                  <label className="text-[11px] text-gray-600">canvasWidth</label>
                  <input
                    type="number"
                    placeholder="auto"
                    value={advancedOptions.canvasWidth}
                    onChange={(e) => setAdvancedOptions((prev) => ({ ...prev, canvasWidth: e.target.value }))}
                    className="w-full border rounded px-1.5 py-1 text-xs"
                  />
                </div>
                <div className="flex-1 space-y-0.5">
                  <label className="text-[11px] text-gray-600">canvasHeight</label>
                  <input
                    type="number"
                    placeholder="auto"
                    value={advancedOptions.canvasHeight}
                    onChange={(e) => setAdvancedOptions((prev) => ({ ...prev, canvasHeight: e.target.value }))}
                    className="w-full border rounded px-1.5 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* 템플릿별 추가 옵션 */}
          {selectedTemplate === 'Prescription' && (
            <fieldset className="space-y-2 p-2.5 rounded border bg-gray-50">
              <legend className="text-xs font-semibold text-gray-700 px-1">처방전 옵션</legend>
              <div className="flex gap-2">
                {(['single', 'multi'] as PrescriptionScenario[]).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setPrescriptionScenario(sc)}
                    className={`px-2 py-1 rounded text-xs ${
                      prescriptionScenario === sc ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'
                    }`}
                  >
                    {sc === 'single' ? '단일 페이지' : '다페이지'}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-gray-500">페이지 수: {prescriptionPageCount}</div>
            </fieldset>
          )}

          {selectedTemplate === 'MedicalExpense' && (
            <fieldset className="space-y-2 p-2.5 rounded border bg-gray-50">
              <legend className="text-xs font-semibold text-gray-700 px-1">진료비내역서 옵션</legend>
              <label className="text-[11px] text-gray-600">행 수: {medicalExpenseTestRowCount}</label>
              <input
                type="range"
                min={0}
                max={200}
                value={medicalExpenseTestRowCount}
                onChange={(e) => setMedicalExpenseTestRowCount(Number(e.target.value))}
                className="w-full"
              />
            </fieldset>
          )}

          {selectedTemplate === 'PdfForm' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                PDF 렌더 스케일: <span className="font-mono text-blue-600">{pdfRenderScale}</span>
              </label>
              <input
                type="range"
                min={1.0}
                max={6.0}
                step={0.5}
                value={pdfRenderScale}
                onChange={(e) => setPdfRenderScale(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span><span>5.0</span><span>6.0</span>
              </div>
              <div className="text-[10px] text-gray-400">
                PDF canvas 해상도. 높을수록 PDF 텍스트/선 선명, 캡처 시간 증가
              </div>
            </div>
          )}

          {selectedTemplate === 'PdfForm' && (
            <PdfFormSelector
              searchQuery={formSearchQuery}
              onSearchChange={setFormSearchQuery}
              selectedFormId={loadedFormId}
              onSelectForm={handleSelectForm}
              pdfFormTotalPages={pdfFormTotalPages}
            />
          )}

          {/* 실행 버튼 */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                isGenerating ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isGenerating ? 'PDF 생성 중...' : 'PDF 생성'}
            </button>
            <button
              onClick={handleCompare}
              disabled={isGenerating}
              className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                isGenerating ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              A vs B 비교 (현재 vs pixelRatio=2, q=0.92)
            </button>
          </div>

          {/* 히스토리 초기화 */}
          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); setLastMetrics(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline self-end"
            >
              히스토리 초기화
            </button>
          )}
        </div>
      </div>

      {/* ── 중앙: 미리보기 ── */}
      <div className="flex-1 overflow-auto bg-gray-500 flex justify-center p-6 min-w-0">
        <div data-print-preview-root="true" className="shadow-2xl">
          {selectedTemplate === 'Receipt' && <Receipt receiptDetail={mockReceiptDetail} margin={10} />}
          {selectedTemplate === 'MedicalRecordCopy' && <MedicalRecordCopy patient={mockPatient} encounters={[mockEncounter]} margin={10} />}
          {selectedTemplate === 'MedicalExpense' && <MedicalExpense data={medicalExpenseData} margin={10} />}
          {selectedTemplate === 'Prescription' && (
            <iframe
              title="처방전 미리보기"
              className="bg-white"
              style={{ width: '210mm', height: '100%', border: 0, minHeight: '80vh' }}
              srcDoc={`<!doctype html><html lang="ko"><head><meta charset="utf-8"/><style>html,body{margin:0;padding:0;background:#ddd;}</style></head><body>${prescriptionHtml}</body></html>`}
            />
          )}
          {selectedTemplate === 'PdfForm' && loadedFormId && (
            <PdfFormTestSectionWithPageSync
              formId={loadedFormId}
              scale={pdfRenderScale}
              onTotalPagesChange={setPdfFormTotalPages}
            />
          )}
          {selectedTemplate === 'PdfForm' && !loadedFormId && (
            <div className="flex items-center justify-center h-64 bg-white rounded text-sm text-gray-400 px-8">
              좌측 패널에서 서식 ID를 입력하고 &quot;서식 로드&quot;를 클릭하세요.
            </div>
          )}
        </div>
      </div>

      {/* ── 우측 패널: 성능 결과 ── */}
      <div className="w-[480px] bg-white border-l flex flex-col overflow-y-auto shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-sm font-bold text-gray-800">성능 결과</h2>
        </div>

        <div className="p-4 space-y-3 flex-1">
          {lastMetrics ? (
            <div className="space-y-3">
              {/* 요약 수치 */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-gray-500">전체: </span>
                  <span className="font-mono font-semibold">{lastMetrics.totalMs.toFixed(0)}ms</span>
                </div>
                <div>
                  <span className="text-gray-500">페이지: </span>
                  <span className="font-mono font-semibold">{lastMetrics.pageCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">평균/p: </span>
                  <span className="font-mono font-semibold">
                    {lastMetrics.pageCount > 0 ? (lastMetrics.totalMs / lastMetrics.pageCount).toFixed(0) : '-'}ms
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">크기: </span>
                  <span className="font-mono font-semibold">{lastMetrics.fileSizeKB.toFixed(1)}KB</span>
                </div>
                <div>
                  <span className="text-gray-500">pxRatio: </span>
                  <span className="font-mono">{lastMetrics.settings.pixelRatio}</span>
                </div>
                <div>
                  <span className="text-gray-500">quality: </span>
                  <span className="font-mono">{lastMetrics.settings.quality}</span>
                </div>
                <div>
                  <span className="text-gray-500">format: </span>
                  <span className="font-mono">{lastMetrics.settings.imageFormat}</span>
                </div>
              </div>

              {/* 바 차트 */}
              <MetricsBarChart metrics={lastMetrics} />

              {/* 페이지별 상세 */}
              {lastMetrics.pages.length > 1 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">페이지별 상세 ({lastMetrics.pages.length}페이지)</summary>
                  <div className="mt-1.5 space-y-0.5 font-mono text-gray-600">
                    {lastMetrics.pages.map((p, i) => (
                      <div key={i}>
                        [{i + 1}] wait={p.waitFramesMs.toFixed(0)} | clone={p.cloneMs.toFixed(0)} | img={p.toJpegMs.toFixed(0)} | size={p.imgSizeMs.toFixed(0)} | add={p.addImageMs.toFixed(0)}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">PDF를 생성하면 여기에 성능 결과가 표시됩니다.</div>
          )}

          {/* 히스토리 */}
          {history.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <h3 className="text-xs font-semibold text-gray-600">실행 히스토리 (최근 순)</h3>
              <HistoryTable runs={history} />
            </div>
          )}

          {/* 캡처 이미지 비교 */}
          {history.length > 0 && history.some((r) => r.capturedImageUrl) && (
            <CapturedImageComparison runs={history} />
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// PdfFormTestSection with page sync via custom events
// ────────────────────────────────────────────────

function PdfFormTestSectionWithPageSync({
  formId,
  scale,
  onTotalPagesChange,
}: {
  formId: number;
  scale?: number;
  onTotalPagesChange: (pages: number) => void;
}) {
  const { data: formData, isLoading: isFormLoading, error: formError } = useFormById(formId);

  const pdfUuid = useMemo(() => {
    if (!formData) return null;
    const uuid = (formData.pdfFileInfo as any)?.uuid;
    return typeof uuid === 'string' && uuid.length > 0 ? uuid : null;
  }, [formData]);

  const { data: fileData, isLoading: isFileLoading } = useDownloadFileV2(pdfUuid);

  const pdfUrl = useMemo(() => {
    if (!fileData?.blob) return null;
    return URL.createObjectURL(fileData.blob);
  }, [fileData]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const fields = useMemo(() => formData?.fields ?? [], [formData]);

  const defaultValues = useMemo(() => {
    if (fields.length === 0) return {};
    return buildRhfDefaultsFromFields(fields as any);
  }, [fields]);

  const methods = useForm({ defaultValues });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // totalPages 변경 시 부모에 알림
  useEffect(() => {
    onTotalPagesChange(totalPages);
  }, [totalPages, onTotalPagesChange]);

  // 외부 페이지 변경 이벤트 리스너
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page && detail.page !== currentPage) {
        setCurrentPage(detail.page);
      }
    };
    window.addEventListener('pdf-perf-page-change', handler);
    return () => window.removeEventListener('pdf-perf-page-change', handler);
  }, [currentPage]);

  if (isFormLoading || isFileLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 bg-white rounded">
        서식 로딩 중... (formId: {formId})
      </div>
    );
  }

  if (formError) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-red-500 bg-white rounded">
        서식 로드 실패: {formError instanceof Error ? formError.message : '알 수 없는 오류'}
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500 bg-white rounded">
        PDF 파일을 찾을 수 없습니다. (renderType이 PDF가 아니거나 pdfFileInfo가 없음)
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="w-full h-full flex flex-col">
        <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 border-b flex items-center gap-3">
          <span>서식 ID: {formId}</span>
          <span>필드: {fields.length}개</span>
          <span>페이지: {currentPage}/{totalPages}</span>
        </div>
        <div className="flex-1 overflow-auto">
          <PdfWithFieldOverlay
            file={pdfUrl}
            fields={fields as any}
            currentPage={currentPage}
            onPageChangeAction={setCurrentPage}
            onTotalPagesChangeAction={setTotalPages}
            isEditMode={false}
            showNavigation={true}
            scale={scale}
          />
        </div>
      </div>
    </FormProvider>
  );
}

// ────────────────────────────────────────────────
// PdfFormSelector — 서식 목록 검색 + 폴더별 선택
// ────────────────────────────────────────────────

function PdfFormSelector({
  searchQuery,
  onSearchChange,
  selectedFormId,
  onSelectForm,
  pdfFormTotalPages,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedFormId: number | null;
  onSelectForm: (formId: number, formName: string) => void;
  pdfFormTotalPages: number;
}) {
  const { data: hierarchyData, isLoading } = useFormsHierarchy(searchQuery);
  const folders = hierarchyData?.folders ?? [];

  return (
    <fieldset className="space-y-2 rounded border bg-gray-50 overflow-hidden">
      <legend className="text-xs font-semibold text-gray-700 px-1 ml-2.5">PDF 서식 선택</legend>
      {/* 검색 */}
      <div className="px-2.5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="서식명 검색..."
          className="w-full border rounded px-2 py-1 text-xs"
        />
      </div>

      {/* 서식 목록 */}
      <div className="max-h-60 overflow-y-auto px-1">
        {isLoading && (
          <div className="text-[11px] text-gray-400 px-2 py-2">로딩 중...</div>
        )}
        {!isLoading && folders.length === 0 && (
          <div className="text-[11px] text-gray-400 px-2 py-2">서식이 없습니다.</div>
        )}
        {folders.map((folder) => (
          <FormFolderItem
            key={folder.name}
            folder={folder}
            selectedFormId={selectedFormId}
            onSelectForm={onSelectForm}
          />
        ))}
      </div>

      {/* 선택된 서식 정보 */}
      {selectedFormId && (
        <div className="text-[11px] text-green-600 px-2.5 pb-2">
          선택됨: id={selectedFormId}, pages={pdfFormTotalPages}
        </div>
      )}
    </fieldset>
  );
}

function FormFolderItem({
  folder,
  selectedFormId,
  onSelectForm,
}: {
  folder: { name: string; children: Array<{ id: number; name: string; isFavorite: boolean }> };
  selectedFormId: number | null;
  onSelectForm: (formId: number, formName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (folder.children.length === 0) return null;

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 rounded"
      >
        <span className="text-[10px]">{isOpen ? '▼' : '▶'}</span>
        <span className="truncate">{folder.name}</span>
        <span className="text-gray-400 ml-auto shrink-0">{folder.children.length}</span>
      </button>
      {isOpen && (
        <div className="ml-3">
          {folder.children.map((form) => (
            <button
              key={form.id}
              onClick={() => onSelectForm(form.id, form.name)}
              className={`w-full text-left px-1.5 py-0.5 text-[11px] rounded truncate transition-colors ${
                selectedFormId === form.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={`${form.name} (id: ${form.id})`}
            >
              {form.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
