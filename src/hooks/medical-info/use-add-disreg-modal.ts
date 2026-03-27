import { useState, useEffect, useCallback, useRef } from "react";
import type { BaseDisReg } from '@/types/dis-reg-types/base-dis-reg-type';
import { 급여제한여부, 잠복결핵구분 } from "@/constants/common/common-enum";
import { getOptionByEligibilityKey, ADDITIONAL_QUALIFICATION_OPTIONS, STRING_DATA_FIELD_KEYS } from '@/constants/common/additional-qualification-options';
import {
  convertBaseDisRegToDiseaseRegistration,
} from '@/lib/nhic-form-utils';
import { components } from '@/generated/api/types';
import { 당뇨병요양비대상자유형Label, 당뇨병요양비대상자유형 } from "@/constants/common/common-enum";
import {
  getSelectedEligibilityKeys,
  convertCancerDataToExtraQualification,
  createDefaultDisRegPrsonCancerInfo,
  createDefaultDisRegPrson1Info,
  createDefaultDisRegPrsonOtherInfo,
  createDefaultSelfPreparationPersonInfo,
  createDefaultPreInfantInfo,
  getDiseaseRegistrationFromExtraQualification as getDiseaseRegistrationFromExtraQualificationUtil,
  getCancerDataFromExtraQualificationForForm as getCancerDataFromExtraQualificationForFormUtil,
  getQualRestrictDataFromExtraQualification as getQualRestrictDataFromExtraQualificationUtil,
  getPreInfantInfoFromExtraQualification,
  getSelfPreparationPersonInfoFromExtraQualification,
} from '@/hooks/medical-info/add-disreg-modal-utils';

type DisRegPrsonCancerInfo = components["schemas"]["DisRegPrsonCancerInfo"];
type DisRegPrson1Info = components["schemas"]["DisRegPrson1Info"];
type DisRegPrsonOtherInfo = components["schemas"]["DisRegPrsonOtherInfo"];
type NonFaceToFaceDiagnosisInfo = components["schemas"]["NonFaceToFaceDiagnosisInfo"];
type SelfPreparationPersonInfo = components["schemas"]["SelfPreparationPersonInfo"];
type PreInfantInfo = components["schemas"]["PreInfantInfo"];

interface UseAddDisregModalProps {
  isOpen: boolean;
  extraQualification?: Record<string, any>;
}

interface UseAddDisregModalReturn {
  // 상태
  selectedEligibilityKeys: string[];
  cancerData: DisRegPrsonCancerInfo[];
  burnData: DisRegPrsonOtherInfo | null;
  rareDiseaseData: DisRegPrsonOtherInfo | null;
  rDisHardData: DisRegPrsonOtherInfo | null;
  rDisTuberData: DisRegPrsonOtherInfo | null;
  rDisExtremeData: DisRegPrsonOtherInfo | null;
  rDisUnspecifiedData: DisRegPrsonOtherInfo | null;
  rDisEtcChromosomeData: DisRegPrsonOtherInfo | null;
  dementiaMainData: DisRegPrsonOtherInfo | null;
  rDisOldData: DisRegPrson1Info | null;
  preInfantData: PreInfantInfo | null;
  selfPrepData: SelfPreparationPersonInfo | null;
  qualRestrictData: 급여제한여부 | null;
  diabetesCareType: 당뇨병요양비대상자유형;
  setDiabetesCareType: (type: 당뇨병요양비대상자유형) => void;
  latentTbType: 잠복결핵구분;
  setLatentTbType: (type: 잠복결핵구분) => void;
  nonFaceToFaceData: NonFaceToFaceDiagnosisInfo | null;
  setNonFaceToFaceData: (data: NonFaceToFaceDiagnosisInfo | null) => void;
  updateNonFaceToFaceField: (field: '섬벽지거주여부' | '장애등록여부' | '장기요양등급여부' | '응급취약지거주여부', checked: boolean) => void;

  // 핸들러
  handleCheckboxChange: (eligibilityKey: string, checked: boolean) => void;
  handlePreInfantDataChange: (data: PreInfantInfo) => void;
  handleSelfPrepDataChange: (data: SelfPreparationPersonInfo) => void;
  handleCancerDataChange: (newCancerData: DisRegPrsonCancerInfo[]) => void;
  handleBurnDataChange: (newBurnData: BaseDisReg) => void;
  handleRareDiseaseDataChange: (newRareDiseaseData: BaseDisReg) => void;
  handleRDisHardDataChange: (newRDisHardData: BaseDisReg) => void;
  handleRDisTuberDataChange: (newRDisTuberData: BaseDisReg) => void;
  handleRDisExtremeDataChange: (newRDisExtremeData: BaseDisReg) => void;
  handleRDisUnspecifiedDataChange: (newRDisUnspecifiedData: BaseDisReg) => void;
  handleRDisEtcChromosomeDataChange: (newRDisEtcChromosomeData: BaseDisReg) => void;
  handleDementiaMainDataChange: (newDementiaMainData: BaseDisReg) => void;
  handleRDisOldDataChange: (newRDisOldData: DisRegPrson1Info) => void;
  handleQualRestrictDataChange: (newQualRestrictData: 급여제한여부) => void;
  handleSave: () => Record<string, any>;
  handleCancel: () => void;
}

export function useAddDisregModal({
  isOpen,
  extraQualification,
}: UseAddDisregModalProps): UseAddDisregModalReturn {
  // 선택된 eligibilityKey 목록
  const [selectedEligibilityKeys, setSelectedEligibilityKeys] = useState<string[]>([]);

  // 각 항목별 데이터 상태 (서버 DTO 타입 사용)
  const [cancerData, setCancerData] = useState<DisRegPrsonCancerInfo[]>([]);
  const [burnData, setBurnData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rareDiseaseData, setRareDiseaseData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rDisHardData, setRDisHardData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rDisTuberData, setRDisTuberData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rDisExtremeData, setRDisExtremeData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rDisUnspecifiedData, setRDisUnspecifiedData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rDisEtcChromosomeData, setRDisEtcChromosomeData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [dementiaMainData, setDementiaMainData] = useState<DisRegPrsonOtherInfo | null>(null);
  const [rDisOldData, setRDisOldData] = useState<DisRegPrson1Info | null>(null);
  const [preInfantData, setPreInfantData] = useState<PreInfantInfo | null>(null);
  const [selfPrepData, setSelfPrepData] = useState<SelfPreparationPersonInfo | null>(null);
  const [qualRestrictData, setQualRestrictData] = useState<급여제한여부 | null>(null);
  const [diabetesCareType, setDiabetesCareType] = useState<당뇨병요양비대상자유형>(당뇨병요양비대상자유형.해당없음);
  const [latentTbType, setLatentTbType] = useState<잠복결핵구분>(잠복결핵구분.없음);

  // 비대면진료대상정보 데이터
  const [nonFaceToFaceData, setNonFaceToFaceData] = useState<NonFaceToFaceDiagnosisInfo | null>(null);

  const getDiseaseRegistrationFromExtraQualificationForForm = useCallback((
    eligibilityKey: string
  ): DisRegPrsonOtherInfo | DisRegPrson1Info | DisRegPrsonCancerInfo | null => {
    if (!isOpen) return null;
    return getDiseaseRegistrationFromExtraQualificationUtil(extraQualification, eligibilityKey);
  }, [extraQualification, isOpen]);

  const getCancerDataFromExtraQualificationForFormFromUtil = useCallback((): DisRegPrsonCancerInfo[] => {
    if (!isOpen) return [];
    return getCancerDataFromExtraQualificationForFormUtil(extraQualification);
  }, [extraQualification, isOpen]);

  const getQualRestrictDataFromExtraQualificationForForm = useCallback((): 급여제한여부 | null => {
    if (!isOpen) return null;
    return getQualRestrictDataFromExtraQualificationUtil(extraQualification);
  }, [extraQualification, isOpen]);

  /**
   * extraQualification에서 당뇨병요양비대상자 데이터 추출
   */
  const getDiabetesCareTypeFromExtraQualification = useCallback((): 당뇨병요양비대상자유형 => {
    if (!extraQualification || !isOpen) return 당뇨병요양비대상자유형.해당없음;

    const diabetesField = extraQualification["당뇨병요양비대상자유형"];
    if (diabetesField && typeof diabetesField === "object" && "data" in diabetesField && diabetesField.data) {
      const dataValue = diabetesField.data;
      if (dataValue === "01") {
        return 당뇨병요양비대상자유형.DMType1;
      } else if (dataValue === "02") {
        return 당뇨병요양비대상자유형.DMType2;
      }
    }
    return 당뇨병요양비대상자유형.해당없음;
  }, [extraQualification, isOpen]);

  /**
   * extraQualification에서 비대면진료대상정보 데이터 추출하여 상태 초기화
   */
  const initializeNonFaceToFaceFromExtraQualification = useCallback(() => {
    if (!extraQualification || !isOpen) {
      setNonFaceToFaceData(null);
      return;
    }

    const data = extraQualification["비대면진료대상정보"];
    if (data && typeof data === "object" && Object.keys(data).length > 0) {
      // data 속성이 있으면 제거하고 올바른 형태로 변환
      const cleanedData: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        if (key !== "data") {
          cleanedData[key] = data[key];
        }
      });
      setNonFaceToFaceData(cleanedData as NonFaceToFaceDiagnosisInfo);
    } else {
      setNonFaceToFaceData(null);
    }
  }, [extraQualification, isOpen]);

  /**
   * 비대면진료대상정보 특정 필드 업데이트
   */
  const updateNonFaceToFaceField = useCallback((
    field: '섬벽지거주여부' | '장애등록여부' | '장기요양등급여부' | '응급취약지거주여부',
    checked: boolean
  ) => {
    setNonFaceToFaceData((prev) => {
      const current: any = prev || {
        섬벽지거주여부: "N",
        장애등록여부: "N",
        장기요양등급여부: "N",
        응급취약지거주여부: "N",
      };

      return {
        ...current,
        [field]: checked ? "Y" : "N",
      };
    });
  }, []);

  // 모달이 열릴 때(false→true 전환 시)만 상태 초기화
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!justOpened) return;

    const selectedKeys = getSelectedEligibilityKeys(extraQualification);
    setSelectedEligibilityKeys(selectedKeys);
    if (selectedKeys.includes("당뇨병요양비대상자유형")) {
      setDiabetesCareType(getDiabetesCareTypeFromExtraQualification());
    } else {
      setDiabetesCareType(당뇨병요양비대상자유형.해당없음);
    }
    // 잠복결핵구분 초기화
    if (selectedKeys.includes("산정특례잠복결핵등록대상자") && extraQualification) {
      const tbData = extraQualification["산정특례잠복결핵등록대상자"];
      if (tbData && typeof tbData === "object" && "구분" in tbData && tbData["구분"] !== "") {
        setLatentTbType(Number(tbData["구분"]) as 잠복결핵구분);
      } else {
        setLatentTbType(잠복결핵구분.없음);
      }
    } else {
      setLatentTbType(잠복결핵구분.없음);
    }
    // 비대면진료대상정보 체크박스 상태 초기화
    initializeNonFaceToFaceFromExtraQualification();
  }, [isOpen, extraQualification, getDiabetesCareTypeFromExtraQualification, initializeNonFaceToFaceFromExtraQualification]);

  // 체크박스 변경 핸들러
  const handleCheckboxChange = useCallback((eligibilityKey: string, checked: boolean) => {
    if (checked) {
      setSelectedEligibilityKeys((prev) => {
        if (prev.includes(eligibilityKey)) {
          return prev;
        }
        return [...prev, eligibilityKey];
      });
    } else {
      setSelectedEligibilityKeys((prev) => prev.filter((key) => key !== eligibilityKey));
    }

    // 체크 해제 시 해당 데이터도 초기화
    if (!checked) {
      const option = getOptionByEligibilityKey(eligibilityKey);
      if (option) {
        switch (eligibilityKey) {
          case "산정특례암등록대상자1":
            setCancerData([]);
            break;
          case "산정특례화상등록대상자":
            setBurnData(null);
            break;
          case "산정특례희귀질환등록대상자":
            setRareDiseaseData(null);
            break;
          case "산정특례중증난치질환등록대상자":
            setRDisHardData(null);
            break;
          case "산정특례결핵등록대상자":
            setRDisTuberData(null);
            break;
          case "산정특례극희귀등록대상자":
            setRDisExtremeData(null);
            break;
          case "산정특례상세불명희귀등록대상자":
            setRDisUnspecifiedData(null);
            break;
          case "산정특례기타염색체이상질환등록대상자":
            setRDisEtcChromosomeData(null);
            break;
          case "산정특례잠복결핵등록대상자":
            setRDisTuberData(null);
            setLatentTbType(잠복결핵구분.없음);
            break;
          case "산정특례중증치매등록대상자":
            setDementiaMainData(null);
            break;
          case "희귀난치의료비지원대상자":
            setRDisOldData(null);
            break;
          case "조산아및저체중출생아등록대상자":
            setPreInfantData(null);
            break;
          case "자립준비청년대상자":
            setSelfPrepData(null);
            break;
          case "급여제한여부":
            setQualRestrictData(null);
            break;
          case "당뇨병요양비대상자유형":
            setDiabetesCareType(당뇨병요양비대상자유형.해당없음);
            break;
        }
      }
    } else {
      // 체크 시 기본 데이터 생성
      const option = getOptionByEligibilityKey(eligibilityKey);
      if (option) {
        switch (eligibilityKey) {
          case "산정특례암등록대상자1":
            setCancerData((prev) => {
              if (prev.length === 0) {
                return [createDefaultDisRegPrsonCancerInfo()];
              }
              return prev;
            });
            break;
          case "산정특례화상등록대상자":
            setBurnData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례희귀질환등록대상자":
            setRareDiseaseData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례중증난치질환등록대상자":
            setRDisHardData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례결핵등록대상자":
          case "산정특례잠복결핵등록대상자":
            setRDisTuberData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례극희귀등록대상자":
            setRDisExtremeData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례상세불명희귀등록대상자":
            setRDisUnspecifiedData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례기타염색체이상질환등록대상자":
            setRDisEtcChromosomeData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "산정특례중증치매등록대상자":
            setDementiaMainData(createDefaultDisRegPrsonOtherInfo());
            break;
          case "희귀난치의료비지원대상자":
            setRDisOldData(createDefaultDisRegPrson1Info());
            break;
          case "급여제한여부":
            setQualRestrictData(급여제한여부.해당없음);
            break;
          case "당뇨병요양비대상자유형":
            if (isOpen) {
              const existingType = getDiabetesCareTypeFromExtraQualification();
              setDiabetesCareType(existingType);
            } else {
              setDiabetesCareType(당뇨병요양비대상자유형.해당없음);
            }
            break;
        }
      }
    }
  }, [isOpen, getDiabetesCareTypeFromExtraQualification]);

  // 각 데이터 변경 핸들러들
  const handleCancerDataChange = useCallback((newCancerData: DisRegPrsonCancerInfo[]) => {
    setCancerData(newCancerData);
  }, []);

  const handleBurnDataChange = useCallback((newBurnData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newBurnData) as DisRegPrsonOtherInfo;
    setBurnData(serverData);
  }, []);

  const handleRareDiseaseDataChange = useCallback((newRareDiseaseData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newRareDiseaseData) as DisRegPrsonOtherInfo;
    setRareDiseaseData(serverData);
  }, []);

  const handleRDisHardDataChange = useCallback((newRDisHardData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newRDisHardData) as DisRegPrsonOtherInfo;
    setRDisHardData(serverData);
  }, []);

  const handleRDisTuberDataChange = useCallback((newRDisTuberData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newRDisTuberData) as DisRegPrsonOtherInfo;
    setRDisTuberData(serverData);
  }, []);

  const handleRDisExtremeDataChange = useCallback((newRDisExtremeData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newRDisExtremeData) as DisRegPrsonOtherInfo;
    setRDisExtremeData(serverData);
  }, []);

  const handleRDisUnspecifiedDataChange = useCallback((newRDisUnspecifiedData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newRDisUnspecifiedData) as DisRegPrsonOtherInfo;
    setRDisUnspecifiedData(serverData);
  }, []);

  const handleRDisEtcChromosomeDataChange = useCallback((newRDisEtcChromosomeData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newRDisEtcChromosomeData) as DisRegPrsonOtherInfo;
    setRDisEtcChromosomeData(serverData);
  }, []);

  const handleDementiaMainDataChange = useCallback((newDementiaMainData: BaseDisReg) => {
    const serverData = convertBaseDisRegToDiseaseRegistration(newDementiaMainData) as DisRegPrsonOtherInfo;
    setDementiaMainData(serverData);
  }, []);

  const handleRDisOldDataChange = useCallback((newRDisOldData: DisRegPrson1Info) => {
    setRDisOldData(newRDisOldData);
  }, []);

  const handlePreInfantDataChange = useCallback((data: PreInfantInfo) => {
    setPreInfantData(data);
  }, []);

  const handleSelfPrepDataChange = useCallback((data: SelfPreparationPersonInfo) => {
    setSelfPrepData(data);
  }, []);

  const handleQualRestrictDataChange = useCallback((newQualRestrictData: 급여제한여부) => {
    setQualRestrictData(newQualRestrictData);
  }, []);

  // 저장 버튼 클릭 - extraQualification 형식으로 변환하여 반환
  const handleSave = useCallback((): Record<string, any> => {
    // 기존 extraQualification의 모든 데이터를 먼저 복사 (기존 데이터 유지)
    const newExtraQualification: Record<string, any> = extraQualification
      ? JSON.parse(JSON.stringify(extraQualification))
      : {};

    // 중증암 데이터 처리
    if (selectedEligibilityKeys.includes("산정특례암등록대상자1")) {
      const formCancerData = cancerData.length > 0
        ? cancerData
        : getCancerDataFromExtraQualificationForFormFromUtil();
      if (formCancerData.length > 0) {
        const cancerDataObj = convertCancerDataToExtraQualification(formCancerData);
        Object.assign(newExtraQualification, cancerDataObj);
      }
    }

    // 각 항목별 데이터 처리
    if (selectedEligibilityKeys.includes("산정특례화상등록대상자")) {
      const serverData = burnData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례화상등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례화상등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례희귀질환등록대상자")) {
      const serverData = rareDiseaseData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례희귀질환등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례희귀질환등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례중증난치질환등록대상자")) {
      const serverData = rDisHardData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례중증난치질환등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례중증난치질환등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례결핵등록대상자")) {
      const serverData = rDisTuberData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례결핵등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례결핵등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례극희귀등록대상자")) {
      const serverData = rDisExtremeData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례극희귀등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례극희귀등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례상세불명희귀등록대상자")) {
      const serverData = rDisUnspecifiedData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례상세불명희귀등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례상세불명희귀등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례기타염색체이상질환등록대상자")) {
      const serverData = rDisEtcChromosomeData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례기타염색체이상질환등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례기타염색체이상질환등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("산정특례잠복결핵등록대상자")) {
      const serverData = rDisTuberData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례잠복결핵등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례잠복결핵등록대상자"] = {
          ...serverData,
          구분: latentTbType !== 잠복결핵구분.없음 ? String(latentTbType) : "",
        };
      }
    }

    if (selectedEligibilityKeys.includes("산정특례중증치매등록대상자")) {
      const serverData = dementiaMainData || (getDiseaseRegistrationFromExtraQualificationForForm("산정특례중증치매등록대상자") as DisRegPrsonOtherInfo | null);
      if (serverData && (serverData.등록일 || serverData.특정기호 || serverData.등록번호)) {
        newExtraQualification["산정특례중증치매등록대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("희귀난치의료비지원대상자")) {
      const serverData = rDisOldData || (getDiseaseRegistrationFromExtraQualificationForForm("희귀난치의료비지원대상자") as DisRegPrson1Info | null);
      if (serverData && (serverData.승인일 || serverData.특정기호)) {
        newExtraQualification["희귀난치의료비지원대상자"] = serverData;
      }
    }

    if (selectedEligibilityKeys.includes("급여제한여부")) {
      const formData = qualRestrictData || getQualRestrictDataFromExtraQualificationForForm();
      if (formData !== null && formData !== 급여제한여부.해당없음) {
        const qualRestrictValue = String(formData).padStart(2, "0");
        newExtraQualification["급여제한여부"] = { data: qualRestrictValue };
      }
    }

    // StringDataField 타입 필드들 처리
    if (selectedEligibilityKeys.includes("출국자여부")) {
      newExtraQualification["출국자여부"] = { data: "Y" };
    }

    if (selectedEligibilityKeys.includes("당뇨병요양비대상자유형")) {
      if (diabetesCareType !== 당뇨병요양비대상자유형.해당없음) {
        const selectedLabel = 당뇨병요양비대상자유형Label[diabetesCareType];
        newExtraQualification["당뇨병요양비대상자유형"] = { data: selectedLabel };
      }
    }

    if (selectedEligibilityKeys.includes("조산아및저체중출생아등록대상자")) {
      const formData =
        preInfantData ??
        getPreInfantInfoFromExtraQualification(extraQualification) ??
        createDefaultPreInfantInfo();
      newExtraQualification["조산아및저체중출생아등록대상자"] = formData;
    }

    if (selectedEligibilityKeys.includes("요양병원입원여부")) {
      newExtraQualification["요양병원입원여부"] = { data: "Y" };
    }

    if (selectedEligibilityKeys.includes("비대면진료대상정보")) {
      if (nonFaceToFaceData) {
        const hasValid섬벽지 = (nonFaceToFaceData.섬벽지거주여부 as any) === "Y";
        const hasValid장애 = (nonFaceToFaceData.장애등록여부 as any) === "Y";
        const hasValid장기요양 = (nonFaceToFaceData.장기요양등급여부 as any) === "Y";
        const hasValid응급취약지 = (nonFaceToFaceData.응급취약지거주여부 as any) === "Y";

        if (hasValid섬벽지 || hasValid장애 || hasValid장기요양 || hasValid응급취약지) {
          newExtraQualification["비대면진료대상정보"] = nonFaceToFaceData;
        }
      }
    }

    if (selectedEligibilityKeys.includes("자립준비청년대상자")) {
      const formData =
        selfPrepData ??
        getSelfPreparationPersonInfoFromExtraQualification(extraQualification) ??
        createDefaultSelfPreparationPersonInfo();
      newExtraQualification["자립준비청년대상자"] = formData;
    }

    if (selectedEligibilityKeys.includes("본인부담차등여부")) {
      newExtraQualification["본인부담차등여부"] = { data: "Y" };
    }

    // 선택 해제된 DiseaseRegistrationPersonBase 타입 항목은 빈 객체로 설정

    // 중증암 선택 해제 처리
    if (!selectedEligibilityKeys.includes("산정특례암등록대상자1")) {
      const cancerKeys = [
        "산정특례암등록대상자1",
        "산정특례중복암등록대상자2",
        "산정특례중복암등록대상자3",
        "산정특례중복암등록대상자4",
        "산정특례중복암등록대상자5",
      ];
      cancerKeys.forEach((key) => {
        if (newExtraQualification[key] &&
          typeof newExtraQualification[key] === "object" &&
          Object.keys(newExtraQualification[key]).length > 0) {
          newExtraQualification[key] = {};
        }
      });
    }

    ADDITIONAL_QUALIFICATION_OPTIONS.forEach((option) => {
      // 중증암은 별도 처리되므로 스킵
      if (option.eligibilityKey === "산정특례암등록대상자1") {
        return;
      }

      // 선택 해제된 항목 처리
      if (!selectedEligibilityKeys.includes(option.eligibilityKey)) {
        const field = newExtraQualification[option.eligibilityKey];

        if (field && typeof field === "object") {
          // NonFaceToFaceDiagnosisInfo 타입 처리 (비대면진료대상정보)
          if (option.eligibilityKey === "비대면진료대상정보") {
            // 기존에 데이터가 있었던 경우에만 빈 객체로 설정
            if (Object.keys(field).length > 0) {
              newExtraQualification[option.eligibilityKey] = {};
            }
            return;
          }

          // StringDataField 타입 (data 속성이 있고, 등록일/특정기호/등록번호가 없는 경우)
          if ("data" in field && !("등록일" in field) && !("특정기호" in field) && !("등록번호" in field)) {
            // 기존에 데이터가 있었던 경우
            const dataValue = (field["data"] as string) || "";
            if (dataValue.trim() !== "" && dataValue.trim() !== "N") {
              // data 값이 "Y"인 경우 (Y/N 타입) → "N"으로 변경
              if (dataValue === "Y") {
                newExtraQualification[option.eligibilityKey] = { data: "N" };
              } else {
                // 다른 값인 경우 (당뇨병요양비대상자유형, 급여제한여부 등) → 빈 문자열로 설정
                newExtraQualification[option.eligibilityKey] = { data: "" };
              }
            }
          }
          // DiseaseRegistrationPersonBase 타입 (등록일/특정기호/등록번호가 있는 경우)
          else if (!STRING_DATA_FIELD_KEYS.has(option.eligibilityKey)) {
            // 기존에 데이터가 있었던 경우에만 빈 객체로 설정
            if (Object.keys(field).length > 0) {
              newExtraQualification[option.eligibilityKey] = {};
            }
          }
        }
      }
    });

    return newExtraQualification;
  }, [
    selectedEligibilityKeys,
    cancerData,
    burnData,
    rareDiseaseData,
    rDisHardData,
    rDisTuberData,
    rDisExtremeData,
    rDisUnspecifiedData,
    rDisEtcChromosomeData,
    dementiaMainData,
    rDisOldData,
    preInfantData,
    selfPrepData,
    qualRestrictData,
    diabetesCareType,
    latentTbType,
    nonFaceToFaceData,
    extraQualification,
    getCancerDataFromExtraQualificationForFormFromUtil,
    getDiseaseRegistrationFromExtraQualificationForForm,
    getQualRestrictDataFromExtraQualificationForForm,
  ]);

  // 취소 버튼 클릭
  const handleCancel = useCallback(() => {
    setCancerData([]);
    setBurnData(null);
    setRareDiseaseData(null);
    setRDisHardData(null);
    setRDisTuberData(null);
    setRDisExtremeData(null);
    setRDisUnspecifiedData(null);
    setRDisEtcChromosomeData(null);
    setDementiaMainData(null);
    setRDisOldData(null);
    setPreInfantData(null);
    setSelfPrepData(null);
    setQualRestrictData(null);
    setDiabetesCareType(당뇨병요양비대상자유형.해당없음);
    setLatentTbType(잠복결핵구분.없음);
    setNonFaceToFaceData(null);
  }, []);

  return {
    // 상태
    selectedEligibilityKeys,
    cancerData,
    burnData,
    rareDiseaseData,
    rDisHardData,
    rDisTuberData,
    rDisExtremeData,
    rDisUnspecifiedData,
    rDisEtcChromosomeData,
    dementiaMainData,
    rDisOldData,
    preInfantData,
    selfPrepData,
    qualRestrictData,
    diabetesCareType,
    setDiabetesCareType,
    latentTbType,
    setLatentTbType,
    nonFaceToFaceData,
    setNonFaceToFaceData,
    updateNonFaceToFaceField,

    // 핸들러
    handleCheckboxChange,
    handlePreInfantDataChange,
    handleSelfPrepDataChange,
    handleCancerDataChange,
    handleBurnDataChange,
    handleRareDiseaseDataChange,
    handleRDisHardDataChange,
    handleRDisTuberDataChange,
    handleRDisExtremeDataChange,
    handleRDisUnspecifiedDataChange,
    handleRDisEtcChromosomeDataChange,
    handleDementiaMainDataChange,
    handleRDisOldDataChange,
    handleQualRestrictDataChange,
    handleSave,
    handleCancel,
  };
}

