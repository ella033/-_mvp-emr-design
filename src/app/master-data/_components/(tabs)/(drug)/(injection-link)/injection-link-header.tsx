import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_INJECTION_LINK_HEADERS_MASTER_KEY =
  "grid-headers-injection-link-master";

export const LS_INJECTION_LINK_HEADERS_REGISTERED_KEY =
  "grid-headers-injection-link-registered";

const injectionLinkMasterHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
  },
  {
    key: "claimCode",
    name: "청구코드",
  },
  {
    key: "name",
    name: "한글명",
    width: 500,
  },
  {
    key: "price",
    name: "상한가",
    align: "right",
  },
];

export const defaultInjectionLinkMasterHeaders = injectionLinkMasterHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

const injectionLinkRegisteredHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
  },
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 500,
  }
];

export const defaultInjectionLinkRegisteredHeaders =
  injectionLinkRegisteredHeaders.map((header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));
