import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 기본 쿼리 훅 팩토리
export function createQueryHook<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  return () =>
    useQuery({
      queryKey,
      queryFn,
      ...options,
    });
}

// ID 기반 쿼리 훅 팩토리
export function createDetailQueryHook<T>(
  baseQueryKey: string[],
  queryFn: (id: number) => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
  }
) {
  return (id: number | undefined) =>
    useQuery({
      queryKey: [...baseQueryKey, "detail", id],
      queryFn: () => {
        if (!id) throw new Error("ID is required");
        return queryFn(id);
      },
      enabled: !!id && typeof id === "number" && id > 0,
      ...options,
    });
}

// 기본 뮤테이션 훅 팩토리
export function createMutationHook<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    invalidateQueries?: string[][];
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error) => void;
  }
) {
  return (customOptions?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onSuccess: (data, variables) => {
        // 기본 무효화 쿼리들
        if (options?.invalidateQueries) {
          options.invalidateQueries.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });
        }

        // 기본 성공 콜백
        options?.onSuccess?.(data, variables);

        // 커스텀 성공 콜백
        customOptions?.onSuccess?.(data, variables);
      },
      onError: (error) => {
        options?.onError?.(error);
        customOptions?.onError?.(error);
      },
    });
  };
}

// CRUD 뮤테이션 훅 팩토리
export function createCrudMutationHooks<TData, TCreateData, TUpdateData>(
  baseQueryKey: string[],
  service: {
    create: (data: TCreateData) => Promise<TData>;
    update: (id: number, data: TUpdateData) => Promise<TData>;
    delete: (id: number) => Promise<TData>;
  }
) {
  const createHook = createMutationHook(
    (data: TCreateData) => service.create(data),
    {
      invalidateQueries: [baseQueryKey],
    }
  );

  const updateHook = createMutationHook(
    ({ id, data }: { id: number; data: TUpdateData }) =>
      service.update(id, data),
    {
      invalidateQueries: [baseQueryKey, [...baseQueryKey, "detail"]],
    }
  );

  const deleteHook = createMutationHook((id: number) => service.delete(id), {
    invalidateQueries: [baseQueryKey, [...baseQueryKey, "detail"]],
  });

  return {
    create: createHook,
    update: updateHook,
    delete: deleteHook,
  };
}
