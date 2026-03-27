import { MyButton } from "@/components/yjg/my-button";
import { useVitalSignItems } from "@/hooks/vital-sign-item/use-vital-sign-items";
import { useState, useEffect, useCallback } from "react";
import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import type { UpsertManyVitalSignItemSettingsRequest } from "@/types/vital/vital-sign-item-setting-types";
import { useVitalSignItemUpsert } from "@/hooks/vital-sign-item/use-vital-sign-item-upsert";
import { useToastHelpers } from "@/components/ui/toast";
import VitalSignItemCard from "./vital-sign-item-card";
import { useQueryClient } from "@tanstack/react-query";
import { MasterDataTitle } from "../../(common)/common-controls";

export interface VitalSignItemWithActive extends VitalSignItem {
  isActive: boolean;
  sortNumber: number;
}

export default function VitalSign() {
  const { data: vitalSignItems = [] } = useVitalSignItems();
  const { mutate: upsertVitalSignItemSettings } = useVitalSignItemUpsert();
  const { success, error } = useToastHelpers();
  const queryClient = useQueryClient();

  // 로컬 상태로 관리 (저장 전까지 변경사항 유지)
  const [unusedItems, setUnusedItems] = useState<VitalSignItemWithActive[]>([]);
  const [usedItems, setUsedItems] = useState<VitalSignItemWithActive[]>([]);

  // 선택된 항목들
  const [selectedUnusedIds, setSelectedUnusedIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedUsedIds, setSelectedUsedIds] = useState<Set<number>>(
    new Set()
  );

  // 드래그 상태
  const [draggedItem, setDraggedItem] =
    useState<VitalSignItemWithActive | null>(null);
  const [dragSource, setDragSource] = useState<"unused" | "used" | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    if (vitalSignItems.length > 0) {
      const unused: VitalSignItemWithActive[] = [];
      const used: VitalSignItemWithActive[] = [];

      vitalSignItems.forEach((item) => {
        const setting = item.vitalSignItemSettings?.[0];
        const itemWithActive: VitalSignItemWithActive = {
          ...item,
          isActive: setting?.isActive ?? false,
          sortNumber: setting?.sortNumber ?? 0,
        };

        if (itemWithActive.isActive) {
          used.push(itemWithActive);
        } else {
          unused.push(itemWithActive);
        }
      });

      // 사용 항목은 sortNumber로 정렬
      used.sort((a, b) => a.sortNumber - b.sortNumber);
      setUnusedItems(unused);
      setUsedItems(used);
    }
  }, [vitalSignItems]);

  // 항목 선택 토글
  const toggleUnusedSelection = useCallback((id: number) => {
    setSelectedUnusedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleUsedSelection = useCallback((id: number) => {
    setSelectedUsedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 미사용 → 사용으로 이동
  const moveToUsed = useCallback(() => {
    if (selectedUnusedIds.size === 0) return;

    const itemsToMove = unusedItems.filter((item) =>
      selectedUnusedIds.has(item.id)
    );
    const remainingUnused = unusedItems.filter(
      (item) => !selectedUnusedIds.has(item.id)
    );

    // sortNumber 업데이트
    const maxSortNumber =
      usedItems.length > 0
        ? Math.max(...usedItems.map((i) => i.sortNumber))
        : 0;

    const movedItems = itemsToMove.map((item, index) => ({
      ...item,
      isActive: true,
      sortNumber: maxSortNumber + index + 1,
    }));

    setUnusedItems(remainingUnused);
    setUsedItems([...usedItems, ...movedItems]);
    setSelectedUnusedIds(new Set());
  }, [unusedItems, usedItems, selectedUnusedIds]);

  // 사용 → 미사용으로 이동
  const moveToUnused = useCallback(() => {
    if (selectedUsedIds.size === 0) return;

    const itemsToMove = usedItems.filter((item) =>
      selectedUsedIds.has(item.id)
    );
    const remainingUsed = usedItems.filter(
      (item) => !selectedUsedIds.has(item.id)
    );

    const movedItems = itemsToMove.map((item) => ({
      ...item,
      isActive: false,
      sortNumber: 0,
    }));

    setUsedItems(remainingUsed);
    setUnusedItems([...unusedItems, ...movedItems]);
    setSelectedUsedIds(new Set());
  }, [unusedItems, usedItems, selectedUsedIds]);

  // 드래그 시작
  const handleDragStart = useCallback(
    (item: VitalSignItemWithActive, source: "unused" | "used") => {
      setDraggedItem(item);
      setDragSource(source);
    },
    []
  );

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragSource(null);
  }, []);

  // 드롭 처리
  const handleDrop = useCallback(
    (target: "unused" | "used", targetIndex?: number) => {
      if (!draggedItem || !dragSource) return;

      // 같은 영역 내에서의 이동 (순서 변경)
      if (
        dragSource === target &&
        target === "used" &&
        targetIndex !== undefined
      ) {
        setUsedItems((prev) => {
          const newItems = prev.filter((item) => item.id !== draggedItem.id);
          newItems.splice(targetIndex, 0, draggedItem);
          // sortNumber 재정렬
          return newItems.map((item, index) => ({
            ...item,
            sortNumber: index + 1,
          }));
        });
      }
      // 다른 영역으로 이동
      else if (dragSource !== target) {
        if (target === "used") {
          // 미사용 → 사용
          setUnusedItems((prev) =>
            prev.filter((item) => item.id !== draggedItem.id)
          );
          setUsedItems((prev) => {
            const newItems = [...prev];
            const insertIndex = targetIndex ?? newItems.length;
            const newItem = {
              ...draggedItem,
              isActive: true,
              sortNumber: insertIndex + 1,
            };
            newItems.splice(insertIndex, 0, newItem);
            // sortNumber 재정렬
            return newItems.map((item, index) => ({
              ...item,
              sortNumber: index + 1,
            }));
          });
        } else {
          // 사용 → 미사용
          setUsedItems((prev) =>
            prev.filter((item) => item.id !== draggedItem.id)
          );
          setUnusedItems((prev) => [
            ...prev,
            { ...draggedItem, isActive: false, sortNumber: 0 },
          ]);
        }
      }

      handleDragEnd();
    },
    [draggedItem, dragSource, handleDragEnd]
  );

  // 저장
  const handleSave = useCallback(() => {
    const allItems = [...unusedItems, ...usedItems];

    const upsertData: UpsertManyVitalSignItemSettingsRequest = {
      items: allItems.map((item) => ({
        id: item.vitalSignItemSettings?.[0]?.id ?? undefined,
        itemId: item.id,
        sortNumber: item.sortNumber,
        isActive: item.isActive,
      })),
    };
    upsertVitalSignItemSettings(upsertData, {
      onSuccess: () => {
        success("바이탈 사인 설정 저장 완료");
        queryClient.invalidateQueries({ queryKey: ["vital-sign-items"] });
      },
      onError: (err) => {
        error("바이탈 사인 설정 저장 실패", err.message);
        handleCancel();
      },
    });
  }, [unusedItems, usedItems, upsertVitalSignItemSettings]);

  // 취소 (원래 데이터로 복원)
  const handleCancel = useCallback(() => {
    if (vitalSignItems.length > 0) {
      const unused: VitalSignItemWithActive[] = [];
      const used: VitalSignItemWithActive[] = [];

      vitalSignItems.forEach((item) => {
        const setting = item.vitalSignItemSettings?.[0];
        const itemWithActive: VitalSignItemWithActive = {
          ...item,
          isActive: setting?.isActive ?? false,
          sortNumber: setting?.sortNumber ?? 0,
        };

        if (itemWithActive.isActive) {
          used.push(itemWithActive);
        } else {
          unused.push(itemWithActive);
        }
      });

      used.sort((a, b) => a.sortNumber - b.sortNumber);
      setUnusedItems(unused);
      setUsedItems(used);
      setSelectedUnusedIds(new Set());
      setSelectedUsedIds(new Set());
    }
  }, [vitalSignItems]);

  return (
    <div className="w-full h-full flex flex-col p-5 gap-4">
      <MasterDataTitle
        title="바이탈 사인"
        tooltipText="원내에서 사용할 바이탈 사인 항목을 설정하고 순서를 지정합니다."
      />

      <div className="flex flex-1 gap-4 min-h-0 justify-center">
        <VitalSignItemCardContainer
          title={`미사용 항목 (${unusedItems.length})`}
        >
          <div
            className="flex-1 overflow-auto p-2 flex flex-col gap-1"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop("unused");
            }}
          >
            {unusedItems.map((item) => (
              <VitalSignItemCard
                key={item.id}
                item={item}
                isSelected={selectedUnusedIds.has(item.id)}
                isDragging={draggedItem?.id === item.id}
                onClick={() => toggleUnusedSelection(item.id)}
                onDragStart={() => handleDragStart(item, "unused")}
                onDragEnd={handleDragEnd}
              />
            ))}
            {unusedItems.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
                미사용 항목이 없습니다
              </div>
            )}
          </div>
        </VitalSignItemCardContainer>

        {/* 중앙: 이동 버튼 */}
        <div className="flex flex-col items-center justify-center gap-2">
          <MyButton
            variant="outline"
            size="sm"
            onClick={moveToUsed}
            disabled={selectedUnusedIds.size === 0}
          >
            →
          </MyButton>
          <MyButton
            variant="outline"
            size="sm"
            onClick={moveToUnused}
            disabled={selectedUsedIds.size === 0}
          >
            ←
          </MyButton>
        </div>

        <VitalSignItemCardContainer title={`사용 항목 (${usedItems.length})`}>
          <div
            className="flex-1 overflow-auto p-2 flex flex-col gap-1"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop("used");
            }}
          >
            {usedItems.map((item, index) => (
              <VitalSignItemCard
                key={item.id}
                item={item}
                isSelected={selectedUsedIds.has(item.id)}
                isDragging={draggedItem?.id === item.id}
                onClick={() => toggleUsedSelection(item.id)}
                onDragStart={() => handleDragStart(item, "used")}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop("used", index);
                }}
              />
            ))}
            {usedItems.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
                사용 항목이 없습니다
              </div>
            )}
          </div>
        </VitalSignItemCardContainer>
      </div>

      <div className="flex flex-row gap-2 justify-end flex-shrink-0">
        <MyButton variant="outline" onClick={handleCancel} className="px-5">
          취소
        </MyButton>
        <MyButton onClick={handleSave} className="px-5">
          저장
        </MyButton>
      </div>
    </div>
  );
}

function VitalSignItemCardContainer({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col border border-[var(--border-1)] rounded-md overflow-hidden">
      <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-1)]">
        <span className="text-[14px] font-bold">{title}</span>
      </div>
      {children}
    </div>
  );
}
