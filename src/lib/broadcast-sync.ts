/**
 * Zustand ↔ BroadcastChannel 동기화 유틸리티
 *
 * 같은 도메인의 여러 브라우저 창(부모 창, Popout 창)에서
 * Zustand store 상태를 자동으로 동기화합니다.
 *
 * ── 사용법 ──────────────────────────────────────────
 *
 * 1) store 생성 시 syncWithBroadcast 래핑:
 *
 *    import { create } from "zustand";
 *    import { syncWithBroadcast } from "@/lib/broadcast-sync";
 *
 *    export const useCounterStore = create<CounterState>(
 *      syncWithBroadcast("counter-store", (set) => ({
 *        count: 0,
 *        increment: () => set((s) => ({ count: s.count + 1 })),
 *      })),
 *    );
 *
 * 2) 특정 필드만 동기화 (pick):
 *
 *    export const useAuthStore = create<AuthState>(
 *      syncWithBroadcast("auth-store", (set) => ({
 *        user: null,
 *        token: "",           // ← 동기화 안 됨
 *        setUser: (user) => set({ user }),
 *      }), {
 *        pick: ["user"],  // 이 키만 동기화
 *      }),
 *    );
 */

import type { StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";

interface SyncOptions<T> {
  /** 동기화할 state 키 목록. 생략하면 함수가 아닌 모든 키를 동기화합니다. */
  pick?: (keyof T & string)[];
}

type SyncMessage<T> =
  | { type: "sync-state"; channel: string; state: Partial<T>; senderId: string }
  | { type: "sync-request"; channel: string; senderId: string };

/** 직렬화 가능한 state만 추출 (함수 제외) */
function extractSerializable<T extends object>(
  state: T,
  pick?: (keyof T & string)[],
): Partial<T> {
  const result: Partial<T> = {};
  const keys = pick ?? (Object.keys(state) as (keyof T & string)[]);

  for (const key of keys) {
    const value = state[key];
    if (typeof value !== "function") {
      result[key] = value;
    }
  }
  return result;
}

/** 고유 탭/창 ID 생성 */
function createSenderId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Zustand StateCreator를 감싸서 BroadcastChannel 동기화를 추가합니다.
 *
 * @param channelName - BroadcastChannel 이름 (store마다 고유해야 함)
 * @param creator - 원본 Zustand StateCreator
 * @param options - 동기화 옵션
 */
export function syncWithBroadcast<
  T extends object,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
>(
  channelName: string,
  creator: StateCreator<T, Mis, Mos>,
  options?: SyncOptions<T>,
): StateCreator<T, Mis, Mos> {
  const fullChannelName = `zustand-sync-${channelName}`;
  const senderId = createSenderId();
  const pick = options?.pick;

  return (set, get, api) => {
    // 브라우저 환경이 아니면 (SSR) 원본 그대로 반환
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return creator(set, get, api);
    }

    let isReceiving = false; // 역전파 방지 플래그
    const channel = new BroadcastChannel(fullChannelName);

    // ── 수신: 다른 창에서 state가 변경되었을 때 ──
    channel.onmessage = (event: MessageEvent<SyncMessage<T>>) => {
      const msg = event.data;
      if (!msg || msg.channel !== fullChannelName) return;
      if (msg.senderId === senderId) return; // 자기 자신 무시

      if (msg.type === "sync-state") {
        isReceiving = true;
        set(msg.state as Parameters<typeof set>[0]);
        isReceiving = false;
      }

      if (msg.type === "sync-request") {
        // 새 창이 최신 state를 요청 → 현재 state 전송
        const currentState = get();
        if (currentState) {
          const serializable = extractSerializable(currentState, pick);
          channel.postMessage({
            type: "sync-state",
            channel: fullChannelName,
            state: serializable,
            senderId,
          } satisfies SyncMessage<T>);
        }
      }
    };

    // ── 송신: set()이 호출될 때 다른 창에 전파 ──
    const syncSet = ((stateOrUpdater: unknown, replace?: boolean) => {
      // pick 필드의 이전 상태 스냅샷
      const prevState = get();
      const prevSerialized = prevState ? extractSerializable(prevState, pick) : null;

      // 원본 set 실행
      (set as (s: unknown, r?: boolean) => void)(stateOrUpdater, replace);

      // 수신 중이면 역전파하지 않음
      if (isReceiving) return;

      const currentState = get();
      if (currentState) {
        const currSerialized = extractSerializable(currentState, pick);

        // pick 필드가 실제로 변경된 경우에만 브로드캐스트
        if (prevSerialized) {
          const keys = Object.keys(currSerialized) as (keyof typeof currSerialized)[];
          const hasChanges = keys.some(
            (key) => currSerialized[key] !== prevSerialized[key],
          );
          if (!hasChanges) return;
        }

        try {
          channel.postMessage({
            type: "sync-state",
            channel: fullChannelName,
            state: currSerialized,
            senderId,
          } satisfies SyncMessage<T>);
        } catch {
          // 직렬화 불가능한 값이 있으면 조용히 무시
        }
      }
    }) as typeof set;

    // ── 초기화: 기존 창에 최신 state 요청 ──
    channel.postMessage({
      type: "sync-request",
      channel: fullChannelName,
      senderId,
    } satisfies SyncMessage<T>);

    // ── Cleanup 등록 ──
    const apiAny = api as StoreApi<T> & { destroy?: () => void };
    const originalDestroy = apiAny.destroy;
    apiAny.destroy = () => {
      channel.close();
      originalDestroy?.();
    };

    // 원본 creator에 래핑된 set 전달
    return creator(syncSet, get, api);
  };
}
