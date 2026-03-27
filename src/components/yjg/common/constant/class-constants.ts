export const INPUT_COMMON_CLASS =
  "border border-[var(--input-border)] rounded-sm text-[var(--foreground)] bg-[var(--input-bg)] hover:border-gray-400 dark:hover:border-gray-600";
export const INPUT_FOCUS_CLASS =
  "focus-within:outline-none focus-within:border-none focus-within:ring-1 focus-within:ring-[var(--input-focus)]/50 focus-within:border-[var(--input-focus)]/50";
export const SEARCH_INPUT_CLASS =
  "flex-1 border-0 bg-transparent min-w-0 outline-none text-[12px] px-[6px]";
export const HIGHLIGHT_KEYWORD_CLASS = "font-semibold text-black bg-yellow-200";

export const INPUT_SIZE_CLASS = {
  xs: "text-[8px] px-[2px] py-[1px]",
  sm: "text-[10px] px-[3px] py-[1px]",
  md: "text-[12px] px-[6px] py-[3px]",
  lg: "text-[14px] px-[8px] py-[4px]",
};

export const CHECKBOX_LABEL_SIZE_CLASS = {
  xs: "text-[10px] px-[1px]",
  sm: "text-[12px] px-[2px]",
  md: "text-[14px] px-[3px]",
  lg: "text-[16px] px-[4px]",
};

export const CHECKBOX_SIZE_CLASS = {
  xs: "!w-[12px] !h-[12px] rounded-[1px]",
  sm: "!w-[14px] !h-[14px] rounded-[2px]",
  md: "!w-[16px] !h-[16px] rounded-[3px]",
  lg: "!w-[18px] !h-[18px] rounded-[4px]",
};

export const GRID_ROW_HEIGHT = {
  xs: 20,
  sm: 24,
  default: 28,
  lg: 32,
  xl: 36,
};

export const GRID_FONT_SIZE = {
  xs: 10,
  sm: 12,
  default: 14,
  lg: 16,
  xl: 18,
};

export const GRID_FONT_SIZE_CLASS = {
  xs: "text-[10px] p-[1px]",
  sm: "text-[12px] p-[2px]",
  default: "text-[14px] p-[3px]",
  lg: "text-[16px] p-[4px]",
  xl: "text-[18px] p-[5px]",
};

export const ITEM_TYPE_ICON_SIZE_PX = {
  xs: 10,
  sm: 12,
  default: 14,
  lg: 16,
  xl: 18,
};

// Tailwind는 동적 클래스를 감지 못하므로 완전한 문자열을 사용해야 함
export const ITEM_TYPE_ICON_SIZE_CLASS = {
  xs: "w-[10px] h-[10px]",
  sm: "w-[12px] h-[12px]",
  default: "w-[14px] h-[14px]",
  lg: "w-[16px] h-[16px]",
  xl: "w-[18px] h-[18px]",
};

export const ITEM_TYPE_CONTAINER_SIZE_PX = {
  xs: 12,
  sm: 16,
  default: 20,
  lg: 24,
  xl: 28,
};

// Tailwind는 동적 클래스를 감지 못하므로 완전한 문자열을 사용해야 함
export const ITEM_TYPE_CONTAINER_SIZE_CLASS = {
  xs: "w-[12px] h-[20px]",
  sm: "w-[16px] h-[24px]",
  default: "w-[20px] h-[28px]",
  lg: "w-[24px] h-[32px]",
  xl: "w-[28px] h-[36px]",
};

export const TOOLTIP_CLASS = "max-w-[30vw] whitespace-pre-wrap";

export const HEADER_TEXT_CLASS = "text-[13px] text-[var(--gray-400)] font-[500]";
