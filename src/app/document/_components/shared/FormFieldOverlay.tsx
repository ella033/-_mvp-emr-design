'use client';

import { useEffect, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import DOMPurify from 'dompurify';

import type { Encounter } from '@/types/chart/encounter-types';
import { CheckboxLabelFormat, FieldType } from '@/types/document';
import type { components } from '@/generated/api/types';
import { formatDate, formatDateTime } from '@/utils/date-formatter';
import { useFileObjectUrl } from '@/hooks/file/use-file-object-url';
import { LimitedTextarea } from '../LimitedTextarea';

type FormFieldDto = components['schemas']['FormFieldDto'];

export type OverlayLastFocusedFieldRef = React.MutableRefObject<{
  fieldKey: string;
  element: HTMLElement | null;
  timestamp: number;
} | null>;

export function FormFieldOverlay(props: {
  width: number;
  height: number;
  fields: FormFieldDto[];
  allFields: FormFieldDto[];
  isEditMode: boolean;
  appliedEncounters?: Encounter[];
  lastFocusedFieldRef?: OverlayLastFocusedFieldRef;
  stampPlaceholder?: string;
  getImageFallbackSrcAction?: (field: FormFieldDto) => string | undefined;
  preferFallbackImage?: boolean;
}) {
  const {
    width,
    height,
    fields,
    allFields,
    isEditMode,
    appliedEncounters = [],
    lastFocusedFieldRef,
    stampPlaceholder,
    getImageFallbackSrcAction,
    preferFallbackImage = false,
  } = props;

  const { watch, setValue } = useFormContext<Record<string, unknown>>();

  // 포커스 추적 이벤트 리스너 등록
  useEffect(function trackFieldFocus() {
    if (!isEditMode) return;

    function handleFocus(e: FocusEvent) {
      const ref = lastFocusedFieldRef;
      if (!ref) return;
      const target = e.target as HTMLElement;
      const fieldKey = target.getAttribute('data-field-key');
      if (fieldKey) {
        ref.current = {
          fieldKey,
          element: target,
          timestamp: Date.now(),
        };
      }
    }

    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, [isEditMode, lastFocusedFieldRef]);

  // scoreGroup별 총점 계산 함수
  const calculateScoreGroupTotal = useCallback(
    (scoreGroup: string, formValues: Record<string, unknown>): number => {
      // 모든 페이지의 필드에서 같은 scoreGroup을 가진 체크박스 찾기
      const groupCheckboxes = allFields.filter(
        (f) => f.type === FieldType.CHECKBOX && extractScoreGroup(f.options) === scoreGroup
      );

      return groupCheckboxes.reduce((total, field) => {
        const radioGroup = extractRadioGroup(field.options);
        let isChecked = false;

        if (radioGroup) {
          // 라디오 체크박스: radioGroup_${radioGroup} 값이 현재 필드 key와 같으면 체크됨
          const groupValue = formValues[`radioGroup_${radioGroup}`] as string | undefined;
          isChecked = groupValue === field.key;
        } else {
          // 일반 체크박스: fieldKey 값이 true면 체크됨
          isChecked = formValues[field.key] === true;
        }

        const score = extractScore(field.options) ?? 0;
        return total + (isChecked ? score : 0);
      }, 0);
    },
    [allFields]
  );

  // 체크박스 변경 감지 및 총점 자동 업데이트
  useEffect(function updateScoresOnCheckboxChange() {
    if (!isEditMode) return;

    const subscription = watch((formValues, { name }) => {
      if (!name) return;

      // 라디오 그룹 필드 변경 감지 (radioGroup_${groupName} 형태)
      if (name.startsWith('radioGroup_')) {
        const radioGroupName = name.replace('radioGroup_', '');
        // 해당 라디오 그룹에 속한 체크박스 중 scoreGroup이 있는 것 찾기
        const radioCheckboxes = allFields.filter(
          (f) =>
            f.type === FieldType.CHECKBOX &&
            extractRadioGroup(f.options) === radioGroupName &&
            extractScoreGroup(f.options)
        );

        // 각 체크박스의 scoreGroup별로 총점 업데이트
        const affectedScoreGroups = new Set<string>();
        radioCheckboxes.forEach((field) => {
          const scoreGroup = extractScoreGroup(field.options);
          if (scoreGroup) {
            affectedScoreGroups.add(scoreGroup);
          }
        });

        affectedScoreGroups.forEach((scoreGroup) => {
          const totalField = allFields.find(
            (f) => f.type === FieldType.NUMBER && extractScoreGroup(f.options) === scoreGroup
          );

          if (totalField) {
            const formValuesObj = formValues as Record<string, unknown>;
            const total = calculateScoreGroupTotal(scoreGroup, formValuesObj);
            const currentTotal = formValuesObj[totalField.key];

            if (currentTotal !== total) {
              setValue(totalField.key, total, { shouldDirty: false });
            }
          }
        });
        return;
      }

      // 일반 체크박스 필드 변경 감지
      const changedField = allFields.find((f) => f.key === name);
      if (!changedField || changedField.type !== FieldType.CHECKBOX) return;

      const scoreGroup = extractScoreGroup(changedField.options);
      if (!scoreGroup) return;

      // 해당 scoreGroup의 총점만 업데이트
      const totalField = allFields.find(
        (f) => f.type === FieldType.NUMBER && extractScoreGroup(f.options) === scoreGroup
      );

      if (totalField) {
        const formValuesObj = formValues as Record<string, unknown>;
        const total = calculateScoreGroupTotal(scoreGroup, formValuesObj);
        const currentTotal = formValuesObj[totalField.key];

        // 값이 실제로 변경된 경우에만 업데이트
        if (currentTotal !== total) {
          setValue(totalField.key, total, { shouldDirty: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isEditMode, allFields, calculateScoreGroupTotal, setValue]);

  // 초기 총점 계산 (발급본 로드 시 이미 값이 있으면 스킵)
  useEffect(function calculateInitialScores() {
    if (!isEditMode) return;

    const formValues = watch();

    // 모든 scoreGroup의 총점 계산
    const scoreGroups = new Set<string>();
    allFields.forEach((field) => {
      if (field.type === FieldType.CHECKBOX) {
        const scoreGroup = extractScoreGroup(field.options);
        if (scoreGroup) {
          scoreGroups.add(scoreGroup);
        }
      }
    });

    scoreGroups.forEach((scoreGroup) => {
      const totalField = allFields.find(
        (f) => f.type === FieldType.NUMBER && extractScoreGroup(f.options) === scoreGroup
      );

      if (totalField) {
        const formValuesObj = formValues as Record<string, unknown>;
        const calculatedTotal = calculateScoreGroupTotal(scoreGroup, formValuesObj);
        const currentTotal = formValuesObj[totalField.key];

        // 현재 값이 없거나 계산된 값과 다른 경우에만 업데이트
        if (currentTotal === undefined || currentTotal === null || currentTotal !== calculatedTotal) {
          setValue(totalField.key, calculatedTotal, { shouldDirty: false });
        }
      }
    });
  }, [isEditMode, allFields, calculateScoreGroupTotal, watch, setValue]);

  // appliedEncounters 변경 시 진단 테이블 필드 자동 업데이트
  useEffect(function syncDiagnosisTableWithEncounters() {
    if (!isEditMode) return;
    if (appliedEncounters.length === 0) return;
    const hasDiagnosisTable = allFields.some((field) => (field.type as number) === FieldType.DIAGNOSIS_TABLE);
    if (!hasDiagnosisTable) return;

    // 모든 내원이력에서 진단 정보 추출
    const allDiagnoses: Array<{ name: string; code: string }> = [];
    appliedEncounters.forEach((encounter) => {
      if (encounter.diseases && Array.isArray(encounter.diseases)) {
        encounter.diseases.forEach((disease) => {
          if (disease.name && disease.code) {
            allDiagnoses.push({
              name: disease.name,
              code: disease.code,
            });
          }
        });
      }
    });

    // 중복 제거 (같은 code를 가진 진단은 하나만)
    const uniqueDiagnosesMap = new Map<string, { name: string; code: string }>();
    allDiagnoses.forEach((diagnosis) => {
      if (!uniqueDiagnosesMap.has(diagnosis.code)) {
        uniqueDiagnosesMap.set(diagnosis.code, diagnosis);
      }
    });
    const uniqueDiagnoses = Array.from(uniqueDiagnosesMap.values());

    // 모든 DIAGNOSIS_TABLE 타입 필드 찾아서 폼 값 업데이트
    allFields.forEach((field) => {
      // FIXME: API 스키마에 DIAGNOSIS_TABLE 타입 추가 후 타입 캐스팅 제거
      if ((field.type as number) === FieldType.DIAGNOSIS_TABLE) {
        setValue(field.key, uniqueDiagnoses, { shouldDirty: false });
      }
    });
  }, [isEditMode, appliedEncounters, allFields, setValue]);

  // 서식 영역 내 input이 아닌 영역 클릭 시 마지막 포커스 초기화
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    const ref = lastFocusedFieldRef;
    if (!ref) return;

    const target = e.target as HTMLElement;

    // 클릭된 요소가 input/textarea인지 확인
    const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    // 클릭된 요소가 input/textarea의 자식인지 확인 (input을 감싸는 div 등)
    const isInputChild = target.closest('input, textarea') !== null;

    // input/textarea가 아니고, input의 자식도 아니면 마지막 포커스 초기화
    if (!isInputElement && !isInputChild) {
      // 약간의 지연을 두어 focusin 이벤트가 먼저 처리되도록 함
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        const activeFieldKey = activeElement?.getAttribute('data-field-key');

        // 현재 포커스가 input이 아니면 마지막 포커스 초기화
        if (!activeFieldKey) {
          ref.current = null;
        }
      }, 0);
    }
  };

  return (
    <div className="absolute top-0 left-0 z-2" style={{ width, height }} onMouseDown={handleOverlayMouseDown}>
      {fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          allFields={allFields}
          isEditMode={isEditMode}
          stampPlaceholder={stampPlaceholder}
          getImageFallbackSrcAction={getImageFallbackSrcAction}
          preferFallbackImage={preferFallbackImage}
        />
      ))}
    </div>
  );
}

/**
 * 개별 필드 렌더러.
 * 각 필드가 독립적으로 useFormContext().watch()를 호출하여
 * 다른 필드 값 변경 시 불필요한 리렌더를 방지합니다.
 */
function FieldRenderer(props: {
  field: FormFieldDto;
  allFields: FormFieldDto[];
  isEditMode: boolean;
  stampPlaceholder?: string;
  getImageFallbackSrcAction?: (field: FormFieldDto) => string | undefined;
  preferFallbackImage: boolean;
}) {
  const {
    field,
    allFields,
    isEditMode,
    stampPlaceholder,
    getImageFallbackSrcAction,
    preferFallbackImage,
  } = props;
  const { register, watch, control } = useFormContext<Record<string, unknown>>();

  const fieldKey = field.key;
  const rawValue = watch(fieldKey);
  const displayValue = formatFieldValue(rawValue, field);
  const placeholder = extractPlaceholder(field.options);
  const verticalCenter = field.type === FieldType.TEXTAREA && extractVerticalCenter(field.options);

  // 편집 모드에서 발급번호 필드는 눈에만 안 보이게 처리 (formData에는 포함됨)
  const fieldDataSource = field.dataSource as string | null | undefined;
  const isIssuanceNoField = fieldDataSource === 'document.issuanceNo';
  const shouldHideInEditMode = isEditMode && isIssuanceNoField;

  const commonStyle: React.CSSProperties = {
    left: `${field.x}px`,
    top: `${field.y}px`,
    width: `${field.width}px`,
    height: `${field.height}px`,
    fontSize: `${field.fontSize}px`,
    fontWeight: toCssFontWeight(field.fontWeight),
    textAlign: field.textAlign,
    fontFamily: FORM_FIELD_FONT_FAMILY,
    ...(shouldHideInEditMode ? { display: 'none' } : {}),
  };

  const isStamp = field.type === FieldType.STAMP;
  const isSignature = field.type === FieldType.SIGNATURE;
  const isImage = field.type === FieldType.IMAGE;
  // FIXME: API 스키마에 DIAGNOSIS_TABLE 타입 추가 후 타입 캐스팅 제거
  const isDiagnosisTable = (field.type as number) === FieldType.DIAGNOSIS_TABLE;

  // DIAGNOSIS_TABLE 필드인 경우 테이블 렌더링
  if (isDiagnosisTable) {
    return (
      <DiagnosisTableDisplay
        field={field}
        style={commonStyle}
        formRows={rawValue as Array<{ name: string; code: string }> | undefined}
      />
    );
  }

  // STAMP/SIGNATURE/IMAGE 필드인 경우 이미지 다운로드 및 표시
  if (isStamp || isSignature || isImage) {
    const fallbackSrc = getImageFallbackSrcAction?.(field);
    const shouldUseFallback = preferFallbackImage && Boolean(fallbackSrc);
    const uuidRaw = rawValue as string | undefined;

    return (
      <ImageFieldDisplay
        uuid={shouldUseFallback ? undefined : uuidRaw}
        style={commonStyle}
        placeholder={stampPlaceholder}
        fallbackSrc={fallbackSrc}
      />
    );
  }

  // 기간 필드인 경우 렌더링 (DATE 타입 + dateRange 옵션)
  const dateRangeOptions = extractDateRangeOptions(field.options);
  const isDateRange = field.type === FieldType.DATE && Boolean(dateRangeOptions);
  if (isDateRange) {
    const separator = dateRangeOptions?.separator || '~';

    // 값은 "startDate|endDate" 형식으로 저장됨
    const parseRangeValue = (value: unknown): { startDate: string; endDate: string } => {
      if (typeof value === 'string' && value.includes('|')) {
        const [startDate, endDate] = value.split('|');
        return { startDate: startDate || '', endDate: endDate || '' };
      }
      return { startDate: '', endDate: '' };
    };

    const rangeValue = parseRangeValue(rawValue);

    if (!isEditMode) {
      // 조회모드: 날짜 표시
      const dateFormat = extractDateFormat(field.options);
      const formattedStartDate = rangeValue.startDate ? formatDate(rangeValue.startDate, dateFormat) : '';
      const formattedEndDate = rangeValue.endDate ? formatDate(rangeValue.endDate, dateFormat) : '';
      const displayText = formattedStartDate || formattedEndDate
        ? `${formattedStartDate} ${separator} ${formattedEndDate}`
        : '';

      return (
        <div
          className="absolute pointer-events-none"
          style={{
            ...commonStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 4px',
            color: '#111827',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: '100%', textAlign: 'center' }}>
            {displayText}
          </span>
        </div>
      );
    }

    // 편집모드: 두 개의 date input
    return (
      <DateRangeEditor
        field={field}
        control={control}
        separator={separator}
        style={commonStyle}
      />
    );
  }

  if (!isEditMode) {
    const isTextarea = field.type === FieldType.TEXTAREA;
    const isCheckbox = field.type === FieldType.CHECKBOX;

    // 체크박스 필드인 경우 체크 표시 렌더링
    if (isCheckbox) {
      const radioGroup = extractRadioGroup(field.options);
      let isChecked = false;
      const checkboxLabel = extractCheckboxLabel(field.options);

      if (radioGroup) {
        // 라디오 체크박스: radioGroup_${radioGroup} 값이 현재 필드 key와 같으면 체크됨
        const groupValue = watch(`radioGroup_${radioGroup}`) as string | undefined;
        isChecked = groupValue === fieldKey;
      } else {
        // 일반 체크박스: fieldKey 값이 true면 체크됨
        isChecked = rawValue === true || rawValue === 'true' || rawValue === 1 || rawValue === '1';
      }

      return (
        <div
          className="absolute pointer-events-none"
          style={{
            ...commonStyle,
            display: 'flex',
            alignItems: 'center',
            overflow: 'visible',
          }}
        >
          <div style={{ width: '100%', height: '100%', flex: '0 0 auto' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* 체크박스 박스 */}
              <rect x="3" y="3" width="18" height="18" />
              {/* 체크 표시 */}
              {isChecked && <polyline points="20 6 9 17 4 12" strokeWidth="3" />}
            </svg>
          </div>
          {checkboxLabel && (
            <span
              className="ml-1.5 whitespace-nowrap"
              style={{
                fontSize: `${field.fontSize}px`,
                fontWeight: toCssFontWeight(field.fontWeight),
                color: '#111827',
              }}
              dangerouslySetInnerHTML={checkboxLabel.isHtml ? { __html: checkboxLabel.value } : undefined}
            >
              {!checkboxLabel.isHtml ? checkboxLabel.value : null}
            </span>
          )}
        </div>
      );
    }

    const textAlign = field.textAlign;
    const getJustifyContentByTextAlign = (align: string) => {
      if (align === 'center') return 'center';
      if (align === 'right') return 'flex-end';
      return 'flex-start';
    };

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          ...commonStyle,
          display: 'flex',
          alignItems: isTextarea ? (verticalCenter ? 'center' : 'flex-start') : 'center',
          justifyContent: getJustifyContentByTextAlign(textAlign),
          padding: '2px 4px',
          color: '#111827',
          overflow: 'hidden',
          whiteSpace: isTextarea ? 'pre-wrap' : 'nowrap',
          ...(isTextarea ? TEXTAREA_COMMON_STYLE : {}),
        }}
      >
        <span
          style={{
            width: '100%',
            textAlign,
          }}
        >
          {displayValue || ''}
        </span>
      </div>
    );
  }

  const editor = renderEditor({
    field,
    register,
    placeholder,
    control,
    allFields,
    watch,
  });

  return (
    <div className="absolute pointer-events-auto" style={commonStyle}>
      {editor}
    </div>
  );
}

// 서식 필드 공통 폰트 (편집/조회 모드 동일)
const FORM_FIELD_FONT_FAMILY = 'Nanum Gothic, 나눔고딕';

// textarea 공통 스타일 (편집/조회 모드 일관성 유지)
const TEXTAREA_COMMON_STYLE: React.CSSProperties = {
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

function renderEditor(params: {
  field: FormFieldDto;
  register: ReturnType<typeof useFormContext<Record<string, unknown>>>['register'];
  placeholder: string;
  control: ReturnType<typeof useFormContext<Record<string, unknown>>>['control'];
  allFields: FormFieldDto[];
  watch: ReturnType<typeof useFormContext<Record<string, unknown>>>['watch'];
}) {
  const { field, register, placeholder, control, allFields, watch } = params;
  const isCheckbox = field.type === FieldType.CHECKBOX;
  const isTextarea = field.type === FieldType.TEXTAREA;
  const isNumber = field.type === FieldType.NUMBER;
  const dateSplitMeta = extractDateSplitMeta(field.options);

  // 체크박스 필드 렌더링
  if (isCheckbox) {
    const radioGroup = extractRadioGroup(field.options);
    const checkboxLabel = extractCheckboxLabel(field.options);
    const hasCheckboxLabel = Boolean(checkboxLabel);
    const checkboxBoxSize = { width: field.width, height: field.height };
    const configuredHitPaddingPx = extractCheckboxHitPaddingPx(field.options);
    const defaultHitPaddingPx = hasCheckboxLabel ? 4 : 6;
    const hitPaddingPx = configuredHitPaddingPx ?? defaultHitPaddingPx;
    const customHitArea = extractCheckboxCustomHitArea(field.options);

    if (radioGroup) {
      // 라디오 체크박스: input type="radio" 사용
      const groupName = `radioGroup_${radioGroup}`;

      return (
        <Controller
          name={groupName}
          control={control}
          render={({ field: formField }) => {
            const isChecked = formField.value === field.key;
            return (
              <CustomCheckbox
                type="radio"
                name={groupName}
                value={field.key}
                checked={isChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    formField.onChange(field.key);
                  }
                }}
                fieldKey={field.key}
                boxSize={checkboxBoxSize}
                label={checkboxLabel}
                labelFontSize={field.fontSize}
                labelFontWeight={toCssFontWeight(field.fontWeight)}
                hitPaddingPx={hitPaddingPx}
                customHitArea={customHitArea}
              />
            );
          }}
        />
      );
    }

    // 일반 체크박스: input type="checkbox" 사용
    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: formField }) => {
          const isChecked = formField.value === true;
          return (
            <CustomCheckbox
              type="checkbox"
              name={field.key}
              checked={isChecked}
              onChange={(e) => {
                formField.onChange(e.target.checked);
              }}
              fieldKey={field.key}
              boxSize={checkboxBoxSize}
              label={checkboxLabel}
              labelFontSize={field.fontSize}
              labelFontWeight={toCssFontWeight(field.fontWeight)}
              hitPaddingPx={hitPaddingPx}
              customHitArea={customHitArea}
            />
          );
        }}
      />
    );
  }

  if (dateSplitMeta) {
    const { groupId, part } = dateSplitMeta;
    const groupKeys = getDateSplitGroupKeys(allFields, groupId);
    const yearValueRaw = groupKeys.year ? watch(groupKeys.year) : undefined;
    const monthValueRaw = groupKeys.month ? watch(groupKeys.month) : undefined;
    const yearValue = toNumericValue(yearValueRaw);
    const monthValue = toNumericValue(monthValueRaw);
    const yearRange = getDateSplitYearRange(dateSplitMeta);
    const options = buildDateSplitOptions(part, yearRange, yearValue, monthValue);
    const shouldUseDefaultToday = isDateSplitDefaultToday(field.defaultValue);

    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: formField }) => {
          const rawValue = toSelectValue(formField.value);
          const isEmptyValue = rawValue === '';
          const displayValue = isEmptyValue && shouldUseDefaultToday
            ? formatDateSplitPart(new Date(), part)
            : rawValue;

          return (
            <select
              value={displayValue}
              onChange={(e) => formField.onChange(e.target.value)}
              data-field-key={field.key}
              className="w-full h-full border border-blue-400/60 bg-white/85 backdrop-blur-sm rounded px-2 py-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: FORM_FIELD_FONT_FAMILY,
                fontSize: `${field.fontSize}px`,
                fontWeight: toCssFontWeight(field.fontWeight),
                textAlign: field.textAlign,
              }}
            >
              <option value="">{placeholder || getDateSplitPlaceholder(part)}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }}
      />
    );
  }

  const inputType = getHtmlInputType(field.type);
  const baseClassName =
    'w-full h-full border border-blue-400/60 bg-white/85 backdrop-blur-sm rounded px-2 py-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  // 총점 필드인지 확인 (NUMBER 타입 + scoreGroup 있음)
  const scoreGroup = extractScoreGroup(field.options);
  const isTotalField = isNumber && Boolean(scoreGroup);

  // FIXME: 스피너 필요시 수정 필요
  // number input 스피너 숨김 스타일
  const numberSpinnerHideClassName = isNumber
    ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
    : '';
  const inputStyle: React.CSSProperties = {
    fontFamily: FORM_FIELD_FONT_FAMILY,
    fontSize: `${field.fontSize}px`,
    fontWeight: toCssFontWeight(field.fontWeight),
    textAlign: field.textAlign,
  };

  if (isTextarea) {
    const verticalCenter = extractVerticalCenter(field.options);
    // 편집/조회 모드 일관성을 위해 동일한 스타일 적용
    const textareaStyle: React.CSSProperties = {
      ...TEXTAREA_COMMON_STYLE,
      fontFamily: FORM_FIELD_FONT_FAMILY,
      fontSize: `${field.fontSize}px`,
      fontWeight: toCssFontWeight(field.fontWeight),
      textAlign: field.textAlign,
      padding: '2px 4px', // 조회 모드와 동일한 패딩
    };

    return (
      <Controller
        name={field.key}
        control={control}
        render={({ field: formField }) => (
          <LimitedTextarea
            value={(formField.value as string) ?? ''}
            onChange={formField.onChange}
            data-field-key={field.key}
            className="w-full h-full border border-blue-400/60 bg-white/85 backdrop-blur-sm rounded text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
            style={textareaStyle}
            fontSize={field.fontSize}
            verticalCenter={verticalCenter}
          />
        )}
      />
    );
  }

  // 총점 필드는 readonly로 처리
  if (isTotalField) {
    return (
      <input
        type="number"
        {...register(field.key)}
        data-field-key={field.key}
        readOnly
        className={`${baseClassName} ${numberSpinnerHideClassName} bg-gray-100 cursor-not-allowed`}
        placeholder={placeholder}
        style={inputStyle}
      />
    );
  }

  // TODO: date 등 커스텀 컴포넌트로 교체(지금은 기본 html input 사용)
  return (
    <input
      type={inputType}
      {...register(field.key)}
      data-field-key={field.key}
      className={`${baseClassName} ${numberSpinnerHideClassName}`}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

function getHtmlInputType(fieldType: FormFieldDto['type']): string {
  if (fieldType === FieldType.NUMBER) return 'number';
  if (fieldType === FieldType.DATE) return 'date';
  if (fieldType === FieldType.DATETIME) return 'datetime-local';
  return 'text';
}

// DATE_RANGE 필드 편집 컴포넌트
function DateRangeEditor(props: {
  field: FormFieldDto;
  control: ReturnType<typeof useFormContext<Record<string, unknown>>>['control'];
  separator: string;
  style: React.CSSProperties;
}) {
  const { field, control, separator, style } = props;
  const dateInputStyle: React.CSSProperties = {
    fontFamily: FORM_FIELD_FONT_FAMILY,
    fontSize: `${field.fontSize}px`,
    fontWeight: toCssFontWeight(field.fontWeight),
    textAlign: 'center',
  };

  return (
    <Controller
      name={field.key}
      control={control}
      render={({ field: formField }) => {
        // 값은 "startDate|endDate" 형식으로 저장됨
        const parseValue = (value: unknown): { startDate: string; endDate: string } => {
          if (typeof value === 'string' && value.includes('|')) {
            const [startDate, endDate] = value.split('|');
            return { startDate: startDate || '', endDate: endDate || '' };
          }
          return { startDate: '', endDate: '' };
        };

        const currentValue = parseValue(formField.value);

        const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          formField.onChange(`${e.target.value}|${currentValue.endDate}`);
        };

        const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          formField.onChange(`${currentValue.startDate}|${e.target.value}`);
        };

        return (
          <div
            className="absolute pointer-events-auto flex items-center gap-1"
            style={style}
          >
            <input
              type="date"
              value={currentValue.startDate}
              onChange={handleStartChange}
              data-field-key={`${field.key}_start`}
              className="flex-1 h-full border border-blue-400/60 bg-white/85 backdrop-blur-sm rounded text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-1"
              style={dateInputStyle}
            />
            <span
              className="flex-shrink-0 text-gray-700"
              style={{ fontSize: `${field.fontSize}px` }}
            >
              {separator}
            </span>
            <input
              type="date"
              value={currentValue.endDate}
              onChange={handleEndChange}
              data-field-key={`${field.key}_end`}
              className="flex-1 h-full border border-blue-400/60 bg-white/85 backdrop-blur-sm rounded text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-1"
              style={dateInputStyle}
            />
          </div>
        );
      }}
    />
  );
}

function toCssFontWeight(fontWeight: FormFieldDto['fontWeight']): number {
  if (fontWeight === 'bold') return 700;
  if (fontWeight === 'extra-bold') return 800;
  return 400;
}

function formatFieldValue(value: unknown, field: FormFieldDto): string {
  const dateSplitMeta = extractDateSplitMeta(field.options);
  const hasDateSplitMeta = Boolean(dateSplitMeta);
  const isEmptyValue = value === null || value === undefined || value === '';
  const shouldUseDefaultToday = hasDateSplitMeta && isDateSplitDefaultToday(field.defaultValue);
  if (isEmptyValue && shouldUseDefaultToday && dateSplitMeta) {
    return formatDateSplitPart(new Date(), dateSplitMeta.part);
  }
  if (value === null || value === undefined) return '';

  // 날짜 타입 필드인 경우 포맷 적용
  if (field.type === FieldType.DATE) {
    const dateFormat = extractDateFormat(field.options);
    return formatDate(value, dateFormat);
  }

  if (field.type === FieldType.DATETIME) {
    const dateFormat = extractDateFormat(field.options);
    return formatDateTime(value, dateFormat);
  }

  // 날짜가 아닌 경우 기본 변환
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function extractDateFormat(options: FormFieldDto['options']): string | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const dateFormat = (optionsObj as any).dateFormat;
  return typeof dateFormat === 'string' ? dateFormat : undefined;
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

function extractScoreGroup(options: FormFieldDto['options']): string | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const scoreGroup = (optionsObj as any).scoreGroup;
  return typeof scoreGroup === 'string' ? scoreGroup : undefined;
}

function extractScore(options: FormFieldDto['options']): number | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const score = (optionsObj as any).score;
  return typeof score === 'number' ? score : undefined;
}

function extractCheckboxLabel(options: FormFieldDto['options']): { isHtml: boolean; value: string } | null {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return null;

  const formatRaw = (optionsObj as any).checkboxLabelFormat;
  const format = formatRaw === CheckboxLabelFormat.HTML ? CheckboxLabelFormat.HTML : CheckboxLabelFormat.TEXT;

  const textRaw = (optionsObj as any).checkboxLabelText;
  const htmlRaw = (optionsObj as any).checkboxLabelHtml;

  const labelText = typeof textRaw === 'string' ? textRaw : '';
  const labelHtmlRaw = typeof htmlRaw === 'string' ? htmlRaw : '';

  const normalizedText = labelText.trim();
  const normalizedHtml = labelHtmlRaw.trim();

  const isHtml = format === CheckboxLabelFormat.HTML;
  const labelValue = isHtml ? DOMPurify.sanitize(normalizedHtml) : normalizedText;

  if (!labelValue) return null;

  return { isHtml, value: labelValue };
}

function extractCheckboxHitPaddingPx(options: FormFieldDto['options']): number | undefined {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return undefined;
  const raw = (optionsObj as any).checkboxHitPaddingPx;
  if (typeof raw !== 'number') return undefined;
  if (!Number.isFinite(raw)) return undefined;
  if (raw < 0) return undefined;
  return raw;
}

type CheckboxCustomHitArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function extractCheckboxCustomHitArea(options: FormFieldDto['options']): CheckboxCustomHitArea | null {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return null;

  const x = (optionsObj as any).checkboxHitAreaX;
  const y = (optionsObj as any).checkboxHitAreaY;
  const width = (optionsObj as any).checkboxHitAreaWidth;
  const height = (optionsObj as any).checkboxHitAreaHeight;

  // width나 height가 설정된 경우에만 커스텀 히트 영역으로 인식
  const hasCustomArea = typeof width === 'number' || typeof height === 'number';
  if (!hasCustomArea) return null;

  return {
    x: typeof x === 'number' ? x : 0,
    y: typeof y === 'number' ? y : 0,
    width: typeof width === 'number' ? width : 24,
    height: typeof height === 'number' ? height : 24,
  };
}

type DateRangeOptions = {
  startResolver?: string;
  endResolver?: string;
  separator?: string;
};

function extractVerticalCenter(options: FormFieldDto['options']): boolean {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return false;
  return (optionsObj as any).verticalCenter === true;
}

function extractDateRangeOptions(options: FormFieldDto['options']): DateRangeOptions | null {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return null;
  const dateRange = (optionsObj as any).dateRange as DateRangeOptions | undefined;
  if (!dateRange || typeof dateRange !== 'object') return null;
  return dateRange;
}

type DateSplitPart = 'year' | 'month' | 'day';

type DateSplitMeta = {
  groupId: string;
  part: DateSplitPart;
  ui?: 'select' | 'combo';
  yearRange?: { start: number; end: number };
};

type DateSplitOptions = {
  value: string;
  label: string;
};

function extractDateSplitMeta(options: FormFieldDto['options']): DateSplitMeta | null {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return null;
  const dateSplit = (optionsObj as any).dateSplit as DateSplitMeta | undefined;
  if (!dateSplit || typeof dateSplit !== 'object') return null;
  if (typeof dateSplit.groupId !== 'string') return null;
  if (dateSplit.part !== 'year' && dateSplit.part !== 'month' && dateSplit.part !== 'day') return null;
  return dateSplit;
}

function getDateSplitGroupKeys(allFields: FormFieldDto[], groupId: string): Record<DateSplitPart, string | null> {
  const result: Record<DateSplitPart, string | null> = { year: null, month: null, day: null };
  allFields.forEach((field) => {
    const meta = extractDateSplitMeta(field.options);
    if (!meta || meta.groupId !== groupId) return;
    result[meta.part] = field.key;
  });
  return result;
}

function getDateSplitPlaceholder(part: DateSplitPart): string {
  if (part === 'year') return 'YYYY';
  if (part === 'month') return 'MM';
  return 'DD';
}

function toNumericValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSelectValue(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  return '';
}

function isDateSplitDefaultToday(rawDefaultValue: FormFieldDto['defaultValue']): boolean {
  if (typeof rawDefaultValue === 'string') return rawDefaultValue === '{{today}}';
  if (!rawDefaultValue || typeof rawDefaultValue !== 'object') return false;
  const template = (rawDefaultValue as any).template;
  const value = (rawDefaultValue as any).value;
  return template === '{{today}}' || value === '{{today}}';
}

function formatDateSplitPart(date: Date, part: DateSplitPart): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (part === 'year') return year;
  if (part === 'month') return month;
  return day;
}

function getDateSplitYearRange(meta: DateSplitMeta): { start: number; end: number } {
  if (meta.yearRange && Number.isFinite(meta.yearRange.start) && Number.isFinite(meta.yearRange.end)) {
    return meta.yearRange;
  }
  const currentYear = new Date().getFullYear();
  return { start: currentYear - 100, end: currentYear + 10 };
}

function buildDateSplitOptions(
  part: DateSplitPart,
  yearRange: { start: number; end: number },
  yearValue: number | null,
  monthValue: number | null
): DateSplitOptions[] {
  if (part === 'year') {
    const options: DateSplitOptions[] = [];
    for (let year = yearRange.end; year >= yearRange.start; year -= 1) {
      options.push({ value: String(year), label: `${year}` });
    }
    return options;
  }

  if (part === 'month') {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const label = String(month).padStart(2, '0');
      return { value: label, label };
    });
  }

  const daysInMonth = getDaysInMonth(yearValue, monthValue);
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const label = String(day).padStart(2, '0');
    return { value: label, label };
  });
}

function getDaysInMonth(yearValue: number | null, monthValue: number | null): number {
  const year = yearValue ?? new Date().getFullYear();
  const month = monthValue ?? 1;
  if (month < 1 || month > 12) return 31;
  return new Date(year, month, 0).getDate();
}

// STAMP 필드 이미지 표시 컴포넌트
// TODO: 서식 발급시 직인 이미지 저장 시점으로 고정 여부 확인 후 적용
function ImageFieldDisplay(props: {
  uuid: string | undefined;
  style: React.CSSProperties;
  placeholder?: string;
  fallbackSrc?: string;
}) {
  const { uuid, style, placeholder, fallbackSrc } = props;

  // 공통 Hook을 사용하여 이미지 다운로드 및 URL 관리
  const { objectUrl } = useFileObjectUrl(uuid);

  if (!objectUrl) {
    if (fallbackSrc) {
      return (
        <div className="absolute flex items-center justify-center pointer-events-none" style={style}>
          <img
            src={fallbackSrc}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
    }

    if (!placeholder) return null;
    return (
      <div className="absolute flex items-center justify-center pointer-events-none" style={style}>
        <span className="text-[12px] text-[#111827]">{placeholder}</span>
      </div>
    );
  }

  return (
    <div className="absolute flex items-center justify-center pointer-events-auto" style={style}>
      <img
        src={objectUrl}
        alt="이미지"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

// 진단 테이블 표시 컴포넌트
function DiagnosisTableDisplay(props: {
  field: FormFieldDto;
  style: React.CSSProperties;
  formRows?: Array<{ name: string; code: string }>;
}) {
  const { field, style, formRows } = props;
  const tableOptions = extractDiagnosisTableOptions(field.options);

  if (!tableOptions) {
    return null;
  }

  const { nameColumnRatio, codeColumnStartRatio, rowHeight, rows: optionRows } = tableOptions;

  // 비율 기반으로 실제 픽셀 너비 계산
  const effectiveCodeStartRatio = codeColumnStartRatio ?? nameColumnRatio;
  const nameColumnWidth = field.width * nameColumnRatio;
  const codeColumnWidth = field.width * (1 - effectiveCodeStartRatio);

  const normalizedFormRows = Array.isArray(formRows) ? formRows : [];
  // 폼 데이터가 있으면 폼 데이터 사용, 없으면 옵션의 rows 사용
  const rows = normalizedFormRows.length > 0 ? normalizedFormRows : optionRows;

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        ...style,
        padding: 0,
      }}
    >
      <div className="w-full h-full">
        {rows.map((row, index) => {
          const rowTop = index * rowHeight;
          // 테이블 영역을 벗어나면 렌더링하지 않음
          if (rowTop + rowHeight > field.height) {
            return null;
          }

          return (
            <div
              key={`row-${index}`}
              className="flex"
              style={{
                height: `${rowHeight}px`,
              }}
            >
              {/* 상병명 셀 */}
              <div
                className="flex items-center overflow-hidden"
                style={{
                  width: `${nameColumnWidth}px`,
                  height: `${rowHeight}px`,
                  padding: '0 4px',
                  fontSize: `${field.fontSize}px`,
                  fontWeight: toCssFontWeight(field.fontWeight),
                }}
              >
                <span className="overflow-hidden whitespace-nowrap">{row.name || ''}</span>
              </div>
              {/* gap 영역 (상병명 끝 ~ 분류기호 시작) */}
              {effectiveCodeStartRatio > nameColumnRatio && (
                <div style={{ width: `${field.width * (effectiveCodeStartRatio - nameColumnRatio)}px` }} />
              )}
              {/* 청구코드 셀 */}
              <div
                className="flex items-center overflow-hidden"
                style={{
                  width: `${codeColumnWidth}px`,
                  height: `${rowHeight}px`,
                  padding: '0 4px',
                  fontSize: `${field.fontSize}px`,
                  fontWeight: toCssFontWeight(field.fontWeight),
                }}
              >
                <span className="overflow-hidden whitespace-nowrap">{row.code || ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function extractDiagnosisTableOptions(options: FormFieldDto['options']): {
  nameColumnRatio: number;
  codeColumnStartRatio: number | undefined;
  rowHeight: number;
  rows: Array<{ name: string; code: string }>;
} | null {
  const optionsObj = options as unknown;
  if (!optionsObj || typeof optionsObj !== 'object') return null;

  const diagnosisTable = (optionsObj as any).diagnosisTable;
  if (!diagnosisTable || typeof diagnosisTable !== 'object') return null;

  const nameColumnRatio = typeof diagnosisTable.nameColumnRatio === 'number' ? diagnosisTable.nameColumnRatio : 0.5;
  const codeColumnStartRatio = typeof diagnosisTable.codeColumnStartRatio === 'number' ? diagnosisTable.codeColumnStartRatio : undefined;
  const rowHeight = typeof diagnosisTable.rowHeight === 'number' ? diagnosisTable.rowHeight : 20;
  const rows = Array.isArray(diagnosisTable.rows) ? diagnosisTable.rows : [];

  return {
    nameColumnRatio,
    codeColumnStartRatio,
    rowHeight,
    rows,
  };
}

// 커스텀 체크박스 컴포넌트 (input 숨기고 label/span으로 UI 그리기)
function CustomCheckbox(props: {
  type: 'checkbox' | 'radio';
  name: string;
  value?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fieldKey: string;
  boxSize: { width: number; height: number };
  label: { isHtml: boolean; value: string } | null;
  labelFontSize: number;
  labelFontWeight: number;
  hitPaddingPx: number;
  customHitArea?: CheckboxCustomHitArea | null;
}) {
  const { type, name, value, checked, onChange, fieldKey, boxSize, label, labelFontSize, labelFontWeight, hitPaddingPx, customHitArea } =
    props;
  const inputId = `checkbox-${fieldKey}`;
  const hasLabel = Boolean(label);

  // 커스텀 히트 영역 스타일 계산
  const hitAreaStyle: React.CSSProperties = customHitArea
    ? {
        // 커스텀 히트 영역: x, y는 체크박스 기준 상대 위치
        left: customHitArea.x,
        top: customHitArea.y,
        width: customHitArea.width,
        height: customHitArea.height,
      }
    : {
        // 기본 히트 영역: padding 기반 확장
        left: -hitPaddingPx,
        top: -hitPaddingPx,
        right: -hitPaddingPx,
        bottom: -hitPaddingPx,
      };

  return (
    <label htmlFor={inputId} className="cursor-pointer inline-flex items-center relative" style={{ height: `${boxSize.height}px` }} data-field-key={fieldKey}>
      {/* 클릭 영역(히트 영역) 확장용. 시각적으로는 보이지 않음 */}
      <span
        aria-hidden
        className="absolute"
        style={hitAreaStyle}
      />
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
        data-field-key={fieldKey}
      />
      <span
        className="flex items-center justify-center"
        style={{
          width: `${boxSize.width}px`,
          height: `${boxSize.height}px`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 체크박스 박스 */}
          <rect x="3" y="3" width="18" height="18" />
          {/* 체크 표시 */}
          {checked && <polyline points="20 6 9 17 4 12" strokeWidth="3" />}
        </svg>
      </span>
      {hasLabel && (
        <span
          className="ml-1.5 whitespace-nowrap"
          style={{
            fontSize: `${labelFontSize}px`,
            fontWeight: labelFontWeight,
            color: '#111827',
          }}
          dangerouslySetInnerHTML={label?.isHtml ? { __html: label.value } : undefined}
        >
          {!label?.isHtml ? label?.value : null}
        </span>
      )}
    </label>
  );
}

