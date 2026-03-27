"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useClaimsDxStore } from "../../../(stores)/claims-dx-store";
import { Button } from "@/components/ui/button";
import { ClaimsService } from "@/services/claims-service";
import { mergeClaimDetailCache } from "../../../commons/refresh-helpers";
import { useToastHelpers } from "@/components/ui/toast";

type AnyRecord = Record<string, any>;
type ClaimApiErrorItem =
  | string
  | {
    message?: string;
    raw?: string | { message?: string; raw?: string };
  };

interface TableColumn<Row> {
  key: string;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
  className?: string;
  render: (row: Row, index: number) => ReactNode;
}

function normalizeClaimApiErrorMessages(
  claimApiErrors?: ClaimApiErrorItem[]
): string[] {
  if (!Array.isArray(claimApiErrors)) return [];

  return claimApiErrors
    .map((errorItem) => {
      if (typeof errorItem === "string") return errorItem.trim();

      const rawObject =
        typeof errorItem.raw === "object" && errorItem.raw !== null
          ? errorItem.raw
          : undefined;

      const candidates = [
        errorItem.message,
        rawObject?.message,
        typeof errorItem.raw === "string" ? errorItem.raw : undefined,
        rawObject?.raw,
      ];

      return (
        candidates
          .map((candidate) => String(candidate ?? "").trim())
          .find((candidate) => candidate.length > 0) ?? ""
      );
    })
    .filter((message) => message.length > 0);
}

function extractHiraCode(errorMessage: string): string | null {
  const matched = errorMessage.match(/^\[([A-Z0-9_]+)\]/);
  return matched?.[1] ?? null;
}

const CLAIM_SECTION_ERROR_PREFIXES = {
  generalInfo: ["HIRA_A"],
  calculation: ["HIRA_F"],
  disease: ["HIRA_B"],
  treatment: ["HIRA_C"],
  outerPrescription: ["HIRA_D"],
  specificDetail: ["HIRA_E"],
} as const;

function hasPrefixMatchedError(
  claimApiErrorCodes: string[],
  prefixes: readonly string[]
): boolean {
  return claimApiErrorCodes.some((code) =>
    prefixes.some((prefix) => code.startsWith(prefix))
  );
}

function pick(obj: AnyRecord | undefined, keys: string[]) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString("ko-KR");
}

function formatDate(value: unknown) {
  const source = String(value ?? "");
  if (!source) return "-";

  if (/^\d{8}$/.test(source)) {
    return `${source.slice(0, 4)}-${source.slice(4, 6)}-${source.slice(6, 8)}`;
  }

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return source;
  return date.toISOString().slice(0, 10);
}

function formatRrn(value: unknown) {
  const rrn = String(value ?? "").replace(/[^0-9]/g, "");
  if (rrn.length >= 13) return `${rrn.slice(0, 6)}-${rrn.slice(6, 13)}`;
  return rrn || "-";
}

function treatmentResultLabel(value: unknown) {
  const code = String(value ?? "");
  if (code === "1") return "계속";
  if (code === "2") return "종결";
  return code || "-";
}

function genderLabel(value: unknown) {
  const code = Number(value);
  if (code === 1) return "남";
  if (code === 2) return "여";
  return "-";
}

function calculateAge(rrnValue: string): number {
  const digits = String(rrnValue ?? "").replace(/[^0-9]/g, "");
  if (digits.length < 7) return 0;
  const genderDigit = Number(digits[6]);
  let century = 1900;
  if (genderDigit === 3 || genderDigit === 4) century = 2000;
  else if (genderDigit === 9 || genderDigit === 0) century = 1800;
  const birthYear = century + Number(digits.slice(0, 2));
  return new Date().getFullYear() - birthYear;
}

function coverageTypeLabel(value: unknown) {
  const code = Number(value);
  if (code === 1) return "수가";
  if (code === 2) return "준용수가";
  if (code === 3) return "보험등재약";
  if (code === 4) return "원료약/조제약";
  if (code === 5) return "보험등재약(일반명)";
  if (code === 8) return "치료재료";
  return "-";
}

function inOutTypeLabel(value: unknown) {
  const code = Number(value);
  if (code === 1) return "원내";
  if (code === 2) return "원외";
  if (code === 3) return "수탁";
  return "-";
}

function injuryCauseCodeLabel(row: AnyRecord) {
  const candidate = String(
    pick(row, [
      "외인코드",
      "externalCauseCode",
      "상해외인코드",
      "injuryCauseCode",
      "상해외인",
    ])
  ).trim();

  // 상해외인 여부(Y/N) 값은 코드가 아니므로 표시하지 않는다.
  if (!candidate || candidate.toUpperCase() === "Y" || candidate.toUpperCase() === "N") {
    return "-";
  }

  return candidate;
}

function extractOrderRows(claimDetail: AnyRecord) {
  const detailPayload = (claimDetail.detailPayload ?? {}) as AnyRecord;
  const chartData = (detailPayload.chart_data ?? {}) as AnyRecord;
  const chartOrders = Array.isArray(chartData.prescriptions)
    ? chartData.prescriptions
    : [];
  return chartOrders;
}

function extractOuterOrderRows(claimDetail: AnyRecord) {
  const detailPayload = (claimDetail.detailPayload ?? {}) as AnyRecord;
  const chartData = (detailPayload.chart_data ?? {}) as AnyRecord;
  const chartOuterRows = Array.isArray(chartData.prescriptions_outer)
    ? chartData.prescriptions_outer
    : [];
  return chartOuterRows;
}

function extractDiseaseRows(claimDetail: AnyRecord) {
  const detailPayload = (claimDetail.detailPayload ?? {}) as AnyRecord;
  const chartData = (detailPayload.chart_data ?? {}) as AnyRecord;
  const chartDiseases = Array.isArray(chartData.diseases) ? chartData.diseases : [];
  return chartDiseases;
}

function extractSpecificRows(claimDetail: AnyRecord) {
  const detailPayload = (claimDetail.detailPayload ?? {}) as AnyRecord;
  const chartData = (detailPayload.chart_data ?? {}) as AnyRecord;

  if (Array.isArray(detailPayload.specific_details))
    return detailPayload.specific_details;
  if (Array.isArray(chartData["특정내역"])) return chartData["특정내역"];
  return [];
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[12px] leading-[1.25] tracking-[-0.12px] text-[var(--gray-400)]">
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-medium leading-[1.4] tracking-[-0.13px] text-[var(--gray-100)]">
        {value}
      </p>
    </div>
  );
}

function AmountRow({ label, value, dashedBorderAfter }: { label: string; value: string; dashedBorderAfter?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-[6px] text-[13px]${dashedBorderAfter ? " border-b border-dashed border-[var(--border-1)] pb-3" : ""}`}>
      <span className="leading-[1.25] tracking-[-0.13px] text-[var(--gray-200)]">
        {label}
      </span>
      <span className="font-semibold leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
        {value}
      </span>
    </div>
  );
}

function DataTableSection<Row>({
  title,
  testId,
  columns,
  rows,
  highlightError = false,
}: {
  title: string;
  testId?: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  highlightError?: boolean;
}) {
  return (
    <section className="space-y-2" data-testid={testId}>
      <h4 className="text-[14px] font-semibold leading-[1.25] tracking-[-0.14px] text-[var(--gray-100)]">
        {title}
      </h4>
      <div
        className={`overflow-auto rounded-[6px] border bg-[var(--bg-main)] ${highlightError ? "border-[#EF4444]" : "border-[var(--border-1)]"
          }`}
      >
        <table className="min-w-[770px] w-full table-fixed border-collapse">
          <colgroup>
            {columns.map((column, i) => (
              <col
                key={`${column.key}-col`}
                style={
                  i === columns.length - 1
                    ? { width: "auto" }
                    : { width: `${column.width}px` }
                }
              />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-[var(--bg-2)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`h-[28px] whitespace-nowrap border-b border-[var(--border-1)] px-2 text-[12px] font-medium leading-[1.25] tracking-[-0.12px] text-[var(--gray-200)] ${column.align === "left"
                    ? "text-left"
                    : column.align === "right"
                      ? "text-right"
                      : "text-center"
                    } ${column.className ?? ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={`row-${index}`} className="h-[28px]">
                  {columns.map((column) => (
                    <td
                      key={`${column.key}-${index}`}
                      className={`truncate px-2 text-[12px] leading-[1.25] tracking-[-0.12px] text-[var(--gray-300)] ${column.align === "left"
                        ? "text-left"
                        : column.align === "right"
                          ? "text-right"
                          : "text-center"
                        } ${column.className ?? ""}`}
                    >
                      {column.render(row, index) ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-[40px] text-center text-[12px] text-[var(--gray-500)]"
                >
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ClaimsRightDetail() {
  const claimDetail = useClaimsDxStore((s) => s.claimDetail);
  const setClaimDetail = useClaimsDxStore((s) => s.setClaimDetail);
  const params = useParams<{ id: string }>();
  const claimId = params?.id || "";
  const qc = useQueryClient();
  const { success } = useToastHelpers();
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  const handleSaveReviewMemo = async () => {
    if (!claimDetail || !claimId) return;
    const detailId = String((claimDetail as AnyRecord).id ?? "");
    if (!detailId) return;
    setIsSavingMemo(true);
    try {
      const payload = {
        ...(claimDetail as AnyRecord),
        reviewMemo: String((claimDetail as AnyRecord).reviewMemo ?? ""),
        hasReviewMemo: Boolean((claimDetail as AnyRecord).reviewMemo),
      };
      await ClaimsService.updateLinkedClaimDetail(claimId, detailId, payload);
      mergeClaimDetailCache(qc, claimId, detailId, {
        reviewMemo: payload.reviewMemo,
        hasReviewMemo: payload.hasReviewMemo,
      });
      success("심사메모가 저장되었습니다.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "심사메모 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingMemo(false);
    }
  };

  if (!claimDetail) return null;

  const detailPayload = ((claimDetail as AnyRecord).detailPayload ?? {}) as AnyRecord;
  const chartData = (detailPayload.chart_data ?? {}) as AnyRecord;
  const info = (chartData.info ?? {}) as AnyRecord;
  const patient = (chartData.patient ?? {}) as AnyRecord;

  const diseases = useMemo(() => extractDiseaseRows(claimDetail as AnyRecord), [claimDetail]);
  const treatmentRows = useMemo(() => extractOrderRows(claimDetail as AnyRecord), [claimDetail]);
  const outerRows = useMemo(() => extractOuterOrderRows(claimDetail as AnyRecord), [claimDetail]);
  const specificRows = useMemo(() => extractSpecificRows(claimDetail as AnyRecord), [claimDetail]);
  const claimApiErrorMessages = useMemo(
    () =>
      normalizeClaimApiErrorMessages(
        (claimDetail as AnyRecord)?.claimApiErrors as
        | ClaimApiErrorItem[]
        | undefined
      ),
    [claimDetail]
  );
  const claimApiErrorCodes = useMemo(
    () =>
      claimApiErrorMessages
        .map((errorMessage) => extractHiraCode(errorMessage))
        .filter((code): code is string => Boolean(code)),
    [claimApiErrorMessages]
  );

  const hasGeneralValidationError = hasPrefixMatchedError(
    claimApiErrorCodes,
    CLAIM_SECTION_ERROR_PREFIXES.generalInfo
  );
  const hasCalculationValidationError = hasPrefixMatchedError(
    claimApiErrorCodes,
    CLAIM_SECTION_ERROR_PREFIXES.calculation
  );
  const hasDiseaseValidationError = hasPrefixMatchedError(
    claimApiErrorCodes,
    CLAIM_SECTION_ERROR_PREFIXES.disease
  );
  const hasTreatmentValidationError = hasPrefixMatchedError(
    claimApiErrorCodes,
    CLAIM_SECTION_ERROR_PREFIXES.treatment
  );
  const hasOuterValidationError = hasPrefixMatchedError(
    claimApiErrorCodes,
    CLAIM_SECTION_ERROR_PREFIXES.outerPrescription
  );
  const hasSpecificValidationError = hasPrefixMatchedError(
    claimApiErrorCodes,
    CLAIM_SECTION_ERROR_PREFIXES.specificDetail
  );

  const patientName =
    String(pick(info, ["수진자성명"]) || "-") || "-";
  const rrn = pick(info, ["주민번호_복호화", "주민번호"]) || "";
  const chartNo = String(
    (claimDetail as AnyRecord).patientNo ??
    (claimDetail as AnyRecord).patientId ??
    (claimDetail as AnyRecord).requestId ??
    (claimDetail as AnyRecord).id ??
    "-"
  );
  const treatmentDate = formatDate(
    (claimDetail as AnyRecord).treatmentDate ??
    pick(info, ["내원일"])
  );
  const doctorName = String(
    pick(detailPayload, ["ui_담당의성명"]) ||
    pick(info, ["ui_담당의성명"]) ||
    "-"
  );

  const amountRows = [
    { label: "요양급여비용총액1", value: formatMoney(pick(detailPayload, ["요양급여비용총액1"]) || (claimDetail as AnyRecord).totalMedicalBenefitAmount1) },
    { label: "본인일부부담금", value: formatMoney(pick(detailPayload, ["본인일부부담금"]) || (claimDetail as AnyRecord).patientCoPayment) },
    { label: "본인부담상한액 초과금", value: formatMoney(pick(detailPayload, ["본인부담상한액초과금"]) || (claimDetail as AnyRecord).excessCoPaymentLimitTotal) },
    { label: "청구액", value: formatMoney(pick(detailPayload, ["청구액"]) || (claimDetail as AnyRecord).claimAmount), dashedBorderAfter: true },
    { label: "지원금", value: formatMoney(pick(detailPayload, ["지원금"]) || (claimDetail as AnyRecord).supportAmount) },
    { label: "장애인의료비", value: formatMoney(pick(detailPayload, ["장애인의료비"]) || (claimDetail as AnyRecord).disabilityMedicalExpenses), dashedBorderAfter: true },
    { label: "요양급여비용총액2", value: formatMoney(pick(detailPayload, ["요양급여비용총액2"]) || (claimDetail as AnyRecord).totalMedicalBenefitAmount2) },
    { label: "100/100 미만 총액", value: formatMoney(pick(detailPayload, ["백분의백미만총액"]) || (claimDetail as AnyRecord).totalAmountLessThan100) },
    { label: "100/100 미만 본인부담금", value: formatMoney(pick(detailPayload, ["백분의백미만본인일부부담금총액"]) || (claimDetail as AnyRecord).coPaymentLessThan100) },
    { label: "100/100 미만 청구액", value: formatMoney(pick(detailPayload, ["백분의백미만청구액"]) || (claimDetail as AnyRecord).claimAmountLessThan100), dashedBorderAfter: true },
    { label: "보훈 청구액", value: formatMoney((claimDetail as AnyRecord).nationalMeritClaimAmount) },
    { label: "보훈 본인일부부담금", value: formatMoney((claimDetail as AnyRecord).nationalMeritCoPayment) },
    { label: "보훈 100/100미만 청구액", value: formatMoney((claimDetail as AnyRecord).nationalMeritClaimAmountLessThan100) },
  ];

  const diseaseColumns: TableColumn<AnyRecord>[] = [
    { key: "dot", label: "", width: 28, align: "center", className: "!px-1", render: () => <img src="/icon/orange.svg" alt="" className="w-[11px] h-[11px] inline-block" /> },
    {
      key: "code",
      label: "코드",
      width: 120,
      align: "left",
      className: "!pl-1",
      render: (row) => String(pick(row, ["상병기호", "diseaseClassificationCode", "code"])),
    },
    {
      key: "name",
      label: "명칭",
      width: 280,
      align: "left",
      render: (row) => String(pick(row, ["한글명칭", "상병명", "name"]) || "-"),
    },
    {
      key: "excluded",
      label: "배제",
      width: 27,
      render: (row) => {
        const isExcluded =
          Boolean(row?.isExcluded) ||
          Number(pick(row, ["상병구분", "diseaseCategory"])) === 3;
        return isExcluded ? "Y" : "";
      },
    },
    {
      key: "specific",
      label: "특정기호",
      width: 80,
      render: (row) => String(pick(row, ["특정기호", "specificSymbol"]) || "-"),
    },
    {
      key: "cause",
      label: "상해외인",
      width: 80,
      render: (row) => injuryCauseCodeLabel(row),
    },
    {
      key: "memo",
      label: "면허",
      width: 93,
      render: (row) => String(pick(row, ["면허번호", "licenseNo"]) || "-"),
    },
  ];

  const treatmentColumns: TableColumn<AnyRecord>[] = [
    { key: "row", label: "줄", width: 36, render: (_row, index) => index + 1 },
    {
      key: "userCode",
      label: "사용자코드",
      width: 76,
      render: (row) => {
        const userCode = String(pick(row, ["ui_사용자코드"]));
        return userCode || "-";
      },
    },
    {
      key: "claimCode",
      label: "청구코드",
      width: 86,
      render: (row) => String(pick(row, ["청구코드", "claimCode", "code"]) || "-"),
    },
    {
      key: "name",
      label: "명칭",
      width: 148,
      align: "left",
      render: (row) =>
        String(
          pick(row, ["ui_명칭", "명", "name", "한글명칭", "영문명칭", "englishName", "항목구분"]) ||
          "-"
        ),
    },
    {
      key: "dose",
      label: "1일투여량",
      width: 48,
      render: (row) => String(pick(row, ["투여량", "dose", "일투여량"]) || "-"),
    },
    {
      key: "times",
      label: "일투",
      width: 44,
      render: (row) => String(pick(row, ["일투여횟수", "times"]) || "1"),
    },
    {
      key: "days",
      label: "일수",
      width: 44,
      render: (row) => String(pick(row, ["투여일수", "days"]) || "1"),
    },
    {
      key: "unitPrice",
      label: "단가",
      width: 64,
      align: "right",
      render: (row) => formatMoney(pick(row, ["단가", "insurancePrice", "unitPrice"])),
    },
    {
      key: "amount",
      label: "금액",
      width: 64,
      align: "right",
      render: (row) => formatMoney(pick(row, ["금액", "amount"])),
    },
    {
      key: "coverage",
      label: "급여",
      width: 54,
      render: (row) => coverageTypeLabel(pick(row, ["코드구분", "codeType"])),
    },
    {
      key: "item",
      label: "항목",
      width: 48,
      render: (row) => `${pick(row, ["청구목"]) || "-"}${pick(row, ["청구항"]) || ""}`,
    },
    {
      key: "license",
      label: "면허",
      width: 58,
      render: (row) => String(pick(row, ["면허번호", "licenseNo"]) || "-"),
    },
  ];

  const outerColumns: TableColumn<AnyRecord>[] = [
    { key: "row", label: "줄", width: 36, render: (_row, index) => index + 1 },
    {
      key: "userCode",
      label: "사용자코드",
      width: 76,
      render: (row) => {
        const userCode = String(
          pick(row, ["ui_사용자코드"])
        );
        return userCode || "-";
      },
    },
    {
      key: "claimCode",
      label: "청구코드",
      width: 86,
      render: (row) => String(pick(row, ["청구코드", "claimCode", "code"]) || "-"),
    },
    {
      key: "name",
      label: "명칭",
      width: 148,
      align: "left",
      render: (row) =>
        String(
          pick(row, ["ui_명칭", "명", "name", "한글명칭", "영문명칭", "englishName", "항목구분"]) ||
          "-"
        ),
    },
    {
      key: "days",
      label: "1회투약수량",
      width: 70,
      render: (row) => String(pick(row, ["투여량", "dose"]) || "-"),
    },
    {
      key: "times",
      label: "1일투여횟수",
      width: 70,
      render: (row) => String(pick(row, ["일투여횟수", "times"]) || "1"),
    },
    {
      key: "days2",
      label: "총투약일수",
      width: 70,
      render: (row) => String(pick(row, ["투여일수", "days"]) || "1"),
    },
    {
      key: "classification",
      label: "원외약품구분코드",
      width: 134,
      render: (row) => inOutTypeLabel(pick(row, ["원내외구분", "inOutType"])),
    },
    {
      key: "codeType",
      label: "교부번호",
      width: 80,
      render: (row) => String(pick(row, ["처방전발급번호"]) || "-"),
    },
  ];

  const specificColumns: TableColumn<AnyRecord>[] = [
    {
      key: "row",
      label: "줄",
      width: 36,
      render: (row, index) => {
        const unitType = Number(
          pick(row, ["발생단위구분", "unitType", "occurrenceUnitType"])
        );
        if (unitType === 1) return "-";
        return String(pick(row, ["줄번호", "lineNumber", "줄번호_result"]) || index + 1);
      },
    },
    {
      key: "code",
      label: "코드",
      width: 76,
      render: (row) => String(pick(row, ["코드", "code", "specificCode"]) || "-"),
    },
    {
      key: "name",
      label: "특정내역구분",
      width: 234,
      align: "left",
      render: (row) =>
        String(pick(row, ["명", "name", "type", "code", "코드"]) || "-"),
    },
    {
      key: "detail",
      label: "내역",
      width: 120,
      render: (row) =>
        String(
          pick(row, ["내역", "내용", "content", "value", "구분", "category"]) || "-"
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-3 p-3" data-testid="claims-right-detail">
      <section
        data-testid="claims-detail-general-info"
        className={`rounded-[6px] border bg-[var(--bg-main)] px-4 py-3 ${hasGeneralValidationError
          ? "border-[#EF4444]"
          : "border-[var(--border-2)]"
          }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--border-1)] pb-3">
          <div className="flex items-center gap-2 text-[14px] text-[var(--gray-100)]">
            <span className="rounded-[4px] border border-[var(--border-1)] px-1.5 py-[1px] text-[12px] font-medium text-[var(--gray-300)]">
              {chartNo}
            </span>
            <span className="font-semibold">{patientName}</span>
            <span className="text-[13px] font-normal text-[var(--gray-300)]">
              ({genderLabel(pick(patient, ["성별", "gender"]))}/{calculateAge(String(rrn))})
            </span>
            <span className="text-[var(--gray-400)]">|</span>
            <span className="text-[13px] font-normal text-[var(--gray-300)]">
              {formatRrn(rrn)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[var(--gray-400)]">
            <span>진료일자 {treatmentDate}</span>
          </div>
        </div>
        <div className="mt-3 flex gap-x-4 gap-y-3">
          <InfoField label="명일련 번호" value={String(pick(detailPayload, ["명세서일련번호"]) || "자동부여")} />
          <InfoField label="진료일수" value={`${pick(detailPayload, ["진료일수"]) || "0"}일`} />
          <InfoField label="진료결과" value={treatmentResultLabel(pick(detailPayload, ["진료결과"]))} />
          <InfoField label="진료의" value={doctorName} />
          <InfoField label="증번호" value={String(pick(detailPayload, ["증번호"]) || "-")} />
          <InfoField label="요양급여일수" value={`${pick(detailPayload, ["요양급여일수"]) || "0"}일`} />
          <InfoField label="추가자격" value={String(pick(detailPayload, ["추가자격", "추가자격코드"]) || "-")} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[384px_minmax(0,1fr)]">
        <div className="space-y-3">
          <section data-testid="claims-detail-calculation">
            <h4 className="mb-2 text-[14px] font-semibold leading-[1.25] tracking-[-0.14px] text-[var(--gray-100)]">
              계산 내역
            </h4>
            <div
              className={`rounded-[6px] border bg-[var(--bg-main)] p-3 ${hasCalculationValidationError
                ? "border-[#EF4444]"
                : "border-[var(--border-1)]"
                }`}
            >
              <div>
                {amountRows.map((item) => (
                  <AmountRow key={item.label} label={item.label} value={item.value} dashedBorderAfter={item.dashedBorderAfter} />
                ))}
              </div>
            </div>
          </section>

          <section data-testid="claims-detail-review-memo">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[14px] font-semibold leading-[1.25] tracking-[-0.14px] text-[var(--gray-100)]">
                심사메모
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[12px]"
                style={{ borderRadius: "var(--4, 4px)", border: "1px solid var(--Line-border-2_DBDCDF, #C2C4C8)" }}
                disabled={isSavingMemo}
                onClick={handleSaveReviewMemo}
              >
                {isSavingMemo ? "저장 중..." : "저장"}
              </Button>
            </div>
            <textarea
              className="h-[125px] w-full resize-none rounded-[6px] border border-[var(--border-1)] bg-[var(--bg-main)] p-2 text-[12px] text-[var(--gray-300)] outline-none"
              placeholder="심사 시 참고할 사항을 작성하세요."
              value={String((claimDetail as AnyRecord).reviewMemo ?? "")}
              onChange={(event) => {
                const next = {
                  ...(claimDetail as AnyRecord),
                  reviewMemo: event.target.value,
                  hasReviewMemo: Boolean(event.target.value),
                };
                setClaimDetail(next);
              }}
            />
          </section>
        </div>

        <div className="space-y-3">
          <DataTableSection
            title="진단내역"
            testId="claims-detail-disease-section"
            columns={diseaseColumns}
            rows={diseases}
            highlightError={hasDiseaseValidationError}
          />
          <DataTableSection
            title="진료내역"
            testId="claims-detail-treatment-section"
            columns={treatmentColumns}
            rows={treatmentRows}
            highlightError={hasTreatmentValidationError}
          />
          <DataTableSection
            title="원외처방"
            testId="claims-detail-outer-section"
            columns={outerColumns}
            rows={outerRows}
            highlightError={hasOuterValidationError}
          />
          <DataTableSection
            title="특정내역"
            testId="claims-detail-specific-section"
            columns={specificColumns}
            rows={specificRows}
            highlightError={hasSpecificValidationError}
          />
        </div>
      </div>
    </div>
  );
}
