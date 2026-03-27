import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListCheckIcon,
  ListIcon,
  ListOrderedIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  TextQuoteIcon,
  AlignJustifyIcon,
  Highlighter,
  ListCollapse,
  Palette,
  Pin,
} from "lucide-react";

import MyTiptapEditorToolbarBtn from "./my-tiptap-editor-toolbar-btn";
import {
  MyTiptapEditorDropdownMenu,
  MyTiptapEditorDropdownMenuItem,
} from "./my-tiptap-editor-dropdown-menu";
import MyPopup from "@/components/yjg/my-pop-up";
import { useState } from "react";
import { DOMSerializer } from "prosemirror-model";
import { TemplateCodeType } from "@/constants/common/common-enum";
import TemplateCodeAdd from "@/app/master-data/_components/(tabs)/(template-code)/template-code-add";
import { useToastHelpers } from "@/components/ui/toast";

// hex 색상을 rgba로 변환하는 함수 (opacity 0.5)
function hexToRgba(hex: string, alpha: number = 0.5) {
  let c = hex.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

interface MyTiptapEditorFloatingMenuProps {
  editor: Editor;
  templateCodeType: TemplateCodeType;
  isUseTemplate?: boolean;
}

export default function MyTiptapEditorFloatingMenu({
  editor,
  templateCodeType,
  isUseTemplate,
}: MyTiptapEditorFloatingMenuProps) {
  const { success } = useToastHelpers();
  const [selectedContent, setSelectedContent] = useState("");
  const [isTemplateCodeAddOpen, setIsTemplateCodeAddOpen] = useState(false);
  // 고정된 하이라이트 색상 5개
  const fixedHighlightColors = ["", "#fff475", "#fbbc04", "#d7aefb", "#fdcfe8"];

  // 고정된 텍스트 색상 5개
  const fixedTextColors = ["", "#ff0000", "#0066cc", "#008000", "#ff6600"];

  // 현재 선택된 텍스트의 하이라이트 색상 가져오기
  const getCurrentHighlightColor = () => {
    if (!editor.isActive("highlight")) {
      return null;
    }
    const highlightAttrs = editor.getAttributes("highlight");
    const currentColor = highlightAttrs.color;
    if (!currentColor) return null;

    // rgba 색상을 hex로 변환하여 비교
    const rgbaToHex = (rgba: string) => {
      const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match || !match[1] || !match[2] || !match[3]) return null;
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return (
        "#" +
        [r, g, b]
          .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      );
    };

    const currentHex = rgbaToHex(currentColor);
    if (!currentHex) return null;

    // fixedHighlightColors와 비교 (대소문자 무시)
    return (
      fixedHighlightColors.find(
        (color) => color.toLowerCase() === currentHex.toLowerCase()
      ) || null
    );
  };

  const currentHighlightColor = getCurrentHighlightColor();

  // 현재 선택된 텍스트의 색상 가져오기
  const getCurrentTextColor = () => {
    const colorAttrs = editor.getAttributes("textStyle");
    const currentColor = colorAttrs.color;
    if (!currentColor) return null;

    // rgb/rgba 색상을 hex로 변환하여 비교
    const rgbToHex = (rgb: string) => {
      // rgb(255, 0, 0) 또는 rgba(255, 0, 0, 1) 형식 처리
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match || !match[1] || !match[2] || !match[3]) {
        // 이미 hex 형식인 경우
        if (rgb.startsWith("#")) {
          return rgb;
        }
        return null;
      }
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return (
        "#" +
        [r, g, b]
          .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      );
    };

    const currentHex = rgbToHex(currentColor);
    if (!currentHex) return null;

    // fixedTextColors와 비교 (대소문자 무시)
    return (
      fixedTextColors.find(
        (color) => color.toLowerCase() === currentHex.toLowerCase()
      ) || null
    );
  };

  const currentTextColor = getCurrentTextColor();

  const handleFormatClick = (command: () => void) => {
    command();
    // 서식 적용 후 선택 해제하여 메뉴 닫기
    setTimeout(() => {
      const { from } = editor.state.selection;
      editor.commands.setTextSelection(from);
    }, 0);
  };

  return (
    <div className="flex gap-0.5 items-center">
      <MyTiptapEditorDropdownMenu
        icon={<Bold className="w-4 h-4" />}
        title="텍스트 스타일"
        tooltip="텍스트 스타일을 선택합니다."
      >
        <div className="flex flex-row gap-1 p-1">
          <MyTiptapEditorToolbarBtn
            isActive={editor.isActive("bold")}
            title="굵게 (Ctrl+B)"
            tooltip="텍스트를 굵게 표시합니다."
            icon={<Bold className="w-4 h-4" />}
            onClick={() =>
              handleFormatClick(() => editor.chain().focus().toggleBold().run())
            }
          />
          <MyTiptapEditorToolbarBtn
            isActive={editor.isActive("italic")}
            title="기울임 (Ctrl+I)"
            tooltip="텍스트를 기울임꼴로 표시합니다."
            icon={<Italic className="w-4 h-4" />}
            onClick={() =>
              handleFormatClick(() =>
                editor.chain().focus().toggleItalic().run()
              )
            }
          />
          <MyTiptapEditorToolbarBtn
            isActive={editor.isActive("strike")}
            title="취소선 (Ctrl+Shift+S)"
            tooltip="텍스트에 취소선을 표시합니다."
            icon={<Strikethrough className="w-4 h-4" />}
            onClick={() =>
              handleFormatClick(() =>
                editor.chain().focus().toggleStrike().run()
              )
            }
          />
          <MyTiptapEditorToolbarBtn
            isActive={editor.isActive("underline")}
            title="밑줄 (Ctrl+U)"
            tooltip="텍스트에 밑줄을 표시합니다."
            icon={<UnderlineIcon className="w-4 h-4" />}
            onClick={() =>
              handleFormatClick(() =>
                editor.chain().focus().toggleUnderline().run()
              )
            }
          />
        </div>
      </MyTiptapEditorDropdownMenu>
      <MyTiptapEditorDropdownMenu
        icon={<Palette className="w-4 h-4" />}
        title="텍스트 색상"
        tooltip="텍스트 색상을 선택합니다."
      >
        <div className="flex flex-row gap-1 p-1">
          {fixedTextColors.map((color, idx) => {
            // 빈 문자열인 경우 (색상 해제)
            const isClearButton = color === "";
            // 현재 선택된 텍스트에 색상이 있고, 해당 색상과 일치하는지 확인
            const isActive =
              !isClearButton &&
              currentTextColor?.toLowerCase() === color.toLowerCase();

            return (
              <button
                key={idx}
                style={{
                  background: isClearButton ? "var(--fg-main)" : color,
                  border: isActive ? "3px solid #007bff" : "1px solid #ccc",
                  width: 15,
                  height: 15,
                  borderRadius: 4,
                  position: "relative",
                  flexShrink: 0,
                }}
                onClick={() => {
                  handleFormatClick(() => {
                    if (isClearButton) {
                      // 색상 해제
                      editor.chain().focus().unsetColor().run();
                    } else {
                      // 색상 적용
                      editor.chain().focus().setColor(color).run();
                    }
                  });
                }}
              ></button>
            );
          })}
        </div>
      </MyTiptapEditorDropdownMenu>
      <MyTiptapEditorDropdownMenu
        icon={<Highlighter className="w-4 h-4" />}
        title="하이라이트 (Ctrl+Shift+H)"
        tooltip="텍스트를 하이라이트 표시합니다."
      >
        <div className="flex flex-row gap-1 p-1">
          {fixedHighlightColors.map((color, idx) => {
            // 빈 문자열인 경우 (하이라이트 해제)
            const isClearButton = color === "";
            // 현재 선택된 텍스트에 하이라이트가 있고, 해당 색상과 일치하는지 확인
            const isActive =
              !isClearButton &&
              currentHighlightColor?.toLowerCase() === color.toLowerCase();

            return (
              <button
                key={idx}
                style={{
                  background: isClearButton ? "transparent" : color,
                  border: isActive ? "3px solid #007bff" : "1px solid #ccc",
                  width: 15,
                  height: 15,
                  borderRadius: 4,
                  position: "relative",
                  flexShrink: 0,
                }}
                onClick={() => {
                  handleFormatClick(() => {
                    if (isClearButton) {
                      // 하이라이트 해제
                      editor.chain().focus().unsetHighlight().run();
                    } else {
                      // 하이라이트 적용
                      editor
                        .chain()
                        .focus()
                        .setHighlight({ color: hexToRgba(color) })
                        .run();
                    }
                  });
                }}
              ></button>
            );
          })}
        </div>
      </MyTiptapEditorDropdownMenu>
      <MyTiptapEditorDropdownMenu
        icon={
          editor.isActive("heading", { level: 1 }) ? (
            <Heading1Icon className="w-4 h-4" />
          ) : editor.isActive("heading", { level: 2 }) ? (
            <Heading2Icon className="w-4 h-4" />
          ) : editor.isActive("heading", { level: 3 }) ? (
            <Heading3Icon className="w-4 h-4" />
          ) : (
            <Heading1Icon className="w-4 h-4" />
          )
        }
        title="제목"
        tooltip="제목 스타일을 선택합니다."
      >
        <MyTiptapEditorDropdownMenuItem
          tooltip="제목 1 (Ctrl+Alt+1)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            )
          }
        >
          <Heading1Icon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="제목 2 (Ctrl+Alt+2)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            )
          }
        >
          <Heading2Icon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="제목 3 (Ctrl+Alt+3)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            )
          }
        >
          <Heading3Icon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
      </MyTiptapEditorDropdownMenu>
      <MyTiptapEditorDropdownMenu
        icon={
          editor.isActive("blockquote") ? (
            <TextQuoteIcon className="w-4 h-4" />
          ) : editor.isActive("bulletList") ? (
            <ListIcon className="w-4 h-4" />
          ) : editor.isActive("orderedList") ? (
            <ListOrderedIcon className="w-4 h-4" />
          ) : editor.isActive("taskList") ? (
            <ListCheckIcon className="w-4 h-4" />
          ) : (
            <ListIcon className="w-4 h-4" />
          )
        }
        title="목록 및 인용구"
        tooltip="목록 및 인용구 스타일을 선택합니다."
      >
        <MyTiptapEditorDropdownMenuItem
          tooltip="인용구 (Ctrl+Shift+B)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleBlockquote().run()
            )
          }
        >
          <TextQuoteIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="목록 (Ctrl+Shift+8)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleBulletList().run()
            )
          }
        >
          <ListIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="번호 목록 (Ctrl+Shift+7)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleOrderedList().run()
            )
          }
        >
          <ListOrderedIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="체크박스 (Ctrl+Shift+9)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().toggleTaskList().run()
            )
          }
        >
          <ListCheckIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="토글 목록 (Ctrl+Shift+T)"
          onClick={() =>
            handleFormatClick(() =>
              editor.can().setDetails()
                ? editor.chain().focus().setDetails().run()
                : editor.chain().focus().unsetDetails().run()
            )
          }
        >
          <ListCollapse className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
      </MyTiptapEditorDropdownMenu>
      <MyTiptapEditorDropdownMenu
        icon={
          editor.isActive({ textAlign: "left" }) ? (
            <AlignLeftIcon className="w-4 h-4" />
          ) : editor.isActive({ textAlign: "center" }) ? (
            <AlignCenterIcon className="w-4 h-4" />
          ) : editor.isActive({ textAlign: "right" }) ? (
            <AlignRightIcon className="w-4 h-4" />
          ) : editor.isActive({ textAlign: "justify" }) ? (
            <AlignJustifyIcon className="w-4 h-4" />
          ) : (
            <AlignLeftIcon className="w-4 h-4" />
          )
        }
        title="정렬"
        tooltip="텍스트 정렬을 선택합니다."
      >
        <MyTiptapEditorDropdownMenuItem
          tooltip="왼쪽 정렬 (Ctrl+Shift+L)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().setTextAlign("left").run()
            )
          }
        >
          <AlignLeftIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="중앙 정렬 (Ctrl+Shift+E)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().setTextAlign("center").run()
            )
          }
        >
          <AlignCenterIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="오른쪽 정렬 (Ctrl+Shift+R)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().setTextAlign("right").run()
            )
          }
        >
          <AlignRightIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
        <MyTiptapEditorDropdownMenuItem
          tooltip="양쪽 정렬 (Ctrl+Shift+J)"
          onClick={() =>
            handleFormatClick(() =>
              editor.chain().focus().setTextAlign("justify").run()
            )
          }
        >
          <AlignJustifyIcon className="w-4 h-4" />
        </MyTiptapEditorDropdownMenuItem>
      </MyTiptapEditorDropdownMenu>
      {isUseTemplate && (
        <MyTiptapEditorDropdownMenuItem
          title="상용구"
          tooltip="선택 영역을 상용구로 저장합니다."
          onClick={() => {
            if (!editor) return;
            const { state } = editor;
            const { selection } = state;
            if (selection.empty) return;

            const slice = selection.content();
            const serializer = DOMSerializer.fromSchema(state.schema);
            const div = document.createElement("div");
            div.appendChild(serializer.serializeFragment(slice.content));
            setSelectedContent(div.innerHTML);
            setIsTemplateCodeAddOpen(true);
          }}
        />
      )}
      {!editor.isActive("pinnedBox") && (
        <MyTiptapEditorToolbarBtn
          isActive={false}
          title="고정"
          tooltip="선택한 텍스트를 상단에 고정합니다."
          onClick={() => {
            editor.chain().focus().setPinnedBox().run();
          }}
        />
      )}


      <div onMouseDown={(e) => e.stopPropagation()}>
        <MyPopup
          title="상용구 추가"
          width="500px"
          height="450px"
          minWidth="500px"
          minHeight="450px"
          isOpen={isTemplateCodeAddOpen}
          onCloseAction={() => {
            setIsTemplateCodeAddOpen(false);
          }}
          localStorageKey="template-code-add-popup"
          closeOnOutsideClick={false}
        >
          <TemplateCodeAdd
            initialContent={selectedContent}
            initialType={templateCodeType}
            onSuccessAction={() => {
              setIsTemplateCodeAddOpen(false);
              setSelectedContent("");
              success("등록 완료", "상용구가 등록되었습니다.");
            }}
            onCancelAction={() => {
              setIsTemplateCodeAddOpen(false);
            }}
          />
        </MyPopup>
      </div>
    </div>
  );
}
