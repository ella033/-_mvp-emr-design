
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { SpecificDetailCode } from "@/types/chart/specific-detail-code-type";
import { CircleCheckIcon } from "@/components/custom-icons";

export const convertSpecificDetailCodesToMyGridType = (
  specificDetailCodes: SpecificDetailCode[],
  enrolledCodes: Set<string>
): MyGridRowType[] => {
  return specificDetailCodes.map((specificDetailCode, index) => {
    const isEnrolled = enrolledCodes.has(specificDetailCode.code);
    return {
      rowIndex: index,
      key: specificDetailCode.id,
      cells: [
        {
          headerKey: "code",
          value: specificDetailCode.code,
        },
        {
          headerKey: "name",
          value: specificDetailCode.name,
        },
        {
          headerKey: "enrolled",
          value: "",
          customRender: (
            <div className="flex items-center justify-center">
              {isEnrolled && <CircleCheckIcon className="w-[18px] h-[18px]" />}
            </div>
          )
        },
      ],
    };
  });
};
