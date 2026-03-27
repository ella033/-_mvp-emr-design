import { InputType } from "@/types/chart/order-types";
import { PrescriptionType, InOut, ColumnType } from "@/constants/master-data-enum";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

export interface 진료기록부헤더 {
  출력일자: string;
  출력시간: string;
  교부번호: string;
}

export interface 진료기록부환자 {
  번호: string;
  성명: string;
  성별: string;
  나이: string;
  생년월일: string;
}

export interface 진료기록부처방 {
  입력구분?: InputType;
  처방구분?: PrescriptionType;
  항목구분?: string;
  란구분?: ColumnType;
  원내외구분?: InOut;
  명칭: string;
  용량: string;
  일투: string;
  일수: string;
  용법: string;
  청구여부?: boolean;
}

export interface 진료기록부데이터 {
  헤더: 진료기록부헤더;
  환자: 진료기록부환자;
  의사이름: string;
  처방목록: 진료기록부처방[];
}

// 하위 호환성을 위한 타입 별칭
export type MedicalRecordHeader = 진료기록부헤더;
export type MedicalRecordPatient = 진료기록부환자;
export type MedicalRecordOrder = 진료기록부처방;
export type MedicalRecordData = 진료기록부데이터;

/**
 * 진료기록부 렌더링 방식
 * - Canvas: 캔버스에 직접 그리는 방식 (픽셀 정확도 높음, POS 프린터에 적합)
 * - Html: HTML을 이미지로 변환하는 방식 (레이아웃 수정 용이)
 */
export enum MedicalRecordRendererType {
  Canvas = "canvas",
  Html = "html",
}

/**
 * 렌더러 공통 반환 타입
 */
export interface MedicalRecordRenderResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * 렌더러 공통 옵션
 */
export interface MedicalRecordRenderOptions {
  /** 프린트용 이진화 적용 여부 */
  forPrint?: boolean;
  /** 스케일 (기본: 미리보기 2, 프린트 1) */
  scale?: number;
}

/** 주사료 항목구분 코드 */
const INJECTION_ITEM_TYPES = new Set<string>([ItemTypeCode.주사료_주사, ItemTypeCode.주사료_기타]);

/**
 * 항목구분 기준으로 진료기록부 데이터를 분리합니다.
 * - 묶음헤더(InputType.묶음헤더), 지시오더(InputType.지시오더) 제외
 * - 주사료(항목구분: 주사료_주사 "0401", 주사료_기타 "0499") / 그 외로 분리
 * - 해당 카테고리에 처방이 없으면 해당 데이터 미반환
 */
export function splitMedicalRecordByItemType(
  data: 진료기록부데이터
): 진료기록부데이터[] {
  const filtered = data.처방목록.filter(
    (item) => item.입력구분 !== InputType.묶음헤더 && item.입력구분 !== InputType.지시오더
  );

  const injection = filtered.filter((i) => INJECTION_ITEM_TYPES.has(i.항목구분 ?? ""));
  const nonInjection = filtered.filter((i) => !INJECTION_ITEM_TYPES.has(i.항목구분 ?? ""));

  const result: 진료기록부데이터[] = [];
  if (nonInjection.length > 0) result.push({ ...data, 처방목록: nonInjection });
  if (injection.length > 0) result.push({ ...data, 처방목록: injection });
  return result;
}
