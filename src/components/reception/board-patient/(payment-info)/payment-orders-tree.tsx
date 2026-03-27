import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MySplitPane from "@/components/yjg/my-split-pane";
import DOMPurify from "dompurify";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import { useSelectedReception } from "@/hooks/reception/use-selected-reception";
import { toKRW } from "@/lib/patient-utils";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import type { Encounter } from "@/types/chart/encounter-types";
import type { Order } from "@/types/chart/order-types";
import { InputType } from "@/types/chart/order-types";
import { BundlePriceType } from "@/constants/bundle-price-type";
import { PaymentMethod, 접수상태, 보험구분상세Label, 초재진Label, type 초재진 } from "@/constants/common/common-enum";
import VerbalOrderPopup from "./verbal-pop-up/verbal-order-popup";
import type { Registration } from "@/types/registration-types";
import {
  COMMAND_DIVIDE_LINE,
  COMMAND_PREFIX,
} from "@/components/disease-order/order/order-action-row/order-action-command";

import OrderCommandOrderRow from "@/components/disease-order/order/order-action-row/order-command-order-row";
import OrderDivideRow from "@/components/disease-order/order/order-action-row/order-divide-row";
import MyTreeGrid from "@/components/yjg/my-tree-grid/my-tree-grid";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { ClockIcon, SpecificDetailIcon } from "@/components/custom-icons";
import {
  getDirectChildrenOrders,
  getRowType,
  getIconBtn,
  getBundlePriceView,
} from "@/components/disease-order/order/converter/order-common-converter-util";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MyButton } from "@/components/yjg/my-button";
import { useSettingsStore } from "@/store/settings-store";
import { cn } from "@/lib/utils";
import { formatDateByPattern, formatDate } from "@/lib/date-utils";
import { PrescriptionBadges } from "@/app/reception/_components/panels/(shared)/reception-badge";
import { PatientExtraQualificationBadges } from "@/app/medical/_components/widgets/medical-patient-badge";
import { is임신부 } from "@/lib/extra-qualification-utils";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { useScheduledOrdersByPatient } from "@/hooks/scheduled-order/use-scheduled-order";
import {
  AlertBarProvider,
  AlertBarContainerDirect,
  useAlertBarHelpers,
} from "@/components/ui/alert-bar";
import { useSelectedDate } from "@/store/reception/selected-date-store";
import { ChevronRight } from "lucide-react";

interface PaymentOrdersTreeProps {
  date?: string;
  patientName?: string;
  otherInfo?: string;
  memo?: string;
  encounter?: Encounter | null;
  orders?: Order[];
  isLoading?: boolean;
  receptionId?: string | null;
  /**
   * 외부에서 주입된 registration (우선 적용)
   * - 없으면 currentReception의 보험구분(`insuranceInfo.uDeptDetail`)을 사용
   */
  externalRegistration?: Registration | null;
  onInsuranceHistoryChange?: () => void;
}

// 수납 패널 "처방내역" 그리드 설정 저장용 pageContext
const PAYMENT_ORDERS_TREE_HEADERS_KEY = "reception.payment-orders-tree.headers";

// 수납 패널 "처방내역" 표기용 컬럼(키/명칭/정렬/폭) + 전체 readonly
// 참고 prescription-header.tsx (sortNumber: getInitialHeaders 병합/정렬용)
const paymentTreeHeaders: MyTreeGridHeaderType[] = [
  { key: "userCode", name: "코드", width: 60, minWidth: 0, visible: true, readonly: true, sortNumber: 0 },
  { key: "name", name: "처방 명칭", width: 120, minWidth: 0, visible: true, readonly: true, sortNumber: 1 },
  { key: "dose", name: "용량", align: "center", width: 30, minWidth: 0, visible: true, readonly: true, sortNumber: 2 },
  { key: "times", name: "일투", align: "center", width: 35, minWidth: 0, visible: true, readonly: true, sortNumber: 3 },
  { key: "days", name: "일수", align: "center", width: 35, minWidth: 0, visible: true, readonly: true, sortNumber: 4 },
  { key: "usage", name: "용법", align: "center", width: 60, visible: true, readonly: true, sortNumber: 5 },
  { key: "isClaim", name: "청구", align: "center", width: 30, minWidth: 0, visible: true, readonly: true, sortNumber: 6 },
  { key: "paymentMethod", name: "수납방법", align: "center", width: 40, minWidth: 0, visible: true, readonly: true, sortNumber: 7 },
  { key: "price", name: "단가", align: "right", minWidth: 0, visible: true, readonly: true, sortNumber: 8 },
];

/** 오른쪽 그리드 영역 + 예약처방 추가 알림 */
function PaymentOrdersGridPane({
  isDataLoading,
  headers,
  setHeaders,
  treeData,
  setTreeData,
  scheduledOrders,
  currentReceptionId,
  onOpenVerbalPopup,
}: {
  isDataLoading: boolean;
  headers: MyTreeGridHeaderType[];
  setHeaders: React.Dispatch<React.SetStateAction<MyTreeGridHeaderType[]>>;
  treeData: MyTreeGridRowType[];
  setTreeData: React.Dispatch<React.SetStateAction<MyTreeGridRowType[]>>;
  scheduledOrders: import("@/types/scheduled-order-types").ScheduledOrder[] | undefined;
  currentReceptionId: string | null;
  onOpenVerbalPopup: () => void;
}) {
  const selectedDate = useSelectedDate();
  const alertBarHelper = useAlertBarHelpers();
  const alertBarHelperRef = useRef(alertBarHelper);
  const prevReceptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    alertBarHelperRef.current = alertBarHelper;
  }, [alertBarHelper]);

  // 접수 변경 시 이전 알림 제거
  useEffect(() => {
    const prevId = prevReceptionIdRef.current;
    if (prevId && prevId !== currentReceptionId) {
      alertBarHelperRef.current.removeAlertBar(`scheduled-created-${prevId}`);
    }
    prevReceptionIdRef.current = currentReceptionId;
  }, [currentReceptionId]);

  // selectedDate 기준 오늘 생성된 예약처방이 있으면 알림 표시 (고정, dismiss 불가)
  useEffect(() => {
    if (!currentReceptionId) return;

    const todayStr = formatDate(selectedDate, "-");
    const hasTodayCreated = scheduledOrders?.some((order) => {
      if (!order.createDateTime) return false;
      return formatDate(order.createDateTime, "-") === todayStr;
    });
    const alertId = `scheduled-created-${currentReceptionId}`;

    if (hasTodayCreated) {
      const icon = (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--negative)]">
          <g clipPath="url(#clip_alert_medical)">
            <path d="M6.28571 4H5.14286C4.83975 4 4.54906 4.11853 4.33474 4.3295C4.12041 4.54048 4 4.82663 4 5.125V11.875C4 12.1734 4.12041 12.4595 4.33474 12.6705C4.54906 12.8815 4.83975 13 5.14286 13H10.8571C11.1602 13 11.4509 12.8815 11.6653 12.6705C11.8796 12.4595 12 12.1734 12 11.875V5.125C12 4.82663 11.8796 4.54048 11.6653 4.3295C11.4509 4.11853 11.1602 4 10.8571 4H9.71429" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.22217 4.1111C6.22217 3.81642 6.33923 3.5338 6.5476 3.32543C6.75597 3.11706 7.03858 3 7.33326 3H8.44436C8.73904 3 9.02165 3.11706 9.23002 3.32543C9.43839 3.5338 9.55546 3.81642 9.55546 4.1111C9.55546 4.40578 9.43839 4.68839 9.23002 4.89676C9.02165 5.10513 8.73904 5.22219 8.44436 5.22219H7.33326C7.03858 5.22219 6.75597 5.10513 6.5476 4.89676C6.33923 4.68839 6.22217 4.40578 6.22217 4.1111Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 10.1111L7.55555 10.6666L9.22219 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <defs>
            <clipPath id="clip_alert_medical">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      );
      const content = (
        <div className="flex items-center justify-between w-full">
          <span>예약처방이 추가되었습니다.</span>
          <button
            type="button"
            onClick={onOpenVerbalPopup}
            className="flex items-center justify-center w-4 h-4 hover:opacity-70 transition-opacity flex-shrink-0"
            aria-label="예약처방 열기"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );

      alertBarHelperRef.current.info(icon, content, {
        id: alertId,
        dismissible: false,
      });
    } else {
      alertBarHelperRef.current.removeAlertBar(alertId);
    }
  }, [scheduledOrders?.length, currentReceptionId, selectedDate, onOpenVerbalPopup]);

  return (
    <div className="h-full p-1 overflow-hidden relative flex flex-col">
      {isDataLoading ? (
        <div className="flex items-center justify-center h-full">
          <MyLoadingSpinner size="sm" text="로딩 중..." />
        </div>
      ) : (
        <div className="flex-1 min-h-0 rounded-sm [&_.my-scroll]:!overscroll-y-auto">
          <MyTreeGrid
            headers={headers}
            setHeaders={setHeaders}
            data={treeData}
            onDataChange={setTreeData}
            onDataChangeItem={() => { }}
            onSelectedRowsChange={() => { }}
            showContextMenu={false}
            allowDragDrop={false}
            autoExpandOnDrop={false}
            hideBorder={true}
            multiSelect={false}
            size="sm"
            showRowIcon={true}
          />
        </div>
      )}
      <AlertBarContainerDirect />
    </div>
  );
}

export default function PaymentOrdersTree({
  date,
  encounter: encounterProp,
  orders: ordersProp,
  isLoading: isLoadingProp,
  receptionId,
  externalRegistration = null,
  onInsuranceHistoryChange,
}: PaymentOrdersTreeProps) {
  const [receptionMemo, setReceptionMemo] = useState("");
  const [isVerbalPopupOpen, setIsVerbalPopupOpen] = useState(false);

  const { selectedReception: currentReception } = useSelectedReception();

  const effectiveExternalRegistration: Pick<Registration, "insuranceType"> | null =
    externalRegistration ??
    (currentReception?.insuranceInfo?.uDeptDetail !== undefined
      ? { insuranceType: currentReception.insuranceInfo.uDeptDetail }
      : null);

  useEffect(() => {
    setReceptionMemo(currentReception?.patientBaseInfo?.receptionMemo ?? "");
  }, [receptionId, encounterProp?.id]);

  // 환자 정보(표기용) 추출
  const receptionDateRaw = currentReception?.receptionDateTime
    ? currentReception.receptionDateTime
    : date || new Date().toISOString();
  const receptionDate = formatDateByPattern(receptionDateRaw, "YY-MM-DD");
  const receptionType = currentReception?.receptionInfo?.receptionType;
  const insuranceDetail = currentReception?.insuranceInfo?.uDeptDetail;
  const insuranceLabel = insuranceDetail !== undefined
    ? 보험구분상세Label[insuranceDetail as keyof typeof 보험구분상세Label] || ""
    : "";

  // 예약처방(scheduled orders)
  const { data: scheduledOrders } = useScheduledOrdersByPatient(
    Number(currentReception?.patientBaseInfo?.patientId) || -1,
    formatDate(receptionDateRaw, "-")
  );

  // stale encounter 방지 (이전 환자 데이터 섞임 방지)
  const receptionEncounter = useMemo(() => {
    if (!receptionId) return null;
    if (!encounterProp) return null;
    const encounterRegistrationId = encounterProp.registrationId?.toString();
    const currentReceptionId = receptionId.toString();
    if (encounterRegistrationId !== currentReceptionId) return null;
    return encounterProp;
  }, [receptionId, encounterProp]);

  const orders = useMemo(() => {
    if (!receptionId) return [];
    if (!receptionEncounter) return [];
    return ordersProp || receptionEncounter?.orders || [];
  }, [receptionId, receptionEncounter, ordersProp]);

  const getPriceByPaymentMethod = (order: Order): number => {
    if (order.paymentMethod === PaymentMethod.일반가) {
      return order.generalPrice;
    } else {
      if (order.bundleItemId && order.bundlePriceType === BundlePriceType.직접입력) {
        return order.bundlePrice ?? 0;
      } else if (
        order.bundleItemId &&
        order.bundlePriceType === BundlePriceType.단가합산
      ) {
        return 0;
      }
      const actualPrice = order.actualPrice;
      const insurancePrice = order.insurancePrice;
      if (actualPrice && insurancePrice && actualPrice > 0 && actualPrice < insurancePrice)
        return actualPrice;
      else
        return insurancePrice;
    }
  };

  const isDataLoading =
    isLoadingProp !== undefined
      ? isLoadingProp
      : currentReception
        ? !receptionEncounter
        : false;

  // 컬럼 설정: useSettings(store) 연동 — 저장/복원
  const savedHeaders = useSettingsStore(
    (s) =>
      s.getSettingsByCategoryAndPageContext("grid-header", PAYMENT_ORDERS_TREE_HEADERS_KEY)
        ?.settings?.headers
  ) as MyTreeGridHeaderType[] | undefined;
  const hasSavedHeaders =
    Array.isArray(savedHeaders) && savedHeaders.length > 0;

  const [headers, setHeadersState] = useState<MyTreeGridHeaderType[]>(() =>
    getInitialHeaders(PAYMENT_ORDERS_TREE_HEADERS_KEY, paymentTreeHeaders)
  );
  const userModifiedRef = useRef(false);
  const syncingFromStoreRef = useRef(false);

  // settings가 늦게 로드된 경우 저장된 헤더로 1회 동기화
  useEffect(() => {
    if (!hasSavedHeaders) return;
    if (userModifiedRef.current) return;
    syncingFromStoreRef.current = true;
    setHeadersState(getInitialHeaders(PAYMENT_ORDERS_TREE_HEADERS_KEY, paymentTreeHeaders));
    queueMicrotask(() => {
      syncingFromStoreRef.current = false;
    });
  }, [hasSavedHeaders]);

  const setHeaders = useCallback<React.Dispatch<React.SetStateAction<MyTreeGridHeaderType[]>>>(
    (next) => {
      userModifiedRef.current = true;
      setHeadersState(next);
    },
    []
  );

  // 헤더 변경 시(리사이즈/순서/표시) 500ms debounce로 서버에 저장
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (syncingFromStoreRef.current) return;
    if (!userModifiedRef.current) return;
    if (headers.length === 0) return;
    saveHeaders(PAYMENT_ORDERS_TREE_HEADERS_KEY, headers);
  }, [headers]);

  const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);

  useEffect(() => {
    if (!orders || orders.length === 0) {
      setTreeData([]);
      return;
    }

    // order → MyTreeGridRowType 변환
    const convertOrder = (order: Order, parentRowKey: string | null): MyTreeGridRowType => {
      const isCommand = order.userCode === COMMAND_PREFIX;
      const isDivideLine = order.userCode === COMMAND_DIVIDE_LINE;
      const childOrders = getDirectChildrenOrders(order, orders);
      const hasChildren = childOrders.length > 0;
      const isBundleHeader = order.inputType === InputType.묶음헤더 || hasChildren;
      const isNameOnlyRow = isBundleHeader || isCommand || isDivideLine;

      const rowCustomRender = isCommand ? (
        <OrderCommandOrderRow
          size="sm"
          rowKey={order.id.toString()}
          name={order.name}
          readOnly
        />
      ) : isDivideLine ? (
        <OrderDivideRow
          size="sm"
          rowKey={order.id.toString()}
          name={order.name}
          readOnly
        />
      ) : null;

      // 묶음 헤더: "단가합산" 또는 직접입력 금액 표시
      let priceValue: string | null = null;
      if (isBundleHeader) {
        priceValue = getBundlePriceView({ bundlePriceType: order.bundlePriceType, bundlePrice: order.bundlePrice });
      } else if (!isCommand && !isDivideLine) {
        priceValue = toKRW(getPriceByPaymentMethod(order));
      }

      const cells: MyTreeGridRowType["cells"] = [
        { headerKey: "userCode", value: order.userCode },
        { headerKey: "name", value: order.name },
        { headerKey: "dose", value: isNameOnlyRow ? null : order.dose },
        { headerKey: "times", value: isNameOnlyRow ? null : order.times },
        { headerKey: "days", value: isNameOnlyRow ? null : order.days },
        { headerKey: "usage", value: isNameOnlyRow ? null : order.usage },
        { headerKey: "price", value: priceValue },
        { headerKey: "isClaim", value: isBundleHeader ? null : order.isClaim, ...(isBundleHeader ? {} : { inputType: "is-claim" }) },
        { headerKey: "paymentMethod", value: isBundleHeader ? null : order.paymentMethod, ...(isBundleHeader ? {} : { inputType: "payment-method" }) },
        {
          headerKey: "typePrescriptionLibraryId",
          value: order.typePrescriptionLibraryId ?? 0,
        },
      ];

      // 자식 row 재귀 변환
      const children = hasChildren
        ? childOrders.map((child) => convertOrder(child, order.id.toString()))
        : undefined;

      return {
        rowKey: order.id.toString(),
        parentRowKey,
        type: getRowType(hasChildren, parentRowKey),
        orgData: { type: "order", data: order },
        customRender: rowCustomRender || undefined,
        iconBtn: getIconBtn(hasChildren, "sm", order.userCode, order.itemType, order.claimCode, false),
        cells,
        children,
      };
    };

    // 최상위 order만 변환 (parentSortNumber가 없는 것)
    const topLevelOrders = orders.filter((o) => !o.parentSortNumber);
    const rows = topLevelOrders.map((order) => convertOrder(order, null));
    setTreeData(rows);
  }, [orders]);

  return (
    <div className="flex flex-col h-full border-1 rounded-sm border-[var(--border-1)]">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between bg-[var(--bg-main)] border-b px-2">
        {/* 좌측 정렬 */}
        <div className="flex items-center gap-1 text-[12px] min-w-0">
          <span className="text-[var(--gray-200)] whitespace-nowrap">{receptionDate}</span>
          <span className="text-[var(--gray-300)]">|</span>
          {receptionType !== undefined && (
            <>
              <span className="text-[var(--gray-200)] whitespace-nowrap">
                {초재진Label[receptionType as 초재진] || ""}
              </span>
              <span className="text-[var(--gray-300)]">|</span>
            </>
          )}
          {insuranceLabel && (
            <>
              {currentReception?.receptionInfo?.status === 접수상태.수납대기 ? (
                <span
                  className="text-[var(--blue-2)] underline cursor-pointer hover:text-[var(--main-color)] whitespace-nowrap font-medium"
                  onClick={() => onInsuranceHistoryChange?.()}
                >
                  {insuranceLabel}
                </span>
              ) : (
                <span className="text-[var(--blue-2)] whitespace-nowrap font-medium">
                  {insuranceLabel}
                </span>
              )}
              <span className="text-[var(--gray-300)]">|</span>
            </>
          )}
          {currentReception?.insuranceInfo?.extraQualification && (
            <PatientExtraQualificationBadges
              registration={{ extraQualification: currentReception.insuranceInfo.extraQualification } as Registration}
            />
          )}
          {is임신부(currentReception?.insuranceInfo?.extraQualification) && (
            <MyTooltip content="임신부">
              <div className="flex items-center justify-center rounded-[4px] px-[4px] py-[3px] text-[11px] font-[500] cursor-default leading-none bg-[var(--red-1)] text-[var(--red-2)] border border-[var(--red-1)]">
                임신부
              </div>
            </MyTooltip>
          )}
          <PrescriptionBadges encounter={receptionEncounter} size="sm" />
        </div>

        {/* 우측 정렬 */}
        <div className="flex items-center gap-1 shrink-0">
          {currentReception?.patientBaseInfo?.clinicalMemo ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <MyButton
                  variant="ghost"
                  size="icon"
                  className="flex items-center px-2 py-1 font-medium text-[var(--main-color)]"
                >
                  <SpecificDetailIcon className="w-[15px] h-[15px]" />
                  <span className="text-[12px]">임상정보</span>
                </MyButton>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="end"
                sideOffset={4}
                className="!bg-white !text-gray-900 border border-gray-300 rounded-md shadow-lg p-0 w-[300px] h-[350px] !z-[9999]"
              >
                <div className="h-full overflow-y-auto text-xs text-gray-900">
                  <MyTiptapEditor
                    content={currentReception.patientBaseInfo.clinicalMemo}
                    readOnly={true}
                    isUseTemplate={false}
                    isUseImageUpload={false}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <MyButton
              variant="ghost"
              size="icon"
              className="flex items-center px-2 py-1 font-medium text-[var(--main-color)]"
              disabled
            >
              <SpecificDetailIcon className="w-[15px] h-[15px]" />
              <span className="text-[12px]">임상정보</span>
            </MyButton>
          )}
          <MyButton
            variant="ghost"
            className={cn(
              "px-[4px] py-[2px] text-[12px] rounded-[4px]",
              isVerbalPopupOpen ? "bg-[var(--bg-3)]" : ""
            )}
            onClick={() => setIsVerbalPopupOpen(true)}
            disabled={currentReception?.receptionInfo?.status === 접수상태.수납완료}
          >
            <div className={cn(
              "flex flex-row items-center gap-1",
              (scheduledOrders?.length ?? 0) > 0 ? "text-[var(--violet-2)]" : ""
            )}>
              <ClockIcon className="w-[14px] h-[14px]" />
              <div className="flex flex-row items-center gap-[2px]">
                예약처방
                {(scheduledOrders?.length ?? 0) > 0 && (
                  <div className="rounded-[4px] px-[4px] py-[0px] text-[var(--violet-2)] bg-[var(--violet-1)]">
                    {scheduledOrders!.length}
                  </div>
                )}
              </div>
            </div>
          </MyButton>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 overflow-hidden pr-2 pl-2">
        <MySplitPane
          splitPaneId="payment-orders-tree-split"
          isVertical={false}
          initialRatios={[1 / 3, 2 / 3]}
          minPaneRatio={0.15}
          panes={[
            // 왼쪽 메모 영역
            <div
              key="memo"
              className="h-full p-1 bg-white border-r overflow-y-auto relative"
            >
              {isDataLoading ? (
                <div className="flex items-center justify-center h-full">
                  <MyLoadingSpinner size="sm" text="로딩 중..." />
                </div>
              ) : receptionEncounter?.symptom ? (
                <div
                  className="my-tiptap-editor tiptap ProseMirror my-scroll read-only"
                  style={{ userSelect: "text", cursor: "default" }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(receptionEncounter.symptom),
                  }}
                />
              ) : (
                <div className="text-sm text-[var(--gray-500)]"></div>
              )}
            </div>,
            // 오른쪽 그리드 영역 (MyTreeGrid, 전체 readOnly) + 예약처방 추가 알림
            <AlertBarProvider key="grid">
              <PaymentOrdersGridPane
                isDataLoading={isDataLoading}
                headers={headers}
                setHeaders={setHeaders}
                treeData={treeData}
                setTreeData={setTreeData}
                scheduledOrders={scheduledOrders}
                currentReceptionId={receptionId ?? null}
                onOpenVerbalPopup={() => setIsVerbalPopupOpen(true)}
              />
            </AlertBarProvider>,
          ]}
        />
      </div>

      {/* 하단 도킹 영역 */}
      <div className="border-t flex items-center justify-between bg-white">
        <div className="px-2 py-2 flex items-center gap-2 w-full">
          <span className="text-sm font-semibold text-[var(--gray-100)] whitespace-nowrap">
            접수메모
          </span>
          <input
            type="text"
            value={receptionMemo}
            onChange={(e) => setReceptionMemo(e.target.value)}
            className="px-3 py-1.5 flex-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--violet-2)] focus:border-transparent"
          />
        </div>
      </div>

      {currentReception && encounterProp && (
        <VerbalOrderPopup
          isOpen={isVerbalPopupOpen}
          onClose={() => setIsVerbalPopupOpen(false)}
          encounterId={encounterProp.id}
          selectedReception={currentReception}
        />
      )}
    </div>
  );
}


