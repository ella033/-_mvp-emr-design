import MySplitPane from "@/components/yjg/my-split-pane";
import DrugDetail from "./drug-detail";
import { useEffect, useState } from "react";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { PrescriptionType } from "@/constants/master-data-enum";
import { MasterDataContainer } from "../../(common)/common-controls";
import PrescriptionMasterGrid from "../../(common)/(master-data)/(prescription-master)/prescription-master-grid";
import { DRUG_SEARCH_OPTIONS } from "@/constants/library-option/search-option";
import {
  defaultDrugUserCodeHeaders,
  LS_DRUG_HEADERS_MASTER_KEY,
  LS_DRUG_HEADERS_USER_CODE_KEY,
} from "./drug-header";
import { defaultDrugMasterHeaders } from "./drug-header";
import {
  convertDrugMasterToGridRowType,
  convertDrugUserCodeToGridRowType,
} from "@/app/master-data/_components/(tabs)/(drug)/drug-converter";
import PrescriptionUserCodeGrid from "../../(common)/(master-data)/(prescription-user-code)/prescription-user-code-grid";

export default function Drug() {
  const [selectedMasterDataDetail, setSelectedMasterDataDetail] =
    useState<MasterDataDetailType | null>(null);
  const [masterDataDetail, setMasterDataDetail] =
    useState<MasterDataDetailType | null>(null);

  useEffect(() => {
    if (selectedMasterDataDetail) {
      setMasterDataDetail(selectedMasterDataDetail);
    }
  }, [selectedMasterDataDetail]);

  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="library-drug"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[
          <DrugList setSelectedMasterDetail={setSelectedMasterDataDetail} />,
          <DrugDetail
            masterDataDetail={masterDataDetail}
            setMasterDataDetail={setMasterDataDetail}
            originalMasterDataDetail={selectedMasterDataDetail}
          />,
        ]}
      />
    </div>
  );
}

function DrugList({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <MasterDataContainer>
      <MySplitPane
        splitPaneId="library-drug-list"
        initialRatios={[0.5, 0.5]}
        panes={[
          <DrugMaster setSelectedMasterDetail={setSelectedMasterDetail} />,
          <DrugUserCode setSelectedMasterDetail={setSelectedMasterDetail} />,
        ]}
      />
    </MasterDataContainer>
  );
}

function DrugMaster({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <PrescriptionMasterGrid
      type={PrescriptionType.drug}
      subType={null}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={DRUG_SEARCH_OPTIONS}
      headerLocalStorageKey={LS_DRUG_HEADERS_MASTER_KEY}
      defaultHeaders={defaultDrugMasterHeaders}
      convertDataToGridRowType={convertDrugMasterToGridRowType}
    />
  );
}

function DrugUserCode({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <PrescriptionUserCodeGrid
      type={PrescriptionType.drug}
      subType={null}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={DRUG_SEARCH_OPTIONS}
      headerLocalStorageKey={LS_DRUG_HEADERS_USER_CODE_KEY}
      defaultHeaders={defaultDrugUserCodeHeaders}
      convertDataToGridRowType={convertDrugUserCodeToGridRowType}
    />
  );
}
