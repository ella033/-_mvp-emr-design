import { create } from "zustand";
import { PrintersService } from "@/services/printers-service";
import type { PrinterRecord } from "@/types/printer-types";
import type { PrinterOutputTypeWithSetting } from "@/types/printer-settings";

type PrintersQuery = {
  availableOnly?: boolean;
  includeAgents?: boolean;
};

type Agent = {
  id: string;
  pcName: string;
  status: string;
  lastSeenAt: string;
  printerCount: number;
};

type AgentPrinter = {
  id: string;
  name: string;
  displayName: string | null;
  capabilities?: {
    bins: string[];
    color: boolean;
    duplex: boolean;
    collate: boolean;
    paperSizes: string[];
  };
};

type PrintersState = {
  printers: PrinterRecord[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  lastQuery: PrintersQuery;
  fetchPrinters: (params?: PrintersQuery) => Promise<PrinterRecord[]>;
  setPrinters: (printers: PrinterRecord[]) => void;
  upsertPrinter: (printer: PrinterRecord) => void;
  removePrinter: (printerId: string) => void;
  updatePrinter: (printerId: string, patch: Partial<PrinterRecord>) => void;
  reset: () => void;
  // Agent 관련 상태
  agents: Agent[];
  isLoadingAgents: boolean;
  fetchAgents: () => Promise<Agent[]>;
  // Agent 프린터 목록
  printerListsByAgentId: Record<string, AgentPrinter[]>;
  isLoadingAgentPrinters: Record<string, boolean>;
  fetchAgentDevices: (agentId: string) => Promise<AgentPrinter[]>;
  // OutputTypes 상태
  outputTypes: PrinterOutputTypeWithSetting[];
  isLoadingOutputTypes: boolean;
  fetchOutputTypes: () => Promise<PrinterOutputTypeWithSetting[]>;
};

const defaultQuery: PrintersQuery = { availableOnly: false, includeAgents: true };

export const usePrintersStore = create<PrintersState>((set, get) => ({
  printers: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  lastQuery: { ...defaultQuery },
  fetchPrinters: async (params) => {
    const query = { ...defaultQuery, ...(params ?? get().lastQuery) };
    set({ isLoading: true, error: null, lastQuery: query });
    try {
      const list = await PrintersService.getPrinters(query);
      set({ printers: list, isLoading: false, hasLoaded: true });
      return list;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load printers";
      set({ isLoading: false, error: message, hasLoaded: true });
      throw err;
    }
  },
  setPrinters: (printers) => set({ printers }),
  upsertPrinter: (printer) =>
    set((state) => {
      const index = state.printers.findIndex((item) => item.id === printer.id);
      if (index === -1) {
        return { printers: [...state.printers, printer] };
      }
      const next = state.printers.slice();
      next[index] = printer;
      return { printers: next };
    }),
  removePrinter: (printerId) =>
    set((state) => ({
      printers: state.printers.filter((printer) => printer.id !== printerId),
    })),
  updatePrinter: (printerId, patch) =>
    set((state) => ({
      printers: state.printers.map((printer) =>
        printer.id === printerId ? { ...printer, ...patch } : printer
      ),
    })),
  reset: () =>
    set({
      printers: [],
      isLoading: false,
      error: null,
      hasLoaded: false,
      lastQuery: { ...defaultQuery },
    }),
  // Agent 관련 액션
  agents: [],
  isLoadingAgents: false,
  fetchAgents: async () => {
    set({ isLoadingAgents: true });
    try {
      const agentsList = await PrintersService.getAgents();
      set({ agents: agentsList, isLoadingAgents: false });
      return agentsList;
    } catch (err) {
      set({ isLoadingAgents: false });
      throw err;
    }
  },
  // Agent 프린터 목록 관련 액션
  printerListsByAgentId: {},
  isLoadingAgentPrinters: {},
  fetchAgentDevices: async (agentId: string) => {
    set((state) => ({
      isLoadingAgentPrinters: {
        ...state.isLoadingAgentPrinters,
        [agentId]: true,
      },
    }));
    try {
      const devices = await PrintersService.getAgentDevices(agentId);
      const printerList = devices.printers.map((printer) => ({
        id: printer.id,
        name: printer.displayName || printer.name,
        displayName: printer.displayName,
        capabilities: printer.capabilities,
      }));
      set((state) => ({
        printerListsByAgentId: {
          ...state.printerListsByAgentId,
          [agentId]: printerList,
        },
        isLoadingAgentPrinters: {
          ...state.isLoadingAgentPrinters,
          [agentId]: false,
        },
      }));
      return printerList;
    } catch (err) {
      set((state) => ({
        isLoadingAgentPrinters: {
          ...state.isLoadingAgentPrinters,
          [agentId]: false,
        },
      }));
      throw err;
    }
  },
  // OutputTypes 관련 액션
  outputTypes: [],
  isLoadingOutputTypes: false,
  fetchOutputTypes: async () => {
    set({ isLoadingOutputTypes: true });
    try {
      const data = await PrintersService.getPrinterSettings();
      const sortedOutputTypes = data.outputTypes
        .slice()
        .sort((a, b) => {
          if (a.sortOrder === b.sortOrder) {
            return a.name.localeCompare(b.name);
          }
          return a.sortOrder - b.sortOrder;
        });
      set({ outputTypes: sortedOutputTypes, isLoadingOutputTypes: false });
      return sortedOutputTypes;
    } catch (err) {
      set({ isLoadingOutputTypes: false });
      throw err;
    }
  },
}));
