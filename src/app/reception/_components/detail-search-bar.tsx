"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MyButton } from "@/components/yjg/my-button";
import { Search } from "lucide-react";
import InputDateRangeWithMonth from "@/components/ui/input-date-range-with-month";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import type { Patient } from "@/types/patient-types";
import type { Reception } from "@/types/common/reception-types";
import { useSearchPatientsInfinite } from "@/hooks/patient/use-search-patients-infinite";
import { getAgeOrMonth, makeRrnView } from "@/lib/patient-utils";
import { 보험구분상세Label } from "@/constants/common/common-enum";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { getExtraQualificationStrListFromExtraQualification } from "@/lib/nhic-form-utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { stripHtmlTags } from "@/utils/template-code-utils";

interface DetailSearchBarProps {
  onPatientSelect?: (patient: Patient) => void;
}

function toKstYyyyMmDd(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  // 이미 YYYY-MM-DD 형식이면 그대로 사용
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;

  // KST(Asia/Seoul) 기준 날짜로 YYYY-MM-DD 생성
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  if (!parts.year || !parts.month || !parts.day) return null;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export default function DetailSearchBar({
  onPatientSelect,
}: DetailSearchBarProps) {
  // 검색 조건
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [groupId, setGroupId] = useState<number | "">("");
  const [hypertension, setHypertension] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [highCholesterol, setHighCholesterol] = useState(false);
  const [unpaidRefund, setUnpaidRefund] = useState(false);

  // 정렬 (기본값 유지: 100개, id desc)
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedReception, setSelectedReception] = useState<Reception | null>(
    null
  );
  const [isSearched, setIsSearched] = useState(false);
  // 조회 버튼/Enter 트리거 (같은 검색어 재조회 포함)
  const [searchTrigger, setSearchTrigger] = useState(0);

  // usePatientInfo 훅 사용
  const { getLatestReception } = usePatientReception();
  const patientGroups = usePatientGroupsStore((s) => s.patientGroups);

  // 검색 파라미터
  const searchParams = useMemo(() => {
    if (!isSearched) return {};

    const params: Record<string, any> = {
      take: 30,
      sortBy,
      sortOrder,
      // 동일 검색어 재조회도 가능하도록 queryKey에 포함
      _searchTrigger: searchTrigger,
    };

    const keyword = searchQuery.trim();
    if (keyword) {
      params.search = keyword;
    }

    // filter(json) / groupId 등은 사용처 요구에 따라 가변적으로 사용 가능
    const filter: Record<string, any> = {};
    // beginDate/endDate는 최상위 query param으로 전달(옵션)
    const beginDate = toKstYyyyMmDd(fromDate);
    const endDate = toKstYyyyMmDd(toDate);
    if (beginDate) params.beginDate = beginDate;
    if (endDate) params.endDate = endDate;
    if (groupId !== "") params.groupId = groupId;

    // chronicFlags: 고혈압/당뇨/이상지질혈증 체크 시 쉼표로 구분하여 전달
    const chronicFlagsList: string[] = [];
    if (hypertension) chronicFlagsList.push("hypertension");
    if (diabetes) chronicFlagsList.push("diabetes");
    if (highCholesterol) chronicFlagsList.push("highCholesterol");
    if (chronicFlagsList.length > 0) {
      params.chronicFlags = chronicFlagsList.join(",");
    }

    if (unpaidRefund) filter.unpaidRefund = true;
    if (Object.keys(filter).length > 0) {
      params.filter = filter;
    }

    return params;
  }, [
    isSearched,
    searchQuery,
    fromDate,
    toDate,
    groupId,
    hypertension,
    diabetes,
    highCholesterol,
    unpaidRefund,
    sortBy,
    sortOrder,
    searchTrigger,
  ]);

  // React Query를 사용한 검색 (cursor 기반 무한 스크롤)
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchPatientsInfinite({
    ...searchParams,
    // 공백(.trim) 검색어면 search만 넘기지 않음 (조회는 가능)
    enabled: isSearched,
  } as any);

  const patients = useMemo<Patient[]>(() => {
    const pages = data?.pages ?? [];
    const items = pages.flatMap((page: any) => page?.items ?? []);
    return items.map((item: any) => ({
      phone: item.phone1 ?? item.phone2 ?? "",
      ...item,
    }));
  }, [data]);

  const totalCount = useMemo(() => {
    const first = data?.pages?.[0] as any;
    return typeof first?.totalCount === "number" ? first.totalCount : undefined;
  }, [data]);

  // 날짜 변경 핸들러
  const handleDateRangeChange = (value: { from: string; to: string }) => {
    setFromDate(value.from);
    setToDate(value.to);
  };

  // 조회 핸들러
  const handleSearch = async () => {
    setIsSearched(true);
    setSelectedPatient(null);
    setSelectedReception(null);
    // 버튼 클릭/Enter 모두 같은 동작: (동일 검색어여도) 재조회 트리거
    setSearchTrigger((prev) => prev + 1);
  };

  const handleSort = useCallback(
    (columnKey: string, direction: "asc" | "desc" | null) => {
      const sortKeyMap: Record<string, string> = {
        id: "id",
        name: "name",
        phone: "phone1",
        rrn: "rrn",
        memo: "memo",
      };

      if (!direction) {
        setSortBy("id");
        setSortOrder("desc");
        return;
      }

      setSortBy(sortKeyMap[columnKey] ?? "id");
      setSortOrder(direction);
    },
    []
  );

  // 그리드 헤더 정의
  const headers: MyGridHeaderType[] = useMemo(
    () => [
      {
        key: "checkbox",
        name: "",
        width: 40,
        align: "center",
        sortNumber: 1,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "id",
        name: "차트번호",
        width: 90,
        align: "center",
        readonly: true,
        sortNumber: 2,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "name",
        name: "환자명",
        width: 120,
        align: "center",
        readonly: true,
        sortNumber: 3,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "ageGender",
        name: "나이/성별",
        width: 100,
        align: "center",
        readonly: true,
        sortNumber: 4,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "phone",
        name: "연락처",
        width: 150,
        align: "center",
        readonly: true,
        sortNumber: 5,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "rrn",
        name: "주민등록번호",
        width: 150,
        align: "center",
        readonly: true,
        sortNumber: 6,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "unpaid",
        name: "미수/환불",
        width: 100,
        align: "center",
        readonly: true,
        sortNumber: 7,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
      {
        key: "memo",
        name: "메모",
        width: 200,
        align: "left",
        readonly: true,
        sortNumber: 8,
        visible: true,
        isFixedLeft: false,
        isFixedRight: false,
      },
    ],
    []
  );

  // 그리드 데이터 변환
  const gridData: MyGridRowType[] = useMemo(() => {
    return patients.map((patient, index) => ({
      rowIndex: index + 1,
      key: patient.id,
      cells: [
        { headerKey: "checkbox", value: false, inputType: "checkbox" as const },
        { headerKey: "id", value: patient.patientNo || "" },
        { headerKey: "name", value: patient.name || "" },
        {
          headerKey: "ageGender",
          value: `${getAgeOrMonth(patient.birthDate || "", "ko")} ${patient.gender === 1 ? "M" : "F"}`,
        },
        { headerKey: "phone", value: patient.phone1 || "" },
        { headerKey: "rrn", value: makeRrnView(patient.rrnView || "") || "" },
        { headerKey: "unpaid", value: "-" },
        { headerKey: "memo", value: stripHtmlTags(patient.memo || "") },
      ],
    }));
  }, [patients]);

  // 그리드 Row 클릭 핸들러
  const handleRowClick = async (row: MyGridRowType) => {
    const patient = patients.find((p) => p.id === row.key);
    if (patient) {
      setSelectedPatient(patient);
      try {
        const reception = await getLatestReception(
          patient,
          false,
          new Date(),
          null
        );
        setSelectedReception(reception);
      } catch (error) {
        console.error("Reception 조회 실패:", error);
        setSelectedReception(null);
      }
    }
  };

  // 환자 정보 열기 (부모 컴포넌트로 전달)
  const handleOpenPatient = () => {
    if (selectedPatient && onPatientSelect) {
      onPatientSelect(selectedPatient);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full p-2 overflow-hidden">
      {/* 1. 조회 검색영역 */}
      <div className="border border-[var(--border-secondary)] rounded-sm p-3 flex flex-col gap-3">
        {/* 첫번째 줄: 검색 input과 조회 버튼 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="환자명, 연락처, 환자메모, 주민등록번호"
              className="h-9 pl-10"
            />
          </div>
        </div>

        {/* 두번째 줄: 최종내원일, 환자그룹 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--gray-400)] whitespace-nowrap">
            최종내원일
          </span>
          <InputDateRangeWithMonth
            fromValue={fromDate}
            toValue={toDate}
            onChange={handleDateRangeChange}
          />
          <span className="text-sm text-[var(--gray-400)] ml-4 whitespace-nowrap">
            환자그룹
          </span>
          <select
            value={groupId === "" ? "" : String(groupId)}
            onChange={(e) =>
              setGroupId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="h-7 px-2 border border-[var(--border-secondary)] rounded text-sm"
          >
            <option value="">전체</option>
            {patientGroups.map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* 세번째 줄: 체크박스들, 조회버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hypertension}
                onChange={(e) => setHypertension(e.target.checked)}
                className="w-4 h-4"
              />
              <span>고혈압</span>
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={diabetes}
                onChange={(e) => setDiabetes(e.target.checked)}
                className="w-4 h-4"
              />
              <span>당뇨</span>
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={highCholesterol}
                onChange={(e) => setHighCholesterol(e.target.checked)}
                className="w-4 h-4"
              />
              <span>이상지질혈증</span>
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={unpaidRefund}
                onChange={(e) => setUnpaidRefund(e.target.checked)}
                className="w-4 h-4"
              />
              <span>미수/환불</span>
            </label>
          </div>
          <MyButton onClick={handleSearch}>조회</MyButton>
        </div>
      </div>

      {/* 2. 조회 결과 영역 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MyGrid
          headers={headers}
          data={gridData}
          totalCount={totalCount}
          onRowClick={handleRowClick}
          multiSelect={false}
          isLoading={isLoading}
          hasMore={!!hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          onSort={handleSort}
          loadingMsg="환자 검색 중..."
          isError={isError}
          errorMsg="검색 중 오류가 발생했습니다."
        />
      </div>

      {/* 3. 환자정보 영역 */}
      <div className="flex flex-col gap-2">
        <h3
          className="text-md font-semibold"
          style={{ color: "var(--main-color)" }}
        >
          환자정보
        </h3>
        <table className="w-full text-[13px] table-fixed">
          <colgroup>
            <col className="w-[100px]" />
            <col style={{ width: "calc((100% - 400px) / 4)" }} />
            <col className="w-[100px]" />
            <col style={{ width: "calc((100% - 400px) / 4)" }} />
            <col className="w-[100px]" />
            <col style={{ width: "calc((100% - 400px) / 4)" }} />
            <col className="w-[100px]" />
            <col style={{ width: "calc((100% - 400px) / 4)" }} />
          </colgroup>
          <tbody>
            {/* 첫번째 줄 */}
            <tr className="border-b border-t-1 border-t-[var(--bg-5)] border-[var(--border-1)]">
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                차트번호
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.patientNo || ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                환자명
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.name || ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                생년월일
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.birthday
                  ? selectedReception.patientBaseInfo.birthday instanceof Date
                    ? selectedReception.patientBaseInfo.birthday
                      .toISOString()
                      .split("T")[0]
                    : selectedReception.patientBaseInfo.birthday
                  : ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                나이
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.birthday
                  ? getAgeOrMonth(
                    selectedReception.patientBaseInfo.birthday instanceof Date
                      ? selectedReception.patientBaseInfo.birthday
                        .toISOString()
                        .split("T")[0]
                      : selectedReception.patientBaseInfo.birthday,
                    "ko"
                  )
                  : ""}
              </td>
            </tr>

            {/* 두번째 줄 */}
            <tr className="border-b border-[var(--border-1)]">
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                주민등록번호
              </td>
              <td className="px-2 py-1">
                {makeRrnView(selectedReception?.patientBaseInfo?.rrn || "") ||
                  ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                연락처(대표)
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.phone1 || ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                만성질환
              </td>
              <td className="px-2 py-1">
                {(() => {
                  const chronicFlags = selectedReception?.patientStatus?.chronicFlags;
                  if (!chronicFlags) {
                    return "";
                  }

                  const chronicDiseaseList: string[] = [];
                  if (chronicFlags.hypertension) chronicDiseaseList.push("고혈압");
                  if (chronicFlags.diabetes) chronicDiseaseList.push("당뇨");
                  if (chronicFlags.highCholesterol) chronicDiseaseList.push("이상지질혈증");

                  if (chronicDiseaseList.length === 0) {
                    return "";
                  }

                  const displayText = chronicDiseaseList.join("/");

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate max-w-[200px] cursor-help">
                          {displayText}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md z-[9999]">
                        <p className="whitespace-pre-wrap break-words text-sm">{displayText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                환자그룹
              </td>
              <td className="px-2 py-1">
                {(() => {
                  const gid = selectedReception?.patientBaseInfo?.groupId;
                  if (gid == null) return "";
                  const g = patientGroups.find((x: any) => x.id === gid);
                  return g?.name ?? "";
                })()}
              </td>
            </tr>

            {/* 세번째 줄 */}
            <tr className="border-b border-[var(--border-1)]">
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                주소
              </td>
              <td className="px-2 py-1" colSpan={7}>
                {selectedReception?.patientBaseInfo
                  ? [
                    selectedReception.patientBaseInfo.address,
                    selectedReception.patientBaseInfo.address2,
                  ]
                    .filter(Boolean)
                    .join(" ") || ""
                  : ""}
              </td>
            </tr>

            {/* 네번째 줄 */}
            <tr className="border-b border-[var(--border-1)]">
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                최종내원일
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.lastVisit
                  ? selectedReception.patientBaseInfo.lastVisit instanceof Date
                    ? selectedReception.patientBaseInfo.lastVisit
                      .toISOString()
                      .split("T")[0]
                    : selectedReception.patientBaseInfo.lastVisit
                  : ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                보험
              </td>
              <td className="px-2 py-1">
                {보험구분상세Label[selectedReception?.insuranceInfo?.uDeptDetail as keyof typeof 보험구분상세Label] || ""}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                추가자격
              </td>
              <td className="px-2 py-1">
                {(() => {
                  const extraQualification = selectedReception?.insuranceInfo?.extraQualification;
                  if (!extraQualification || (Array.isArray(extraQualification) && extraQualification.length === 0)) {
                    return "";
                  }

                  const strList = getExtraQualificationStrListFromExtraQualification(
                    extraQualification as Record<string, any>
                  );

                  if (strList.length === 0) {
                    return "";
                  }

                  const displayText = strList.join(", ");

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate max-w-[200px] cursor-help">
                          {displayText}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md z-[9999]">
                        <p className="whitespace-pre-wrap break-words text-sm">{displayText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
              </td>
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                담당의
              </td>
              <td className="px-2 py-1">
                {selectedReception?.patientBaseInfo?.doctorId || ""}
              </td>
            </tr>

            {/* 다섯번째 줄 */}
            <tr className="border-b border-[var(--border-1)]">
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                영수액
              </td>
              <td className="px-2 py-1" colSpan={7}></td>
            </tr>

            {/* 여섯번째 줄 */}
            <tr className="border-b border-[var(--border-1)]">
              <td className="bg-[var(--bg-1)] text-[var(--gray-300)] px-2 py-1">
                환자메모
              </td>
              <td className="px-2 py-1" colSpan={7}>
                {stripHtmlTags(selectedReception?.patientBaseInfo?.patientMemo || "")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Footer */}
      <div className="flex justify-end gap-2">
        <MyButton variant="outline" size="md">
          문자메세지 작성
        </MyButton>
        <MyButton size="md" onClick={handleOpenPatient}>
          환자 정보 열기
        </MyButton>
      </div>
    </div>
  );
}
