import { MyButton } from "@/components/yjg/my-button";
import MyPopup, { MyPopupMsg } from "@/components/yjg/my-pop-up";
import MySplitPane from "@/components/yjg/my-split-pane";
import DoseConditionTable from "./(dose-condition-setting)/dose-condition-table";
import { useState, useEffect } from "react";
import type {
  DoseConditionType,
  DoseRangeType,
} from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";

interface DoseConditionSettingProps {
  setOpen: (open: boolean) => void;
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}

export default function DoseConditionSetting({
  setOpen,
  masterDataDetail,
  setMasterDataDetail,
}: DoseConditionSettingProps) {
  const [errMsg, setErrMsg] = useState("");
  const [isErrMsgOpen, setIsErrMsgOpen] = useState(false);

  // 로컬 상태로 doseCondition 관리
  const [localDoseConditions, setLocalDoseConditions] = useState<
    DoseConditionType[]
  >([]);

  // selectedMasterDetail에서 초기값 로드
  useEffect(() => {
    const initialConditions =
      masterDataDetail.drugMasterData?.doseCondition || [];
    setLocalDoseConditions([...initialConditions]);
  }, [masterDataDetail.drugMasterData?.doseCondition]);

  const handleClose = () => {
    setOpen(false);
  };

  // 유효성 검사 함수
  const validateDoseRanges = (
    type: number,
    ranges: DoseRangeType[]
  ): boolean => {
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      if (range && range.gte >= range.lt) {
        setErrMsg(
          `${type === 1 ? "체중" : "연령"} 범위 ${i + 1}: 이상 값(${range.gte})이 미만 값(${range.lt})보다 크거나 같습니다.`
        );
        setIsErrMsgOpen(true);
        return false;
      }
    }
    setErrMsg("");
    setIsErrMsgOpen(false);
    return true;
  };

  const handleApply = () => {
    // 모든 doseRanges 유효성 검사
    let isValid = true;

    for (const condition of localDoseConditions) {
      if (condition.doseRanges.length > 0) {
        if (!validateDoseRanges(condition.type, condition.doseRanges)) {
          isValid = false;
          break;
        }
      }
    }

    if (!isValid) {
      return; // 유효하지 않으면 적용하지 않음
    }

    // 로컬 상태를 selectedMasterDetail에 반영
    setMasterDataDetail({
      ...masterDataDetail,
      drugMasterData: {
        ...masterDataDetail.drugMasterData!,
        doseCondition: localDoseConditions,
      },
    });
    setOpen(false);
  };

  // 체중별 데이터 (type=1) - DoseRangeType 배열로 변환
  const weightConditions = localDoseConditions
    .filter((condition) => condition.type === 1)
    .flatMap((condition) => condition.doseRanges);

  // 연령별 데이터 (type=2) - DoseRangeType 배열로 변환
  const ageConditions = localDoseConditions
    .filter((condition) => condition.type === 2)
    .flatMap((condition) => condition.doseRanges);

  const handleUpdateConditions = (type: number, newRanges: DoseRangeType[]) => {
    const otherConditions = localDoseConditions.filter(
      (condition) => condition.type !== type
    );

    // 새로운 DoseConditionType 생성
    const newCondition: DoseConditionType = {
      type,
      doseRanges: newRanges,
    };

    const updatedConditions = [...otherConditions, newCondition];
    setLocalDoseConditions(updatedConditions);
  };

  return (
    <MyPopup
      isOpen={true}
      closeOnOutsideClick={false}
      onCloseAction={handleClose}
      title="연령/체중별 설정"
      width="800px"
      height="800px"
      minWidth="600px"
      minHeight="600px"
    >
      <div className="flex flex-col gap-2 w-full h-full">
        <MySplitPane
          splitPaneId="dose-condition-setting"
          initialRatios={[0.5, 0.5]}
          panes={[
            <DoseConditionTable
              conditions={ageConditions}
              onUpdateConditions={(ranges) => handleUpdateConditions(2, ranges)}
              type={2}
            />,
            <DoseConditionTable
              conditions={weightConditions}
              onUpdateConditions={(ranges) => handleUpdateConditions(1, ranges)}
              type={1}
            />,
          ]}
        />
        <div className="flex justify-end gap-2 border-t p-2">
          <MyButton variant="outline" onClick={handleClose}>
            취소
          </MyButton>
          <MyButton onClick={handleApply}>적용</MyButton>
        </div>
        <MyPopupMsg
          isOpen={isErrMsgOpen}
          onCloseAction={() => setIsErrMsgOpen(false)}
          title="연령/체중별 설정 오류"
          msgType="error"
          message={errMsg}
          confirmText="확인"
        />
      </div>
    </MyPopup>
  );
}
