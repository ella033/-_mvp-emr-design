'use client';

import { useFieldEditor } from '../_contexts/FieldEditorContext';
import { CheckboxLabelFormat, FieldType, type FieldFontWeight, type FieldTextAlign, type FieldDefaultValue } from '@/types/document';

export default function FieldEditorDetailPanel() {
  const {
    selectedField,
    updateField,
    deleteField,
    getExistingRadioGroups,
    getExistingScoreGroups,
    addedFields,
    updateFields,
  } = useFieldEditor();

  if (!selectedField) {
    return (
      <div className="w-80 h-full border-l border-gray-300 bg-gray-50">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">상세 정보</h2>
          <p className="text-gray-500">PDF 위의 필드를 클릭하여 선택하세요</p>
        </div>
      </div>
    );
  }

  const dateSplitGroupId = getDateSplitGroupId(selectedField);
  const dateSplitFields = dateSplitGroupId
    ? addedFields.filter((field) => getDateSplitGroupId(field) === dateSplitGroupId)
    : [];
  const hasDateSplitFields = dateSplitFields.length > 0;
  const isDateSplitDefaultToday =
    hasDateSplitFields && dateSplitFields.every((field) => field.defaultValue === '{{today}}');

  const handleDateSplitDefaultToggle = (checked: boolean) => {
    if (!hasDateSplitFields) return;
    const updatedFields = dateSplitFields.map((field) => ({
      ...field,
      defaultValue: checked ? '{{today}}' : undefined,
    }));
    updateFields(updatedFields);
  };

  return (
    <div className="w-80 h-full border-l border-gray-300 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">상세 정보</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              key
            </label>
            <input
              type="text"
              value={selectedField.key}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              필드명
            </label>
            <input
              type="text"
              value={selectedField.name}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  name: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              타입
            </label>
            <select
              value={selectedField.type}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  type: Number(e.target.value) as FieldType,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
            >
              <option value={FieldType.TEXT}>TEXT</option>
              <option value={FieldType.NUMBER}>NUMBER</option>
              <option value={FieldType.DATE}>DATE</option>
              <option value={FieldType.DATETIME}>DATETIME</option>
              <option value={FieldType.TEXTAREA}>TEXTAREA</option>
              <option value={FieldType.CHECKBOX}>CHECKBOX</option>
              <option value={FieldType.SELECT}>SELECT</option>
              <option value={FieldType.SIGNATURE}>SIGNATURE</option>
              <option value={FieldType.IMAGE}>IMAGE</option>
              <option value={FieldType.STAMP}>STAMP</option>
              <option value={FieldType.DIAGNOSIS_TABLE}>DIAGNOSIS_TABLE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              페이지 번호 (pageNumber)
            </label>
            <input
              type="number"
              value={selectedField.pageNumber}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  pageNumber: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              위치 (X, Y)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={selectedField.x}
                onChange={(e) =>
                  updateField({
                    ...selectedField,
                    x: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              />
              <input
                type="number"
                value={selectedField.y}
                onChange={(e) =>
                  updateField({
                    ...selectedField,
                    y: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              크기 (Width, Height)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={selectedField.width}
                onChange={(e) => {
                  const nextSize = Number(e.target.value);
                  const isCheckbox = selectedField.type === FieldType.CHECKBOX;
                  updateField({
                    ...selectedField,
                    width: nextSize,
                    ...(isCheckbox ? { height: nextSize } : {}),
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              />
              <input
                type="number"
                value={selectedField.height}
                onChange={(e) => {
                  const nextSize = Number(e.target.value);
                  const isCheckbox = selectedField.type === FieldType.CHECKBOX;
                  updateField({
                    ...selectedField,
                    height: nextSize,
                    ...(isCheckbox ? { width: nextSize } : {}),
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              폰트 크기
            </label>
            <input
              type="number"
              value={selectedField.fontSize}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  fontSize: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              폰트 두께 (fontWeight)
            </label>
            <select
              value={selectedField.fontWeight}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  fontWeight: e.target.value as FieldFontWeight,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
            >
              <option value="normal">normal</option>
              <option value="bold">bold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정렬 (textAlign)
            </label>
            <select
              value={selectedField.textAlign}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  textAlign: e.target.value as FieldTextAlign,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
            >
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              순서 (order)
            </label>
            <input
              type="number"
              value={selectedField.order}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  order: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              데이터 소스 (dataSource)
            </label>
            <input
              type="text"
              value={selectedField.dataSource}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  dataSource: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              placeholder="예: patient.name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              옵션.placeholder
            </label>
            <input
              type="text"
              value={(selectedField.options?.placeholder as string) ?? ''}
              onChange={(e) =>
                updateField({
                  ...selectedField,
                  options: {
                    ...(selectedField.options ?? {}),
                    placeholder: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              placeholder="placeholder"
            />
          </div>

          {selectedField.type === FieldType.TEXTAREA && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verticalCenter"
                checked={selectedField.options?.verticalCenter === true}
                onChange={(e) =>
                  updateField({
                    ...selectedField,
                    options: {
                      ...(selectedField.options ?? {}),
                      verticalCenter: e.target.checked || undefined,
                    },
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="verticalCenter" className="text-sm font-medium text-gray-700">
                수직 중앙 정렬 (verticalCenter)
              </label>
            </div>
          )}

          {hasDateSplitFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본값 설정
              </label>
              <select
                value={isDateSplitDefaultToday ? '{{today}}' : ''}
                onChange={(e) => {
                  const isToday = e.target.value === '{{today}}';
                  handleDateSplitDefaultToggle(isToday);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              >
                <option value="">기본값 없음</option>
                <option value={'{{today}}'}>오늘 날짜 ({'{{today}}'})</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                선택된 날짜 분리(년/월/일) 그룹에 오늘 날짜가 기본값으로 들어갑니다.
              </p>
            </div>
          )}

          {(selectedField.type === FieldType.DATE || selectedField.type === FieldType.DATETIME) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜 포맷
                </label>
                <input
                  type="text"
                  value={(selectedField.options?.dateFormat as string) ?? ''}
                  onChange={(e) =>
                    updateField({
                      ...selectedField,
                      options: {
                        ...(selectedField.options ?? {}),
                        dateFormat: e.target.value || undefined,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  placeholder="예: YYYY-MM-DD, YYYY년 MM월 DD일"
                />
                <p className="mt-1 text-xs text-gray-500">
                  예: YYYY-MM-DD, YYYY년 MM월 DD일, MM/DD/YYYY
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본값 설정
                </label>
                <select
                  value={selectedField.defaultValue ?? ''}
                  onChange={(e) =>
                    updateField({
                      ...selectedField,
                      defaultValue: e.target.value === '' ? undefined : (e.target.value as FieldDefaultValue),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                >
                  <option value="">기본값 없음</option>
                  <option value={'{{today}}'}>오늘 날짜 ({'{{today}}'})</option>
                  <option value={'{{now}}'}>현재 날짜시간 ({'{{now}}'})</option>
                </select>
              </div>
            </>
          )}

          {selectedField.type === FieldType.CHECKBOX && (
            <>
              {/* 체크박스 라벨 (선택) */}
              <div className="border-t border-gray-200 pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  라벨 (선택)
                </label>
                <input
                  type="text"
                  value={(selectedField.options?.checkboxLabelText as string) ?? ''}
                  onChange={(e) =>
                    updateField({
                      ...selectedField,
                      options: {
                        ...(selectedField.options ?? {}),
                        // HTML 라벨을 한 번이라도 수정하면 checkboxLabelFormat이 HTML로 남아
                        // 텍스트 라벨 입력이 반영되지 않는 문제가 생길 수 있어,
                        // 텍스트 입력 시에는 TEXT 모드로 전환합니다.
                        checkboxLabelFormat: CheckboxLabelFormat.TEXT,
                        checkboxLabelText: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  placeholder="예: 동의합니다"
                />
                <p className="mt-1 text-xs text-gray-500">
                  라벨을 입력하면 체크박스 오른쪽에 표시되며, 라벨 클릭으로도 체크/해제할 수 있습니다. (HTML 라벨이 설정되어 있으면 HTML 라벨이 우선 적용됩니다.)
                </p>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-600 select-none">
                    고급: HTML 라벨
                  </summary>
                  <div className="mt-2">
                    <textarea
                      value={(selectedField.options?.checkboxLabelHtml as string) ?? ''}
                      onChange={(e) =>
                        updateField({
                          ...selectedField,
                          options: {
                            ...(selectedField.options ?? {}),
                            checkboxLabelFormat: CheckboxLabelFormat.HTML,
                            checkboxLabelHtml: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      rows={4}
                      placeholder={'예: <b>동의합니다</b><br/><span>세부 내용</span>'}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      HTML은 렌더링 시 sanitize 처리됩니다. 입력이 비어 있으면 라벨이 표시되지 않습니다.
                    </p>
                  </div>
                </details>

              </div>

              {/* 클릭 영역(히트 영역) 설정 */}
              <div className="border-t border-gray-200 pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  클릭 영역 여유 (px)
                </label>
                <input
                  type="number"
                  value={(selectedField.options?.checkboxHitPaddingPx as number) ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const checkboxHitPaddingPx = raw === '' ? undefined : Number(raw);
                    updateField({
                      ...selectedField,
                      options: {
                        ...(selectedField.options ?? {}),
                        checkboxHitPaddingPx,
                        // 히트 영역 커스텀 값이 있으면 유지, 없으면 패딩 기반으로 동작
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  min="0"
                  step="1"
                  placeholder="기본값 사용"
                />
                <p className="mt-1 text-xs text-gray-500">
                  비워두면 기본값을 사용합니다. (라벨 없음: 6px / 라벨 있음: 4px). 점선 영역을 직접 드래그/리사이즈하여 조절할 수도 있습니다.
                </p>

                {/* 커스텀 히트 영역이 설정된 경우 표시 */}
                {(selectedField.options?.checkboxHitAreaWidth !== undefined || 
                  selectedField.options?.checkboxHitAreaHeight !== undefined) && (
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-2">커스텀 클릭 영역 (상대 위치)</p>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <label className="block text-xs text-green-600 mb-1">X</label>
                        <input
                          type="number"
                          value={(selectedField.options?.checkboxHitAreaX as number) ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const checkboxHitAreaX = raw === '' ? undefined : Number(raw);
                            updateField({
                              ...selectedField,
                              options: {
                                ...(selectedField.options ?? {}),
                                checkboxHitAreaX,
                              },
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-green-300 rounded bg-white text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-green-600 mb-1">Y</label>
                        <input
                          type="number"
                          value={(selectedField.options?.checkboxHitAreaY as number) ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const checkboxHitAreaY = raw === '' ? undefined : Number(raw);
                            updateField({
                              ...selectedField,
                              options: {
                                ...(selectedField.options ?? {}),
                                checkboxHitAreaY,
                              },
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-green-300 rounded bg-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-green-600 mb-1">너비</label>
                        <input
                          type="number"
                          value={(selectedField.options?.checkboxHitAreaWidth as number) ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const checkboxHitAreaWidth = raw === '' ? undefined : Math.max(10, Number(raw));
                            updateField({
                              ...selectedField,
                              options: {
                                ...(selectedField.options ?? {}),
                                checkboxHitAreaWidth,
                              },
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-green-300 rounded bg-white text-sm"
                          min="10"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-green-600 mb-1">높이</label>
                        <input
                          type="number"
                          value={(selectedField.options?.checkboxHitAreaHeight as number) ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const checkboxHitAreaHeight = raw === '' ? undefined : Math.max(10, Number(raw));
                            updateField({
                              ...selectedField,
                              options: {
                                ...(selectedField.options ?? {}),
                                checkboxHitAreaHeight,
                              },
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-green-300 rounded bg-white text-sm"
                          min="10"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateField({
                          ...selectedField,
                          options: {
                            ...(selectedField.options ?? {}),
                            checkboxHitAreaX: undefined,
                            checkboxHitAreaY: undefined,
                            checkboxHitAreaWidth: undefined,
                            checkboxHitAreaHeight: undefined,
                          },
                        });
                      }}
                      className="mt-2 w-full px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      클릭 영역 초기화 (패딩 기반으로 복원)
                    </button>
                  </div>
                )}
              </div>

              {/* 라디오 그룹 선택 (드롭다운) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  라디오 그룹
                </label>
                <select
                  value={(selectedField.options?.radioGroup as string) || ''}
                  onChange={(e) => {
                    const radioGroup = e.target.value || undefined;
                    updateField({
                      ...selectedField,
                      options: {
                        ...(selectedField.options ?? {}),
                        radioGroup,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                >
                  <option value="">없음</option>
                  {getExistingRadioGroups().map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  기존 라디오 그룹을 선택하거나 없음으로 설정할 수 있습니다
                </p>
              </div>

              {/* 점수 그룹 선택 (드롭다운) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  점수 그룹
                </label>
                <select
                  value={(selectedField.options?.scoreGroup as string) || ''}
                  onChange={(e) => {
                    const scoreGroup = e.target.value || undefined;
                    updateField({
                      ...selectedField,
                      options: {
                        ...(selectedField.options ?? {}),
                        scoreGroup,
                      },
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                >
                  <option value="">없음</option>
                  {getExistingScoreGroups().map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  기존 점수 그룹을 선택하거나 없음으로 설정할 수 있습니다
                </p>
              </div>

              {/* 점수 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  점수 (score)
                </label>
                <input
                  type="number"
                  value={(selectedField.options?.score as number) ?? ''}
                  onChange={(e) =>
                    updateField({
                      ...selectedField,
                      options: {
                        ...(selectedField.options ?? {}),
                        score: e.target.value === '' ? undefined : Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  placeholder="체크 시 부여할 점수"
                />
                <p className="mt-1 text-xs text-gray-500">
                  체크박스가 체크되었을 때 부여할 점수를 입력하세요
                </p>
              </div>
            </>
          )}

          {selectedField.type === FieldType.NUMBER && selectedField.options?.scoreGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                총점 필드
              </label>
              <input
                type="text"
                value={`점수 그룹: ${selectedField.options.scoreGroup as string}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">
                이 필드는 자동으로 계산된 총점을 표시합니다
              </p>
            </div>
          )}

          {selectedField.type === FieldType.DIAGNOSIS_TABLE && (
            <>
              {/* Row Height 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Row Height (px)
                </label>
                <input
                  type="number"
                  value={(selectedField.options?.diagnosisTable?.rowHeight as number) ?? 20}
                  onChange={(e) => {
                    const rowHeight = Number(e.target.value);
                    if (rowHeight > 0) {
                      updateField({
                        ...selectedField,
                        options: {
                          ...(selectedField.options ?? {}),
                          diagnosisTable: {
                            ...(selectedField.options?.diagnosisTable ?? {
                              nameColumnRatio: 0.5,
                              rowHeight: 20,
                              rows: [],
                            }),
                            rowHeight,
                          },
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  min="10"
                  step="1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  테이블의 각 행(row) 높이를 설정합니다
                </p>
              </div>

              {/* 상병명 컬럼 비율 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상병명 컬럼 비율 (%)
                </label>
                <input
                  type="number"
                  value={Math.round(((selectedField.options?.diagnosisTable?.nameColumnRatio as number) ?? 0.5) * 100)}
                  onChange={(e) => {
                    const percent = Number(e.target.value);
                    if (percent >= 10 && percent <= 90) {
                      const ratio = percent / 100;
                      updateField({
                        ...selectedField,
                        options: {
                          ...(selectedField.options ?? {}),
                          diagnosisTable: {
                            ...(selectedField.options?.diagnosisTable ?? {
                              nameColumnRatio: 0.5,
                              rowHeight: 20,
                              rows: [],
                            }),
                            nameColumnRatio: ratio,
                          },
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  min="10"
                  max="90"
                  step="5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  상병명 컬럼의 너비 비율 (10% ~ 90%)
                </p>
              </div>

              {/* 분류기호 컬럼 시작 비율 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  분류기호 컬럼 시작 비율 (%)
                </label>
                <input
                  type="number"
                  value={Math.round(((selectedField.options?.diagnosisTable?.codeColumnStartRatio as number) ?? (selectedField.options?.diagnosisTable?.nameColumnRatio as number) ?? 0.5) * 100)}
                  onChange={(e) => {
                    const percent = Number(e.target.value);
                    const nameRatioPercent = Math.round(((selectedField.options?.diagnosisTable?.nameColumnRatio as number) ?? 0.5) * 100);
                    if (percent >= nameRatioPercent && percent <= 90) {
                      const ratio = percent / 100;
                      updateField({
                        ...selectedField,
                        options: {
                          ...(selectedField.options ?? {}),
                          diagnosisTable: {
                            ...(selectedField.options?.diagnosisTable ?? {
                              nameColumnRatio: 0.5,
                              rowHeight: 20,
                              rows: [],
                            }),
                            codeColumnStartRatio: ratio,
                          },
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                  min={Math.round(((selectedField.options?.diagnosisTable?.nameColumnRatio as number) ?? 0.5) * 100)}
                  max="90"
                  step="5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  분류기호 컬럼의 시작 위치. 상병명 비율과 같으면 gap 없음.
                </p>
              </div>
            </>
          )}

          <button
            onClick={() => deleteField(selectedField.key)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            필드 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function getDateSplitGroupId(field: { options?: unknown }): string | null {
  const options = field.options as { dateSplit?: { groupId?: unknown } } | undefined;
  const groupId = options?.dateSplit?.groupId;
  return typeof groupId === 'string' ? groupId : null;
}
