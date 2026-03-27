import { MySwitch } from "@/components/yjg/my-switch";
import type {
  PrescriptionSubType,
  PrescriptionType,
} from "@/constants/master-data-enum";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { getDetailHeaderText } from "@/app/master-data/(etc)/master-data-converter";
import { getInitialMasterDataDetail } from "@/app/master-data/(etc)/master-data-converter";
import { MyButton } from "@/components/yjg/my-button";
interface DetailHeaderProps {
  type: PrescriptionType;
  subType: PrescriptionSubType | null;
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}

export default function DetailHeader({
  type,
  subType,
  masterDataDetail,
  setMasterDataDetail,
}: DetailHeaderProps) {
  const handleNewRegister = () => {
    const initialMasterDataDetail = getInitialMasterDataDetail(
      type,
      subType,
      0
    );
    setMasterDataDetail(initialMasterDataDetail);
  };

  return (
    <div className="flex flex-row justify-between items-center px-2 py-1">
      <div className="text-base font-bold">
        {getDetailHeaderText(type, subType)}
      </div>
      <div className="flex flex-row gap-4">
        <MyButton onClick={handleNewRegister}>
          비급여자료 생성
        </MyButton>
        {masterDataDetail && (
          <label className="flex flex-row items-center gap-2">
            <span className="text-sm">사용여부</span>
            <MySwitch
              checked={masterDataDetail?.isActive}
              onCheckedChange={(checked) => {
                setMasterDataDetail({
                  ...masterDataDetail,
                  isActive: checked,
                });
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
