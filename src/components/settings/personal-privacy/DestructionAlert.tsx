"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Assuming Textarea exists or use TextareaHTMLAttributes
import { useState } from "react";

interface DestructionAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (reason: string, reasonDetail: string) => void;
  isPending?: boolean;
}

export function DestructionAlert({
  open,
  onOpenChange,
  count,
  onConfirm,
  isPending,
}: DestructionAlertProps) {
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");

  const handleConfirm = () => {
    if (!reason) return;
    if (reason === "기타" && !reasonDetail.trim()) return;
    onConfirm(reason, reasonDetail);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="min-w-[600px] p-6 gap-6">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg font-semibold text-[#292A2D]">
            청구 명세서를 파기하시겠습니까?<br/>
            파기 후 복구할 수 없습니다.
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex flex-col gap-[16px]">
          {/* Summary Box */}
          <div className="flex justify-between items-center px-4 py-3 bg-[#F8F9FA] rounded-md">
            <span className="text-[#495057] font-medium">명세서</span>
            <span className="text-[#212529] font-semibold text-lg">{count}건</span>
          </div>

          {/* Reason Selector */}
          <div className="space-y-4">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full  text-base !h-[40px]">
                <SelectValue placeholder="파기 사유 선택하기" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="보유 기간 경과" className="text-base py-2 h-[40px]">
                  보유 기간 경과
                </SelectItem>
                <SelectItem value="기타" className="text-base py-2 h-[40px]">
                  기타
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Reason Detail Textarea */}
            {(reason === "기타") && (
              <Input
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-[40px] resize-none"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder="파기 사유를 입력하세요."
              />
            )}
          </div>
        </div>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel 
            onClick={() => onOpenChange(false)}
            className="h-[32px] w-[64px]"
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-[#1B1238] hover:bg-[#2c1e55] text-white h-[32px] w-[64px]"
            disabled={!reason || (reason === "기타" && !reasonDetail.trim()) || isPending}
          >
            {isPending ? "처리 중..." : "파기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
