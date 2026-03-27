# 영수증 API 매핑 정리

## 대상 API
- `/v1/documents/encounters/{id}/medical-bill-receipt`

## 변환 위치
- `src/app/document/_reception_templates/Receipt/utils.ts`

## 제목부 매핑
- `header.visitType` -> `ReceiptData.title.visitCategory` ('외래' | '입원')
  - 제목 "[V] 외래 [ ] 입원" / "[ ] 외래 [V] 입원" 체크박스 표시
- `header.isInterimBill` -> `ReceiptData.title.isInterimBill`
  - 제목 "([ ] 퇴원 [ ] 중간)" 체크박스 표시 (true: 중간, false: 퇴원)

## 환자/진료 정보 매핑
- `header.patientNo` -> `ReceiptData.patient.patientNo`
- `header.patientName` -> `ReceiptData.patient.name`
- `header.treatmentPeriod.startDate/endDate` -> `ReceiptData.patient.visitPeriod`
  - 시작/종료일이 다르면 `YYYY-MM-DD ~ YYYY-MM-DD` 형식으로 합성
- `header.nightVisit`/`header.holidayVisit` -> `ReceiptData.patient.visitType`
  - 야간이면 `야간`, 공휴일이면 `공휴일`, 그 외 `주간`
- `header.department` -> `ReceiptData.patient.department`
- `header.drgNo` -> `ReceiptData.patient.drgNumber`
- `header.roomType` -> `ReceiptData.patient.room`
- `header.patientCategory` -> `ReceiptData.patient.patientType`
- `header.receiptNo` -> `ReceiptData.receiptNumber`

## 항목별 금액 매핑
`PaymentAmountDto`는 다음과 같이 매핑합니다.
- `insuredCopay` -> `insuranceCopay`
- `insurerPayment` -> `insurerPayment`
- `insuredFullPay` -> `insuranceFullCopay`
- `uninsured` -> `nonInsuranceCopay`

기본항목(`items.basic`)
- `consultation` -> `진찰료`
- `hospitalization.singleRoom` -> `입원료-1인실`
- `hospitalization.twoThreePersonRoom` -> `입원료-2·3인실`
- `hospitalization.fourPlusPersonRoom` -> `입원료-4인실 이상`
- `meals` -> `식대`
- `medicationService` -> `투약 및 조제료-행위료`
- `medicationDrug` -> `투약 및 조제료-약품비`
- `injectionService` -> `주사료-행위료`
- `injectionDrug` -> `주사료-약품비`
- `anesthesia` -> `마취료`
- `procedureSurgery` -> `처치 및 수술료`
- `labTest` -> `검사료`
- `imaging` -> `영상진단료`
- `radiationTherapy` -> `방사선치료료`
- `medicalSupplies` -> `치료재료대`
- `rehabilitation` -> `재활 및 물리치료료`
- `mentalHealth` -> `정신요법료`
- `bloodProducts` -> `전혈 및 혈액성분제제료`

선택항목(`items.elective`)
- `ct` -> `CT 진단료`
- `mri` -> `MRI 진단료`
- `pet` -> `PET 진단료`
- `ultrasound` -> `초음파 진단료`
- `prostheticsOrthodontics` -> `보철·교정료`
- `certificates` -> `제증명수수료`
- `selectiveCoverage` -> `선별급여`
- `seniorFixedRate` -> `65세 이상 등 정액`
- `longTermCareFixed` -> `정액수가(요양병원)`
- `palliativeCareFixed` -> `정액수가(완화의료)`
- `drgPackage` -> `질병군 포괄수가`
- `other` -> `기타`

합계(`items.totals`)
- `insuredCopay` -> `ReceiptData.fees.totals.insuranceCopay`
- `insurerPayment` -> `ReceiptData.fees.totals.insurerPayment`
- `insuredFullPay` -> `ReceiptData.fees.totals.insuranceFullCopay`
- `uninsured` -> `ReceiptData.fees.totals.nonInsuranceCopay`
- `selectiveCoverage.insuredCopay` -> `ReceiptData.fees.totals.selectiveCopay`

## 요약/수납 매핑
- `summary.totalMedicalExpense` -> `ReceiptData.summary.totalMedicalFee`
- `summary.insurerPayment` -> `ReceiptData.summary.insurerPayment`
- `summary.patientPayment` -> `ReceiptData.summary.patientTotalPay`
- `summary.previouslyPaid` -> `ReceiptData.summary.paidAmount`
- `summary.amountDue` -> `ReceiptData.summary.remainingAmount`
- `summary.ceilingExcess` -> `ReceiptData.summary.excessAmount`

## 결제 정보 매핑
- `payment.card` -> `ReceiptData.payment.card`
- `payment.cashReceipt` -> `ReceiptData.payment.cashReceipt`
- `payment.cash` -> `ReceiptData.payment.cash`
- `payment.total` -> `ReceiptData.payment.total`
- `payment.outstanding` -> `ReceiptData.payment.outstanding`
- `payment.cashReceiptIdentifier` -> `ReceiptData.payment.cashReceiptIdentifier`
- `payment.cashReceiptApprovalNo` -> `ReceiptData.payment.cashReceiptApprovalNo`

## 발행 정보 매핑
- `issuance.issueDate` -> `ReceiptData.receiptDate`
- `issuance.businessRegistrationNo` -> `ReceiptData.hospital.businessNumber`
- `issuance.facilityName` -> `ReceiptData.hospital.name`
- `issuance.address` -> `ReceiptData.hospital.address`
- `issuance.representativeName` -> `ReceiptData.hospital.representative`
- `issuance.phone` -> `ReceiptData.hospital.phone`
- `issuance.facilityType` -> `ReceiptData.hospital.facilityType`

## 비고
- `issuance` 값이 비어있으면 `useHospitalStore()`의 정보로 보완합니다.
- 현재 마크업은 일부 항목만 참조하므로, 매핑은 전체 항목을 준비하되 표시 여부는 마크업에서 결정됩니다.
