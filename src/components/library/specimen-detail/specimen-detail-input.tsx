import { useEffect, useState } from "react";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import SpecimenDetailPopup from "./specimen-detail-popup";
import { cn } from "@/lib/utils";
import { MyTooltip } from "@/components/yjg/my-tooltip";

interface SpecimenDetailInputProps {
  specimenDetailsJson: string;
  onChange: (string: string) => void;
  readonly?: boolean;
}

export default function SpecimenDetailInput({
  specimenDetailsJson,
  onChange,
  readonly = false,
}: SpecimenDetailInputProps) {
  const [specimenDetails, setSpecimenDetails] = useState<SpecimenDetail[]>([]);
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    try {
      if (specimenDetailsJson && specimenDetailsJson !== `""`) {
        let parsed: any;
        try {
          parsed = JSON.parse(specimenDetailsJson);
          // 만약 파싱 결과가 문자열이면 한 번 더 파싱
          if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
          }
        } catch (parseError) {
          setSpecimenDetails([]);
          return;
        }

        // 배열인지 확인하고 타입 캐스팅
        if (Array.isArray(parsed)) {
          setSpecimenDetails(parsed as SpecimenDetail[]);
        } else {
          setSpecimenDetails([]);
        }
      } else {
        setSpecimenDetails([]);
      }
    } catch (error) {
      console.error("specimen-detail-input", error);
      setSpecimenDetails([]);
    }
  }, [specimenDetailsJson]);

  const handleSetSpecimenDetails = (value: SpecimenDetail[]) => {
    setSpecimenDetails(value);
    onChange(JSON.stringify(value));
  };

  const getSpecimenDetailValue = () => {
    if (specimenDetails.length === 1) {
      return specimenDetails[0]?.name;
    } else if (specimenDetails.length > 1) {
      return `${specimenDetails[0]?.name} 외 ${specimenDetails.length - 1}건`;
    } else {
      return "";
    }
  };

  if (readonly) {
    return (
      <MyTooltip content={getSpecimenDetailValue()}>
        <div
          className={cn(
            "flex flex-1 items-center justify-center px-2 py-1 min-w-0 h-full text-[12px] text-ellipsis overflow-hidden whitespace-nowrap cursor-default"
          )}
        >
          {getSpecimenDetailValue() || "\u00A0"}
        </div>
      </MyTooltip>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-1 items-center justify-center px-2 py-1 min-w-0 h-full cursor-pointer"
      )}
      onClick={() => setOpenPopup(true)}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          setOpenPopup(true);
        }
      }}
      data-popup-trigger="true"
    >
      <MyTooltip content={getSpecimenDetailValue()}>
        <div className="text-[12px] text-ellipsis overflow-hidden whitespace-nowrap">
          {getSpecimenDetailValue()}
        </div>
      </MyTooltip>
      {openPopup && (
        <SpecimenDetailPopup
          setOpen={setOpenPopup}
          specimenDetails={specimenDetails}
          setSpecimenDetails={(value: SpecimenDetail[]) => {
            handleSetSpecimenDetails(value);
          }}
        />
      )}
    </div>
  );
}
