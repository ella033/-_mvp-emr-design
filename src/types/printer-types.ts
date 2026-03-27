// ================================ 출력 유형 코드 ================================
export enum OutputTypeCode {
  /** 원외 처방전 */
  OUTPATIENT_RX = "OUTPATIENT_RX",
  /** 진단서/증명서 */
  CERTIFICATE = "CERTIFICATE",
  /** 차트 */
  CHART = "CHART",
  /** 라벨 */
  LABEL = "LABEL",
  /** 진료비 세부내역서 */
  BILL_DETAIL = "BILL_DETAIL",
  /** 영수증 */
  RECEIPT = "RECEIPT",
  EXAM_LABEL = "EXAM_LABEL",
  CHART_RECORD = "CHART_RECORD",
  DEFAULT_PRINTER = "DEFAULT_PRINTER",
  /** 기타 */
  ETC = "ETC",
}

// ================================ 프린터 기본 ================================
export interface PrinterBase {
  hospitalId: number;
  name: string;
  printerUID: string;
  paperTray: string;
  paperType?: number;
  outputType?: number;
  memo?: string;
}

// ================================ 프린터 정보 ================================
export interface Printer extends PrinterBase {
  id: number;
  createId: number;
  createDateTime: string;
  updateId?: number | null;
  updateDateTime?: string | null;
}

// ================================ 프린터 생성 ================================
export interface CreatePrinterRequest extends PrinterBase { }
export interface CreatePrinterResponse {
  id: number;
}

// ================================ 프린터 수정 ================================
export interface UpdatePrinterRequest extends Partial<PrinterBase> { }
export interface UpdatePrinterResponse extends Printer { }

// ================================ 프린터 삭제 ================================
export interface DeletePrinterRequest { }
export interface DeletePrinterResponse {
  id: number;
}

// ================================ 윈도우 프린터 스냅샷 ================================
export interface WindowsPrinterCapability {
  duplex?: boolean;
  color?: boolean;
  collate?: boolean;
  paperSizes?: string[];
  bins?: string[];
}

export interface WindowsPrinterInfo {
  name: string;                // 프린터 이름
  shareName?: string | null;   // 공유명
  portName?: string | null;    // 포트
  driverName?: string | null;  // 드라이버
  location?: string | null;    // 위치
  comment?: string | null;     // 메모
  serverName?: string | null;  // 서버
  isDefault?: boolean;         // 기본 프린터 여부
  status?: string | null;      // 상태 문자열(오프라인 등)
  isNetwork?: boolean;         // 네트워크 프린터
  isShared?: boolean;          // 공유 여부
  deviceId?: string | null;    // 고유 식별자
  macAddress?: string | null;  // 가능 시
  ipAddress?: string | null;   // 가능 시
  path?: string | null;        // \\SERVER\PRINTER 형식
  capabilities?: WindowsPrinterCapability;
}

export interface SyncPrintersRequest {
  printers: WindowsPrinterInfo[];
}

export interface SyncPrintersResponse {
  synced: number; // 저장/업데이트된 개수
}

// ================================ 프린터 새로고침 오케스트레이션 ========
export interface RefreshPrintersRequest {
  force?: boolean; // 서버 캐시 무시 여부
}

export interface RefreshPrintersAcceptedResponse {
  operationId: string;
  onlineAgents: number;
  timeoutSec: number;
  status: "pending";
}

export interface RefreshPrintersStatusResponse {
  operationId: string;
  status: "pending" | "completed" | "partial" | "no_agents";
  expected: number;    // 요청 시점 온라인 에이전트 수
  received: number;    // 동기화 완료한 에이전트 수
  completedAt?: string | null;
}

// ================================ 서버 프린터 레코드 ========================
// 서버에서 /printers 목록으로 반환되는 스키마
export interface PrinterRecord {
  id: string;
  hospitalId: number;
  name: string;
  displayName?: string | null;
  deviceId?: string | null;
  path?: string | null;
  portName?: string | null;
  driverName?: string | null;
  location?: string | null;
  isDefault?: boolean;
  isDefaultConfigured?: boolean; // 관리자가 기본 프린터로 설정한 여부
  status?: string | null;
  available?: boolean; // 서버 계산 온라인 여부
  agents?: string[];   // 연결된 에이전트 ID 목록
  outputTypeCodes?: string[]; // 이 프린터에 할당된 출력 유형 코드 목록
  capabilities?: WindowsPrinterCapability;
  createdAt: string;
  updatedAt: string;
}

