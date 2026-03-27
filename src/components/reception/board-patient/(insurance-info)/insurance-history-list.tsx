"use client";

import { useMemo, useCallback } from "react";
import InputDateRangeWithMonth from "@/components/ui/input-date-range-with-month";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import MyCheckbox from "@/components/yjg/my-checkbox";
import {
  보험구분상세,
  보험구분상세Label,
} from "@/constants/common/common-enum";

// 이미 KST(로컬) 기준으로 내려오는 값이므로 로컬 날짜만 추출
const formatDate = (dateTime: string | Date | undefined): string => {
  if (!dateTime) return "";
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 헤더 정의 함수
const getInsuranceHistoryHeaders = (
  isAllSelected: boolean,
  onSelectAll: (checked: boolean) => void
): MyGridHeaderType[] => [
    {
      key: "checkbox",
      name: "",
      width: 40,
      minWidth: 40,
      visible: true,
      align: "center",
      customRender: (
        <div className="flex items-center justify-center w-full h-full">
          <MyCheckbox
            checked={isAllSelected}
            onChange={(checked) => onSelectAll(checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
    {
      key: "receptionDateTime",
      name: "내원일",
      width: 100,
      minWidth: 100,
      visible: true,
    },
    {
      key: "uDeptDetail",
      name: "보험구분",
      width: 100,
      minWidth: 80,
      visible: true,
    },
    {
      key: "cardNumber",
      name: "증번호",
      width: 120,
      minWidth: 100,
      visible: true,
    },
    {
      key: "father",
      name: "가입자명",
      width: 100,
      minWidth: 80,
      visible: true,
    },
    {
      key: "relation",
      name: "관계",
      width: 80,
      minWidth: 60,
      visible: true,
    },
    {
      key: "unionCode",
      name: "보장기관기호",
      width: 120,
      minWidth: 100,
      visible: true,
    },
    {
      key: "unionName",
      name: "보장기관명",
      width: 200,
      minWidth: 150,
      visible: true,
    },
  ];

export interface InsuranceHistoryItem {
  registrationId: string | number;
  receptionDateTime?: string | Date;
  uDeptDetail?: 보험구분상세 | string | number;
  cardNumber?: string;
  father?: string;
  relation?: string;
  unionCode?: string;
  unionName?: string;
  // InsuranceInfo의 다른 필드들도 필요시 추가 가능
  [key: string]: any;
}

interface InsuranceHistoryListProps {
  /** 보험 이력 리스트 */
  insuranceHistoryList?: InsuranceHistoryItem[];
  /** 선택된 행들 */
  selectedRows?: MyGridRowType[];
  /** 선택된 행 변경 핸들러 */
  onSelectedRowsChange?: (rows: MyGridRowType[]) => void;
  /** 날짜 범위 */
  dateRange?: { from: string; to: string };
  /** 날짜 범위 변경 핸들러 */
  onDateRangeChange?: (range: { from: string; to: string }) => void;
}

export default function InsuranceHistoryList({
  insuranceHistoryList = [],
  selectedRows = [],
  onSelectedRowsChange,
  dateRange = { from: "", to: "" },
  onDateRangeChange,
}: InsuranceHistoryListProps) {
  // 선택된 행 변경 핸들러
  // isClickOutside: 그리드 외부 클릭 시 선택 해제 방지 (보험정보 편집 영역 클릭 시 선택 유지)
  const handleSelectedRowsChange = useCallback(
    (rows: MyGridRowType[], isClickOutside?: boolean) => {
      if (isClickOutside) return;
      onSelectedRowsChange?.(rows);
    },
    [onSelectedRowsChange]
  );

  // 전체 선택 상태 계산
  const isAllSelected = useMemo(() => {
    if (insuranceHistoryList.length === 0) return false;
    return (
      selectedRows.length > 0 &&
      selectedRows.length === insuranceHistoryList.length &&
      insuranceHistoryList.every((item) =>
        selectedRows.some((row) => row.key === item.registrationId)
      )
    );
  }, [insuranceHistoryList, selectedRows]);

  // 전체 선택/해제 핸들러
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        // 전체 선택
        const allRows: MyGridRowType[] = insuranceHistoryList.map(
          (item, index) => ({
            rowIndex: index,
            key: item.registrationId,
            cells: [
              {
                headerKey: "checkbox",
                value: true,
                inputType: "checkbox",
              },
              {
                headerKey: "receptionDateTime",
                value: formatDate(item.receptionDateTime),
              },
              {
                headerKey: "uDeptDetail",
                value:
                  보험구분상세Label[item.uDeptDetail as 보험구분상세] || "",
              },
              {
                headerKey: "cardNumber",
                value: item.cardNumber || "-",
              },
              {
                headerKey: "father",
                value: item.father || "-",
              },
              {
                headerKey: "relation",
                value: item.relation || "-",
              },
              {
                headerKey: "unionCode",
                value: item.unionCode || "-",
              },
              {
                headerKey: "unionName",
                value: item.unionName || "-",
              },
              {
                headerKey: "registrationId",
                value: item.registrationId,
              },
            ],
          })
        );
        handleSelectedRowsChange(allRows);
      } else {
        // 전체 해제
        handleSelectedRowsChange([]);
      }
    },
    [insuranceHistoryList, handleSelectedRowsChange]
  );

  // 헤더 동적 생성
  const headers = useMemo(
    () => getInsuranceHistoryHeaders(isAllSelected, handleSelectAll),
    [isAllSelected, handleSelectAll]
  );

  // 그리드 데이터 변환
  const gridData: MyGridRowType[] = useMemo(() => {
    if (!insuranceHistoryList || insuranceHistoryList.length === 0) {
      return [];
    }

    return insuranceHistoryList.map((item, index) => {
      const isSelected = selectedRows.some(
        (row) => row.key === item.registrationId
      );

      return {
        rowIndex: index,
        key: item.registrationId,
        cells: [
          {
            headerKey: "checkbox",
            value: isSelected,
            inputType: "checkbox",
          },
          {
            headerKey: "receptionDateTime",
            value: formatDate(item.receptionDateTime),
          },
          {
            headerKey: "uDeptDetail",
            value: 보험구분상세Label[item.uDeptDetail as 보험구분상세] || "",
          },
          {
            headerKey: "cardNumber",
            value: item.cardNumber || "-",
          },
          {
            headerKey: "father",
            value: item.father || "-",
          },
          {
            headerKey: "relation",
            value: item.relation || "-",
          },
          {
            headerKey: "unionCode",
            value: item.unionCode || "-",
          },
          {
            headerKey: "unionName",
            value: item.unionName || "-",
          },
          // registrationId는 내부적으로 사용 (화면에 표시하지 않음)
          {
            headerKey: "registrationId",
            value: item.registrationId,
          },
        ],
      };
    });
  }, [insuranceHistoryList, selectedRows]);

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {/* 조회 영역 */}
      <div className="mb-3 flex-shrink-0">
        <InputDateRangeWithMonth
          fromValue={dateRange.from}
          toValue={dateRange.to}
          toPlaceholder="YYYY-MM-DD"
          fromPlaceholder="YYYY-MM-DD"
          onChange={(value) => onDateRangeChange?.(value)}
        />
      </div>

      {/* 그리드 영역 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MyGrid
          headers={headers}
          data={gridData}
          multiSelect={true}
          onSelectedRowsChange={handleSelectedRowsChange}
        />
      </div>
    </div>
  );
}
