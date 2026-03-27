"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CrmMessageSubType } from "@/constants/crm-enums";

interface MessageContentProps {
  messageContent: string;
  onMessageChange: (content: string) => void;
  placeholders: { text: string; group: number }[];
  hasImage?: boolean;
  className?: string;
  editorTestId?: string;
}

const MessageContent = ({
  messageContent,
  onMessageChange,
  placeholders,
  hasImage = false,
  className,
  editorTestId,
}: MessageContentProps) => {
  const editableRef = useRef<HTMLDivElement>(null);

  const insertTextAtCursor = (text: string) => {
    const editable = editableRef.current;
    if (!editable) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const currentContent = editable.textContent || "";
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editable);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const start = preCaretRange.toString().length;

    const newContent =
      currentContent.substring(0, start) +
      text +
      currentContent.substring(start + (range.endOffset - range.startOffset));

    onMessageChange(newContent);

    // 다음 렌더링 후 커서 위치 설정
    setTimeout(() => {
      if (editable && editable.firstChild) {
        const newCursorPosition = start + text.length;
        const textNode = editable.firstChild;
        const newRange = document.createRange();
        const newSelection = window.getSelection();

        try {
          newRange.setStart(
            textNode,
            Math.min(newCursorPosition, (textNode.textContent || "").length)
          );
          newRange.collapse(true);
          newSelection?.removeAllRanges();
          newSelection?.addRange(newRange);
          editable.focus();
        } catch (e) {
          editable.focus();
        }
      }
    }, 0);
  };

  // EUC-KR 기준 바이트 길이 계산
  const byteLength = useMemo(() => {
    let bytes = 0;
    for (let i = 0; i < messageContent.length; i++) {
      const char = messageContent.charAt(i);
      const code = char.charCodeAt(0);
      if (code > 127) {
        bytes += 2;
      } else {
        bytes += 1;
      }
    }

    return bytes;
  }, [messageContent]);

  // 메시지 타입 결정 (MMS > SMS > LMS)
  const messageType = useMemo(() => {
    if (hasImage) return CrmMessageSubType.MMS;
    return byteLength < 90 ? CrmMessageSubType.SMS : CrmMessageSubType.LMS;
  }, [hasImage, byteLength]);

  // 메시지 타입별 배경색
  const bgColor = useMemo(() => {
    if (messageType === CrmMessageSubType.MMS) return "#FFEEED";
    if (messageType === CrmMessageSubType.SMS) return "var(--blue-1)";
    return "var(--purple-1)";
  }, [messageType]);

  // 메시지 타입별 텍스트 컬러
  const textColor = useMemo(() => {
    if (messageType === CrmMessageSubType.MMS)
      return "var(--color-picker-Red-1)";
    if (messageType === CrmMessageSubType.SMS) return "var(--info)";
    return "var(--purple-2)";
  }, [messageType]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    onMessageChange(text);
  };

  // contentEditable 내용이 외부에서 변경되었을 때 커서 위치를 유지
  useEffect(() => {
    const editable = editableRef.current;
    if (!editable) return;

    // 외부에서 messageContent가 변경되었을 때만 업데이트
    if (editable.textContent !== messageContent) {
      const selection = window.getSelection();
      let cursorPosition = 0;

      // 현재 커서 위치 저장
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editable);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPosition = preCaretRange.toString().length;
      }

      // 내용 업데이트
      editable.textContent = messageContent;

      // 커서 위치 복원
      if (editable.firstChild) {
        try {
          const textNode = editable.firstChild;
          const newRange = document.createRange();
          const newSelection = window.getSelection();
          const newPosition = Math.min(cursorPosition, messageContent.length);

          newRange.setStart(textNode, newPosition);
          newRange.collapse(true);
          newSelection?.removeAllRanges();
          newSelection?.addRange(newRange);
        } catch (e) {
          // 커서 복원 실패 시 무시
        }
      }
    }
  }, [messageContent]);

  return (
    <div
      className={cn(
        "flex-1 flex gap-4 rounded-md p-4",
        "border border-[var(--border-1)]",
        "bg-white overflow-hidden",
        className
      )}
    >
      {/* 메시지 입력 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="flex-1 rounded-md flex flex-col overflow-hidden border"
          style={{
            backgroundColor: bgColor,
            borderColor: bgColor,
          }}
        >
          {/* 메시지 입력 영역 */}
          <div className="flex-1 overflow-hidden relative">
            {messageContent === "" && (
              <div
                className="absolute top-4 left-4 text-sm text-[var(--gray-500)] pointer-events-none"
                aria-hidden="true"
              >
                메시지 내용을 입력하세요.
              </div>
            )}
            <div
              ref={editableRef}
              data-testid={editorTestId}
              contentEditable="plaintext-only"
              onInput={handleInput}
              className={cn(
                "w-full h-full outline-none p-4",
                "text-sm text-[var(--gray-200)] overflow-y-auto overflow-x-hidden",
                "whitespace-pre-wrap break-words bg-transparent"
              )}
              style={{
                maxWidth: "100%",
                width: "100%",
                boxSizing: "border-box",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
              suppressContentEditableWarning
            />
          </div>

          {/* 하단 메시지 유형 표기 영역 */}
          <div
            className={cn(
              "flex justify-end items-center gap-2",
              "h-[20px] px-3 py-2 pb-3"
            )}
          >
            <span
              className={cn(
                "text-right font-normal",
                "text-xs text-[var(--gray-300)]"
              )}
            >
              {byteLength} / {byteLength > 90 ? 2000 : 90} bytes
            </span>
            <div
              className="flex justify-center items-center rounded px-[5px] py-[2px] gap-[2px]"
              style={{
                backgroundColor: bgColor,
              }}
            >
              <span
                className="text-xs"
                style={{
                  color: textColor,
                }}
              >
                {messageType === CrmMessageSubType.SMS && "SMS"}
                {messageType === CrmMessageSubType.LMS && "LMS"}
                {messageType === CrmMessageSubType.MMS && "MMS"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 플레이스홀더 목록 */}
      <div className="w-24 flex flex-col">
        <div className="flex flex-col">
          {placeholders.map((placeholder, index) => {
            const isFirstItem = index === 0;
            const isDifferentGroup =
              index > 0 && placeholders[index - 1]?.group !== placeholder.group;
            const marginTop = isFirstItem
              ? ""
              : isDifferentGroup
                ? "mt-4"
                : "mt-2";

            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={cn(
                  "w-full justify-center text-sm py-2 border-[var(--border-2)]",
                  marginTop
                )}
                onClick={() => insertTextAtCursor(`{${placeholder.text}}`)}
              >
                {placeholder.text}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageContent;
