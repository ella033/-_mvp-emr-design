import { useState } from "react";
import { cn } from "@/lib/utils";
import { MyButton } from "@/components/yjg/my-button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import MyDivideLine from "@/components/yjg/my-divide-line";
import type { Encounter } from "@/types/chart/encounter-types";
import { useDoctorsStore } from "@/store/doctors-store";
import { 보험구분상세, 보험구분상세Label } from "@/constants/common/common-enum";
import { 초재진_OPTIONS } from "@/constants/common/common-option";
import { useEncounterStore } from "@/store/encounter-store";
import { useUpdateEncounter } from "@/hooks/encounter/use-encounter-update";
import {
  getPrescriptionDetailTypes,
  처방상세구분,
} from "@/types/master-data/item-type";
import { getRepeatableOrders } from "@/lib/encounter-util";
import { StarIcon } from "@/components/custom-icons";



export default function EncounterHistoryItemHeader({
  isOpen,
  setIsOpen,
  encounter,
  isReception,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  encounter: Encounter;
  isReception: boolean;
}) {
  const { doctors } = useDoctorsStore();
  const {
    setNewSymptom,
    setNewDiseases,
    setNewOrders,
    updateEncounters,
  } = useEncounterStore();
  const { mutate: updateEncounter } = useUpdateEncounter();

  const [isFavorite, setIsFavorite] = useState(encounter?.isFavorite || false);
  const filterCommonClass =
    "text-[10px] whitespace-nowrap rounded-sm px-[3px] py-[1px]";

  const prescriptionDetailTypes = getPrescriptionDetailTypes(
    encounter.orders || []
  );
  const includeClassName = "font-bold text-[var(--fg-main)]";
  const excludeClassName = "font-light text-[var(--gray-700)]";

  const receptionDateTime = new Date(
    encounter.registration?.receptionDateTime || ""
  );
  const receptionYear = String(receptionDateTime.getFullYear());
  const receptionMonth = String(receptionDateTime.getMonth() + 1).padStart(
    2,
    "0"
  );
  const receptionDay = String(receptionDateTime.getDate()).padStart(2, "0");
  const receptionHours = String(receptionDateTime.getHours()).padStart(2, "0");
  const receptionMinutes = String(receptionDateTime.getMinutes()).padStart(
    2,
    "0"
  );
  const receptionSeconds = String(receptionDateTime.getSeconds()).padStart(
    2,
    "0"
  );

  const encounterDateTime = new Date(encounter.encounterDateTime || "");
  const encounterYear = String(encounterDateTime.getFullYear());
  const encounterMonth = String(encounterDateTime.getMonth() + 1).padStart(
    2,
    "0"
  );
  const encounterDay = String(encounterDateTime.getDate()).padStart(2, "0");
  const encounterHours = String(encounterDateTime.getHours()).padStart(2, "0");
  const encounterMinutes = String(encounterDateTime.getMinutes()).padStart(
    2,
    "0"
  );
  const encounterSeconds = String(encounterDateTime.getSeconds()).padStart(
    2,
    "0"
  );

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewSymptom(encounter?.symptom || "");
    setNewDiseases(encounter.diseases || []);
    setNewOrders(getRepeatableOrders(encounter.orders || []));
  };
  return (
    <div
      className={cn(
        "flex flex-col items-center p-2 gap-2",
        encounter.updateDateTime ? "bg-[var(--gray-white)]" : "bg-[var(--blue-1)]",
        isOpen ? "rounded-t-sm bg-[var(--bg-2)]" : "rounded-sm"
      )}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-row items-center gap-2 overflow-hidden text-ellipsis">
          {!isReception && (
            <MyButton
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                updateEncounter(
                  {
                    id: encounter.id,
                    data: {
                      registrationId: encounter.registrationId.toString(),
                      patientId: encounter.patientId,
                      isFavorite: !isFavorite,
                    },
                  },
                  {
                    onSuccess: () => {
                      setIsFavorite(!isFavorite);
                      updateEncounters({
                        ...encounter,
                        isFavorite: !isFavorite,
                      });
                    },
                  }
                );
              }}
            >
              <StarIcon
                filled={isFavorite}
                className={`w-[12px] h-[12px] ${isFavorite
                  ? "text-[var(--second-color)]"
                  : "text-[var(--gray-500)]"
                  }`}
              />
            </MyButton>
          )}
          {encounter?.registration?.receptionDateTime &&
            encounter?.encounterDateTime && (
              <MyTooltip
                content={
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-[var(--gray-700)]">접수일시</span>
                      <span>
                        {`${receptionYear}.${receptionMonth}.${receptionDay} ${receptionHours}:${receptionMinutes}:${receptionSeconds}`}
                      </span>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-[var(--gray-700)]">진료일시</span>
                      <span>
                        {`${encounterYear}.${encounterMonth}.${encounterDay} ${encounterHours}:${encounterMinutes}:${encounterSeconds}`}
                      </span>
                    </div>
                  </div>
                }
              >
                <div
                  className="text-sm text-[var(--gray-200)] font-[500] whitespace-nowrap"
                  onClick={isReception ? undefined : handleDateClick}
                >
                  {`${receptionYear.slice(-2)}.${receptionMonth}.${receptionDay}`}
                </div>
              </MyTooltip>
            )}
          <div className="text-sm text-[var(--gray-400)] font-[400] whitespace-nowrap">
            {doctors.find((doctor) => doctor.id === encounter?.doctorId)?.name}
          </div>
          <MyTooltip
            delayDuration={500}
            side="bottom"
            content={encounter.diseases?.[0]?.name || ""}
          >
            <div className="text-sm text-[var(--gray-300)] font-[500] truncate flex-1 min-w-0">
              {encounter.diseases?.[0]?.name || ""}
            </div>
          </MyTooltip>
        </div>
        <div className="flex flex-row items-center">
          <MyButton variant="ghost" size="icon">
            {isOpen ? (
              <ChevronUp className="w-[12px] h-[12px]" />
            ) : (
              <ChevronDown className="w-[12px] h-[12px]" />
            )}
          </MyButton>
        </div>
      </div>
      <div className="flex flex-row items-center px-1 gap-2 w-full">
        <div
          className={cn(
            filterCommonClass,
            "text-[var(--gray-100)] bg-[var(--fg-invert)]"
          )}
        >
          {
            초재진_OPTIONS.find(
              (option) =>
                option.value === (encounter?.receptionType ? encounter?.receptionType : encounter?.registration?.receptionType)
            )?.label
          }
        </div>
        <div
          className={cn(
            filterCommonClass,
            "text-[var(--blue-2)] bg-[var(--blue-1)]"
          )}
        >
          {encounter?.registration?.insuranceType != null &&
            보험구분상세Label[encounter?.registration?.insuranceType as 보험구분상세]}
        </div>
        <MyDivideLine orientation="vertical" className="h-[10px]" />
        <div
          className={cn(
            filterCommonClass,
            isOpen ? "bg-[var(--fg-invert)]" : "bg-[var(--bg-1)]",
            prescriptionDetailTypes.includes(처방상세구분.검사)
              ? includeClassName
              : excludeClassName
          )}
        >
          검
        </div>
        <div
          className={cn(
            filterCommonClass,
            isOpen ? "bg-[var(--fg-invert)]" : "bg-[var(--bg-1)]",
            prescriptionDetailTypes.includes(처방상세구분.주사)
              ? includeClassName
              : excludeClassName
          )}
        >
          주
        </div>
        <div
          className={cn(
            filterCommonClass,
            isOpen ? "bg-[var(--fg-invert)]" : "bg-[var(--bg-1)]",
            prescriptionDetailTypes.includes(처방상세구분.약)
              ? includeClassName
              : excludeClassName
          )}
        >
          약
        </div>
        <div
          className={cn(
            filterCommonClass,
            isOpen ? "bg-[var(--fg-invert)]" : "bg-[var(--bg-1)]",
            prescriptionDetailTypes.includes(처방상세구분.방사선)
              ? includeClassName
              : excludeClassName
          )}
        >
          방
        </div>
        <div
          className={cn(
            filterCommonClass,
            isOpen ? "bg-[var(--fg-invert)]" : "bg-[var(--bg-1)]",
            prescriptionDetailTypes.includes(처방상세구분.물리치료)
              ? includeClassName
              : excludeClassName
          )}
        >
          물
        </div>
      </div>
    </div>
  );
}