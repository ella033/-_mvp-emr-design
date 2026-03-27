import { config } from "@/lib/config";
import { fileApi } from "@/lib/api/api-routes";

/**
 * 파일 UUID를 기반으로 다운로드 URL을 생성합니다.
 * @param uuid 파일 UUID (V2)
 * @returns 완전한 다운로드 URL 또는 undefined
 */
export function getFileUrl(uuid?: string): string | undefined {
  if (uuid) {
    return `${config.apiProxyPath}${fileApi.downloadV2(uuid)}`;
  }
  return undefined;
}

/**
 * Blob을 base64 문자열로 변환합니다.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
