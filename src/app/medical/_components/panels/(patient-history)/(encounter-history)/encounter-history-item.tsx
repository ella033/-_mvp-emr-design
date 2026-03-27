import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  MyContextMenu,
  type MyContextMenuItem,
} from "@/components/yjg/my-context-menu";
import type { Encounter } from "@/types/chart/encounter-types";
import { useEncounterStore } from "@/store/encounter-store";
import { useUpdateEncounter } from "@/hooks/encounter/use-encounter-update";
import { useDeleteEncounter } from "@/hooks/encounter/use-encounter-delete";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import { useToastHelpers } from "@/components/ui/toast";
import EncounterPayInfo from "../../../widgets/encounter-pay-info";
import { RegistrationsService } from "@/services/registrations-service";
import { useReceptionStore } from "@/store/common/reception-store";
import { usePrintService } from "@/hooks/document/use-print-service";
import EncounterHistoryItemDiagnosis from "./encounter-history-item-diagnosis";
import EncounterHistoryItemPrescription from "./encounter-history-item-prescription";
import DurCancelPopup from "../../(dur)/dur-cancel-popup";
import IssuanceNumberEditPopup from "./issuance-number-edit-popup";
import EncounterHistoryItemHeader from "./encounter-history-item-header";
import EncounterHistoryItemSymptom from "./encounter-history-item-symptom";

interface EncounterHistoryItemProps {
  encounter?: Encounter;
  diagnosisHeaders: MyTreeGridHeaderType[];
  prescriptionHeaders: MyTreeGridHeaderType[];
  setDiagnosisHeaders: (headers: MyTreeGridHeaderType[]) => void;
  setPrescriptionHeaders: (headers: MyTreeGridHeaderType[]) => void;
  isOpen: boolean;
  onToggleOpen: (isOpen: boolean) => void;
  searchKeyword?: string;
  isReception?: boolean;
}

export default function EncounterHistoryItem({
  encounter,
  diagnosisHeaders,
  prescriptionHeaders,
  setDiagnosisHeaders,
  setPrescriptionHeaders,
  isOpen: controlledIsOpen,
  onToggleOpen,
  searchKeyword,
  isReception = false
}: EncounterHistoryItemProps) {
  const { error } = useToastHelpers();
  const queryClient = useQueryClient();
  const { setCurrentRegistrationExternal } = useReceptionStore();
  const { mutate: updateEncounter } = useUpdateEncounter();
  const { mutate: deleteEncounter } = useDeleteEncounter();
  const {
    selectedEncounter,
    setSelectedEncounter,
    removeEncounter,
    updateEncounters,
  } = useEncounterStore();
  const { currentRegistration } = useReceptionStore();
  const updateRegistration = useReceptionStore((s) => s.updateRegistration);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDurCancelPopup, setShowDurCancelPopup] = useState(false);
  const [showIssuanceNumberEdit, setShowIssuanceNumberEdit] = useState(false);
  const [showNoPrescriptionAlert, setShowNoPrescriptionAlert] = useState(false);

  const {
    openPrescriptionPrintPopup,
    openMedicalRecordHtmlPrintPopup,
    checkShouldPrintPrescription,
    PrescriptionHiddenRenderer,
    ReceptionHtmlHiddenRenderer,
  } = usePrintService();

  // controlled 또는 uncontrolled 모드에 따라 사용할 상태 결정
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (newIsOpen: boolean) => {
    if (controlledIsOpen !== undefined) {
      // controlled mode
      onToggleOpen(newIsOpen);
    } else {
      // uncontrolled mode
      setInternalIsOpen(newIsOpen);
    }
  };
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    // 스크롤 중 불필요한 포커스 이동 방지 - 버튼이나 링크가 아닌 경우만 포커스
    const target = e.target as HTMLElement;
    if (
      target.tagName !== "BUTTON" &&
      target.tagName !== "A" &&
      !target.closest("button") &&
      !target.closest("a")
    ) {
      containerRef.current?.focus({ preventScroll: true });
    }
  };

  const handleDeleteEncounter = (encounter: Encounter) => {
    const patientId = currentRegistration?.patientId;
    const registrationId = currentRegistration?.id;
    deleteEncounter(encounter.id, {
      onSuccess: () => {
        removeEncounter(encounter.id);
        if (patientId != null) {
          queryClient.invalidateQueries({
            queryKey: ["patient", patientId, "charts"],
          });
        }
        if (registrationId != null && currentRegistration) {
          const nextEncounters =
            currentRegistration.encounters?.filter(
              (e) => e.id !== encounter.id
            ) ?? [];
          updateRegistration(registrationId, { encounters: nextEncounters });
        }
      },
    });
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    if (encounter) {
      // Todo: DUR 점검내역이 있으면 점검취소 열기
      if (encounter.issuanceNumber && currentRegistration?.patient) {
        setShowDurCancelPopup(true);
      } else {
        handleDeleteEncounter(encounter);
      }
    };
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const contextMenuItems: MyContextMenuItem[] = [
    {
      label: "처방전 보기",
      onClick: async () => {
        closeContextMenu();
        if (!encounter) return;

        try {
          const shouldPrint = await checkShouldPrintPrescription(String(encounter.id));
          if (!shouldPrint) {
            setShowNoPrescriptionAlert(true);
            return;
          }
          openPrescriptionPrintPopup(String(encounter.id));
        } catch (err) {
          console.error("처방전 데이터 확인 실패:", err);
          error("처방전 데이터를 확인할 수 없습니다.");
        }
      },
    },
    ...(encounter?.issuanceNumber
      ? [
        {
          label: "처방전 교부번호 수정",
          onClick: async () => {
            closeContextMenu();
            if (!encounter) return;
            setShowIssuanceNumberEdit(true);
          },
        },
      ]
      : []),
  ];

  const safeContextMenuItems: MyContextMenuItem[] = isReception
    ? // 접수 탭에서는 /medical 전역 store(reception-store, encounter-store)와 분리되어야 하므로
    // store를 변경하는 액션(차트 열기/삭제/청구전환/차트출력)은 제공하지 않는다.
    contextMenuItems
    : [
      {
        label: "차트 열기",
        onClick: async () => {
          if (encounter) {
            const registration = await RegistrationsService.getRegistration(
              encounter.registrationId
            );
            if (!registration) {
              error("접수정보를 찾을 수 없습니다.");
              return;
            }
            setCurrentRegistrationExternal(registration);
            setSelectedEncounter(encounter);
          }
          closeContextMenu();
        },
      },
      {
        label: "차트 삭제",
        onClick: () => {
          setShowDeleteConfirm(true);
          closeContextMenu();
        },
      },
      {
        label: `${encounter?.isClaim ? "비청구 차트로 전환" : "청구 차트로 전환"}`,
        onClick: () => {
          if (encounter) {
            updateEncounter(
              {
                id: encounter.id,
                data: {
                  registrationId: encounter.registrationId.toString(),
                  patientId: encounter.patientId,
                  isClaim: !encounter.isClaim,
                },
              },
              {
                onSuccess: () => {
                  updateEncounters({ ...encounter, isClaim: !encounter.isClaim });
                },
              }
            );
          }
          closeContextMenu();
        },
      },
      {
        label: "차트 출력",
        onClick: () => {
          if (encounter) {
            openMedicalRecordHtmlPrintPopup(String(encounter.id));
          }
          closeContextMenu();
        },
      },
      ...contextMenuItems,
    ];

  if (!encounter) return null;

  const isSymptomExist =
    encounter?.symptom &&
    encounter?.symptom.trim().length > 0 &&
    encounter?.symptom !== "<p></p>";
  const isDiagnosisExist =
    encounter?.diseases && encounter?.diseases.length > 0;
  const isPrescriptionExist = encounter?.orders && encounter?.orders.length > 0;

  const getBorderClass = (isOpen: boolean) => {
    if (selectedEncounter?.id === encounter.id) {
      return "border-2 border-[var(--blue-2)]";
    }
    return isOpen ? "border-1 border-[var(--main-color-2-1)]" : "border-1 border-[var(--border-2)]";
  };

  const headerNode = (
    <EncounterHistoryItemHeader
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      encounter={encounter}
      isReception={isReception}
    />
  );

  return (
    <>
      <div
        ref={containerRef}
        tabIndex={0}
        className={cn(
          "flex flex-col rounded-sm cursor-pointer",
          getBorderClass(isOpen)
        )}
        onClick={handleContainerClick}
        onContextMenu={handleContextMenu}
      >
        {/* 열림: sticky 래퍼로 헤더 고정 / 닫힘: 헤더만 */}
        {isOpen ? (
          <div className="bg-[var(--bg-1)] rounded-t-sm border-none sticky top-0 z-[98]">
            {headerNode}
          </div>
        ) : (
          headerNode
        )}
        {isOpen && (
          <div className="flex flex-col p-2 gap-2">
            {isSymptomExist && (
              <EncounterHistoryItemSymptom
                symptom={encounter?.symptom || ""}
                searchKeyword={searchKeyword}
                canRepeat={!isReception}
              />
            )}
            {isDiagnosisExist && (
              <EncounterHistoryItemDiagnosis
                encounter={encounter}
                diagnosisHeaders={diagnosisHeaders}
                setDiagnosisHeaders={setDiagnosisHeaders}
                searchKeyword={searchKeyword}
                isReception={isReception}
              />
            )}
            {isPrescriptionExist && (
              <EncounterHistoryItemPrescription
                encounter={encounter}
                prescriptionHeaders={prescriptionHeaders}
                setPrescriptionHeaders={setPrescriptionHeaders}
                searchKeyword={searchKeyword}
                isReception={isReception}
              />
            )}
            {!isSymptomExist && !isDiagnosisExist && !isPrescriptionExist && (
              <div className="text-[12px] text-[var(--gray-500)] flex justify-center items-center flex-1">
                진료 내역이 없습니다.
              </div>
            )}
            <div className="flex flex-row items-center justify-end bg-[var(--bg-1)] p-1 rounded-sm">
              <EncounterPayInfo encounter={encounter} size="sm" />
            </div>
          </div>
        )}
      </div>

      <MyPopupYesNo
        isOpen={showDeleteConfirm}
        onCloseAction={handleDeleteCancel}
        onConfirmAction={handleDeleteConfirm}
        title=""
        message="이 차트를 삭제하시겠습니까?"
        confirmText="삭제"
        hideHeader={true}
        children={
          <div className="text-sm text-[var(--gray-500)]">
            삭제된 차트는 복구되지 않습니다.
          </div>
        }
      />

      <MyPopupMsg
        isOpen={showNoPrescriptionAlert}
        onCloseAction={() => setShowNoPrescriptionAlert(false)}
        title=""
        msgType="info"
        message="원외처방전이 없습니다."
        hideHeader={true}
      />

      {showDurCancelPopup && currentRegistration?.patient && (
        <DurCancelPopup
          patient={currentRegistration.patient}
          encounter={encounter}
          onConfirmAction={handleDeleteEncounter}
          onCloseAction={setShowDurCancelPopup}
        />
      )}

      {showIssuanceNumberEdit && (
        <IssuanceNumberEditPopup
          isOpen={showIssuanceNumberEdit}
          onCloseAction={() => setShowIssuanceNumberEdit(false)}
          encounter={encounter}
          patient={currentRegistration?.patient}
          onSuccessAction={(updatedEncounter) => {
            updateEncounters(updatedEncounter);
            if (currentRegistration?.encounters) {
              const next = currentRegistration.encounters.map((e) =>
                e.id === updatedEncounter.id ? updatedEncounter : e
              ) as typeof currentRegistration.encounters;
              updateRegistration(currentRegistration.id, { encounters: next });
            }
            queryClient.invalidateQueries({
              queryKey: ["patient", encounter.patientId, "charts"],
            });
          }}
        />
      )}

      <MyContextMenu
        isOpen={contextMenu.isOpen}
        onCloseAction={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        items={safeContextMenuItems}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        width={140}
      />
      <PrescriptionHiddenRenderer />
      <ReceptionHtmlHiddenRenderer />
    </>
  );
}



