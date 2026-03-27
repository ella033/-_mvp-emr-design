import MySplitPane from "@/components/yjg/my-split-pane";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { PrescriptionType } from "@/constants/master-data-enum";
import { useEffect, useState } from "react";
import MaterialDetail from "./material-detail";
import { MasterDataContainer } from "../../(common)/common-controls";
import {
  convertMaterialMasterToGridRowType,
  convertMaterialUserCodeToGridRowType,
} from "./material-converter";
import { MATERIAL_SEARCH_OPTIONS } from "@/constants/library-option/search-option";
import {
  defaultMaterialUserCodeHeaders,
  LS_MATERIAL_HEADERS_USER_CODE_KEY,
  LS_MATERIAL_HEADERS_MASTER_KEY,
} from "./material-header";
import { defaultMaterialMasterHeaders } from "./material-header";
import PrescriptionMasterGrid from "../../(common)/(master-data)/(prescription-master)/prescription-master-grid";
import PrescriptionUserCodeGrid from "../../(common)/(master-data)/(prescription-user-code)/prescription-user-code-grid";

export default function Material() {
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
        splitPaneId="library-material"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[
          <MaterialList
            setSelectedMasterDetail={setSelectedMasterDataDetail}
          />,
          <MaterialDetail
            masterDataDetail={masterDataDetail}
            setMasterDataDetail={setMasterDataDetail}
            originalMasterDataDetail={selectedMasterDataDetail}
          />,
        ]}
      />
    </div>
  );
}

function MaterialList({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <MasterDataContainer>
      <MySplitPane
        splitPaneId="library-material-list"
        initialRatios={[0.5, 0.5]}
        panes={[
          <MaterialMaster setSelectedMasterDetail={setSelectedMasterDetail} />,
          <MaterialUserCode
            setSelectedMasterDetail={setSelectedMasterDetail}
          />,
        ]}
      />
    </MasterDataContainer>
  );
}

function MaterialMaster({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <PrescriptionMasterGrid
      type={PrescriptionType.material}
      subType={null}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={MATERIAL_SEARCH_OPTIONS}
      headerLocalStorageKey={LS_MATERIAL_HEADERS_MASTER_KEY}
      defaultHeaders={defaultMaterialMasterHeaders}
      convertDataToGridRowType={convertMaterialMasterToGridRowType}
    />
  );
}

function MaterialUserCode({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <PrescriptionUserCodeGrid
      type={PrescriptionType.material}
      subType={null}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={MATERIAL_SEARCH_OPTIONS}
      headerLocalStorageKey={LS_MATERIAL_HEADERS_USER_CODE_KEY}
      defaultHeaders={defaultMaterialUserCodeHeaders}
      convertDataToGridRowType={convertMaterialUserCodeToGridRowType}
    />
  );
}
