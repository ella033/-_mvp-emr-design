"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePrintersStore } from "@/store/printers-store";

interface AgentPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (data: {
    agentId: string;
    printerId: string;
    bin?: string;
    paperSize?: string;
  }) => void;
}

export default function AgentPrintDialog({
  open,
  onOpenChange,
  onPrint,
}: AgentPrintDialogProps) {
  const agents = usePrintersStore((state) => state.agents);
  const isLoadingAgents = usePrintersStore((state) => state.isLoadingAgents);
  const fetchAgents = usePrintersStore((state) => state.fetchAgents);
  const printerListsByAgentId = usePrintersStore((state) => state.printerListsByAgentId);
  const isLoadingAgentPrinters = usePrintersStore((state) => state.isLoadingAgentPrinters);
  const fetchAgentDevices = usePrintersStore((state) => state.fetchAgentDevices);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>("");
  const [selectedBin, setSelectedBin] = useState<string>("");
  const [selectedPaperSize, setSelectedPaperSize] = useState<string>("");

  useEffect(function loadAgentsOnMount() {
    if (open && agents.length === 0) {
      fetchAgents().catch((err) => {
        console.error("[AgentPrintDialog] Failed to fetch agents", err);
      });
    }
  }, [open, agents.length, fetchAgents]);

  useEffect(function loadPrintersWhenAgentSelected() {
    if (selectedAgentId && !printerListsByAgentId[selectedAgentId]) {
      fetchAgentDevices(selectedAgentId).catch((err) => {
        console.error("[AgentPrintDialog] Failed to fetch agent devices", err);
      });
    }
  }, [selectedAgentId, printerListsByAgentId, fetchAgentDevices]);

  useEffect(function resetSelectionsOnAgentChange() {
    setSelectedPrinterId("");
    setSelectedBin("");
    setSelectedPaperSize("");
  }, [selectedAgentId]);

  useEffect(function resetBinAndPaperOnPrinterChange() {
    setSelectedBin("");
    setSelectedPaperSize("");
  }, [selectedPrinterId]);

  const selectedPrinters = selectedAgentId ? printerListsByAgentId[selectedAgentId] || [] : [];
  const selectedPrinter = selectedPrinters.find((p) => p.id === selectedPrinterId);
  const availableBins = selectedPrinter?.capabilities?.bins || [];
  const availablePaperSizes = selectedPrinter?.capabilities?.paperSizes || [];

  const canPrint = selectedAgentId && selectedPrinterId;

  const handlePrint = () => {
    if (!canPrint) return;

    onPrint({
      agentId: selectedAgentId,
      printerId: selectedPrinterId,
      bin: selectedBin || undefined,
      paperSize: selectedPaperSize || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agent 프린트</DialogTitle>
          <DialogDescription>
            프린터를 선택하고 출력 설정을 지정한 후 출력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Agent (PC)</label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Agent를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAgents ? (
                  <SelectItem value="_loading" disabled>
                    로딩 중...
                  </SelectItem>
                ) : agents.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    사용 가능한 Agent가 없습니다
                  </SelectItem>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.pcName} ({agent.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedAgentId && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">프린터</label>
              <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="프린터를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingAgentPrinters[selectedAgentId] ? (
                    <SelectItem value="_loading" disabled>
                      로딩 중...
                    </SelectItem>
                  ) : selectedPrinters.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      사용 가능한 프린터가 없습니다
                    </SelectItem>
                  ) : (
                    selectedPrinters.map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        {printer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPrinterId && availableBins.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">트레이</label>
              <Select value={selectedBin} onValueChange={setSelectedBin}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="트레이를 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {availableBins.map((bin) => (
                    <SelectItem key={bin} value={bin}>
                      {bin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPrinterId && availablePaperSizes.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">용지 크기</label>
              <Select value={selectedPaperSize} onValueChange={setSelectedPaperSize}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="용지 크기를 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {availablePaperSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handlePrint} disabled={!canPrint}>
            출력
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

