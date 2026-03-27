"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface SignatureModalProps {
  open: boolean;
  consentId: string;
  fieldId: string;
  onClose: () => void;
  onSaved?: (fieldId: string) => void;
}

export default function SignatureModal({
  open,
  consentId,
  fieldId,
  onClose,
  onSaved,
}: SignatureModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [canvasScale, setCanvasScale] = useState({ x: 1, y: 1 });
  const [isBlank, setIsBlank] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartRef = useRef<number | null>(null);

  const storageKey = useMemo(
    () => `consent-signature-${consentId}-${fieldId}`,
    [consentId, fieldId]
  );

  useEffect(() => {
    if (!open) return;
    const stored = window.sessionStorage.getItem(storageKey);
    setIsBlank(!stored);
    if (!stored || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = stored;
  }, [open, storageKey]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0b0f1a";
  }, []);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const nextWidth = Math.round(rect.width * ratio);
      const nextHeight = Math.round(rect.height * ratio);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineWidth = 26;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#0b0f1a";
      }
      setCanvasScale({
        x: canvas.width / rect.width,
        y: canvas.height / rect.height,
      });
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [open]);

  const handleStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvasScale.x;
    const y = (event.clientY - rect.top) * canvasScale.y;
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  // window 레벨 리스너로 캔버스 밖에서도 드로잉 추적
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!isDrawingRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * canvasScale.x;
      const y = (event.clientY - rect.top) * canvasScale.y;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const onPointerUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      setIsDrawing(false);
      setIsBlank(isCanvasBlank());
      // 드로잉 종료 시 캔버스 포커스 해제 → iOS에서 다음 탭이 바로 클릭으로 동작
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [open, canvasScale]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.sessionStorage.removeItem(storageKey);
    setIsBlank(true);
  };

  const isCanvasBlank = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return false;
    }
    return true;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isCanvasBlank()) {
      window.sessionStorage.removeItem(storageKey);
      setIsBlank(true);
    } else {
      const dataUrl = canvas.toDataURL("image/png");
      window.sessionStorage.setItem(storageKey, dataUrl);
      setIsBlank(false);
    }
    onSaved?.(fieldId);
    onClose();
  };

  const handleSheetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSheet(true);
    dragStartRef.current = event.clientY;
  };

  const handleSheetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheet || dragStartRef.current === null) return;
    const delta = event.clientY - dragStartRef.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleSheetPointerUp = () => {
    if (!isDraggingSheet) return;
    if (dragOffset > 140) {
      onClose();
    } else {
      setDragOffset(0);
    }
    setIsDraggingSheet(false);
    dragStartRef.current = null;
  };

  if (!open) return null;

  return (
    <div
      className="signature-modal"
      onClick={onClose}
      onTouchMove={(event) => event.preventDefault()}
      onWheel={(event) => event.preventDefault()}
    >
      <div
        className="signature-sheet"
        style={{ transform: `translateY(${dragOffset}px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="signature-handle"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
        />
        <div className="signature-title">아래 영역에 손가락 또는 펜으로 서명해 주세요</div>
        <div className="signature-canvas-wrap">
          {isBlank && !isDrawing && (
            <span className="signature-placeholder">여기에 서명을 해주세요</span>
          )}
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            width={720}
            height={240}
            tabIndex={-1}
            onPointerDown={handleStart}
          />
        </div>
        <div className="signature-actions">
          <button
            type="button"
            className="secondary"
            onTouchEnd={(e) => { e.preventDefault(); handleClear(); }}
            onClick={handleClear}
          >
            <img
              className="signature-action-icon"
              src="/icon/ic_refresh_16.svg"
              alt=""
              aria-hidden="true"
            />
            다시 쓰기
          </button>
          <button
            type="button"
            className="primary"
            onTouchEnd={(e) => { if (!isBlank) { e.preventDefault(); handleSave(); } }}
            onClick={handleSave}
            disabled={isBlank}
          >
            서명 완료
          </button>
        </div>
      </div>
      <style jsx>{`
        .signature-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: flex-end;
          z-index: 50;
          animation: fade-in 260ms ease-out;
          touch-action: manipulation;
        }
        .signature-sheet {
          width: 100%;
          height: calc(100dvh - 160px);
          background: #ffffff;
          border-radius: 12px 12px 0 0;
          padding: 12px 16px 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: transform 0.2s ease-out;
          animation: slide-up 320ms ease-out;
          touch-action: pan-y;
        }
        .signature-handle {
          width: 40px;
          height: 4px;
          border-radius: 999px;
          background: #e5e7eb;
          align-self: center;
          margin-bottom: 16px;
        }
        .signature-title {
          color: var(--Gray-100_171719, #171719);
          font-feature-settings: "case" on, "cpsp" on;
          font-family: "Pretendard", sans-serif;
          font-size: 18px;
          font-style: normal;
          font-weight: 600;
          line-height: 140%;
          letter-spacing: -0.18px;
          text-align: left;
          margin-bottom: 32px;
        }
        .signature-canvas-wrap {
          width: 100%;
          height: 220px;
          display: flex;
          padding: 16px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          flex: 1 0 0;
          align-self: stretch;
          border-radius: 6px;
          border: 0 solid var(--Line-border-1_EAEBEC, #dbdcdf);
          background: var(--Background-bg-1_F7F7F8, #f7f7f8);
          margin-bottom: 16px;
          position: relative;
          box-sizing: border-box;
        }
        .signature-canvas {
          width: 100%;
          height: 100%;
          display: block;
          touch-action: none;
        }
        .signature-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--Gray-500_989BA2, #989ba2);
          text-align: center;
          font-family: "Pretendard", sans-serif;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 125%;
          letter-spacing: -0.14px;
          pointer-events: none;
        }
        .signature-actions {
          display: flex;
          padding: var(--Margin-Action-Normal-Vertical, 16px)
            0;
          flex-direction: row;
          align-items: center;
          gap: 16px;
          align-self: stretch;
        }
        .signature-actions button {
          display: flex;
          height: 56px;
          min-width: 64px;
          padding: 8px 12px;
          justify-content: center;
          align-items: center;
          gap: 4px;
          flex: 1 0 0;
          border-radius: 8px;
          border: none;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          touch-action: manipulation;
        }
        .signature-actions .secondary {
          border: 1px solid var(--Line-border-2_DBDCDF, #c2c4c8);
          background: var(--Gray-White, #fff);
          color: #111827;
        }
        .signature-actions .primary {
          border-radius: 8px;
          background: var(--Primary-Main-Color, #180f38);
          overflow: hidden;
          color: var(--Gray-White, #fff);
          text-align: center;
          text-overflow: ellipsis;
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.16px;
        }
        .signature-actions .primary:disabled {
          border-radius: 8px;
          background: var(--Background-bg-3_EAEBEC, #eaebec);
          overflow: hidden;
          color: var(--Gray-500_989BA2, #989ba2);
          text-align: center;
          text-overflow: ellipsis;
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.16px;
          cursor: not-allowed;
        }
        .signature-action-icon {
          width: 16px;
          height: 16px;
          aspect-ratio: 1 / 1;
          display: block;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
