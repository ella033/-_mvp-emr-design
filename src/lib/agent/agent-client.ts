import type { Socket } from "socket.io-client";
import { AgentBinding } from "@/lib/agent/agent-binding";

export type PrintOptions = {
  copies?: number;
  duplex?: boolean;
  color?: boolean;
  tray?: string;
};

class AgentClientImpl {
  private getSocket: (() => Socket | null) | null = null;

  init(getSocket: () => Socket | null) {
    this.getSocket = getSocket;
  }

  // Presence / Binding helpers
  getBinding(orgId: string | null) {
    return AgentBinding.getBinding(orgId);
  }
  ensureWake(orgId: number) {
    return AgentBinding.ensureWake(orgId);
  }
  startAutoBind(orgId: string) {
    AgentBinding.start(orgId);
  }
  stopAutoBind() {
    AgentBinding.stop();
  }

  // Print commands (socket-first)
  async submitPrint(params: {
    orgId: string;
    agentId: string;
    jobId: string;
    printerId?: string;
    printerName?: string;
    contentUrl?: string;
    contentBase64?: string;
    options?: PrintOptions;
  }): Promise<void> {
    const socket = this.getSocket ? this.getSocket() : null;
    if (!socket || !socket.connected) throw new Error("소켓이 연결되지 않았습니다.");
    socket.emit("agent.print.submit", params);
  }

  async printTest(params: {
    orgId: string;
    agentId: string;
    printerId?: string;
    printerName?: string;
  }): Promise<void> {
    const socket = this.getSocket ? this.getSocket() : null;
    if (!socket || !socket.connected) throw new Error("소켓이 연결되지 않았습니다.");
    socket.emit("agent.print.test", params);
  }

  onPrintEvents(jobId: string, handlers: {
    accepted?: (payload: any) => void;
    progress?: (payload: any) => void;
    completed?: (payload: any) => void;
    error?: (payload: any) => void;
  }) {
    const socket = this.getSocket ? this.getSocket() : null;
    if (!socket) return () => {};
    const a = (p: any) => { if (p?.jobId === jobId) handlers.accepted?.(p); };
    const pr = (p: any) => { if (p?.jobId === jobId) handlers.progress?.(p); };
    const c = (p: any) => { if (p?.jobId === jobId) handlers.completed?.(p); };
    const e = (p: any) => { if (p?.jobId === jobId) handlers.error?.(p); };
    socket.on("agent.print.accepted", a);
    socket.on("agent.print.progress", pr);
    socket.on("agent.print.completed", c);
    socket.on("agent.print.error", e);
    return () => {
      socket.off("agent.print.accepted", a);
      socket.off("agent.print.progress", pr);
      socket.off("agent.print.completed", c);
      socket.off("agent.print.error", e);
    };
  }
}

export const AgentClient = new AgentClientImpl();


