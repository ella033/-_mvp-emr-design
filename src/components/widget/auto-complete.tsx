import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Input } from "@/components/ui/input";

const SAMPLE_WORDS = ["펠루비정", "모사딘정", "아스피린", "어지럼증"];

interface AutoCompleteInputProps {
  placeholder?: string;
  className?: string;
  onSelect?: (value: string) => void;
}

export default function AutoCompleteInput({
  placeholder = "검색어를 입력하세요",
  className,
  onSelect,
}: AutoCompleteInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }
    const filtered = SAMPLE_WORDS.filter((word) =>
      word.toLowerCase().includes(inputValue.trim().toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [inputValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) setIsOpen(true);
  };

  const handleInputBlur = () => {
    // 10ms 지연 후 닫기 (클릭 이벤트 우선)
    setTimeout(() => setIsOpen(false), 10);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect?.(suggestion);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredSuggestions.length
      ) {
        const selected = filteredSuggestions[highlightedIndex];
        if (selected !== undefined) handleSuggestionClick(selected);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className={`relative w-full max-w-md ${className ?? ""}`.trim()}>
      <Input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="autocomplete-listbox"
        aria-activedescendant={
          highlightedIndex >= 0 ? `autocomplete-option-${highlightedIndex}` : ""
        }
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="pr-10"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          id="autocomplete-listbox"
          ref={listRef}
          role="listbox"
          className="absolute z-10 w-full mt-1 overflow-auto bg-white border rounded-md shadow-lg dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 max-h-56"
        >
          {filteredSuggestions.map((suggestion, idx) => (
            <li
              key={suggestion}
              id={`autocomplete-option-${idx}`}
              role="option"
              aria-selected={highlightedIndex === idx}
              className={`cursor-pointer px-4 py-2 text-sm select-none transition-colors
                ${highlightedIndex === idx ? "bg-primary text-primary-foreground" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}
              `}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
