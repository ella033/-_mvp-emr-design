"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CircleMinus } from "lucide-react";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import Image from "next/image";
import { useSendHistoryDetail } from "@/hooks/crm/use-send-history-detail";
import { useMessageContent } from "@/hooks/crm/use-message-content";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  CrmSendType,
  CrmMessageType,
  CrmMessageRegStatus,
} from "@/constants/crm-enums";
import { formatPhoneNumber } from "@/lib/patient-utils";
import MessagePreview from "@/app/crm/_components/message/message-preview";
import type { ImageFile } from "@/types/crm/message-template/message-types";
import { FileService } from "@/services/file-service";
import { useCancelMessage } from "@/hooks/crm/use-send-message";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";

interface SendReservedDetailProps {
  sendHistoryId: number;
}

export const SendReservedDetail = ({
  sendHistoryId,
}: SendReservedDetailProps) => {
  const { success, error: showError } = useToastHelpers();
  const queryClient = useQueryClient();

  // 발송 내역 상세 조회
  const { data: detailData, isLoading: isLoadingDetail } =
    useSendHistoryDetail(sendHistoryId);

  // 예약 취소 팝업 상태 관리
  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

  // 예약 취소 mutation
  const cancelMessageMutation = useCancelMessage({
    onSuccess: () => {
      success("예약 발송이 취소되었습니다");
      setIsCancelPopupOpen(false);
      setCancelTargetId(null);
      queryClient.invalidateQueries({
        queryKey: ["crm-send-history-detail", sendHistoryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-send-reserved-history"],
      });
    },
    onError: () => {
      showError("예약 발송 취소가 실패하였습니다");
      setIsCancelPopupOpen(false);
    },
  });

  // 선택된 메시지 ubmsId 상태 관리
  const [messageUbmsId, setMessageUbmsId] = useState<number | undefined>(
    undefined
  );
  // 선택된 수신자 ID 상태 관리 (ubmsId가 없거나 0인 경우)
  const [selectedRecipientId, setSelectedRecipientId] = useState<
    number | undefined
  >(undefined);

  // 처음 로딩 시 첫 번째 수신자의 ubmsId로 초기화
  useEffect(() => {
    if (detailData?.recipients && detailData.recipients.length > 0) {
      const firstRecipient = detailData.recipients[0];
      if (!firstRecipient) return;

      if (firstRecipient.ubmsId && firstRecipient.ubmsId > 0) {
        setMessageUbmsId(firstRecipient.ubmsId);
        setSelectedRecipientId(undefined);
      } else {
        setMessageUbmsId(undefined);
        setSelectedRecipientId(firstRecipient.id);
      }
    }
  }, [detailData]);

  // messageUbmsId가 있고 0이 아닐 때만 useMessageContent 호출
  const shouldFetchMessageContent =
    messageUbmsId !== undefined && messageUbmsId > 0;
  const { data: messageContent, isLoading: isLoadingMessage } =
    useMessageContent(shouldFetchMessageContent ? messageUbmsId : undefined);

  // base64 이미지 배열을 ImageFile[] 형식으로 변환 (useMessageContent에서 가져온 경우)
  const convertedImagesFromContent: ImageFile[] = useMemo(() => {
    if (!messageContent?.imageFile || messageContent.imageFile.length === 0) {
      return [];
    }
    return messageContent.imageFile.map((base64Image) => ({
      file: new File([], ""), // 타입 호환성을 위한 더미 File 객체
      preview: `data:image/png;base64,${base64Image}`,
    }));
  }, [messageContent?.imageFile]);

  // messageImageFileinfo를 ImageFile[] 형식으로 변환 (등록 실패한 경우)
  const [convertedImagesFromFileinfo, setConvertedImagesFromFileinfo] =
    useState<ImageFile[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // 선택된 수신자 찾기 (messageUbmsId가 없거나 0인 경우)
  const selectedRecipient = useMemo(() => {
    if (
      shouldFetchMessageContent ||
      !detailData?.recipients ||
      !selectedRecipientId
    ) {
      return null;
    }
    // 선택된 수신자 ID로 찾기
    return detailData.recipients.find((r) => r.id === selectedRecipientId);
  }, [detailData, selectedRecipientId, shouldFetchMessageContent]);

  useEffect(() => {
    const loadImagesFromFileinfo = async () => {
      // messageUbmsId가 없거나 0인 경우에만 실행
      if (shouldFetchMessageContent) {
        setConvertedImagesFromFileinfo([]);
        return;
      }

      if (
        !selectedRecipient?.messageImageFileinfo ||
        selectedRecipient.messageImageFileinfo.length === 0
      ) {
        setConvertedImagesFromFileinfo([]);
        return;
      }

      setIsLoadingImages(true);
      try {
        const imagePromises = selectedRecipient.messageImageFileinfo.map(
          async (fileInfo) => {
            const response = await FileService.downloadFileV2(fileInfo.uuid);
            const file = new File(
              [response.blob],
              response.filename || `image-${fileInfo.id}.png`,
              { type: response.contentType || response.blob.type }
            );
            const preview = URL.createObjectURL(response.blob);
            return { file, preview };
          }
        );
        const images = await Promise.all(imagePromises);
        setConvertedImagesFromFileinfo(images);
      } catch (error) {
        console.error("이미지 다운로드 실패:", error);
        setConvertedImagesFromFileinfo([]);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImagesFromFileinfo();
  }, [selectedRecipient, shouldFetchMessageContent]);

  // 사용할 이미지 배열 결정
  const convertedImages = shouldFetchMessageContent
    ? convertedImagesFromContent
    : convertedImagesFromFileinfo;

  // 예약 취소 핸들러
  const handleCancel = () => {
    if (!detailData) return;
    setCancelTargetId(detailData.id);
    setIsCancelPopupOpen(true);
  };

  // 발송 경로 라벨
  const getSendTypeLabel = (sendType: CrmSendType): string => {
    const sendTypeMap = {
      [CrmSendType.자동발송]: "자동발송",
      [CrmSendType.수동발송]: "수동발송",
      [CrmSendType.진료실발송]: "진료실",
      [CrmSendType.접수실발송]: "접수실",
    };
    return sendTypeMap[sendType] || "-";
  };

  // 발송 일시 포맷
  const formatSendDateTime = (dateTime: string): string => {
    try {
      const date = new Date(dateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");

      const period = hours < 12 ? "오전" : "오후";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      return `${year}-${month}-${day} ${period} ${displayHours}:${minutes}`;
    } catch (error) {
      return dateTime;
    }
  };

  // 상태 배지 생성 함수
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      예약: {
        text: "예약",
        className: "bg-[var(--blue-1)] text-[var(--blue-2)] border-none",
        icon: Clock,
      },
      취소: {
        text: "취소",
        className: "bg-[var(--gray-4)] text-[var(--gray-600)] border-none",
        icon: CircleMinus,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge
        className={cn(
          "px-2 py-0.5 text-xs font-normal flex items-center gap-1",
          config.className
        )}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  // 메시지 서브 타입 배지 생성 함수
  const getMessageSubTypeBadge = (messageSubTypeName?: string) => {
    if (!messageSubTypeName) return null;

    const subTypeConfig = {
      MMS: {
        bgColor: "#FFEEED",
        textColor: "var(--color-picker-Red-1)",
      },
      SMS: {
        bgColor: "var(--blue-1)",
        textColor: "var(--info)",
      },
      LMS: {
        bgColor: "var(--purple-1)",
        textColor: "var(--purple-2)",
      },
    };

    const config =
      subTypeConfig[messageSubTypeName as keyof typeof subTypeConfig];
    if (!config) return null;

    return (
      <Badge
        className="px-2 py-0.5 text-xs font-normal border-none"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
        }}
      >
        {messageSubTypeName}
      </Badge>
    );
  };

  // 수신자 요약 정보 생성
  const recipientSummary = useMemo(() => {
    if (!detailData?.recipients || detailData.recipients.length === 0)
      return "";
    const firstRecipient = detailData.recipients[0];
    if (!firstRecipient) return "";
    const totalCount = detailData.recipients.length;
    if (totalCount === 1) {
      return firstRecipient.recipientName;
    }
    return `${firstRecipient.recipientName} 외 ${totalCount - 1}명`;
  }, [detailData]);

  // 예약발송/발송취소 건수 계산
  const { reservedCount, cancelledCount } = useMemo(() => {
    if (!detailData?.recipients) return { reservedCount: 0, cancelledCount: 0 };
    const reserved = detailData.recipients.filter(
      (r) => r.status === CrmMessageRegStatus.예약발송
    ).length;
    const cancelled = detailData.recipients.filter(
      (r) => r.status === CrmMessageRegStatus.발송취소
    ).length;
    return { reservedCount: reserved, cancelledCount: cancelled };
  }, [detailData]);

  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Label>로딩 중...</Label>
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Label>발송 내역을 찾을 수 없습니다.</Label>
      </div>
    );
  }

  const messageTypeLabel =
    detailData.messageType === CrmMessageType.문자 ? "문자" : "알림톡";

  return (
    <div
      className="bg-white flex gap-6 h-full px-4 pb-4 overflow-hidden"
      data-testid="crm-history-reserved-detail"
    >
      {/* 좌측: 상단 요약 영역 + 하단 수신자 리스트 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 제목과 예약 취소 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--gray-100)]">
            {recipientSummary}
          </h2>
          {detailData.canCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelMessageMutation.isPending}
            >
              예약 취소
            </Button>
          )}
        </div>
        {/* 상단 요약 영역 */}
        <div className="px-4 py-4 border border-[var(--bg-5)] rounded-md">
          {/* 요약 정보 */}
          <div className="grid grid-cols-6 gap-6">
            <div>
              <div className="text-xs text-[var(--gray-200)] mb-1.5 font-normal">
                발송 경로
              </div>
              <div className="text-sm text-[var(--gray-100)] font-bold">
                {getSendTypeLabel(detailData.sendType)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--gray-200)] mb-1.5 font-normal">
                등록 일시
              </div>
              <div className="text-sm text-[var(--gray-100)] font-bold">
                {formatSendDateTime(detailData.createDateTime)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--gray-200)] mb-1.5 font-normal">
                발송 일시
              </div>
              <div className="text-sm text-[var(--gray-100)] font-bold">
                {formatSendDateTime(detailData.sendDateTime)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--gray-200)] mb-1.5 font-normal">
                발송 수단
              </div>
              <div className="text-sm text-[var(--gray-100)] font-bold">
                {messageTypeLabel}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--gray-200)] mb-1.5 font-normal">
                발송 번호
              </div>
              <div className="text-sm text-[var(--gray-100)] font-bold">
                {detailData.senderNumber}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--gray-200)] mb-1.5 font-normal flex items-center">
                사용 예정 포인트
                <MyTooltip
                  side="bottom"
                  align="start"
                  content={
                    <div className="text-sm max-w-[420px] px-2 py-1 whitespace-pre-wrap">
                      예약된 메시지의 경우 실제 발송 바이트 수는 달라질 수
                      있으며, 이에 따라 사용포인트가 변경될 수 있습니다.
                    </div>
                  }
                >
                  <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                </MyTooltip>
              </div>
              <div className="text-sm text-[var(--gray-100)] font-bold">
                {detailData.status === CrmMessageRegStatus.발송취소
                  ? "0P"
                  : `${detailData.points}P`}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 수신자 리스트 */}
        <div className="flex-1 flex flex-col overflow-hidden border border-[var(--border-1)] rounded-lg mt-4">
          {/* 통계 정보 */}
          <div className="px-4 pt-4 flex items-center justify-between">
            <div className="text-sm font-medium text-[var(--gray-100)]">
              총{" "}
              <span className="font-bold">{detailData.recipients.length}</span>
              명
            </div>
            <div className="text-sm font-medium">
              {reservedCount > 0 ? (
                <span className="text-[var(--gray-400)]">
                  예약 {reservedCount}
                </span>
              ) : cancelledCount > 0 ? (
                <span className="text-[var(--gray-400)]">
                  취소 {cancelledCount}
                </span>
              ) : null}
            </div>
          </div>

          {/* 수신자 테이블 */}
          <div className="px-4 py-3 flex-1 overflow-auto">
            <Table className="border-separate border-spacing-0 table-fixed w-full">
              <TableHeader className="bg-[var(--bg-2)] sticky top-0 z-10">
                <TableRow className="border-none hover:bg-transparent h-10">
                  <TableHead className="border-none text-sm font-medium text-[var(--gray-200)] align-middle w-[5%] rounded-tl-lg">
                    번호
                  </TableHead>
                  <TableHead className="border-none text-sm font-medium text-[var(--gray-200)] align-middle w-[10%]">
                    메세지 유형
                  </TableHead>
                  <TableHead className="border-none text-sm font-medium text-[var(--gray-200)] align-middle w-[15%]">
                    수신자
                  </TableHead>
                  <TableHead className="border-none text-sm font-medium text-[var(--gray-200)] align-middle w-[15%]">
                    전화번호
                  </TableHead>
                  <TableHead className="border-none text-sm font-medium text-[var(--gray-200)] align-middle w-[10%]">
                    상태
                  </TableHead>
                  <TableHead className="border-none text-sm font-medium text-[var(--gray-200)] align-middle w-[15%] rounded-tr-lg">
                    <div className="flex items-center">
                      <span>사용 예정 포인트</span>
                      <MyTooltip
                        side="bottom"
                        align="start"
                        content={
                          <div className="text-sm max-w-[420px] px-2 py-1 whitespace-pre-wrap">
                            예약된 메시지의 경우 실제 발송 바이트 수는 달라질 수
                            있으며, 이에 따라 사용포인트가 변경될 수 있습니다.
                          </div>
                        }
                      >
                        <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                      </MyTooltip>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailData.recipients.map((recipient, index) => {
                  const statusText =
                    recipient.status === CrmMessageRegStatus.예약발송
                      ? "예약"
                      : recipient.status === CrmMessageRegStatus.발송취소
                        ? "취소"
                        : "";
                  const isSelected = shouldFetchMessageContent
                    ? recipient.ubmsId === messageUbmsId
                    : recipient.id === selectedRecipientId;

                  const handleRecipientClick = () => {
                    if (recipient.ubmsId && recipient.ubmsId > 0) {
                      setMessageUbmsId(recipient.ubmsId);
                      setSelectedRecipientId(undefined);
                    } else {
                      // ubmsId가 없거나 0인 경우 해당 수신자의 sendMessage 사용
                      setMessageUbmsId(undefined);
                      setSelectedRecipientId(recipient.id);
                    }
                  };

                  return (
                    <TableRow
                      key={recipient.id}
                      onClick={handleRecipientClick}
                      className={cn(
                        "border-none h-10 cursor-pointer",
                        isSelected
                          ? "bg-[var(--bg-1)]"
                          : "hover:bg-[var(--bg-1)]"
                      )}
                    >
                      <TableCell className="border-none text-sm font-normal text-[var(--gray-300)] align-middle">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-none text-sm font-normal text-[var(--gray-300)] align-middle">
                        {getMessageSubTypeBadge(recipient.messageSubTypeName)}
                      </TableCell>
                      <TableCell className="border-none text-sm font-normal text-[var(--gray-300)] align-middle">
                        {recipient.recipientName}
                      </TableCell>
                      <TableCell className="border-none text-sm font-normal text-[var(--gray-300)] align-middle">
                        {formatPhoneNumber(recipient.recipientPhone)}
                      </TableCell>
                      <TableCell className="border-none text-sm font-normal text-[var(--gray-300)] align-middle">
                        {getStatusBadge(statusText)}
                      </TableCell>
                      <TableCell className="border-none text-sm font-normal text-[var(--gray-300)] align-middle">
                        {recipient.status === CrmMessageRegStatus.발송취소
                          ? "0P"
                          : `${recipient.points}P`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 우측: 미리보기 영역 */}
      {(() => {
        // messageUbmsId가 있고 0이 아닌 경우: useMessageContent 사용
        if (shouldFetchMessageContent) {
          if (isLoadingMessage || !messageContent) {
            return (
              <div className="w-[400px] h-full flex flex-col border border-[var(--border-1)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-1)]">
                  <h4
                    className={cn(
                      "font-bold leading-[125%]",
                      "text-[13px] text-[var(--gray-100)]"
                    )}
                  >
                    미리보기
                  </h4>
                </div>
                <div className="flex-1 overflow-auto bg-[var(--bg-1)]">
                  {isLoadingMessage ? (
                    <div className="flex items-center justify-center h-full p-4">
                      <Label className="text-sm text-[var(--gray-200)]">
                        로딩 중...
                      </Label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full p-4">
                      <Label className="text-sm text-[var(--gray-200)]">
                        메시지 내용을 불러올 수 없습니다.
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div className="w-[400px] h-full">
              <MessagePreview
                previewMessage={messageContent.content}
                images={convertedImages}
                isAdDisplayed={false}
                containerClassName="h-full"
                titleExtra={
                  <MyTooltip
                    side="bottom"
                    align="start"
                    content={
                      <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                        이미지 미리보기는 90일까지 지원됩니다.
                      </div>
                    }
                  >
                    <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                  </MyTooltip>
                }
              />
            </div>
          );
        }

        // messageUbmsId가 없거나 0인 경우: detailData의 sendMessage와 messageImageFileinfo 사용
        const previewMessage = selectedRecipient?.sendMessage || "";

        if (isLoadingImages) {
          return (
            <div className="w-[400px] h-full flex flex-col border border-[var(--border-1)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <div className="flex items-center">
                  <h4
                    className={cn(
                      "font-bold leading-[125%]",
                      "text-[13px] text-[var(--gray-100)]"
                    )}
                  >
                    미리보기
                  </h4>
                  <MyTooltip
                    side="bottom"
                    align="start"
                    content={
                      <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                        이미지 미리보기는 90일까지 지원됩니다.
                      </div>
                    }
                  >
                    <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                  </MyTooltip>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[var(--bg-1)]">
                <div className="flex items-center justify-center h-full p-4">
                  <Label className="text-sm text-[var(--gray-200)]">
                    로딩 중...
                  </Label>
                </div>
              </div>
            </div>
          );
        }

        if (!previewMessage && convertedImages.length === 0) {
          return (
            <div className="w-[400px] h-full flex flex-col border border-[var(--border-1)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-1)]">
                <div className="flex items-center">
                  <h4
                    className={cn(
                      "font-bold leading-[125%]",
                      "text-[13px] text-[var(--gray-100)]"
                    )}
                  >
                    미리보기
                  </h4>
                  <MyTooltip
                    side="bottom"
                    align="start"
                    content={
                      <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                        이미지 미리보기는 90일까지 지원됩니다.
                      </div>
                    }
                  >
                    <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                  </MyTooltip>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[var(--bg-1)]">
                <div className="flex items-center justify-center h-full p-4">
                  <Label className="text-sm text-[var(--gray-200)]">
                    메시지 내용을 불러올 수 없습니다.
                  </Label>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="w-[400px] h-full">
            <MessagePreview
              previewMessage={previewMessage}
              images={convertedImages}
              isAdDisplayed={false}
              containerClassName="h-full"
              titleExtra={
                <MyTooltip
                  side="bottom"
                  align="start"
                  content={
                    <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                      이미지 미리보기는 90일까지 지원됩니다.
                    </div>
                  }
                >
                  <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                </MyTooltip>
              }
            />
          </div>
        );
      })()}

      {/* 예약 취소 확인 팝업 */}
      <MyPopupYesNo
        isOpen={isCancelPopupOpen}
        onCloseAction={() => {
          setIsCancelPopupOpen(false);
          setCancelTargetId(null);
        }}
        onConfirmAction={() => {
          if (cancelTargetId !== null) {
            cancelMessageMutation.mutate(cancelTargetId);
          }
        }}
        title="예약발송을 취소하시겠습니까?"
        message="취소 시 고객에게 메시지가 발송되지 않습니다. 취소된 예약은 복구할 수 없습니다."
        confirmText="예약 취소"
        cancelText="취소"
      />
    </div>
  );
};
