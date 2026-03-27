import { cn } from "@/lib/utils";
import { getCellValueAsNumber } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { MySelect } from "@/components/yjg/my-select";
import { useMemo } from "react";
import { PaymentMethod } from "@/constants/common/common-enum";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/common/common-option";

export interface SelfPayRateOptions {
  isSelfPayRate30: boolean;
  isSelfPayRate50: boolean;
  isSelfPayRate80: boolean;
  isSelfPayRate90: boolean;
  isSelfPayRate100: boolean;
}

// isSelfPayRate 값 추출 헬퍼 함수
const getSelfPayRateOptions = (orgData: { type: string; data: any }): SelfPayRateOptions => {
  if (!orgData) {
    return {
      isSelfPayRate30: false,
      isSelfPayRate50: false,
      isSelfPayRate80: false,
      isSelfPayRate90: false,
      isSelfPayRate100: false,
    };
  }

  // order 타입인 경우 - data에서 직접 가져옴
  if (orgData.type === "order") {
    const order = orgData.data;
    return {
      isSelfPayRate30: order?.isSelfPayRate30 || false,
      isSelfPayRate50: order?.isSelfPayRate50 || false,
      isSelfPayRate80: order?.isSelfPayRate80 || false,
      isSelfPayRate90: order?.isSelfPayRate90 || false,
      isSelfPayRate100: order?.isSelfPayRate100 || false,
    };
  }

  // order-library 타입인 경우 - libraryDetail에서 가져옴
  if (orgData.type === "order-library") {
    const data = orgData.data;
    // userCode 카테고리인 경우: data.library.details?.[0]
    // 그 외: data.details?.[0]
    const libraryDetail =
      data?.category === "userCode"
        ? data?.library?.details?.[0]
        : data?.details?.[0];

    return {
      isSelfPayRate30: libraryDetail?.isSelfPayRate30 || false,
      isSelfPayRate50: libraryDetail?.isSelfPayRate50 || false,
      isSelfPayRate80: libraryDetail?.isSelfPayRate80 || false,
      isSelfPayRate90: libraryDetail?.isSelfPayRate90 || false,
      isSelfPayRate100: libraryDetail?.isSelfPayRate100 || false,
    };
  }

  return {
    isSelfPayRate30: false,
    isSelfPayRate50: false,
    isSelfPayRate80: false,
    isSelfPayRate90: false,
    isSelfPayRate100: false,
  };
}

const GetPaymentMethodOptions = (selfPayRateOptions: SelfPayRateOptions) => {
  let options = PAYMENT_METHOD_OPTIONS;

  if (!selfPayRateOptions.isSelfPayRate30) {
    options = options.filter((option) => option.value !== PaymentMethod.삼십대백);
  }
  if (!selfPayRateOptions.isSelfPayRate50) {
    options = options.filter((option) => option.value !== PaymentMethod.오십대백);
  }
  if (!selfPayRateOptions.isSelfPayRate80) {
    options = options.filter((option) => option.value !== PaymentMethod.팔십대백);
  }
  if (!selfPayRateOptions.isSelfPayRate90) {
    options = options.filter((option) => option.value !== PaymentMethod.구십대백);
  }
  if (!selfPayRateOptions.isSelfPayRate100) {
    options = options.filter((option) => option.value !== PaymentMethod.백대백);
  }

  return options;
};

interface OrderPaymentMethodProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  row: MyTreeGridRowType;
  readOnly?: boolean;
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
}



export default function OrderPaymentMethod({
  size,
  row,
  readOnly = false,
  onDataChangeItem,
}: OrderPaymentMethodProps) {
  const paymentMethod = getCellValueAsNumber(row, "paymentMethod");

  // isSelfPayRate 옵션에 따라 필터링된 결제방법 옵션
  const filteredPaymentOptions = useMemo(() => {
    const selfPayRateOptions = getSelfPayRateOptions(row.orgData);
    return GetPaymentMethodOptions(selfPayRateOptions);
  }, [row]);

  const handleChange = (value: string | number) => {
    if (readOnly) return;
    onDataChangeItem?.("paymentMethod", row, value);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center border border-[var(--border-1)] rounded select-none p-0",
        readOnly ? "cursor-not-allowed pointer-events-none" : "cursor-pointer"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <MySelect
        options={filteredPaymentOptions}
        value={paymentMethod}
        onChange={handleChange}
        size={size}
        hideChevron
        className="!border-0 !bg-[var(--input-bg)] !min-w-0 w-full h-full flex items-center justify-center"
        parentClassName="w-full h-full"
      />
    </div>
  );
}