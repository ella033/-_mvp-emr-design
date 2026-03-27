import type { AddedField, FieldDefaultValue, FieldFontWeight, FieldTextAlign } from '@/types/document';
import { FieldType } from '@/types/document';
import type { components } from '@/generated/api/types';

type FormFieldDto = components['schemas']['FormFieldDto'];

/**
 * defaultValue가 유효한 FieldDefaultValue인지 검증
 */
export function validateDefaultValue(value: unknown): FieldDefaultValue | undefined {
  if (typeof value !== 'string') return undefined;
  const validValues: FieldDefaultValue[] = ['{{today}}', '{{now}}'];
  return validValues.includes(value as FieldDefaultValue) ? (value as FieldDefaultValue) : undefined;
}

/**
 * AddedField[]를 서버 FormFieldDto[]로 변환
 */
export function convertAddedFieldsToFormFields(fields: AddedField[], fieldIdMap: Map<string, number>): FormFieldDto[] {
  return fields.map((field) => {
    const fieldId = fieldIdMap.get(field.key) ?? 0; // 새 필드는 id가 0
    const fontWeight: FormFieldDto['fontWeight'] = field.fontWeight === 'bold' ? 'bold' : 'normal';
    const textAlign: FormFieldDto['textAlign'] =
      field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'right' : 'left';

    // dataSource는 string이지만 FormFieldDto에서는 Record<string, never> | null로 정의됨
    // 실제 API에서는 string을 받으므로 타입 단언 사용
    const dataSource = field.dataSource
      ? (field.dataSource as unknown as FormFieldDto['dataSource'])
      : (null as FormFieldDto['dataSource']);

    // options는 object이지만 FormFieldDto에서는 Record<string, never> | null로 정의됨
    const options = field.options ? (field.options as unknown as FormFieldDto['options']) : (null as FormFieldDto['options']);

    // defaultValue는 string이지만 FormFieldDto에서는 Record<string, never> | null로 정의됨
    const defaultValue = field.defaultValue
      ? (field.defaultValue as unknown as FormFieldDto['defaultValue'])
      : (null as FormFieldDto['defaultValue']);

    return {
      id: fieldId,
      key: field.key,
      name: field.name,
      type: field.type,
      pageNumber: field.pageNumber,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      fontSize: field.fontSize,
      fontWeight,
      textAlign,
      order: field.order,
      dataSource,
      options,
      defaultValue,
    };
  });
}

/**
 * 서버 FormFieldDto[]를 AddedField[]로 변환
 */
export function convertFormFieldsToAddedFields(fields: FormFieldDto[]): AddedField[] {
  return fields.map((field) => {
    const fontWeight: FieldFontWeight = field.fontWeight === 'bold' ? 'bold' : 'normal';
    const textAlign: FieldTextAlign = field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'right' : 'left';
    const dataSource = field.dataSource ? (typeof field.dataSource === 'string' ? field.dataSource : '') : '';
    const options = field.options && typeof field.options === 'object' ? (field.options as Record<string, unknown>) : {};
    const defaultValue = validateDefaultValue(field.defaultValue);

    return {
      key: field.key,
      name: field.name,
      type: field.type as FieldType,
      pageNumber: field.pageNumber,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      fontSize: field.fontSize,
      fontWeight,
      textAlign,
      order: field.order,
      dataSource,
      options,
      defaultValue,
    };
  });
}

