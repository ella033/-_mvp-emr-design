import {
  DivideLine,
  MasterDataDetailEmpty,
} from "@/app/master-data/_components/(common)/common-controls";
import { useState } from "react";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { useGetBundleItemDetail } from "@/hooks/master-data/use-bundle-item-detail";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { BundleItemDisease } from "@/types/master-data/bundle/bundle-item-disease-type";
import type { BundleItemOrder } from "@/types/master-data/bundle/bundle-item-order-type";
import { BundlePriceType } from "@/constants/bundle-price-type";
import { toKRW } from "@/lib/patient-utils";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { cn } from "@/lib/utils";
import { useEncounterStore } from "@/store/encounter-store";
import { highlightKeyword } from "@/components/yjg/common/util/ui-util";
import type { BundleRelation } from "@/types/master-data/bundle/bundle-type";
import { convertIndividualBundleItemOrderToOrderBase } from "@/components/disease-order/order/converter/bundle-item-order-converter";
import { useReceptionStore } from "@/store/reception";
import { ChevronDown, ChevronRight } from "lucide-react";
import { COMMAND_DIVIDE_LINE, COMMAND_PREFIX } from "@/components/disease-order/order/order-action-row/order-action-command";
import DOMPurify from "dompurify";
import { highlightKeywordInHTML } from "@/components/yjg/common/util/ui-util";
import { getPrescriptionDetailType, 처방상세구분 } from "@/types/master-data/item-type";
import { getBundlePriceView } from "@/components/disease-order/order/converter/order-common-converter-util";

const COMMON_LIST_ITEM_CLASS = "text-[12px] text-[var(--gray-200)] font-[400] truncate px-[6px] py-[4px] cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)]";
const SECTION_LABEL_CLASS = "text-[12px] text-[var(--gray-400)] font-[500] w-[40px] shrink-0 cursor-pointer hover:text-[var(--blue-2)] bg-[var(--bg-1)] flex items-center justify-center";
const NUMBER_CELL_CLASS = "text-[12px] text-[var(--gray-200)] w-[20px] text-left shrink-0";

export default function MedicalBundleDetail({
  selectedBundleId,
  searchKeyword,
}: {
  selectedBundleId: number;
  searchKeyword?: string;
}) {
  const { data: bundleDetail, isLoading } = useGetBundleItemDetail(selectedBundleId);
  const selectedBundle = (bundleDetail as Bundle | undefined) ?? null;

  return (
    <div className="flex flex-col h-full w-full my-scroll">
      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full">
          <MyLoadingSpinner text="묶음 상세내역을 불러오는 중입니다..." />
        </div>
      ) : selectedBundle ? (
        <>
          <BundleInfo bundle={selectedBundle} />
          <SymptomViewer
            symptom={selectedBundle.symptom ?? ""}
            searchKeyword={searchKeyword}
            canRepeat={true}
          />
          <DiseaseSection
            bundleItemDiseases={selectedBundle.bundleItemDiseases}
            searchKeyword={searchKeyword}
          />
          <OrderSection
            bundleItemOrders={selectedBundle.bundleItemOrders}
            searchKeyword={searchKeyword}
            label="처방"
            filterFn={(order) => getPrescriptionDetailType(order.itemType) !== 처방상세구분.검사}
          />
          <OrderSection
            bundleItemOrders={selectedBundle.bundleItemOrders}
            searchKeyword={searchKeyword}
            label="검사"
            filterFn={(order) => getPrescriptionDetailType(order.itemType) === 처방상세구분.검사}
          />
          <BundleSection
            bundleRelations={selectedBundle.parentRelations ?? []}
            searchKeyword={searchKeyword}
            className="border-b border-[var(--border-1)]"
          />
        </>
      ) : (
        <MasterDataDetailEmpty message="묶음을 선택해주세요." className="border-none" />
      )}
    </div>
  );
}

/** 묶음 헤더: 코드 | 이름 | 가격 */
function BundleInfo({
  bundle,
}: {
  bundle: Bundle;
}) {
  const { setNewBundle } = useEncounterStore();

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between bg-[var(--bg-2)] border-b border-[var(--bg-5)]",
        "cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)]",
      )}
      onClick={(e) => {
        e.stopPropagation();
        const newBundle = { type: "bundle" as const, ...bundle };
        setNewBundle(newBundle);
      }}
    >
      <MyTooltip content={bundle.code}>
        {/* 코드: SECTION_LABEL w-[32px]과 동일 */}
        <span className="p-[3px] text-[12px] text-[var(--gray-200)] font-[500] w-[40px] shrink-0 text-center border-r border-[var(--border-1)] whitespace-nowrap overflow-hidden">
          {bundle.code}
        </span>
      </MyTooltip>
      <MyTooltip content={"묶음을 리핏합니다."}>
        {/* 이름: 나머지 영역 전부 */}
        <span className="px-[6px] py-[3px] text-[12px] text-[var(--gray-200)] font-[500] flex-1 min-w-0 truncate border-r border-[var(--border-1)]">
          {bundle.name}
        </span>
      </MyTooltip>
      {/* 가격: NUMBER_CELL 3개 너비 (w-[20px]*3 + gap-[8px]*2 = 76px) */}
      <span className="px-[6px] py-[3px] text-[12px] text-[var(--gray-200)] font-[500] w-[85px] shrink-0 text-left">
        {getBundlePriceView({ bundlePriceType: bundle.priceType, bundlePrice: bundle.price })}
      </span>
    </div>
  );
}

/** 증상 섹션: [증상 라벨] [텍스트] */
function SymptomViewer({
  symptom,
  searchKeyword,
  canRepeat,
  className,
  hideLabel,
}: {
  symptom: string;
  searchKeyword?: string;
  canRepeat: boolean;
  className?: string;
  hideLabel?: boolean;
}) {
  const { setNewSymptom } = useEncounterStore();

  if (!symptom || symptom.trim().length === 0 || symptom.trim() === "<p></p>") {
    return null;
  }

  return (
    <div className={cn("flex flex-row border-b border-[var(--border-1)]", className)}>
      {!hideLabel && (
        <MyTooltip side="right" content={canRepeat ? "증상을 리핏합니다." : ""}>
          <span
            className={cn(SECTION_LABEL_CLASS)}
            onClick={(e) => {
              if (!canRepeat) return;
              e.stopPropagation();
              setNewSymptom(symptom || "");
            }}
          >
            증상
          </span>
        </MyTooltip>
      )}
      <div
        className="my-tiptap-editor tiptap ProseMirror read-only flex-1 min-w-0 text-[12px] text-[var(--gray-200)] p-[6px]"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            highlightKeywordInHTML(symptom, searchKeyword)
          ),
        }}
      />
    </div>
  );
}

/** 진단 섹션: [진단 라벨] [질병 목록] */
function DiseaseSection({
  bundleItemDiseases,
  searchKeyword,
  className,
  hideLabel,
}: {
  bundleItemDiseases: BundleItemDisease[] | undefined;
  searchKeyword?: string;
  className?: string;
  hideLabel?: boolean;
}) {
  const { setNewDiseases } = useEncounterStore();

  if (!bundleItemDiseases || bundleItemDiseases.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-row border-b border-[var(--border-1)]", className)}>
      {!hideLabel && (
        <MyTooltip
          side="right"
          content={
            <div>
              전체 진단을 리핏합니다.
              <br />
              <span className="text-[12px] text-[var(--gray-700)]">
                (개별 리핏은 리스트에서 클릭)
              </span>
            </div>
          }
        >
          <span
            className={cn(SECTION_LABEL_CLASS)}
            onClick={(e) => {
              e.stopPropagation();
              if (!bundleItemDiseases) return;
              setNewDiseases(bundleItemDiseases);
            }}
          >
            진단
          </span>
        </MyTooltip>
      )}
      <div className="flex-1 min-w-0">
        <ul className="flex flex-col">
          {bundleItemDiseases.map((disease, index) => (
            <li
              key={`${disease.diseaseId ?? disease.bundleItemId ?? disease.sortNumber}-${index}`}
              className={cn(COMMON_LIST_ITEM_CLASS)}
              onClick={(e) => {
                e.stopPropagation();
                setNewDiseases([disease]);
              }}
            >
              {highlightKeyword(disease.name ?? "", searchKeyword)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 처방/검사 섹션: [라벨] [항목 목록 (이름 + dose/times/days)] */
function OrderSection({
  bundleItemOrders,
  searchKeyword,
  className,
  label,
  filterFn,
  hideLabel,
}: {
  bundleItemOrders: BundleItemOrder[] | undefined;
  searchKeyword?: string;
  className?: string;
  label: string;
  filterFn?: (order: BundleItemOrder) => boolean;
  hideLabel?: boolean;
}) {
  const { currentRegistration } = useReceptionStore();
  const { setNewOrders } = useEncounterStore();

  const filteredOrders = filterFn
    ? bundleItemOrders?.filter(filterFn)
    : bundleItemOrders;

  if (!filteredOrders || filteredOrders.length === 0) {
    return null;
  }

  const getContent = (order: BundleItemOrder) => {
    switch (order.userCode) {
      case COMMAND_PREFIX:
        return <span className="text-[var(--command-order-color)] text-[11px] whitespace-nowrap">{order.name}</span>;
      case COMMAND_DIVIDE_LINE:
        return order.name ? (
          <span className="flex flex-row items-center gap-[4px] flex-1 min-w-0">
            <DivideLine />
            <span className="text-[11px] whitespace-nowrap">{order.name}</span>
            <DivideLine />
          </span>
        ) : <DivideLine />;
      default:
        return (
          <span className="truncate flex-1 min-w-0">
            {highlightKeyword(order.name ?? "", searchKeyword)}
          </span>
        );
    }
  };

  return (
    <div className={cn("flex flex-row border-b border-[var(--border-1)]", className)}>
      {!hideLabel && (
        <MyTooltip
          side="right"
          content={
            <div>
              전체 {label}을 리핏합니다.
              <br />
              <span className="text-[12px] text-[var(--gray-700)]">
                (개별 리핏은 리스트에서 클릭)
              </span>
            </div>
          }
        >
          <span
            className={cn(SECTION_LABEL_CLASS)}
            onClick={(e) => {
              e.stopPropagation();
              if (!filteredOrders) return;
              const convertedOrders = filteredOrders.map((order) =>
                convertIndividualBundleItemOrderToOrderBase(order, currentRegistration?.insuranceType)
              );
              setNewOrders(convertedOrders);
            }}
          >
            {label}
          </span>
        </MyTooltip>
      )}
      <div className="flex-1 min-w-0">
        <ul className="flex flex-col">
          {filteredOrders.map((order, index) => (
            <li
              key={`${order.id ?? order.bundleItemId ?? order.sortNumber}-${index}`}
              className={cn(COMMON_LIST_ITEM_CLASS, "flex flex-row items-center gap-[4px]")}
              onClick={(e) => {
                e.stopPropagation();
                const convertedOrder = convertIndividualBundleItemOrderToOrderBase(order, currentRegistration?.insuranceType);
                setNewOrders([convertedOrder]);
              }}
            >
              {getContent(order)}
              {order.userCode !== COMMAND_PREFIX && order.userCode !== COMMAND_DIVIDE_LINE && (
                <span className="flex flex-row gap-[8px] shrink-0">
                  <span className={NUMBER_CELL_CLASS}>{order.dose && order.dose > 0 ? order.dose : ""}</span>
                  <span className={NUMBER_CELL_CLASS}>{order.times && order.times > 0 ? order.times : ""}</span>
                  <span className={NUMBER_CELL_CLASS}>{order.days && order.days > 0 ? order.days : ""}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 하위 묶음 섹션: [묶음 라벨] [쉐브론 + 이름 + 가격] */
function BundleSection({
  bundleRelations,
  searchKeyword,
  className,
  hideLabel,
}: {
  bundleRelations: BundleRelation[];
  searchKeyword?: string;
  className?: string;
  hideLabel?: boolean;
}) {
  const [expandedChildIds, setExpandedChildIds] = useState<Set<number>>(new Set());
  const { setNewBundle } = useEncounterStore();

  const toggleExpanded = (childId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) next.delete(childId);
      else next.add(childId);
      return next;
    });
  };

  if (!bundleRelations || bundleRelations.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-row", className)}>
      {!hideLabel && <span className={cn(SECTION_LABEL_CLASS, "cursor-default")}>묶음</span>}
      <div className="flex-1 min-w-0">
        <ul className="flex flex-col">
          {bundleRelations.map((relation) => {
            const isExpanded = expandedChildIds.has(relation.childId);
            const childBundle = relation.child;
            return (
              <li key={relation.id ?? relation.childId} className="flex flex-col">
                <div className="flex flex-row items-center">
                  <div
                    className="shrink-0 p-[2px] rounded hover:bg-[var(--bg-3)] cursor-pointer"
                    onClick={(e) => toggleExpanded(relation.childId, e)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <MyTooltip side="right" content="묶음을 리핏합니다.">
                    <div
                      className={cn(
                        "flex flex-row items-center justify-between flex-1 min-w-0 px-[4px] py-[4px]",
                        "cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] rounded-sm",
                      )}
                      onClick={(e) => {
                        if (!childBundle) return;
                        e.stopPropagation();
                        const newBundle = { type: "bundle" as const, ...childBundle };
                        setNewBundle(newBundle);
                      }}
                    >
                      <span className="text-[12px] text-[var(--gray-200)] font-[500] truncate">
                        {highlightKeyword(childBundle?.name ?? "-", searchKeyword)}
                      </span>
                      <span className="text-[12px] text-[var(--gray-200)] font-[500] shrink-0 w-[80px] text-left">
                        {getBundlePriceView({ bundlePriceType: childBundle?.priceType, bundlePrice: childBundle?.price })}
                      </span>
                    </div>
                  </MyTooltip>
                </div>
                {isExpanded && (
                  <div className="ml-[14px]">
                    <BundleDetailContent bundleId={relation.childId} searchKeyword={searchKeyword} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** 하위 묶음 행을 펼쳤을 때 보여줄 상세 (증상/진단/처방/검사/하위 묶음). bundleId 기준으로 상세 조회 */
function BundleDetailContent({ bundleId, searchKeyword }: { bundleId: number; searchKeyword?: string }) {
  const { data: bundleDetail, isLoading } = useGetBundleItemDetail(bundleId);
  const bundle = (bundleDetail as Bundle | undefined) ?? null;

  if (isLoading) {
    return (
      <div className="py-[8px] flex items-center justify-center">
        <MyLoadingSpinner text="상세 불러오는 중..." />
      </div>
    );
  }
  if (!bundle) {
    return null;
  }

  const hasSymptom = !!(bundle.symptom?.trim() && bundle.symptom.trim() !== "<p></p>");
  const hasDiseases = !!(bundle.bundleItemDiseases && bundle.bundleItemDiseases.length > 0);
  const hasBundles = !!(bundle.parentRelations && bundle.parentRelations.length > 0);

  const prescriptionOrders = bundle.bundleItemOrders?.filter(
    (order) => getPrescriptionDetailType(order.itemType) !== 처방상세구분.검사
  );
  const examOrders = bundle.bundleItemOrders?.filter(
    (order) => getPrescriptionDetailType(order.itemType) === 처방상세구분.검사
  );
  const hasPrescriptions = !!(prescriptionOrders && prescriptionOrders.length > 0);
  const hasExams = !!(examOrders && examOrders.length > 0);

  return (
    <div className="flex flex-col">
      {hasSymptom && (
        <SymptomViewer
          symptom={bundle.symptom ?? ""}
          searchKeyword={searchKeyword}
          canRepeat={true}
          hideLabel
        />
      )}
      {hasDiseases && (
        <DiseaseSection
          bundleItemDiseases={bundle.bundleItemDiseases}
          searchKeyword={searchKeyword}
          hideLabel
        />
      )}
      {hasPrescriptions && (
        <OrderSection
          bundleItemOrders={bundle.bundleItemOrders}
          searchKeyword={searchKeyword}
          label="처방"
          filterFn={(order) => getPrescriptionDetailType(order.itemType) !== 처방상세구분.검사}
          hideLabel
        />
      )}
      {hasExams && (
        <OrderSection
          bundleItemOrders={bundle.bundleItemOrders}
          searchKeyword={searchKeyword}
          label="검사"
          filterFn={(order) => getPrescriptionDetailType(order.itemType) === 처방상세구분.검사}
          hideLabel
        />
      )}
      {hasBundles && (
        <BundleSection
          bundleRelations={bundle.parentRelations ?? []}
          searchKeyword={searchKeyword}
          hideLabel
        />
      )}
    </div>
  );
}
