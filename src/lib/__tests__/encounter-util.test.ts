import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Registration } from "@/types/registration-types";
import type { Encounter } from "@/types/chart/encounter-types";
import type { User } from "@/types/user-types";
import type { Order } from "@/types/chart/order-types";
import { 보험구분상세 } from "@/constants/common/common-enum";

// ================================ Service Mocks (hoisted) ================================

const {
  mockGetRegistrationCharts,
  mockGetPatientChart,
  mockCreateEncounter,
} = vi.hoisted(() => ({
  mockGetRegistrationCharts: vi.fn(),
  mockGetPatientChart: vi.fn(),
  mockCreateEncounter: vi.fn(),
}));

vi.mock("@/services/registrations-service", () => ({
  RegistrationsService: {
    getRegistrationCharts: mockGetRegistrationCharts,
  },
}));

vi.mock("@/services/patients-service", () => ({
  PatientsService: {
    getPatientChart: mockGetPatientChart,
  },
}));

vi.mock("@/services/encounters-service", () => ({
  EncountersService: {
    createEncounter: mockCreateEncounter,
  },
}));

// ================================ Import after mocks ================================

import {
  getRegistrationEncounter,
  getLatestEncounter,
  getEncounter,
  getRepeatableOrders,
  isRepeatableOrder,
} from "../encounter-util";

// ================================ Helpers ================================

const makeEncounter = (overrides: Partial<Encounter> = {}): Encounter => ({
  id: "enc-1",
  registrationId: "reg-1",
  patientId: 1,
  startDateTime: "2024-06-15T10:00:00",
  endDateTime: null,
  encounterDateTime: "2024-06-15T09:00:00",
  createId: 1,
  createDateTime: "2024-06-15T09:00:00",
  updateId: null,
  updateDateTime: null,
  userCode: "",
  claimCode: "",
  name: "",
  classificationCode: "",
  itemType: "",
  ...overrides,
});

const makeRegistration = (overrides: Partial<Registration> = {}): Registration =>
  ({
    id: "reg-1",
    hospitalId: 1,
    patientId: 1,
    receptionDateTime: "2024-06-15T08:00:00",
    insuranceType: 보험구분상세.일반,
    receptionType: 0,
    status: 0,
    position: "",
    ...overrides,
  }) as Registration;

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    hospitalId: 1,
    name: "Test Doctor",
    email: "test@test.com",
    type: 0,
    isActive: true,
    ...overrides,
  }) as User;

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: "ord-1",
    encounterId: "enc-1",
    userCode: "UC001",
    claimCode: "BB001",
    name: "Test Order",
    classificationCode: "",
    itemType: "",
    codeType: 0,
    inOutType: 0,
    oneTwoType: 0,
    insurancePrice: 1000,
    generalPrice: 1000,
    dose: 1,
    days: 1,
    times: 1,
    isPowder: false,
    paymentMethod: 0,
    isSelfPayRate30: false,
    isSelfPayRate50: false,
    isSelfPayRate80: false,
    isSelfPayRate90: false,
    isSelfPayRate100: false,
    isClaim: true,
    sortNumber: 1,
    createId: 1,
    createDateTime: "2024-06-15T10:00:00",
    updateId: null,
    updateDateTime: null,
    ...overrides,
  }) as Order;

// ================================ Tests ================================

describe("encounter-util", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================== isRepeatableOrder ==============================

  describe("isRepeatableOrder", () => {
    it("returns true when claimCode does not start with AA", () => {
      expect(isRepeatableOrder(makeOrder({ claimCode: "BB001" }))).toBe(true);
    });

    it("returns false when claimCode starts with AA", () => {
      expect(isRepeatableOrder(makeOrder({ claimCode: "AA001" }))).toBe(false);
    });

    it("returns true when claimCode is empty", () => {
      expect(isRepeatableOrder(makeOrder({ claimCode: "" }))).toBe(true);
    });

    it("returns true when claimCode is undefined", () => {
      const order = makeOrder();
      // @ts-expect-error testing undefined claimCode
      order.claimCode = undefined;
      expect(isRepeatableOrder(order)).toBe(true);
    });

    it("returns false for claimCode exactly 'AA'", () => {
      expect(isRepeatableOrder(makeOrder({ claimCode: "AA" }))).toBe(false);
    });

    it("returns true for claimCode 'AB001' (starts with A but not AA)", () => {
      expect(isRepeatableOrder(makeOrder({ claimCode: "AB001" }))).toBe(true);
    });
  });

  // ============================== getRepeatableOrders ==============================

  describe("getRepeatableOrders", () => {
    it("returns only non-AA orders", () => {
      const orders = [
        makeOrder({ id: "1", claimCode: "BB001" }),
        makeOrder({ id: "2", claimCode: "AA001" }),
        makeOrder({ id: "3", claimCode: "CC002" }),
        makeOrder({ id: "4", claimCode: "AA999" }),
      ];
      const result = getRepeatableOrders(orders);
      expect(result).toHaveLength(2);
      expect(result.map((o) => o.id)).toEqual(["1", "3"]);
    });

    it("returns empty array when all orders start with AA", () => {
      const orders = [
        makeOrder({ claimCode: "AA001" }),
        makeOrder({ claimCode: "AA002" }),
      ];
      expect(getRepeatableOrders(orders)).toHaveLength(0);
    });

    it("returns all orders when none start with AA", () => {
      const orders = [
        makeOrder({ claimCode: "BB001" }),
        makeOrder({ claimCode: "CC001" }),
      ];
      expect(getRepeatableOrders(orders)).toHaveLength(2);
    });

    it("returns empty array for empty input", () => {
      expect(getRepeatableOrders([])).toHaveLength(0);
    });
  });

  // ============================== getRegistrationEncounter ==============================

  describe("getRegistrationEncounter", () => {
    it("returns first encounter from registration charts", async () => {
      const enc = makeEncounter({ id: "enc-100" });
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [enc] });

      const result = await getRegistrationEncounter(makeRegistration());
      expect(result).toEqual(enc);
      expect(mockGetRegistrationCharts).toHaveBeenCalledWith("reg-1");
    });

    it("returns null when no encounters exist", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      const result = await getRegistrationEncounter(makeRegistration());
      expect(result).toBeNull();
    });

    it("returns null when encounters is undefined", async () => {
      mockGetRegistrationCharts.mockResolvedValue({});
      const result = await getRegistrationEncounter(makeRegistration());
      expect(result).toBeNull();
    });

    it("returns null when chart response is null", async () => {
      mockGetRegistrationCharts.mockResolvedValue(null);
      const result = await getRegistrationEncounter(makeRegistration());
      expect(result).toBeNull();
    });
  });

  // ============================== getLatestEncounter ==============================

  describe("getLatestEncounter", () => {
    it("returns encounter from registration if available", async () => {
      const enc = makeEncounter({ id: "from-reg" });
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [enc] });

      const result = await getLatestEncounter(1, makeRegistration());
      expect(result).toEqual(enc);
      // Should not call patient chart since registration encounter was found
      expect(mockGetPatientChart).not.toHaveBeenCalled();
    });

    it("falls back to patient chart when registration has no encounter", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      const enc = makeEncounter({ id: "from-patient" });
      mockGetPatientChart.mockResolvedValue({ encounters: [enc] });

      const reg = makeRegistration({ receptionDateTime: "2024-06-15T08:00:00" });
      const result = await getLatestEncounter(1, reg);

      expect(mockGetPatientChart).toHaveBeenCalledWith({ id: 1, limit: 50 });
      // The encounter's startDateTime is "2024-06-15T10:00:00" which is AFTER receptionDateTime
      // so findLatestEncounterBefore should return null
      expect(result).toBeNull();
    });

    it("returns latest encounter before reception date from patient chart", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });

      const enc1 = makeEncounter({
        id: "old",
        startDateTime: "2024-06-14T10:00:00",
        encounterDateTime: "2024-06-14T09:00:00",
      });
      const enc2 = makeEncounter({
        id: "newer-but-after",
        startDateTime: "2024-06-16T10:00:00",
        encounterDateTime: "2024-06-16T09:00:00",
      });

      mockGetPatientChart.mockResolvedValue({ encounters: [enc2, enc1] });

      const reg = makeRegistration({ receptionDateTime: "2024-06-15T08:00:00" });
      const result = await getLatestEncounter(1, reg);

      expect(result!.id).toBe("old");
    });

    it("returns first encounter when no registration provided", async () => {
      const enc = makeEncounter({ id: "first" });
      mockGetPatientChart.mockResolvedValue({ encounters: [enc] });

      const result = await getLatestEncounter(1);
      expect(result!.id).toBe("first");
    });

    it("returns null when patient chart has no encounters", async () => {
      mockGetPatientChart.mockResolvedValue({ encounters: [] });
      const result = await getLatestEncounter(1);
      expect(result).toBeNull();
    });

    it("returns null when patient chart encounters is undefined", async () => {
      mockGetPatientChart.mockResolvedValue({});
      const result = await getLatestEncounter(1);
      expect(result).toBeNull();
    });
  });

  // ============================== getEncounter ==============================

  describe("getEncounter", () => {
    it("returns existing encounter from registration", async () => {
      const enc = makeEncounter({ id: "existing" });
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [enc] });

      const result = await getEncounter(makeRegistration(), makeUser());
      expect(result).toEqual(enc);
      expect(mockCreateEncounter).not.toHaveBeenCalled();
    });

    it("creates new encounter when registration has none", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      const newEnc = makeEncounter({ id: "new-enc" });
      mockCreateEncounter.mockResolvedValue(newEnc);

      const reg = makeRegistration({
        id: "reg-2",
        patientId: 42,
        insuranceType: 보험구분상세.직장조합,
        receptionType: 1 as any,
      });
      const user = makeUser({ id: 5 });

      const result = await getEncounter(reg, user);

      expect(result).toEqual(newEnc);
      expect(mockCreateEncounter).toHaveBeenCalledWith({
        registrationId: "reg-2",
        patientId: 42,
        isClaim: true, // 직장조합 !== 일반
        doctorId: 5,
        receptionType: 1,
      });
    });

    it("sets isClaim to false for 일반 insurance type", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      mockCreateEncounter.mockResolvedValue(makeEncounter());

      const reg = makeRegistration({ insuranceType: 보험구분상세.일반 });
      await getEncounter(reg, makeUser());

      expect(mockCreateEncounter).toHaveBeenCalledWith(
        expect.objectContaining({ isClaim: false })
      );
    });

    it("sets isClaim to true for non-일반 insurance type", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      mockCreateEncounter.mockResolvedValue(makeEncounter());

      const reg = makeRegistration({ insuranceType: 보험구분상세.의료급여1종 });
      await getEncounter(reg, makeUser());

      expect(mockCreateEncounter).toHaveBeenCalledWith(
        expect.objectContaining({ isClaim: true })
      );
    });

    it("invalidates query cache when encounter is created and queryClient provided", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      mockCreateEncounter.mockResolvedValue(makeEncounter());

      const mockInvalidateQueries = vi.fn();
      const mockQueryClient = { invalidateQueries: mockInvalidateQueries } as any;

      const reg = makeRegistration({ patientId: 99 });
      await getEncounter(reg, makeUser(), mockQueryClient);

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["patient", 99, "charts"],
      });
    });

    it("does not invalidate query cache when no queryClient provided", async () => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
      mockCreateEncounter.mockResolvedValue(makeEncounter());

      // Should not throw
      await getEncounter(makeRegistration(), makeUser());
      expect(mockCreateEncounter).toHaveBeenCalled();
    });
  });

  // ============================== findLatestEncounterBefore (tested indirectly) ==============================

  describe("findLatestEncounterBefore (via getLatestEncounter)", () => {
    beforeEach(() => {
      mockGetRegistrationCharts.mockResolvedValue({ encounters: [] });
    });

    it("returns the most recent encounter before the given date", async () => {
      const encounters = [
        makeEncounter({ id: "e1", startDateTime: "2024-06-10T10:00:00" }),
        makeEncounter({ id: "e2", startDateTime: "2024-06-13T10:00:00" }),
        makeEncounter({ id: "e3", startDateTime: "2024-06-16T10:00:00" }),
      ];
      mockGetPatientChart.mockResolvedValue({ encounters });

      const reg = makeRegistration({ receptionDateTime: "2024-06-14T00:00:00" });
      const result = await getLatestEncounter(1, reg);

      expect(result!.id).toBe("e2");
    });

    it("returns null when all encounters are after the date", async () => {
      const encounters = [
        makeEncounter({ id: "e1", startDateTime: "2024-06-16T10:00:00" }),
        makeEncounter({ id: "e2", startDateTime: "2024-06-17T10:00:00" }),
      ];
      mockGetPatientChart.mockResolvedValue({ encounters });

      const reg = makeRegistration({ receptionDateTime: "2024-06-14T00:00:00" });
      const result = await getLatestEncounter(1, reg);

      expect(result).toBeNull();
    });

    it("uses encounterDateTime as fallback when startDateTime is null", async () => {
      const encounters = [
        makeEncounter({
          id: "e1",
          startDateTime: null,
          encounterDateTime: "2024-06-12T10:00:00",
        }),
        makeEncounter({
          id: "e2",
          startDateTime: null,
          encounterDateTime: "2024-06-13T10:00:00",
        }),
      ];
      mockGetPatientChart.mockResolvedValue({ encounters });

      const reg = makeRegistration({ receptionDateTime: "2024-06-14T00:00:00" });
      const result = await getLatestEncounter(1, reg);

      expect(result!.id).toBe("e2");
    });

    it("skips encounters with no compare date (both null)", async () => {
      const encounters = [
        makeEncounter({
          id: "e1",
          startDateTime: null,
          encounterDateTime: undefined,
        }),
        makeEncounter({
          id: "e2",
          startDateTime: "2024-06-12T10:00:00",
        }),
      ];
      mockGetPatientChart.mockResolvedValue({ encounters });

      const reg = makeRegistration({ receptionDateTime: "2024-06-14T00:00:00" });
      const result = await getLatestEncounter(1, reg);

      expect(result!.id).toBe("e2");
    });
  });
});
