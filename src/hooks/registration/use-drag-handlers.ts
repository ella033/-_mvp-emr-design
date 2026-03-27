import { useCallback, useRef } from "react";
import { useRegistrationMove } from "./use-registration-move";
import { useToastHelpers } from "@/components/ui/toast";
import { useReceptionStore } from "@/store/common/reception-store";

/**
 * 드래그 앤 드롭 관련 공통 훅
 * patient-status-list와 panel-container에서 공통으로 사용하는 드래그 핸들러 로직
 */

export interface UseDragHandlersOptions<T extends HTMLElement = HTMLElement> {
  // 드래그 상태 관리
  dragOverIndex: number | null;
  setDragOverIndex: (index: number | null) => void;
  setIsDraggingInPanel: (isDragging: boolean) => void;

  // 데이터
  filteredData: any[];
  containerRef: React.RefObject<T | null>;

  // 콜백
  onRefresh?: () => void | Promise<void>;
  onOptimisticReorder?: (nextData: any[]) => void;
  onServerReconciled?: () => void;
  /** 이동 완료 시 해당 아이템 ID를 전달하여 하이라이트 효과 표시 */
  onMoveHighlight?: (itemId: string) => void;
  /** 드롭 허용 최소 인덱스 (이 인덱스 미만으로는 드롭 불가, 상단 고정 카드 보호용) */
  minDropIndex?: number;
}

export function useDragHandlers<T extends HTMLElement = HTMLElement>(options: UseDragHandlersOptions<T>) {
  const {
    setDragOverIndex,
    setIsDraggingInPanel,
    filteredData,
    containerRef,
    onRefresh,
    onOptimisticReorder,
    onServerReconciled,
    onMoveHighlight,
    minDropIndex,
  } = options;

  const registrationMoveMutation = useRegistrationMove();
  const { error: showError } = useToastHelpers();
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastDragOverIndexRef = useRef<number | null>(null);
  // 렌더마다 최신값을 유지하여 stale closure 없이 콜백에서 참조
  const minDropIndexRef = useRef(minDropIndex ?? 0);
  minDropIndexRef.current = minDropIndex ?? 0;

  // 드래그 중 마우스 위치로 드롭 위치 계산
  const calculateDropIndex = useCallback(
    (clientY: number) => {
      let closestIndex = 0;
      let minDistance = Infinity;

      cardRefs.current.forEach((element, key) => {
        const rect = element.getBoundingClientRect();
        const cardMiddle = rect.top + rect.height / 2;
        const distance = Math.abs(clientY - cardMiddle);

        if (distance < minDistance) {
          minDistance = distance;
          // 마우스가 카드 중간보다 위에 있으면 해당 인덱스, 아래면 다음 인덱스
          const index = parseInt(key);
          closestIndex = clientY < cardMiddle ? index : index + 1;
        }
      });

      return closestIndex;
    },
    []
  );

  // 드래그 중 (값이 변경된 경우만 setState 호출하여 불필요한 리렌더 방지)
  const handleDragMove = useCallback(
    (_data: any, position: any) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const isOverCurrentContainer =
        position.clientX >= containerRect.left &&
        position.clientX <= containerRect.right &&
        position.clientY >= containerRect.top &&
        position.clientY <= containerRect.bottom;

      const rawIndex = isOverCurrentContainer
        ? calculateDropIndex(position.clientY)
        : null;
      const nextIndex =
        rawIndex !== null
          ? Math.max(rawIndex, minDropIndexRef.current)
          : null;

      if (nextIndex !== lastDragOverIndexRef.current) {
        lastDragOverIndexRef.current = nextIndex;
        setDragOverIndex(nextIndex);
      }
    },
    [calculateDropIndex, containerRef, setDragOverIndex]
  );

  // 같은 컨테이너 내 이동을 처리하는 드래그 엔드 핸들러 생성
  // React.memo로 인해 콜백이 stale할 수 있으므로 ref에서 최신 dragOverIndex를 읽음
  const createDragEndHandler = useCallback(
    (item: any) => {
      return async (_data: any, _position: any, _event: MouseEvent) => {
        setIsDraggingInPanel(false);

        const currentDragOverIndex = lastDragOverIndexRef.current;

        if (currentDragOverIndex === null || currentDragOverIndex < minDropIndexRef.current) {
          lastDragOverIndexRef.current = null;
          setDragOverIndex(null);
          return;
        }

        // 같은 리스트 내 이동
        const currentIndex = filteredData.findIndex(
          (listItem) => listItem?.id?.toString() === item?.id?.toString()
        );
        if (currentIndex === -1) {
          lastDragOverIndexRef.current = null;
          setDragOverIndex(null);
          return;
        }

        const optimisticData = [...filteredData];
        const [movedItem] = optimisticData.splice(currentIndex, 1);
        let targetIndex = currentDragOverIndex;
        if (currentIndex < targetIndex) {
          targetIndex -= 1;
        }
        targetIndex = Math.max(0, Math.min(targetIndex, optimisticData.length));
        optimisticData.splice(targetIndex, 0, movedItem);

        // API 호출 전에 UI를 먼저 업데이트하여 체감 지연을 줄인다.
        onOptimisticReorder?.(optimisticData);

        const movedIndex = optimisticData.findIndex(
          (listItem) => listItem?.id?.toString() === item?.id?.toString()
        );

        const nextItem =
          movedIndex < optimisticData.length - 1
            ? optimisticData[movedIndex + 1]
            : undefined;

        const previousItem =
          movedIndex > 0 ? optimisticData[movedIndex - 1] : undefined;

        // 마지막 위치로 이동 시 nextItem이 없으므로 previousRegistrationId만 전송.
        // 그 외에는 nextRegistrationId만 전송.
        const movePayload = nextItem
          ? { registrationId: item.id, nextRegistrationId: nextItem.id }
          : { registrationId: item.id, previousRegistrationId: previousItem?.id ?? null };

        try {
          await registrationMoveMutation.mutateAsync(movePayload);

          if (onOptimisticReorder) {
            // Optimistic 플로우: API 재조회 없이 프론트 state로 즉시 반영.
            // 소켓 이벤트로 인한 이중 갱신을 방지하기 위해 플래그 설정.
            useReceptionStore.getState().setLastLocalRegistrationUpdate({
              registrationId: item.id.toString(),
              at: Date.now(),
            });
            // 이동 완료 하이라이트 효과
            onMoveHighlight?.(item.id.toString());
          } else if (onRefresh) {
            await onRefresh();
            onServerReconciled?.();
          } else {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("refreshPatientsData", {
                detail: { type: "registrations" }
              }));
            }
          }
        } catch (error: any) {
          // 실패 시 서버 데이터로 새로고침하여 정확한 순서 복원
          onOptimisticReorder?.(filteredData);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refreshPatientsData", {
              detail: { type: "registrations" }
            }));
          }
          const errorMessage =
            error?.data?.message ||
            error?.message ||
            "순서 변경에 실패했습니다.";
          showError(errorMessage);
        }

        lastDragOverIndexRef.current = null;
        setDragOverIndex(null);
      };
    },
    [
      filteredData,
      registrationMoveMutation,
      showError,
      onRefresh,
      onOptimisticReorder,
      onServerReconciled,
      onMoveHighlight,
      setIsDraggingInPanel,
      setDragOverIndex,
    ]
  );

  return {
    cardRefs,
    calculateDropIndex,
    handleDragMove,
    createDragEndHandler,
    lastDragOverIndexRef,
  };
}
