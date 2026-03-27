import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api/api-client";
import { useSocket } from "@/contexts/SocketContext";
import { buildPrescriptionHtml, type PrescriptionPurposeLabel } from "@/lib/prescription/build-prescription-html-client";
import { FileService } from "@/services/file-service";
import { DocumentsService } from "@/services/documents-service";
import { EncountersService } from "@/services/encounters-service";
import { PatientsService } from "@/services/patients-service";
import { RegistrationsService } from "@/services/registrations-service";
import type { KoreanPrescriptionData } from "@/lib/prescription/build-prescription-html-client";
import { ensurePrescriptionImages } from "@/lib/prescription/prescription-utils";
import { usePrescriptionPdfGeneratorV2 as usePrescriptionPdfGenerator } from "./use-prescription-pdf-generator-v2";
import { useReceptionPrintGenerator } from "./use-reception-print-generator";
import { useReceptionHtmlGenerator } from "./use-reception-html-generator";
import { OutputTypeCode } from "@/types/printer-types";
import { DocumentType } from "@/components/reception/(print-center)/print-center-types";
import { usePrintPopupStore, type RenderContentResult } from "@/store/print-popup-store";
import { usePrintersStore } from "@/store/printers-store";
import { PrintableDocument, PAPER_SIZES } from "@/lib/printable";
import { MedicalRecordCopy } from "@/app/document/_reception_templates/MedicalRecordCopy/MedicalRecordCopy";
import { MedicalExpense } from "@/app/document/_reception_templates/MedicalExpense/MedicalExpense";
import { transformDetailedStatementToMedicalExpenseData } from "@/app/document/_reception_templates/MedicalExpense/utils";
import { Receipt } from "@/app/document/_reception_templates/Receipt/Receipt";
import { mergeMedicalBillReceipts, mergeDetailedStatements } from "@/lib/print/merge-print-data";
import React from "react";

function shouldPrintPrescription(prescriptionData: KoreanPrescriptionData): boolean {
  const hasOutpatientPrescription = prescriptionData.원외약품처방목록?.some(
    (page) => page.목록 && page.목록.length > 0
  );
  const hasInjectionPrescription = prescriptionData.주사제처방목록?.some(
    (page) => page.목록 && page.목록.length > 0
  );
  const isInjectionInClinicOnly =
    prescriptionData.주사제처방내역원내조제여부 === true &&
    prescriptionData.주사제처방내역원외처방여부 !== true;
  const hasOutpatientInjection = hasInjectionPrescription && !isInjectionInClinicOnly;

  return Boolean(hasOutpatientPrescription || hasOutpatientInjection);
}

type BuildOptions = {
  useFormPaper?: boolean;
  showBackgroundImage?: boolean;
  debugMode?: boolean;
  purposeLabel?: PrescriptionPurposeLabel;
};

type PrintOptions = {
  pdf: Blob;
  copies?: number;
  paperSize?: string;
  fileNamePrefix?: string;
  agentId?: string;
  outputTypeCode: OutputTypeCode;
};

const DEFAULT_COPIES = 1;
const DEFAULT_PAPER_SIZE = "A4";
const DEFAULT_FILE_PREFIX = "document";
const COMBINED_PAGE_SELECTOR = ".printable-page, .A4";

const PRESCRIPTION_HTML_DEFAULT_OPTIONS: BuildOptions = {
  useFormPaper: false,
  showBackgroundImage: false,
  debugMode: false,
};

/** 프린터 설정에서 처방전 양식지 사용 여부를 조회합니다. (OUTPATIENT_RX 출력 타입 기준) */
function resolvePrescriptionFormSetting(): boolean {
  const { outputTypes } = usePrintersStore.getState();
  const rxType = outputTypes.find((t) => t.code === OutputTypeCode.OUTPATIENT_RX);
  return rxType?.setting?.usePrescriptionForm ?? false;
}

// FIXME: 커밋용 임시 주석
const PLACEHOLDER_TEXT_STYLE: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  textAlign: "center",
  padding: "48px 24px",
};

type PlaceholderDocumentProps = {
  title: string;
  description?: string;
  paper?: (typeof PAPER_SIZES)[keyof typeof PAPER_SIZES];
};

function PlaceholderDocument({
  title,
  description,
  paper = PAPER_SIZES.A4,
}: PlaceholderDocumentProps) {
  return (
    <PrintableDocument paper={paper} margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
      <div style={PLACEHOLDER_TEXT_STYLE}>{title}</div>
      {description ? (
        <div style={{ fontSize: "13px", textAlign: "center" }}>{description}</div>
      ) : null}
    </PrintableDocument>
  );
}

/**
 * 처방전 HTML을 Shadow DOM으로 렌더링하는 컴포넌트.
 * Shadow DOM이 CSS를 완전히 격리하므로 처방전 스타일이 다른 서식에 영향을 주지 않는다.
 *
 * 페이지 탐색 호환:
 *   - Shadow 내부의 .A4 요소를 외부에서 찾을 수 없으므로,
 *     호스트 엘리먼트에 data-shadow-pages 속성을 설정하여
 *     document-print-popup의 queryAllPages 헬퍼가 shadow root 내부를 탐색할 수 있게 한다.
 */
function PrescriptionHtmlDocument({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    // DOCTYPE 제거 (shadow root 내부에서 불필요)
    shadow.innerHTML = html.replace(/<!DOCTYPE\s+html\s*>/gi, '');

    // shadow 내부 .A4 페이지 수를 호스트에 기록
    const pages = shadow.querySelectorAll('.A4');
    host.setAttribute('data-shadow-pages', String(pages.length));
  }, [html]);

  return <div ref={hostRef} className="prescription-shadow-host" />;
}


export function usePrintService() {
  const { openPrintPopup } = usePrintPopupStore();
  const queryClient = useQueryClient();
  const { generatePdf: generatePrescriptionPdf, isGenerating: isGeneratingPrescription, HiddenRenderer: PrescriptionHiddenRenderer } =
    usePrescriptionPdfGenerator();
  const { generatePdf: generateReceptionPdf, HiddenRenderer: ReceptionHiddenRenderer } =
    useReceptionPrintGenerator();
  const { generateHtml: generateReceptionHtml, HiddenRenderer: ReceptionHtmlHiddenRenderer } =
    useReceptionHtmlGenerator();

  const outputTypes = usePrintersStore((state) => state.outputTypes);
  const fetchOutputTypes = usePrintersStore((state) => state.fetchOutputTypes);

  useEffect(function loadPrinterOutputTypesIfNeeded() {
    if (outputTypes.length === 0) {
      fetchOutputTypes().catch(console.error);
    }
  }, [outputTypes.length, fetchOutputTypes]);

  const fetchExternalPrescriptionData = useCallback(
    async (encounterId: string): Promise<KoreanPrescriptionData> => {
      // FIXME: react-query 적용 필요 (현재는 fetchQuery로 중복 요청 완화)
      return await queryClient.fetchQuery({
        queryKey: ["documents", "external-prescription", encounterId],
        queryFn: () => DocumentsService.getExternalPrescriptionData(encounterId) as Promise<KoreanPrescriptionData>,
      });
    },
    [queryClient]
  );

  /**
   * 원외 처방전 출력 여부를 사전 검증합니다.
   * - 원외 처방(약품/주사) 없으면 false
   * - 네트워크/서버 오류는 throw
   */
  const checkShouldPrintPrescription = useCallback(
    async (encounterId: string): Promise<boolean> => {
      const prescriptionData = await fetchExternalPrescriptionData(encounterId);
      return shouldPrintPrescription(prescriptionData);
    },
    [fetchExternalPrescriptionData]
  );

  const buildPrescriptionPdf = useCallback(
    async (encounterId: string, options?: BuildOptions): Promise<string | null> => {
      console.log("[PrintService] buildPrescriptionPdf 시작:", encounterId);
      const startTime = performance.now();

      try {
        const prescriptionData = await fetchExternalPrescriptionData(encounterId);
        console.log("[PrintService] 처방전 데이터 조회 완료");

        // 원외 처방이 없으면 null 반환 (에러가 아닌 정상 비즈니스 케이스)
        if (!shouldPrintPrescription(prescriptionData)) {
          console.log("[PrintService] 원외 처방이 없어 처방전 PDF 생성을 건너뜁니다.");
          return null;
        }

        // 이미지(의사 직인 등) 데이터 처리
        const processedPrescription = await ensurePrescriptionImages(prescriptionData);

        const resolvedUseFormPaper = options?.useFormPaper ?? resolvePrescriptionFormSetting();

        const result = await generatePrescriptionPdf(processedPrescription, {
          useFormPaper: resolvedUseFormPaper,
          showBackgroundImage: options?.showBackgroundImage,
          debugMode: options?.debugMode,
          purposeLabel: options?.purposeLabel,
        });

        const duration = performance.now() - startTime;
        console.log(`[PrintService] buildPrescriptionPdf 완료: ${duration.toFixed(0)}ms`);

        return result;
      } catch (error) {
        console.error("[PrintService] buildPrescriptionPdf 실패:", error);
        throw error;
      }
    },
    [generatePrescriptionPdf]
  );

  const buildMedicalRecordPdf = useCallback(
    async (patient: any, encounters: any[]) => {
      return await generateReceptionPdf(
        <MedicalRecordCopy patient={patient} encounters={encounters} />
      );
    },
    [generateReceptionPdf]
  );

  const buildDetailedStatementPdf = useCallback(
    async (encounterId: string): Promise<Blob> => {
      console.log("[PrintService] buildDetailedStatementPdf 시작:", encounterId);
      const startTime = performance.now();

      try {
        const detailedStatement = await queryClient.fetchQuery({
          queryKey: ["documents", "detailed-statement", encounterId],
          queryFn: () => DocumentsService.getDetailedStatement(encounterId),
        });
        console.log("[PrintService] 진료비내역서 데이터 조회 완료");

        const medicalExpenseData =
          transformDetailedStatementToMedicalExpenseData(detailedStatement);

        const pdf = await generateReceptionPdf(
          <MedicalExpense data={medicalExpenseData} />
        );

        const duration = performance.now() - startTime;
        console.log(`[PrintService] buildDetailedStatementPdf 완료: ${duration.toFixed(0)}ms`);

        return pdf;
      } catch (error) {
        console.error("[PrintService] buildDetailedStatementPdf 실패:", error);
        throw error;
      }
    },
    [generateReceptionPdf, queryClient]
  );

  /**
   * 영수증 PDF를 생성합니다.
   */
  const buildReceiptPdf = useCallback(
    async (encounterId: string): Promise<Blob> => {
      console.log("[PrintService] buildReceiptPdf 시작:", encounterId);
      const startTime = performance.now();

      try {
        const receiptDetail = await queryClient.fetchQuery({
          queryKey: ["documents", "medical-bill-receipt", encounterId],
          queryFn: async () => {
            console.log("[PrintService] 진료비 영수증 데이터 조회 시작");
            return DocumentsService.getMedicalBillReceipt(encounterId);
          },
        });
        console.log("[PrintService] 진료비 영수증 데이터 조회 완료:", receiptDetail);

        const pdf = await generateReceptionPdf(
          <Receipt receiptDetail={receiptDetail} />
        );

        const duration = performance.now() - startTime;
        console.log(`[PrintService] buildReceiptPdf 완료: ${duration.toFixed(0)}ms`);

        return pdf;
      } catch (error) {
        console.error("[PrintService] buildReceiptPdf 실패:", error);
        throw error;
      }
    },
    [generateReceptionPdf, queryClient]
  );

  /**
   * 여러 encounter의 영수증 데이터를 합본하여 하나의 PDF로 생성합니다.
   */
  const buildCombinedReceiptPdf = useCallback(
    async (encounterIds: string[]): Promise<Blob> => {
      console.log("[PrintService] buildCombinedReceiptPdf 시작:", encounterIds);
      const startTime = performance.now();

      try {
        const receiptDetails = await Promise.all(
          encounterIds.map((encounterId) =>
            queryClient.fetchQuery({
              queryKey: ["documents", "medical-bill-receipt", encounterId],
              queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
            })
          )
        );
        console.log("[PrintService] 합본 영수증 데이터 조회 완료:", receiptDetails.length, "건");

        const mergedReceipt = mergeMedicalBillReceipts(receiptDetails);

        const pdf = await generateReceptionPdf(
          <Receipt receiptDetail={mergedReceipt} />
        );

        const duration = performance.now() - startTime;
        console.log(`[PrintService] buildCombinedReceiptPdf 완료: ${duration.toFixed(0)}ms`);

        return pdf;
      } catch (error) {
        console.error("[PrintService] buildCombinedReceiptPdf 실패:", error);
        throw error;
      }
    },
    [generateReceptionPdf, queryClient]
  );

  /**
   * 여러 encounter의 진료비내역서 데이터를 합본하여 하나의 PDF로 생성합니다.
   */
  const buildCombinedDetailedStatementPdf = useCallback(
    async (encounterIds: string[]): Promise<Blob> => {
      console.log("[PrintService] buildCombinedDetailedStatementPdf 시작:", encounterIds);
      const startTime = performance.now();

      try {
        const statements = await Promise.all(
          encounterIds.map((encounterId) =>
            queryClient.fetchQuery({
              queryKey: ["documents", "detailed-statement", encounterId],
              queryFn: () => DocumentsService.getDetailedStatement(encounterId),
            })
          )
        );
        console.log("[PrintService] 합본 진료비내역서 데이터 조회 완료:", statements.length, "건");

        const mergedStatement = mergeDetailedStatements(statements);
        const medicalExpenseData =
          transformDetailedStatementToMedicalExpenseData(mergedStatement);

        const pdf = await generateReceptionPdf(
          <MedicalExpense data={medicalExpenseData} isCombined />
        );

        const duration = performance.now() - startTime;
        console.log(`[PrintService] buildCombinedDetailedStatementPdf 완료: ${duration.toFixed(0)}ms`);

        return pdf;
      } catch (error) {
        console.error("[PrintService] buildCombinedDetailedStatementPdf 실패:", error);
        throw error;
      }
    },
    [generateReceptionPdf, queryClient]
  );

  /**
   * encounterId로 진료기록사본 PDF를 생성합니다.
   */
  const buildMedicalRecordPdfByEncounter = useCallback(
    async (encounterId: string): Promise<Blob> => {
      console.log("[PrintService] buildMedicalRecordPdfByEncounter 시작:", encounterId);
      const startTime = performance.now();

      try {
        const encounter = await EncountersService.getEncounter(encounterId);
        if (!encounter.registration && encounter.registrationId) {
          encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
        }
        console.log("[PrintService] encounter 데이터 조회 완료");

        const patient = await queryClient.fetchQuery({
          queryKey: ["patients", encounter.patientId],
          queryFn: () => PatientsService.getPatient(encounter.patientId),
        });
        console.log("[PrintService] patient 데이터 조회 완료");

        const pdf = await generateReceptionPdf(
          <MedicalRecordCopy patient={patient} encounters={[encounter]} />
        );

        const duration = performance.now() - startTime;
        console.log(`[PrintService] buildMedicalRecordPdfByEncounter 완료: ${duration.toFixed(0)}ms`);

        return pdf;
      } catch (error) {
        console.error("[PrintService] buildMedicalRecordPdfByEncounter 실패:", error);
        throw error;
      }
    },
    [generateReceptionPdf, queryClient]
  );

  const buildPrintCenterAllDocumentsPdf = useCallback(
    async (encounterId: string) => {
      const useFormPaper = resolvePrescriptionFormSetting();

      const detailedStatementPromise = queryClient.fetchQuery({
        queryKey: ["documents", "detailed-statement", encounterId],
        queryFn: () => DocumentsService.getDetailedStatement(encounterId),
      });
      const prescriptionPromise = DocumentsService.getExternalPrescriptionData(
        encounterId
      )
        .then((data) => ensurePrescriptionImages(data as KoreanPrescriptionData))
        .then((data) =>
          buildPrescriptionHtml(data, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper })
        )
        .catch(() => null);

      const encounter = await EncountersService.getEncounter(encounterId);
      if (!encounter.registration && encounter.registrationId) {
        encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
      }
      const patientPromise = queryClient.fetchQuery({
        queryKey: ["patients", encounter.patientId],
        queryFn: () => PatientsService.getPatient(encounter.patientId),
      });
      const receiptPromise = queryClient.fetchQuery({
        queryKey: ["documents", "medical-bill-receipt", encounterId],
        queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
      });

      const [detailedStatement, prescriptionHtml, patient, receiptDetail] =
        await Promise.all([
          detailedStatementPromise,
          prescriptionPromise,
          patientPromise,
          receiptPromise,
        ]);

      const medicalExpenseData =
        transformDetailedStatementToMedicalExpenseData(detailedStatement);

      const normalizedPrescriptionHtml = prescriptionHtml
        ? prescriptionHtml
        : null;

      const documentNodes = (
        <div>
          {normalizedPrescriptionHtml ? (
            <PrescriptionHtmlDocument html={normalizedPrescriptionHtml} />
          ) : (
            <PlaceholderDocument
              title="처방전"
              description="처방전 데이터를 불러올 수 없습니다."
              paper={PAPER_SIZES.A4}
            />
          )}

          <Receipt receiptDetail={receiptDetail} />

          <MedicalExpense data={medicalExpenseData} />

          {patient ? (
            <MedicalRecordCopy patient={patient} encounters={[encounter]} />
          ) : (
            <PlaceholderDocument
              title="진료기록 사본"
              description="진료기록 데이터를 불러올 수 없습니다."
              paper={PAPER_SIZES.A4}
            />
          )}
        </div>
      );

      return await generateReceptionPdf(documentNodes, {
        pageSelector: COMBINED_PAGE_SELECTOR,
      });
    },
    [generateReceptionPdf, queryClient]
  );

  // ── HTML 생성 메서드 (신규) ──

  /**
   * 영수증 HTML을 생성합니다.
   */
  const buildReceiptHtml = useCallback(
    async (encounterId: string): Promise<string> => {
      console.log("[PrintService] buildReceiptHtml 시작:", encounterId);
      const startTime = performance.now();

      const receiptDetail = await queryClient.fetchQuery({
        queryKey: ["documents", "medical-bill-receipt", encounterId],
        queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
      });

      const html = await generateReceptionHtml(
        <Receipt receiptDetail={receiptDetail} />
      );

      const duration = performance.now() - startTime;
      console.log(`[PrintService] buildReceiptHtml 완료: ${duration.toFixed(0)}ms`);
      return html;
    },
    [generateReceptionHtml, queryClient]
  );

  /**
   * 진료비 내역서 HTML을 생성합니다.
   */
  const buildDetailedStatementHtml = useCallback(
    async (encounterId: string): Promise<string> => {
      console.log("[PrintService] buildDetailedStatementHtml 시작:", encounterId);
      const startTime = performance.now();

      const detailedStatement = await queryClient.fetchQuery({
        queryKey: ["documents", "detailed-statement", encounterId],
        queryFn: () => DocumentsService.getDetailedStatement(encounterId),
      });

      const medicalExpenseData =
        transformDetailedStatementToMedicalExpenseData(detailedStatement);

      const html = await generateReceptionHtml(
        <MedicalExpense data={medicalExpenseData} />
      );

      const duration = performance.now() - startTime;
      console.log(`[PrintService] buildDetailedStatementHtml 완료: ${duration.toFixed(0)}ms`);
      return html;
    },
    [generateReceptionHtml, queryClient]
  );

  /**
   * 진료기록사본 HTML을 생성합니다.
   */
  const buildMedicalRecordHtmlByEncounter = useCallback(
    async (encounterId: string): Promise<string> => {
      console.log("[PrintService] buildMedicalRecordHtmlByEncounter 시작:", encounterId);
      const startTime = performance.now();

      const encounter = await EncountersService.getEncounter(encounterId);
      if (!encounter.registration && encounter.registrationId) {
        encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
      }

      const patient = await queryClient.fetchQuery({
        queryKey: ["patients", encounter.patientId],
        queryFn: () => PatientsService.getPatient(encounter.patientId),
      });

      const html = await generateReceptionHtml(
        <MedicalRecordCopy patient={patient} encounters={[encounter]} />
      );

      const duration = performance.now() - startTime;
      console.log(`[PrintService] buildMedicalRecordHtmlByEncounter 완료: ${duration.toFixed(0)}ms`);
      return html;
    },
    [generateReceptionHtml, queryClient]
  );

  /**
   * 출력센터 일괄 합본 HTML을 생성합니다.
   */
  const buildPrintCenterAllDocumentsHtml = useCallback(
    async (encounterId: string): Promise<string> => {
      console.log("[PrintService] buildPrintCenterAllDocumentsHtml 시작:", encounterId);
      const startTime = performance.now();

      const useFormPaper = resolvePrescriptionFormSetting();

      const detailedStatementPromise = queryClient.fetchQuery({
        queryKey: ["documents", "detailed-statement", encounterId],
        queryFn: () => DocumentsService.getDetailedStatement(encounterId),
      });
      const prescriptionPromise = DocumentsService.getExternalPrescriptionData(encounterId)
        .then((data) => ensurePrescriptionImages(data as KoreanPrescriptionData))
        .then((data) =>
          buildPrescriptionHtml(data, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper })
        )
        .catch(() => null);

      const encounter = await EncountersService.getEncounter(encounterId);
      if (!encounter.registration && encounter.registrationId) {
        encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
      }
      const patientPromise = queryClient.fetchQuery({
        queryKey: ["patients", encounter.patientId],
        queryFn: () => PatientsService.getPatient(encounter.patientId),
      });
      const receiptPromise = queryClient.fetchQuery({
        queryKey: ["documents", "medical-bill-receipt", encounterId],
        queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
      });

      const [detailedStatement, prescriptionHtml, patient, receiptDetail] =
        await Promise.all([
          detailedStatementPromise,
          prescriptionPromise,
          patientPromise,
          receiptPromise,
        ]);

      const medicalExpenseData =
        transformDetailedStatementToMedicalExpenseData(detailedStatement);

      const normalizedPrescriptionHtml = prescriptionHtml
        ? prescriptionHtml
        : null;

      const documentNodes = (
        <div>
          {normalizedPrescriptionHtml ? (
            <PrescriptionHtmlDocument html={normalizedPrescriptionHtml} />
          ) : (
            <PlaceholderDocument
              title="처방전"
              description="처방전 데이터를 불러올 수 없습니다."
              paper={PAPER_SIZES.A4}
            />
          )}

          <Receipt receiptDetail={receiptDetail} />

          <MedicalExpense data={medicalExpenseData} />

          {patient ? (
            <MedicalRecordCopy patient={patient} encounters={[encounter]} />
          ) : (
            <PlaceholderDocument
              title="진료기록 사본"
              description="진료기록 데이터를 불러올 수 없습니다."
              paper={PAPER_SIZES.A4}
            />
          )}
        </div>
      );

      const html = await generateReceptionHtml(documentNodes, {
        pageSelector: COMBINED_PAGE_SELECTOR,
      });

      const duration = performance.now() - startTime;
      console.log(`[PrintService] buildPrintCenterAllDocumentsHtml 완료: ${duration.toFixed(0)}ms`);
      return html;
    },
    [generateReceptionHtml, queryClient]
  );

  // ── 직접 렌더링용 콘텐츠 빌더 (renderContent) ──

  const renderReceiptContent = useCallback(
    async (encounterId: string): Promise<RenderContentResult> => {
      const receiptDetail = await queryClient.fetchQuery({
        queryKey: ["documents", "medical-bill-receipt", encounterId],
        queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
      });
      return { content: <Receipt receiptDetail={receiptDetail} /> };
    },
    [queryClient]
  );

  const renderDetailedStatementContent = useCallback(
    async (encounterId: string): Promise<RenderContentResult> => {
      const detailedStatement = await queryClient.fetchQuery({
        queryKey: ["documents", "detailed-statement", encounterId],
        queryFn: () => DocumentsService.getDetailedStatement(encounterId),
      });
      const medicalExpenseData =
        transformDetailedStatementToMedicalExpenseData(detailedStatement);
      return { content: <MedicalExpense data={medicalExpenseData} /> };
    },
    [queryClient]
  );

  const renderMedicalRecordContent = useCallback(
    async (encounterId: string): Promise<RenderContentResult> => {
      const encounter = await EncountersService.getEncounter(encounterId);
      if (!encounter.registration && encounter.registrationId) {
        encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
      }
      const patient = await queryClient.fetchQuery({
        queryKey: ["patients", encounter.patientId],
        queryFn: () => PatientsService.getPatient(encounter.patientId),
      });
      return { content: <MedicalRecordCopy patient={patient} encounters={[encounter]} /> };
    },
    [queryClient]
  );

  const renderPrintCenterAllContent = useCallback(
    async (encounterId: string): Promise<RenderContentResult> => {
      const useFormPaper = resolvePrescriptionFormSetting();

      const detailedStatementPromise = queryClient.fetchQuery({
        queryKey: ["documents", "detailed-statement", encounterId],
        queryFn: () => DocumentsService.getDetailedStatement(encounterId),
      });
      const prescriptionPromise = DocumentsService.getExternalPrescriptionData(encounterId)
        .then((data) => ensurePrescriptionImages(data as KoreanPrescriptionData))
        .then((data) =>
          buildPrescriptionHtml(data, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper })
        )
        .catch(() => null);

      const encounter = await EncountersService.getEncounter(encounterId);
      if (!encounter.registration && encounter.registrationId) {
        encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
      }
      const patientPromise = queryClient.fetchQuery({
        queryKey: ["patients", encounter.patientId],
        queryFn: () => PatientsService.getPatient(encounter.patientId),
      });
      const receiptPromise = queryClient.fetchQuery({
        queryKey: ["documents", "medical-bill-receipt", encounterId],
        queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
      });

      const [detailedStatement, prescriptionHtml, patient, receiptDetail] =
        await Promise.all([
          detailedStatementPromise,
          prescriptionPromise,
          patientPromise,
          receiptPromise,
        ]);

      const medicalExpenseData =
        transformDetailedStatementToMedicalExpenseData(detailedStatement);

      const normalizedPrescriptionHtml = prescriptionHtml
        ? prescriptionHtml
        : null;

      const documentNodes = (
        <div>
          {normalizedPrescriptionHtml ? (
            <PrescriptionHtmlDocument html={normalizedPrescriptionHtml} />
          ) : (
            <PlaceholderDocument
              title="처방전"
              description="처방전 데이터를 불러올 수 없습니다."
              paper={PAPER_SIZES.A4}
            />
          )}

          <Receipt receiptDetail={receiptDetail} />

          <MedicalExpense data={medicalExpenseData} />

          {patient ? (
            <MedicalRecordCopy patient={patient} encounters={[encounter]} />
          ) : (
            <PlaceholderDocument
              title="진료기록 사본"
              description="진료기록 데이터를 불러올 수 없습니다."
              paper={PAPER_SIZES.A4}
            />
          )}
        </div>
      );

      return { content: documentNodes, pageSelector: COMBINED_PAGE_SELECTOR };
    },
    [queryClient]
  );

  const renderPaymentDocumentsContent = useCallback(
    async (
      encounterId: string,
      opts: { includeReceipt: boolean; includeStatement: boolean }
    ): Promise<RenderContentResult> => {
      const documentNodes: React.ReactNode[] = [];

      if (opts.includeReceipt) {
        const receiptDetail = await queryClient.fetchQuery({
          queryKey: ["documents", "medical-bill-receipt", encounterId],
          queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
        });
        documentNodes.push(<Receipt receiptDetail={receiptDetail} key="receipt" />);
      }

      if (opts.includeStatement) {
        const detailedStatement = await queryClient.fetchQuery({
          queryKey: ["documents", "detailed-statement", encounterId],
          queryFn: () => DocumentsService.getDetailedStatement(encounterId),
        });
        documentNodes.push(
          <MedicalExpense
            data={transformDetailedStatementToMedicalExpenseData(detailedStatement)}
            key="statement"
          />
        );
      }

      const isCombined = documentNodes.length > 1;
      return {
        content: <div>{documentNodes}</div>,
        pageSelector: isCombined ? COMBINED_PAGE_SELECTOR : undefined,
      };
    },
    [queryClient]
  );

  const renderPrintCenterSelectiveContent = useCallback(
    async (options: {
      selections: { encounterId: string; documentTypes: DocumentType[] }[];
      combinedReceiptEncounterIds?: string[];
      combinedStatementEncounterIds?: string[];
    }): Promise<RenderContentResult> => {
      const useFormPaper = resolvePrescriptionFormSetting();
      const { selections, combinedReceiptEncounterIds = [], combinedStatementEncounterIds = [] } = options;

      const allNodes: React.ReactNode[] = [];
      let key = 0;

      // --- Phase 1: 합본 문서 ---
      if (combinedReceiptEncounterIds.length > 0) {
        const receipts = await Promise.all(
          combinedReceiptEncounterIds.map((eid) =>
            queryClient.fetchQuery({
              queryKey: ["documents", "medical-bill-receipt", eid],
              queryFn: () => DocumentsService.getMedicalBillReceipt(eid),
            })
          )
        );
        allNodes.push(<Receipt receiptDetail={mergeMedicalBillReceipts(receipts)} key={key++} />);
      }

      if (combinedStatementEncounterIds.length > 0) {
        const statements = await Promise.all(
          combinedStatementEncounterIds.map((eid) =>
            queryClient.fetchQuery({
              queryKey: ["documents", "detailed-statement", eid],
              queryFn: () => DocumentsService.getDetailedStatement(eid),
            })
          )
        );
        allNodes.push(
          <MedicalExpense
            data={transformDetailedStatementToMedicalExpenseData(mergeDetailedStatements(statements))}
            isCombined
            key={key++}
          />
        );
      }

      // --- Phase 2: 개별 encounter 문서 ---
      for (const { encounterId, documentTypes } of selections) {
        const hasPharmacyRx = documentTypes.includes(DocumentType.PHARMACY_PRESCRIPTION);
        const hasPatientRx = documentTypes.includes(DocumentType.PATIENT_PRESCRIPTION);
        const hasReceipt = documentTypes.includes(DocumentType.RECEIPT) &&
          !combinedReceiptEncounterIds.includes(encounterId);
        const hasStatement = documentTypes.includes(DocumentType.STATEMENT) &&
          !combinedStatementEncounterIds.includes(encounterId);
        const hasMedicalRecord = documentTypes.includes(DocumentType.MEDICAL_RECORD);

        const [pharmacyHtml, patientHtml, receiptDetail, statementData, encounterPatient] = await Promise.all([
          hasPharmacyRx
            ? DocumentsService.getExternalPrescriptionData(encounterId)
                .then((d) => ensurePrescriptionImages(d as KoreanPrescriptionData))
                .then((d) => buildPrescriptionHtml(d, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper, purposeLabel: "약국제출용" as PrescriptionPurposeLabel }))
                .catch(() => null)
            : Promise.resolve(null),
          hasPatientRx
            ? DocumentsService.getExternalPrescriptionData(encounterId)
                .then((d) => ensurePrescriptionImages(d as KoreanPrescriptionData))
                .then((d) => buildPrescriptionHtml(d, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper, purposeLabel: "환자보관용" as PrescriptionPurposeLabel }))
                .catch(() => null)
            : Promise.resolve(null),
          hasReceipt
            ? queryClient.fetchQuery({
                queryKey: ["documents", "medical-bill-receipt", encounterId],
                queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
              })
            : Promise.resolve(null),
          hasStatement
            ? queryClient.fetchQuery({
                queryKey: ["documents", "detailed-statement", encounterId],
                queryFn: () => DocumentsService.getDetailedStatement(encounterId),
              })
            : Promise.resolve(null),
          hasMedicalRecord
            ? (async () => {
                const encounter = await EncountersService.getEncounter(encounterId);
                if (!encounter.registration && encounter.registrationId) {
                  encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
                }
                const patient = await queryClient.fetchQuery({
                  queryKey: ["patients", encounter.patientId],
                  queryFn: () => PatientsService.getPatient(encounter.patientId),
                });
                return { encounter, patient };
              })()
            : Promise.resolve(null),
        ]);

        if (pharmacyHtml) {
          allNodes.push(<PrescriptionHtmlDocument html={pharmacyHtml} key={key++} />);
        }
        if (patientHtml) {
          allNodes.push(<PrescriptionHtmlDocument html={patientHtml} key={key++} />);
        }
        if (receiptDetail) {
          allNodes.push(<Receipt receiptDetail={receiptDetail} key={key++} />);
        }
        if (statementData) {
          allNodes.push(
            <MedicalExpense data={transformDetailedStatementToMedicalExpenseData(statementData)} key={key++} />
          );
        }
        if (encounterPatient) {
          allNodes.push(
            <MedicalRecordCopy patient={encounterPatient.patient} encounters={[encounterPatient.encounter]} key={key++} />
          );
        }
      }

      return {
        content: <div>{allNodes}</div>,
        pageSelector: COMBINED_PAGE_SELECTOR,
      };
    },
    [queryClient]
  );

  // ── HTML 모드 팝업 오프너 (신규) ──

  /**
   * 영수증 출력 팝업을 HTML 모드로 엽니다.
   */
  const openReceiptHtmlPrintPopup = useCallback(
    (encounterId: string) => {
      openPrintPopup({
        config: {
          title: "영수증 출력",
          outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
          fileNamePrefix: "receipt",
          outputMode: 'html',
        },
        renderContent: () => renderReceiptContent(encounterId),
      });
    },
    [openPrintPopup, renderReceiptContent]
  );

  /**
   * 진료비 내역서 출력 팝업을 HTML 모드로 엽니다.
   */
  const openDetailedStatementHtmlPrintPopup = useCallback(
    (encounterId: string) => {
      openPrintPopup({
        config: {
          title: "진료비 내역서 출력",
          outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
          fileNamePrefix: "medical-expense",
          outputMode: 'html',
        },
        renderContent: () => renderDetailedStatementContent(encounterId),
      });
    },
    [openPrintPopup, renderDetailedStatementContent]
  );

  /**
   * 진료기록사본 출력 팝업을 HTML 모드로 엽니다.
   */
  const openMedicalRecordHtmlPrintPopup = useCallback(
    (encounterId: string) => {
      openPrintPopup({
        config: {
          title: "진료기록사본 출력",
          outputTypeCode: OutputTypeCode.CHART,
          fileNamePrefix: "medical-record",
          outputMode: 'html',
        },
        renderContent: () => renderMedicalRecordContent(encounterId),
      });
    },
    [openPrintPopup, renderMedicalRecordContent]
  );

  /**
   * 출력센터 일괄 출력 팝업을 HTML 모드로 엽니다.
   */
  const openPrintCenterAllDocumentsHtmlPopup = useCallback(
    (encounterId: string) => {
      openPrintPopup({
        config: {
          title: "출력센터 일괄 출력",
          outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
          fileNamePrefix: "print-center",
          outputMode: 'html',
        },
        renderContent: () => renderPrintCenterAllContent(encounterId),
      });
    },
    [openPrintPopup, renderPrintCenterAllContent]
  );

  // ── 출력센터 선택적 HTML 빌드 ──

  type PrintCenterHtmlSelection = {
    encounterId: string;
    documentTypes: DocumentType[];
  };

  /**
   * 출력센터에서 사용자가 선택한 문서 유형만 골라 합본 HTML을 생성합니다.
   * 합본 영수증/내역서 옵션도 지원합니다.
   */
  const buildPrintCenterSelectiveHtml = useCallback(
    async (options: {
      selections: PrintCenterHtmlSelection[];
      combinedReceiptEncounterIds?: string[];
      combinedStatementEncounterIds?: string[];
    }): Promise<string> => {
      console.log("[PrintService] buildPrintCenterSelectiveHtml 시작");
      const startTime = performance.now();
      const useFormPaper = resolvePrescriptionFormSetting();
      const { selections, combinedReceiptEncounterIds = [], combinedStatementEncounterIds = [] } = options;

      const allNodes: React.ReactNode[] = [];
      let key = 0;

      // --- Phase 1: 합본 문서 ---

      if (combinedReceiptEncounterIds.length > 0) {
        const receipts = await Promise.all(
          combinedReceiptEncounterIds.map((eid) =>
            queryClient.fetchQuery({
              queryKey: ["documents", "medical-bill-receipt", eid],
              queryFn: () => DocumentsService.getMedicalBillReceipt(eid),
            })
          )
        );
        allNodes.push(<Receipt receiptDetail={mergeMedicalBillReceipts(receipts)} key={key++} />);
      }

      if (combinedStatementEncounterIds.length > 0) {
        const statements = await Promise.all(
          combinedStatementEncounterIds.map((eid) =>
            queryClient.fetchQuery({
              queryKey: ["documents", "detailed-statement", eid],
              queryFn: () => DocumentsService.getDetailedStatement(eid),
            })
          )
        );
        allNodes.push(
          <MedicalExpense
            data={transformDetailedStatementToMedicalExpenseData(mergeDetailedStatements(statements))}
            isCombined
            key={key++}
          />
        );
      }

      // --- Phase 2: 개별 encounter 문서 ---

      for (const { encounterId, documentTypes } of selections) {
        const hasPharmacyRx = documentTypes.includes(DocumentType.PHARMACY_PRESCRIPTION);
        const hasPatientRx = documentTypes.includes(DocumentType.PATIENT_PRESCRIPTION);
        const hasReceipt = documentTypes.includes(DocumentType.RECEIPT) &&
          !combinedReceiptEncounterIds.includes(encounterId);
        const hasStatement = documentTypes.includes(DocumentType.STATEMENT) &&
          !combinedStatementEncounterIds.includes(encounterId);
        const hasMedicalRecord = documentTypes.includes(DocumentType.MEDICAL_RECORD);

        // 필요한 데이터를 병렬로 fetch
        const [pharmacyHtml, patientHtml, receiptDetail, statementData, encounterPatient] = await Promise.all([
          hasPharmacyRx
            ? DocumentsService.getExternalPrescriptionData(encounterId)
                .then((d) => ensurePrescriptionImages(d as KoreanPrescriptionData))
                .then((d) => buildPrescriptionHtml(d, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper, purposeLabel: "약국제출용" as PrescriptionPurposeLabel }))
                .catch(() => null)
            : Promise.resolve(null),
          hasPatientRx
            ? DocumentsService.getExternalPrescriptionData(encounterId)
                .then((d) => ensurePrescriptionImages(d as KoreanPrescriptionData))
                .then((d) => buildPrescriptionHtml(d, { ...PRESCRIPTION_HTML_DEFAULT_OPTIONS, useFormPaper, purposeLabel: "환자보관용" as PrescriptionPurposeLabel }))
                .catch(() => null)
            : Promise.resolve(null),
          hasReceipt
            ? queryClient.fetchQuery({
                queryKey: ["documents", "medical-bill-receipt", encounterId],
                queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
              })
            : Promise.resolve(null),
          hasStatement
            ? queryClient.fetchQuery({
                queryKey: ["documents", "detailed-statement", encounterId],
                queryFn: () => DocumentsService.getDetailedStatement(encounterId),
              })
            : Promise.resolve(null),
          hasMedicalRecord
            ? (async () => {
                const encounter = await EncountersService.getEncounter(encounterId);
                if (!encounter.registration && encounter.registrationId) {
                  encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
                }
                const patient = await queryClient.fetchQuery({
                  queryKey: ["patients", encounter.patientId],
                  queryFn: () => PatientsService.getPatient(encounter.patientId),
                });
                return { encounter, patient };
              })()
            : Promise.resolve(null),
        ]);

        // 처방전 → 영수증 → 내역서 → 진료기록 순서로 노드 추가
        if (pharmacyHtml) {
          allNodes.push(<PrescriptionHtmlDocument html={pharmacyHtml} key={key++} />);
        }
        if (patientHtml) {
          allNodes.push(<PrescriptionHtmlDocument html={patientHtml} key={key++} />);
        }
        if (receiptDetail) {
          allNodes.push(<Receipt receiptDetail={receiptDetail} key={key++} />);
        }
        if (statementData) {
          allNodes.push(
            <MedicalExpense data={transformDetailedStatementToMedicalExpenseData(statementData)} key={key++} />
          );
        }
        if (encounterPatient) {
          allNodes.push(
            <MedicalRecordCopy patient={encounterPatient.patient} encounters={[encounterPatient.encounter]} key={key++} />
          );
        }
      }

      const html = await generateReceptionHtml(
        <div>{allNodes}</div>,
        { pageSelector: COMBINED_PAGE_SELECTOR }
      );

      const duration = performance.now() - startTime;
      console.log(`[PrintService] buildPrintCenterSelectiveHtml 완료: ${duration.toFixed(0)}ms`);
      return html;
    },
    [generateReceptionHtml, queryClient]
  );

  // ── 수납 후 영수증/내역서 HTML 빌드 ──

  /**
   * 수납 후 자동 출력용: 영수증과/또는 진료비내역서 합본 HTML을 생성합니다.
   */
  const buildPaymentDocumentsHtml = useCallback(
    async (
      encounterId: string,
      opts: { includeReceipt: boolean; includeStatement: boolean }
    ): Promise<string> => {
      console.log("[PrintService] buildPaymentDocumentsHtml 시작:", encounterId, opts);
      const startTime = performance.now();
      const documentNodes: React.ReactNode[] = [];

      if (opts.includeReceipt) {
        const receiptDetail = await queryClient.fetchQuery({
          queryKey: ["documents", "medical-bill-receipt", encounterId],
          queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
        });
        documentNodes.push(<Receipt receiptDetail={receiptDetail} key="receipt" />);
      }

      if (opts.includeStatement) {
        const detailedStatement = await queryClient.fetchQuery({
          queryKey: ["documents", "detailed-statement", encounterId],
          queryFn: () => DocumentsService.getDetailedStatement(encounterId),
        });
        documentNodes.push(
          <MedicalExpense
            data={transformDetailedStatementToMedicalExpenseData(detailedStatement)}
            key="statement"
          />
        );
      }

      const html = await generateReceptionHtml(
        <div>{documentNodes}</div>,
        { pageSelector: COMBINED_PAGE_SELECTOR }
      );

      const duration = performance.now() - startTime;
      console.log(`[PrintService] buildPaymentDocumentsHtml 완료: ${duration.toFixed(0)}ms`);
      return html;
    },
    [generateReceptionHtml, queryClient]
  );

  /**
   * 수납 후 영수증/내역서 출력 팝업을 HTML 모드로 엽니다.
   */
  const openPaymentDocumentsHtmlPopup = useCallback(
    (
      encounterId: string,
      opts: { includeReceipt: boolean; includeStatement: boolean }
    ) => {
      const titles: string[] = [];
      if (opts.includeReceipt) titles.push("영수증");
      if (opts.includeStatement) titles.push("진료비 내역서");

      openPrintPopup({
        config: {
          title: titles.join(" / ") + " 출력",
          outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
          fileNamePrefix: "payment-documents",
          outputMode: 'html',
        },
        renderContent: () => renderPaymentDocumentsContent(encounterId, opts),
      });
    },
    [openPrintPopup, renderPaymentDocumentsContent]
  );

  /**
   * 처방전 출력 팝업을 엽니다.
   */
  const openPrescriptionPrintPopup = useCallback(
    (encounterId: string) => {
      const useFormPaperFromSetting = resolvePrescriptionFormSetting();

      openPrintPopup({
        config: {
          title: "처방전 출력",
          outputTypeCode: OutputTypeCode.OUTPATIENT_RX,
          fileNamePrefix: "prescription",
          outputMode: 'html',
          initialPdfOptions: {
            useFormPaper: useFormPaperFromSetting,
            showBackgroundImage: false,
            debugMode: false,
          },
        },
        renderPdfOptionsControls: ({ pdfOptions, setPdfOptions, requestReload }) => {
          const options = (pdfOptions ?? {}) as BuildOptions;
          const useFormPaper = Boolean(options.useFormPaper);
          const showBackgroundImage = Boolean(options.showBackgroundImage);
          const debugMode = Boolean(options.debugMode);

          return (
            <>
              <label className="flex items-center gap-2 text-[13px] text-[#171719] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useFormPaper}
                  onChange={(e) => {
                    setPdfOptions({ ...options, useFormPaper: e.target.checked });
                    requestReload();
                  }}
                  className="h-4 w-4"
                />
                양식지 사용
              </label>

              <label className="flex items-center gap-2 text-[13px] text-[#171719] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBackgroundImage}
                  onChange={(e) => {
                    setPdfOptions({ ...options, showBackgroundImage: e.target.checked });
                    requestReload();
                  }}
                  className="h-4 w-4"
                />
                배경 이미지
              </label>

              <label className="flex items-center gap-2 text-[13px] text-[#171719] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => {
                    setPdfOptions({ ...options, debugMode: e.target.checked });
                    requestReload();
                  }}
                  className="h-4 w-4"
                />
                디버그
              </label>
            </>
          );
        },
        generatePdf: async (options) => {
          const result = await buildPrescriptionPdf(encounterId, options as BuildOptions);
          if (result === null) {
            throw new Error("처방 내역이 없습니다.");
          }
          return result;
        },
      });
    },
    [openPrintPopup, buildPrescriptionPdf]
  );

  /**
   * PDF Blob을 서버에 업로드하고 프린터 에이전트에 출력 요청을 보냅니다.
   */
  const { currentAgentId } = useSocket();

  const requestPrintJob = useCallback(
    async ({
      pdf,
      copies,
      paperSize,
      fileNamePrefix,
      outputTypeCode,
    }: PrintOptions) => {
      try {
        const finalCopies = copies ?? DEFAULT_COPIES;
        const finalPaperSize = paperSize ?? DEFAULT_PAPER_SIZE;
        const finalFilePrefix = fileNamePrefix ?? DEFAULT_FILE_PREFIX;
        const fileName = `${finalFilePrefix}-${Date.now()}.pdf`;

        const pdfFile = new File([pdf], fileName, {
          type: "application/pdf",
        });

        const uploadResult = await FileService.uploadFileV2({
          file: pdfFile,
          category: "patient_document", // "document"에서 변경
          entityType: "patient",
          description: "document print",
        });

        const printPayload = {
          outputTypeCode,
          contentType: "application/pdf",
          fileName,
          contentUrl: uploadResult.storagePath,
          copies: finalCopies,
          options: {
            paperSize: finalPaperSize,
          },
          agentId: currentAgentId ?? undefined,
        };

        await ApiClient.post("/printers", printPayload);

        return {
          fileUuid: uploadResult.uuid,
          storagePath: uploadResult.storagePath,
        };
      } catch (error) {
        console.error("[PrintService] requestPrintJob 실패:", error);
        throw error;
      }
    },
    [currentAgentId]
  );

  /**
   * HTML 문자열을 서버에 업로드하고 프린터 에이전트에 HTML 출력 요청을 보냅니다.
   * WebView2 Agent가 contentUrl로 HTML을 다운로드 → NavigateToString → PrintAsync 실행.
   */
  const requestHtmlPrintJob = useCallback(
    async ({
      html,
      copies,
      paperSize,
      fileNamePrefix,
      outputTypeCode,
    }: {
      html: string;
      copies?: number;
      paperSize?: string;
      fileNamePrefix?: string;
      outputTypeCode: OutputTypeCode;
    }) => {
      try {
        const finalCopies = copies ?? DEFAULT_COPIES;
        const finalPaperSize = paperSize ?? DEFAULT_PAPER_SIZE;
        const finalFilePrefix = fileNamePrefix ?? DEFAULT_FILE_PREFIX;
        const fileName = `${finalFilePrefix}-${Date.now()}.html`;

        const htmlFile = new File([html], fileName, {
          type: "text/html",
        });

        const uploadResult = await FileService.uploadFileV2({
          file: htmlFile,
          category: "patient_document",
          entityType: "patient",
          description: "document print (html)",
        });

        const printPayload = {
          outputTypeCode,
          contentType: "text/html",
          fileName,
          contentUrl: uploadResult.storagePath,
          copies: finalCopies,
          options: {
            paperSize: finalPaperSize,
          },
          agentId: currentAgentId ?? undefined,
        };

        await ApiClient.post("/printers", printPayload);

        return {
          fileUuid: uploadResult.uuid,
          storagePath: uploadResult.storagePath,
        };
      } catch (error) {
        console.error("[PrintService] requestHtmlPrintJob 실패:", error);
        throw error;
      }
    },
    [currentAgentId]
  );

  return {
    checkShouldPrintPrescription,
    buildPrescriptionPdf,
    buildMedicalRecordPdf,
    buildMedicalRecordPdfByEncounter,
    buildDetailedStatementPdf,
    buildReceiptPdf,
    buildCombinedReceiptPdf,
    buildCombinedDetailedStatementPdf,
    buildPrintCenterAllDocumentsPdf,
    // HTML 생성 메서드
    buildReceiptHtml,
    buildDetailedStatementHtml,
    buildMedicalRecordHtmlByEncounter,
    buildPrintCenterAllDocumentsHtml,
    // PDF 모드 팝업
    openPrescriptionPrintPopup,
    // HTML 모드 팝업
    openReceiptHtmlPrintPopup,
    openDetailedStatementHtmlPrintPopup,
    openMedicalRecordHtmlPrintPopup,
    openPrintCenterAllDocumentsHtmlPopup,
    openPaymentDocumentsHtmlPopup,
    // 선택적 HTML 빌드
    buildPrintCenterSelectiveHtml,
    buildPaymentDocumentsHtml,
    // 직접 렌더링 콘텐츠 빌더
    renderPrintCenterSelectiveContent,
    requestPrintJob,
    requestHtmlPrintJob,
    isGeneratingPrescription,
    PrescriptionHiddenRenderer,
    ReceptionHiddenRenderer,
    ReceptionHtmlHiddenRenderer,
  };
}
