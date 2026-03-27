// @ts-nocheck
import * as React from "react";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import { DragState } from "./dragdrop/DragManager";

export interface DividerChild {
  size: number;
  minSize?: number;
}

export interface DividerData {
  element: HTMLElement;
  beforeDivider: DividerChild[];
  afterDivider: DividerChild[];
}

interface DividerProps {
  idx: number;
  className?: string;
  isVertical?: boolean;

  getDividerData(idx: number): DividerData | null;

  changeSizes(sizes: number[]): void;

  onDragEnd?(): void;
}

class BoxDataCache implements DividerData {
  element: HTMLElement;
  beforeDivider: DividerChild[];
  afterDivider: DividerChild[];

  beforeSize = 0;
  beforeMinSize = 0;
  afterSize = 0;
  afterMinSize = 0;

  constructor(data: DividerData) {
    this.element = data.element;
    this.beforeDivider = data.beforeDivider;
    this.afterDivider = data.afterDivider;
    for (let child of this.beforeDivider) {
      this.beforeSize += child.size;
      const minSize = child.minSize ?? 0;
      if (minSize > 0) {
        this.beforeMinSize += minSize;
      }
    }
    for (let child of this.afterDivider) {
      this.afterSize += child.size;
      const minSize = child.minSize ?? 0;
      if (minSize > 0) {
        this.afterMinSize += minSize;
      }
    }
  }
}

// split size among children
function spiltSize(
  newSize: number,
  oldSize: number,
  children: DividerChild[]
): number[] {
  let reservedSize = -1;
  let sizes: number[] = [];
  let requiredMinSize = 0;
  while (requiredMinSize !== reservedSize) {
    reservedSize = requiredMinSize;
    requiredMinSize = 0;
    let ratio = (newSize - reservedSize) / (oldSize - reservedSize);
    if (!(ratio >= 0)) {
      // invalid input
      break;
    }
    for (let i = 0; i < children.length; ++i) {
      let size = children[i].size * ratio;
      const minSize = children[i].minSize ?? 0;
      if (size < minSize) {
        size = minSize;
        requiredMinSize += size;
      }
      sizes[i] = size;
    }
  }
  return sizes;
}

export class Divider extends React.PureComponent<DividerProps, any> {
  boxData: BoxDataCache | null = null;

  startDrag = (e: DragState) => {
    const dividerData = this.props.getDividerData(this.props.idx);
    if (!dividerData) {
      return;
    }
    this.boxData = new BoxDataCache(dividerData);
    e.startDrag(this.boxData.element, undefined);
  };
  dragMove = (e: DragState) => {
    if (e.event.shiftKey || e.event.ctrlKey || e.event.altKey) {
      this.dragMoveAll(e.dx, e.dy);
    } else {
      this.dragMove2(e.dx, e.dy);
    }
  };

  dragMove2(dx: number, dy: number) {
    if (!this.boxData) {
      return;
    }
    let { isVertical, changeSizes } = this.props;
    let { beforeDivider, afterDivider } = this.boxData;
    if (!(beforeDivider.length && afterDivider.length)) {
      // invalid input
      return;
    }
    let d = isVertical ? dy : dx;
    const leftChild = beforeDivider[beforeDivider.length - 1];
    const rightChild = afterDivider[0];
    if (!leftChild || !rightChild) {
      return;
    }

    let leftSize = leftChild.size + d;
    let rightSize = rightChild.size - d;
    const leftMinSize = leftChild.minSize ?? 0;
    const rightMinSize = rightChild.minSize ?? 0;
    // check min size
    if (d > 0) {
      if (rightSize < rightMinSize) {
        rightSize = rightMinSize;
        leftSize = leftChild.size + rightChild.size - rightSize;
      }
    } else if (leftSize < leftMinSize) {
      leftSize = leftMinSize;
      rightSize = leftChild.size + rightChild.size - leftSize;
    }
    let sizes = beforeDivider.concat(afterDivider).map((child) => child.size);
    sizes[beforeDivider.length - 1] = leftSize;
    sizes[beforeDivider.length] = rightSize;
    changeSizes(sizes);
  }

  dragMoveAll(dx: number, dy: number) {
    if (!this.boxData) {
      return;
    }
    let { isVertical, changeSizes } = this.props;
    let {
      beforeSize,
      beforeMinSize,
      afterSize,
      afterMinSize,
      beforeDivider,
      afterDivider,
    } = this.boxData;
    let d = isVertical ? dy : dx;
    let newBeforeSize = beforeSize + d;
    let newAfterSize = afterSize - d;
    // check total min size
    if (d > 0) {
      if (newAfterSize < afterMinSize) {
        newAfterSize = afterMinSize;
        newBeforeSize = beforeSize + afterSize - afterMinSize;
      }
    } else if (newBeforeSize < beforeMinSize) {
      newBeforeSize = beforeMinSize;
      newAfterSize = beforeSize + afterSize - beforeMinSize;
    }

    changeSizes(
      spiltSize(newBeforeSize, beforeSize, beforeDivider).concat(
        spiltSize(newAfterSize, afterSize, afterDivider)
      )
    );
  }

  dragEnd = (e: DragState) => {
    let { onDragEnd } = this.props;
    this.boxData = null;
    if (onDragEnd) {
      onDragEnd();
    }
  };

  render(): React.ReactNode {
    let { className } = this.props;
    if (!className) {
      className = "dock-divider";
    }
    return (
      <DragDropDiv
        className={className}
        onDragStartT={this.startDrag}
        onDragMoveT={this.dragMove}
        onDragEndT={this.dragEnd}
      />
    );
  }
}
