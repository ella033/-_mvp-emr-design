import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon } from "lucide-react";
import InputDate from "@/components/ui/input-date";
import ListTimePicker from "@/components/ui/list-time-picker";
import { useSenderList } from "@/hooks/crm/use-sender-list";
import { formatPhoneNumber } from "@/lib/patient-utils";
import type { SendSettingsData, SendSettingsHandlers } from "../../page";

interface SendSettingsProps {
  sendSettings: SendSettingsData;
  sendSettingsHandlers: SendSettingsHandlers;
}

export default function SendSettings({
  sendSettings,
  sendSettingsHandlers,
}: SendSettingsProps) {
  const { isReserved, sendDate, sendTime, senderNumber } = sendSettings;
  const { setIsReserved, setSendDate, setSendTime, setSenderNumber } =
    sendSettingsHandlers;

  // 발송번호 목록 조회
  const { data: senderData } = useSenderList();

  // senderData가 로드되고, 현재 senderNumber가 없을 때 대표번호를 기본값으로 설정
  useEffect(() => {
    if (senderData && !senderNumber) {
      const mainSender = senderData.find((sender) => sender.isMain);
      if (mainSender) {
        setSenderNumber(mainSender.senderNumber);
      }
    }
  }, [senderData, senderNumber, setSenderNumber]);

  return (
    <div className="bg-[var(--bg-1)] rounded-lg p-4 space-y-4">
      <h2 className="text-base font-semibold">발송 정보</h2>

      {/* 발송 유형 */}
      <div className="space-y-3">
        <Label>발송 유형</Label>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setIsReserved(false)}
            className={`flex-1 border-[var(--border-2)] text-[var(--gray-100)] hover:border-[var(--main-color)] hover:text-[var(--main-color)] ${
              !isReserved
                ? "border-[var(--main-color)] text-[var(--main-color)]"
                : ""
            }`}
          >
            즉시 발송
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsReserved(true)}
            className={`flex-1 border-[var(--border-2)] text-[var(--gray-100)] hover:border-[var(--main-color)] hover:text-[var(--main-color)] ${
              isReserved
                ? "border-[var(--main-color)] text-[var(--main-color)]"
                : ""
            }`}
          >
            예약 발송
          </Button>
        </div>
        <p className="text-sm text-[var(--gray-400)]">
          <InfoIcon className="h-5 w-5 inline mr-1" /> 오전 8시 이전, 오후 9시
          이후에는 즉시 발송을 할 수 없습니다.
        </p>
      </div>

      {/* 발송 날짜 및 시간 */}
      {isReserved && (
        <div className="flex gap-4">
          {/* 발송 날짜 */}
          <div className="flex-1 space-y-2">
            <Label>발송 날짜</Label>
            <InputDate value={sendDate} onChange={setSendDate} />
          </div>

          {/* 발송 시간 */}
          <div className="flex-1 space-y-2">
            <Label>발송 시간</Label>
            <ListTimePicker
              value={sendTime}
              onChange={setSendTime}
              fromTime="08:00"
              toTime="21:00"
              timeDuration={30}
              placeholder="시간 선택"
              dropdownPosition="top"
            />
          </div>
        </div>
      )}

      {/* 발송 번호 */}
      <div className="space-y-2">
        <Label>발송 번호</Label>
        <Select value={senderNumber} onValueChange={setSenderNumber}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="발송번호를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {senderData?.map((sender) => (
              <SelectItem key={sender.senderNumber} value={sender.senderNumber}>
                {formatPhoneNumber(sender.senderNumber)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
