import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const LS_DOCUMENT_PRESCRIPTION_HEADERS_KEY = "document-prescription-headers";

// 서식 내원이력 탭 처방 테이블: 사용자코드, 청구코드, 명칭, 용투일, 특정내역만 표시
const documentPrescriptionHeaders: MyTreeGridHeaderType[] = [
  // {
  //   key: "userCode",
  //   name: "사용자코드",
  //   width: 70,
  //   minWidth: 70,
  // },
  {
    key: "claimCode",
    name: "청구코드",
    width: 70,
    minWidth: 70,
  },
  {
    key: "name",
    name: "명칭",
    width: 300,
  },
  {
    key: "dosageInfo",
    name: "용투일",
    align: "center",
    width: 80,
    minWidth: 80,
  },
  {
    key: "specificDetail",
    name: "특정내역",
  },
];

export const defaultDocumentPrescriptionHeaders = documentPrescriptionHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

