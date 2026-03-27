"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { MyButton } from "@/components/yjg/my-button";
import { useToastHelpers } from "@/components/ui/toast";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import {
  SettingPageTable,
  type SettingPageColumn,
} from "@/components/settings/commons/setting-page-table";
import { useConsentManagement } from "../hooks/use-consent-management";
import type { ConsentTemplate } from "../api/consent-templates.api";
import { ConsentTemplateFormModal } from "./consent-template-form-modal";

export function ConsentManagementPage() {
  const toast = useToastHelpers();
  const {
    templates,
    isLoading,
    isMutating,
    error,
    reload,
    createTemplate,
    toggleActive,
  } = useConsentManagement();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleCreate = async (payload: {
    title: string;
    category: string;
    file: File;
  }) => {
    const ok = await createTemplate({
      title: payload.title,
      category: payload.category || undefined,
      file: payload.file,
    });

    if (ok) {
      toast.success("등록 완료", "동의서 템플릿이 등록되었습니다.");
    } else {
      toast.error("등록 실패", "동의서 템플릿 등록에 실패했습니다.");
    }
    return ok;
  };

  const handleToggleActive = async (row: ConsentTemplate) => {
    const newActive = !row.isActive;
    const ok = await toggleActive(row.id, newActive);
    if (ok) {
      toast.success(
        newActive ? "활성화 완료" : "비활성화 완료",
        `${row.title} 템플릿이 ${newActive ? "활성화" : "비활성화"}되었습니다.`
      );
    } else {
      toast.error("처리 실패", "상태 변경에 실패했습니다.");
    }
  };

  const columns = useMemo<SettingPageColumn<ConsentTemplate>[]>(
    () => [
      {
        id: "title",
        header: "동의서 제목",
        render: (row) => row.title,
      },
      {
        id: "category",
        header: "카테고리",
        render: (row) => row.category ?? "-",
      },
      {
        id: "isActive",
        header: "상태",
        render: (row) => (
          <button
            type="button"
            disabled={isMutating}
            onClick={(e) => {
              e.stopPropagation();
              void handleToggleActive(row);
            }}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              row.isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {row.isActive ? "활성" : "비활성"}
          </button>
        ),
      },
      {
        id: "createDateTime",
        header: "등록일",
        render: (row) =>
          new Date(row.createDateTime).toLocaleDateString("ko-KR"),
      },
    ],
    [isMutating]
  );

  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]">
      <SettingPageHeader
        title="동의서 관리"
        tooltipContent="동의서 템플릿을 등록하고 관리합니다. 양식이 변경되면 기존 동의서를 비활성화하고 새로 등록하세요."
      />

      <SectionLayout
        className="min-h-[360px]"
        header={
          <div className="flex items-center justify-between">
            <SettingPageHeader title="동의서 템플릿" />
            <MyButton
              className="h-[32px]"
              leftIcon={<Plus className="h-4 w-4" aria-hidden />}
              onClick={() => setCreateModalOpen(true)}
              disabled={isMutating}
            >
              템플릿 등록
            </MyButton>
          </div>
        }
        body={
          <SettingPageTable
            isLoading={isLoading}
            error={error}
            rows={templates}
            columns={columns}
            rowKey={(row) => String(row.id)}
            emptyMessage="등록된 동의서 템플릿이 없습니다."
            errorActionLabel="다시 시도"
            onErrorAction={() => void reload()}
          />
        }
      />

      <ConsentTemplateFormModal
        isOpen={createModalOpen}
        isSubmitting={isMutating}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
