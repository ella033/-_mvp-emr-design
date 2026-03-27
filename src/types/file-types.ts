// ================================ 파일 업로드 응답 ================================
export interface FileUploadResponse {
  success: boolean;
  data: {
    filename: string;      // 서버에서 생성한 파일명
    originalname: string;  // 원본 파일명
    mimetype: string;      // 파일 타입 (image/jpeg, image/png 등)
    size: number;          // 파일 크기 (bytes)
  };
}

// ================================ 파일 정보 ================================
export interface FileInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

// ================================ 파일 업로드 요청 ================================
export interface FileUploadRequest {
  file: File;
}

// ================================ 파일 다운로드 응답 ================================
export type FileDownloadResponse = ReadableStream<Uint8Array>;