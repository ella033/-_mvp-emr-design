"use client";

import { useState, useEffect, useMemo } from "react";
import { MySelect } from "../yjg/my-select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import type { VitalSignMeasurementPivotResponse } from "@/types/vital/vital-sign-measurement-types";
import { formatDateByPattern } from "@/lib/date-utils";
import MyCheckbox from "../yjg/my-checkbox";
import { safeLocalStorage, safeJsonParse } from "../yjg/common/util/ui-util";

const VITAL_CHART_SHOW_VALUE_KEY = "vital-chart-show-value";

// 혈압(BPS, BPD) 코드 상수
const BLOOD_PRESSURE_CODES = ["BPS", "BPD"];
const BPS_COLOR = "#3b82f6"; // 빨간색 (수축기)
const BPD_COLOR = "#00aea9"; // 파란색 (이완기)

interface ChartDataPoint {
  timestamp: string;
  value?: number;
  BPS?: number;
  BPD?: number;
}

interface VitalChartProps {
  vitalSignItems: VitalSignItem[];
  vitalSignMeasurements: VitalSignMeasurementPivotResponse;
}

export default function VitalChart({
  vitalSignItems,
  vitalSignMeasurements,
}: VitalChartProps) {
  const [selectedVitalSignItem, setSelectedVitalSignItem] =
    useState<VitalSignItem | null>(vitalSignItems[0] || null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isShowValue, setIsShowValue] = useState(() =>
    safeJsonParse(safeLocalStorage.getItem(VITAL_CHART_SHOW_VALUE_KEY), true)
  );

  // isShowValue 변경 시 localStorage에 저장
  const handleShowValueChange = (checked: boolean) => {
    setIsShowValue(checked);
    safeLocalStorage.setItem(
      VITAL_CHART_SHOW_VALUE_KEY,
      JSON.stringify(checked)
    );
  };

  // 선택된 항목이 혈압(BPS 또는 BPD)인지 확인
  const isBloodPressureSelected = useMemo(() => {
    return BLOOD_PRESSURE_CODES.includes(selectedVitalSignItem?.code || "");
  }, [selectedVitalSignItem]);

  // BPS, BPD 항목 찾기
  const bpsItem = useMemo(
    () => vitalSignItems.find((item) => item.code === "BPS"),
    [vitalSignItems]
  );
  const bpdItem = useMemo(
    () => vitalSignItems.find((item) => item.code === "BPD"),
    [vitalSignItems]
  );

  // Select 옵션 생성 (BPS와 BPD를 "혈압"으로 합침)
  const selectOptions = useMemo(() => {
    const options: { value: number; label: string }[] = [];
    let bloodPressureAdded = false;

    vitalSignItems.forEach((item) => {
      if (BLOOD_PRESSURE_CODES.includes(item.code)) {
        // BPS 또는 BPD인 경우, "혈압" 옵션을 한 번만 추가 (BPS의 id 사용)
        if (!bloodPressureAdded && bpsItem) {
          options.push({ value: bpsItem.id, label: "혈압" });
          bloodPressureAdded = true;
        }
      } else {
        options.push({ value: item.id, label: item.name });
      }
    });

    return options;
  }, [vitalSignItems, bpsItem]);

  useEffect(() => {
    // measurementDateTime 기준 오름차순 정렬
    const sortedMeasurements = [...vitalSignMeasurements].sort(
      (a, b) =>
        new Date(a.measurementDateTime).getTime() -
        new Date(b.measurementDateTime).getTime()
    );

    // 값을 안전하게 숫자로 변환 (없으면 undefined 반환)
    const parseValue = (
      value: string | number | null | undefined
    ): number | undefined => {
      if (value === undefined || value === null || value === "")
        return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };

    if (isBloodPressureSelected && bpsItem && bpdItem) {
      // 혈압 선택 시: BPS와 BPD를 함께 표시 (둘 중 하나라도 값이 있으면 포함)
      const convertedData = sortedMeasurements
        .map((measurement) => {
          const bpsValue = parseValue(
            measurement.measurements.find((m) => m.itemId === bpsItem.id)?.value
          );
          const bpdValue = parseValue(
            measurement.measurements.find((m) => m.itemId === bpdItem.id)?.value
          );
          return {
            timestamp: measurement.measurementDateTime,
            BPS: bpsValue,
            BPD: bpdValue,
          };
        })
        .filter((data) => data.BPS !== undefined || data.BPD !== undefined);
      setChartData(convertedData);
    } else {
      // 일반 항목: 단일 값 표시 (값이 있는 것만 포함)
      const convertedData = sortedMeasurements
        .map((measurement) => {
          const value = parseValue(
            measurement.measurements.find(
              (m) => m.itemId === selectedVitalSignItem?.id
            )?.value
          );
          return {
            timestamp: measurement.measurementDateTime,
            value,
          };
        })
        .filter((data) => data.value !== undefined);
      setChartData(convertedData);
    }
  }, [
    vitalSignItems,
    vitalSignMeasurements,
    selectedVitalSignItem,
    isBloodPressureSelected,
    bpsItem,
    bpdItem,
  ]);

  // Custom Label - 점 아래에 값을 네모난 박스로 표시
  const CustomLabel = ({
    x,
    y,
    value,
    fill,
  }: {
    x?: number;
    y?: number;
    value?: number;
    fill: string;
  }) => {
    if (
      value === undefined ||
      value === 0 ||
      x === undefined ||
      y === undefined
    )
      return null;
    return (
      <g>
        <rect
          x={x - 14}
          y={y + 8}
          width={28}
          height={16}
          rx={2}
          ry={2}
          fill={fill}
          opacity={0.9}
        />
        <text
          x={x}
          y={y + 19}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight="bold"
        >
          {value}
        </text>
      </g>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label: tooltipLabel }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-2 font-semibold">
            {formatDateByPattern(new Date(tooltipLabel), "YYYY-MM-DD HH:mm:ss")}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{" "}
              {isBloodPressureSelected
                ? bpsItem?.unit || ""
                : selectedVitalSignItem?.unit || ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-2 p-2 w-full h-full">
      <div className="flex flex-row items-center gap-2">
        <MySelect
          className="py-[3px]"
          options={selectOptions}
          value={selectedVitalSignItem?.id || ""}
          onChange={(value) =>
            setSelectedVitalSignItem(
              vitalSignItems.find((item) => item.id === Number(value)) || null
            )
          }
        />
        <MyCheckbox
          label="수치 보기"
          size="sm"
          checked={isShowValue}
          onChange={handleShowValueChange}
        />
      </div>
      <div className="flex-1 flex w-full h-full border rounded-sm overflow-hidden p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
              }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
              label={{
                value: isBloodPressureSelected
                  ? bpsItem?.unit || ""
                  : selectedVitalSignItem?.unit || "",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "10px",
              }}
              iconSize={12}
              iconType="line"
            />
            {isBloodPressureSelected ? (
              <>
                <Line
                  type="monotone"
                  dataKey="BPS"
                  stroke={BPS_COLOR}
                  strokeWidth={2}
                  dot={{ fill: BPS_COLOR, r: 4 }}
                  activeDot={{ r: 6, stroke: BPS_COLOR, strokeWidth: 2 }}
                  name={bpsItem?.name || "수축기 혈압"}
                  isAnimationActive={false}
                  connectNulls
                  label={
                    isShowValue
                      ? (props: any) => (
                        <CustomLabel {...props} fill={BPS_COLOR} />
                      )
                      : undefined
                  }
                />
                <Line
                  type="monotone"
                  dataKey="BPD"
                  stroke={BPD_COLOR}
                  strokeWidth={2}
                  dot={{ fill: BPD_COLOR, r: 4 }}
                  activeDot={{ r: 6, stroke: BPD_COLOR, strokeWidth: 2 }}
                  name={bpdItem?.name || "이완기 혈압"}
                  isAnimationActive={false}
                  connectNulls
                  label={
                    isShowValue
                      ? (props: any) => (
                        <CustomLabel {...props} fill={BPD_COLOR} />
                      )
                      : undefined
                  }
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={"#3b82f6"}
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                name={selectedVitalSignItem?.name || ""}
                isAnimationActive={false}
                connectNulls
                label={
                  isShowValue
                    ? (props: any) => <CustomLabel {...props} fill="#3b82f6" />
                    : undefined
                }
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
