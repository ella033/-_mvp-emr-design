import type { components } from '@/generated/api/types';
import { applyConverter } from '@/lib/field-converters';
import { FieldConverter } from '@/types/document';

type FormFieldDto = components['schemas']['FormFieldDto'];

export function buildRhfDefaultsFromFields(fields: FormFieldDto[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const rawDefaultValue = (field as any).defaultValue as unknown;
    const converter = (field as any).options?.converter as FieldConverter | undefined;

    let resolved: unknown = resolveFieldDefaultValue(rawDefaultValue, field);

    // options.converter가 있으면 컨버터 적용
    if (resolved !== '' && resolved !== undefined && converter) {
      resolved = applyConverter(resolved, converter);
    }

    if (resolved !== '' && resolved !== undefined) {
      acc[field.key] = resolved;
    }
    return acc;
  }, {});
}

function resolveFieldDefaultValue(raw: unknown, field: FormFieldDto): string {
  const token = extractDefaultToken(raw);
  const dateSplitMeta = extractDateSplitMeta(field.options);

  // dateSplit 필드이고 날짜 형식 문자열인 경우 해당 part만 추출
  if (dateSplitMeta && token && isDateString(token)) {
    return parseDateStringPart(token, dateSplitMeta.part);
  }

  // 최소 지원 토큰: {{today}}
  if (token === '{{today}}' || token === '{{now}}') {
    const now = new Date();
    if (dateSplitMeta) {
      return formatDateSplitPart(now, dateSplitMeta.part);
    }
    if (field.type === 4 && token === '{{now}}') return formatDateTimeLocal(now); // DATETIME
    return formatDateOnly(now); // DATE/TEXT 등
  }

  if (typeof token === 'string') return token;
  return '';
}

/**
 * 날짜 문자열 형식인지 확인 (YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD)
 */
function isDateString(value: string): boolean {
  return /^\d{4}[-./]\d{2}[-./]\d{2}$/.test(value);
}

/**
 * 날짜 문자열에서 해당 part(년/월/일)만 추출
 */
function parseDateStringPart(dateStr: string, part: DateSplitPart): string {
  const parts = dateStr.split(/[-./]/);
  if (parts.length !== 3) return '';
  if (part === 'year') return parts[0];
  if (part === 'month') return parts[1];
  return parts[2]; // day
}

function extractDefaultToken(raw: unknown): string | null {
  if (typeof raw === 'string') return raw;
  if (!raw || typeof raw !== 'object') return null;

  // 서버가 다양한 형태로 내려줄 수 있어 방어적으로 처리
  const template = (raw as any).template;
  if (typeof template === 'string') return template;

  const value = (raw as any).value;
  if (typeof value === 'string') return value;

  return null;
}

type DateSplitPart = 'year' | 'month' | 'day';
type DateSplitMeta = { groupId: string; part: DateSplitPart };

function extractDateSplitMeta(options: FormFieldDto['options']): DateSplitMeta | null {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return null;
  const dateSplit = (optionsObj as any).dateSplit as DateSplitMeta | undefined;
  if (!dateSplit || typeof dateSplit !== 'object') return null;
  if (typeof dateSplit.groupId !== 'string') return null;
  if (dateSplit.part !== 'year' && dateSplit.part !== 'month' && dateSplit.part !== 'day') return null;
  return { groupId: dateSplit.groupId, part: dateSplit.part };
}

function formatDateSplitPart(date: Date, part: DateSplitPart): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (part === 'year') return year;
  if (part === 'month') return month;
  return day;
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTimeLocal(date: Date): string {
  const ymd = formatDateOnly(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${ymd}T${hh}:${mm}`;
}
