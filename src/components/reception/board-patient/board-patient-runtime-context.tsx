"use client";

import React, { createContext, useContext } from "react";

export type BoardPatientDirtyController = {
  hasChanges: (receptionId: string) => boolean;
  markChanged: (receptionId: string) => void;
  /**
   * dirty를 해제하면서 baseline을 함께 업데이트해야 하는 케이스가 있다.
   * (예: 외부 팝업에서 onUpdateReception 직후에는 내부 draft ref가 아직 갱신되지 않아
   *  레이스가 발생할 수 있으므로, 최신 스냅샷을 직접 넘겨 baseline을 올릴 수 있게 한다)
   */
  markUnchanged: (receptionId: string, nextBaseline?: unknown) => void;
};

type BoardPatientRuntime = {
  dirty: BoardPatientDirtyController;
};

const BoardPatientRuntimeContext = createContext<BoardPatientRuntime | null>(
  null
);

export function BoardPatientRuntimeProvider({
  dirtyController,
  children,
}: React.PropsWithChildren<{
  /** dirty 상태 컨트롤러(전략)를 외부에서 반드시 주입한다. */
  dirtyController: BoardPatientDirtyController;
}>) {
  return (
    <BoardPatientRuntimeContext.Provider value={{ dirty: dirtyController }}>
      {children}
    </BoardPatientRuntimeContext.Provider>
  );
}

export function useBoardPatientRuntime() {
  const ctx = useContext(BoardPatientRuntimeContext);
  if (!ctx) {
    throw new Error(
      "useBoardPatientRuntime must be used within <BoardPatientRuntimeProvider> (dirtyController is required)."
    );
  }
  return ctx;
}


