"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastHelpers } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal } from "lucide-react";
import { PrintersService } from "@/services/printers-service";
import { usePrintersStore } from "@/store/printers-store";
import { usePrinterList } from "../../hooks/use-printer-list";
import type {
  CreatePrinterWorkstationOverrideDto,
  PrinterWorkstationOverrideRecord,
  UpdatePrinterWorkstationOverrideDto,
} from "@/types/printer-settings";

const CLEAR_VALUE = "__NONE__";

const shouldShowTraySelect = (
  printerId: string | null,
  suggestedTrays: string[] | undefined
): boolean => {
  return !!printerId && !!suggestedTrays && suggestedTrays.length > 0;
};

const shouldShowPaperSelect = (
  paperTrayCode: string | null,
  suggestedPaper: string[] | undefined
): boolean => {
  return !!paperTrayCode && !!suggestedPaper && suggestedPaper.length > 0;
};

type OverrideFormState = {
  outputTypeCode: string;
  agentId: string | null;
  pcName: string | null;
  printerId: string | null;
  paperTrayCode: string | null;
  paperTypeCode: string | null;
  labelSizeCode: string | null;
  orientation: string | null;
  duplexMode: string | null;
  copies: number | null;
  priority: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isEnabled: boolean;
  options: Record<string, any> | null;
};

type LocalOverride = OverrideFormState & {
  id: string;
  isNew?: boolean;
};


const recordToLocal = (
  record: PrinterWorkstationOverrideRecord
): LocalOverride => ({
  id: record.id,
  outputTypeCode: record.outputTypeCode,
  agentId: record.agentId ?? null,
  pcName: record.pcName ?? null,
  printerId: record.printerId ?? null,
  paperTrayCode: record.paperTrayCode ?? null,
  paperTypeCode: record.paperTypeCode ?? null,
  labelSizeCode: record.labelSizeCode ?? null,
  orientation: record.orientation ?? null,
  duplexMode: record.duplexMode ?? null,
  copies:
    typeof record.copies === "number"
      ? record.copies
      : record.copies === null
        ? null
        : 1,
  priority: record.priority,
  effectiveFrom: record.effectiveFrom ?? null,
  effectiveTo: record.effectiveTo ?? null,
  isEnabled: record.isEnabled,
  options: record.options ?? null,
  isNew: false,
});

const createBlankOverride = (
  currentPriority: number
): LocalOverride => ({
  id: `temp-${Date.now()}`,
  outputTypeCode: "",
  agentId: null,
  pcName: null,
  printerId: null,
  paperTrayCode: null,
  paperTypeCode: null,
  labelSizeCode: null,
  orientation: null,
  duplexMode: null,
  copies: null,
  priority: currentPriority + 1,
  effectiveFrom: null,
  effectiveTo: null,
  isEnabled: true,
  options: null,
  isNew: true,
});

const serializeOverride = (override: OverrideFormState): string =>
  JSON.stringify({
    outputTypeCode: override.outputTypeCode ?? null,
    agentId: override.agentId ?? null,
    pcName: override.pcName ?? null,
    printerId: override.printerId ?? null,
    paperTrayCode: override.paperTrayCode ?? null,
    paperTypeCode: override.paperTypeCode ?? null,
    labelSizeCode: override.labelSizeCode ?? null,
    orientation: override.orientation ?? null,
    duplexMode: override.duplexMode ?? null,
    copies: override.copies ?? null,
    priority: override.priority,
    effectiveFrom: override.effectiveFrom ?? null,
    effectiveTo: override.effectiveTo ?? null,
    isEnabled: override.isEnabled,
    options: override.options ?? null,
  });

const toCreateDto = (
  form: OverrideFormState
): CreatePrinterWorkstationOverrideDto => ({
  outputTypeCode: form.outputTypeCode || "",
  agentId: form.agentId,
  pcName: form.pcName,
  printerId: form.printerId,
  paperTrayCode: form.paperTrayCode,
  paperTypeCode: form.paperTypeCode,
  labelSizeCode: form.labelSizeCode,
  orientation: form.orientation,
  duplexMode: form.duplexMode,
  copies: form.copies ?? null,
  priority: form.priority,
  effectiveFrom: form.effectiveFrom,
  effectiveTo: form.effectiveTo,
  isEnabled: form.isEnabled,
  options: form.options ?? null,
});

const toUpdateDto = (
  form: OverrideFormState
): UpdatePrinterWorkstationOverrideDto => ({
  outputTypeCode: form.outputTypeCode,
  agentId: form.agentId,
  pcName: form.pcName,
  printerId: form.printerId,
  paperTrayCode: form.paperTrayCode,
  paperTypeCode: form.paperTypeCode,
  labelSizeCode: form.labelSizeCode,
  orientation: form.orientation,
  duplexMode: form.duplexMode,
  copies: form.copies ?? null,
  priority: form.priority,
  effectiveFrom: form.effectiveFrom,
  effectiveTo: form.effectiveTo,
  isEnabled: form.isEnabled,
  options: form.options ?? null,
});

export default function ExceptionSettings() {
  const { printers } = usePrinterList({ listenEvents: false });
  const agents = usePrintersStore((state) => state.agents);
  const fetchAgents = usePrintersStore((state) => state.fetchAgents);
  const printerListsByAgentId = usePrintersStore((state) => state.printerListsByAgentId);
  const fetchAgentDevices = usePrintersStore((state) => state.fetchAgentDevices);
  const outputTypes = usePrintersStore((state) => state.outputTypes);
  const fetchOutputTypes = usePrintersStore((state) => state.fetchOutputTypes);

  const { success, error } = useToastHelpers();

  const [localOverrides, setLocalOverrides] = useState<LocalOverride[]>([]);
  const [originalHashes, setOriginalHashes] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [savingOverrideId, setSavingOverrideId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const hasRequestedRef = useRef(false);


  const pcOptions = useMemo(() => {
    const pcNameSet = new Set<string>();
    for (const agent of agents) {
      const pcName = agent.pcName?.trim();
      if (!pcName) {
        continue;
      }
      pcNameSet.add(pcName);
    }
    return Array.from(pcNameSet).sort((a, b) => a.localeCompare(b));
  }, [agents]);

  const outputTypeOptions = useMemo(
    () =>
      outputTypes.map((type) => ({
        code: type.code,
        label: type.name || type.code,
      })),
    [outputTypes]
  );

  const allPrinters = useMemo(() => {
    // 모든 프린터를 가져오기 (agent별 프린터 목록 + 전체 프린터 목록)
    const printerMap = new Map<string, any>();

    // 전체 프린터 목록 추가
    printers.forEach((printer) => {
      if (printer.id) {
        printerMap.set(printer.id, printer);
      }
    });

    // agent별 프린터 목록 추가
    Object.values(printerListsByAgentId).forEach((agentPrinters) => {
      agentPrinters.forEach((printer) => {
        if (printer.id && !printerMap.has(printer.id)) {
          printerMap.set(printer.id, printer);
        }
      });
    });

    return Array.from(printerMap.values()).sort((a, b) => {
      const nameA = a.displayName?.trim() || a.name || "";
      const nameB = b.displayName?.trim() || b.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [printers, printerListsByAgentId]);

  const loadOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PrintersService.getPrinterSettings();
      const sortedOverrides = data.overrides
        .slice()
        .sort((a, b) => {
          if (a.priority === b.priority) {
            return a.outputTypeCode.localeCompare(b.outputTypeCode);
          }
          return a.priority - b.priority;
        });

      const locals = sortedOverrides.map((override) => recordToLocal(override));
      const hashes: Record<string, string> = {};
      locals.forEach((override) => {
        hashes[override.id] = serializeOverride(override);
      });

      setLocalOverrides(locals);
      setOriginalHashes(hashes);

      // agentId가 있는 override들의 프린터 목록 미리 로드
      const agentIds = new Set<string>();
      sortedOverrides.forEach((override) => {
        if (override.agentId) {
          agentIds.add(override.agentId);
        }
      });

      // 각 agent의 프린터 목록을 병렬로 로드
      await Promise.all(
        Array.from(agentIds).map((agentId) =>
          fetchAgentDevices(agentId).catch((err) => {
            console.error(`Agent ${agentId} 프린터 목록 로드 실패:`, err);
          })
        )
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "예외 설정을 불러오지 못했습니다.";
      error("예외 설정 조회 실패", <p>{message}</p>);
    } finally {
      setLoading(false);
    }
  }, [error, fetchAgentDevices]);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;
    loadOverrides();
  }, [loadOverrides]);

  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents().catch((err) => {
        console.error("PC 목록 조회 실패", err);
      });
    }
  }, [agents.length, fetchAgents]);

  useEffect(() => {
    if (outputTypes.length === 0) {
      fetchOutputTypes().catch((err) => {
        console.error("출력물 목록 조회 실패", err);
      });
    }
  }, [outputTypes.length, fetchOutputTypes]);

  const handleOverrideChange = useCallback(
    (id: string, patch: Partial<LocalOverride>) => {
      setLocalOverrides((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...patch, isNew: item.isNew } : item
        )
      );
    },
    []
  );

  // 중복 체크 함수
  const checkDuplicate = useCallback(
    (override: LocalOverride, excludeId?: string): LocalOverride | null => {
      return localOverrides.find((item) => {
        if (excludeId && item.id === excludeId) return false; // 자기 자신은 제외

        // PC 비교 (null이면 모두 null로 간주)
        const pcMatch = (item.pcName ?? null) === (override.pcName ?? null);
        // 출력물 비교
        const outputTypeMatch = item.outputTypeCode === override.outputTypeCode;
        // 프린터 비교
        const printerMatch = (item.printerId ?? null) === (override.printerId ?? null);

        // PC, 출력물, 프린터 중 하나라도 선택되어 있고, 모두 일치하면 중복
        const hasAnySelection = override.pcName || override.outputTypeCode || override.printerId;
        const hasAllMatching = pcMatch && outputTypeMatch && printerMatch;

        return hasAnySelection && hasAllMatching;
      }) || null;
    },
    [localOverrides]
  );

  const handlePcChange = useCallback(
    (id: string, value: string) => {
      const currentOverride = localOverrides.find((item) => item.id === id);
      if (!currentOverride) return;

      let newPcName: string | null = null;
      let newAgentId: string | null = null;

      if (value !== CLEAR_VALUE) {
        const selectedAgent = agents.find((agent) => agent.pcName === value);
        if (selectedAgent) {
          newPcName = selectedAgent.pcName;
          newAgentId = selectedAgent.id;
        }
      }

      handleOverrideChange(id, {
        pcName: newPcName,
        agentId: newAgentId,
      });

      // 변경 후 중복 체크
      const updatedOverride = {
        ...currentOverride,
        pcName: newPcName,
        agentId: newAgentId,
      };
      const duplicate = checkDuplicate(updatedOverride, id);

      if (duplicate && (updatedOverride.outputTypeCode || updatedOverride.printerId)) {
        const outputTypeName = outputTypes.find((type) => type.code === updatedOverride.outputTypeCode)?.name || updatedOverride.outputTypeCode || "미선택";
        const printerName = allPrinters.find((p) => p.id === updatedOverride.printerId)?.name || updatedOverride.printerId || "미선택";
        error(
          "중복 예외 발견",
          <p>동일한 PC({newPcName || "미선택"}), 출력물({outputTypeName}), 프린터({printerName}) 조합의 예외가 이미 존재합니다.</p>
        );
      }
    },
    [handleOverrideChange, agents, localOverrides, checkDuplicate, outputTypes, allPrinters, error]
  );

  const handleOutputTypeChange = useCallback(
    (id: string, value: string) => {
      const currentOverride = localOverrides.find((item) => item.id === id);
      if (!currentOverride) return;

      const newOutputTypeCode = value === CLEAR_VALUE ? "" : value;
      handleOverrideChange(id, {
        outputTypeCode: newOutputTypeCode,
      });

      // 변경 후 중복 체크
      const updatedOverride = {
        ...currentOverride,
        outputTypeCode: newOutputTypeCode,
      };
      const duplicate = checkDuplicate(updatedOverride, id);

      if (duplicate && (updatedOverride.pcName || updatedOverride.printerId)) {
        const outputTypeName = outputTypes.find((type) => type.code === newOutputTypeCode)?.name || newOutputTypeCode || "미선택";
        const printerName = allPrinters.find((p) => p.id === updatedOverride.printerId)?.name || updatedOverride.printerId || "미선택";
        error(
          "중복 예외 발견",
          <p>동일한 PC({updatedOverride.pcName || "미선택"}), 출력물({outputTypeName}), 프린터({printerName}) 조합의 예외가 이미 존재합니다.</p>
        );
      }
    },
    [handleOverrideChange, localOverrides, checkDuplicate, outputTypes, allPrinters, error]
  );

  const handlePrinterChange = useCallback(
    (id: string, value: string) => {
      const currentOverride = localOverrides.find((item) => item.id === id);
      if (!currentOverride) return;

      const printerId = value === CLEAR_VALUE ? null : value;
      handleOverrideChange(id, {
        printerId,
        paperTrayCode: null,
        paperTypeCode: null,
      });

      // 변경 후 중복 체크
      const updatedOverride = {
        ...currentOverride,
        printerId,
        paperTrayCode: null,
        paperTypeCode: null,
      };
      const duplicate = checkDuplicate(updatedOverride, id);

      if (duplicate && (updatedOverride.pcName || updatedOverride.outputTypeCode)) {
        const outputTypeName = outputTypes.find((type) => type.code === updatedOverride.outputTypeCode)?.name || updatedOverride.outputTypeCode || "미선택";
        const printerName = allPrinters.find((p) => p.id === printerId)?.name || printerId || "미선택";
        error(
          "중복 예외 발견",
          <p>동일한 PC({updatedOverride.pcName || "미선택"}), 출력물({outputTypeName}), 프린터({printerName}) 조합의 예외가 이미 존재합니다.</p>
        );
      }
    },
    [handleOverrideChange, localOverrides, checkDuplicate, outputTypes, allPrinters, error]
  );

  const handleTrayChange = useCallback(
    (id: string, value: string) => {
      handleOverrideChange(id, {
        paperTrayCode: value === CLEAR_VALUE ? null : value,
      });
    },
    [handleOverrideChange]
  );

  const handlePaperChange = useCallback(
    (id: string, value: string) => {
      handleOverrideChange(id, {
        paperTypeCode: value === CLEAR_VALUE ? null : value,
      });
    },
    [handleOverrideChange]
  );

  const handleAddOverride = useCallback(() => {
    setLocalOverrides((prev) => {
      const highestPriority =
        prev.length > 0
          ? Math.max(...prev.map((item) => item.priority))
          : 0;
      return [
        ...prev,
        createBlankOverride(highestPriority),
      ];
    });
  }, []);

  const handleDeleteOverride = useCallback(
    async (override: LocalOverride) => {
      if (override.isNew) {
        setLocalOverrides((prev) =>
          prev.filter((item) => item.id !== override.id)
        );
        return;
      }

      if (
        !window.confirm("선택한 예외 설정을 삭제할까요? 이 작업은 되돌릴 수 없습니다.")
      ) {
        return;
      }

      try {
        await PrintersService.deletePrinterOverride(override.id);
        setLocalOverrides((prev) =>
          prev.filter((item) => item.id !== override.id)
        );
        setOriginalHashes((prev) => {
          const next = { ...prev };
          delete next[override.id];
          return next;
        });
        success("예외 삭제 완료", <p>선택한 예외가 삭제되었습니다.</p>);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "예외를 삭제하지 못했습니다.";
        error("예외 삭제 실패", <p>{message}</p>);
      }
    },
    [error, success]
  );

  const handleSaveOverride = useCallback(
    async (override: LocalOverride) => {
      const missingFields: string[] = [];
      if (!override.outputTypeCode) {
        missingFields.push("출력물");
      }
      if (!override.printerId) {
        missingFields.push("프린터");
      }
      if (missingFields.length > 0) {
        error(
          "저장할 수 없습니다",
          <p>{missingFields.join(", ")}을(를) 먼저 선택해주세요.</p>
        );
        return;
      }

      // 중복 체크: 동일한 PC + 출력물 + 프린터 조합
      const duplicateOverride = localOverrides.find((item) => {
        if (item.id === override.id) return false; // 자기 자신은 제외

        // PC 비교 (null이면 모두 null로 간주)
        const pcMatch = (item.pcName ?? null) === (override.pcName ?? null);
        // 출력물 비교
        const outputTypeMatch = item.outputTypeCode === override.outputTypeCode;
        // 프린터 비교
        const printerMatch = (item.printerId ?? null) === (override.printerId ?? null);

        return pcMatch && outputTypeMatch && printerMatch;
      });

      if (duplicateOverride) {
        // 출력물 이름 가져오기
        const outputTypeName = outputTypes.find((type) => type.code === override.outputTypeCode)?.name || override.outputTypeCode;
        // 프린터 이름 가져오기
        const printerName = allPrinters.find((p) => p.id === override.printerId)?.name || override.printerId || "미선택";

        // 중복 발견 시 확인창 표시
        const confirmMessage = `동일한 PC(${override.pcName || "미선택"}), 출력물(${outputTypeName}), 프린터(${printerName}) 조합의 예외가 이미 존재합니다.\n기존 예외를 현재 설정으로 수정하시겠습니까?`;

        if (!window.confirm(confirmMessage)) {
          return; // 취소 시 저장하지 않음
        }

        // 기존 예외를 현재 설정으로 업데이트
        setSavingOverrideId(duplicateOverride.id);
        try {
          const payload = toUpdateDto(override);
          await PrintersService.updatePrinterOverride(duplicateOverride.id, payload);

          // 현재 예외가 새로 추가된 것이라면 삭제
          if (override.isNew) {
            setLocalOverrides((prev) =>
              prev.filter((item) => item.id !== override.id)
            );
          }

          success("예외 설정 저장 완료", <p>기존 예외가 현재 설정으로 수정되었습니다.</p>);
          await loadOverrides();
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "예외 설정을 저장하지 못했습니다.";
          error("예외 설정 저장 실패", <p>{message}</p>);
        } finally {
          setSavingOverrideId(null);
        }
        return;
      }

      setSavingOverrideId(override.id);
      try {
        if (override.isNew) {
          const payload = toCreateDto(override);
          await PrintersService.createPrinterOverride(payload);
        } else {
          const baseline = originalHashes[override.id];
          if (
            baseline &&
            serializeOverride(override) === baseline
          ) {
            setSavingOverrideId(null);
            return;
          }
          const payload = toUpdateDto(override);
          await PrintersService.updatePrinterOverride(override.id, payload);
        }
        success("예외 설정 저장 완료", <p>변경사항이 저장되었습니다.</p>);
        await loadOverrides();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "예외 설정을 저장하지 못했습니다.";
        error("예외 설정 저장 실패", <p>{message}</p>);
      } finally {
        setSavingOverrideId(null);
      }
    },
    [error, loadOverrides, localOverrides, originalHashes, success, outputTypes, allPrinters]
  );

  // 전체 변경사항 확인
  const hasAnyChanges = useMemo(() => {
    return localOverrides.some((override) => {
      if (override.isNew) return true;
      const baseline = originalHashes[override.id];
      if (!baseline) return false;
      return serializeOverride(override) !== baseline;
    });
  }, [localOverrides, originalHashes]);

  // 변경된 row들이 모두 유효한지 확인 (PC, 출력물, 프린터 필수)
  const areChangedRowsValid = useMemo(() => {
    const changedOverrides = localOverrides.filter((override) => {
      if (override.isNew) return true;
      const baseline = originalHashes[override.id];
      if (!baseline) return false;
      return serializeOverride(override) !== baseline;
    });

    // 변경된 row가 없으면 true (저장할 것이 없으므로)
    if (changedOverrides.length === 0) {
      return true;
    }

    // 변경된 모든 row가 필수 필드를 가지고 있어야 함 (PC, 출력물, 프린터)
    return changedOverrides.every(
      (override) => override.pcName && override.outputTypeCode && override.printerId
    );
  }, [localOverrides, originalHashes]);

  // 전체 저장 함수
  const handleSaveAll = useCallback(async () => {
    if (!hasAnyChanges) {
      return;
    }

    setSavingAll(true);
    try {
      // 변경된 항목들만 저장
      const savePromises = localOverrides.map(async (override) => {
        // 변경사항이 없는 경우 스킵
        if (!override.isNew) {
          const baseline = originalHashes[override.id];
          if (baseline && serializeOverride(override) === baseline) {
            return;
          }
        }

        // 필수 필드 검증
        if (!override.outputTypeCode || !override.printerId) {
          return;
        }

        // 중복 체크는 개별 저장 함수에서 처리하므로 여기서는 저장만 수행
        if (override.isNew) {
          const payload = toCreateDto(override);
          await PrintersService.createPrinterOverride(payload);
        } else {
          const payload = toUpdateDto(override);
          await PrintersService.updatePrinterOverride(override.id, payload);
        }
      });

      await Promise.all(savePromises);
      success("예외 설정 저장 완료", <p>모든 변경사항이 저장되었습니다.</p>);
      await loadOverrides();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "예외 설정을 저장하지 못했습니다.";
      error("예외 설정 저장 실패", <p>{message}</p>);
    } finally {
      setSavingAll(false);
    }
  }, [hasAnyChanges, localOverrides, originalHashes, error, loadOverrides, success]);

  if (loading && localOverrides.length === 0) {
    return (
      <div className="self-stretch w-full h-full flex-1 bg-background rounded-[10px] outline outline-1 outline-offset-[-1px] outline-border flex flex-col justify-center items-center">
        <div className="text-xs text-muted-foreground">예외 설정을 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="self-stretch w-full h-full flex-1 bg-background rounded-[10px] outline outline-1 outline-offset-[-1px] outline-border flex flex-col overflow-hidden">
      <div className="self-stretch w-full p-4 flex flex-col gap-6 overflow-auto">
        <div className="self-stretch inline-flex justify-between items-center gap-3">
          <div className="inline-flex flex-col justify-start items-start gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-foreground text-base font-bold leading-snug cursor-help">
                  PC별 예외 설정
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  출력 시 먼저 해당 PC와 출력물 조합에 대한 예외 설정이 있는지 확인하고, 있으면 예외 설정을 적용합니다. 없으면 기본 프린터 설정을 적용합니다.
                </p>
              </TooltipContent>
            </Tooltip>
            {/* <div className="text-Gray-300_46474C text-[11px] leading-[13px]">
              PC나 에이전트별로 기본 설정을 덮어쓰는 경우에 사용합니다.
            </div> */}
          </div>
          <div className="inline-flex items-center gap-2">
            <Button
              onClick={handleSaveAll}
              disabled={!hasAnyChanges || !areChangedRowsValid || savingAll || outputTypes.length === 0}
            >
              {savingAll ? "저장 중..." : "저장"}
            </Button>
            <Button
              onClick={handleAddOverride}
              disabled={outputTypes.length === 0}
            >
              예외 추가
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {localOverrides.map((override) => {
            // 선택된 프린터 찾기 (전체 프린터 목록에서)
            const selectedPrinter = override.printerId
              ? allPrinters.find((p) => p.id === override.printerId)
              : undefined;
            const suggestedTrays =
              selectedPrinter?.capabilities?.bins ?? undefined;
            const suggestedPaper =
              selectedPrinter?.capabilities?.paperSizes ?? undefined;

            return (
              <div
                key={override.id}
                className="self-stretch min-w-[340px] p-3 pt-5 bg-card rounded-md outline outline-1 outline-offset-[-1px] outline-border flex flex-col gap-4 relative transition-all duration-200 hover:shadow-md hover:outline-border hover:bg-accent"
              >
                <div className="flex justify-between items-start gap-2 absolute top-2 right-3">
                  <div className="inline-flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onSelect={() => handleDeleteOverride(override)}
                        >
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="inline-flex flex-col gap-1.5">
                    <div className="text-foreground text-[13px] leading-4">
                      PC
                    </div>
                    <Select
                      value={override.pcName ?? CLEAR_VALUE}
                      onValueChange={(value) =>
                        handlePcChange(override.id, value)
                      }
                    >
                      <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
                        <SelectValue placeholder="미선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
                        {pcOptions.map((pc) => (
                          <SelectItem key={pc} value={pc}>
                            {pc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="inline-flex flex-col gap-1.5">
                    <div className="text-foreground text-[13px] leading-4">
                      출력물
                    </div>
                    <Select
                      value={override.outputTypeCode ?? CLEAR_VALUE}
                      onValueChange={(value) =>
                        handleOutputTypeChange(override.id, value)
                      }
                      disabled={outputTypes.length === 0}
                    >
                      <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
                        <SelectValue placeholder="출력물 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
                        {outputTypeOptions.map((option) => (
                          <SelectItem key={option.code} value={option.code}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="inline-flex flex-col gap-1.5">
                    <div className="text-foreground text-[13px] leading-4">
                      프린터
                    </div>
                    <Select
                      value={override.printerId ?? CLEAR_VALUE}
                      onValueChange={(value) =>
                        handlePrinterChange(override.id, value)
                      }
                      disabled={allPrinters.length === 0}
                    >
                      <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
                        <SelectValue placeholder="프린터 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
                        {allPrinters.map((printer) => {
                          const displayName = printer.displayName?.trim();
                          const label = displayName
                            ? `${displayName} (${printer.name})`
                            : printer.name;
                          return (
                            <SelectItem key={printer.id} value={printer.id}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {shouldShowTraySelect(override.printerId, suggestedTrays) ? (
                    <div className="inline-flex flex-col gap-1.5">
                      <div className="text-foreground text-[13px] leading-4">
                        용지함
                      </div>
                      <Select
                        value={override.paperTrayCode ?? CLEAR_VALUE}
                        onValueChange={(value) =>
                          handleTrayChange(override.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
                          <SelectValue placeholder="용지함" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
                          {suggestedTrays?.map((tray: string) => (
                            <SelectItem key={tray} value={tray}>
                              {tray}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div></div>
                  )}

                  {shouldShowPaperSelect(override.paperTrayCode, suggestedPaper) ? (
                    <div className="inline-flex flex-col gap-1.5">
                      <div className="text-foreground text-[13px] leading-4">
                        사이즈
                      </div>
                      <Select
                        value={override.paperTypeCode ?? CLEAR_VALUE}
                        onValueChange={(value) =>
                          handlePaperChange(override.id, value)
                        }
                      >
                        <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
                          <SelectValue placeholder="사이즈" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
                          {suggestedPaper?.map((paper: string) => (
                            <SelectItem key={paper} value={paper}>
                              {paper}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>
            );
          })}

          {localOverrides.length === 0 && !loading ? (
            <div className="text-xs text-muted-foreground">
              등록된 예외가 없습니다. 상단의 &quot;예외 추가&quot; 버튼을 눌러 새 예외를 등록하세요.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
