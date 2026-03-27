import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import type { MentionPatientResult } from "@/types/hospital-chat-types";

type MentionListProps = {
  items: MentionPatientResult[];
  command: (item: MentionPatientResult) => void;
};

const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
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
    <div
      className="z-50 rounded-md shadow-lg bg-[var(--card)] border max-w-[280px] flex flex-col"
      style={{ minWidth: "10rem" }}
    >
      <div className="max-h-[220px] my-scroll p-1">
        {props.items.length ? (
          props.items.map((item, index) => (
            <button
              key={item.patientId}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-left text-sm cursor-pointer ${
                index === selectedIndex
                  ? "bg-blue-100 dark:bg-gray-500 text-black dark:text-white"
                  : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => selectItem(index)}
            >
              <span className="font-medium text-[12px]">
                {item.patientName}
              </span>
              {item.patientNo && (
                <span className="text-[11px] text-gray-400">
                  #{item.patientNo}
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="p-2 text-sm text-[var(--gray-500)]">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
});

MentionList.displayName = "MentionList";

export { MentionList };
