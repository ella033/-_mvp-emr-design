import type { Order } from "@/types/chart/order-types";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { 보험구분상세 } from "@/constants/common/common-enum";

/** OrderGrid onConvertToGridRowTypes 콜백 인자. 필요 필드만 넣어서 사용 가능 */
export interface OrderGridConvertToGridRowTypesParams {
  parentRowKey?: string | null;
  data: any[];
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  onCellDataChange?: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void;
  /** Order 트리 변환 시 전체 목록 (children 탐색용) */
  allOrders?: Order[];
  /** Bundle 아이템 변환 시 부모 번들 */
  bundle?: Bundle;
  /** 보험구분상세 */
  insuranceType?: 보험구분상세;
}
