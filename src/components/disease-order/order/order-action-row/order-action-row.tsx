import { useCallback, useEffect, useRef, useState } from "react";
import {
  MyTreeGridHeaderType,
  type MyTreeGridRowType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getHeaderDefaultWidth,
  getStickyStyle,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { cn } from "@/lib/utils";
import OrderActionCommand, {
  COMMAND_DIVIDE_LINE,
  COMMAND_PREFIX,
} from "./order-action-command"
import ActionRowTextNumber from "../../common-action-row/action-oral-medication-text-number";
import { GRID_FONT_SIZE_CLASS } from "@/components/yjg/common/constant/class-constants";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";
import ActionOralMedicationPowder from "../../common-action-row/action-oral-medication-powder";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { useSearchSettingStore } from "@/store/search-setting-store";
interface OrderActionRowProps {
  headers: MyTreeGridHeaderType[];
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void;
  onAddLibrary: (order: any) => void;
  onAddCustomOrder: (row: MyTreeGridRowType) => void;
  noBundle: boolean;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  /** 지시오더(--) 및 구분선(---) 입력을 비활성화 */
  disableCommandOrder?: boolean;
}

export default function OrderActionRow({
  headers,
  selectedRows,
  onSelectedRowsDataChange,
  onCellDataChange,
  onAddLibrary,
  onAddCustomOrder,
  noBundle = false,
  size = "default",
  disableCommandOrder = false,
}: OrderActionRowProps) {
  const actionRowRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState("");
  const [isShowCommandOrder, setIsShowCommandOrder] = useState(false);
  const [shouldRestoreSearchFocus, setShouldRestoreSearchFocus] = useState(false);
  const lastFocusedSearchSelectorRef = useRef(".order-action-row-search-input");

  const handleSetCommand = useCallback((nextCommand: string) => {
    // 지시오더/구분선 비활성화 시 명령 모드 진입 차단
    if (disableCommandOrder && nextCommand.startsWith(COMMAND_PREFIX)) {
      return;
    }
    if (nextCommand.startsWith(COMMAND_PREFIX)) {
      const active = document.activeElement as HTMLElement | null;
      if (active?.classList.contains("order-action-row-search-input")) {
        const keyClass = Array.from(active.classList).find((className) =>
          className.startsWith("order-action-row-search-input-")
        );
        lastFocusedSearchSelectorRef.current = keyClass
          ? `.${keyClass}`
          : ".order-action-row-search-input";
      }
    }
    setCommand(nextCommand);
  }, [disableCommandOrder]);

  useEffect(() => {
    if (command.startsWith(COMMAND_PREFIX)) {
      setIsShowCommandOrder(true);
    } else {
      setIsShowCommandOrder(false);
    }
  }, [command]);

  useEffect(() => {
    if (isShowCommandOrder || !shouldRestoreSearchFocus) return;

    const focusSearchInput = () => {
      const preferredSelector = lastFocusedSearchSelectorRef.current;
      const preferredInput =
        actionRowRef.current?.querySelector<HTMLInputElement>(preferredSelector);
      const targetInput = actionRowRef.current?.querySelector<HTMLInputElement>(
        ".order-action-row-search-input"
      );
      const inputToFocus = preferredInput ?? targetInput;
      if (!inputToFocus) return;
      inputToFocus.focus({ preventScroll: true });
      inputToFocus.select?.();
      setShouldRestoreSearchFocus(false);
    };

    // 명령행 언마운트/검색행 마운트 이후 포커스 복귀
    requestAnimationFrame(() => {
      requestAnimationFrame(focusSearchInput);
    });
  }, [isShowCommandOrder, shouldRestoreSearchFocus]);

  return (
    <div
      ref={actionRowRef}
      className="flex flex-row w-full border-y border-[#F0ECFE] bg-[var(--bg-base1)]"
    >
      {isShowCommandOrder && (
        <OrderActionCommand
          command={command}
          size={size}
          setCommand={setCommand}
          setIsShowCommandOrder={setIsShowCommandOrder}
          onCommandSubmitComplete={() => setShouldRestoreSearchFocus(true)}
          onAddCustomOrder={onAddCustomOrder}
          onCellDataChange={onCellDataChange}
        />
      )}
      {!isShowCommandOrder &&
        headers
          .filter((header) => header.visible)
          .map((header) => {
            const stickyStyle = getStickyStyle(headers, header);
            return (
              <OrderActionRowCell
                key={header.key}
                actionRowRef={actionRowRef}
                header={header}
                selectedRows={selectedRows}
                onSelectedRowsDataChange={onSelectedRowsDataChange}
                stickyStyle={stickyStyle}
                onAddLibrary={onAddLibrary}
                setCommand={handleSetCommand}
                noBundle={noBundle}
                size={size}
                disableCommandOrder={disableCommandOrder}
              />
            );
          })}
    </div>
  );
}

function OrderActionRowCell({
  actionRowRef,
  header,
  selectedRows,
  onSelectedRowsDataChange,
  stickyStyle,
  onAddLibrary,
  setCommand,
  noBundle = false,
  size = "default",
  disableCommandOrder = false,
}: {
  actionRowRef: React.RefObject<HTMLDivElement | null>;
  header: MyTreeGridHeaderType;
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
  stickyStyle: React.CSSProperties;
  onAddLibrary: (order: any) => void;
  setCommand: (command: string) => void;
  noBundle: boolean;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  disableCommandOrder?: boolean;
}) {
  const sizeClass =
    GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS];
  const { showLibrary, setShowLibrary } = useSearchSettingStore();

  const cell = (key: string) => {
    switch (key) {
      case "name":
        return (
          <PrescriptionLibrarySearch
            actionRowRef={actionRowRef}
            onAddLibrary={onAddLibrary}
            setCommand={setCommand}
            inputTestId="medical-prescription-search-input"
            inputClassName={`order-action-row-search-input order-action-row-search-input-${key}`}
            placeholder="처방 검색"
            hideMagnifyingGlass={true}
            showBundle={!noBundle}
            showUserCode={true}
            showLibrary={true}
            footerNode={
              <div className="flex flex-row items-center justify-end w-full">
                {!disableCommandOrder && (
                  <div className="flex-1 text-[10px] text-[var(--text-secondary)]">
                    ({COMMAND_PREFIX}/{COMMAND_DIVIDE_LINE})를 입력하고 이어서 내용을 작성하면 (지시오더/구분선)을 추가할 수 있습니다.
                  </div>
                )}
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
        );
      case "dose":
      case "times":
      case "days":
        return (
          <ActionRowTextNumber
            header={header}
            selectedRows={selectedRows}
            onSelectedRowsDataChange={onSelectedRowsDataChange}
            sizeClass={sizeClass}
          />
        );

      case "isPowder":
        return (
          <ActionOralMedicationPowder
            header={header}
            selectedRows={selectedRows}
            onSelectedRowsDataChange={onSelectedRowsDataChange}
          />
        );

      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center bg-[var(--bg-base1)] overflow-hidden p-[1px] my-[1px]"
      )}
      style={{
        width: `${header.width ?? getHeaderDefaultWidth(header.name)}px`,
        minWidth: `${header.width ?? getHeaderDefaultWidth(header.name)}px`,
        ...stickyStyle,
      }}
    >
      {cell(header.key)}
    </div>
  );
}
