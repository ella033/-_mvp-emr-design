import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useManualSendEligibility } from "./use-manual-send-eligibility";
import { CrmMessageService } from "@/services/crm-message-service";
import { ConsentPrivacyType } from "@/constants/common/common-enum";
import type { ConditionSearchPatient } from "@/types/crm/condition-search/condition-search-types";
import type { Patient } from "@/types/patient-types";

vi.mock("@/services/crm-message-service", () => ({
  CrmMessageService: {
    checkSendEligibility: vi.fn(),
  },
}));

vi.mock("@/components/yjg/my-pop-up", () => ({
  MyPopupMsg: () => null,
}));

const mockCheckSendEligibility = vi.mocked(
  CrmMessageService.checkSendEligibility
);

// 조건 검색 환자 헬퍼
function makeConditionPatient(
  id: number,
  overrides?: Partial<ConditionSearchPatient>
): ConditionSearchPatient {
  return {
    id,
    name: `환자${id}`,
    birthDate: "19900101",
    gender: 1,
    phone1: "010-1234-5678",
    ...overrides,
  };
}

// 개별 환자 헬퍼
function makePatient(overrides?: Partial<Patient>): Patient {
  return {
    id: 1,
    uuid: "test-uuid",
    hospitalId: 1,
    name: "홍길동",
    rrn: null,
    gender: 1,
    phone1: "010-1234-5678",
    phone2: null,
    address1: null,
    address2: null,
    zipcode: null,
    idNumber: null,
    idType: null,
    patientType: null,
    groupId: null,
    birthDate: "19900101",
    isActive: true,
    isTemporary: false,
    loginId: null,
    password: null,
    rrnView: null,
    rrnHash: null,
    lastEncounterDate: null,
    nextAppointmentDateTime: null,
    createId: 1,
    createDateTime: "2024-01-01",
    updateId: null,
    updateDateTime: null,
    consent: { privacy: ConsentPrivacyType.동의, marketing: true },
    vitalSignMeasurements: [],
    fatherRrn: "",
    identityVerifiedAt: null,
    eligibilityCheck: {} as any,
    ...overrides,
  } as Patient;
}

describe("useManualSendEligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkConditionSearchEligibility (조건 검색)", () => {
    it("Case 1-3: 전체 발송 가능 시 알럿 없이 onAllSendable 호출", async () => {
      const patients = [makeConditionPatient(1), makeConditionPatient(2)];
      mockCheckSendEligibility.mockResolvedValue({
        sendablePatientIds: [1, 2],
        unsendableReasons: {
          privacyNotAgreed: 0,
          noPhoneNumber: 0,
          marketingRejected: 0,
        },
      });

      const onAllSendable = vi.fn();
      const onPartialSendable = vi.fn();
      const onNoneSendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      await act(async () => {
        await result.current.checkConditionSearchEligibility(patients, {
          onAllSendable,
          onPartialSendable,
          onNoneSendable,
        });
      });

      expect(onAllSendable).toHaveBeenCalledWith(patients);
      expect(onPartialSendable).not.toHaveBeenCalled();
      expect(onNoneSendable).not.toHaveBeenCalled();
    });

    it("Case 1-1: 전체 발송 불가 시 알럿 표시 후 onNoneSendable 호출", async () => {
      const patients = [makeConditionPatient(1), makeConditionPatient(2)];
      mockCheckSendEligibility.mockResolvedValue({
        sendablePatientIds: [],
        unsendableReasons: {
          privacyNotAgreed: 1,
          noPhoneNumber: 1,
          marketingRejected: 0,
        },
      });

      const onAllSendable = vi.fn();
      const onPartialSendable = vi.fn();
      const onNoneSendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      await act(async () => {
        await result.current.checkConditionSearchEligibility(patients, {
          onAllSendable,
          onPartialSendable,
          onNoneSendable,
        });
      });

      // 알럿이 열린 상태 — 콜백은 아직 호출 안 됨 (확인 버튼 클릭 전)
      expect(onAllSendable).not.toHaveBeenCalled();
      expect(onPartialSendable).not.toHaveBeenCalled();
      expect(onNoneSendable).not.toHaveBeenCalled();
    });

    it("Case 1-2: 일부 발송 불가 시 알럿 표시 후 확인 클릭 시 onPartialSendable 호출", async () => {
      const patients = [
        makeConditionPatient(1),
        makeConditionPatient(2),
        makeConditionPatient(3),
      ];
      mockCheckSendEligibility.mockResolvedValue({
        sendablePatientIds: [1, 3],
        unsendableReasons: {
          privacyNotAgreed: 0,
          noPhoneNumber: 1,
          marketingRejected: 0,
        },
      });

      const onPartialSendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      await act(async () => {
        await result.current.checkConditionSearchEligibility(patients, {
          onAllSendable: vi.fn(),
          onPartialSendable,
          onNoneSendable: vi.fn(),
        });
      });

      expect(onPartialSendable).not.toHaveBeenCalled();
    });

    it("API에 올바른 patientIds를 전달한다", async () => {
      const patients = [makeConditionPatient(10), makeConditionPatient(20)];
      mockCheckSendEligibility.mockResolvedValue({
        sendablePatientIds: [10, 20],
        unsendableReasons: {
          privacyNotAgreed: 0,
          noPhoneNumber: 0,
          marketingRejected: 0,
        },
      });

      const { result } = renderHook(() => useManualSendEligibility());

      await act(async () => {
        await result.current.checkConditionSearchEligibility(patients, {
          onAllSendable: vi.fn(),
          onPartialSendable: vi.fn(),
          onNoneSendable: vi.fn(),
        });
      });

      expect(mockCheckSendEligibility).toHaveBeenCalledWith([10, 20]);
    });
  });

  describe("checkIndividualEligibility (개별 검색)", () => {
    it("Case 2-2: 발송 가능 환자 선택 시 onSendable 호출", () => {
      const patient = makePatient({
        phone1: "010-1234-5678",
        consent: { privacy: ConsentPrivacyType.동의, marketing: true },
      });

      const onSendable = vi.fn();
      const onUnsendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable,
        });
      });

      expect(onSendable).toHaveBeenCalledWith(patient);
      expect(onUnsendable).not.toHaveBeenCalled();
    });

    it("Case 2-1: 개인정보 수집 거부 환자 선택 시 onUnsendable은 확인 전 미호출", () => {
      const patient = makePatient({
        consent: { privacy: ConsentPrivacyType.거부, marketing: true },
      });

      const onSendable = vi.fn();
      const onUnsendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable,
        });
      });

      expect(onSendable).not.toHaveBeenCalled();
      // 알럿이 열려있으므로 확인 버튼 클릭 전까지 콜백 미호출
      expect(onUnsendable).not.toHaveBeenCalled();
    });

    it("Case 2-1: 휴대폰 번호 없는 환자 선택 시 onSendable 미호출", () => {
      const patient = makePatient({
        phone1: "",
        consent: { privacy: ConsentPrivacyType.동의, marketing: true },
      });

      const onSendable = vi.fn();
      const onUnsendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable,
        });
      });

      expect(onSendable).not.toHaveBeenCalled();
    });

    it("Case 2-1: 메시지 수신 거부 환자 선택 시 onSendable 미호출", () => {
      const patient = makePatient({
        phone1: "010-1234-5678",
        consent: { privacy: ConsentPrivacyType.동의, marketing: false },
      });

      const onSendable = vi.fn();
      const onUnsendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable,
        });
      });

      expect(onSendable).not.toHaveBeenCalled();
    });

    it("우선순위: 개인정보 거부가 휴대폰 번호 없음보다 우선", () => {
      const patient = makePatient({
        phone1: "",
        consent: { privacy: ConsentPrivacyType.거부, marketing: false },
      });

      const onSendable = vi.fn();
      const onUnsendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable,
        });
      });

      // 개인정보 거부가 먼저 체크되어 onSendable은 호출되지 않음
      expect(onSendable).not.toHaveBeenCalled();
    });

    it("consent가 null인 환자는 발송 가능", () => {
      const patient = makePatient({
        phone1: "010-1234-5678",
        consent: null,
      });

      const onSendable = vi.fn();
      const onUnsendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable,
        });
      });

      expect(onSendable).toHaveBeenCalledWith(patient);
      expect(onUnsendable).not.toHaveBeenCalled();
    });

    it("marketing이 1(number)인 환자는 발송 가능", () => {
      const patient = makePatient({
        phone1: "010-1234-5678",
        consent: {
          privacy: ConsentPrivacyType.동의,
          marketing: 1 as unknown as boolean,
        },
      });

      const onSendable = vi.fn();

      const { result } = renderHook(() => useManualSendEligibility());

      act(() => {
        result.current.checkIndividualEligibility(patient, {
          onSendable,
          onUnsendable: vi.fn(),
        });
      });

      expect(onSendable).toHaveBeenCalledWith(patient);
    });
  });
});
