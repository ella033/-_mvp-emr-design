"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useConsentTemplates, useCreateConsent } from "@/hooks/consent/use-create-consent";
import { useToastHelpers } from "@/components/ui/toast";
import type { ConsentTemplateItem } from "@/lib/api/routes/consents-api";

interface ConsentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName?: string;
  onSuccess?: () => void;
}

export function ConsentRequestModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}: ConsentRequestModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const { success, error: showError } = useToastHelpers();

  const { data: templatesResponse, isLoading: isTemplatesLoading } = useConsentTemplates(
    isOpen ? patientId : undefined
  );

  const { mutateAsync: createConsent, isPending: isCreating } = useCreateConsent({
    onSuccess: () => {
      // Individual success handled in batch
    },
    onError: (error) => {
      showError("동의서 전송 실패", error.message);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplates(new Set());
    }
  }, [isOpen]);

  const templates = templatesResponse?.items || [];

  const handleTemplateToggle = (templateId: number) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === templates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(templates.map((t) => t.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedTemplates.size === 0) {
      showError("동의서를 선택해주세요.");
      return;
    }

    try {
      const templateIds = Array.from(selectedTemplates);

      // Create consents for all selected templates
      await Promise.all(
        templateIds.map((consentTemplateId) =>
          createConsent({
            patientId,
            consentTemplateId,
            status: "PENDING",
          })
        )
      );

      success(`${templateIds.length}개의 동의서가 전송되었습니다.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error already handled by mutation onError
      console.error("동의서 전송 실패:", err);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg bg-popover shadow-xl border border-border flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            동의서 전송
          </h3>
          {patientName && (
            <p className="text-sm text-muted-foreground mt-1">
              {patientName} 환자에게 전송할 동의서를 선택해주세요.
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isTemplatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                동의서 목록을 불러오는 중...
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                전송 가능한 동의서가 없습니다.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                onClick={handleSelectAll}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedTemplates.size === templates.length
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}
                >
                  {selectedTemplates.size === templates.length && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  전체 선택
                </span>
              </button>

              <div className="h-px bg-border my-2" />

              {/* Template List */}
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted/50 transition-colors text-left border border-border"
                  onClick={() => handleTemplateToggle(template.id)}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      selectedTemplates.has(template.id)
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {selectedTemplates.has(template.id) && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-foreground">{template.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            className="min-w-[72px] rounded-[4px] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            onClick={onClose}
            disabled={isCreating}
          >
            취소
          </button>
          <button
            type="button"
            className="min-w-[72px] rounded-[4px] px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isCreating || selectedTemplates.size === 0 || isTemplatesLoading}
          >
            {isCreating ? "전송 중..." : `전송 (${selectedTemplates.size})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
