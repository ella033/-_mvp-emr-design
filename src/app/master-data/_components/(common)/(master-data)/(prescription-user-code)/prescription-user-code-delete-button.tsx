import { MyButton } from "@/components/yjg/my-button";
import { XIcon } from "lucide-react";
import { usePrescriptionUserCodeDelete } from "@/hooks/master-data/use-prescription-user-code-delete";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useState } from "react";

interface PrescriptionUserCodeDeleteButtonProps {
  id: string;
}

export default function PrescriptionUserCodeDeleteButton({
  id,
}: PrescriptionUserCodeDeleteButtonProps) {
  const { mutate: deletePrescriptionUserCode } =
    usePrescriptionUserCodeDelete();
  const { success, error } = useToastHelpers();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    deletePrescriptionUserCode(id, {
      onSuccess: () => {
        success("삭제 성공");
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "prescription-user-codes",
        });
        setIsOpen(false);
      },
      onError: (err) => {
        error("삭제 실패", err.message);
        console.error("삭제 실패", err);
        setIsOpen(false);
      },
    });
  };

  return (
    <>
      <MyButton variant="danger" size="icon" onClick={() => setIsOpen(true)}>
        <XIcon className="w-[12px] h-[12px]" />
      </MyButton>

      <MyPopupYesNo
        isOpen={isOpen}
        onCloseAction={() => setIsOpen(false)}
        onConfirmAction={handleDelete}
        title="사용자코드 삭제"
        message="선택한 사용자코드를 삭제하시겠습니까?"
        confirmText="삭제"
      />
    </>
  );
}
