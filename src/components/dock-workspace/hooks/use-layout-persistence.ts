"use client";

import { useEffect, useRef, useCallback } from "react";
import type { DockWorkspaceStore } from "../store/dock-workspace-store";
import type { DockLayout, DockLayoutSettingsConfig, TabData } from "../types";
import {
  serializeLayout,
  deserializeLayout,
  migrateRcDockLayout,
} from "../store/serialization";
import { useSettingsStore } from "@/store/settings-store";
import {
  useCreateOrUpdateSetting,
  useDeleteSetting,
} from "@/hooks/api/use-settings";
import { AUTO_SAVE_DEBOUNCE_MS } from "../constants";

interface UseLayoutPersistenceOptions {
  store: DockWorkspaceStore;
  settingsConfig?: DockLayoutSettingsConfig;
  enableAutoSave?: boolean;
  tabRegistry: React.RefObject<Map<string, TabData>>;
  onLayoutChange?: (layout: DockLayout) => void;
}

/**
 * Hook for persisting dock layout to the settings store (server-backed).
 * Matches the existing docking-panel-provider.tsx pattern:
 * - 500ms debounce + JSON hash comparison
 * - Load saved layout on mount
 * - Delete corrupted layouts
 * - rc-dock format migration
 */
export function useLayoutPersistence({
  store,
  settingsConfig,
  enableAutoSave = true,
  tabRegistry,
  onLayoutChange,
}: UseLayoutPersistenceOptions) {
  const { mutate: saveToServer } = useCreateOrUpdateSetting();
  const { mutate: deleteFromServer } = useDeleteSetting();
  const isSettingsLoaded = useSettingsStore((s) => s.isLoaded);
  const getSetting = useSettingsStore(
    (s) => s.getSettingsByCategoryAndPageContext
  );

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHashRef = useRef<string | null>(null);
  const isLayoutLoadedRef = useRef(false);

  // ===== Auto-save =====
  const autoSave = useCallback(
    (layout: DockLayout) => {
      if (!enableAutoSave || !settingsConfig) return;

      // floatbox가 존재하면 저장하지 않음 (float 상태는 세션 전용)
      // float 시 dockbox에서 탭이 빠지므로, 이 상태를 저장하면 탭이 유실됨
      if (layout.floatbox && layout.floatbox.length > 0) return;

      const serialized = serializeLayout(layout);
      let hash: string | null = null;
      try {
        hash = JSON.stringify(serialized);
      } catch {
        return;
      }

      if (hash === lastHashRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (hash) lastHashRef.current = hash;
        saveToServer({
          scope: settingsConfig.scope,
          category: settingsConfig.category,
          pageContext: settingsConfig.pageContext,
          settings: { dockLayout: serialized },
        });
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    [enableAutoSave, settingsConfig, saveToServer]
  );

  // ===== Subscribe to layout changes for auto-save =====
  useEffect(() => {
    if (!enableAutoSave || !settingsConfig) return;

    const unsub = store.subscribe((state, prevState) => {
      if (state.layout !== prevState.layout) {
        autoSave(state.layout);
      }
    });

    return () => {
      unsub();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [store, autoSave, enableAutoSave, settingsConfig]);

  // ===== Load saved layout on mount =====
  useEffect(() => {
    if (!settingsConfig || !isSettingsLoaded || isLayoutLoadedRef.current)
      return;

    isLayoutLoadedRef.current = true;

    const saved = getSetting(
      settingsConfig.category,
      settingsConfig.pageContext
    );
    const savedLayout = saved?.settings?.dockLayout;

    if (!savedLayout) return;

    try {
      // Try to deserialize as new format first
      let serialized = savedLayout;

      // Check if it's rc-dock format (has no 'type' field on children)
      if (
        serialized.dockbox &&
        !serialized.dockbox.type
      ) {
        const migrated = migrateRcDockLayout(
          serialized as Record<string, unknown>
        );
        if (migrated) {
          serialized = migrated;
        } else {
          throw new Error("Failed to migrate rc-dock layout");
        }
      }

      const registry = tabRegistry.current ?? new Map<string, TabData>();
      const deserialized = deserializeLayout(serialized, registry);

      lastHashRef.current = JSON.stringify(serialized);
      store.getState().setLayout(deserialized);
      onLayoutChange?.(deserialized);
    } catch (error) {
      console.error(
        "[DockWorkspace] Failed to load layout, deleting:",
        error
      );
      deleteFromServer({
        scope: settingsConfig.scope,
        category: settingsConfig.category,
        pageContext: settingsConfig.pageContext,
      });
    }
  }, [
    isSettingsLoaded,
    settingsConfig,
    store,
    tabRegistry,
    getSetting,
    deleteFromServer,
    onLayoutChange,
  ]);

  return { autoSave };
}
