"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import MySplitPane from "@/components/yjg/my-split-pane";
import { useSendEventsList } from "@/hooks/crm/use-send-events-list";
import { useSendEventDetail } from "@/hooks/crm/use-send-event-detail";
import {
  CrmMessageType,
  CrmEventType,
  CrmMessageSubType,
  CrmEventSendTimeType,
} from "@/constants/crm-enums";
import { useCreateSendEvent } from "@/hooks/crm/use-create-send-event";
import { useUpdateSendEvent } from "@/hooks/crm/use-update-send-event";
import { useDeleteSendEvent } from "@/hooks/crm/use-delete-send-event";
import { useToastHelpers } from "@/components/ui/toast";
import type {
  CreateCrmSendEventDto,
  UpdateCrmSendEventDto,
} from "@/types/crm/send-events/crm-send-events-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import SendMessageForm from "../_components/message/send-message-form";
import type { MessageData } from "@/types/crm/message-template/message-types";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import type { AppointmentTypes } from "@/types/appointments/appointment-types";
import { useAppointmentRooms } from "@/hooks/api/use-appointment-rooms";
import { useSenderList } from "@/hooks/crm/use-sender-list";
import { formatPhoneNumber } from "@/lib/patient-utils";
import { X, CircleAlert } from "lucide-react";
import ListTimePicker from "@/components/ui/list-time-picker";
import { MySwitch } from "@/components/yjg/my-switch";
import { ButtonGroup } from "@/components/ui/button-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileService } from "@/services/file-service";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";

const EventSendPage = () => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [appointmentTypeIds, setAppointmentTypeIds] = useState<number[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypes[]>(
    []
  );
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [appointmentRoomIds, setAppointmentRoomIds] = useState<number[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [senderNumber, setSenderNumber] = useState<string>("");
  const [sendTimeType, setSendTimeType] = useState<string>("");

  // 내원전안내 관련 상태
  const [daysBeforeAppointment, setDaysBeforeAppointment] =
    useState<string>("");
  const [excludeSatdays, setExcludeSatdays] = useState<boolean>(false);
  const [excludeSundays, setExcludeSundays] = useState<boolean>(false);
  const [excludeHolidays, setExcludeHolidays] = useState<boolean>(false);

  // 내원후안내 관련 상태
  const [daysAfterVisit, setDaysAfterVisit] = useState<string>("");
  const [visitTimeDropdown, setVisitTimeDropdown] = useState<
    "days" | "weeks" | "months"
  >("days");

  // 발송 시간 상태
  const [sendTime, setSendTime] = useState<string>("");

  // 처방 정보 검색용 ref
  const actionRowRef = useRef<HTMLDivElement>(null);

  // 처방 정보 상태
  const [prescriptionClaimCodes, setPrescriptionClaimCodes] = useState<
    { claimCode: string; name: string }[]
  >([]);

  // Validation 상태
  const [validationErrors, setValidationErrors] = useState<{
    eventName?: string;
  }>({});

  // 예약실 목록 조회
  const { data: appointmentRooms = [], isLoading: isLoadingRooms } =
    useAppointmentRooms();

  // 발송번호 목록 조회
  const { data: senderData = [] } = useSenderList();

  // senderData가 로드되고, 현재 senderNumber가 없을 때 대표번호를 기본값으로 설정
  useEffect(() => {
    if (senderData && !senderNumber) {
      const mainSender = senderData.find((sender) => sender.isMain);
      if (mainSender) {
        setSenderNumber(mainSender.senderNumber);
      }
    }
  }, [senderData, senderNumber]);

  // API에서 이벤트 발송 조건 목록 조회
  const { data: eventSendData = [], isLoading, error } = useSendEventsList();

  // 선택된 이벤트 상세 조회
  const { data: selectedEventDetail, isLoading: isLoadingDetail } =
    useSendEventDetail(selectedEventId || 0);

  // 선택된 이벤트 데이터로 폼 초기화
  useEffect(() => {
    if (selectedEventDetail) {
      setEventName(selectedEventDetail.eventName || "");
      setSelectedEventType(String(selectedEventDetail.eventType) || "");
      setSenderNumber(selectedEventDetail.senderNumber || "");

      // messageImageFileinfo가 있으면 파일 다운로드
      const loadImages = async () => {
        let images: { file: File; preview: string }[] = [];

        if (
          selectedEventDetail.messageImageFileinfo &&
          selectedEventDetail.messageImageFileinfo.length > 0
        ) {
          try {
            const imagePromises = selectedEventDetail.messageImageFileinfo.map(
              async (fileInfo) => {
                const response = await FileService.downloadFileV2(
                  fileInfo.uuid
                );

                // Blob을 File 객체로 변환
                const file = new File(
                  [response.blob],
                  response.filename || `image-${fileInfo.id}.png`,
                  { type: response.contentType || response.blob.type }
                );

                // Preview URL 생성
                const preview = URL.createObjectURL(response.blob);

                return { file, preview };
              }
            );

            images = await Promise.all(imagePromises);
          } catch (error) {
            console.error("이미지 다운로드 실패:", error);
            toastHelpers.error("첨부 이미지를 불러오는데 실패하였습니다.");
          }
        }

        setMessageData({
          messageType: selectedEventDetail.messageType || CrmMessageType.문자,
          messageContent: selectedEventDetail.messageContent || "",
          messageSubType:
            selectedEventDetail.messageSubType || CrmMessageSubType.SMS,
          isAdDisplayed: selectedEventDetail.isAdDisplayed || false,
          messageImageFileinfo: selectedEventDetail.messageImageFileinfo,
          images: images,
        });
      };

      loadImages();

      // 예약실 및 예약 유형 설정
      setAppointmentRoomIds(selectedEventDetail.appointmentRoomIds || []);
      setAppointmentTypeIds(selectedEventDetail.appointmentTypeIds || []);

      // 발송 시점 설정
      if (selectedEventDetail.sendTimeType) {
        setSendTimeType(String(selectedEventDetail.sendTimeType));
      }

      // sendTimeDetail 설정
      if (selectedEventDetail.sendTimeDetail) {
        const detail = selectedEventDetail.sendTimeDetail;
        if (detail.timing) {
          if (selectedEventDetail.eventType === CrmEventType.내원전안내) {
            setDaysBeforeAppointment(String(detail.timing.value));
          } else if (
            selectedEventDetail.eventType === CrmEventType.내원후안내
          ) {
            setDaysAfterVisit(String(detail.timing.value));
            setVisitTimeDropdown(detail.timing.unit);
          }
        }
        if (detail.preSendDays) {
          setExcludeSatdays(detail.preSendDays.includes("sat"));
          setExcludeSundays(detail.preSendDays.includes("sun"));
          setExcludeHolidays(detail.preSendDays.includes("holi"));
        }
        if (detail.sendTime) {
          setSendTime(detail.sendTime);
        }
      }

      // sendConditions 설정
      if (selectedEventDetail.sendConditions) {
        const conditions = selectedEventDetail.sendConditions;
        setSelectedGender(conditions.gender || "");
        setSelectedBirthYearType(conditions.birthYear || "");
        if (conditions.age) {
          setAgeMin(String(conditions.age.min));
          setAgeMax(String(conditions.age.max));
          setAgeMode(conditions.age.mode);
        } else {
          setAgeMin("");
          setAgeMax("");
          setAgeMode("include");
        }
        if (conditions.claimCodes && conditions.claimCodes.length > 0) {
          setPrescriptionClaimCodes(
            conditions.claimCodes.map((code) => ({
              claimCode: code,
              name: code,
            }))
          );
        } else {
          setPrescriptionClaimCodes([]);
        }
      } else {
        // sendConditions가 없는 경우 초기화
        setSelectedGender("");
        setSelectedBirthYearType("");
        setAgeMin("");
        setAgeMax("");
        setAgeMode("include");
        setPrescriptionClaimCodes([]);
      }
    }
  }, [selectedEventDetail]);

  // 예약 유형 목록 조회
  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      try {
        const types = await AppointmentTypesService.getAppointmentTypes();
        setAppointmentTypes(types);
      } catch (error) {
        console.error("예약 유형 조회 실패:", error);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchAppointmentTypes();
  }, []);

  // 메시지 데이터 상태
  const [messageData, setMessageData] = useState<MessageData>({
    messageType: CrmMessageType.문자,
    messageContent: "",
    messageSubType: CrmMessageSubType.SMS,
    isAdDisplayed: false,
    images: [],
  });

  // 성별 선택 상태
  const [selectedGender, setSelectedGender] = useState<string>("");

  // 출생연도 선택 상태
  const [selectedBirthYearType, setSelectedBirthYearType] =
    useState<string>("");

  // 나이 조건 상태
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [ageMode, setAgeMode] = useState<"include" | "exclude">("include");

  const headerCellStyle =
    "border-none text-sm font-medium text-[var(--gray-200)] align-middle";
  const columnCellStyle =
    "border-none text-sm font-normal text-[var(--gray-300)] align-middle";
  const tableRowStyle = "border-none hover:bg-transparent h-8";

  const handleItemSelect = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // 테이블 행 클릭 핸들러
  const handleRowClick = (itemId: number) => {
    setSelectedEventId(itemId);
    setShowDetailPanel(true);
  };

  // isActive 토글 핸들러
  const handleToggleActive = (itemId: number, isActive: boolean) => {
    updateEventMutation.mutate({
      id: itemId,
      request: {
        isActive,
      },
    });
  };

  // 새 이벤트 추가 버튼 클릭 핸들러
  const handleAddNewEvent = () => {
    setSelectedEventId(null);
    setShowDetailPanel(true);
    // 폼 초기화
    setEventName("");
    setSelectedEventType("");
    setAppointmentTypeIds([]);
    setAppointmentRoomIds([]);
    setSenderNumber("");
    setSendTimeType("");
    setDaysBeforeAppointment("");
    setDaysAfterVisit("");
    setVisitTimeDropdown("days");
    setSendTime("");
    setExcludeSatdays(false);
    setExcludeSundays(false);
    setExcludeHolidays(false);
    setMessageData({
      messageType: CrmMessageType.문자,
      messageContent: "",
      messageSubType: CrmMessageSubType.SMS,
      isAdDisplayed: false,
      messageImageFileinfo: undefined,
      images: [],
    });
    setValidationErrors({});
    setSelectedGender("");
    setSelectedBirthYearType("");
    setAgeMin("");
    setAgeMax("");
    setAgeMode("include");
    setPrescriptionClaimCodes([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(eventSendData.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    try {
      // 선택된 각 이벤트를 순차적으로 삭제
      for (const eventId of selectedItems) {
        await deleteEventMutation.mutateAsync(eventId);
      }

      // 삭제 완료 후 선택된 항목 초기화
      setSelectedItems([]);
    } catch (error) {
      console.error("이벤트 삭제 중 오류 발생:", error);
      alert(`이벤트 삭제 실패: ${error}`);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    // 자동 발송 목록에서 선택된 값 초기화
    setSelectedItems([]);
    setSelectedEventId(null);
    setShowDetailPanel(false);

    // 자동 발송 조건 상세 초기화
    setEventName("");
    setSelectedEventType("");
    setAppointmentTypeIds([]);
    setAppointmentRoomIds([]);
    setSenderNumber("");
    setSendTimeType("");
    setDaysBeforeAppointment("");
    setDaysAfterVisit("");
    setVisitTimeDropdown("days");
    setSendTime("");
    setExcludeSatdays(false);
    setExcludeSundays(false);
    setExcludeHolidays(false);

    // 메시지 폼 데이터 초기화
    setMessageData({
      messageType: CrmMessageType.문자,
      messageContent: "",
      messageSubType: CrmMessageSubType.SMS,
      isAdDisplayed: false,
      messageImageFileinfo: undefined,
      images: [],
    });

    // Validation 에러 초기화
    setValidationErrors({});

    // 성별 선택 초기화
    setSelectedGender("");
    setSelectedBirthYearType("");
    setAgeMin("");
    setAgeMax("");
    setAgeMode("include");
    setPrescriptionClaimCodes([]);
  };

  // Toast helpers
  const toastHelpers = useToastHelpers();
  const { success } = toastHelpers;

  // Create event mutation
  const createEventMutation = useCreateSendEvent({
    onSuccess: () => {
      success("저장 되었습니다", "CRM 발송 조건이 등록되었습니다");
    },
    onError: (error) => {
      console.error("이벤트 생성 실패:", error);
    },
  });

  // Update event mutation
  const updateEventMutation = useUpdateSendEvent({
    onSuccess: () => {
      success("수정 되었습니다", "CRM 발송 조건이 수정되었습니다");
    },
    onError: (error) => {
      console.error("이벤트 수정 실패:", error);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useDeleteSendEvent({
    onSuccess: () => {
      success("삭제 되었습니다", "CRM 발송 조건이 삭제되었습니다");
    },
    onError: (error) => {
      console.error("이벤트 삭제 실패:", error);
    },
  });

  // Validation 함수
  const validateForm = (): boolean => {
    const errors: { eventName?: string } = {};
    let isValid = true;

    if (!eventName.trim()) {
      errors.eventName = "조건명은 필수 입력입니다.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const formatTimeToReadFriendly = (time: string): string => {
    if (!time) return "";

    const timeParts = time.split(":").map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;

    const period = hours < 12 ? "오전" : "오후";
    const displayHours = hours % 12 || 12; // 0시는 12시로 표시

    if (minutes === 0) {
      return `${period} ${displayHours}시`;
    } else {
      return `${period} ${displayHours}시 ${minutes}분`;
    }
  };

  // eventDispSummary 자동 생성 함수
  const generateEventDispSummary = (): string => {
    const eventType = parseInt(selectedEventType);

    if (eventType === CrmEventType.예약완료_변경_취소안내) {
      const timeTypeMap = {
        [CrmEventSendTimeType.예약완료시]: "예약 완료 시",
        [CrmEventSendTimeType.예약변경시]: "예약 변경 시",
        [CrmEventSendTimeType.예약취소시]: "예약 취소 시",
        [CrmEventSendTimeType.상세설정]: "상세 설정",
      };
      return (
        timeTypeMap[parseInt(sendTimeType) as CrmEventSendTimeType] ||
        "예약 관련 안내"
      );
    }

    if (eventType === CrmEventType.내원전안내) {
      const days = parseInt(daysBeforeAppointment) || 0;
      const timeText = sendTime ? ` ${formatTimeToReadFriendly(sendTime)}` : "";
      return `예약일 ${days}일 전${timeText}`;
    }

    if (eventType === CrmEventType.내원후안내) {
      const value = parseInt(daysAfterVisit) || 0;
      const timeText = sendTime ? ` ${formatTimeToReadFriendly(sendTime)}` : "";
      const unitText =
        visitTimeDropdown === "days"
          ? "일"
          : visitTimeDropdown === "weeks"
            ? "주"
            : visitTimeDropdown === "months"
              ? "월"
              : "일";
      return `내원일 ${value}${unitText} 후${timeText}`;
    }

    return "자동 발송 안내";
  };

  // 저장 핸들러
  const handleSave = async () => {
    // Validation 검증
    if (!validateForm()) {
      return;
    }

    // 첨부 이미지 업로드 처리
    let messageImageFileinfo: FileUploadV2Uuid[] = [];

    if (messageData.images && messageData.images.length > 0) {
      try {
        // 첨부 이미지 업로드
        const uploadPromises = messageData.images.map((image) =>
          FileService.uploadFileV2({
            file: image.file,
            category: "message_attachment",
            entityType: "crm_message",
          })
        );

        const uploadResults = await Promise.all(uploadPromises);

        messageImageFileinfo = uploadResults.map((result) => ({
          id: Number(result.id),
          uuid: result.uuid,
        }));
      } catch (error) {
        // 업로드 실패 시 messageImageFileinfo는 빈 배열로 유지
        console.error("이미지 업로드 실패:", error);
        toastHelpers.error("첨부 이미지 등록이 실패하였습니다.");
      }
    }

    const preSendDays: ("sat" | "sun" | "holi")[] = [];
    if (excludeSatdays) preSendDays.push("sat");
    if (excludeSundays) preSendDays.push("sun");
    if (excludeHolidays) preSendDays.push("holi");

    // sendTimeDetail 생성
    let sendTimeDetail = undefined;
    if (
      selectedEventType === String(CrmEventType.내원전안내) &&
      daysBeforeAppointment
    ) {
      sendTimeDetail = {
        timing: {
          unit: "days" as const,
          value: parseInt(daysBeforeAppointment) || 0,
        },
        preSendDays: preSendDays.length > 0 ? preSendDays : undefined,
        sendTime: sendTime || undefined,
      };
    } else if (
      selectedEventType === String(CrmEventType.내원후안내) &&
      daysAfterVisit
    ) {
      sendTimeDetail = {
        timing: {
          unit: visitTimeDropdown,
          value: parseInt(daysAfterVisit) || 0,
        },
        preSendDays: preSendDays.length > 0 ? preSendDays : undefined,
        sendTime: sendTime || undefined,
      };
    }

    const eventDto = {
      eventType: parseInt(selectedEventType) as CrmEventType,
      eventName,
      eventDispSummary: generateEventDispSummary(),
      isActive: true,
      appointmentRoomIds,
      appointmentTypeIds,
      sendConditions:
        selectedEventType === String(CrmEventType.내원후안내)
          ? {
            gender: selectedGender
              ? (selectedGender as "male" | "female")
              : undefined,
            birthYear: selectedBirthYearType
              ? (selectedBirthYearType as "even" | "odd")
              : undefined,
            age:
              ageMin || ageMax
                ? {
                  mode: ageMode,
                  min: parseInt(ageMin) || 0,
                  max: parseInt(ageMax) || 100,
                }
                : undefined,
            claimCodes:
              prescriptionClaimCodes.length > 0
                ? prescriptionClaimCodes.map((item) => item.claimCode)
                : undefined,
          }
          : undefined,
      sendTimeType:
        selectedEventType === String(CrmEventType.예약완료_변경_취소안내)
          ? (parseInt(sendTimeType) as CrmEventSendTimeType)
          : CrmEventSendTimeType.상세설정,
      sendTimeDetail,
      senderNumber,
      messageType: messageData.messageType,
      messageContent: messageData.messageContent,
      messageSubType: messageData.messageSubType,
      isAdDisplayed: messageData.isAdDisplayed,
      // 템플릿 선택 시 설정된 값들
      messageTemplateId:
        messageData.messageTemplateId && !messageData.isGuideTemplate
          ? messageData.messageTemplateId
          : undefined,
      guideTemplateId:
        messageData.messageTemplateId && messageData.isGuideTemplate
          ? messageData.messageTemplateId
          : undefined,
      messageImageFileinfo: messageImageFileinfo,
    };

    if (selectedEventId) {
      updateEventMutation.mutate({
        id: selectedEventId,
        request: eventDto as UpdateCrmSendEventDto,
      });
    } else {
      // 신규 등록
      createEventMutation.mutate(eventDto as CreateCrmSendEventDto);
    }
  };

  // 예약 유형 선택 핸들러
  const handleSelectAppointmentType = (typeId: number) => {
    if (!appointmentTypeIds.includes(typeId)) {
      setAppointmentTypeIds([...appointmentTypeIds, typeId]);
    }
  };

  // 예약 유형 제거 핸들러
  const handleRemoveAppointmentType = (typeId: number) => {
    setAppointmentTypeIds(appointmentTypeIds.filter((id) => id !== typeId));
  };

  // 예약 유형명 조회
  const getAppointmentTypeName = (typeId: number) => {
    return appointmentTypes.find((type) => type.id === typeId)?.name || "";
  };

  // 처방 선택 핸들러
  const handleOrderSelect = (item: any) => {
    if (item && item.claimCode && item.name) {
      setPrescriptionClaimCodes((prev) => {
        // 이미 추가된 항목인지 확인
        if (prev.some((code) => code.claimCode === item.claimCode)) {
          return prev;
        }
        return [...prev, { claimCode: item.claimCode, name: item.name }];
      });
    }
  };

  // 처방 항목 제거 핸들러
  const handleRemoveClaimCode = (claimCode: string) => {
    setPrescriptionClaimCodes((prev) =>
      prev.filter((item) => item.claimCode !== claimCode)
    );
  };

  // 예약실 선택 핸들러
  const handleSelectAppointmentRoom = (roomId: number) => {
    if (!appointmentRoomIds.includes(roomId)) {
      setAppointmentRoomIds([...appointmentRoomIds, roomId]);
    }
  };

  // 예약실 제거 핸들러
  const handleRemoveAppointmentRoom = (roomId: number) => {
    setAppointmentRoomIds(appointmentRoomIds.filter((id) => id !== roomId));
  };

  // 예약실명 조회
  const getAppointmentRoomName = (roomId: number) => {
    return appointmentRooms.find((room) => room.id === roomId)?.name || "";
  };

  return (
    <div className="w-full h-full bg-[var(--bg-2)]">
      <MySplitPane
        splitPaneId="event-send-main-split"
        isVertical={false}
        panes={[
          <div
            key="event-list-panel"
            className="w-full h-full bg-white flex flex-col"
          >
            <div className="space-y-2 p-4 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">자동 발송</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={
                      selectedItems.length === 0 ||
                      deleteEventMutation.isPending
                    }
                    className="px-3 bg-white text-[var(--gray-100)] border-[var(--border-1)]"
                  >
                    {deleteEventMutation.isPending ? "삭제 중..." : "조건 삭제"}
                  </Button>
                  <Button
                    size="sm"
                    className="px-3 bg-[var(--main-color)]"
                    onClick={handleAddNewEvent}
                  >
                    조건 등록
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 pb-4 overflow-y-auto">
              <Table className="border-separate border-spacing-0">
                <TableHeader className="bg-[var(--bg-2)] rounded-t-lg">
                  <TableRow className={cn(tableRowStyle)}>
                    <TableHead
                      className={cn(
                        "min-w-8 text-center",
                        headerCellStyle,
                        "rounded-tl-lg"
                      )}
                    >
                      <Checkbox
                        checked={
                          eventSendData.length > 0 &&
                          selectedItems.length === eventSendData.length
                        }
                        onCheckedChange={handleSelectAll}
                        disabled={eventSendData.length === 0 || isLoading}
                      />
                    </TableHead>
                    <TableHead className={cn(headerCellStyle, "text-center")}>
                      조건명
                    </TableHead>
                    <TableHead className={cn(headerCellStyle, "text-center")}>
                      발송시점
                    </TableHead>
                    <TableHead className={cn(headerCellStyle, "text-center")}>
                      발송 수단
                    </TableHead>
                    <TableHead
                      className={cn(
                        headerCellStyle,
                        "text-center rounded-tr-lg"
                      )}
                    >
                      사용여부
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow className={cn(tableRowStyle)}>
                      <TableCell
                        colSpan={5}
                        className={cn(
                          "text-center text-[var(--gray-500)] border-none align-middle"
                        )}
                        style={{ height: "500px" }}
                      >
                        불러오는 중입니다...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow className={cn(tableRowStyle)}>
                      <TableCell
                        colSpan={5}
                        className={cn(
                          "text-center text-[var(--gray-500)] border-none align-middle"
                        )}
                        style={{ height: "500px" }}
                      >
                        데이터를 불러오는 중 오류가 발생했습니다.
                      </TableCell>
                    </TableRow>
                  ) : eventSendData.length === 0 ? (
                    <TableRow className={cn(tableRowStyle)}>
                      <TableCell
                        colSpan={5}
                        className={cn(
                          "text-center text-[var(--gray-500)] border-none align-middle"
                        )}
                        style={{ height: "500px" }}
                      >
                        조건을 추가해주세요.
                      </TableCell>
                    </TableRow>
                  ) : (
                    eventSendData.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          tableRowStyle,
                          "cursor-pointer hover:bg-gray-50",
                          selectedEventId === item.id && "bg-blue-50"
                        )}
                        onClick={() => handleRowClick(item.id)}
                      >
                        <TableCell
                          className={cn("min-w-8 text-center", columnCellStyle)}
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) =>
                              handleItemSelect(item.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className={cn(columnCellStyle)}>
                          {item.eventName}
                        </TableCell>
                        <TableCell className={cn(columnCellStyle)}>
                          {item.eventDispSummary}
                        </TableCell>
                        <TableCell
                          className={cn(columnCellStyle, "text-center")}
                        >
                          <span
                            className={
                              item.messageType === CrmMessageType.문자
                                ? "text-[var(--blue-2)]"
                                : "text-[var(--yellow-1)]"
                            }
                          >
                            {item.messageType === CrmMessageType.문자
                              ? "문자"
                              : item.messageType === CrmMessageType.알림톡
                                ? "알림톡"
                                : "미설정"}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(columnCellStyle, "text-center")}
                        >
                          <MySwitch
                            checked={item.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleActive(item.id, checked as boolean)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>,
          showDetailPanel ? (
            <div key="event-detail-panel" className="h-full px-2 py-2">
              <div className="h-full bg-white border border-[var(--border-2)] rounded-lg flex flex-col shadow-sm">
                <div className="px-4 pt-4">
                  <h2 className="text-base font-semibold">
                    {selectedEventId
                      ? "자동 발송 조건 상세"
                      : "자동 발송 조건 등록"}
                  </h2>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
                  {selectedEventId && isLoadingDetail ? (
                    // 로딩 중
                    <div className="flex items-center justify-center h-32">
                      <div className="text-sm text-[var(--gray-500)]">
                        불러오는 중입니다...
                      </div>
                    </div>
                  ) : (
                    // 이벤트 추가/편집 폼
                    <>
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="eventType"
                          className="text-sm text-[var(--gray-100)] gap-1"
                        >
                          조건 유형{" "}
                          <span className="text-[var(--negative)]">*</span>
                        </Label>
                        <Select
                          value={selectedEventType}
                          onValueChange={setSelectedEventType}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="조건 유형을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value={String(
                                CrmEventType.예약완료_변경_취소안내
                              )}
                            >
                              예약 완료, 변경, 취소 안내
                            </SelectItem>
                            <SelectItem value={String(CrmEventType.내원전안내)}>
                              내원 전 안내
                            </SelectItem>
                            <SelectItem value={String(CrmEventType.내원후안내)}>
                              내원 후 안내
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="eventName"
                          className="text-sm text-[var(--gray-100)] gap-1"
                        >
                          조건명{" "}
                          <span className="text-[var(--negative)]">*</span>
                        </Label>
                        <Input
                          id="eventName"
                          value={eventName}
                          placeholder="조건명을 입력하세요"
                          onChange={(e) => {
                            setEventName(e.target.value);
                            // 입력 시 에러 상태 초기화
                            if (validationErrors.eventName) {
                              setValidationErrors({
                                ...validationErrors,
                                eventName: undefined,
                              });
                            }
                          }}
                          className={`w-full ${validationErrors.eventName
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                            }`}
                        />
                        {validationErrors.eventName && (
                          <p className="text-xs text-red-500">
                            {validationErrors.eventName}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {selectedEventType && (
                    <div className="flex flex-col gap-5 mt-5 pt-5 border-t border-[var(--bg-5)]">
                      <div className="flex flex-col gap-2 bg-[var(--bg-1)] p-4 rounded-md">
                        <Label className="text-sm font-bold text-[var(--gray-100)] mb-2 block">
                          대상 환자
                        </Label>

                        {selectedEventType ===
                          String(CrmEventType.내원후안내) ? (
                          <>
                            {/* 성별 선택 버튼 그룹 */}
                            <Label className="text-sm text-[var(--gray-100)]">
                              성별
                            </Label>
                            <ButtonGroup
                              buttons={[
                                { id: "", title: "전체" },
                                { id: "male", title: "남자" },
                                { id: "female", title: "여자" },
                              ]}
                              activeButtonId={selectedGender}
                              onButtonChangeAction={(id) =>
                                setSelectedGender(id)
                              }
                              isSeparated
                              className="text-sm"
                            />

                            {/* 출생연도 선택 버튼 그룹 */}
                            <Label className="text-sm text-[var(--gray-100)] mt-2">
                              출생연도
                            </Label>
                            <ButtonGroup
                              buttons={[
                                { id: "", title: "전체" },
                                { id: "even", title: "짝수" },
                                { id: "odd", title: "홀수" },
                              ]}
                              activeButtonId={selectedBirthYearType}
                              onButtonChangeAction={(id) =>
                                setSelectedBirthYearType(id)
                              }
                              isSeparated
                              className="text-sm"
                            />

                            {/* 나이 조건 */}
                            <Label className="text-sm text-[var(--gray-100)] mt-2">
                              나이
                            </Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                value={ageMin}
                                onChange={(e) => setAgeMin(e.target.value)}
                                placeholder="0"
                                className="w-20 bg-white"
                                min="0"
                                max="150"
                              />
                              <span className="text-sm text-[var(--gray-500)]">
                                -
                              </span>
                              <Input
                                type="number"
                                value={ageMax}
                                onChange={(e) => setAgeMax(e.target.value)}
                                placeholder="0"
                                className="w-20 bg-white"
                                min="0"
                                max="150"
                              />
                              <span className="text-sm text-[var(--gray-300)]">
                                세
                              </span>

                              <RadioGroup
                                value={ageMode}
                                onValueChange={(value) =>
                                  setAgeMode(value as "include" | "exclude")
                                }
                                className="flex gap-4 ml-auto"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="include"
                                    id="age-include"
                                  />
                                  <Label
                                    htmlFor="age-include"
                                    className="text-sm text-[var(--gray-300)]"
                                  >
                                    포함
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="exclude"
                                    id="age-exclude"
                                  />
                                  <Label
                                    htmlFor="age-exclude"
                                    className="text-sm text-[var(--gray-300)]"
                                  >
                                    제외
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* 처방 정보 */}
                            <Label className="text-sm text-[var(--gray-100)] mt-2">
                              처방 정보
                            </Label>
                            <div className="border border-[var(--border-2)] p-[1px] rounded">
                              <PrescriptionLibrarySearch
                                actionRowRef={actionRowRef}
                                onAddLibrary={handleOrderSelect}
                                showLibrary={true}
                                forceShowLibrary={true}
                              />
                            </div>

                            {prescriptionClaimCodes.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {prescriptionClaimCodes.map((item) => (
                                  <Button
                                    key={item.claimCode}
                                    size="xs"
                                    variant="outline"
                                    onClick={() =>
                                      handleRemoveClaimCode(item.claimCode)
                                    }
                                    className="h-7 text-xs flex items-center gap-1 border-[var(--border-1)]"
                                  >
                                    {item.name}
                                    <X className="size-3" />
                                  </Button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Label className="text-sm text-[var(--gray-100)]">
                              예약실
                            </Label>
                            <div>
                              <Select
                                value=""
                                onValueChange={(value) =>
                                  handleSelectAppointmentRoom(Number(value))
                                }
                                disabled={isLoadingRooms}
                              >
                                <SelectTrigger className="w-full bg-white">
                                  <SelectValue
                                    placeholder={
                                      isLoadingRooms
                                        ? "로딩 중..."
                                        : appointmentRoomIds.length > 0
                                          ? `예약실 선택 (${appointmentRoomIds.length})`
                                          : "전체"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {appointmentRooms.map((room) => (
                                    <SelectItem
                                      key={room.id}
                                      value={room.id.toString()}
                                    >
                                      {room.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {appointmentRoomIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {appointmentRoomIds.map((roomId) => (
                                    <Button
                                      key={roomId}
                                      size="xs"
                                      variant="outline"
                                      onClick={() =>
                                        handleRemoveAppointmentRoom(roomId)
                                      }
                                      className="h-7 text-xs flex items-center gap-1 border-[var(--border-1)]"
                                    >
                                      {getAppointmentRoomName(roomId)}
                                      <X className="size-3" />
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Label className="mt-2 text-sm text-[var(--gray-100)]">
                              예약 유형
                            </Label>
                            <div>
                              <Select
                                value=""
                                onValueChange={(value) =>
                                  handleSelectAppointmentType(Number(value))
                                }
                                disabled={isLoadingTypes}
                              >
                                <SelectTrigger className="w-full bg-white">
                                  <SelectValue
                                    placeholder={
                                      isLoadingTypes
                                        ? "로딩 중..."
                                        : appointmentTypeIds.length > 0
                                          ? `예약 유형 선택 (${appointmentTypeIds.length})`
                                          : "전체"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {appointmentTypes.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id.toString()}
                                    >
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {appointmentTypeIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {appointmentTypeIds.map((typeId) => (
                                    <Button
                                      key={typeId}
                                      size="xs"
                                      variant="outline"
                                      onClick={() =>
                                        handleRemoveAppointmentType(typeId)
                                      }
                                      className="h-7 text-xs flex items-center gap-1 border-[var(--border-1)]"
                                    >
                                      {getAppointmentTypeName(typeId)}
                                      <X className="size-3" />
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 bg-[var(--bg-1)] p-4 rounded-md">
                        <Label className="text-sm font-bold text-[var(--gray-100)] mb-2 block">
                          발송 정보
                        </Label>

                        <Label className="text-sm text-[var(--gray-100)]">
                          발송 시점
                        </Label>
                        <div>
                          {/* 예약완료_변경_취소안내일 때 */}
                          {selectedEventType ===
                            String(CrmEventType.예약완료_변경_취소안내) && (
                              <Select
                                value={sendTimeType}
                                onValueChange={setSendTimeType}
                              >
                                <SelectTrigger className="w-full bg-white">
                                  <SelectValue placeholder="발송 시점을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value={String(
                                      CrmEventSendTimeType.예약완료시
                                    )}
                                  >
                                    예약 완료 시
                                  </SelectItem>
                                  <SelectItem
                                    value={String(
                                      CrmEventSendTimeType.예약변경시
                                    )}
                                  >
                                    예약 변경 시
                                  </SelectItem>
                                  <SelectItem
                                    value={String(
                                      CrmEventSendTimeType.예약취소시
                                    )}
                                  >
                                    예약 취소 시
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}

                          {/* 내원전안내일 때 */}
                          {selectedEventType ===
                            String(CrmEventType.내원전안내) && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-[var(--gray-100)]">
                                    예약일
                                  </span>
                                  <Input
                                    value={daysBeforeAppointment}
                                    onChange={(e) =>
                                      setDaysBeforeAppointment(e.target.value)
                                    }
                                    className="w-20 bg-white"
                                    placeholder="0"
                                  />
                                  <span className="text-sm text-[var(--gray-100)]">
                                    일전
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 ml-10">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-[var(--gray-100)]">
                                      미리발송
                                    </span>
                                    <MyTooltip
                                      side="bottom"
                                      align="start"
                                      content={
                                        <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                                          선택한 요일이 발송 예정일인 경우
                                          직전일에 발송합니다.
                                        </div>
                                      }
                                    >
                                      <CircleAlert className="w-4 h-4 text-[var(--gray-100)]" />
                                    </MyTooltip>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="excludeSatdays"
                                      checked={excludeSatdays}
                                      onCheckedChange={(checked) =>
                                        setExcludeSatdays(checked === true)
                                      }
                                    />
                                    <Label
                                      htmlFor="excludeSatdays"
                                      className="text-sm text-[var(--gray-300)]"
                                    >
                                      토
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="excludeSundays"
                                      checked={excludeSundays}
                                      onCheckedChange={(checked) =>
                                        setExcludeSundays(checked === true)
                                      }
                                    />
                                    <Label
                                      htmlFor="excludeSundays"
                                      className="text-sm text-[var(--gray-300)]"
                                    >
                                      일
                                    </Label>
                                  </div>
                                  {/* <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="excludeHolidays"
                                    checked={excludeHolidays}
                                    onCheckedChange={(checked) =>
                                      setExcludeHolidays(checked === true)
                                    }
                                  />
                                  <Label
                                    htmlFor="excludeHolidays"
                                    className="text-sm text-[var(--gray-300)]"
                                  >
                                    공휴일
                                  </Label>
                                </div> */}
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

                          {/* 내원후안내일 때 */}
                          {selectedEventType ===
                            String(CrmEventType.내원후안내) && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-[var(--gray-100)]">
                                    내원일
                                  </span>
                                  <Input
                                    value={daysAfterVisit}
                                    onChange={(e) =>
                                      setDaysAfterVisit(e.target.value)
                                    }
                                    className="w-20 bg-white"
                                    placeholder="일"
                                  />
                                  <Select
                                    value={visitTimeDropdown}
                                    onValueChange={(value) =>
                                      setVisitTimeDropdown(
                                        value as "days" | "weeks" | "months"
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-32 bg-white">
                                      <SelectValue placeholder="시점 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="days">일 후</SelectItem>
                                      <SelectItem value="weeks">주 후</SelectItem>
                                      <SelectItem value="months">
                                        월 후
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-[var(--gray-100)]">
                                      미리발송
                                    </span>
                                    <MyTooltip
                                      side="bottom"
                                      align="start"
                                      content={
                                        <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                                          선택한 요일이 발송 예정일인 경우
                                          직전일에 발송합니다.
                                        </div>
                                      }
                                    >
                                      <CircleAlert className="w-4 h-4 text-[var(--gray-100)]" />
                                    </MyTooltip>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="excludeSatdaysAfter"
                                      checked={excludeSatdays}
                                      onCheckedChange={(checked) =>
                                        setExcludeSatdays(checked === true)
                                      }
                                    />
                                    <Label
                                      htmlFor="excludeSatdaysAfter"
                                      className="text-sm text-[var(--gray-300)]"
                                    >
                                      토
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="excludeSundaysAfter"
                                      checked={excludeSundays}
                                      onCheckedChange={(checked) =>
                                        setExcludeSundays(checked === true)
                                      }
                                    />
                                    <Label
                                      htmlFor="excludeSundaysAfter"
                                      className="text-sm text-[var(--gray-300)]"
                                    >
                                      일
                                    </Label>
                                  </div>
                                  {/* <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="excludeHolidaysAfter"
                                    checked={excludeHolidays}
                                    onCheckedChange={(checked) =>
                                      setExcludeHolidays(checked === true)
                                    }
                                  />
                                  <Label
                                    htmlFor="excludeHolidaysAfter"
                                    className="text-sm text-[var(--gray-300)]"
                                  >
                                    공휴일
                                  </Label>
                                </div> */}
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
                        </div>

                        <Label className="text-sm text-[var(--gray-100)] mt-2">
                          발송 번호
                        </Label>
                        <div>
                          <Select
                            value={senderNumber}
                            onValueChange={setSenderNumber}
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="발송번호를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {senderData?.map((sender) => (
                                <SelectItem
                                  key={sender.senderNumber}
                                  value={sender.senderNumber}
                                >
                                  {formatPhoneNumber(sender.senderNumber)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div key="event-detail-panel" className="h-full pl-2 py-2">
              <div className="h-full"></div>
            </div>
          ),
          // 우측 패널 (메시지 발송)
          selectedEventType ? (
            <div key="send-message-form-panel" className="w-full h-full p-2">
              <div className="bg-white border border-[var(--border-1)] rounded-md h-full flex flex-col">
                {/* 메시지 폼 영역 */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <SendMessageForm
                    messageData={messageData}
                    onMessageDataChange={setMessageData}
                  />
                </div>

                {/* 하단 버튼 */}
                <div className="p-4 flex gap-2 flex-shrink-0">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="w-20 border border-[var(--border-1)]"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
                  >
                    저장
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div key="send-message-form-panel" className="w-full h-full p-2">
              <div className="h-full"></div>
            </div>
          ),
        ]}
        initialRatios={[0.28, 0.25, 0.47]}
        minPaneRatio={0.15}
      />
    </div>
  );
};

export default EventSendPage;
