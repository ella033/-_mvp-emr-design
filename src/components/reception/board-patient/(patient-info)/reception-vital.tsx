import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { getDefaultVitalHeaders } from "@/components/vital/vital-header";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import { getInitialHeaders, saveHeaders } from "@/components/yjg/my-grid/my-grid-util";
import { formatDateByPattern } from "@/lib/date-utils";
import type { VitalPatientInfoType } from "@/store/selected-detail-patient-info-store";
import { useVitalAndBstReception } from "@/hooks/reception/patient-info/use-vital-and-bst-reception";
import type { Reception } from "@/types/common/reception-types";
import { useVitalSignItems } from "@/hooks/vital-sign-item/use-vital-sign-items";
import { cn } from "@/lib/utils";
import MyPopup, { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import VitalMain from "@/components/vital/vital-main";
import type { Patient } from "@/types/patient-types";
import React from "react";
import { useSelectedDate } from "@/store/reception/selected-date-store";
import { useSettingsStore } from "@/store/settings-store";

const LS_RECEPTION_VITAL_HEADERS_KEY = "reception-vital-headers";

interface ReceptionVitalProps {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  onVitalMeasurementsChange: (measurements: VitalPatientInfoType[]) => void;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (신규 환자 등 patientId가 없는 경우 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
}

export default function ReceptionVital({
  reception: externalReception,
  receptionId: externalReceptionId,
  onVitalMeasurementsChange,
  isDisabled = false,
  onUpdateReception,
}: ReceptionVitalProps) {
  const isBmiHeader = useCallback((headerKey: string) => headerKey === "BMI", []);

  const enforceBmiReadonly = useCallback(
    (nextHeaders: MyGridHeaderType[]) =>
      nextHeaders.map((header) =>
        isBmiHeader(String(header.key))
          ? { ...header, readonly: true }
          : header
      ),
    [isBmiHeader]
  );

  // Hook을 통해 reception 선택
  const {
    selectedReception: currentReception,
    markChangedOnce,
  } = useVitalAndBstReception({
    reception: externalReception,
    receptionId: externalReceptionId,
  });

  const { data: vitalSignItems = [] } = useVitalSignItems(true);
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);

  const [headers, setHeaders] = useState<MyGridHeaderType[]>([]);
  const [data, setData] = useState<MyGridRowType[]>([]);

  // vitalSignItems가 로드되면 headers 초기화/업데이트
  const vitalSignItemsKey = useMemo(
    () => vitalSignItems.map((item) => item.id).join(","),
    [vitalSignItems]
  );

  useEffect(() => {
    if (vitalSignItems.length === 0) return;

    const defaultVitalHeaders = getDefaultVitalHeaders(vitalSignItems).filter(
      (header) => header.key !== "measurementDate"
    );

    const customHeaders: MyGridHeaderType[] = [
      {
        key: "measurementDate",
        name: "일자",
        align: "left",
        width: 85,
        visible: true,
        readonly: true,
        sortNumber: 1,
      },
      {
        key: "measurementTime",
        name: "시간",
        align: "left",
        width: 65,
        visible: true,
        readonly: false,
        sortNumber: 2,
      },
      ...defaultVitalHeaders.map((header, idx) => ({
        ...header,
        minWidth: 0,
        sortNumber: (header.sortNumber ?? idx + 1) + 2,
      })),
    ];

    const initialHeaders = getInitialHeaders(
      LS_RECEPTION_VITAL_HEADERS_KEY,
      customHeaders
    );
    setHeaders(enforceBmiReadonly(initialHeaders));
  }, [vitalSignItemsKey, settingsLoaded, enforceBmiReadonly]);

  useEffect(() => {
    // 설정 로드 전 저장으로 기존 값이 덮어써지는 것을 방지
    if (!settingsLoaded) return;
    if (headers.length > 0) {
      saveHeaders(LS_RECEPTION_VITAL_HEADERS_KEY, headers);
    }
  }, [headers, settingsLoaded]);

  // vitalMeasurements를 직렬화하여 변경 감지 (무한 루프 방지)
  const vitalMeasurementsKey = useMemo(() => {
    const vitalMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
    return JSON.stringify(
      vitalMeasurements.map((m) => ({
        measurementDateTime: m.measurementDateTime,
        itemId: m.itemId,
        value: m.value,
      }))
    );
  }, [currentReception?.originalRegistrationId, currentReception?.bioMeasurementsInfo?.vital]);

  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);
  const [isVitalPopupOpen, setIsVitalPopupOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingEmptyRowDateTime, setPendingEmptyRowDateTime] = useState<string | null>(null);
  const pendingRowSourceRef = useRef<"auto" | "user" | null>(null);
  const addRowOffsetRef = useRef(0);
  const handleMeasurementTimeUpdateRef = useRef<(measurementDateTime: string, timeValue: string) => void>(() => {});
  const selectedDate = useSelectedDate();

  const selectedRowDateTimes = useMemo(
    () =>
      selectedRows
        .map((row) => {
          const iso = String(row.key);
          return {
            iso,
            label: `${formatDateByPattern(iso, "YYYY-MM-DD")} ${formatDateByPattern(
              iso,
              "HH:mm"
            )}`,
          };
        })
        .sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime()),
    [selectedRows]
  );

  const deleteConfirmMessage = useMemo(() => {
    if (!selectedRowDateTimes.length) return "선택한 바이탈을 삭제하시겠습니까?";
    const lines = selectedRowDateTimes.map((item) => `- ${item.label}`);
    return `다음 바이탈을 삭제하시겠습니까?\n${lines.join("\n")}`;
  }, [selectedRowDateTimes]);

  const filterValidMeasurements = useCallback(
    (measurements: VitalPatientInfoType[]) => {
      const grouped = measurements.reduce(
        (acc: Record<string, VitalPatientInfoType[]>, m) => {
          const dt = m.measurementDateTime;
          if (!acc[dt]) acc[dt] = [];
          acc[dt].push(m);
          return acc;
        },
        {}
      );

      const filtered: VitalPatientInfoType[] = [];
      Object.values(grouped).forEach((group) => {
        const hasValue = group.some((m) => parseFloat(String(m.value)) > 0);
        if (hasValue) {
          filtered.push(...group);
        }
      });
      return filtered;
    },
    []
  );

  const getCurrentDateTimeIso = useCallback(
    (offsetSeconds = 0) => {
      const base = selectedDate ? new Date(selectedDate) : new Date();
      const now = new Date();
      base.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds() + offsetSeconds,
        now.getMilliseconds()
      );
      return base.toISOString();
    },
    [selectedDate]
  );

  const patientForPopup = useMemo<Patient | null>(() => {
    const base = currentReception?.patientBaseInfo;
    if (!base) return null;
    return {
      id: Number(base.patientId) || 0,
      uuid: "",
      hospitalId: base.hospitalId ?? 0,
      loginId: null,
      password: null,
      name: base.name,
      rrn: base.rrn || "",
      rrnView: null,
      rrnHash: null,
      age: base.age ?? null,
      gender: base.gender ?? null,
      phone1: base.phone1,
      phone2: base.phone2 ?? null,
      address1: base.address,
      address2: base.address2,
      zipcode: base.zipcode,
      idNumber: base.idNumber ?? null,
      idType: base.idType ?? null,
      patientType: null,
      groupId: base.groupId ?? null,
      birthDate: base.birthday
        ? base.birthday.toISOString().split("T")[0]
        : null,
      chronicDisease: null,
      memo: base.patientMemo ?? null,
      symptom: null,
      clinicalMemo: base.clinicalMemo ?? null,
      visitRoute: null,
      recommender: base.recommender ?? null,
      doctorId: base.doctorId ?? null,
      isActive: base.isActive,
      isTemporary: false,
      receptionMemo: base.receptionMemo ?? "",
      lastEncounterDate: base.lastVisit ?? null,
      createId: 0,
      createDateTime: new Date().toISOString(),
      updateId: null,
      updateDateTime: null,
      consent: null,
      vitalSignMeasurements: [],
      fatherRrn: base.fatherRrn,
      identityVerifiedAt: base.identityVerifiedAt ?? null,
      eligibilityCheck: base.eligibilityCheck,
      nextAppointmentDateTime: base.nextAppointmentDateTime ?? null,
    } as Patient;
  }, [currentReception?.patientBaseInfo]);

  const combineDateAndTime = useCallback(
    (dateTimeIso: string, timeValue: string) => {
      const baseDate = selectedDate
        ? new Date(
          new Date(selectedDate).getFullYear(),
          new Date(selectedDate).getMonth(),
          new Date(selectedDate).getDate()
        )
        : new Date(dateTimeIso);

      const now = new Date();
      if (!timeValue) {
        baseDate.setHours(
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          0
        );
        return baseDate.toISOString();
      }

      const [hh, mm, ss] = timeValue.split(":");
      const hours = Number(hh);
      const minutes = Number(mm);
      const seconds = Number(ss ?? "0");
      if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        Number.isNaN(seconds)
      ) {
        return baseDate.toISOString();
      }
      baseDate.setHours(hours, minutes, seconds, 0);
      return baseDate.toISOString();
    },
    [selectedDate]
  );

  useEffect(() => {
    addRowOffsetRef.current = 0;
  }, [vitalMeasurementsKey]);

  const mergeEntries = useCallback(
    (
      existing: VitalPatientInfoType[],
      entries: VitalPatientInfoType[]
    ): VitalPatientInfoType[] => {
      const map: Record<string, VitalPatientInfoType> = {};
      [...existing, ...entries].forEach((e) => {
        const key = `${e.measurementDateTime}-${e.itemId}`;
        map[key] = e;
      });
      return Object.values(map);
    },
    []
  );

  const createEmptyEntries = useCallback(
    (measurementDateTime: string) =>
      vitalSignItems.map((item) => ({
        id: "0",
        measurementDateTime,
        itemId: item.id,
        value: "0",
        memo: "",
      })),
    [vitalSignItems]
  );

  const mapToReceptionVitals = useCallback(
    (measurements: VitalPatientInfoType[]) =>
      measurements
        .map((m) => {
          const item = vitalSignItems.find((i) => i.id === m.itemId);
          if (!item) return null;
          return {
            ...m,
            vitalSignItem: item,
          };
        })
        .filter(Boolean) as any[],
    [vitalSignItems]
  );

  const propagateMeasurements = useCallback(
    (
      measurements: VitalPatientInfoType[],
      options?: { allowEmpty?: boolean }
    ) => {
      const filtered = filterValidMeasurements(measurements);
      // value가 0인 항목은 저장 데이터에서 제외 (존재하지 않는 데이터로 간주)
      const toSave = filtered.filter((m) => parseFloat(String(m.value)) > 0);
      if (toSave.length === 0) {
        // 모든 값이 0이면 저장/전파하지 않음 (표시만 유지)
        if (options?.allowEmpty) {
          onVitalMeasurementsChange([]);
          if (currentReception && onUpdateReception) {
            onUpdateReception({
              bioMeasurementsInfo: {
                ...currentReception.bioMeasurementsInfo,
                vital: [],
              },
            });
          }
        }
        return;
      }

      onVitalMeasurementsChange(toSave);
      if (currentReception && onUpdateReception) {
        onUpdateReception({
          bioMeasurementsInfo: {
            ...currentReception.bioMeasurementsInfo,
            vital: mapToReceptionVitals(toSave),
          },
        });
      }
    },
    [currentReception, onUpdateReception, onVitalMeasurementsChange, mapToReceptionVitals, filterValidMeasurements]
  );

  const MAX_VISIBLE_ROWS = 3;

  const selectedDateKey = useMemo(
    () => (selectedDate ? formatDateByPattern(selectedDate, "YYYY-MM-DD") : null),
    [selectedDate]
  );

  const toKstDateKey = useCallback((iso: string) => {
    const date = new Date(iso);
    const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10);
  }, []);

  const getDisplayMeasurements = useCallback(
    (
      measurements: VitalPatientInfoType[],
      pendingDateTime: string | null
    ) => {
      const baseList = selectedDateKey
        ? measurements.filter(
          (m) => toKstDateKey(m.measurementDateTime) === selectedDateKey
        )
        : [...measurements];
      const sortedDates = Array.from(
        new Set(baseList.map((m) => m.measurementDateTime))
      ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const maxRows = pendingDateTime ? MAX_VISIBLE_ROWS - 1 : MAX_VISIBLE_ROWS;
      const limitedDates = sortedDates.slice(0, Math.max(0, maxRows));
      let filtered = baseList.filter((m) =>
        limitedDates.includes(m.measurementDateTime)
      );

      if (pendingDateTime) {
        filtered = [
          ...createEmptyEntries(pendingDateTime),
          ...filtered,
        ];
      }

      return filtered;
    },
    [MAX_VISIBLE_ROWS, createEmptyEntries, selectedDateKey, toKstDateKey]
  );

  const isPendingRow = useCallback(
    (measurementDateTime: string) => {
      if (!pendingEmptyRowDateTime) return false;
      if (measurementDateTime !== pendingEmptyRowDateTime) return false;
      const existingMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
      return !existingMeasurements.some(
        (m) => m.measurementDateTime === measurementDateTime
      );
    },
    [pendingEmptyRowDateTime, currentReception?.bioMeasurementsInfo?.vital]
  );

  const buildGridData = useCallback(
    (
      measurements: VitalPatientInfoType[],
      onTimeChange: (measurementDateTime: string, timeValue: string) => void
    ): MyGridRowType[] => {
      const grouped = measurements.reduce(
        (acc: Record<string, VitalPatientInfoType[]>, measurement) => {
          const dt = measurement.measurementDateTime;
          if (!acc[dt]) acc[dt] = [];
          acc[dt].push(measurement);
          return acc;
        },
        {}
      );

      const sortedEntries = Object.entries(grouped)
        .sort(([dtA], [dtB]) => new Date(dtB).getTime() - new Date(dtA).getTime())
        .slice(0, MAX_VISIBLE_ROWS);

      return sortedEntries.map(([measurementDateTime, rowMeasurements], index) => {
        const cells = [
          {
            headerKey: "measurementDate",
            value: formatDateByPattern(
              measurementDateTime,
              "YYYY-MM-DD"
            ),
            inputType: "date" as const,
          },
          {
            headerKey: "measurementTime",
            value: formatDateByPattern(measurementDateTime, "HH:mm"),
            inputType: "text" as const,
            textOption: { maxLength: 5 },
            customRender: (
              <MeasurementTimeCell
                value={formatDateByPattern(measurementDateTime, "HH:mm")}
                disabled={isDisabled}
                onChange={(next) =>
                  onTimeChange(measurementDateTime, next)
                }
              />
            ),
          },
        ];

        vitalSignItems.forEach((item) => {
          const measurement = rowMeasurements.find((m) => m.itemId === item.id);
          const value = measurement?.value ?? "0";
          const maxIntegerDigits = item.maxIntegerDigits || 0;
          const max =
            maxIntegerDigits > 0
              ? Math.pow(10, maxIntegerDigits) - 1
              : undefined;

          cells.push({
            headerKey: item.code,
            value,
            orgData: measurement,
            inputType: "textNumber" as const,
            textNumberOption: {
              pointPos: item.maxDecimalDigits || 0,
              max,
            },
          } as any);
        });

        return {
          rowIndex: index,
          key: measurementDateTime,
          cells,
        };
      });
    },
    [vitalSignItems, isDisabled]
  );

  const handleMeasurementTimeUpdate = useCallback(
    (measurementDateTime: string, timeValue: string) => {
      if (isDisabled) return;

      const nextDateTime = combineDateAndTime(measurementDateTime, timeValue);
      if (isPendingRow(measurementDateTime)) {
        setPendingEmptyRowDateTime(nextDateTime);
        const vitalMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
        const validMeasurements = filterValidMeasurements(vitalMeasurements);
        const display = getDisplayMeasurements(validMeasurements, nextDateTime);
        setData(buildGridData(display, handleMeasurementTimeUpdate));
        return;
      }

      markChangedOnce();
      const existingMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
      const updated = existingMeasurements.map((m) =>
        m.measurementDateTime === measurementDateTime
          ? { ...m, measurementDateTime: nextDateTime }
          : m
      );
      const filled = mergeEntries(updated, createEmptyEntries(nextDateTime));
      const display = getDisplayMeasurements(filled, null);
      setData(buildGridData(display, handleMeasurementTimeUpdate));
      propagateMeasurements(filled);
    },
    [
      isDisabled,
      markChangedOnce,
      currentReception?.bioMeasurementsInfo?.vital,
      combineDateAndTime,
      mergeEntries,
      createEmptyEntries,
      getDisplayMeasurements,
      propagateMeasurements,
      buildGridData,
      filterValidMeasurements,
      isPendingRow,
    ]
  );

  // ref를 통해 최신 handleMeasurementTimeUpdate를 참조 (useEffect 의존성 순환 방지)
  handleMeasurementTimeUpdateRef.current = handleMeasurementTimeUpdate;

  // vitalMeasurements가 변경될 때 data 업데이트
  useEffect(() => {
    if (!vitalSignItems.length) return;
    const vitalMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
    const validMeasurements = filterValidMeasurements(vitalMeasurements);

    const hasPendingInStore =
      pendingEmptyRowDateTime &&
      vitalMeasurements.some(
        (m) => m.measurementDateTime === pendingEmptyRowDateTime
      );

    let nextPending = pendingEmptyRowDateTime;
    if (hasPendingInStore) {
      nextPending = null;
      pendingRowSourceRef.current = null;
    } else if (!nextPending && validMeasurements.length === 0) {
      nextPending = getCurrentDateTimeIso();
      pendingRowSourceRef.current = "auto";
    } else if (
      nextPending &&
      validMeasurements.length > 0 &&
      pendingRowSourceRef.current === "auto"
    ) {
      nextPending = null;
      pendingRowSourceRef.current = null;
    }

    if (nextPending !== pendingEmptyRowDateTime) {
      setPendingEmptyRowDateTime(nextPending);
    }

    const rowsForDisplay = getDisplayMeasurements(
      validMeasurements,
      nextPending
    );
    setData(buildGridData(rowsForDisplay, (...args) => handleMeasurementTimeUpdateRef.current(...args)));
  }, [
    vitalMeasurementsKey,
    vitalSignItemsKey,
    buildGridData,
    filterValidMeasurements,
    getDisplayMeasurements,
    vitalSignItems.length,
    pendingEmptyRowDateTime,
    getCurrentDateTimeIso,
  ]);

  const handleDataChange = useCallback(
    (
      rowKey: string | number,
      columnKey: string,
      value: string | number | boolean
    ) => {
      // disabled 상태일 때는 변경 불가
      if (isDisabled) return;

      const existingMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
      const measurementDateTime = String(rowKey);

      if (columnKey === "measurementTime") {
        handleMeasurementTimeUpdate(measurementDateTime, String(value));
        return;
      }

      if (isBmiHeader(columnKey)) {
        return;
      }

      const vitalSignItem = vitalSignItems.find((item) => item.code === columnKey);
      if (!vitalSignItem) return;

      const parsedValue = parseFloat(String(value));
      const safeValue = Number.isNaN(parsedValue) ? 0 : parsedValue;
      const pendingRow = isPendingRow(measurementDateTime);

      if (pendingRow && safeValue <= 0) {
        const validMeasurements = filterValidMeasurements(existingMeasurements);
        const display = getDisplayMeasurements(
          validMeasurements,
          measurementDateTime
        );
        setData(buildGridData(display, handleMeasurementTimeUpdate));
        return;
      }

      if (pendingRow) {
        markChangedOnce();
        const seedEntries = createEmptyEntries(measurementDateTime).map((entry) =>
          entry.itemId === vitalSignItem.id
            ? { ...entry, value: safeValue.toString() }
            : entry
        );
        const merged = mergeEntries(existingMeasurements, seedEntries);
        setPendingEmptyRowDateTime(null);
        const display = getDisplayMeasurements(
          filterValidMeasurements(merged),
          null
        );
        setData(buildGridData(display, handleMeasurementTimeUpdate));
        propagateMeasurements(merged);
        return;
      }

      // 변경 감지: 한 번만 markReceptionAsChanged 호출
      markChangedOnce();

      const existingEntry = existingMeasurements.find(
        (m) =>
          m.measurementDateTime === measurementDateTime &&
          m.itemId === vitalSignItem.id
      );

      const entry: VitalPatientInfoType = existingEntry
        ? {
          ...existingEntry,
          value: safeValue.toString(),
        }
        : {
          id: "0",
          measurementDateTime,
          itemId: vitalSignItem.id,
          value: safeValue.toString(),
          memo: "",
        };

      const merged = mergeEntries(existingMeasurements, [entry]);
      setData(buildGridData(merged, handleMeasurementTimeUpdate));
      propagateMeasurements(merged);
    },
    [
      isDisabled,
      markChangedOnce,
      currentReception?.bioMeasurementsInfo?.vital,
      vitalSignItems,
      createEmptyEntries,
      mergeEntries,
      propagateMeasurements,
      buildGridData,
      filterValidMeasurements,
      getDisplayMeasurements,
      handleMeasurementTimeUpdate,
      isBmiHeader,
      isPendingRow,
    ]
  );

  const handleSelectedRowsChange = useCallback(
    (rows?: MyGridRowType[], isClickOutside?: boolean) => {
      if (isClickOutside) {
        return;
      }
      const next = rows ?? selectedRows;
      setSelectedRows(next);
    },
    [selectedRows]
  );

  const handleAddRow = useCallback(() => {
    if (isDisabled || !vitalSignItems.length) return;
    if (pendingEmptyRowDateTime) return;
    const offsetSeconds = addRowOffsetRef.current++;
    const nextDateTime = getCurrentDateTimeIso(offsetSeconds);

    const existingMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
    const validMeasurements = filterValidMeasurements(existingMeasurements);
    setPendingEmptyRowDateTime(nextDateTime);
    pendingRowSourceRef.current = "user";
    const display = getDisplayMeasurements(validMeasurements, nextDateTime);
    setData(buildGridData(display, handleMeasurementTimeUpdate));
  }, [
    isDisabled,
    vitalSignItems.length,
    currentReception?.bioMeasurementsInfo?.vital,
    pendingEmptyRowDateTime,
    getDisplayMeasurements,
    buildGridData,
    filterValidMeasurements,
    getCurrentDateTimeIso,
    handleMeasurementTimeUpdate,
  ]);

  const handleDeleteRows = useCallback(() => {
    if (isDisabled || selectedRows.length === 0) return;
    markChangedOnce();

    const removeKeys = new Set(selectedRows.map((row) => String(row.key)));
    const existingMeasurements = currentReception?.bioMeasurementsInfo?.vital || [];
    const filtered = existingMeasurements.filter(
      (m) => !removeKeys.has(m.measurementDateTime)
    );

    if (filtered.length === 0) {
      const nextPending = getCurrentDateTimeIso();
      setPendingEmptyRowDateTime(nextPending);
      pendingRowSourceRef.current = "auto";
      const display = getDisplayMeasurements([], nextPending);
      setData(buildGridData(display, handleMeasurementTimeUpdate));
    } else {
      const display = getDisplayMeasurements(filtered, null);
      setData(buildGridData(display, handleMeasurementTimeUpdate));
    }
    propagateMeasurements(filtered, { allowEmpty: true });
    setSelectedRows([]);
    setIsDeleteConfirmOpen(false);
  }, [
    isDisabled,
    selectedRows,
    markChangedOnce,
    currentReception?.bioMeasurementsInfo?.vital,
    createEmptyEntries,
    getDisplayMeasurements,
    propagateMeasurements,
    buildGridData,
    handleMeasurementTimeUpdate,
    getCurrentDateTimeIso,
  ]);

  return (
    <div className={cn("flex flex-col w-full h-full gap-2", isDisabled && "pointer-events-none opacity-50")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-2 pl-2">
          <div className="text-[13px] font-semibold text-[var(--gray-100)] leading-none">
            바이탈
          </div>
          <button
            type="button"
            className="text-sm text-[var(--gray-400)] bg-transparent border-none px-1 py-0.5 cursor-pointer"
            onClick={() => setIsVitalPopupOpen(true)}
            disabled={!patientForPopup}
          >
            + 더보기
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border border-[var(--border-1)] text-xs text-[var(--gray-100)] bg-transparent rounded-sm px-1.5 py-0.5 cursor-pointer"
            onClick={handleAddRow}
            disabled={isDisabled}
          >
            추가
          </button>
          <button
            type="button"
            className="border border-[var(--border-1)] text-xs text-[var(--gray-100)] bg-transparent rounded-sm px-1.5 py-0.5 cursor-pointer"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={isDisabled || selectedRows.length === 0}
          >
            삭제
          </button>
        </div>
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden p-2 pt-0">
        <MyGrid
          headers={headers}
          onHeadersChange={
            isDisabled
              ? undefined
              : (nextHeaders) => setHeaders(enforceBmiReadonly(nextHeaders))
          }
          data={data}
          isLoading={false}
          onDataChange={handleDataChange}
          onSelectedRowsChange={handleSelectedRowsChange}
          enableCellNavigation={true}
          enterSkipHeaderKeys={["BMI"]}
          size="sm"
        />
      </div>
      <MyPopupYesNo
        isOpen={isDeleteConfirmOpen}
        onCloseAction={() => setIsDeleteConfirmOpen(false)}
        onConfirmAction={handleDeleteRows}
        title="바이탈 삭제"
        message={deleteConfirmMessage}
        confirmText="삭제"
        cancelText="취소"
        hideHeader
      />
      {isVitalPopupOpen && patientForPopup && (
        <MyPopup
          isOpen={isVitalPopupOpen}
          onCloseAction={() => setIsVitalPopupOpen(false)}
          title="바이탈 기록"
          localStorageKey="reception-vital-popup"
          width="900px"
          height="700px"
          minWidth="600px"
          minHeight="600px"
          closeOnOutsideClick={false}
        >
          <VitalMain patient={patientForPopup} onClose={() => setIsVitalPopupOpen(false)} />
        </MyPopup>
      )}
    </div>
  );
}

function MeasurementTimeCell({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = React.useState(value);
  const timeInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const normalizeTime = (val: string) => {
    const match = val.match(/^(\d{1,2}):?(\d{0,2})$/);
    if (!match) return localValue;
    const hours = Math.min(23, Math.max(0, Number(match[1] ?? "0")));
    const minutes = Math.min(59, Math.max(0, Number(match[2] ?? "0")));
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const commit = (next: string) => {
    const normalized = normalizeTime(next);
    setLocalValue(normalized);
    onChange(normalized);
  };

  return (
    <div className="flex items-center w-full px-[2px] relative">
      <input
        type="text"
        className={cn(
          "w-full border-none bg-transparent px-1 py-1 text-right text-[12px]",
          disabled && "text-[var(--gray-400)]"
        )}
        value={localValue}
        readOnly={disabled}
        onChange={(e) => setLocalValue(e.target.value.slice(0, 5))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
      />
      <button
        type="button"
        className="p-0.5 text-[var(--gray-400)] hover:text-[var(--fg-main)] disabled:opacity-50"
        onClick={() => {
          if (disabled) return;
          const timeEl = timeInputRef.current;
          if (!timeEl) return;
          if (typeof (timeEl as any).showPicker === "function") {
            (timeEl as any).showPicker();
          } else {
            timeEl.click();
          }
        }}
        disabled={disabled}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <input
        ref={timeInputRef}
        type="time"
        className="absolute right-1 top-0 w-[1px] h-[1px] opacity-0"
        value={localValue}
        onChange={(e) => commit(e.target.value)}
      />
    </div>
  );
}