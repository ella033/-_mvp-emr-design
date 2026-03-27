/**
 * 부모-자식 창 간 BroadcastChannel 통신 프로토콜 및 창 geometry 관리
 */

// ── BroadcastChannel ─────────────────────────────

export const POPOUT_CHANNEL_NAME = "rc-dock-popout";

export interface WindowGeometry {
  x: number; // window.screenX
  y: number; // window.screenY
  w: number; // window.outerWidth
  h: number; // window.outerHeight
}

export type PopoutMessage =
  | { type: "popout-opened"; tabId: string }
  | { type: "popout-closed"; tabId: string; geometry: WindowGeometry }
  | { type: "request-redock"; tabId: string }
  | { type: "parent-closing" }
  | { type: "theme-changed" };

export function createPopoutChannel(): BroadcastChannel {
  return new BroadcastChannel(POPOUT_CHANNEL_NAME);
}

// ── 창 Geometry 저장/복원 ────────────────────────

const GEOMETRY_KEY_PREFIX = "popout-geometry-";

export function savePopoutGeometry(tabId: string, geometry: WindowGeometry) {
  try {
    localStorage.setItem(
      `${GEOMETRY_KEY_PREFIX}${tabId}`,
      JSON.stringify(geometry),
    );
  } catch {}
}

export function loadPopoutGeometry(tabId: string): WindowGeometry | null {
  try {
    const saved = localStorage.getItem(`${GEOMETRY_KEY_PREFIX}${tabId}`);
    if (saved) {
      const g = JSON.parse(saved) as WindowGeometry;
      if (
        typeof g.x === "number" &&
        typeof g.y === "number" &&
        typeof g.w === "number" &&
        typeof g.h === "number" &&
        g.w > 0 &&
        g.h > 0
      ) {
        return g;
      }
    }
  } catch {}
  return null;
}

// ── 열린 팝아웃 목록 관리 ────────────────────────

const OPEN_POPOUTS_KEY = "popout-open-tabs";

export function getOpenPopouts(): string[] {
  try {
    const saved = localStorage.getItem(OPEN_POPOUTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function addOpenPopout(tabId: string) {
  const list = getOpenPopouts().filter((id) => id !== tabId);
  list.push(tabId);
  try {
    localStorage.setItem(OPEN_POPOUTS_KEY, JSON.stringify(list));
  } catch {}
}

export function removeOpenPopout(tabId: string) {
  const list = getOpenPopouts().filter((id) => id !== tabId);
  try {
    localStorage.setItem(OPEN_POPOUTS_KEY, JSON.stringify(list));
  } catch {}
}

// ── 팝아웃 전 원래 독 위치 저장/복원 ─────────────

const DOCK_ORIGIN_KEY_PREFIX = "popout-dock-origin-";

export interface DockOrigin {
  panelId: string; // 원래 소속 패널 ID
  tabIndex: number; // 패널 내 탭 인덱스
  siblingTabIds: string[]; // 같은 패널에 있던 다른 탭 ID들 (패널 소멸 시 형제 탭 옆에 복귀)
  mode?: "dock" | "float"; // 팝아웃 전 모드 (float이면 redock 시 float으로 복귀)
}

export function saveDockOrigin(tabId: string, origin: DockOrigin) {
  try {
    localStorage.setItem(
      `${DOCK_ORIGIN_KEY_PREFIX}${tabId}`,
      JSON.stringify(origin),
    );
  } catch {}
}

export function loadDockOrigin(tabId: string): DockOrigin | null {
  try {
    const saved = localStorage.getItem(`${DOCK_ORIGIN_KEY_PREFIX}${tabId}`);
    if (saved) {
      const o = JSON.parse(saved) as DockOrigin;
      if (typeof o.panelId === "string" && typeof o.tabIndex === "number") {
        return o;
      }
    }
  } catch {}
  return null;
}

export function removeDockOrigin(tabId: string) {
  try {
    localStorage.removeItem(`${DOCK_ORIGIN_KEY_PREFIX}${tabId}`);
  } catch {}
}

// ── 팝아웃/플로팅 전 레이아웃 스냅샷 저장/복원 ─────────

const LAYOUT_SNAPSHOT_KEY_PREFIX = "popout-layout-snapshot-";

/** 탭별 레이아웃 스냅샷 저장 (직렬화된 LayoutBase) */
export function saveLayoutSnapshot(serializedLayout: any, tabId: string) {
  try {
    localStorage.setItem(
      `${LAYOUT_SNAPSHOT_KEY_PREFIX}${tabId}`,
      JSON.stringify(serializedLayout),
    );
  } catch {}
}

/** 탭별 저장된 레이아웃 스냅샷 로드 */
export function loadLayoutSnapshot(tabId: string): any | null {
  try {
    const saved = localStorage.getItem(`${LAYOUT_SNAPSHOT_KEY_PREFIX}${tabId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/** 탭별 레이아웃 스냅샷 제거 */
export function removeLayoutSnapshot(tabId: string) {
  try {
    localStorage.removeItem(`${LAYOUT_SNAPSHOT_KEY_PREFIX}${tabId}`);
  } catch {}
}

// ── 스냅샷에서 특정 탭 제거 (다중 팝아웃 복원 시 중복 방지) ───

/** 레이아웃 박스 트리에서 특정 탭 ID를 재귀적으로 제거 */
function filterBox(box: any, removeIds: Set<string>): any | null {
  if (!box?.children) return box;
  const filtered = box.children
    .map((child: any) => {
      if (child.tabs) {
        // PanelBase: tabs 배열에서 제거 대상 필터링
        const tabs = child.tabs.filter((t: any) => !removeIds.has(t.id));
        if (tabs.length === 0) return null;
        return { ...child, tabs };
      }
      // BoxBase: 재귀 처리
      return filterBox(child, removeIds);
    })
    .filter(Boolean);
  // float/window 루트 박스는 빈 상태에서도 유지
  if (filtered.length === 0 && box.mode !== "float" && box.mode !== "window") return null;
  return { ...box, children: filtered };
}

/** 스냅샷에서 지정된 탭 ID들을 제거한 새 스냅샷 반환 */
export function removeTabsFromSnapshot(snapshot: any, tabIds: string[]): any {
  if (!snapshot || !tabIds.length) return snapshot;
  const removeIds = new Set(tabIds);
  return {
    ...snapshot,
    dockbox: filterBox(snapshot.dockbox, removeIds) ?? { mode: "horizontal", children: [] },
    floatbox: filterBox(snapshot.floatbox, removeIds),
    windowbox: filterBox(snapshot.windowbox, removeIds),
    maxbox: filterBox(snapshot.maxbox, removeIds),
  };
}
