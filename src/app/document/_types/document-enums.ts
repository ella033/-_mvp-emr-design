/**
 * 서식 렌더링 방식
 */
export enum FormRenderType {
  Pdf = 1,
  Component = 2,
}

/**
 * 서식 발급 상태
 */
export enum FormIssuanceStatus {
  Draft = 0,
  Issued = 1,
  Canceled = 2,
}

/**
 * 문서 렌더링 상태 뷰 타입
 */
export enum DocumentRenderViewType {
  Idle = 'idle',
  Loading = 'loading',
  Error = 'error',
  Pdf = 'pdf',
  Component = 'component',
}