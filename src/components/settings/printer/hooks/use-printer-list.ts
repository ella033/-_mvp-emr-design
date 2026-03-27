import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { printerApi } from "../api/printer.api";
import { useSocket } from "@/contexts/SocketContext";

type UsePrinterListOptions = {
  listenEvents?: boolean;
};

export function usePrinterList(options?: UsePrinterListOptions) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const listenEvents = options?.listenEvents ?? true;

  const {
    data: printers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["printers", "list"],
    queryFn: () => printerApi.getPrinters({ availableOnly: false, includeAgents: true }),
  });

  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshMutation = useMutation({
    mutationFn: () => printerApi.triggerRefresh(),
    onSuccess: () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["printers", "list"] });
        fallbackTimerRef.current = null;
      }, 15_000);
    },
  });

  // Socket event listeners
  useEffect(() => {
    if (!listenEvents) return;
    if (!socket) return;

    const onAgentEvent = (data: any) => {
      if (data && data.type === "printer.changed") {
        queryClient.invalidateQueries({ queryKey: ["printers", "list"] });
      }
    };

    const onSyncCompleted = () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ["printers", "list"] });
    };

    socket.on("agent-event", onAgentEvent);
    socket.on("printer.sync.completed", onSyncCompleted);

    return () => {
      socket.off("agent-event", onAgentEvent);
      socket.off("printer.sync.completed", onSyncCompleted);
    };
  }, [listenEvents, socket, queryClient]);

  // Window event listener for local refresh (legacy support)
  useEffect(() => {
    if (!listenEvents) return;
    const onLocalRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["printers", "list"] });
    };
    window.addEventListener("printers:list:refresh", onLocalRefresh);
    return () => window.removeEventListener("printers:list:refresh", onLocalRefresh);
  }, [listenEvents, queryClient]);

  return {
    printers,
    isLoading,
    isError,
    refreshPrinters: refreshMutation.mutateAsync,
    isRefreshing: refreshMutation.isPending,
  };
}
