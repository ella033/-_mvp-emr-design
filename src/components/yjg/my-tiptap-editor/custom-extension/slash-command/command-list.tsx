import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { CommandItem } from "./slash-command-extension";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { Star } from "lucide-react";
import { SettingIcon } from "@/components/custom-icons";
import { useUIStore } from "@/store/ui-store";

type CommandListProps = {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  onClose?: () => void;
};

const CommandList = forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const openTemplateCodePopup = useUIStore(
    (state) => state.openTemplateCodePopup
  );
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  // 선택된 항목이 변경되면 스크롤
  useEffect(() => {
    const selectedElement = itemRefs.current[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <>
      <div
        className="z-50 rounded-md shadow-lg bg-[var(--card)] border max-w-[300px] flex flex-col"
        style={{ minWidth: "10rem" }}
      >
        {/* 스크롤 가능한 항목 영역 */}
        <div className="max-h-[260px] my-scroll p-1">
          {props.items.length ? (
            props.items.map((item, index) => (
              <button
                key={index}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`flex flex-col w-full gap-0.5 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${index === selectedIndex
                  ? "bg-blue-100 dark:bg-gray-500 text-black dark:text-white"
                  : "bg-transparent text-gray-600 dark:text-gray-400"
                  }`}
                onClick={() => selectItem(index)}
              >
                <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                  {item.isQuickMenu && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
                  <span className="font-medium text-[12px]">{item.title}</span>
                </div>
                <MyTooltip delayDuration={500} content={item.content}>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {item.content}
                  </div>
                </MyTooltip>
              </button>
            ))
          ) : (
            <div className="p-1 text-sm text-[var(--gray-500)]">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
        {/* 상용구 설정 버튼 (스크롤 영역 밖, 항상 표시) */}
        <div className="border-t border-[var(--border-1)] p-1">
          <button
            className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-600 dark:text-gray-400"
            onClick={(e) => {
              e.stopPropagation();
              openTemplateCodePopup();
              // Escape 키 이벤트로 slash command 닫기
              document.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "Escape",
                  bubbles: true,
                })
              );
              // popup 닫기
              if (props.onClose) {
                props.onClose();
              }
            }}
          >
            <SettingIcon className="w-3.5 h-3.5" />
            <span className="text-[12px]">상용구 설정</span>
          </button>
        </div>
      </div>
    </>
  );
});

CommandList.displayName = "CommandList";

export { CommandList };
