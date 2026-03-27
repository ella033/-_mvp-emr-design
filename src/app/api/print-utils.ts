import { NextRequest } from 'next/server';

/**
 * JSON 요청 본문을 안전하게 파싱합니다.
 * Content-Type이 application/json이 아니거나 파싱에 실패하면 null을 반환합니다.
 */
export async function parseJsonBody(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * HTML 문자열에 data-print-root 속성이 없으면 래핑합니다.
 * data-print-preview-root가 있으면 data-print-root로 치환합니다.
 */
export function wrapPrintableHtml(html: string) {
  if (html.includes('data-print-root')) {
    return html;
  }

  if (html.includes('data-print-preview-root')) {
    return html.replace(/data-print-preview-root/g, 'data-print-root');
  }

  return `<div data-print-root="true">${html}</div>`;
}
