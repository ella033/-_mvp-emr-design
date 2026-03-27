import { toKRW } from "@/lib/patient-utils";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { highlightText } from "@/components/yjg/my-search-drop-down";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { cn } from "@/lib/utils";

const FONT_SIZE = {
  xs: 10,
  sm: 12,
  default: 14,
  lg: 16,
  xl: 18,
};

export default function PrescriptionLibrarySearchResult({
  size,
  item,
  searchWord,
}: {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  item: any;
  searchWord: string;
}) {
  const getCode = (item: any): React.ReactNode => {
    if (!item || typeof item !== "object") return null;

    let code = "";

    switch (item.category) {
      case "disease":
        code = item.details?.[0]?.code || "";
        break;
      case "bundle":
        code = item.code || "";
        break;
      case "userCode":
        code = item.code || "";
        break;
      case "medicalLibrary":
        code = item.details?.[0]?.claimCode || "";
        break;
      case "drugLibrary":
        code = item.details?.[0]?.claimCode || "";
        break;
      case "materialLibrary":
        code = item.details?.[0]?.claimCode || "";
        break;
      default:
        return null;
    }

    return (
      <MyTooltip content={code}>
        <span
          className={cn(
            "min-w-[50px] max-w-[50px] overflow-hidden text-ellipsis",
            "text-[var(--text-primary)]",
            `text-[${FONT_SIZE[size]}px]`
          )}
        >
          {highlightText(code, searchWord)}
        </span>
      </MyTooltip>
    );
  };

  const getName = (item: any): React.ReactNode => {
    if (!item || typeof item !== "object") return null;

    let name = "";
    switch (item.category) {
      case "disease":
        name = item.name || "";
        break;
      case "bundle":
        name = item.name || "";
        break;
      case "userCode":
        name = item.name || "";
        break;
      case "medicalLibrary":
        name = `${item.name} ${item.medicalLibrary.assessmentName ? `(${item.medicalLibrary.assessmentName})` : ""}`;
        break;

      case "drugLibrary":
        name = item.name || "";
        break;
      case "materialLibrary":
        name = item.name || "";
        break;
      default:
        return null;
    }

    return (
      <span
        className={cn(
          "text-[var(--text-primary)]",
          `text-[${FONT_SIZE[size]}px]`
        )}
      >
        {highlightText(name, searchWord)}
      </span>
    );
  };

  const getEnName = (item: any): React.ReactNode => {
    if (!item || typeof item !== "object") return null;

    let nameEn = "";
    switch (item.category) {
      case "disease":
        nameEn = item.nameEn || "";
        break;
      case "userCode":
        nameEn = item.nameEn || "";
        break;
      case "medicalLibrary":
        nameEn = item.medicalLibrary.nameEn || "";
        break;
      default:
        return null;
    }

    return (
      <span
        className={cn(
          "text-[var(--text-secondary)]",
          `text-[${FONT_SIZE[size] - 2}px]`
        )}
      >
        {highlightText(nameEn, searchWord)}
      </span>
    );
  };

  const getPrice = (item: any): React.ReactNode => {
    if (!item || typeof item !== "object") return null;

    let price = 0;

    switch (item.category) {
      case "disease":
        return "";
      case "bundle":
        price = item.price;
        break;
      case "userCode":
        price = item.library.details?.[0]?.price;
        break;
      case "medicalLibrary":
        price = item.details?.[0]?.price;
        break;
      case "drugLibrary":
        price = item.details?.[0]?.price;
        break;
      case "materialLibrary":
        price = item.details?.[0]?.price;
        break;
      default:
        return null;
    }

    return (
      <span
        className={cn(
          "text-[var(--text-secondary)]",
          `text-[${FONT_SIZE[size] - 2}px]`
        )}
      >
        {toKRW(price)}
      </span>
    );
  };

  const getEtc = (item: any): React.ReactNode => {
    if (!item || typeof item !== "object") return null;

    let etc = "";
    switch (item.category) {
      case "disease":
        etc = item.details?.[0]?.legalInfectiousCategory;
        return (
          etc && (
            <span
              className={cn(
                "text-[var(--text-secondary)]",
                `text-[${FONT_SIZE[size] - 2}px]`
              )}
            >
              ({etc})
            </span>
          )
        );
      case "drugLibrary": {
        const atcCode = item.details?.[0]?.activeIngredientCode || "";
        return (
          <span
            className={cn(
              "text-[var(--text-secondary)]",
              `text-[${FONT_SIZE[size] - 2}px]`
            )}
          >
            {highlightText(atcCode, searchWord)}
          </span>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-row items-center w-full h-full whitespace-nowrap bg-transparent">
      <div
        className={cn(
          "flex flex-row items-center gap-[6px]",

        )}
      >
        <GetItemTypeCategoryIcon
          size={size}
          itemType={item.itemType}
          category={item.category}
        />
        {getCode(item)}
        {getName(item)}
        {getEnName(item)}
        {getPrice(item)}
        {getEtc(item)}
      </div>
    </div>
  );
}
