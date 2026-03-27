// 오류 정보를 담는 인터페이스
export interface ErrorDetails {
  message: string;
  status: number;
  originalError?: any;
}

// API 오류를 파싱하는 함수
export function parseApiError(error: any): ErrorDetails {
  let errorMessage = "알 수 없는 오류가 발생했습니다.";
  let errorStatus = 500;

  try {
    // JSON 형태로 전달된 오류 정보 파싱
    const errorDetails = JSON.parse(error.message);
    errorMessage = errorDetails.message || errorMessage;
    errorStatus = errorDetails.status || errorStatus;
  } catch (parseError) {
    // JSON 파싱 실패 시 원본 메시지 사용
    errorMessage = error.message || errorMessage;
    errorStatus = error.response?.status || error.status || 500;
  }

  return {
    message: errorMessage,
    status: errorStatus,
    originalError: error,
  };
}

// 상태 코드에 따른 사용자 친화적 메시지 생성
export function getErrorMessage(errorDetails: ErrorDetails): string {
  const { message, status } = errorDetails;

  switch (status) {
    case 400:
      return `잘못된 요청입니다: ${message}`;
    case 401:
      return "인증이 필요합니다. 다시 로그인해주세요.";
    case 403:
      return "권한이 없습니다.";
    case 404:
      return "요청한 리소스를 찾을 수 없습니다.";
    case 409:
      return "이미 존재하는 데이터입니다.";
    case 422:
      return `데이터 검증 실패: ${message}`;
    case 500:
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    case 502:
      return "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.";
    case 503:
      return "서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
    case 504:
      return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    default:
      return `오류가 발생했습니다: ${message}`;
  }
}

// 오류를 콘솔에 로깅하는 함수
export function logError(
  context: string,
  error: any,
  errorDetails?: ErrorDetails
) {
  console.error(`[${context}] Error details:`, {
    originalError: error,
    parsedError: errorDetails,
    timestamp: new Date().toISOString(),
  });
}

// 서비스에서 사용할 오류 생성 함수
export function createServiceError(error: any, context: string): Error {
  const errorMessage =
    error.response?.data?.message || error.message || "알 수 없는 오류";
  const errorStatus = error.response?.status || error.status || 500;

  const errorDetails: ErrorDetails = {
    message: errorMessage,
    status: errorStatus,
    originalError: error,
  };

  // context를 포함하여 더 자세한 오류 정보 제공
  const errorWithContext = {
    ...errorDetails,
    context,
  };

  return new Error(JSON.stringify(errorWithContext));
}

// React Query mutation에서 사용할 오류 처리 함수
export function handleMutationError(
  error: any,
  context: string,
  showError: (message: string) => void
) {
  const errorDetails = parseApiError(error);
  const userMessage = getErrorMessage(errorDetails);

  logError(context, error, errorDetails);
  showError(userMessage);
}
