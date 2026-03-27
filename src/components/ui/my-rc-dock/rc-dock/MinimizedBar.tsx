// @ts-nocheck
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { MyButton } from "@/components/yjg/my-button";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { cn } from "@/components/yjg/common/util/ui-util";
import type { BoxData, PanelData } from "./DockData";
import { DockContextType } from "./DockData";

interface Props {
  boxData: BoxData;
  expanded: boolean;
  onToggle: () => void;
}

interface MinimizedBarItemProps {
  panel: PanelData;
  onTogglePanel: (panel: PanelData) => void;
}

function MinimizedBarItem({ panel, onTogglePanel }: MinimizedBarItemProps) {
  const activeTab =
    panel.tabs.find((t) => t.id === panel.activeId) ?? panel.tabs[0];
  const title = (activeTab?.title as string) ?? panel.activeId ?? "—";
  const hasMultipleTabs = panel.tabs.length > 1;
  const isMinimized = !!panel.minimized;
  return (
    <MyTooltip content={isMinimized ? "클릭하면 복원" : "클릭하면 최소화"} side="top" size="xs" isFixedSize>
      <MyButton
        size="sm"
        isFixedSize
        variant={isMinimized ? "default" : "outline"}
        onClick={() => onTogglePanel(panel)}
        className="!min-w-0 !max-w-[180px]"
      >
        <span className="truncate">
          {title}
          {hasMultipleTabs && " …"}
        </span>
      </MyButton>
    </MyTooltip>
  );
}

export class MinimizedBar extends React.PureComponent<Props, unknown> {
  static contextType = DockContextType;
  declare context: React.ContextType<typeof DockContextType>;

  render(): React.ReactNode {
    const { boxData, expanded, onToggle } = this.props;
    // float 패널 전체를 바에 표시 (restore 후에도 float면 유지, dock 되면 floatbox에서 빠져서 사라짐)
    const floatPanels = (boxData.children || []).filter(
      (c): c is PanelData => "tabs" in c
    );
    if (floatPanels.length === 0) return null;

    const onTogglePanel = (panel: PanelData) => {
      if (panel.minimized) {
        this.context.dockMove(panel, null, "restore");
      } else {
        this.context.dockMove(panel, null, "minimize");
      }
    };

    const barBaseClass =
      "absolute bottom-0 left-0 flex flex-row items-center gap-[8px] bg-transparent z-[210]";
    const barClassName = expanded
      ? cn(barBaseClass, "right-0")
      : cn(barBaseClass, "justify-center");

    if (!expanded) {
      return (
        <div className={barClassName}>
          <MyTooltip content="펼치기" side="top" size="sm" isFixedSize>
            <MyButton
              variant="outline"
              size="sm"
              isFixedSize
              onClick={onToggle}
              className="rounded-full p-0 w-[20px] h-[20px]"
            >
              <ChevronRightIcon className="w-[10px] h-[10px]" />
            </MyButton>
          </MyTooltip>
        </div>
      );
    }

    return (
      <div className={barClassName}>
        <MyTooltip content="접기" side="top" size="sm" isFixedSize>
          <MyButton
            variant="outline"
            size="sm"
            isFixedSize
            onClick={onToggle}
            className="rounded-full p-0 w-[20px] h-[20px]"
          >
            <ChevronLeftIcon className="w-[10px] h-[10px]" />
          </MyButton>
        </MyTooltip>
        <div className="flex flex-1 flex-row items-center gap-[5px] min-w-0 my-scroll">
          {floatPanels.map((panel) => (
            <MinimizedBarItem
              key={panel.id}
              panel={panel}
              onTogglePanel={onTogglePanel}
            />
          ))}
        </div>
      </div>
    );
  }
}
