// @ts-nocheck
import * as React from "react";
import type { PanelData } from "./DockData";
import { BoxData } from "./DockData";
import { DockPanel } from "./DockPanel";

interface Props {
  boxData: BoxData;
}

export class FloatBox extends React.PureComponent<Props, unknown> {
  render(): React.ReactNode {
    const { boxData } = this.props;
    const { children } = boxData;
    const normalPanels: React.ReactNode[] = [];

    for (const child of children) {
      if ("tabs" in child) {
        const panel = child as PanelData;
        if (!panel.minimized) {
          normalPanels.push(
            <DockPanel
              size={panel.size ?? 200}
              panelData={panel}
              key={panel.id}
            />
          );
        }
      }
    }

    return (
      <div className="dock-fbox-wrapper">
        <div className="dock-box dock-fbox">{normalPanels}</div>
      </div>
    );
  }
}
