import { DecimalPoint } from "@/constants/master-data-enum";

export type MyTreeGridHeaderType = {
  key: string; // 헤더의 키값
  name: string; // 헤더의 이름
  sortNumber?: number; // 헤더 순서
  isFixedLeft?: boolean; // 헤더 좌측 고정 여부
  isFixedRight?: boolean; // 헤더 우측 고정 여부
  width?: number; // 헤더 너비
  minWidth?: number; // 헤더 최소 너비
  maxWidth?: number; // 헤더 최대 너비
  readonly?: boolean; // 헤더 읽기 전용 여부
  visible?: boolean; // 헤더 표시 여부
  align?: "left" | "center" | "right"; // 헤더 정렬
  customRender?: React.ReactNode; // 헤더 커스텀 렌더링
};

export type MyTreeGridInputType =
  | "text"
  | "textNumber"
  | "select"
  | "select-popup"
  | "date"
  | "time"
  | "dateTime"
  | "myDateTime"
  | "checkbox"
  | "external-cause-code"
  | "usage"
  | "exception-code"
  | "specific-detail"
  | "specimen-detail"
  | "specimen-detail-external"
  | "is-claim"
  | "payment-method"
  | "custom";

export type MyTreeGridInputTextOption = {
  maxLength?: number;
};

export type MyTreeGridInputTextNumberOption = {
  min?: number;
  max?: number;
  pointPos?: number; // 소수점 위치
  pointType?: DecimalPoint; // 소수점 타입
  unit?: string; // 단위
  showComma?: boolean; // 콤마 표시 여부
};

export type MyTreeGridInputSelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
};

export type MyTreeGridInputSelectPopupOption = {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
};

export type MyTreeGridRowType = {
  rowKey: string; // UI에서 row 구분을 위해 활용하는 key 값
  parentRowKey: string | null;
  type: "folder" | "fixed-folder" | "package" | "fixed-package" | "item" | "fixed-item"; // folder: 카테고리, 폴더 / package: 묶음 / item: 아이템 / fixed-xxx: 고정(drag drop 불가)
  orgData: {
    type: string; // 데이터 종류 구분을 위한 타입
    data: any; // row의 원본데이터
  };
  cells: MyTreeGridRowCellType[]; // row의 셀 데이터
  level?: number; // row의 계층 (my-tree-grid의 const flatRows = useMemo(() => flattenTree(data), [data, flattenTree]); 에서 자동으로 부여됨.)
  sortNumber?: number; // row의 정렬 순서 (my-tree-grid의 const flatRows = useMemo(() => flattenTree(data), [data, flattenTree]); 에서 자동으로 부여됨.)
  isExpanded?: boolean; // row의 확장 여부
  isDragging?: boolean; // row의 드래그 여부
  isHighlight?: boolean; // row의 하이라이트 여부
  customRender?: React.ReactNode; // row의 커스텀 렌더링
  rowAction?: React.ReactNode; // row 우측 액션 영역(hover 시 노출)
  iconBtn?: React.ReactNode; // row의 아이콘 버튼
  children?: MyTreeGridRowType[]; // row의 자식 row
  className?: string; // row의 클래스 이름
};

export type MyTreeGridRowCellType = {
  headerKey: string; // 셀의 헤더 키값
  value: string | number | boolean | null | undefined; // 셀의 값
  readonly?: boolean; // 셈의 읽기 전용 여부
  className?: string; // 셀의 클래스 이름
  inputType?: MyTreeGridInputType; // 입력 타입
  textOption?: MyTreeGridInputTextOption; // 텍스트 옵션
  textNumberOption?: MyTreeGridInputTextNumberOption; // 숫자 옵션
  selectOption?: MyTreeGridInputSelectOption[]; // 선택 옵션
  selectPopupOption?: MyTreeGridInputSelectPopupOption[]; // 선택 팝업 옵션
  customRender?: React.ReactNode; // 셀의 커스텀 렌더링
};

export type CellUpdateHandler = (
  row: MyTreeGridRowType,
  value: string | number | boolean | null
) => MyTreeGridRowType;
