import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import OrderGrid, { type OrderGridRef } from "@/components/disease-order/order/order-grid";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getCellValueAsString } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { useScheduledOrdersByPatient } from "@/hooks/scheduled-order/use-scheduled-order";
import { formatDate } from "@/lib/date-utils";
import type { ScheduledOrder } from "@/types/scheduled-order-types";
import { useVerbalOrders } from "@/hooks/verbal-orders/use-verbal-orders";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import { useOrdersByEncounter } from "@/hooks/order/use-orders-by-encounter";
import { useDeleteOrder } from "@/hooks/order/use-delete-order";
import { useCreateOrder } from "@/hooks/order/use-create-order";
import { useUpdateOrder } from "@/hooks/order/use-update-order";
import type { CreateOrderRequest, UpdateOrderRequest, CreateOrderResponse, UpdateOrderResponse } from "@/types/chart/order-types";
import { InputSource } from "@/types/chart/order-types";
import { CodeType } from "@/constants/common/common-enum";
import { InOut } from "@/constants/master-data-enum";
import { useQueryClient } from "@tanstack/react-query";
import {
  defaultScheduledOrderHeaders,
} from "@/app/medical/_components/panels/(patient-diagnosis-prescription)/scheduled-order/scheduled-order-header";
import { useReceptionTabsStore } from "@/store/common/reception-tabs-store";
import { useEncounterStore } from "@/store/encounter-store";
import type { Reception } from "@/types/common/reception-types";
import { useToastHelpers } from "@/components/ui/toast";
import { MyPopupMsg } from "@/components/yjg/my-pop-up";
import { EncountersService } from "@/services/encounters-service";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useReceptionStore } from "@/store/reception";
import { useUpdateEncounter } from "@/hooks/encounter/use-encounter-update";
import { 접수상태 } from "@/constants/common/common-enum";
import { isRegistrationMode } from "@/lib/registration-utils";
import {
  convertScheduledOrdersToReadonlyTreeGrid,
  convertVerbalOrdersToReadonlyTreeGrid,
  createSelectedOrdersConverter,
  extractSelectedOrderEdits,
} from "./verbal-order-converter";
import {
  VERBAL_GENERAL_ORDER_HEADERS,
  VERBAL_SELECTED_ORDER_HEADERS,
  LS_VERBAL_SCHEDULED_HEADERS_KEY,
  LS_VERBAL_GENERAL_HEADERS_KEY,
  LS_VERBAL_SELECTED_HEADERS_KEY,
} from "./verbal-order-headers";

enum VerbalTabKey {
  Reservation = "reservation",
  General = "general",
}

const VERBAL_TAB_LABEL: Record<VerbalTabKey, string> = {
  [VerbalTabKey.Reservation]: "예약처방",
  [VerbalTabKey.General]: "일반처방",
};

type VerbalOrderItem = {
  id: string;
  userCode: string;
  name: string;
  dose: number | string;
  times: number | string;
  days: number | string;
  insurancePrice: number;
  generalPrice: number;
  itemType?: string;
  claimCode?: string;
  bundleItemId?: number;
};

type OrderAction = "create" | "update" | "delete";

type SelectedOrderItem = VerbalOrderItem & {
  uniqueKey: string;
  source: VerbalTabKey;
  orderId?: string;
  action?: OrderAction;
  prescriptionUserCode?: PrescriptionUserCodeType;
  scheduledOrder?: ScheduledOrder;
};

interface VerbalOrderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  encounterId?: string | null;
  selectedReception: Reception | null;
}

const TAB_OPTIONS: { key: VerbalTabKey; label: string }[] = [
  { key: VerbalTabKey.Reservation, label: VERBAL_TAB_LABEL[VerbalTabKey.Reservation] },
  { key: VerbalTabKey.General, label: VERBAL_TAB_LABEL[VerbalTabKey.General] },
];

// PrescriptionUserCodeType을 VerbalOrderItem으로 변환
const convertPrescriptionUserCodeToVerbalOrderItem = (
  prescriptionUserCode: PrescriptionUserCodeType
): VerbalOrderItem => {
  const drugUserCode = prescriptionUserCode.drugUserCode;

  const libraryDetails = prescriptionUserCode.library?.details || [];
  const latestLibraryDetail = libraryDetails.length > 0 ? libraryDetails[0] : null;
  const insurancePrice = latestLibraryDetail?.price || 0;

  const userCodeDetails = prescriptionUserCode.details || [];
  const latestUserCodeDetail = userCodeDetails.length > 0 ? userCodeDetails[0] : null;
  const generalPrice = latestUserCodeDetail?.normalPrice || 0;

  return {
    id: String(prescriptionUserCode.id),
    userCode: prescriptionUserCode.code || "",
    name: prescriptionUserCode.name || "",
    dose: drugUserCode?.dose || "1",
    times: drugUserCode?.times || "1",
    days: drugUserCode?.days || "1",
    insurancePrice: insurancePrice,
    generalPrice: generalPrice,
    itemType: prescriptionUserCode.itemType || "",
    claimCode: latestLibraryDetail?.claimCode || "",
  };
};

export default function VerbalOrderPopup({
  isOpen,
  onClose,
  encounterId,
  selectedReception,
}: VerbalOrderPopupProps) {
  const [activeTab, setActiveTab] = useState<VerbalTabKey>(
    VerbalTabKey.Reservation
  );
  const [selectedOrders, setSelectedOrders] = useState<SelectedOrderItem[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);

  // OrderGrid refs
  const browseReservationGridRef = useRef<OrderGridRef>(null);
  const browseGeneralGridRef = useRef<OrderGridRef>(null);
  const selectedGridRef = useRef<OrderGridRef>(null);

  // 편집값 보존용 ref
  const editsRef = useRef<Map<string, { dose?: string; times?: string; days?: string }>>(new Map());

  const { updateEncounters } = useEncounterStore();
  const { updateRegistration } = useReceptionStore();
  const updateRegistrationMutation = useUpdateRegistration();
  const saveEncounterMutation = useUpdateEncounter();
  const queryClient = useQueryClient();
  const { success: successToast } = useToastHelpers();
  const { data: scheduledOrders, isLoading: isLoadingScheduledOrders } =
    useScheduledOrdersByPatient(
      Number(selectedReception?.patientBaseInfo.patientId),
      formatDate(new Date(), "-")
    );
  const { data: verbalOrdersData, isLoading: isLoadingVerbalOrders } =
    useVerbalOrders(formatDate(new Date(), "-"));

  const { data: existingOrders, refetch: refetchOrders } = useOrdersByEncounter(encounterId || "");
  const { openedReceptions, updateOpenedReception } = useReceptionTabsStore();

  // 기존 오더 초기 로드 완료 여부 (중복 리셋 방지)
  const hasLoadedExistingOrdersRef = useRef(false);
  // lookup용 최신 데이터 ref (useEffect 의존성에서 제외하기 위해)
  const verbalOrdersDataRef = useRef(verbalOrdersData);
  verbalOrdersDataRef.current = verbalOrdersData;
  const scheduledOrdersRef = useRef(scheduledOrders);
  scheduledOrdersRef.current = scheduledOrders;

  // 현재 reception의 접수 상태 확인
  const currentReceptionStatus = useMemo(() => {
    if (!selectedReception?.originalRegistrationId) return null;
    const reception = openedReceptions.find(
      (r) => r.originalRegistrationId === selectedReception.originalRegistrationId
    );
    return reception?.patientStatus?.status ?? null;
  }, [openedReceptions, selectedReception?.originalRegistrationId]);

  // 진료중 상태인지 확인
  const isInTreatment = currentReceptionStatus === 접수상태.진료중;

  // inputSource가 예약처방/구두처방인 처방만 필터링
  const filteredReceptionOrders = useMemo(() => {
    if (!existingOrders) return [];
    return existingOrders.filter(
      (order) => (order.inputSource === InputSource.예약처방 || order.inputSource === InputSource.구두처방)
      //todo - 실배포시 주석해제필요
      //&& order.createId !== doctors.find((doctor) => doctor.id === order.createId)?.id
      //&& order.updateId !== doctors.find((doctor) => doctor.id === order.updateId)?.id
    );
  }, [existingOrders]);

  // 처방리스트 converter (editsRef 클로저)
  const selectedOrdersConverter = useMemo(
    () => createSelectedOrdersConverter(editsRef),
    []
  );

  // 처방리스트 편집값 추적
  const handleSelectedOrderTreeDataChange = useCallback(
    (treeData: MyTreeGridRowType[]) => {
      editsRef.current = extractSelectedOrderEdits(treeData);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveTab(VerbalTabKey.Reservation);
      setSelectedOrders([]);
      setShowAlert(false);
      setShowDuplicateAlert(false);
      editsRef.current.clear();
      hasLoadedExistingOrdersRef.current = false;
    } else {
      // 팝업이 열릴 때 orders를 새로 조회
      refetchOrders();
    }
  }, [isOpen, refetchOrders]);

  useEffect(() => {
    // 팝업이 열려있고 초기 로드가 완료되지 않았을 때만 실행 (중복 리셋 방지)
    if (!isOpen || hasLoadedExistingOrdersRef.current) return;
    // existingOrders가 아직 로드되지 않은 경우 대기
    if (existingOrders === undefined) return;

    hasLoadedExistingOrdersRef.current = true;

    if (filteredReceptionOrders.length === 0) return;

    // ref를 통해 최신 lookup 데이터 사용 (의존성 배열에서 제외)
    const currentVerbalOrdersData = verbalOrdersDataRef.current;
    const currentScheduledOrders = scheduledOrdersRef.current;

    const mappedOrders: SelectedOrderItem[] = filteredReceptionOrders.map((order) => {
      const source: VerbalTabKey =
        order.inputSource === InputSource.예약처방
          ? VerbalTabKey.Reservation
          : VerbalTabKey.General;
      const uniqueKey = `${source}-${order.userCodeId || order.id}`;

      // prescriptionUserCode 찾기 (userCodeId를 사용하여 verbalOrdersData에서 찾기)
      let prescriptionUserCode: PrescriptionUserCodeType | undefined;
      if (order.userCodeId && currentVerbalOrdersData) {
        prescriptionUserCode = currentVerbalOrdersData.find(
          (puc) => puc.id === order.userCodeId
        );
      }

      // scheduledOrder 찾기 (예약처방인 경우 scheduledOrders에서 찾기)
      let scheduledOrder: ScheduledOrder | undefined;
      if (
        source === VerbalTabKey.Reservation &&
        currentScheduledOrders &&
        order.userCodeId
      ) {
        scheduledOrder = currentScheduledOrders.find(
          (so) => so.prescriptionUserCode?.id === order.userCodeId
        );
      }

      return {
        id: String(order.userCodeId || order.id),
        userCode: order.userCode,
        name: order.name,
        dose: order.dose,
        times: order.times,
        days: order.days,
        insurancePrice: order.insurancePrice,
        generalPrice: order.generalPrice,
        uniqueKey,
        source,
        orderId: order.id,
        action: undefined, // 초기 로드 시에는 action 없음
        prescriptionUserCode,
        scheduledOrder,
      };
    });
    setSelectedOrders(mappedOrders);
  }, [isOpen, existingOrders, filteredReceptionOrders]);

  // SelectedOrderItem을 CreateOrderRequest로 변환
  const convertToCreateOrderRequest = useCallback((
    item: SelectedOrderItem,
    sortNumber: number,
    targetEncounterId?: string | null
  ): CreateOrderRequest | null => {
    if (!item.prescriptionUserCode && !item.scheduledOrder) return null;

    const prescriptionUserCode = item.prescriptionUserCode || item.scheduledOrder?.prescriptionUserCode;
    const library = prescriptionUserCode?.library || item.scheduledOrder?.prescriptionLibrary;
    const libraryDetail = library?.details?.[0];
    const userCodeDetail = prescriptionUserCode?.details?.[0];
    const drugUserCode = prescriptionUserCode?.drugUserCode;

    if (!prescriptionUserCode || !library) return null;

    const inputSource =
      item.source === VerbalTabKey.Reservation
        ? InputSource.예약처방
        : InputSource.구두처방;

    let isSelfPayRate30 = false;
    let isSelfPayRate50 = false;
    let isSelfPayRate80 = false;
    let isSelfPayRate90 = false;
    let isSelfPayRate100 = false;

    if (libraryDetail) {
      isSelfPayRate30 = libraryDetail.isSelfPayRate30 || false;
      isSelfPayRate50 = libraryDetail.isSelfPayRate50 || false;
      isSelfPayRate80 = libraryDetail.isSelfPayRate80 || false;
      isSelfPayRate90 = libraryDetail.isSelfPayRate90 || false;
      isSelfPayRate100 = libraryDetail.isSelfPayRate100 || false;
    }

    return {
      encounterId: targetEncounterId || encounterId || "",
      parentSortNumber: null,
      sortNumber: sortNumber,
      name: prescriptionUserCode.name || "",
      dose: Number(item.dose) || 0,
      days: Number(item.days) || 0,
      times: Number(item.times) || 0,
      isPowder: false,
      usage: drugUserCode?.usage || "",
      exceptionCode: drugUserCode?.exceptionCode || "",
      paymentMethod: prescriptionUserCode.paymentMethod,
      specimenDetail: [],
      isClaim: false,
      specificDetail: [],
      userCode: prescriptionUserCode.code || "",
      claimCode: libraryDetail?.claimCode || "",
      classificationCode: libraryDetail?.activeIngredientCode || "",
      itemType: prescriptionUserCode.itemType || "",
      codeType: (prescriptionUserCode.codeType ?? library.codeType ?? CodeType.없음) as CodeType,
      oneTwoType: libraryDetail?.oneTwoType || 0,
      inOutType: (drugUserCode?.inOutType || InOut.In) as InOut,
      drugAtcCode: "",
      relativeValueScore: 0,
      insurancePrice: libraryDetail?.price || 0,
      generalPrice: userCodeDetail?.normalPrice || 0,
      actualPrice: userCodeDetail?.actualPrice,
      incentivePrice: libraryDetail?.additionalPrice || 0,
      carInsurancePrice: 0,
      userCodeId: prescriptionUserCode.id,
      type: prescriptionUserCode.type,
      typePrescriptionLibraryId: prescriptionUserCode.typePrescriptionLibraryId,
      prescriptionLibraryId: library.typePrescriptionLibraryId,
      inputSource: inputSource,
      isSelfPayRate30: isSelfPayRate30,
      isSelfPayRate50: isSelfPayRate50,
      isSelfPayRate80: isSelfPayRate80,
      isSelfPayRate90: isSelfPayRate90,
      isSelfPayRate100: isSelfPayRate100,
    };
  }, [encounterId]);

  // SelectedOrderItem을 UpdateOrderRequest로 변환
  const convertToUpdateOrderRequest = useCallback((
    item: SelectedOrderItem,
    sortNumber: number
  ): UpdateOrderRequest | null => {
    if (!item.prescriptionUserCode && !item.scheduledOrder) return null;

    const prescriptionUserCode = item.prescriptionUserCode || item.scheduledOrder?.prescriptionUserCode;
    const library = prescriptionUserCode?.library || item.scheduledOrder?.prescriptionLibrary;
    const libraryDetail = library?.details?.[0];
    const drugUserCode = prescriptionUserCode?.drugUserCode;

    if (!prescriptionUserCode || !library) return null;

    const inputSource =
      item.source === VerbalTabKey.Reservation
        ? InputSource.예약처방
        : InputSource.구두처방;

    let isSelfPayRate30 = false;
    let isSelfPayRate50 = false;
    let isSelfPayRate80 = false;
    let isSelfPayRate90 = false;
    let isSelfPayRate100 = false;

    if (libraryDetail) {
      isSelfPayRate30 = libraryDetail.isSelfPayRate30 || false;
      isSelfPayRate50 = libraryDetail.isSelfPayRate50 || false;
      isSelfPayRate80 = libraryDetail.isSelfPayRate80 || false;
      isSelfPayRate90 = libraryDetail.isSelfPayRate90 || false;
      isSelfPayRate100 = libraryDetail.isSelfPayRate100 || false;
    }

    return {
      parentSortNumber: null,
      sortNumber: sortNumber,
      name: prescriptionUserCode.name || "",
      dose: Number(item.dose) || 0,
      days: Number(item.days) || 0,
      times: Number(item.times) || 0,
      isPowder: false,
      usage: drugUserCode?.usage || "",
      exceptionCode: drugUserCode?.exceptionCode || "",
      paymentMethod: prescriptionUserCode.paymentMethod,
      specimenDetail: [],
      isClaim: false,
      specificDetail: [],
      inputSource: inputSource,
      isSelfPayRate30: isSelfPayRate30,
      isSelfPayRate50: isSelfPayRate50,
      isSelfPayRate80: isSelfPayRate80,
      isSelfPayRate90: isSelfPayRate90,
      isSelfPayRate100: isSelfPayRate100,
    } as UpdateOrderRequest;
  }, []);

  const handleAddOrders = (rows?: MyTreeGridRowType[]) => {
    const activeBrowseRef = activeTab === VerbalTabKey.Reservation
      ? browseReservationGridRef
      : browseGeneralGridRef;
    const targetRows = rows ?? (activeBrowseRef.current?.getSelectedRows() || []);
    if (targetRows.length === 0) return;

    const ordersToAdd: VerbalOrderItem[] = [];
    const prescriptionUserCodes: (PrescriptionUserCodeType | undefined)[] = [];
    const scheduledOrdersToAdd: (ScheduledOrder | undefined)[] = [];

    targetRows.forEach((row) => {
      let order: VerbalOrderItem | null = null;
      let prescriptionUserCode: PrescriptionUserCodeType | undefined;
      let scheduledOrder: ScheduledOrder | undefined;

      if (activeTab === VerbalTabKey.Reservation) {
        const foundScheduledOrder = row.orgData?.data as ScheduledOrder | undefined;
        if (foundScheduledOrder) {
          scheduledOrder = foundScheduledOrder;
          const userCode = foundScheduledOrder.prescriptionUserCode;
          const library = foundScheduledOrder.prescriptionLibrary;
          const bundleItem = foundScheduledOrder.bundleItem;
          const code = userCode?.code || "";
          const name = userCode?.name || library?.name || bundleItem?.name || "";
          const libraryDetails = userCode?.library?.details || library?.details || [];
          const latestDetail = libraryDetails.length > 0 ? libraryDetails[0] : null;
          const insurancePrice = latestDetail?.price || 0;
          const userCodeDetails = userCode?.details || [];
          const latestUserCodeDetail =
            userCodeDetails.length > 0 ? userCodeDetails[0] : null;
          const generalPrice = latestUserCodeDetail?.normalPrice || 0;

          order = {
            id: String(foundScheduledOrder.id),
            userCode: code,
            name: name,
            dose: foundScheduledOrder.dose || "",
            times: foundScheduledOrder.times || "",
            days: foundScheduledOrder.days || "",
            insurancePrice: insurancePrice,
            generalPrice: generalPrice,
          };
          prescriptionUserCode = userCode || undefined;
        }
      } else {
        const foundPrescriptionUserCode = row.orgData?.data as PrescriptionUserCodeType | undefined;
        if (foundPrescriptionUserCode) {
          order = convertPrescriptionUserCodeToVerbalOrderItem(foundPrescriptionUserCode);
          prescriptionUserCode = foundPrescriptionUserCode;
        }
      }

      if (order) {
        ordersToAdd.push(order);
        prescriptionUserCodes.push(prescriptionUserCode);
        scheduledOrdersToAdd.push(scheduledOrder);
      }
    });

    // 중복 체크: existingOrders 중에서 inputType이 예약처방(5) 또는 구두처방(6)이 아닌 오더 중에 동일한 userCode가 있는지 확인
    if (existingOrders && existingOrders.length > 0) {
      for (let i = 0; i < ordersToAdd.length; i++) {
        const orderToAdd = ordersToAdd[i];
        if (!orderToAdd) continue;

        const duplicateOrder = existingOrders.find(
          (eo) =>
            eo.userCode === orderToAdd.userCode &&
            eo.inputSource !== InputSource.예약처방 &&
            eo.inputSource !== InputSource.구두처방
        );

        if (duplicateOrder) {
          setShowDuplicateAlert(true);
          return;
        }
      }
    }

    setSelectedOrders((prev) => {
      const existingKeys = new Set(prev.map((item) => item.uniqueKey));
      const next = [...prev];

      ordersToAdd.forEach((order, index) => {
        const prescriptionUserCode = prescriptionUserCodes[index];
        const scheduledOrder = scheduledOrdersToAdd[index];

        const uniqueKey = `${activeTab}-${order.id}`;
        if (existingKeys.has(uniqueKey)) return;

        // 기존 orders에서 매칭되는 것이 있는지 확인 (예약처방/구두처방만)
        const existingOrder = filteredReceptionOrders.find((eo) => {
          if (eo.userCode !== order.userCode) return false;
          const isReservation =
            eo.inputSource === InputSource.예약처방 &&
            activeTab === VerbalTabKey.Reservation;
          const isGeneral =
            eo.inputSource === InputSource.구두처방 &&
            activeTab === VerbalTabKey.General;
          return isReservation || isGeneral;
        });

        // 기존 order가 있으면 dose를 +1하고 action을 update로 설정
        if (existingOrder) {
          const currentDose = Number(existingOrder.dose) || 0;
          const newDose = currentDose + 1;

          next.push({
            ...order,
            uniqueKey,
            source: activeTab,
            orderId: existingOrder.id,
            action: "update",
            dose: String(newDose),
            prescriptionUserCode,
            scheduledOrder,
          });
        } else {
          // 기존 order가 없으면 create
          next.push({
            ...order,
            uniqueKey,
            source: activeTab,
            orderId: undefined,
            action: "create",
            prescriptionUserCode,
            scheduledOrder,
          });
        }
        existingKeys.add(uniqueKey);
      });

      return next;
    });
  };

  const handleRemoveSelectedOrders = () => {
    const selected = selectedGridRef.current?.getSelectedRows() || [];
    if (selected.length === 0) return;

    const selectedUniqueKeys = selected.map((row) => {
      const item = row.orgData?.data as SelectedOrderItem;
      return item.uniqueKey;
    });

    setSelectedOrders((prev) =>
      prev.map((order) => {
        if (selectedUniqueKeys.includes(order.uniqueKey)) {
          // 기존 orderId가 있으면 삭제 표시, 없으면 제거
          if (order.orderId) {
            return { ...order, action: "delete" as OrderAction };
          }
          return null;
        }
        return order;
      }).filter((order): order is SelectedOrderItem => order !== null)
    );

    // 삭제된 항목의 edits 정리
    selectedUniqueKeys.forEach((key) => editsRef.current.delete(key));
  };

  const createOrderMutation = useCreateOrder({
    onSuccess: () => {
      // 성공 시 처리
    },
    onError: (error) => {
      console.error("처방 생성 실패:", error);
    },
  });

  const updateOrderMutation = useUpdateOrder({
    onSuccess: () => {
      // 성공 시 처리
    },
    onError: (error) => {
      console.error("처방 수정 실패:", error);
    },
  });

  const deleteOrderMutation = useDeleteOrder({
    onSuccess: () => {
      // 성공 시 처리
    },
    onError: (error) => {
      console.error("처방 삭제 실패:", error);
    },
  });

  const handleSubmitOrders = useCallback(async () => {
    // 처방리스트 OrderGrid에서 현재 셀 값 읽기
    const treeData = selectedGridRef.current?.getTreeData() || [];
    const currentValues = new Map<string, { dose: string; times: string; days: string }>();
    for (const row of treeData) {
      const item = row.orgData?.data as SelectedOrderItem | undefined;
      if (!item?.uniqueKey) continue;
      currentValues.set(item.uniqueKey, {
        dose: getCellValueAsString(row, "dose") || "",
        times: getCellValueAsString(row, "times") || "",
        days: getCellValueAsString(row, "days") || "",
      });
    }

    // 현재 셀 값을 selectedOrders에 머지
    const mergedOrders = selectedOrders.map((order) => {
      const vals = currentValues.get(order.uniqueKey);
      if (vals) {
        const hasChanged =
          vals.dose !== String(order.dose) ||
          vals.times !== String(order.times) ||
          vals.days !== String(order.days);
        return {
          ...order,
          dose: vals.dose,
          times: vals.times,
          days: vals.days,
          action: hasChanged && order.action !== "delete"
            ? ("update" as OrderAction)
            : order.action,
        };
      }
      return order;
    });

    // 현재 mergedOrders의 orderId 목록 (action이 delete가 아닌 것만)
    const currentOrderIds = new Set(
      mergedOrders
        .filter((item) => item.orderId && item.action !== "delete")
        .map((item) => item.orderId!)
    );

    // 삭제할 항목: 기존에 있던 order가 현재 mergedOrders에 없으면 삭제
    const deleteOrders = filteredReceptionOrders.filter(
      (order) => !currentOrderIds.has(order.id)
    );

    // 생성/수정할 항목: mergedOrders에서 action이 "delete"가 아닌 것들
    const upsertOrders = mergedOrders.filter(
      (item) => item.action !== "delete"
    );

    // 변경사항이 없는 경우 (추가/수정/삭제 모두 없음)
    if (deleteOrders.length === 0 && upsertOrders.length === 0) {
      setShowAlert(true);
      return;
    }

    try {
      // 생성/수정할 항목을 action에 따라 분리
      const createOrders = upsertOrders.filter((item) => item.action === "create");
      const updateOrders = upsertOrders.filter((item) => item.action === "update");

      // encounterId가 없거나 originalRegistrationId가 "0" 또는 "new"인 경우 처리
      const registrationId = selectedReception?.originalRegistrationId;
      const shouldSaveToVerbalOrdersInfo =
        !encounterId ||
        !registrationId ||
        isRegistrationMode(registrationId);

      console.log('shouldSaveToVerbalOrdersInfo', shouldSaveToVerbalOrdersInfo)
      // shouldSaveToVerbalOrdersInfo가 true이면 모든 order 작업을 verbalOrdersInfo에 저장
      if (shouldSaveToVerbalOrdersInfo) {
        const targetReception = openedReceptions.find(
          (r) => r.originalRegistrationId === registrationId
        );

        if (targetReception && registrationId) {
          const verbalOrdersInfo: CreateOrderRequest[] = createOrders
            .map((item, index) => {
              const orderIndex = mergedOrders.findIndex((o) => o.uniqueKey === item.uniqueKey);
              const sortNumber = orderIndex >= 0 ? orderIndex : index;
              return convertToCreateOrderRequest(item, sortNumber, null);
            })
            .filter((req): req is CreateOrderRequest => req !== null);

          updateOpenedReception(registrationId, {
            verbalOrdersInfo: verbalOrdersInfo,
          });

          successToast("구두처방이 저장되었습니다. 접수 완료 후 자동으로 입력됩니다.");
          setSelectedOrders([]);
          onClose();
          return;
        }
      }

      // 삭제할 항목 처리
      const deletePromises = deleteOrders.map((order) =>
        deleteOrderMutation.mutateAsync(order.id)
      );

      const hasAnyOperation = deleteOrders.length > 0 || createOrders.length > 0 || updateOrders.length > 0;

      // 생성할 항목 처리
      const createPromises = createOrders
        .map((item, index) => {
          const orderIndex = mergedOrders.findIndex((o) => o.uniqueKey === item.uniqueKey);
          const sortNumber = orderIndex >= 0 ? orderIndex : index;
          const createRequest = convertToCreateOrderRequest(item, sortNumber);
          return createRequest
            ? createOrderMutation.mutateAsync(createRequest)
            : null;
        })
        .filter((promise): promise is Promise<CreateOrderResponse> => promise !== null);

      // 수정할 항목 처리
      const updatePromises = updateOrders
        .map((item, index) => {
          if (!item.orderId) return null;
          const orderIndex = mergedOrders.findIndex((o) => o.uniqueKey === item.uniqueKey);
          const sortNumber = orderIndex >= 0 ? orderIndex : index;
          const updateRequest = convertToUpdateOrderRequest(item, sortNumber);
          return updateRequest
            ? updateOrderMutation.mutateAsync({ id: item.orderId, data: updateRequest })
            : null;
        })
        .filter((promise): promise is Promise<UpdateOrderResponse> => promise !== null);


      const saveEncounterPromise = saveEncounterMutation.mutateAsync({
        id: encounterId || "",
        data: {
          registrationId: selectedReception?.originalRegistrationId || "",
          patientId: Number(selectedReception?.patientBaseInfo.patientId) || 0,
        },
      });

      await Promise.all([...deletePromises, ...createPromises, ...updatePromises]);
      await saveEncounterPromise;

      successToast("오더가 입력 되었습니다.");

      if (hasAnyOperation) {
        queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
        queryClient.invalidateQueries({ queryKey: ["prescription-libraries", "elasticsearch"] });
      }

      // TODO : 재계산 API 추가 예정
      const updatedEncounter = await EncountersService.getEncounter(encounterId || "");
      updateEncounters(updatedEncounter);

      const registration = {
      };
      await updateRegistrationMutation.mutateAsync({
        id: selectedReception?.originalRegistrationId || "",
        data: registration,
      });
      updateRegistration(selectedReception?.originalRegistrationId || "", registration);

      // 처방리스트 초기화 및 팝업 닫기
      setSelectedOrders([]);
      onClose();
    } catch (error) {
      console.error("오더 입력 실패:", error);
    }
  }, [filteredReceptionOrders, selectedOrders, encounterId, deleteOrderMutation, createOrderMutation, updateOrderMutation, convertToCreateOrderRequest, convertToUpdateOrderRequest, onClose, successToast, updateEncounters, queryClient, updateRegistrationMutation, selectedReception, updateRegistration, saveEncounterMutation, openedReceptions, updateOpenedReception]);

  // 처방리스트에 선택된 행이 있는지 확인 (버튼 상태용)
  const hasSelectedOrders = selectedOrders.filter((o) => o.action !== "delete").length > 0;

  const renderTabButtons = () => (
    <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden border border-[var(--grid-border)]">
      {TAB_OPTIONS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            className={`h-8 text-sm font-semibold transition-colors ${isActive
              ? "bg-white text-[var(--main-color)] border border-[var(--main-color)]"
              : "bg-[var(--bg-3)] text-gray-700 border border-transparent"
              }`}
            onClick={() => {
              setActiveTab(tab.key);
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title="구두처방(Verbal Order)"
      width="680px"
      height="825px"
      minWidth="680px"
      minHeight="825px"
      alwaysCenter
      fitContent={false}
      closeOnOutsideClick={false}
    >
      <div className="flex flex-col h-full gap-2 p-2">
        {renderTabButtons()}

        <div className="flex flex-col flex-1 gap-2">
          <div className="flex-1 flex flex-col bg-white rounded-sm overflow-hidden">
            <div className="flex-1 relative">
              {/* 예약처방 탭 OrderGrid */}
              <div
                className="absolute inset-0"
                style={{ display: activeTab === VerbalTabKey.Reservation ? "flex" : "none" }}
              >
                <OrderGrid
                  ref={browseReservationGridRef}
                  headerLsKey={LS_VERBAL_SCHEDULED_HEADERS_KEY}
                  defaultHeaders={defaultScheduledOrderHeaders}
                  data={scheduledOrders || []}
                  onConvertToGridRowTypes={convertScheduledOrdersToReadonlyTreeGrid}
                  hideActionRow
                  showContextMenu={false}
                  allowDragDrop={false}
                  isLoading={isLoadingScheduledOrders}
                  onRowDoubleClick={(row) => handleAddOrders([row])}
                />
              </div>
              {/* 일반처방 탭 OrderGrid */}
              <div
                className="absolute inset-0"
                style={{ display: activeTab === VerbalTabKey.General ? "flex" : "none" }}
              >
                <OrderGrid
                  ref={browseGeneralGridRef}
                  headerLsKey={LS_VERBAL_GENERAL_HEADERS_KEY}
                  defaultHeaders={VERBAL_GENERAL_ORDER_HEADERS}
                  data={verbalOrdersData || []}
                  onConvertToGridRowTypes={convertVerbalOrdersToReadonlyTreeGrid}
                  hideActionRow
                  showContextMenu={false}
                  allowDragDrop={false}
                  isLoading={isLoadingVerbalOrders}
                  onRowDoubleClick={(row) => handleAddOrders([row])}
                />
              </div>
            </div>
            <div className="flex items-center justify-end py-1 gap-1">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-md bg-[var(--violet-1)] text-[var(--main-color)] font-semibold hover:opacity-90"
                onClick={() => handleAddOrders()}
              >
                + 처방리스트로 추가
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] flex flex-col bg-[var(--bg-2)] border border-[var(--grid-border)] rounded-sm p-1 gap-1">
            <div className="text-sm font-semibold pl-1 text-gray-800">처방리스트</div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-[var(--bg-main)]">
                <OrderGrid
                  ref={selectedGridRef}
                  headerLsKey={LS_VERBAL_SELECTED_HEADERS_KEY}
                  defaultHeaders={VERBAL_SELECTED_ORDER_HEADERS}
                  data={selectedOrders}
                  onConvertToGridRowTypes={selectedOrdersConverter}
                  hideActionRow
                  showContextMenu={false}
                  allowDragDrop={false}
                  onTreeDataChange={handleSelectedOrderTreeDataChange}
                />
              </div>
              <div className="flex items-center justify-between py-1 border-t border-[var(--grid-border)] bg-[var(--bg-2)] gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-[var(--bg-main)] text-gray-700 hover:bg-gray-50"
                    onClick={handleRemoveSelectedOrders}
                  >
                    삭제
                  </button>
                  {isInTreatment && (
                    <span className="text-sm text-red-500 font-medium">
                      진료중입니다.
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm rounded-md ${!hasSelectedOrders || isInTreatment
                    ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                    : "bg-[var(--main-color)] text-white hover:opacity-90 font-semibold"
                    }`}
                  onClick={handleSubmitOrders}
                  disabled={!hasSelectedOrders || isInTreatment}
                >
                  오더 입력
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MyPopupMsg
        isOpen={showAlert}
        onCloseAction={() => setShowAlert(false)}
        title="알림"
        msgType="warning"
        message="선택한 오더가 없습니다."
        confirmText="확인"
      />
      <MyPopupMsg
        isOpen={showDuplicateAlert}
        onCloseAction={() => setShowDuplicateAlert(false)}
        title="알림"
        msgType="warning"
        message="이미 입력된 오더 입니다. 중복 오더는 입력할 수 없습니다."
        confirmText="확인"
      />
    </MyPopup>
  );
}
