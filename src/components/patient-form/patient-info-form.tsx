import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { PatientInfoSection } from "./patient-info-section";
import { usePatientForm } from "@/hooks/registration/actions/use-patient-form"
import type { PatientFormProps } from "@/types/form-types";
import { ScheduleSection } from "./schedule-section";
import { VitalsSection } from "./vitals-section";
import { FamilySection } from "./family-section";

export default function PatientInfoForm({
  children,
  isRegister = false,
  isEdit = false,
  patient,
  formOpen = false,
  setFormOpen,
}: PatientFormProps) {
  const { registrations } = useReceptionStore();
  const { hospital } = useHospitalStore();
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const hasRegistration = registrations?.some(
    (r) => r.patientId === patient?.id
  );

  const {
    form,
    isSubmitting,
    handleFieldChange,
    handleReset,
    handleRegister,
    handleEdit,
    handleDeleteRegistration,
    handleCreateRegistration,
  } = usePatientForm(patient, isEdit, () => {
    setFormOpen(false);
    handleReset();
  });

  const handleOpenChange = (isOpen: boolean) => {
    setFormOpen(isOpen);
  };

  useEffect(() => {
    if (!formOpen) {
      handleReset();
    }
  }, [formOpen, handleReset]);

  // ================================ 폼 렌더링 ================================
  return (
    <Dialog open={formOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="overflow-hidden p-0"
      >
        <div className="space-y-4 text-[0.75rem] overflow-y-auto max-h-[90vh] p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-[1rem]">
              신규환자 접수
            </DialogTitle>
          </DialogHeader>

          {/* 환자 정보 세션 */}
          <PatientInfoSection
            form={form}
            onFieldChange={handleFieldChange}
            openSelect={openSelect}
            setOpenSelect={setOpenSelect}
            isEdit={isEdit}
          />

          {/* 예약 정보 세션 */}
          <ScheduleSection
            form={form}
            onFieldChange={handleFieldChange}
            openSelect={openSelect}
            setOpenSelect={setOpenSelect}
            hospital={hospital}
          />

          {/* 바이탈 정보 세션 */}
          <VitalsSection form={form} onFieldChange={handleFieldChange} />

          {/* 가족 정보 세션 */}
          <FamilySection
            form={form}
            onFieldChange={handleFieldChange}
            openSelect={openSelect}
            setOpenSelect={setOpenSelect}
          />

          {/* ==================== 버튼 모음 ==================== */}
          <DialogFooter>
            <div className="flex gap-2">
              {!isRegister &&
                (hasRegistration ? (
                  <Button
                    variant="destructive"
                    className="text-white cursor-pointer"
                    onClick={handleDeleteRegistration}
                    type="button"
                    disabled={isSubmitting}
                  >
                    삭제
                  </Button>
                ) : (
                  <Button
                    className="text-white cursor-pointer"
                    onClick={handleCreateRegistration}
                    type="button"
                    disabled={isSubmitting}
                  >
                    등록
                  </Button>
                ))}
              {isEdit && (
                <Button
                  variant="outline"
                  className="text-[#999] cursor-pointer"
                  onClick={handleEdit}
                  type="button"
                  disabled={isSubmitting}
                >
                  수정
                </Button>
              )}
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="text-[#999] cursor-pointer"
                  type="button"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </DialogClose>
              {isRegister && (
                <Button
                  className="bg-[#FF6F2D] text-white cursor-pointer"
                  onClick={handleRegister}
                  type="button"
                  disabled={isSubmitting}
                >
                  완료
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
