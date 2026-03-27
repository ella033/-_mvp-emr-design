import { useMutation } from "@tanstack/react-query";
import { FileService } from "@/services/file-service";
import { PrintersService } from "@/services/printers-service";
import { OutputTypeCode } from "@/types/printer-types";

// ================================
// 프리셋 타입 정의
// ================================

/**
 * PDF 출력 프리셋 타입
 * - certificate: 진단서/증명서 출력용
 * - prescription: 처방전 출력용
 * - chart: 차트 출력용
 * - receipt: 영수증 출력용
 * - etc: 기타 출력용
 */
export type PrintPdfPreset =
  | "certificate"
  | "prescription"
  | "chart"
  | "receipt"
  | "etc";

/**
 * 프리셋별 기본값 정의
 * 각 프리셋에 맞는 category, entityType, outputTypeCode 기본값을 제공합니다.
 */
const PRINT_PRESETS: Record<
  PrintPdfPreset,
  {
    /** 파일 저장 카테고리 (blob storage 분류용) */
    category: string;
    /** 엔티티 타입 (연관 엔티티 식별용) */
    entityType: string;
    /** 출력 유형 코드 (프린터 설정 매칭용) */
    outputTypeCode: OutputTypeCode;
  }
> = {
  certificate: {
    category: "patient_document",
    entityType: "form",
    outputTypeCode: OutputTypeCode.CERTIFICATE,
  },
  prescription: {
    category: "patient_document",
    entityType: "prescription",
    outputTypeCode: OutputTypeCode.OUTPATIENT_RX,
  },
  chart: {
    category: "patient_document",
    entityType: "chart",
    outputTypeCode: OutputTypeCode.CHART,
  },
  receipt: {
    category: "patient_document",
    entityType: "receipt",
    outputTypeCode: OutputTypeCode.RECEIPT,
  },
  etc: {
    category: "patient_document",
    entityType: "document",
    outputTypeCode: OutputTypeCode.ETC,
  },
};

// ================================
// 파라미터 타입 정의
// ================================

export type PrintPdfBlobParams = {
  /**
   * 출력할 PDF blob 데이터
   * @required 필수 파라미터
   * @example await generatePdfBlob()
   */
  blob: Blob;

  /**
   * 저장/출력될 파일명
   * @default `document_${Date.now()}.pdf`
   * @example "진단서_홍길동_20240108.pdf"
   */
  fileName?: string;

  /**
   * 출력 프리셋 (프리셋 사용 시 category, entityType, outputTypeCode 자동 설정)
   * - certificate: 진단서/증명서
   * - prescription: 처방전
   * - chart: 차트
   * - receipt: 영수증
   * - etc: 기타
   * @default "certificate"
   */
  preset?: PrintPdfPreset;

  /**
   * 출력 매수
   * @default 1
   * @example 2 (2부 출력)
   */
  copies?: number;

  // ================================
  // 아래 파라미터들은 프리셋 대신 직접 지정할 때 사용
  // 프리셋과 함께 사용 시 아래 값이 프리셋 값을 덮어씀
  // ================================

  /**
   * 파일 저장 카테고리 (blob storage 분류용)
   * 프리셋 값을 덮어쓰려면 직접 지정
   * @example "patient_document", "hospital_document"
   */
  category?: string;

  /**
   * 엔티티 타입 (연관 엔티티 식별용)
   * 프리셋 값을 덮어쓰려면 직접 지정
   * @example "form", "prescription", "chart"
   */
  entityType?: string;

  /**
   * 파일 설명 (blob storage 메타데이터)
   * @default "PDF 출력용 파일"
   */
  description?: string;

  /**
   * 출력 유형 코드 (프린터 설정에서 해당 유형의 기본 프린터로 출력)
   * 프리셋 값을 덮어쓰려면 직접 지정
   * @see OutputTypeCode
   */
  outputTypeCode?: OutputTypeCode;

  /**
   * 특정 에이전트(PC)로 출력 요청 시 에이전트 ID
   * 지정하지 않으면 서버가 적절한 에이전트 선택
   * @example "agent-abc123"
   */
  agentId?: string;

  /**
   * 특정 PC 이름으로 출력 요청 시 PC 이름
   * agentId 대신 사용 가능
   * @example "NURSE-PC-01"
   */
  pcName?: string;

  /**
   * 프린터 추가 옵션 (duplex, color 등)
   * @example { duplex: true, color: false }
   */
  printerOptions?: Record<string, any>;
};

// ================================
// 반환 타입 정의
// ================================

export type PrintPdfBlobResult = {
  /** 업로드된 파일의 UUID */
  uuid: string;
  /** 생성된 contentUrl (프린트 에이전트가 다운로드할 URL) */
  contentUrl: string;
  /** 생성된 출력 작업 ID */
  jobId: string;
};

// ================================
// 훅 정의
// ================================

/**
 * PDF blob을 업로드하고 프린트 요청을 보내는 mutation 훅
 *
 * @example 기본 사용 (프리셋 활용)
 * ```tsx
 * const printPdfMutation = usePrintPdfBlob({
 *   onSuccess: () => toast.success('출력 완료'),
 * });
 *
 * // 가장 간단한 사용 - blob만 넘기면 됨
 * await printPdfMutation.mutateAsync({ blob });
 *
 * // 프리셋 지정
 * await printPdfMutation.mutateAsync({ blob, preset: 'prescription' });
 *
 * // 매수 지정
 * await printPdfMutation.mutateAsync({ blob, copies: 2 });
 * ```
 *
 * @example 커스텀 값 직접 지정
 * ```tsx
 * await printPdfMutation.mutateAsync({
 *   blob,
 *   fileName: 'custom-document.pdf',
 *   category: 'custom_category',
 *   entityType: 'custom_entity',
 *   outputTypeCode: OutputTypeCode.CERTIFICATE,
 *   copies: 3,
 * });
 * ```
 */
export function usePrintPdfBlob(options?: {
  /** 출력 요청 성공 시 콜백 */
  onSuccess?: (result: PrintPdfBlobResult) => void;
  /** 에러 발생 시 콜백 */
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (params: PrintPdfBlobParams): Promise<PrintPdfBlobResult> => {
      const {
        blob,
        fileName = `document_${Date.now()}.pdf`,
        preset = "certificate",
        copies = 1,
        description = "PDF 출력용 파일",
        agentId,
        pcName,
        printerOptions,
      } = params;

      // 프리셋에서 기본값 가져오기
      const presetValues = PRINT_PRESETS[preset];

      // 프리셋 값 또는 직접 지정된 값 사용 (직접 지정 값이 우선)
      const category = params.category ?? presetValues.category;
      const entityType = params.entityType ?? presetValues.entityType;
      const outputTypeCode = params.outputTypeCode ?? presetValues.outputTypeCode;

      // 1. blob을 File로 변환 후 blob storage에 업로드
      const pdfFile = new File([blob], fileName, { type: "application/pdf" });
      const uploadResult = await FileService.uploadFileV2({
        file: pdfFile,
        category,
        entityType,
        description,
      });

      // 2. 프린트 에이전트가 다운로드할 contentUrl 생성
      const backendApiUrl = process.env.NEXT_PUBLIC_APP_API_URL;
      const contentUrl = `${backendApiUrl}/v2/file-uploads/${uploadResult.uuid}`;

      // 3. 프린터 서비스로 출력 요청
      const printResult = await PrintersService.print({
        outputTypeCode,
        contentType: "application/pdf",
        fileName,
        contentUrl,
        copies,
        agentId,
        pcName,
        options: printerOptions,
      });

      return {
        uuid: uploadResult.uuid,
        contentUrl,
        jobId: printResult.id,
      };
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
