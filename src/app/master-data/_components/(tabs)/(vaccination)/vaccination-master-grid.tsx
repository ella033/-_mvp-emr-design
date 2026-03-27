import { useEffect, useRef, useState } from "react";
import { GridContainer } from "../../(common)/common-controls";
import MySearchInput from "@/components/yjg/my-search-input";
import MyGrid, { type MyGridRef } from "@/components/yjg/my-grid/my-grid";
import { MyGridSettingButton } from "@/components/yjg/my-grid/my-grid-setting-button";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import { useVaccinationLibraries } from "@/hooks/master-data/use-vaccination-libraries";
import { MyButton } from "@/components/yjg/my-button";
import { ChevronsUpIcon, ChevronsDownIcon } from "lucide-react";
import {
  defaultVaccinationMasterHeaders,
  LS_VACCINATION_HEADERS_MASTER_KEY,
} from "./vaccination-header";
import { convertVaccinationLibrariesToGridRowType } from "./vaccination-converter";

export default function VaccinationMasterGrid() {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_VACCINATION_HEADERS_MASTER_KEY,
      defaultVaccinationMasterHeaders
    )
  );
  const [gridData, setGridData] = useState<MyGridRowType[]>([]);
  const [searchWord, setSearchWord] = useState("");
  const { data, isLoading } = useVaccinationLibraries(searchWord);

  useEffect(() => {
    if (data) {
      setGridData(convertVaccinationLibrariesToGridRowType(data));
    }
  }, [data]);

  const handleSearch = (value: string) => {
    setSearchWord(value);
  };

  const handleClearSearch = () => {
    setSearchWord("");
  };

  const gridRef = useRef<MyGridRef>(null);

  const handleScrollToTop = () => {
    gridRef.current?.scrollToTop();
  };
  const handleScrollToBottom = () => {
    gridRef.current?.scrollToBottom();
  };

  useEffect(() => {
    saveHeaders(LS_VACCINATION_HEADERS_MASTER_KEY, headers);
  }, [headers]);

  return (
    <GridContainer>
      <div className="flex flex-row w-full items-center gap-2 my-scroll">
        <div className="text-base font-semibold whitespace-nowrap px-3">
          MASTER 자료
        </div>
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
        />
        <div className="flex flex-row items-center ps-2">
          {isLoading ? (
            <MyLoadingSpinner size="sm" />
          ) : (
            <div className="text-sm whitespace-nowrap">{gridData.length}</div>
          )}
        </div>
        <div className="flex flex-row items-center">
          <MyButton onClick={handleScrollToTop} variant="ghost">
            <ChevronsUpIcon className="w-4 h-4" />
          </MyButton>
          <MyButton onClick={handleScrollToBottom} variant="ghost">
            <ChevronsDownIcon className="w-4 h-4" />
          </MyButton>
          <MyGridSettingButton
            defaultHeaders={defaultVaccinationMasterHeaders}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          ref={gridRef}
          headers={headers}
          data={gridData}
          onHeadersChange={setHeaders}
          multiSelect={false}
          isLoading={isLoading}
        />
      </div>
    </GridContainer>
  );
}
