// ================== header ==================
export type MyGridHeaderType = {
  key: string;
  name: string;
  sortNumber?: number; // drag & drop 순서 관리를 위한 속성
  isFixedLeft?: boolean;
  isFixedRight?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  readonly?: boolean;
  visible?: boolean;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  customRender?: React.ReactNode;
};
// ================== row ==================
export type MyGridRowType = {
  rowIndex: number;
  key: string | number;
  cells: MyGridCellType[];
  rowAction?: React.ReactNode;
  customRender?: React.ReactNode;
  /** 체크박스 선택 모드에서 해당 행의 체크박스 비활성화 여부 */
  checkboxDisabled?: boolean;
};
// ================== item ==================

export type MyGridCellType = {
  headerKey: string;
  value: string | number | boolean | null | undefined;
  orgData?: any; // 원본데이터
  tooltip?: React.ReactNode; // 툴팁
  tooltipDelayDuration?: number; // 툴팁 지연 시간
  customRender?: React.ReactNode;
  inputType?: MyGridInputType;
  textOption?: MyGridInputTextOption;
  textNumberOption?: MyGridInputTextNumberOption;
  selectOption?: MyGridInputSelectOption[];
  align?: "left" | "center" | "right"; // 셀별 align 설정 (헤더 align보다 우선)
  disabled?: boolean; // 셀 입력 비활성화 (checkbox 등에서 사용)
};

export type MyGridInputType =
  | "text"
  | "textNumber"
  | "select"
  | "date"
  | "time"
  | "dateTime"
  | "checkbox"
  | "custom";

export type MyGridInputTextOption = {
  maxLength?: number;
};

export type MyGridInputTextNumberOption = {
  min?: number;
  max?: number;
  normalMin?: number;
  normalMax?: number;
  pointPos?: number;
  pointType?: number;
  unit?: string;
  showComma?: boolean;
};

export type MyGridInputSelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
};

// ================== cell navigation ==================
export type FocusedCellType = {
  rowKey: string | number;
  headerKey: string;
} | null;