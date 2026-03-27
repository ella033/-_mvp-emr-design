import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { MySwitch } from "@/components/yjg/my-switch";
import { MyButton } from "@/components/yjg/my-button";

export default function BundleDetailHeader({
  originalBundle,
  selectedBundle,
  setSelectedBundle,
  onNewCreate,
  hideNewCreateButton,
}: {
  originalBundle: Bundle | null;
  selectedBundle: Bundle | null;
  setSelectedBundle: (bundle: Bundle | null) => void;
  /** 새로작성 클릭 시 호출 (초기값으로 리셋 후 신규 추가 모드) */
  onNewCreate?: () => void;
  /** true면 새로작성 버튼 숨김 */
  hideNewCreateButton?: boolean;
}) {
  const handleActiveChange = (checked: boolean) => {
    if (!selectedBundle) return;
    setSelectedBundle({
      ...selectedBundle,
      isActive: checked,
    } as Bundle);
  };

  const handleFavoriteChange = (checked: boolean) => {
    if (!selectedBundle) return;
    setSelectedBundle({
      ...selectedBundle,
      isFavorite: checked,
    } as Bundle);
  };

  const handleNewRegister = () => {
    onNewCreate?.();
  };

  /** 사용여부: 선택된 묶음이 있거나 새로작성으로 초기화된 경우에만 표시 */
  const showActiveSwitch = selectedBundle != null;

  return (
    <div className="flex flex-row justify-between items-center px-[8px] py-[2px]">
      <div className="text-base font-bold">
        {originalBundle ? "상세정보" : "묶음 신규 추가"}
      </div>
      <div className="flex flex-row gap-[8px]">
        {showActiveSwitch && (
          <>
            <label className="flex flex-row items-center gap-2">
              <span className="text-sm">즐겨찾기</span>
              <MySwitch
                checked={selectedBundle.isFavorite || false}
                onCheckedChange={handleFavoriteChange}
              />
            </label>
            <label className="flex flex-row items-center gap-2">
              <span className="text-sm">사용여부</span>
              <MySwitch
                checked={selectedBundle.isActive || false}
                onCheckedChange={handleActiveChange}
              />
            </label>
          </>
        )}
        {!hideNewCreateButton && (
          <MyButton className="px-5" onClick={handleNewRegister}>
            새로작성
          </MyButton>
        )}
      </div>
    </div>
  );
}
