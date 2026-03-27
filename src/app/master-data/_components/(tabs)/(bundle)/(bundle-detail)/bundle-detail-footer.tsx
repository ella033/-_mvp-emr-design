import { MyButton } from "@/components/yjg/my-button";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { useBundleItemUpsert } from "@/hooks/master-data/use-bundle-item-upsert";
import { useToastHelpers } from "@/components/ui/toast";
import { useState } from "react";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import type { BundleGridRef } from "@/components/disease-order/bundle/bundle-grid";
import type { OrderGridRef } from "@/components/disease-order/order/order-grid";
import type { DiseaseGridRef } from "@/components/disease-order/disease/disease-grid";
import { BundlePriceType } from "@/constants/bundle-price-type";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import type { BundleListRef } from "../master-bundle";
import { convertBundleDiseases, convertBundleOrders } from "./api-converter";

export default function BundleDetailFooter({
  originalBundle,
  selectedBundle,
  setSelectedBundle,
  bundleDiseaseGridRef,
  bundleOrderGridRef,
  bundleGridRef,
  bundleListRef,
  onSaveSuccess,
}: {
  originalBundle: Bundle | null;
  selectedBundle: Bundle;
  setSelectedBundle: (bundle: Bundle | null) => void;
  bundleDiseaseGridRef: React.RefObject<DiseaseGridRef | null>;
  bundleOrderGridRef: React.RefObject<OrderGridRef | null>;
  bundleGridRef: React.RefObject<BundleGridRef | null>;
  bundleListRef: React.RefObject<BundleListRef | null>;
  /** 저장 성공 시 호출 (예: 차트에서 묶음 저장 후 팝업 닫기) */
  onSaveSuccess?: () => void;
}) {
  const { success, error } = useToastHelpers();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const { mutate: upsertBundle } = useBundleItemUpsert();
  const [isSaving, setIsSaving] = useState(false);

  const handleCancel = () => {
    setIsCancelConfirmOpen(true);
  };

  const handleRegister = () => {
    setIsSaving(true);
    const diseaseRows = bundleDiseaseGridRef.current?.getTreeData() ?? [];
    const orderRows = bundleOrderGridRef.current?.getTreeData() ?? [];
    const bundleRows = bundleGridRef.current?.getTreeData() ?? [];

    const bundleDiseases = convertBundleDiseases(diseaseRows);
    const bundleOrders = convertBundleOrders(orderRows);

    const relations = bundleRows?.map((row) => {
      switch (row.orgData.type) {
        case "bundle-relation":
          return {
            childId: row.orgData.data.childId,
          };
        case "bundle-library":
          return {
            childId: row.orgData.data.id,
          };
        default:
          return null;
      }
    });

    const upsertBundleData = {
      id: selectedBundle.id,
      categoryId: selectedBundle.categoryId ?? null,
      code: selectedBundle.code,
      name: selectedBundle.name,
      priceType:
        selectedBundle.priceType === BundlePriceType.선택없음
          ? BundlePriceType.단가합산
          : selectedBundle.priceType,
      price: selectedBundle.price,
      receiptPrintLocation: selectedBundle.receiptPrintLocation,
      isShowBundleName: selectedBundle.isShowBundleName,
      isVerbal: selectedBundle.isVerbal,
      isClaim: selectedBundle.isClaim,
      isActive: selectedBundle.isActive,
      isFavorite: selectedBundle.isFavorite,
      diseases: bundleDiseases,
      orders: bundleOrders,
      relations: relations?.filter((relation) => relation !== null),
      symptom: selectedBundle.symptom,
      specificDetail: selectedBundle.specificDetail,
    };

    upsertBundle(upsertBundleData, {
      onSuccess: () => {
        if (onSaveSuccess) {
          onSaveSuccess();
        } else {
          success(`묶음 저장 완료`);
          bundleListRef.current?.refetch();
        }
      },
      onError: (err) => {
        error(`묶음 저장 실패`, err.message);
      },
      onSettled: () => {
        setIsSaving(false);
      },
    });
  };

  return (
    <div className="flex flex-row justify-end items-center px-4 py-3">
      <div className="flex flex-row gap-2">
        <MyButton variant="outline" className="px-[30px]" onClick={handleCancel}>
          취소
        </MyButton>
        <MyButton className="px-[30px]" onClick={handleRegister} disabled={isSaving}>
          {isSaving ? "저장중..." : "저장"}
          {isSaving && <MyLoadingSpinner size="sm" />}
        </MyButton>
        <MyPopupYesNo
          isOpen={isCancelConfirmOpen}
          onCloseAction={() => {
            setIsCancelConfirmOpen(false);
          }}
          onConfirmAction={() => {
            setSelectedBundle(originalBundle);
            setIsCancelConfirmOpen(false);
          }}
          title="취소"
          message="취소하시겠습니까? (작성중인 내용은 모두 사라집니다.)"
        />
      </div>
    </div>
  );
}
