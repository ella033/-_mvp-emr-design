import { Image } from "@tiptap/extension-image";

export const ResizableImage = Image.extend({
  addGlobalAttributes() {
    return [
      {
        types: [this.name],
        attributes: {
          width: {
            default: null,
            parseHTML: (element) => element.style.width,
            renderHTML: (attributes) => {
              if (!attributes.width) {
                return {};
              }
              return {
                style: `width: ${attributes.width}`,
              };
            },
          },
          height: {
            default: null,
            parseHTML: (element) => element.style.height,
            renderHTML: (attributes) => {
              if (!attributes.height) {
                return {};
              }
              return {
                style: `height: ${attributes.height}`,
              };
            },
          },
        },
      },
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement("div");
      container.className = "resizable-image-container";

      const image = document.createElement("img");
      image.src = node.attrs.src;
      image.alt = node.attrs.alt || "";
      image.className = "my-tiptap-image";

      // 기존 크기 속성 적용
      if (node.attrs.width) {
        image.style.width = node.attrs.width;
      }
      if (node.attrs.height) {
        image.style.height = node.attrs.height;
      }

      // 리사이즈 핸들 추가
      const resizeHandle = document.createElement("div");
      resizeHandle.className = "image-resize-handle";
      resizeHandle.innerHTML = `
        <div class="resize-handle" title="크기 조정"></div>
      `;

      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;

      const handleMouseDown = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();

        isResizing = true;
        startX = mouseEvent.clientX;
        startY = mouseEvent.clientY;
        startWidth = image.offsetWidth;
        startHeight = image.offsetHeight;

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      };

      const handleMouseMove = (e: Event) => {
        if (!isResizing) return;

        const mouseEvent = e as MouseEvent;
        const deltaX = mouseEvent.clientX - startX;
        const deltaY = mouseEvent.clientY - startY;

        let newWidth = startWidth + deltaX;
        let newHeight = startHeight + deltaY;

        // 최소 크기 제한
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        // 비율 유지 (Shift 키를 누른 경우)
        if (mouseEvent.shiftKey) {
          const aspectRatio = startWidth / startHeight;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        image.style.width = `${newWidth}px`;
        image.style.height = `${newHeight}px`;

        // 에디터 상태 업데이트
        if (typeof getPos === "function") {
          editor.commands.updateAttributes("image", {
            width: `${newWidth}px`,
            height: `${newHeight}px`,
          });
        }
      };

      const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      // 리사이즈 핸들에 이벤트 리스너 추가
      const handle = resizeHandle.querySelector(".resize-handle");
      if (handle) {
        handle.addEventListener("mousedown", handleMouseDown);
      }

      container.appendChild(image);
      container.appendChild(resizeHandle);

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "image") {
            return false;
          }

          image.src = updatedNode.attrs.src;
          image.alt = updatedNode.attrs.alt || "";

          if (updatedNode.attrs.width) {
            image.style.width = updatedNode.attrs.width;
          }
          if (updatedNode.attrs.height) {
            image.style.height = updatedNode.attrs.height;
          }

          return true;
        },
      };
    };
  },
});
