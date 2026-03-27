import { useState, useCallback, useEffect, useMemo } from "react";
import MySearchDropDown from "@/components/yjg/my-search-drop-down";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate, formatDateByPattern } from "@/lib/date-utils";
import { usePrescriptionUserCodesSearchAll } from "@/hooks/master-data/use-prescription-user-codes-search-all";
import { useElasticsearchPrescriptionLibraries } from "@/hooks/master-data/use-elasticsearch-prescription-libraries";
import PrescriptionLibrarySearchResult from "./prescription-library-search-result";
import { ITEM_TYPE_CONTAINER_SIZE_PX } from "../yjg/common/constant/class-constants";
import { useSearchSettingStore } from "@/store/search-setting-store";
import { COMMAND_PREFIX } from "@/components/disease-order/order/order-action-row/order-action-command";
import { cn } from "@/lib/utils";
import { PrescriptionType } from "@/constants/master-data-enum";
import { DiseaseLibrariesService } from "@/services/disease-libraries-service";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";
import { PrescriptionLibrariesService } from "@/services/master-data/prescription-libraries-service";
import { useReceptionStore } from "@/store/reception";

export default function PrescriptionLibrarySearch({
  actionRowRef,
  onAddLibrary,
  setCommand,
  className,
  inputClassName,
  size = "sm",
  placeholder = "코드, 명칭 검색",
  hideMagnifyingGlass = false,
  showDisease = false,
  showBundle = false,
  showUserCode = false,
  showLibrary = false,
  forceShowLibrary = false,
  prescriptionType = undefined,
  headerNode,
  footerNode,
  inputTestId,
}: {
  actionRowRef: React.RefObject<HTMLDivElement | null>;
  onAddLibrary: (order: any) => void;
  setCommand?: (command: string) => void;
  className?: string;
  inputClassName?: string;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  placeholder?: string;
  hideMagnifyingGlass?: boolean;
  showDisease?: boolean;
  showBundle?: boolean;
  showUserCode?: boolean;
  showLibrary?: boolean;
  forceShowLibrary?: boolean;
  prescriptionType?: PrescriptionType;
  headerNode?: React.ReactNode;
  footerNode?: React.ReactNode;
  inputTestId?: string;
}) {
  const { currentRegistration } = useReceptionStore();
  const [searchWord, setSearchWord] = useState("");
  const { searchMode, showLibrary: savedShowLibrary, resetShowLibrary } = useSearchSettingStore();
  const resolvedShowLibrary = forceShowLibrary
    ? true
    : showLibrary
      ? savedShowLibrary
      : false;
  const useElasticsearch = searchMode === "elasticsearch";
  const useFastSearch = useElasticsearch;
  const debouncedSearchWord = useDebounce(searchWord, 100);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const setSearchResultsSafely = useCallback((next: any[]) => {
    setSearchResults((prev) => {
      if (prev === next) return prev;
      if (prev.length === next.length) {
        let isSame = true;
        for (let i = 0; i < prev.length; i += 1) {
          if (prev[i] !== next[i]) {
            isSame = false;
            break;
          }
        }
        if (isSame) return prev;
      }
      return next;
    });
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePrescriptionUserCodesSearchAll({
      keyword: debouncedSearchWord,
      limit: 50,
      baseDate: formatDate(new Date(), "-"),
      diseaseCursor: showDisease ? undefined : -1,
      bundleCursor: showBundle ? undefined : -1,
      userCodeCursor: showUserCode ? undefined : -1,
      libraryCursor: resolvedShowLibrary ? undefined : -1,
      type: prescriptionType,
      isComplete: true,
    });

  // 빠른 검색 카테고리 설정
  type SearchCategory =
    | "disease"
    | "bundle"
    | "userCode"
    | "medicalLibrary"
    | "drugLibrary"
    | "materialLibrary";

  const searchCategories = useMemo((): SearchCategory[] | undefined => {
    const categories: SearchCategory[] = [];
    if (showDisease) categories.push("disease");
    if (showBundle) categories.push("bundle");
    if (showUserCode) categories.push("userCode");
    if (resolvedShowLibrary) {
      categories.push("medicalLibrary", "drugLibrary", "materialLibrary");
    }
    return categories.length > 0 ? categories : undefined;
  }, [showDisease, showBundle, showUserCode, resolvedShowLibrary]);

  // Elasticsearch 검색
  const {
    data: elasticsearchData,
    isLoading: elasticsearchLoading,
    isError: elasticsearchError,
  } = useElasticsearchPrescriptionLibraries({
    keyword: debouncedSearchWord,
    limit: 50,
    categories: searchCategories,
    enabled: useElasticsearch && !!debouncedSearchWord.trim(),
  });

  useEffect(() => {
    // debouncedSearchWord가 비어있으면 검색 결과 초기화
    if (!debouncedSearchWord.trim()) {
      setSearchResultsSafely([]);
      setShowSearchResults(false);
      return;
    }
    if (useElasticsearch) {
      // Elasticsearch 결과 사용
      if (elasticsearchData) {
        const items = elasticsearchData.items ?? [];
        setSearchResultsSafely(items);
      } else if (elasticsearchError) {
        setSearchResultsSafely([]);
      }
      setShowSearchResults(true);
    } else {
      if (data?.pages) {
        const allItems: any[] = [];

        data.pages.forEach((page) => {
          // API 응답에서 items 배열 추출
          if (page && Array.isArray(page.items)) {
            allItems.push(...page.items);
          }
        });

        setSearchResultsSafely(allItems);
        setShowSearchResults(true);
      } else {
        setSearchResultsSafely([]);
        setShowSearchResults(true);
      }
    }
  }, [
    data,
    debouncedSearchWord,
    useElasticsearch,
    elasticsearchData,
    elasticsearchError,
    setSearchResultsSafely,
  ]);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchWord(value);
      // '--'로 시작하면 명령어 모드로 전환
      if (setCommand) {
        if (value.startsWith(COMMAND_PREFIX)) {
          setCommand(value);
          setShowSearchResults(false);
        } else {
          setCommand("");
        }
      }
    },
    [setCommand]
  );

  // 검색어 지우기 핸들러
  const handleSearchClear = useCallback(() => {
    setSearchWord("");
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  // 검색 결과 선택 핸들러 (처방/상병 등 추가 시 MASTER 포함 옵션 자동 해제)
  const handleSearchSelect = useCallback(
    async (item: any) => {
      setShowSearchResults(false);
      setSearchWord("");

      if (useElasticsearch) {
        console.log("[TEST][FastSearch][item]", item);
        const baseDate = formatDateByPattern(
          currentRegistration?.receptionDateTime ?? "",
          "YYYY-MM-DD"
        );
        try {
          let library: any = null;
          const id = item.original_id;
          switch (item.category) {
            case "disease":
              library = await DiseaseLibrariesService.getDiseaseLibraryById(
                id
              );
              break;
            case "bundle":
              library = await BundleItemsService.getBundle(id, baseDate);
              break;
            case "userCode":
              library = await PrescriptionUserCodeService.getPrescriptionUserCode(
                id
              );
              break;
            case "medicalLibrary":
            case "drugLibrary":
            case "materialLibrary":
              library = await PrescriptionLibrariesService.getPrescriptionLibraryById(
                id
              );
              break;
          }
          if (library) {
            library.category = item.category;
            onAddLibrary(library);
            resetShowLibrary();
          }
        } catch (error) {
          console.error("상세 조회 실패:", error);
        }
      } else {
        onAddLibrary(item);
        resetShowLibrary();
      }
    },
    [onAddLibrary, useElasticsearch, currentRegistration?.receptionDateTime, resetShowLibrary]
  );

  // 추가 데이터 로드 핸들러
  const handleLoadMore = useCallback(() => {
    if (!useElasticsearch && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [useElasticsearch, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <MySearchDropDown
      hideMagnifyingGlass={hideMagnifyingGlass}
      value={searchWord}
      onChange={handleSearchChange}
      onClear={handleSearchClear}
      onSelect={handleSearchSelect}
      results={searchResults}
      renderResultItem={(item: any, index: number) => (
        <PrescriptionLibrarySearchResult
          size={size}
          key={item.id || item.typePrescriptionLibraryId || index}
          item={item}
          searchWord={searchWord}
        />
      )}
      showResults={showSearchResults}
      onShowResultsChange={setShowSearchResults}
      placeholder={placeholder}
      isLoading={useElasticsearch ? elasticsearchLoading : isLoading}
      hasMore={useElasticsearch ? false : hasNextPage}
      isLoadingMore={useElasticsearch ? false : isFetchingNextPage}
      onLoadMore={handleLoadMore}
      className={cn("border-none rounded-none bg-transparent", className)}
      inputClassName={inputClassName}
      itemHeight={ITEM_TYPE_CONTAINER_SIZE_PX[size]}
      maxHeight={ITEM_TYPE_CONTAINER_SIZE_PX[size] * 10}
      parentRef={actionRowRef}
      headerNode={headerNode}
      footerNode={footerNode}
      inputTestId={inputTestId}
    />
  );
}
