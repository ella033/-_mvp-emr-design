import type { components } from '@/generated/api/types';
import { ValueResolver } from '@/lib/field-value-resolvers';
import { FieldType } from '@/types/document';
import { formatDate, formatDateTime } from '@/utils/date-formatter';

type FormFieldDto = components['schemas']['FormFieldDto'];

export function buildPreviewDefaultsFromFields(fields: FormFieldDto[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  // radioGroup별로 첫 번째 체크박스를 기본 선택
  const firstCheckboxByRadioGroup = new Map<string, string>();
  fields.forEach((field) => {
    if (field.type !== FieldType.CHECKBOX) return;
    const radioGroup = extractRadioGroup(field.options);
    if (!radioGroup) return;
    if (!firstCheckboxByRadioGroup.has(radioGroup)) {
      firstCheckboxByRadioGroup.set(radioGroup, field.key);
    }
  });

  // radioGroup 키 값 세팅
  firstCheckboxByRadioGroup.forEach((firstFieldKey, groupName) => {
    defaults[`radioGroup_${groupName}`] = firstFieldKey;
  });

  fields.forEach((field) => {
    // 라디오 그룹은 radioGroup_${name}로 값이 들어가므로, 개별 checkbox key는 기본값 불필요
    const hasRadioGroup = field.type === FieldType.CHECKBOX && Boolean(extractRadioGroup(field.options));
    if (hasRadioGroup) return;

    const previewValue = getPreviewValue(field);
    if (previewValue !== undefined) {
      defaults[field.key] = previewValue;
    }
  });

  return defaults;
}

function getPreviewValue(field: FormFieldDto): unknown {
  // checkbox는 기본으로 체크되게 처리(라디오 그룹은 상단에서 처리)
  if (field.type === FieldType.CHECKBOX) return true;

  // options.resolver별 하드코딩 기본값 처리
  const resolver = extractResolver(field.options);
  if (resolver) {
    switch (resolver) {
      case ValueResolver.VISIT_DATES:
        return '<2025년>1월1일, 2일, 3일';
      case ValueResolver.VISIT_FIRST_DATE:
        return '2023-01-01';
      case ValueResolver.VISIT_LAST_DATE:
        return '2023-01-03';
      case ValueResolver.VISIT_DAYS:
        return '3일';
      case ValueResolver.CERTIFICATE_NO:
        return '30123456789';
      case ValueResolver.PROVIDER_CODE:
        return '12345678';
      case ValueResolver.PROVIDER_NAME:
        return '국민건강보험공단';
      case ValueResolver.INSURED_PERSON:
        return '홍길동';
      default:
        return '';
    }
  }

  // 기간 필드는 "startDate|endDate" 형식으로 저장 (DATE 타입 + dateRange 옵션)
  // ※ 일반 DATE 체크보다 먼저 확인해야 함
  const hasDateRangeOption = field.type === FieldType.DATE && Boolean(extractDateRangeOption(field.options));
  if (hasDateRangeOption) {
    // 미리보기용: 오늘 기준 1주일 전 ~ 오늘
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const startDate = formatDate(oneWeekAgo, 'YYYY-MM-DD');
    const endDate = formatDate(today, 'YYYY-MM-DD');
    return `${startDate}|${endDate}`;
  }

  // 날짜 타입은 type을 보고 처리
  if (field.type === FieldType.DATE) {
    const today = new Date();
    const dateFormat = extractDateFormat(field.options);
    return formatDate(today, dateFormat);
  }
  if (field.type === FieldType.DATETIME) {
    const now = new Date();
    const dateFormat = extractDateFormat(field.options);
    return formatDateTime(now, dateFormat);
  }

  // STAMP는 실제 다운로드를 시도할 수 있어 기본값을 넣지 않음(미리보기에서는 placeholder로 표현)
  if (field.type === FieldType.STAMP) {
    return undefined;
  }

  const source = extractDataSource(field.dataSource);

  // patient 관련
  if (source === 'patient.patientNo') return '123';
  if (source === 'patient.name') return '홍길동';
  if (source === 'patient.gender') return '남';
  if (source === 'patient.age') return '34';
  if (source === 'patient.birthDate') return '1990-01-01';
  if (source === 'patient.address') return '서울특별시 강남구 테헤란로 123';
  if (source === 'patient.rrn') return '900101-1234567';
  if (source === 'patient.rrnView') return '900101-1******';
  if (source === 'patient.phone1') return '010-1234-5678';

  // document 관련
  if (source === 'document.issuanceNo') return '0001';
  if (source === 'document.freeText') return '소견서 내용 예시 텍스트입니다.';

  // hospital 관련
  if (source === 'hospital.name') return '의사랑의원';
  if (source === 'hospital.nameEn') return 'Euirang Clinic';
  if (source === 'hospital.owner') return '홍길동';
  if (source === 'hospital.number') return '12345678';
  if (source === 'hospital.address') return '서울특별시 강남구 테헤란로 456';
  if (source === 'hospital.addressEn') return '456 Teheran-ro, Gangnam-gu, Seoul';
  if (source === 'hospital.address1En') return '456 Teheran-ro';
  if (source === 'hospital.address2En') return 'Gangnam-gu, Seoul';
  if (source === 'hospital.phone') return '02-1234-5678';
  if (source === 'hospital.fax') return '02-1234-5679';
  if (source === 'hospital.sealUuid') return '[직인]';
  if (source === 'hospital.directorSealUuid') return '[병원장직인]';

  // doctor 관련
  if (source === 'doctor.name') return '김현호';
  if (source === 'doctor.nameEn') return 'Hyeonho Kim';
  if (source === 'doctor.licenseNo') return '110479';
  if (source === 'doctor.licenseNumber') return '110479';

  // 총점 필드 처리 (NUMBER 타입 + scoreGroup 옵션)
  const hasScoreGroup = field.type === FieldType.NUMBER && Boolean(extractScoreGroup(field.options));
  if (hasScoreGroup) {
    return '10';
  }

  // fallback: placeholder → name
  const placeholder = extractPlaceholder(field.options);
  return placeholder || field.name || '';
}

function extractDataSource(dataSource: FormFieldDto['dataSource']): string {
  if (typeof dataSource === 'string') return dataSource;
  return '';
}

function extractPlaceholder(options: FormFieldDto['options']): string {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return '';
  const placeholder = (optionsObj as any).placeholder;
  return typeof placeholder === 'string' ? placeholder : '';
}

function extractRadioGroup(options: FormFieldDto['options']): string | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const radioGroup = (optionsObj as any).radioGroup;
  return typeof radioGroup === 'string' ? radioGroup : undefined;
}

function extractResolver(options: FormFieldDto['options']): string | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const resolver = (optionsObj as any).resolver;
  return typeof resolver === 'string' ? resolver : undefined;
}

function extractDateFormat(options: FormFieldDto['options']): string | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const dateFormat = (optionsObj as any).dateFormat;
  return typeof dateFormat === 'string' ? dateFormat : undefined;
}

function extractScoreGroup(options: FormFieldDto['options']): string | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const scoreGroup = (optionsObj as any).scoreGroup;
  return typeof scoreGroup === 'string' ? scoreGroup : undefined;
}

function extractDateRangeOption(options: FormFieldDto['options']): unknown {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const dateRange = (optionsObj as any).dateRange;
  return dateRange && typeof dateRange === 'object' ? dateRange : undefined;
}
