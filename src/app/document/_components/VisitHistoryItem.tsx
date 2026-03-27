"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import DOMPurify from "dompurify";
import type { Encounter } from "@/types/chart/encounter-types";
import { InputType } from "@/types/chart/order-types";
import { useDoctorsStore } from "@/store/doctors-store";
import { toKRW } from "@/lib/patient-utils";
import { MoneyIcon } from "@/components/custom-icons";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { cn } from "@/lib/utils";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { saveHeaders } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import MyTreeGrid from "@/components/yjg/my-tree-grid/my-tree-grid";
import {
  defaultDocumentPrescriptionHeaders,
  LS_DOCUMENT_PRESCRIPTION_HEADERS_KEY,
} from "./document-prescription-headers";
import {
  defaultDocumentDiagnosisHeaders,
  LS_DOCUMENT_DIAGNOSIS_HEADERS_KEY,
} from "./document-diagnosis-headers";
import { convertHistoryDiseasesToMyTreeGridType } from "@/app/medical/_components/panels/(patient-history)/(encounter-history)/history-disease-converter";
import { convertHistoryOrdersToMyTreeGridType } from "@/app/medical/_components/panels/(patient-history)/(encounter-history)/history-order-converter";
import { getInitialHeaders } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { HIGHLIGHT_KEYWORD_CLASS } from "@/components/yjg/common/constant/class-constants";
import { useDocumentContext } from "../_contexts/DocumentContext";
import { useToastHelpers } from "@/components/ui/toast";

interface VisitHistoryItemProps {
  encounter: Encounter;
  isOpen: boolean;
  onToggleOpen: (isOpen: boolean) => void;
  isSelected: boolean;
  onToggleSelected: () => void;
  searchKeyword?: string;
}

export default function VisitHistoryItem({
  encounter,
  isOpen,
  onToggleOpen,
  isSelected,
  onToggleSelected,
  searchKeyword,
}: VisitHistoryItemProps) {
  const [diagnosisHeaders, setDiagnosisHeaders] = useState<
    MyTreeGridHeaderType[]
  >(
    getInitialHeaders(
      LS_DOCUMENT_DIAGNOSIS_HEADERS_KEY,
      defaultDocumentDiagnosisHeaders
    )
  );
  const [prescriptionHeaders, setPrescriptionHeaders] = useState<
    MyTreeGridHeaderType[]
  >(
    getInitialHeaders(
      LS_DOCUMENT_PRESCRIPTION_HEADERS_KEY,
      defaultDocumentPrescriptionHeaders
    )
  );

  return (
    <div className="border-b border-[#eaebec] last:border-0 bg-white">
      {/* 아코디언 헤더 */}
      <div
        className="flex items-center px-[12px] py-[10px] cursor-pointer hover:bg-gray-50"
        onClick={() => onToggleOpen(!isOpen)}
      >
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelected();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer"
          />
          <VisitHistoryItemHeader encounter={encounter} />
        </div>
        <div className="flex-shrink-0 ml-2">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#46474c]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#46474c]" />
          )}
        </div>
      </div>

      {/* 아코디언 내용 */}
      {isOpen && (
        <div className="px-[12px] pb-[12px] border-t border-[#eaebec] bg-white">
          <VisitHistoryItemSymptom
            encounter={encounter}
            searchKeyword={searchKeyword}
          />
          <VisitHistoryItemDiagnosis
            encounter={encounter}
            diagnosisHeaders={diagnosisHeaders}
            setDiagnosisHeaders={setDiagnosisHeaders}
            searchKeyword={searchKeyword}
          />
          <VisitHistoryItemPrescription
            encounter={encounter}
            prescriptionHeaders={prescriptionHeaders}
            setPrescriptionHeaders={setPrescriptionHeaders}
            searchKeyword={searchKeyword}
          />
          <VisitHistoryItemPayInfo encounter={encounter} />
        </div>
      )}
    </div>
  );
}

function VisitHistoryItemHeader({ encounter }: { encounter: Encounter }) {
  const { doctors } = useDoctorsStore();

  const date = new Date(encounter.encounterDateTime || "");
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const doctorName =
    doctors.find((doctor) => doctor.id === encounter?.doctorId)?.name || "";

  // 요약 정보 생성 (간단한 버전)
  const summary = encounter.symptom
    ? encounter.symptom.replace(/<[^>]*>/g, "").substring(0, 50)
    : "내원일에 대한 주 진료 정보를 한 줄로 요약하여 표시되는 곳 입니다.";

  return (
    <>
      <span className="text-[13px] text-[#46474c] whitespace-nowrap">
        {`${year}.${month}.${day}`}
      </span>
      <span className="text-[13px] text-[#0b0b0b] whitespace-nowrap">
        {doctorName}
      </span>
      <span className="text-[13px] text-[#0b0b0b] truncate flex-1 min-w-0">
        {summary}
      </span>
    </>
  );
}

// HTML 콘텐츠에서 검색 키워드 하이라이트
function highlightKeywordInHTML(html: string, keyword?: string): string {
  if (!keyword || !html) return html;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(>)([^<]*?)(${escapedKeyword})([^<]*?)(<)`, "gi");
  return html.replace(
    regex,
    (_match, p1, p2, p3, p4, p5) =>
      `${p1}${p2}<mark class="${HIGHLIGHT_KEYWORD_CLASS}">${p3}</mark>${p4}${p5}`
  );
}

function VisitHistoryItemSymptom({
  encounter,
  searchKeyword,
}: {
  encounter: Encounter;
  searchKeyword?: string;
}) {
  const { lastFocusedFieldRef, formSetValueRef } = useDocumentContext();
  const { info } = useToastHelpers();

  const handleInsertSymptom = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const lastFocused = lastFocusedFieldRef.current;
      if (!lastFocused || !lastFocused.element) {
        info("입력할 필드를 먼저 선택해주세요.");
        return;
      }

      const symptom = encounter?.symptom || "";

      // HTML 태그 제거하여 순수 텍스트만 추출
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = DOMPurify.sanitize(symptom);
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      if (!plainText.trim()) {
        return;
      }

      const element = lastFocused.element;
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value || "";

      // 기존 값이 있으면 줄바꿈 후 추가, 없으면 그대로 입력
      const newValue = currentValue
        ? `${currentValue}\n${plainText}`
        : plainText;

      // react-hook-form의 setValue 사용
      formSetValueRef.current?.(lastFocused.fieldKey, newValue, {
        shouldDirty: true,
      });

      // 포커스만 유지 (값은 react-hook-form이 관리)
      element.focus();
    },
    [encounter?.symptom, lastFocusedFieldRef, formSetValueRef, info]
  );

  return (
    <>
      <div className="pt-[12px] pb-[8px]">
        <div className="flex items-center justify-between mb-[4px]">
          <MyTooltip
            delayDuration={500}
            content={
              <div>
                증상을 리핏합니다.
              </div>
            }
          >
            <div
              className={cn(
                "flex flex-row items-center justify-between flex-1 px-2 py-1",
                encounter?.symptom
                  ? "cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] rounded-sm"
                  : "cursor-default"
              )}
              onClick={handleInsertSymptom}
            >
              <span className="text-[14px] font-bold">증상</span>
              {encounter?.symptom && (
                <div className="text-[10px] text-[var(--gray-600)]">Repeat</div>
              )}
            </div>
          </MyTooltip>
        </div>
        {encounter?.symptom ? (
          <div
            className="my-tiptap-editor tiptap ProseMirror my-scroll read-only select-text p-2 rounded-sm border border-[#eaebec] text-[13px] text-[#46474c]"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                highlightKeywordInHTML(encounter.symptom, searchKeyword)
              ),
            }}
          />
        ) : (
          <div className="text-[13px] text-[#989ba2] p-2">
            증상 정보가 없습니다.
          </div>
        )}
      </div>
    </>
  );
}

function VisitHistoryItemDiagnosis({
  encounter,
  diagnosisHeaders,
  setDiagnosisHeaders,
  searchKeyword,
}: {
  encounter: Encounter;
  diagnosisHeaders: MyTreeGridHeaderType[];
  setDiagnosisHeaders: (headers: MyTreeGridHeaderType[]) => void;
  searchKeyword?: string;
}) {
  const { lastFocusedFieldRef, formSetValueRef } = useDocumentContext();
  const { info } = useToastHelpers();

  useEffect(() => {
    saveHeaders(LS_DOCUMENT_DIAGNOSIS_HEADERS_KEY, diagnosisHeaders);
  }, [diagnosisHeaders]);

  const handleRowDoubleClick = useCallback(
    (row: MyTreeGridRowType) => {
      const disease = row.orgData.data as any;
      const diseaseName = disease.name || "";

      const lastFocused = lastFocusedFieldRef.current;
      if (!lastFocused || !lastFocused.element) {
        info("입력할 필드를 먼저 선택해주세요.");
        return;
      }

      const element = lastFocused.element;
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value || "";

      // 기존 값이 있으면 줄바꿈 후 추가, 없으면 그대로 입력
      const newValue = currentValue
        ? `${currentValue}${diseaseName}`
        : `${diseaseName}`;

      // react-hook-form의 setValue 사용
      formSetValueRef.current?.(lastFocused.fieldKey, newValue, {
        shouldDirty: true,
      });

      // 포커스만 유지 (값은 react-hook-form이 관리)
      element.focus();
    },
    [lastFocusedFieldRef, formSetValueRef, info]
  );

  const handleInsertAllDiagnoses = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const lastFocused = lastFocusedFieldRef.current;
      if (!lastFocused || !lastFocused.element) {
        info("입력할 필드를 먼저 선택해주세요.");
        return;
      }

      const diseases = encounter.diseases || [];
      if (diseases.length === 0) {
        return;
      }

      // 모든 진단을 포맷팅하여 하나의 문자열로 만들기
      const formattedDiagnoses = diseases
        .map((disease: any) => {
          return disease.name || "";
        })
        .filter(Boolean)
        .join("\n");

      if (!formattedDiagnoses) {
        return;
      }

      const element = lastFocused.element;
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value || "";

      // 기존 값이 있으면 줄바꿈 후 추가, 없으면 그대로 입력
      const newValue = currentValue
        ? `${currentValue}\n${formattedDiagnoses}`
        : formattedDiagnoses;

      // react-hook-form의 setValue 사용
      formSetValueRef.current?.(lastFocused.fieldKey, newValue, {
        shouldDirty: true,
      });

      // 포커스만 유지 (값은 react-hook-form이 관리)
      element.focus();
    },
    [encounter.diseases, lastFocusedFieldRef, formSetValueRef, info]
  );

  return (
    <>
      <div className="pt-[8px] pb-[8px] border-t border-[#eaebec]">
        <div className="flex items-center justify-between mb-[4px]">
          <MyTooltip
            delayDuration={500}
            content={
              <div>
                전체 진단을 리핏합니다.
                <br />
                <span className="text-[12px] text-[var(--gray-700)]">
                  (개별 리핏은 리스트에서 더블클릭으로 가능합니다.)
                </span>
              </div>
            }
          >
            <div
              className="flex flex-row items-center justify-between flex-1 px-2 py-1 cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] rounded-sm"
              onClick={handleInsertAllDiagnoses}
            >
              <span className="text-[14px] font-bold">진단</span>
              <div className="text-[10px] text-[var(--gray-600)]">Repeat</div>
            </div>
          </MyTooltip>
        </div>
        <div className="rounded-sm">
          <MyTreeGrid
            headers={diagnosisHeaders}
            setHeaders={setDiagnosisHeaders}
            data={convertHistoryDiseasesToMyTreeGridType(
              "default",
              encounter.diseases || []
            )}
            onDataChange={() => { }}
            onRowDoubleClick={handleRowDoubleClick}
            showContextMenu={false}
            hideBorder={true}
            multiSelect={false}
            searchKeyword={searchKeyword}
          />
        </div>
      </div>
    </>
  );
}

function VisitHistoryItemPrescription({
  encounter,
  prescriptionHeaders,
  setPrescriptionHeaders,
  searchKeyword,
}: {
  encounter: Encounter;
  prescriptionHeaders: MyTreeGridHeaderType[];
  setPrescriptionHeaders: (headers: MyTreeGridHeaderType[]) => void;
  searchKeyword?: string;
}) {
  const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);
  const { lastFocusedFieldRef, formSetValueRef } = useDocumentContext();
  const { info } = useToastHelpers();

  // 재귀적으로 모든 레벨의 row를 변환하는 함수
  const transformRowRecursively = (
    row: MyTreeGridRowType
  ): MyTreeGridRowType => {
    const order = row.orgData.data as any;

    // 용투일 컬럼 생성: {용량}/{일투}/{일수}
    const dosageInfo = `${order.dose}/${order.times}/${order.days}`;

    // specificDetail을 문자열로 변환 (배열인 경우)
    let specificDetailValue = "";
    if (order.specificDetail && Array.isArray(order.specificDetail)) {
      specificDetailValue = order.specificDetail
        .map((detail: any) => detail.content || detail.code || "")
        .filter(Boolean)
        .join(", ");
    }

    // 필요한 컬럼만 재구성: userCode, claimCode, name, dosageInfo, specificDetail 순서
    const newCells = [
      {
        headerKey: "userCode",
        value: order.userCode || "",
      },
      {
        headerKey: "claimCode",
        value: order.claimCode || "",
      },
      {
        headerKey: "name",
        value: order.name || "",
      },
      {
        headerKey: "dosageInfo",
        value: dosageInfo,
      },
      {
        headerKey: "specificDetail",
        value: specificDetailValue,
      },
    ];

    // children을 재귀적으로 변환 (기존 rowKey 유지)
    const transformedChildren = row.children?.map(transformRowRecursively);

    return {
      ...row,
      rowKey: row.rowKey, // 기존 rowKey 명시적으로 유지
      cells: newCells,
      children: transformedChildren,
    };
  };

  useEffect(() => {
    const newTreeData = convertHistoryOrdersToMyTreeGridType(
      null,
      encounter.orders || [],
      "default",
      () => { }
    );

    // 처방 테이블 데이터 변환: 용투일 컬럼 추가 및 필요한 컬럼만 재구성
    const transformedData = (newTreeData || []).map(transformRowRecursively);

    setTreeData(transformedData);
  }, [encounter.orders]);

  const handleDataChange = useCallback((newData: MyTreeGridRowType[]) => {
    setTreeData(newData);
  }, []);

  useEffect(() => {
    saveHeaders(LS_DOCUMENT_PRESCRIPTION_HEADERS_KEY, prescriptionHeaders);
  }, [prescriptionHeaders]);

  const handleRowDoubleClick = useCallback(
    (row: MyTreeGridRowType) => {
      const lastFocused = lastFocusedFieldRef.current;
      if (!lastFocused || !lastFocused.element) {
        info("입력할 필드를 먼저 선택해주세요.");
        return;
      }

      // 묶음 헤더인 경우 자식 노드들의 처방 정보 추출
      const ordersToInsert: any[] = [];
      const order = row.orgData.data as any;

      if (order.inputType === InputType.묶음헤더) {
        // 자식 노드들 중 실제 처방만 추출
        const extractActualOrders = (nodes: MyTreeGridRowType[]) => {
          nodes.forEach((node) => {
            const nodeData = node.orgData.data as any;
            if (isActualPrescription(nodeData)) {
              ordersToInsert.push(nodeData);
            }
            if (node.children && node.children.length > 0) {
              extractActualOrders(node.children);
            }
          });
        };
        if (row.children) {
          extractActualOrders(row.children);
        }
      } else if (isActualPrescription(order)) {
        ordersToInsert.push(order);
      }

      if (ordersToInsert.length === 0) {
        return;
      }

      const formattedText = ordersToInsert.map((o) => o.name || "").join("\n");

      const element = lastFocused.element;
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value || "";

      // 기존 값이 있으면 줄바꿈 후 추가, 없으면 그대로 입력
      const newValue = currentValue
        ? `${currentValue}${formattedText}`
        : formattedText;

      // react-hook-form의 setValue 사용
      formSetValueRef.current?.(lastFocused.fieldKey, newValue, {
        shouldDirty: true,
      });

      // 포커스만 유지 (값은 react-hook-form이 관리)
      element.focus();
    },
    [lastFocusedFieldRef, formSetValueRef, info]
  );

  const handleInsertAllPrescriptions = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const lastFocused = lastFocusedFieldRef.current;
      if (!lastFocused || !lastFocused.element) {
        info("입력할 필드를 먼저 선택해주세요.");
        return;
      }

      const orders = encounter.orders || [];
      if (orders.length === 0) {
        return;
      }

      // 묶음 헤더, 구분선 제외하고 실제 처방만 추출
      const actualOrders = (orders as any[]).filter(isActualPrescription);

      // 모든 처방을 포맷팅하여 하나의 문자열로 만들기
      const formattedPrescriptions = actualOrders
        .map((order: any) => {
          return order.name || "";
        })
        .filter(Boolean)
        .join("\n");

      if (!formattedPrescriptions) {
        info("입력할 처방 정보가 없습니다.");
        return;
      }

      const element = lastFocused.element;
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value || "";

      // 기존 값이 있으면 줄바꿈 후 추가, 없으면 그대로 입력
      const newValue = currentValue
        ? `${currentValue}\n${formattedPrescriptions}`
        : formattedPrescriptions;

      // react-hook-form의 setValue 사용
      formSetValueRef.current?.(lastFocused.fieldKey, newValue, {
        shouldDirty: true,
      });

      // 포커스만 유지 (값은 react-hook-form이 관리)
      element.focus();
    },
    [encounter.orders, lastFocusedFieldRef, formSetValueRef, info]
  );

  return (
    <>
      <div className="pt-[8px] pb-[8px] border-t border-[#eaebec]">
        <div className="flex items-center justify-between mb-[4px]">
          <MyTooltip
            delayDuration={500}
            content={
              <div>
                전체 처방을 리핏합니다.
                <br />
                <span className="text-[12px] text-[var(--gray-700)]">
                  (개별 리핏은 리스트에서 더블클릭으로 가능합니다.)
                </span>
              </div>
            }
          >
            <div
              className="flex flex-row items-center justify-between flex-1 px-2 py-1 cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] rounded-sm"
              onClick={handleInsertAllPrescriptions}
            >
              <span className="text-[14px] font-bold">처방</span>
              <div className="text-[10px] text-[var(--gray-600)]">Repeat</div>
            </div>
          </MyTooltip>
        </div>
        <div className="rounded-sm">
          <MyTreeGrid
            headers={prescriptionHeaders}
            setHeaders={setPrescriptionHeaders}
            data={treeData}
            onDataChange={handleDataChange}
            onRowDoubleClick={handleRowDoubleClick}
            showContextMenu={false}
            hideBorder={true}
            multiSelect={false}
            searchKeyword={searchKeyword}
          />
        </div>
      </div>
    </>
  );
}

function VisitHistoryItemPayInfo({ encounter }: { encounter: Encounter }) {
  return (
    <>
      <div className="pt-[8px] border-t border-[#eaebec] flex items-center justify-end gap-[8px]">
        <MoneyIcon className="w-[12px] h-[12px]" />
        <span className="text-[13px] text-[#0b0b0b]">
          {encounter?.calcResultData?.본인부담금액?.본인부담금총액
            ? toKRW(encounter.calcResultData.본인부담금액.본인부담금총액)
            : toKRW(0)}
        </span>
      </div>
    </>
  );
}

function isActualPrescription(order: any) {
  const excludedInputTypes = [InputType.구분선, InputType.묶음헤더];
  return !excludedInputTypes.includes(order?.inputType);
}
