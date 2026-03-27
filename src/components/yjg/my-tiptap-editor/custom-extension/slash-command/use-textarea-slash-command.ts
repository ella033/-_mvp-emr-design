import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { stripHtmlTags } from  "@/utils/template-code-utils";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import type { CommandItem } from "./slash-command-extension";

interface UseTextareaSlashCommandOptions {
  templateCodeType: TemplateCodeType;
  onInsert: (content: string) => void;
}

interface SlashCommandState {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number };
  slashIndex: number; // 슬래시가 시작된 위치
}

export function useTextareaSlashCommand({
  templateCodeType,
  onInsert,
}: UseTextareaSlashCommandOptions) {
  const { data: templateCodes = [] } = useTemplateCodes();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandListRef = useRef<any>(null);

  const [slashState, setSlashState] = useState<SlashCommandState>({
    isOpen: false,
    query: "",
    position: { top: 0, left: 0 },
    slashIndex: -1,
  });

  // 필터링된 템플릿 코드 목록
  const filteredTemplates = useMemo(() => {
    const filtered = templateCodes
      .filter((tc) => {
        if (templateCodeType === TemplateCodeType.전체) {
          return true;
        }
        return (
          tc.type.includes(TemplateCodeType.전체) ||
          tc.type.includes(templateCodeType)
        );
      })
      .sort((a, b) => {
        if (a.isQuickMenu === b.isQuickMenu) return 0;
        return a.isQuickMenu ? -1 : 1;
      });

    return filtered;
  }, [templateCodes, templateCodeType]);

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
          // 슬래시와 쿼리를 제거하고 템플릿 내용 삽입
          const textarea = textareaRef.current;
          if (textarea) {
            const before = textarea.value.substring(0, slashState.slashIndex);
            const after = textarea.value.substring(textarea.selectionStart);
            const strippedContent = stripHtmlTags(template.content);
            onInsert(before + strippedContent + after);
          }
          closeSlashCommand();
        },
      }));
  }, [filteredTemplates, slashState.query, slashState.slashIndex, onInsert]);

  const closeSlashCommand = useCallback(() => {
    setSlashState({
      isOpen: false,
      query: "",
      position: { top: 0, left: 0 },
      slashIndex: -1,
    });
  }, []);

  // 커서 위치 계산
  const getCaretCoordinates = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    // 임시 span을 사용하여 커서 위치 계산
    const computed = window.getComputedStyle(textarea);
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.font = computed.font;
    div.style.padding = computed.padding;
    div.style.width = computed.width;
    div.style.lineHeight = computed.lineHeight;

    const textBeforeCursor = textarea.value.substring(
      0,
      textarea.selectionStart
    );
    div.textContent = textBeforeCursor;

    const span = document.createElement("span");
    span.textContent = "|";
    div.appendChild(span);

    document.body.appendChild(div);

    const rect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();

    document.body.removeChild(div);

    return {
      top: rect.top + (spanRect.top - div.getBoundingClientRect().top) + 20,
      left: rect.left + (spanRect.left - div.getBoundingClientRect().left),
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!slashState.isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeSlashCommand();
        return;
      }

      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        commandListRef.current?.onKeyDown({ event: e });
        return;
      }
    },
    [slashState.isOpen, closeSlashCommand]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;

      // 슬래시 명령어가 열려있는 경우
      if (slashState.isOpen) {
        // 슬래시 위치부터 현재 커서까지의 텍스트
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
        // 새로운 슬래시 입력 감지
        const lastChar = value[cursorPos - 1];
        if (lastChar === "/") {
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
    textareaRef,
    commandListRef,
    slashState,
    commandItems,
    handleKeyDown,
    handleChange,
    closeSlashCommand,
  };
}

