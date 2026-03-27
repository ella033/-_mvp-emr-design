import { useCallback, useState } from "react";
import { useEncounterStore } from "@/store/encounter-store";
import { useUpdateEncounter } from "@/hooks/encounter/use-encounter-update";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { MyButton } from "@/components/yjg/my-button";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderFixToggleButton() {
  const { selectedEncounter, setSelectedEncounter } = useEncounterStore();
  const [isOrderFixLoading, setIsOrderFixLoading] = useState(false);
  const { mutate: updateEncounter } = useUpdateEncounter();

  const handleOrderFixed = useCallback(() => {
    if (selectedEncounter) {
      setIsOrderFixLoading(true);

      const body = {
        registrationId: selectedEncounter.registrationId.toString(),
        patientId: selectedEncounter.patientId,
        isOrderFixed: !selectedEncounter.isOrderFixed,
      };
      updateEncounter(
        {
          id: selectedEncounter.id,
          data: body,
        },
        {
          onSuccess: () => {
            if (selectedEncounter) {
              selectedEncounter.isOrderFixed = !selectedEncounter.isOrderFixed;
              setSelectedEncounter(selectedEncounter);
            }
          },
          onSettled: () => {
            setIsOrderFixLoading(false);
          },
        }
      );
    }
  }, [selectedEncounter, updateEncounter, setSelectedEncounter]);

  return (
    <MyTooltip
      content={"처방 고정이 활성화되면 자동산정코드가 반영되지 않습니다."}
    >
      {isOrderFixLoading ? (
        <div className="flex items-center justify-center">
          <MyLoadingSpinner size="sm" />
        </div>
      ) : (
        <MyButton onClick={handleOrderFixed} variant="ghost" size="icon" className="p-[3px]">
          <Pin
            className={cn(
              "w-[12px] h-[12px]",
              selectedEncounter?.isOrderFixed ? "[&_path]:fill-[var(--main-color)] rotate-0" : "[&_path]:fill-none rotate-45"
            )}
          />
        </MyButton>
      )}
    </MyTooltip>
  );
}
