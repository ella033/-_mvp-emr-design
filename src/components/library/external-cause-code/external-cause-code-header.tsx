import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_EXTERNAL_CAUSE_CODE_HEADERS_KEY = "external-cause-code-headers";

const externalCauseCodeHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    width: 30,
    minWidth: 30,
  },
  {
    key: "content",
    name: "내용",
    width: 2000,
  },
];

export const defaultExternalCauseCodeHeaders = externalCauseCodeHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);
