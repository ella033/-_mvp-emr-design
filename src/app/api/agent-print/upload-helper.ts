/**
 * 서버 사이드에서 파일 업로드를 위한 헬퍼 함수
 * FileService.uploadFileV2의 로직을 서버 사이드에서 사용할 수 있도록 구현
 */

import { NextRequest } from "next/server";
import type { FileUploadV2Response } from "@/types/file-types-v2";

export interface ServerFileUploadRequest {
  file: Blob;
  fileName: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  makeTransparent?: boolean;
}

/**
 * 서버 사이드에서 파일을 업로드합니다.
 * FileService.uploadFileV2와 동일한 인터페이스를 제공합니다.
 */
export async function uploadFileServerSide(
  request: NextRequest,
  uploadRequest: ServerFileUploadRequest
): Promise<FileUploadV2Response> {
  console.log('[ServerFileUpload] ========================================');
  console.log('[ServerFileUpload] 📤 Starting file upload');
  console.log('[ServerFileUpload] Parameters:', {
    fileName: uploadRequest.fileName,
    fileType: uploadRequest.file.type,
    fileSize: `${(uploadRequest.file.size / 1024).toFixed(2)} KB`,
    category: uploadRequest.category || 'not set',
    entityType: uploadRequest.entityType || 'not set',
    entityId: uploadRequest.entityId || 'not set',
    description: uploadRequest.description || 'not set',
    makeTransparent: uploadRequest.makeTransparent ?? 'not set',
  });

  // 1. FormData 구성 (FileService.uploadFileV2와 동일)
  // ⚠️ 중요: Blob을 File 객체로 변환 (브라우저와 서버의 동작을 동일하게)
  const file = new File([uploadRequest.file], uploadRequest.fileName, {
    type: uploadRequest.file.type,
  });

  const formData = new FormData();
  formData.append('file', file);  // FileService와 동일하게 파일만 append

  console.log('[ServerFileUpload] FormData entries:');
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  - ${key}: File(name=${value.name}, type=${value.type}, size=${value.size})`);
    } else if (value instanceof Blob) {
      console.log(`  - ${key}: Blob(type=${value.type}, size=${value.size})`);
    } else {
      console.log(`  - ${key}: ${value}`);
    }
  }

  // 2. Query Parameters 구성 (FileService.uploadFileV2와 동일)
  const queryParams = new URLSearchParams();

  if (uploadRequest.makeTransparent !== undefined) {
    queryParams.append("makeTransparent", String(uploadRequest.makeTransparent));
  }
  if (uploadRequest.category) {
    queryParams.append("category", uploadRequest.category);
  }
  if (uploadRequest.entityType) {
    queryParams.append("entityType", uploadRequest.entityType);
  }
  if (uploadRequest.entityId) {
    queryParams.append("entityId", uploadRequest.entityId);
  }
  if (uploadRequest.description) {
    queryParams.append("description", uploadRequest.description);
  }

  console.log('[ServerFileUpload] Query Parameters:', queryParams.toString() || 'none');

  // 3. Upload URL 구성
  // API 서버 URL 사용
  const baseUrl = process.env.NEXT_PUBLIC_APP_API_URL;

  const uploadPath = "/v2/file-uploads/upload";
  const uploadUrl = queryParams.toString()
    ? `${baseUrl}${uploadPath}?${queryParams.toString()}`
    : `${baseUrl}${uploadPath}`;

  console.log('[ServerFileUpload] Upload URL:', uploadUrl);

  // 4. 인증 정보 전달
  const cookieHeader = request.headers.get('cookie');
  console.log('[ServerFileUpload] Cookie header:', cookieHeader ? 'present' : 'missing');

  // 쿠키에서 accessToken 추출 (Bearer 토큰으로 사용)
  let accessToken: string | null = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
    if (accessTokenCookie) {
      const tokenValue = accessTokenCookie.split('=')[1];
      if (tokenValue) {
        accessToken = tokenValue;
      }
    }
  }

  // 5. 헤더 구성
  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers['cookie'] = cookieHeader;
  }
  // Bearer 토큰 추가 (백엔드 API가 JwtAuthGuard 사용)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    console.log('[ServerFileUpload] Bearer token: present');
  } else {
    console.log('[ServerFileUpload] Bearer token: missing');
  }
  // ⚠️ Content-Type을 명시하지 않음 - fetch가 자동으로 multipart/form-data boundary 설정

  console.log('[ServerFileUpload] Request headers:', headers);

  // 6. 파일 업로드 요청
  console.log('[ServerFileUpload] Sending fetch request...');
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: headers,
    credentials: 'include',  // ✅ api-proxy와 동일 - httpOnly 쿠키 포함
    next: { revalidate: 0 }, // ✅ api-proxy와 동일 - 캐싱 방지
  } as RequestInit);

  // 7. 응답 검증 (3단계)
  console.log('[ServerFileUpload] Response status:', uploadResponse.status, uploadResponse.statusText);
  console.log('[ServerFileUpload] Response headers:', Object.fromEntries(uploadResponse.headers.entries()));

  // Step 1: HTTP 상태 코드 확인
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error(`[ServerFileUpload] ❌ Upload failed: ${uploadResponse.status} ${errorText}`);
    console.error(`[ServerFileUpload] ❌ Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
    throw new Error(`파일 업로드 실패 (${uploadResponse.status}): ${uploadResponse.statusText}`);
  }

  // Step 2: JSON 파싱
  let uploadResult: FileUploadV2Response;
  try {
    uploadResult = await uploadResponse.json();
  } catch (parseError) {
    console.error(`[ServerFileUpload] ❌ Failed to parse response:`, parseError);
    throw new Error('파일 업로드 응답 파싱 실패');
  }

  // Step 3: UUID 존재 여부 확인
  if (!uploadResult || !uploadResult.uuid) {
    console.error(`[ServerFileUpload] ❌ Missing uuid in response:`, uploadResult);
    throw new Error('파일 업로드 성공했으나 UUID를 받지 못했습니다');
  }

  console.log(`[ServerFileUpload] ✅ Upload successful`);
  console.log(`[ServerFileUpload]    - UUID: ${uploadResult.uuid}`);
  console.log(`[ServerFileUpload]    - Original Name: ${uploadResult.originalName}`);
  console.log(`[ServerFileUpload]    - Stored Name: ${uploadResult.storedName}`);
  console.log(`[ServerFileUpload]    - Storage Path: ${uploadResult.storagePath}`);
  console.log(`[ServerFileUpload]    - File Size: ${uploadResult.fileSize}`);
  console.log('[ServerFileUpload] ========================================');

  return uploadResult;
}

