import { useEncounterStore } from "@/store/encounter-store";
import { useEffect, useState } from "react";

export function NoneSelectedPatient() {
  const { encounters } = useEncounterStore();
  const [isPatientEncountersExist, setIsPatientEncountersExist] = useState(false);
  useEffect(() => {
    setIsPatientEncountersExist((encounters?.length ?? 0) > 0);
  }, [encounters]);

  return (
    <div className="flex w-full h-full items-center justify-center bg-transparent">
      <div className="text-gray-400">{isPatientEncountersExist ? "차트를 선택해주세요." : "환자를 선택해주세요."}</div>
    </div>
  );
}
