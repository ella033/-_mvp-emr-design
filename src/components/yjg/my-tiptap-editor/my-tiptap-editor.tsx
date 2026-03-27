"use client";

import "./my-tiptap-editor.scss";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";

// Heading 확장에서 inputRules 비활성화 (# 으로 서식 자동 적용 방지)
const CustomHeading = Heading.extend({
  addInputRules() {
    return [];
  },
});
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Details } from "@tiptap/extension-details";
import DetailsContent from "@tiptap/extension-details-content";
import DetailsSummary from "@tiptap/extension-details-summary";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { ResizableImage } from "./custom-extension/resizable-image-extension";
import { PinnedBox } from "./custom-extension/pinned-box-extension";
import { FileService } from "@/services/file-service";

import { useState, useRef, useEffect } from "react";
import { SlashCommand } from "./custom-extension/slash-command/slash-command-extension";
import { useToastHelpers } from "@/components/ui/toast";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";

import MyTiptapEditorFloatingMenu from "./my-tiptap-editor-floating-menu";
import MyTiptapEditorContextMenu from "./my-tiptap-editor-context-menu";

export default function MyTiptapEditor({
  templateCodeType = TemplateCodeType.전체,
  placeholder = "",
  content = "",
  onChange,
  testId,
  isUseImageUpload = false,
  isUseTemplate = true,
  readOnly = false,
  imageCategory,
  imageEntityType,
  imageEntityId,
}: {
  templateCodeType?: TemplateCodeType;
  placeholder?: string;
  content?: string;
  onChange?: (content: string) => void;
  testId?: string;
  isUseImageUpload?: boolean;
  isUseTemplate?: boolean;
  readOnly?: boolean;
  imageCategory?: string;
  imageEntityType?: string;
  imageEntityId?: string;
}) {
  const editorContentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: errorToast, success: successToast } = useToastHelpers();
  const { data: templateCodes = [] } = useTemplateCodes();
  const templateCodesRef = useRef(templateCodes);

  // templateCodes가 변경될 때마다 ref 업데이트
  useEffect(() => {
    templateCodesRef.current = templateCodes;
  }, [templateCodes]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 최대 파일 크기 설정 (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024;

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
      },
      // 붙여넣기된 HTML 변환: <br><br> 패턴을 찾아서 <p>로 나누기
      transformPastedHTML(html) {
        // 임시 DOM 요소 생성
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        // 모든 요소를 재귀적으로 처리하는 함수
        const processElement = (element: HTMLElement): void => {
          const children = Array.from(element.childNodes);
          const newElements: HTMLElement[] = [];
          let currentContent: Node[] = [];

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (!child) continue;

            // 자식이 요소 노드인 경우 재귀적으로 처리 (먼저 처리)
            if (child.nodeType === Node.ELEMENT_NODE) {
              processElement(child as HTMLElement);
            }

            currentContent.push(child);

            // <br> 태그가 두 번 연속으로 나오는지 확인
            if (
              child.nodeType === Node.ELEMENT_NODE &&
              (child as HTMLElement).tagName === "BR"
            ) {
              const nextChild = children[i + 1];
              if (
                nextChild &&
                nextChild.nodeType === Node.ELEMENT_NODE &&
                (nextChild as HTMLElement).tagName === "BR"
              ) {
                // <br><br> 패턴 발견 - 여기서 paragraph 나누기
                // 현재까지의 내용을 <p>로 감싸기
                if (currentContent.length > 0) {
                  // 마지막 <br> 제외
                  const contentToWrap = currentContent.slice(0, -1);
                  if (contentToWrap.length > 0) {
                    const newP = document.createElement("p");
                    contentToWrap.forEach((node) => {
                      newP.appendChild(node.cloneNode(true));
                    });
                    newElements.push(newP);
                  }
                }
                // 다음 <br>도 건너뛰기
                i++;
                currentContent = [];
              }
            }
          }

          // 남은 내용이 있으면 마지막 <p>로 감싸기
          if (currentContent.length > 0) {
            const newP = document.createElement("p");
            currentContent.forEach((node) => {
              newP.appendChild(node.cloneNode(true));
            });
            newElements.push(newP);
          }

          // 새로운 <p> 태그들이 있으면 원본 요소의 내용을 교체
          if (newElements.length > 1) {
            // 기존 자식 노드 모두 제거
            while (element.firstChild) {
              element.removeChild(element.firstChild);
            }

            // 새로운 <p> 태그들 추가
            newElements.forEach((newEl) => {
              element.appendChild(newEl);
            });
          }
        };

        // 루트 레벨의 모든 자식 요소 처리
        const rootChildren = Array.from(tempDiv.childNodes);
        const newRootElements: HTMLElement[] = [];
        let currentRootContent: Node[] = [];

        for (let i = 0; i < rootChildren.length; i++) {
          const child = rootChildren[i];
          if (!child) continue;

          // 자식이 요소 노드인 경우 재귀적으로 처리
          if (child.nodeType === Node.ELEMENT_NODE) {
            processElement(child as HTMLElement);
          }

          currentRootContent.push(child);

          // <br> 태그가 두 번 연속으로 나오는지 확인
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (child as HTMLElement).tagName === "BR"
          ) {
            const nextChild = rootChildren[i + 1];
            if (
              nextChild &&
              nextChild.nodeType === Node.ELEMENT_NODE &&
              (nextChild as HTMLElement).tagName === "BR"
            ) {
              // <br><br> 패턴 발견 - 여기서 paragraph 나누기
              if (currentRootContent.length > 0) {
                const contentToWrap = currentRootContent.slice(0, -1);
                if (contentToWrap.length > 0) {
                  const newP = document.createElement("p");
                  contentToWrap.forEach((node) => {
                    newP.appendChild(node.cloneNode(true));
                  });
                  newRootElements.push(newP);
                }
              }
              i++;
              currentRootContent = [];
            }
          }
        }

        // 남은 루트 내용이 있으면 마지막 <p>로 감싸기
        if (currentRootContent.length > 0) {
          const newP = document.createElement("p");
          currentRootContent.forEach((node) => {
            newP.appendChild(node.cloneNode(true));
          });
          newRootElements.push(newP);
        }

        // 루트 레벨에 새로운 <p> 태그들이 있으면 교체
        if (newRootElements.length > 0) {
          // 기존 루트 자식 노드 모두 제거
          while (tempDiv.firstChild) {
            tempDiv.removeChild(tempDiv.firstChild);
          }

          // 새로운 <p> 태그들 추가
          newRootElements.forEach((newP) => {
            tempDiv.appendChild(newP);
          });
        }

        return tempDiv.innerHTML;
      },
    },
    extensions: [
      StarterKit.configure({
        heading: false, // 기본 heading 비활성화 (# 자동 서식 방지를 위해 CustomHeading 사용)
      }),
      CustomHeading.configure({
        levels: [1, 2, 3, 4],
      }),
      Placeholder.configure({
        placeholder: `${placeholder}${isUseTemplate ? " ('/' 입력하여 상용구 검색)" : ""}`,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      Details.configure({
        persist: true,
        HTMLAttributes: {
          class: "details",
        },
      }),
      DetailsSummary,
      DetailsContent,
      Highlight.configure({ multicolor: true }),
      TaskItem.configure({ nested: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ResizableImage.configure({
        HTMLAttributes: {
          class: "my-tiptap-image",
        },
        allowBase64: true,
      }),
      SlashCommand.configure({
        getTemplateCodes: () => templateCodesRef.current,
        templateCodeType: templateCodeType,
      }),
      PinnedBox.configure({
        HTMLAttributes: {
          class: "pinned-box",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // 실제 변경이 있을 때만 onChange 호출
      const newContent = editor.getHTML();
      if (onChange && newContent !== content) {
        onChange(newContent);
      }
    },
  });

  // readOnly prop이 변경될 때 editable 상태 동기화
  // emitUpdate=false로 설정하여 setEditable 시 onUpdate 이벤트가 발생하지 않도록 함
  // (마운트 시 불필요한 onChange → markChanged 방지)
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly, false);
    }
  }, [editor, readOnly]);

  // content prop이 변경될 때 에디터 내용 업데이트 (최적화)
  useEffect(() => {
    if (!editor) return;

    const nextContent = content ?? "";
    const currentContent = editor.getHTML() ?? "";

    // 내용이 실제로 다를 때만 업데이트
    if (nextContent !== currentContent) {
      editor.commands.setContent(nextContent);

      // 내용이 추가된 경우에만 스크롤을 하단으로 이동
      if (nextContent.length > currentContent.length) {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop =
              scrollContainerRef.current.scrollHeight;
          }
        });
      }
    }
  }, [editor, content]);

  useEffect(() => {
    if (!editor || !editorContentRef.current) return;

    const handleDrop = (event: Event) => {
      event.preventDefault();
      const dragEvent = event as DragEvent;

      // 이미지 파일 드롭 처리
      const files = dragEvent.dataTransfer?.files;
      if (files && files.length > 0) {
        const imageFile = Array.from(files).find((file) =>
          file.type.startsWith("image/")
        );
        if (imageFile) {
          handleImageUpload(imageFile);
          return;
        }
      }

      // 기존 HTML 드롭 처리
      const html = dragEvent.dataTransfer?.getData("tiptap-html");
      if (html && editor && editor.view) {
        const coords = { left: dragEvent.clientX, top: dragEvent.clientY };
        const pos = editor.view.posAtCoords(coords)?.pos;
        if (typeof pos === "number") {
          editor.commands.insertContentAt(pos, html);
        } else {
          editor.commands.insertContent(html);
        }
      }
    };

    const dom = editorContentRef.current.querySelector(".ProseMirror");
    dom?.addEventListener("drop", handleDrop);

    return () => {
      dom?.removeEventListener("drop", handleDrop);
    };
  }, [editor]);

  // 외부 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".context-menu") &&
        !target.closest(".table-submenu")
      ) {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu]);

  if (!editor) return null;

  const handleImageUpload = async (file: File) => {
    try {
      // Todo : 일단 카테고리와 타입을 fix 하였는데.. 어디서 업로드 했는지, 어떻게 이미지가 관리되어야 하는지에 따라 다른 값을 입력할 필요 있음.
      const uploadData: any = {
        file: file,
        category: imageCategory,
        entityType: imageEntityType,
        entityId: imageEntityId,
        description: "Tiptap editor image",
      };

      const response = await FileService.uploadFileV2(uploadData);

      // 업로드된 파일의 uuid를 사용하여 다운로드 URL 구성
      if (response && response.uuid) {
        // API 프록시 경로를 사용하여 파일 URL 구성
        editor.chain().focus().setImage({ src: response.storagePath }).run();
      } else {
        console.error("업로드된 파일의 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      errorToast("이미지 업로드 실패");
      // 에러 발생 시 사용자에게 알림 (필요시 토스트나 알림 컴포넌트 사용)
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        errorToast("이미지 파일만 업로드 가능합니다.");
        e.target.value = "";
        return;
      }
      convertToWebP(file);
    }
    // 파일 입력 초기화
    e.target.value = "";
  };

  const convertToWebP = (file: File) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // 원본 크기
      const originalWidth = img.width;
      const originalHeight = img.height;

      let newWidth = originalWidth;
      let newHeight = originalHeight;

      // 파일 크기가 5MB를 넘으면 이미지 크기 조정
      if (file.size > maxSize) {
        // 최대 크기 설정 (1920px)
        const maxDimension = 1920;

        // 비율을 유지하면서 크기 조정
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          if (originalWidth > originalHeight) {
            newWidth = maxDimension;
            newHeight = (originalHeight * maxDimension) / originalWidth;
          } else {
            newHeight = maxDimension;
            newWidth = (originalWidth * maxDimension) / originalHeight;
          }
        }
      }

      // 캔버스 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      // WebP로 변환 (품질 0.9)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              {
                type: "image/webp",
                lastModified: Date.now(),
              }
            );

            const infoMsg = `${(file.size / 1024).toFixed(1)}KB → ${(webpFile.size / 1024).toFixed(1)}KB (파일 크기 ${(
              ((file.size - webpFile.size) / file.size) *
              100
            ).toFixed(1)}% 감소)`;

            console.log("[이미지 WebP 변환 정보]", infoMsg);

            if (webpFile.size > maxSize) {
              errorToast(
                "이미지 최적화 후에도 5MB를 초과합니다. 더 작은 이미지를 선택해주세요."
              );
              return;
            }

            if (file.size > maxSize) {
              successToast("이미지 최적화 정보", infoMsg);
            }

            handleImageUpload(webpFile);
          }
        },
        "image/webp",
        0.9
      );
    };

    img.onerror = () => {
      errorToast("이미지 로딩에 실패했습니다.");
    };

    // 이미지 로드
    img.src = URL.createObjectURL(file);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div
        className="flex flex-1 w-full h-full my-scroll"
        onContextMenu={readOnly ? undefined : handleContextMenu}
        ref={scrollContainerRef}
      >
        <EditorContent
          editor={editor}
          data-testid={testId}
          className="my-tiptap-editor"
          ref={editorContentRef}
        />
        {!readOnly && (
          <>
            <BubbleMenu
              editor={editor}
              tippyOptions={{
                duration: 500,
                appendTo: document.body,
                placement: "top",
              }}
              className="bg-[var(--card)] rounded-sm shadow-lg border p-1"
              shouldShow={({ state }) => !state.selection.empty}
            >
              <MyTiptapEditorFloatingMenu
                editor={editor}
                templateCodeType={templateCodeType}
                isUseTemplate={isUseTemplate}
              />
            </BubbleMenu>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              multiple={false}
            />
          </>
        )}

        {/* Todo: 추후 개인 프로젝트로 옮길 것 / 이미지, 수평선, 토글박스, 테이블 기능 제거 - 기획에서 불필요하다는 의견 */}
        {/* {contextMenu && (
          <MyTiptapEditorContextMenu
            editor={editor}
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
            isUseImageUpload={isUseImageUpload}
            onImageButtonClickAction={handleImageButtonClick}
          />
        )} */}
      </div>
    </div>
  );
}
