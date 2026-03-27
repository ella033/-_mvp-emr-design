"use client";

import { MedicalRecordRendererType, splitMedicalRecordByItemType } from "./types";
import type { MedicalRecordData } from "./types";

// HTML 방식 렌더러
import {
  renderMedicalRecordToDataUrlHtml,
  renderMedicalRecordToDataUrlForPrintHtml,
  renderMedicalRecordToBase64Html,
  getMedicalRecordImageInfoHtml,
} from "./medical-record-html-renderer";

/**
 * 현재 사용할 렌더러 타입 (HTML 방식만 지원)
 */
const CURRENT_RENDERER_TYPE: MedicalRecordRendererType = MedicalRecordRendererType.Html;

/**
 * 렌더러 인터페이스
 */
export interface MedicalRecordRenderer {
  /** 미리보기용 Data URL 렌더링 */
  renderToDataUrl: (data: MedicalRecordData) => string | Promise<string>;
  /** 프린트용 Data URL 렌더링 */
  renderToDataUrlForPrint: (data: MedicalRecordData) => string | Promise<string>;
  /** 프린트용 Base64 렌더링 */
  renderToBase64: (data: MedicalRecordData) => string | Promise<string>;
  /** 이미지 정보 가져오기 */
  getImageInfo: (
    data: MedicalRecordData
  ) => { width: number; height: number; scale: number } | Promise<{ width: number; height: number; scale: number }>;
}

/**
 * HTML 렌더러 (비동기)
 */
const htmlRenderer: MedicalRecordRenderer = {
  renderToDataUrl: renderMedicalRecordToDataUrlHtml,
  renderToDataUrlForPrint: renderMedicalRecordToDataUrlForPrintHtml,
  renderToBase64: renderMedicalRecordToBase64Html,
  getImageInfo: getMedicalRecordImageInfoHtml,
};

/**
 * 렌더러 반환 (HTML 방식만 지원)
 */
export function getMedicalRecordRenderer(
  _type: MedicalRecordRendererType = CURRENT_RENDERER_TYPE
): MedicalRecordRenderer {
  return htmlRenderer;
}

/**
 * 현재 설정된 렌더러 타입 반환
 */
export function getCurrentRendererType(): MedicalRecordRendererType {
  return CURRENT_RENDERER_TYPE;
}

/**
 * 통합 렌더링 함수들 - 현재 설정된 렌더러 타입에 따라 자동 전환
 */

/**
 * 미리보기용 Data URL 렌더링
 */
export async function renderMedicalRecord(data: MedicalRecordData): Promise<string> {
  const renderer = getMedicalRecordRenderer();
  return await Promise.resolve(renderer.renderToDataUrl(data));
}

/**
 * 프린트용 Data URL 렌더링
 */
export async function renderMedicalRecordForPrint(data: MedicalRecordData): Promise<string> {
  const renderer = getMedicalRecordRenderer();
  return await Promise.resolve(renderer.renderToDataUrlForPrint(data));
}

/**
 * 프린트용 Base64 렌더링
 */
export async function renderMedicalRecordBase64(data: MedicalRecordData): Promise<string> {
  const renderer = getMedicalRecordRenderer();
  return await Promise.resolve(renderer.renderToBase64(data));
}

/**
 * 이미지 정보 가져오기
 */
export async function getMedicalRecordInfo(
  data: MedicalRecordData
): Promise<{ width: number; height: number; scale: number }> {
  const renderer = getMedicalRecordRenderer();
  return await Promise.resolve(renderer.getImageInfo(data));
}

/**
 * 특정 렌더러 타입으로 미리보기용 Data URL 렌더링
 */
export async function renderMedicalRecordWith(
  data: MedicalRecordData,
  rendererType: MedicalRecordRendererType
): Promise<string> {
  const renderer = getMedicalRecordRenderer(rendererType);
  return await Promise.resolve(renderer.renderToDataUrl(data));
}

/**
 * 특정 렌더러 타입으로 프린트용 Data URL 렌더링
 */
export async function renderMedicalRecordForPrintWith(
  data: MedicalRecordData,
  rendererType: MedicalRecordRendererType
): Promise<string> {
  const renderer = getMedicalRecordRenderer(rendererType);
  return await Promise.resolve(renderer.renderToDataUrlForPrint(data));
}

/**
 * 처방구분별로 분리하여 다중 페이지 미리보기용 Data URL 렌더링
 */
export async function renderMedicalRecordPages(data: MedicalRecordData): Promise<string[]> {
  const pages = splitMedicalRecordByItemType(data);
  return Promise.all(pages.map((p) => renderMedicalRecord(p)));
}
