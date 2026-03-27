import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Editor } from "@tiptap/react";
import { ChevronRight, ChevronLeft, XIcon } from "lucide-react";
import { MyButton } from "@/components/yjg/my-button";
import MyInput from "@/components/yjg/my-input";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface MyTiptapEditorContextMenuProps {
  editor: Editor;
  contextMenu: ContextMenuPosition;
  setContextMenu: Dispatch<SetStateAction<ContextMenuPosition | null>>;
  isUseImageUpload: boolean;
  onImageButtonClickAction: () => void;
}

// localStorage에서 테이블 크기 불러오기
const getStoredTableSize = (key: string, defaultValue: number): number => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = safeLocalStorage.getItem(key);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(`localStorage에서 ${key} 불러오기 실패:`, error);
  }
  return defaultValue;
};

export default function MyTiptapEditorContextMenu({
  editor,
  contextMenu,
  setContextMenu,
  isUseImageUpload,
  onImageButtonClickAction,
}: MyTiptapEditorContextMenuProps) {
  const [tableMenu, setTableMenu] = useState<ContextMenuPosition | null>(null);
  const [tableRow, setTableRow] = useState(() =>
    getStoredTableSize("tiptap-table-row", 3)
  );
  const [tableCol, setTableCol] = useState(() =>
    getStoredTableSize("tiptap-table-col", 3)
  );

  // tableRow와 tableCol 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      safeLocalStorage.setItem("tiptap-table-row", tableRow.toString());
    } catch (error) {
      console.error("localStorage에 tableRow 저장 실패:", error);
    }
  }, [tableRow]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem("tiptap-table-col", tableCol.toString());
    } catch (error) {
      console.error("localStorage에 tableCol 저장 실패:", error);
    }
  }, [tableCol]);

  return createPortal(
    <div
      className="context-menu fixed bg-[var(--card)] rounded-sm shadow-lg border z-[9999] flex flex-col"
      style={{
        top: `${contextMenu.y}px`,
        left: `${contextMenu.x}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isUseImageUpload && (
        <MyButton
          variant="ghost"
          className="justify-start"
          onClick={() => {
            onImageButtonClickAction();
            setContextMenu(null);
          }}
        >
          이미지
        </MyButton>
      )}
      <MyButton
        variant="ghost"
        className="justify-start"
        onClick={() => {
          editor.chain().focus().setHorizontalRule().run();
          setContextMenu(null);
        }}
      >
        수평선
      </MyButton>
      <MyButton
        variant="ghost"
        className="justify-start"
        onClick={() => {
          editor.can().setDetails()
            ? editor.chain().focus().setDetails().run()
            : editor.chain().focus().unsetDetails().run();
        }}
      >
        토글박스
      </MyButton>
      <div className="flex flex-row items-center relative">
        <MyButton
          variant="ghost"
          className="justify-start flex-1"
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertTable({
                rows: tableRow,
                cols: tableCol,
                withHeaderRow: false,
              })
              .run();
            setContextMenu(null);
            setTableMenu(null);
          }}
        >
          테이블
        </MyButton>
        <MyButton
          variant="ghost"
          className="justify-end"
          onClick={(e) => {
            e.stopPropagation();
            if (tableMenu) {
              setTableMenu(null);
            } else {
              const rect = e.currentTarget.getBoundingClientRect();
              setTableMenu({
                x: rect.right + 4,
                y: rect.top,
              });
            }
          }}
        >
          {tableMenu ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </MyButton>
        {tableMenu &&
          createPortal(
            <div
              className="table-submenu fixed bg-[var(--card)] rounded-sm shadow-lg border z-[10000] flex flex-col"
              style={{
                top: `${tableMenu.y}px`,
                left: `${tableMenu.x}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-1 items-center p-1">
                <MyInput
                  type="text-number"
                  className="w-10 text-center"
                  value={tableRow}
                  onChange={(value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 1 && num <= 99) {
                      setTableRow(num);
                    }
                  }}
                  min={1}
                  max={99}
                />
                <XIcon className="w-3 h-3" />
                <MyInput
                  type="text-number"
                  className="w-10 text-center"
                  value={tableCol}
                  onChange={(value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 1 && num <= 99) {
                      setTableCol(num);
                    }
                  }}
                  min={1}
                  max={99}
                />
              </div>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run();
                }}
              >
                열 추가 (왼쪽)
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run();
                }}
              >
                열 추가 (오른쪽)
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().deleteColumn().run();
                }}
              >
                열 삭제
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().addRowBefore().run();
                }}
              >
                행 추가 (위)
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().addRowAfter().run();
                }}
              >
                행 추가 (아래)
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().deleteRow().run();
                }}
              >
                행 삭제
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().mergeCells().run();
                }}
              >
                선택된 셀 병합
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().splitCell().run();
                }}
              >
                선택된 셀 분할
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().toggleHeaderRow().run();
                }}
              >
                헤더 행 토글
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().toggleHeaderColumn().run();
                }}
              >
                헤더 열 토글
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().toggleHeaderCell().run();
                }}
              >
                헤더 셀 토글
              </MyButton>
              <MyButton
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  setContextMenu(null);
                  setTableMenu(null);
                }}
              >
                테이블 삭제
              </MyButton>
            </div>,
            document.body
          )}
      </div>
    </div>,
    document.body
  );
}
