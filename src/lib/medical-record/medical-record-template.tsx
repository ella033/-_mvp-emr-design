"use client";

import { forwardRef } from "react";
import { InputType } from "@/types/chart/order-types";
import { PrescriptionType } from "@/constants/master-data-enum";
import type { 진료기록부데이터 } from "./types";

/**
 * 기본 간격 단위 - 이 값을 조절하면 전체 행간이 비례적으로 변경됨
 */
const BASE_GAP = 4;

/**
 * HTML 템플릿 전용 레이아웃 상수
 * Canvas 방식과 독립적으로 관리
 */
export const HTML_TEMPLATE_LAYOUT = {
  /** 기본 간격 단위 */
  BASE_GAP,
  /** 용지 너비 (px) */
  PAPER_WIDTH: 520,
  /** 미리보기 해상도 배율 */
  PREVIEW_SCALE: 2,
  /** 프린트 해상도 배율 */
  PRINT_SCALE: 1,
  /** 좌측 여백 */
  MARGIN_LEFT: 0,
  /** 우측 여백 */
  MARGIN_RIGHT: 24,
  /** 상단/하단 여백 (BASE_GAP * 4.5) */
  MARGIN_Y: BASE_GAP * 4.5,
  /** 줄 간격 (BASE_GAP * 1.5) */
  LINE_GAP: BASE_GAP * 1.5,
  /** 섹션 간격 (BASE_GAP * 3) */
  SECTION_GAP: BASE_GAP * 3,
  /** 디바이더 여백 (BASE_GAP * 2.5) */
  DIVIDER_GAP: BASE_GAP * 2.5,
  /** 디바이더 두께 */
  DIVIDER_THICKNESS: 2,
  /** 테이블 헤더 간격 (BASE_GAP * 1.5) */
  TABLE_HEADER_GAP: BASE_GAP * 1.5,
  /** 푸터 간격 (BASE_GAP * 3) */
  FOOTER_GAP: BASE_GAP * 3,
  /** 행 간격 (BASE_GAP * 1) */
  ROW_GAP: BASE_GAP,
  /** 요소 간 간격 (BASE_GAP * 4) */
  ELEMENT_GAP: BASE_GAP * 4,
  /** 작은 요소 간 간격 (BASE_GAP * 2) */
  ELEMENT_GAP_SM: BASE_GAP * 2,
  /** 타이틀 좌측 마진 (BASE_GAP * 3.75) */
  TITLE_MARGIN_LEFT: BASE_GAP * 3.75,
  /** 약품명 최대 줄 수 */
  MAX_NAME_LINES: 2,
};

// 내부 사용을 위한 축약 참조
const HTML_LAYOUT = HTML_TEMPLATE_LAYOUT;

/**
 * HTML 템플릿 전용 폰트 상수
 */
export const HTML_TEMPLATE_FONT = {
  FAMILY: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  /** 자간 (px) - 음수로 설정하면 글자 간격이 좁아짐 */
  LETTER_SPACING: -1,
  TITLE: { size: 48, weight: "bold" as const }, // 32 * 1.5 = 48
  PATIENT_NAME: { size: 36, weight: "bold" as const }, // 24 * 1.5 = 36
  BODY: { size: 26, weight: "normal" as const }, // 18 * 1.5 = 27
  SMALL: { size: 24, weight: "normal" as const }, // 16 * 1.5 = 24
};

const HTML_FONT = HTML_TEMPLATE_FONT;

/**
 * HTML 템플릿 전용 테이블 컬럼 너비
 */
export const HTML_TEMPLATE_TABLE = {
  COLUMN_GAP: 20,
  NAME_WIDTH: 300,
  DOSE_WIDTH: 50,
  TIMES_WIDTH: 50,
  DAYS_WIDTH: 50,
  USAGE_WIDTH: 60,
} as const;

const HTML_TABLE = HTML_TEMPLATE_TABLE;

/**
 * HTML 템플릿 전용 색상
 */
export const HTML_TEMPLATE_COLORS = {
  BACKGROUND: "#FFFFFF",
  TEXT: "#000000",
  DIVIDER: "#000000",
} as const;

const HTML_COLORS = HTML_TEMPLATE_COLORS;

export interface MedicalRecordTemplateProps {
  data: 진료기록부데이터;
}

/**
 * 진료기록부 HTML 템플릿 컴포넌트
 * html-to-image로 이미지로 변환하기 위한 렌더링용 컴포넌트
 * 
 * 스케일은 이 컴포넌트에서 처리하지 않고, 이미지 변환 시 pixelRatio로 처리합니다.
 */
export const MedicalRecordTemplate = forwardRef<HTMLDivElement, MedicalRecordTemplateProps>(
  function MedicalRecordTemplate({ data }, ref) {
    const { 헤더, 환자, 의사이름, 처방목록 } = data;
    const hasOrders = 처방목록.length > 0;
    const isDrugPage = 처방목록.some((item) => item.처방구분 === PrescriptionType.drug);

    return (
      <div
        ref={ref}
        style={{
          width: `${HTML_LAYOUT.PAPER_WIDTH}px`,
          backgroundColor: HTML_COLORS.BACKGROUND,
          color: HTML_COLORS.TEXT,
          fontFamily: HTML_FONT.FAMILY,
          lineHeight: 1,
          letterSpacing: `${HTML_FONT.LETTER_SPACING}px`,
          paddingTop: `${HTML_LAYOUT.MARGIN_Y}px`,
          paddingLeft: `${HTML_LAYOUT.MARGIN_LEFT}px`,
          paddingRight: `${HTML_LAYOUT.MARGIN_RIGHT}px`,
          paddingBottom: `${HTML_LAYOUT.MARGIN_Y}px`,
          boxSizing: "border-box",
        }}
      >
        {/* 타이틀 + 출력일시 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginBottom: `${HTML_LAYOUT.LINE_GAP}px`,
          }}
        >
          <span
            style={{
              fontSize: `${HTML_FONT.TITLE.size}px`,
              fontWeight: HTML_FONT.TITLE.weight,
              lineHeight: 1,
            }}
          >
            진료기록
          </span>
          <span
            style={{
              fontSize: `${HTML_FONT.SMALL.size + 3}px`,
              fontWeight: HTML_FONT.SMALL.weight,
              display: "block",
              lineHeight: 1.1,
              marginLeft: `${HTML_LAYOUT.TITLE_MARGIN_LEFT}px`,
            }}
          >
            {헤더.출력일자}&nbsp;&nbsp;{헤더.출력시간}
          </span>
        </div>

        {/* FIXME: 사내의원 요청으로 인한 출력 제외 */}
        {/* 원외교부번호 */}
        {/* <div
          style={{
            fontSize: `${HTML_FONT.BODY.size - 3}px`,
            fontWeight: HTML_FONT.BODY.weight,
            marginBottom: `${HTML_LAYOUT.LINE_GAP}px`,
          }}
        >
          {formatIssuanceNumber(헤더.교부번호)}
        </div> */}

        {/* 환자 정보 - 차트번호 / 성별 / 이름 */}
        <div
          style={{
            display: "flex",
            gap: `20px`,
            alignItems: "baseline",
            marginBottom: `${HTML_LAYOUT.LINE_GAP}px`,
          }}
        >
          <span style={{ fontSize: `${HTML_FONT.BODY.size}px` }}>{환자.번호}</span>
          <span style={{ fontSize: `${HTML_FONT.BODY.size}px` }}>{환자.성별}</span>
          <span
            style={{
              fontSize: `${HTML_FONT.PATIENT_NAME.size}px`,
              fontWeight: HTML_FONT.PATIENT_NAME.weight,
            }}
          >
            {환자.성명}
          </span>
        </div>

        {/* 나이 / 생년월일 */}
        <div
          style={{
            display: "flex",
            gap: `${HTML_LAYOUT.ELEMENT_GAP}px`,
            fontSize: `${HTML_FONT.BODY.size}px`,
            marginBottom: `${HTML_LAYOUT.DIVIDER_GAP}px`,
          }}
        >
          <span>나이: {환자.나이}</span>
          <span>생년월일: {환자.생년월일}</span>
        </div>

        {/* 처방 섹션 헤더 + 디바이더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${HTML_LAYOUT.ELEMENT_GAP_SM}px`,
            marginTop: '30px',
            marginBottom: `${HTML_LAYOUT.TABLE_HEADER_GAP}px`,
          }}
        >
          <span style={{ fontSize: `${HTML_FONT.BODY.size}px`, whiteSpace: "nowrap" }}>처방</span>
          <div
            style={{
              flex: 1,
              borderTop: `${HTML_LAYOUT.DIVIDER_THICKNESS}px dashed ${HTML_COLORS.DIVIDER}`,
            }}
          />
        </div>

        {/* 테이블 헤더 */}
        <div
          style={{
            display: "flex",
            fontSize: `${HTML_FONT.BODY.size}px`,
            marginBottom: `${HTML_LAYOUT.LINE_GAP}px`,
          }}
        >
          <div style={{ flex: isDrugPage ? undefined : 1, width: isDrugPage ? `${HTML_TABLE.NAME_WIDTH}px` : undefined, whiteSpace: "nowrap" }}>명칭</div>
          <div style={{ width: `${HTML_TABLE.DOSE_WIDTH}px`, textAlign: "center", whiteSpace: "nowrap" }}>
            용량
          </div>
          {isDrugPage && (
            <>
              <div style={{ width: `${HTML_TABLE.COLUMN_GAP}px` }} />
              <div style={{ flex: 1, textAlign: "left" }}>용법</div>
            </>
          )}
        </div>

        {/* 원내 섹션 또는 디바이더 */}
        {hasOrders ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${HTML_LAYOUT.ELEMENT_GAP_SM}px`,
              marginBottom: `${HTML_LAYOUT.LINE_GAP + HTML_LAYOUT.DIVIDER_GAP}px`,
            }}
          >
            <span style={{ fontSize: `${HTML_FONT.BODY.size}px`, whiteSpace: "nowrap" }}>원내</span>
            <div
              style={{
                flex: 1,
                borderTop: `${HTML_LAYOUT.DIVIDER_THICKNESS}px dashed ${HTML_COLORS.DIVIDER}`,
              }}
            />
          </div>
        ) : (
          <div
            style={{
              borderTop: `${HTML_LAYOUT.DIVIDER_THICKNESS}px dashed ${HTML_COLORS.DIVIDER}`,
              marginBottom: `${HTML_LAYOUT.DIVIDER_GAP}px`,
            }}
          />
        )}

        {/* 처방 내역 */}
        {hasOrders ? (
          <div style={{ marginBottom: `${HTML_LAYOUT.SECTION_GAP}px` }}>
            {처방목록.map((처방, index) => {
              // 묶음헤더/지시오더는 출력하지 않음
              if (처방.입력구분 === InputType.묶음헤더 || 처방.입력구분 === InputType.지시오더) {
                return null;
              }

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    fontSize: `${HTML_FONT.BODY.size}px`,
                    marginBottom: `${HTML_LAYOUT.ROW_GAP}px`,
                    lineHeight: 1,
                  }}
                >
                  <span
                    style={{
                      width: isDrugPage ? `${HTML_TABLE.NAME_WIDTH}px` : undefined,
                      flex: isDrugPage ? `0 0 ${HTML_TABLE.NAME_WIDTH}px` : 1,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {처방.명칭}
                  </span>
                  <span style={{ flex: `0 0 ${HTML_TABLE.DOSE_WIDTH}px`, textAlign: "center" }}>
                    {처방.용량}
                  </span>
                  {isDrugPage && (
                    <>
                      <span style={{ flex: `0 0 ${HTML_TABLE.COLUMN_GAP}px` }} />
                      <span style={{ flex: 1, wordBreak: "break-word" }}>
                        {처방.용법}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              fontSize: `${HTML_FONT.BODY.size}px`,
              marginBottom: `${HTML_LAYOUT.SECTION_GAP}px`,
            }}
          >
            처방 내역이 없습니다.
          </div>
        )}

        {/* 하단 디바이더 */}
        < div
          style={{
            borderTop: `${HTML_LAYOUT.DIVIDER_THICKNESS}px dashed ${HTML_COLORS.DIVIDER}`,
            marginBottom: `${HTML_LAYOUT.FOOTER_GAP}px`,
          }}
        />

        {/* 진료의 */}
        <div style={{ fontSize: `${HTML_FONT.BODY.size}px`, marginTop: '20px' }}>진료의: {의사이름}</div>
      </div >
    );
  }
);

