import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const LS_DOCUMENT_DIAGNOSIS_HEADERS_KEY = "document-diagnosis-headers";

// 서식 내원이력 탭 진단 테이블: 상병코드와 명칭만 표시
const documentDiagnosisHeaders: MyTreeGridHeaderType[] = [
  {
    key: "code",
    name: "상병코드",
    width: 70,
    minWidth: 70,
  },
  {
    key: "name",
    name: "명칭",
    width: 300,
  },
];

export const defaultDocumentDiagnosisHeaders = documentDiagnosisHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

