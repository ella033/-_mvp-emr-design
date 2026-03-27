import {
  defaultInjectionLinkRegisteredHeaders,
  LS_INJECTION_LINK_HEADERS_REGISTERED_KEY,
} from "./injection-link-header";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import type { InjectionLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import { convertRegisteredInjectionLinkToGridRowType } from "./injection-link-converter";

interface InjectionLinkRegisteredGridProps {
  localInjectionLink: InjectionLinkType[];
  setLocalInjectionLink: (injectionLink: InjectionLinkType[]) => void;
}

export interface InjectionLinkRegisteredGridRef {
  handleDelete: () => void;
}

const InjectionLinkRegisteredGrid = forwardRef<
  InjectionLinkRegisteredGridRef,
  InjectionLinkRegisteredGridProps
>(function InjectionLinkRegisteredGrid({
  localInjectionLink,
  setLocalInjectionLink,
}, ref) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_INJECTION_LINK_HEADERS_REGISTERED_KEY,
      defaultInjectionLinkRegisteredHeaders
    )
  );
  const [data, setData] = useState<MyGridRowType[]>([]);
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);

  useEffect(() => {
    setData(convertRegisteredInjectionLinkToGridRowType(localInjectionLink));
  }, [localInjectionLink]);

  const handleSelectedRows = async (selectedRows: MyGridRowType[]) => {
    setSelectedRows(selectedRows);
  };

  const handleDelete = () => {
    const idsToRemove = selectedRows.map((row) => row.key);
    setLocalInjectionLink(
      localInjectionLink.filter((s) => !idsToRemove.includes(s.id))
    );
    setSelectedRows([]);
  };

  useImperativeHandle(ref, () => ({ handleDelete }), [
    selectedRows,
    localInjectionLink,
  ]);

  useEffect(() => {
    saveHeaders(LS_INJECTION_LINK_HEADERS_REGISTERED_KEY, headers);
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

export default InjectionLinkRegisteredGrid;
