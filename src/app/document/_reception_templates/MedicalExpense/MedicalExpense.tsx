'use client';

import React, { useMemo } from 'react';
import { PrintableDocument, PAPER_SIZES, PrintPageBreak, PrintTablePageInfo } from '@/lib/printable';
import { useHospitalImages } from '@/hooks/hospital/use-hospital-images';
import { MedicalExpenseProps } from './types';

export function MedicalExpense({
  data,
  isCombined = false,
  margin = 10,
  onPageCountChange
}: MedicalExpenseProps) {
  const { sealImage } = useHospitalImages();

  const COLORS = {
    BORDER: '#000000',
    TEXT_MAIN: '#000000',
    BG_GRAY: '#f8f8f8',
  };

  const FONT_SIZES = {
    TITLE: '18px',
    SUBTITLE: '10px',
    NORMAL: '9px',
    SMALL: '8px',
  };

  const TABLE_STYLE: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    borderTop: `1px solid ${COLORS.BORDER}`,
    fontSize: FONT_SIZES.NORMAL,
    color: COLORS.TEXT_MAIN,
    textAlign: 'center',
    marginBottom: '10px',
  };

  const CELL_STYLE: React.CSSProperties = {
    borderTop: `1px solid ${COLORS.BORDER}`,
    borderRight: `1px solid ${COLORS.BORDER}`,
    borderBottom: `1px solid ${COLORS.BORDER}`,
    borderLeft: `1px solid ${COLORS.BORDER}`,
    padding: '4px',
    height: '20px',
  };

  const HEADER_CELL_STYLE: React.CSSProperties = {
    ...CELL_STYLE,
    backgroundColor: COLORS.BG_GRAY,
    fontWeight: 'bold',
  };

  // 스타일 정의
  const FIRST_CELL: React.CSSProperties = { ...CELL_STYLE, borderLeft: 'none' };
  const MID_CELL: React.CSSProperties = { ...CELL_STYLE };
  const LAST_CELL: React.CSSProperties = { ...CELL_STYLE, borderRight: 'none' };
  const BOTH_CELL: React.CSSProperties = { ...CELL_STYLE, borderLeft: 'none', borderRight: 'none' };

  const FIRST_HEADER: React.CSSProperties = { ...HEADER_CELL_STYLE, borderLeft: 'none' };
  const MID_HEADER: React.CSSProperties = { ...HEADER_CELL_STYLE };
  const LAST_HEADER: React.CSSProperties = { ...HEADER_CELL_STYLE, borderRight: 'none' };

  const sortedDates = useMemo(() => Object.keys(data.itemsByDate).sort(), [data.itemsByDate]);

  // 합본 모드: 모든 날짜의 항목을 하나의 배열로 합침
  const allCombinedItems = isCombined
    ? sortedDates.flatMap((date) => data.itemsByDate[date] ?? [])
    : [];

  const DETAIL_COLUMN_WIDTHS = ['8%', '7%', '8%', '20%', '8%', '3%', '3%', '10%', '5%', '5%', '8%', '8%'] as const;

  const DetailColGroup = () => (
    <colgroup>
      {DETAIL_COLUMN_WIDTHS.map((width, index) => (
        <col key={`detail-col-${index}`} style={{ width }} />
      ))}
    </colgroup>
  );

  const detailTableHeader = (
    <thead>
      <tr>
        <th style={{ ...FIRST_HEADER, width: '8%' }} rowSpan={3}>항목</th>
        <th style={{ ...MID_HEADER, width: '7%' }} rowSpan={3}>일자</th>
        <th style={{ ...MID_HEADER, width: '8%' }} rowSpan={3}>코드</th>
        <th style={{ ...MID_HEADER, width: '20%' }} rowSpan={3}>명칭</th>
        <th style={{ ...MID_HEADER, width: '8%' }} rowSpan={3}>금액</th>
        <th style={{ ...MID_HEADER, width: '3%' }} rowSpan={3}>횟수</th>
        <th style={{ ...MID_HEADER, width: '3%' }} rowSpan={3}>일수</th>
        <th style={{ ...MID_HEADER, width: '10%' }} rowSpan={3}>총액</th>
        <th style={MID_HEADER} colSpan={3}>급여</th>
        <th style={{ ...LAST_HEADER, width: '8%' }} rowSpan={3}>비급여</th>
      </tr>
      <tr>
        <th style={MID_HEADER} colSpan={2}>일부본인부담</th>
        <th style={{ ...MID_HEADER, width: '8%' }} rowSpan={2}>전액본인부담</th>
      </tr>
      <tr>
        <th style={{ ...MID_HEADER, width: '5%' }}>본인부담금</th>
        <th style={{ ...MID_HEADER, width: '5%' }}>공단부담금</th>
      </tr>
    </thead>
  );

  const RepeatedTitleHeader = () => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: FONT_SIZES.SMALL }}>[별지 제 1호 서식] 진료비 세부산정내역 (제2조 제1항 관련)</div>
      <h1 style={{ fontSize: FONT_SIZES.TITLE, textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>
        진료비 세부산정내역
      </h1>
    </div>
  );

  const PatientInfoSection = () => (
    <div style={{ marginBottom: '10px' }}>
      <table style={TABLE_STYLE}>
        <tbody>
          <tr>
            <td style={FIRST_HEADER}>환자등록번호</td>
            <td style={MID_HEADER}>환자성명</td>
            <td style={MID_HEADER}>진료기간</td>
            <td style={MID_HEADER}>병실</td>
            <td style={MID_HEADER}>환자구분</td>
            <td style={LAST_HEADER}>비고</td>
          </tr>
          <tr>
            <td style={FIRST_CELL}>{data.patient.patientNo}</td>
            <td style={MID_CELL}>{data.patient.name}</td>
            <td style={MID_CELL}>{data.patient.visitPeriod}</td>
            <td style={MID_CELL}>{data.patient.room}</td>
            <td style={MID_CELL}>{data.patient.patientType}</td>
            <td style={LAST_CELL}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const SummarySection = () => (
    <table style={{ ...TABLE_STYLE, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <DetailColGroup />
      <tbody>
        <tr>
          <td style={{ ...FIRST_CELL, textAlign: 'center' }} colSpan={2}>계</td>
          <td style={MID_HEADER} colSpan={5}></td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.subtotal.total.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.subtotal.insuranceCopay.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.subtotal.publicInsurance.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.subtotal.insuranceFullCopay.toLocaleString()}</td>
          <td style={{ ...LAST_CELL, textAlign: 'right' }}>{data.totals.subtotal.nonInsuranceCopay.toLocaleString()}</td>
        </tr>
        <tr>
          <td style={{ ...FIRST_CELL, textAlign: 'center' }} colSpan={2}>끝처리 조정금액</td>
          <td style={MID_HEADER} colSpan={5}></td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.adjustment.total.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.adjustment.insuranceCopay.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.adjustment.publicInsurance.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.adjustment.insuranceFullCopay.toLocaleString()}</td>
          <td style={{ ...LAST_CELL, textAlign: 'right' }}>{data.totals.adjustment.nonInsuranceCopay.toLocaleString()}</td>
        </tr>
        <tr>
          <td style={{ ...FIRST_CELL, textAlign: 'center' }} colSpan={2}>합계</td>
          <td style={MID_HEADER} colSpan={5}></td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.grandTotal.total.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.grandTotal.insuranceCopay.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.grandTotal.publicInsurance.toLocaleString()}</td>
          <td style={{ ...MID_CELL, textAlign: 'right' }}>{data.totals.grandTotal.insuranceFullCopay.toLocaleString()}</td>
          <td style={{ ...LAST_CELL, textAlign: 'right' }}>{data.totals.grandTotal.nonInsuranceCopay.toLocaleString()}</td>
        </tr>
        <tr>
          <td colSpan={12} style={{ border: 'none', padding: '5px 0 5px 0', textAlign: 'center' }}>
            <div style={{ fontSize: FONT_SIZES.NORMAL, lineHeight: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <span>신청인</span>
                <span style={{ minWidth: '80px' }}>{data.patient.name}</span>
                <span>(환자와의 관계 : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {data.applicantRelation} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) 의 요청에 따라</span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>
                진료비 계산서 · 영수증 세부산정내역을 발급합니다.
              </div>
              <div style={{ fontSize: '11px' }}>
                {(() => {
                  const parts = data.issuedAt.split('-');
                  const year = parts[0] || '';
                  const month = parts[1] || '';
                  const day = parts[2] || '';
                  return `${year} 년 ${month.padStart(2, '0')} 월 ${day.padStart(2, '0')} 일`;
                })()}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ ...FIRST_CELL, textAlign: 'center' }} colSpan={2}>요양기관 명칭</td>
          <td style={{ ...MID_CELL, textAlign: 'left' }} colSpan={6}>{data.hospital.name}</td>
          <td style={{ ...MID_CELL }} colSpan={2}>대표자</td>
          <td style={{ ...LAST_CELL, position: 'relative' }} colSpan={2}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}>
              <span>{data.hospital.representative}</span>
              {sealImage && (
                <img
                  src={sealImage}
                  alt="seal"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain',
                  }}
                />
              )}
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '35px',
                  transform: 'translate(50%, -50%)',
                  zIndex: 1,
                }}
              >
                [인]
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <PrintableDocument
      paper={PAPER_SIZES.A4_LANDSCAPE}
      margin={{ top: margin, bottom: margin, left: margin, right: margin }}
      header={<RepeatedTitleHeader />}
      onPageCountChange={onPageCountChange}
      observeDependencies={[margin, data]}
    >
      {/* 합본 모드: 모든 항목을 단일 테이블로 렌더링 */}
      {isCombined ? (
        <>
          <PatientInfoSection />
          <table style={TABLE_STYLE}>
            <DetailColGroup />
            {detailTableHeader}
            <tbody>
              {allCombinedItems.map((item, idx) => (
                <tr key={`combined-${idx}`}>
                  <td style={FIRST_CELL}>{item.category}</td>
                  <td style={MID_CELL}>{item.date}</td>
                  <td style={MID_CELL}>{item.code}</td>
                  <td style={{
                    ...MID_CELL,
                    textAlign: 'left',
                    ...(item.isBundleChild && { paddingLeft: '16px' }),
                  }}>
                    {item.isBundleChild ? `└ ${item.name}` : item.name}
                  </td>
                  <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.amount.toLocaleString()}</td>
                  <td style={MID_CELL}>{item.count}</td>
                  <td style={MID_CELL}>{item.days}</td>
                  <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.total.toLocaleString()}</td>
                  <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.insuranceCopay.toLocaleString()}</td>
                  <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.publicInsurance.toLocaleString()}</td>
                  <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.insuranceFullCopay.toLocaleString()}</td>
                  <td style={{ ...LAST_CELL, textAlign: 'right' }}>{item.nonInsuranceCopay.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...BOTH_CELL, textAlign: 'right', borderBottom: 'none', fontSize: FONT_SIZES.SUBTITLE }} colSpan={12}>
                  <PrintTablePageInfo />
                </td>
              </tr>
            </tfoot>
          </table>
          <SummarySection />
        </>
      ) : (
        /* 개별 모드: 기존 날짜별 테이블 구조 유지 */
        sortedDates.map((date, dateIndex) => (
          <React.Fragment key={date}>
            {dateIndex > 0 && <PrintPageBreak />}
            {dateIndex === 0 && <PatientInfoSection />}
            <table style={TABLE_STYLE}>
              <DetailColGroup />
              {detailTableHeader}
              <tbody>
                {(() => {
                  const rows = data.itemsByDate[date] ?? [];
                  const hasRows = rows.length > 0;
                  if (!hasRows) {
                    return (
                      <tr>
                        <td style={FIRST_CELL}>-</td>
                        <td style={MID_CELL}>{date}</td>
                        <td style={MID_CELL}>-</td>
                        <td style={{ ...MID_CELL, textAlign: 'left' }}>세부내역 없음</td>
                        <td style={{ ...MID_CELL, textAlign: 'right' }}>0</td>
                        <td style={MID_CELL}>0</td>
                        <td style={MID_CELL}>0</td>
                        <td style={{ ...MID_CELL, textAlign: 'right' }}>0</td>
                        <td style={{ ...MID_CELL, textAlign: 'right' }}>0</td>
                        <td style={{ ...MID_CELL, textAlign: 'right' }}>0</td>
                        <td style={{ ...MID_CELL, textAlign: 'right' }}>0</td>
                        <td style={{ ...LAST_CELL, textAlign: 'right' }}>0</td>
                      </tr>
                    );
                  }

                  return rows.map((item, idx) => (
                    <tr key={`${date}-${idx}`}>
                      <td style={FIRST_CELL}>{item.category}</td>
                      <td style={MID_CELL}>{item.date}</td>
                      <td style={MID_CELL}>{item.code}</td>
                      <td style={{
                        ...MID_CELL,
                        textAlign: 'left',
                        ...(item.isBundleChild && { paddingLeft: '16px' }),
                      }}>
                        {item.isBundleChild ? `└ ${item.name}` : item.name}
                      </td>
                      <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.amount.toLocaleString()}</td>
                      <td style={MID_CELL}>{item.count}</td>
                      <td style={MID_CELL}>{item.days}</td>
                      <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.total.toLocaleString()}</td>
                      <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.insuranceCopay.toLocaleString()}</td>
                      <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.publicInsurance.toLocaleString()}</td>
                      <td style={{ ...MID_CELL, textAlign: 'right' }}>{item.insuranceFullCopay.toLocaleString()}</td>
                      <td style={{ ...LAST_CELL, textAlign: 'right' }}>{item.nonInsuranceCopay.toLocaleString()}</td>
                    </tr>
                  ));
                })()}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...BOTH_CELL, textAlign: 'right', borderBottom: 'none', fontSize: FONT_SIZES.SUBTITLE }} colSpan={12}>
                    <PrintTablePageInfo />
                  </td>
                </tr>
              </tfoot>
            </table>
            <SummarySection />
          </React.Fragment>
        ))
      )}
    </PrintableDocument>
  );
}
