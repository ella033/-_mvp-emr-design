// 품목유형코드 enum
export enum ItemTypeCode {
  진찰료_초진 = "0101",
  진찰료_재진 = "0102",
  진찰료_응급및회송료 = "0103",
  입원료_일반 = "0201",
  입원료_내소아과정신과 = "0202",
  입원료_중환자실 = "0203",
  입원료_격리병실 = "0204",
  투약료_내복약 = "0301",
  투약료_외용약 = "0302",
  투약료_처방전 = "0303",
  주사료_주사 = "0401",
  주사료_기타 = "0499",
  마취료 = "0501",
  이학요법료 = "0601",
  정신요법료 = "0701",
  처치수술료_일반 = "0801",
  처치수술료_수혈 = "0802",
  처치수술료_캐스트 = "0803",
  검사료_자체검사 = "0901",
  검사료_위탁검사 = "0902",
  영상진단방사선료_진단 = "1001",
  영상진단방사선료_치료 = "1002",
  특수장비_CT진단 = "S01",
  특수장비_MRI진단 = "S02",
  특수장비_PET진단 = "S03",
}

// 품목유형코드 라벨 매핑
export const ItemTypeCodeLabel: Record<ItemTypeCode, string> = {
  [ItemTypeCode.진찰료_초진]: "[진찰료] 초진",
  [ItemTypeCode.진찰료_재진]: "[진찰료] 재진",
  [ItemTypeCode.진찰료_응급및회송료]: "[진찰료] 응급 및 회송료",
  [ItemTypeCode.입원료_일반]: "[입원료] 일반",
  [ItemTypeCode.입원료_내소아과정신과]: "[입원료] 내소아과정신과",
  [ItemTypeCode.입원료_중환자실]: "[입원료] 중환자실",
  [ItemTypeCode.입원료_격리병실]: "[입원료] 격리병실",
  [ItemTypeCode.투약료_내복약]: "[투약료] 내복약",
  [ItemTypeCode.투약료_외용약]: "[투약료] 외용약",
  [ItemTypeCode.투약료_처방전]: "[투약료] 처방전",
  [ItemTypeCode.주사료_주사]: "[주사료] 주사",
  [ItemTypeCode.주사료_기타]: "[주사료] 기타",
  [ItemTypeCode.마취료]: "[마취료] 마취료",
  [ItemTypeCode.이학요법료]: "[이학요법료] 이학요법료",
  [ItemTypeCode.정신요법료]: "[정신요법료] 정신요법료",
  [ItemTypeCode.처치수술료_일반]: "[처치 및 수술료] 일반",
  [ItemTypeCode.처치수술료_수혈]: "[처치 및 수술료] 수혈",
  [ItemTypeCode.처치수술료_캐스트]: "[처치 및 수술료] 캐스트",
  [ItemTypeCode.검사료_자체검사]: "[검사료] 자체검사",
  [ItemTypeCode.검사료_위탁검사]: "[검사료] 위탁검사",
  [ItemTypeCode.영상진단방사선료_진단]: "[영상진단 및 방사선료] 진단",
  [ItemTypeCode.영상진단방사선료_치료]: "[영상진단 및 방사선료] 치료",
  [ItemTypeCode.특수장비_CT진단]: "[특수장비] CT진단",
  [ItemTypeCode.특수장비_MRI진단]: "[특수장비] MRI진단",
  [ItemTypeCode.특수장비_PET진단]: "[특수장비] PET진단",
};

// 기존 ITEM_TYPE_OPTIONS 호환성 유지
export const ITEM_TYPE_OPTIONS = Object.values(ItemTypeCode).map((code) => ({
  value: code,
  label: ItemTypeCodeLabel[code],
}));

// 진료행위용 품목유형 코드 목록
const ITEM_TYPE_ACTION_CODES = [
  ItemTypeCode.진찰료_초진,
  ItemTypeCode.진찰료_재진,
  ItemTypeCode.진찰료_응급및회송료,
  ItemTypeCode.입원료_일반,
  ItemTypeCode.입원료_내소아과정신과,
  ItemTypeCode.입원료_중환자실,
  ItemTypeCode.입원료_격리병실,
  ItemTypeCode.투약료_내복약,
  ItemTypeCode.주사료_주사,
  ItemTypeCode.마취료,
  ItemTypeCode.이학요법료,
  ItemTypeCode.정신요법료,
  ItemTypeCode.처치수술료_일반,
  ItemTypeCode.처치수술료_캐스트,
  ItemTypeCode.영상진단방사선료_진단,
  ItemTypeCode.영상진단방사선료_치료,
  ItemTypeCode.특수장비_CT진단,
  ItemTypeCode.특수장비_MRI진단,
  ItemTypeCode.특수장비_PET진단,
] as const;

export const ITEM_TYPE_ACTION_OPTIONS = ITEM_TYPE_ACTION_CODES.map((code) => ({
  value: code,
  label: ItemTypeCodeLabel[code],
}));

// 약품용 품목유형 코드 목록
const ITEM_TYPE_DRUG_CODES = [
  ItemTypeCode.투약료_내복약,
  ItemTypeCode.투약료_외용약,
  ItemTypeCode.주사료_주사,
  ItemTypeCode.주사료_기타,
] as const;

export const ITEM_TYPE_DRUG_OPTIONS = ITEM_TYPE_DRUG_CODES.map((code) => ({
  value: code,
  label: ItemTypeCodeLabel[code],
}));

// 검사용 품목유형 코드 목록
const ITEM_TYPE_EXAMINE_CODES = [
  ItemTypeCode.검사료_자체검사,
  ItemTypeCode.검사료_위탁검사,
] as const;

export const ITEM_TYPE_EXAMINE_OPTIONS = ITEM_TYPE_EXAMINE_CODES.map((code) => ({
  value: code,
  label: ItemTypeCodeLabel[code],
}));

// 재료용 품목유형 코드 목록
const ITEM_TYPE_MATERIAL_CODES = [
  ItemTypeCode.처치수술료_일반,
  ItemTypeCode.처치수술료_캐스트,
  ItemTypeCode.영상진단방사선료_진단,
  ItemTypeCode.영상진단방사선료_치료,
] as const;

export const ITEM_TYPE_MATERIAL_OPTIONS = ITEM_TYPE_MATERIAL_CODES.map((code) => ({
  value: code,
  label: ItemTypeCodeLabel[code],
}));
