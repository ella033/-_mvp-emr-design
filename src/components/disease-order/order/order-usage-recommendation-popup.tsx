import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getCellValueAsNumber,
  getCellValueAsString,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { useUsages } from "@/hooks/usage/use-usage";

export default function OrderUsageRecommendationPopup({
  row,
  handleDataChangeItem,
  setOpen,
}: {
  row: MyTreeGridRowType;
  handleDataChangeItem: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
  setOpen: (open: boolean) => void;
}) {
  const { data: usages } = useUsages();

  const name = getCellValueAsString(row, "name") || "";
  const times = getCellValueAsNumber(row, "times") || 0;
  const usageCode = getCellValueAsString(row, "usage") || "";
  const usage = usages?.find((usage) => usage.code === usageCode);
  const currentUsage = `${usage?.code} | ${usage?.usage} (일투: ${usage?.times})`;

  const filteredUsages = usages?.filter((usage) => usage.times === times);

  const handleSetUsage = (usageCode: string) => {
    handleDataChangeItem("usage", row, usageCode);
    setOpen(false);
  };

  const handleRemoveUsage = () => {
    handleDataChangeItem("usage", row, "");
    setOpen(false);
  };

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={() => setOpen(false)}
      title="용법 추천"
      width="500px"
      height="500px"
      minWidth="400px"
      minHeight="400px"
    >
      <div className="flex flex-col gap-2 w-full h-full p-[10px]">
        <div className="flex flex-col gap-2">
          <div className="text-[14px] font-bold">일투 변경 항목</div>
          <div className="flex flex-col gap-2 bg-[var(--bg-1)] p-[10px] rounded-[5px]">
            <div className="flex flex-row gap-[20px] justify-between">
              <UsageRowItem label="명칭" value={name} />
              <UsageRowItem label="변경된 일투" value={times.toString()} />
            </div>
            <div className="flex flex-row gap-[20px] justify-between">
              <UsageRowItem label="현재 적용된 용법" value={currentUsage} />
            </div>
          </div>
        </div>
        <div className="text-[14px] font-bold pt-[10px]">용법 추천 제안</div>
        <div className="text-[13px] text-[var(--gray-400)]">
          일투가 <strong>{times}회</strong>인 용법 중 변경하실 용법을
          선택해주세요.
        </div>
        <div className="flex flex-col gap-2 my-scroll flex-1">
          {filteredUsages?.map((usage) => (
            <MyButton
              variant="outline"
              key={usage.code}
              onClick={() => handleSetUsage(usage.code)}
            >
              {usage.code} | {usage.usage}
            </MyButton>
          ))}
          {filteredUsages?.length === 0 && (
            <div className="text-[12px] text-[var(--gray-400)] h-full flex items-center justify-center">
              일투가 {times}회인 용법이 없습니다.
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <MyButton onClick={handleRemoveUsage}>용법 제거하기</MyButton>
        </div>
      </div>
    </MyPopup>
  );
}

function UsageRowItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-row gap-[10px]">
      <div className="text-[12px] text-[var(--gray-400)]">{label}</div>
      <div className="text-[12px]">{value}</div>
    </div>
  );
}
