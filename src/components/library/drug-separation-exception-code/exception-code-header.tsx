import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_EXCEPTION_CODE_HEADERS_KEY = "exception-code-headers";

const exceptionCodeHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    width: 40,
    minWidth: 40,
  },
  {
    key: "title",
    name: "제목",
    width: 70,
    minWidth: 70,
  },
  {
    key: "content",
    name: "내용",
    width: 350,
  },
];

export const defaultExceptionCodeHeaders = exceptionCodeHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);
