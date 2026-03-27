/**
 * 검사 라벨 사일런트(자동) 출력
 *
 * 출력전달(F10) 시 다이얼로그 없이 처방된 검사의 검체를 자동으로 판별하여 출력합니다.
 */

import { LabOrdersService } from "@/services/lab-orders-service";
import { MOCK_SPECIMEN_LIBRARIES } from "@/mocks/examination-label";
import { PRINT_QUANTITY } from "./constants";
import { printLabelImagesViaApiIndividually } from "./label-api-service";
import { LabelContentType } from "./label-api-service";
import {
  getPrescriptionDetailType,
  처방상세구분,
} from "@/types/master-data/item-type";
import type { PatientInfo, PrintResult, SpecimenPrintItem } from "./types";
import type { LabelApiPrintOptions } from "./label-api-service";

/**
 * 처방 목록에서 검사 처방이 있는지 판별
 */
export function hasExaminationOrders(
  orders: Array<{ itemType?: string }>
): boolean {
  // FIXME: 처방 itemType 로직 변경될 예정. 변경되면 검사 제대로 판별 되는지 확인 필요.
  return orders.some(
    (order) =>
      getPrescriptionDetailType(order.itemType) === 처방상세구분.검사
  );
}

/**
 * LabOrdersService 응답에서 검체 코드를 추출 (중복 제거)
 */
function collectSpecimenCodes(
  orders: Array<{ exams?: Array<{ scodes?: string[] | null }> }>
): string[] {
  const codes = new Set<string>();
  for (const order of orders) {
    for (const exam of order.exams ?? []) {
      for (const code of exam.scodes ?? []) {
        if (code != null && String(code).trim() !== "") {
          codes.add(String(code).trim());
        }
      }
    }
  }
  return Array.from(codes);
}

/**
 * 검체 코드 목록에서 출력용 SpecimenPrintItem 배열 생성
 */
function specimenCodesToPrintItems(codes: string[]): SpecimenPrintItem[] {
  const items: SpecimenPrintItem[] = [];
  for (const code of codes) {
    const lib = MOCK_SPECIMEN_LIBRARIES.find((s) => s.code === code);
    if (lib) {
      items.push({
        specimenCode: lib.code,
        specimenName: lib.name,
        quantity: PRINT_QUANTITY.DEFAULT,
      });
    }
  }
  return items;
}

export interface SilentExaminationLabelPrintParams {
  patient: PatientInfo;
  /** specimenCodes가 없을 때 API 조회용 */
  patientId?: number;
  date?: string;
  /** 직접 전달하면 API 호출 생략 */
  specimenCodes?: string[];
  apiOptions?: Omit<LabelApiPrintOptions, "copies">;
}

/**
 * 검사 라벨 사일런트 출력
 *
 * 1. 검체 코드 조회 (LabOrdersService)
 * 2. 검체 코드 → 검체명 매핑 (MOCK_SPECIMEN_LIBRARIES)
 * 3. API 출력 실행 (printLabelImagesViaApiIndividually)
 *
 * 출력할 검체가 없으면 조용히 성공을 반환합니다.
 */
export async function printExaminationLabelsSilent(
  params: SilentExaminationLabelPrintParams
): Promise<PrintResult> {
  const { patient, patientId, date, specimenCodes: preCollectedCodes, apiOptions } = params;

  console.log("[검사라벨-silent] 시작 - patientId:", patientId, "date:", date);

  let specimenCodes: string[];
  if (preCollectedCodes) {
    specimenCodes = preCollectedCodes;
  } else {
    const labOrders =
      await LabOrdersService.getExternalLabOrdersByPatientAndDate(
        patientId!,
        date
      );
    console.log("[검사라벨-silent] labOrders 응답:", JSON.stringify(labOrders));
    specimenCodes = collectSpecimenCodes(labOrders);
  }
  console.log("[검사라벨-silent] 추출된 specimenCodes:", specimenCodes);

  if (specimenCodes.length === 0) {
    console.log("[검사라벨-silent] 검체 코드 없음 → 건너뜀");
    return { success: true, message: "출력할 검체가 없습니다." };
  }

  const printItems = specimenCodesToPrintItems(specimenCodes);
  console.log("[검사라벨-silent] printItems:", JSON.stringify(printItems));

  if (printItems.length === 0) {
    console.log("[검사라벨-silent] MOCK_SPECIMEN_LIBRARIES에 매칭되는 검체 없음 → 건너뜀");
    return { success: true, message: "매칭되는 검체가 없습니다." };
  }

  console.log("[검사라벨-silent] printLabelImagesViaApiIndividually 호출");
  const result = await printLabelImagesViaApiIndividually(patient, printItems, {
    contentType: LabelContentType.IMAGE_PNG,
    ...apiOptions,
  });
  console.log("[검사라벨-silent] 출력 결과:", result);
  return result;
}
