import { useState, useMemo, useEffect } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import SpecificDetailList from "./specific-detail-list";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import MySplitPane from "@/components/yjg/my-split-pane";
import { getCellValueAsString } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { formatDate } from "@/lib/date-utils";
import { useEncounterStore } from "@/store/encounter-store";
import { useSpecificDetailCodes } from "@/hooks/specific-detail-codes/use-specific-detail-codes";
import type { SpecificDetailCode } from "@/types/chart/specific-detail-code-type";
import { SpecificDetailCodeType } from "@/types/chart/specific-detail-code-type";
import SpecificDetailForm from "./specific-detail-form";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";

export default function SpecificDetailPopup({
  type,
  row,
  currentSpecificDetails,
  setOpen,
  onChange,
}: {
  type: SpecificDetailCodeType;
  row?: MyTreeGridRowType;
  currentSpecificDetails: SpecificDetail[];
  setOpen: (open: boolean) => void;
  onChange: (specificDetails: SpecificDetail[]) => void;
}) {
  const [localSpecificDetails, setLocalSpecificDetails] = useState<
    SpecificDetail[]
  >(currentSpecificDetails);
  const [localSpecificDetail, setLocalSpecificDetail] = useState<SpecificDetail | undefined>(undefined);
  const { selectedEncounter } = useEncounterStore();
  const baseDate = formatDate(selectedEncounter?.encounterDateTime, "-");
  const { data: allSpecificDetailCodes } = useSpecificDetailCodes({ baseDate });
  const [selectedSpecificDetailCode, setSelectedSpecificDetailCode] = useState<
    SpecificDetailCode | undefined
  >(undefined);

  // type에 해당하는 특정내역만 필터링
  const specificDetailCodes = useMemo(() => {
    if (!allSpecificDetailCodes) return undefined;
    return allSpecificDetailCodes.filter((item) => item.type === type);
  }, [allSpecificDetailCodes, type]);

  const isSelectedEnrolled = useMemo(() => {
    if (!selectedSpecificDetailCode) return false;
    return localSpecificDetails.some(
      (item) => item.code === selectedSpecificDetailCode.code
    );
  }, [selectedSpecificDetailCode, localSpecificDetails]);

  const handleClose = () => {
    setOpen(false);
  };

  const applyLocalSpecificDetail = () => {
    let newSpecificDetails: SpecificDetail[] = localSpecificDetails;
    const targetSpecificDetail =
      localSpecificDetail ??
      (selectedSpecificDetailCode
        ? {
            code: selectedSpecificDetailCode.code,
            name: selectedSpecificDetailCode.name,
            content: "",
            type: selectedSpecificDetailCode.type,
          }
        : undefined);

    if (targetSpecificDetail) {
      const existingIndex = localSpecificDetails.findIndex(
        (item) => item.code === targetSpecificDetail.code
      );
      if (existingIndex >= 0) {
        // 기존 항목 수정
        newSpecificDetails = localSpecificDetails.map((item, index) =>
          index === existingIndex ? targetSpecificDetail : item
        );
      } else {
        // 새 항목 추가
        newSpecificDetails = [...localSpecificDetails, targetSpecificDetail];
      }
      setLocalSpecificDetails(newSpecificDetails);
      setLocalSpecificDetail(undefined); // 저장 후 초기화
      setSelectedSpecificDetailCode(undefined);
    }
    return newSpecificDetails;
  };

  const handleSaveAndClose = () => {
    const newSpecificDetails = applyLocalSpecificDetail();
    onChange(newSpecificDetails);
    handleClose();
  };

  const handleDelete = () => {
    if (!selectedSpecificDetailCode || !isSelectedEnrolled) return;
    const newSpecificDetails = localSpecificDetails.filter(
      (item) => item.code !== selectedSpecificDetailCode.code
    );
    setLocalSpecificDetails(newSpecificDetails);
    onChange(newSpecificDetails);
    setSelectedSpecificDetailCode(undefined);
    setLocalSpecificDetail(undefined);
  };

  // 최초 오픈 시 기본 코드 자동 선택: 줄단위→JX999, 명세서단위→MX999
  useEffect(() => {
    if (!specificDetailCodes?.length || selectedSpecificDetailCode) return;
    const defaultCode = type === SpecificDetailCodeType.Line ? "JX999" : "MX999";
    const found = specificDetailCodes.find((item) => item.code === defaultCode);
    if (found) {
      setSelectedSpecificDetailCode(found);
      const enrolled = localSpecificDetails.find((item) => item.code === defaultCode);
      setLocalSpecificDetail(enrolled);
    }
  }, [specificDetailCodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectCode = (code: string) => {
    const specificDetailCode = specificDetailCodes?.find(
      (item) => item.code === code
    );
    if (specificDetailCode) {
      setSelectedSpecificDetailCode(specificDetailCode);
      const enrolledSpecificDetail = localSpecificDetails.find(
        (item) => item.code === code
      );
      // 등록된 항목 선택 시 기존 content를 우측 폼에 표시
      setLocalSpecificDetail(enrolledSpecificDetail);
    }
  };

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={handleClose}
      title={`${type === SpecificDetailCodeType.Line ? "줄단위" : "명세서"} 특정내역`}
      testId="medical-specific-detail-popup"
      width="800px"
      height="600px"
      minWidth="600px"
      minHeight="400px"
      localStorageKey={"specific-detail-popup-settings"}
    >
      <div className="flex flex-col w-full h-full p-2 gap-2">
        {type === SpecificDetailCodeType.Line && row && (
          <div className="flex flex-row items-center gap-2 bg-[var(--bg-1)] p-2 rounded">
            <span className="text-[12px] text-[var(--gray-400)]">
              선택된 오더명
            </span>
            <span className="text-[12px]">
              {getCellValueAsString(row, "name")}
            </span>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <MySplitPane
            splitPaneId="specific-detail-popup"
            isVertical={false}
            initialRatios={[0.5, 0.5]}
            panes={[
              <SpecificDetailList
                specificDetailCodes={specificDetailCodes}
                localSpecificDetails={localSpecificDetails}
                onSelectCode={handleSelectCode}
                selectedCode={selectedSpecificDetailCode?.code}
              />,
              <SpecificDetailForm
                selectedSpecificDetailCode={selectedSpecificDetailCode}
                localSpecificDetail={localSpecificDetail}
                setLocalSpecificDetail={setLocalSpecificDetail}
              />,
            ]}
            isHideBorder={true}
          />
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-1)]">
          {selectedSpecificDetailCode && (
            <>
              {isSelectedEnrolled && (
                <MyButton variant="outline" onClick={handleDelete}>
                  삭제
                </MyButton>
              )}
              <MyButton onClick={handleSaveAndClose}>저장</MyButton>
            </>
          )}
        </div>
      </div>
    </MyPopup>
  );
}
