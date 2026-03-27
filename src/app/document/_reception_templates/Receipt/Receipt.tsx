'use client';

import { useMemo } from 'react';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';
import { useHospitalStore } from '@/store/hospital-store';
import { useHospitalImages } from '@/hooks/hospital/use-hospital-images';
import { ReceiptItemData, ReceiptProps } from './types';

type ReceiptItemNumberKey = Exclude<keyof ReceiptItemData, 'name'>;
import { transformToReceiptData } from './utils';

export function Receipt({
  receiptDetail,
  margin = 10,
  onPageCountChange
}: ReceiptProps) {
  const { hospital: hospitalInfo } = useHospitalStore();
  const { sealImage } = useHospitalImages();

  const data = useMemo(() =>
    transformToReceiptData({
      receiptDetail,
      hospitalInfo,
    }),
    [receiptDetail, hospitalInfo]
  );

  const itemByName = useMemo(() => {
    const map = new Map<string, ReceiptItemData>();
    data.fees.items.forEach((item) => {
      map.set(item.name, item);
    });
    return map;
  }, [data.fees.items]);

  const getItemValue = (name: string, key: ReceiptItemNumberKey) =>
    itemByName.get(name)?.[key] ?? 0;

  const COLORS = {
    BORDER: '#000000',
    TEXT_MAIN: '#000000',
    BG_GRAY: '#f3f4f6',
  };

  const FONT_SIZES = {
    TITLE: '18px',
    SUBTITLE: '10px',
    NORMAL: '9px',
    SMALL: '8px',
    XSMALL: '7px',
  };

  const TABLE_STYLE = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    borderTop: `1px solid ${COLORS.BORDER}`,
    borderRight: `1px solid ${COLORS.BORDER}`,
    borderBottom: `1px solid ${COLORS.BORDER}`,
    borderLeft: `1px solid ${COLORS.BORDER}`,
    fontSize: FONT_SIZES.NORMAL,
    color: COLORS.TEXT_MAIN,
    textAlign: 'center' as const,
  };

  const CELL_STYLE = {
    borderTop: `1px solid ${COLORS.BORDER}`,
    borderRight: `1px solid ${COLORS.BORDER}`,
    borderBottom: `1px solid ${COLORS.BORDER}`,
    borderLeft: `1px solid ${COLORS.BORDER}`,
    padding: '2px 4px',
    height: '16px',
    wordBreak: 'break-all' as const,
  };

  const HEADER_CELL_STYLE = {
    ...CELL_STYLE,
    textAlign: 'center' as const,
    backgroundColor: '#f8f8f8',
  };

  return (
    <PrintableDocument
      paper={PAPER_SIZES.A4}
      margin={{ top: margin, bottom: margin, left: margin, right: margin }}
      onPageCountChange={onPageCountChange}
      observeDependencies={[margin, data]}
    >
      {/* 서식 번호 */}
      <div style={{ fontSize: FONT_SIZES.NORMAL, marginBottom: '0px' }}>■ 국민건강보험 요양급여의 기준에 관한 규칙 [별지 제6호서식]</div>

      {/* 제목부 */}
      <div style={{ fontSize: FONT_SIZES.TITLE, fontWeight: 700, display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '2px', alignItems: 'center' }}>
        <div>
          <div>{formatTitleVisitCheckbox(data.title.visitCategory)}
            <span>&nbsp;({formatTitleDischargeCheckbox(data.title.isInterimBill)})&nbsp;</span>
          </div>
        </div>
        <h1 style={{ margin: 0, letterSpacing: '2px', fontSize: 'inherit' }}>
          진료비 계산서 · 영수증
        </h1>
      </div>

      {/* 환자 정보 및 기본 정보 테이블 */}
      <table style={TABLE_STYLE}>
        <tbody>
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, width: '25%' }}>환자등록번호</td>
            <td style={{ ...HEADER_CELL_STYLE, width: '25%' }}>환자 성명</td>
            <td colSpan={2} style={{ ...HEADER_CELL_STYLE, width: '30%' }}>진료기간</td>
            <td style={HEADER_CELL_STYLE}>야간(공휴일)진료</td>
          </tr>
          <tr>
            <td style={{ ...CELL_STYLE, width: '18%' }}>{data.patient.patientNo}</td>
            <td style={{ ...CELL_STYLE, width: '18%' }}>{data.patient.name}</td>
            <td colSpan={2} style={CELL_STYLE}>{data.patient.visitPeriod}</td>
            <td style={CELL_STYLE}>{formatVisitTypeCheckbox(data.patient.visitType)}</td>
          </tr>
          <tr>
            <td style={HEADER_CELL_STYLE}>진료과목</td>
            <td style={HEADER_CELL_STYLE}>질병군(DRG)번호</td>
            <td style={HEADER_CELL_STYLE}>병실</td>
            <td style={HEADER_CELL_STYLE}>환자구분</td>
            <td style={HEADER_CELL_STYLE}>영수증번호(연월-일련번호)</td>
          </tr>
          <tr>
            <td style={CELL_STYLE}>{data.patient.department}</td>
            <td style={CELL_STYLE}>{data.patient.drgNumber}</td>
            <td style={CELL_STYLE}>{data.patient.room}</td>
            <td style={CELL_STYLE}>{data.patient.patientType}</td>
            <td style={CELL_STYLE}>{data.receiptNumber}</td>
          </tr>
        </tbody>
      </table>

      {/* 메인 항목 테이블 */}
      <table style={{ ...TABLE_STYLE, borderTop: 'none' }}>
        <thead>
          <tr>
            <th style={{ ...HEADER_CELL_STYLE, width: '18%' }} colSpan={3} rowSpan={3}>항목</th>
            <th style={HEADER_CELL_STYLE} colSpan={3}>급여</th>
            <th style={{ ...HEADER_CELL_STYLE, width: '8%' }} rowSpan={3}>비급여</th>
            <th style={{ ...HEADER_CELL_STYLE, width: '24%' }} rowSpan={3} colSpan={3}>금액산정내용</th>
          </tr>
          <tr>
            <th style={HEADER_CELL_STYLE} colSpan={2}>일부 본인부담</th>
            <th style={{ ...HEADER_CELL_STYLE, width: '8%' }} rowSpan={2}>전액 본인부담</th>
          </tr>
          <tr>
            <th style={{ ...HEADER_CELL_STYLE, width: '8%' }}>본인부담금</th>
            <th style={{ ...HEADER_CELL_STYLE, width: '8%' }}>공단부담금</th>
          </tr>
        </thead>
        <tbody>
          {/* 진찰료 */}
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, width: '2.5%', padding: '4px 2px', lineHeight: '1.8' }} rowSpan={18}>
              기<br />본<br />항<br />목
            </td>
            <td style={CELL_STYLE} colSpan={2}>진찰료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('진찰료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('진찰료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('진찰료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('진찰료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ fontWeight: 700 }}>⑥ 진료비 총액</div>
              <div style={{ fontSize: FONT_SIZES.SMALL }}>(①+②+③+④)</div>
            </td>
            <td style={{ ...CELL_STYLE }} rowSpan={2}>
              <div style={{ textAlign: 'right', marginTop: '2px', fontSize: '11px', fontWeight: 700 }}>{formatNumber(data.summary.totalMedicalFee)}</div>
            </td>
          </tr>
          {/* 입원료 - 1인실 */}
          <tr>
            <td style={CELL_STYLE} rowSpan={3}>
              입원료
            </td>
            <td style={CELL_STYLE}>1인실</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-1인실', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-1인실', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-1인실', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-1인실', 'nonInsuranceCopay'))}</td>
            {/* 진료비 총액 rowSpan=2 인해 삭제 */}
            {/* <td style={{ ...CELL_STYLE, borderTop: 'none', borderBottom: 'none' }}></td> */}
          </tr>
          {/* 입원료 - 2-3인실 */}
          <tr>
            <td style={CELL_STYLE}>2·3인실</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-2·3인실', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-2·3인실', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-2·3인실', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-2·3인실', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ fontWeight: 700 }}>⑦ 공단부담 총액</div>
              <div style={{ fontSize: FONT_SIZES.SMALL }}>(②+⑤)</div>
            </td>
            <td style={{ ...CELL_STYLE }} rowSpan={2}>
              <div style={{ textAlign: 'right', marginTop: '2px', fontSize: '11px', fontWeight: 700 }}>{formatNumber(data.summary.insurerPayment)}</div>
            </td>
          </tr>
          {/* 입원료 - 4인실 이상 */}
          <tr>
            <td style={CELL_STYLE}>4인실 이상</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-4인실 이상', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-4인실 이상', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-4인실 이상', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('입원료-4인실 이상', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE, borderTop: 'none', borderBottom: 'none' }}></td> */}
          </tr>
          {/* 식대 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>식대</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('식대', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('식대', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('식대', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('식대', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ fontWeight: 700 }}>⑧ 환자부담 총액</div>
              <div style={{ fontSize: FONT_SIZES.SMALL }}>(①-⑤)+(③+④)</div>
            </td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ textAlign: 'right', marginTop: '2px', fontSize: '11px', fontWeight: 700 }}>{formatNumber(data.summary.patientTotalPay)}</div>
            </td>
          </tr>
          {/* 투약 및 조제료 */}
          <tr>
            <td style={CELL_STYLE} rowSpan={2}>투약 및 조제료</td>
            <td style={CELL_STYLE}>행위료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-행위료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-행위료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-행위료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-행위료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE, borderTop: 'none', borderBottom: 'none' }}></td> */}
          </tr>
          <tr>
            <td style={CELL_STYLE}>약품비</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-약품비', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-약품비', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-약품비', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('투약 및 조제료-약품비', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ fontWeight: 700 }}>⑨ 이미 납부한 금액</div>
            </td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ textAlign: 'right', marginTop: '2px', fontSize: '11px', fontWeight: 700 }}>{formatNumber(data.summary.paidAmount)}</div>
            </td>
          </tr>
          {/* 주사료 */}
          <tr>
            <td style={CELL_STYLE} rowSpan={2}>주사료</td>
            <td style={CELL_STYLE}>행위료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-행위료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-행위료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-행위료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-행위료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE, borderTop: 'none', borderBottom: 'none' }}></td> */}
          </tr>
          <tr>
            <td style={CELL_STYLE}>약품비</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-약품비', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-약품비', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-약품비', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('주사료-약품비', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ fontWeight: 700 }}>⑩ 납부할 금액</div>
              <div style={{ fontSize: FONT_SIZES.SMALL }}>(⑧-⑨)</div>
            </td>
            <td style={{ ...CELL_STYLE }} rowSpan={2} colSpan={2}>
              <div style={{ textAlign: 'right', marginTop: '2px', fontSize: '11px', fontWeight: 700 }}>{formatNumber(data.summary.remainingAmount)}</div>
            </td>
          </tr>
          {/* 마취료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>마취료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('마취료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('마취료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('마취료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('마취료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE, borderTop: 'none', borderBottom: 'none' }}></td> */}
          </tr>
          {/* 처치 및 수술료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>처치 및 수술료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('처치 및 수술료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('처치 및 수술료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('처치 및 수술료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('처치 및 수술료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} rowSpan={4}>
              <div style={{ fontWeight: 700 }}>⑪ 납부한 금액</div>
            </td>
            <td style={{ ...CELL_STYLE }}>카드</td>
            <td style={{ ...CELL_STYLE }}>{formatNumber(data.payment.card)}</td>
          </tr>
          {/* 검사료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>검사료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('검사료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('검사료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('검사료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('검사료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }}>현금영수증</td>
            <td style={{ ...CELL_STYLE }}>{formatNumber(data.payment.cashReceipt)}</td>
          </tr>
          <tr>
            <td style={CELL_STYLE} colSpan={2}>영상진단료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('영상진단료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('영상진단료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('영상진단료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('영상진단료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }}>현금</td>
            <td style={{ ...CELL_STYLE }}>{formatNumber(data.payment.cash)}</td>
          </tr>
          <tr>
            <td style={CELL_STYLE} colSpan={2}>방사선치료료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('방사선치료료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('방사선치료료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('방사선치료료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('방사선치료료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }}>합계</td>
            <td style={{ ...CELL_STYLE }}>{formatNumber(data.payment.total)}</td>
          </tr>
          <tr>
            <td style={CELL_STYLE} colSpan={2}>치료재료대</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('치료재료대', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('치료재료대', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('치료재료대', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('치료재료대', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} colSpan={2}>납부하지 않은 금액(⑩-⑪)</td>
            <td style={{ ...CELL_STYLE }}>{formatNumber(data.payment.outstanding)}</td>
          </tr>
          <tr>
            <td style={CELL_STYLE} colSpan={2}>재활 및 물리치료료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('재활 및 물리치료료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('재활 및 물리치료료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('재활 및 물리치료료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('재활 및 물리치료료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} colSpan={3}>현금영수증 ( )</td>
          </tr>
          <tr>
            <td style={CELL_STYLE} colSpan={2}>정신요법료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정신요법료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정신요법료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정신요법료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정신요법료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} colSpan={2}>신분확인번호</td>
            <td style={{ ...CELL_STYLE }}>{data.payment.cashReceiptIdentifier || ''}</td>
          </tr>
          <tr>
            <td style={CELL_STYLE} colSpan={2}>전혈 및 혈액성분제제료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('전혈 및 혈액성분제제료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('전혈 및 혈액성분제제료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('전혈 및 혈액성분제제료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('전혈 및 혈액성분제제료', 'nonInsuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE }} colSpan={2}>현금영수증 승인번호</td>
            <td style={{ ...CELL_STYLE }}>{data.payment.cashReceiptApprovalNo || ''}</td>
          </tr>
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, width: '2.5%', padding: '4px 2px', lineHeight: '1.8' }} rowSpan={6}>
              선<br />택<br />항<br />목
            </td>
            <td style={CELL_STYLE} colSpan={2}>CT 진단료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('CT 진단료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('CT 진단료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('CT 진단료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('CT 진단료', 'nonInsuranceCopay'))}</td>
            <td
              style={{
                ...CELL_STYLE,
                verticalAlign: 'top',
                padding: '8px',
              }}
              colSpan={3}
              rowSpan={14}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    marginBottom: '4px',
                    alignSelf: 'flex-start',
                  }}
                >
                  * 요양기관 임의활용공간
                </div>
                <div
                  style={{
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-all',
                  }}
                >
                </div>
              </div>
            </td>
          </tr>
          {/* MRI 진단료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>MRI 진단료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('MRI 진단료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('MRI 진단료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('MRI 진단료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('MRI 진단료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* PET 진단료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>PET 진단료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('PET 진단료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('PET 진단료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('PET 진단료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('PET 진단료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 초음파 진단료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>초음파 진단료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('초음파 진단료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('초음파 진단료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('초음파 진단료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('초음파 진단료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 보철·교정료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>보철·교정료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('보철·교정료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('보철·교정료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('보철·교정료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('보철·교정료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 제증명수수료 */}
          <tr>
            <td style={CELL_STYLE} colSpan={2}>제증명수수료</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('제증명수수료', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('제증명수수료', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('제증명수수료', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('제증명수수료', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>

          {/* 선별급여 */}
          <tr>
            <td style={CELL_STYLE} colSpan={3}>선별급여</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('선별급여', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('선별급여', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('선별급여', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('선별급여', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 65세 이상 등 정액 */}
          <tr>
            <td style={CELL_STYLE} colSpan={3}>65세 이상 등 정액</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('65세 이상 등 정액', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('65세 이상 등 정액', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('65세 이상 등 정액', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('65세 이상 등 정액', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 정액수가(요양병원) */}
          <tr>
            <td style={CELL_STYLE} colSpan={3}>정액수가(요양병원)</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(요양병원)', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(요양병원)', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(요양병원)', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(요양병원)', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 정액수가(완화의료) */}
          <tr>
            <td style={CELL_STYLE} colSpan={3}>정액수가(완화의료)</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(완화의료)', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(완화의료)', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(완화의료)', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('정액수가(완화의료)', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 질병군 포괄수가 */}
          <tr>
            <td style={CELL_STYLE} colSpan={3}>질병군 포괄수가</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('질병군 포괄수가', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('질병군 포괄수가', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('질병군 포괄수가', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('질병군 포괄수가', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>
          {/* 기타 */}
          <tr>
            <td style={CELL_STYLE} colSpan={3}>기타</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('기타', 'insuranceCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('기타', 'insurerPayment'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('기타', 'insuranceFullCopay'))}</td>
            <td style={{ ...CELL_STYLE, textAlign: 'right' }}>{formatNumber(getItemValue('기타', 'nonInsuranceCopay'))}</td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>

          {/* 합계 행 */}
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }} colSpan={3}>합계</td>
            <td style={{ ...CELL_STYLE, fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: FONT_SIZES.SMALL }}>
                <span>①</span>
                <span>{formatNumber(data.fees.totals.insuranceCopay)}</span>
              </div>
            </td>
            <td style={{ ...CELL_STYLE, fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: FONT_SIZES.SMALL }}>
                <span>②</span>
                <span>{formatNumber(data.fees.totals.insurerPayment)}</span>
              </div>
            </td>
            <td style={{ ...CELL_STYLE, fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: FONT_SIZES.SMALL }}>
                <span>③</span>
                <span>{formatNumber(data.fees.totals.insuranceFullCopay)}</span>
              </div>
            </td>
            <td style={{ ...CELL_STYLE, fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: FONT_SIZES.SMALL }}>
                <span>④</span>
                <span>{formatNumber(data.fees.totals.nonInsuranceCopay)}</span>
              </div>
            </td>
            {/* <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td>
            <td style={{ ...CELL_STYLE }}></td> */}
          </tr>

          {/* 상한액 초과금 */}
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }} colSpan={3}>상한액 초과금</td>
            <td style={{ ...CELL_STYLE, fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: FONT_SIZES.SMALL }}>
                <span>⑤</span>
                <span>{formatNumber(data.summary.excessAmount)}</span>
              </div>
            </td>
            <td style={{ ...CELL_STYLE }} colSpan={3}>-</td>
          </tr>

          {/* 요양기관 종류 */}
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }} colSpan={3}>요양기관 종류</td>
            <td style={{ ...CELL_STYLE }} colSpan={7}>
              {formatFacilityTypeCheckbox(data.hospital.facilityType)}
            </td>
          </tr>

          {/* 사업자등록번호, 상호, 전화번호 */}
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }} colSpan={3}>사업자등록번호</td>
            <td style={{ ...CELL_STYLE }} colSpan={2}>{data.hospital.businessNumber}</td>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }}>상호</td>
            <td style={{ ...CELL_STYLE }} colSpan={2}>{data.hospital.name}</td>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }}>전화번호</td>
            <td style={{ ...CELL_STYLE }}>{data.hospital.phone}</td>
          </tr>

          {/* 사업장 소재지, 대표자 */}
          <tr>
            <td style={{ ...HEADER_CELL_STYLE, fontWeight: 700 }} colSpan={3}>사업장 소재지</td>
            <td style={{ ...CELL_STYLE }} colSpan={4}>{data.hospital.address}</td>
            <td style={{ ...HEADER_CELL_STYLE }}>대표자</td>
            <td style={{ ...CELL_STYLE }} colSpan={2}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: '60px',
                }}
              >
                <span>{data.hospital.representative}</span>
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '75%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 700,
                    fontSize: '9px',
                    zIndex: 1,
                  }}
                >
                  [인]
                </span>
                {sealImage && (
                  <img
                    src={sealImage}
                    alt="seal"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '75%',
                      transform: 'translate(-50%, -50%)',
                      width: '50px',
                      height: '50px',
                    }}
                  />
                )}
              </div>
            </td>
          </tr>

          {/* 날짜 */}
          <tr>
            <td style={{ ...CELL_STYLE }} colSpan={10}>{data.receiptDate}</td>
          </tr>

          <tr>
            <td style={{ ...CELL_STYLE }} colSpan={7}>항목별 설명</td>
            <td style={{ ...CELL_STYLE }} colSpan={3}>일반사항 안내</td>
          </tr>
          <tr>
            <td style={{ ...CELL_STYLE, textAlign: 'left', verticalAlign: 'top', padding: '4px' }} colSpan={7}>
              <ReceiptNotice />
            </td>
            <td style={{ ...CELL_STYLE, textAlign: 'left', verticalAlign: 'top', padding: '4px' }} colSpan={3}>
              <ReceiptGeneralInfo />
            </td>
          </tr>

          <tr>
            <td style={{ ...CELL_STYLE, textAlign: 'left', padding: '4px' }} colSpan={10}>
              <ReceiptFooterNotes />
            </td>
          </tr>
        </tbody>
      </table>
    </PrintableDocument>
  );
}

function formatNumber(num: number) {
  return num ? num.toLocaleString() : '0';
}

const FACILITY_TYPES = [
  '의원급·보건기관',
  '병원급',
  '종합병원',
  '상급종합병원',
] as const;

function formatFacilityTypeCheckbox(facilityType: string) {
  return FACILITY_TYPES.map((type) => {
    const isChecked = facilityType.includes(type);
    return `${isChecked ? '[ V ]' : '[ ]'} ${type}`;
  }).join(' ');
}

function formatVisitTypeCheckbox(visitType: string) {
  const isNight = visitType === '야간';
  const isHoliday = visitType === '공휴일';
  return `${isNight ? '[V]' : '[ ]'} 야간 ${isHoliday ? '[V]' : '[ ]'} 공휴일`;
}

function formatTitleVisitCheckbox(visitCategory: string) {
  const isOutpatient = visitCategory === '외래';
  const isInpatient = visitCategory === '입원';
  return `${isOutpatient ? '[V]' : '[ ]'} 외래 ${isInpatient ? '[V]' : '[ ]'} 입원`;
}

function formatTitleDischargeCheckbox(isInterimBill: boolean) {
  // FIXME: 퇴원 값 반영 필요(현재 퇴원 구현 안 되어 있고 중간 청구 여부만 반영)
  const isDischarge = false;
  const isInterim = isInterimBill;
  return `${isDischarge ? '[V]' : '[ ]'} 퇴원 ${isInterim ? '[V]' : '[ ]'} 중간`;
}

// TODO: 원본과 텍스트 비교
const RECEIPT_NOTICES = [
  {
    id: 1,
    content: '일부 본인부담: 일반적으로 다음과 같이 본인부담률을 적용하나, 요양기관 지역, 요양기관의 종별, 환자 자격, 선별급여(「국민건강보험법」 제41조의4에 따른 요양급여) 여부, 병실종류 등에 따라 달라질 수 있습니다.',
    subItems: [
      '- 외래 본인부담률: 요양기관 종별에 따라 30% ~ 60%(의료급여는 수급권자 종별 및 의료급여기관 유형 등에 따라 0원 ~ 2,500원. 0% ~ 15%) 등',
      '- 입원 본인부담률: 20%(의료급여는 수급권자 종별 및 의료급여기관 유형 등에 따라 0% ~ 10%) 등',
      '※ 식대: 50%(의료급여는 20%)/CT·MRI·PET: 외래 본인부담률(의료급여는 입원 본인부담률과 동일) / 선별급여(「국민건강보험법」 제41조의4에 따른 요양급여): 보건복지부장관이 고시한 항목별 본인부담률 (50%, 80%, 90%)',
      '※ 상급종합병원 입원료: 2인실 50%, 3인실 40%, 4인실 30% / 병원급 의료기관(치과병원 제외) 입원료: 2인실 40%, 3인실 30%'
    ]
  },
  {
    id: 2,
    content: '전액 본인부담: 「국민건강보험법 시행규칙」 별표 6 또는 「의료급여법 시행규칙」 별표 1의2에 따라 적용되는 항목으로 건강보험(의료급여)에서 금액을 정하고 있으나 진료비 전액을 환자 본인이 부담합니다.',
  },
  {
    id: 3,
    content: '상한액 초과금: 「국민건강보험법 시행령」 별표 3 제1호에 따른 본인부담상한액의 최고 금액을 초과하는 본인부담금이 발생한 경우[단, 「의료법」 제3조제2항제3호라목에 따른 요양병원(「장애인복지법」 제58조제1항제4호에 따른 장애인 의료재활시설로서 「의료법」 제3조의2의 요건을 갖춘 의료기관인 요양병원은 제외)에 입원한 기간이 같은 연도에 120일을 초과하는 경우는 제외], 공단이 부담하는 초과분 중 사전 정산하는 금액을 말합니다.',
    subItems: [
      '※ 전액 본인부담 및 선별급여(「국민건강보험법」 제41조의4에 따른 요양급여)의 본인부담금 등은 본인부담 상한액 산정시 제외합니다.'
    ]
  },
  {
    id: 4,
    content: "'질병군포괄수가'란 「국민건강보험법 시행령」 제21조제3항제2호 및 「국민건강보험 요양급여의 기준에 관한 규칙」 제8조제3항에 따라 보건복지부장관이 고시한 질병군 입원진료에 대하여 해당 입원진료와 관련되는 여러 의료행위를 하나의 행위로 정하여 요양급여비용을 결정한 것을 말합니다. 다만, 해당 질병군의 입원진료와 관련되는 의료행위라도 비급여대상이나 이송처치료 등 포괄수가에서 제외되는 항목은 위 표의 기본항목 및 선택항목란에 합산하여 표기됩니다.",
  }
];

// TODO: 원본과 텍스트 비교
const RECEIPT_GENERAL_INFO = [
  {
    id: 1,
    content: '이 계산서·영수증에 대한 세부 내용은 요양기관에 요구하여 제공 받을 수 있습니다.',
  },
  {
    id: 2,
    content: '국민건강보험법」 제48조 또는 「의료급여법」 제11조의3에 따라 환자가 전액 부담한 비용과 비 급여로 부담한 비용의 타당성 여부를 건강보험심사평가원(☎ 1644-2000, 홈페이지: www.hira.or.kr)에 확인 요청하실 수 있습니다.',
  },
  {
    id: 3,
    content: "계산서·영수증은 「소득세법」 에 따른 의료비 공제신청 또는 「조세특례제한법」 에 따른 현금 영수증 공제신청(현금영수증 승인 번호가 적힌 경우만 해당합니다)에 사용할 수 있습니다. 다만, 지출증빙용으로 발급된 '현금 영수증(지출증빙)'은 공제신청에 사용할 수 없습니다.",
    note: '(현금영수증 문의 126 인터넷 홈페이지: http://현금영수증.kr)'
  }
];

// TODO: 원본과 텍스트 비교
const RECEIPT_FOOTER_NOTES = [
  {
    id: 1,
    content: '진료항목 중 선택항목은 요양기관의 특성에 따라 추가 또는 생략할 수 있으며, 야간(공휴일) 진료 시 진료비가 가산될 수 있습니다.',
  },
  {
    id: 2,
    content: '환자가 「위기 임신 및 보호출산 지원과 아동 보호에 관한 특별법」 제2조제3호에 따른 비 식별화된 가명을 부여받은 경우에는 환자의 성명 대신 가명을 기재할 수 있습니다.',
  }
];

function ReceiptNotice() {
  return (
    <div style={{ fontSize: '7px', lineHeight: '1.2' }}>
      {RECEIPT_NOTICES.map((notice) => (
        <div key={notice.id} style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ minWidth: '12px' }}>{notice.id}.</span>
            <span>{notice.content}</span>
          </div>
          {notice.subItems && (
            <div style={{ marginLeft: '12px' }}>
              {notice.subItems.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReceiptGeneralInfo() {
  return (
    <div style={{ fontSize: '7px', lineHeight: '1.2' }}>
      {RECEIPT_GENERAL_INFO.map((info) => (
        <div key={info.id} style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ minWidth: '12px' }}>{info.id}.</span>
            <span>{info.content}</span>
          </div>
          {info.note && (
            <div style={{ marginTop: '2px' }}>{info.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReceiptFooterNotes() {
  return (
    <div style={{ fontSize: '7px', lineHeight: '1.2', display: 'flex' }}>
      <span style={{ minWidth: '40px' }}>주(註) :</span>
      <div style={{ flex: 1 }}>
        {RECEIPT_FOOTER_NOTES.map((note) => (
          <div key={note.id} style={{ display: 'flex' }}>
            <span style={{ minWidth: '15px' }}>{note.id}.</span>
            <span>{note.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
