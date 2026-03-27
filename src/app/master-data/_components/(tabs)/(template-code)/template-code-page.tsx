import MySplitPane from "@/components/yjg/my-split-pane";
import TemplateCodeGrid from "./template-code-grid";
import TemplateCodeDetail from "./template-code-detail";
import { useState } from "react";
import type { TemplateCode } from "@/types/template-code-types";

export default function TemplateCodePage() {
  const [selectedTemplateCode, setSelectedTemplateCode] =
    useState<TemplateCode | null>(null);

  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="library-template-code"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[
          <TemplateCodeGrid
            key="template-code-grid"
            selectedTemplateCode={selectedTemplateCode}
            setSelectedTemplateCode={setSelectedTemplateCode}
          />,
          <TemplateCodeDetail
            key="template-code-detail"
            selectedTemplateCode={selectedTemplateCode}
            setSelectedTemplateCode={setSelectedTemplateCode}
          />,
        ]}
      />
    </div>
  );
}
