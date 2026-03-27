import type {
  PriceDetailType,
} from "@/types/master-data/master-data-detail-type";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { formatDate } from "@/lib/date-utils";
import { toKRW } from "@/lib/patient-utils";

export function convertPriceDetailsToGridRowType(
  priceDetails: PriceDetailType[],
  isDrug?: boolean
): MyGridRowType[] {
  return priceDetails.map((priceDetail, index) => ({
    key: priceDetail.tempId,
    rowIndex: index + 1,
    cells: [
      {
        headerKey: "applyDate",
        value: formatDate(priceDetail.applyDate, "-"),
        inputType: "date" as const,
      },
      ...(isDrug ? [
        {
          headerKey: "additionalPrice",
          value: toKRW(priceDetail.additionalPrice),
        },
      ] : []),
      {
        headerKey: "price",
        value: toKRW(priceDetail.price),
      },
      {
        headerKey: "normalPrice",
        value: priceDetail.normalPrice,
        inputType: "textNumber",
        textNumberOption: {
          min: 0,
          max: 1000000000,
          pointPos: 0,
          pointType: 0,
          unit: "원",
          showComma: true,
        },
      },
      {
        headerKey: "actualPrice",
        value: priceDetail.actualPrice,
        inputType: "textNumber",
        textNumberOption: {
          min: 0,
          max: 1000000000,
          pointPos: 0,
          pointType: 0,
          unit: "원",
          showComma: true,
        },
      },
    ],
  }));
}