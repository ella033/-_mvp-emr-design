# 진료비 세부내역서 API 매핑 정리

## 대상 API
- `/v1/documents/encounters/{id}/detailed-statement` (DetailedStatementResponseDto)

## 변환 위치
- `src/app/document/_reception_templates/MedicalExpense/utils.ts` (`transformDetailedStatementToMedicalExpenseData`)

## 헤더 매핑
- `header.patientNo` -> `MedicalExpenseData.patient.patientNo`
- `header.patientName` -> `MedicalExpenseData.patient.name`
- `header.treatmentPeriod.startDate/endDate` -> `MedicalExpenseData.patient.visitPeriod`
- `header.roomType` -> `MedicalExpenseData.patient.room`
- `header.patientCategory` / `header.patientCategoryDescription` -> `MedicalExpenseData.patient.patientType`
- `header.remarks` -> `MedicalExpenseData.patient.remarks`

## 항목 매핑 (items -> itemsByDate)
- `item.serviceDate` -> 날짜 키 및 `MedicalExpenseItem.date`
- `item.code` -> `MedicalExpenseItem.code`
- `item.name` -> `MedicalExpenseItem.name`
- `item.unitPrice` -> `MedicalExpenseItem.amount`
- `item.quantity` -> `MedicalExpenseItem.count`
- `item.days` -> `MedicalExpenseItem.days`
- `item.totalAmount` -> `MedicalExpenseItem.total`
- `item.payment.insuredCopay` -> `MedicalExpenseItem.insuranceCopay`
- `item.payment.insurerPay` -> `MedicalExpenseItem.publicInsurance`
- `item.payment.insuredFullPay` -> `MedicalExpenseItem.insuranceFullCopay`
- `item.payment.uninsured` -> `MedicalExpenseItem.nonInsuranceCopay`
- `item.category` -> `MedicalExpenseItem.category`

## 합계 매핑
- `summary.subtotal` -> `MedicalExpenseData.totals.subtotal` (계 행)
- `summary.adjustment` -> `MedicalExpenseData.totals.adjustment` (끝처리 조정금액 행)
- `summary.grandTotal` -> `MedicalExpenseData.totals.grandTotal` (합계 행)

## 발행 정보 매핑
- `issuance.issueDate` -> `MedicalExpenseData.issuedAt`
- `issuance.facilityName` -> `MedicalExpenseData.hospital.name`
- `issuance.representativeName` -> `MedicalExpenseData.hospital.representative`
- `issuance.applicantRelation` -> `MedicalExpenseData.applicantRelation` (환자와의 관계)

## 비고
- `transformToMedicalExpenseData`(encounters 기반)는 API 응답이 아닌 encounter 목록을 사용하며, `remarks`·`applicantRelation`은 기본값, `totals.adjustment`는 0으로 설정합니다.
