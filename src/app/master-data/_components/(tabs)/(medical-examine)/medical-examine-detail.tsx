import {
  Box,
  BoxContainer,
  DivideLine,
  InputWithButton,
  MasterDataDetailContainer,
  MasterDataDetailContentContainer,
  MasterDataDetailEmpty,
} from "../../(common)/common-controls";
import PaymentSetting from "../../(common)/(master-data-detail)/payment-setting";
import { MySelect } from "@/components/yjg/my-select";
import { useState } from "react";
import DiseaseLinkMain from "../../(common)/(master-data-detail)/(disease-link)/disease-link-main";
import CodeDateNameSetting from "../../(common)/(master-data-detail)/code-date-name-setting";
import PriceDetailsSetting from "../../(common)/(master-data-detail)/(price-details-setting)/price-details-setting";
import MyCheckbox from "@/components/yjg/my-checkbox";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import DetailFooter from "../../(common)/(master-data-detail)/detail-footer";
import DetailHeader from "../../(common)/(master-data-detail)/detail-header";
import { PrescriptionType } from "@/constants/master-data-enum";
import { PrescriptionSubType } from "@/constants/master-data-enum";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";
import SpecificDetailPopup from "@/components/library/specific-detail/specific-detail-popup";
import { SpecificDetailCodeType, type SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { getDiseaseLinkText, getSpecificDetailText, getSpecimenDetailText } from "@/lib/master-data-utils";
import PrintLocationItemCodeTypeSetting from "../../(common)/(master-data-detail)/print-location-item-code-type-setting";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";
import SpecimenSelectPopup from "./specimen-select-popup";
import SpecimenDetailInputWithButton from "@/components/library/specimen-detail/specimen-detail-input-with-button";

interface MedicalExamineDetailProps {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType | null) => void;
  originalMasterDataDetail?: MasterDataDetailType | null;
  userProvidedLabs?: ExternalLab[];
}

export default function MedicalExamineDetail({
  masterDataDetail,
  setMasterDataDetail,
  originalMasterDataDetail,
  userProvidedLabs = [],
}: MedicalExamineDetailProps) {
  return (
    <MasterDataDetailContainer>
      <DetailHeader
        type={PrescriptionType.medical}
        subType={PrescriptionSubType.examine}
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <MedicalExamineDetailContent
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
        userProvidedLabs={userProvidedLabs}
      />
      <DetailFooter
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
        originalMasterDataDetail={originalMasterDataDetail}
      />
    </MasterDataDetailContainer>
  );
}

function MedicalExamineDetailContent({
  masterDataDetail,
  setMasterDataDetail,
  userProvidedLabs = [],
}: {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
  userProvidedLabs?: ExternalLab[];
}) {
  const [openDiseaseLink, setOpenDiseaseLink] = useState(false);
  const [openSpecificDetail, setOpenSpecificDetail] = useState(false);
  const [openSpecimenDetail, setOpenSpecimenDetail] = useState(false);

  if (!masterDataDetail) return <MasterDataDetailEmpty />;
  const isNonCovered = masterDataDetail.prescriptionLibraryId === 0; // 0이면 비급여로 판단한다.

  // isSystemProvided가 false인 수탁기관만 필터링 (병원별 수탁기관)
  const availableLabs = userProvidedLabs.filter((lab) => !lab.isSystemProvided);

  // 수탁기관 셀렉트 옵션 생성
  // value는 externalLabHospitalMappingId를 우선 사용하고, 없으면 id 사용
  const externalLabOptions = [
    { value: "", label: "수탁검사/위탁진료 없음" },
    ...availableLabs.map((lab) => ({
      value: lab.externalLabHospitalMappingId || lab.id,
      label: lab.name,
    })),
  ];

  // 현재 선택된 수탁기관 ID (없으면 빈 문자열로 설정하여 "수탁검사/위탁진료 없음" 옵션 선택)
  const selectedExternalLabId =
    masterDataDetail.externalLabHospitalMappingId || "";

  return (
    <MasterDataDetailContentContainer>
      <CodeDateNameSetting
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
        isNonCovered={isNonCovered}
      />
      <DivideLine />
      <PaymentSetting
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <DivideLine />
      <BoxContainer>
        <PrintLocationItemCodeTypeSetting
          masterDataDetail={masterDataDetail}
          setMasterDataDetail={setMasterDataDetail}
        />
      </BoxContainer>
      <DivideLine />
      {/* 시스템수탁기관이 아닐 경우 병원별 수탁기관 리스트 표시 */}
      {!isNonCovered &&
        !masterDataDetail.isSystemExternalLab &&
        availableLabs.length > 0 && (
          <>
            <BoxContainer>
              <Box title="수탁기관" isWidthFit={true}>
                <MySelect
                  className="w-fit"
                  options={externalLabOptions}
                  value={selectedExternalLabId}
                  placeholder="수탁검사/위탁진료 없음"
                  onChange={(value) => {
                    const externalLabId = value ? String(value) : undefined;
                    // 수탁기관 선택 시 항목구분 자동 변경
                    const newItemType = externalLabId ? ItemTypeCode.검사료_위탁검사 : ItemTypeCode.검사료_자체검사;
                    setMasterDataDetail({
                      ...masterDataDetail,
                      externalLabHospitalMappingId: externalLabId,
                      isSystemExternalLab: false, // 병원별 수탁기관은 항상 false
                      itemType: newItemType,
                    });
                  }}
                />
              </Box>
            </BoxContainer>
            <DivideLine />
          </>
        )}
      {!isNonCovered && (
        <>
          <BoxContainer>
            <Box title="상병 연결코드" isWidthFit={true}>
              <InputWithButton
                readonly={true}
                value={getDiseaseLinkText(masterDataDetail)}
                onClick={() => setOpenDiseaseLink(true)}
              />
            </Box>
            {openDiseaseLink && (
              <DiseaseLinkMain
                setOpen={setOpenDiseaseLink}
                masterDataDetail={masterDataDetail}
                setMasterDataDetail={setMasterDataDetail}
              />
            )}
            <Box title="특정내역" isWidthFit={true}>
              <InputWithButton
                readonly={true}
                value={getSpecificDetailText(masterDataDetail)}
                onClick={() => setOpenSpecificDetail(true)}
              />
            </Box>
            {openSpecificDetail && (
              <SpecificDetailPopup
                type={SpecificDetailCodeType.Line}
                currentSpecificDetails={masterDataDetail.specificDetail}
                setOpen={setOpenSpecificDetail}
                onChange={(specificDetails: SpecificDetail[]) => {
                  setMasterDataDetail({
                    ...masterDataDetail,
                    specificDetail: specificDetails,
                  });
                }}
              />
            )}
            {masterDataDetail.isSystemExternalLab ? (
              <>
                <Box title="검체" isWidthFit={true}>
                  <InputWithButton
                    readonly={true}
                    value={getSpecimenDetailText(masterDataDetail)}
                    onClick={() => setOpenSpecimenDetail(true)}
                  />
                </Box>
                {openSpecimenDetail && (
                  <SpecimenSelectPopup
                    setOpen={setOpenSpecimenDetail}
                    currentSpecimen={masterDataDetail.specimenDetail[0] ?? null}
                    onSelect={(specimen: SpecimenDetail) => {
                      setMasterDataDetail({
                        ...masterDataDetail,
                        specimenDetail: [specimen],
                      });
                    }}
                  />
                )}
              </>
            ) : (
              <Box title="검체" isWidthFit={true}>
                <SpecimenDetailInputWithButton
                  specimenDetailsJson={JSON.stringify(masterDataDetail.specimenDetail)}
                  onChange={(value: string) => {
                    setMasterDataDetail({
                      ...masterDataDetail,
                      specimenDetail: JSON.parse(value),
                    });
                  }}
                />
              </Box>
            )}
          </BoxContainer>
          <DivideLine />
        </>
      )}
      <PriceDetailsSetting
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <DivideLine />
      <BoxContainer>
        <MyCheckbox
          label="구두처방 가능"
          checked={masterDataDetail?.isVerbal}
          onChange={(checked) =>
            setMasterDataDetail({
              ...masterDataDetail,
              isVerbal: checked,
            })
          }
        />
      </BoxContainer>
    </MasterDataDetailContentContainer>
  );
}
