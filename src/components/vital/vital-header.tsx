import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import type { MyGridHeaderType } from "../yjg/my-grid/my-grid-type";

export const LS_VITAL_HEADERS_KEY = "vital-headers";

export const getDefaultVitalHeaders = (
  vitalSignItems: VitalSignItem[]
): MyGridHeaderType[] => {
  const headers: MyGridHeaderType[] = [
    {
      key: "measurementDate",
      name: "측정일시",
      align: "left",
      width: 155,
      minWidth: 155,
      visible: true,
      readonly: false,
      sortNumber: 1,
    },
  ];

  vitalSignItems.forEach((item, index) => {
    headers.push({
      key: item.code,
      name: item.name,
      align: "center",
      width: getWidth(item.code),
      minWidth: getWidth(item.code),
      visible: true,
      readonly: false,
      sortNumber: index + 2,
    });
  });

  return headers;
};

export const getWidth = (code: string) => {
  switch (code) {
    case "BPS":
    case "BPD":
      return 50;
    case "BS":
      return 70;
    default:
      return 38;
  }
};
