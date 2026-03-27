import { useState, useEffect, useCallback } from "react";
import type { PatientFormType, Patient } from "@/types/patient-types";
import type { Registration } from "@/types/registration-types";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { useCreatePatient } from "@/hooks/patient/use-create-patient";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useCreateRegistration } from "@/hooks/registration/use-create-registration";
import { useDeleteRegistration } from "@/hooks/registration/use-delete-registration";
import {
  INITIAL_FORM_STATE,
  mapPatientToForm,
  mapRegistrationToForm,
  mapFormToRegistration,
} from "@/lib/form-utils";

export function usePatientForm(
  patient?: Patient,
  isEdit = false,
  onSuccess?: () => void
) {
  const { registrations, setRegistrations } = useReceptionStore();
  const { hospital } = useHospitalStore();
  const [form, setForm] = useState<PatientFormType>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: createPatient } = useCreatePatient();
  const { mutateAsync: updateRegistration } = useUpdateRegistration();
  const { mutateAsync: createRegistration } = useCreateRegistration();
  const { mutateAsync: deleteRegistration } = useDeleteRegistration();

  // 폼 초기화
  useEffect(() => {
    if (patient) {
      const newForm = {
        ...form,
        ...mapPatientToForm(patient),
      };

      const registration = registrations?.find(
        (r) => r.patientId === patient?.id
      );

      if (registration && isEdit) {
        Object.assign(newForm, mapRegistrationToForm(registration));
      }

      setForm(newForm);
    }
  }, [patient, isEdit, registrations]);

  // 필드 변경 핸들러
  const handleFieldChange = useCallback(
    (field: keyof PatientFormType, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // 폼 리셋
  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM_STATE);
  }, []);

  // 환자 등록
  const handleRegister = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // 환자 생성
      console.log(`[use-patient-form] handleRegister - createPatient 호출`);
      const newPatientInfo = createNewPatientInfo(form);
      const newPatient = await createPatient(newPatientInfo); // id만 내려옴
      console.log(`[use-patient-form] handleRegister - createPatient 완료`, newPatient);

      if (form.roomPanel && form.roomPanel !== "선택안함") {
        // 병원-환자 레코드 생성
        const newRegistrationObj = createRegistrationObject(
          hospital.id,
          newPatient.id,
          form
        );
        // 접수 생성
        const newRegistrationId = await createRegistration(newRegistrationObj);
        setRegistrations([
          ...(registrations as any[]),
          {
            ...newRegistrationId,
            ...newRegistrationObj,
            receptionDateTime: new Date().toISOString(),
            patient: {
              ...newPatient,
              ...newPatientInfo,
              createDateTime: new Date().toISOString(), // 신규 환자 표시를 위함
            },
          },
        ]);
      }

      onSuccess?.();
    } catch (error) {
      console.error("등록 실패:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    form,
    hospital?.id,
    registrations,
    createPatient,
    createRegistration,
    setRegistrations,
    onSuccess,
  ]);

  // 환자 정보 수정
  const handleEdit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const registration = registrations?.find(
        (r) => r.patientId === patient?.id
      );
      if (!registration) throw new Error("접수 정보를 찾을 수 없습니다");

      const updatedRegistration = mapFormToRegistration(form, registration);
      await updateRegistration({
        id: registration.id,
        data: updatedRegistration,
      });

      const updatedRegistrations = registrations?.map((p: Registration) =>
        p.patientId === patient?.id
          ? { ...updatedRegistration, patient: registration.patient }
          : { ...p }
      );

      if (updatedRegistrations) {
        setRegistrations(updatedRegistrations);
      }

      onSuccess?.();
    } catch (error) {
      console.error("업데이트 실패:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    form,
    patient?.id,
    registrations,
    updateRegistration,
    setRegistrations,
    onSuccess,
  ]);

  // 접수 삭제
  const handleDeleteRegistration = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const registration = registrations?.find(
        (r) => r.patientId === patient?.id
      );
      if (!registration) throw new Error("접수 정보를 찾을 수 없습니다");

      await deleteRegistration(registration.id.toString());
      const updatedRegistrations = registrations?.filter(
        (r) => r.id !== registration.id
      );
      setRegistrations(updatedRegistrations || []);
      onSuccess?.();
    } catch (error) {
      console.error("접수 삭제 실패:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    patient?.id,
    registrations,
    deleteRegistration,
    setRegistrations,
    onSuccess,
  ]);

  // 접수 생성
  const handleCreateRegistration = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (!patient?.id) throw new Error("환자 정보가 없습니다");

      const newRegistrationObj = createRegistrationObject(
        hospital.id,
        patient.id,
        form
      );
      const newRegistrationId = await createRegistration(newRegistrationObj);
      setRegistrations([
        ...(registrations as Registration[]),
        {
          ...newRegistrationId,
          ...newRegistrationObj,
          receptionDateTime: new Date().toISOString(),
          patient: patient,
        },
      ]);
      onSuccess?.();
    } catch (error) {
      console.error("접수 등록 실패:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    patient,
    hospital?.id,
    form,
    registrations,
    createRegistration,
    setRegistrations,
    onSuccess,
  ]);

  return {
    form,
    isSubmitting,
    handleFieldChange,
    handleReset,
    handleRegister,
    handleEdit,
    handleDeleteRegistration,
    handleCreateRegistration,
  };
}

// 환자 등록 API를 위한 객체 생성 함수
function createNewPatientInfo(form: PatientFormType) {
  const { name, gender, phone, zipcode, address } = form;
  return {
    name,
    rrn: form.birthYear.slice(-2) + form.birthMonth + form.birthDay + "1234560",
    gender: Number(gender),
    phone1: phone,
    phone2: "010-1232-1222",
    address1: address,
    address2: "상세 주소",
    zipcode,
    idNumber: null,
    idType: null,
    chronicDisease: {
      hypertension: true,
      diabetes: true,
      asthma: true,
      heartDisease: true,
      liverDisease: true,
      kidneyDisease: true,
      cancer: true,
      highCholesterol: true,
    },
    isActive: true,
    isTemporary: false,
    groupId: null,
  };
}

function createRegistrationObject(
  hospitalId: number,
  patientId: number,
  form: PatientFormType
) {
  return {
    hospitalId,
    patientId,
    memo: form.memo || "",
    insuranceType: Number(form.insuranceType) || 1,
    certificateNo: "123456",
    insuredPerson: "홍길동",
    providerCode: "A123",
    providerName: "국민건강보험공단",
    exemptionCode: "E01",
    receptionType: 1,
    extraQualification: {},
    patientRoute: {},
    roomPanel: "treatment",
    status: 1,
    doctorId: 4,
    facilityId: 4, // 임시데이터
  };
}
