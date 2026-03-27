import React from "react";
import MyPopup from '@/components/yjg/my-pop-up';
import HardSickCancerInfo from './hard-sick-cancer-info';
import DisregSpecialInfo from './disreg-special-info';
import RDisOldInfo from './r-dis-old-info';
import PreinfantInfo from './preinfant-info';
import SelfPrepInfo from './self-prep-info';
import QualRestrictInfo from './qual-restrict-info';
import type { BaseDisReg } from '@/types/dis-reg-types/base-dis-reg-type';
import { components } from '@/generated/api/types';
import { ADDITIONAL_QUALIFICATION_OPTIONS } from '@/constants/common/additional-qualification-options';
import {
  convertDisRegPrsonOtherInfoToBaseDisReg,
} from '@/lib/nhic-form-utils';

type DisRegPrson1Info = components["schemas"]["DisRegPrson1Info"];
import { 당뇨병요양비대상자유형, 급여제한여부, 잠복결핵구분 } from "@/constants/common/common-enum";
import { useAddDisregModal } from '@/hooks/medical-info/use-add-disreg-modal';
import {
  getCancerDataFromExtraQualificationForForm,
  getDiseaseRegistrationFromExtraQualification,
  getDementiaMainDataFromExtraQualification,
  getQualRestrictDataFromExtraQualification,
  getPreInfantInfoFromExtraQualification,
  getSelfPreparationPersonInfoFromExtraQualification,
  createDefaultSelfPreparationPersonInfo,
  createDefaultPreInfantInfo,
} from '@/hooks/medical-info/add-disreg-modal-utils';

interface AddDisregModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (extraQualification: Record<string, any>) => void;
  extraQualification?: Record<string, any>;
  isDisabled?: boolean;
}

const AddDisregModal: React.FC<AddDisregModalProps> = ({
  isOpen,
  onClose,
  onSave,
  extraQualification,
  isDisabled = false,
}) => {
  // Hook 사용
  const {
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
    updateNonFaceToFaceField,
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
    handleSave: handleSaveFromHook,
    handleCancel: handleCancelFromHook,
  } = useAddDisregModal({
    isOpen,
    extraQualification,
  });


  // 저장 버튼 클릭
  const handleSave = () => {
    const newExtraQualification = handleSaveFromHook();
    onSave(newExtraQualification);
    onClose();
  };

  // 취소 버튼 클릭
  const handleCancel = () => {
    handleCancelFromHook();
    onClose();
  };

  return (
    <MyPopup isOpen={isOpen} onCloseAction={handleCancel} title="추가자격사항" fitContent={false} width="450px" height="600px">
      <div className="flex flex-col h-full w-full">
        {/* 체크박스 리스트 */}
        <div className="flex-1 overflow-y-auto p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="grid grid-cols-1 gap-1">
            {ADDITIONAL_QUALIFICATION_OPTIONS.filter(opt => opt.showInModal !== false).map((option) => {
              const isSelected = selectedEligibilityKeys.includes(option.eligibilityKey);
              return (
                <div key={option.eligibilityKey}>
                  <label
                    className="flex items-center gap-2 p-0.5 hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleCheckboxChange(option.eligibilityKey, e.target.checked)}
                      disabled={isDisabled}
                      className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 ${isDisabled ? 'bg-gray-50' : ''}`}
                    />
                    <span className="text-sm text-gray-700 select-none">
                      {option.label}
                    </span>
                  </label>

                  {/* 각 항목별 하위 정보 컴포넌트 표시 */}
                  {option.eligibilityKey === "산정특례암등록대상자1" && isSelected && (() => {
                    const serverData = cancerData.length > 0
                      ? cancerData
                      : getCancerDataFromExtraQualificationForForm(extraQualification);
                    if (serverData.length === 0) return null;
                    return (
                      <HardSickCancerInfo
                        cancerData={serverData}
                        onDataChange={handleCancerDataChange}
                        isDisabled={isDisabled}
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례화상등록대상자" && isSelected && (() => {
                    const serverData = burnData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례화상등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleBurnDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="중증화상 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례희귀질환등록대상자" && isSelected && (() => {
                    const serverData = rareDiseaseData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례희귀질환등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRareDiseaseDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="희귀난치 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례중증난치질환등록대상자" && isSelected && (() => {
                    const serverData = rDisHardData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례중증난치질환등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRDisHardDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="중증난치 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례결핵등록대상자" && isSelected && (() => {
                    const serverData = rDisTuberData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례결핵등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRDisTuberDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="결핵 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례극희귀등록대상자" && isSelected && (() => {
                    const serverData = rDisExtremeData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례극희귀등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRDisExtremeDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="극희귀 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례상세불명희귀등록대상자" && isSelected && (() => {
                    const serverData = rDisUnspecifiedData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례상세불명희귀등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRDisUnspecifiedDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="상세불명희귀 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례기타염색체이상질환등록대상자" && isSelected && (() => {
                    const serverData = rDisEtcChromosomeData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례기타염색체이상질환등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRDisEtcChromosomeDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="기타염색체 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례잠복결핵등록대상자" && isSelected && (() => {
                    const serverData = rDisTuberData || getDiseaseRegistrationFromExtraQualification(extraQualification, "산정특례잠복결핵등록대상자");
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleRDisTuberDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="잠복결핵"
                        selectConfig={{
                          label: "구분",
                          value: latentTbType,
                          onChange: (v) => setLatentTbType(v as 잠복결핵구분),
                          options: [
                            { value: 잠복결핵구분.검진, label: "잠복결핵 검진" },
                            { value: 잠복결핵구분.진료, label: "잠복결핵 진료" },
                          ],
                        }}
                      />
                    );
                  })()}

                  {option.eligibilityKey === "산정특례중증치매등록대상자" && isSelected && (() => {
                    const serverData = dementiaMainData || getDementiaMainDataFromExtraQualification(extraQualification);
                    if (!serverData) return null;
                    // DisRegPrsonOtherInfo를 BaseDisReg 타입으로 변환
                    const formData = convertDisRegPrsonOtherInfoToBaseDisReg(serverData);
                    return (
                      <DisregSpecialInfo<BaseDisReg>
                        data={formData}
                        onDataChange={(data) => handleDementiaMainDataChange(data as any)}
                        isDisabled={isDisabled}
                        title="중증치매 산정특례"
                      />
                    );
                  })()}

                  {option.eligibilityKey === "희귀난치의료비지원대상자" && isSelected && (() => {
                    const serverData = rDisOldData || getDiseaseRegistrationFromExtraQualification(extraQualification, "희귀난치의료비지원대상자");
                    if (!serverData) return null;
                    return (
                      <RDisOldInfo
                        data={serverData as DisRegPrson1Info}
                        onDataChange={handleRDisOldDataChange}
                        isDisabled={isDisabled}
                      />
                    );
                  })()}

                  {option.eligibilityKey === "조산아및저체중출생아등록대상자" && isSelected && (() => {
                    const formData =
                      preInfantData ??
                      getPreInfantInfoFromExtraQualification(extraQualification) ??
                      createDefaultPreInfantInfo();
                    return (
                      <PreinfantInfo
                        data={formData}
                        onDataChange={handlePreInfantDataChange}
                        isDisabled={isDisabled}
                      />
                    );
                  })()}

                  {option.eligibilityKey === "자립준비청년대상자" && isSelected && (() => {
                    const formData =
                      selfPrepData ??
                      getSelfPreparationPersonInfoFromExtraQualification(extraQualification) ??
                      createDefaultSelfPreparationPersonInfo();
                    return (
                      <SelfPrepInfo
                        data={formData}
                        onDataChange={handleSelfPrepDataChange}
                        isDisabled={isDisabled}
                      />
                    );
                  })()}

                  {option.eligibilityKey === "급여제한여부" && (() => {
                    if (!isSelected) {
                      return null;
                    }
                    // qualRestrictData가 있으면 사용, 없으면 extraQualification에서 가져오기, 둘 다 없으면 기본값 생성
                    let formData = qualRestrictData;
                    if (!formData) {
                      formData = getQualRestrictDataFromExtraQualification(extraQualification);
                    }
                    if (!formData) {
                      // 기본값 생성
                      formData = 급여제한여부.해당없음;
                    }
                    return (
                      <QualRestrictInfo
                        data={formData}
                        onDataChange={handleQualRestrictDataChange}
                        isDisabled={isDisabled}
                      />
                    );
                  })()}

                  {option.eligibilityKey === "당뇨병요양비대상자유형" && (() => {
                    if (!isSelected) {
                      return null;
                    }

                    // 당뇨병요양비대상자유형 옵션 (해당없음 제외)
                    const diabetesTypeOptions = [
                      { value: 당뇨병요양비대상자유형.DMType1, label: `제1형` },
                      { value: 당뇨병요양비대상자유형.DMType2, label: `제2형` },
                    ];

                    return (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="p-3 bg-white border border-gray-200 rounded">
                          <div>
                            {diabetesTypeOptions.map((opt) => (
                              <label
                                key={opt.value}
                                className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                              >
                                <input
                                  type="radio"
                                  name="diabetesCareType"
                                  value={opt.value}
                                  checked={diabetesCareType === opt.value}
                                  onChange={(e) => setDiabetesCareType(parseInt(e.target.value) as 당뇨병요양비대상자유형)}
                                  disabled={isDisabled}
                                  className={`w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 ${isDisabled ? 'bg-gray-50' : ''}`}
                                />
                                <span className="text-sm text-gray-700 select-none">
                                  {opt.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {option.eligibilityKey === "비대면진료대상정보" && (() => {
                    if (!isSelected) {
                      return null;
                    }

                    // 각 필드의 체크 상태 확인 (문자열 "Y"인지 확인)
                    const 섬벽지거주여부 = nonFaceToFaceData?.섬벽지거주여부;
                    const 장애등록여부 = nonFaceToFaceData?.장애등록여부;
                    const 장기요양등급여부 = nonFaceToFaceData?.장기요양등급여부;
                    const 응급취약지거주여부 = (nonFaceToFaceData as any)?.응급취약지거주여부;

                    const is섬벽지Checked = (섬벽지거주여부 as any) === "Y";
                    const is장애Checked = (장애등록여부 as any) === "Y";
                    const is장기요양Checked = (장기요양등급여부 as any) === "Y";
                    const is응급취약지Checked = (응급취약지거주여부 as any) === "Y";

                    return (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="p-3 bg-white border border-gray-200 rounded">
                          <div className="space-y-1">
                            <label
                              className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={is섬벽지Checked}
                                onChange={(e) => updateNonFaceToFaceField('섬벽지거주여부', e.target.checked)}
                                disabled={isDisabled}
                                className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 ${isDisabled ? 'bg-gray-50' : ''}`}
                              />
                              <span className="text-sm text-gray-700 select-none">
                                A (섬벽지)
                              </span>
                            </label>
                            <label
                              className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={is장애Checked}
                                onChange={(e) => updateNonFaceToFaceField('장애등록여부', e.target.checked)}
                                disabled={isDisabled}
                                className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 ${isDisabled ? 'bg-gray-50' : ''}`}
                              />
                              <span className="text-sm text-gray-700 select-none">
                                B (장애등록)
                              </span>
                            </label>
                            <label
                              className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={is장기요양Checked}
                                onChange={(e) => updateNonFaceToFaceField('장기요양등급여부', e.target.checked)}
                                disabled={isDisabled}
                                className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 ${isDisabled ? 'bg-gray-50' : ''}`}
                              />
                              <span className="text-sm text-gray-700 select-none">
                                C (장기요양등급)
                              </span>
                            </label>
                            <label
                              className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={is응급취약지Checked}
                                onChange={(e) => updateNonFaceToFaceField('응급취약지거주여부', e.target.checked)}
                                disabled={isDisabled}
                                className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 ${isDisabled ? 'bg-gray-50' : ''}`}
                              />
                              <span className="text-sm text-gray-700 select-none">
                                D (응급취약지)
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-sm bg-[var(--bg-color)] text-[var(--gray-100)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-color)] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isDisabled}
            className={`px-6 py-2 text-sm rounded transition-colors ${isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-default'
              : 'bg-[var(--main-color)] text-white hover:bg-[var(--main-color)] cursor-pointer'
              }`}
          >
            저장
          </button>
        </div>
      </div>
    </MyPopup>
  );
};

export default AddDisregModal;
