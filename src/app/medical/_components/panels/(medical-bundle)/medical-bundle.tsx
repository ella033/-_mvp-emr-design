import dynamic from "next/dynamic";
import MySearchInput from "@/components/yjg/my-search-input";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import MedicalBundleDetail from "./medical-bundle-detail";
import MySplitPane from "@/components/yjg/my-split-pane";
import { MyButton } from "@/components/yjg/my-button";
import { GalleryVertical, GalleryHorizontal } from "lucide-react";
import { useEncounterStore } from "@/store/encounter-store";
import { NoneSelectedPatient } from "../../widgets/none-patient";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";
import { RepeatIcon, StarIcon } from "@/components/custom-icons";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";

const BundleListLazy = dynamic(
  () =>
    Promise.all([
      import("@/app/master-data/_components/(tabs)/(bundle)/(bundle-list)/bundle-list"),
      import("@/app/master-data/_components/(tabs)/(bundle)/(bundle-list)/bundle-header"),
    ]).then(([bundleListMod, bundleHeaderMod]) => {
      const BundleList = bundleListMod.default;
      function BundleListWithMedicalDefaults(
        props: Omit<React.ComponentProps<typeof BundleList>, "headersStorageKey" | "defaultHeaders"> & {
          headersStorageKey?: string;
          defaultHeaders?: React.ComponentProps<typeof BundleList>["defaultHeaders"];
        }
      ) {
        return (
          <BundleList
            {...props}
            headersStorageKey={props.headersStorageKey ?? bundleHeaderMod.LS_MEDICAL_BUNDLE_LIST_HEADERS_KEY}
            defaultHeaders={props.defaultHeaders ?? bundleHeaderMod.defaultMedicalBundleListHeaders}
          />
        );
      }
      return { default: BundleListWithMedicalDefaults };
    }),
  { ssr: false }
);

const MEDICAL_BUNDLE_SETTINGS = {
  scope: "user" as const,
  category: "medical-bundle",
  pageContext: "medical-bundle",
};

let saveMedicalBundleSettingsTimer: NodeJS.Timeout | null = null;

const getInitialIsVertical = (): boolean => {
  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    MEDICAL_BUNDLE_SETTINGS.category,
    MEDICAL_BUNDLE_SETTINGS.pageContext
  );
  return savedSetting?.settings?.isVertical === true;
};

const saveMedicalBundleSettings = (isVertical: boolean) => {
  const state = useSettingsStore.getState();
  const existingSetting = state.getSettingsByCategoryAndPageContext(
    MEDICAL_BUNDLE_SETTINGS.category,
    MEDICAL_BUNDLE_SETTINGS.pageContext
  );
  const existingIsVertical = existingSetting?.settings?.isVertical === true;

  if (existingIsVertical === isVertical) return;

  const payload = {
    scope: MEDICAL_BUNDLE_SETTINGS.scope,
    category: MEDICAL_BUNDLE_SETTINGS.category,
    pageContext: MEDICAL_BUNDLE_SETTINGS.pageContext,
    settings: { isVertical },
  };

  state.updateSettingLocally(payload);

  if (saveMedicalBundleSettingsTimer) {
    clearTimeout(saveMedicalBundleSettingsTimer);
  }

  saveMedicalBundleSettingsTimer = setTimeout(() => {
    SettingsService.createOrUpdateSetting(payload).catch((error) => {
      console.error("[MedicalBundle] 레이아웃 설정 저장 실패:", error);
    });
    saveMedicalBundleSettingsTimer = null;
  }, 400);
};

export default function MedicalBundle() {
  const { selectedEncounter, setNewBundle } =
    useEncounterStore();
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);
  const didSyncSettingsRef = useRef(false);
  const [searchWord, setSearchWord] = useState("");
  const [selectedBundleId, setSelectedBundleId] = useState<number>(0);
  const [isVertical, setIsVertical] = useState<boolean>(() => getInitialIsVertical());
  const [isFavorite, setIsFavorite] = useState(false);

  // 입력값은 즉시 반영하고, 리스트/API용 검색어는 디바운스해 포커스 이탈 방지
  const debouncedSearchWord = useDebounce(searchWord, 300);
  const searchWordForPanes = searchWord === "" ? "" : debouncedSearchWord;

  const handleSearch = useCallback((searchWord: string) => {
    setSearchWord(searchWord);
  }, []);

  const handleToggleVertical = useCallback(() => {
    setIsVertical((prev) => {
      const next = !prev;
      saveMedicalBundleSettings(next);
      return next;
    });
  }, []);

  const handleToggleFavorite = useCallback(() => {
    setIsFavorite((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isSettingsLoaded || didSyncSettingsRef.current) return;
    didSyncSettingsRef.current = true;
    const savedIsVertical = getInitialIsVertical();
    setIsVertical((prev) => (prev === savedIsVertical ? prev : savedIsVertical));
  }, [isSettingsLoaded]);

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  const RowAction = (bundle: Bundle) => {
    return (
      <div className="flex flex-row items-center gap-[2px]">
        <MyButton size="sm" className="w-[22px] h-[20px] p-0" variant="outline" onClick={() => {
          setNewBundle(bundle);
        }}>
          <RepeatIcon className="w-[12px] h-[12px]" />
        </MyButton>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-row items-center border-y border-[var(--border-1)] gap-[4px] p-1">
        <MyButton
          variant="outline"
          size="icon"
          className="p-[5px]"
          onClick={handleToggleVertical}
        >
          {isVertical ? <GalleryHorizontal className="w-[12px] h-[12px]" /> : <GalleryVertical className="w-[12px] h-[12px]" />}
        </MyButton>
        <MyButton variant="outline" size="icon" className="p-[3px]" onClick={handleToggleFavorite}>
          <StarIcon filled={isFavorite} className={`w-[16px] h-[16px] ${isFavorite ? "text-[var(--second-color)]" : "text-[var(--gray-500)]"}`} />
        </MyButton>
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={() => setSearchWord("")}
          placeholder="카테고리 이름, 묶음코드, 묶음명칭, 세부키워드로 검색"
          className="border-none rounded-none"
        />

      </div>
      <div className="flex flex-1 min-h-0 min-w-0">
        <MySplitPane
          splitPaneId="medical-bundle"
          isVertical={isVertical}
          initialRatios={[0.3, 0.7]}
          panes={[
            <BundleListLazy
              hideTopControls={true}
              hideContainerPadding={true}
              hideGridHeader={true}
              hideAddContextMenus={true}
              activeOnly={true}
              favoriteOnly={isFavorite}
              searchWord={searchWordForPanes}
              setSelectedBundleId={setSelectedBundleId}
              RowAction={RowAction}
            />,
            <MedicalBundleDetail selectedBundleId={selectedBundleId} searchKeyword={searchWordForPanes} />,
          ]}
        />
      </div>
    </div>
  );
}