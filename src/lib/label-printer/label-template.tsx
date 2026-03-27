"use client";

import { forwardRef, useState, useLayoutEffect, useRef } from "react";
import type { LabelData, Gender } from "./types";
import { calcFontSize } from "./constants";
import { formatBirthDateShort } from "@/lib/date-utils";
import { getAgeOrMonth } from "@/lib/patient-utils";

/**
 * HTML 템플릿 전용 레이아웃 상수
 * 라벨 크기: 400 x 250 px (50mm x 31.25mm)
 */
export const HTML_LABEL_LAYOUT = {
  /** 라벨 너비 (px) */
  PAPER_WIDTH: 400,
  /** 라벨 높이 (px) */
  PAPER_HEIGHT: 250,
  /** 미리보기 해상도 배율 */
  PREVIEW_SCALE: 2,
  /** 프린트 해상도 배율 */
  PRINT_SCALE: 1,
  /** 좌우 여백 */
  PADDING_X: 8,
  /** 하단 여백 */
  PADDING_BOTTOM: 10,
} as const;

const HTML_LAYOUT = HTML_LABEL_LAYOUT;

/**
 * HTML 템플릿 전용 폰트 상수
 */
const BASE_FONT_SIZE = 32; // 기준 폰트사이즈(px)

export const HTML_LABEL_FONT = {
  BASE_SIZE: BASE_FONT_SIZE,
  CHART_NUMBER: { size: calcFontSize(BASE_FONT_SIZE, 1.5), weight: "normal" as const },
  PATIENT_NAME: { size: calcFontSize(BASE_FONT_SIZE, 1.5), weight: "normal" as const },
  PATIENT_DETAIL: { size: calcFontSize(BASE_FONT_SIZE, 1.0), weight: "normal" as const },
  SPECIMEN: { size: calcFontSize(BASE_FONT_SIZE, 1.0), weight: "normal" as const },
  DATETIME: { size: calcFontSize(BASE_FONT_SIZE, 1.0), weight: "normal" as const },
} as const;

const HTML_FONT = HTML_LABEL_FONT;

/**
 * HTML 템플릿 전용 색상
 */
export const HTML_LABEL_COLORS = {
  BACKGROUND: "#FFFFFF",
  TEXT: "#000000",
} as const;

export interface LabelTemplateProps {
  data: LabelData;
}

/**
 * 성별 텍스트 변환
 */
function formatGender(gender: Gender): string {
  return gender === "M" ? "남" : "여";
}

/**
 * 라벨 HTML 템플릿 컴포넌트 (환자 라벨 / 검사 라벨 공용)
 * html-to-image로 이미지로 변환하기 위한 렌더링용 컴포넌트
 *
 * 레이아웃:
 * - 1줄: 차트번호
 * - 2줄: 환자명 (성별)
 * - 3줄: 검체명 (검사 라벨일 때만 표시)
 * - 하단: 좌측 생년월일(나이) / 우측 검사일 또는 출력일
 */
export const LabelTemplate = forwardRef<HTMLDivElement, LabelTemplateProps>(
  function LabelTemplate({ data }, ref) {
    const genderText = formatGender(data.gender);
    const birthDateShort = formatBirthDateShort(data.birthDate);
    const hasSpecimen = Boolean(data.specimenName);

    // 환자 이름이 2줄인지 체크
    const [isTwoLines, setIsTwoLines] = useState(false);
    const patientNameRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(function checkPatientNameLines() {
      if (patientNameRef.current) {
        const lineHeight = HTML_FONT.PATIENT_NAME.size * 1.0;
        const height = patientNameRef.current.scrollHeight;
        const isMultiline = height > lineHeight * 1.5;
        setIsTwoLines(isMultiline);
      }
    }, [data.patientName]);

    // 나이 텍스트가 길어서 전체가 넘치면 나이 폰트만 축소
    const birthAgeContainerRef = useRef<HTMLDivElement>(null);
    const ageSpanRef = useRef<HTMLSpanElement>(null);
    const [ageFontSize, setAgeFontSize] = useState(HTML_FONT.DATETIME.size);
    const ageText = getAgeOrMonth(data.birthDate, "en");

    useLayoutEffect(function fitAgeText() {
      const container = birthAgeContainerRef.current;
      const ageEl = ageSpanRef.current;
      if (!container || !ageEl) return;

      const DEFAULT_SIZE = HTML_FONT.DATETIME.size;
      const MIN_SIZE = 20;
      const STEP = 2;

      let size = DEFAULT_SIZE;
      ageEl.style.fontSize = `${size}px`;
      while (container.scrollWidth > container.clientWidth && size > MIN_SIZE) {
        size -= STEP;
        ageEl.style.fontSize = `${size}px`;
      }
      setAgeFontSize(size);
    }, [data.birthDate, birthDateShort, ageText]);

    // 2줄일 때는 폰트 크기 20% 축소
    const patientNameFontSize = isTwoLines
      ? HTML_FONT.PATIENT_NAME.size * 0.8
      : HTML_FONT.PATIENT_NAME.size;

    const patientDetailFontSize = isTwoLines
      ? HTML_FONT.PATIENT_DETAIL.size * 0.8
      : HTML_FONT.PATIENT_DETAIL.size;

    // 2줄일 때는 gap도 줄여서 공간 확보
    const containerGap = isTwoLines ? "5px" : "10px";

    return (
      <div
        ref={ref}
        className="flex flex-col justify-start overflow-hidden box-border bg-white text-black font-normal leading-none"
        style={{
          width: `${HTML_LAYOUT.PAPER_WIDTH}px`,
          height: `${HTML_LAYOUT.PAPER_HEIGHT}px`,
          padding: `0px ${HTML_LAYOUT.PADDING_X}px ${HTML_LAYOUT.PADDING_BOTTOM}px`,
          gap: containerGap,
        }}
      >
        {/* 1줄: 차트번호 */}
        <div className="overflow-hidden text-center">
          <span style={{ fontSize: `${HTML_FONT.CHART_NUMBER.size}px` }}>
            {data.chartNumber}
          </span>
        </div>

        {/* 2줄: 환자정보 — 이름이 길면 2줄까지 표시 */}
        <div className="flex items-baseline w-full text-center">
          <div
            ref={patientNameRef}
            className="w-full break-all line-clamp-2 text-clip"
            style={{ fontSize: `${patientNameFontSize}px` }}
          >
            {data.patientName}{" "}
            <span style={{ fontSize: `${patientDetailFontSize}px` }}>
              ({genderText})
            </span>
          </div>
        </div>

        {/* 3줄: 검체명 (검사 라벨일 때만 표시) */}
        {hasSpecimen && (
          <div className="overflow-hidden text-center">
            <span
              className="block whitespace-nowrap overflow-hidden text-clip"
              style={{ fontSize: `${HTML_FONT.SPECIMEN.size}px` }}
            >
              {data.specimenName}
            </span>
          </div>
        )}

        {/* 하단: 검사 라벨 — 좌측 생년월일 / 우측 검사일, 환자 라벨 — 생년월일 중앙 정렬 */}
        <div className={`flex w-full items-center mt-auto overflow-hidden ${hasSpecimen ? "justify-between" : "justify-center"}`}>
          {/* 생년월일 (label + value) */}
          <div className={`flex flex-col min-w-0 overflow-hidden ${hasSpecimen ? "flex-1 items-start" : "items-center"}`}>
            <span style={{ fontSize: `${HTML_FONT.DATETIME.size}px` }}>
              생년월일
            </span>
            <div
              ref={birthAgeContainerRef}
              className="w-full overflow-hidden whitespace-nowrap"
              style={{ fontSize: `${HTML_FONT.DATETIME.size}px` }}
            >
              {birthDateShort}<span ref={ageSpanRef} style={{ fontSize: `${ageFontSize}px` }}>({ageText})</span>
            </div>
          </div>
          {/* 우측: 검사일 (검사 라벨일 때만 표시) */}
          {hasSpecimen && (
            <div className="flex flex-col">
              <span style={{ fontSize: `${HTML_FONT.DATETIME.size}px` }}>
                검사일
              </span>
              <span
                className="text-right"
                style={{ fontSize: `${HTML_FONT.DATETIME.size}px` }}
              >
                {data.printDateTime}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
