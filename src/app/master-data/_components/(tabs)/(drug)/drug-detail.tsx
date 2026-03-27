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
import MyRadio from "@/components/yjg/my-radio";
import { InOut, PrescriptionType } from "@/constants/master-data-enum";
import MyBox from "@/components/yjg/my-box";
import { POINT_OPTIONS } from "@/constants/decimal-point-option";
import { MySelect } from "@/components/yjg/my-select";
import { useState, useMemo, memo } from "react";
import DiseaseLinkMain from "../../(common)/(master-data-detail)/(disease-link)/disease-link-main";
import CodeDateNameSetting from "../../(common)/(master-data-detail)/code-date-name-setting";
import PriceDetailsSetting from "../../(common)/(master-data-detail)/(price-details-setting)/price-details-setting";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import DoseConditionSetting from "./(dose-condition-setting)/dose-condition-setting";
import InjectionLinkMain from "./(injection-link)/injection-link-main";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import DetailFooter from "../../(common)/(master-data-detail)/detail-footer";
import DetailHeader from "../../(common)/(master-data-detail)/detail-header";
import { ADMINISTRATION_ROUTE_OPTIONS } from "@/constants/library-option/administration-route-option";
import { useDrugSeparationExceptionCodes } from "@/hooks/drug-separation-exception-code/use-drug-separation-exception-code";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import DrugSeparationExceptionCodePopup from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-popup";
import SpecificDetailPopup from "@/components/library/specific-detail/specific-detail-popup";
import { SpecificDetailCodeType, type SpecificDetail } from "@/types/chart/specific-detail-code-type";
import { getInjectionLinkText, getDiseaseLinkText, getSpecificDetailText } from "@/lib/master-data-utils";
import { cn } from "@/lib/utils";
import UsageInput from "@/components/library/usage/usage-input";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
} from "@/components/yjg/common/constant/class-constants";
import PrintLocationItemCodeTypeSetting from "../../(common)/(master-data-detail)/print-location-item-code-type-setting";

interface DrugDetailProps {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType | null) => void;
  originalMasterDataDetail?: MasterDataDetailType | null;
}

export default function DrugDetail({
  masterDataDetail,
  setMasterDataDetail,
  originalMasterDataDetail,
}: DrugDetailProps) {
  return (
    <MasterDataDetailContainer>
      <DetailHeader
        type={PrescriptionType.drug}
        subType={null}
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
      />
      <DrugDetailContent
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

const DrugDetailContent = memo(function DrugDetailContent({
  masterDataDetail,
  setMasterDataDetail,
}: {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}) {
  const [openExceptionCode, setOpenExceptionCode] = useState(false);
  const [openDiseaseLink, setOpenDiseaseLink] = useState(false);
  const [openSpecificDetail, setOpenSpecificDetail] = useState(false);
  const [openAgeWeightDose, setOpenAgeWeightDose] = useState(false);
  const [openInjectionLink, setOpenInjectionLink] = useState(false);
  const { data: exceptionCodes } = useDrugSeparationExceptionCodes(
    DrugSeparationExceptionCodeType.Drug
  );

  const exceptionCodeTooltipText = useMemo(() => {
    return (
      exceptionCodes?.find(
        (code) => code.code === masterDataDetail?.drugMasterData?.exceptionCode
      )?.title || masterDataDetail?.drugMasterData?.exceptionCode
    );
  }, [masterDataDetail?.drugMasterData?.exceptionCode]);
  const {
    value: localManufacturerName,
    onChange: handleManufacturerNameChange,
  } = useDebouncedInput(
    masterDataDetail?.drugMasterData?.manufacturerName || "",
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        drugMasterData: {
          ...masterDataDetail?.drugMasterData,
          manufacturerName: value,
        },
      } as MasterDataDetailType),
    300
  );

  const { value: localSpecification, onChange: handleSpecificationChange } =
    useDebouncedInput(
      masterDataDetail?.drugMasterData?.specification || "",
      (value: string) =>
        setMasterDataDetail({
          ...masterDataDetail,
          drugMasterData: {
            ...masterDataDetail?.drugMasterData,
            specification: value,
          },
        } as MasterDataDetailType),
      300
    );

  const { value: localUnit, onChange: handleUnitChange } = useDebouncedInput(
    masterDataDetail?.drugMasterData?.unit || "",
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        drugMasterData: { ...masterDataDetail?.drugMasterData, unit: value },
      } as MasterDataDetailType),
    300
  );

  const { value: localDose, onChange: handleDoseChange } = useDebouncedInput(
    String(masterDataDetail?.drugMasterData?.dose || 1),
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        drugMasterData: {
          ...masterDataDetail?.drugMasterData,
          dose: value ? Number(value) : 1,
        },
      } as MasterDataDetailType),
    300
  );

  const { value: localTimes, onChange: handleTimesChange } = useDebouncedInput(
    String(masterDataDetail?.drugMasterData?.times || 1),
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        drugMasterData: {
          ...masterDataDetail?.drugMasterData,
          times: value ? Number(value) : 1,
        },
      } as MasterDataDetailType),
    300
  );

  const { value: localDays, onChange: handleDaysChange } = useDebouncedInput(
    String(masterDataDetail?.drugMasterData?.days || 1),
    (value: string) =>
      setMasterDataDetail({
        ...masterDataDetail,
        drugMasterData: {
          ...masterDataDetail?.drugMasterData,
          days: value ? Number(value) : 1,
        },
      } as MasterDataDetailType),
    300
  );

  if (!masterDataDetail) return <MasterDataDetailEmpty />;
  const isNonCovered = masterDataDetail.prescriptionLibraryId === 0; // 0이면 비급여로 판단한다.

  if (masterDataDetail.drugMasterData === undefined) return null;
  const drugMasterData = masterDataDetail.drugMasterData;

  const getConditionText = () => {
    const conditions = masterDataDetail.drugMasterData?.doseCondition;
    if (!conditions) return "";

    const weightConditions = conditions
      .filter((condition) => condition.type === 1)
      .flatMap((condition) => condition.doseRanges);

    const ageConditions = conditions
      .filter((condition) => condition.type === 2)
      .flatMap((condition) => condition.doseRanges);

    if (ageConditions.length === 0 && weightConditions.length === 0) return "";
    if (ageConditions.length === 0)
      return `체중별 ${weightConditions.length}건`;
    if (weightConditions.length === 0)
      return `연령별 ${ageConditions.length}건`;
    return `연령별 ${ageConditions.length}건, 체중별 ${weightConditions.length}건`;
  };

  return (
    <MasterDataDetailContentContainer>
      <CodeDateNameSetting
        masterDataDetail={masterDataDetail}
        setMasterDataDetail={setMasterDataDetail}
        isNonCovered={isNonCovered}
      />
      <BoxContainer>
        <Box title="제약사" isWidthFit={true}>
          <MyInput
            type={isNonCovered ? "text" : "readonly"}
            value={localManufacturerName}
            onChange={handleManufacturerNameChange}
          />
        </Box>
        <Box title="규격/단위" isWidthFit={true}>
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
        {!isNonCovered && (
          <>
            <Box title="주성분코드" isWidthFit={true}>
              <MyInput
                type="readonly"
                value={drugMasterData.activeIngredientCode}
              />
            </Box>

            <Box title="분류번호" isWidthFit={true}>
              <MyInput
                type="readonly"
                value={drugMasterData.classificationNo}
              />
            </Box>
          </>
        )}
        <Box title="투여경로" className="min-w-[60px] max-w-[60px]">
          {isNonCovered ? (
            <MySelect
              className="w-[60px]"
              options={ADMINISTRATION_ROUTE_OPTIONS}
              value={drugMasterData.administrationRoute}
              onChange={(value) =>
                setMasterDataDetail({
                  ...masterDataDetail,
                  drugMasterData: {
                    ...masterDataDetail.drugMasterData!,
                    administrationRoute: String(value),
                  },
                })
              }
            />
          ) : (
            <MyInput
              type="readonly"
              value={drugMasterData.administrationRoute}
            />
          )}
        </Box>
        {!isNonCovered && (
          <Box title="전문/일반" isWidthFit={true}>
            <MyInput
              type="readonly"
              value={drugMasterData.specializationType}
            />
          </Box>
        )}
      </BoxContainer>
      <DivideLine />
      <BoxContainer>
        <PaymentSetting
          masterDataDetail={masterDataDetail}
          setMasterDataDetail={setMasterDataDetail}
        />
      </BoxContainer>
      <DivideLine />
      <BoxContainer>
        <PrintLocationItemCodeTypeSetting
          masterDataDetail={masterDataDetail}
          setMasterDataDetail={setMasterDataDetail}
        />
        <Box title="원내/외 구분" isWidthFit={true}>
          <MyBox>
            <MyRadio
              label="원외"
              name="in-out"
              value="1"
              checked={drugMasterData.inOutType === InOut.Out}
              onChange={() => {
                setMasterDataDetail({
                  ...masterDataDetail,
                  drugMasterData: {
                    ...masterDataDetail.drugMasterData!,
                    inOutType: InOut.Out,
                  },
                });
              }}
            ></MyRadio>
            <MyRadio
              label="원내"
              name="in-out"
              value="2"
              checked={drugMasterData.inOutType === InOut.In}
              onChange={() => {
                setMasterDataDetail({
                  ...masterDataDetail,
                  drugMasterData: {
                    ...masterDataDetail.drugMasterData!,
                    inOutType: InOut.In,
                  },
                });
              }}
            ></MyRadio>
          </MyBox>
        </Box>
        {!isNonCovered && (
          <>
            <Box title="예외코드" isWidthFit={true}>
              <InputWithButton
                value={drugMasterData.exceptionCode}
                readonly={true}
                onChange={(value: string) =>
                  setMasterDataDetail({
                    ...masterDataDetail,
                    drugMasterData: {
                      ...masterDataDetail.drugMasterData!,
                      exceptionCode: value,
                    },
                  })
                }
                onClick={() => setOpenExceptionCode(true)}
                tooltipText={exceptionCodeTooltipText}
              />
            </Box>
            {openExceptionCode && (
              <DrugSeparationExceptionCodePopup
                type={DrugSeparationExceptionCodeType.Drug}
                setOpen={setOpenExceptionCode}
                currentExceptionCode={drugMasterData.exceptionCode}
                setExceptionCode={(value: string) => {
                  setMasterDataDetail({
                    ...masterDataDetail,
                    drugMasterData: {
                      ...masterDataDetail.drugMasterData!,
                      exceptionCode: value,
                    },
                  });
                }}
              />
            )}
          </>
        )}
      </BoxContainer>
      <DivideLine />
      <BoxContainer>
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
        <Box title="일투여횟수" className="min-w-[5rem] max-w-[5rem]">
          <MyInput
            type="text-number"
            className="text-center"
            min={0}
            max={999}
            pointPos={0}
            value={localTimes}
            onChange={handleTimesChange}
          />
        </Box>
        <Box title="투여일수" className="min-w-[5rem] max-w-[5rem]">
          <MyInput
            type="text-number"
            className="text-center"
            min={0}
            pointPos={0}
            value={localDays}
            onChange={handleDaysChange}
          />
        </Box>
        <Box title="투여량 소수점자리" className="min-w-[120px] max-w-[120px]">
          <MySelect
            className="w-[120px]"
            options={POINT_OPTIONS}
            value={drugMasterData.decimalPoint}
            onChange={(value: string | number) =>
              setMasterDataDetail({
                ...masterDataDetail,
                drugMasterData: {
                  ...masterDataDetail.drugMasterData!,
                  decimalPoint: Number(value) || 0,
                },
              })
            }
          />
        </Box>
        <Box title="용법">
          <div
            className={cn(
              INPUT_COMMON_CLASS,
              INPUT_FOCUS_CLASS,
              "w-full flex items-stretch rounded-sm overflow-hidden p-[1px]"
            )}
          >
            <div className="flex-1 min-w-0 flex">
              <UsageInput
                size="sm"
                itemType={masterDataDetail.itemType}
                currentUsage={drugMasterData.usage ?? ""}
                onChange={(usageCode, usageText) => {
                  setMasterDataDetail({
                    ...masterDataDetail,
                    drugMasterData: {
                      ...masterDataDetail.drugMasterData!,
                      usage: usageCode ? usageCode.code : usageText,
                    },
                  });
                  if (usageCode && usageCode.times > 0) {
                    handleTimesChange(String(usageCode.times));
                  }
                }}
                readonly={false}
              />
            </div>
          </div>
        </Box>
      </BoxContainer>
      <DivideLine />
      {
        !isNonCovered && (
          <>
            <BoxContainer>
              <Box title="연령/체중별 설정" isWidthFit={true}>
                <InputWithButton
                  readonly={true}
                  value={getConditionText()}
                  onClick={() => setOpenAgeWeightDose(true)}
                />
              </Box>
              {openAgeWeightDose && (
                <DoseConditionSetting
                  setOpen={setOpenAgeWeightDose}
                  masterDataDetail={masterDataDetail}
                  setMasterDataDetail={setMasterDataDetail}
                />
              )}
              <Box title="주사 연결코드" isWidthFit={true}>
                <InputWithButton
                  readonly={true}
                  value={getInjectionLinkText(masterDataDetail)}
                  onClick={() => setOpenInjectionLink(true)}
                />
              </Box>
              {openInjectionLink && (
                <InjectionLinkMain
                  masterDataDetail={masterDataDetail}
                  setMasterDataDetail={setMasterDataDetail}
                  setOpen={setOpenInjectionLink}
                />
              )}
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
        isDrug={true}
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
});
