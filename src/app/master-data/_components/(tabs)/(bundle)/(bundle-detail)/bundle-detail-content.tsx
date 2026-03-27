import {
  BoxContainer,
  MasterDataDetailContentContainer,
} from "../../../(common)/common-controls";
import { Box } from "../../../(common)/common-controls";
import MyInput from "@/components/yjg/my-input";
import { MySelect } from "@/components/yjg/my-select";
import MyBox from "@/components/yjg/my-box";
import MyCheckbox from "@/components/yjg/my-checkbox";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { useEffect, useState } from "react";

import MySplitPane from "@/components/yjg/my-split-pane";
import BundleSymptomAndSpecificDetail from "./(bundle-symptom-and-specific-detail)/bundle-symptom-and-specific-detail";
import {
  BUNDLE_PRICE_TYPE_OPTIONS,
  BundlePriceType,
} from "@/constants/bundle-price-type";
import { RECEIPT_PRINT_LOCATION_OPTIONS } from "@/constants/common/common-option";
import BundleGrid, {
  type BundleGridRef,
} from "@/components/disease-order/bundle/bundle-grid";
import { useEncounterStore } from "@/store/encounter-store";
import { convertBundleItemOrdersToMyTreeGridType } from "@/components/disease-order/order/converter/bundle-item-order-converter";
import OrderGrid, {
  type OrderGridRef,
} from "@/components/disease-order/order/order-grid";
import { convertBundleDiseasesToMyTreeGridType } from "@/components/disease-order/disease/converter/bundle-item-disease-converter";
import DiseaseGrid, {
  type DiseaseGridRef,
} from "@/components/disease-order/disease/disease-grid";
import { PC_BUNDLE_DISEASE_HEADERS } from "@/components/disease-order/disease/disease-header";
import { PC_BUNDLE_ORDER_HEADERS } from "@/components/disease-order/order/order-header";
import MyDivideLine from "@/components/yjg/my-divide-line";
import BundleCategorySelector from "./bundle-category-selector";
import { useGetBundleCategories } from "@/hooks/master-data/use-get-bundle-categories";

const MySplitPaneGridContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="flex w-full h-full px-[1px] py-[4px]">{children}</div>;
};

export default function BundleDetailContent({
  selectedBundle,
  setSelectedBundle,
  bundleDiseaseGridRef,
  bundleOrderGridRef,
  bundleGridRef,
  showBundleGrid = true,
}: {
  selectedBundle: Bundle;
  setSelectedBundle: (bundle: Bundle | null) => void;
  bundleDiseaseGridRef: React.RefObject<DiseaseGridRef | null>;
  bundleOrderGridRef: React.RefObject<OrderGridRef | null>;
  bundleGridRef: React.RefObject<BundleGridRef | null>;
  /** false면 상위 묶음(BundleGrid) 영역을 숨김. 현재 차트를 묶음으로 저장 시 사용 */
  showBundleGrid?: boolean;
}) {
  const { newDiseases, setNewDiseases } = useEncounterStore();
  const { data: categories, isLoading: categoriesLoading } =
    useGetBundleCategories();

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedBundle({
      ...selectedBundle,
      categoryId: categoryId,
    } as Bundle);
  };

  useEffect(() => {
    if (newDiseases) {
      bundleDiseaseGridRef.current?.addDiseases(newDiseases);
      setNewDiseases(null);
    }
  }, [newDiseases]);

  // 모든 상태를 selectedBundle 변경 시 동기화
  const [bundlePriceType, setBundlePriceType] = useState<number>(
    selectedBundle?.priceType || BundlePriceType.단가합산
  );
  const [receiptPrintLocation, setReceiptPrintLocation] = useState<number>(
    selectedBundle?.receiptPrintLocation || 0
  );
  const [isShowBundleName, setIsShowBundleName] = useState<boolean>(
    selectedBundle?.isShowBundleName || true
  );
  const [isVerbal, setIsVerbal] = useState<boolean>(
    selectedBundle?.isVerbal || false
  );
  const [isClaim, setIsClaim] = useState<boolean>(
    selectedBundle?.isClaim || true
  );
  const [isChildBundle, setIsChildBundle] = useState<boolean>(false);

  // selectedBundle이 변경될 때 모든 상태 동기화
  useEffect(() => {
    if (selectedBundle) {
      setBundlePriceType(selectedBundle.priceType || BundlePriceType.단가합산);
      setReceiptPrintLocation(selectedBundle.receiptPrintLocation || 0);
      setIsShowBundleName(selectedBundle.isShowBundleName || false);
      setIsVerbal(selectedBundle.isVerbal || false);
      setIsClaim(selectedBundle.isClaim || false);
      setIsChildBundle((selectedBundle.childRelations?.length || 0) > 0);
    }
  }, [selectedBundle]);

  const { value: localCode, onChange: handleCodeChange } = useDebouncedInput(
    selectedBundle?.code || "",
    (value: string) => {
      setSelectedBundle({ ...selectedBundle, code: value } as Bundle);
    },
    300
  );

  const { value: localName, onChange: handleNameChange } = useDebouncedInput(
    selectedBundle?.name || "",
    (value: string) => {
      setSelectedBundle({ ...selectedBundle, name: value } as Bundle);
    },
    300
  );

  // 묶음가 직접입력 값 관리
  const { value: localBundlePrice, onChange: handleBundlePriceChange } =
    useDebouncedInput(
      selectedBundle?.price?.toString() || "",
      (value: string) => {
        const numericValue = parseFloat(value) || 0;
        setSelectedBundle({
          ...selectedBundle,
          price: numericValue,
        } as Bundle);
      },
      300
    );

  // 묶음가 타입 변경 핸들러
  const handleBundlePriceTypeChange = (value: number) => {
    if (value === BundlePriceType.단가합산) {
      handleBundlePriceChange("");
    }
    setBundlePriceType(value);
    setSelectedBundle({
      ...selectedBundle,
      priceType: value,
    } as Bundle);
  };

  // 영수증 출력 변경 핸들러
  const handleReceiptPrintLocationChange = (value: number) => {
    setReceiptPrintLocation(value);
    setSelectedBundle({
      ...selectedBundle,
      receiptPrintLocation: value,
    } as Bundle);
  };

  // 묶음명칭표시 변경 핸들러 (묶음풀어서처방: 체크 시 isShowBundleName false)
  const handleShowBundleNameChange = (checked: boolean) => {
    const newIsShowBundleName = !checked;
    setIsShowBundleName(newIsShowBundleName);
    setSelectedBundle({
      ...selectedBundle,
      isShowBundleName: newIsShowBundleName,
    } as Bundle);
  };

  // 구두처방 가능 변경 핸들러
  const handleVerbalChange = (checked: boolean) => {
    setIsVerbal(checked);
    setSelectedBundle({
      ...selectedBundle,
      isVerbal: checked,
    } as Bundle);
  };

  // 내원일 비청구 변경 핸들러 (반대로 처리)
  const handleClaimChange = (checked: boolean) => {
    // checked가 true면 isClaim을 false로, checked가 false면 isClaim을 true로
    const newIsClaim = !checked;
    setIsClaim(newIsClaim);
    setSelectedBundle({
      ...selectedBundle,
      isClaim: newIsClaim,
    } as Bundle);
  };

  const handleSymptomChange = (symptom: string) => {
    setSelectedBundle({
      ...selectedBundle,
      symptom: symptom,
    } as Bundle);
  };

  const handleMx999Change = (mx999: string) => {
    setSelectedBundle({
      ...selectedBundle,
      specificDetail: [{ code: "MX999", content: mx999 }],
    } as Bundle);
  };

  const getPanes = () => {
    const panes = [];

    panes.push(
      <MySplitPaneGridContainer>
        <DiseaseGrid
          ref={bundleDiseaseGridRef}
          headerLsKey={PC_BUNDLE_DISEASE_HEADERS}
          data={selectedBundle.bundleItemDiseases || []}
          onConvertToGridRowTypes={convertBundleDiseasesToMyTreeGridType}
        />
      </MySplitPaneGridContainer>
    );

    panes.push(
      <MySplitPaneGridContainer>
        <OrderGrid
          ref={bundleOrderGridRef}
          headerLsKey={PC_BUNDLE_ORDER_HEADERS}
          data={selectedBundle.bundleItemOrders || []}
          onConvertToGridRowTypes={convertBundleItemOrdersToMyTreeGridType}
          noBundle={true}
        />
      </MySplitPaneGridContainer>
    );

    if (!isChildBundle && showBundleGrid) {
      panes.push(
        <MySplitPaneGridContainer>
          <BundleGrid
            ref={bundleGridRef}
            data={selectedBundle.parentRelations || []}
          />
        </MySplitPaneGridContainer>
      );
    }

    panes.push(
      <BundleSymptomAndSpecificDetail
        selectedBundle={selectedBundle}
        onSymptomChange={handleSymptomChange}
        onMx999Change={handleMx999Change}
      />
    );

    return panes;
  };

  return (
    <MasterDataDetailContentContainer className="gap-1">
      <BoxContainer>
        <BundleCategorySelector
          categories={categories ?? []}
          selectedCategoryId={selectedBundle.categoryId ?? null}
          onChange={handleCategoryChange}
          loading={categoriesLoading}
        />
        <Box
          title="묶음코드"
          className="min-w-[8rem] max-w-[15rem]"
          isRequired={true}
        >
          <MyInput type="text" value={localCode} onChange={handleCodeChange} />
        </Box>
        <Box
          title="묶음명칭"
          className="min-w-[10rem] max-w-[20rem]"
          isRequired={true}
        >
          <MyInput type="text" value={localName} onChange={handleNameChange} />
        </Box>
        <Box title="묶음가" isRequired={true} isWidthFit={true}>
          <MySelect
            className="w-fit"
            options={BUNDLE_PRICE_TYPE_OPTIONS}
            value={bundlePriceType}
            onChange={(value: string | number) => {
              handleBundlePriceTypeChange(Number(value));
            }}
          />
          {bundlePriceType === BundlePriceType.직접입력 && (
            <MyInput
              type="text-number"
              value={localBundlePrice}
              onChange={handleBundlePriceChange}
              unit="원"
              min={0}
              pointPos={0}
              showComma={true}
              className="text-right min-w-[10rem] max-w-[15rem]"
              placeholder={"묶음가를 입력해주세요."}
            />
          )}
        </Box>
        <Box title="영수증 출력" isWidthFit={true}>
          <MySelect
            className="w-fit"
            options={RECEIPT_PRINT_LOCATION_OPTIONS}
            value={receiptPrintLocation}
            onChange={(value: string | number) => {
              handleReceiptPrintLocationChange(Number(value));
            }}
          />
        </Box>
        <Box title="기타" isWidthFit={true}>
          <MyBox>
            <MyCheckbox
              size="sm"
              label="묶음풀어서처방"
              checked={!isShowBundleName}
              onChange={handleShowBundleNameChange}
            />
            <MyCheckbox
              size="sm"
              label="구두처방 가능"
              checked={isVerbal}
              onChange={handleVerbalChange}
            />
            <MyCheckbox
              size="sm"
              label="내원일 비청구"
              checked={!isClaim} // isClaim이 true면 체크 해제, false면 체크
              onChange={handleClaimChange}
            />
          </MyBox>
        </Box>
      </BoxContainer>
      <MyDivideLine size="sm" className="mt-3" />
      <div className="flex flex-col w-full h-full">
        {isChildBundle ? (
          <MySplitPane
            splitPaneId="child-bundle-detail"
            isVertical={true}
            initialRatios={[0.3, 0.4, 0.3]}
            panes={getPanes()}
          />
        ) : (
          <MySplitPane
            splitPaneId="bundle-detail"
            isVertical={true}
            initialRatios={
              showBundleGrid ? [0.2, 0.3, 0.2, 0.3] : [0.25, 0.4, 0.35]
            }
            panes={getPanes()}
          />
        )}
      </div>
    </MasterDataDetailContentContainer>
  );
}
