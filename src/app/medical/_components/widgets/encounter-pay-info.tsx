import type { Encounter } from "@/types/chart/encounter-types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toKRW } from "@/lib/patient-utils";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { get총진료비, get본인부담금 } from "@/lib/calc-result-data-util";
import { MoneyIcon } from "@/components/custom-icons";
import MedicalBillInfo from "../panels/(medical-bill)/medical-bill-info";
import MedicalBillDetail from "../panels/(medical-bill)/medical-bill-detail";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import type { CalcResultData } from "@/types/chart/calc-result-data";

const PRICE_CLASS =
  "text-[var(--gray-200)]";

export default function EncounterPayInfo({
  encounter,
  size = "md",
  onSaveAndTransmit,
  onPrintAndTransmit,
}: {
  encounter: Encounter;
  size?: "sm" | "md" | "lg";
  onSaveAndTransmit?: () => void;
  onPrintAndTransmit?: () => void;
}) {
  const [openMedicalBillCalculator, setOpenMedicalBillCalculator] =
    useState(false);
  const [calcResultData, setCalcResultData] = useState<CalcResultData | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [patientBurdenAmount, setPatientBurdenAmount] = useState(0);

  const ICON_SIZE_CLASS = {
    sm: "w-[14px] h-[14px]",
    md: "w-[16px] h-[16px]",
    lg: "w-[18px] h-[18px]",
  };

  const DIVIDE_LINE_SIZE_CLASS = {
    sm: "h-[14px]",
    md: "h-[16px]",
    lg: "h-[18px]",
  };

  const TEXT_SIZE_CLASS = {
    sm: "text-[10px]",
    md: "text-[12px]",
    lg: "text-[14px]",
  };

  useEffect(() => {
    if (encounter.calcResultData) {
      setCalcResultData(encounter.calcResultData);
      setTotalAmount(get총진료비(encounter.calcResultData));
      setPatientBurdenAmount(get본인부담금(encounter.calcResultData));
    } else {
      setTotalAmount(0);
      setPatientBurdenAmount(0);
      setCalcResultData(null);
    }
  }, [encounter]);

  return (
    <>
      <MyTooltip side="top" activateBaseClassName={false} className="p-0 w-[250px]" content={calcResultData ? <MedicalBillDetail calcResultData={calcResultData} /> : null}>
        <div className="flex items-center flex-row gap-2 px-1 cursor-pointer hover:bg-[var(--purple-1)] rounded p-1"
          onClick={() => setOpenMedicalBillCalculator(true)}>
          <MoneyIcon className={ICON_SIZE_CLASS[size]} />
          <div
            className={cn(PRICE_CLASS, TEXT_SIZE_CLASS[size], "font-bold")}
          >
            {toKRW(totalAmount)}
          </div>
          <MyDivideLine
            orientation="vertical"
            size={size}
            className={DIVIDE_LINE_SIZE_CLASS[size]}
          />
          <div
            className={cn(PRICE_CLASS, TEXT_SIZE_CLASS[size])}
          >
            {toKRW(patientBurdenAmount)}
          </div>
        </div>
      </MyTooltip>
      <MedicalBillInfo
        isOpen={openMedicalBillCalculator}
        onCloseAction={() => setOpenMedicalBillCalculator(false)}
        encounter={encounter}
        onSaveAndTransmit={onSaveAndTransmit}
        onPrintAndTransmit={onPrintAndTransmit}
      />
    </>
  );
}