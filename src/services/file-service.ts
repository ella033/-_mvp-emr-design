import { ApiClient } from "@/lib/api/api-client";
import { fileApi } from "@/lib/api/api-routes";
import { config } from "@/lib/config";
import { blobToBase64 } from "@/lib/file-utils";
import {
  type FileUploadV2Request,
  type FileUploadV2Response,
  type FileDownloadV2Response,
} from "@/types/file-types-v2";

export class FileService {
  static async uploadFileV2(
    request: FileUploadV2Request
  ): Promise<FileUploadV2Response> {
    try {
      const formData = new FormData();
      formData.append("file", request.file);

      const queryParams = new URLSearchParams();
      if (request.makeTransparent !== undefined) {
        queryParams.append("makeTransparent", String(request.makeTransparent));
      }
      if (request.category) {
        queryParams.append("category", request.category);
      }
      if (request.entityType) {
        queryParams.append("entityType", request.entityType);
      }
      if (request.entityId) {
        queryParams.append("entityId", request.entityId);
      }
      if (request.description) {
        queryParams.append("description", request.description);
      }

      const url = queryParams.toString()
        ? `${fileApi.uploadV2}?${queryParams.toString()}`
        : fileApi.uploadV2;

      return await ApiClient.post<FileUploadV2Response>(url, formData);
    } catch (error: any) {
      console.log("파일 업로드 실패 (V2)", error);
      throw error;
    }
  }

  static async downloadFileV2(uuid: string): Promise<FileDownloadV2Response> {
    try {
      const apiBase = config.apiProxyPath;
      const url = `${apiBase}${fileApi.downloadV2(uuid)}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`파일 다운로드 실패: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const contentType = response.headers.get("content-type") || undefined;

      // content-disposition에서 filename 추출
      let filename: string | undefined;
      if (contentDisposition) {
        // RFC 5987 형식 지원: filename*=UTF-8''encoded-name
        const filenameStarMatch = contentDisposition.match(
          /filename\*=UTF-8''([^;]+)/
        );
        if (filenameStarMatch && filenameStarMatch[1]) {
          try {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } catch {
            filename = filenameStarMatch[1];
          }
        } else {
          // 일반 형식: filename="..." 또는 filename=...
          const filenameMatch =
            contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            const extracted = filenameMatch[1];
            // encodeURIComponent로 인코딩된 경우 디코딩 시도
            try {
              filename = decodeURIComponent(extracted);
            } catch {
              // 디코딩 실패 시 원본 사용
              filename = extracted;
            }
          }
        }
      }

      return {
        blob,
        filename,
        contentType,
      };
    } catch (error: any) {
      console.log("파일 다운로드 실패 (V2)", error);
      throw error;
    }
  }

  static async deleteFileV2(uuid: string): Promise<any> {
    try {
      return await ApiClient.delete<any>(fileApi.deleteV2(uuid));
    } catch (error: any) {
      throw new Error(`파일 삭제 실패: ${error.status || error.message}`);
    }
  }

  /**
   * UUID를 받아 Base64로 변환된 이미지 데이터를 반환합니다.
   */
  static async downloadAsBase64(uuid: string): Promise<string> {
    const { blob } = await this.downloadFileV2(uuid);
    return await blobToBase64(blob);
  }
}
