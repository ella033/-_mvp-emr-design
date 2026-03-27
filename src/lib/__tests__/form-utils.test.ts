import { describe, it, expect } from 'vitest';
import { Gender, InsuranceType } from '@/constants/patient';
import {
  INITIAL_FORM_STATE,
  mapPatientToForm,
  mapRegistrationToForm,
  mapFormToRegistration,
} from '../form-utils';
import type { Patient } from '@/types/patient-types';
import type { Registration } from '@/types/registration-types';
import type { PatientFormType } from '@/types/patient-types';

// ---------------------------------------------------------------------------
// Helpers – minimal valid objects
// ---------------------------------------------------------------------------

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 1,
    uuid: 'uuid-1',
    hospitalId: 100,
    loginId: null,
    password: null,
    name: '홍길동',
    rrn: '9201011234567',
    rrnView: '920101-1******',
    rrnHash: null,
    gender: Gender.Male,
    phone1: '01012345678',
    phone2: '0311234567',
    birthDate: '19920101',
    address1: '서울시 강남구',
    address2: '역삼동 123',
    zipcode: '06241',
    chronicDisease: null,
    consent: null,
    identityVerifiedAt: null,
    lastEncounterDate: null,
    nextAppointmentDateTime: null,
    createId: 1,
    createDateTime: '2024-01-01T00:00:00',
    updateId: null,
    updateDateTime: null,
    vitalSignMeasurements: [],
    fatherRrn: '',
    eligibilityCheck: {} as any,
    idNumber: null,
    idType: null,
    isActive: true,
    isTemporary: false,
    patientType: null,
    groupId: null,
    ...overrides,
  } as Patient;
}

function makeRegistration(overrides: Partial<Registration> = {}): Registration {
  return {
    id: 'reg-1',
    hospitalId: 100,
    patientId: 1,
    receptionDateTime: '2024-01-01T09:00:00',
    memo: '메모 내용',
    insuranceType: InsuranceType.Health as any,
    receptionType: 1 as any,
    status: 0 as any,
    position: 'A',
    roomPanel: 'room-1',
    ...overrides,
  } as Registration;
}

function makeForm(overrides: Partial<PatientFormType> = {}): PatientFormType {
  return {
    ...INITIAL_FORM_STATE,
    ...overrides,
  } as PatientFormType;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('INITIAL_FORM_STATE', () => {
  it('has expected default values', () => {
    expect(INITIAL_FORM_STATE.name).toBe('');
    expect(INITIAL_FORM_STATE.birthYear).toBe('');
    expect(INITIAL_FORM_STATE.birthMonth).toBe('');
    expect(INITIAL_FORM_STATE.birthDay).toBe('');
    expect(INITIAL_FORM_STATE.phone).toBe('');
    expect(INITIAL_FORM_STATE.gender).toBe(Gender.None);
    expect(INITIAL_FORM_STATE.insuranceType).toBe(InsuranceType.None);
    expect(INITIAL_FORM_STATE.vitals).toEqual({});
    expect(INITIAL_FORM_STATE.memo).toBe('');
    expect(INITIAL_FORM_STATE.roomPanel).toBe('');
  });
});

describe('mapPatientToForm', () => {
  it('maps a full patient to form data', () => {
    const patient = makePatient({
      name: '이영희',
      birthDate: '19901215',
      phone1: '01098765432',
      phone2: '0212345678',
      zipcode: '12345',
      address1: '부산시 해운대구',
      gender: Gender.Female,
    });

    const result = mapPatientToForm(patient);

    expect(result.name).toBe('이영희');
    expect(result.birthYear).toBe('1990');
    expect(result.birthMonth).toBe('12');
    expect(result.birthDay).toBe('15');
    expect(result.phone).toBe('01098765432');
    expect(result.zipcode).toBe('12345');
    expect(result.address).toBe('부산시 해운대구');
    expect(result.gender).toBe(Gender.Female);
  });

  it('maps a minimal patient (null optional fields)', () => {
    const patient = makePatient({
      name: '김철수',
      birthDate: null,
      phone1: '',
      phone2: null,
      zipcode: null,
      address1: null,
      address2: null,
      gender: Gender.None,
    });

    const result = mapPatientToForm(patient);

    expect(result.name).toBe('김철수');
    expect(result.birthYear).toBe('');
    expect(result.birthMonth).toBe('');
    expect(result.birthDay).toBe('');
    expect(result.phone).toBe('');
    expect(result.zipcode).toBe('');
    expect(result.address).toBe('');
    expect(result.gender).toBe(Gender.None);
  });

  it('falls back to phone2 when phone1 is empty', () => {
    const patient = makePatient({
      phone1: '',
      phone2: '0311234567',
    });

    const result = mapPatientToForm(patient);

    expect(result.phone).toBe('0311234567');
  });

  it('falls back to address2 when address1 is null', () => {
    const patient = makePatient({
      address1: null,
      address2: '역삼동 456',
    });

    const result = mapPatientToForm(patient);

    expect(result.address).toBe('역삼동 456');
  });
});

describe('mapRegistrationToForm', () => {
  it('maps a full registration to form data', () => {
    const registration = makeRegistration({
      memo: '접수 메모',
      insuranceType: InsuranceType.Private as any,
      roomPanel: 'room-2',
    });

    const result = mapRegistrationToForm(registration);

    expect(result.memo).toBe('접수 메모');
    expect(result.insuranceType).toBe(InsuranceType.Private);
    expect(result.roomPanel).toBe('room-2');
  });

  it('maps a minimal registration (missing optional fields)', () => {
    const registration = makeRegistration({
      memo: undefined,
      roomPanel: undefined,
    });

    const result = mapRegistrationToForm(registration);

    expect(result.memo).toBe('');
    expect(result.roomPanel).toBe('');
  });
});

describe('mapFormToRegistration', () => {
  it('maps form data back to a registration object', () => {
    const registration = makeRegistration({
      memo: 'old memo',
      insuranceType: InsuranceType.None as any,
      roomPanel: 'old-room',
      patient: makePatient(),
    });

    const form = makeForm({
      memo: 'new memo',
      insuranceType: InsuranceType.Health,
      roomPanel: 'new-room',
    });

    const result = mapFormToRegistration(form, registration);

    expect(result.memo).toBe('new memo');
    expect(result.insuranceType).toBe(InsuranceType.Health);
    expect(result.roomPanel).toBe('new-room');
    // patient should be stripped out
    expect((result as any).patient).toBeUndefined();
    // other registration fields preserved
    expect(result.id).toBe('reg-1');
    expect(result.hospitalId).toBe(100);
  });

  it('handles partial form values', () => {
    const registration = makeRegistration();

    const form = makeForm({
      memo: '',
      insuranceType: InsuranceType.None,
      roomPanel: '',
    });

    const result = mapFormToRegistration(form, registration);

    expect(result.memo).toBe('');
    expect(result.insuranceType).toBe(InsuranceType.None);
    expect(result.roomPanel).toBe('');
  });
});
