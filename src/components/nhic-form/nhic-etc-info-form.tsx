import React from 'react';
import NhicDisregForm from './nhic-disreg-form';
import { getAllEtcInfoComputedFieldsFromParsedData } from "@/lib/nhic-form-utils";

type EtcInfoComputed = ReturnType<typeof getAllEtcInfoComputedFieldsFromParsedData>[number];

interface NhicEtcInfoFormProps {
  etcInfoList: EtcInfoComputed[];
}

const NhicEtcInfoForm: React.FC<NhicEtcInfoFormProps> = ({
  etcInfoList
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-[var(--gray-100)] mb-2">기타자격정보</h3>
      <div className="space-y-4">
        {etcInfoList.map((etcInfo, index) => (
          <NhicDisregForm key={index} etcInfo={etcInfo} />
        ))}
      </div>
    </div>
  );
};

export default NhicEtcInfoForm; 