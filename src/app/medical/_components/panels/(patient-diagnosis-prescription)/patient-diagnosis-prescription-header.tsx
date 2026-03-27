import { useEffect, useRef } from "react";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { cn } from "@/lib/utils";
import { MyToggleButton } from "@/components/yjg/my-toggle-button";
import { SEARCH_MODE_OPTIONS } from "@/constants/common/common-option";
import { useSearchSettingStore, type SearchMode } from "@/store/search-setting-store";
import { useSettingsStore } from "@/store/settings-store";

export function Header({
  onAddLibrary,
  isChartCheck = false,
}: {
  onAddLibrary: (library: any) => void;
  isChartCheck?: boolean;
}) {
  const {
    searchMode,
    setSearchMode,
    showLibrary,
    setShowLibrary,
    syncFromSettings,
  } = useSearchSettingStore();
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);
  const actionRowRef = useRef<HTMLDivElement>(null);
  const didSyncFromSettingsRef = useRef(false);
  const syncFromSettingsRef = useRef(syncFromSettings);
  syncFromSettingsRef.current = syncFromSettings;

  useEffect(() => {
    if (!isSettingsLoaded || didSyncFromSettingsRef.current) return;
    didSyncFromSettingsRef.current = true;
    syncFromSettingsRef.current();
  }, [isSettingsLoaded]);

  return (
    <div
      ref={actionRowRef}
      className={cn(
        "flex flex-row items-center px-[5px] gap-[3px]",
        isChartCheck ? "border border-[var(--border-1)] rounded-sm" : "border-y border-[var(--border-1)]"
      )}>
      <div className="flex flex-row items-center gap-[3px]">
        <MyToggleButton
          options={SEARCH_MODE_OPTIONS}
          value={searchMode}
          onValueChange={(value: string | number | null) =>
            setSearchMode(value as SearchMode)
          }
          unSelectEnabled={false}
          size="sm"
        />
      </div>
      <div className="flex flex-1 py-[3px]">
        <PrescriptionLibrarySearch
          actionRowRef={actionRowRef}
          placeholder={"상병 및 처방 전체 검색"}
          onAddLibrary={onAddLibrary}
          showDisease={true}
          showBundle={true}
          showUserCode={true}
          showLibrary={showLibrary}
          footerNode={
            <div className="flex items-center justify-end w-full">
              <MyCheckbox
                size="sm"
                type="button"
                className="text-[10px] px-[4px] py-[2px]"
                checked={showLibrary}
                onChange={(checked) => {
                  if (checked === showLibrary) return;
                  setShowLibrary(checked);
                }}
                label="MASTER 포함"
                tooltip={
                  <div className="text-[12px] max-w-[350px] whitespace-pre-wrap">
                    체크 시 다음 검색부터 MASTER 자료가 포함됩니다.
                    <br />
                    처방을 한 건이라도 추가하면 자동 해제되며, 이후 검색에는 MASTER가 포함되지 않습니다.
                    <br />
                    MASTER 포함 시 검색속도가 느려질 수 있습니다.
                  </div>
                }
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
