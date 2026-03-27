/**
 * 라벨 API 출력 서비스
 *
 * API를 통해 원격 프린터로 라벨을 출력합니다.
 * 이미지 또는 Bixolon JSON 형식으로 전송할 수 있습니다.
 */

import { PrintersService } from "@/services/printers-service";
import { OutputTypeCode } from "@/types/printer-types";
import { renderLabelToBase64Html } from "./label-html-renderer";
import { createLabelData, getTotalQuantity, renderExaminationLabel } from "./label-printer-service";
import { getLabelData } from "./bixolon-sdk";
import type { LabelData, PatientInfo, PrintResult, SpecimenPrintItem } from "./types";

/**
 * 라벨 출력 콘텐츠 타입
 */
export enum LabelContentType {
  /** PNG 이미지 */
  IMAGE_PNG = "image/png",
  /** Bixolon JSON 형식 */
  BIXOLON_JSON = "application/vnd.bixolon.label+json",
}

/**
 * 라벨 API 출력 요청 옵션
 */
export interface LabelApiPrintOptions {
  /** 출력할 프린터 ID (선택) */
  printerId?: string;
  /** 에이전트 ID (선택) */
  agentId?: string;
  /** 출력 콘텐츠 타입 */
  contentType?: LabelContentType;
  /** 출력 매수 */
  copies?: number;
}

/**
 * 라벨 출력 페이로드 (이미지 기반)
 */
interface ImageLabelPayload {
  version: string;
  contentType: "image/png";
  labels: Array<{
    index: number;
    imageBase64: string;
  }>;
}

/**
 * 라벨 출력 페이로드 (Bixolon JSON 기반)
 */
interface BixolonLabelPayload {
  version: string;
  contentType: "application/vnd.bixolon.label+json";
  printerType: "BIXOLON_LABEL";
  labels: Array<{
    id: number;
    functions: Record<string, Record<string, unknown[]>>;
  }>;
}

/**
 * 단일 라벨을 이미지로 API 출력
 */
export async function printLabelImageViaApi(
  labelData: LabelData,
  options: LabelApiPrintOptions
): Promise<PrintResult> {
  try {
    const imageBase64 = await renderLabelToBase64Html(labelData);

    await PrintersService.print({
      outputTypeCode: OutputTypeCode.EXAM_LABEL,
      contentType: LabelContentType.IMAGE_PNG,
      fileName: `label-${Date.now()}.png`,
      contentBase64: imageBase64,
      copies: options.copies ?? 1,
    });

    return {
      success: true,
      message: "라벨 출력 요청 완료",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "라벨 출력 요청 실패",
    };
  }
}

/**
 * 여러 라벨을 이미지로 일괄 API 출력
 *
 * NOTE:
 * - 현재 운영 요구사항은 “출력 대상이 여러 개면 여러 번 API 호출”이므로,
 *   실제 사용 경로는 `printLabelImagesViaApiIndividually`를 사용합니다.
 */
export async function printLabelImagesViaApi(
  patient: PatientInfo,
  specimens: SpecimenPrintItem[],
  options: LabelApiPrintOptions
): Promise<PrintResult> {
  try {
    const labelImages: Array<{ index: number; imageBase64: string }> = [];
    let index = 0;

    // 각 검체별로 라벨 이미지 생성
    for (const specimen of specimens) {
      for (let i = 0; i < specimen.quantity; i++) {
        const labelData = createLabelData(patient, specimen.specimenName);
        const imageBase64 = await renderLabelToBase64Html(labelData);
        labelImages.push({ index: index++, imageBase64 });
      }
    }

    const totalCount = getTotalQuantity(specimens);

    if (labelImages.length === 0) {
      return {
        success: false,
        message: "출력할 라벨이 없습니다.",
      };
    }

    // 페이로드 생성
    const payload: ImageLabelPayload = {
      version: "1.0",
      contentType: "image/png",
      labels: labelImages,
    };

    // API 호출
    await PrintersService.print({
      outputTypeCode: OutputTypeCode.EXAM_LABEL,
      contentType: LabelContentType.IMAGE_PNG,
      fileName: `labels-${Date.now()}.json`,
      contentBase64: btoa(JSON.stringify(payload)),
      copies: options.copies ?? 1,
    });

    return {
      success: true,
      message: `총 ${totalCount}장 라벨 출력 요청 완료`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "라벨 출력 요청 실패",
    };
  }
}

/**
 * 여러 라벨을 이미지로 개별 API 출력
 *
 * 규칙:
 * - 같은 라벨(같은 내용) 반복 출력은 `copies`로 처리 (1회 호출)
 * - 라벨 내용이 달라지면 별도 API 호출
 */
export async function printLabelImagesViaApiIndividually(
  patient: PatientInfo,
  specimens: SpecimenPrintItem[],
  options: LabelApiPrintOptions
): Promise<PrintResult> {
  const totalCount = getTotalQuantity(specimens);
  if (totalCount <= 0) {
    return {
      success: false,
      message: "출력할 라벨이 없습니다.",
    };
  }

  try {
    let requested = 0;

    for (const specimen of specimens) {
      if (specimen.quantity <= 0) continue;

      const labelData = createLabelData(patient, specimen.specimenName);
      const imageBase64 = await renderLabelToBase64Html(labelData);

      await PrintersService.print({
        outputTypeCode: OutputTypeCode.EXAM_LABEL,
        contentType: LabelContentType.IMAGE_PNG,
        fileName: `label-${specimen.specimenCode}-${Date.now()}.png`,
        contentBase64: imageBase64,
        copies: specimen.quantity,
      });

      requested += specimen.quantity;
    }

    return {
      success: true,
      message: `총 ${requested}장 라벨 출력 요청 완료`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "라벨 출력 요청 실패",
    };
  }
}

/**
 * 여러 라벨을 Bixolon JSON으로 일괄 API 출력
 * (Bixolon SDK가 초기화되어 있어야 함)
 */
export async function printLabelsBixolonViaApi(
  patient: PatientInfo,
  specimens: SpecimenPrintItem[],
  options: LabelApiPrintOptions
): Promise<PrintResult> {
  try {
    const bixolonLabels: Array<{
      id: number;
      functions: Record<string, Record<string, unknown[]>>;
    }> = [];

    let labelId = 1;

    // 각 검체별로 라벨 데이터 생성
    for (const specimen of specimens) {
      for (let i = 0; i < specimen.quantity; i++) {
        const labelData = createLabelData(patient, specimen.specimenName);

        // Bixolon SDK로 렌더링
        renderExaminationLabel(labelData);

        // JSON 데이터 추출
        const jsonString = getLabelData();
        const parsedData = JSON.parse(jsonString) as {
          id: number;
          functions: Record<string, Record<string, unknown[]>>;
        };

        bixolonLabels.push({
          ...parsedData,
          id: labelId++,
        });
      }
    }

    const totalCount = getTotalQuantity(specimens);

    if (bixolonLabels.length === 0) {
      return {
        success: false,
        message: "출력할 라벨이 없습니다.",
      };
    }

    // 페이로드 생성
    const payload: BixolonLabelPayload = {
      version: "1.0",
      contentType: "application/vnd.bixolon.label+json",
      printerType: "BIXOLON_LABEL",
      labels: bixolonLabels,
    };

    // API 호출
    await PrintersService.print({
      outputTypeCode: OutputTypeCode.EXAM_LABEL,
      contentType: LabelContentType.BIXOLON_JSON,
      fileName: `labels-bixolon-${Date.now()}.json`,
      contentBase64: btoa(JSON.stringify(payload)),
      copies: options.copies ?? 1,
    });

    return {
      success: true,
      message: `총 ${totalCount}장 라벨 출력 요청 완료 (Bixolon)`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "라벨 출력 요청 실패",
    };
  }
}

/**
 * 통합 라벨 출력 함수
 * 옵션에 따라 이미지 또는 Bixolon JSON 형식으로 출력
 */
export async function printExaminationLabelsViaApi(
  patient: PatientInfo,
  specimens: SpecimenPrintItem[],
  options: LabelApiPrintOptions
): Promise<PrintResult> {
  const contentType = options.contentType ?? LabelContentType.IMAGE_PNG;

  if (contentType === LabelContentType.BIXOLON_JSON) {
    return printLabelsBixolonViaApi(patient, specimens, options);
  }

  return printLabelImagesViaApiIndividually(patient, specimens, options);
}

/**
 * 테스트 라벨 API 출력
 */
export async function printTestLabelViaApi(
  options: LabelApiPrintOptions
): Promise<PrintResult> {
  const testPatient: PatientInfo = {
    chartNumber: "TEST-001",
    patientName: "테스트환자",
    age: 30,
    gender: "M",
    birthDate: "1995-01-01",
  };

  const testSpecimen: SpecimenPrintItem = {
    specimenCode: "TEST",
    specimenName: "Test Specimen",
    quantity: 1,
  };

  return printExaminationLabelsViaApi(testPatient, [testSpecimen], options);
}
