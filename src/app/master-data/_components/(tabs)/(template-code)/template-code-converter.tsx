import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { TEMPLATE_CODE_TYPE_OPTIONS } from "@/constants/common/common-option";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import { Star } from "lucide-react";
import { stripHtmlTags } from "@/utils/template-code-utils";

// 타입별 색상 매핑
const TYPE_COLORS: Record<TemplateCodeType, { bg: string; text: string }> = {
  [TemplateCodeType.전체]: { bg: "bg-gray-100", text: "text-gray-600" },
  [TemplateCodeType.증상]: { bg: "bg-red-100", text: "text-red-700" },
  [TemplateCodeType.임상메모]: { bg: "bg-blue-100", text: "text-blue-700" },
  [TemplateCodeType.특정내역]: { bg: "bg-purple-100", text: "text-purple-700" },
  [TemplateCodeType.조제시참고사항]: {
    bg: "bg-green-100",
    text: "text-green-700",
  },
  [TemplateCodeType.지시오더]: { bg: "bg-orange-100", text: "text-orange-700" },
  [TemplateCodeType.예약메모]: { bg: "bg-cyan-100", text: "text-cyan-700" },
  [TemplateCodeType.환자메모]: { bg: "bg-pink-100", text: "text-pink-700" },
};

// 타입 태그 컴포넌트
const TypeTag = ({ type }: { type: TemplateCodeType }) => {
  const label = TEMPLATE_CODE_TYPE_OPTIONS.find(
    (option) => option.value === type
  )?.label;
  const colors = TYPE_COLORS[type] || TYPE_COLORS[TemplateCodeType.전체];

  return (
    <span
      className={`inline-flex items-center px-[4px] py-[1px] rounded text-[11px] font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
};

// 타입 태그 목록 렌더링
const TypeTags = ({ types }: { types: TemplateCodeType[] }) => {
  return (
    <div className="flex flex-nowrap px-[4px] gap-[2px] overflow-hidden">
      {!types || types.length === 0 ? (
        <TypeTag type={TemplateCodeType.전체} />
      ) : (
        types.map((type, index) => (
          <TypeTag key={`${type}-${index}`} type={type} />
        ))
      )}
    </div>
  );
};

// 빠른메뉴 별표가 포함된 코드 렌더링
const CodeWithQuickMenu = ({
  code,
  isQuickMenu,
}: {
  code: string;
  isQuickMenu: boolean;
}) => {
  return (
    <div className="flex flex-nowrap items-center px-[4px] gap-[2px] overflow-hidden">
      <span className="whitespace-nowrap text-[12px] text-ellipsis overflow-hidden">
        {code}
      </span>
      {isQuickMenu && (
        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
      )}
    </div>
  );
};

export const convertTemplateCodesToMyGridType = (
  templateCodes: TemplateCode[],
  RowAction: (id: number) => React.ReactNode
): MyGridRowType[] => {
  return templateCodes.map((templateCode, index) => ({
    rowIndex: index,
    key: `template-code-${templateCode.id}-${index}`,
    cells: [
      {
        headerKey: "id",
        value: templateCode.id,
      },
      {
        headerKey: "code",
        value: templateCode.code,
        customRender: (
          <CodeWithQuickMenu
            code={templateCode.code}
            isQuickMenu={templateCode.isQuickMenu}
          />
        ),
      },
      {
        headerKey: "content",
        value: stripHtmlTags(templateCode.content),
      },
      {
        headerKey: "type",
        value: templateCode.type.join(","),
        customRender: <TypeTags types={templateCode.type} />,
      },
    ],
    rowAction: RowAction(templateCode.id),
  }));
};

export const getTypeLabels = (types: TemplateCodeType[]) => {
  return types.map(
    (type) =>
      TEMPLATE_CODE_TYPE_OPTIONS.find((option) => option.value === type)?.label
  );
};
