import type { Registration } from "@/types/registration-types";
import type { CreateEncounterRequest, Encounter } from "@/types/chart/encounter-types";
import { RegistrationsService } from "@/services/registrations-service";
import { EncountersService } from "@/services/encounters-service";
import { PatientsService } from "@/services/patients-service";
import { 보험구분상세 } from "@/constants/common/common-enum";
import type { User } from "@/types/user-types";
import { QueryClient } from "@tanstack/react-query";
import { registrationKeys } from "@/lib/query-keys/registrations";
import { Order } from "@/types/chart/order-types";

const getEncounterCompareDate = (e: Encounter): string =>
  e.startDateTime ?? e.encounterDateTime ?? "";

// receptionDateTime보다 이전인 encounter 중 가장 최근 것 반환, 없으면 null
const findLatestEncounterBefore = (
  encounters: Encounter[],
  receptionDateTime: string
): Encounter | null => {
  const before = encounters.filter((e) => {
    const d = getEncounterCompareDate(e);
    return d && d < receptionDateTime;
  });
  if (before.length === 0) return null;
  before.sort((a, b) => {
    const da = getEncounterCompareDate(a);
    const db = getEncounterCompareDate(b);
    return da > db ? -1 : da < db ? 1 : 0;
  });
  return before[0] ?? null;
};

export const getRegistrationEncounter = async (registration: Registration) => {
  const registrationChart = await RegistrationsService.getRegistrationCharts(registration.id);
  if (
    registrationChart &&
    registrationChart.encounters &&
    registrationChart.encounters.length > 0
  ) {
    return registrationChart.encounters[0];
  }
  return null;
};

// 환자 ID 또는 접수 ID 기준으로 차트를 조회하여 가장 최근 encounter 반환(새로 생성하지 않음)
export const getLatestEncounter = async (patientId: number, registration?: Registration) => {
  if (registration) {
    const encounter = await getRegistrationEncounter(registration);
    if (encounter) {
      return encounter;
    }
  }
  const patientChart = await PatientsService.getPatientChart({
    id: patientId,
    limit: 50,
  });
  if (!patientChart.encounters?.length) return null;
  if (registration?.receptionDateTime) {
    return findLatestEncounterBefore(patientChart.encounters, registration.receptionDateTime);
  }
  return patientChart.encounters[0] ?? null;
};

export const getEncounter = async (
  registration: Registration,
  user: User,
  queryClient?: QueryClient
) => {
  const encounter = await getRegistrationEncounter(registration);
  if (encounter) {
    return encounter;
  } else {
    return await createEncounter(registration, user, queryClient);
  }
};

export const createEncounter = async (
  registration: Registration,
  user: User,
  queryClient?: QueryClient
) => {
  const newEncounter: CreateEncounterRequest = {
    registrationId: registration.id,
    patientId: registration.patientId,
    isClaim: registration.insuranceType !== 보험구분상세.일반,
    doctorId: user.id,
    receptionType: registration.receptionType,
  };

  const encounter = await EncountersService.createEncounter(newEncounter);
  // encounter가 새로 생성되었을 때 관련 쿼리 invalidate
  if (queryClient) {
    queryClient.invalidateQueries({
      queryKey: ["patient", registration.patientId, "charts"],
    });
    // registrations 쿼리도 invalidate하여 registration.encounters가 갱신되도록 함
    queryClient.invalidateQueries({
      queryKey: registrationKeys.all,
    });
  }

  return encounter;
};

export const getRepeatableOrders = (orders: Order[]) => {
  return orders.filter(isRepeatableOrder);
};

export const isRepeatableOrder = (order: Order) => {
  return !order.claimCode?.startsWith("AA");
};
