"use client";
import React, {
  useRef,
  useState,
  useEffect,
  KeyboardEvent,
  useCallback,
} from "react";
import { TextField } from "@/components/ui/textfield";
import { cn } from "@/lib/utils";
import { safeGetComputedStyle } from "@/components/yjg/common/util/ui-util";

const MEDICATIONS = ["펠루비정", "모사딘정", "어지럼증"];

type Suggestion = {
  label: string;
  value: string;
};

const SUGGESTIONS: Suggestion[] = MEDICATIONS.map((m) => ({
  label: m,
  value: m,
}));

function getSlashCommandInfo(
  value: string,
  caret: number
): { start: number; end: number; keyword: string } | null {
  // caret 이전 텍스트에서 마지막 '/' 위치 찾기
  const before = value.slice(0, caret);
  const slashIdx = before.lastIndexOf("/");
  if (slashIdx === -1) return null;
  // 슬래시 앞이 공백, 줄시작, 혹은 nothing이어야 함
  const isValidPrefix =
    slashIdx === 0 ||
    /\s/.test(before[slashIdx - 1] ?? "") ||
    before[slashIdx - 1] === undefined;
  if (!isValidPrefix) return null;
  // 슬래시 뒤에 공백이나 줄바꿈이 오면 명령어 아님
  const afterSlash = before.slice(slashIdx + 1);
  if (afterSlash.includes(" ") || afterSlash.includes("\n")) return null;
  return {
    start: slashIdx,
    end: caret,
    keyword: afterSlash,
  };
}

export default function SlashCommandAutocompleteEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [filtered, setFiltered] = useState<Suggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // caret 위치 추적
  const updateCaret = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    setCaret(el.selectionStart ?? 0);
  }, []);

  // 슬래시 명령어 감지 및 드롭다운 표시
  useEffect(() => {
    const info = getSlashCommandInfo(value, caret);
    if (info) {
      const keyword = info.keyword.toLowerCase();
      const filtered =
        keyword === ""
          ? SUGGESTIONS
          : SUGGESTIONS.filter((s) =>
              s.label.toLowerCase().startsWith(keyword)
            );
      setFiltered(filtered);

      setShowMenu(filtered.length > 0);
      setSelectedIdx(0);
      setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        const { top, left } = getCaretCoordinates(el, info.end);
        setMenuPos({ top, left });
      }, 0);
    } else {
      setShowMenu(false);
    }
  }, [value, caret]);

  // ESC/바깥 클릭 시 닫기
  useEffect(() => {
    if (!showMenu) return;
    const onClick = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc as any);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc as any);
    };
  }, [showMenu]);

  // 드롭다운에서 항목 선택
  const handleSelect = (item: Suggestion | undefined) => {
    if (!item) return;
    const info = getSlashCommandInfo(value, caret);
    if (!info) return;
    const before = value.slice(0, info.start);
    const after = value.slice(info.end);
    const newValue =
      before +
      `${item.label}` + // 토큰화: <span> 대신 플레이스홀더
      after;
    setValue(newValue);
    setShowMenu(false);
    setTimeout(() => {
      // caret을 토큰 뒤로 이동
      const el = textareaRef.current;
      if (el) {
        const pos = before.length + item.label.length + 2; // < >
        el.focus();
        el.setSelectionRange(pos, pos);
        setCaret(pos);
      }
    }, 0);
  };

  // 키보드 내비게이션
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!showMenu) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((idx) => (idx + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((idx) => (idx - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(filtered[selectedIdx]);
    } else if (e.key === "Escape") {
      setShowMenu(false);
    }
  };

  return (
    <div className="relative w-full">
      <TextField
        ref={textareaRef as any}
        multiline
        rows={4}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setTimeout(updateCaret, 0);
        }}
        onClick={updateCaret}
        onKeyUp={updateCaret}
        onKeyDown={handleKeyDown}
        placeholder="환자의 처방약을 입력해주세요"
        inputClassName="font-mono"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={showMenu}
        aria-controls={showMenu ? "slash-menu" : undefined}
      />
      {showMenu && (
        <ul
          id="slash-menu"
          role="listbox"
          className="absolute z-50 min-w-[180px] bg-white border border-gray-200 rounded-md shadow-lg mt-1"
          style={{
            top: menuPos.top + 24, // textarea caret 아래
            left: menuPos.left,
          }}
        >
          {filtered.map((item, i) => (
            <li
              key={item.value}
              role="option"
              aria-selected={i === selectedIdx}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-blue-100",
                i === selectedIdx && "bg-blue-100 font-bold"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// textarea caret 좌표 계산 유틸
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  pos: number
): { top: number; left: number } {
  // textarea의 스타일을 복제한 div 생성
  const div = document.createElement("div");
  const style = safeGetComputedStyle(textarea);
  if (!style) return { top: 0, left: 0 };
  for (const prop of style) {
    div.style.setProperty(prop, style.getPropertyValue(prop));
  }
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.width = `${textarea.offsetWidth}px`;
  div.style.height = `${textarea.offsetHeight}px`;
  div.style.overflow = "auto";
  div.textContent = textarea.value.substring(0, pos);
  // caret 위치에 span 추가
  const span = document.createElement("span");
  span.textContent = "\u200b";
  div.appendChild(span);
  document.body.appendChild(div);
  const { offsetTop: top, offsetLeft: left } = span;
  document.body.removeChild(div);
  // textarea의 top/left 보정
  // const rect = textarea.getBoundingClientRect();
  return {
    top: top,
    left: left,
  };
}
