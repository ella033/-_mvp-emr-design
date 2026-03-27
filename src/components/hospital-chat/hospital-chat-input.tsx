"use client";

import "@/components/yjg/my-tiptap-editor/my-tiptap-editor.scss";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Send, X, Pencil } from "lucide-react";
import { PatientMention } from "./mention/mention-extension";
import { SlashCommand } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/slash-command-extension";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import MyTiptapEditorFloatingMenu from "@/components/yjg/my-tiptap-editor/my-tiptap-editor-floating-menu";
import type { PatientMention as PatientMentionType } from "@/types/hospital-chat-types";

export interface HospitalEditingMessage {
  id: number;
  content: string;
}

interface Props {
  onSend: (content: string, mentions?: PatientMentionType[]) => void;
  disabled?: boolean;
  editingMessage?: HospitalEditingMessage | null;
  onSaveEdit?: (id: number, content: string) => void;
  onCancelEdit?: () => void;
}

export default function HospitalChatInput({
  onSend,
  disabled,
  editingMessage,
  onSaveEdit,
  onCancelEdit,
}: Props) {
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const { data: templateCodes = [] } = useTemplateCodes();
  const templateCodesRef = useRef(templateCodes);
  const editingMessageRef = useRef(editingMessage);
  editingMessageRef.current = editingMessage;

  // 커스텀 BubbleMenu 상태 (PiP 호환)
  const [bubblePos, setBubblePos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    templateCodesRef.current = templateCodes;
  }, [templateCodes]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "메시지를 입력하세요... (@환자 멘션, / 상용구)",
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      PatientMention,
      SlashCommand.configure({
        getTemplateCodes: () => templateCodesRef.current,
        templateCodeType: TemplateCodeType.환자메모,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[60px] max-h-[120px] overflow-y-auto px-3 py-2 text-sm",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          const doc = view.dom.ownerDocument ?? document;
          const hasSuggestion = doc.querySelector(
            ".tippy-box:not([data-state='hidden'])"
          );
          if (hasSuggestion) return false;
          event.preventDefault();
          handleSend();
          return true;
        }
        if (event.key === "Escape" && editingMessageRef.current) {
          handleCancelEdit();
          return true;
        }
        return false;
      },
    },
    onSelectionUpdate: ({ editor: ed }) => {
      if (ed.state.selection.empty) {
        setBubblePos(null);
        return;
      }
      updateBubblePosition();
    },
    onBlur: () => {
      setTimeout(() => {
        if (!bubbleRef.current?.contains(
          (editorWrapperRef.current?.ownerDocument ?? document).activeElement
        )) {
          setBubblePos(null);
        }
      }, 150);
    },
  });

  // 수정 모드 진입 시 에디터에 기존 내용 로드
  useEffect(() => {
    if (editingMessage && editor) {
      editor.commands.setContent(editingMessage.content);
      editor.commands.focus("end");
    }
  }, [editingMessage, editor]);

  const updateBubblePosition = useCallback(() => {
    if (!editor || !editorWrapperRef.current) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      setBubblePos(null);
      return;
    }

    const wrapperEl = editorWrapperRef.current;
    const doc = wrapperEl.ownerDocument ?? document;
    const win = doc.defaultView ?? window;
    const sel = win.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setBubblePos(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();

    setBubblePos({
      top: rangeRect.top - wrapperRect.top - 40,
      left: rangeRect.left - wrapperRect.left + rangeRect.width / 2,
    });
  }, [editor]);

  const handleSend = useCallback(() => {
    if (!editor || disabled) return;
    const html = editor.getHTML();
    if (!html || html === "<p></p>") return;

    const current = editingMessageRef.current;
    if (current && onSaveEdit) {
      onSaveEdit(current.id, html);
    } else {
      const mentions: PatientMentionType[] = [];
      editor.state.doc.descendants((node) => {
        if (node.type.name === "patientMention" && node.attrs.patientId) {
          mentions.push({
            patientId: node.attrs.patientId,
            patientName: node.attrs.patientName,
          });
        }
      });
      onSend(html, mentions.length > 0 ? mentions : undefined);
    }

    editor.commands.clearContent();
    setBubblePos(null);
  }, [editor, onSend, disabled, onSaveEdit]);

  const handleCancelEdit = useCallback(() => {
    onCancelEdit?.();
    editor?.commands.clearContent();
  }, [onCancelEdit, editor]);

  if (!editor) return null;

  return (
    <div ref={editorWrapperRef} className="relative border-t">
      {/* 수정 모드 표시 바 */}
      {editingMessage && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b">
          <Pencil size={12} className="shrink-0 text-[var(--main-color-2-1)]" />
          <span className="text-xs text-[var(--main-color-2-1)] font-medium">메시지 수정 중</span>
          <div
            className="flex-1 truncate text-xs text-muted-foreground [&_p]:inline [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: editingMessage.content }}
          />
          <button
            onClick={handleCancelEdit}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent"
            title="수정 취소"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <div
          className="flex-1 rounded-md border bg-background text-foreground overflow-hidden [&_.my-tiptap-editor]:h-full [&_.my-tiptap-editor_.ProseMirror]:min-h-[60px] [&_.my-tiptap-editor_.ProseMirror]:p-2"
          style={{ height: "80px", maxHeight: "150px", overflow: "hidden" }}
        >
          <EditorContent editor={editor} className="my-tiptap-editor" />
        </div>

        {/* PiP 호환 커스텀 BubbleMenu */}
        {bubblePos && (
          <div
            ref={bubbleRef}
            className="absolute z-50 bg-[var(--card)] rounded-sm shadow-lg border p-1"
            style={{
              top: `${bubblePos.top}px`,
              left: `${bubblePos.left}px`,
              transform: "translateX(-50%)",
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <MyTiptapEditorFloatingMenu
              editor={editor}
              templateCodeType={TemplateCodeType.환자메모}
              isUseTemplate={true}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled}
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
