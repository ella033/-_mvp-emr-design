import { useToastHelpers } from "@/components/ui/toast";
import type { Patient } from "@/types/patient-types";
import MyDivideLine from "../yjg/my-divide-line";
import MyInput from "../yjg/my-input";
import { MySelect } from "../yjg/my-select";
import { SEARCH_PERIOD_OPTIONS } from "@/constants/common/common-option";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { SearchPeriod } from "@/constants/common/common-enum";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "../yjg/my-grid/my-grid-type";
import { getInitialHeaders, saveHeaders } from "../yjg/my-grid/my-grid-util";
import { LS_VITAL_HEADERS_KEY, getDefaultVitalHeaders } from "./vital-header";
import { useSettingsStore } from "@/store/settings-store";
import MyGrid from "../yjg/my-grid/my-grid";
import { MyGridSettingButton } from "../yjg/my-grid/my-grid-setting-button";
import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import type {
  VitalSignMeasurementPivotResponse,
  DeleteUpsertManyVitalSignMeasurementsRequest,
} from "@/types/vital/vital-sign-measurement-types";
import {
  convertVitalSignMeasurementsToGridRowType,
  createEmptyVitalSignRow,
  createVitalItemCell,
} from "./vital-converter";
import { formatDateByPattern } from "@/lib/date-utils";
import { MyButton } from "@/components/yjg/my-button";
import { useDeleteUpsertManyVitalSignMeasurements } from "@/hooks/vital-sign-measurement/use--vital-sign-measurements-upsert";
import { useQueryClient } from "@tanstack/react-query";
import { MyPopupYesNo } from "../yjg/my-pop-up";
import type { VitalSignSubItemGroup } from "@/types/vital/vital-sign-sub-items-types";
import { PatientBasicInfoBadge } from "@/app/medical/_components/widgets/medical-patient-badge";

interface VitalGridProps {
  patient: Patient;
  vitalSignItems: VitalSignItem[];
  vitalSubItemGroups: VitalSignSubItemGroup[];
  vitalSignMeasurements: VitalSignMeasurementPivotResponse;
  isLoading: boolean;
  from: string;
  setFrom: (from: string) => void;
  to: string;
  setTo: (to: string) => void;
  period: number;
  setPeriod: (period: number) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaveSuccess?: () => void;
}

export interface VitalGridHandle {
  save: () => void;
  cancel: () => void;
}

const VitalGrid = forwardRef<VitalGridHandle, VitalGridProps>(function VitalGrid(
  {
    patient,
    vitalSignItems,
    vitalSubItemGroups,
    vitalSignMeasurements,
    isLoading,
    from,
    setFrom,
    to,
    setTo,
    period,
    setPeriod,
    onDirtyChange,
    onSaveSuccess,
  },
  ref
) {
  const queryClient = useQueryClient();
  const { success, error } = useToastHelpers();
  const { mutate: deleteUpsertMany, isPending: isSaving } =
    useDeleteUpsertManyVitalSignMeasurements();

  const [headers, setHeaders] = useState<MyGridHeaderType[]>([]);
  const [data, setData] = useState<MyGridRowType[]>([]);
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);

  // 원본 스냅샷 (API에서 받은 데이터)
  const snapshotRef = useRef<VitalSignMeasurementPivotResponse>([]);
  // 사용자가 편집한 셀 추적 (key: `${rowKey}::${headerKey}`)
  const dirtySetRef = useRef<Set<string>>(new Set());

  // isDirty 변경 시 부모에 알림
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // 저장된 헤더 불러오기 (설정 로드 후에도 재적용되도록 settingsLoaded 의존)
  useEffect(() => {
    if (vitalSignItems.length > 0) {
      const defaultHeaders = getDefaultVitalHeaders(vitalSignItems);
      const initialHeaders = getInitialHeaders(
        LS_VITAL_HEADERS_KEY,
        defaultHeaders
      );
      setHeaders(initialHeaders);
    }
  }, [vitalSignItems, settingsLoaded]);

  useEffect(() => {
    if (headers.length > 0) {
      saveHeaders(LS_VITAL_HEADERS_KEY, headers);
    }
  }, [headers]);

  // 데이터를 rows로 변환하는 유틸
  const buildRows = useCallback(
    (measurements: VitalSignMeasurementPivotResponse) => {
      return convertVitalSignMeasurementsToGridRowType(
        "sm",
        handleDataChange,
        handleSubItemDataChange,
        vitalSignItems,
        vitalSubItemGroups,
        measurements
      );
    },
    [vitalSignItems, vitalSubItemGroups]
  );

  const getEmptyRow = useCallback(() => {
    return createEmptyVitalSignRow(
      "sm",
      handleDataChange,
      handleSubItemDataChange,
      vitalSignItems,
      vitalSubItemGroups
    );
  }, [vitalSignItems, vitalSubItemGroups]);

  // 오늘 데이터 유무 판단 헬퍼
  const hasTodayMeasurement = useCallback(
    (measurements: VitalSignMeasurementPivotResponse) => {
      const today = formatDateByPattern(new Date(), "YYYY-MM-DD");
      return measurements.some((m) => {
        if (!m.measurementDateTime) return false;
        const d = new Date(m.measurementDateTime);
        if (isNaN(d.getTime())) return false;
        return formatDateByPattern(d, "YYYY-MM-DD") === today;
      });
    },
    []
  );

  // API 데이터 변경 시 (초기 로드 또는 소켓 갱신)
  useEffect(() => {
    if (vitalSignItems.length === 0) return;

    if (!isDirty) {
      // dirty 상태가 아니면 전체 교체
      snapshotRef.current = vitalSignMeasurements;
      const rows = buildRows(vitalSignMeasurements);
      setData(
        hasTodayMeasurement(vitalSignMeasurements)
          ? rows
          : [getEmptyRow(), ...rows]
      );
    } else {
      // dirty 상태: 소켓에서 새 데이터가 올 때 병합
      mergeSocketData(vitalSignMeasurements);
    }
  }, [vitalSignItems, vitalSignMeasurements]);

  // 소켓 데이터 병합: 사용자가 편집한 셀은 유지, 그 외는 새 데이터로 갱신
  const mergeSocketData = useCallback(
    (newMeasurements: VitalSignMeasurementPivotResponse) => {
      const newRows = buildRows(newMeasurements);

      setData((prevData) => {
        const mergedRows: MyGridRowType[] = [];
        const newRowMap = new Map(
          newRows.map((row) => [String(row.key), row])
        );
        const processedKeys = new Set<string>();

        // 기존 행 순서 유지하며 병합
        for (const prevRow of prevData) {
          const rowKey = String(prevRow.key);
          processedKeys.add(rowKey);

          // 이 행에 사용자가 편집한 셀이 있는지 확인
          const hasUserEdits = prevRow.cells.some((cell) =>
            dirtySetRef.current.has(`${rowKey}::${cell.headerKey}`)
          );

          const newRow = newRowMap.get(rowKey);

          if (!newRow) {
            // 새 데이터에 없는 행: 사용자가 추가한 행이거나 편집 중이면 유지
            if (hasUserEdits || prevRow.rowIndex === -1) {
              mergedRows.push(prevRow);
            }
            continue;
          }

          if (!hasUserEdits) {
            // 사용자 편집 없는 행은 새 데이터로 교체
            mergedRows.push(newRow);
          } else {
            // 편집된 셀은 유지, 나머지만 새 데이터로 갱신
            const mergedCells = prevRow.cells.map((prevCell) => {
              const cellKey = `${rowKey}::${prevCell.headerKey}`;
              if (dirtySetRef.current.has(cellKey)) {
                return prevCell; // 사용자 편집 유지
              }
              const newCell = newRow.cells.find(
                (c) => c.headerKey === prevCell.headerKey
              );
              return newCell ?? prevCell;
            });
            mergedRows.push({ ...prevRow, cells: mergedCells });
          }
        }

        // 새로 추가된 행 (다른 사용자가 추가)
        for (const newRow of newRows) {
          if (!processedKeys.has(String(newRow.key))) {
            mergedRows.push(newRow);
          }
        }

        return mergedRows;
      });

      // 스냅샷도 갱신 (병합된 새 원본 기준)
      snapshotRef.current = newMeasurements;
    },
    [buildRows]
  );

  // 셀 데이터 변경 핸들러 (로컬 상태만 변경, API 호출 X)
  const handleDataChange = useCallback(
    (
      rowKey: string | number,
      columnKey: string,
      value: string | number | boolean,
      _orgData?: any
    ) => {
      // dirty 셀 추적
      dirtySetRef.current.add(`${String(rowKey)}::${columnKey}`);
      setIsDirty(true);

      setData((prevData) =>
        prevData.map((row) => {
          if (row.key === rowKey) {
            return {
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.headerKey === columnKey) {
                  return { ...cell, value };
                }
                return cell;
              }),
            };
          }
          return row;
        })
      );
    },
    []
  );

  // 서브아이템 변경 핸들러 ref (customRender 재빌드 시 자기참조 해결용)
  const handleSubItemDataChangeRef = useRef<
    (rowKey: string | number, subItemId: number, orgData?: any) => void
  >(() => {});

  // 서브아이템 변경 핸들러 (로컬 상태만 변경, API 호출 X)
  const handleSubItemDataChange = useCallback(
    (rowKey: string | number, subItemId: number, orgData?: any) => {
      // dirty 셀 추적 (아이템 코드 기반)
      const item = vitalSignItems.find((i) => i.id === orgData?.itemId);
      const headerKey = item?.code ?? `item_${orgData?.itemId}`;
      dirtySetRef.current.add(`${String(rowKey)}::${headerKey}`);
      setIsDirty(true);

      // 선택한 서브아이템의 코드 조회
      const subItemGroup = vitalSubItemGroups.find(
        (group) => group.itemId === orgData?.itemId
      );
      const selectedSubItem = subItemGroup?.subItems.find(
        (s) => s.id === subItemId
      );

      setData((prevData) =>
        prevData.map((row) => {
          if (row.key === rowKey) {
            return {
              ...row,
              cells: row.cells.map((cell) => {
                const cellItemId =
                  cell.orgData?.itemId ??
                  vitalSignItems.find((i) => i.code === cell.headerKey)?.id;
                if (cellItemId === orgData?.itemId && item) {
                  // subItemCode를 포함한 업데이트된 measurement 생성
                  const updatedMeasurement = {
                    ...(cell.orgData ?? orgData),
                    subItemId,
                    subItemCode: selectedSubItem?.code || null,
                    value: cell.value || "",
                  };
                  // customRender를 재빌드하여 MySelect가 새 값을 표시하도록 함
                  return createVitalItemCell(
                    "sm",
                    String(rowKey),
                    item,
                    vitalSubItemGroups,
                    handleDataChange,
                    (...args: [string | number, number, any?]) =>
                      handleSubItemDataChangeRef.current(...args),
                    updatedMeasurement
                  );
                }
                return cell;
              }),
            };
          }
          return row;
        })
      );
    },
    [vitalSignItems, vitalSubItemGroups, handleDataChange]
  );

  // ref를 최신 핸들러로 유지
  handleSubItemDataChangeRef.current = handleSubItemDataChange;

  const handleAdd = () => {
    setIsDirty(true);
    setData((prevData) => [getEmptyRow(), ...prevData]);
  };

  const handleSelectedRows = (selectedRows: MyGridRowType[]) => {
    setSelectedRows(selectedRows);
  };

  // 선택한 행 삭제 (로컬 상태에서만 제거, 저장 시 반영)
  const handleDelete = () => {
    const selectedKeys = new Set(selectedRows.map((row) => String(row.key)));
    setData((prevData) =>
      prevData.filter((row) => !selectedKeys.has(String(row.key)))
    );
    setSelectedRows([]);
    setIsDeleteConfirmOpen(false);
    setIsDirty(true);
  };

  // 저장: 현재 data에서 items 배열 구성 → delete-upsert-many 호출
  const handleSave = useCallback(() => {
    const items: DeleteUpsertManyVitalSignMeasurementsRequest["items"] = [];

    data.forEach((row) => {
      const measurementDateTime = String(row.key);

      row.cells.forEach((cell) => {
        if (cell.headerKey === "measurementDate") return;

        const cellValue = cell.value;
        const orgData = cell.orgData;

        // 빈 값이면 items에 포함하지 않음 → API가 날짜 범위 내 items에 없는 레코드를 자동 삭제
        if (
          cellValue === "" ||
          cellValue === undefined ||
          cellValue === null
        ) {
          return;
        }

        const item = vitalSignItems.find((i) => i.code === cell.headerKey);
        if (!item) return;

        // "없음" subItem은 선택안함으로 취급 (subItemId 제외)
        const subItemGroup = vitalSubItemGroups.find(
          (g) => g.itemId === item.id
        );
        const subItem = subItemGroup?.subItems.find(
          (s) => s.id === orgData?.subItemId
        );
        const resolvedSubItemId =
          subItem?.name === "없음" ? null : (orgData?.subItemId || undefined);

        items.push({
          id: orgData?.id || undefined,
          measurementDateTime,
          itemId: item.id,
          subItemId: resolvedSubItemId,
          value: Number(cellValue),
        });
      });
    });

    // 날짜 범위 계산: data + snapshot의 모든 measurementDateTime 수집
    const allDateTimes: Date[] = [];
    data.forEach((row) => {
      const d = new Date(String(row.key));
      if (!isNaN(d.getTime())) allDateTimes.push(d);
    });
    snapshotRef.current.forEach((group) => {
      const d = new Date(group.measurementDateTime);
      if (!isNaN(d.getTime())) allDateTimes.push(d);
    });

    if (allDateTimes.length === 0) {
      error("저장할 데이터가 없습니다.");
      return;
    }

    const minDataDate = new Date(
      Math.min(...allDateTimes.map((d) => d.getTime()))
    );
    const maxDataDate = new Date(
      Math.max(...allDateTimes.map((d) => d.getTime()))
    );

    // 날짜 범위 결정: 조회 기간(from/to)과 데이터 범위의 합집합 사용
    // "전체" 기간일 때는 데이터 범위만 사용, 특정 기간일 때는 조회 범위도 포함
    const isAllPeriod = period === SearchPeriod.all;
    let beginDate: string;
    let endDate: string;

    if (isAllPeriod) {
      beginDate = formatDateByPattern(minDataDate, "YYYY-MM-DD");
      endDate = formatDateByPattern(maxDataDate, "YYYY-MM-DD");
    } else {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      beginDate = formatDateByPattern(
        new Date(Math.min(minDataDate.getTime(), fromDate.getTime())),
        "YYYY-MM-DD"
      );
      endDate = formatDateByPattern(
        new Date(Math.max(maxDataDate.getTime(), toDate.getTime())),
        "YYYY-MM-DD"
      );
    }

    deleteUpsertMany(
      {
        patientId: patient.id,
        beginDate,
        endDate,
        vitalSignMeasurements: { items },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["vital-sign-measurements"],
          });
          dirtySetRef.current.clear();
          setIsDirty(false);
          setSelectedRows([]);
          success("바이탈이 저장되었습니다.");
          onSaveSuccess?.();
        },
        onError: (err) => {
          error("바이탈 저장 실패", err.message);
        },
      }
    );
  }, [
    data,
    vitalSignItems,
    vitalSubItemGroups,
    patient.id,
    from,
    to,
    period,
    deleteUpsertMany,
    queryClient,
    success,
    error,
    onSaveSuccess,
  ]);

  // 취소: 스냅샷에서 복원
  const handleCancel = useCallback(() => {
    const rows = buildRows(snapshotRef.current);
    setData(
      hasTodayMeasurement(snapshotRef.current)
        ? rows
        : [getEmptyRow(), ...rows]
    );
    dirtySetRef.current.clear();
    setIsDirty(false);
    setSelectedRows([]);
  }, [buildRows, getEmptyRow, hasTodayMeasurement]);

  // 부모에서 save/cancel 호출할 수 있도록 노출
  useImperativeHandle(
    ref,
    () => ({
      save: () => handleSave(),
      cancel: () => handleCancel(),
    }),
    [handleSave, handleCancel]
  );

  return (
    <div className="flex flex-col gap-2 p-2 w-full h-full">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          <PatientBasicInfoBadge patient={patient} />
          <MyDivideLine orientation="vertical" size="sm" className="h-4" />
          <div className="flex flex-row items-center gap-2">
            {period !== SearchPeriod.all && (
              <>
                <MyInput
                  type="date"
                  value={from}
                  onChange={(value) => {
                    setFrom(value);
                    setPeriod(SearchPeriod.Direct);
                  }}
                />
                <span className="text-[13px] text-[var(--gray-400)]">-</span>
                <MyInput
                  type="date"
                  value={to}
                  onChange={(value) => {
                    setTo(value);
                    setPeriod(SearchPeriod.Direct);
                  }}
                />
              </>
            )}
            <MySelect
              className="py-[3px]"
              options={SEARCH_PERIOD_OPTIONS}
              value={period}
              onChange={(value) => setPeriod(Number(value))}
            />
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <MyButton variant="outline" size="sm" onClick={handleAdd}>
            추가
          </MyButton>
          <MyButton
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={selectedRows.length === 0}
          >
            삭제
          </MyButton>

          <MyGridSettingButton
            defaultHeaders={getDefaultVitalHeaders(vitalSignItems)}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
        <MyPopupYesNo
          isOpen={isDeleteConfirmOpen}
          onCloseAction={() => setIsDeleteConfirmOpen(false)}
          onConfirmAction={handleDelete}
          hideHeader={true}
          title=""
          message="선택한 바이탈을 삭제하시겠습니까?"
          confirmText="삭제"
          children={
            <div className="text-sm text-[var(--gray-500)]">
              저장 버튼을 눌러야 실제로 반영됩니다.
            </div>
          }
        />
      </div>
      <div className="flex-1 flex w-full h-full border rounded-sm overflow-hidden">
        <MyGrid
          headers={headers}
          onHeadersChange={setHeaders}
          data={data}
          isLoading={isLoading || isSaving}
          onDataChange={handleDataChange}
          isRowSelectByCheckbox={true}
          onSelectedRowsChange={handleSelectedRows}
          enableCellNavigation={true}
          size="sm"
        />
      </div>
    </div>
  );
});

export default VitalGrid;
