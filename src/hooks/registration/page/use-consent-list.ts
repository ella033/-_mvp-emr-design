import React, { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { useToastHelpers } from "@/components/ui/toast";
import { ConsentsApi } from "@/lib/api/routes/consents-api";
import type { ConsentListItemDto } from "@/types/consents-types";
import { ConsentListStatus } from "@/types/consents-types";
import { getGender, formatPhoneNumber } from "@/lib/patient-utils";
import { useMyGridHeaders } from "@/components/yjg/my-grid/use-my-grid-headers";
import { useConsentSocket } from "@/domains/consent/hooks/use-consent-socket";
import { usePrintPopupStore } from "@/store/print-popup-store";
import { OutputTypeCode } from "@/types/printer-types";

const LS_CONSENT_LIST_HEADERS_KEY = "reception.consent-list.headers";

const formatInputDate = (date: Date) => date.toISOString().slice(0, 10);

const toUtcDateRangeQuery = (range: {
  from: string;
  to: string;
}): { startDate?: string; endDate?: string } => {
  const from = range.from?.trim();
  const to = range.to?.trim();

  // 날짜 입력(YYYY-MM-DD)을 "UTC 날짜"로 해석해 00:00 ~ 23:59:59.999 범위를 ISO(Z)로 전송
  const startDate = from ? new Date(`${from}T00:00:00.000Z`).toISOString() : undefined;
  const endDate = to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined;
  return { startDate, endDate };
};

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "";
  const d = parseDate(value);
  if (!d) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

export const gridHeaders: MyGridHeaderType[] = [
  {key:"encounterId",  name: "접수번호", width: 0,  visible: false},
    {
    key: "patientNo",
    name: "차트번호",
    width: 80,
    maxWidth: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
    isFixedLeft: true,
  },
  {
    key: "patientName",
    name: "환자명",
    width: 90,
    maxWidth: 100,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
    isFixedLeft: true,
  },
  {
    key: "ageGender",
    name: "나이/성별",
    maxWidth: 80,
    width: 70,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "patientPhone1",
    name: "전화번호",
    width: 110,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "templateTitle",
    name: "동의서 이름",
    width: 220,
    minWidth: 0,
    align: "left",
    readonly: true,
    visible: true,
  },
  {
    key: "status",
    name: "동의여부",
    width: 70,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "action",
    name: "재전송/보기",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "signedAt",
    name: "서명일자",
    width: 140,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  }
];

const buildStatusCell = (item: ConsentListItemDto) => {
  const isSigned = item.status === ConsentListStatus.SIGNED;
  const label =
    item.status === ConsentListStatus.PENDING
      ? "대기중"
      : item.status === ConsentListStatus.SIGNED
        ? "서명완료"
        : item.status === ConsentListStatus.REVOKED
          ? "철회"
          : "삭제";

  const className = isSigned
    ? "text-[var(--positive)] text-sm font-medium"
    : "text-[var(--gray-400)] text-sm";

  return {
    headerKey: "status",
    value: item.status,
    orgData: item,
    customRender: React.createElement("span", { className }, label),
  };
};

export function useConsentList(): {
  dateRange: { from: string; to: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ from: string; to: string }>>;
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  gridHeaders: MyGridHeaderType[];
  setGridHeaders: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  fittingScreen: boolean;
  gridRows: MyGridRowType[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
} {
  const { toast } = useToastHelpers();
  const openPrintPopup = usePrintPopupStore((state) => state.openPrintPopup);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const from = new Date();
    from.setMonth(today.getMonth() - 1);
    return { from: formatInputDate(from), to: formatInputDate(today) };
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const utcRangeQuery = useMemo(() => {
    return toUtcDateRangeQuery(dateRange);
  }, [dateRange]);

  const makeConsentsListQueryKey = useCallback(
    (search: string) => {
      return [
        "consents",
        "list",
        {
          search: search || "",
          startDate: utcRangeQuery.startDate ?? "",
          endDate: utcRangeQuery.endDate ?? "",
        },
      ] as const;
    },
    [utcRangeQuery.endDate, utcRangeQuery.startDate]
  );

  const consentsListQueryKey = useMemo(() => {
    return makeConsentsListQueryKey(appliedSearch);
  }, [appliedSearch, makeConsentsListQueryKey]);

  const {
    headers: gridHeadersState,
    setHeadersAction: setGridHeaders,
    fittingScreen,
  } = useMyGridHeaders({
    lsKey: LS_CONSENT_LIST_HEADERS_KEY,
    defaultHeaders: gridHeaders,
    fittingScreen: true,
  });

  const syncConsentListQueries = useCallback(() => {
    const predicate = (query: { queryKey: readonly unknown[] }) => {
      const key = query.queryKey;
      if (!Array.isArray(key)) return false;
      return key[0] === "consents" && key[1] === "list";
    };
    queryClient.invalidateQueries({ predicate });
    queryClient.refetchQueries({ predicate, type: "all" });
  }, [queryClient]);

  useConsentSocket({
    onPatientConsentsTableChanged: () => {
      try {
        syncConsentListQueries();
      } catch (err) {
        console.error("[use-consent-list] list 쿼리 sync 실패:", err);
      }
    },
  });

  const query = useQuery({
    queryKey: consentsListQueryKey,
    queryFn: async () => {
      return await ConsentsApi.getConsentsList({
        take: 20,
        sortBy: "createDateTime",
        sortOrder: "desc",
        filter: { status: "active" },
        search: appliedSearch || undefined,
        startDate: utcRangeQuery.startDate,
        endDate: utcRangeQuery.endDate,
      });
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleSearch = useCallback(() => {
    const next = searchKeyword.trim();
    const isSameSearch = next === appliedSearch;
    setAppliedSearch(next);

    // Enter/검색 클릭 시 동일한 검색어여도 "재조회"가 되도록 강제 invalidate/refetch
    if (isSameSearch) {
      const nextKey = makeConsentsListQueryKey(next);
      queryClient.invalidateQueries({ queryKey: nextKey });
      queryClient.refetchQueries({ queryKey: nextKey, type: "active" });
    }
  }, [appliedSearch, makeConsentsListQueryKey, queryClient, searchKeyword]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const rawItems = useMemo(() => query.data?.items ?? [], [query.data]);

  const filteredItems = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();

    return rawItems
      .filter((item) => {
        if (!keyword) return true;
        return [item.patientId, item.patientName, item.templateTitle, item.templateCode]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(keyword));
      });
  }, [rawItems, appliedSearch]);

  const gridRows = useMemo<MyGridRowType[]>(() => {
    return filteredItems.map((item, index) => ({
      rowIndex: index,
      key: item.id ?? `${item.patientId}-${index}`,
      checkboxDisabled: item.status === ConsentListStatus.SIGNED,
      cells: gridHeadersState.map((header) => {
        if (header.key === "status") return buildStatusCell(item);

        if (header.key === "action") {
          const isSigned = item.status === ConsentListStatus.SIGNED;
          const primaryLabel = isSigned ? "보기" : "재전송";
          // 보기 버튼은 완료(서명완료) 상태일 때만 표시 (현재는 SIGNED일 때 primaryLabel이 '보기'로 노출)

          const onPrimary = async () => {
            if (isSigned) {
              try {
                const consentId = item.id;
                if (typeof consentId !== "number") {
                  toast({
                    title: "동의서 ID를 찾을 수 없습니다.",
                    variant: "destructive",
                  });
                  return;
                }
          const signedPdf = await ConsentsApi.getSignedPdfById(consentId);
                openPrintPopup({
                  config: {
                    title: "동의서 보기",
                    outputTypeCode: OutputTypeCode.ETC,
                    fileNamePrefix: `consent-${consentId}`,
                    defaultCopies: 1,
                  },
                  generatePdf: async () => signedPdf,
                });
              } catch (err) {
                console.error("[use-consent-list] signed pdf 보기 실패:", err);
                toast({
                  title: "PDF 다운로드에 실패했습니다.",
                  variant: "destructive",
                });
              }
              return;
            }

            // 재전송: use-basic-info.ts의 handleConsentSend와 동일한 동작
            try {
              const result = await ConsentsApi.createByCategory({
                patientId: item.patientId,
                category: "PRIVACY",
                status: "PENDING",
                encounterId: item.encounterId ?? undefined,
              });

              if (result.createdCount === 0) {
                toast({
                  title: "전송할 동의서가 없습니다. 이미 모든 동의서에 서명이 완료되었거나, 해당 카테고리의 동의서 템플릿이 없습니다.",
                  variant: "default",
                });
              } else {
                toast({
                  title: `${result.createdCount}개의 동의서가 전송되었습니다.`,
                  variant: "default",
                });
                // 재전송 후 리스트 새로고침
                await query.refetch();
              }
            } catch (err) {
              console.error("[use-consent-list] 재전송 실패:", err);
              toast({
                title: "동의서 전송에 실패했습니다.",
                variant: "destructive",
              });
            }
          };

          const buttonClass =
            "rounded border border-[var(--border-2)] px-2 py-1 text-xs font-semibold text-[var(--fg-main)] bg-[var(--bg-main)]";

          return {
            headerKey: header.key,
            value: primaryLabel,
            orgData: item,
            customRender: React.createElement(
              "div",
              { className: "flex items-center justify-center gap-1" },
              React.createElement(
                "button",
                { type: "button", className: buttonClass, onClick: onPrimary },
                primaryLabel
              )
            ),
          };
        }

        if (header.key === "signedAt") {
          return {
            headerKey: header.key,
            value: item.signedAt ?? "",
            orgData: item,
            customRender: React.createElement(
              "span",
              { className: "text-sm" },
              formatDateTime(item.signedAt)
            ),
          };
        }

        if (header.key === "ageGender") {
          const gender = getGender(item.patientGender, "ko");
          const age = item.patientAge ?? "";
          const ageGenderValue = gender && age ? `${age}/${gender}` : "-";
          return { headerKey: header.key, value: ageGenderValue, orgData: item };
        }

        if (header.key === "patientPhone1") {
          const phoneValue = item.patientPhone1 ?? "";
          const formattedPhone = phoneValue ? formatPhoneNumber(phoneValue) : "-";
          return { headerKey: header.key, value: formattedPhone, orgData: item };
        }

        const value = item[header.key as keyof ConsentListItemDto] as any;
        return {
          headerKey: header.key,
          value: Array.isArray(value) ? value.join(", ") : value ?? "",
          orgData: item,
        };
      }),
    }));
  }, [filteredItems, toast, query, gridHeadersState, openPrintPopup]);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  return {
    dateRange,
    setDateRange,
    searchKeyword,
    setSearchKeyword,
    handleSearch,
    handleKeyDown,
    gridHeaders: gridHeadersState,
    setGridHeaders,
    fittingScreen,
    gridRows,
    totalCount: filteredItems.length,
    isLoading: query.isLoading,
    error: query.error,
    gridContainerRef,
  };
}


