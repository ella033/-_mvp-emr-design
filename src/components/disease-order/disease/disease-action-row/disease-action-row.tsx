import { useRef } from "react";
import { DiseaseLibrariesType } from "@/types/master-data/disease-libraries/disease-libraries-response-type";
import {
  MyTreeGridHeaderType,
  type MyTreeGridRowType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getHeaderDefaultWidth,
  getStickyStyle,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { cn } from "@/lib/utils";
import DiseaseActionExternalCauseCode from "./disease-action-external-cause-code";
import ActionRowCheckBox from "../../common-action-row/action-row-check-box";
import { DEPARTMENT_OPTIONS } from "@/constants/department";
import ActionRowSelect from "../../common-action-row/action-row-select";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";

interface DiseaseActionRowProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  headers: MyTreeGridHeaderType[];
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
  onAddLibrary: (disease: DiseaseLibrariesType) => void;
}

export default function DiseaseActionRow({
  size,
  headers,
  selectedRows,
  onSelectedRowsDataChange,
  onAddLibrary,
}: DiseaseActionRowProps) {
  const actionRowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={actionRowRef}
      className="flex flex-row w-full border-y border-[#F0ECFE] bg-[var(--bg-base1)]"
    >
      {headers
        .filter((header) => header.visible)
        .map((header) => {
          const stickyStyle = getStickyStyle(headers, header);
          return (
            <DiagnosisActionRowCell
              size={size}
              key={header.key}
              actionRowRef={actionRowRef}
              header={header}
              selectedRows={selectedRows}
              onSelectedRowsDataChange={onSelectedRowsDataChange}
              stickyStyle={stickyStyle}
              onAddLibrary={onAddLibrary}
            />
          );
        })}
    </div>
  );
}

function DiagnosisActionRowCell({
  size,
  actionRowRef,
  header,
  selectedRows,
  onSelectedRowsDataChange,
  stickyStyle,
  onAddLibrary,
}: {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  actionRowRef: React.RefObject<HTMLDivElement | null>;
  header: MyTreeGridHeaderType;
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
  stickyStyle: React.CSSProperties;
  onAddLibrary: (disease: DiseaseLibrariesType) => void;
}) {
  const cell = (key: string) => {
    switch (key) {
      case "name":
        return (
          <PrescriptionLibrarySearch
            actionRowRef={actionRowRef}
            onAddLibrary={onAddLibrary}
            inputTestId="medical-diagnosis-search-input"
            placeholder="상병 검색"
            showDisease={true}
            size={size}
            hideMagnifyingGlass={true}
          />
        );
      case "isSuspected":
      case "isLeftSide":
      case "isRightSide":
        return (
          <ActionRowCheckBox
            headerKey={header.key}
            selectedRows={selectedRows}
            onSelectedRowsDataChange={onSelectedRowsDataChange}
          />
        );
      case "department":
        return (
          <ActionRowSelect
            options={DEPARTMENT_OPTIONS}
            headerKey={header.key}
            selectedRows={selectedRows}
            onSelectedRowsDataChange={onSelectedRowsDataChange}
          />
        );
      case "externalCauseCode":
        return (
          <DiseaseActionExternalCauseCode
            headerKey={header.key}
            selectedRows={selectedRows}
            onSelectedRowsDataChange={onSelectedRowsDataChange}
          />
        );
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center bg-[var(--bg-base1)] overflow-hidden p-[1px] my-[1px]"
      )}
      style={{
        width: `${header.width ?? getHeaderDefaultWidth(header.name)}px`,
        minWidth: `${header.width ?? getHeaderDefaultWidth(header.name)}px`,
        ...stickyStyle,
      }}
    >
      {cell(header.key)}
    </div>
  );
}
