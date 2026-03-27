// "@/components/yjg/common/util/ui-util";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HIGHLIGHT_KEYWORD_CLASS } from "../constant/class-constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const safeDocument =
  typeof document !== "undefined"
    ? document
    : {
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        getElementById: () => null,
        createElement: () => {},
        body: {
          appendChild: () => {},
        },
      };

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage.getItem failed:", error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage.setItem failed:", error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("localStorage.removeItem failed:", error);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.clear();
    } catch (error) {
      console.warn("localStorage.clear failed:", error);
    }
  },
};

export const safeJsonParse = <T>(value: string | null, defaultValue: T): T => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("JSON.parse failed:", error);
    return defaultValue;
  }
};

export const safeGetComputedStyle = (element: Element | null): CSSStyleDeclaration | null => {
  if (typeof window === "undefined" || !element) return null;
  try {
    return window.getComputedStyle(element);
  } catch (error) {
    console.warn("window.getComputedStyle failed:", error);
    return null;
  }
};

/**
 * item의 value를 안전하게 변환하여 controlled input 오류를 방지
 * @param value - 원본 값
 * @returns 안전한 값 (undefined -> "")
 */
export function getSafeValue(
  value: string | number | boolean | null | undefined | object
): string | number | boolean {
  if (value === undefined || value === null || value === "null" || typeof value === "object") {
    return "";
  }
  return value;
}

/**
 * item의 value를 boolean으로 안전하게 변환
 * @param value - 원본 값
 * @returns boolean 값 (undefined/null -> false)
 */
export function getSafeBooleanValue(value: string | number | boolean | null | undefined): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  return Boolean(value);
}

/**
 * item의 value를 number로 안전하게 변환
 * @param value - 원본 값
 * @returns number 값 (undefined/null -> 0)
 */
export function getSafeNumberValue(value: string | number | boolean | null | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 검색 키워드 하이라이트 유틸리티 함수
 * @param text - 하이라이트할 텍스트
 * @param keyword - 검색 키워드 (공백으로 분리된 여러 단어 지원)
 * @param options - 옵션 (className: 하이라이트 클래스, splitWords: 공백으로 단어 분리 여부)
 * @returns 하이라이트된 React.ReactNode
 */
export function highlightKeyword(
  text: string,
  keyword?: string,
  options?: {
    className?: string;
    splitWords?: boolean;
  }
): React.ReactNode {
  if (!keyword || !text || typeof text !== "string") {
    return text;
  }

  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    return text;
  }

  const className = options?.className || HIGHLIGHT_KEYWORD_CLASS;
  const splitWords = options?.splitWords ?? false;

  let escapedPattern: string;

  if (splitWords) {
    // 공백으로 분리하여 각 단어를 개별적으로 처리
    const words = trimmedKeyword.split(/\s+/).filter((word) => word.length > 0);

    if (words.length === 0) {
      return text;
    }

    // 각 단어를 escape하고 OR(|)로 연결
    const escapedWords = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    escapedPattern = escapedWords.join("|");
  } else {
    // 단일 키워드
    escapedPattern = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const regex = new RegExp(`(${escapedPattern})`, "gi");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // 매치 이전 텍스트 추가
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // 매치된 키워드 하이라이트
    parts.push(
      React.createElement(
        "mark",
        {
          key: `highlight-${keyIndex}-${match.index}`,
          className: className,
        },
        match[0]
      )
    );

    lastIndex = regex.lastIndex;
    keyIndex++;

    // 무한 루프 방지 (매치가 0 길이인 경우)
    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  // 남은 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? React.createElement(React.Fragment, null, ...parts) : text;
}

// HTML 콘텐츠에서 검색 키워드 하이라이트 (HTML 태그 내부는 제외)
export function highlightKeywordInHTML(html: string, keyword?: string): string {
  if (!keyword || !html) return html;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // HTML 태그 사이의 텍스트에서만 키워드를 찾아 하이라이트
  // 태그 사이의 텍스트 노드를 찾아서 하이라이트 처리
  const regex = new RegExp(`(>)([^<]*?)(${escapedKeyword})([^<]*?)(<)`, "gi");
  return html.replace(
    regex,
    (_match, p1, p2, p3, p4, p5) =>
      `${p1}${p2}<mark class="${HIGHLIGHT_KEYWORD_CLASS}">${p3}</mark>${p4}${p5}`
  );
}
