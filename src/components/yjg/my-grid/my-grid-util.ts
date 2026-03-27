import type { MyGridHeaderType, MyGridRowType, MyGridCellType } from "./my-grid-type";
import { safeGetComputedStyle, getSafeValue } from "@/components/yjg/common/util/ui-util";
import { GRID_ROW_HEIGHT } from "../common/constant/class-constants";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";

export const HEADER_MIN_WIDTH = 40;

// 그리드 헤더 설정 상수
const GRID_HEADER_SETTINGS = {
  scope: "user" as const,
  category: "grid-header",
};

export const getInitialHeaders = (lsKey: string, defaultHeaders: MyGridHeaderType[]) => {
  // Settings store에서 저장된 헤더 설정 가져오기
  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    GRID_HEADER_SETTINGS.category,
    lsKey
  );
  const savedSettings = savedSetting?.settings?.headers;

  if (savedSettings && Array.isArray(savedSettings)) {
    try {
      const mergedHeaders = defaultHeaders.map((defaultHeader) => {
        const savedHeader = savedSettings.find((h: any) => h.key === defaultHeader.key);
        if (savedHeader) {
          let mergedWidth = savedHeader.width ?? defaultHeader.width;
          if (typeof mergedWidth === "number") {
            const minW = defaultHeader.minWidth ?? HEADER_MIN_WIDTH;
            mergedWidth = Math.max(mergedWidth, minW);
            if (defaultHeader.maxWidth !== undefined) {
              mergedWidth = Math.min(mergedWidth, defaultHeader.maxWidth);
            }
          }

          return {
            ...defaultHeader,
            sortNumber: savedHeader.sortNumber ?? defaultHeader.sortNumber,
            width: mergedWidth,
            visible: savedHeader.visible ?? defaultHeader.visible,
            isFixedLeft: savedHeader.isFixedLeft ?? defaultHeader.isFixedLeft,
            isFixedRight: savedHeader.isFixedRight ?? defaultHeader.isFixedRight,
          };
        }
        return defaultHeader;
      });

      mergedHeaders.sort((a, b) => a.sortNumber - b.sortNumber);
      return mergedHeaders;
    } catch {
      // ignore
    }
  }

  return defaultHeaders;
};

// debounce 타이머 저장용 맵
const saveHeadersTimers: Map<string, NodeJS.Timeout> = new Map();

export const saveHeaders = (lsKey: string, headers: MyGridHeaderType[]) => {
  if (typeof window === "undefined") return;

  // 기존 타이머 클리어
  const existingTimer = saveHeadersTimers.get(lsKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // 500ms debounce 후 저장
  const timer = setTimeout(() => {
    // 변경되는 값만 저장 (sortNumber, width, visible, isFixedLeft, isFixedRight)
    const headersToSave = headers.map((header) => ({
      key: header.key,
      sortNumber: header.sortNumber,
      width: header.width,
      visible: header.visible,
      isFixedLeft: header.isFixedLeft,
      isFixedRight: header.isFixedRight,
    }));

    const payload = {
      scope: GRID_HEADER_SETTINGS.scope,
      category: GRID_HEADER_SETTINGS.category,
      pageContext: lsKey,
      settings: { headers: headersToSave },
    };

    SettingsService.createOrUpdateSetting(payload)
      .then(() => {
        // 저장 성공 시 store에도 반영 (다음 불러오기 시 즉시 반영)
        useSettingsStore.getState().updateSettingLocally(payload);
      })
      .catch((error) => {
        console.error("[saveHeaders] 그리드 헤더 설정 저장 실패:", error);
      });

    saveHeadersTimers.delete(lsKey);
  }, 500);

  saveHeadersTimers.set(lsKey, timer);
};

export const getHeaderDefaultWidth = (name: string | undefined) => {
  // 서버 사이드 렌더링 중에는 기본값 반환
  if (typeof window === "undefined") {
    return HEADER_MIN_WIDTH;
  }

  // CSS 변수에서 기본 폰트 크기 가져오기 (기본값: 14px)
  const getDefaultFontSize = () => {
    try {
      const root = document.documentElement;
      const computedStyle = safeGetComputedStyle(root);
      if (!computedStyle) return 12;
      const fontSize = computedStyle.getPropertyValue("--default-font-size");

      if (fontSize) {
        // '12px' 형태의 문자열에서 숫자만 추출
        const match = fontSize.match(/(\d+(?:\.\d+)?)/);
        return match?.[1] ? parseFloat(match[1]) : 12;
      }
    } catch (error) {
      // 에러 발생 시 기본값 사용
      console.warn("폰트 크기 가져오기 실패:", error);
    }

    return 12; // 기본값
  };

  // 임시 캔버스를 생성하여 텍스트 너비 측정
  const measureTextWidth = (text: string | undefined, fontSize: number) => {
    try {
      const safeText = text || "";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        // 캔버스가 지원되지 않는 경우 대략적인 계산
        return safeText.length * fontSize * 0.5;
      }

      // 폰트 설정 (기본 폰트 패밀리 사용)
      context.font = `${fontSize}px sans-serif`;

      // 텍스트 너비 측정
      const metrics = context.measureText(safeText);
      return metrics.width;
    } catch (error) {
      // 에러 발생 시 대략적인 계산
      console.warn("텍스트 너비 측정 실패:", error);
      return (text || "").length * fontSize * 0.5;
    }
  };

  const fontSize = getDefaultFontSize();
  const textWidth = measureTextWidth(name, fontSize);

  const padding = 8; // 좌우 패딩

  const minWidth = Math.max(textWidth + padding, HEADER_MIN_WIDTH);

  return Math.ceil(minWidth);
};

/** 그리드 size에 따른 폰트 크기(px) */
const GRID_FONT_SIZE_BY_SIZE: Record<string, number> = {
  xs: 10,
  sm: 12,
  default: 14,
  lg: 16,
  xl: 18,
};

/**
 * 컬럼의 콘텐츠(헤더명 + 모든 셀 표시값)에 맞는 너비를 측정한다.
 * 리사이저 더블클릭 시 엑셀처럼 "자동 맞춤"에 사용한다.
 */
export function getColumnContentWidth(
  columnKey: string,
  header: MyGridHeaderType,
  data: MyGridRowType[],
  size: "xs" | "sm" | "default" | "lg" | "xl" = "default"
): number {
  if (typeof window === "undefined") {
    return header.minWidth ?? getHeaderDefaultWidth(header.name);
  }

  const minW = header.minWidth ?? HEADER_MIN_WIDTH;
  const maxW = header.maxWidth;
  const currentColumnWidth = header.width ?? getHeaderDefaultWidth(header.name);

  type TextProfile = {
    fontSize: string;
    fontWeight: string;
    letterSpacing: string;
  };

  const getCellNonContentWidthFromDom = (): number | null => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-my-grid-cell-content-key="${columnKey}"]`)
    );
    if (targets.length === 0) return null;

    const validTargets = targets.filter((target) => target.clientWidth > 0);
    const nonContentCandidates = validTargets
      .map((target) => {
        const colRoot = target.closest<HTMLElement>(`[data-my-grid-col-key="${columnKey}"]`);
        const colWidth = Math.ceil(colRoot?.getBoundingClientRect().width ?? currentColumnWidth);
        return Math.max(0, colWidth - target.clientWidth);
      })
      .filter((n) => Number.isFinite(n));

    if (nonContentCandidates.length === 0) return null;
    return Math.min(...nonContentCandidates);
  };

  const getHeaderNonContentWidthFromDom = (): number | null => {
    const content = document.querySelector<HTMLElement>(
      `[data-my-grid-header-content-key="${columnKey}"]`
    );
    if (!content || content.clientWidth <= 0) return null;
    const colRoot = content.closest<HTMLElement>(`[data-my-grid-col-key="${columnKey}"]`);
    const colWidth = Math.ceil(colRoot?.getBoundingClientRect().width ?? currentColumnWidth);
    return Math.max(0, colWidth - content.clientWidth);
  };

  const getHeaderTextProfileFromDom = (): TextProfile => {
    const headerTarget = document.querySelector<HTMLElement>(
      `[data-my-grid-header-overflow-key="${columnKey}"]`
    );
    const style = headerTarget ? safeGetComputedStyle(headerTarget) : null;
    return {
      fontSize: style?.fontSize || `${GRID_FONT_SIZE_BY_SIZE[size] ?? 14}px`,
      fontWeight: style?.fontWeight || "600",
      letterSpacing: style?.letterSpacing || "normal",
    };
  };

  const getCellTextProfileFromDom = (): TextProfile => {
    const cellTarget = document.querySelector<HTMLElement>(
      `[data-my-grid-cell-overflow-key="${columnKey}"]`
    );
    const style = cellTarget ? safeGetComputedStyle(cellTarget) : null;
    return {
      fontSize: style?.fontSize || `${GRID_FONT_SIZE_BY_SIZE[size] ?? 14}px`,
      fontWeight: style?.fontWeight || "400",
      letterSpacing: style?.letterSpacing || "normal",
    };
  };

  const fallbackTextProfile: TextProfile = {
    fontSize: `${GRID_FONT_SIZE_BY_SIZE[size] ?? 14}px`,
    fontWeight: "400",
    letterSpacing: "normal",
  };

  const cellNonContentWidth = getCellNonContentWidthFromDom() ?? 20;
  const headerNonContentWidth = getHeaderNonContentWidthFromDom() ?? 6;
  const cellTextProfile = getCellTextProfileFromDom() ?? fallbackTextProfile;
  const headerTextProfile = getHeaderTextProfileFromDom();

  const measureHost = document.createElement("div");
  const measureText = document.createElement("div");
  measureHost.style.position = "fixed";
  measureHost.style.left = "-99999px";
  measureHost.style.top = "0";
  measureHost.style.visibility = "hidden";
  measureHost.style.pointerEvents = "none";
  measureHost.style.width = "0";
  measureHost.style.height = "0";

  measureText.style.display = "block";
  measureText.style.whiteSpace = "nowrap";
  measureText.style.overflow = "hidden";
  measureText.style.textOverflow = "ellipsis";

  measureHost.appendChild(measureText);
  document.body.appendChild(measureHost);

  try {
    const getNaturalTextWidth = (text: string, profile: TextProfile) => {
      measureText.style.fontSize = profile.fontSize;
      measureText.style.fontWeight = profile.fontWeight;
      measureText.style.letterSpacing = profile.letterSpacing;
      measureText.textContent = text;
      measureText.style.width = "max-content";
      return Math.ceil(measureText.scrollWidth);
    };

    const headerText = String(header.name ?? "");
    const headerNaturalWidth = getNaturalTextWidth(headerText, headerTextProfile);

    let longestCellText = "";
    let longestCellNaturalWidth = 0;
    for (const row of data) {
      const cell = row.cells?.find((c: MyGridCellType) => c.headerKey === columnKey);
      if (!cell || cell.customRender) continue;
      const displayText = String(getSafeValue(cell.value));
      const displayWidth = getNaturalTextWidth(displayText, cellTextProfile);
      if (displayWidth > longestCellNaturalWidth) {
        longestCellNaturalWidth = displayWidth;
        longestCellText = displayText;
      }
    }

    const cellNonContent = Math.ceil(Math.min(24, Math.max(8, cellNonContentWidth)));
    const headerNonContent = Math.ceil(Math.min(14, Math.max(4, headerNonContentWidth)));
    const cellExtraPadding = 8;
    const headerExtraPadding = 6;

    const requiredByCell =
      longestCellText.length > 0
        ? Math.ceil(longestCellNaturalWidth + cellNonContent + cellExtraPadding)
        : 0;
    const requiredByHeader = Math.ceil(headerNaturalWidth + headerNonContent + headerExtraPadding);

    // my-grid는 셀 타입(입력/선택 등)에 따라 실제 표시 폭이 더 필요할 수 있어
    // 안전 여유를 소폭 추가해 ...이 남지 않도록 보정한다.
    const safetyPadding = 6;
    let result = Math.max(requiredByCell, requiredByHeader) + safetyPadding;
    result = Math.max(result, minW);
    if (maxW !== undefined) result = Math.min(result, maxW);
    return result;
  } finally {
    measureHost.remove();
  }
}

/**
 * fittingScreen 모드에서 렌더링에만 사용할 헤더 배열을 계산한다.
 *
 * 규칙:
 * - baseWidth 우선순위: (저장된 width가 headers에 merge되어 있다면) headers.width > defaultWidth(getHeaderDefaultWidth)
 * - baseTotal(체크박스 폭 포함)보다 컨테이너가 작아지면 baseWidth 유지 + 가로 스크롤(=renderHeaders도 baseWidth)
 * - 컨테이너가 baseTotal 이상이면 baseWidth 비율대로 확장하여 폭을 배정한다(소수점 버림, 남는 px은 여백)
 * - maxWidth가 있는 컬럼은 proposedWidth가 maxWidth 초과 시 maxWidth로 고정하고,
 *   나머지 컬럼들이 남은 폭을 다시 비율대로 나눠 가진다(반복).
 *
 * 주의:
 * - 이 함수는 "표시용" width만 계산한다. 저장/상태(headers) 변경은 호출자가 별도로 관리해야 한다.
 */
export function computeFittingRenderHeaders(params: {
  headers: MyGridHeaderType[];
  containerWidth: number;
  checkboxColWidth?: number;
  fittingScreen: boolean;
  fittingLocked: boolean;
  getDefaultWidth?: (name: string | undefined) => number;
}): MyGridHeaderType[] {
  const {
    headers,
    containerWidth,
    checkboxColWidth = 0,
    fittingScreen,
    fittingLocked,
    getDefaultWidth = getHeaderDefaultWidth,
  } = params;

  const visibleHeaders = headers.filter((h) => h.visible);

  const baseByKey = new Map<string, number>();
  const maxByKey = new Map<string, number | undefined>();
  let baseSum = 0;

  for (const h of visibleHeaders) {
    const base = typeof h.width === "number" ? h.width : getDefaultWidth(h.name);
    baseByKey.set(h.key, base);
    maxByKey.set(h.key, h.maxWidth);
    baseSum += base;
  }

  const available = Math.max(0, containerWidth - checkboxColWidth);
  const baseTotal = checkboxColWidth + baseSum;

  const canFitToContainer =
    fittingScreen &&
    !fittingLocked &&
    containerWidth > 0 &&
    baseSum > 0 &&
    containerWidth >= baseTotal;

  if (!canFitToContainer) {
    // baseWidth 유지 (container가 더 작아지는 경우는 스크롤)
    return headers.map((h) => {
      if (!h.visible) return h;
      const base = baseByKey.get(h.key) ?? getDefaultWidth(h.name);
      return { ...h, width: base };
    });
  }

  // maxWidth 재분배 루프
  const fixed = new Map<string, number>(); // maxWidth에 의해 고정된 폭
  const remainingKeys = new Set<string>(visibleHeaders.map((h) => h.key));

  let iterations = 0;
  while (iterations < 50) {
    iterations += 1;
    if (remainingKeys.size === 0) break;

    const fixedSum = Array.from(fixed.values()).reduce((a, b) => a + b, 0);
    const remainingAvailable = Math.max(0, available - fixedSum);
    const remainingBaseSum = Array.from(remainingKeys).reduce((acc, key) => {
      const b = baseByKey.get(key);
      return acc + (typeof b === "number" ? b : 0);
    }, 0);

    if (remainingBaseSum <= 0) break;

    const remainingScale = remainingAvailable / remainingBaseSum;

    let newlyFixed = false;
    for (const key of Array.from(remainingKeys)) {
      const base = baseByKey.get(key) ?? 0;
      const proposed = Math.floor(base * remainingScale);
      const maxWidth = maxByKey.get(key);

      if (typeof maxWidth === "number" && proposed > maxWidth) {
        fixed.set(key, maxWidth);
        remainingKeys.delete(key);
        newlyFixed = true;
      }
    }

    if (!newlyFixed) break;
  }

  const finalFixedSum = Array.from(fixed.values()).reduce((a, b) => a + b, 0);
  const finalRemainingAvailable = Math.max(0, available - finalFixedSum);
  const finalRemainingBaseSum = Array.from(remainingKeys).reduce((acc, key) => {
    const b = baseByKey.get(key);
    return acc + (typeof b === "number" ? b : 0);
  }, 0);

  const finalScale =
    finalRemainingBaseSum > 0
      ? finalRemainingAvailable / finalRemainingBaseSum
      : available / baseSum;

  const widthMap = new Map<string, number>();
  for (const [key, w] of fixed.entries()) widthMap.set(key, w);
  for (const key of Array.from(remainingKeys)) {
    const base = baseByKey.get(key) ?? 0;
    widthMap.set(key, Math.floor(base * finalScale));
  }

  return headers.map((h) => {
    if (!h.visible) return h;
    const w = widthMap.get(h.key) ?? baseByKey.get(h.key) ?? getDefaultWidth(h.name);
    return { ...h, width: w };
  });
}

export const getStickyStyle = (headers: MyGridHeaderType[], header: MyGridHeaderType) => {
  if (header.isFixedLeft) {
    let leftOffset = 0;

    const leftFixedColumns = headers
      .filter((header) => header.isFixedLeft)
      .sort((a, b) => (a.sortNumber ?? 0) - (b.sortNumber ?? 0));

    for (const fixedHeader of leftFixedColumns) {
      if (fixedHeader.key === header.key) break;
      leftOffset += fixedHeader.width ?? getHeaderDefaultWidth(fixedHeader.name);
    }

    return {
      position: "sticky" as const,
      left: `${leftOffset}px`,
      borderRight: "1px solid var(--grid-border)",
      zIndex: 20,
    };
  }

  if (header.isFixedRight) {
    let rightOffset = 0;

    const rightFixedColumns = headers
      .filter((header) => header.isFixedRight)
      .sort((a, b) => (b.sortNumber ?? 0) - (a.sortNumber ?? 0));

    for (const fixedHeader of rightFixedColumns) {
      if (fixedHeader.key === header.key) break;
      rightOffset += fixedHeader.width ?? getHeaderDefaultWidth(fixedHeader.name);
    }

    return {
      position: "sticky" as const,
      right: `${rightOffset}px`,
      borderLeft: "1px solid var(--grid-border)",
      zIndex: 20,
    };
  }

  return {};
};

// 편의 함수들
export const getCell = (row: MyGridRowType, headerKey: string): MyGridCellType | null => {
  return row.cells.find((item) => item.headerKey === headerKey) || null;
};

export const getCellValue = (row: MyGridRowType, headerKey: string): any => {
  const cell = getCell(row, headerKey);
  return cell ? cell.value : undefined;
};

export const getCellValueAsString = (row: MyGridRowType, headerKey: string): string | undefined => {
  const value = getCellValue(row, headerKey);
  if (value === undefined) return undefined;
  return String(value);
};

export const getCellValueAsNumber = (row: MyGridRowType, headerKey: string): number | undefined => {
  const value = getCellValue(row, headerKey);
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? undefined : parsed;
};

export const getCellValueAsBoolean = (
  row: MyGridRowType,
  headerKey: string
): boolean | undefined => {
  const value = getCellValue(row, headerKey);
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return value !== 0;
};

export const getRowHeight = (size: "xs" | "sm" | "default" | "lg" | "xl") => {
  return GRID_ROW_HEIGHT[size];
};
