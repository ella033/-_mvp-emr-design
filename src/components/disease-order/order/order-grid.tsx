import type { MyTreeGridRef } from "@/components/yjg/my-tree-grid/my-tree-grid";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
  CellUpdateHandler,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getInitialHeaders,
  getInitialShowRowIcon,
  removeRows,
  saveHeaders,
  saveShowRowIcon,
  updateAllRows,
  updateRow,
  flattenTree,
  findRow,
  findParentRow,
  getCellValueAsNumber,
  getCellValueAsString,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import MyTreeGrid from "@/components/yjg/my-tree-grid/my-tree-grid";
import OrderActionRow from "./order-action-row/order-action-row";
import {
  Info,
  Trash,
  Trash2,
  Undo,
  Redo,
  NotepadText
} from "lucide-react";
import type { ContextMenuAction } from "@/components/yjg/my-tree-grid/my-tree-grid-interface";
import { showDrugInfo } from "@/lib/business-utils";
import {
  getPrescriptionDetailType,
  처방상세구분,
} from "@/types/master-data/item-type";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";
import { convertOrderLibraryToMyTreeGridType } from "./converter/order-library-converter";
import {
  convertBundleTitleOnlyToMyTreeGridType,
  convertBundleToMyTreeGridType,
} from "@/components/disease-order/order/converter/bundle-converter";
import { convertBundleItemOrdersToMyTreeGridType } from "@/components/disease-order/order/converter/bundle-item-order-converter";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { useEncounterStore } from "@/store/encounter-store";
import type { DiseaseBase } from "@/types/chart/disease-types";
import type { BundleItemDisease } from "@/types/master-data/bundle/bundle-item-disease-type";
import { LineBundleIcon } from "@/components/custom-icons";
import { toKRW } from "@/lib/patient-utils";
import { PaymentMethod, 보험구분상세, 보험구분상세FullLabel } from "@/constants/common/common-enum";
import { MyPopupMsg, MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useReceptionStore } from "@/store/reception";
import {
  CheckProhibitedDrugStatus,
  checkAllowProhibitedDrug,
  getSpecificDetailFromRow,
  hasSpecificDetailCodeFromRow,
  getDuplicatedAndUniqueRows,
} from "./order-util";
import type { DiseaseLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import { PrescriptionLibrariesService } from "@/services/master-data/prescription-libraries-service";
import OrderDiseaseLinkPopup from "./order-disease-link-popup";
import { useUsages } from "@/hooks/usage/use-usage";
import OrderUsageRecommendationPopup from "./order-usage-recommendation-popup";
import DrugSeparationExceptionCodePopup from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-popup";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import { useUserStore } from "@/store/user-store";
import {
  PRN_CODE,
  PRN_NAME,
  PRN_CONTENT,
} from "@/constants/constants";
import { SpecificDetailCodeType } from "@/types/chart/specific-detail-code-type";
import { COMMAND_DIVIDE_LINE } from "./order-action-row/order-action-command";
import { defaultOrderHeaders } from "./order-header";

const ORDER_GRID_SIZE = "sm";

export type { OrderGridConvertToGridRowTypesParams } from "./order-grid-convert-params";
import type { OrderGridConvertToGridRowTypesParams } from "./order-grid-convert-params";

export interface OrderGridRef {
  getTreeData: () => MyTreeGridRowType[];
  getSelectedRows: () => MyTreeGridRowType[];
  addOrderLibrary: (
    order: any,
    isScheduledOrder?: boolean,
    scheduledOrderMemo?: string
  ) => void;
  addOrders: (orders: any[]) => void;
}

interface OrderGridProps {
  headerLsKey: string;
  defaultHeaders?: MyTreeGridHeaderType[];
  data: any[];
  onConvertToGridRowTypes: (
    params: OrderGridConvertToGridRowTypesParams
  ) => MyTreeGridRowType[];
  noBundle?: boolean;
  bundleTitleOnly?: boolean;
  isCheckProhibitedDrug?: boolean;
  isCheckBundle?: boolean;
  isCheckUserCode?: boolean;
  isCheckInsuranceType?: boolean;
  onTreeDataChange?: (treeData: MyTreeGridRowType[]) => void;
  onDataChanged?: (isChanged: boolean) => void;
  isLoading?: boolean;
  onRowDoubleClick?: (row: MyTreeGridRowType) => void;
  hideActionRow?: boolean;
  allowDragDrop?: boolean;
  showContextMenu?: boolean;
  /** 지시오더(--) 및 구분선(---) 입력을 비활성화 */
  disableCommandOrder?: boolean;
}

const OrderGrid = forwardRef<OrderGridRef, OrderGridProps>(
  (
    {
      headerLsKey,
      defaultHeaders,
      data,
      onConvertToGridRowTypes,
      noBundle = false,
      bundleTitleOnly = false,
      isCheckProhibitedDrug = false,
      isCheckBundle = false,
      isCheckUserCode = false,
      isCheckInsuranceType = false,
      onTreeDataChange,
      onDataChanged,
      isLoading = false,
      onRowDoubleClick,
      hideActionRow = false,
      allowDragDrop: allowDragDropProp = true,
      showContextMenu: showContextMenuProp = true,
      disableCommandOrder = false,
    },
    ref
  ) => {
    const { user } = useUserStore();
    const treeRef = useRef<MyTreeGridRef>(null);
    /** 선택삭제 후 같은 인덱스에 선택 복원할 때 사용 */
    const selectionIndexAfterDeleteRef = useRef<number | null>(null);
    const [headers, setHeaders] = useState<MyTreeGridHeaderType[]>(
      getInitialHeaders(headerLsKey, defaultHeaders || defaultOrderHeaders)
    );
    const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);
    // 히스토리 데이터 저장 (undo/redo 기능용)
    const [treeDataHistory, setTreeDataHistory] = useState<
      MyTreeGridRowType[][]
    >([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [selectedRows, setSelectedRows] = useState<MyTreeGridRowType[]>([]);
    const [shouldClearHighlights, setShouldClearHighlights] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showRowIcon, setShowRowIcon] = useState(() =>
      getInitialShowRowIcon(headerLsKey)
    );
    const [isOpenDiseaseLinkPopup, setIsOpenDiseaseLinkPopup] = useState(false);
    const [diseaseLinks, setDiseaseLinks] = useState<DiseaseLinkType[]>([]);
    const { setNewSymptom, setNewDiseases } = useEncounterStore();
    const { data: usages } = useUsages();
    const [isOpenUsageRecommendationPopup, setIsOpenUsageRecommendationPopup] =
      useState(false);
    const [usageRecommendationRow, setUsageRecommendationRow] =
      useState<MyTreeGridRowType | null>(null);
    /** 원내(inOutType) 체크 시 예외코드 설정 팝업용 row */
    const [exceptionCodePopupRow, setExceptionCodePopupRow] =
      useState<MyTreeGridRowType | null>(null);
    const [isOpenDenyProhibitedDrug, setIsOpenDenyProhibitedDrug] =
      useState(false);
    const [
      isOpenUserConfirmProhibitedDrug,
      setIsOpenUserConfirmProhibitedDrug,
    ] = useState(false);
    // 추가 대기 중인 전체 rows (확인 후 추가됨)
    const [newOrderRows, setNewOrderRows] = useState<MyTreeGridRowType[]>([]);
    const [localNewSymptoms, setLocalNewSymptoms] = useState<string[]>([]);
    const [localNewDiseases, setLocalNewDiseases] = useState<
      BundleItemDisease[]
    >([]);
    // 금지 약품에 해당하는 rows만 (팝업 표시용)
    const [prohibitedOrderRows, setProhibitedOrderRows] = useState<
      MyTreeGridRowType[]
    >([]);
    // 중복 오더 추가 확인 팝업
    const [isOpenDuplicateConfirm, setIsOpenDuplicateConfirm] = useState(false);
    const [duplicateConfirmRows, setDuplicateConfirmRows] = useState<MyTreeGridRowType[]>([]);
    /** 팝업 리스트 표시용: 묶음 헤더 제외, 중복인 처방만 */
    const [duplicateConfirmDisplayRows, setDuplicateConfirmDisplayRows] = useState<MyTreeGridRowType[]>([]);
    /** 보험구분 변경 안내 팝업 */
    const [isOpenInsuranceTypeChangePopup, setIsOpenInsuranceTypeChangePopup] =
      useState(false);
    const [insuranceTypeChangeMessage, setInsuranceTypeChangeMessage] =
      useState("");
    const { currentRegistration } = useReceptionStore();
    const currentRegistrationRef = useRef(currentRegistration);
    currentRegistrationRef.current = currentRegistration;
    const insuranceTypeRef = useRef<보험구분상세 | undefined>(
      isCheckInsuranceType ? currentRegistration?.insuranceType ?? null : null,
    );
    insuranceTypeRef.current = isCheckInsuranceType
      ? currentRegistration?.insuranceType ?? undefined
      : undefined;

    /** 보험구분 변경 시 토스트용 이전 값 */
    const prevInsuranceTypeRef = useRef<보험구분상세 | undefined>(undefined);
    const prevRegistrationIdRef = useRef<string | undefined>(undefined);

    const addNewSymptom = useCallback(
      (symptom: string | undefined) => {
        if (!symptom) return;
        setNewSymptom(symptom);
        return;
      },
      [setNewSymptom]
    );

    const addNewDiseases = useCallback(
      (diseases: DiseaseBase[] | undefined) => {
        if (!diseases) return;
        setNewDiseases(diseases);
      },
      [setNewDiseases]
    );

    const addToHistory = useCallback(
      (newTreeData: MyTreeGridRowType[]) => {
        // 현재 인덱스까지를 기준으로 새 히스토리를 추가하고,
        // redo 대상(미래 히스토리)은 버린다.
        const newHistory = [
          ...treeDataHistory.slice(0, historyIndex + 1),
          newTreeData,
        ];
        const trimmedHistory = newHistory.slice(-30);

        // 히스토리와 인덱스를 동시에 업데이트
        setTreeDataHistory(trimmedHistory);
        setHistoryIndex(historyIndex + 1);
      },
      [treeDataHistory, historyIndex]
    );

    // isCheckInsuranceType 시 보험구분 변경 시 팝업 표시
    useEffect(() => {
      if (!isCheckInsuranceType) return;
      const currentId = currentRegistration?.id?.toString();
      const current = currentRegistration?.insuranceType ?? undefined;
      const prevId = prevRegistrationIdRef.current;
      const prev = prevInsuranceTypeRef.current;
      // 같은 registration 내에서 보험구분이 바뀐 경우에만 팝업 표시
      if (prevId !== undefined && prevId === currentId && prev !== undefined && current !== prev) {
        const prevLabel =
          prev in 보험구분상세FullLabel
            ? 보험구분상세FullLabel[prev as 보험구분상세]
            : "알 수 없음";
        const currentLabel =
          current !== undefined && current in 보험구분상세FullLabel
            ? 보험구분상세FullLabel[current as 보험구분상세]
            : current !== undefined
              ? String(current)
              : "알 수 없음";
        setInsuranceTypeChangeMessage(
          `보험구분이 '${prevLabel}'에서 '${currentLabel}'(으)로 변경되었습니다.`
        );
        setIsOpenInsuranceTypeChangePopup(true);
      }
      prevRegistrationIdRef.current = currentId;
      prevInsuranceTypeRef.current = current;
    }, [isCheckInsuranceType, currentRegistration?.id, currentRegistration?.insuranceType]);

    // 실행 취소
    const undo = useCallback(() => {
      setHistoryIndex((prevIndex) => {
        if (prevIndex > 0) {
          const newIndex = prevIndex - 1;
          const newTreeData = treeDataHistory[newIndex];
          if (newTreeData) {
            setTreeData(newTreeData);
            return newIndex;
          }
        }
        return prevIndex;
      });
    }, [treeDataHistory]);

    // 다시 실행
    const redo = useCallback(() => {
      setHistoryIndex((prevIndex) => {
        if (prevIndex < treeDataHistory.length - 1) {
          const newIndex = prevIndex + 1;
          const newTreeData = treeDataHistory[newIndex];
          if (newTreeData) {
            setTreeData(newTreeData);
            return newIndex;
          }
        }
        return prevIndex;
      });
    }, [treeDataHistory]);

    const isUndoDisabled = useCallback(
      (
        _header: MyTreeGridHeaderType,
        _row: MyTreeGridRowType,
        _selectedRows: MyTreeGridRowType[]
      ) => {
        return historyIndex <= 0;
      },
      [historyIndex]
    );

    const isRedoDisabled = useCallback(
      (
        _header: MyTreeGridHeaderType,
        _row: MyTreeGridRowType,
        _selectedRows: MyTreeGridRowType[]
      ) => {
        return historyIndex >= treeDataHistory.length - 1;
      },
      [historyIndex, treeDataHistory.length]
    );

    // 히스토리 배열이 변경될 때 인덱스 유효성 검사
    useEffect(() => {
      if (historyIndex >= treeDataHistory.length) {
        setHistoryIndex(Math.max(0, treeDataHistory.length - 1));
      }
    }, [treeDataHistory.length, historyIndex]);

    // 데이터 변경 여부를 상위 컴포넌트에 알림
    const prevIsChangedRef = useRef<boolean>(false);
    useEffect(() => {
      const isChanged = historyIndex > 0;
      // 이전 값과 다를 경우에만 호출하여 무한 루프 방지
      if (prevIsChangedRef.current !== isChanged) {
        prevIsChangedRef.current = isChanged;
        onDataChanged?.(isChanged);
      }
    }, [historyIndex, onDataChanged]);

    const updateUsageByTimes: CellUpdateHandler = useCallback(
      (row, timesValue) => {
        // 현재 입력된 usage code 가져오기
        const currentUsageCode = getCellValueAsString(row, "usage");

        // usages에서 일치하는 usageCode 찾기
        const matchedUsage = usages?.find((u) => u.code === currentUsageCode);
        const updatedRow = {
          ...row,
          cells:
            row.cells?.map((cell) => {
              if (cell.headerKey === "times") {
                return { ...cell, value: timesValue };
              }
              return cell;
            }) || [],
        };

        // usageCode.times가 0보다 크고, 변경된 times와 다른지 확인
        if (
          matchedUsage &&
          matchedUsage.times > 0 &&
          matchedUsage.times !== Number(timesValue)
        ) {
          setUsageRecommendationRow(updatedRow);
          setIsOpenUsageRecommendationPopup(true);
        }

        return updatedRow;
      },
      [usages]
    );

    const updateTimesByUsage: CellUpdateHandler = useCallback(
      (row, usageValue) => {
        // usages에서 일치하는 usageCode 찾기
        const matchedUsage = usages?.find((u) => u.code === usageValue);

        // usageCode.times가 0보다 크면 times도 업데이트
        const shouldUpdateTimes = matchedUsage && matchedUsage.times > 0;

        return {
          ...row,
          cells:
            row.cells?.map((cell) => {
              if (cell.headerKey === "usage") {
                return { ...cell, value: usageValue };
              }
              if (shouldUpdateTimes && cell.headerKey === "times") {
                return { ...cell, value: matchedUsage.times };
              }
              return cell;
            }) || [],
        };
      },
      [usages]
    );

    // paymentMethod 변경 시 price 업데이트
    const updatePriceByPaymentMethod: CellUpdateHandler = useCallback(
      (row, paymentMethodValue) => {
        let priceValue: string | number | boolean | undefined;

        switch (paymentMethodValue) {
          case PaymentMethod.수납없음:
            priceValue = 0;
            break;
          case PaymentMethod.일반가: {
            priceValue = getCellValueAsNumber(row, "generalPrice");
            break;
          }
          default:
            const actualPrice = getCellValueAsNumber(row, "actualPrice");
            const insurancePrice = getCellValueAsNumber(row, "insurancePrice");
            if (actualPrice && insurancePrice && actualPrice > 0 && actualPrice < insurancePrice)
              priceValue = actualPrice;
            else
              priceValue = insurancePrice;
        }

        return {
          ...row,
          cells:
            row.cells?.map((cell) => {
              if (cell.headerKey === "paymentMethod") {
                return { ...cell, value: paymentMethodValue };
              }
              // price 셀도 함께 업데이트
              if (cell.headerKey === "price" && priceValue !== undefined) {
                return { ...cell, value: toKRW(priceValue) };
              }
              return cell;
            }) || [],
        };
      },
      []
    );

    // exceptionCode 변경 시 관련 필드 업데이트
    const updateByExceptionCode: CellUpdateHandler = useCallback(
      (row, exceptionCodeValue) => {
        const code = String(exceptionCodeValue ?? "");

        return {
          ...row,
          cells:
            row.cells?.map((cell) => {
              if (cell.headerKey === "exceptionCode") {
                return { ...cell, value: exceptionCodeValue };
              }
              // 코드 00 선택 시 inOutType 을 false 로 설정
              if (cell.headerKey === "inOutType" && code === "00") {
                return { ...cell, value: false };
              }
              return cell;
            }) || [],
        };
      },
      []
    );

    // 헤더 키별 셀 업데이트 핸들러 매핑
    // 새로운 케이스가 추가될 때 여기에 핸들러를 추가하면 됩니다
    const cellUpdateHandlers: Record<string, CellUpdateHandler> = useMemo(
      () => ({
        times: updateUsageByTimes,
        usage: updateTimesByUsage,
        paymentMethod: updatePriceByPaymentMethod,
        exceptionCode: updateByExceptionCode,
        // 향후 다른 헤더 키에 대한 업데이트 핸들러를 여기에 추가할 수 있습니다
      }),
      [
        updateUsageByTimes,
        updateTimesByUsage,
        updatePriceByPaymentMethod,
        updateByExceptionCode,
      ]
    );

    // 셀 데이터 변경 핸들러
    const handleCellDataChange = useCallback(
      (rowKey: string, headerKey: string, value: string | number | boolean) => {
        setTreeData((prevTreeData) => {
          if (!prevTreeData || !Array.isArray(prevTreeData))
            return prevTreeData;

          const newTreeData = prevTreeData.map((row) => {
            if (row.rowKey === rowKey) {
              // 헤더 키에 해당하는 업데이트 핸들러가 있는 경우
              const updateHandler = cellUpdateHandlers[headerKey];
              if (updateHandler) {
                return updateHandler(row, value);
              }

              // 업데이트 핸들러가 없는 경우 기본 로직
              return {
                ...row,
                cells:
                  row.cells?.map((cell) => {
                    if (cell.headerKey === headerKey) {
                      return { ...cell, value };
                    }
                    return cell;
                  }) || [],
              };
            }


            return row;
          });

          addToHistory(newTreeData);
          return newTreeData;
        });
      },
      [addToHistory, cellUpdateHandlers]
    );

    // 이전 data prop과 treeData 추적
    const prevDataRef = useRef<any[]>(data);
    const prevTreeDataRef = useRef<MyTreeGridRowType[]>([]);
    const isInitialMount = useRef(true);
    const drugInfoActionRef = useRef<{
      handleShowDrugInfo: (
        header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => void;
      isNotDrugOrInjection: (
        header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => boolean;
    } | null>(null);

    // 데이터 초기화 (data 또는 insuranceType 변경 시 convert 통해 그리드 재생성)
    useEffect(() => {
      const params: OrderGridConvertToGridRowTypesParams = {
        parentRowKey: null,
        data,
        size: ORDER_GRID_SIZE,
        onCellDataChange: handleCellDataChange,
      };
      if (isCheckInsuranceType) {
        params.insuranceType = currentRegistration?.insuranceType ?? undefined;
      }
      const newTreeData = onConvertToGridRowTypes(params);
      setTreeData(newTreeData || []);
      setTreeDataHistory([newTreeData || []]);
      setHistoryIndex(0);
      prevDataRef.current = data;
      prevTreeDataRef.current = newTreeData || [];
      isInitialMount.current = false;
    }, [
      data,
      onConvertToGridRowTypes,
      isCheckInsuranceType,
      currentRegistration?.insuranceType,
    ]);

    // treeData 변경 시 외부에 알림
    // data prop 변경으로 인한 초기화는 제외 (prevDataRef와 비교)
    useEffect(() => {
      // 초기 마운트 시에는 호출하지 않음
      if (isInitialMount.current) return;

      // data prop이 변경되었는지 확인 (참조 비교)
      const dataPropChanged = prevDataRef.current !== data;

      // data prop이 변경되지 않았고, treeData가 실제로 변경된 경우에만 호출
      if (!dataPropChanged && prevTreeDataRef.current !== treeData) {
        if (onTreeDataChange) {
          onTreeDataChange(flattenTree(treeData, true));
        }
      }

      // treeData 참조 업데이트
      prevTreeDataRef.current = treeData;
    }, [treeData, data, onTreeDataChange]);

    // 선택삭제 후 같은 인덱스에 선택 복원
    useEffect(() => {
      const pendingIndex = selectionIndexAfterDeleteRef.current;
      if (pendingIndex === null) return;

      selectionIndexAfterDeleteRef.current = null;
      const flat = flattenTree(treeData, false, 0, 1, true);
      const idx = Math.min(pendingIndex, Math.max(0, flat.length - 1));
      const row = flat[idx];
      if (row) {
        treeRef.current?.setSelectedRowKeys([row.rowKey]);
      }
    }, [treeData]);

    // 하이라이트 클리어 처리
    useEffect(() => {
      if (!shouldClearHighlights) return;

      const timer = setTimeout(() => {
        const updatedData = updateAllRows(treeData, {
          isHighlight: false,
        });
        setTreeData(updatedData);
        setShouldClearHighlights(false);
      }, 500);

      return () => clearTimeout(timer);
    }, [shouldClearHighlights, treeData]);

    // 드래그 앤 드롭 데이터 변경
    const handleDataChange = useCallback(
      (newData: MyTreeGridRowType[]) => {
        setTreeData(newData);
        addToHistory(newData);
      },
      [addToHistory]
    );

    // 개별 셀 데이터 변경
    const handleDataChangeItem = useCallback(
      (
        headerKey: string,
        row: MyTreeGridRowType,
        value: string | number | boolean | null
      ) => {
        // 원내(inOutType) 체크 시 예외코드 설정 팝업 오픈
        if (headerKey === "inOutType" && value === true) {
          setExceptionCodePopupRow(row);
        }
        setTreeData((prevTreeData) => {
          // 헤더 키에 해당하는 업데이트 핸들러가 있는 경우
          const updateHandler = cellUpdateHandlers[headerKey];
          let updatedRow: MyTreeGridRowType;

          if (updateHandler) {
            updatedRow = updateHandler(row, value);
          } else {
            // 업데이트 핸들러가 없는 경우 기본 로직
            updatedRow = {
              ...row,
              cells:
                row.cells?.map((cell) => {
                  if (cell.headerKey === headerKey) {
                    return { ...cell, value };
                  }
                  return cell;
                }) || [],
            };
          }
          const newTreeData = updateRow(prevTreeData, row.rowKey, updatedRow);
          addToHistory(newTreeData);
          return newTreeData;
        });
      },
      [addToHistory, cellUpdateHandlers]
    );

    // 선택된 행 변경
    const handleSelectedRowsChange = useCallback(
      (
        newSelectedRows: MyTreeGridRowType[],
        _lastSelectedRow: MyTreeGridRowType | null
      ) => {
        setSelectedRows(newSelectedRows);
      },
      []
    );

    // 선택된 행들의 데이터 일괄 변경
    const handleSelectedRowsDataChange = useCallback(
      (
        headerKey: string,
        selectedRows: MyTreeGridRowType[],
        value: string | number | boolean
      ) => {
        setTreeData((prevTreeData) => {
          if (!prevTreeData || !Array.isArray(prevTreeData))
            return prevTreeData;

          let newTreeData = prevTreeData;

          // 선택된 각 행의 데이터를 직접 업데이트
          selectedRows.forEach((selectedRow) => {
            // 현재 트리 데이터에서 해당 행을 찾아서 최신 셀 데이터를 가져옴
            const currentRow = findRow(newTreeData, selectedRow.rowKey);
            if (currentRow) {
              newTreeData = updateRow(newTreeData, selectedRow.rowKey, {
                cells:
                  currentRow.cells?.map((cell) => {
                    if (cell.headerKey === headerKey) {
                      return { ...cell, value };
                    }
                    return cell;
                  }) || [],
              });
            }
          });

          addToHistory(newTreeData);
          return newTreeData;
        });
      },
      [addToHistory]
    );

    const afterAddOrder = () => {
      setShouldClearHighlights(true);
      treeRef.current?.scrollToBottom();
    };

    const checkAddNewRows = (
      newRows: MyTreeGridRowType[] | null,
      checkDuplicate: boolean = true
    ): CheckProhibitedDrugStatus => {
      if (!newRows || newRows.length === 0) return CheckProhibitedDrugStatus.PASS;
      const { duplicatedRows, duplicatedDisplayRows, uniqueRows } = getDuplicatedAndUniqueRows(treeData, newRows, checkDuplicate);
      if (duplicatedRows.length > 0) {
        setDuplicateConfirmRows(duplicatedRows);
        setDuplicateConfirmDisplayRows(duplicatedDisplayRows);
        setIsOpenDuplicateConfirm(true);
      }

      if (isCheckProhibitedDrug) {
        const prohibitedDrugs = currentRegistrationRef.current?.prohibitedDrugs || [];
        // 금지 약품에 해당하는 rows 수집 및 전체 결과 판단
        const foundProhibitedRows: MyTreeGridRowType[] = [];
        let hasDeny = false;
        let hasUserConfirm = false;

        // row와 children을 재귀적으로 점검하는 함수
        const checkRowAndChildren = (row: MyTreeGridRowType) => {
          const prescriptionLibraryId =
            getCellValueAsNumber(row, "prescriptionLibraryId") || 0;
          const drugAtcCode = getCellValueAsString(row, "drugAtcCode") || "";
          const result = checkAllowProhibitedDrug(
            prescriptionLibraryId,
            drugAtcCode,
            prohibitedDrugs
          );

          if (result === CheckProhibitedDrugStatus.BAN) {
            hasDeny = true;
            foundProhibitedRows.push(row);
          } else if (result === CheckProhibitedDrugStatus.USER_CONFIRM) {
            hasUserConfirm = true;
            foundProhibitedRows.push(row);
          }

          // children이 있다면 재귀적으로 점검
          if (row.children && row.children.length > 0) {
            for (const childRow of row.children) {
              checkRowAndChildren(childRow);
            }
          }
        };

        // 모든 rows에 대해 점검 (children 포함)
        for (const row of uniqueRows) {
          checkRowAndChildren(row);
        }

        if (hasDeny) {
          setNewOrderRows(uniqueRows);
          setProhibitedOrderRows(foundProhibitedRows);
          setIsOpenDenyProhibitedDrug(true);
          return CheckProhibitedDrugStatus.BAN;
        } else if (hasUserConfirm) {
          setNewOrderRows(uniqueRows);
          setProhibitedOrderRows(foundProhibitedRows);
          setIsOpenUserConfirmProhibitedDrug(true);
          return CheckProhibitedDrugStatus.USER_CONFIRM;
        } else {
          addNewRows(uniqueRows);
          return CheckProhibitedDrugStatus.PASS;
        }
      } else {
        addNewRows(uniqueRows);
        return CheckProhibitedDrugStatus.PASS;
      }
    };

    const addNewRows = (rows: MyTreeGridRowType[]) => {
      if (!rows || rows.length === 0) return;
      rows.forEach((row) => {
        row.isHighlight = true;
      });
      setTreeData((prevTreeData) => {
        const newTreeData = [...prevTreeData, ...rows];
        addToHistory(newTreeData);
        return newTreeData;
      });
      afterAddOrder();
    };

    /** 묶음·하위 묶음을 isShowBundleName에 따라 헤더 row 포함 여부를 정해 row 배열로 변환 (재귀) */
    const bundleToRows = async (
      bundle: Bundle,
      parentRowKey: string | null,
      options: {
        insuranceType?: 보험구분상세;
        isScheduledOrder: boolean;
        scheduledOrderMemo: string;
        isRoot: boolean;
        symptoms: string[];
        bundleItemDiseases: BundleItemDisease[];
      }
    ): Promise<MyTreeGridRowType[]> => {
      const {
        insuranceType,
        isScheduledOrder,
        scheduledOrderMemo,
        isRoot,
        symptoms,
        bundleItemDiseases,
      } = options;
      if (isCheckBundle && bundle.symptom) symptoms.push(bundle.symptom);
      if (isCheckBundle && bundle.bundleItemDiseases)
        bundleItemDiseases.push(...bundle.bundleItemDiseases);

      if (bundle.isShowBundleName === false) {
        const itemRows = convertBundleItemOrdersToMyTreeGridType({
          parentRowKey,
          data: bundle.bundleItemOrders || [],
          size: ORDER_GRID_SIZE,
          onCellDataChange: handleCellDataChange,
          bundle,
          insuranceType,
        });
        const allRows = [...itemRows];
        if (bundle.parentRelations?.length) {
          for (const relation of bundle.parentRelations) {
            if (!relation.child.id) continue;
            const childBundle = await BundleItemsService.getBundle(
              relation.child.id
            );
            if (childBundle) {
              const childRows = await bundleToRows(childBundle, parentRowKey, {
                ...options,
                isRoot: false,
              });
              allRows.push(...childRows);
            }
          }
        }
        return allRows;
      }

      const newRow = convertBundleToMyTreeGridType(
        parentRowKey,
        bundle,
        ORDER_GRID_SIZE,
        handleCellDataChange,
        isRoot ? isScheduledOrder : false,
        isRoot ? scheduledOrderMemo : "",
        insuranceType
      );
      if (!newRow) return [];
      const childRows: MyTreeGridRowType[] = [...(newRow.children || [])];
      if (bundle.parentRelations?.length) {
        for (const relation of bundle.parentRelations) {
          if (!relation.child.id) continue;
          const childBundle = await BundleItemsService.getBundle(
            relation.child.id
          );
          if (childBundle) {
            const nestedRows = await bundleToRows(childBundle, newRow.rowKey, {
              ...options,
              isRoot: false,
            });
            childRows.push(...nestedRows);
          }
        }
      }
      newRow.children = childRows;
      return [newRow];
    };

    const addBundleLibrary = async (
      order: any,
      isScheduledOrder: boolean = false,
      scheduledOrderMemo: string = ""
    ) => {
      const bundle = await BundleItemsService.getBundle(order.id);
      if (bundleTitleOnly) {
        const newRow = convertBundleTitleOnlyToMyTreeGridType(
          bundle,
          ORDER_GRID_SIZE,
          handleCellDataChange,
          user
        );
        checkAddNewRows(newRow ? [newRow] : null);
      } else {
        if (bundle) {
          const insuranceType = isCheckInsuranceType
            ? insuranceTypeRef.current ?? undefined
            : undefined;
          const symptoms: string[] = [];
          const bundleItemDiseases: BundleItemDisease[] = [];
          const rows = await bundleToRows(bundle, null, {
            insuranceType,
            isScheduledOrder,
            scheduledOrderMemo,
            isRoot: true,
            symptoms,
            bundleItemDiseases,
          });
          const result = checkAddNewRows(
            rows.length > 0 ? rows : null
          );

          if (isCheckBundle) {
            if (result === CheckProhibitedDrugStatus.PASS) {
              addNewSymptom(symptoms.join(""));
              addNewDiseases(
                bundleItemDiseases.map((bundleItemDisease) => {
                  return {
                    diseaseLibraryId: bundleItemDisease.diseaseId,
                    name: bundleItemDisease.name,
                    code: bundleItemDisease.code,
                  };
                })
              );
            } else if (result === CheckProhibitedDrugStatus.USER_CONFIRM) {
              setLocalNewSymptoms(symptoms);
              setLocalNewDiseases(bundleItemDiseases);
            }
          }
        }
      }
    };

    const addOrderLibrary = async (
      order: any,
      isScheduledOrder?: boolean,
      scheduledOrderMemo?: string
    ) => {
      const insuranceType = isCheckInsuranceType
        ? insuranceTypeRef.current ?? undefined
        : undefined;
      const newRow = convertOrderLibraryToMyTreeGridType(
        ORDER_GRID_SIZE,
        handleCellDataChange,
        order,
        user,
        isScheduledOrder,
        scheduledOrderMemo,
        insuranceType
      );
      checkAddNewRows(newRow ? [newRow] : null);
      if (isCheckUserCode) {
        if (order.category === "userCode") {
          if (order.diseaseLink.length === 1) {
            addNewDiseases([
              {
                diseaseLibraryId: order.diseaseLink[0].id,
                code: order.diseaseLink[0].code,
                name: order.diseaseLink[0].name,
              },
            ]);
          } else if (order.diseaseLink.length > 1) {
            setDiseaseLinks(order.diseaseLink);
            setIsOpenDiseaseLinkPopup(true);
          }

          // 주사연결코드가 있으면 해당 처방 라이브러리들도 자동 추가
          if (order.drugUserCode?.injectionLink?.length > 0) {
            const injectionLinks = order.drugUserCode.injectionLink;
            const injectionLinkRows = [];
            for (const link of injectionLinks) {
              try {
                const library =
                  await PrescriptionLibrariesService.getPrescriptionLibraryById(
                    link.id
                  );
                if (library) {
                  const injectionLinkRow = convertOrderLibraryToMyTreeGridType(
                    ORDER_GRID_SIZE,
                    handleCellDataChange,
                    library,
                    user,
                    false,
                    "",
                    insuranceType ?? undefined
                  );
                  if (injectionLinkRow) {
                    injectionLinkRows.push(injectionLinkRow);
                  }
                }
              } catch (error) {
                console.error(
                  `[order-grid] 주사연결코드 조회 실패 (id: ${link.id}):`,
                  error
                );
              }
            }
            if (injectionLinkRows.length > 0) {
              checkAddNewRows(injectionLinkRows);
            }
          }
        }
      }
    };

    const addLibrary = async (
      order: any,
      isScheduledOrder: boolean = false,
      scheduledOrderMemo: string = ""
    ) => {
      if (order.category === "bundle" || order.type === "bundle") {
        addBundleLibrary(order, isScheduledOrder, scheduledOrderMemo);
      } else {
        addOrderLibrary(order, isScheduledOrder, scheduledOrderMemo);
      }
    };

    // 처방 선택 처리
    const handleAddLibrary = useCallback(
      (order: any) => {
        addLibrary(order);
      },
      [addToHistory, convertOrderLibraryToMyTreeGridType]
    );

    // 커스텀 처방 추가
    const handleAddCustomOrder = useCallback(
      (row: MyTreeGridRowType) => {
        row.isHighlight = true;
        setTreeData((prevTreeData) => {
          const newTreeData = [...prevTreeData, row];
          addToHistory(newTreeData);
          return newTreeData;
        });
        afterAddOrder();
      },
      [addToHistory]
    );

    // ref 노출
    useImperativeHandle(
      ref,
      () => ({
        getTreeData: () => {
          return flattenTree(treeData, true);
        },
        getSelectedRows: () => {
          return selectedRows;
        },
        addOrderLibrary: (
          order: any,
          isScheduledOrder: boolean = false,
          scheduledOrderMemo: string = ""
        ) => {
          addLibrary(order, isScheduledOrder, scheduledOrderMemo);
        },
        addOrders: (orders: any[]) => {
          const params: OrderGridConvertToGridRowTypesParams = {
            parentRowKey: null,
            data: orders,
            size: ORDER_GRID_SIZE,
            onCellDataChange: handleCellDataChange,
          };
          if (isCheckInsuranceType) {
            params.insuranceType = insuranceTypeRef.current ?? undefined;
          }
          const rows = onConvertToGridRowTypes(params);
          if (!rows?.length) return;
          checkAddNewRows(rows);
        },
      }),
      [
        treeData,
        selectedRows,
        onConvertToGridRowTypes,
        handleCellDataChange,
        addToHistory,
        checkAddNewRows,
        addLibrary,
      ]
    );

    // 키보드 이벤트 처리 (포커스 상태에서만)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isFocused) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
        ) {
          e.preventDefault();
          redo();
        } else if (e.altKey && e.key.toLowerCase() === "d") {
          // Alt+D: 약품정보(DI) 조회 (선택된 row가 약/주사일 때만, 컨텍스트 메뉴 없이 동작)
          e.preventDefault();
          const action = drugInfoActionRef.current;
          const firstRow = selectedRows[0];
          if (
            firstRow &&
            action &&
            headers[0] &&
            !action.isNotDrugOrInjection(headers[0], firstRow, selectedRows)
          ) {
            action.handleShowDrugInfo(headers[0], firstRow, selectedRows);
          }
        } else if (e.key === "Delete") {
          // input/textarea 내에서는 삭제 동작 무시
          const activeElement = document.activeElement;
          if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            (activeElement as HTMLElement)?.isContentEditable
          ) {
            return;
          }

          if (e.shiftKey) {
            // Shift + Delete: 전체삭제
            e.preventDefault();
            e.stopImmediatePropagation();
            deleteAllRows();
          } else if (!e.ctrlKey && !e.altKey) {
            // Delete: 선택삭제
            e.preventDefault();
            e.stopImmediatePropagation();
            if (selectedRows.length > 0) {
              const first = selectedRows[0];
              if (!first) return;
              const flatBefore = flattenTree(treeData, false, 0, 1, true);
              const firstIndex = flatBefore.findIndex(
                (r) => r.rowKey === first.rowKey
              );
              const targetIndex = firstIndex >= 0 ? firstIndex : 0;

              const rowKeys = selectedRows.map((r) => r.rowKey);
              const updatedData = removeRows(treeData, rowKeys);
              selectionIndexAfterDeleteRef.current = targetIndex;
              setTreeData(updatedData);
              addToHistory(updatedData);
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isFocused, undo, redo, selectedRows, treeData, addToHistory, headers]);

    const deleteSelectedRows = (
      _header: MyTreeGridHeaderType,
      _row: MyTreeGridRowType,
      selectedRows: MyTreeGridRowType[]
    ) => {
      if (selectedRows.length === 0) return;
      const first = selectedRows[0];
      if (!first) return;
      const flatBefore = flattenTree(treeData, false, 0, 1, true);
      const firstIndex = flatBefore.findIndex(
        (r) => r.rowKey === first.rowKey
      );
      const targetIndex = firstIndex >= 0 ? firstIndex : 0;

      const rowKeys = Array.from(selectedRows).map((n) => n.rowKey);
      const updatedData = removeRows(treeData, rowKeys);
      selectionIndexAfterDeleteRef.current = targetIndex;
      setTreeData(updatedData);
      addToHistory(updatedData);
    };

    const deleteAllRows = () => {
      setTreeData([]);
      addToHistory([]);
    };

    const handlePRNOrder = (
      _header: MyTreeGridHeaderType,
      row: MyTreeGridRowType,
      _selectedRows: MyTreeGridRowType[]
    ) => {
      const specificDetails = getSpecificDetailFromRow(row);

      // PRN_CODE 항목 찾기
      const existingIndex = specificDetails.findIndex(
        (item) => item.code === PRN_CODE
      );

      if (existingIndex >= 0) {
        // 있으면 제거
        specificDetails.splice(existingIndex, 1);
      } else {
        // 없으면 추가
        specificDetails.push({
          code: PRN_CODE,
          name: PRN_NAME,
          content: PRN_CONTENT,
          type: SpecificDetailCodeType.Line,
        });
      }

      // 업데이트된 값을 JSON 문자열로 변환하여 저장
      const newValue =
        specificDetails.length > 0 ? JSON.stringify(specificDetails) : null;
      handleDataChangeItem("specificDetail", row, newValue as any);
    };

    const handleShowDrugInfo = (
      _header: MyTreeGridHeaderType,
      row: MyTreeGridRowType,
      _selectedRows: MyTreeGridRowType[]
    ) => {
      const claimCode = row.cells?.find(
        (cell) => cell.headerKey === "claimCode"
      )?.value as string;
      showDrugInfo(claimCode);
    };

    const isNotDrugOrInjection = (
      _header: MyTreeGridHeaderType,
      row: MyTreeGridRowType,
      _selectedRows: MyTreeGridRowType[]
    ) => {
      const itemType = row.cells?.find((cell) => cell.headerKey === "itemType")
        ?.value as string;
      const type = getPrescriptionDetailType(itemType);
      return type !== 처방상세구분.약 && type !== 처방상세구분.주사;
    };

    drugInfoActionRef.current = {
      handleShowDrugInfo,
      isNotDrugOrInjection,
    };

    const handleReleaseBundle = (
      _header: MyTreeGridHeaderType,
      row: MyTreeGridRowType,
      _selectedRows: MyTreeGridRowType[]
    ) => {
      setTreeData((prevTreeData) => {
        // 현재 트리에서 row를 찾아서 children을 가져옴
        const currentRow = findRow(prevTreeData, row.rowKey);
        if (
          !currentRow ||
          !currentRow.children ||
          currentRow.children.length === 0
        ) {
          return prevTreeData;
        }

        // children의 type에서 "fixed-"를 제거하고 parentRowKey를 null로 설정
        const releasedChildren = currentRow.children.map((child) => ({
          ...child,
          type: child.type.replace(/^fixed-/, "") as MyTreeGridRowType["type"],
          parentRowKey: null,
          // children도 재귀적으로 처리
          children: child.children
            ? child.children.map((grandChild) => ({
              ...grandChild,
              type: grandChild.type.replace(
                /^fixed-/,
                ""
              ) as MyTreeGridRowType["type"],
            }))
            : undefined,
        }));

        // row의 parent를 찾음
        const parentInfo = findParentRow(prevTreeData, row.rowKey);

        let newTreeData: MyTreeGridRowType[];

        if (parentInfo.parent === null) {
          // 최상위 레벨에 있는 경우
          // row를 제거하고 children을 같은 위치에 추가
          const rowIndex = parentInfo.index;
          newTreeData = [...prevTreeData];
          newTreeData.splice(rowIndex, 1, ...releasedChildren);
        } else {
          // 중첩된 경우
          // parent의 children에서 row를 제거하고 releasedChildren을 추가
          newTreeData = prevTreeData.map((r) => {
            if (r.rowKey === parentInfo.parent!.rowKey) {
              const currentChildren = [...(r.children || [])];
              const childIndex = currentChildren.findIndex(
                (c) => c.rowKey === row.rowKey
              );
              if (childIndex !== -1) {
                currentChildren.splice(childIndex, 1, ...releasedChildren);
              }
              return {
                ...r,
                children: currentChildren,
              };
            }
            return r;
          });
        }

        // row를 제거 (혹시 남아있을 수 있으므로)
        newTreeData = removeRows(newTreeData, [row.rowKey]);

        addToHistory(newTreeData);
        return newTreeData;
      });
    };

    const isBundleRowDisabled = (
      _header: MyTreeGridHeaderType,
      row: MyTreeGridRowType,
      _selectedRows: MyTreeGridRowType[]
    ) => {
      return row.type !== "package";
    };

    const contextMenuActions: ContextMenuAction[] = [

      {
        id: "delete",
        label: "선택삭제",
        icon: <Trash className="w-3 h-3" />,
        onClick: deleteSelectedRows,
        shortcuts: ["delete"],
      },
      {
        id: "deleteAll",
        label: "전체삭제",
        icon: <Trash2 className="w-3 h-3" />,
        onClick: deleteAllRows,
        shortcuts: ["shift", "delete"],
      },
      {
        id: "prnOrder",
        getLabel: (_header, row, _selectedRows) => {
          const hasPRN = hasSpecificDetailCodeFromRow(row, PRN_CODE);
          return hasPRN ? "PRN 처방 제거" : "PRN 처방 추가";
        },
        icon: <NotepadText className="w-3 h-3" />,
        onClick: handlePRNOrder,
        disabled: isNotDrugOrInjection,
      },
      {
        id: "drugInfo",
        label: "약품정보(DI) 조회",
        icon: <Info className="w-3 h-3" />,
        onClick: handleShowDrugInfo,
        disabled: isNotDrugOrInjection,
        shortcuts: ["alt", "d"],
      },
      {
        id: "releaseBundle",
        label: "묶음 풀기",
        icon: <LineBundleIcon className="w-3 h-3" />,
        onClick: handleReleaseBundle,
        disabled: isBundleRowDisabled,
      },
      {
        id: "undo",
        label: "되돌리기",
        icon: <Undo className="w-3 h-3" />,
        onClick: undo,
        disabled: isUndoDisabled,
        shortcuts: ["ctrl", "z"],
      },
      {
        id: "redo",
        label: "다시 실행",
        icon: <Redo className="w-3 h-3" />,
        onClick: redo,
        disabled: isRedoDisabled,
        shortcuts: ["ctrl", "y"],
      },
    ];

    // 헤더 저장
    useEffect(() => {
      saveHeaders(headerLsKey, headers);
    }, [headers, headerLsKey]);

    // 행 아이콘 보이기 설정 저장
    useEffect(() => {
      saveShowRowIcon(headerLsKey, showRowIcon);
    }, [showRowIcon, headerLsKey]);

    // 처방 검색 input으로 포커스 이동
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const focusSearchInput = useCallback(() => {
      const searchInput = gridContainerRef.current?.querySelector<HTMLInputElement>(
        ".order-action-row-search-input"
      );
      searchInput?.focus();
    }, []);

    // 처방 검색 input에서 위 방향키 → 그리드 마지막 행 선택
    const handleSearchInputKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (
          e.key === "ArrowUp" &&
          target.classList.contains("order-action-row-search-input")
        ) {
          e.preventDefault();
          treeRef.current?.focusLastRow();
        }
      },
      []
    );

    return (
      <div ref={gridContainerRef} className="flex flex-col gap-2 w-full h-full" onKeyDown={handleSearchInputKeyDown}>
        <div
          className={`flex-1 flex w-full h-full border rounded-sm overflow-hidden ${isFocused
            ? "border-none ring-1 ring-[var(--input-focus)]/50"
            : "border-[var(--border-1)]"
            }`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={0}
        >
          <MyTreeGrid
            ref={treeRef}
            headers={headers}
            setHeaders={setHeaders}
            settingButtonOptions={{
              title: "처방 컬럼 설정",
              defaultHeaders: defaultHeaders || defaultOrderHeaders,
              showRowIconSetting: true,
              showRowIcon,
              onShowRowIconChange: setShowRowIcon,
            }}
            data={treeData}
            onDataChange={handleDataChange}
            onDataChangeItem={handleDataChangeItem}
            onSelectedRowsChange={handleSelectedRowsChange}
            onRowDoubleClick={onRowDoubleClick}
            allowDragDrop={allowDragDropProp}
            autoExpandOnDrop={true}
            multiSelect={true}
            isOutSideClickUnSelect={false}
            showContextMenu={showContextMenuProp}
            contextMenuActions={contextMenuActions}
            hideBorder={true}
            size={ORDER_GRID_SIZE}
            showRowIcon={showRowIcon}
            isLoading={isLoading}
            onNavigatePastLastRow={focusSearchInput}
            onEmptyAreaClick={focusSearchInput}
            actionRow={
              hideActionRow ? undefined : (
                <OrderActionRow
                  headers={headers}
                  selectedRows={selectedRows}
                  onSelectedRowsDataChange={handleSelectedRowsDataChange}
                  onCellDataChange={handleCellDataChange}
                  onAddLibrary={handleAddLibrary}
                  onAddCustomOrder={handleAddCustomOrder}
                  noBundle={noBundle}
                  size="sm"
                  disableCommandOrder={disableCommandOrder}
                />
              )
            }
          />
        </div>
        {isOpenDiseaseLinkPopup && (
          <OrderDiseaseLinkPopup
            diseaseLinks={diseaseLinks}
            addNewDiseases={addNewDiseases}
            setOpen={setIsOpenDiseaseLinkPopup}
          />
        )}

        {isOpenUsageRecommendationPopup && usageRecommendationRow && (
          <OrderUsageRecommendationPopup
            row={usageRecommendationRow}
            handleDataChangeItem={handleDataChangeItem}
            setOpen={setIsOpenUsageRecommendationPopup}
          />
        )}

        {exceptionCodePopupRow && (
          <DrugSeparationExceptionCodePopup
            type={DrugSeparationExceptionCodeType.Drug}
            currentExceptionCode={
              getCellValueAsString(
                findRow(treeData, exceptionCodePopupRow.rowKey) ??
                exceptionCodePopupRow,
                "exceptionCode"
              ) ?? ""
            }
            setExceptionCode={(value) => {
              const currentRow =
                findRow(treeData, exceptionCodePopupRow.rowKey) ??
                exceptionCodePopupRow;
              handleDataChangeItem("exceptionCode", currentRow, value);
              setExceptionCodePopupRow(null);
            }}
            setOpen={(open) => {
              if (!open) setExceptionCodePopupRow(null);
            }}
          />
        )}

        <MyPopupMsg
          isOpen={isOpenDenyProhibitedDrug}
          onCloseAction={() => {
            setIsOpenDenyProhibitedDrug(false);
            setNewOrderRows([]);
            setProhibitedOrderRows([]);
          }}
          onConfirmAction={() => {
            setIsOpenDenyProhibitedDrug(false);
            setNewOrderRows([]);
            setProhibitedOrderRows([]);
          }}
          title="처방금지"
          message="이 약물은 처방금지 약물로 등록되어 처방할 수 없습니다."
          msgType="error"
        >
          {prohibitedOrderRows.length > 0 && (
            <div className="flex flex-col gap-[10px]">
              {prohibitedOrderRows.map((row, index) => (
                <div key={index} className="flex flex-row gap-2">
                  <div className="bg-[var(--bg-1)] text-[12px] px-[10px] py-[5px] rounded-sm">
                    {getCellValueAsString(row, "drugAtcCode") || ""}
                  </div>
                  <div className="bg-[var(--bg-1)] text-[12px] px-[10px] py-[5px] rounded-sm">
                    {getCellValueAsString(row, "name") || ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </MyPopupMsg>
        <MyPopupMsg
          isOpen={isOpenInsuranceTypeChangePopup}
          onCloseAction={() => setIsOpenInsuranceTypeChangePopup(false)}
          onConfirmAction={() => setIsOpenInsuranceTypeChangePopup(false)}
          title="보험구분 변경"
          message={insuranceTypeChangeMessage}
          msgType="info"
        />
        <MyPopupYesNo
          isOpen={isOpenUserConfirmProhibitedDrug}
          onCloseAction={() => {
            setIsOpenUserConfirmProhibitedDrug(false);
            setNewOrderRows([]);
            setProhibitedOrderRows([]);
          }}
          onConfirmAction={(param: MyTreeGridRowType[]) => {
            // 확인 시 전체 newOrderRows를 추가 (금지 약품 포함)
            addNewRows(param);
            addNewSymptom(localNewSymptoms.join(""));
            addNewDiseases(
              localNewDiseases.map((bundleItemDisease) => {
                return {
                  diseaseLibraryId: bundleItemDisease.diseaseId,
                  name: bundleItemDisease.name,
                  code: bundleItemDisease.code,
                };
              })
            );
            setIsOpenUserConfirmProhibitedDrug(false);
            setNewOrderRows([]);
            setLocalNewSymptoms([]);
            setLocalNewDiseases([]);
            setProhibitedOrderRows([]);
          }}
          confirmParam={newOrderRows}
          title="처방금지"
          message="처방금지된 약물이 포함되어 있습니다. 정말 처방하시겠습니까?"
          confirmText="처방"
          cancelText="취소"
        >
          {prohibitedOrderRows.length > 0 && (
            <div className="flex flex-col gap-2">
              {prohibitedOrderRows.map((row, index) => (
                <div key={index} className="flex flex-row gap-2">
                  <div className="bg-[var(--bg-1)] text-[12px] px-[10px] py-[5px] rounded-sm">
                    {getCellValueAsString(row, "drugAtcCode") || ""}
                  </div>
                  <div className="bg-[var(--bg-1)] text-[12px] px-[10px] py-[5px] rounded-sm">
                    {getCellValueAsString(row, "name") || ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </MyPopupYesNo>
        <MyPopupYesNo
          isOpen={isOpenDuplicateConfirm}
          onCloseAction={() => {
            setIsOpenDuplicateConfirm(false);
            setDuplicateConfirmRows([]);
            setDuplicateConfirmDisplayRows([]);
          }}
          onConfirmAction={(rows: MyTreeGridRowType[]) => {
            if (!rows || rows.length === 0) return;
            checkAddNewRows(rows, false);
            setIsOpenDuplicateConfirm(false);
            setDuplicateConfirmRows([]);
            setDuplicateConfirmDisplayRows([]);
          }}
          confirmParam={duplicateConfirmRows}
          title="중복처방"
          confirmText="예"
          cancelText="아니오"
        >
          <div className="flex flex-col px-1 gap-3 min-h-0">
            <div className="text-[14px] font-semibold">
              이미 등록된 처방이 {duplicateConfirmDisplayRows.length}건 있습니다. 중복해서 처방하시겠습니까?
            </div>
            <div className="flex flex-col border border-[var(--border-1)] rounded-sm min-h-0 max-w-[350px] max-h-[180px]">
              <div className="flex flex-row items-center bg-[var(--bg-2)] border-b border-[var(--border-1)] gap-[8px] px-[8px] py-[4px] shrink-0">
                <span className="text-[12px] font-medium text-[var(--text-primary)] w-full">명칭</span>
              </div>
              <div className="flex flex-col min-h-0 my-scroll bg-[var(--bg-main)]">
                <div className="min-w-max">
                  {duplicateConfirmDisplayRows.map((row) => (
                    <DuplicateConfirmRowReadOnly key={row.rowKey} row={row} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </MyPopupYesNo>
      </div>
    );
  }
);

function DuplicateConfirmRowReadOnly({ row }: { row: MyTreeGridRowType }) {
  const name = getCellValueAsString(row, "name") ?? "";
  const userCode = getCellValueAsString(row, "userCode") ?? "";

  const content =
    userCode === COMMAND_DIVIDE_LINE ? (
      name.trim() !== "" ? (
        <>
          <DivideLine />
          <div className="text-xs whitespace-nowrap">{name}</div>
          <DivideLine />
        </>
      ) : (
        <DivideLine />
      )
    ) : (
      name || "-"
    );

  return (
    <div className="flex flex-row items-center min-w-max">
      <div className="flex flex-row items-center w-full">
        <div className="flex items-center justify-center shrink-0">
          {row.iconBtn}
        </div>
        <div className="text-[12px] px-[6px] py-[3px] whitespace-nowrap flex flex-row gap-1 items-center w-full">
          {content}
        </div>
      </div>
    </div>
  );
}

OrderGrid.displayName = "OrderGrid";

function DivideLine() {
  return <hr className="w-full border-[#666] dark:border-[#999]" />;
}

export default OrderGrid;
