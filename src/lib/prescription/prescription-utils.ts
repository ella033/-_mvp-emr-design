import { FileService } from "@/services/file-service";
import type { KoreanPrescriptionData } from "./build-prescription-html-client";

/**
 * 처방전 데이터에 포함된 이미지 UUID들을 실제 이미지 데이터(base64)로 변환합니다.
 */
export async function ensurePrescriptionImages(
  prescription: KoreanPrescriptionData
): Promise<KoreanPrescriptionData> {
  const processed = { ...prescription };

  // 1. 의사 직인 이미지 처리
  const doctorSealUuid = processed.의사?.직인이미지;
  if (doctorSealUuid) {
    try {
      const base64 = await FileService.downloadAsBase64(doctorSealUuid);
      if (processed.의사) {
        processed.의사.직인이미지Base64 = base64;
      }
    } catch (error) {
      console.error("의사 직인 이미지 로드 실패:", error);
    }
  }

  // 추후 다른 이미지(병원 로고 등) 처리 로직이 필요하면 여기에 추가

  return processed;
}
