import MyBox from "@/components/yjg/my-box";
import { Box } from "../common-controls";
import { MySelect } from "@/components/yjg/my-select";
import MyRadio from "@/components/yjg/my-radio";
import { PaymentMethod } from "@/constants/common/common-enum";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { useState } from "react";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";

interface PaymentSettingProps {
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}

export default function PaymentSetting({
  masterDataDetail,
  setMasterDataDetail,
}: PaymentSettingProps) {
  const isNonCovered = masterDataDetail.prescriptionLibraryId === 0; // 0이면 비급여로 판단한다.
  const selfPayValues = [
    PaymentMethod.삼십대백,
    PaymentMethod.오십대백,
    PaymentMethod.팔십대백,
    PaymentMethod.구십대백,
    PaymentMethod.백대백,
  ];
  const isSelfPay = selfPayValues.includes(masterDataDetail?.paymentMethod);
  const [selectedSelfPayOption, setSelectedSelfPayOption] = useState<string>(
    isSelfPay ? String(masterDataDetail.paymentMethod) : ""
  );

  // 외부수탁검사소에서 온 경우이고 청구코드가 없으면 수정 불가
  const isReadonly = Boolean(
    masterDataDetail?.externalLabExaminationId &&
    (!masterDataDetail?.claimCode || masterDataDetail.claimCode.trim() === "")
  );

  const selfPayOptions: { value: number; label: string }[] = [];
  if (masterDataDetail?.isPossiblePayRate30) {
    selfPayOptions.push({
      value: PaymentMethod.삼십대백,
      label: "30%",
    });
  }
  if (masterDataDetail?.isPossiblePayRate50) {
    selfPayOptions.push({
      value: PaymentMethod.오십대백,
      label: "50%",
    });
  }
  if (masterDataDetail?.isPossiblePayRate80) {
    selfPayOptions.push({
      value: PaymentMethod.팔십대백,
      label: "80%",
    });
  }
  if (masterDataDetail?.isPossiblePayRate90) {
    selfPayOptions.push({
      value: PaymentMethod.구십대백,
      label: "90%",
    });
  }
  if (masterDataDetail?.isPossiblePayRate100) {
    selfPayOptions.push({
      value: PaymentMethod.백대백,
      label: "100%",
    });
  }

  const handleInsuranceChange = (checked: boolean) => {
    if (checked && !isReadonly) {
      setMasterDataDetail({
        ...masterDataDetail,
        paymentMethod: PaymentMethod.보험가,
      });
    }
  };

  const handleSelfPayChange = (checked: boolean) => {
    if (checked && !isReadonly) {
      let selfPayOption = 0;
      if (!selectedSelfPayOption) {
        selfPayOption = selfPayOptions[0]?.value || 0;
        setSelectedSelfPayOption(String(selfPayOption));
      } else {
        selfPayOption = Number(selectedSelfPayOption);
      }

      setMasterDataDetail({
        ...masterDataDetail,
        paymentMethod: selfPayOption,
      });
    }
  };

  const handleNonCoveredInsuranceChange = (checked: boolean) => {
    if (checked && !isReadonly) {
      setMasterDataDetail({
        ...masterDataDetail,
        paymentMethod: PaymentMethod.보험가비급여,
      });
    }
  };

  const changeIsNormalPrice = (checked: boolean) => {
    if (!isReadonly) {
      setMasterDataDetail({
        ...masterDataDetail,
        isNormalPrice: checked,
        // 일반가 체크 시 수납없음 해제
        ...(checked && masterDataDetail.paymentMethod === PaymentMethod.수납없음
          ? { paymentMethod: PaymentMethod.일반가 }
          : {}),
      });
    }
  };

  const handleNoPaymentChange = (checked: boolean) => {
    if (checked && !isReadonly) {
      setMasterDataDetail({
        ...masterDataDetail,
        paymentMethod: PaymentMethod.수납없음,
        isNormalPrice: false,
      });
    }
  };

  // 비급여: 일반가 / 수납없음만 라디오로 표시
  const handleNonCoveredNormalPriceChange = (checked: boolean) => {
    if (checked && !isReadonly) {
      setMasterDataDetail({
        ...masterDataDetail,
        paymentMethod: PaymentMethod.일반가,
        isNormalPrice: true,
      });
    }
  };

  if (isNonCovered) {
    return (
      <Box title="수납구분" isWidthFit={true}>
        <div className="flex flex-row flex-wrap gap-2">
          <MyBox>
            <MyRadio
              label="일반가"
              name="payment-method-noncovered"
              value={PaymentMethod.일반가}
              checked={
                masterDataDetail?.paymentMethod === PaymentMethod.일반가 ||
                (Boolean(masterDataDetail?.isNormalPrice) &&
                  masterDataDetail?.paymentMethod !== PaymentMethod.수납없음)
              }
              onChange={handleNonCoveredNormalPriceChange}
              disabled={isReadonly}
            />
            <MyRadio
              label="수납없음"
              name="payment-method-noncovered"
              value={PaymentMethod.수납없음}
              checked={
                masterDataDetail?.paymentMethod === PaymentMethod.수납없음
              }
              onChange={handleNoPaymentChange}
              disabled={isReadonly}
            />
          </MyBox>
        </div>
      </Box>
    );
  }

  return (
    <Box title="수납구분" isWidthFit={true}>
      <MyBox>
        <MyRadio
          label="보험가"
          name="payment-method"
          value={PaymentMethod.보험가}
          checked={
            masterDataDetail?.paymentMethod === PaymentMethod.보험가
          }
          onChange={handleInsuranceChange}
          disabled={isReadonly}
        />
        {selfPayOptions.length > 0 && (
          <MyRadio
            label="본인부담"
            name="payment-method"
            value={selectedSelfPayOption}
            checked={selfPayValues.includes(masterDataDetail?.paymentMethod)}
            onChange={handleSelfPayChange}
            disabled={isReadonly}
          >
            <MySelect
              options={selfPayOptions}
              value={selectedSelfPayOption}
              onChange={(value) => {
                setSelectedSelfPayOption(String(value));
              }}
              disabled={isReadonly}
            />
          </MyRadio>
        )}
        <MyRadio
          label="보험가비급여"
          name="payment-method"
          value={PaymentMethod.보험가비급여}
          checked={
            masterDataDetail?.paymentMethod ===
            PaymentMethod.보험가비급여
          }
          onChange={handleNonCoveredInsuranceChange}
          disabled={isReadonly}
        />
      </MyBox>
      <MyBox>
        <MyCheckbox
          label="일반가"
          size="sm"
          checked={masterDataDetail?.isNormalPrice || false}
          onChange={changeIsNormalPrice}
          disabled={isReadonly}
        />
      </MyBox>
      <MyBox>
        <MyRadio
          label="수납없음"
          name="payment-method"
          value={PaymentMethod.수납없음}
          checked={
            masterDataDetail?.paymentMethod === PaymentMethod.수납없음
          }
          onChange={handleNoPaymentChange}
          disabled={isReadonly}
        />
      </MyBox>
    </Box>
  );
}
