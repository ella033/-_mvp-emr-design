import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_TEMPLATE_CODE_HEADERS_KEY = "template-code-headers";

const templateCodeHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    width: 100,
    minWidth: 60,
  },
  {
    key: "content",
    name: "내용",
    width: 700,
    minWidth: 200,
  },
  {
    key: "type",
    name: "사용처",
    width: 150,
    minWidth: 50,
  },
];

export const defaultTemplateCodeHeaders = templateCodeHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);
