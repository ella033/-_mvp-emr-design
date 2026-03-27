import type { 진료기록부데이터 } from "./types";
import type { MedicalRecordApiResponse } from "@/types/document";

function formatField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const trimmedText = text.trim();
  const isEmptyOrNull = trimmedText.length === 0 || trimmedText === "null";
  return isEmptyOrNull ? "" : text;
}

/**
 * 진료기록부 조회 API 응답을 출력용 데이터로 변환합니다.
 * - 출력일시를 날짜/시간으로 분리
 * - null/undefined 처리
 * - "null" 문자열 정제
 */
export function mapMedicalRecordApiResponseToData(
  response: MedicalRecordApiResponse
): 진료기록부데이터 {
  const 출력일시 = response.출력일시 ? new Date(response.출력일시) : null;
  const 출력일자 = 출력일시
    ? `${출력일시.getFullYear()}-${String(출력일시.getMonth() + 1).padStart(2, "0")}-${String(출력일시.getDate()).padStart(2, "0")}`
    : "";
  const 출력시간 = 출력일시
    ? `${String(출력일시.getHours()).padStart(2, "0")}:${String(출력일시.getMinutes()).padStart(2, "0")}:${String(출력일시.getSeconds()).padStart(2, "0")}`
    : "";

  return {
    헤더: {
      출력일자,
      출력시간,
      교부번호: response.교부번호 ?? "",
    },
    환자: {
      번호: String(response.환자?.번호 ?? ""),
      성명: response.환자?.성명 ?? "",
      성별: response.환자?.성별 ?? "",
      나이: String(response.환자?.나이 ?? ""),
      생년월일: (response.환자?.조회용주민번호 ?? "").slice(0, 6),
    },
    의사이름: response.의사?.이름 ?? "-",
    처방목록: (response.처방목록 ?? []).map((item) => ({
      입력구분: item.입력구분,
      처방구분: item.처방구분,
      항목구분: item.항목구분,
      란구분: item.란구분,
      원내외구분: item.원내외구분,
      명칭: formatField(item.명칭),
      용량: formatField(item.용량),
      일투: formatField(item.일투),
      일수: formatField(item.일수),
      용법: formatField(item.용법),
      청구여부: item.청구여부,
    })),
  };
}
