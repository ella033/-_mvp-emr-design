"use client";

import { useState } from "react";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import { useHospitalStore } from "@/store/hospital-store";

import { useSpaceManagement } from "../hooks/use-space-management";
import { SpaceList } from "./space-list";
import { ManageSpaceModal } from "./manage-space-modal";
import { Facility, 공간코드 } from "../model";

export function SpaceInfoPage() {
  const { hospital } = useHospitalStore();
  const hospitalId = hospital?.id?.toString();

  const { loading, groupedSpaces, doctors, actions } = useSpaceManagement(hospitalId || "");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteErrorOpen, setDeleteErrorOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (facility: Facility) => {
    const assignedDoctors = actions.getAssignedDoctors(facility.id);
    if (assignedDoctors.length > 0) {
      setDeleteErrorOpen(true);
      return;
    }
    setDeleteId(facility.id);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await actions.deleteSpace(deleteId);
      setDeleteId(null);
    }
  };

  const handleSave = async (name: string, type: 공간코드, doctorIds?: number[]) => {
    try {
      if (editingFacility) {
        await actions.updateSpace(editingFacility.id, name, type, doctorIds);
      } else {
        await actions.addSpace(name, type, doctorIds);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]">
      <SettingPageHeader
        title="공간 정보"
        tooltipContent="병원 내 공간을 등록하고 관리할 수 있습니다."
      />

      <section className="flex flex-col w-full h-full flex-1 overflow-auto">
        <SectionLayout
          header={
            <div className="flex w-full items-center justify-between">
              <SettingPageHeader
                title="공간 구성"
              />
              <MyButton onClick={handleOpenAdd} variant="default" className="h-[32px]">
                + 공간 등록
              </MyButton>
            </div>
          }
          body={
            <>
              <SpaceList
                loading={loading}
                groupedSpaces={groupedSpaces}
                getAssignedDoctors={actions.getAssignedDoctors}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            </>
          }
        ></SectionLayout>
      </section>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ManageSpaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingFacility={editingFacility}
          doctors={doctors}
          assignedDoctors={editingFacility ? actions.getAssignedDoctors(editingFacility.id) : []}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <MyPopupYesNo
        isOpen={!!deleteId}
        onCloseAction={() => setDeleteId(null)}
        onConfirmAction={handleConfirmDelete}
        title="공간을 삭제하시겠습니까?"
        message={`삭제된 공간 데이터는 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
      />

      {/* Delete Error Alert */}
      <MyPopupMsg
        isOpen={deleteErrorOpen}
        onCloseAction={() => setDeleteErrorOpen(false)}
        title="공간을 삭제할 수 없습니다."
        message="진료의가 지정된 공간은 삭제할 수 없습니다."
        msgType="error"
        confirmText="확인"
      />
    </div>
  );
}
