import {
  Box,
  BoxContainer,
  DivideLine,
  InputWithButton,
  MasterDataDetailContainer,
  MasterDataDetailContentContainer,
  MasterDataDetailEmpty,
} from "../../(common)/common-controls";
import MyInput from "@/components/yjg/my-input";
import PaymentSetting from "../../(common)/(master-data-detail)/payment-setting";
import { MySelect } from "@/components/yjg/my-select";
import { useState } from "react";
import DiseaseLinkMain from "../../(common)/(master-data-detail)/(disease-link)/disease-link-main";
import CodeDateNameSetting from "../../(common)/(master-data-detail)/code-date-name-setting";
import PriceDetailsSetting from "../../(common)/(master-data-detail)/(price-details-setting)/price-details-setting";
import MyCheckbox from "@/components/yjg/my-checkbox";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { CONSIGNMENT_AGENCY_OPTIONS } from "@/constants/library-option/consignment-agency-option";
import DetailFooter from "../../(common)/(master-data-detail)/detail-footer";
import DetailHeader from "../../(common)/(master-data-detail)/detail-header";
import { PrescriptionType } from "@/constants/master-data-enum";
import { PrescriptionSubType } from "@/constants/master-data-enum";
import SpecificDetailPopup from "@/components/library/specific-detail/specific-detail-popup";
import { SpecificDetailCodeType, type SpecificDetail } from "@/types/chart/specific-detail-code-type";
import { getDiseaseLinkText, getSpecificDetailText } from "@/lib/master-data-utils";
import PrintLocationItemCodeTypeSetting from "../../(common)/(master-data-detail)/print-location-item-code-type-setting";

interface MedicalActionDetailProps {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType | null) => void;
  originalMasterDataDetail?: MasterDataDetailType | null;
}

export default function MedicalActionDetail({
  masterDataDetail,
  setMasterDataDetail,
  originalMasterDataDetail,
}: MedicalActionDetailProps) {
  return (
    <MasterDataDetailContainer>
      <DetailHeader
        type={PrescriptionType.medical}
        subType={PrescriptionSubType.action}
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <MedicalActionDetailContent
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <DetailFooter
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
        originalMasterDataDetail={originalMasterDataDetail}
      />
    </MasterDataDetailContainer>
  );
}

function MedicalActionDetailContent({
  masterDataDetail,
  setMasterDataDetail,
}: {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}) {
  const [openDiseaseLink, setOpenDiseaseLink] = useState(false);
  const [openSpecificDetail, setOpenSpecificDetail] = useState(false);

  if (!masterDataDetail) return <MasterDataDetailEmpty />;
  const isNonCovered = masterDataDetail.prescriptionLibraryId === 0; // 0이면 비급여로 판단한다.

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
      {
        !isNonCovered && (
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
            </BoxContainer>
            <DivideLine />
          </>
        )
      }
      <PriceDetailsSetting
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <DivideLine />
      {
        !isNonCovered && (
          <>
            <BoxContainer>
              <Box title="위탁기관" isWidthFit={true}>
                <MySelect
                  className="w-fit"
                  options={CONSIGNMENT_AGENCY_OPTIONS}
                  value={masterDataDetail.medicalMasterData?.consignmentAgency}
                  onChange={(value) =>
                    setMasterDataDetail({
                      ...masterDataDetail,
                      medicalMasterData: {
                        ...masterDataDetail.medicalMasterData!,
                        consignmentAgency: Number(value),
                      },
                    })
                  }
                />
              </Box>
              <Box title="위탁기관번호" isWidthFit={true}>
                <MyInput type="text" />
              </Box>
            </BoxContainer>
            <DivideLine />
          </>
        )
      }
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
