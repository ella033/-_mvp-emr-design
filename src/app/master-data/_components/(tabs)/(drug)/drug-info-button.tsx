import { MyButton } from "@/components/yjg/my-button";
import { showDrugInfo } from "@/lib/business-utils";

interface DrugInfoButtonProps {
  claimCode: string;
}

export default function DrugInfoButton({ claimCode }: DrugInfoButtonProps) {
  return (
    <MyButton
      variant="ghost"
      className="bg-[var(--blue-2)] hover:bg-[var(--violet-2)] px-[3px] py-[2px]"
      onClick={() => {
        showDrugInfo(claimCode);
      }}
    >
      <div className="text-[10px] text-white">DI</div>
    </MyButton>
  );
}
