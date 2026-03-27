import {
  MasterDataDetailContainer,
  MasterDataDetailEmpty,
} from "../../../(common)/common-controls";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { useCallback, useEffect, useRef, useState, useImperativeHandle } from "react";
import { useGetBundleItemDetail } from "@/hooks/master-data/use-bundle-item-detail";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import type { BundleGridRef } from "@/components/disease-order/bundle/bundle-grid";
import type { OrderGridRef } from "@/components/disease-order/order/order-grid";
import type { DiseaseGridRef } from "@/components/disease-order/disease/disease-grid";

import BundleDetailHeader from "./bundle-detail-header";
import BundleDetailContent from "./bundle-detail-content";
import BundleDetailFooter from "./bundle-detail-footer";
import type { BundleListRef } from "../master-bundle";
import { BundlePriceType } from "@/constants/bundle-price-type";

interface BundleDetailProps {
  selectedBundleId: number;
  /** 신규 묶음 등록 시 초기값 (selectedBundleId === 0 일 때 사용, 의료 화면 등) */
  initialBundle?: Bundle | null;
  /** false면 상위 묶음(BundleGrid) 영역 숨김. 현재 차트를 묶음으로 저장 시 false 전달 */
  showBundleGrid?: boolean;
  /** 저장 성공 시 호출 (예: 차트에서 묶음 저장 후 팝업 닫기) */
  onSaveSuccess?: () => void;
  /** true면 새로작성 버튼 숨김 (팝업에서 호출 시 등) */
  hideNewCreateButton?: boolean;
}

/** 신규 묶음 추가 시 사용하는 초기값 */
const EMPTY_BUNDLE: Bundle = {
  code: "",
  name: "",
  isActive: true,
  priceType: BundlePriceType.단가합산,
  receiptPrintLocation: 0,
  isShowBundleName: false,
  isVerbal: false,
  isClaim: true,
  symptom: "",
  bundleItemDiseases: [],
  bundleItemOrders: [],
  parentRelations: [],
  childRelations: [],
};

export interface BundleDetailRef {
  refetch: () => void;
}

export default function BundleDetail({
  selectedBundleId,
  initialBundle,
  showBundleGrid = true,
  onSaveSuccess,
  hideNewCreateButton,
  bundleDetailRef,
  bundleListRef,
}: BundleDetailProps & {
  bundleDetailRef?: React.RefObject<BundleDetailRef | null>;
  bundleListRef?: React.RefObject<BundleListRef | null>;
}) {
  const bundleDiseaseGridRef = useRef<DiseaseGridRef>(null);
  const bundleOrderGridRef = useRef<OrderGridRef>(null);
  const bundleGridRef = useRef<BundleGridRef>(null);

  const [originalBundle, setOriginalBundle] = useState<Bundle | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const {
    data: bundleDetail,
    isLoading,
    refetch,
  } = useGetBundleItemDetail(selectedBundleId);

  // bundle-grid 데이터 관리 함수들을 ref로 노출
  useImperativeHandle(
    bundleDetailRef,
    () => ({
      refetch: () => {
        refetch();
      },
    }),
    [refetch]
  );

  useEffect(() => {
    if (bundleDetail) {
      setSelectedBundle(bundleDetail as Bundle);
      setOriginalBundle(bundleDetail as Bundle);
    }
  }, [bundleDetail]);

  // 신규 모드: initialBundle이 주어지면 해당 값으로 표시
  useEffect(() => {
    if (selectedBundleId === 0 && initialBundle) {
      setSelectedBundle(initialBundle);
      setOriginalBundle(null);
    }
  }, [selectedBundleId, initialBundle]);

  const isNewMode = selectedBundleId === 0 && initialBundle != null;
  const showContent = selectedBundle && (!isLoading || isNewMode);

  const handleNewCreate = useCallback(() => {
    setSelectedBundle({ ...EMPTY_BUNDLE });
    setOriginalBundle(null);
  }, []);

  return (
    <MasterDataDetailContainer className="relative">
      {isLoading && !isNewMode ? (
        <div className="flex justify-center items-center h-full w-full">
          <MyLoadingSpinner text="묶음 상세정보를 불러오는 중입니다..." />
        </div>
      ) : (
        <>
          <BundleDetailHeader
            originalBundle={originalBundle}
            selectedBundle={selectedBundle}
            setSelectedBundle={setSelectedBundle}
            onNewCreate={handleNewCreate}
            hideNewCreateButton={hideNewCreateButton}
          />
          {showContent ? (
            <>
              <BundleDetailContent
                bundleDiseaseGridRef={bundleDiseaseGridRef}
                bundleOrderGridRef={bundleOrderGridRef}
                bundleGridRef={bundleGridRef}
                selectedBundle={selectedBundle}
                setSelectedBundle={setSelectedBundle}
                showBundleGrid={showBundleGrid}
              />
              <BundleDetailFooter
                bundleDiseaseGridRef={bundleDiseaseGridRef}
                bundleOrderGridRef={bundleOrderGridRef}
                bundleGridRef={bundleGridRef}
                bundleListRef={bundleListRef ?? { current: null }}
                originalBundle={originalBundle}
                selectedBundle={selectedBundle}
                setSelectedBundle={setSelectedBundle}
                onSaveSuccess={onSaveSuccess}
              />
            </>
          ) : !hideNewCreateButton ? (
            <MasterDataDetailEmpty message="새로작성 버튼을 눌러 묶음을 추가하세요." />
          ) : null}
        </>
      )}
    </MasterDataDetailContainer>
  );
}
