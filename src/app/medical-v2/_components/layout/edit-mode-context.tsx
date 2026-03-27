"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface EditModeContextValue {
  isEditMode: boolean;
  onHideWidget: (widgetId: string) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
}

const EditModeContext = createContext<EditModeContextValue>({
  isEditMode: false,
  onHideWidget: () => {},
  activeCardId: null,
  setActiveCardId: () => {},
});

export function EditModeProvider({
  isEditMode,
  onHideWidget,
  children,
}: {
  isEditMode: boolean;
  onHideWidget: (widgetId: string) => void;
  children: React.ReactNode;
}) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  return (
    <EditModeContext.Provider value={{ isEditMode, onHideWidget, activeCardId, setActiveCardId }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
