import { Node, mergeAttributes } from "@tiptap/core";
import { TextSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Fragment } from "@tiptap/pm/model";

export interface PinnedBoxOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pinnedBox: {
      /**
       * Set a pinned box
       */
      setPinnedBox: () => ReturnType;
      /**
       * Unset a pinned box
       */
      unsetPinnedBox: () => ReturnType;
    };
  }
}

export const PinnedBox = Node.create<PinnedBoxOptions>({
  name: "pinnedBox",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: "block+",

  group: "block",

  defining: true,

  isolating: true, // 다른 노드와 병합되지 않도록 설정 (백스페이스 키 오류 방지)

  selectable: true, // 노드 선택 가능

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pinnedBoxGapCursorFix"),
        props: {
          // GapCursor가 pinnedBox 경계에서 content validation 오류를 일으키지 않도록 방지
          // selectionBetween을 가로채서 pinnedBox 경계에서 GapCursor가 작동하지 않도록 함
          handleDOMEvents: {
            mousedown: () => {
              // 기본 동작 유지
              return false;
            },
          },
          // selectionBetween을 가로채서 pinnedBox 경계에서 GapCursor 생성 방지
          handleClick: (view, pos) => {
            const { state } = view;
            const $pos = state.doc.resolve(pos);

            // pinnedBox 노드의 경계 근처인지 확인
            for (let depth = $pos.depth; depth >= 0; depth--) {
              const node = depth > 0 ? $pos.node(depth) : $pos.parent;

              if (node.type.name === this.name) {
                const start = depth > 0 ? $pos.start(depth) : $pos.start();
                const end = depth > 0 ? $pos.end(depth) : $pos.end();

                // pinnedBox 경계 바로 앞이나 뒤에서 클릭한 경우
                if (pos === start - 1 || pos === end + 1) {
                  // GapCursor를 생성하지 않도록 일반 텍스트 선택으로 처리
                  view.dispatch(state.tr.setSelection(TextSelection.near($pos)));
                  return true;
                }
              }
            }

            return false;
          },
        },
        // selectionBetween에서 발생하는 오류를 방지하기 위해
        // pinnedBox 경계에서의 선택을 조정
        appendTransaction: () => {
          return null;
        },
      }),
    ];
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: "pinned-box",
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return {
            class: attributes.class,
          };
        },
      },
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-collapsed") === "true",
        renderHTML: (attributes) => {
          if (attributes.collapsed) {
            return { "data-collapsed": "true" };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pinnedBox"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "pinnedBox" }, this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addNodeView() {
    return ({ editor, node }) => {
      const container = document.createElement("div");
      container.setAttribute("data-type", "pinnedBox");
      container.className = "pinned-box-container";

      // 편집 가능한 내용 영역
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "pinned-box-content";

      // 접기/펼치기 버튼
      const foldButton = document.createElement("button");
      foldButton.className = "pinned-box-fold-btn";
      foldButton.type = "button";
      foldButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5625 12.5L12.5 8.5625" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5625 12.5V9.125C8.5625 8.97582 8.62176 8.83274 8.72725 8.72725C8.83274 8.62176 8.97582 8.5625 9.125 8.5625H12.5V4.625C12.5 4.32663 12.3815 4.04048 12.1705 3.8295C11.9595 3.61853 11.6734 3.5 11.375 3.5H4.625C4.32663 3.5 4.04048 3.61853 3.8295 3.8295C3.61853 4.04048 3.5 4.32663 3.5 4.625V11.375C3.5 11.6734 3.61853 11.9595 3.8295 12.1705C4.04048 12.3815 4.32663 12.5 4.625 12.5H8.5625Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

      // 아이콘 업데이트 함수
      const updateFoldIcon = (collapsed: boolean) => {
        if (collapsed) {
          foldButton.setAttribute("aria-label", "펼치기");
          foldButton.title = "상단고정을 펼칩니다.";
        } else {
          foldButton.setAttribute("aria-label", "접기");
          foldButton.title = "상단고정을 접습니다.";
        }
      };

      // 초기 상태 설정
      const isCollapsed = node.attrs.collapsed || false;
      updateFoldIcon(isCollapsed);
      if (isCollapsed) {
        contentWrapper.style.display = "none";
        container.classList.add("pinned-box-collapsed");
      }

      // 접기/펼치기 버튼 클릭 핸들러
      foldButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        editor
          .chain()
          .focus()
          .command(({ tr, state, dispatch }) => {
            if (!dispatch) return false;

            // 문서에서 pinnedBox 노드 찾기 (1개만 존재)
            let foundPinnedBoxPos: number | null = null;
            let foundPinnedBoxNode: any = null;

            state.doc.descendants((node, pos) => {
              if (node.type.name === this.name) {
                foundPinnedBoxPos = pos;
                foundPinnedBoxNode = node;
                return false; // 찾았으면 중단
              }
              return true; // 계속 순회
            });

            if (foundPinnedBoxPos !== null && foundPinnedBoxNode) {
              const currentCollapsed = foundPinnedBoxNode.attrs.collapsed || false;
              const newCollapsed = !currentCollapsed;

              tr.setNodeMarkup(foundPinnedBoxPos, undefined, {
                ...foundPinnedBoxNode.attrs,
                collapsed: newCollapsed,
              });
              dispatch(tr);
              return true;
            }

            return false;
          })
          .run();
      });

      // 삭제 버튼 생성
      const deleteButton = document.createElement("button");
      deleteButton.className = "pinned-box-delete-btn";
      // X 아이콘 SVG
      deleteButton.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      deleteButton.setAttribute("aria-label", "삭제");
      deleteButton.title = "상단고정을 삭제합니다.";
      deleteButton.type = "button";

      // 삭제 버튼 클릭 핸들러: 문서에서 pinnedBox를 찾아 전체 삭제
      deleteButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        editor
          .chain()
          .focus()
          .command(({ tr, state, dispatch }) => {
            if (!dispatch) return false;

            // 문서에서 pinnedBox 노드 찾기 (1개만 존재)
            let foundPinnedBoxPos: number | null = null;
            let foundPinnedBoxSize: number = 0;

            state.doc.descendants((node, pos) => {
              if (node.type.name === this.name) {
                foundPinnedBoxPos = pos;
                foundPinnedBoxSize = node.nodeSize;
                return false; // 찾았으면 중단
              }
              return true; // 계속 순회
            });

            if (foundPinnedBoxPos !== null) {
              tr.delete(foundPinnedBoxPos, foundPinnedBoxPos + foundPinnedBoxSize);
              dispatch(tr);
              return true;
            }

            return false;
          })
          .run();
      });

      // DOM 구조 구성
      container.appendChild(contentWrapper);
      container.appendChild(foldButton);
      container.appendChild(deleteButton);

      let currentNode = node;

      return {
        dom: container,
        contentDOM: contentWrapper, // ProseMirror가 이 영역을 자동으로 관리
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }

          // collapsed 상태 업데이트
          const newCollapsed = updatedNode.attrs.collapsed || false;
          const oldCollapsed = currentNode.attrs.collapsed || false;

          if (newCollapsed !== oldCollapsed) {
            updateFoldIcon(newCollapsed);
            if (newCollapsed) {
              contentWrapper.style.display = "none";
              container.classList.add("pinned-box-collapsed");
            } else {
              contentWrapper.style.display = "";
              container.classList.remove("pinned-box-collapsed");
            }
            currentNode = updatedNode; // 노드 참조 업데이트
          }

          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      setPinnedBox:
        () =>
        ({ state, tr, dispatch }) => {
          if (!dispatch) return false;

          const { selection, doc } = state;
          const { from, to } = selection;

          // 선택이 없으면 현재 블록의 텍스트 사용
          let selectedText = "";
          if (selection.empty) {
            // 선택이 없으면 현재 블록의 텍스트 추출
            const { $anchor } = selection;
            const node = $anchor.parent;
            if (node.type.name === this.name) {
              return false; // 이미 pinnedBox 안에 있으면 아무것도 하지 않음
            }
            // 현재 블록의 모든 텍스트 추출
            selectedText = node.textContent;
          } else {
            // 선택된 텍스트만 추출 (정확한 from, to 범위)
            const slice = doc.slice(from, to);
            const textContent: string[] = [];

            // slice에서 텍스트만 추출
            slice.content.forEach((node) => {
              const extractText = (n: any): void => {
                if (n.isText) {
                  textContent.push(n.text);
                } else if (n.content) {
                  n.content.forEach((child: any) => extractText(child));
                }
              };
              extractText(node);
            });

            selectedText = textContent.join("").trim();
          }

          // 기존 pinnedBox 찾아서 삭제 (1개만 허용)
          let existingPinnedBoxPos: number | null = null;
          let existingPinnedBoxSize: number = 0;

          doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              existingPinnedBoxPos = pos;
              existingPinnedBoxSize = node.nodeSize;
              return false; // 찾았으면 중단
            }
            return true; // 계속 순회
          });

          // 기존 pinnedBox가 있으면 먼저 삭제
          if (existingPinnedBoxPos !== null) {
            tr.delete(existingPinnedBoxPos, existingPinnedBoxPos + existingPinnedBoxSize);
          }

          // 본문 내용은 유지 (선택된 텍스트 삭제하지 않음 - 복사 방식)

          // 삽입 위치: 최상단 (기존 pinnedBox 위치 또는 0)
          const insertPos = existingPinnedBoxPos !== null ? existingPinnedBoxPos : 0;

          // Content에서 모든 태그 제거하고 텍스트만 추출하여 <p>로 감싸기
          const paragraphType = state.schema.nodes.paragraph;
          if (!paragraphType) {
            return false;
          }

          let content: Fragment;

          // 추출된 텍스트를 <p>로 감싸기
          if (selectedText) {
            const paragraphNode = paragraphType.create({}, [state.schema.text(selectedText)]);
            content = Fragment.from([paragraphNode]);
          } else {
            // 빈 텍스트면 빈 paragraph 생성
            const paragraphNode = paragraphType.create();
            content = Fragment.from([paragraphNode]);
          }

          // pinnedBox 노드 생성 및 삽입
          try {
            const pinnedBoxNode = this.type.create({}, content);
            tr.insert(insertPos, pinnedBoxNode);

            // 커서를 새로 삽입된 pinnedBox 내부로 이동
            const newPos = insertPos + 1;
            const $newPos = tr.doc.resolve(newPos);
            if ($newPos.parent.type === this.type) {
              tr.setSelection(TextSelection.near($newPos));
            }
          } catch (error) {
            console.error("pinnedBox 생성 실패:", error);
            return false;
          }

          dispatch(tr);
          return true;
        },
      unsetPinnedBox:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});
