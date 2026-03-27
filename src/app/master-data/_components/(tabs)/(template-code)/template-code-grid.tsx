import { GridContainer, MasterDataTitle } from "../../(common)/common-controls";
import { MySelect } from "@/components/yjg/my-select";
import MySearchInput from "@/components/yjg/my-search-input";
import { TEMPLATE_CODE_TYPE_OPTIONS } from "@/constants/common/common-option";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import type { TemplateCode } from "@/types/template-code-types";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTemplateCodeDelete } from "@/hooks/template-code/use-template-code-delete";
import { useTemplateCodeUpdate } from "@/hooks/template-code/use-template-code-update";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
  getCellValueAsNumber,
} from "@/components/yjg/my-grid/my-grid-util";
import {
  defaultTemplateCodeHeaders,
  LS_TEMPLATE_CODE_HEADERS_KEY,
} from "./template-code-header";
import { MyButton } from "@/components/yjg/my-button";
import MyGrid, { type MyGridRef } from "@/components/yjg/my-grid/my-grid";
import { useDebounce } from "@/hooks/use-debounce";
import { convertTemplateCodesToMyGridType } from "./template-code-converter";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { MyGridSettingButton } from "@/components/yjg/my-grid/my-grid-setting-button";
import { Star, Trash2 } from "lucide-react";

interface TemplateCodeGridProps {
  selectedTemplateCode: TemplateCode | null;
  setSelectedTemplateCode: (templateCode: TemplateCode | null) => void;
}

export default function TemplateCodeGrid({
  selectedTemplateCode,
  setSelectedTemplateCode,
}: TemplateCodeGridProps) {
  const { success, error } = useToastHelpers();
  const { data: templateCodes, isLoading } = useTemplateCodes();
  const queryClient = useQueryClient();
  const { mutate: updateTemplateCode } = useTemplateCodeUpdate();
  const { mutate: deleteTemplateCodeMutation } = useTemplateCodeDelete();
  const [selectedTemplateCodeType, setSelectedTemplateCodeType] =
    useState<TemplateCodeType>(TemplateCodeType.전체);
  const [searchWord, setSearchWord] = useState("");
  const gridRef = useRef<MyGridRef>(null);
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(LS_TEMPLATE_CODE_HEADERS_KEY, defaultTemplateCodeHeaders)
  );
  const [treeData, setTreeData] = useState<MyGridRowType[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedDeleteTemplateCodeId, setSelectedDeleteTemplateCodeId] =
    useState<number | null>(null);

  // debounce된 검색어
  const debouncedSearchText = useDebounce(searchWord, 300);

  const RowAction = (id: number) => {
    const isFavorite = templateCodes?.find((t) => t.id === id)?.isQuickMenu;

    const handleQuickMenu = () => {
      updateTemplateCode(
        {
          id,
          isQuickMenu: !isFavorite,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["template-codes"] });
          },
        }
      );
    };

    const handleDelete = () => {
      setSelectedDeleteTemplateCodeId(id);
      setIsDeleteConfirmOpen(true);
    };
    return (
      <div className="flex flex-row items-center gap-[2px]">
        <MyButton
          size="sm"
          className="w-[25px] h-[20px]"
          variant="outline"
          onClick={handleQuickMenu}
        >
          <Star
            className={`w-[12px] h-[12px] ${isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-500 fill-transparent"} flex-shrink-0`}
          />
        </MyButton>
        <MyButton
          size="sm"
          className="w-[25px] h-[20px]"
          variant="outline"
          onClick={handleDelete}
        >
          <Trash2 className="w-[12px] h-[12px] flex-shrink-0" />
        </MyButton>
      </div>
    );
  };

  const handleDeleteConfirm = () => {
    if (selectedDeleteTemplateCodeId) {
      deleteTemplateCodeMutation(selectedDeleteTemplateCodeId, {
        onSuccess: () => {
          success("상용구가 삭제되었습니다.");
          queryClient.invalidateQueries({ queryKey: ["template-codes"] });
        },
        onError: (err) => {
          error("삭제 실패", err.message);
        },
      });
      setIsDeleteConfirmOpen(false);
      if (selectedDeleteTemplateCodeId === selectedTemplateCode?.id) {
        setSelectedTemplateCode(null);
      }
      setSelectedDeleteTemplateCodeId(null);
    }
  };

  // 필터링된 templateCodes 계산
  const filteredTemplateCodes = useMemo(() => {
    if (!templateCodes) return [];

    return templateCodes.filter((templateCode) => {
      // 검색어 필터링 (debounce된 검색어 사용)
      const matchesSearch =
        !debouncedSearchText ||
        templateCode.code
          ?.toLowerCase()
          .includes(debouncedSearchText.toLowerCase()) ||
        templateCode.content
          ?.toLowerCase()
          .includes(debouncedSearchText.toLowerCase());

      // 타입 필터링 (전체(0)이면 필터링하지 않음)
      const matchesType =
        selectedTemplateCodeType === TemplateCodeType.전체 ||
        templateCode.type.includes(selectedTemplateCodeType);

      return matchesSearch && matchesType;
    });
  }, [templateCodes, debouncedSearchText, selectedTemplateCodeType]);

  useEffect(() => {
    const newGridData = convertTemplateCodesToMyGridType(
      filteredTemplateCodes,
      RowAction
    );
    setTreeData(newGridData);
  }, [filteredTemplateCodes]);

  const handleSearch = (value: string) => {
    setSearchWord(value);
  };

  const handleClearSearch = () => {
    setSearchWord("");
  };

  const handleHeadersChange = (newHeaders: MyGridHeaderType[]) => {
    setHeaders(newHeaders);
    saveHeaders(LS_TEMPLATE_CODE_HEADERS_KEY, newHeaders);
  };

  const handleSelectedRowsChange = (rows: MyGridRowType[]) => {
    if (rows.length === 1 && rows[0]) {
      const templateCodeId = getCellValueAsNumber(rows[0], "id") ?? undefined;
      const templateCode = templateCodes?.find((t) => t.id === templateCodeId);
      if (templateCode) {
        setSelectedTemplateCode(templateCode);
      }
    }
  };

  return (
    <GridContainer>
      <div className="flex flex-row w-full items-center gap-2 my-scroll pt-1">
        <MasterDataTitle
          title="상용구 목록"
          tooltipText="자주 쓰는 문구를 단축어로 입력할 수 있도록 상용구로 등록할 수 있습니다."
        />
        <MySelect
          options={TEMPLATE_CODE_TYPE_OPTIONS}
          value={selectedTemplateCodeType}
          onChange={(value) => setSelectedTemplateCodeType(Number(value))}
        />
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
          placeholder="코드 또는 내용 검색"
        />
        <MyGridSettingButton
          defaultHeaders={defaultTemplateCodeHeaders}
          headers={headers}
          setHeaders={setHeaders}
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
          loadingMsg="상용구를 불러오는 중입니다..."
          onHeadersChange={handleHeadersChange}
          onSelectedRowsChange={handleSelectedRowsChange}
        />
      </div>
      <MyPopupYesNo
        isOpen={isDeleteConfirmOpen}
        onCloseAction={() => setIsDeleteConfirmOpen(false)}
        onConfirmAction={handleDeleteConfirm}
        title=""
        message="선택된 상용구를 삭제하시겠습니까?"
        hideHeader={true}
        children={
          <div className="text-sm text-[var(--gray-500)]">
            삭제된 상용구는 복구되지 않습니다.
          </div>
        }
      />
    </GridContainer>
  );
}
