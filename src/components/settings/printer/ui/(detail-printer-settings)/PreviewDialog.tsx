"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  renderLabelToDataUrlHtml,
  getCurrentPrintDateTime,
} from "@/lib/label-printer";
import type { LabelData } from "@/lib/label-printer";
import type { LabelOptions } from "../../model/basic-printer-settings";
import { OutputTypeCode } from "@/types/printer-types";

// 미리보기 지원 출력 타입 코드 (라벨 타입만 지원)
export const PREVIEW_SUPPORTED_CODES = [
  OutputTypeCode.LABEL,
  OutputTypeCode.EXAM_LABEL,
] as const;

export type PreviewSupportedCode = (typeof PREVIEW_SUPPORTED_CODES)[number];

export function isPreviewSupported(code: string): code is PreviewSupportedCode {
  return PREVIEW_SUPPORTED_CODES.includes(code as PreviewSupportedCode);
}

// 데모 데이터
const DEMO_PATIENT_LABEL_DATA: LabelData = {
  chartNumber: "17",
  patientName: "조연숙",
  age: 55,
  gender: "F",
  birthDate: "1970-11-16",
  printDateTime: "",
};

const DEMO_EXAM_LABEL_DATA: LabelData = {
  chartNumber: "17",
  patientName: "조연숙",
  age: 55,
  gender: "F",
  birthDate: "1970-11-16",
  specimenName: "혈액",
  printDateTime: "",
};

type PreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outputTypeCode: string;
  labelOptions?: LabelOptions;
};

export function PreviewDialog({
  open,
  onOpenChange,
  outputTypeCode,
  labelOptions,
}: PreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    switch (outputTypeCode) {
      case OutputTypeCode.LABEL:
        return "환자 라벨 미리보기";
      case OutputTypeCode.EXAM_LABEL:
        return "검사 라벨 미리보기";
      default:
        return "미리보기";
    }
  }, [outputTypeCode]);

  const renderPreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let dataUrl: string;

      switch (outputTypeCode) {
        case OutputTypeCode.LABEL: {
          const data: LabelData = {
            ...DEMO_PATIENT_LABEL_DATA,
            printDateTime: getCurrentPrintDateTime(),
          };
          dataUrl = await renderLabelToDataUrlHtml(data);
          break;
        }
        case OutputTypeCode.EXAM_LABEL: {
          const data: LabelData = {
            ...DEMO_EXAM_LABEL_DATA,
            printDateTime: getCurrentPrintDateTime(),
          };
          dataUrl = await renderLabelToDataUrlHtml(data);
          break;
        }
        default:
          throw new Error("지원하지 않는 출력 유형입니다.");
      }

      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error("미리보기 렌더링 실패:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }, [outputTypeCode]);

  useEffect(
    function renderOnOpen() {
      if (open) {
        renderPreview();
      } else {
        // 다이얼로그가 닫히면 상태 초기화
        setPreviewUrl(null);
        setError(null);
      }
    },
    [open, renderPreview]
  );

  // top2bottom 설정에 따른 회전 스타일
  const imageStyle = useMemo(() => {
    if (!labelOptions?.top2bottom) {
      return {};
    }
    return {
      transform: "rotate(180deg)",
    };
  }, [labelOptions?.top2bottom]);

  // 라벨 크기 정보 표시
  const labelSizeInfo = useMemo(() => {
    if (!labelOptions) return null;
    const { labelWidthMm, labelHeightMm } = labelOptions;
    if (!labelWidthMm || !labelHeightMm) return null;
    return `${labelWidthMm}mm x ${labelHeightMm}mm`;
  }, [labelOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 설정 정보 표시 */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {labelSizeInfo && <span>라벨 크기: {labelSizeInfo}</span>}
            {labelOptions?.top2bottom && (
              <span className="rounded bg-muted px-2 py-0.5">
                위→아래 출력
              </span>
            )}
          </div>

          {/* 미리보기 영역 */}
          <div className="rounded-lg bg-muted/50 p-4 flex items-center justify-center min-h-[200px]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">렌더링 중...</span>
              </div>
            ) : error ? (
              <div className="text-destructive text-sm">{error}</div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={title}
                className="border border-border bg-white shadow-sm"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  ...imageStyle,
                }}
              />
            ) : null}
          </div>

          {/* 안내 문구 */}
          <p className="text-xs text-muted-foreground text-center">
            실제 출력물은 프린터 및 용지 설정에 따라 다르게 보일 수 있습니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
