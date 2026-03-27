// 발급이력 목 데이터

import type { IssuanceHistoryItem } from '../_types/issuance-history-types';

// 환자별 발급이력 목 데이터
export const mockPatientIssuanceHistory: IssuanceHistoryItem[] = [
  {
    id: '1',
    issuanceDate: '2024-12-15',
    documentName: '진단서',
    issuerName: '김의사',
  },
  {
    id: '2',
    issuanceDate: '2024-12-10',
    documentName: '소견서',
    issuerName: '이의사',
  },
  {
    id: '3',
    issuanceDate: '2024-12-05',
    documentName: '진단서',
    issuerName: '박의사',
  },
  {
    id: '4',
    issuanceDate: '2024-11-28',
    documentName: '처방전',
    issuerName: '최의사',
  },
  {
    id: '5',
    issuanceDate: '2024-11-20',
    documentName: '소견서',
    issuerName: '김의사',
  },
  {
    id: '6',
    issuanceDate: '2024-11-15',
    documentName: '진단서',
    issuerName: '이의사',
  },
  {
    id: '7',
    issuanceDate: '2024-11-10',
    documentName: '처방전',
    issuerName: '박의사',
  },
  {
    id: '8',
    issuanceDate: '2024-11-05',
    documentName: '진단서',
    issuerName: '최의사',
  },
  {
    id: '9',
    issuanceDate: '2024-10-30',
    documentName: '소견서',
    issuerName: '김의사',
  },
  {
    id: '10',
    issuanceDate: '2024-10-25',
    documentName: '진단서',
    issuerName: '이의사',
  },
];

// 서식별 발급이력 목 데이터
export const mockDocumentIssuanceHistory: IssuanceHistoryItem[] = [
  {
    id: '1',
    issuanceDate: '2024-12-15',
    chartNumber: 'CH001',
    patientName: '홍길동',
    issuerName: '김의사',
  },
  {
    id: '2',
    issuanceDate: '2024-12-12',
    chartNumber: 'CH002',
    patientName: '김철수',
    issuerName: '이의사',
  },
  {
    id: '3',
    issuanceDate: '2024-12-10',
    chartNumber: 'CH003',
    patientName: '이영희',
    issuerName: '박의사',
  },
  {
    id: '4',
    issuanceDate: '2024-12-08',
    chartNumber: 'CH004',
    patientName: '박민수',
    issuerName: '최의사',
  },
  {
    id: '5',
    issuanceDate: '2024-12-05',
    chartNumber: 'CH005',
    patientName: '최지영',
    issuerName: '김의사',
  },
  {
    id: '6',
    issuanceDate: '2024-12-01',
    chartNumber: 'CH006',
    patientName: '정수진',
    issuerName: '이의사',
  },
  {
    id: '7',
    issuanceDate: '2024-11-28',
    chartNumber: 'CH007',
    patientName: '강동원',
    issuerName: '박의사',
  },
  {
    id: '8',
    issuanceDate: '2024-11-25',
    chartNumber: 'CH008',
    patientName: '윤서연',
    issuerName: '최의사',
  },
  {
    id: '9',
    issuanceDate: '2024-11-20',
    chartNumber: 'CH009',
    patientName: '조민호',
    issuerName: '김의사',
  },
  {
    id: '10',
    issuanceDate: '2024-11-15',
    chartNumber: 'CH010',
    patientName: '한소희',
    issuerName: '이의사',
  },
];

