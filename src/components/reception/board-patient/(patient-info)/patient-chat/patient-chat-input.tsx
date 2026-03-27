"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Send, X, Pencil } from "lucide-react";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import { TemplateCodeType } from "@/constants/common/common-enum";

export interface EditingMessage {
  id: number;
  content: string;
}

interface PatientChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  editingMessage?: EditingMessage | null;
  onSaveEdit?: (id: number, content: string) => void;
  onCancelEdit?: () => void;
}

export default function PatientChatInput({
  onSend,
  isSending,
  editingMessage,
  onSaveEdit,
  onCancelEdit,
}: PatientChatInputProps) {
  const [value, setValue] = useState("");
  const resetKeyRef = useRef(0);

  // 수정 모드 진입 시 에디터에 기존 내용 로드
  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content);
      resetKeyRef.current += 1;
    }
  }, [editingMessage]);

  const handleSend = useCallback(() => {
    const trimmed = value.replace(/<p><\/p>/g, "").trim();
    if (!trimmed || trimmed === "<p></p>" || isSending) return;

    if (editingMessage && onSaveEdit) {
      onSaveEdit(editingMessage.id, trimmed);
    } else {
      onSend(trimmed);
    }

    setValue("");
    resetKeyRef.current += 1;
  }, [value, isSending, onSend, editingMessage, onSaveEdit]);

  const handleCancelEdit = useCallback(() => {
    onCancelEdit?.();
    setValue("");
    resetKeyRef.current += 1;
  }, [onCancelEdit]);

  return (
    <div className="border-t border-[var(--border-2)]">
      {/* 수정 모드 표시 바 */}
      {editingMessage && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-2)] border-b border-[var(--border-2)]">
          <Pencil size={12} className="shrink-0 text-[var(--main-color-2-1)]" />
          <span className="text-xs text-[var(--main-color-2-1)] font-medium">메시지 수정 중</span>
          <div
            className="flex-1 truncate text-xs text-[var(--gray-400)] [&_p]:inline [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: editingMessage.content }}
          />
          <button
            onClick={handleCancelEdit}
            className="shrink-0 rounded p-0.5 text-[var(--gray-400)] hover:text-[var(--gray-500)] hover:bg-[var(--bg-main)]"
            title="수정 취소"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <div
          className="flex-1 rounded-md border border-[var(--border-2)] bg-[var(--bg-main)] text-sm text-[var(--main-color)] [&_.my-tiptap-editor]:h-full [&_.my-tiptap-editor_.ProseMirror]:min-h-[60px] [&_.my-tiptap-editor_.ProseMirror]:p-2"
          style={{ height: "80px", maxHeight: "150px", overflow: "hidden" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
            if (e.key === "Escape" && editingMessage) {
              handleCancelEdit();
            }
          }}
        >
          <MyTiptapEditor
            key={resetKeyRef.current}
            templateCodeType={TemplateCodeType.환자메모}
            placeholder="메시지를 입력하세요... ('/' 상용구)"
            content={value}
            onChange={(val) => setValue(val)}
            isUseImageUpload={false}
            isUseTemplate={true}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!value.replace(/<p><\/p>/g, "").trim() || isSending}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white disabled:opacity-50 ${
            editingMessage ? "bg-amber-500" : "bg-[var(--main-color-2-1)]"
          }`}
        >
          {editingMessage ? <Pencil size={16} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
