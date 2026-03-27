import type { PatientFormType, Patient } from "@/types/patient-types";
import type { Registration } from "@/types/registration-types";
import { Gender, InsuranceType } from "@/constants/patient";

// 폼 초기값 상수 정의
export const INITIAL_FORM_STATE: PatientFormType = {
  name: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  phone: "",
  zipcode: "",
  address: "",
  memo: "",
  familyName: "",
  familyPhone: "",
  gender: Gender.None,
  purpose: "",
  visitType: "",
  insuranceType: InsuranceType.None,
  schedule: "",
  roomPanel: "",
  date: "",
  time: "",
  family: "",
  vitals: {},
};

// 환자 정보 수정을 위한 patient -> form 매핑 함수
export const mapPatientToForm = (
  patient: Patient
): Partial<PatientFormType> => {
  return {
    name: patient.name,
    birthYear: patient.birthDate?.slice(0, 4) || "",
    birthMonth: patient.birthDate?.slice(4, 6) || "",
    birthDay: patient.birthDate?.slice(6, 8) || "",
    phone: patient.phone1 || patient.phone2 || "",
    zipcode: patient.zipcode || "",
    address: patient.address1 || patient.address2 || "",
    gender: patient.gender as Gender,
  };
};

// 접수 정보 반영을 위한 registration -> form 매핑 함수
export const mapRegistrationToForm = (
  registration: Registration
): Partial<PatientFormType> => {
  return {
    memo: registration?.memo || "",
    insuranceType: registration?.insuranceType as InsuranceType,
    roomPanel: registration?.roomPanel || "",
  };
};

// 접수 정보 수정을 위한 form -> registration 매핑 함수
export const mapFormToRegistration = (
  form: PatientFormType,
  registration: Registration
): Registration => {
  // patient를 제외한 나머지 속성만 추출
  const { patient, ...rest } = registration;
  return {
    ...rest,
    memo: form.memo,
    insuranceType: form.insuranceType,
    roomPanel: form.roomPanel,
  };
};

// 환자 정보 수정을 위한 form -> patient 매핑 함수
// function mapFormToPatient(
//   form: PatientFormType,
//   registration: Registration
// ): any {
//   return {
//     ...registration.patient,
//     name: form.name,
//     birthDate: `${form.birthYear}-${form.birthMonth}-${form.birthDay}`,
//     gender: form.gender,
//     phone1: form.phone,
//     address1: form.address,
//     zipcode: form.zipcode,
//   };
// }
