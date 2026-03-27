import { GridContainer, MasterDataTitle } from "../../(common)/common-controls";
import { MySelect } from "@/components/yjg/my-select";
import { USAGE_CATEGORY_OPTIONS } from "@/constants/common/common-option";
import { useEffect, useMemo, useRef, useState } from "react";
import MySearchInput from "@/components/yjg/my-search-input";
import MyGrid, { type MyGridRef } from "@/components/yjg/my-grid/my-grid";
import { useUsages } from "@/hooks/usage/use-usage";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import { defaultUsageHeaders, LS_USAGE_HEADERS_KEY } from "./usage-header";
import { convertUsagesToMyGridType } from "./usage-converter";
import { useDebounce } from "@/hooks/use-debounce";
import type { UsageCode } from "@/types/usage-code-types";
import { getCellValueAsNumber } from "@/components/yjg/my-grid/my-grid-util";
import { MyButton } from "@/components/yjg/my-button";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useUsageDelete } from "@/hooks/usage/use-usage-delete";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

interface UsageGridProps {
  selectedUsage: UsageCode | null;
  setSelectedUsage: (usage: UsageCode | null) => void;
}

export default function UsageGrid({ setSelectedUsage }: UsageGridProps) {
  const { success, error } = useToastHelpers();
  const { data: usages, isLoading } = useUsages();
  const queryClient = useQueryClient();
  const { mutate: deleteUsageMutation } = useUsageDelete();
  const [selectedCategory, setSelectedCategory] = useState(-1);
  const [searchWord, setSearchWord] = useState("");
  const gridRef = useRef<MyGridRef>(null);
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(LS_USAGE_HEADERS_KEY, defaultUsageHeaders)
  );
  const [treeData, setTreeData] = useState<MyGridRowType[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedDeleteUsageId, setSelectedDeleteUsageId] = useState<
    number | null
  >(null);

  // debounce된 검색어
  const debouncedSearchText = useDebounce(searchWord, 300);

  const DeleteUsageButton = (id: number) => {
    const handleDelete = () => {
      setSelectedDeleteUsageId(id);
      setIsDeleteConfirmOpen(true);
    };

    return (
      <MyButton
        size="sm"
        className="w-[25px] h-[20px]"
        variant="outline"
        onClick={handleDelete}
      >
        <Trash2 className="w-[12px] h-[12px] flex-shrink-0" />
      </MyButton>
    );
  };

  // 필터링된 usages 계산
  const filteredUsages = useMemo(() => {
    if (!usages) return [];

    return usages.filter((usage) => {
      // 검색어 필터링 (debounce된 검색어 사용)
      const matchesSearch =
        !debouncedSearchText ||
        usage.code?.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
        usage.usage?.toLowerCase().includes(debouncedSearchText.toLowerCase());

      // 카테고리 필터링 (-1이면 전체이므로 필터링하지 않음)
      const matchesCategory =
        selectedCategory === -1 || usage.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [usages, debouncedSearchText, selectedCategory]);

  useEffect(() => {
    const newGridData = convertUsagesToMyGridType(
      filteredUsages,
      DeleteUsageButton
    );
    setTreeData(newGridData);
  }, [filteredUsages]);

  const handleSearch = (value: string) => {
    setSearchWord(value);
  };

  const handleClearSearch = () => {
    setSearchWord("");
  };

  const handleDeleteConfirm = () => {
    if (selectedDeleteUsageId) {
      deleteUsageMutation(selectedDeleteUsageId, {
        onSuccess: () => {
          success("용법이 삭제되었습니다.");
          queryClient.invalidateQueries({ queryKey: ["usages"] });
        },
        onError: (err) => {
          error("삭제 실패", err.message);
        },
      });
      setIsDeleteConfirmOpen(false);
      setSelectedDeleteUsageId(null);
    }
  };

  const handleHeadersChange = (newHeaders: MyGridHeaderType[]) => {
    setHeaders(newHeaders);
    saveHeaders(LS_USAGE_HEADERS_KEY, newHeaders);
  };

  const handleSelectedRowsChange = (rows: MyGridRowType[]) => {
    if (rows.length === 1 && rows[0]) {
      const usageId = getCellValueAsNumber(rows[0], "id") ?? undefined;
      const usage = usages?.find((u) => u.id === usageId);
      if (usage) {
        setSelectedUsage(usage);
      }
    }
  };

  return (
    <GridContainer>
      <div className="flex flex-row w-full items-center gap-2 my-scroll pt-1">
        <MasterDataTitle
          title="용법"
          tooltipText="오더 시 처방에 적용할 용법을 등록할 수 있습니다."
        />
        <MySelect
          options={[{ value: -1, label: "전체" }, ...USAGE_CATEGORY_OPTIONS]}
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(Number(value))}
        />
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
          placeholder="코드 또는 용법 검색"
        />
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          size="sm"
          ref={gridRef}
          headers={headers}
          data={treeData}
          multiSelect={false}
          isLoading={isLoading}
          loadingMsg="용법을 불러오는 중입니다..."
          onHeadersChange={handleHeadersChange}
          onSelectedRowsChange={handleSelectedRowsChange}
        />
      </div>
      <MyPopupYesNo
        isOpen={isDeleteConfirmOpen}
        onCloseAction={() => setIsDeleteConfirmOpen(false)}
        onConfirmAction={handleDeleteConfirm}
        title=""
        message="선택된 용법을 삭제하시겠습니까?"
        hideHeader={true}
        children={
          <div className="text-sm text-[var(--gray-500)]">
            삭제된 용법은 복구되지 않습니다.
          </div>
        }
      />
    </GridContainer>
  );
}
