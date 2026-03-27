import {
  MedicalBillReceiptResponseDto,
  PaymentAmountDto,
} from '@/types/receipt/medical-bill-receipt-types';
import { ReceiptData, ReceiptItemData } from './types';
import { formatDate } from '@/lib/date-utils';
import { formatPhoneNumber } from '@/lib/patient-utils';

export function transformToReceiptData(params: {
  receiptDetail: MedicalBillReceiptResponseDto;
  hospitalInfo: any;
}): ReceiptData {
  const { receiptDetail, hospitalInfo } = params;
  const { header, items: receiptItems, summary, issuance } = receiptDetail;
  const basicItems = receiptItems?.basic;
  const electiveItems = receiptItems?.elective;

  const toReceiptItem = (
    name: string,
    amount?: PaymentAmountDto
  ): ReceiptItemData => ({
    name,
    insuranceCopay: amount?.insuredCopay ?? 0,
    insurerPayment: amount?.insurerPayment ?? 0,
    insuranceFullCopay: amount?.insuredFullPay ?? 0,
    nonInsuranceCopay: amount?.uninsured ?? 0,
  });

  const items: ReceiptItemData[] = [
    toReceiptItem('진찰료', basicItems?.consultation),
    toReceiptItem('입원료-1인실', basicItems?.hospitalization?.singleRoom),
    toReceiptItem('입원료-2·3인실', basicItems?.hospitalization?.twoThreePersonRoom),
    toReceiptItem('입원료-4인실 이상', basicItems?.hospitalization?.fourPlusPersonRoom),
    toReceiptItem('식대', basicItems?.meals),
    toReceiptItem('투약 및 조제료-행위료', basicItems?.medicationService),
    toReceiptItem('투약 및 조제료-약품비', basicItems?.medicationDrug),
    toReceiptItem('주사료-행위료', basicItems?.injectionService),
    toReceiptItem('주사료-약품비', basicItems?.injectionDrug),
    toReceiptItem('마취료', basicItems?.anesthesia),
    toReceiptItem('처치 및 수술료', basicItems?.procedureSurgery),
    toReceiptItem('검사료', basicItems?.labTest),
    toReceiptItem('영상진단료', basicItems?.imaging),
    toReceiptItem('방사선치료료', basicItems?.radiationTherapy),
    toReceiptItem('치료재료대', basicItems?.medicalSupplies),
    toReceiptItem('재활 및 물리치료료', basicItems?.rehabilitation),
    toReceiptItem('정신요법료', basicItems?.mentalHealth),
    toReceiptItem('전혈 및 혈액성분제제료', basicItems?.bloodProducts),
    toReceiptItem('CT 진단료', electiveItems?.ct),
    toReceiptItem('MRI 진단료', electiveItems?.mri),
    toReceiptItem('PET 진단료', electiveItems?.pet),
    toReceiptItem('초음파 진단료', electiveItems?.ultrasound),
    toReceiptItem('보철·교정료', electiveItems?.prostheticsOrthodontics),
    toReceiptItem('제증명수수료', electiveItems?.certificates),
    toReceiptItem('선별급여', electiveItems?.selectiveCoverage),
    toReceiptItem('65세 이상 등 정액', electiveItems?.seniorFixedRate),
    toReceiptItem('정액수가(요양병원)', electiveItems?.longTermCareFixed),
    toReceiptItem('정액수가(완화의료)', electiveItems?.palliativeCareFixed),
    toReceiptItem('질병군 포괄수가', electiveItems?.drgPackage),
    toReceiptItem('기타', electiveItems?.other),
  ];

  const totals = {
    insuranceCopay: receiptItems?.totals?.insuredCopay ?? 0,
    insurerPayment: receiptItems?.totals?.insurerPayment ?? 0,
    insuranceFullCopay: receiptItems?.totals?.insuredFullPay ?? 0,
    nonInsuranceCopay: receiptItems?.totals?.uninsured ?? 0,
    selectiveCopay: electiveItems?.selectiveCoverage?.insuredCopay ?? 0,
  };

  const visitPeriodStart = formatDate(header?.treatmentPeriod?.startDate, '-');
  const visitPeriodEnd = formatDate(header?.treatmentPeriod?.endDate, '-');
  const visitPeriod =
    visitPeriodStart && visitPeriodEnd && visitPeriodStart !== visitPeriodEnd
      ? `${visitPeriodStart} ~ ${visitPeriodEnd}`
      : visitPeriodStart || visitPeriodEnd || '';

  const visitType = getVisitType(header);
  const businessNumber =
    issuance?.businessRegistrationNo || hospitalInfo?.businessNumber || '';
  const hospitalName = issuance?.facilityName || hospitalInfo?.name || '';
  const hospitalAddress =
    issuance?.address ||
    `${hospitalInfo?.address1 || ''} ${hospitalInfo?.address2 || ''}`.trim();
  const hospitalRepresentative =
    issuance?.representativeName || hospitalInfo?.representative || '';
  const hospitalPhone = issuance?.phone || hospitalInfo?.phone || '';

  return {
    title: {
      visitCategory: header?.visitType || '외래',
      isInterimBill: header?.isInterimBill ?? false,
    },
    patient: {
      patientNo: header?.patientNo ?? '',
      name: header?.patientName || '',
      visitPeriod,
      visitType,
      department: header?.department || '',
      drgNumber: header?.drgNo || '',
      room: header?.roomType || '',
      patientType: header?.patientCategory || '',
    },
    fees: {
      items,
      totals,
    },
    summary: {
      totalMedicalFee: summary?.totalMedicalExpense || 0,
      insurerPayment: summary?.insurerPayment || 0,
      patientTotalPay: summary?.patientPayment || 0,
      paidAmount: summary?.previouslyPaid || 0,
      remainingAmount: summary?.amountDue || 0,
      excessAmount: summary?.ceilingExcess || 0,
    },
    payment: {
      card: receiptDetail.payment?.card ?? 0,
      cashReceipt: receiptDetail.payment?.cashReceipt ?? 0,
      cash: receiptDetail.payment?.cash ?? 0,
      total: receiptDetail.payment?.total ?? 0,
      outstanding: receiptDetail.payment?.outstanding ?? 0,
      cashReceiptIdentifier: receiptDetail.payment?.cashReceiptIdentifier ?? null,
      cashReceiptApprovalNo: receiptDetail.payment?.cashReceiptApprovalNo ?? null,
    },
    hospital: {
      businessNumber: businessNumber || '135-81-05009',
      name: hospitalName || '(주)녹십자홀딩스 부속의원',
      address: hospitalAddress || '경기도 용인시 기흥구 보정동',
      representative: hospitalRepresentative || '허용준',
      phone: formatPhoneNumber(hospitalPhone),
      facilityType: issuance?.facilityType || '의원급·보건기관',
    },
    receiptDate: issuance?.issueDate
      ? formatDate(issuance.issueDate, '-')
      : formatDate(new Date(), '-'),
    receiptNumber: header?.receiptNo || '0195241',
  };
}

function getVisitType(header?: MedicalBillReceiptResponseDto['header']) {
  if (header?.nightVisit) {
    return '야간';
  }
  if (header?.holidayVisit) {
    return '공휴일';
  }
  return '주간';
}
