import { useRef, useEffect, useCallback } from "react";
import MyInput from "@/components/yjg/my-input";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import OrderDivideRow from "./order-divide-row";
import OrderCommandOrderRow from "./order-command-order-row";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { useInputSlashCommand } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/use-input-slash-command";
import { TextareaSlashCommandPopup } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/textarea-slash-command-popup";
import { InputType } from "@/types/chart/order-types";
import { getCustomOrderCells } from "../converter/order-common-converter-util";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export const COMMAND_PREFIX = "--";
export const COMMAND_DIVIDE_LINE = "---";

export default function OrderActionCommand({
  command,
  size,
  setCommand,
  setIsShowCommandOrder,
  onAddCustomOrder,
  onCellDataChange,
  onCommandSubmitComplete,
}: {
  command: string;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  setCommand: (command: string) => void;
  setIsShowCommandOrder: (isShowCommandOrder: boolean) => void;
  onAddCustomOrder: (row: MyTreeGridRowType) => void;
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void;
  onCommandSubmitComplete?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 슬래시 명령어 훅
  const {
    commandListRef,
    slashState,
    commandItems,
    handleKeyDown: slashHandleKeyDown,
    handleInputChange,
    closeSlashCommand,
  } = useInputSlashCommand({
    templateCodeType: TemplateCodeType.지시오더,
    currentValue: command,
    externalInputRef: inputRef,
    onInsert: (content) => {
      setCommand(content);
    },
  });

  // CommandRow가 마운트되면 즉시 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCommandOnChange = useCallback(
    (value: string) => {
      setCommand(value);

      // COMMAND_DIVIDE_LINE으로 시작하면 슬래시 명령어 비활성화
      if (value.startsWith(COMMAND_DIVIDE_LINE)) {
        closeSlashCommand();
      } else {
        // 슬래시 명령어 처리
        handleInputChange(value, value.length);
      }

      if (value.startsWith(COMMAND_PREFIX)) {
        setIsShowCommandOrder(true);
      } else {
        setIsShowCommandOrder(false);
      }
    },
    [setCommand, handleInputChange, setIsShowCommandOrder, closeSlashCommand]
  );

  const submitCommandIfValid = useCallback(() => {
    const userCode = getUserCode(command);
    let inputType = InputType.일반;
    if (userCode === COMMAND_PREFIX) {
      inputType = InputType.지시오더;
    } else if (userCode === COMMAND_DIVIDE_LINE) {
      inputType = InputType.구분선;
    } else {
      return;
    }

    const rowKey = getRowKey("command");
    const name = getName(userCode, command);

    const getIcon = () => {
      if (userCode === COMMAND_PREFIX) {
        return <GetItemTypeCategoryIcon size={size} category="command" />;
      } else {
        return undefined;
      }
    };

    onAddCustomOrder({
      rowKey,
      parentRowKey: null,
      type: "item",
      orgData: {
        type: "custom-order",
        data: {
          userCode,
          name,
        },
      },
      iconBtn: getIcon(),
      cells: getCustomOrderCells(inputType, userCode, name),
      customRender: GetCustomOrderRow(
        rowKey,
        size,
        userCode,
        name,
        onCellDataChange
      ),
    });
    setCommand("");
    setIsShowCommandOrder(false);
    onCommandSubmitComplete?.();
  }, [
    command,
    size,
    onAddCustomOrder,
    onCellDataChange,
    setCommand,
    setIsShowCommandOrder,
    onCommandSubmitComplete,
  ]);

  const handleCommandOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 슬래시 명령어가 열려있으면 해당 키 이벤트 처리
    if (slashHandleKeyDown(e)) {
      return;
    }
    if (e.key === "Enter") {
      submitCommandIfValid();
    }
  };

  const handleBlur = useCallback(
    (_e: React.FocusEvent<HTMLInputElement> | string) => {
      submitCommandIfValid();
    },
    [submitCommandIfValid]
  );

  return (
    <>
      <MyInput
        ref={inputRef}
        type="text"
        value={command}
        onChange={handleCommandOnChange}
        isSelectAllOnFocus={false}
        onKeyDown={handleCommandOnKeyDown}
        onBlur={handleBlur}
      />
      <TextareaSlashCommandPopup
        ref={commandListRef}
        isOpen={slashState.isOpen}
        position={slashState.position}
        items={commandItems}
        onSelect={(item) => item.command({ editor: null as any, range: null as any })}
      />
    </>
  );
}

export function GetCustomOrderRow(
  rowKey: string,
  size: "xs" | "sm" | "default" | "lg" | "xl",
  userCode: string | undefined,
  name: string | undefined,
  onCellDataChange?: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void
) {
  if (!userCode) return null;

  switch (userCode) {
    case COMMAND_PREFIX:
      return (
        <OrderCommandOrderRow
          rowKey={rowKey}
          size={size}
          name={name}
          onCellDataChange={onCellDataChange}
        />
      );
    case COMMAND_DIVIDE_LINE:
      return (
        <OrderDivideRow
          rowKey={rowKey}
          size={size}
          name={name}
          onCellDataChange={onCellDataChange}
        />
      );
    default:
      return null;
  }
}

function getUserCode(command: string) {
  if (command.startsWith(COMMAND_DIVIDE_LINE)) {
    return COMMAND_DIVIDE_LINE;
  }

  if (command.startsWith(COMMAND_PREFIX)) {
    return COMMAND_PREFIX;
  }

  return "";
}

function getName(userCode: string, command: string) {
  return command.replace(userCode, "");
}
