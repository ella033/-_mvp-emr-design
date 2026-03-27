import MySplitPane from "@/components/yjg/my-split-pane";
import {
  PrescriptionSubType,
  PrescriptionType,
} from "@/constants/master-data-enum";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { useEffect, useState } from "react";
import MedicalExamineDetail from "./medical-examine-detail";
import { MasterDataContainer } from "../../(common)/common-controls";
import {
  convertExamineMasterToGridRowType,
  convertExamineUserCodeToGridRowType,
} from "./medical-examine-converter";
import {
  LS_MEDICAL_EXAMINE_HEADERS_MASTER_KEY,
  LS_MEDICAL_EXAMINE_HEADERS_USER_CODE_KEY,
} from "./medical-examine-header";
import {
  defaultMedicalExamineMasterHeaders,
  defaultMedicalExamineUserCodeHeaders,
} from "@/app/master-data/_components/(tabs)/(medical-examine)/medical-examine-header";
import PrescriptionMasterGrid from "../../(common)/(master-data)/(prescription-master)/prescription-master-grid";
import { MEDICAL_EXAMINE_SEARCH_OPTIONS } from "@/constants/library-option/search-option";
import PrescriptionUserCodeGrid from "../../(common)/(master-data)/(prescription-user-code)/prescription-user-code-grid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { ExternalLabService } from "@/services/external-lab-service";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";
import ExternalLabExaminationGrid from "./(external-lab-examination)/external-lab-examination-grid";
import type { ExternalLabExamination } from "./(external-lab-examination)/external-lab-examination-types";
import { convertExternalLabExaminationToMasterDataDetail } from "./(external-lab-examination)/external-lab-examination-to-master-data-converter";
import { PrescriptionLibrariesService } from "@/services/master-data/prescription-libraries-service";
import { convertPrescriptionLibraryToMasterDataDetail } from "@/app/master-data/(etc)/master-data-converter";
import { getInitialMasterDataDetail } from "@/app/master-data/(etc)/master-data-converter";
import { MOCK_SPECIMEN_LIBRARIES } from "@/mocks/examination-label/mock-data";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

export default function MedicalExamine() {
  const [selectedMasterDataDetail, setSelectedMasterDataDetail] =
    useState<MasterDataDetailType | null>(null);
  const [masterDataDetail, setMasterDataDetail] =
    useState<MasterDataDetailType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("master");

  useEffect(() => {
    setMasterDataDetail(selectedMasterDataDetail);
  }, [selectedMasterDataDetail]);

  // 탭 변경 시 선택된 객체 초기화
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 선택된 객체만 null로 초기화하여 상세정보 영역에 "리스트에서 선택하거나 새로 작성 버튼을 클릭하여 입력해주세요" 메시지 표시
    setSelectedMasterDataDetail(null);
  };

  // 외부 수탁기관 정보 설정 헬퍼 함수
  const setExternalLabInfo = (
    masterDataDetail: MasterDataDetailType,
    examination: ExternalLabExamination,
    externalLabHospitalMappingId?: string,
    selectedLab?: ExternalLab | null,
    isSystemExternalLab?: boolean
  ): void => {
    masterDataDetail.externalLabExaminationId = examination.id;
    masterDataDetail.externalLabHospitalMappingId =
      externalLabHospitalMappingId;
    masterDataDetail.externalLabName =
      selectedLab?.name || examination.library.name;
    masterDataDetail.externalLabExaminationCode = examination.examinationCode;
    masterDataDetail.externalLabUbCode = examination.ubCode;
    masterDataDetail.externalLabExaminationName = examination.name;
    if (isSystemExternalLab !== undefined) {
      masterDataDetail.isSystemExternalLab = isSystemExternalLab;
    }
    masterDataDetail.itemType = ItemTypeCode.검사료_위탁검사;
    // 검체 정보: spcCode를 MOCK_SPECIMEN_LIBRARIES와 매칭
    if (examination.spcCode && !masterDataDetail.specimenDetail?.length) {
      const matched = MOCK_SPECIMEN_LIBRARIES.find(
        (item) => item.code === examination.spcCode
      );
      masterDataDetail.specimenDetail = matched
        ? [{ code: matched.code, name: matched.name }]
        : [{ code: examination.spcCode, name: examination.spcName }];
    }
  };

  // 검사 선택 처리 함수
  const handleExaminationSelect = async (
    examination: ExternalLabExamination,
    externalLabHospitalMappingId?: string,
    externalLab?: ExternalLab
  ) => {
    // externalLab이 전달되면 그것을 사용, 없으면 allLabs에서 찾기
    const selectedLab =
      externalLab ||
      allLabs.find(
        (lab) =>
          lab.id === externalLabHospitalMappingId ||
          lab.externalLabHospitalMappingId === externalLabHospitalMappingId
      );
    // examination.prescriptionLibrary?.isSystemExternalLab 우선 사용, 없으면 수탁기관의 isSystemProvided 사용
    const isSystemExternalLab =
      examination.prescriptionLibrary?.isSystemExternalLab ??
      selectedLab?.isSystemProvided ??
      false;

    // 청구코드가 없으면 새로작성 양식 생성
    const hasClaimCode =
      examination.claimCode !== null &&
      examination.claimCode !== undefined &&
      examination.claimCode.trim() !== "" &&
      examination.prescriptionLibrary;

    if (!hasClaimCode) {
      // 새로작성 양식에 기본 데이터 채움
      const initialMasterDataDetail = getInitialMasterDataDetail(
        PrescriptionType.medical,
        PrescriptionSubType.examine,
        0 // 비급여로 판단
      );
      // ExternalLabExamination의 기본 정보로 채움
      const masterDataDetail =
        convertExternalLabExaminationToMasterDataDetail(examination);
      // 새로작성 양식의 기본값과 병합
      const mergedDetail: MasterDataDetailType = {
        ...initialMasterDataDetail,
        krName: masterDataDetail.krName || initialMasterDataDetail.krName,
        enName: masterDataDetail.enName || initialMasterDataDetail.enName,
        codeType: masterDataDetail.codeType || initialMasterDataDetail.codeType,
        paymentMethod:
          masterDataDetail.paymentMethod ||
          initialMasterDataDetail.paymentMethod,
        isNormalPrice:
          masterDataDetail.isNormalPrice ??
          initialMasterDataDetail.isNormalPrice,
      };
      setExternalLabInfo(
        mergedDetail,
        examination,
        externalLabHospitalMappingId,
        selectedLab,
        isSystemExternalLab
      );
      setSelectedMasterDataDetail(mergedDetail);
      return;
    }

    // 청구코드가 있으면 기존 처방 라이브러리 상세 조회
    try {
      const prescriptionLibrary =
        await PrescriptionLibrariesService.getPrescriptionLibraryDetail(
          PrescriptionType.medical,
          examination.prescriptionLibrary!.typePrescriptionLibraryId
        );
      const masterDataDetail = convertPrescriptionLibraryToMasterDataDetail(
        prescriptionLibrary,
        PrescriptionSubType.examine
      );
      if (!masterDataDetail) {
        throw new Error("처방 라이브러리 상세 변환 실패");
      }
      // API에서 받은 prescriptionLibrary의 isSystemExternalLab 우선 사용, 없으면 계산한 값 사용
      const finalIsSystemExternalLab =
        prescriptionLibrary.isSystemExternalLab ?? isSystemExternalLab;
      setExternalLabInfo(
        masterDataDetail,
        examination,
        externalLabHospitalMappingId,
        selectedLab,
        finalIsSystemExternalLab
      );
      setSelectedMasterDataDetail(masterDataDetail);
    } catch (error) {
      console.error("처방 라이브러리 상세 조회 실패:", error);
      // 실패 시 신규 작성 화면으로 전환
      const masterDataDetail =
        convertExternalLabExaminationToMasterDataDetail(examination);
      setExternalLabInfo(
        masterDataDetail,
        examination,
        externalLabHospitalMappingId,
        selectedLab,
        isSystemExternalLab
      );
      setSelectedMasterDataDetail(masterDataDetail);
    }
  };

  // 전체 수탁기관 목록 가져오기 (사용중인 것만)
  const { data: allLabs = [] } = useQuery<ExternalLab[]>({
    queryKey: ["medical-examine-all-labs"],
    queryFn: async () => {
      return await ExternalLabService.getLabs({ isEnabled: "true" });
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // 항상 최신 데이터를 가져오도록 설정
  });

  // 탭으로 표시할 수탁기관 (시스템 제공만)
  const dynamicTabs = allLabs.filter((lab) => lab.isSystemProvided === true);

  // 상세정보에서 선택할 수탁기관 (사용자 등록만)
  const userProvidedLabs = allLabs.filter(
    (lab) => lab.isSystemProvided === false
  );

  // 탭 트리거 생성 함수
  const createTabTriggers = () => {
    const triggers = [];

    // MASTER 탭
    triggers.push(
      <TabsTrigger
        key="master"
        value="master"
        className="text-sm font-medium px-4 py-2 h-10 w-[140px] rounded-none border-0 border-b-2 border-transparent bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 hover:text-primary hover:bg-transparent shadow-none focus-visible:ring-0"
      >
        MASTER 자료
      </TabsTrigger>
    );

    // 동적 탭들
    dynamicTabs.forEach((lab) => {
      triggers.push(
        <TabsTrigger
          key={lab.id}
          value={lab.id}
          className="text-sm font-medium px-4 py-2 h-10 w-[160px] rounded-none border-0 border-b-2 border-transparent bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all duration-200 hover:text-primary hover:bg-transparent shadow-none focus-visible:ring-0"
        >
          {lab.name}
        </TabsTrigger>
      );
    });

    return triggers;
  };

  // 탭 컨텐츠 생성 함수
  const createTabContents = () => {
    const contents = [];

    // MASTER 탭 컨텐츠
    contents.push(
      <TabsContent
        key="master"
        value="master"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <MedicalExamineList
          key="list-master"
          setSelectedMasterDetail={setSelectedMasterDataDetail}
        />
      </TabsContent>
    );

    // 동적 탭 컨텐츠들
    dynamicTabs.forEach((lab) => {
      contents.push(
        <TabsContent
          key={lab.id}
          value={lab.id}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <MedicalExamineList
            key={`list-${lab.id}`}
            setSelectedMasterDetail={setSelectedMasterDataDetail}
            tabId={lab.id}
            externalLabHospitalMappingId={
              lab.externalLabHospitalMappingId || lab.id
            }
            onExaminationSelect={handleExaminationSelect}
            externalLabName={lab.name}
            externalLab={lab}
          />
        </TabsContent>
      );
    });

    return contents;
  };

  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="library-medical-examine-main"
        isVertical={false}
        initialRatios={[0.6, 0.4]}
        panes={[
          <div key="left-pane" className="flex flex-col w-full h-full">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="flex flex-col h-full"
            >
              <div className="w-full border-b border-border">
                <TabsList className="w-fit bg-transparent p-0 gap-0 flex-wrap shrink-0">
                  {createTabTriggers()}
                </TabsList>
              </div>
              {createTabContents()}
            </Tabs>
          </div>,
          <MedicalExamineDetail
            key="detail-pane"
            masterDataDetail={masterDataDetail}
            setMasterDataDetail={setMasterDataDetail}
            originalMasterDataDetail={selectedMasterDataDetail}
            userProvidedLabs={userProvidedLabs}
          />,
        ]}
      />
    </div>
  );
}

function MedicalExamineList({
  setSelectedMasterDetail,
  tabId,
  externalLabHospitalMappingId,
  onExaminationSelect,
  externalLabName,
  externalLab,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
  tabId?: string;
  externalLabHospitalMappingId?: string;
  onExaminationSelect?: (
    examination: ExternalLabExamination,
    externalLabHospitalMappingId?: string,
    externalLab?: ExternalLab
  ) => void;
  externalLabName?: string;
  externalLab?: ExternalLab;
}) {
  // 동적 탭인 경우 왼쪽 위에 검사 목록 그리드 표시, MASTER 탭인 경우 기존 그리드 표시
  const leftTopPane = tabId ? (
    <ExternalLabExaminationGrid
      key={`external-lab-${tabId}`}
      labId={tabId}
      externalLabHospitalMappingId={externalLabHospitalMappingId}
      onExaminationSelect={(examination, mappingId) =>
        onExaminationSelect?.(examination, mappingId, externalLab)
      }
    />
  ) : (
    <MedicalExamineMaster
      key={`master-${tabId || "master"}`}
      setSelectedMasterDetail={setSelectedMasterDetail}
      tabId={tabId}
    />
  );

  return (
    <MasterDataContainer>
      <MySplitPane
        splitPaneId={`library-medical-examine-list-${tabId || "master"}`}
        initialRatios={[0.5, 0.5]}
        panes={[
          leftTopPane,
          <MedicalExamineUserCode
            key={`user-code-${tabId || "master"}`}
            setSelectedMasterDetail={setSelectedMasterDetail}
            tabId={tabId}
            externalLabHospitalMappingId={externalLabHospitalMappingId}
            externalLabName={externalLabName}
            externalLab={externalLab}
          />,
        ]}
      />
    </MasterDataContainer>
  );
}

function MedicalExamineMaster({
  setSelectedMasterDetail,
  tabId,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
  tabId?: string;
}) {
  // TODO: tabId를 사용하여 각 탭별로 다른 데이터를 가져올 수 있음
  // 예: queryKey에 tabId를 포함하여 각 탭별로 다른 쿼리 실행
  return (
    <PrescriptionMasterGrid
      type={PrescriptionType.medical}
      subType={PrescriptionSubType.examine}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={MEDICAL_EXAMINE_SEARCH_OPTIONS}
      headerLocalStorageKey={`${LS_MEDICAL_EXAMINE_HEADERS_MASTER_KEY}-${tabId || "master"}`}
      defaultHeaders={defaultMedicalExamineMasterHeaders}
      convertDataToGridRowType={convertExamineMasterToGridRowType}
    />
  );
}

function MedicalExamineUserCode({
  setSelectedMasterDetail,
  tabId,
  externalLabHospitalMappingId,
  externalLabName,
  externalLab,
}: {
  setSelectedMasterDetail: (masterDetail: MasterDataDetailType | null) => void;
  tabId?: string;
  externalLabHospitalMappingId?: string;
  externalLabName?: string;
  externalLab?: ExternalLab;
}) {
  // TODO: tabId를 사용하여 각 탭별로 다른 데이터를 가져올 수 있음
  // 예: queryKey에 tabId를 포함하여 각 탭별로 다른 쿼리 실행
  // MASTER 탭(tabId가 없을 때)일 경우 excludeSystemExternalLab=true
  const isMasterTab = !tabId;

  return (
    <PrescriptionUserCodeGrid
      type={PrescriptionType.medical}
      subType={PrescriptionSubType.examine}
      setSelectedMasterDataDetail={setSelectedMasterDetail}
      searchOptions={MEDICAL_EXAMINE_SEARCH_OPTIONS}
      headerLocalStorageKey={`${LS_MEDICAL_EXAMINE_HEADERS_USER_CODE_KEY}-${tabId || "master"}`}
      defaultHeaders={defaultMedicalExamineUserCodeHeaders}
      convertDataToGridRowType={convertExamineUserCodeToGridRowType}
      externalLabHospitalMappingId={externalLabHospitalMappingId}
      externalLabName={externalLabName}
      externalLab={externalLab}
      excludeSystemExternalLab={isMasterTab}
    />
  );
}
