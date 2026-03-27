import type {
  MyTreeGridHeaderType,
  MyTreeGridRowCellType,
  MyTreeGridRowType,
} from "./my-tree-grid-type";
import { safeGetComputedStyle, getSafeValue } from "@/components/yjg/common/util/ui-util";
import type { MyTreeGridDragDropInfo } from "./my-tree-grid-interface";
import { GRID_ROW_HEIGHT } from "../common/constant/class-constants";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";
import { generateUniqueId } from "../common/util/etc-util";

export const HEADER_MIN_WIDTH = 40;

// 그리드 헤더 설정 상수
const GRID_HEADER_SETTINGS = {
  scope: "user" as const,
  category: "grid-header",
};

export const getInitialHeaders = (lsKey: string, defaultHeaders: MyTreeGridHeaderType[]) => {
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

/** 같은 lsKey(페이지 컨텍스트)에 저장된 행 아이콘 보이기 여부를 반환. 없으면 true */
export const getInitialShowRowIcon = (lsKey: string): boolean => {
  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    GRID_HEADER_SETTINGS.category,
    lsKey
  );
  const showRowIcon = savedSetting?.settings?.showRowIcon;
  if (typeof showRowIcon === "boolean") return showRowIcon;
  return true;
};

// debounce 타이머 저장용 맵
const saveHeadersTimers: Map<string, NodeJS.Timeout> = new Map();

export const saveHeaders = (settingKey: string, headers: MyTreeGridHeaderType[]) => {
  if (typeof window === "undefined") return;

  // 기존 타이머 클리어
  const existingTimer = saveHeadersTimers.get(settingKey);
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

    // 기존 설정(showRowIcon 등) 유지
    const state = useSettingsStore.getState();
    const savedSetting = state.getSettingsByCategoryAndPageContext(
      GRID_HEADER_SETTINGS.category,
      settingKey
    );
    const currentSettings = (savedSetting?.settings as Record<string, unknown>) ?? {};

    const payload = {
      scope: GRID_HEADER_SETTINGS.scope,
      category: GRID_HEADER_SETTINGS.category,
      pageContext: settingKey,
      settings: { ...currentSettings, headers: headersToSave },
    };

    SettingsService.createOrUpdateSetting(payload)
      .then(() => {
        // 저장 성공 시 store에도 반영 (다음 불러오기 시 즉시 반영)
        useSettingsStore.getState().updateSettingLocally(payload);
      })
      .catch((error) => {
        console.error("[saveHeaders] 트리그리드 헤더 설정 저장 실패:", error);
      });

    saveHeadersTimers.delete(settingKey);
  }, 500);

  saveHeadersTimers.set(settingKey, timer);
};

/** 행 아이콘 보이기 여부 저장 (같은 lsKey의 기존 설정 유지) */
export const saveShowRowIcon = (lsKey: string, showRowIcon: boolean) => {
  if (typeof window === "undefined") return;

  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    GRID_HEADER_SETTINGS.category,
    lsKey
  );
  const currentSettings = (savedSetting?.settings as Record<string, unknown>) ?? {};

  const payload = {
    scope: GRID_HEADER_SETTINGS.scope,
    category: GRID_HEADER_SETTINGS.category,
    pageContext: lsKey,
    settings: { ...currentSettings, showRowIcon },
  };

  SettingsService.createOrUpdateSetting(payload)
    .then(() => {
      useSettingsStore.getState().updateSettingLocally(payload);
    })
    .catch((error) => {
      console.error("[saveShowRowIcon] 트리그리드 행 아이콘 설정 저장 실패:", error);
    });
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
      if (!computedStyle) return 14;
      const fontSize = computedStyle.getPropertyValue("--default-font-size");

      if (fontSize) {
        // '14px' 형태의 문자열에서 숫자만 추출
        const match = fontSize.match(/(\d+(?:\.\d+)?)/);
        return match?.[1] ? parseFloat(match[1]) : 14;
      }
    } catch (error) {
      // 에러 발생 시 기본값 사용
      console.warn("폰트 크기 가져오기 실패:", error);
    }

    return 14; // 기본값
  };

  // 임시 캔버스를 생성하여 텍스트 너비 측정
  const measureTextWidth = (text: string | undefined, fontSize: number) => {
    try {
      const safeText = text || "";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        // 캔버스가 지원되지 않는 경우 대략적인 계산
        return safeText.length * fontSize * 0.6;
      }

      // 폰트 설정 (기본 폰트 패밀리 사용)
      context.font = `${fontSize}px sans-serif`;

      // 텍스트 너비 측정
      const metrics = context.measureText(safeText);
      return metrics.width;
    } catch (error) {
      // 에러 발생 시 대략적인 계산
      console.warn("텍스트 너비 측정 실패:", error);
      return (text || "").length * fontSize * 0.6;
    }
  };

  const fontSize = getDefaultFontSize();
  const textWidth = measureTextWidth(name, fontSize);

  // 패딩과 여백을 고려하여 최소 너비 계산
  // 좌우 패딩 각각 8px, 아이콘 공간 20px, 여유 공간 16px 추가
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
  header: MyTreeGridHeaderType,
  flatRows: MyTreeGridRowType[],
  size: "xs" | "sm" | "default" | "lg" | "xl" = "default",
  extraLeadingWidth = 0
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
      document.querySelectorAll<HTMLElement>(`[data-my-tree-grid-cell-content-key="${columnKey}"]`)
    );
    if (targets.length === 0) return null;

    const validTargets = targets.filter((target) => target.clientWidth > 0);
    const nonContentCandidates = validTargets
      .map((target) => {
        const colRoot = target.closest<HTMLElement>(`[data-my-tree-grid-col-key="${columnKey}"]`);
        const colWidth = Math.ceil(colRoot?.getBoundingClientRect().width ?? currentColumnWidth);
        return Math.max(0, colWidth - target.clientWidth);
      })
      .filter((n) => Number.isFinite(n));

    if (nonContentCandidates.length === 0) return null;
    return Math.min(...nonContentCandidates);
  };

  const getHeaderNonContentWidthFromDom = (): number | null => {
    const content = document.querySelector<HTMLElement>(
      `[data-my-tree-grid-header-content-key="${columnKey}"]`
    );
    if (!content || content.clientWidth <= 0) return null;
    const colRoot = content.closest<HTMLElement>(`[data-my-tree-grid-col-key="${columnKey}"]`);
    const colWidth = Math.ceil(colRoot?.getBoundingClientRect().width ?? currentColumnWidth);
    return Math.max(0, colWidth - content.clientWidth);
  };

  const getHeaderTextProfileFromDom = (): TextProfile => {
    const headerTarget = document.querySelector<HTMLElement>(
      `[data-my-tree-grid-header-overflow-key="${columnKey}"]`
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
      `[data-my-tree-grid-cell-overflow-key="${columnKey}"]`
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
    for (const row of flatRows) {
      const cell = row.cells?.find((c: MyTreeGridRowCellType) => c.headerKey === columnKey);
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
    const headerExtraPadding = 6; // 헤더 텍스트 주변 여유

    const requiredByCell =
      longestCellText.length > 0
        ? Math.ceil(
            longestCellNaturalWidth +
              cellNonContent +
              cellExtraPadding +
              Math.max(0, extraLeadingWidth)
          )
        : 0;
    const requiredByHeader = Math.ceil(headerNaturalWidth + headerNonContent + headerExtraPadding);

    let result = Math.max(requiredByCell, requiredByHeader);
    result = Math.max(result, minW);
    if (maxW !== undefined) result = Math.min(result, maxW);
    return result;
  } finally {
    measureHost.remove();
  }
}

export const getStickyStyle = (headers: MyTreeGridHeaderType[], header: MyTreeGridHeaderType) => {
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

export const getRowKey = (type: string, id?: string | number) => {
  return `key.${type}.${id ?? generateUniqueId()}`;
};

export const flattenTree = (
  rows: MyTreeGridRowType[],
  ignoreExpanded = false,
  level = 0,
  startSortNumber = 1,
  defaultExpanded = true // isExpanded가 undefined일 때 사용할 기본값
): MyTreeGridRowType[] => {
  const result: MyTreeGridRowType[] = [];
  let currentSortNumber = startSortNumber;

  rows.forEach((row) => {
    // isExpanded가 undefined인 경우 defaultExpanded 값 사용
    const isExpanded = row.isExpanded ?? defaultExpanded;
    result.push({
      ...row,
      level: level,
      sortNumber: currentSortNumber,
      isExpanded: isExpanded, // isExpanded 값을 명시적으로 설정
    });
    currentSortNumber++;

    if ((isExpanded || ignoreExpanded) && row.children) {
      const childResults = flattenTree(
        row.children,
        ignoreExpanded,
        level + 1,
        currentSortNumber,
        defaultExpanded
      );
      result.push(...childResults);
      currentSortNumber += childResults.length;
    }
  });
  return result;
};

export const findRow = (rows: MyTreeGridRowType[], rowKey: string): MyTreeGridRowType | null => {
  if (!rowKey) return null;

  for (const row of rows) {
    if (row.rowKey === rowKey) return row;
    if (row.children) {
      const found = findRow(row.children, rowKey);
      if (found) return found;
    }
  }
  return null;
};

export const findParentRow = (
  rows: MyTreeGridRowType[],
  rowKey: string
): { parent: MyTreeGridRowType | null; index: number } => {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    if (row.rowKey === rowKey) {
      return { parent: null, index: i };
    }
    if (row.children) {
      for (let j = 0; j < row.children.length; j++) {
        const child = row.children[j];
        if (child && child.rowKey === rowKey) {
          return { parent: row, index: j };
        }
      }
      const found = findParentRow(row.children, rowKey);
      if (found.parent !== null) return found;
    }
  }
  return { parent: null, index: -1 };
};

export const addRow = (
  rows: MyTreeGridRowType[],
  parentRowKey: string | null,
  newRow: MyTreeGridRowType,
  isTypeOrder: boolean = false
): MyTreeGridRowType[] => {
  if (!parentRowKey) {
    if (isTypeOrder) {
      // 타입별 순서 유지: folder 먼저, 그 다음 package
      const folders = rows.filter((row) => row.type === "folder");
      const packages = rows.filter((row) => row.type === "package");
      const others = rows.filter((row) => row.type !== "folder" && row.type !== "package");

      if (newRow.type === "folder") {
        return [...folders, newRow, ...packages, ...others];
      } else if (newRow.type === "package") {
        return [...folders, ...packages, newRow, ...others];
      } else {
        return [...rows, newRow];
      }
    }
    return [...rows, newRow];
  }

  return rows.map((row) => {
    if (row.rowKey === parentRowKey) {
      const currentChildren = [...(row.children || [])];

      if (isTypeOrder) {
        // 타입별 순서 유지: folder 먼저, 그 다음 package
        const folders = currentChildren.filter((child) => child.type === "folder");
        const packages = currentChildren.filter((child) => child.type === "package");
        const others = currentChildren.filter(
          (child) => child.type !== "folder" && child.type !== "package"
        );

        let newChildren: MyTreeGridRowType[];
        if (newRow.type === "folder") {
          newChildren = [...folders, newRow, ...packages, ...others];
        } else if (newRow.type === "package") {
          newChildren = [...folders, ...packages, newRow, ...others];
        } else {
          newChildren = [...currentChildren, newRow];
        }

        return {
          ...row,
          children: newChildren,
          isExpanded: true,
        };
      } else {
        return {
          ...row,
          children: [...currentChildren, newRow],
          isExpanded: true,
        };
      }
    }
    if (row.children) {
      return {
        ...row,
        children: addRow(row.children, parentRowKey, newRow, isTypeOrder),
      };
    }
    return row;
  });
};

export const removeRow = (rows: MyTreeGridRowType[], rowKey: string): MyTreeGridRowType[] => {
  return rows.filter((row) => {
    if (row.rowKey === rowKey) return false;
    if (row.children) {
      row.children = removeRow(row.children, rowKey);
    }
    return true;
  });
};

export const removeRows = (rows: MyTreeGridRowType[], rowKeys: string[]): MyTreeGridRowType[] => {
  return rows.filter((row) => {
    if (rowKeys.includes(row.rowKey)) return false;
    if (row.children) {
      row.children = removeRows(row.children, rowKeys);
    }
    return true;
  });
};

export const moveNode = (
  rows: MyTreeGridRowType[],
  dragInfo: MyTreeGridDragDropInfo,
  autoExpandOnDrop: boolean
): MyTreeGridRowType[] => {
  const { draggedRow, newParent, newIndex } = dragInfo;

  let updatedRows = removeRow(rows, draggedRow.rowKey);
  if (newParent) {
    updatedRows = updatedRows.map((row) => {
      if (row.rowKey === newParent.rowKey) {
        const currentChildren = [...(row.children || [])];

        const newChildren = [...currentChildren];
        newChildren.splice(newIndex, 0, draggedRow);
        return {
          ...row,
          children: newChildren,
          isExpanded: autoExpandOnDrop ? true : row.isExpanded,
        };
      }
      if (row.children) {
        return {
          ...row,
          children: moveNode(row.children, dragInfo, autoExpandOnDrop),
        };
      }
      return row;
    });
  } else {
    updatedRows.splice(newIndex, 0, draggedRow);
  }

  return updatedRows;
};

export const updateRow = (
  rows: MyTreeGridRowType[],
  rowKey: string,
  updates: Partial<MyTreeGridRowType>
): MyTreeGridRowType[] => {
  return rows.map((row) => {
    if (row.rowKey === rowKey) {
      return { ...row, ...updates };
    }
    if (row.children) {
      return {
        ...row,
        children: updateRow(row.children, rowKey, updates),
      };
    }
    return row;
  });
};

export const changeRowData = (
  rows: MyTreeGridRowType[],
  rowKey: string,
  orgData: {
    type: string;
    data: any;
  }
): MyTreeGridRowType[] => {
  return rows.map((row) => {
    if (row.rowKey === rowKey) {
      return { ...row, orgData: orgData };
    }
    if (row.children) {
      return { ...row, children: changeRowData(row.children, rowKey, orgData) };
    }
    return row;
  });
};

export const toggleExpandAll = (
  rows: MyTreeGridRowType[],
  isExpand: boolean
): MyTreeGridRowType[] => {
  return rows.map((row) => ({
    ...row,
    isExpanded: isExpand,
    children: row.children ? toggleExpandAll(row.children, isExpand) : row.children,
  }));
};

export const updateAllRows = (
  rows: MyTreeGridRowType[],
  updates: Partial<MyTreeGridRowType>
): MyTreeGridRowType[] => {
  return rows.map((row) => {
    const updatedRow = { ...row, ...updates };

    if (row.children) {
      return {
        ...updatedRow,
        children: updateAllRows(row.children, updates),
      };
    }

    return updatedRow;
  });
};

export const findRowsByType = (
  rows: MyTreeGridRowType[],
  type: "folder" | "package" | "item"
): MyTreeGridRowType[] => {
  const result: MyTreeGridRowType[] = [];

  const traverse = (nodeList: MyTreeGridRowType[]) => {
    for (const row of nodeList) {
      if (row.type === type) {
        result.push(row);
      }
      if (row.children) {
        traverse(row.children);
      }
    }
  };

  traverse(rows);
  return result;
};

// 편의 함수들
export const getCell = (
  row: MyTreeGridRowType,
  headerKey: string
): MyTreeGridRowCellType | null => {
  return row.cells.find((cell) => cell.headerKey === headerKey) || null;
};

export const getCellValue = (row: MyTreeGridRowType, headerKey: string): any => {
  const cell = getCell(row, headerKey);
  return cell ? cell.value : undefined;
};

export const getCellValueAsString = (
  row: MyTreeGridRowType,
  headerKey: string
): string | undefined => {
  const value = getCellValue(row, headerKey);
  if (value === undefined) return undefined;
  return String(value);
};

export const getCellValueAsNumber = (
  row: MyTreeGridRowType,
  headerKey: string
): number | undefined => {
  const value = getCellValue(row, headerKey);
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  // toKRW 변환된 데이터에서 숫자만 추출 (쉼표, "원" 제거)
  const cleanedValue = String(value).replace(/[,원]/g, "");
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? undefined : parsed;
};

export const getCellValueAsBoolean = (
  row: MyTreeGridRowType,
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

export const getNormalizedCellString = (row: MyTreeGridRowType, headerKey: string): string => {
  const value = getCellValueAsString(row, headerKey);
  if (value === "null" || value === "undefined") return "";
  return value || "";
};
