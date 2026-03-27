import MySplitPane from "@/components/yjg/my-split-pane";
import {
  PrescriptionSubType,
  PrescriptionType,
} from "@/constants/master-data-enum";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { useEffect, useState } from "react";
import MedicalActionDetail from "./medical-action-detail";
import { MasterDataContainer } from "../../(common)/common-controls";
import {
  convertActionMasterToGridRowType,
  convertActionUserCodeToGridRowType,
} from "./medical-action-converter";
import {
  defaultMedicalActionUserCodeHeaders,
  LS_MEDICAL_ACTION_HEADERS_MASTER_KEY,
  LS_MEDICAL_ACTION_HEADERS_USER_CODE_KEY,
} from "./medical-action-header";
import { defaultMedicalActionMasterHeaders } from "./medical-action-header";
import PrescriptionMasterGrid from "../../(common)/(master-data)/(prescription-master)/prescription-master-grid";
import { MEDICAL_ACTION_SEARCH_OPTIONS } from "@/constants/library-option/search-option";
import PrescriptionUserCodeGrid from "../../(common)/(master-data)/(prescription-user-code)/prescription-user-code-grid";

export default function MedicalAction() {
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
        splitPaneId="library-medical-action"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[
          <MedicalActionList
            setSelectedMasterDetail={setSelectedMasterDataDetail}
          />,
          <MedicalActionDetail
            masterDataDetail={masterDataDetail}
            setMasterDataDetail={setMasterDataDetail}
            originalMasterDataDetail={selectedMasterDataDetail}
          />,
        ]}
      />
    </div>
  );
}

function MedicalActionList({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <MasterDataContainer>
      <MySplitPane
        splitPaneId="library-medical-action-list"
        initialRatios={[0.5, 0.5]}
        panes={[
          <MedicalActionMaster
            setSelectedMasterDetail={setSelectedMasterDetail}
          />,
          <MedicalActionUserCode
            setSelectedMasterDetail={setSelectedMasterDetail}
          />,
        ]}
      />
    </MasterDataContainer>
  );
}

function MedicalActionMaster({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <PrescriptionMasterGrid
      type={PrescriptionType.medical}
      subType={PrescriptionSubType.action}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={MEDICAL_ACTION_SEARCH_OPTIONS}
      headerLocalStorageKey={LS_MEDICAL_ACTION_HEADERS_MASTER_KEY}
      defaultHeaders={defaultMedicalActionMasterHeaders}
      convertDataToGridRowType={convertActionMasterToGridRowType}
    />
  );
}

function MedicalActionUserCode({
  setSelectedMasterDetail,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
}) {
  return (
    <PrescriptionUserCodeGrid
      type={PrescriptionType.medical}
      subType={PrescriptionSubType.action}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={MEDICAL_ACTION_SEARCH_OPTIONS}
      headerLocalStorageKey={LS_MEDICAL_ACTION_HEADERS_USER_CODE_KEY}
      defaultHeaders={defaultMedicalActionUserCodeHeaders}
      convertDataToGridRowType={convertActionUserCodeToGridRowType}
    />
  );
}
