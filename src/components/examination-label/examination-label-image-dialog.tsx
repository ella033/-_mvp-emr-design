"use client";

/**
 * 검사 라벨 이미지 테스트 다이얼로그 컴포넌트
 *
 * 라벨을 이미지로 렌더링하여 미리보기 및 로컬 프린터 출력을 테스트합니다.
 * Bixolon Web SDK의 drawBitmap 기능을 사용하여 이미지를 프린터로 출력합니다.
 */

import { useEffect, useState, useCallback } from "react";
import { ImageIcon, PrinterIcon, ExternalLinkIcon, CopyIcon, CheckIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExaminationLabelPrint } from "@/hooks/examination-label";
import { SpecimenListItem } from "./specimen-list-item";
import { SpecimenSelector } from "./specimen-selector";
import {
  renderLabelToDataUrlHtml,
  renderLabelToBase64Html,
  renderLabelToDataUrlForPrintHtml,
  createLabelData,
  clearBuffer,
  setWidth,
  setLength,
  drawBitmap,
  printBuffer,
  requestPrint,
  setLabelId,
  LABEL_SIZE,
} from "@/lib/label-printer";
import type { PrintResult } from "@/lib/label-printer";

interface ExaminationLabelImageDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 진료 ID */
  encounterId: string;
  /** 로컬 프린터 이름 (SDK Logical Name) */
  printerName?: string;
  /** 출력 완료 콜백 */
  onPrintComplete?: (result: PrintResult) => void;
}

/** 라벨 발행 ID 카운터 */
let imageLabelId = 1000;

/**
 * bitmap 이미지 출력 보정 스케일
 *
 * XD5-40d 환경에서 `drawBitmap` 출력이 전체적으로 축소되어 나오는 케이스가 있어,
 * 이미지 방식 출력 경로에서만 dots 기준을 2배로 잡아 실물 라벨 크기(40x25mm)에 맞춥니다.
 */
const BITMAP_PRINT_SCALE = 2 as const;

export function ExaminationLabelImageDialog({
  open,
  onOpenChange,
  encounterId,
  printerName: initialPrinterName = "Printer1",
  onPrintComplete,
}: ExaminationLabelImageDialogProps) {
  const [copied, setCopied] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [printerName, setPrinterName] = useState(initialPrinterName);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 상태
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [base64Size, setBase64Size] = useState(0);

  const {
    patient,
    printItems,
    specimenMaster,
    totalQuantity,
    updateQuantity,
    addSpecimen,
    removeSpecimen,
    refresh,
  } = useExaminationLabelPrint({ encounterId });

  // 미리보기 이미지 렌더링
  const renderPreview = useCallback(async () => {
    if (!patient || printItems.length === 0) {
      setPreviewImageUrl(null);
      setBase64Size(0);
      return;
    }

    const selectedSpecimen = printItems[selectedPreviewIndex] ?? printItems[0];
    if (!selectedSpecimen) {
      setPreviewImageUrl(null);
      setBase64Size(0);
      return;
    }

    try {
      const labelData = createLabelData(patient, selectedSpecimen.specimenName);
      const [dataUrl, base64] = await Promise.all([
        renderLabelToDataUrlHtml(labelData),
        renderLabelToBase64Html(labelData),
      ]);
      setPreviewImageUrl(dataUrl);
      setBase64Size(base64.length);
    } catch (err) {
      console.error("미리보기 렌더링 실패:", err);
    }
  }, [patient, printItems, selectedPreviewIndex]);

  // 다이얼로그 열릴 때 데이터 새로고침
  useEffect(
    function refreshOnOpen() {
      if (open) {
        refresh();
        setSelectedPreviewIndex(0);
        setCopied(false);
        setError(null);
        setPrinterName(initialPrinterName);
      }
    },
    [open, refresh, initialPrinterName]
  );

  // 미리보기 업데이트
  useEffect(
    function updatePreview() {
      renderPreview();
    },
    [renderPreview]
  );

  // 로컬 프린터로 이미지 출력 (Bixolon SDK drawBitmap 사용)
  const handlePrint = async () => {
    if (!patient) {
      setError("환자 정보가 없습니다.");
      return;
    }

    if (!printerName) {
      setError("프린터 이름을 입력해주세요.");
      return;
    }

    if (printItems.length === 0) {
      setError("출력할 검체가 없습니다.");
      return;
    }

    setError(null);
    setIsPrinting(true);

    let totalPrinted = 0;
    const totalLabels = printItems.reduce((sum, item) => sum + item.quantity, 0);

    try {
      for (const item of printItems) {
        for (let i = 0; i < item.quantity; i++) {
          // 라벨 데이터 생성 및 이미지 렌더링 (프린터용 1:1 비율)
          const labelData = createLabelData(patient, item.specimenName);
          // Bixolon SDK drawBitmap은 data:image/png;base64,... 형식을 기대함
          const imageDataUrl = await renderLabelToDataUrlForPrintHtml(labelData);

          // Bixolon SDK 버퍼 초기화
          setLabelId(imageLabelId++);
          clearBuffer();
          const widthDots = LABEL_SIZE.WIDTH_DOTS * BITMAP_PRINT_SCALE;
          const heightDots = LABEL_SIZE.HEIGHT_DOTS * BITMAP_PRINT_SCALE;
          const gapDots = LABEL_SIZE.GAP_DOTS * BITMAP_PRINT_SCALE;

          setWidth(widthDots);
          setLength(heightDots, gapDots, "G", 0);

          // 이미지 그리기 (좌표 0,0에서 시작)
          // 참고: Bixolon drawBitmap(data, x, y, width, dither)
          // bitmap 출력이 축소되는 케이스가 있어 width를 2배로 보정
          // dither=0: 글자(고대비) 선명도 개선 목적
          drawBitmap(imageDataUrl, 0, 0, widthDots, 0);

          // 출력 버퍼 완료
          printBuffer();

          // 프린터로 출력 요청
          const result = await requestPrint(printerName);

          if (result.success) {
            totalPrinted++;
          } else {
            setError(`출력 실패 (${totalPrinted}/${totalLabels}): ${result.message}`);
            setIsPrinting(false);
            return;
          }
        }
      }

      const successResult: PrintResult = {
        success: true,
        message: `총 ${totalPrinted}장 이미지 출력 완료`,
      };

      onPrintComplete?.(successResult);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "출력 요청 실패");
    } finally {
      setIsPrinting(false);
    }
  };

  // 미리보기 이미지 새 탭에서 열기
  const handleOpenPreview = () => {
    if (previewImageUrl) {
      window.open(previewImageUrl, "_blank");
    }
  };

  // Base64 복사
  const handleCopyBase64 = async () => {
    if (!patient || printItems.length === 0) return;

    const selectedSpecimen = printItems[selectedPreviewIndex] ?? printItems[0];
    if (!selectedSpecimen) return;

    const labelData = createLabelData(patient, selectedSpecimen.specimenName);
    const base64 = await renderLabelToBase64Html(labelData);

    await navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!isPrinting) {
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    if (!isPrinting) {
      onOpenChange(false);
    }
  };

  // 출력 가능 여부
  const canPrint = printItems.length > 0 && totalQuantity > 0 && !!printerName;

  // 성별 표시
  const genderDisplay = patient?.gender === "M" ? "남" : "여";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            라벨 이미지 출력
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              이미지 방식
            </span>
          </DialogTitle>
          <DialogDescription>
            라벨을 이미지로 렌더링하여 Bixolon SDK를 통해 로컬 프린터로 출력합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 환자 정보 */}
        {patient && (
          <div className="space-y-1 rounded-md border bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">차트번호:</span>
              <span className="font-medium">{patient.chartNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">환자명:</span>
              <span className="font-medium">
                {patient.patientName} ({patient.age}/{genderDisplay})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">생년월일:</span>
              <span className="font-medium">{patient.birthDate}</span>
            </div>
          </div>
        )}

        {/* 라벨 이미지 미리보기 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">라벨 미리보기</h4>
            {printItems.length > 1 && (
              <div className="flex items-center gap-1">
                {printItems.map((item, index) => (
                  <button
                    key={item.specimenCode}
                    onClick={() => setSelectedPreviewIndex(index)}
                    className={`rounded px-2 py-0.5 text-xs transition-colors ${selectedPreviewIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-center rounded-md border bg-gray-50 p-4">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt="Label Preview"
                className="border border-gray-300 bg-white"
                style={{ width: 320, height: 200 }}
              />
            ) : (
              <div
                className="flex items-center justify-center border border-dashed border-gray-300 bg-white text-sm text-muted-foreground"
                style={{ width: 320, height: 200 }}
              >
                검체를 선택하면 미리보기가 표시됩니다
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {printItems[selectedPreviewIndex]?.specimenName ?? "검체 없음"}
            </span>
            <span>
              크기: {(base64Size / 1024).toFixed(1)} KB • 640×400 픽셀
            </span>
          </div>
        </div>

        {/* 이미지 액션 버튼 */}
        <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPreview}
            disabled={!previewImageUrl}
          >
            <ExternalLinkIcon className="mr-1.5 size-4" />
            새 탭에서 열기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBase64}
            disabled={!previewImageUrl}
          >
            {copied ? (
              <CheckIcon className="mr-1.5 size-4 text-green-600" />
            ) : (
              <CopyIcon className="mr-1.5 size-4" />
            )}
            {copied ? "복사됨!" : "Base64 복사"}
          </Button>
        </div>

        {/* 프린터 설정 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">프린터 이름 (SDK Logical Name)</label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="예: Printer1"
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={isPrinting}
          />
          <p className="text-xs text-muted-foreground">
            Bixolon Web Print SDK App에 등록된 프린터의 Logical Name을 입력하세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {/* 검체 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">출력 검체</h4>
            <span className="text-xs text-muted-foreground">총 {totalQuantity}장</span>
          </div>

          {/* 검체 아이템 목록 */}
          <div className="max-h-[120px] space-y-2 overflow-y-auto">
            {printItems.length === 0 ? (
              <div className="flex items-center justify-center rounded-md border border-dashed py-4 text-sm text-muted-foreground">
                출력할 검체가 없습니다.
              </div>
            ) : (
              printItems.map((item) => (
                <SpecimenListItem
                  key={item.specimenCode}
                  specimen={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeSpecimen}
                />
              ))
            )}
          </div>

          {/* 검체 추가 드롭다운 */}
          <SpecimenSelector
            specimens={specimenMaster}
            selectedSpecimens={printItems}
            onSelect={addSpecimen}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPrinting}>
            취소
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!canPrint || isPrinting}
          >
            <PrinterIcon className="mr-1.5 size-4" />
            {isPrinting ? "출력 중..." : `이미지 출력 (${totalQuantity}장)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
