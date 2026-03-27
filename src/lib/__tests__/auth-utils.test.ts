import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ================================ Hoisted Mocks ================================

const { mockMutateAsync, mockSetUser, mockPush, mockClear } = vi.hoisted(
  () => ({
    mockMutateAsync: vi.fn(),
    mockSetUser: vi.fn(),
    mockPush: vi.fn(),
    mockClear: vi.fn(),
  })
);

vi.mock("@/hooks/auth/use-logout", () => ({
  useLogout: () => ({ mutateAsync: mockMutateAsync }),
}));

vi.mock("@/store/user-store", () => ({
  useUserStore: () => ({ setUser: mockSetUser }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mockClear }),
}));

const { mockSafeLocalStorageClear, mockSafeLocalStorageRemoveItem } =
  vi.hoisted(() => ({
    mockSafeLocalStorageClear: vi.fn(),
    mockSafeLocalStorageRemoveItem: vi.fn(),
  }));

vi.mock("@/components/yjg/common/util/ui-util", () => ({
  safeLocalStorage: {
    clear: mockSafeLocalStorageClear,
    removeItem: mockSafeLocalStorageRemoveItem,
  },
}));

const { mockClearAccessToken } = vi.hoisted(() => ({
  mockClearAccessToken: vi.fn(),
}));

vi.mock("./token-storage", () => ({
  TokenStorage: { clearAccessToken: mockClearAccessToken },
}));

// ================================ Import after mocks ================================

import { useHandleLogout } from "../auth-utils";

// ================================ Tests ================================

describe("useHandleLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    // Default: non-tablet path
    Object.defineProperty(window, "location", {
      value: { pathname: "/reception" },
      writable: true,
    });
    // Suppress console.error from the logout error path
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("calls logout API and clears state on success", async () => {
    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockMutateAsync).toHaveBeenCalledOnce();
    expect(mockSetUser).toHaveBeenCalledOnce();
    expect(mockClearAccessToken).toHaveBeenCalledOnce();
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it("redirects to /auth/sign-in for non-tablet path", async () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/reception" },
      writable: true,
    });

    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
    expect(mockSafeLocalStorageClear).toHaveBeenCalledOnce();
    expect(mockSafeLocalStorageRemoveItem).not.toHaveBeenCalled();
  });

  it("redirects to /auth/tablet/sign-in for tablet path", async () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/tablet/some-page" },
      writable: true,
    });

    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/tablet/sign-in");
    expect(mockSafeLocalStorageRemoveItem).toHaveBeenCalledWith(
      "user_tablet"
    );
    expect(mockSafeLocalStorageClear).not.toHaveBeenCalled();
  });

  it("redirects to /auth/tablet/sign-in for /auth/tablet path", async () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/auth/tablet/sign-in" },
      writable: true,
    });

    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/tablet/sign-in");
    expect(mockSafeLocalStorageRemoveItem).toHaveBeenCalledWith(
      "user_tablet"
    );
  });

  it("still clears state when logout API throws", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current();
    });

    // State should still be cleared in the finally block
    expect(mockSetUser).toHaveBeenCalledOnce();
    expect(mockClearAccessToken).toHaveBeenCalledOnce();
    expect(mockClear).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("calls preventDefault when event is provided", async () => {
    const mockPreventDefault = vi.fn();
    const mockEvent = {
      preventDefault: mockPreventDefault,
    } as unknown as React.MouseEvent;

    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current(mockEvent);
    });

    expect(mockPreventDefault).toHaveBeenCalledOnce();
  });

  it("works without event argument", async () => {
    const { result } = renderHook(() => useHandleLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockMutateAsync).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalled();
  });
});
