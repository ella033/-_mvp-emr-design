"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type SettingPageTableEvent<T> = {
  type: "rowClick" | "action" | "cellClick" | "rowContextMenu";
  actionId?: string;
  columnId?: string;
  position?: { x: number; y: number };
  row: T;
};

export type SettingPageColumn<T> = {
  id: string;
  header: ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  render: (
    row: T,
    ctx: { emit: (event: SettingPageTableEvent<T>) => void }
  ) => ReactNode;
};

type SettingPageTableProps<T> = {
  isLoading: boolean;
  error: string | null;
  rows: T[];
  columns: SettingPageColumn<T>[];
  rowKey: (row: T) => string;
  emptyMessage: string;
  loadingMessage?: string;
  errorActionLabel?: string;
  onErrorAction?: () => void;
  onEvent?: (event: SettingPageTableEvent<T>) => void;
};

export function SettingPageTable<T>({
  isLoading,
  error,
  rows,
  columns,
  rowKey,
  emptyMessage,
  loadingMessage = "데이터를 불러오는 중입니다...",
  errorActionLabel,
  onErrorAction,
  onEvent,
}: SettingPageTableProps<T>) {
  const emit = (event: SettingPageTableEvent<T>) => {
    onEvent?.(event);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {loadingMessage}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-rose-600">
        <span>{error}</span>
        {errorActionLabel && onErrorAction ? (
          <button
            type="button"
            onClick={onErrorAction}
            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
          >
            {errorActionLabel}
          </button>
        ) : null}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm text-slate-800">
      <thead className="sticky top-0 z-10">
        <tr className="h-7 text-[13px] font-medium text-slate-700">
          {columns.map((column, index) => (
            <th
              key={column.id}
              className={`bg-[#f4f4f5] px-2 py-[6.5px] text-center ${index === 0 ? "first:rounded-tl-[6px] first:pl-4" : ""} ${
                index === columns.length - 1
                  ? "last:rounded-tr-[6px] last:pr-4"
                  : ""
              }`}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={rowKey(row)}
            className="h-8 border-b border-[#eaebec] bg-white text-[13px] text-slate-700 last:border-0 hover:bg-slate-50"
            onClick={() => emit({ type: "rowClick", row })}
            onContextMenu={(event) => {
              event.preventDefault();
              emit({
                type: "rowContextMenu",
                row,
                position: { x: event.clientX, y: event.clientY },
              });
            }}
          >
            {columns.map((column, index) => (
              <td
                key={column.id}
                className={`px-2 py-1.5 text-center ${index === 0 ? "first:pl-4" : ""} ${
                  index === columns.length - 1 ? "last:pr-4" : ""
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  emit({ type: "cellClick", columnId: column.id, row });
                }}
              >
                {column.render(row, {
                  emit: (event) =>
                    emit({
                      ...event,
                      columnId: event.columnId ?? column.id,
                      row: event.row ?? row,
                    }),
                })}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
