import type { Patient, Consent } from "@/types/patient-types";
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthUser,
  AuthUserHospital,
} from "@/types/auth-types";
import type { Hospital } from "@/types/hospital-types";
import { UserType } from "@/constants/common/common-enum";

// ================================ Patient Factory ================================

export function createPatient(overrides?: Partial<Patient>): Patient {
  return {
    id: 1,
    uuid: "test-uuid-0001",
    hospitalId: 1,
    name: "테스트환자",
    rrn: null,
    rrnView: null,
    rrnHash: null,
    gender: 1,
    phone1: "010-1234-5678",
    phone2: null,
    address1: "서울특별시 강남구",
    address2: "테헤란로 123",
    zipcode: "06142",
    birthDate: "1990-01-01",
    isActive: true,
    isTemporary: false,
    loginId: null,
    password: null,
    lastEncounterDate: null,
    nextAppointmentDateTime: null,
    createId: 1,
    createDateTime: "2024-01-01T00:00:00.000Z",
    updateId: null,
    updateDateTime: null,
    consent: null,
    vitalSignMeasurements: [],
    fatherRrn: "",
    identityVerifiedAt: null,
    identityOptional: null,
    eligibilityCheck: {} as Patient["eligibilityCheck"],
    groupId: null,
    memo: null,
    patientType: 0,
    patientNo: 1,
    idNumber: null,
    idType: null,
    chronicDisease: null,
    ...overrides,
  };
}

// ================================ Auth Factories ================================

export function createLoginRequest(
  overrides?: Partial<AuthLoginRequest>,
): AuthLoginRequest {
  return {
    loginId: "testuser",
    password: "password123!",
    hospitalId: 1,
    ...overrides,
  };
}

export function createAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 1,
    hospitalId: 1,
    loginId: "testuser",
    type: UserType.의사,
    name: "테스트의사",
    email: "test@hospital.com",
    mobile: "010-9999-8888",
    isActive: true,
    passwordChangedAt: null,
    ...overrides,
  };
}

export function createLoginResponse(
  overrides?: Partial<AuthLoginResponse>,
): AuthLoginResponse {
  return {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    user: createAuthUser(),
    ...overrides,
  };
}

export function createAuthUserHospital(
  overrides?: Partial<AuthUserHospital>,
): AuthUserHospital {
  return {
    hospitalId: 1,
    hospitalName: "테스트병원",
    isActive: true,
    ...overrides,
  };
}

// ================================ Hospital Factory ================================

export function createHospital(overrides?: Partial<Hospital>): Hospital {
  return {
    id: 1,
    name: "테스트병원",
    number: "12345",
    type: 1,
    locationType: 1,
    bizRegNumber: "123-45-67890",
    address1: "서울특별시 강남구",
    address2: "테헤란로 456",
    zipcode: "06142",
    phone: "02-1234-5678",
    director: "김원장",
    departments: [1],
    facilities: [],
    isActive: true,
    ...overrides,
  };
}
