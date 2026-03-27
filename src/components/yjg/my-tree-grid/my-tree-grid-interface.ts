import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
} from "./my-tree-grid-type";

export interface MyTreeGridDragDropInfo {
  draggedRow: MyTreeGridRowType;
  beforeRow: MyTreeGridRowType | null;
  afterRow: MyTreeGridRowType | null;
  dropPosition: "above" | "below" | "inside";
  newParent: MyTreeGridRowType | null;
  newIndex: number;
}

export interface ContextMenuAction {
  id: string;
  label?: string;
  getLabel?: (
    header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    selectedRows: MyTreeGridRowType[]
  ) => string;
  icon?: React.ReactNode;
  customRender?: React.ReactNode;
  onClick: (
    header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    selectedRows: MyTreeGridRowType[]
  ) => void;
  disabled?: (
    header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    selectedRows: MyTreeGridRowType[]
  ) => boolean;
  shortcuts?: string[];
}
