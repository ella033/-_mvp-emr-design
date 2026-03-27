"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useUserStore } from "@/store/user-store";
import { PatientChatsService } from "@/services/patient-chats-service";
import type {
  PatientChatMessage,
  PatientChatListResponse,
} from "@/types/patient-chat-types";

const PAGE_SIZE = 50;

export function usePatientChat(patientId: number | string | undefined | null) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useUserStore();
  const numericId = patientId ? Number(patientId) : null;

  // 내가 방금 변경한 작업의 타임스탬프 — 소켓 이벤트 중복 refetch 방지용
  const lastMutationTimeRef = useRef(0);

  const messagesKey = ["patient-chats", numericId] as const;
  const pinnedKey = ["patient-chats", numericId, "pinned"] as const;

  // ── 무한 스크롤 메시지 조회 ──
  const messagesQuery = useInfiniteQuery<PatientChatListResponse>({
    queryKey: messagesKey,
    queryFn: ({ pageParam }) =>
      PatientChatsService.getMessages(
        numericId!,
        pageParam as number | undefined,
        PAGE_SIZE
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasNextPage) return undefined;
      return lastPage.nextCursor ?? undefined;
    },
    enabled: !!numericId,
  });

  // 모든 페이지의 메시지를 하나로 합치고 중복 제거
  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    const all = pages.flatMap((page) => page.items ?? []);
    // id 기반 중복 제거
    const seen = new Set<number>();
    return all.filter((msg) => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [messagesQuery.data]);

  const pinnedQuery = useQuery({
    queryKey: pinnedKey,
    queryFn: () => PatientChatsService.getPinnedMessages(numericId!),
    enabled: !!numericId,
  });

  // ── 메시지 생성 (옵티미스틱) ──
  const createMutation = useMutation({
    mutationFn: (content: string) =>
      PatientChatsService.createMessage(numericId!, content),
    onMutate: async (content: string) => {
      lastMutationTimeRef.current = Date.now();
      await queryClient.cancelQueries({ queryKey: [...messagesKey] });

      const previous = queryClient.getQueryData(messagesKey);

      // 임시 메시지 (음수 id로 구분)
      const optimistic: PatientChatMessage = {
        id: -Date.now(),
        content,
        authorId: user?.id ?? 0,
        authorName: (user as any)?.name ?? "",
        isPinned: false,
        createDateTime: new Date().toISOString(),
        updateDateTime: null,
      };

      // infiniteQuery 데이터 구조에 맞게 첫 번째 페이지 앞에 추가
      queryClient.setQueryData(messagesKey, (old: any) => {
        if (!old) return old;
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          items: [optimistic, ...(newPages[0]?.items ?? [])],
        };
        return { ...old, pages: newPages };
      });

      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
    },
  });

  // ── 메시지 수정/핀 토글 (옵티미스틱) ──
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { content?: string; isPinned?: boolean };
    }) => PatientChatsService.updateMessage(id, data),
    onMutate: async ({ id, data }) => {
      lastMutationTimeRef.current = Date.now();
      await queryClient.cancelQueries({ queryKey: [...messagesKey] });
      await queryClient.cancelQueries({ queryKey: [...pinnedKey] });

      const prevMessages = queryClient.getQueryData(messagesKey);
      const prevPinned = queryClient.getQueryData<PatientChatMessage[]>([
        ...pinnedKey,
      ]);

      // infiniteQuery 페이지 내 메시지 업데이트
      queryClient.setQueryData(messagesKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: PatientChatListResponse) => ({
            ...page,
            items: page.items.map((msg: PatientChatMessage) =>
              msg.id === id
                ? { ...msg, ...data, updateDateTime: new Date().toISOString() }
                : msg
            ),
          })),
        };
      });

      // 핀 목록 업데이트
      if (data.isPinned !== undefined) {
        queryClient.setQueryData<PatientChatMessage[]>(
          [...pinnedKey],
          (old) => {
            if (data.isPinned) {
              const target = messages.find((m) => m.id === id);
              if (target && !old?.some((m) => m.id === id)) {
                return [...(old ?? []), { ...target, isPinned: true }];
              }
            } else {
              return old?.filter((m) => m.id !== id) ?? [];
            }
            return old ?? [];
          }
        );
      }

      return { prevMessages, prevPinned };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevMessages) {
        queryClient.setQueryData(messagesKey, context.prevMessages);
      }
      if (context?.prevPinned) {
        queryClient.setQueryData([...pinnedKey], context.prevPinned);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
      queryClient.invalidateQueries({ queryKey: [...pinnedKey] });
    },
  });

  // ── 메시지 삭제 (옵티미스틱) ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => PatientChatsService.deleteMessage(id),
    onMutate: async (id: number) => {
      lastMutationTimeRef.current = Date.now();
      await queryClient.cancelQueries({ queryKey: [...messagesKey] });
      await queryClient.cancelQueries({ queryKey: [...pinnedKey] });

      const prevMessages = queryClient.getQueryData(messagesKey);
      const prevPinned = queryClient.getQueryData<PatientChatMessage[]>([
        ...pinnedKey,
      ]);

      queryClient.setQueryData(messagesKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: PatientChatListResponse) => ({
            ...page,
            items: page.items.filter(
              (msg: PatientChatMessage) => msg.id !== id
            ),
          })),
        };
      });
      queryClient.setQueryData<PatientChatMessage[]>(
        [...pinnedKey],
        (old) => old?.filter((msg) => msg.id !== id) ?? []
      );

      return { prevMessages, prevPinned };
    },
    onError: (_err, _id, context) => {
      if (context?.prevMessages) {
        queryClient.setQueryData(messagesKey, context.prevMessages);
      }
      if (context?.prevPinned) {
        queryClient.setQueryData([...pinnedKey], context.prevPinned);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
      queryClient.invalidateQueries({ queryKey: [...pinnedKey] });
    },
  });

  // ── 소켓 리스너: 다른 사람의 변경만 refetch ──
  useEffect(() => {
    if (!socket || !numericId) return;

    const handleAny = (_eventName: string, ...args: any[]) => {
      const payload = args?.[0];
      if (!_eventName?.startsWith("db.")) return;
      if (payload?.table !== "patient_chat") return;

      const record =
        payload?.new ?? payload?.data ?? payload?.record ?? payload;
      const recordPatientId = record?.patientId ?? record?.patient_id;
      if (recordPatientId && Number(recordPatientId) !== numericId) return;

      // 내가 방금(1초 이내) mutation 한 경우 → 이미 옵티미스틱 + onSettled에서 처리됨
      if (Date.now() - lastMutationTimeRef.current < 1000) return;

      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
      queryClient.invalidateQueries({ queryKey: [...pinnedKey] });
    };

    socket.onAny(handleAny);
    return () => {
      socket.offAny(handleAny);
    };
  }, [socket, numericId, queryClient]);

  return {
    messages,
    pinnedMessages: pinnedQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isPinnedLoading: pinnedQuery.isLoading,
    sendMessage: createMutation.mutateAsync,
    updateMessage: updateMutation.mutateAsync,
    deleteMessage: deleteMutation.mutateAsync,
    isSending: createMutation.isPending,
    // 페이징
    fetchNextPage: messagesQuery.fetchNextPage,
    hasNextPage: messagesQuery.hasNextPage,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
  };
}
