import { Square, SquareCheck, XIcon } from "lucide-react";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { ContextMenuState } from "@/components/yjg/my-grid/my-grid";
import { usePrescriptionUserCodesDelete } from "@/hooks/master-data/use-prescription-user-codes-delete";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { usePrescriptionUserCodesToggleActive } from "@/hooks/master-data/use-prescription-user-codes-toggle-active";

interface PrescriptionUserCodeContextMenuProps {
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<
    React.SetStateAction<ContextMenuState>
  >;
  selectedRows: Set<MyGridRowType>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<MyGridRowType>>>;
  setLastSelectedRow: React.Dispatch<
    React.SetStateAction<MyGridRowType | null>
  >;
}

export default function PrescriptionUserCodeContextMenu({
  contextMenu,
  setContextMenu,
  selectedRows,
  setSelectedRows,
  setLastSelectedRow,
}: PrescriptionUserCodeContextMenuProps) {
  const toggleActivePrescriptionUserCodesMutation =
    usePrescriptionUserCodesToggleActive();
  const deletePrescriptionUserCodesMutation = usePrescriptionUserCodesDelete();
  const { success, error } = useToastHelpers();
  const queryClient = useQueryClient();

  const handleActiveSelected = (
    selectedRows: MyGridRowType[],
    isActive: boolean
  ) => {
    // todo: 선택된 항목들 활성화 로직
    const keysToActive = selectedRows.map((row) => Number(row.key));
    toggleActivePrescriptionUserCodesMutation.mutate(
      {
        ids: keysToActive,
        isActive: isActive,
      },
      {
        onSuccess: (data) => {
          success(data.message);
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === "prescription-user-codes",
          });
          closeContextMenu();
        },
        onError: (err: Error) => {
          error("활성화/비활성화 실패", err.message);
          closeContextMenu();
        },
      }
    );
  };

  const handleDeleteSelected = (selectedRows: MyGridRowType[]) => {
    const keysToDelete = selectedRows.map((row) => Number(row.key));

    deletePrescriptionUserCodesMutation.mutate(keysToDelete, {
      onSuccess: (data) => {
        success(data.message);
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "prescription-user-codes",
        });
        closeContextMenu();
      },
      onError: (err: Error) => {
        error("삭제 실패", err.message);
        closeContextMenu();
      },
    });
  };

  const closeContextMenu = () => {
    setSelectedRows(new Set());
    setLastSelectedRow(null);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const selectedList = Array.from(selectedRows);
  const selectedActive = selectedList.filter((row) => {
    const cell = row.cells.find((c) => c.headerKey === "isActive");
    const v = cell?.value;
    return v === true || v === "true";
  });
  const selectedInactive = selectedList.filter((row) => {
    const cell = row.cells.find((c) => c.headerKey === "isActive");
    const v = cell?.value;
    return v === false || v === "false";
  });
  const hasActive = selectedActive.length > 0;
  const hasInactive = selectedInactive.length > 0;

  const buttonClassName =
    "w-full px-4 py-2.5 text-left text-xs hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";

  return (
    <div
      className="flex flex-col gap-0 context-menu fixed bg-[var(--card)] border border-gray-300 rounded-sm shadow-lg z-50 p-0 min-w-[160px]"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasInactive && (
        <button
          className={buttonClassName}
          onClick={(e) => {
            e.stopPropagation();
            handleActiveSelected(selectedInactive, true);
          }}
          disabled={toggleActivePrescriptionUserCodesMutation.isPending}
        >
          <SquareCheck className="w-3 h-3 text-red-500" />
          {toggleActivePrescriptionUserCodesMutation.isPending
            ? "사용 처리 중..."
            : `선택한 ${selectedInactive.length}개 사용`}
        </button>
      )}
      {hasActive && (
        <button
          className={buttonClassName}
          onClick={(e) => {
            e.stopPropagation();
            handleActiveSelected(selectedActive, false);
          }}
          disabled={toggleActivePrescriptionUserCodesMutation.isPending}
        >
          <Square className="w-3 h-3 text-red-500" />
          {toggleActivePrescriptionUserCodesMutation.isPending
            ? "미사용 처리 중..."
            : `선택한 ${selectedActive.length}개 미사용`}
        </button>
      )}
      <button
        className={buttonClassName}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteSelected(Array.from(selectedRows));
        }}
        disabled={
          selectedRows.size === 0 ||
          deletePrescriptionUserCodesMutation.isPending
        }
      >
        <XIcon className="w-3 h-3 text-red-500" />
        {deletePrescriptionUserCodesMutation.isPending
          ? "삭제 중..."
          : `선택된 ${selectedRows.size}개 삭제`}
      </button>
    </div>
  );
}
