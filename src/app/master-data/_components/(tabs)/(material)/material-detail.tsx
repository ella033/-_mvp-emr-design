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
import PaymentSetting from "../../(common)/(master-data-detail)/payment-setting";;
import { useState } from "react";
import DiseaseLinkMain from "../../(common)/(master-data-detail)/(disease-link)/disease-link-main";
import CodeDateNameSetting from "../../(common)/(master-data-detail)/code-date-name-setting";
import PriceDetailsSetting from "../../(common)/(master-data-detail)/(price-details-setting)/price-details-setting";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import DetailFooter from "../../(common)/(master-data-detail)/detail-footer";
import DetailHeader from "../../(common)/(master-data-detail)/detail-header";
import { PrescriptionType } from "@/constants/master-data-enum";
import SpecificDetailPopup from "@/components/library/specific-detail/specific-detail-popup";
import { SpecificDetailCodeType, type SpecificDetail } from "@/types/chart/specific-detail-code-type";
import { getDiseaseLinkText, getSpecificDetailText } from "@/lib/master-data-utils";
import PrintLocationItemCodeTypeSetting from "../../(common)/(master-data-detail)/print-location-item-code-type-setting";
interface MaterialDetailProps {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType | null) => void;
  originalMasterDataDetail?: MasterDataDetailType | null;
}

export default function MaterialDetail({
  masterDataDetail,
  setMasterDataDetail,
  originalMasterDataDetail,
}: MaterialDetailProps) {
  return (
    <MasterDataDetailContainer>
      <DetailHeader
        type={PrescriptionType.material}
        subType={null}
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <MaterialDetailContent
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <DetailFooter
        masterDataDetail={masterDataDetail}
        originalMasterDataDetail={originalMasterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
    </MasterDataDetailContainer>
  );
}

function MaterialDetailContent({
  masterDataDetail,
  setMasterDataDetail,
}: {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}) {
  const [openDiseaseLink, setOpenDiseaseLink] = useState(false);
  const [openSpecificDetail, setOpenSpecificDetail] = useState(false);
  const {
    value: localManufacturerName,
    onChange: handleManufacturerNameChange,
  } = useDebouncedInput(
    masterDataDetail?.materialMasterData?.manufacturerName || "",
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        materialMasterData: {
          ...masterDataDetail?.materialMasterData,
          manufacturerName: value,
        },
      } as MasterDataDetailType),
    300
  );

  const { value: localImportCompany, onChange: handleImportCompanyChange } =
    useDebouncedInput(
      masterDataDetail?.materialMasterData?.importCompany || "",
      (value: string) =>
        setMasterDataDetail({
          ...masterDataDetail,
          materialMasterData: {
            ...masterDataDetail?.materialMasterData,
            importCompany: value,
          },
        } as MasterDataDetailType),
      300
    );

  const { value: localSpecification, onChange: handleSpecificationChange } =
    useDebouncedInput(
      masterDataDetail?.materialMasterData?.specification || "",
      (value: string) =>
        setMasterDataDetail({
          ...masterDataDetail,
          materialMasterData: {
            ...masterDataDetail?.materialMasterData,
            specification: value,
          },
        } as MasterDataDetailType),
      300
    );

  const { value: localUnit, onChange: handleUnitChange } = useDebouncedInput(
    masterDataDetail?.materialMasterData?.unit || "",
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        materialMasterData: {
          ...masterDataDetail?.materialMasterData,
          unit: value,
        },
      } as MasterDataDetailType),
    300
  );

  const { value: localDose, onChange: handleDoseChange } = useDebouncedInput(
    String(masterDataDetail?.materialMasterData?.dose || 1),
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        materialMasterData: {
          ...masterDataDetail?.materialMasterData,
          dose: Number(value) || 1,
        },
      } as MasterDataDetailType),
    300
  );

  if (!masterDataDetail) return <MasterDataDetailEmpty />;
  const isNonCovered = masterDataDetail.prescriptionLibraryId === 0; // 0이면 비급여로 판단한다.

  return (
    <MasterDataDetailContentContainer>
      <CodeDateNameSetting
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
        isNonCovered={isNonCovered}
      />
      <BoxContainer>
        <Box title="제조사" isWidthFit={true}>
          <MyInput
            type={isNonCovered ? "text" : "readonly"}
            value={localManufacturerName}
            onChange={handleManufacturerNameChange}
          />
        </Box>
        <Box title="수입업소" isWidthFit={true}>
          <MyInput
            type={isNonCovered ? "text" : "readonly"}
            value={localImportCompany}
            onChange={handleImportCompanyChange}
          />
        </Box>
        <Box title="규격/단위" className="min-w-[200px] max-w-[200px]">
          <MyInput
            type={isNonCovered ? "text" : "readonly"}
            value={localSpecification}
            onChange={handleSpecificationChange}
          />
          <div className="flex items-center justify-center text-lg text-gray-600 dark:text-gray-400">
            /
          </div>
          <MyInput
            type={isNonCovered ? "text" : "readonly"}
            value={localUnit}
            onChange={handleUnitChange}
          />
        </Box>
      </BoxContainer>
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
        <Box title="1일투여량" className="min-w-[5rem] max-w-[5rem]">
          <MyInput
            type="text-number"
            className="text-center"
            min={0}
            max={1000000000}
            pointPos={8}
            value={localDose}
            onChange={handleDoseChange}
          />
        </Box>
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
