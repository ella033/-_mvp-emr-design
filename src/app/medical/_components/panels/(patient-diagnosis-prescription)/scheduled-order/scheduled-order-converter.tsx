import type {
  MyTreeGridRowType,
  MyTreeGridRowCellType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { OrderGridConvertToGridRowTypesParams } from "@/components/disease-order/order/order-grid-convert-params";
import type { ScheduledOrder } from "@/types/scheduled-order-types";
import { toKRW } from "@/lib/patient-utils";
import { convertToISO8601, formatDate } from "@/lib/date-utils";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { useUserStore } from "@/store/user-store";
import { useUsersStore } from "@/store/users-store";
import ScheduledOrderMemoCell from "./scheduled-order-memo-cell";
import {
  getCellValueAsNumber,
  getCellValueAsString,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { PrescriptionType } from "@/constants/master-data-enum";

// 사용자 이름 조회 헬퍼 함수
const getUserNameById = (userId?: number): string => {
  if (!userId) return "";
  const hospitalId = String(useUserStore.getState().user?.hospitalId || "");
  if (!hospitalId) return "";

  const user = useUsersStore.getState().getUserById(hospitalId, userId);
  return user?.name || "";
};

export const convertScheduledOrdersToMyTreeGridType = (
  params: OrderGridConvertToGridRowTypesParams
): MyTreeGridRowType[] => {
  const { parentRowKey = null, data: orders, size, onCellDataChange } = params;

  if (!orders || !Array.isArray(orders)) {
    return [];
  }

  return orders
    .map((order, index) =>
      convertScheduleOrderToMyTreeGridType(
        parentRowKey,
        order,
        size!,
        onCellDataChange!,
        index
      )
    )
    .filter((order) => order !== null);
};

export const convertScheduleOrderToMyTreeGridType = (
  parentRowKey: string | null,
  order: ScheduledOrder,
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void,
  index: number
): MyTreeGridRowType | null => {
  if (!order) return null;

  const isBundle = order.bundleItemId !== null && order.bundleItem !== null;

  const rowKey = getRowKey("scheduled-order", index);

  // 처방 정보 추출 (우선순위: prescriptionUserCode > prescriptionLibrary > bundleItem)
  const userCode = order.prescriptionUserCode;
  const library = order.prescriptionLibrary;
  const bundleItem = order.bundleItem;

  // 기본 정보 추출
  const code = userCode?.code || bundleItem?.code || "";
  const name = userCode?.name || library?.name || bundleItem?.name || "";
  const itemType = userCode?.itemType || library?.itemType || "";

  // 가격 정보 추출
  const libraryDetails = userCode?.library?.details || library?.details || [];
  const latestDetail = libraryDetails.length > 0 ? libraryDetails[0] : null;
  const insurancePrice = latestDetail?.price || 0;

  // 일반가 추출 (userCode의 details에서)
  const userCodeDetails = userCode?.details || [];
  const latestUserCodeDetail =
    userCodeDetails.length > 0 ? userCodeDetails[0] : null;
  const generalPrice = latestUserCodeDetail?.normalPrice || 0;

  // 등록자 이름 조회
  const createName = getUserNameById(order.createId);

  const cells: MyTreeGridRowCellType[] = [
    {
      headerKey: "scheduledOrderId",
      value: order.id,
    },
    {
      headerKey: "scheduledOrderApplyDate",
      value: order.applyDate ? formatDate(order.applyDate, "-") : "",
      inputType: "myDateTime",
    },
    {
      headerKey: "userCode",
      value: code,
    },
    {
      headerKey: "name",
      value: name,
    },
    {
      headerKey: "scheduledOrderMemo",
      value: order.memo || "",
      customRender: (
        <ScheduledOrderMemoCell
          memo={order.memo || ""}
          onMemoChangeAction={(value) => {
            onCellDataChange(rowKey, "scheduledOrderMemo", value);
          }}
        />
      ),
    },
    {
      headerKey: "dose",
      value: isBundle ? "" : order.dose,
      inputType: isBundle ? undefined : "textNumber",
      textNumberOption: {
        min: 0,
        max: 1000000000,
        pointPos: 8,
      },
    },
    {
      headerKey: "times",
      value: isBundle ? "" : order.times,
      inputType: isBundle ? undefined : "textNumber",
      textNumberOption: {
        min: 0,
        max: 99,
        pointPos: 0,
      },
    },
    {
      headerKey: "days",
      value: isBundle ? "" : order.days,
      inputType: isBundle ? undefined : "textNumber",
      textNumberOption: {
        min: 0,
        max: 999,
        pointPos: 0,
      },
    },
    {
      headerKey: "insurancePrice",
      value: isBundle ? "" : toKRW(insurancePrice),
    },
    {
      headerKey: "generalPrice",
      value: isBundle ? "" : toKRW(generalPrice),
    },
    {
      headerKey: "scheduledOrderCreateDate",
      value: order.createDateTime ? formatDate(order.createDateTime, "-") : "",
    },
    {
      headerKey: "scheduledOrderCreateName",
      value: createName,
    },
    // 숨겨진 데이터 필드들
    {
      headerKey: "id",
      value: order.id,
    },
    {
      headerKey: "userCodeId",
      value: order.userCodeId || "",
    },
    {
      headerKey: "prescriptionLibraryId",
      value: order.prescriptionLibraryId || "",
    },
    {
      headerKey: "bundleItemId",
      value: order.bundleItemId || "",
    },
    {
      headerKey: "itemType",
      value: itemType,
    },
  ];

  return {
    rowKey: rowKey,
    parentRowKey: parentRowKey,
    type: parentRowKey === null ? "item" : "fixed-item",
    orgData: {
      type: "scheduled-order",
      data: order,
    },
    isHighlight: false,
    iconBtn: itemType ? (
      <GetItemTypeCategoryIcon
        size={size}
        itemType={itemType}
        claimCode={latestDetail?.claimCode}
      />
    ) : (
      isBundle && <GetItemTypeCategoryIcon size={size} category="bundle" />
    ),
    cells: cells,
  };
};

export const convertToApiScheduledOrder = (
  data: MyTreeGridRowType[]
): ScheduledOrder[] => {
  return data.map((row) => {
    const applyDate = getCellValueAsString(row, "scheduledOrderApplyDate");
    const applyISODate = applyDate ? convertToISO8601(applyDate) : undefined;

    return {
      id: getCellValueAsString(row, "scheduledOrderId") || undefined,
      userCodeId: getCellValueAsNumber(row, "userCodeId") || undefined,
      prescriptionLibraryId:
        getCellValueAsNumber(row, "prescriptionLibraryId") || undefined,
      bundleItemId: getCellValueAsNumber(row, "bundleItemId") || undefined,
      dose: getCellValueAsNumber(row, "dose") || 0,
      days: getCellValueAsNumber(row, "days") || 0,
      times: getCellValueAsNumber(row, "times") || 0,
      applyDate: applyISODate,
      memo: getCellValueAsString(row, "scheduledOrderMemo") || undefined,
    };
  });
};

export const addScheduledOrderToOrderGrid = (
  rows: MyTreeGridRowType[],
  addOrderLibrary: (
    order: any,
    isScheduledOrder: boolean,
    scheduledOrderMemo: string
  ) => void
): void => {
  for (const row of rows) {
    let order: any = row.orgData.data;
    const scheduledOrderMemo = getCellValueAsString(row, "scheduledOrderMemo");

    if (row.orgData.type !== "scheduled-order") {
      if (row.orgData.type === "bundle") {
        order.type = "bundle";
      }
    } else {
      const scheduledOrder = order as ScheduledOrder;
      // 그리드에서 사용자가 수정한 dose/days/times 값 추출
      const dose = getCellValueAsNumber(row, "dose") ?? scheduledOrder.dose ?? 0;
      const days = getCellValueAsNumber(row, "days") ?? scheduledOrder.days ?? 0;
      const times = getCellValueAsNumber(row, "times") ?? scheduledOrder.times ?? 0;

      if (scheduledOrder.prescriptionUserCode) {
        // userCode인 경우: prescriptionUserCode에 이미 데이터가 들어있음
        order = { ...scheduledOrder.prescriptionUserCode, category: "userCode" };

        // 예약처방에서 설정한 dose/days/times로 덮어쓰기 (drug/material 하위 객체 + 최상위)
        if (order.type === PrescriptionType.drug && order.drugUserCode) {
          order.drugUserCode = { ...order.drugUserCode, dose, days, times };
        } else if (order.type === PrescriptionType.material && order.materialUserCode) {
          order.materialUserCode = { ...order.materialUserCode, dose };
        }
      } else if (scheduledOrder.bundleItem) {
        order = { ...scheduledOrder.bundleItem, type: "bundle" };
      } else if (scheduledOrder.prescriptionLibrary) {
        // prescriptionLibrary에 이미 데이터가 들어있음
        const lib = scheduledOrder.prescriptionLibrary;
        if (lib.medicalLibrary) {
          order = { ...lib, category: "medicalLibrary" };
        } else if (lib.drugLibrary) {
          order = { ...lib, category: "drugLibrary" };
        } else if (lib.materialLibrary) {
          order = { ...lib, category: "materialLibrary" };
        } else {
          order = { ...lib, category: "medicalLibrary" };
        }
      }

      // 모든 타입에 대해 예약처방의 dose/days/times를 최상위에 설정
      // converter에서 이 값이 있으면 category별 기본값보다 우선 적용
      order._scheduledDose = dose;
      order._scheduledDays = days;
      order._scheduledTimes = times;
    }

    addOrderLibrary(order, true, scheduledOrderMemo || "");
  }
};
