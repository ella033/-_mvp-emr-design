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
import { HospitalChatsService } from "@/services/hospital-chats-service";
import type {
  HospitalChatMessage,
  HospitalChatMessageListResponse,
  PatientMention,
} from "@/types/hospital-chat-types";

const PAGE_SIZE = 50;

export function useHospitalChat(roomId: number | null) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useUserStore();
  const lastMutationTimeRef = useRef(0);

  const messagesKey = ["hospital-chat-messages", roomId] as const;
  const pinnedKey = ["hospital-chat-pinned", roomId] as const;

  const messagesQuery = useInfiniteQuery<HospitalChatMessageListResponse>({
    queryKey: messagesKey,
    queryFn: ({ pageParam }) =>
      HospitalChatsService.getMessages(
        roomId!,
        pageParam as number | undefined,
        PAGE_SIZE
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasNextPage) return undefined;
      return lastPage.nextCursor ?? undefined;
    },
    enabled: !!roomId,
  });

  const pinnedQuery = useQuery({
    queryKey: pinnedKey,
    queryFn: () => HospitalChatsService.getPinnedMessages(roomId!),
    enabled: !!roomId,
  });

  const pinnedMessages = pinnedQuery.data ?? [];

  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    const all = pages.flatMap((page) => page.items ?? []);
    const seen = new Set<number>();
    return all.filter((msg) => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [messagesQuery.data]);

  // 메시지 생성 (옵티미스틱)
  const createMutation = useMutation({
    mutationFn: ({
      content,
      mentions,
    }: {
      content: string;
      mentions?: PatientMention[];
    }) => HospitalChatsService.createMessage(roomId!, content, mentions),
    onMutate: async ({ content }) => {
      lastMutationTimeRef.current = Date.now();
      await queryClient.cancelQueries({ queryKey: [...messagesKey] });
      const previous = queryClient.getQueryData(messagesKey);

      const optimistic: HospitalChatMessage = {
        id: -Date.now(),
        chatRoomId: roomId!,
        content,
        authorId: user?.id ?? 0,
        authorName: (user as any)?.name ?? "",
        mentions: null,
        isPinned: false,
        createDateTime: new Date().toISOString(),
        updateDateTime: null,
        deleteDateTime: null,
      };

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
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
    },
  });

  // 메시지 수정
  const updateMutation = useMutation({
    mutationFn: ({ msgId, content }: { msgId: number; content: string }) =>
      HospitalChatsService.updateMessage(roomId!, msgId, content),
    onMutate: async ({ msgId, content }) => {
      lastMutationTimeRef.current = Date.now();
      await queryClient.cancelQueries({ queryKey: [...messagesKey] });
      const previous = queryClient.getQueryData(messagesKey);

      queryClient.setQueryData(messagesKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: HospitalChatMessageListResponse) => ({
            ...page,
            items: page.items.map((msg: HospitalChatMessage) =>
              msg.id === msgId
                ? {
                    ...msg,
                    content,
                    updateDateTime: new Date().toISOString(),
                  }
                : msg
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
    },
  });

  // 메시지 삭제
  const deleteMutation = useMutation({
    mutationFn: (msgId: number) =>
      HospitalChatsService.deleteMessage(roomId!, msgId),
    onMutate: async (msgId: number) => {
      lastMutationTimeRef.current = Date.now();
      await queryClient.cancelQueries({ queryKey: [...messagesKey] });
      const previous = queryClient.getQueryData(messagesKey);

      queryClient.setQueryData(messagesKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: HospitalChatMessageListResponse) => ({
            ...page,
            items: page.items.filter(
              (msg: HospitalChatMessage) => msg.id !== msgId
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
    },
  });

  // 핀 토글
  const togglePinMutation = useMutation({
    mutationFn: ({ msgId, isPinned }: { msgId: number; isPinned: boolean }) =>
      HospitalChatsService.togglePin(roomId!, msgId, isPinned),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
      queryClient.invalidateQueries({ queryKey: [...pinnedKey] });
    },
  });

  // 소켓 리스너: 다른 사람의 변경만 refetch
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleChatMessage = (_payload: any) => {
      const data = _payload?.data;
      if (data?.roomId !== roomId) return;
      if (Date.now() - lastMutationTimeRef.current < 1000) return;
      queryClient.invalidateQueries({ queryKey: [...messagesKey] });
      queryClient.invalidateQueries({ queryKey: [...pinnedKey] });
    };

    socket.on("chat.message", handleChatMessage);
    return () => {
      socket.off("chat.message", handleChatMessage);
    };
  }, [socket, roomId, queryClient]);

  return {
    messages,
    pinnedMessages,
    isLoading: messagesQuery.isLoading,
    sendMessage: createMutation.mutateAsync,
    updateMessage: updateMutation.mutateAsync,
    deleteMessage: deleteMutation.mutateAsync,
    togglePin: togglePinMutation.mutateAsync,
    isSending: createMutation.isPending,
    fetchNextPage: messagesQuery.fetchNextPage,
    hasNextPage: messagesQuery.hasNextPage,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
  };
}
