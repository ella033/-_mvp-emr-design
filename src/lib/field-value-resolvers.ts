import type { Encounter } from '@/types/chart/encounter-types';
import type { Patient } from '@/types/patient-types';
import type { components } from '@/generated/api/types';
import {
  formatVisitDates,
  getFirstVisitDate,
  getLastVisitDate,
  getVisitDays,
} from '@/utils/visit-date-formatter';

type FormFieldDto = components['schemas']['FormFieldDto'];

/**
 * 값 해결기 키 enum
 * - 모든 resolver 키는 이 enum에 정의되어야 함
 */
export enum ValueResolver {
  // 내원이력 관련
  VISIT_DATES = 'visit.dates',
  VISIT_FIRST_DATE = 'visit.firstDate',
  VISIT_LAST_DATE = 'visit.lastDate',
  VISIT_DATE_RANGE = 'visit.dateRange',
  VISIT_DAYS = 'visit.days',
  // 보험 관련
  CERTIFICATE_NO = 'encounter.registration.certificateNo',
  PROVIDER_CODE = 'encounter.registration.providerCode',
  PROVIDER_NAME = 'encounter.registration.providerName',
  INSURED_PERSON = 'encounter.registration.insuredPerson',
  // 향후 다른 resolver 추가 시 여기에 추가
}

/**
 * 값 해결기 컨텍스트
 * - 필요한 모든 컨텍스트 정보를 포함
 */
export interface ValueResolverContext {
  appliedEncounters?: Encounter[];
  selectedPatient?: Patient | null;
  // 향후 확장: 다른 컨텍스트 추가 가능
  // selectedForm?: Form;
  // currentDate?: Date;
}

/**
 * 값 해결기 함수 타입
 */
export type ValueResolverFn = (
  field: FormFieldDto,
  context: ValueResolverContext
) => string | null | undefined;

/**
 * 값 해결기 레지스트리
 * - options.resolver의 키를 보고 해당 해결기를 찾음
 */
const valueResolvers: Map<string, ValueResolverFn> = new Map();

/**
 * 값 해결기 등록
 */
export function registerValueResolver(
  resolverKey: string,
  resolver: ValueResolverFn
): void {
  valueResolvers.set(resolverKey, resolver);
}

/**
 * 필드에 대한 값 해결
 */
export function resolveFieldValue(
  field: FormFieldDto,
  context: ValueResolverContext
): string | null | undefined {
  const options = (field.options as Record<string, unknown>) || {};

  // DATE_RANGE 필드: startResolver와 endResolver가 있는 경우
  const dateRangeOptions = options.dateRange as
    | { startResolver?: string; endResolver?: string }
    | undefined;
  if (dateRangeOptions?.startResolver || dateRangeOptions?.endResolver) {
    const startValue = resolveByKey(dateRangeOptions.startResolver, field, context);
    const endValue = resolveByKey(dateRangeOptions.endResolver, field, context);

    // 둘 다 없으면 null
    if (!startValue && !endValue) return null;

    // "startDate|endDate" 형식으로 반환
    return `${startValue || ''}|${endValue || ''}`;
  }

  // options에서 값 해결기 키 찾기
  // 예: options.resolver = 'visit.dates'
  const resolverKey = options.resolver as string | undefined;
  if (!resolverKey) return null;

  const resolver = valueResolvers.get(resolverKey);
  if (!resolver) {
    console.warn(`Unknown value resolver: ${resolverKey}`);
    return null;
  }

  return resolver(field, context);
}

/**
 * 키로 값 해결기 실행
 */
function resolveByKey(
  resolverKey: string | undefined,
  field: FormFieldDto,
  context: ValueResolverContext
): string | null {
  if (!resolverKey) return null;

  const resolver = valueResolvers.get(resolverKey);
  if (!resolver) {
    console.warn(`Unknown value resolver: ${resolverKey}`);
    return null;
  }

  return resolver(field, context) ?? null;
}

// ============================================================================
// Resolver 등록
// ============================================================================
// 모든 resolver는 이 파일에서 관리합니다.
// 새로운 resolver를 추가할 때는 이 섹션에 추가하세요.

// ----------------------------------------------------------------------------
// 내원이력 관련 Resolver
// ----------------------------------------------------------------------------

registerValueResolver(ValueResolver.VISIT_DATES, (_field, context) => {
  if (!context.appliedEncounters || context.appliedEncounters.length === 0) {
    return null;
  }
  return formatVisitDates(context.appliedEncounters);
});

registerValueResolver(ValueResolver.VISIT_FIRST_DATE, (_field, context) => {
  if (!context.appliedEncounters || context.appliedEncounters.length === 0) {
    return null;
  }
  return getFirstVisitDate(context.appliedEncounters);
});

registerValueResolver(ValueResolver.VISIT_LAST_DATE, (_field, context) => {
  if (!context.appliedEncounters || context.appliedEncounters.length === 0) {
    return null;
  }
  return getLastVisitDate(context.appliedEncounters);
});

registerValueResolver(ValueResolver.VISIT_DATE_RANGE, (_field, context) => {
  if (!context.appliedEncounters || context.appliedEncounters.length === 0) {
    return null;
  }
  const firstDate = getFirstVisitDate(context.appliedEncounters);
  const lastDate = getLastVisitDate(context.appliedEncounters);
  if (!firstDate || !lastDate) {
    return null;
  }
  // DATE_RANGE 필드 타입에서 사용하는 형식: "startDate|endDate"
  return `${firstDate}|${lastDate}`;
});

registerValueResolver(ValueResolver.VISIT_DAYS, (_field, context) => {
  if (!context.appliedEncounters || context.appliedEncounters.length === 0) {
    return null;
  }
  return getVisitDays(context.appliedEncounters);
});

// ----------------------------------------------------------------------------
// 보험 관련 Resolver
// ----------------------------------------------------------------------------

registerValueResolver(ValueResolver.CERTIFICATE_NO, (_field, context) => {
  const latestEncounter = getLatestEncounter(context.appliedEncounters);
  return latestEncounter?.registration?.certificateNo ?? null;
});

registerValueResolver(ValueResolver.PROVIDER_CODE, (_field, context) => {
  const latestEncounter = getLatestEncounter(context.appliedEncounters);
  return latestEncounter?.registration?.providerCode ?? null;
});

registerValueResolver(ValueResolver.PROVIDER_NAME, (_field, context) => {
  const latestEncounter = getLatestEncounter(context.appliedEncounters);
  return latestEncounter?.registration?.providerName ?? null;
});

registerValueResolver(ValueResolver.INSURED_PERSON, (_field, context) => {
  const latestEncounter = getLatestEncounter(context.appliedEncounters);
  return latestEncounter?.registration?.insuredPerson ?? null;
});

// ----------------------------------------------------------------------------
// 헬퍼 함수
// ----------------------------------------------------------------------------

/**
 * 최신 내원이력 찾기 (startDateTime 기준 내림차순 정렬 후 첫 번째)
 */
function getLatestEncounter(
  encounters: Encounter[] | undefined
): Encounter | undefined {
  if (!encounters || encounters.length === 0) {
    return undefined;
  }

  const sortedEncounters = [...encounters].sort((a, b) => {
    const dateA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
    const dateB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
    return dateB - dateA; // 내림차순 (최신순)
  });

  return sortedEncounters[0];
}

// ----------------------------------------------------------------------------
// 향후 다른 Resolver 추가 예시
// ----------------------------------------------------------------------------
// registerValueResolver('prescription.summary', (field, context) => {
//   // 처방 내역 요약 생성 로직
//   return '처방 요약';
// });
//
// registerValueResolver('diagnosis.list', (field, context) => {
//   // 진단 목록 생성 로직
//   return '진단 목록';
// });
