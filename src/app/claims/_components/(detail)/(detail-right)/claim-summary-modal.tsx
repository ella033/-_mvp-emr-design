"use client";

import { Button } from "@/components/ui/button";
import MyPopup from "@/components/yjg/my-pop-up";
import {
  claimClassificationToLabel,
  formNumberToInsuranceType,
  treatmentTypeToLabel,
} from "../../../(enums)/claims-enums";

type ClaimRecord = Record<string, any>;

export interface ClaimSummaryModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  claim: ClaimRecord | null;
}

function formatMoney(value: any): string {
  const str = String(value ?? "0").replace(/[^0-9]/g, "");
  const num = Number(str || 0);
  return num.toLocaleString();
}

function yearMonthLabel(yyyymm?: string | null): string {
  if (!yyyymm || yyyymm.length < 6) return "-";
  const yyyy = yyyymm.slice(0, 4);
  const mm = yyyymm.slice(4, 6).replace(/^0/, "");
  return `${yyyy}년 ${mm}월`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function ClaimSummaryModal({
  open,
  onOpenChange,
  claim,
}: ClaimSummaryModalProps) {
  const insuranceLabel =
    formNumberToInsuranceType(
      String((claim as any)?.formNumber ?? claim?.["서식번호"] ?? "")
    ) || "-";
  const treatmentLabel =
    treatmentTypeToLabel(
      String((claim as any)?.treatmentType ?? claim?.["진료형태"] ?? "")
    ) || "-";
  const classificationLabel =
    claimClassificationToLabel(
      String((claim as any)?.claimClassification ?? claim?.["청구구분"] ?? "")
    ) || "-";

  const orgCode =
    (claim as any)?.medicalInstitutionCode ??
    claim?.["요양기관기호"] ??
    claim?.["요양기관(의료급여기관)기호"] ??
    "-";
  const totalCount = Number((claim as any)?.count || 0).toLocaleString();

  return (
    <MyPopup
      isOpen={open}
      onCloseAction={() => onOpenChange(false)}
      title="청구서 정보"
      width="50vw"
      height="35vh"
    >
      <div className="flex flex-col p-4 space-y-4 flex-1 my-scroll">
        {/* 요양기관정보 */}
        <div className="border rounded-sm">
          <div className="px-3 py-2 text-sm font-medium border-b bg-muted">
            요양기관정보
          </div>
          <div className="p-3 text-sm">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div className="min-w-[160px] flex items-center gap-2">
                <span className="text-muted-foreground">요양기관기호</span>
                <span className="font-medium">{orgCode}</span>
              </div>
              <div className="min-w-[160px] flex items-center gap-2">
                <span className="text-muted-foreground">요양기관명</span>
                <span className="font-medium">
                  {(claim as any)?.hospitalName || "-"}
                </span>
              </div>
              <div className="min-w-[160px] flex items-center gap-2">
                <span className="text-muted-foreground">청구자</span>
                <span className="font-medium">
                  {(claim as any)?.preparerName ||
                    (claim as any)?.claimant ||
                    claim?.작성자성명 ||
                    claim?.청구인 ||
                    "-"}
                </span>
              </div>
              <div className="min-w-[160px] flex items-center gap-2">
                <span className="text-muted-foreground">청구자 생년월일</span>
                <span className="font-medium">
                  {String(
                    (claim as any)?.preparerDateOfBirth ??
                      claim?.작성자생년월일 ??
                      ""
                  ).slice(0, 8) || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 청구정보 */}
        <div className="border rounded-sm">
          <div className="px-3 py-2 text-sm font-medium border-b bg-muted">
            청구정보
          </div>
          <div className="p-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">진료년월</span>
                <span className="font-medium">
                  {yearMonthLabel(
                    String(
                      (claim as any)?.treatmentYearMonth ?? claim?.["진료년월"]
                    )
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">보험구분</span>
                <span className="font-medium">{insuranceLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">진료형태</span>
                <span className="font-medium">{treatmentLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">청구구분</span>
                <span className="font-medium">{classificationLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">총 건수</span>
                <span className="font-medium">{totalCount}건</span>
              </div>
            </div>
          </div>
        </div>

        {/* 합계 */}
        <div className="border rounded-sm">
          <div className="px-3 py-2 text-sm font-medium border-b bg-muted">
            합계
          </div>
          <div className="p-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Row
                  label="요양급여비용총액1"
                  value={`${formatMoney((claim as any)?.totalMedicalBenefitAmount1)}원`}
                />
                <Row
                  label="본인일부부담금"
                  value={`${formatMoney((claim as any)?.patientCoPayment)}원`}
                />
                <Row
                  label="본인부담상한액 초과금 총액"
                  value={`${formatMoney((claim as any)?.excessCoPaymentLimitTotal ?? claim?.["본인부담상한액초과금"])}원`}
                />
                <Row
                  label="청구액"
                  value={`${formatMoney((claim as any)?.claimAmount)}원`}
                />
                <Row
                  label="지원금"
                  value={`${formatMoney((claim as any)?.supportAmount)}원`}
                />
              </div>
              <div className="space-y-2">
                <Row
                  label="장애인의료비"
                  value={`${formatMoney((claim as any)?.disabilityMedicalExpenses)}원`}
                />
                <Row
                  label="요양급여비용총액2(진료비총액)"
                  value={`${formatMoney((claim as any)?.totalMedicalBenefitAmount2)}원`}
                />
                <Row
                  label="100/100미만 총액"
                  value={`${formatMoney((claim as any)?.totalAmountLessThan100)}원`}
                />
                <Row
                  label="100/100미만 본인부담금"
                  value={`${formatMoney((claim as any)?.coPaymentLessThan100)}원`}
                />
                <Row
                  label="100/100미만 청구액"
                  value={`${formatMoney((claim as any)?.claimAmountLessThan100)}원`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MyPopup>
  );
}
