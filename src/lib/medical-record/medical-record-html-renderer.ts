"use client";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { POS_PRINT_CONFIG } from "./constants";
import type { MedicalRecordData, MedicalRecordRenderResult } from "./types";
import { MedicalRecordTemplate, HTML_TEMPLATE_LAYOUT } from "./medical-record-template";

/**
 * HTML 기반 진료기록부 렌더링 - 미리보기용 Data URL 반환
 */
export async function renderMedicalRecordToDataUrlHtml(
  data: MedicalRecordData
): Promise<string> {
  const result = await renderMedicalRecordHtml(data, {
    pixelRatio: HTML_TEMPLATE_LAYOUT.PREVIEW_SCALE,
    forPrint: false,
  });
  return result.dataUrl;
}

/**
 * HTML 기반 진료기록부 렌더링 - 프린트용 Data URL 반환
 */
export async function renderMedicalRecordToDataUrlForPrintHtml(
  data: MedicalRecordData
): Promise<string> {
  const result = await renderMedicalRecordHtml(data, {
    pixelRatio: HTML_TEMPLATE_LAYOUT.PRINT_SCALE,
    forPrint: true,
  });
  return result.dataUrl;
}

/**
 * HTML 기반 진료기록부 렌더링 - 프린트용 Base64 반환
 */
export async function renderMedicalRecordToBase64Html(
  data: MedicalRecordData
): Promise<string> {
  const dataUrl = await renderMedicalRecordToDataUrlForPrintHtml(data);
  return dataUrl.replace(/^data:image\/png;base64,/, "");
}

/**
 * HTML 기반 진료기록부 이미지 정보 반환
 */
export async function getMedicalRecordImageInfoHtml(
  data: MedicalRecordData
): Promise<{ width: number; height: number; scale: number }> {
  const pixelRatio = HTML_TEMPLATE_LAYOUT.PREVIEW_SCALE;
  const result = await renderMedicalRecordHtml(data, {
    pixelRatio,
    forPrint: false,
  });
  return {
    width: result.width,
    height: result.height,
    scale: pixelRatio,
  };
}

interface RenderOptions {
  /** 이미지 픽셀 비율 (1 = 원본 크기, 2 = 2배 해상도) */
  pixelRatio: number;
  forPrint: boolean;
}

/**
 * HTML 템플릿을 렌더링하고 이미지로 변환
 */
async function renderMedicalRecordHtml(
  data: MedicalRecordData,
  options: RenderOptions
): Promise<MedicalRecordRenderResult> {
  const { pixelRatio, forPrint } = options;

  // 기본 너비 (HTML 템플릿 전용 상수 사용)
  const baseWidth = HTML_TEMPLATE_LAYOUT.PAPER_WIDTH;

  // 오프스크린 컨테이너 생성
  // visibility: hidden은 html-to-image가 캡처하지 못하므로 사용하지 않음
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "-10000px",
    width: `${baseWidth}px`,
    overflow: "visible",
    backgroundColor: "#FFFFFF",
    zIndex: "-1",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(container);

  try {
    // React 컴포넌트를 HTML 문자열로 렌더링 (scale 없음)
    const templateElement = createElement(MedicalRecordTemplate, { data });
    const htmlString = renderToStaticMarkup(templateElement);

    // HTML 문자열을 DOM에 삽입
    container.innerHTML = htmlString;

    // 브라우저 레이아웃 계산 대기
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // 렌더링된 요소 가져오기
    const renderedElement = container.firstElementChild as HTMLElement;
    if (!renderedElement) {
      throw new Error("진료기록부 템플릿 렌더링 실패");
    }

    // 요소 크기 확인
    const elementWidth = renderedElement.offsetWidth || baseWidth;
    const elementHeight = renderedElement.offsetHeight || 800;

    // html-to-image로 이미지 변환 (pixelRatio로 해상도 조절)
    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(renderedElement, {
      pixelRatio, // 이미지 해상도 배율
      backgroundColor: "#FFFFFF",
      width: elementWidth,
      height: elementHeight,
    });

    const imageSize = await getImageSize(dataUrl);

    // 프린트용인 경우 이진화 처리
    const finalDataUrl = forPrint
      ? await binarizeImage(dataUrl, POS_PRINT_CONFIG.THRESHOLD)
      : dataUrl;

    return {
      dataUrl: finalDataUrl,
      width: imageSize.width,
      height: imageSize.height,
    };
  } finally {
    // 컨테이너 정리
    container.innerHTML = "";
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * 이미지 크기 가져오기
 */
function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/**
 * 이미지 이진화 (POS 프린터용)
 */
async function binarizeImage(dataUrl: string, threshold: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context를 가져올 수 없습니다."));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const safeThreshold = Math.max(0, Math.min(255, threshold));

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 255;
        const g = data[i + 1] ?? 255;
        const b = data[i + 2] ?? 255;
        const a = data[i + 3] ?? 255;

        if (a === 0) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
          continue;
        }

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const value = luminance >= safeThreshold ? 255 : 0;

        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = dataUrl;
  });
}
