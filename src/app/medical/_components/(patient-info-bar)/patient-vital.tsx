import React, { useState } from "react";
import type { Patient } from "@/types/patient-types";
import MyPopup from "@/components/yjg/my-pop-up";
import VitalMain from "@/components/vital/vital-main";
import type { VitalSignMeasurementPivotResponse } from "@/types/vital/vital-sign-measurement-types";
import { useMemo } from "react";
import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import MyDivideLine from "@/components/yjg/my-divide-line";

interface PatientVitalProps {
  patient: Patient;
  vitalSignItems: VitalSignItem[];
  vitalSignMeasurementsPivot: VitalSignMeasurementPivotResponse;
}

export default function PatientVital({
  patient,
  vitalSignItems,
  vitalSignMeasurementsPivot,
}: PatientVitalProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  // isActive가 true인 항목만 필터링하고 sortNumber 순으로 정렬
  const activeVitalSignItems = useMemo(() => {
    return vitalSignItems
      .filter((item) => item.vitalSignItemSettings[0]?.isActive === true)
      .sort(
        (a, b) =>
          (a.vitalSignItemSettings[0]?.sortNumber ?? 0) -
          (b.vitalSignItemSettings[0]?.sortNumber ?? 0)
      );
  }, [vitalSignItems]);

  // Pivot: 날짜별로 피벗된 배열 → [0]이 최신(첫 번째) 측정. 이 배열이 바뀔 때마다 displayItems 재계산되도록 의존성에 포함
  const firstMeasurement = vitalSignMeasurementsPivot[0];

  // 표시할 바이탈 항목 매핑 (code -> name)
  const vitalNameMap: Record<string, string> = {
    BT: "체온",
    PR: "맥박",
    BPS: "수축기혈압",
    BPD: "이완기혈압",
    BW: "체중",
  };

  // 혈압은 BPS와 BPD를 합쳐서 표시
  const bloodPressureSystolicItem = activeVitalSignItems.find(
    (item) => item.code === "BPS"
  );
  const bloodPressureDiastolicItem = activeVitalSignItems.find(
    (item) => item.code === "BPD"
  );

  // 혈압 값 가져오기
  const bloodPressureSystolic = bloodPressureSystolicItem
    ? firstMeasurement?.measurements.find((item) => item.itemCode === "BPS")
      ?.value
    : null;
  const bloodPressureDiastolic = bloodPressureDiastolicItem
    ? firstMeasurement?.measurements.find((item) => item.itemCode === "BPD")
      ?.value
    : null;

  // 표시할 바이탈 항목 리스트 생성 (BPD는 BPS에 포함되므로 제외). value가 있을 때만 추가
  const hasValue = (v: string | null | undefined) =>
    v != null && String(v).trim() !== "";

  const displayItems = useMemo(() => {
    const items: { code: string; name: string; value: string }[] = [];
    const processedCodes = new Set<string>();

    for (const item of activeVitalSignItems) {
      if (
        processedCodes.has(item.code) ||
        vitalNameMap[item.code] === undefined
      )
        continue;

      if (item.code === "BPS" || item.code === "BPD") {
        // 혈압은 BPS를 기준으로 한 번만 추가 (수축기 또는 이완기 값이 있을 때만)
        if (!processedCodes.has("BPS") && !processedCodes.has("BPD")) {
          if (hasValue(bloodPressureSystolic) || hasValue(bloodPressureDiastolic)) {
            items.push({
              code: "BP",
              name: "혈압",
              value: `${bloodPressureSystolic ?? "-"}/${bloodPressureDiastolic ?? "-"}`,
            });
          }
          processedCodes.add("BPS");
          processedCodes.add("BPD");
        }
      } else {
        const measurementValue = firstMeasurement?.measurements.find(
          (m) => m.itemCode === item.code
        )?.value;
        if (hasValue(measurementValue)) {
          items.push({
            code: item.code,
            name: vitalNameMap[item.code] ?? item.name,
            value: measurementValue?.toString() ?? "-",
          });
        }
        processedCodes.add(item.code);
      }
    }

    return items;
  }, [
    activeVitalSignItems,
    vitalSignMeasurementsPivot,
    firstMeasurement,
    bloodPressureSystolic,
    bloodPressureDiastolic,
  ]);

  return (
    <>
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-[var(--purple-1)] rounded p-1"
        onClick={() => setIsPopupOpen(true)}
      >
        <div className="text-[12px] font-[500] flex items-center justify-center border border-[var(--border-1)] bg-[var(--gray-white)] rounded-[4px] px-[4px] py-[1px]">
          바이탈
        </div>
        {displayItems.map((item) => (
          <PatientVitalItem key={item.code} name={item.name} value={item.value} />
        ))}
        {isPopupOpen && (
          <MyPopup
            isOpen={isPopupOpen}
            onCloseAction={() => setIsPopupOpen(false)}
            title="바이탈 기록"
            localStorageKey="vital-chart-popup"
            width="900px"
            height="700px"
            minWidth="600px"
            minHeight="600px"
            closeOnOutsideClick={false}
          >
            <VitalMain patient={patient} onClose={() => setIsPopupOpen(false)} />
          </MyPopup>
        )}
      </div>
      <MyDivideLine orientation="vertical" size="sm" className="h-[16px]" />
    </>
  );
}

function PatientVitalItem({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex gap-1 items-center">
      <div className="text-[12px] flex items-center text-[var(--gray-400)]">
        {name}
      </div>
      <div className="text-[12px] flex items-center font-[500] text-[var(--gray-300)]">{value}</div>
    </div>
  );
}
