import { Box, BoxContainer } from "../common-controls";
import MyInput from "@/components/yjg/my-input";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { formatDate } from "@/lib/date-utils";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { memo } from "react";

interface CodeDateNameSettingProps {
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
  isNonCovered: boolean;
}

const CodeDateNameSetting = memo(function CodeDateNameSetting({
  masterDataDetail,
  setMasterDataDetail,
  isNonCovered,
}: CodeDateNameSettingProps) {
  const { value: localCode, onChange: handleCodeChange } = useDebouncedInput(
    masterDataDetail.userCode || "",
    (value: string) =>
      setMasterDataDetail({ ...masterDataDetail, userCode: value }),
    300
  );

  const { value: localApplyDate, onChange: handleApplyDateChange } =
    useDebouncedInput(
      formatDate(masterDataDetail.applyDate || new Date(), "-"),
      (value: string) =>
        setMasterDataDetail({ ...masterDataDetail, applyDate: value }),
      300
    );

  const { value: localEndDate, onChange: handleEndDateChange } =
    useDebouncedInput(
      masterDataDetail.endDate || "",
      (value: string) =>
        setMasterDataDetail({ ...masterDataDetail, endDate: value }),
      300
    );

  const { value: localKrName, onChange: handleKrNameChange } =
    useDebouncedInput(
      masterDataDetail.krName || "",
      (value: string) =>
        setMasterDataDetail({ ...masterDataDetail, krName: value }),
      300
    );

  const { value: localEnName, onChange: handleEnNameChange } =
    useDebouncedInput(
      masterDataDetail.enName || "",
      (value: string) =>
        setMasterDataDetail({ ...masterDataDetail, enName: value }),
      300
    );

  return (
    <>
      <BoxContainer>
        <BoxContainer isWidthFit={true}>
          <Box title="사용자코드" className="min-w-[10rem]" isRequired={true}>
            <MyInput
              type="text"
              value={localCode}
              onChange={handleCodeChange}
            />
          </Box>
          {!isNonCovered && (
            <Box title="청구코드" isWidthFit={true}>
              <MyInput type="readonly" value={masterDataDetail.claimCode} />
            </Box>
          )}
        </BoxContainer>
        <BoxContainer isWidthFit={true}>
          <Box
            title="적용일자"
            className="min-w-[9rem] max-w-[9rem]"
            isRequired={true}
          >
            <MyInput
              type="date"
              value={localApplyDate}
              onChange={handleApplyDateChange}
            />
          </Box>
          <Box title="완료일자" className="min-w-[9rem] max-w-[9rem]">
            <MyInput
              type="date"
              value={localEndDate}
              onChange={handleEndDateChange}
            />
          </Box>
        </BoxContainer>
      </BoxContainer>
      {masterDataDetail.isSystemExternalLab && (
        <BoxContainer>
          <Box title="수탁기관" isWidthFit={true}>
            <MyInput
              type="readonly"
              value={masterDataDetail.externalLabName || ""}
            />
          </Box>
          <Box title="수탁사코드" isWidthFit={true}>
            <MyInput
              type="readonly"
              value={masterDataDetail.externalLabExaminationCode || ""}
            />
          </Box>
          <Box title="표준코드" isWidthFit={true}>
            <MyInput
              type="readonly"
              value={masterDataDetail.externalLabUbCode || ""}
            />
          </Box>
        </BoxContainer>
      )}
      {masterDataDetail.externalLabExaminationId && (
        <BoxContainer>
          <Box title="수탁사 검사 명칭">
            <MyInput
              type="readonly"
              className="w-full"
              value={masterDataDetail.externalLabExaminationName || ""}
            />
          </Box>
        </BoxContainer>
      )}
      <BoxContainer>
        <Box title="한글명칭" isRequired={true}>
          <MyInput
            type="text"
            value={localKrName}
            onChange={handleKrNameChange}
          />
        </Box>
      </BoxContainer>
      <BoxContainer>
        <Box title="영문명칭">
          <MyInput
            type="text"
            value={localEnName}
            onChange={handleEnNameChange}
          />
        </Box>
      </BoxContainer>
    </>
  );
});

export default CodeDateNameSetting;
