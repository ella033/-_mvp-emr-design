import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { memo } from "react";
import { Box } from "../common-controls";
import { MySelect } from "@/components/yjg/my-select";
import { ITEM_TYPE_OPTIONS } from "@/constants/library-option/item-type-option";
import { RECEIPT_PRINT_LOCATION_OPTIONS } from "@/constants/common/common-option";
import { CodeType } from "@/constants/common/common-enum";
import { CodeTypeLabel } from "@/constants/common/common-enum";

const CODE_TYPE_OPTIONS = [
  { value: CodeType.수가, label: CodeTypeLabel[CodeType.수가] },
  { value: CodeType.준용수가, label: CodeTypeLabel[CodeType.준용수가] },
  { value: CodeType.보험등재약, label: CodeTypeLabel[CodeType.보험등재약] },
  { value: CodeType.원료약조제약, label: CodeTypeLabel[CodeType.원료약조제약] },
  { value: CodeType.보험등재약의일반명, label: CodeTypeLabel[CodeType.보험등재약의일반명] },
  { value: CodeType.치료재료, label: CodeTypeLabel[CodeType.치료재료] },
];

interface PrintLocationItemCodeTypeSettingProps {
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}

const PrintLocationItemCodeTypeSetting = memo(function PrintLocationItemCodeTypeSetting({
  masterDataDetail,
  setMasterDataDetail,
}: PrintLocationItemCodeTypeSettingProps) {
  const isNonCovered = masterDataDetail.prescriptionLibraryId === 0; // 0이면 비급여로 판단한다.

  return (
    <>
      <Box title="영수증 출력" className="min-w-[150px] max-w-[150px]">
        <MySelect
          className="w-[150px]"
          options={RECEIPT_PRINT_LOCATION_OPTIONS}
          value={masterDataDetail.receiptPrintLocation}
          onChange={(value: string | number) => {
            setMasterDataDetail({
              ...masterDataDetail,
              receiptPrintLocation: Number(value),
            });
          }}
        />
      </Box>
      <Box title="항목구분" isWidthFit={true}>
        <MySelect
          className="w-fit"
          options={ITEM_TYPE_OPTIONS}
          value={masterDataDetail.itemType}
          onChange={(value) =>
            setMasterDataDetail({
              ...masterDataDetail,
              itemType: String(value),
            })
          }
        />
      </Box>
      {!isNonCovered && (
        <Box title="코드구분" isWidthFit={true}>
          <MySelect
            className="w-fit"
            options={CODE_TYPE_OPTIONS}
            value={masterDataDetail.codeType}
            onChange={(value) =>
              setMasterDataDetail({
                ...masterDataDetail,
                codeType: Number(value),
              })
            }
          />
        </Box>
      )}
    </>
  );
});

export default PrintLocationItemCodeTypeSetting;