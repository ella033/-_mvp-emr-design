import type { Socket } from "socket.io-client";

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_BASE || "https://localhost:53999";

// Storage helpers
const BINDING_KEY = (orgId: number | string) => `agent.binding.${orgId}`;

function setBinding(orgId: number | string, agentId: string, status: 'online' | 'offline') {
  try {
    localStorage.setItem(BINDING_KEY(orgId), JSON.stringify({ agentId, status, boundAt: Date.now() }));
  } catch {}
}

function updateStatus(orgId: number | string, status: 'online' | 'offline') {
  try {
    const raw = localStorage.getItem(BINDING_KEY(orgId));
    if (!raw) return;
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || !parsed.agentId) return;
    localStorage.setItem(BINDING_KEY(orgId), JSON.stringify({ ...parsed, status, boundAt: Date.now() }));
  } catch {}
}

function getBinding(orgId: number | string | null): { agentId: string | null; status: 'online' | 'offline' | null } {
  if (orgId == null) return { agentId: null, status: null };
  try {
    const raw = localStorage.getItem(BINDING_KEY(orgId));
    if (!raw) return { agentId: null, status: null };
    const parsed = JSON.parse(raw || '{}');
    return {
      agentId: parsed?.agentId || null,
      // 저장된 status는 참조용이며, 실제 표시용은 presence 이벤트로 갱신한다.
      status: parsed?.status || null,
    };
  } catch {
    return { agentId: null, status: null };
  }
}

async function healthCheck(timeoutMs = 800): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${AGENT_BASE}`, { signal: controller.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

async function setHospitalViaLoopback(orgId: number): Promise<{ ok: boolean; agentId?: string | null }> {
  try {
    const res = await fetch(`${AGENT_BASE}/api/set-hospital`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId })
    });
    if (!res.ok) return { ok: false };
    const data = await res.json().catch(() => ({} as any));
    return { ok: true, agentId: (data as any)?.Data?.AgentId || null };
  } catch {
    return { ok: false };
  }
}

function openCustomUrl(orgId: number) {
  try {
    window.location.href = `nextemr://set-hospital?orgId=${encodeURIComponent(orgId)}`;
  } catch {}
}

class AgentBindingManager {
  private retryTimer: number | null = null;
  private getSocket: (() => Socket | null) | null = null;
  private onBindingChanged: (() => void) | null = null;

  init(getSocket: () => Socket | null, onBindingChanged?: () => void) {
    this.getSocket = getSocket;
    this.onBindingChanged = onBindingChanged || null;
  }

  getBinding(orgId: string | number | null) {
    return getBinding(orgId);
  }

  setBinding(orgId: string | number, agentId: string, status: 'online' | 'offline') {
    setBinding(orgId, agentId, status);
    this.onBindingChanged && this.onBindingChanged();
  }

  updateStatus(orgId: string | number, status: 'online' | 'offline') {
    updateStatus(orgId, status);
    this.onBindingChanged && this.onBindingChanged();
  }

  async ensureWake(orgId: number) {
    const ok = await healthCheck();
    if (ok) {
      const r = await setHospitalViaLoopback(orgId);
      if (!r.ok) openCustomUrl(orgId);
    } else {
      openCustomUrl(orgId);
    }
  }

  async performSetHospital(orgId: number): Promise<boolean> {
    const r = await setHospitalViaLoopback(orgId);
    if (r.ok) {
      const socket = this.getSocket ? this.getSocket() : null;
      console.log("[AgentBinding] join-agent-room", { agentId: r.agentId, orgId });
      if (socket) socket.emit('join-agent-room', { agentId: r.agentId, orgId }, (_ack: unknown) => {
        console.log("[AgentBinding] join-agent-room ack", _ack);
      });
      return true;
    }
    return false;
  }

  start(orgId: number) {
    if (!orgId) return;
    const { status } = getBinding(orgId);
    // online이 아니면 재시도 타이머 가동; online이면 중단
    if (status === 'online') {
      this.stop();
      return;
    }
    if (this.retryTimer) return;
    this.retryTimer = window.setInterval(async () => {
      const ok = await this.performSetHospital(orgId);
      if (ok) this.stop();
    }, 5000);
  }

  stop() {
    if (this.retryTimer) {
      window.clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

export const AgentBinding = new AgentBindingManager();

export type { };


