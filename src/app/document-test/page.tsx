'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Receipt } from '@/app/document/_reception_templates/Receipt/Receipt';
import { MedicalRecordCopy } from '@/app/document/_reception_templates/MedicalRecordCopy/MedicalRecordCopy';
import { MedicalExpense, transformToMedicalExpenseData } from '@/app/document/_reception_templates/MedicalExpense';
import { Patient } from '@/types/patient-types';
import { Encounter } from '@/types/chart/encounter-types';
import { MedicalBillReceiptResponseDto } from '@/types/receipt/medical-bill-receipt-types';
import { InputType } from '@/types/chart/order-types';
import { createPdfBlobFromDom, createPdfBlobFromHtml } from '@/lib/pdf/client-pdf-generator';
import { buildPrescriptionHtml, type KoreanPrescriptionData } from '@/lib/prescription/build-prescription-html-client';

type TemplateId = 'Receipt' | 'MedicalRecordCopy' | 'MedicalExpense' | 'Prescription';
type PrescriptionScenario = 'single' | 'multi';
const DEFAULT_MEDICAL_EXPENSE_TEST_ROW_COUNT = 30;

// Mock Patient Data
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
};

// Mock Encounter Data
const mockEncounter: Encounter = {
  id: 'enc-123',
  registrationId: 'reg-123',
  patientId: 239,
  encounterDateTime: '2025-09-01T10:00:00Z',
  doctorId: 1,
  receptionType: 1 as any,
  timeCategory: 1 as any,
  diseases: [
    { code: 'I10', name: '본태성(원발성) 고혈압' } as any,
  ],
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
      {
        항목구분: '0101',
        본인부담금: 3948,
        공단부담금: 9212,
        전액본인부담금: 0,
        비급여금: 0,
      },
      {
        항목구분: '0201',
        본인부담금: 9945,
        공단부담금: 23205,
        전액본인부담금: 0,
        비급여금: 1610,
      },
    ],
  } as any,
  startDateTime: '2025-09-01T10:00:00Z',
  endDateTime: '2025-09-01T10:30:00Z',
  createId: 1,
  createDateTime: '2025-09-01T10:00:00Z',
  updateId: null,
  updateDateTime: null,
} as any;

// Mock Receipt Data
const mockPaymentAmount = {
  insuredCopay: 3948,
  insuredFullPay: 0,
  insurerPayment: 9212,
  uninsured: 0,
};

const mockZeroPaymentAmount = {
  insuredCopay: 0,
  insuredFullPay: 0,
  insurerPayment: 0,
  uninsured: 0,
};

const mockReceiptDetail: MedicalBillReceiptResponseDto = {
  header: {
    patientNo: String(mockPatient.patientNo),
    patientName: mockPatient.name,
    treatmentPeriod: {
      startDate: '2025-09-01',
      endDate: '2025-09-01',
    },
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
      labTest: {
        insuredCopay: 9945,
        insuredFullPay: 0,
        insurerPayment: 23205,
        uninsured: 1610,
      },
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
    totals: {
      insuredCopay: 13893,
      insuredFullPay: 0,
      insurerPayment: 32417,
      uninsured: 1610,
    },
  },
  summary: {
    totalMedicalExpense: 47920,
    insurerPayment: 32417,
    patientPayment: 13893 + 1610,
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
            금액: 1000,
            횟수: 1,
            일수: 1,
            총액: 1000,
            본인부담금: 1000,
            전액본인부담금: 0,
            비급여금: 0
          }))
        ]
      }
    },
    {
      ...mockEncounter,
      encounterDateTime: '2025-07-08T14:00:00Z',
      patient: mockPatient,
      calcResultData: {
        항목별내역s: [
          { 항목: '주사료', 코드: '0176', 명칭: '이이비글로불린에스앤주', 금액: 100000, 횟수: 2, 일수: 1, 총액: 200000, 본인부담금: 0, 전액본인부담금: 0, 비급여금: 200000 },
          { 항목: '주사료', 코드: '0172', 명칭: '아스코르브산', 금액: 800, 횟수: 1, 일수: 1, 총액: 800, 본인부담금: 0, 전액본인부담금: 0, 비급여금: 800 },
        ]
      }
    }
  ];

  return transformToMedicalExpenseData({
    encounters: mockMedicalExpenseEncounters,
    hospitalInfo: { name: '(주)녹십자홀딩스 부속의원', representative: '허용준' }
  });
}

export default function DocumentTestPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('Receipt');
  const [margin, setMargin] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [medicalExpenseTestRowCount, setMedicalExpenseTestRowCount] = useState(DEFAULT_MEDICAL_EXPENSE_TEST_ROW_COUNT);
  const [prescriptionScenario, setPrescriptionScenario] = useState<PrescriptionScenario>('single');
  const [useFormPaper, setUseFormPaper] = useState(false);
  const [showBackgroundImage, setShowBackgroundImage] = useState(false);

  const templates = [
    { id: 'Receipt', name: '영수증 (별지 제6호)' },
    { id: 'MedicalRecordCopy', name: '진료기록 사본' },
    { id: 'MedicalExpense', name: '진료비 내역서 (가로)' },
    { id: 'Prescription', name: '처방전 (출력센터 / HTML 기반)' },
  ];

  const prescriptionData = useMemo(() => {
    if (prescriptionScenario === 'multi') {
      return createMockKoreanPrescriptionData({
        outMedicineCount: 40,
        injectionCount: 20,
      });
    }

    return createMockKoreanPrescriptionData({
      outMedicineCount: 6,
      injectionCount: 3,
    });
  }, [prescriptionScenario]);

  const [prescriptionHtml, setPrescriptionHtml] = useState('');
  useEffect(() => {
    buildPrescriptionHtml(prescriptionData, {
      useFormPaper,
      showBackgroundImage,
    }).then(setPrescriptionHtml);
  }, [prescriptionData, showBackgroundImage, useFormPaper]);

  const prescriptionPageCount = useMemo(() => {
    return countPrescriptionPages(prescriptionHtml);
  }, [prescriptionHtml]);

  const medicalExpenseData = useMemo(() => {
    return createMockMedicalExpenseData(medicalExpenseTestRowCount);
  }, [medicalExpenseTestRowCount]);

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);

      const blob =
        selectedTemplate === 'Prescription'
          ? await createPdfBlobFromHtml({
            html: prescriptionHtml,
            options: {
              pageSelector: '.A4',
              backgroundColor: '#ffffff',
              pixelRatio: 3,
              quality: 1.0,
            },
          })
          : await (async function generatePdfFromDom() {
            const printableRoot = document.querySelector('[data-print-preview-root="true"]') as HTMLElement;
            if (!printableRoot) {
              alert('출력할 요소를 찾을 수 없습니다.');
              throw new Error('printableRoot not found');
            }
            return await createPdfBlobFromDom({
              root: printableRoot,
              options: {
                backgroundColor: '#ffffff',
                pixelRatio: 3,
                quality: 1.0,
              },
            });
          })();

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-4 flex flex-col gap-4">
        <h1 className="text-xl font-bold mb-4">서식 테스트 베드</h1>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">템플릿 선택</label>
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id as any)}
              className={`p-2 text-left rounded transition-colors ${selectedTemplate === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 hover:bg-gray-200 text-gray-700'
                }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-medium text-gray-700">여백 (mm): {margin}</label>
          <input
            type="range"
            min="0"
            max="50"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="w-full"
            disabled={selectedTemplate === 'Prescription'}
          />
          {selectedTemplate === 'Prescription' && (
            <div className="text-xs text-gray-500">
              처방전은 HTML 기반 서식이라 여기서는 여백 슬라이더를 사용하지 않습니다.
            </div>
          )}
        </div>

        {selectedTemplate === 'MedicalExpense' && (
          <div className="flex flex-col gap-2 mt-4 p-3 rounded border bg-gray-50">
            <label className="text-sm font-medium text-gray-700">
              테스트 행 개수: {medicalExpenseTestRowCount}
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={medicalExpenseTestRowCount}
              onChange={(e) => setMedicalExpenseTestRowCount(Number(e.target.value))}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="200"
              value={medicalExpenseTestRowCount}
              onChange={(e) => setMedicalExpenseTestRowCount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
            <div className="text-xs text-gray-500">
              MedicalExpense 페이지 분할/테이블 렌더링 테스트용 데이터 행 수를 조절합니다.
            </div>
          </div>
        )}

        {selectedTemplate === 'Prescription' && (
          <div className="flex flex-col gap-3 mt-4 p-3 rounded border bg-gray-50">
            <div className="text-sm font-semibold text-gray-800">처방전 옵션</div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700">테스트 케이스</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPrescriptionScenario('single')}
                  className={`px-3 py-2 rounded text-sm transition-colors ${prescriptionScenario === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  단일 페이지
                </button>
                <button
                  onClick={() => setPrescriptionScenario('multi')}
                  className={`px-3 py-2 rounded text-sm transition-colors ${prescriptionScenario === 'multi'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  다페이지(여러 장)
                </button>
              </div>
              <div className="text-xs text-gray-600">
                현재 생성 페이지 수: <b>{prescriptionPageCount}</b>장
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-[#171719] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useFormPaper}
                onChange={(e) => setUseFormPaper(e.target.checked)}
                className="h-4 w-4"
              />
              양식지 사용
            </label>

            <label className="flex items-center gap-2 text-[13px] text-[#171719] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBackgroundImage}
                onChange={(e) => setShowBackgroundImage(e.target.checked)}
                className="h-4 w-4"
              />
              배경 이미지 (디버그)
            </label>

            <div className="text-xs text-gray-600">
              PDF 생성 버튼은 처방전일 때 <code>createPdfBlobFromHtml</code>로 생성합니다.
            </div>
          </div>
        )}

        <button
          onClick={handleGeneratePdf}
          disabled={isGenerating}
          className={`mt-4 p-2 text-white rounded transition-colors flex items-center justify-center gap-2 ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
        >
          <span>{isGenerating ? 'PDF 생성 중...' : 'PDF 생성 (새 창)'}</span>
        </button>

        <div className="mt-auto p-4 bg-blue-50 rounded text-xs text-blue-700">
          이 페이지는 <code>_reception_templates</code> 하위의 서식들을 직접 확인하고 디버깅하기 위한 용도입니다.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-500">
        <div className="shadow-2xl">
          {selectedTemplate === 'Receipt' && (
            <Receipt
              receiptDetail={mockReceiptDetail}
              margin={margin}
            />
          )}
          {selectedTemplate === 'MedicalRecordCopy' && (
            <MedicalRecordCopy
              patient={mockPatient}
              encounters={[mockEncounter]}
              margin={margin}
            />
          )}
          {selectedTemplate === 'MedicalExpense' && (
            <MedicalExpense
              data={medicalExpenseData}
              margin={margin}
            />
          )}
          {selectedTemplate === 'Prescription' && (
            <div className="bg-gray-500 p-4">
              <div className="mb-3 text-sm text-white">
                처방전은 HTML 기반이라 iframe으로 격리 렌더링합니다. (페이지 스크롤 가능)
              </div>
              <iframe
                title="처방전 미리보기"
                className="bg-white shadow-2xl"
                style={{ width: '210mm', height: '90vh', border: 0 }}
                srcDoc={wrapPrescriptionPreviewHtml(prescriptionHtml)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    조제시참고사항:
      '다페이지 테스트용 참고사항입니다.\n원외약품/주사제 항목 수가 많을 때 페이지가 정상 분리되는지 확인하세요.',
    병원: {
      요양기관명: '(주)녹십자홀딩스 부속의원',
      요양기관번호: '12345678',
      주소1: '경기도 용인시 기흥구 보정동',
      주소2: '123-45',
      전화번호: '031-123-4567',
      팩스번호: '031-987-6543',
      이메일: 'test@hospital.example',
    },
    환자: {
      성명: '재후존',
      주민등록번호: '900101-1234567',
    },
    접수: {
      보험구분: 1, // 의료보험
    },
    의사: {
      이름: '허용준',
      면허번호: '12345',
      직인이미지Base64: null,
      직인이미지: null,
    },
    상병목록: [{ 코드: 'I10' }, { 코드: 'E11' }],
    주사제처방내역원내조제여부: true,
    주사제처방내역원외처방여부: false,
    원외약품처방목록: [{ 페이지: 1, 목록: outMedicines }],
    주사제처방목록: [{ 페이지: 1, 목록: injections }],
  };
}

function countPrescriptionPages(html: string): number {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const pages = doc.querySelectorAll('.A4');
    return Math.max(pages.length, 1);
  } catch {
    return 1;
  }
}

function wrapPrescriptionPreviewHtml(prescriptionHtml: string): string {
  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>처방전 미리보기</title>
        <style>
          html, body { margin: 0; padding: 0; background: #ddd; }
        </style>
      </head>
      <body>
        ${prescriptionHtml}
      </body>
    </html>
  `;
}
