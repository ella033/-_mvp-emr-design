import MySplitPane from "@/components/yjg/my-split-pane";
import UsageGrid from "./usage-grid";
import UsageDetail from "./usage-detail";
import { useState } from "react";
import type { UsageCode } from "@/types/usage-code-types";

export default function Usage() {
  const [selectedUsage, setSelectedUsage] = useState<UsageCode | null>(null);

  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="library-usage"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[
          <UsageGrid
            key="usage-grid"
            selectedUsage={selectedUsage}
            setSelectedUsage={setSelectedUsage}
          />,
          <UsageDetail
            key="usage-detail"
            selectedUsage={selectedUsage}
            setSelectedUsage={setSelectedUsage}
          />,
        ]}
      />
    </div>
  );
}
