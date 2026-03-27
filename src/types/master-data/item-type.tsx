import { showDrugInfo } from "@/lib/business-utils";
import { cn } from "@/lib/utils";
import {
  LineBundleIcon,
  LineDiseaseIcon,
  LineExamIcon,
  LineInjectionIcon,
  LineMedicineIcon,
  LinePhysicalTherapyIcon,
  LineRadiationIcon,
  LineTreatmentIcon,
  LineTreatmentMaterialIcon,
  LineGeoOrderIcon,
  ScheduledOrderIcon,
} from "@/components/custom-icons";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { Order } from "../chart/order-types";
import {
  ITEM_TYPE_CONTAINER_SIZE_CLASS,
} from "@/components/yjg/common/constant/class-constants";
import { ItemTypeCodeLabel, type ItemTypeCode } from "@/constants/library-option/item-type-option";

const ICON_SIZE_CLASS = "w-[13px] h-[13px]";

export enum 처방상세구분 {
  없음 = 0,
  처치 = 1,
  검사 = 2,
  방사선 = 3,
  약 = 4,
  주사 = 5,
  치료재료 = 6,
  물리치료 = 7,
}

export const getPrescriptionDetailTypes = (orders: Order[]) => {
  return [
    ...new Set(
      orders.map((order) => getPrescriptionDetailType(order.itemType))
    ),
  ];
};

//----------------------------------------------------------------------------------------------------------------------------------------

/**
 * 항목구분으로부터 처방상세구분을 변환합니다.
 * @param itemType 항목구분 문자열
 * @returns 처방상세구분 enum 값
 */
export const getPrescriptionDetailType = (
  itemType: string | undefined
): 처방상세구분 => {
  if (!itemType) {
    return 처방상세구분.없음;
  }

  // 처치 (처방상세구분 = 1)
  if (
    itemType.startsWith("01") || // 진찰료(01)
    itemType.startsWith("02") || // 입원료(02)
    ["0501", "0701", "0801"].includes(itemType) || // 마취료(0501), 정신요법료(0701), 처치수술료_일반(0801)
    itemType.startsWith("T02")
  ) {
    // 특수재료_진료행위(T02)
    return 처방상세구분.처치;
  }

  // 검사 (처방상세구분 = 2)
  if (itemType.startsWith("09")) {
    // 검사료(09)
    return 처방상세구분.검사;
  }

  // 방사선 (처방상세구분 = 3)
  if (
    itemType.startsWith("10") || // 영상진단방사선료(10)
    ["S01", "S02", "S03"].some((specialCode) =>
      itemType.startsWith(specialCode)
    )
  ) {
    // 특수장비_CT진단(S01), 특수장비_MRI진단(S02), 특수장비_PET진단(S03)
    return 처방상세구분.방사선;
  }

  // 약 (처방상세구분 = 4)
  if (itemType.startsWith("03")) {
    // 투약료(03)
    return 처방상세구분.약;
  }

  // 주사 (처방상세구분 = 5)
  if (itemType.startsWith("04")) {
    // 주사료(04)
    return 처방상세구분.주사;
  }

  // 치료재료 (처방상세구분 = 6)
  if (
    ["0803"].includes(itemType) || // 처치수술료_캐스트(0803)
    itemType.startsWith("T01")
  ) {
    // 특수재료_치료재료(T01)
    return 처방상세구분.치료재료;
  }

  // 물리치료 (처방상세구분 = 7)
  if (["0601"].includes(itemType)) {
    // 이학요법료(0601)
    return 처방상세구분.물리치료;
  }

  // 매칭되지 않는 경우
  return 처방상세구분.없음;
};

export const GetItemTypeCodes = (type: 처방상세구분) => {
  switch (type) {
    case 처방상세구분.처치:
      return ["01", "02", "0501", "0701", "0801", "T02"];
    case 처방상세구분.검사:
      return ["09"];
    case 처방상세구분.방사선:
      return ["10", "S01", "S02", "S03"];
    case 처방상세구분.약:
      return ["03"];
    case 처방상세구분.주사:
      return ["04"];
    case 처방상세구분.치료재료:
      return ["0803", "T01"];
    case 처방상세구분.물리치료:
      return ["0601"];
    default:
      return [];
  }
};

export const GetIconFromItemType = ({
  type,
  className,
}: {
  type: 처방상세구분;
  className?: string;
}) => {
  switch (type) {
    case 처방상세구분.처치:
      return <LineTreatmentIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case 처방상세구분.검사:
      return <LineExamIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case 처방상세구분.방사선:
      return <LineRadiationIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case 처방상세구분.약:
      return <LineMedicineIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case 처방상세구분.주사:
      return <LineInjectionIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case 처방상세구분.치료재료:
      return <LineTreatmentMaterialIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case 처방상세구분.물리치료:
      return <LinePhysicalTherapyIcon className={cn(ICON_SIZE_CLASS, className)} />;
    default:
      return <div className={cn("flex items-center justify-center text-[var(--gray-100)] text-[10px] font-[700]", ICON_SIZE_CLASS, className)}>?</div>;
  }
};

export const GetIconFromCategory = ({
  category,
  className,
}: {
  category: string;
  className?: string;
}) => {
  switch (category) {
    case "disease":
      return <LineDiseaseIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case "bundle":
      return <LineBundleIcon className={cn(ICON_SIZE_CLASS, className)} />;
    case "command":
      return (
        <LineGeoOrderIcon
          className={cn("text-[var(--command-order-color)]", ICON_SIZE_CLASS, className)}
        />
      );
    case "scheduled-order":
      return <ScheduledOrderIcon className={cn(ICON_SIZE_CLASS, className)} />;
    default:
      return null;
  }
};

const IconContainer = ({
  size,
  itemType,
  type,
  category,
  children,
  containerClassName,
  ...props
}: {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  itemType?: string;
  type: 처방상세구분;
  category?: string | "bundle" | "disease";
  children: React.ReactNode;
  containerClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0",
        ITEM_TYPE_CONTAINER_SIZE_CLASS[size],
        containerClassName
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GetItemTypeCategoryIcon = ({
  size = "default",
  itemType,
  category,
  claimCode,
  iconClassName,
  containerClassName,
  tooltip,
  ...props
}: {
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  itemType?: string;
  category?: string;
  claimCode?: string; // claimCode가 넘어오면 DI 조회
  iconClassName?: string;
  containerClassName?: string;
  tooltip?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const type = getPrescriptionDetailType(itemType);
  const itemTypeLabel =
    itemType && itemType in ItemTypeCodeLabel
      ? ItemTypeCodeLabel[itemType as ItemTypeCode]
      : `알 수 없는 항목구분입니다. (${itemType})`;
  const itemTypeLabelElement = <span className="text-[10px]">{itemTypeLabel}</span>

  const getIcon = () => {
    if (
      category === "bundle" ||
      category === "disease" ||
      category === "command" ||
      category === "scheduled-order"
    ) {
      return (
        <GetIconFromCategory
          category={category}
          className={iconClassName}
        />
      );
    } else {
      return (
        <GetIconFromItemType
          type={type}
          className={iconClassName}
        />
      );
    }
  };

  if (claimCode && (type === 처방상세구분.약 || type === 처방상세구분.주사 || itemType === "W01")) {
    return (
      <MyTooltip
        side="left"
        content={
          <div className="flex flex-col items-start gap-1">
            {itemTypeLabelElement}
            <span className="text-[12px]">약품정보(DI) 조회</span>
          </div>
        }
      >
        <IconContainer
          size={size}
          itemType={itemType}
          type={type}
          category={category}
          containerClassName={containerClassName}
          onClick={() => {
            showDrugInfo(claimCode);
          }}
          {...props}
        >
          {getIcon()}
        </IconContainer>
      </MyTooltip>
    );
  } else {
    const hasTooltipContent = itemTypeLabelElement || tooltip;
    return (
      <MyTooltip
        content={
          hasTooltipContent ? (
            <div className="flex flex-col items-start gap-1">
              {itemTypeLabelElement}
              <div>{tooltip}</div>
            </div>
          ) : undefined
        }
        side="left"
      >
        <IconContainer
          size={size}
          itemType={itemType}
          type={type}
          category={category}
          containerClassName={containerClassName}
          {...props}
        >
          {getIcon()}
        </IconContainer>
      </MyTooltip>
    );
  }
};
