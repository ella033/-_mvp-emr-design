// localStorage 키 생성 헬퍼
export const getPanelModeStorageKey = (id: string) => `panel-open-mode-${id}`;
export const getFloatPanelPositionStorageKey = (id: string) =>
  `float-panel-position-${id}`;

// localStorage에서 모드 가져오기
export const getPanelMode = (id: string): "float" | "dock" => {
  if (typeof window === "undefined") return "dock";
  const saved = localStorage.getItem(getPanelModeStorageKey(id));
  return saved === "float" ? "float" : "dock";
};

// localStorage에 모드 저장하기
export const setPanelMode = (id: string, mode: "float" | "dock") => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getPanelModeStorageKey(id), mode);
};

// Float 패널 위치/크기 인터페이스
export interface FloatPanelPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// localStorage에서 float 패널 위치/크기 가져오기
export const getFloatPanelPosition = (
  tabId: string
): FloatPanelPosition | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(getFloatPanelPositionStorageKey(tabId));
    if (saved) {
      const position = JSON.parse(saved) as FloatPanelPosition;
      // 유효성 검사
      if (
        typeof position.x === "number" &&
        typeof position.y === "number" &&
        typeof position.w === "number" &&
        typeof position.h === "number" &&
        position.w > 0 &&
        position.h > 0
      ) {
        return position;
      }
    }
  } catch (error) {
    console.warn(`[${tabId}] float 패널 위치 불러오기 실패:`, error);
  }
  return null;
};

// localStorage에 float 패널 위치/크기 저장하기
export const setFloatPanelPosition = (
  tabId: string,
  position: FloatPanelPosition
) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getFloatPanelPositionStorageKey(tabId),
      JSON.stringify(position)
    );
  } catch (error) {
    console.warn(`[${tabId}] float 패널 위치 저장 실패:`, error);
  }
};
