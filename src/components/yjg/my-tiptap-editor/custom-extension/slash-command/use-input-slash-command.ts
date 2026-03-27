import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import type { CommandItem } from "./slash-command-extension";
import {stripHtmlTags, filterAndSortTemplates } from "@/utils/template-code-utils";

interface UseInputSlashCommandOptions {
  templateCodeType: TemplateCodeType;
  onInsert: (content: string) => void;
  /** 현재 입력값을 외부에서 관리하는 경우 전달 */
  currentValue?: string;
  /** 외부에서 관리하는 input ref */
  externalInputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

interface SlashCommandState {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number };
  slashIndex: number;
}

export function useInputSlashCommand({
  templateCodeType,
  onInsert,
  currentValue,
  externalInputRef,
}: UseInputSlashCommandOptions) {
  const { data: templateCodes = [] } = useTemplateCodes();
  const internalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const commandListRef = useRef<any>(null);
  const currentValueRef = useRef(currentValue ?? "");

  // currentValue가 변경될 때마다 ref 업데이트
  useEffect(() => {
    if (currentValue !== undefined) {
      currentValueRef.current = currentValue;
    }
  }, [currentValue]);

  const [slashState, setSlashState] = useState<SlashCommandState>({
    isOpen: false,
    query: "",
    position: { top: 0, left: 0 },
    slashIndex: -1,
  });

  // 필터링된 템플릿 코드 목록
  const filteredTemplates = useMemo(
    () => filterAndSortTemplates(templateCodes, templateCodeType),
    [templateCodes, templateCodeType]
  );

  const closeSlashCommand = useCallback(() => {
    setSlashState({
      isOpen: false,
      query: "",
      position: { top: 0, left: 0 },
      slashIndex: -1,
    });
  }, []);

  // CommandItem으로 변환
  const commandItems: CommandItem[] = useMemo(() => {
    return filteredTemplates
      .filter((template) =>
        template.code.toLowerCase().includes(slashState.query.toLowerCase())
      )
      .map((template) => ({
        isQuickMenu: template.isQuickMenu,
        title: template.code,
        content: stripHtmlTags(template.content),
        command: () => {
          const input = inputRef.current;
          const value = currentValue ?? input?.value ?? "";
          const before = value.substring(0, slashState.slashIndex);
          const selectionStart = input?.selectionStart ?? value.length;
          const after = value.substring(selectionStart);
          const strippedContent = stripHtmlTags(template.content);
          onInsert(before + strippedContent + after);
          closeSlashCommand();
        },
      }));
  }, [filteredTemplates, slashState.query, slashState.slashIndex, onInsert, currentValue, closeSlashCommand]);

  // 커서 위치 계산
  const getCaretCoordinates = useCallback(() => {
    const input = inputRef.current;
    if (!input) return { top: 0, left: 0 };

    const rect = input.getBoundingClientRect();
    const computed = window.getComputedStyle(input);
    const selectionStart = input.selectionStart ?? 0;
    const isTextarea = input.tagName.toLowerCase() === "textarea";

    if (isTextarea) {
      // textarea용: mirror div를 사용하여 정확한 커서 위치 계산
      const mirror = document.createElement("div");
      mirror.style.position = "absolute";
      mirror.style.visibility = "hidden";
      mirror.style.whiteSpace = "pre-wrap";
      mirror.style.wordWrap = "break-word";
      mirror.style.font = computed.font;
      mirror.style.fontSize = computed.fontSize;
      mirror.style.fontFamily = computed.fontFamily;
      mirror.style.lineHeight = computed.lineHeight;
      mirror.style.letterSpacing = computed.letterSpacing;
      mirror.style.padding = computed.padding;
      mirror.style.border = computed.border;
      mirror.style.boxSizing = computed.boxSizing;
      mirror.style.width = computed.width;

      const textBeforeCursor = input.value.substring(0, selectionStart);
      mirror.textContent = textBeforeCursor;

      // 커서 위치를 표시할 span
      const caretSpan = document.createElement("span");
      caretSpan.textContent = "|";
      mirror.appendChild(caretSpan);

      document.body.appendChild(mirror);

      const mirrorRect = mirror.getBoundingClientRect();
      const caretRect = caretSpan.getBoundingClientRect();

      document.body.removeChild(mirror);

      // 스크롤 위치 고려
      const scrollTop = (input as HTMLTextAreaElement).scrollTop || 0;
      const scrollLeft = input.scrollLeft || 0;

      return {
        top: rect.top + (caretRect.top - mirrorRect.top) - scrollTop + 18 + window.scrollY,
        left: rect.left + (caretRect.left - mirrorRect.left) - scrollLeft + window.scrollX,
      };
    } else {
      // input용: 단순 계산
      const mirror = document.createElement("span");
      mirror.style.position = "absolute";
      mirror.style.visibility = "hidden";
      mirror.style.whiteSpace = "pre";
      mirror.style.font = computed.font;
      mirror.style.fontSize = computed.fontSize;
      mirror.style.fontFamily = computed.fontFamily;
      mirror.style.letterSpacing = computed.letterSpacing;

      const textBeforeCursor = input.value.substring(0, selectionStart);
      mirror.textContent = textBeforeCursor;

      document.body.appendChild(mirror);
      const textWidth = mirror.offsetWidth;
      document.body.removeChild(mirror);

      const paddingLeft = parseFloat(computed.paddingLeft) || 0;
      const scrollLeft = input.scrollLeft || 0;

      return {
        top: rect.bottom + 4 + window.scrollY,
        left: rect.left + paddingLeft + textWidth - scrollLeft + window.scrollX,
      };
    }
  }, [inputRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!slashState.isOpen) return false;

      if (e.key === "Escape") {
        e.preventDefault();
        closeSlashCommand();
        return true;
      }

      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Enter"
      ) {
        // 검색 결과가 없을 때 Enter는 전파하여 상위에서 입력 완료(handleDataChange) 등 처리
        if (e.key === "Enter" && commandItems.length === 0) {
          return false;
        }
        e.preventDefault();
        commandListRef.current?.onKeyDown({ event: e });
        return true;
      }

      return false;
    },
    [slashState.isOpen, closeSlashCommand, commandItems]
  );

  const handleInputChange = useCallback(
    (value: string, cursorPos: number) => {
      // 슬래시 명령어가 열려있는 경우
      if (slashState.isOpen) {
        const queryText = value.substring(slashState.slashIndex + 1, cursorPos);

        // 공백이나 슬래시가 삭제된 경우 닫기
        if (
          cursorPos <= slashState.slashIndex ||
          value[slashState.slashIndex] !== "/"
        ) {
          closeSlashCommand();
        } else {
          setSlashState((prev) => ({ ...prev, query: queryText }));
        }
      } else {
        // 새로운 슬래시 입력 감지: 맨 앞이거나 공백 뒤일 때만 동작
        const lastChar = value[cursorPos - 1];
        const charBeforeSlash = cursorPos >= 2 ? value[cursorPos - 2] : undefined;
        const isAtStartOrAfterSpace =
          charBeforeSlash === undefined || charBeforeSlash === " ";
        if (lastChar === "/" && isAtStartOrAfterSpace) {
          const position = getCaretCoordinates();
          setSlashState({
            isOpen: true,
            query: "",
            position,
            slashIndex: cursorPos - 1,
          });
        }
      }
    },
    [slashState.isOpen, slashState.slashIndex, closeSlashCommand, getCaretCoordinates]
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!slashState.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".slash-command-popup")) {
        closeSlashCommand();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashState.isOpen, closeSlashCommand]);

  return {
    inputRef,
    commandListRef,
    slashState,
    commandItems,
    handleKeyDown,
    handleInputChange,
    closeSlashCommand,
  };
}

