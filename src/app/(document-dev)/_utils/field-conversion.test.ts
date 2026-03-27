import { describe, it, expect } from 'vitest';
import { validateDefaultValue, convertAddedFieldsToFormFields, convertFormFieldsToAddedFields } from './field-conversion';
import { FieldType } from '@/types/document';
import type { AddedField } from '@/types/document';
import type { components } from '@/generated/api/types';

type FormFieldDto = components['schemas']['FormFieldDto'];

// ---------------------------------------------------------------------------
// validateDefaultValue
// ---------------------------------------------------------------------------
describe('validateDefaultValue', () => {
  it('returns "{{today}}" for valid today token', () => {
    expect(validateDefaultValue('{{today}}')).toBe('{{today}}');
  });

  it('returns "{{now}}" for valid now token', () => {
    expect(validateDefaultValue('{{now}}')).toBe('{{now}}');
  });

  it('returns undefined for an unrecognised string', () => {
    expect(validateDefaultValue('{{yesterday}}')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(validateDefaultValue('')).toBeUndefined();
  });

  it('returns undefined for non-string values', () => {
    expect(validateDefaultValue(123)).toBeUndefined();
    expect(validateDefaultValue(null)).toBeUndefined();
    expect(validateDefaultValue(undefined)).toBeUndefined();
    expect(validateDefaultValue(true)).toBeUndefined();
    expect(validateDefaultValue({})).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeAddedField(overrides: Partial<AddedField> = {}): AddedField {
  return {
    key: 'field_001',
    name: 'Test Field',
    type: FieldType.TEXT,
    pageNumber: 1,
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'left',
    order: 0,
    dataSource: '',
    ...overrides,
  };
}

function makeFormFieldDto(overrides: Partial<FormFieldDto> = {}): FormFieldDto {
  return {
    id: 1,
    key: 'field_001',
    name: 'Test Field',
    type: FieldType.TEXT,
    pageNumber: 1,
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'left',
    order: 0,
    dataSource: null as FormFieldDto['dataSource'],
    options: null as FormFieldDto['options'],
    defaultValue: null as FormFieldDto['defaultValue'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// convertAddedFieldsToFormFields
// ---------------------------------------------------------------------------
describe('convertAddedFieldsToFormFields', () => {
  it('converts a basic AddedField to FormFieldDto', () => {
    const field = makeAddedField();
    const fieldIdMap = new Map<string, number>([['field_001', 42]]);

    const [result] = convertAddedFieldsToFormFields([field], fieldIdMap);

    expect(result.id).toBe(42);
    expect(result.key).toBe('field_001');
    expect(result.name).toBe('Test Field');
    expect(result.type).toBe(FieldType.TEXT);
    expect(result.pageNumber).toBe(1);
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
    expect(result.width).toBe(100);
    expect(result.height).toBe(30);
    expect(result.fontSize).toBe(12);
    expect(result.fontWeight).toBe('normal');
    expect(result.textAlign).toBe('left');
    expect(result.order).toBe(0);
  });

  it('defaults id to 0 when key is not in fieldIdMap', () => {
    const field = makeAddedField({ key: 'new_field' });
    const fieldIdMap = new Map<string, number>();

    const [result] = convertAddedFieldsToFormFields([field], fieldIdMap);
    expect(result.id).toBe(0);
  });

  it('maps fontWeight "bold" correctly', () => {
    const field = makeAddedField({ fontWeight: 'bold' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.fontWeight).toBe('bold');
  });

  it('maps fontWeight "normal" for non-bold values', () => {
    const field = makeAddedField({ fontWeight: 'normal' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.fontWeight).toBe('normal');
  });

  it('maps textAlign "center" correctly', () => {
    const field = makeAddedField({ textAlign: 'center' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.textAlign).toBe('center');
  });

  it('maps textAlign "right" correctly', () => {
    const field = makeAddedField({ textAlign: 'right' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.textAlign).toBe('right');
  });

  it('defaults textAlign to "left" for unknown values', () => {
    const field = makeAddedField({ textAlign: 'left' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.textAlign).toBe('left');
  });

  it('passes dataSource through as type-cast value when present', () => {
    const field = makeAddedField({ dataSource: 'patient.name' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.dataSource).toBe('patient.name');
  });

  it('sets dataSource to null when empty string', () => {
    const field = makeAddedField({ dataSource: '' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.dataSource).toBeNull();
  });

  it('passes options through when present', () => {
    const options = { placeholder: 'Enter name' };
    const field = makeAddedField({ options });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.options).toBe(options);
  });

  it('sets options to null when undefined', () => {
    const field = makeAddedField({ options: undefined });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.options).toBeNull();
  });

  it('passes defaultValue through when present', () => {
    const field = makeAddedField({ defaultValue: '{{today}}' });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.defaultValue).toBe('{{today}}');
  });

  it('sets defaultValue to null when undefined', () => {
    const field = makeAddedField({ defaultValue: undefined });
    const [result] = convertAddedFieldsToFormFields([field], new Map());
    expect(result.defaultValue).toBeNull();
  });

  it('converts multiple fields preserving order', () => {
    const fields = [
      makeAddedField({ key: 'a', order: 0 }),
      makeAddedField({ key: 'b', order: 1 }),
      makeAddedField({ key: 'c', order: 2 }),
    ];
    const fieldIdMap = new Map([
      ['a', 10],
      ['b', 20],
      ['c', 30],
    ]);

    const results = convertAddedFieldsToFormFields(fields, fieldIdMap);
    expect(results).toHaveLength(3);
    expect(results[0].id).toBe(10);
    expect(results[1].id).toBe(20);
    expect(results[2].id).toBe(30);
  });

  it('returns empty array for empty input', () => {
    expect(convertAddedFieldsToFormFields([], new Map())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// convertFormFieldsToAddedFields
// ---------------------------------------------------------------------------
describe('convertFormFieldsToAddedFields', () => {
  it('converts a basic FormFieldDto to AddedField', () => {
    const dto = makeFormFieldDto();
    const [result] = convertFormFieldsToAddedFields([dto]);

    expect(result.key).toBe('field_001');
    expect(result.name).toBe('Test Field');
    expect(result.type).toBe(FieldType.TEXT);
    expect(result.pageNumber).toBe(1);
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
    expect(result.width).toBe(100);
    expect(result.height).toBe(30);
    expect(result.fontSize).toBe(12);
    expect(result.fontWeight).toBe('normal');
    expect(result.textAlign).toBe('left');
    expect(result.order).toBe(0);
  });

  it('maps fontWeight "bold" correctly', () => {
    const dto = makeFormFieldDto({ fontWeight: 'bold' });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.fontWeight).toBe('bold');
  });

  it('defaults fontWeight to "normal" for non-bold values', () => {
    const dto = makeFormFieldDto({ fontWeight: 'normal' });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.fontWeight).toBe('normal');
  });

  it('maps textAlign "center" correctly', () => {
    const dto = makeFormFieldDto({ textAlign: 'center' });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.textAlign).toBe('center');
  });

  it('maps textAlign "right" correctly', () => {
    const dto = makeFormFieldDto({ textAlign: 'right' });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.textAlign).toBe('right');
  });

  it('defaults textAlign to "left" for other values', () => {
    const dto = makeFormFieldDto({ textAlign: 'left' });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.textAlign).toBe('left');
  });

  it('extracts string dataSource', () => {
    const dto = makeFormFieldDto({
      dataSource: 'patient.name' as unknown as FormFieldDto['dataSource'],
    });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.dataSource).toBe('patient.name');
  });

  it('defaults dataSource to empty string when null', () => {
    const dto = makeFormFieldDto({ dataSource: null as FormFieldDto['dataSource'] });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.dataSource).toBe('');
  });

  it('defaults dataSource to empty string when non-string object', () => {
    const dto = makeFormFieldDto({
      dataSource: { something: 'value' } as unknown as FormFieldDto['dataSource'],
    });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.dataSource).toBe('');
  });

  it('extracts object options as Record<string, unknown>', () => {
    const opts = { placeholder: 'Hello' } as unknown as FormFieldDto['options'];
    const dto = makeFormFieldDto({ options: opts });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.options).toEqual({ placeholder: 'Hello' });
  });

  it('defaults options to empty object when null', () => {
    const dto = makeFormFieldDto({ options: null as FormFieldDto['options'] });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.options).toEqual({});
  });

  it('defaults options to empty object when non-object', () => {
    const dto = makeFormFieldDto({
      options: 'string-options' as unknown as FormFieldDto['options'],
    });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.options).toEqual({});
  });

  it('validates defaultValue using validateDefaultValue', () => {
    const dto = makeFormFieldDto({
      defaultValue: '{{today}}' as unknown as FormFieldDto['defaultValue'],
    });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.defaultValue).toBe('{{today}}');
  });

  it('sets defaultValue to undefined for invalid value', () => {
    const dto = makeFormFieldDto({
      defaultValue: 'invalid' as unknown as FormFieldDto['defaultValue'],
    });
    const [result] = convertFormFieldsToAddedFields([dto]);
    expect(result.defaultValue).toBeUndefined();
  });

  it('converts multiple fields', () => {
    const fields = [
      makeFormFieldDto({ key: 'a', order: 0 }),
      makeFormFieldDto({ key: 'b', order: 1 }),
    ];
    const results = convertFormFieldsToAddedFields(fields);
    expect(results).toHaveLength(2);
    expect(results[0].key).toBe('a');
    expect(results[1].key).toBe('b');
  });

  it('returns empty array for empty input', () => {
    expect(convertFormFieldsToAddedFields([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Round-trip conversion
// ---------------------------------------------------------------------------
describe('round-trip conversion', () => {
  it('preserves core data through AddedField → FormFieldDto → AddedField', () => {
    const original = makeAddedField({
      key: 'round_trip',
      name: 'Round Trip',
      type: FieldType.NUMBER,
      fontWeight: 'bold',
      textAlign: 'center',
      dataSource: 'patient.age',
      defaultValue: '{{now}}',
      options: { placeholder: 'Enter age' },
    });

    const fieldIdMap = new Map([['round_trip', 7]]);
    const [dto] = convertAddedFieldsToFormFields([original], fieldIdMap);
    const [roundTripped] = convertFormFieldsToAddedFields([dto]);

    expect(roundTripped.key).toBe(original.key);
    expect(roundTripped.name).toBe(original.name);
    expect(roundTripped.type).toBe(original.type);
    expect(roundTripped.fontWeight).toBe(original.fontWeight);
    expect(roundTripped.textAlign).toBe(original.textAlign);
    expect(roundTripped.dataSource).toBe(original.dataSource);
    expect(roundTripped.defaultValue).toBe(original.defaultValue);
    expect(roundTripped.x).toBe(original.x);
    expect(roundTripped.y).toBe(original.y);
    expect(roundTripped.width).toBe(original.width);
    expect(roundTripped.height).toBe(original.height);
    expect(roundTripped.fontSize).toBe(original.fontSize);
    expect(roundTripped.pageNumber).toBe(original.pageNumber);
    expect(roundTripped.order).toBe(original.order);
  });
});
