import {
  cloneElement,
  createElement,
  isValidElement,
  type ReactNode,
} from "react";

const DEFAULT_DPI = 96;
const MM_PER_INCH = 25.4;

export function mmToPx(value: number): number {
  return (value / MM_PER_INCH) * DEFAULT_DPI;
}

export function mmValue(value: number): string {
  return `${value}mm`;
}

export function resolveMargin(
  margin?: Partial<{
    top: number;
    right: number;
    bottom: number;
    left: number;
  }>,
) {
  const top = margin?.top ?? 15;
  const right = margin?.right ?? 15;
  const bottom = margin?.bottom ?? 15;
  const left = margin?.left ?? 15;

  return {
    top,
    right,
    bottom,
    left,
    px: {
      top: mmToPx(top),
      right: mmToPx(right),
      bottom: mmToPx(bottom),
      left: mmToPx(left),
    },
  };
}

export function createRepeatedRenderer(
  renderer:
    | (() => ReactNode | null | undefined)
    | ReactNode
    | undefined,
) {
  return function renderInstance(key?: string | number) {
    if (!renderer) {
      return null;
    }

    const element =
      typeof renderer === "function" ? renderer() : renderer ?? null;

    if (!element) {
      return null;
    }

    if (isValidElement(element)) {
      return cloneElement(element, {
        key: key ?? element.key ?? undefined,
      });
    }

    return createElement(
      "span",
      { key, style: { display: "contents" } },
      element,
    );
  };
}

