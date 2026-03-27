import { WidgetHeader } from "@/app/reception/_components/widgets/header";
import { Settings, LineChart } from "lucide-react";
import { useVitalAndBstReception } from "@/hooks/reception/patient-info/use-vital-and-bst-reception";
import type { Reception } from "@/types/common/reception-types";
import ReceptionVital from "./reception-vital";
import { cn } from "@/lib/utils";

interface VitalAndBstProps {
  reception?: Reception | null;
  receptionId?: string | null;
  onVitalMeasurementsChange: (measurements: any[]) => void;
  isDisabled?: boolean;
  onUpdateReception?: (updates: Partial<Reception>) => void;
  /** 마지막 포커스 섹션 하이라이트 */
  isHighlighted?: boolean;
}

export default function VitalAndBst({
  reception: externalReception,
  receptionId: externalReceptionId,
  onVitalMeasurementsChange,
  isDisabled = false,
  onUpdateReception,
  isHighlighted = false,
}: VitalAndBstProps) {
  const { selectedReception: currentReception } = useVitalAndBstReception({
    reception: externalReception,
    receptionId: externalReceptionId,
  });

  return (
    <div className={cn(
      "flex flex-col w-full  rounded-md border border-transparent transition-colors",
      "focus-within:border-[var(--main-color-2-1)] focus-within:bg-[var(--bg-base1)]",
      isHighlighted && "border-[var(--main-color-2-1)] bg-[var(--bg-base1)]"
    )}>
      {
        <ReceptionVital
          key={currentReception?.patientBaseInfo?.patientId ?? "none"}
          reception={currentReception}
          receptionId={externalReceptionId}
          onVitalMeasurementsChange={onVitalMeasurementsChange}
          isDisabled={isDisabled}
          onUpdateReception={onUpdateReception}
        />
      }
    </div>
  );
}


function Bst() {
  return (
    <div className="flex flex-col w-full">
      <WidgetHeader
        title="BST"
        right={
          <button className="p-3 bg-transparent border-none cursor-pointer">
            <Settings className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </button>
        }
      />
      <div className="pt-2 pr-2 pl-1">
        <div className="flex flex-col my-scroll border h-[10rem] rounded-md">
          <table className="min-w-full table-fixed">
            <thead className="bg-[var(--bg-secondary)] sticky top-0">
              <tr>
                <th className="p-1 w-20 text-xs font-normal whitespace-nowrap border-b">
                  측정일시
                </th>
                <th className="p-1 w-10 text-xs font-normal whitespace-nowrap border-r border-b border-l">
                  체온
                </th>
                <th className="p-1 w-10 text-xs font-normal whitespace-nowrap border-r border-b border-l">
                  맥박
                </th>
                <th className="p-1 w-10 text-xs font-normal whitespace-nowrap border-r border-b border-l">
                  혈압1
                </th>
                <th className="p-1 w-10 text-xs font-normal whitespace-nowrap border-b">
                  혈압2
                </th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
