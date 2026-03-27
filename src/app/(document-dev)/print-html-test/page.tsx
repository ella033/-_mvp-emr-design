'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useReceptionHtmlGenerator } from '@/hooks/document/use-reception-html-generator';
import { useReceptionPrintGenerator } from '@/hooks/document/use-reception-print-generator';
import { Receipt } from '@/app/document/_reception_templates/Receipt/Receipt';
import { MedicalRecordCopy } from '@/app/document/_reception_templates/MedicalRecordCopy/MedicalRecordCopy';
import { MedicalExpense } from '@/app/document/_reception_templates/MedicalExpense/MedicalExpense';
import { transformDetailedStatementToMedicalExpenseData } from '@/app/document/_reception_templates/MedicalExpense/utils';
import { DocumentsService } from '@/services/documents-service';
import { EncountersService } from '@/services/encounters-service';
import { PatientsService } from '@/services/patients-service';
import { RegistrationsService } from '@/services/registrations-service';
import { buildPrescriptionHtml, type KoreanPrescriptionData } from '@/lib/prescription/build-prescription-html-client';
import { ensurePrescriptionImages } from '@/lib/prescription/prescription-utils';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';

// ── Types ──

type DocumentType = 'receipt' | 'detailed-statement' | 'medical-record' | 'prescription' | 'combined';
type OutputMode = 'html' | 'pdf' | 'both';

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  receipt: '영수증',
  'detailed-statement': '진료비 내역서',
  'medical-record': '진료기록 사본',
  prescription: '처방전',
  combined: '합본 출력',
};

const COMBINED_PAGE_SELECTOR = '.printable-page, .A4';

// ── Helpers ──

function normalizePrescriptionHtml(html: string): string {
  return html
    .replace(/data-print-root="true"/g, 'data-prescription-root="true"')
    .replace(/\[data-print-root="true"\]/g, '[data-prescription-root="true"]');
}

function PrescriptionHtmlDocument({ html }: { html: string }) {
  return (
    <div
      className="prescription-html-root"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function PlaceholderDocument({ title, description }: { title: string; description?: string }) {
  return (
    <PrintableDocument paper={PAPER_SIZES.A4} margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
      <div style={{ fontSize: '16px', fontWeight: 600, textAlign: 'center', padding: '48px 24px' }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '13px', textAlign: 'center' }}>{description}</div>
      )}
    </PrintableDocument>
  );
}

// ── Main Page ──

export default function PrintHtmlTestPage() {
  const [encounterId, setEncounterId] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('receipt');
  const [outputMode, setOutputMode] = useState<OutputMode>('html');
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [pdfElapsedMs, setPdfElapsedMs] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { generateHtml, HiddenRenderer: HtmlHiddenRenderer } = useReceptionHtmlGenerator();
  const { generatePdf, HiddenRenderer: PdfHiddenRenderer } = useReceptionPrintGenerator();

  /** 문서 종류별 React content와 pageSelector를 빌드하는 공통 함수 */
  const buildContent = useCallback(async (): Promise<{ content: React.ReactNode; pageSelector?: string } | null> => {
    let content: React.ReactNode;
    let pageSelector: string | undefined;

    switch (documentType) {
      case 'receipt': {
        const receiptDetail = await DocumentsService.getMedicalBillReceipt(encounterId);
        content = <Receipt receiptDetail={receiptDetail} />;
        break;
      }

      case 'detailed-statement': {
        const detailedStatement = await DocumentsService.getDetailedStatement(encounterId);
        const medicalExpenseData = transformDetailedStatementToMedicalExpenseData(detailedStatement);
        content = <MedicalExpense data={medicalExpenseData} />;
        break;
      }

      case 'medical-record': {
        const encounter = await EncountersService.getEncounter(encounterId);
        if (!encounter.registration && encounter.registrationId) {
          encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
        }
        const patient = await PatientsService.getPatient(encounter.patientId);
        content = <MedicalRecordCopy patient={patient} encounters={[encounter]} />;
        break;
      }

      case 'prescription': {
        const prescriptionData = await DocumentsService.getExternalPrescriptionData(encounterId) as KoreanPrescriptionData;
        const processedData = await ensurePrescriptionImages(prescriptionData);
        const prescriptionHtml = await buildPrescriptionHtml(processedData, {
          useFormPaper: false,
          showBackgroundImage: false,
        });
        if (!prescriptionHtml) {
          setError('처방전 HTML을 생성할 수 없습니다.');
          return null;
        }
        const normalized = normalizePrescriptionHtml(prescriptionHtml);
        content = <PrescriptionHtmlDocument html={normalized} />;
        pageSelector = COMBINED_PAGE_SELECTOR;
        break;
      }

      case 'combined': {
        const [detailedStatement, receiptDetail, prescriptionResult] = await Promise.all([
          DocumentsService.getDetailedStatement(encounterId),
          DocumentsService.getMedicalBillReceipt(encounterId),
          DocumentsService.getExternalPrescriptionData(encounterId)
            .then((data) => ensurePrescriptionImages(data as KoreanPrescriptionData))
            .then((data) => buildPrescriptionHtml(data, { useFormPaper: false, showBackgroundImage: false }))
            .catch(() => null),
        ]);

        const encounter = await EncountersService.getEncounter(encounterId);
        if (!encounter.registration && encounter.registrationId) {
          encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
        }
        const patient = await PatientsService.getPatient(encounter.patientId);
        const medicalExpenseData = transformDetailedStatementToMedicalExpenseData(detailedStatement);
        const normalizedPrescriptionHtml = prescriptionResult
          ? normalizePrescriptionHtml(prescriptionResult)
          : null;

        content = (
          <div>
            {normalizedPrescriptionHtml ? (
              <PrescriptionHtmlDocument html={normalizedPrescriptionHtml} />
            ) : (
              <PlaceholderDocument title="처방전" description="처방전 데이터를 불러올 수 없습니다." />
            )}
            <Receipt receiptDetail={receiptDetail} />
            <MedicalExpense data={medicalExpenseData} />
            <MedicalRecordCopy patient={patient} encounters={[encounter]} />
          </div>
        );
        pageSelector = COMBINED_PAGE_SELECTOR;
        break;
      }
    }

    return { content, pageSelector };
  }, [documentType, encounterId]);

  const handleGenerate = useCallback(async () => {
    if (!encounterId.trim()) {
      setError('encounterId를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setHtmlContent(null);
    setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setElapsedMs(null);
    setPdfElapsedMs(null);
    const t0 = performance.now();

    try {
      const built = await buildContent();
      if (!built) return;
      const { content, pageSelector } = built;

      // HTML 생성
      if (outputMode === 'html' || outputMode === 'both') {
        const htmlT0 = performance.now();
        const html = await generateHtml(content, { pageSelector });
        const htmlT1 = performance.now();
        setHtmlContent(html);
        setElapsedMs(htmlT1 - htmlT0);
      }

      // PDF 생성 (비교용)
      if (outputMode === 'pdf' || outputMode === 'both') {
        const pdfT0 = performance.now();
        console.log('[PrintHtmlTest] PDF 생성 시작 (비교용)...');
        const blob = await generatePdf(content, { pageSelector });
        const pdfT1 = performance.now();
        setPdfUrl(URL.createObjectURL(blob));
        setPdfElapsedMs(pdfT1 - pdfT0);
        console.log(`[PrintHtmlTest] PDF 생성 완료 | ${(pdfT1 - pdfT0).toFixed(0)}ms | ${(blob.size / 1024).toFixed(1)}KB`);
      }

      if (outputMode !== 'html' && outputMode !== 'both') {
        setElapsedMs(performance.now() - t0);
      }
    } catch (err) {
      console.error('[PrintHtmlTest] 생성 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [encounterId, documentType, outputMode, generateHtml, generatePdf, buildContent]);

  const downloadHtml = useCallback(() => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}-${encounterId}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [htmlContent, documentType, encounterId]);

  const openInNewTab = useCallback(() => {
    if (!htmlContent) return;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  }, [htmlContent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #dbdcdf', background: '#fbfaff' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 600 }}>
          HTML 출력 테스트
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* 서식 선택 */}
          <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            서식:
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              style={{
                height: '32px',
                padding: '0 8px',
                border: '1px solid #c2c4c8',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              {(Object.entries(DOCUMENT_LABELS) as [DocumentType, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {/* 출력 모드 선택 */}
          <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            모드:
            <select
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value as OutputMode)}
              style={{
                height: '32px',
                padding: '0 8px',
                border: '1px solid #c2c4c8',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              <option value="html">HTML만</option>
              <option value="pdf">PDF만</option>
              <option value="both">HTML + PDF 비교</option>
            </select>
          </label>

          {/* encounterId 입력 */}
          <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            encounterId:
            <input
              type="text"
              value={encounterId}
              onChange={(e) => setEncounterId(e.target.value)}
              placeholder="접수 ID 입력"
              style={{
                height: '32px',
                padding: '0 8px',
                border: '1px solid #c2c4c8',
                borderRadius: '4px',
                fontSize: '13px',
                width: '200px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
            />
          </label>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              height: '32px',
              padding: '0 16px',
              background: loading ? '#989ba2' : '#180f38',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? '생성 중...' : '생성'}
          </button>

          {/* 결과 표시 */}
          {elapsedMs !== null && (
            <span style={{ fontSize: '13px', color: '#46474C' }}>
              HTML: {elapsedMs.toFixed(0)}ms
              {htmlContent && ` (${(new Blob([htmlContent]).size / 1024).toFixed(1)}KB)`}
            </span>
          )}
          {pdfElapsedMs !== null && (
            <span style={{ fontSize: '13px', color: '#46474C' }}>
              | PDF: {pdfElapsedMs.toFixed(0)}ms
            </span>
          )}

          {error && (
            <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
          )}
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#F4F4F5', position: 'relative', display: 'flex' }}>
        {/* HTML + PDF 비교 모드: 좌우 분할 */}
        {outputMode === 'both' && (htmlContent || pdfUrl) ? (
          <>
            {/* HTML 미리보기 (좌) */}
            <div style={{ flex: 1, overflow: 'auto', borderRight: '2px solid #c2c4c8', position: 'relative' }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1, background: '#e0e7ff', padding: '4px 12px', fontSize: '12px', fontWeight: 600, color: '#3730a3' }}>
                HTML {elapsedMs !== null && `(${elapsedMs.toFixed(0)}ms)`}
              </div>
              {htmlContent ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  style={{ width: '100%', height: 'calc(100% - 28px)', border: 'none' }}
                  title="HTML 미리보기"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#989ba2', fontSize: '13px' }}>
                  HTML 생성 대기 중...
                </div>
              )}
            </div>
            {/* PDF 미리보기 (우) */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1, background: '#fce7f3', padding: '4px 12px', fontSize: '12px', fontWeight: 600, color: '#9d174d' }}>
                PDF {pdfElapsedMs !== null && `(${pdfElapsedMs.toFixed(0)}ms)`}
              </div>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  style={{ width: '100%', height: 'calc(100% - 28px)', border: 'none' }}
                  title="PDF 미리보기"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#989ba2', fontSize: '13px' }}>
                  PDF 생성 대기 중...
                </div>
              )}
            </div>
          </>
        ) : htmlContent ? (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="HTML 미리보기"
            sandbox="allow-same-origin"
          />
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="PDF 미리보기"
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: '#989ba2',
            fontSize: '14px',
          }}>
            {loading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>생성 중...</div>
                <div style={{ fontSize: '12px' }}>콘솔(F12)에서 [HTML-DEBUG] / [PDF-DEBUG] 로그를 확인하세요</div>
              </div>
            ) : (
              'encounterId를 입력하고 "생성" 버튼을 클릭하세요.'
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 바 */}
      {(htmlContent || pdfUrl) && (
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #dbdcdf',
          background: '#fbfaff',
          display: 'flex',
          gap: '8px',
        }}>
          {htmlContent && (
            <>
              <button
                onClick={downloadHtml}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  background: 'white',
                  border: '1px solid #c2c4c8',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                HTML 다운로드
              </button>
              <button
                onClick={openInNewTab}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  background: 'white',
                  border: '1px solid #c2c4c8',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                새 탭에서 열기
              </button>
            </>
          )}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={`${documentType}-${encounterId}-${Date.now()}.pdf`}
              style={{
                height: '32px',
                padding: '0 16px',
                background: 'white',
                border: '1px solid #c2c4c8',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              PDF 다운로드
            </a>
          )}
        </div>
      )}

      {/* 숨김 렌더러 */}
      <HtmlHiddenRenderer />
      <PdfHiddenRenderer />
    </div>
  );
}
