import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// ================================ API Mock Helper ================================

/**
 * Creates a vi.mock for @/lib/api/api-client with all HTTP methods mocked.
 *
 * Usage:
 * ```ts
 * const { mockGet, mockPost, mockPut, mockDelete } = mockApiClient();
 * mockGet.mockResolvedValue({ data: [] });
 * ```
 */
export function mockApiClient() {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockPatch = vi.fn();
  const mockDelete = vi.fn();

  vi.mock("@/lib/api/api-client", () => ({
    ApiClient: {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      patch: mockPatch,
      delete: mockDelete,
    },
  }));

  return { mockGet, mockPost, mockPut, mockPatch, mockDelete };
}

// ================================ React Query Hook Wrapper ================================

/**
 * Creates a wrapper component with a fresh QueryClient for testing React Query hooks.
 * Configured with retry: false and gcTime: 0 to avoid test interference.
 *
 * Usage with @testing-library/react renderHook:
 * ```ts
 * const { result } = renderHook(() => useSomeQuery(), {
 *   wrapper: createHookWrapper(),
 * });
 * ```
 */
export function createHookWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return Wrapper;
}

// ================================ Store Reset Helper ================================

/**
 * Resets all Zustand stores to their initial state.
 *
 * For Zustand stores, call each store's setState with the initial state,
 * or use the store's reset method if one is defined.
 *
 * Usage in afterEach:
 * ```ts
 * afterEach(() => {
 *   resetAllStores();
 * });
 * ```
 *
 * Note: Add individual store resets below as needed for your project.
 * Example:
 *   usePatientStore.setState(usePatientStore.getInitialState());
 */
export function resetAllStores() {
  // Add store resets here as needed. Example:
  // usePatientStore.setState(usePatientStore.getInitialState());
}
