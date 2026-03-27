"use client";

const RESIZE_HANDLE_HIT_WIDTH_PX = 4;
const RESIZE_LINE_WIDTH_PX = 1;

interface MyTreeGridResizeHandleProps {
  headerKey: string;
  /** 헤더/같은 컬럼의 다른 셀에서 hover 시에도 true가 되면 한 세로줄처럼 표시됨 */
  showHandle: boolean;
  onMouseDown?: (e: React.MouseEvent, headerKey: string) => void;
  /** 리사이저 더블클릭 시 컬럼 너비를 콘텐츠에 맞춤(엑셀 스타일) */
  onDoubleClick?: (headerKey: string) => void;
  /** hover 시 같은 headerKey를 가진 모든 ResizeHandle이 함께 표시되도록 상위에서 상태 갱신 */
  onResizeHandleHover?: (headerKey: string | null) => void;
  /** 셀에서 사용 시 클릭이 그리드 선택 등으로 전파되지 않도록 stopPropagation */
  stopPropagationOnMouseDown?: boolean;
  className?: string;
}

export default function MyTreeGridResizeHandle({
  headerKey,
  showHandle,
  onMouseDown,
  onDoubleClick,
  onResizeHandleHover,
  stopPropagationOnMouseDown = false,
  className,
}: MyTreeGridResizeHandleProps) {
  const stopMouseEvent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const stopMouseEventHard = (e: React.MouseEvent) => {
    stopMouseEvent(e);
    e.nativeEvent.stopImmediatePropagation();
  };

  const paddingValue = (RESIZE_HANDLE_HIT_WIDTH_PX - RESIZE_LINE_WIDTH_PX) / 2;

  return (
    <div
      className={className ?? "h-full flex-shrink-0 cursor-col-resize flex items-center justify-center"}
      style={{
        width: RESIZE_HANDLE_HIT_WIDTH_PX,
        backgroundColor: "transparent",
        position: "relative",
      }}
      onMouseEnter={() => onResizeHandleHover?.(headerKey)}
      onMouseLeave={() => onResizeHandleHover?.(null)}
      onMouseDown={(e) => {
        stopMouseEventHard(e);
        if (stopPropagationOnMouseDown) e.stopPropagation();
        onMouseDown?.(e, headerKey);
      }}
      onClick={stopMouseEvent}
      onContextMenu={stopMouseEvent}
      onDoubleClick={(e) => {
        stopMouseEventHard(e);
        onDoubleClick?.(headerKey);
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: paddingValue,
          width: RESIZE_LINE_WIDTH_PX,
          backgroundColor: showHandle
            ? "var(--grid-resize-handle-hover)"
            : "transparent",
          transition: "background-color 0.15s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
