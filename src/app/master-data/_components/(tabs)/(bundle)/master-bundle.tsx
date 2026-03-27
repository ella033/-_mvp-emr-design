import MySplitPane from "@/components/yjg/my-split-pane";
import BundleDetail, {
  type BundleDetailRef,
} from "./(bundle-detail)/bundle-detail";
import BundleList from "./(bundle-list)/bundle-list";
import { useState, useRef } from "react";

// BundleList의 ref 타입 정의
export interface BundleListRef {
  refetch: () => void;
}

export default function MasterBundle() {
  const [selectedBundleId, setSelectedBundleId] = useState<number>(0);
  const bundleDetailRef = useRef<BundleDetailRef | null>(null);
  const bundleListRef = useRef<BundleListRef | null>(null);

  // bundle-list에서 변경사항이 발생했을 때 bundle-detail을 refetch
  const handleBundleListChange = () => {
    if (bundleDetailRef.current) {
      bundleDetailRef.current.refetch();
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="library-bundle"
        isVertical={false}
        initialRatios={[0.3, 0.7]}
        panes={[
          <BundleList
            ref={bundleListRef}
            setSelectedBundleId={setSelectedBundleId}
            onBundleListChange={handleBundleListChange}
          />,
          <BundleDetail
            bundleDetailRef={bundleDetailRef}
            bundleListRef={bundleListRef}
            selectedBundleId={selectedBundleId}
          />,
        ]}
      />
    </div>
  );
}
