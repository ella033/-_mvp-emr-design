import { useMutation } from "@tanstack/react-query";
import { receptionPanelSettingsService } from "@/services/reception-panel-settings-service";
import type { PanelCounts } from "@/types/panel-config-types";
import { useReceptionPanelStore } from "@/store/reception/reception-panel-store";

// TODO: 패널 개수 업데이트 후 store 업데이트 필요
export const useUpdatePanelCountsFromSettings = () => {
  const { setPanelSettings } = useReceptionPanelStore();

  return useMutation({
    mutationFn: ({ hospitalId, panelCounts }: { hospitalId: string; panelCounts: PanelCounts }) =>
      receptionPanelSettingsService.updatePanelCountsFromSettings(hospitalId, panelCounts),
    onSuccess: (data) => {
      setPanelSettings(data);
    },
  });
}; 