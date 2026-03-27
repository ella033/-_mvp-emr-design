"use client";

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { FITTY_SETTLE_DELAY_MS } from "./constants";
import type { LabelData } from "./types";
import { LabelTemplate, HTML_LABEL_LAYOUT } from "./label-template";

/**
 * 비트맵 출력 최적화 설정
 */
const BITMAP_PRINT_CONFIG = {
  /** 이진화 임계값 (0~255) - 값이 클수록 글자가 조금 더 두꺼워짐 */
  THRESHOLD: 210,
} as const;

interface RenderOptions {
  /** 이미지 픽셀 비율 (1 = 원본 크기, 2 = 2배 해상도) */
  pixelRatio: number;
  /** 프린트용 여부 (true면 이진화 처리) */
  forPrint: boolean;
}

interface LabelRenderResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * HTML 기반 라벨 렌더링 - 미리보기용 Data URL 반환
 */
export async function renderLabelToDataUrlHtml(
  data: LabelData
): Promise<string> {
  const result = await renderLabelHtml(data, {
    pixelRatio: HTML_LABEL_LAYOUT.PREVIEW_SCALE,
    forPrint: false,
  });
  return result.dataUrl;
}

/**
 * HTML 기반 라벨 렌더링 - 프린트용 Data URL 반환
 */
export async function renderLabelToDataUrlForPrintHtml(
  data: LabelData
): Promise<string> {
  const result = await renderLabelHtml(data, {
    pixelRatio: HTML_LABEL_LAYOUT.PREVIEW_SCALE,
    forPrint: true,
  });
  return result.dataUrl;
}

/**
 * HTML 기반 라벨 렌더링 - 프린트용 Base64 반환
 */
export async function renderLabelToBase64Html(
  data: LabelData
): Promise<string> {
  const dataUrl = await renderLabelToDataUrlForPrintHtml(data);
  return dataUrl.replace(/^data:image\/png;base64,/, "");
}

/**
 * HTML 기반 라벨 이미지 정보 반환
 */
export async function getLabelImageInfoHtml(
  data: LabelData
): Promise<{ width: number; height: number; scale: number }> {
  const pixelRatio = HTML_LABEL_LAYOUT.PREVIEW_SCALE;
  const result = await renderLabelHtml(data, {
    pixelRatio,
    forPrint: false,
  });
  return {
    width: result.width,
    height: result.height,
    scale: pixelRatio,
  };
}

/**
 * HTML 템플릿을 렌더링하고 이미지로 변환
 *
 * createRoot + flushSync를 사용하여 React 라이프사이클(useLayoutEffect)을 실행하고,
 * react-fitty(fitty)가 텍스트 크기를 자동 조정할 수 있도록 합니다.
 */
async function renderLabelHtml(
  data: LabelData,
  options: RenderOptions
): Promise<LabelRenderResult> {
  const { pixelRatio, forPrint } = options;

  const baseWidth = HTML_LABEL_LAYOUT.PAPER_WIDTH;
  const baseHeight = HTML_LABEL_LAYOUT.PAPER_HEIGHT;

  // 오프스크린 컨테이너 생성
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "-10000px",
    width: `${baseWidth}px`,
    height: `${baseHeight}px`,
    overflow: "visible",
    backgroundColor: "#FFFFFF",
    zIndex: "-1",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // React의 렌더링 컨텍스트(useEffect 등)에서 호출될 수 있으므로,
    // 새로운 macrotask에서 flushSync를 실행하여 React 렌더링 충돌 방지
    await new Promise((resolve) => setTimeout(resolve, 0));

    // React 컴포넌트를 DOM에 마운트 (flushSync로 동기 렌더링)
    // useLayoutEffect가 실행되어 fitty가 초기화됨
    const templateElement = createElement(LabelTemplate, { data });
    flushSync(() => {
      root.render(templateElement);
    });

    // fitty의 setTimeout(fit, 0) 실행 대기
    await new Promise((resolve) => setTimeout(resolve, FITTY_SETTLE_DELAY_MS));

    // 브라우저 레이아웃 재계산 대기
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
      throw new Error("라벨 템플릿 렌더링 실패");
    }

    // html-to-image로 이미지 변환
    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(renderedElement, {
      pixelRatio,
      backgroundColor: "#FFFFFF",
      width: baseWidth,
      height: baseHeight,
    });

    const imageSize = await getImageSize(dataUrl);

    // 프린트용인 경우 이진화 처리
    const finalDataUrl = forPrint
      ? await binarizeImage(dataUrl, BITMAP_PRINT_CONFIG.THRESHOLD)
      : dataUrl;

    return {
      dataUrl: finalDataUrl,
      width: imageSize.width,
      height: imageSize.height,
    };
  } finally {
    // React 트리 언마운트 및 컨테이너 정리
    root.unmount();
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
 * 이미지 이진화 (라벨 프린터용)
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

        // ITU-R BT.709
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
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

/**
 * 여러 라벨을 HTML 방식으로 Base64 배열로 렌더링
 */
export async function renderLabelsToBase64ArrayHtml(
  labelDataList: LabelData[]
): Promise<string[]> {
  const results: string[] = [];
  for (const data of labelDataList) {
    const base64 = await renderLabelToBase64Html(data);
    results.push(base64);
  }
  return results;
}
