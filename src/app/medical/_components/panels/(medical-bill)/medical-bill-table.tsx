"use client";

import { getMedicalBillItems } from "@/lib/calc-result-data-util";
import type { CalcResultData, BillItem } from "@/types/chart/calc-result-data";
import { cn } from "@/lib/utils";


export type { BillItem };

const CELL_BASE = "px-[8px] py-[6px] border-y border-[var(--border-1)]";
const cell = {
  th: `${CELL_BASE} border-r text-center bg-[var(--bg-1)]`,
  tdLeft: `${CELL_BASE} text-left pl-4`,
  tdRight: `${CELL_BASE} text-right`,
  tdCenter: `${CELL_BASE} text-center`,
  tdCenterBold: `${CELL_BASE} text-center font-semibold`,
} as const;
const tableStyles = {
  container: "h-full p-[12px] my-scroll",
  wrapper: "min-w-0 border-y border-[var(--fg-main)]",
  table: "w-full text-sm border-collapse",
  thead: "bg-[var(--bg-1)]",
} as const;

interface MedicalBillTableProps {
  calcResultData: CalcResultData;
}

export default function MedicalBillTable({
  calcResultData,
}: MedicalBillTableProps) {

  const {
    basicItems,
    optionalItems,
    otherItems,
    totals,
    overLimitAmount,
    outOfHospitalPayment,
    nightHolidayDrugPayment,
  } = getMedicalBillItems(calcResultData);

  return (
    <div className={tableStyles.container}>
      <div className={tableStyles.wrapper}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={cell.th} colSpan={2} rowSpan={3}>
                항목
              </th>
              <th className={cell.th} colSpan={3}>
                급여
              </th>
              <th className={cn(cell.th, "border-r-0")} rowSpan={3}>
                비급여
              </th>
            </tr>
            <tr>
              <th className={cell.th} colSpan={2}>
                일부 본인부담
              </th>
              <th className={cell.th} rowSpan={2}>
                전액<br />본인부담
              </th>
            </tr>
            <tr>
              <th className={cell.th}>본인부담금</th>
              <th className={cell.th}>공단부담금</th>
            </tr>
          </thead>
          <tbody>
            {/* 기본항목 */}
            {basicItems.map((item, index) => (
              <tr key={`basic-${index}`}>
                {index === 0 && (
                  <td
                    className={cn(cell.tdCenterBold, "border-r-1")}
                    style={{ width: "70px" }}
                    rowSpan={basicItems.length}
                  >
                    기본항목
                  </td>
                )}
                <td className={cell.tdLeft} style={{ width: "140px" }}>
                  {item.subCategory
                    ? `[${item.category}] ${item.subCategory}`
                    : item.category}
                </td>
                <td className={cell.tdRight}>
                  {item.selfPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.corporationPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.fullSelfPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.nonBenefit.toLocaleString()}
                </td>
              </tr>
            ))}

            {/* 선택항목 */}
            {optionalItems.map((item, index) => (
              <tr key={`optional-${index}`}>
                {index === 0 && (
                  <td
                    className={cn(cell.tdCenterBold, "border-r-1")}
                    rowSpan={optionalItems.length}
                  >
                    선택항목
                  </td>
                )}
                <td className={cell.tdLeft}>
                  {item.subCategory
                    ? `[${item.category}] ${item.subCategory}`
                    : item.category}
                </td>
                <td className={cell.tdRight}>
                  {item.selfPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.corporationPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.fullSelfPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.nonBenefit.toLocaleString()}
                </td>
              </tr>
            ))}

            {/* 기타 항목 */}
            {otherItems.map((item, index) => (
              <tr key={`other-${index}`}>
                {index === 0 && (
                  <td
                    className={cn(cell.tdCenterBold, "border-r-1")}
                    rowSpan={otherItems.length + 2}
                  >
                    기타항목
                  </td>
                )}
                <td className={cell.tdLeft}>
                  {item.subCategory
                    ? `[${item.category}] ${item.subCategory}`
                    : item.category}
                </td>
                <td className={cell.tdRight}>
                  {item.selfPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.corporationPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.fullSelfPayment.toLocaleString()}
                </td>
                <td className={cell.tdRight}>
                  {item.nonBenefit.toLocaleString()}
                </td>
              </tr>
            ))}

            {/* 합계 행 */}
            <tr className="font-bold">
              <td className={cell.tdLeft}>
                합계
              </td>
              <td className={cell.tdRight}>
                {totals.selfPayment.toLocaleString()}
              </td>
              <td className={cell.tdRight}>
                {totals.corporationPayment.toLocaleString()}
              </td>
              <td className={cell.tdRight}>
                {totals.fullSelfPayment.toLocaleString()}
              </td>
              <td className={cell.tdRight}>
                {totals.nonBenefit.toLocaleString()}
              </td>
            </tr>

            {/* 상한액 초과금 */}
            <tr>
              <td className={cell.tdLeft}>
                상한액 초과금
              </td>
              <td className={cell.tdRight}>
                {overLimitAmount.toLocaleString()}
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>

            {/* 원외 본인부담금 */}
            <tr>
              <td className={cn(cell.tdCenterBold, "border-r-1")} rowSpan={2}>
                원외약가
              </td>
              <td className={cell.tdLeft}>본인부담금</td>
              <td className={cell.tdRight}>
                {outOfHospitalPayment.toLocaleString()}
              </td>
              <td className={cell.tdRight}></td>
              <td className={cell.tdRight}></td>
              <td className={cell.tdRight}></td>
            </tr>

            {/* 약가 본인부담금(야간/공휴) */}
            <tr>
              <td className={cell.tdLeft}>본인부담금(야간/공휴)</td>
              <td className={cell.tdRight}>
                {nightHolidayDrugPayment.toLocaleString()}
              </td>
              <td className={cell.tdRight}></td>
              <td className={cell.tdRight}></td>
              <td className={cell.tdRight}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
