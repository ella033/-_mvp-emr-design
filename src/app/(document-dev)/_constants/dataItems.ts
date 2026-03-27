import { FieldType, FieldConverter, type DataItem } from '@/types/document';
import { ValueResolver } from '@/lib/field-value-resolvers';

/**
 * 데이터 필드 카테고리 정의
 */
export interface DataItemCategory {
  id: string;
  label: string;
  items: DataItem[];
}

/**
 * 환자 정보 필드
 */
const PATIENT_ITEMS: DataItem[] = [
  { keyPrefix: 'patient_id', name: '차트번호', type: FieldType.NUMBER, dataSource: 'patient.patientNo' },
  { keyPrefix: 'patient_name', name: '성명', type: FieldType.TEXT, dataSource: 'patient.name' },
  { keyPrefix: 'patient_gender', name: '성별', type: FieldType.TEXT, dataSource: 'patient.gender', options: { converter: FieldConverter.GENDER_TO_TEXT } },
  { keyPrefix: 'patient_age', name: '나이', type: FieldType.NUMBER, dataSource: 'patient.age' },
  { keyPrefix: 'patient_birth_date', name: '생년월일', type: FieldType.TEXT, dataSource: 'patient.birthDate' },
  { keyPrefix: 'patient_address', name: '주소', type: FieldType.TEXTAREA, dataSource: 'patient.address' },
  { keyPrefix: 'patient_rrn', name: '주민등록번호', type: FieldType.TEXT, dataSource: 'patient.rrn', options: { converter: FieldConverter.RRN_TO_FORMATTED } },
  { keyPrefix: 'patient_rrn_view', name: '주민등록번호(마스킹)', type: FieldType.TEXT, dataSource: 'patient.rrnView', options: { converter: FieldConverter.RRN_TO_MASKED } },
  { keyPrefix: 'patient_phone', name: '휴대폰번호', type: FieldType.TEXT, dataSource: 'patient.phone1', options: { converter: FieldConverter.PHONE_TO_FORMATTED } },
];

/**
 * 병원 정보 필드
 */
const HOSPITAL_ITEMS: DataItem[] = [
  { keyPrefix: 'hospital_name', name: '병원명', type: FieldType.TEXT, dataSource: 'hospital.name' },
  { keyPrefix: 'hospital_name_en', name: '병원명(영문)', type: FieldType.TEXT, dataSource: 'hospital.nameEn' },
  { keyPrefix: 'hospital_owner', name: '대표자명', type: FieldType.TEXT, dataSource: 'hospital.owner' },
  { keyPrefix: 'hospital_number', name: '요양기관기호', type: FieldType.NUMBER, dataSource: 'hospital.number' },
  { keyPrefix: 'hospital_address', name: '병원주소', type: FieldType.TEXTAREA, dataSource: 'hospital.address' },
  { keyPrefix: 'hospital_address_en', name: '병원주소(영문)', type: FieldType.TEXTAREA, dataSource: 'hospital.addressEn' },
  { keyPrefix: 'hospital_phone', name: '병원전화번호', type: FieldType.TEXT, dataSource: 'hospital.phone', options: { converter: FieldConverter.PHONE_TO_FORMATTED } },
  { keyPrefix: 'hospital_fax', name: '병원팩스번호', type: FieldType.TEXT, dataSource: 'hospital.fax' },
  { keyPrefix: 'hospital_seal_uuid', name: '병원직인', type: FieldType.STAMP, dataSource: 'hospital.sealUuid' },
  { keyPrefix: 'hospital_director_seal_uuid', name: '병원장직인', type: FieldType.STAMP, dataSource: 'hospital.directorSealUuid' },
];

/**
 * 의사 정보 필드
 */
const DOCTOR_ITEMS: DataItem[] = [
  { keyPrefix: 'doctor_name', name: '의사명', type: FieldType.TEXT, dataSource: 'doctor.name' },
  { keyPrefix: 'doctor_name_en', name: '의사명(영문)', type: FieldType.TEXT, dataSource: 'doctor.nameEn' },
  { keyPrefix: 'doctor_license_no', name: '면허번호', type: FieldType.NUMBER, dataSource: 'doctor.licenseNo' },
  { keyPrefix: 'doctor_seal_uuid', name: '의사직인', type: FieldType.STAMP, dataSource: 'doctor.sealUuid' },
];

/**
 * 문서 정보 필드
 */
const DOCUMENT_ITEMS: DataItem[] = [
  { keyPrefix: 'document_date', name: '날짜', type: FieldType.DATE, dataSource: '' },
  {
    keyPrefix: 'document_date_split',
    name: '날짜 (년/월/일)',
    type: FieldType.TEXT,
    dataSource: '',
    options: { dateSplit: true },
  },
  { keyPrefix: 'issuance_no', name: '발급번호', type: FieldType.TEXT, dataSource: 'document.issuanceNo' },
];

/**
 * 내원 이력 필드
 */
const VISIT_ITEMS: DataItem[] = [
  {
    keyPrefix: 'visit_dates',
    name: '내원일자 목록',
    type: FieldType.TEXTAREA,
    dataSource: '',
    options: { resolver: ValueResolver.VISIT_DATES },
  },
  {
    keyPrefix: 'visit_first_date',
    name: '내원 시작일',
    type: FieldType.DATE,
    dataSource: '',
    options: { resolver: ValueResolver.VISIT_FIRST_DATE },
  },
  {
    keyPrefix: 'visit_last_date',
    name: '내원 종료일',
    type: FieldType.DATE,
    dataSource: '',
    options: { resolver: ValueResolver.VISIT_LAST_DATE },
  },
  {
    keyPrefix: 'visit_date_range',
    name: '내원 기간',
    type: FieldType.DATE,
    dataSource: '',
    options: {
      dateRange: {
        startResolver: ValueResolver.VISIT_FIRST_DATE,
        endResolver: ValueResolver.VISIT_LAST_DATE,
        separator: '~',
      },
    },
  },
  {
    keyPrefix: 'visit_days',
    name: '내원일수',
    type: FieldType.TEXT,
    dataSource: '',
    options: { resolver: ValueResolver.VISIT_DAYS },
  },
  {
    keyPrefix: 'certificate_no',
    name: '건강보험증번호',
    type: FieldType.TEXT,
    dataSource: '',
    options: { resolver: ValueResolver.CERTIFICATE_NO },
  },
  {
    keyPrefix: 'provider_code',
    name: '보험자기호',
    type: FieldType.TEXT,
    dataSource: '',
    options: { resolver: ValueResolver.PROVIDER_CODE },
  },
  {
    keyPrefix: 'provider_name',
    name: '보험자명칭',
    type: FieldType.TEXT,
    dataSource: '',
    options: { resolver: ValueResolver.PROVIDER_NAME },
  },
  {
    keyPrefix: 'insured_person',
    name: '보험자성명',
    type: FieldType.TEXT,
    dataSource: '',
    options: { resolver: ValueResolver.INSURED_PERSON },
  },
];

/**
 * 기타 필드 (자유 입력, 체크박스, 테이블 등)
 */
const OTHER_ITEMS: DataItem[] = [
  {
    keyPrefix: 'free_text',
    name: '프리텍스트',
    type: FieldType.TEXTAREA,
    dataSource: '',
  },
  {
    keyPrefix: 'free_text_single',
    name: '한 줄 텍스트',
    type: FieldType.TEXT,
    dataSource: '',
  },
  {
    keyPrefix: 'checkbox_field',
    name: '체크박스',
    type: FieldType.CHECKBOX,
    dataSource: '',
  },
  {
    keyPrefix: 'diagnosis_table',
    name: '진단 테이블',
    type: FieldType.DIAGNOSIS_TABLE,
    dataSource: '',
  },
];

/**
 * 카테고리별로 묶은 데이터 필드 목록
 */
export const DATA_ITEM_CATEGORIES: DataItemCategory[] = [
  { id: 'patient', label: '환자 정보', items: PATIENT_ITEMS },
  { id: 'hospital', label: '병원 정보', items: HOSPITAL_ITEMS },
  { id: 'doctor', label: '의사 정보', items: DOCTOR_ITEMS },
  { id: 'document', label: '문서 정보', items: DOCUMENT_ITEMS },
  { id: 'visit', label: '내원 이력', items: VISIT_ITEMS },
  { id: 'other', label: '기타', items: OTHER_ITEMS },
];

/**
 * 모든 데이터 아이템을 평탄화한 배열
 */
export const ALL_DATA_ITEMS: DataItem[] = DATA_ITEM_CATEGORIES.flatMap(category => category.items);
