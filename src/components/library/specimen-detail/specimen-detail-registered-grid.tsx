import { convertSpecimenDetailToGridRowType } from "./specimen-detail-converter";
import {
  defaultSpecimenDetailRegisteredHeaders,
  LS_SPECIMEN_DETAIL_HEADERS_REGISTERED_KEY,
} from "./specimen-detail-header";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";

export interface SpecimenDetailRegisteredGridRef {
  handleDelete: () => void;
}

interface SpecimenDetailRegisteredGridProps {
  localSpecimen: SpecimenDetail[];
  setLocalSpecimen: (specimen: SpecimenDetail[]) => void;
}

const SpecimenDetailRegisteredGrid = forwardRef<
  SpecimenDetailRegisteredGridRef,
  SpecimenDetailRegisteredGridProps
>(function SpecimenDetailRegisteredGrid(
  { localSpecimen, setLocalSpecimen },
  ref
) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_SPECIMEN_DETAIL_HEADERS_REGISTERED_KEY,
      defaultSpecimenDetailRegisteredHeaders
    )
  );
  const [data, setData] = useState<MyGridRowType[]>([]);
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);

  useEffect(() => {
    setData(convertSpecimenDetailToGridRowType(localSpecimen));
  }, [localSpecimen]);

  const handleSelectedRows = async (selectedRows: MyGridRowType[]) => {
    setSelectedRows(selectedRows);
  };

  const handleDelete = () => {
    const idsToRemove = selectedRows.map((row) => row.key);
    setLocalSpecimen(
      localSpecimen.filter((s) => !idsToRemove.includes(s.id))
    );
    setSelectedRows([]);
  };

  useImperativeHandle(ref, () => ({ handleDelete }), [
    selectedRows,
    localSpecimen,
  ]);

  useEffect(() => {
    saveHeaders(LS_SPECIMEN_DETAIL_HEADERS_REGISTERED_KEY, headers);
  }, [headers]);

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full p-2 gap-2">
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          headers={headers}
          onHeadersChange={setHeaders}
          data={data}
          isRowSelectByCheckbox={true}
          onSelectedRowsChange={handleSelectedRows}
          portalTarget={containerRef.current} // 컨테이너를 포털 타겟으로 지정
        />
      </div>
    </div>
  );
});

export default SpecimenDetailRegisteredGrid;
