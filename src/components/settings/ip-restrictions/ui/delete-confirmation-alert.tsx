import React from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";

interface DeleteConfirmationAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLastIp: boolean;
}

export function DeleteConfirmationAlert({
  open,
  onOpenChange,
  onConfirm,
  isLastIp,
}: DeleteConfirmationAlertProps) {
  return (
    <MyPopup
      isOpen={open}
      onCloseAction={() => onOpenChange(false)}
      title="IP 주소 삭제"
      width="400px"
      height="auto"
      fitContent
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            IP 주소를 삭제하시겠습니까?
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isLastIp
              ? "제한없이 모든 IP를 통해서 병원 접속이 허용됩니다."
              : "해당 IP 주소로 접속중인 모든 사용자의 접근이 즉시 차단됩니다."}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <MyButton
            variant="outline"
            className="h-[32px]"
            onClick={() => onOpenChange(false)}
          >
            취소
          </MyButton>
          <MyButton
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-slate-900 text-white hover:bg-slate-800 h-[32px]"
          >
            삭제
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
