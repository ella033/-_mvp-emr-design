import { useEffect, useState } from "react";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import SpecimenDetailPopup from "./specimen-detail-popup";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import MyInput from "@/components/yjg/my-input";
import { MyButton } from "@/components/yjg/my-button";
import { Search } from "lucide-react";

interface SpecimenDetailInputWithButtonProps {
  specimenDetailsJson: string;
  onChange: (value: string) => void;
  readonly?: boolean;
}

export default function SpecimenDetailInputWithButton({
  specimenDetailsJson,
  onChange,
  readonly = false,
}: SpecimenDetailInputWithButtonProps) {
  const [specimenDetails, setSpecimenDetails] = useState<SpecimenDetail[]>([]);
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    try {
      if (specimenDetailsJson && specimenDetailsJson !== `""`) {
        let parsed: any;
        try {
          parsed = JSON.parse(specimenDetailsJson);
          if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
          }
        } catch {
          setSpecimenDetails([]);
          return;
        }
        if (Array.isArray(parsed)) {
          setSpecimenDetails(parsed as SpecimenDetail[]);
        } else {
          setSpecimenDetails([]);
        }
      } else {
        setSpecimenDetails([]);
      }
    } catch (error) {
      console.error("specimen-detail-input-with-button", error);
      setSpecimenDetails([]);
    }
  }, [specimenDetailsJson]);

  const handleSetSpecimenDetails = (value: SpecimenDetail[]) => {
    setSpecimenDetails(value);
    onChange(JSON.stringify(value));
  };

  const getDisplayValue = () => {
    if (specimenDetails.length === 1) {
      return specimenDetails[0]?.code ?? "";
    } else if (specimenDetails.length > 1) {
      return `${specimenDetails[0]?.code} 외 ${specimenDetails.length - 1} 건`;
    }
    return "";
  };

  return (
    <MyTooltip side="bottom" align="start" content={getDisplayValue()}>
      <div className="flex flex-row gap-1 w-full">
        <MyInput
          value={getDisplayValue()}
          type="readonly"
          className="rounded-sm min-w-30"
        />
        {!readonly && (
          <MyButton className="p-2" onClick={() => setOpenPopup(true)}>
            <Search className="w-3 h-3 text-white" />
          </MyButton>
        )}
        {openPopup && (
          <SpecimenDetailPopup
            setOpen={setOpenPopup}
            specimenDetails={specimenDetails}
            setSpecimenDetails={handleSetSpecimenDetails}
          />
        )}
      </div>
    </MyTooltip>
  );
}
