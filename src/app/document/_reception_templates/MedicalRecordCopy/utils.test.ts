import { describe, it, expect, vi } from 'vitest';
import { transformToMedicalRecordCopyData } from './utils';
import type { Patient } from '@/types/patient-types';
import type { Encounter } from '@/types/chart/encounter-types';

vi.mock('dompurify', () => ({
  default: { sanitize: vi.fn((html: string) => html) },
}));

vi.mock('@/lib/date-utils', () => ({
  formatDate: vi.fn((date: any, _separator?: string) => {
    if (!date) return '';
    if (typeof date === 'string') {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return '';
  }),
}));

vi.mock('@/lib/patient-utils', () => ({
  formatPhoneNumber: vi.fn((phone: string) => phone || ''),
  getAgeOrMonth: vi.fn(() => '35'),
}));

vi.mock('@/lib/common-utils', () => ({
  formatRrnNumber: vi.fn((rrn: string) => rrn || ''),
  getUdeptDetailToUdept: vi.fn((val: number) => val),
}));

vi.mock('@/constants/common/common-enum', () => ({
  보험구분Label: { 0: '일반', 1: '건강보험', 2: '의료급여' },
}));

vi.mock('@/types/chart/order-types', () => ({
  InputType: { 구분선: 98, 묶음헤더: 99 },
}));

vi.mock('@/types/master-data/item-type', () => ({
  getPrescriptionDetailType: vi.fn(() => 'OTHER'),
  처방상세구분: { 검사: 'EXAM' },
}));

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 1,
    patientNo: 1001,
    name: '홍길동',
    birthDate: '1991-01-01',
    gender: 1,
    rrn: '910101-1234567',
    phone1: '010-1234-5678',
    phone2: '',
    address1: '서울시 강남구',
    address2: '역삼동 123',
    ...overrides,
  } as Patient;
}

function makeEncounter(overrides: any = {}): Encounter {
  return {
    id: 100,
    patientId: 1,
    encounterDateTime: '2026-03-01T10:00:00',
    doctorId: 10,
    receptionType: 1,
    registration: { receptionType: 1, insuranceType: 1 },
    diseases: [
      { code: 'J00', name: '급성 비인두염' },
      { code: 'J06', name: '급성 상기도감염' },
    ],
    orders: [
      {
        claimCode: 'MED001',
        name: '타이레놀',
        dose: '500mg',
        times: 3,
        days: 3,
        inputType: 1,
        itemType: 1,
      },
    ],
    symptom: '<p>두통, 발열</p>',
    vitals: {
      systolicBp: 120,
      diastolicBp: 80,
      pulse: 72,
      bloodSugar: 100,
      weight: 70,
      height: 175,
      bmi: 22.9,
      temperature: 36.5,
    },
    ...overrides,
  } as unknown as Encounter;
}

const baseDoctors = [{ id: 10, name: '이의사' }];
const baseHospitalInfo = {
  name: '테스트의원',
  address1: '서울시 강남구',
  address2: '역삼동',
  phone: '02-1234-5678',
};

describe('transformToMedicalRecordCopyData', () => {
  it('환자 기본 정보를 올바르게 매핑한다', () => {
    const result = transformToMedicalRecordCopyData({
      patient: makePatient(),
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
      doctors: baseDoctors,
    });

    expect(result.patient.id).toBe(1);
    expect(result.patient.chartNumber).toBe('1001');
    expect(result.patient.name).toBe('홍길동');
    expect(result.patient.gender).toBe('남');
  });

  it('여성 성별을 올바르게 처리한다', () => {
    const result = transformToMedicalRecordCopyData({
      patient: makePatient({ gender: 2 } as any),
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
      doctors: baseDoctors,
    });
    expect(result.patient.gender).toBe('여');
  });

  it('성별 코드가 1, 2가 아니면 빈 문자열을 반환한다', () => {
    const result = transformToMedicalRecordCopyData({
      patient: makePatient({ gender: 0 } as any),
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
      doctors: baseDoctors,
    });
    expect(result.patient.gender).toBe('');
  });

  it('주소를 결합하여 매핑한다', () => {
    const result = transformToMedicalRecordCopyData({
      patient: makePatient(),
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
      doctors: baseDoctors,
    });
    expect(result.patient.address).toBe('서울시 강남구 역삼동 123');
  });

  it('병원 정보를 올바르게 매핑한다', () => {
    const result = transformToMedicalRecordCopyData({
      patient: makePatient(),
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
      doctors: baseDoctors,
    });
    expect(result.hospital.name).toBe('테스트의원');
    expect(result.hospital.address).toBe('서울시 강남구 역삼동');
  });

  describe('내원 정보 변환', () => {
    it('방문일시를 올바르게 추출한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      expect(result.encounters).toHaveLength(1);
      expect(result.encounters[0].visitDate).toBe('2026-03-01');
    });

    it('초진/재진을 올바르게 구분한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ receptionType: 1 })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].visitType).toBe('초진');
    });

    it('재진을 올바르게 표시한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ receptionType: 2 })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].visitType).toBe('재진');
    });

    it('담당의 이름을 올바르게 매핑한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].doctorName).toBe('이의사');
    });

    it('담당의 정보가 없으면 빈 문자열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ doctorId: 999 })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].doctorName).toBe('');
    });
  });

  describe('진단 정보 변환', () => {
    it('첫 번째 진단을 주상병으로 표시한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      expect(result.encounters[0].diagnoses).toHaveLength(2);
      expect(result.encounters[0].diagnoses[0].isPrimary).toBe(true);
      expect(result.encounters[0].diagnoses[0].code).toBe('J00');
    });

    it('두 번째 이후 진단을 부상병으로 표시한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      expect(result.encounters[0].diagnoses[1].isSecondary).toBe(true);
      expect(result.encounters[0].diagnoses[1].code).toBe('J06');
    });

    it('진단 정보가 없으면 빈 배열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ diseases: [] })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].diagnoses).toHaveLength(0);
    });
  });

  describe('처방 정보 변환', () => {
    it('처방 항목을 올바르게 매핑한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      expect(result.encounters[0].orders).toHaveLength(1);
      expect(result.encounters[0].orders[0].name).toBe('타이레놀');
      expect(result.encounters[0].orders[0].dose).toBe('500mg');
    });

    it('구분선/묶음헤더 InputType은 제외한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [
          makeEncounter({
            orders: [
              { claimCode: 'A', name: '약1', inputType: 1 },
              { claimCode: 'B', name: '구분선', inputType: 98 },
              { claimCode: 'C', name: '묶음헤더', inputType: 99 },
            ],
          }),
        ],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      expect(result.encounters[0].orders).toHaveLength(1);
      expect(result.encounters[0].orders[0].name).toBe('약1');
    });

    it('처방 정보가 없으면 빈 배열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ orders: [] })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].orders).toHaveLength(0);
    });
  });

  describe('바이탈 정보 변환', () => {
    it('바이탈 데이터를 문자열로 변환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      const vitals = result.encounters[0].vitals;
      expect(vitals.systolicBp).toBe('120');
      expect(vitals.diastolicBp).toBe('80');
      expect(vitals.pulse).toBe('72');
      expect(vitals.weight).toBe('70');
      expect(vitals.height).toBe('175');
      expect(vitals.temperature).toBe('36.5');
    });

    it('바이탈 데이터가 없으면 "-"를 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ vitals: {} })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      const vitals = result.encounters[0].vitals;
      expect(vitals.systolicBp).toBe('-');
      expect(vitals.diastolicBp).toBe('-');
      expect(vitals.pulse).toBe('-');
    });
  });

  describe('증상 정보 변환', () => {
    it('HTML 증상을 sanitize하여 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ symptom: '<b>두통</b>' })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].symptomText).toBe('<b>두통</b>');
    });

    it('증상이 없으면 빈 문자열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ symptom: '' })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].symptomText).toBe('');
    });

    it('증상이 null이면 빈 문자열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter({ symptom: null })],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.encounters[0].symptomText).toBe('');
    });
  });

  describe('여러 내원이력 처리', () => {
    it('여러 내원이력을 모두 변환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [
          makeEncounter({ id: 1, encounterDateTime: '2026-03-01T10:00:00' }),
          makeEncounter({ id: 2, encounterDateTime: '2026-03-02T14:00:00' }),
        ],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });

      expect(result.encounters).toHaveLength(2);
      expect(result.encounters[0].encounterId).toBe('1');
      expect(result.encounters[1].encounterId).toBe('2');
    });
  });

  describe('누락 데이터 방어 처리', () => {
    it('patientNo가 null이면 빈 문자열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient({ patientNo: null } as any),
        encounters: [makeEncounter()],
        hospitalInfo: baseHospitalInfo,
        doctors: baseDoctors,
      });
      expect(result.patient.chartNumber).toBe('');
    });

    it('hospitalInfo가 빈 객체이면 빈 문자열을 반환한다', () => {
      const result = transformToMedicalRecordCopyData({
        patient: makePatient(),
        encounters: [makeEncounter()],
        hospitalInfo: {},
        doctors: baseDoctors,
      });
      expect(result.hospital.name).toBe('');
      expect(result.hospital.address).toBe('');
    });
  });
});
