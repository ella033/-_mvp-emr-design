import {
  PrescriptionType,
  PrescriptionSubType,
} from "@/constants/master-data-enum";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";

/**
 * MasterDataType과 MasterDataSubType을 받아서 적절한 title을 반환하는 함수
 * @param masterDataType - 마스터 데이터 타입
 * @param masterDataSubType - 마스터 데이터 서브 타입 (선택사항)
 * @returns 해당하는 title 문자열
 */
export function getMasterDataTitle(
  masterDataType: PrescriptionType | null,
  masterDataSubType?: PrescriptionSubType | null
): string {
  if (!masterDataType) {
    return "";
  }

  // 기본 타입별 title
  const typeTitles: Record<PrescriptionType, string> = {
    [PrescriptionType.medical]: "수가",
    [PrescriptionType.drug]: "약품",
    [PrescriptionType.material]: "치료재료",
  };

  // 서브타입별 title (수가에만 적용)
  const subTypeTitles: Record<PrescriptionSubType, string> = {
    [PrescriptionSubType.action]: "행위",
    [PrescriptionSubType.examine]: "검사",
  };

  // 수가이고 서브타입이 있는 경우
  if (masterDataType === PrescriptionType.medical && masterDataSubType) {
    return subTypeTitles[masterDataSubType];
  }

  return typeTitles[masterDataType];
}

export const getInjectionLinkText = (masterDataDetail: MasterDataDetailType) => {
  if (masterDataDetail.drugMasterData?.injectionLink.length === 0) return "";
  if (!masterDataDetail.drugMasterData?.injectionLink[0]) return "";
  if (masterDataDetail.drugMasterData?.injectionLink.length === 1)
    return `${masterDataDetail.drugMasterData?.injectionLink[0].code}`;
  return `${masterDataDetail.drugMasterData?.injectionLink[0].code} 외 ${masterDataDetail.drugMasterData?.injectionLink.length - 1}건`;
};

export const getDiseaseLinkText = (masterDataDetail: MasterDataDetailType) => {
  if (masterDataDetail.diseaseLink.length === 0) return "";
  if (!masterDataDetail.diseaseLink[0]) return "";
  if (masterDataDetail.diseaseLink.length === 1)
    return `${masterDataDetail.diseaseLink[0].code}`;
  return `${masterDataDetail.diseaseLink[0].code} 외 ${masterDataDetail.diseaseLink.length - 1}건`;
};

export const getSpecificDetailText = (masterDataDetail: MasterDataDetailType) => {
  if (masterDataDetail.specificDetail.length === 0) return "";
  if (!masterDataDetail.specificDetail[0]) return "";
  if (masterDataDetail.specificDetail.length === 1)
    return `${masterDataDetail.specificDetail[0].code}`;
  return `${masterDataDetail.specificDetail[0].code} 외 ${masterDataDetail.specificDetail.length - 1}건`;
};

export const getSpecimenDetailText = (masterDataDetail: MasterDataDetailType) => {
  if (masterDataDetail.specimenDetail.length === 0) return "";
  if (!masterDataDetail.specimenDetail[0]) return "";
  const first = masterDataDetail.specimenDetail[0];
  if (masterDataDetail.specimenDetail.length === 1)
    return `${first.code} ${first.name}`;
  return `${first.code} ${first.name} 외 ${masterDataDetail.specimenDetail.length - 1}건`;
};