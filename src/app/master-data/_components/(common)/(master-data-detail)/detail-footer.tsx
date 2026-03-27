import { useToastHelpers } from "@/components/ui/toast";
import { MyButton } from "@/components/yjg/my-button";
import { usePrescriptionUserCodeUpsert } from "@/hooks/master-data/use-prescription-user-code-upsert";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { useQueryClient } from "@tanstack/react-query";
import { convertMasterDataDetailToPrescriptionUserCodesUpsertType } from "@/app/master-data/(etc)/master-data-converter";
import { handleMutationError } from "@/lib/error-utils";

interface DetailFooterProps {
  masterDataDetail: MasterDataDetailType | null;
  setMasterDataDetail: (masterDetail: MasterDataDetailType | null) => void;
  originalMasterDataDetail?: MasterDataDetailType | null;
}

export default function DetailFooter({
  masterDataDetail,
  setMasterDataDetail,
  originalMasterDataDetail,
}: DetailFooterProps) {
  const { mutate: upsertPrescriptionUserCode, isPending } =
    usePrescriptionUserCodeUpsert();
  const { success, error, warning } = useToastHelpers();
  const queryClient = useQueryClient();

  const handleRegister = async () => {
    if (masterDataDetail?.userCode === "") {
      warning("사용자코드를 입력해주세요.");
      return;
    }

    if (!masterDataDetail?.applyDate) {
      warning("적용일자를 입력해주세요.");
      return;
    }

    if (!masterDataDetail?.krName) {
      warning("한글명칭을 입력해주세요.");
      return;
    }

    const dataToSend =
      convertMasterDataDetailToPrescriptionUserCodesUpsertType(
        masterDataDetail
      );
    if (!dataToSend) {
      error("데이터 변환 중 오류가 발생했습니다.");
      return;
    }

    try {
      upsertPrescriptionUserCode(dataToSend, {
        onSuccess: () => {
          success(
            `${masterDataDetail.userCodeId ? "수정" : "등록"}되었습니다.`
          );
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === "prescription-user-codes",
          });
        },
        onError: (err) => {
          handleMutationError(err, "DetailFooter.handleRegister", error);
        },
      });
    } catch (err) {
      console.error(
        `${masterDataDetail.userCodeId ? "수정" : "등록"} 중 오류 발생:`,
        err
      );
      error(`${masterDataDetail.userCodeId ? "수정" : "등록"} 중 오류 발생`);
    }
  };

  const handleCancel = () => {
    if (originalMasterDataDetail) {
      setMasterDataDetail(originalMasterDataDetail);
    }
  };

  return (
    <div className="flex flex-row justify-end items-center px-4 py-3">
      {masterDataDetail && masterDataDetail.type && (
        <div className="flex flex-row gap-2">
          <MyButton
            variant="outline"
            className="px-[30px]"
            onClick={handleCancel}
            disabled={isPending}
          >
            취소
          </MyButton>
          <MyButton
            className="px-[30px]"
            onClick={handleRegister}
            disabled={isPending}
          >
            {isPending
              ? `${masterDataDetail.userCodeId ? "수정" : "등록"} 중...`
              : masterDataDetail.userCodeId
                ? "수정"
                : "등록"}
          </MyButton>
        </div>
      )}
    </div>
  );
}
