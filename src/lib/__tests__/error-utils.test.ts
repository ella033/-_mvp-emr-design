import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseApiError,
  getErrorMessage,
  logError,
  createServiceError,
  handleMutationError,
} from "../error-utils";

describe("parseApiError", () => {
  it("should parse a JSON-encoded error message", () => {
    const error = {
      message: JSON.stringify({ message: "Not found", status: 404 }),
    };
    const result = parseApiError(error);
    expect(result.message).toBe("Not found");
    expect(result.status).toBe(404);
    expect(result.originalError).toBe(error);
  });

  it("should fall back to raw message when JSON parsing fails", () => {
    const error = { message: "Something went wrong" };
    const result = parseApiError(error);
    expect(result.message).toBe("Something went wrong");
    expect(result.status).toBe(500);
  });

  it("should use error.response.status when JSON parsing fails", () => {
    const error = {
      message: "Bad request",
      response: { status: 400 },
    };
    const result = parseApiError(error);
    expect(result.message).toBe("Bad request");
    expect(result.status).toBe(400);
  });

  it("should use error.status when response.status is unavailable", () => {
    const error = { message: "Forbidden", status: 403 };
    const result = parseApiError(error);
    expect(result.message).toBe("Forbidden");
    expect(result.status).toBe(403);
  });

  it("should return default message and status when error has no message", () => {
    const error = {};
    const result = parseApiError(error);
    expect(result.message).toBe("알 수 없는 오류가 발생했습니다.");
    expect(result.status).toBe(500);
  });

  it("should use defaults when JSON message field is missing", () => {
    const error = { message: JSON.stringify({ status: 422 }) };
    const result = parseApiError(error);
    expect(result.message).toBe("알 수 없는 오류가 발생했습니다.");
    expect(result.status).toBe(422);
  });
});

describe("getErrorMessage", () => {
  it("should return bad request message for 400", () => {
    const result = getErrorMessage({ message: "invalid field", status: 400 });
    expect(result).toBe("잘못된 요청입니다: invalid field");
  });

  it("should return auth message for 401", () => {
    const result = getErrorMessage({ message: "", status: 401 });
    expect(result).toBe("인증이 필요합니다. 다시 로그인해주세요.");
  });

  it("should return forbidden message for 403", () => {
    const result = getErrorMessage({ message: "", status: 403 });
    expect(result).toBe("권한이 없습니다.");
  });

  it("should return not found message for 404", () => {
    const result = getErrorMessage({ message: "", status: 404 });
    expect(result).toBe("요청한 리소스를 찾을 수 없습니다.");
  });

  it("should return conflict message for 409", () => {
    const result = getErrorMessage({ message: "", status: 409 });
    expect(result).toBe("이미 존재하는 데이터입니다.");
  });

  it("should return validation message for 422", () => {
    const result = getErrorMessage({ message: "email is required", status: 422 });
    expect(result).toBe("데이터 검증 실패: email is required");
  });

  it("should return server error message for 500", () => {
    const result = getErrorMessage({ message: "", status: 500 });
    expect(result).toBe("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  });

  it("should return gateway error message for 502", () => {
    const result = getErrorMessage({ message: "", status: 502 });
    expect(result).toBe("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
  });

  it("should return service unavailable message for 503", () => {
    const result = getErrorMessage({ message: "", status: 503 });
    expect(result).toBe(
      "서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
    );
  });

  it("should return timeout message for 504", () => {
    const result = getErrorMessage({ message: "", status: 504 });
    expect(result).toBe("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
  });

  it("should return generic error message for unknown status", () => {
    const result = getErrorMessage({ message: "something", status: 418 });
    expect(result).toBe("오류가 발생했습니다: something");
  });
});

describe("logError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should call console.error with context and error details", () => {
    const error = new Error("test error");
    const errorDetails = { message: "test", status: 500 };
    logError("TestContext", error, errorDetails);

    expect(console.error).toHaveBeenCalledWith(
      "[TestContext] Error details:",
      expect.objectContaining({
        originalError: error,
        parsedError: errorDetails,
        timestamp: expect.any(String),
      })
    );
  });

  it("should work without errorDetails", () => {
    const error = new Error("test");
    logError("Ctx", error);

    expect(console.error).toHaveBeenCalledWith(
      "[Ctx] Error details:",
      expect.objectContaining({
        originalError: error,
        parsedError: undefined,
        timestamp: expect.any(String),
      })
    );
  });
});

describe("createServiceError", () => {
  it("should create an error with JSON-stringified details including context", () => {
    const error = { message: "Something failed", status: 400 };
    const result = createServiceError(error, "UserService");

    expect(result).toBeInstanceOf(Error);
    const parsed = JSON.parse(result.message);
    expect(parsed.message).toBe("Something failed");
    expect(parsed.status).toBe(400);
    expect(parsed.context).toBe("UserService");
  });

  it("should use response.data.message when available", () => {
    const error = {
      response: { status: 422, data: { message: "Validation failed" } },
    };
    const result = createServiceError(error, "API");
    const parsed = JSON.parse(result.message);
    expect(parsed.message).toBe("Validation failed");
    expect(parsed.status).toBe(422);
  });

  it("should default to 500 and unknown message when nothing is available", () => {
    const error = {};
    const result = createServiceError(error, "Unknown");
    const parsed = JSON.parse(result.message);
    expect(parsed.message).toBe("알 수 없는 오류");
    expect(parsed.status).toBe(500);
    expect(parsed.context).toBe("Unknown");
  });
});

describe("handleMutationError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should parse error, log it, and call showError with user message", () => {
    const showError = vi.fn();
    const error = {
      message: JSON.stringify({ message: "Duplicate entry", status: 409 }),
    };

    handleMutationError(error, "createPatient", showError);

    expect(console.error).toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith("이미 존재하는 데이터입니다.");
  });

  it("should handle plain string error message", () => {
    const showError = vi.fn();
    const error = { message: "Network error" };

    handleMutationError(error, "updateRecord", showError);

    expect(showError).toHaveBeenCalledWith(
      "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    );
  });

  it("should handle error with no message", () => {
    const showError = vi.fn();
    handleMutationError({}, "deleteItem", showError);

    expect(showError).toHaveBeenCalledWith(
      "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    );
  });
});
