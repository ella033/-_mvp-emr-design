"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Dot } from "lucide-react";
import { useCost } from "@/hooks/crm/use-cost";
import { formatDate } from "@/lib/date-utils";

export default function CrmCostPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // YYYY-MM 형식으로 변환
  const targetMonth = useMemo(() => {
    const monthStr = String(selectedMonth).padStart(2, "0");
    return `${selectedYear}-${monthStr}`;
  }, [selectedYear, selectedMonth]);

  // 비용 데이터 조회
  const { data: costData, isLoading } = useCost(targetMonth);

  // 날짜 범위 계산 (전월 26일 ~ 당월 25일)
  const dateRange = useMemo(() => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const startDate = new Date(prevYear, prevMonth - 1, 26);
    const endDate = new Date(selectedYear, selectedMonth - 1, 25);
    return `${formatDate(startDate)}~${formatDate(endDate)}`;
  }, [selectedYear, selectedMonth]);

  // 숫자 포맷팅 (천 단위 구분자)
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString("ko-KR");
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-main)] p-8" data-testid="crm-cost-page">
      {/* 헤더 */}
      <h1 className="mb-6 text-md font-bold text-[var(--gray-100)]">
        요금 내역
      </h1>

      {/* 날짜 선택기와 날짜 범위 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[var(--gray-200)]">
            {selectedYear}년 {selectedMonth}월
          </span>
          <button
            onClick={handlePrevMonth}
            data-testid="crm-cost-prev-month-button"
            className="bg-transparent cursor-pointer text-base text-[var(--gray-200)] mb-0.5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            data-testid="crm-cost-next-month-button"
            className="bg-transparent cursor-pointer text-base text-[var(--gray-200)] mb-0.5"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <span className="text-sm text-[var(--gray-400)]">{dateRange}</span>
      </div>

      <div className="bg-[var(--blue-1)] px-5 py-4 rounded-lg mb-8">
        {/* 총 이용 요금 */}
        <div className="py-2 rounded-lg mb-3 flex justify-between items-center">
          <span className="text-base font-bold text-[var(--gray-200)] pl-1">
            총 이용 요금
          </span>
          <span className="text-lg font-bold text-[var(--second-color)] pr-2">
            {isLoading ? "-" : `${formatNumber(costData?.totalCost)} 원`}
          </span>
        </div>

        {/* 기본 요금 */}
        <div className="bg-white px-5 py-4 rounded-lg mb-3 flex justify-between items-center">
          <span className="text-base font-bold text-[var(--gray-200)]">
            기본 요금
          </span>
          <span className="text-base font-bold text-[var(--gray-200)]">
            {isLoading ? "-" : `${formatNumber(costData?.baseCost)} 원`}
          </span>
        </div>

        {/* 사용포인트 */}
        <div className="bg-white px-5 py-4 rounded-lg mb-3">
          <div className="flex justify-between items-center mb-3 pl-1">
            <span className="text-base font-bold text-[var(--gray-200)]">
              사용포인트
            </span>
            <span className="text-base font-bold text-[var(--gray-200)]">
              {isLoading ? "-" : `${formatNumber(costData?.totalPoint)} P`}
            </span>
          </div>

          {/* SMS */}
          <div className="flex justify-between items-center mb-2 pl-1">
            <span className="text-sm text-[var(--gray-400)]">- SMS</span>
            <span className="text-sm text-[var(--gray-400)]">
              {isLoading ? "-" : `${formatNumber(costData?.smsPoint)} P`}
            </span>
          </div>

          {/* LMS */}
          <div className="flex justify-between items-center mb-2 pl-1">
            <span className="text-sm text-[var(--gray-400)]">- LMS</span>
            <span className="text-sm text-[var(--gray-400)]">
              {isLoading ? "-" : `${formatNumber(costData?.lmsPoint)} P`}
            </span>
          </div>

          {/* MMS */}
          <div className="flex justify-between items-center mb-2 pl-1">
            <span className="text-sm text-[var(--gray-400)]">- MMS</span>
            <span className="text-sm text-[var(--gray-400)]">
              {isLoading ? "-" : `${formatNumber(costData?.mmsPoint)} P`}
            </span>
          </div>
        </div>

        {/* 포인트당 단가 */}
        <div className="bg-white px-5 py-4 rounded-lg flex justify-between items-center">
          <span className="text-base font-bold text-[var(--gray-200)]">
            포인트당 단가
          </span>
          <span className="text-base font-bold text-[var(--gray-200)]">
            {isLoading ? "-" : `${formatNumber(costData?.standardCost)} 원`}
          </span>
        </div>
      </div>

      {/* 요금 정책 */}
      <div
        className="mt-8 border border-[var(--border-1)] rounded-lg p-5"
        data-testid="crm-cost-policy-section"
      >
        <h2 className="text-base font-bold text-[var(--gray-200)] mb-3">
          요금 정책
        </h2>
        <p className="text-sm text-[var(--gray-100)] mb-2 flex items-start gap-0.5">
          <Dot className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            전월 26일 ~ 당월 25일까지의 사용량을 기준으로 이달의 CRM 요금이
            책정됩니다.
          </span>
        </p>
        <p className="text-sm text-[var(--gray-100)] mb-2 flex items-start gap-0.5">
          <Dot className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>전송 성공한 건수만 포인트로 정산됩니다.</span>
        </p>
        <p className="text-sm text-[var(--gray-100)] mb-4 flex items-start gap-0.5">
          <Dot className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            메시지 유형에 따라 포인트가 다릅니다. (각 1건 당, 사용 포인트)
          </span>
        </p>

        {/* 테이블 */}
        <table className="w-full">
          <thead>
            <tr className="border-t border-[var(--bg-5)]">
              <td className="w-[120px] py-2.5 px-4 text-left text-sm text-[var(--gray-200)] bg-[var(--bg-2)]">
                구분
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                SMS
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                LMS
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                MMS
              </td>
            </tr>
          </thead>
          <tbody>
            <tr className="border-y border-[var(--border-1)]">
              <td className="py-2.5 px-4 text-sm text-[var(--gray-200)] bg-[var(--bg-2)]">
                포인트
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                1P
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                2P
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                3P
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 포인트당 발송 단가 */}
      <div className="mt-8 border border-[var(--border-1)] rounded-lg p-5">
        <h2 className="text-base font-bold text-[var(--gray-200)] mb-3">
          포인트당 발송 단가
        </h2>
        <p className="text-sm text-[var(--gray-100)] mb-4 flex items-start gap-0.5">
          <Dot className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>단가는 월 사용 포인트 합계에 따라 구간별 차등 적용됩니다.</span>
        </p>

        {/* 테이블 */}
        <table className="w-full">
          <thead>
            <tr className="border-t border-[var(--bg-5)]">
              <td className="w-[120px] py-2.5 px-4 text-left text-sm text-[var(--gray-200)] bg-[var(--bg-2)]">
                월 사용 포인트
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                300P 이하
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                1,000P 이하
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                10,000P 이하
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                10,000P 초과
              </td>
            </tr>
          </thead>
          <tbody>
            <tr className="border-y border-[var(--border-1)]">
              <td className="py-2.5 px-4 text-sm text-[var(--gray-200)] bg-[var(--bg-2)]">
                단가
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                50원
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                40원
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                30원
              </td>
              <td className="py-2.5 px-4 text-center text-sm text-[var(--gray-200)]">
                20원
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
