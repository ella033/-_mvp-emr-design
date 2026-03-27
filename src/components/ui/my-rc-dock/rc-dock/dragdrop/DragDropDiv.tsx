// @ts-nocheck
import * as React from "react";
import * as DragManager from "./DragManager";
import { GestureState } from "./GestureManager";
import type { GestureComponent } from "./GestureManager";

export type AbstractPointerEvent = MouseEvent | TouchEvent;

interface DragDropDivProps extends React.HTMLAttributes<HTMLDivElement> {
  getRef?: React.ForwardedRef<HTMLDivElement>;
  onDragStartT?: DragManager.DragHandler;
  onDragMoveT?: DragManager.DragHandler;
  onDragEndT?: DragManager.DragHandler;
  onDragOverT?: DragManager.DragHandler;
  onDragLeaveT?: DragManager.DragHandler;
  /**
   * Anything returned by onDropT will be stored in DragState.
   * return false to indicate the drop is canceled
   */
  onDropT?: DragManager.DropHandler;
  /**
   * by default onDragStartT will be called on first drag move
   * but if directDragT is true, onDragStartT will be called as soon as mouse is down
   */
  directDragT?: boolean;
  captureT?: boolean;
  useRightButtonDragT?: boolean;

  onGestureStartT?: (state: GestureState) => boolean;
  onGestureMoveT?: (state: GestureState) => void;
  onGestureEndT?: () => void;

  gestureSensitivity?: number;
}

export class DragDropDiv extends React.PureComponent<DragDropDivProps, any> {
  element: HTMLElement | null = null;
  ownerDocument: Document | null = null;
  _getRef = (r: HTMLDivElement | null) => {
    if (r === this.element) {
      return;
    }
    let { getRef, onDragOverT } = this.props;
    if (this.element && onDragOverT) {
      DragManager.removeHandlers(this.element);
    }
    this.element = r;
    if (r) {
      this.ownerDocument = r.ownerDocument;
    } else {
      this.ownerDocument = null;
    }
    if (getRef) {
      if (typeof getRef === "function") {
        getRef(r);
      } else {
        getRef.current = r;
      }
    }

    if (r && onDragOverT) {
      DragManager.addHandlers(r, this);
    }
  };

  getHandlers(): DragManager.DragHandlers {
    return this.props;
  }

  dragType: DragManager.DragType | null = null;
  baseX: number = 0;
  baseY: number = 0;
  scaleX: number = 1;
  scaleY: number = 1;
  waitingMove = false;
  listening = false;

  gesturing = false;
  baseX2: number = 0;
  baseY2: number = 0;
  baseDis: number = 0;
  baseAng: number = 0;

  onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    let nativeTarget = e.nativeEvent.target as HTMLElement;
    if (
      nativeTarget instanceof HTMLInputElement ||
      nativeTarget instanceof HTMLTextAreaElement ||
      nativeTarget.classList.contains("drag-ignore")
    ) {
      // ignore drag from input element
      return;
    }

    let { onDragStartT, onGestureStartT, onGestureMoveT, useRightButtonDragT } =
      this.props;
    let event = e.nativeEvent;
    this.cancel();
    if (event.type === "touchstart") {
      // check single or double fingure touch
      if ((event as TouchEvent).touches.length === 1) {
        if (onDragStartT) {
          this.onDragStart(event);
        }
      } else if ((event as TouchEvent).touches.length === 2) {
        if (onGestureStartT && onGestureMoveT) {
          this.onGestureStart(event as TouchEvent);
        }
      }
    } else if (onDragStartT) {
      if ((event as MouseEvent).button === 2 && !useRightButtonDragT) {
        return;
      }
      this.onDragStart(event);
    }
  };

  onDragStart(event: MouseEvent | TouchEvent) {
    if (!this.element || !this.ownerDocument) {
      return;
    }
    if (DragManager.isDragging()) {
      // same pointer event shouldn't trigger 2 drag start
      return;
    }
    // element와 ownerDocument가 null이 아님을 확인했으므로 타입 단언 사용
    const component = this as unknown as DragManager.DragDropComponent & { element: HTMLElement; ownerDocument: Document; dragType: DragManager.DragType };
    let state = new DragManager.DragState(event, component, true);
    this.baseX = state.pageX;
    this.baseY = state.pageY;
    // fix dx dy value since it was calculated from the previous baseX
    state.dx = 0;
    state.dy = 0;

    let baseElement = this.element.parentElement;
    if (!baseElement) {
      return;
    }
    let rect = baseElement.getBoundingClientRect();
    this.scaleX = baseElement.offsetWidth / Math.round(rect.width);
    this.scaleY = baseElement.offsetHeight / Math.round(rect.height);
    this.addDragListeners(event);
    if (this.props.directDragT) {
      this.executeFirstMove(state);
    }
  }

  addDragListeners(event: MouseEvent | TouchEvent) {
    if (!this.ownerDocument) {
      return;
    }
    if (event.type === "touchstart") {
      this.ownerDocument.addEventListener("touchmove", this.onTouchMove, {
        capture: true,
      });
      this.ownerDocument.addEventListener("touchend", this.onDragEnd, {
        capture: true,
      });
      this.dragType = "touch";
    } else {
      this.ownerDocument.addEventListener("mousemove", this.onMouseMove, {
        capture: true,
      });
      this.ownerDocument.addEventListener("mouseup", this.onDragEnd, {
        capture: true,
      });
      if ((event as MouseEvent).button === 2) {
        this.dragType = "right";
      } else {
        this.dragType = "left";
      }
    }
    this.waitingMove = true;
    this.listening = true;
  }

  // return true for a valid move
  checkFirstMove(e: AbstractPointerEvent) {
    if (!this.element || !this.ownerDocument) {
      return false;
    }
      const component = this as unknown as DragManager.DragDropComponent & { element: HTMLElement; ownerDocument: Document; dragType: DragManager.DragType };
      let state = new DragManager.DragState(e, component, true);
    if (!state.moved()) {
      // not a move
      return false;
    }
    return this.executeFirstMove(state);
  }

  executeFirstMove(state: DragManager.DragState): boolean {
    if (!this.ownerDocument) {
      return false;
    }
    let { onDragStartT } = this.props;
    if (!onDragStartT) {
      return false;
    }

    this.waitingMove = false;
    onDragStartT(state);
    if (!DragManager.isDragging()) {
      this.onDragEnd();
      return false;
    }
    state._onMove();
    this.ownerDocument.addEventListener("keydown", this.onKeyDown);
    return true;
  }

  onMouseMove = (e: MouseEvent) => {
    let { onDragMoveT } = this.props;
    if (this.waitingMove) {
      if (DragManager.isDragging()) {
        this.onDragEnd();
        return;
      }
      if (!this.checkFirstMove(e)) {
        return;
      }
    } else {
      if (!this.element || !this.ownerDocument) {
        return;
      }
      const component = this as unknown as DragManager.DragDropComponent & { element: HTMLElement; ownerDocument: Document; dragType: DragManager.DragType };
      let state = new DragManager.DragState(e, component);
      state._onMove();
      if (onDragMoveT) {
        onDragMoveT(state);
      }
    }
    e.preventDefault();
  };

  onTouchMove = (e: TouchEvent) => {
    let { onDragMoveT } = this.props;
    if (this.waitingMove) {
      if (DragManager.isDragging()) {
        this.onDragEnd();
        return;
      }
      if (!this.checkFirstMove(e)) {
        return;
      }
    } else if (e.touches.length !== 1) {
      this.onDragEnd();
    } else {
      if (!this.element || !this.ownerDocument) {
        return;
      }
      const component = this as unknown as DragManager.DragDropComponent & { element: HTMLElement; ownerDocument: Document; dragType: DragManager.DragType };
      let state = new DragManager.DragState(e, component);
      state._onMove();
      if (onDragMoveT) {
        onDragMoveT(state);
      }
    }
    e.preventDefault();
  };

  onDragEnd = (e?: TouchEvent | MouseEvent) => {
    let { onDragEndT } = this.props;
    if (!this.element || !this.ownerDocument) {
      return;
    }
    const component = this as unknown as DragManager.DragDropComponent & { element: HTMLElement; ownerDocument: Document };
    let state = new DragManager.DragState(e, component);

    this.removeListeners();

    if (!this.waitingMove) {
      // e=null means drag is canceled
      state._onDragEnd(e == null);
      if (onDragEndT) {
        onDragEndT(state);
      }
    }

    this.cleanupDrag(state);
  };

  addGestureListeners(event: TouchEvent) {
    if (!this.ownerDocument) {
      return;
    }
    this.ownerDocument.addEventListener("touchmove", this.onGestureMove);
    this.ownerDocument.addEventListener("touchend", this.onGestureEnd);
    this.ownerDocument.addEventListener("keydown", this.onKeyDown);
    this.gesturing = true;
    this.waitingMove = true;
  }

  onGestureStart(event: TouchEvent) {
    if (!this.element || !this.ownerDocument) {
      return;
    }
    if (!DragManager.isDragging()) {
      // same pointer event shouldn't trigger 2 drag start
      return;
    }
    let { onGestureStartT } = this.props;

    this.baseX = event.touches[0].pageX;
    this.baseY = event.touches[0].pageY;
    this.baseX2 = event.touches[1].pageX;
    this.baseY2 = event.touches[1].pageY;
    let baseElement = this.element.parentElement;
    if (!baseElement) {
      return;
    }
    let rect = baseElement.getBoundingClientRect();
    this.scaleX = baseElement.offsetWidth / Math.round(rect.width);
    this.scaleY = baseElement.offsetHeight / Math.round(rect.height);
    this.baseDis = Math.sqrt(
      Math.pow(this.baseX - this.baseX2, 2) +
        Math.pow(this.baseY - this.baseY2, 2)
    );
    this.baseAng = Math.atan2(
      this.baseY2 - this.baseY,
      this.baseX2 - this.baseX
    );

    const component = this as unknown as GestureComponent & { element: HTMLElement; ownerDocument: Document; dragType: DragManager.DragType };
    let state = new GestureState(event, component, true);
    if (onGestureStartT && onGestureStartT(state)) {
      this.addGestureListeners(event);
      event.preventDefault();
    }
  }

  onGestureMove = (e: TouchEvent) => {
    if (!this.element || !this.ownerDocument) {
      return;
    }
    let { onGestureMoveT, gestureSensitivity } = this.props;
      const component = this as unknown as GestureComponent & { element: HTMLElement; ownerDocument: Document; dragType: DragManager.DragType };
      let state = new GestureState(e, component);
    if (this.waitingMove) {
      const sensitivity = gestureSensitivity ?? 10;
      if (state.moved() > sensitivity) {
        this.waitingMove = false;
      } else {
        return;
      }
    }
    if (onGestureMoveT) {
      onGestureMoveT(state);
    }
  };
  onGestureEnd = (e?: TouchEvent) => {
    let { onGestureEndT } = this.props;

    this.removeListeners();
    if (onGestureEndT) {
      onGestureEndT();
    }
  };
  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      this.cancel();
    }
  };

  cancel() {
    if (this.listening) {
      this.onDragEnd();
    }
    if (this.gesturing) {
      this.onGestureEnd();
    }
  }

  removeListeners() {
    if (!this.ownerDocument) {
      return;
    }
    if (this.gesturing) {
      this.ownerDocument.removeEventListener("touchmove", this.onGestureMove, {
        capture: true,
      });
      this.ownerDocument.removeEventListener("touchend", this.onGestureEnd, {
        capture: true,
      });
    } else if (this.listening) {
      if (this.dragType === "touch") {
        this.ownerDocument.removeEventListener("touchmove", this.onTouchMove, {
          capture: true,
        });
        this.ownerDocument.removeEventListener("touchend", this.onDragEnd, {
          capture: true,
        });
      } else {
        this.ownerDocument.removeEventListener("mousemove", this.onMouseMove, {
          capture: true,
        });
        this.ownerDocument.removeEventListener("mouseup", this.onDragEnd, {
          capture: true,
        });
      }
    }

    this.ownerDocument.removeEventListener("keydown", this.onKeyDown);
    this.listening = false;
    this.gesturing = false;
  }

  cleanupDrag(state: DragManager.DragState) {
    this.dragType = null;
    this.waitingMove = false;
  }

  render(): React.ReactNode {
    let {
      getRef,
      children,
      className,
      directDragT,
      captureT,
      onDragStartT,
      onDragMoveT,
      onDragEndT,
      onDragOverT,
      onDragLeaveT,
      onDropT,
      onGestureStartT,
      onGestureMoveT,
      onGestureEndT,
      useRightButtonDragT,
      ...others
    } = this.props;
    let onTouchDown: ((e: React.MouseEvent | React.TouchEvent) => void) | undefined = this.onPointerDown;
    let onMouseDown: ((e: React.MouseEvent | React.TouchEvent) => void) | undefined = this.onPointerDown;
    if (!onDragStartT) {
      onMouseDown = undefined;
      if (!onGestureStartT) {
        onTouchDown = undefined;
      }
    }
    if (onDragStartT || onGestureStartT) {
      if (className) {
        className = `${className} drag-initiator`;
      } else {
        className = "drag-initiator";
      }
    }
    if (captureT) {
      if (onMouseDown) others.onMouseDownCapture = onMouseDown;
      if (onTouchDown) others.onTouchStartCapture = onTouchDown;
    } else {
      if (onMouseDown) others.onMouseDown = onMouseDown;
      if (onTouchDown) others.onTouchStart = onTouchDown;
    }

    return (
      <div ref={this._getRef} className={className} {...others}>
        {children}
      </div>
    );
  }

  componentDidUpdate(prevProps: DragDropDivProps) {
    let { onDragOverT, onDragEndT, onDragLeaveT } = this.props;
    if (
      this.element &&
      (prevProps.onDragOverT !== onDragOverT ||
        prevProps.onDragLeaveT !== onDragLeaveT ||
        prevProps.onDragEndT !== onDragEndT)
    ) {
      if (onDragOverT) {
        DragManager.addHandlers(this.element, this);
      } else {
        DragManager.removeHandlers(this.element);
      }
    }
  }

  componentWillUnmount(): void {
    let { onDragOverT } = this.props;
    if (this.element && onDragOverT) {
      DragManager.removeHandlers(this.element);
    }
    this.cancel();
  }
}
