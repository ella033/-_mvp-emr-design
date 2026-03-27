"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MyPopup from "@/components/yjg/my-pop-up";
import { Loader2 } from "lucide-react";
import { ClaimsService } from "@/services/claims-service";

type AdditionalClaimPatient = {
  id: string;
  patientPk: number;
  patientId: string;
  patientName: string;
  birthDate: string;
  gender: string;
  treatmentDate: string;
};

type AdditionalOrderItem = {
  id: string;
  prescriptionDate: string;
  userCode: string;
  claimCode: string;
  name: string;
  dosage: string;
  dailyDose: string;
  days: string;
};

// ── 인터페이스 ─────────────────────────────────────
interface AdditionalClaimItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: AdditionalClaimPatient | null;
  queryParams: {
    treatmentYearMonth: string;
    formNumber: string;
    treatmentType: string;
    claimClassification: string;
  };
  onConfirm: (selectedItemIds: Set<string>) => void;
}

// ── 컴포넌트 ───────────────────────────────────────
const AdditionalClaimItemsModal: React.FC<AdditionalClaimItemsModalProps> = ({
  open,
  onOpenChange,
  patient,
  queryParams,
  onConfirm,
}) => {
  const [items, setItems] = useState<AdditionalOrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  // 모달 열릴 때 처방 항목 로드
  useEffect(() => {
    if (open && patient) {
      const loadItems = async () => {
        setIsLoading(true);
        setShowValidationError(false);
        setSelectedItems(new Set());
        const response = await ClaimsService.getAdditionalClaimOrders(
          patient.patientPk,
          queryParams,
        );
        setItems(response?.data ?? []);
        setIsLoading(false);
      };
      loadItems();
    } else {
      setItems([]);
      setSelectedItems(new Set());
      setShowValidationError(false);
    }
  }, [open, patient, queryParams]);

  // 전체 선택 상태
  const isAllSelected =
    items.length > 0 && items.every((item) => selectedItems.has(item.id));
  const isIndeterminate =
    items.some((item) => selectedItems.has(item.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
    setShowValidationError(false);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setShowValidationError(false);
  };

  // 선택완료
  const handleConfirm = () => {
    if (selectedItems.size === 0) {
      setShowValidationError(true);
      return;
    }
    onConfirm(selectedItems);
    onOpenChange(false);
  };

  // 취소
  const handleCancel = () => {
    onOpenChange(false);
  };

  // 환자 정보 표시 항목
  const patientInfoItems = useMemo(() => {
    if (!patient) return [];
    return [
      { label: "차트번호", value: patient.patientId },
      { label: "환자명", value: patient.patientName },
      { label: "생년월일", value: patient.birthDate },
      { label: "성별", value: patient.gender },
      { label: "진료일자", value: patient.treatmentDate },
    ];
  }, [patient]);

  return (
    <MyPopup
      isOpen={open}
      onCloseAction={handleCancel}
      width="700px"
      height="500px"
      minWidth="680px"
      minHeight="394px"
      title="추가청구 항목 선택"
    >
      <div className="flex flex-col h-full">
        {/* ── 환자 정보 바 ── */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between border border-[var(--border-1)] rounded-[6px] px-4 py-2">
            {patientInfoItems.map((info) => (
              <div key={info.label} className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--gray-400)] leading-[1.25] tracking-[-0.12px]">
                  {info.label}
                </span>
                <span className="text-[12px] font-bold text-[var(--gray-100)] leading-[1.25] tracking-[-0.12px]">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 처방 항목 테이블 ── */}
        <div className="px-5 pb-3 flex-1 min-h-0">
          <div className="rounded-[6px] h-full overflow-auto">
            <Table className="[&_tr]:border-0 [&_thead]:border-0 [&_th]:border-0 [&_tbody]:border-0 [&_th]:align-middle [&_td]:align-middle">
              <TableHeader className="!border-0 sticky top-0 z-10">
                <TableRow className="bg-[var(--bg-2)] hover:bg-[var(--bg-2)] !border-b-0">
                  <TableHead className="w-10 text-center h-[28px] py-0 rounded-tl-[6px]">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[var(--border-2)]"
                    />
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                    처방일자
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                    사용자코드
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                    청구코드
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                    명칭
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                    용량
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                    일투
                  </TableHead>
                  <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0 rounded-tr-[6px]">
                    일수
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="border-b-0">
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 rounded-b-[6px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--gray-400)]" />
                        <span className="text-[13px] text-[var(--gray-400)]">
                          데이터를 불러오는 중...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow className="border-b-0">
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-[13px] text-[var(--gray-500)] rounded-b-[6px]"
                    >
                      추가 청구 가능한 항목이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-[var(--bg-1)] h-[28px] border-b-0"
                    >
                      <TableCell
                        className={`text-center py-0 ${index === items.length - 1 ? "rounded-bl-[6px]" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) =>
                            handleSelectOne(item.id, e.target.checked)
                          }
                          className="rounded border-[var(--border-2)]"
                        />
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px]">
                        {item.prescriptionDate}
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px]">
                        {item.userCode}
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px]">
                        {item.claimCode}
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px]">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px]">
                        {item.dosage}
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px]">
                        {item.dailyDose}
                      </TableCell>
                      <TableCell
                        className={`text-center text-[13px] text-[var(--gray-300)] py-0 tracking-[-0.13px] ${index === items.length - 1 ? "rounded-br-[6px]" : ""}`}
                      >
                        {item.days}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── 하단 푸터 ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 shrink-0">
          {/* 경고 메시지 */}
          {showValidationError && (
            <div className="flex items-center justify-end gap-1.5">
              <img
                src="/icon/ic_line_alert-circle.svg"
                alt="경고"
                width={16}
                height={16}
              />
              <span className="text-[13px] text-[var(--negative)] leading-[1.25] tracking-[-0.13px]">
                아무 항목도 선택되지 않았습니다.
              </span>
            </div>
          )}

          <button
            onClick={handleCancel}
            className="flex min-w-[64px] px-3 py-2 justify-center items-center gap-1 rounded-[4px] border border-[var(--border-1)] bg-white text-[13px] font-medium text-[var(--gray-100)] tracking-[-0.13px] leading-[1.25] hover:bg-[var(--bg-1)] transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="flex min-w-[64px] px-3 py-2 justify-center items-center gap-1 rounded-[4px] bg-[var(--main-color)] text-[13px] font-medium text-white tracking-[-0.13px] leading-[1.25] hover:bg-[var(--main-color-hover)] transition-colors"
          >
            선택완료
          </button>
        </div>
      </div>
    </MyPopup>
  );
};

export default AdditionalClaimItemsModal;
