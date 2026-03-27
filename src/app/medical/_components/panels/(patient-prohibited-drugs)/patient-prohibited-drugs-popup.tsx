import { useCallback, useEffect, useRef, useState } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { useToastHelpers } from "@/components/ui/toast";
import { useReceptionStore } from "@/store/common/reception-store";
import PatientBasicInfo from "../../(patient-info-bar)/patient-basic-info";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";

import {
  defaultPatientProhibitedDrugsHeaders,
  LS_PATIENT_PROHIBITED_DRUGS_HEADERS_KEY,
} from "./patient-prohibited-drugs-header";
import { MyButton } from "@/components/yjg/my-button";
import {
  convertProhibitedDrugsToMyGridType,
  convertLibraryToMyGridType,
  convertToApiProhibitedDrug,
} from "./patient-prohibited-drugs-converter";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";
import { useProhibitedDrugsDeleteUpsertMany } from "@/hooks/prohibited-drugs/use-prohibited-drugs-delete-upsert-many";
import type { ProhibitedDrug } from "@/types/prohibited-drugs-type";
import { PrescriptionType } from "@/constants/master-data-enum";

export default function PatientProhibitedDrugsPopup({
  setOpen,
}: {
  setOpen: (open: boolean) => void;
}) {
  const { warning, success, error } = useToastHelpers();
  const { currentRegistration, updateCurrentRegistration } =
    useReceptionStore();
  const hasWarnedRef = useRef(false);
  const actionRowRef = useRef<HTMLDivElement>(null);
  const [gridHeaders, setGridHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_PATIENT_PROHIBITED_DRUGS_HEADERS_KEY,
      defaultPatientProhibitedDrugsHeaders
    )
  );
  const [data, setData] = useState<MyGridRowType[]>([]);
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);
  const { mutate: deleteUpsertManyProhibitedDrugs } =
    useProhibitedDrugsDeleteUpsertMany();

  useEffect(() => {
    // 컴포넌트가 마운트될 때마다 리셋
    hasWarnedRef.current = false;
  }, []);

  useEffect(() => {
    if (!currentRegistration && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      warning("환자를 선택해주세요.");
      setOpen(false);
    }
  }, [currentRegistration]);

  useEffect(() => {
    if (currentRegistration?.prohibitedDrugs) {
      setData(
        convertProhibitedDrugsToMyGridType(currentRegistration.prohibitedDrugs)
      );
    }
  }, [currentRegistration?.prohibitedDrugs]);

  if (!currentRegistration) {
    return null;
  }

  const handleDataChange = (
    rowKey: string | number,
    columnKey: string,
    value: string | number | boolean,
    _orgData?: any
  ) => {
    setData((prevData) =>
      prevData.map((row) =>
        row.key === rowKey
          ? {
            ...row,
            cells: row.cells.map((cell) =>
              cell.headerKey === columnKey ? { ...cell, value } : cell
            ),
          }
          : row
      )
    );
  };

  const handleSelectedRows = async (selectedRows: MyGridRowType[]) => {
    setSelectedRows(selectedRows);
  };

  const handleAddLibrary = useCallback((library: any) => {
    const newRow = convertLibraryToMyGridType(library, data.length);
    if (!newRow) return;
    setData((prevData) => [...prevData, newRow]);
  }, []);

  const handleSave = () => {
    const apiData = convertToApiProhibitedDrug(data);
    deleteUpsertManyProhibitedDrugs(
      {
        patientId: currentRegistration?.patientId ?? 0,
        data: {
          items: apiData,
        },
      },
      {
        onSuccess: (data: ProhibitedDrug[]) => {
          updateCurrentRegistration({
            prohibitedDrugs: data,
          });
          success("처방금지약품이 저장되었습니다.");
          setOpen(false);
        },
        onError: (err) => {
          error("처방금지약품 저장에 실패했습니다.", err.message);
        },
      }
    );
  };

  const handleDelete = () => {
    setData((prevData) =>
      prevData.filter((row) => !selectedRows.includes(row))
    );
  };

  useEffect(() => {
    saveHeaders(LS_PATIENT_PROHIBITED_DRUGS_HEADERS_KEY, gridHeaders);
  }, [gridHeaders]);

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={() => setOpen(false)}
      title="처방금지약품"
      width="800px"
      height="500px"
      minWidth="800px"
      minHeight="500px"
      closeOnOutsideClick={false}
      localStorageKey="patient-prohibited-drugs-popup"
    >
      <div className="flex flex-col gap-2 p-2 h-full w-full">
        <div className="flex items-center w-full bg-[var(--bg-1)] rounded px-2 py-1">
          <PatientBasicInfo registration={currentRegistration} disableClick />
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="font-bold px-1">등록된 처방</div>
          <MyButton variant="outline" onClick={() => handleDelete()}>
            삭제
          </MyButton>
        </div>
        <div className="flex-1 flex w-full h-full border rounded-sm overflow-hidden">
          <MyGrid
            headers={gridHeaders}
            onHeadersChange={setGridHeaders}
            data={data}
            onDataChange={handleDataChange}
            size="sm"
            isRowSelectByCheckbox={true}
            onSelectedRowsChange={handleSelectedRows}
            actionRowBottom={
              <div
                ref={actionRowRef}
                className="flex flex-row w-full p-[1px] my-[1px] border-y border-[#F0ECFE] bg-[var(--bg-base1)]"
              >
                <PrescriptionLibrarySearch
                  actionRowRef={actionRowRef}
                  onAddLibrary={handleAddLibrary}
                  showLibrary={true}
                  forceShowLibrary={true}
                  prescriptionType={PrescriptionType.drug}
                />
              </div>
            }
          />
        </div>
        <div className="flex gap-2 justify-end">
          <MyButton onClick={handleSave}>저장</MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
