import type { Encounter } from '@/types/chart/encounter-types';

/**
 * 서식 페이지를 새 창으로 여는 함수
 * @param documentId 서식 ID
 * @param encounter 내원이력 정보
 */
export function openDocumentPage(
  documentId: string,
  encounter: Encounter
): void {
  const url = `/document?documentId=${documentId}&patientId=${encounter.patientId}&encounterId=${encounter.id}`;
  window.open(url, '_blank');
}