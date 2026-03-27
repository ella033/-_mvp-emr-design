'use client';

import React, { useState, useCallback } from 'react';
import { useReceptionPrintGenerator } from '@/hooks/document/use-reception-print-generator';
import { useReceptionHtmlGenerator } from '@/hooks/document/use-reception-html-generator';
import { Receipt } from '@/app/document/_reception_templates/Receipt/Receipt';
import { MedicalRecordCopy } from '@/app/document/_reception_templates/MedicalRecordCopy/MedicalRecordCopy';
import { MedicalExpense } from '@/app/document/_reception_templates/MedicalExpense/MedicalExpense';
import { transformDetailedStatementToMedicalExpenseData } from '@/app/document/_reception_templates/MedicalExpense/utils';
import { DocumentsService } from '@/services/documents-service';
import { EncountersService } from '@/services/encounters-service';
import { PatientsService } from '@/services/patients-service';
import { RegistrationsService } from '@/services/registrations-service';

// ── Types ──

type DocumentType = 'receipt' | 'detailed-statement' | 'medical-record';

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  receipt: '영수증',
  'detailed-statement': '진료비내역서',
  'medical-record': '진료기록사본',
};

const REPEAT_PRESETS = [1, 5, 10, 20, 30] as const;
const COMBINED_PAGE_SELECTOR = '.printable-page, .A4';

type BenchmarkResult = {
  documentType: DocumentType;
  repeatCount: number;
  pdfTimeMs: number;
  pdfSizeKB: number;
  htmlTimeMs: number;
  htmlSizeKB: number;
};

type BenchmarkPhase = 'idle' | 'data' | 'pdf' | 'html' | 'done' | 'error';

function downloadBlob(blob: Blob, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([blob], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ──

export default function PrintBenchmarkPage() {
  const [encounterId, setEncounterId] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('receipt');
  const [repeatCount, setRepeatCount] = useState(1);
  const [phase, setPhase] = useState<BenchmarkPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  const { generatePdf, HiddenRenderer: PdfHiddenRenderer } = useReceptionPrintGenerator();
  const { generateHtml, HiddenRenderer: HtmlHiddenRenderer } = useReceptionHtmlGenerator();

  /** 문서 유형별로 데이터를 fetch하여 React 노드를 반환 */
  const fetchDocumentNode = useCallback(async (): Promise<React.ReactNode> => {
    switch (documentType) {
      case 'receipt': {
        const receiptDetail = await DocumentsService.getMedicalBillReceipt(encounterId);
        return <Receipt receiptDetail={receiptDetail} />;
      }
      case 'detailed-statement': {
        const detailedStatement = await DocumentsService.getDetailedStatement(encounterId);
        const data = transformDetailedStatementToMedicalExpenseData(detailedStatement);
        return <MedicalExpense data={data} />;
      }
      case 'medical-record': {
        const encounter = await EncountersService.getEncounter(encounterId);
        if (!encounter.registration && encounter.registrationId) {
          encounter.registration = await RegistrationsService.getRegistration(encounter.registrationId);
        }
        const patient = await PatientsService.getPatient(encounter.patientId);
        return <MedicalRecordCopy patient={patient} encounters={[encounter]} />;
      }
    }
  }, [documentType, encounterId]);

  const runBenchmark = useCallback(async () => {
    if (!encounterId.trim()) {
      setError('encounterId를 입력해주세요.');
      return;
    }

    setError(null);
    setPhase('data');

    try {
      // 1. 데이터 fetch (1회만)
      console.log(`[Benchmark] ${DOCUMENT_LABELS[documentType]} x${repeatCount} 데이터 조회`);
      const singleNode = await fetchDocumentNode();

      // N장 복제
      const repeatedNodes = (
        <div>
          {Array.from({ length: repeatCount }, (_, i) => (
            <React.Fragment key={i}>{singleNode}</React.Fragment>
          ))}
        </div>
      );
      const genOptions = repeatCount > 1 ? { pageSelector: COMBINED_PAGE_SELECTOR } : undefined;

      // 2. PDF 생성 (시간에 데이터 fetch 제외)
      setPhase('pdf');
      console.log(`[PDF-PERF] ${DOCUMENT_LABELS[documentType]} x${repeatCount} PDF 생성 시작`);
      const pdfStart = performance.now();
      const pdfBlob = await generatePdf(repeatedNodes, genOptions);
      const pdfEnd = performance.now();
      const pdfTimeMs = pdfEnd - pdfStart;
      const pdfSizeKB = pdfBlob.size / 1024;
      console.log(`[PDF-PERF] 완료: ${pdfTimeMs.toFixed(0)}ms, ${pdfSizeKB.toFixed(1)}KB`);

      // 3. HTML 생성
      setPhase('html');
      console.log(`[HTML-PERF] ${DOCUMENT_LABELS[documentType]} x${repeatCount} HTML 생성 시작`);
      const htmlStart = performance.now();
      const html = await generateHtml(repeatedNodes, genOptions);
      const htmlEnd = performance.now();
      const htmlTimeMs = htmlEnd - htmlStart;
      const htmlSizeKB = new Blob([html]).size / 1024;
      console.log(`[HTML-PERF] 완료: ${htmlTimeMs.toFixed(0)}ms, ${htmlSizeKB.toFixed(1)}KB`);

      // 4. 자동 다운로드
      const tag = `${documentType}-x${repeatCount}-${Date.now()}`;
      downloadBlob(pdfBlob, `${tag}.pdf`, 'application/pdf');
      downloadBlob(new Blob([html], { type: 'text/html; charset=utf-8' }), `${tag}.html`, 'text/html');

      // 5. 결과 저장
      setResults((prev) => [{
        documentType,
        repeatCount,
        pdfTimeMs,
        pdfSizeKB,
        htmlTimeMs,
        htmlSizeKB,
      }, ...prev]);
      setPhase('done');
    } catch (err) {
      console.error('[Benchmark] 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setPhase('error');
    }
  }, [encounterId, documentType, repeatCount, fetchDocumentNode, generatePdf, generateHtml]);

  const isRunning = phase === 'data' || phase === 'pdf' || phase === 'html';

  const phaseLabel: Record<BenchmarkPhase, string> = {
    idle: '',
    data: '데이터 조회 중...',
    pdf: 'PDF (래스터) 생성 중...',
    html: 'HTML (벡터) 생성 중...',
    done: '완료',
    error: '오류 발생',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #dbdcdf', background: '#fbfaff' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 600 }}>
          PDF vs HTML 프린트 벤치마크
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* 문서 유형 */}
          <label style={labelStyle}>
            문서:
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              disabled={isRunning}
              style={inputStyle}
            >
              {(Object.entries(DOCUMENT_LABELS) as [DocumentType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          {/* 반복 횟수 (장수) */}
          <label style={labelStyle}>
            장수:
            <select
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              disabled={isRunning}
              style={inputStyle}
            >
              {REPEAT_PRESETS.map((n) => (
                <option key={n} value={n}>{n}장</option>
              ))}
            </select>
          </label>

          {/* encounterId */}
          <label style={labelStyle}>
            encounterId:
            <input
              type="text"
              value={encounterId}
              onChange={(e) => setEncounterId(e.target.value)}
              placeholder="접수 ID 입력"
              disabled={isRunning}
              style={{ ...inputStyle, width: '200px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRunning) runBenchmark();
              }}
            />
          </label>

          {/* 실행 버튼 */}
          <button
            onClick={runBenchmark}
            disabled={isRunning}
            style={{
              height: '32px',
              padding: '0 16px',
              background: isRunning ? '#989ba2' : '#180f38',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isRunning ? 'default' : 'pointer',
            }}
          >
            {isRunning ? phaseLabel[phase] : '벤치마크 실행'}
          </button>

          {isRunning && (
            <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 500 }}>
              {phaseLabel[phase]}
            </span>
          )}
          {error && (
            <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
          )}
        </div>
      </div>

      {/* 결과 영역 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {results.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#989ba2', fontSize: '14px',
          }}>
            encounterId를 입력하고 &quot;벤치마크 실행&quot; 버튼을 클릭하세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.map((r, idx) => {
              const timeSpeedup = r.pdfTimeMs / r.htmlTimeMs;
              const sizeDiff = ((r.pdfSizeKB - r.htmlSizeKB) / r.pdfSizeKB) * 100;

              return (
                <div key={idx} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* 카드 헤더 */}
                  <div style={{
                    padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>
                      #{results.length - idx} — {DOCUMENT_LABELS[r.documentType]}
                      {r.repeatCount > 1 && <span style={{ color: '#6366f1', marginLeft: '8px' }}>x{r.repeatCount}장</span>}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280' }}>
                      encounterId: {encounterId}
                    </span>
                  </div>

                  {/* 비교 테이블 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={thStyle}>항목</th>
                        <th style={thStyle}>PDF (래스터)</th>
                        <th style={thStyle}>HTML (벡터)</th>
                        <th style={thStyle}>개선</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={tdStyle}>생성 시간</td>
                        <td style={tdStyleMono}>{(r.pdfTimeMs / 1000).toFixed(2)}s</td>
                        <td style={tdStyleMono}>{(r.htmlTimeMs / 1000).toFixed(2)}s</td>
                        <td style={{
                          ...tdStyleMono,
                          color: timeSpeedup >= 1 ? '#059669' : '#dc2626',
                          fontWeight: 600,
                        }}>
                          {timeSpeedup >= 1
                            ? `${timeSpeedup.toFixed(1)}x 빠름`
                            : `${(1 / timeSpeedup).toFixed(1)}x 느림`}
                        </td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>파일 크기</td>
                        <td style={tdStyleMono}>{r.pdfSizeKB.toFixed(1)}KB</td>
                        <td style={tdStyleMono}>{r.htmlSizeKB.toFixed(1)}KB</td>
                        <td style={{
                          ...tdStyleMono,
                          color: sizeDiff >= 0 ? '#059669' : '#dc2626',
                          fontWeight: 600,
                        }}>
                          {sizeDiff >= 0
                            ? `${sizeDiff.toFixed(0)}% 절감`
                            : `${Math.abs(sizeDiff).toFixed(0)}% 증가`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 숨김 렌더러 */}
      <PdfHiddenRenderer />
      <HtmlHiddenRenderer />
    </div>
  );
}

// ── Shared Styles ──

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const inputStyle: React.CSSProperties = {
  height: '32px',
  padding: '0 8px',
  border: '1px solid #c2c4c8',
  borderRadius: '4px',
  fontSize: '13px',
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '1px solid #e5e7eb',
  color: '#374151',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
};

const tdStyleMono: React.CSSProperties = {
  ...tdStyle,
  fontFamily: 'monospace',
};
