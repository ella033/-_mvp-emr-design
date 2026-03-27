"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyContextMenu } from "@/components/yjg/my-context-menu";
import { useToastHelpers } from "@/components/ui/toast";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import {
  SettingPageTable,
  type SettingPageColumn,
  type SettingPageTableEvent,
} from "@/components/settings/commons/setting-page-table";
import { usePatientManagement } from "../hooks/use-patient-management";
import type {
  Benefit,
  CreateBenefitRequest,
  PatientGroup,
  UpdatePatientGroupRequest,
} from "../model";
import { DISCOUNT_TARGET_OPTIONS, DISCOUNT_UNIT_OPTIONS } from "../model";
import { BenefitFormModal } from "./benefit-form-modal";
import { PatientGroupFormModal } from "./patient-group-form-modal";

type DeleteTarget =
  | { type: "benefit"; id: number; name: string }
  | { type: "group"; id: number; name: string };

type RowMenuState =
  | { open: false }
  | {
      open: true;
      position: { x: number; y: number };
      target: { type: "benefit"; row: Benefit } | { type: "group"; row: PatientGroup };
    };

const targetLabelMap = Object.fromEntries(
  DISCOUNT_TARGET_OPTIONS.map((item) => [item.value, item.label])
);
const unitLabelMap = Object.fromEntries(
  DISCOUNT_UNIT_OPTIONS.map((item) => [item.value, item.label])
);

export function PatientManagementPage() {
  const toast = useToastHelpers();
  const {
    benefits,
    patientGroups,
    isLoading,
    isMutating,
    error,
    reload,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    createPatientGroup,
    updatePatientGroup,
    deletePatientGroup,
  } = usePatientManagement();

  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [editingGroup, setEditingGroup] = useState<PatientGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [rowMenu, setRowMenu] = useState<RowMenuState>({ open: false });

  const openCreateBenefit = () => {
    setEditingBenefit(null);
    setBenefitModalOpen(true);
  };

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupModalOpen(true);
  };

  const handleBenefitSubmit = async (payload: CreateBenefitRequest) => {
    const ok = editingBenefit
      ? await updateBenefit(editingBenefit.id, payload)
      : await createBenefit(payload);

    if (ok) {
      toast.success(
        "저장 완료",
        editingBenefit ? "혜택이 수정되었습니다." : "혜택이 등록되었습니다."
      );
    } else {
      toast.error("저장 실패", "혜택 저장에 실패했습니다.");
    }

    return ok;
  };

  const handleGroupSubmit = async (values: {
    name: string;
    benefitId?: number;
    clearBenefit?: boolean;
  }) => {
    const payload: UpdatePatientGroupRequest = { name: values.name };
    if (values.benefitId !== undefined) {
      payload.benefitId = values.benefitId;
    } else if (editingGroup && values.clearBenefit) {
      payload.benefitId = null;
    }

    const ok = editingGroup
      ? await updatePatientGroup(editingGroup.id, payload)
      : await createPatientGroup(
          values.benefitId !== undefined
            ? { name: values.name, benefitId: values.benefitId }
            : { name: values.name }
        );

    if (ok) {
      toast.success(
        "저장 완료",
        editingGroup
          ? "환자그룹이 수정되었습니다."
          : "환자그룹이 등록되었습니다."
      );
    } else {
      toast.error("저장 실패", "환자그룹 저장에 실패했습니다.");
    }

    return ok;
  };

  const benefitColumns = useMemo<SettingPageColumn<Benefit>[]>(
    () => [
      {
        id: "name",
        header: "혜택명",
        render: (row) => row.name,
      },
      {
        id: "target",
        header: "감액 대상",
        render: (row) => targetLabelMap[row.config.target] ?? row.config.target,
      },
      {
        id: "unit",
        header: "감액 단위",
        render: (row) => unitLabelMap[row.config.unit] ?? row.config.unit,
      },
      {
        id: "value",
        header: "감액 값",
        render: (row) =>
          row.config.unit === "PERCENT"
            ? `${row.config.value}%`
            : `${row.config.value.toLocaleString()}원`,
      },
    ],
    []
  );

  const groupColumns = useMemo<SettingPageColumn<PatientGroup>[]>(
    () => [
      {
        id: "name",
        header: "환자그룹명",
        render: (row) => row.name,
      },
      {
        id: "benefit",
        header: "연결 혜택",
        render: (row) => row.benefits?.[0]?.name ?? "-",
      },
    ],
    []
  );

  const handleBenefitTableEvent = (event: SettingPageTableEvent<Benefit>) => {
    if (event.type === "rowContextMenu" && event.position) {
      setRowMenu({
        open: true,
        position: event.position,
        target: { type: "benefit", row: event.row },
      });
    }
  };

  const handleGroupTableEvent = (event: SettingPageTableEvent<PatientGroup>) => {
    if (event.type === "rowContextMenu" && event.position) {
      setRowMenu({
        open: true,
        position: event.position,
        target: { type: "group", row: event.row },
      });
    }
  };

  const rowMenuItems = useMemo(() => {
    if (!rowMenu.open) return [];

    if (rowMenu.target.type === "benefit") {
      const targetRow = rowMenu.target.row;
      return [
        {
          label: "수정",
          onClick: () => {
            setEditingBenefit(targetRow);
            setBenefitModalOpen(true);
            setRowMenu({ open: false });
          },
        },
        {
          label: "삭제",
          onClick: () => {
            setDeleteTarget({
              type: "benefit",
              id: targetRow.id,
              name: targetRow.name,
            });
            setRowMenu({ open: false });
          },
        },
      ];
    }

    const targetRow = rowMenu.target.row;
    return [
      {
        label: "수정",
        onClick: () => {
          setEditingGroup(targetRow);
          setGroupModalOpen(true);
          setRowMenu({ open: false });
        },
      },
      {
        label: "삭제",
        onClick: () => {
          setDeleteTarget({
            type: "group",
            id: targetRow.id,
            name: targetRow.name,
          });
          setRowMenu({ open: false });
        },
      },
    ];
  }, [rowMenu]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const ok =
      deleteTarget.type === "benefit"
        ? await deleteBenefit(deleteTarget.id)
        : await deletePatientGroup(deleteTarget.id);

    if (ok) {
      toast.success(
        "삭제 완료",
        deleteTarget.type === "benefit"
          ? "혜택이 삭제되었습니다."
          : "환자그룹이 삭제되었습니다."
      );
      setDeleteTarget(null);
    } else {
      toast.error("삭제 실패", "삭제 처리에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]">
      <SettingPageHeader
        title="환자 관리"
        tooltipContent="혜택과 환자그룹을 등록하고 연결 관계를 관리합니다."
      />

      <section className="flex w-full flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
        <SectionLayout
          className="min-h-[360px] lg:w-1/2"
          header={
            <div className="flex items-center justify-between">
              <SettingPageHeader title="혜택 관리" />
              <MyButton
                className="h-[32px]"
                leftIcon={<Plus className="h-4 w-4" aria-hidden />}
                onClick={openCreateBenefit}
                disabled={isMutating}
              >
                혜택 등록
              </MyButton>
            </div>
          }
          body={
            <SettingPageTable
              isLoading={isLoading}
              error={error}
              rows={benefits}
              columns={benefitColumns}
              rowKey={(row) => String(row.id)}
              emptyMessage="등록된 혜택이 없습니다."
              errorActionLabel="다시 시도"
              onErrorAction={() => void reload()}
              onEvent={handleBenefitTableEvent}
            />
          }
        />

        <SectionLayout
          className="min-h-[360px] lg:w-1/2"
          header={
            <div className="flex items-center justify-between">
              <SettingPageHeader title="환자그룹 관리" />
              <MyButton
                className="h-[32px]"
                leftIcon={<Plus className="h-4 w-4" aria-hidden />}
                onClick={openCreateGroup}
                disabled={isMutating}
              >
                그룹 등록
              </MyButton>
            </div>
          }
          body={
            <SettingPageTable
              isLoading={isLoading}
              error={error}
              rows={patientGroups}
              columns={groupColumns}
              rowKey={(row) => String(row.id)}
              emptyMessage="등록된 환자그룹이 없습니다."
              errorActionLabel="다시 시도"
              onErrorAction={() => void reload()}
              onEvent={handleGroupTableEvent}
            />
          }
        />
      </section>

      <BenefitFormModal
        isOpen={benefitModalOpen}
        isSubmitting={isMutating}
        initialBenefit={editingBenefit}
        onClose={() => setBenefitModalOpen(false)}
        onSubmit={handleBenefitSubmit}
      />

      <PatientGroupFormModal
        isOpen={groupModalOpen}
        isSubmitting={isMutating}
        initialGroup={editingGroup}
        benefits={benefits}
        onClose={() => setGroupModalOpen(false)}
        onSubmit={handleGroupSubmit}
      />

      <MyContextMenu
        isOpen={rowMenu.open}
        onCloseAction={() => setRowMenu({ open: false })}
        items={rowMenuItems}
        position={rowMenu.open ? rowMenu.position : { x: 0, y: 0 }}
      />

      <MyPopup
        isOpen={Boolean(deleteTarget)}
        onCloseAction={() => setDeleteTarget(null)}
        fitContent
        hideHeader
        width="320px"
      >
        <div className="-m-[10px] w-[300px] max-w-[88vw] rounded-md border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-3 py-2">
            <p className="text-[11px] font-semibold text-[var(--text-primary)]">
              삭제하시겠습니까?
            </p>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-3">
            {deleteTarget?.type === "benefit" ? (
              <div className="mb-2 flex items-center gap-2 text-xs text-rose-600">
                <Trash2 className="h-4 w-4" aria-hidden />
                연결된 환자그룹이 있으면 그룹의 혜택 연결이 해제됩니다.
              </div>
            ) : null}

            <div className="flex justify-end gap-1">
              <MyButton
                variant="outline"
                className="h-[24px] min-w-[38px] px-2 text-[10px]"
                onClick={() => setDeleteTarget(null)}
              >
                취소
              </MyButton>
              <MyButton
                className="h-[24px] min-w-[38px] px-2 text-[10px]"
                onClick={() => void handleConfirmDelete()}
              >
                삭제
              </MyButton>
            </div>
          </div>
        </div>
      </MyPopup>
    </div>
  );
}
