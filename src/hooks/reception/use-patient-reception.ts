import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePatient } from "@/hooks/patient/use-create-patient";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import { useDeletePatient } from "@/hooks/patient/use-delete-patient";
import { useCreateRegistration } from "@/hooks/registration/use-create-registration";
import { useCreateMedicalAid } from "@/hooks/patient/use-create-medical-aid";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useHospitalStore } from "@/store/hospital-store";
import { useDoctorsStore } from "@/store/doctors-store";
import {
  useUpsertPatientFamiliesByPatient,
  SavePatientFamilyType,
} from "@/hooks/patient-family/use-upsert-patient-families-by-patient";
import { useDeleteUpsertManyVitalSignMeasurements } from "@/hooks/vital-sign-measurement/use--vital-sign-measurements-upsert";
import { useToastHelpers } from "@/components/ui/toast";
import {
  setEligibilityResponseToInsuranceInfo,
  extractExtraQualificationFromParsedData,
  normalizeExtraQualification,
} from "@/lib/eligibility-utils";
import { QualificationService } from "@/services/nhmp/qualification-service";
import {
  getResidentRegistrationNumberWithNumberString,
  mapToPatient,
} from "@/lib/patient-utils";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import type { VitalPatientInfoType } from "@/store/selected-detail-patient-info-store";
import type {
  CreateRegistrationRequest,
  Registration,
  UpdateRegistrationRequest,
} from "@/types/registration-types";
import {
  ConsentPrivacyType,
  주간야간휴일구분,
  초재진,
  DetailCategoryType,
  의료급여메시지타입,
  보험구분상세,
  AppointmentStatus,
  접수상태,
  본인부담구분코드,
  공간코드,
  ReceptionInitialTab,
} from "@/constants/common/common-enum";
import {
  convertKSTtoUTCString,
  createReceptionDateTime,
  formatDate,
  formatDateByPattern,
  parseBirthDate,
} from "@/lib/date-utils";
import type { Appointment } from "@/types/appointments/appointments";
import type { Reception } from "@/types/common/reception-types";
import type { VitalReceptionInfoType } from "@/types/common/reception-types";
import type { components } from "@/generated/api/types";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";
import { useDeleteRegistration } from "../registration/use-delete-registration";
import { useFacilityStore } from "@/store/facility-store";
import {
  REGISTRATION_ID_NEW,
  buildAppointmentRegistrationId,
  isRegistrationMode,
  isNewRegistrationId,
  normalizeRegistrationId,
} from "@/lib/registration-utils";
import { EncountersService } from "@/services/encounters-service";
import { useUpdateEncounter } from "@/hooks/encounter/use-encounter-update";
import { useCreateOrder } from "@/hooks/order/use-create-order";
import { useUserStore } from "@/store/user-store";
import { useEncounterStore } from "@/store/encounter-store";
import { useSelectedDateStore } from "@/store/reception/selected-date-store";
import type { CreateOrderRequest } from "@/types/chart/order-types";
import { ReceptionService } from "@/services/reception-service";
import { getEncounter } from "@/lib/encounter-util";
import { RegistrationsService } from "@/services/registrations-service";
import { PANEL_TYPE } from "@/constants/reception";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { clear임신부IfOverLimit } from "@/lib/extra-qualification-utils";

export class QualificationFetchError extends Error {
  constructor(public originalError: unknown) {
    super("자격조회 요청 실패");
    this.name = "QualificationFetchError";
  }
}

export const usePatientReception = () => {
  //#region Dependencies & Services
  const queryClient = useQueryClient();
  const { hospital } = useHospitalStore();
  const { success, error } = useToastHelpers();
  const { user } = useUserStore();
  const { updateEncounters } = useEncounterStore();
  //#endregion

  //#region State Management
  // 자격조회 비교 모드 상태
  const [showQualificationComparePopup, setShowQualificationComparePopup] =
    useState(false);
  const [qualificationCompareData, setQualificationCompareData] = useState<{
    oldInsuranceInfo: Partial<InsuranceInfo> | undefined;
    newInsuranceInfo: Partial<InsuranceInfo>;
    parsedData: components["schemas"]["EligibilityCheckResponseDto"];
    reception: Reception;
    eligibilityResponse: EligibilityCheck;
  } | null>(null);

  // 팝업 상태를 Promise로 관리
  type PopupResolver = {
    resolve: (value: boolean) => void;
    reject: (reason?: any) => void;
  };

  const [comparePopupResolver, setComparePopupResolver] =
    useState<PopupResolver | null>(null);
  //#endregion

  //#region API Hooks
  // Mutations
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();
  const createRegistrationMutation = useCreateRegistration();
  const updateRegistrationMutation = useUpdateRegistration();
  const deleteRegistrationMutation = useDeleteRegistration();
  const createMedicalAidMutation = useCreateMedicalAid();
  const upsertPatientFamiliesMutation = useUpsertPatientFamiliesByPatient();
  const upsertVitalMeasurementsMutation =
    useDeleteUpsertManyVitalSignMeasurements();
  const createOrderMutation = useCreateOrder();
  const updateEncounterMutation = useUpdateEncounter();
  //#endregion

  //#region Helper Functions
  // 본인부담구분코드를 문자열로 변환하는 함수
  const get본인부담구분코드String = (cfcd: number): string => {
    // ENUM의 숫자 값에 해당하는 키를 찾아서 반환
    const enumEntry = Object.entries(본인부담구분코드).find(
      ([, value]) => typeof value === "number" && value === cfcd
    );
    return enumEntry ? enumEntry[0] : "해당없음";
  };

  // 공통 환자 데이터 생성 함수
  const setPatientBaseInfo = (reception: Reception) => {
    return {
      patientNo: reception?.patientBaseInfo.patientNo,
      name: reception?.patientBaseInfo.name || "",
      rrn: (reception?.patientBaseInfo.rrn || "").replace(/-/g, ""),
      gender: reception?.patientBaseInfo.gender || 0,
      phone1: reception?.patientBaseInfo.phone1 || "",
      zipcode: reception?.patientBaseInfo.zipcode || "",
      address1: reception?.patientBaseInfo.address || "",
      address2: reception?.patientBaseInfo.address2 || "",
      idNumber: reception?.patientBaseInfo.idNumber ?? null,
      idType: reception?.patientBaseInfo.idType ?? null,
      patientType: 0, // 0=GENERAL(일반내국인)
      chronicDisease: reception?.patientStatus.chronicFlags || {
        diabetes: false,
        hypertension: false,
        highCholesterol: false,
      },
      isActive: true,
      memo: reception?.patientBaseInfo.patientMemo || "",
      groupId: reception?.patientBaseInfo.groupId ?? null,
      doctorId:
        reception.patientBaseInfo.doctorId ??
        useDoctorsStore.getState().doctors[0]?.id ??
        0,
      facilityId:
        reception.patientBaseInfo.facilityId ??
        useFacilityStore.getState().getTreatmentFacilities(공간코드.진료)[0]
          ?.id ??
        0,
      consent: {
        privacy:
          reception?.patientBaseInfo.isPrivacy || ConsentPrivacyType.미동의,
        marketing: reception?.patientBaseInfo.recvMsg === 1 ? true : false,
      },
      identityVerifiedAt: reception?.patientBaseInfo.identityVerifiedAt ?? null,
      birthDate: formatDate(reception?.patientBaseInfo.birthday, ""),
      phone2: "",
      //TODO - 임시 환자 처리
      isTemporary: false,
      symptom: "",
      visitRoute: "",
      recommender: "",
    };
  };

  // Save Patient Etc Info - Family, Vital
  const saveFamilyInfo = useCallback(
    async (pid: string, currentReception: Reception) => {
      if (
        currentReception?.patientBaseInfo.family &&
        currentReception?.patientBaseInfo.family.length > 0
      ) {
        const items = currentReception?.patientBaseInfo.family.map((fam) => {
          const item: any = {
            patientFamilyId: fam.patientFamilyId,
            relationType: fam.relation,
          };
          if (fam.id && fam.id !== 0) {
            item.id = fam.id;
          }
          return item;
        });
        const payload = {
          patientId: Number(pid),
          items,
        } as SavePatientFamilyType;
        await upsertPatientFamiliesMutation.mutateAsync(payload);
      }
    },
    [upsertPatientFamiliesMutation]
  );

  const saveVitalInfo = useCallback(
    async (pid: string, newVitalMeasurements: VitalReceptionInfoType[]) => {
      const storedVitalMeasurements = newVitalMeasurements.map(
        (measurement) => ({
          id: measurement.id?.toString() || "",
          measurementDateTime: measurement.measurementDateTime,
          itemId: measurement.itemId,
          value: measurement.value?.toString() || "0",
          memo: measurement.memo || "",
        })
      );

      const groups = storedVitalMeasurements.reduce(
        (acc: Record<string, VitalPatientInfoType[]>, curr) => {
          const key = curr.measurementDateTime;
          if (!acc[key]) acc[key] = [];
          acc[key].push(curr);
          return acc;
        },
        {}
      );

      const filteredStored = Object.values(groups).flatMap((group) =>
        group.some((m) => m.value !== "0") ? group : []
      );

      const apiVitalMeasurements = filteredStored.map((m) =>
        m.id === null || m.id === undefined || m.id === "" || m.id === "0"
          ? {
            measurementDateTime: m.measurementDateTime,
            itemId: m.itemId,
            value: parseFloat(m.value) || 0,
            memo: m.memo,
          }
          : {
            ...m,
            value: parseFloat(m.value) || 0,
          }
      );

      if (apiVitalMeasurements.length > 0) {
        const payload = {
          patientId: Number(pid),
          vitalSignMeasurements: {
            items: apiVitalMeasurements,
          },
        };
        await upsertVitalMeasurementsMutation.mutateAsync(payload as any);
      }
    },
    [upsertVitalMeasurementsMutation]
  );
  //#endregion

  //#region Helper Functions for Verbal Orders
  /**
   * verbalOrdersInfo가 있는 경우 Encounter 생성/조회 후 orders 생성
   */
  const processVerbalOrdersInfo = useCallback(
    async (
      registrationId: string,
      verbalOrdersInfo: CreateOrderRequest[] | undefined
    ) => {
      if (!verbalOrdersInfo || verbalOrdersInfo.length === 0) {
        return;
      }
      const registration =
        await RegistrationsService.getRegistration(registrationId);
      const encounter = await getEncounter(registration, user);

      // verbalOrdersInfo의 각 order에 encounterId 설정 후 생성
      const orderPromises = verbalOrdersInfo.map((order) => {
        const orderWithEncounterId: CreateOrderRequest = {
          ...order,
          encounterId: encounter.id,
        };
        return createOrderMutation.mutateAsync(orderWithEncounterId);
      });

      await Promise.all(orderPromises);

      // Encounter 정보 업데이트
      const updatedEncounter = await EncountersService.getEncounter(
        encounter.id
      );
      updateEncounters(updatedEncounter);
    },
    [createOrderMutation, user, updateEncounters]
  );
  //#endregion

  //#region Core Functions
  /**
   * 접수 취소 처리 함수 (Reception Store 의존성 없음)
   */
  const cancelRegistration = useCallback(
    async (registrationId: string) => {
      try {
        await deleteRegistrationMutation.mutateAsync(registrationId);
        return {
          success: true,
          registrationId,
        };
      } catch (err: any) {
        console.error("[cancelRegistration] 접수 취소 실패:", err);
        throw err;
      }
    },
    [deleteRegistrationMutation]
  );

  /**
   * 접수 수정 처리 함수 (Reception Store 의존성 없음)
   */
  const updateRegistration = useCallback(
    async (
      registrationId: string,
      reception: Reception,
      insuranceInfo: Partial<InsuranceInfo>,
      isNewPatient: boolean,
      _newVitalMeasurements: VitalReceptionInfoType[] = []
    ) => {
      try {
        if (isRegistrationMode(registrationId)) {
          if (isNewPatient) {
            const createPatient = setPatientBaseInfo(reception);
            const createdPatient =
              await createPatientMutation.mutateAsync(createPatient);
            const patientId = String(createdPatient.id);
            return {
              success: true,
              patientId,
              patientNo: createdPatient.patientNo,
              registrationId,
              registration: null,
            };
          }
        }

        // 1. 환자 정보 업데이트
        const updatePatient = setPatientBaseInfo(reception);

        const patientId =
          reception?.patientBaseInfo.patientId?.toString() ?? "";

        // patientId 유효성 검증
        if (
          !patientId ||
          patientId === "0" ||
          patientId === "new" ||
          patientId.trim() === ""
        ) {
          throw new Error("환자 ID가 없습니다.");
        }

        const patientIdNumber = Number(patientId);
        if (!Number.isInteger(patientIdNumber) || patientIdNumber <= 0) {
          throw new Error(`유효하지 않은 환자 ID입니다: ${patientId}`);
        }

        const updatePatientResponse = await updatePatientMutation.mutateAsync({
          patientId: patientIdNumber,
          updatePatient,
        });

        if (isRegistrationMode(registrationId)) {
          // 접수모드인 경우 환자정보만 수정됨
          return {
            success: true,
            patientId,
            patientNo: updatePatientResponse.patientNo,
            registrationId,
            registration: null,
          };
        }

        // 3. Family & Vital 저장
        await saveFamilyInfo(patientId, reception);
        await saveVitalInfo(patientId, reception.bioMeasurementsInfo.vital);

        // insuranceInfo가 전달되지 않았으면 reception.insuranceInfo에서 가져오기
        const finalInsuranceInfo =
          insuranceInfo || reception?.insuranceInfo || {};
        const finalExtraQualification =
          finalInsuranceInfo?.extraQualification ??
          reception?.insuranceInfo?.extraQualification ??
          {};

        // 4. Registration 업데이트
        // 초진/재진, 주간/야간은 접수 폼에서 사용자가 설정한 값을 그대로 사용
        // (부속의원인 경우 초기값은 patients-list-header에서 재진/주간으로 설정됨)
        const resolvedReceptionType =
          reception?.receptionInfo.receptionType ?? 초재진.초진;
        const resolvedTimeCategory =
          reception?.receptionInfo.timeCategory ?? 주간야간휴일구분.주간;

        const updateRegistrationData: UpdateRegistrationRequest = {
          memo: reception?.patientBaseInfo.receptionMemo,
          insuranceType: finalInsuranceInfo?.uDeptDetail ?? 보험구분상세.일반,
          receptionType: resolvedReceptionType,
          status: reception?.receptionInfo.status ?? (접수상태.대기 || 0),
          certificateNo: finalInsuranceInfo?.cardNumber ?? "",
          insuredPerson: finalInsuranceInfo?.father ?? "",
          providerCode: finalInsuranceInfo?.unionCode ?? "",
          providerName: finalInsuranceInfo?.unionName ?? "",
          exemptionCode: finalInsuranceInfo?.cfcd
            ? get본인부담구분코드String(finalInsuranceInfo.cfcd)
            : "해당없음",
          patientRoute: {},
          roomPanel: reception?.patientBaseInfo.roomPanel ?? "",
          doctorId:
            reception.patientBaseInfo.doctorId ??
            useDoctorsStore.getState().doctors[0]?.id ??
            0,
          facilityId: reception?.patientBaseInfo.facilityId ?? null,
          exceptionCode: reception?.receptionInfo.exceptionCode ?? null,
          extraQualification: finalExtraQualification,
          detailCategory:
            reception?.receptionInfo.detailCategory ?? DetailCategoryType.없음,
          serviceType: reception?.receptionInfo.checkup ?? null,
          timeCategory: resolvedTimeCategory,
          position: reception?.patientStatus.position ?? "",
          eligibilityCheckId: (() => {
            const id = reception?.patientBaseInfo?.eligibilityCheck?.id;
            if (!id) return null;
            // 숫자로 변환 (문자열이면 숫자로, 이미 숫자면 그대로)
            return typeof id === "string" ? Number(id) : Number(id);
          })(),
        };

        // 보험구분 변경 시에만 기존 접수의 encounter isClaim 동기화를 위해 현재 접수 조회
        const currentReg = await RegistrationsService.getRegistration(
          registrationId
        );
        const oldInsuranceType = currentReg?.insuranceType;
        const newInsuranceType = updateRegistrationData.insuranceType ?? 보험구분상세.일반;

        const updateResponse = await updateRegistrationMutation.mutateAsync({
          id: registrationId,
          data: updateRegistrationData,
        });
        updateResponse.patient = updatePatientResponse;

        // verbalOrdersInfo가 있는 경우 Encounter 생성 후 orders 생성
        if (
          reception.verbalOrdersInfo &&
          reception.verbalOrdersInfo.length > 0
        ) {
          await processVerbalOrdersInfo(
            updateResponse.id,
            reception.verbalOrdersInfo
          );
        }

        // 보험구분이 기존과 다르게 변경된 경우: 해당 접수의 모든 encounter isClaim 동기화
        if (Number(oldInsuranceType) !== Number(newInsuranceType)) {
          const dateStr =
            reception?.receptionDateTime != null
              ? formatDateByPattern(
                  reception.receptionDateTime instanceof Date
                    ? reception.receptionDateTime
                    : reception.receptionDateTime,
                  "YYYY-MM-DD"
                )
              : formatDateByPattern(
                  updateResponse.receptionDateTime ?? "",
                  "YYYY-MM-DD"
                );
          if (dateStr) {
            try {
              const encounters =
                await EncountersService.getEncountersByRegistration(
                  registrationId,
                  dateStr,
                  dateStr
                );
              const newIsClaim =
                newInsuranceType === 보험구분상세.일반 ? false : true;
              await Promise.all(
                encounters.map((enc) =>
                  updateEncounterMutation.mutateAsync({
                    id: enc.id,
                    data: {
                      registrationId: enc.registrationId,
                      patientId: enc.patientId,
                      isClaim: newIsClaim,
                    },
                  })
                )
              );
            } catch (encErr) {
              console.error(
                "[updateRegistration] encounter isClaim 동기화 실패:",
                encErr
              );
            }
          }
        }

        return {
          success: true,
          patientId,
          patientNo: updatePatientResponse.patientNo,
          registrationId: updateResponse.id,
          registration: updateResponse,
        };
      } catch (err: any) {
        console.error("[updateRegistration] 접수 수정 실패:", err);

        // 중복 주민등록번호 에러 체크 (409 Conflict, P2002 에러 코드)
        if (err?.status === 409 && err?.data?.code === "P2002") {
          const target = err?.data?.meta?.target;
          if (target && target.includes("rrn_hash")) {
            error("동일한 주민등록번호로 접수된 환자가 있습니다");
          } else {
            error("중복된 데이터가 존재합니다");
          }
        }

        throw err;
      }
    },
    [
      updatePatientMutation,
      createMedicalAidMutation,
      updateRegistrationMutation,
      updateEncounterMutation,
      saveFamilyInfo,
      saveVitalInfo,
      error,
      processVerbalOrdersInfo,
    ]
  );
  /**
   * 최근 환자 접수 내역을 조회하여 Reception 객체 생성
   * - 최근 접수가 있으면 해당 내역으로 Reception 생성
   * - 없으면 환자 정보로 초기 Reception 생성. 만약 없는 경우 nullReturn을 희망한다면 isNullReturn을 true로 요청
   * - 예약환자의 경우는 registrationId를 a+appointmentId로 생성
   * - 신규/접수 환자의 임시 registrationId는 "new"로 생성
   * - 예약환자의 경우 receptionTime과 appointment param 모두 넘겨줘야 함. 그 외는patient param만 넘겨도 됨
   */
  const getLatestReception = useCallback(
    async (
      patient: any,
      isNullReturn: boolean = false,
      receptionTime: any = null,
      appointment: Appointment | null = null,
      baseDate?: string
    ) => {
      const { RegistrationsService } = await import(
        "@/services/registrations-service"
      );
      const { ReceptionService } = await import("@/services/reception-service");
      const { selectedDate } = useSelectedDateStore.getState();
      try {
        const isAttachedCreate = hospital?.isAttachedClinic === true;

        // 1. 최근 접수 정보 조회
        let registrationsResponse = null;
        try {
          const finalBaseDate = baseDate || formatDate(selectedDate, "-");
          registrationsResponse =
            await RegistrationsService.getLatestRegistration(
              String(patient.id),
              finalBaseDate || undefined
            );
        } catch (error) {
          // 최근 접수 정보 없음
        }
        const birthDate = parseBirthDate(patient?.birthDate);

        const { getTreatmentFacilities } = useFacilityStore.getState();
        const treatmentFacilities = getTreatmentFacilities(공간코드.진료);
        const defaultFacilityId =
          treatmentFacilities.length > 0
            ? (treatmentFacilities[0]?.id ?? 0)
            : 0;

        if (registrationsResponse && registrationsResponse.id) {
          const { EncountersService } = await import(
            "@/services/encounters-service"
          );
          // 최근 접수가 있는 경우
          registrationsResponse.receptionDateTime = receptionTime ?? new Date();
          registrationsResponse.memo = "";

          const resolvedRegistrationId =
            appointment != null &&
              appointment.status !== AppointmentStatus.VISITED
              ? buildAppointmentRegistrationId(appointment.id)
              : normalizeRegistrationId(registrationsResponse.id);

          const reception = ReceptionService.convertRegistrationToReception({
            ...registrationsResponse,
            id: resolvedRegistrationId,
            roomPanel:
              appointment != null &&
                appointment.status !== AppointmentStatus.VISITED
                ? PANEL_TYPE.APPOINTMENT
                : registrationsResponse.roomPanel || "",
            patient: mapToPatient(registrationsResponse.patient),
            status: 접수상태.대기,
            facilityId: registrationsResponse.facilityId ?? defaultFacilityId,
            doctorId:
              registrationsResponse.doctorId ??
              useDoctorsStore.getState().doctors[0]?.id ??
              0,
            receptionType: isAttachedCreate
              ? 초재진.재진
              : (await EncountersService.getCheckRevisit(
              String(patient?.id ?? "0"),
              selectedDate.toISOString()
            )),
            timeCategory: isAttachedCreate
              ? 주간야간휴일구분.주간
              : (registrationsResponse.timeCategory ?? 주간야간휴일구분.주간),
          });
          clear임신부IfOverLimit(reception.insuranceInfo, selectedDate);
          return reception;
        } else {
          if (isNullReturn) {
            return null;
          }
          // 최근 접수가 없는 경우 - 초기 reception 생성
          const initialReception = ReceptionService.createInitialReception();
          initialReception.originalRegistrationId =
            appointment != null
              ? buildAppointmentRegistrationId(appointment.id)
              : REGISTRATION_ID_NEW;
          initialReception.patientBaseInfo.patientId = String(
            patient?.id ?? "0"
          );
          initialReception.patientBaseInfo.name = patient?.name ?? "";
          initialReception.patientBaseInfo.birthday = birthDate;
          initialReception.patientBaseInfo.gender = patient?.gender ?? 0;
          initialReception.patientBaseInfo.rrn = patient?.rrn ?? "";
          initialReception.patientBaseInfo.zipcode = patient?.zipcode ?? "";
          initialReception.patientBaseInfo.address = patient?.address1 ?? "";
          initialReception.patientBaseInfo.address2 = patient?.address2 ?? "";
          initialReception.patientBaseInfo.phone1 = patient?.phone1 ?? "";
          initialReception.patientBaseInfo.phone2 = patient?.phone2 ?? "";
          initialReception.patientBaseInfo.idNumber = patient?.idNumber ?? null;
          initialReception.patientBaseInfo.idType = patient?.idType ?? null;
          initialReception.patientBaseInfo.lastVisit =
            patient?.lastEncounterDate ?? null;
          initialReception.patientBaseInfo.isActive = patient?.isActive ?? true;
          initialReception.patientBaseInfo.isNewPatient = true;
          initialReception.patientBaseInfo.patientMemo = patient?.memo ?? "";
          initialReception.patientBaseInfo.isPrivacy = patient?.consent?.privacy
            ? 1
            : 0;
          initialReception.patientBaseInfo.recvMsg = patient?.consent?.marketing
            ? 1
            : 0;
          initialReception.patientBaseInfo.eligibilityCheck =
            patient?.eligibilityCheck ?? ({} as EligibilityCheck);
          initialReception.patientBaseInfo.patientNo = patient?.patientNo ?? 0;
          initialReception.patientBaseInfo.roomPanel =
            appointment != null ? PANEL_TYPE.APPOINTMENT : "";
          initialReception.patientStatus.patientName = patient?.name ?? "";
          initialReception.patientStatus.gender = patient?.gender ?? 0;
          initialReception.patientStatus.birthday = birthDate;
          initialReception.patientStatus.chronicFlags =
            patient?.chronicDisease ?? {
              hypertension: false,
              diabetes: false,
              highCholesterol: false,
            };

          initialReception.insuranceInfo.patientId = String(
            patient?.id ?? "0"
          );
          initialReception.receptionInfo.patientId = String(
            patient?.id ?? "0"
          );
          initialReception.receptionDateTime = receptionTime ?? new Date();
          initialReception.patientStatus.status = 접수상태.대기;
          initialReception.receptionInfo.appointmentId =
            appointment?.id ?? null;
          initialReception.patientBaseInfo.receptionMemo = "";
          initialReception.patientBaseInfo.facilityId = defaultFacilityId;
          // 부속의원: 재진·주간 고정 / 비부속: 주야간은 기존(주간), 초재진은 API 재계산
          const finalBaseDate = baseDate || formatDate(selectedDate, "-");
          initialReception.receptionInfo.receptionType = isAttachedCreate
            ? 초재진.재진
            : (await (async () => {
                const { EncountersService } = await import(
                  "@/services/encounters-service"
                );
                return EncountersService.getCheckRevisit(
                  String(patient?.id ?? "0"),
                  finalBaseDate
                );
              })());
          initialReception.receptionInfo.timeCategory = isAttachedCreate
            ? 주간야간휴일구분.주간
            : (initialReception.receptionInfo.timeCategory ?? 주간야간휴일구분.주간);
          return initialReception;
        }
      } catch (error) {
        console.error("[getLatestReception] 오류:", error);
        throw error;
      }
    },
    [hospital]
  );

  /**
   * 환자 선택 시 접수 탭에 표시할 Reception을 결정하는 함수.
   * getLatestReception을 내부적으로 호출한 뒤, 동일일자 판별 → 당일 예약 체크 → appointmentId 클리어까지 처리.
   *
   * 반환 type별 의미:
   * - sameDayRegistration : 오늘 접수 내역이 존재 → 해당 registration 기반 reception
   * - todayAppointment    : 오늘 CONFIRMED 예약 1건 → convertAppointmentToReception 적용
   * - multipleAppointments: 오늘 CONFIRMED 예약 다건 → 탭 열지 않음 (경고 팝업)
   * - differentDay        : 다른 날짜 접수 기반 → appointmentId null 처리됨
   * - noHistory           : 접수 내역 없음
   */
  const getLatestReceptionForReceptionTab = useCallback(
    async (
      patient: any,
      registrations: Registration[],
      appointments: Appointment[],
      selectedDate: Date
    ): Promise<{
      reception: Reception | null;
      type: 'sameDayRegistration' | 'differentDay' | 'todayAppointment' | 'multipleAppointments' | 'noHistory';
      matchedRegistrationId?: string;
      initialTab?: ReceptionInitialTab;
    }> => {
      const receptionDateTime = createReceptionDateTime(selectedDate);

      // 1. getLatestReception 호출
      const latestReception = await getLatestReception(patient);
      if (!latestReception) {
        return { reception: null, type: 'noHistory' };
      }

      // 2. 동일 날짜 접수 확인
      const normalizedId = normalizeRegistrationId(
        latestReception.originalRegistrationId
      );
      const isKnown = !isNewRegistrationId(normalizedId);

      if (isKnown) {
        const registrationMatch = registrations.find(
          (reg) => normalizeRegistrationId(reg.id) === normalizedId
        );

        if (registrationMatch) {
          // 동일 날짜 접수 → registrationMatch 기반으로 변환
          const convertedReception =
            ReceptionService.convertRegistrationToReception(registrationMatch);
          clear임신부IfOverLimit(convertedReception.insuranceInfo, selectedDate);
          const receptionToOpen = { ...convertedReception, receptionDateTime };
          const initialTab =
            ReceptionService.getInitialTabByRoomPanelAndStatus(
              receptionToOpen.patientBaseInfo?.roomPanel,
              receptionToOpen.receptionInfo?.status
            );

          return {
            reception: receptionToOpen,
            type: 'sameDayRegistration',
            matchedRegistrationId: normalizedId,
            initialTab,
          };
        }
      }

      // 3. 다른 날짜 → 당일 CONFIRMED 예약 확인
      const confirmedAppointments = appointments.filter(
        (apt) =>
          String(apt.patientId) === String(patient.id) &&
          apt.status === AppointmentStatus.CONFIRMED
      );

      if (confirmedAppointments.length > 1) {
        return { reception: null, type: 'multipleAppointments' };
      }

      if (confirmedAppointments.length === 1) {
        const appointmentReception =
          ReceptionService.convertAppointmentToReception(confirmedAppointments[0]!);
        const isAttached = hospital?.isAttachedClinic === true;
        if (isAttached) {
          appointmentReception.receptionInfo.receptionType = 초재진.재진;
          appointmentReception.receptionInfo.timeCategory = 주간야간휴일구분.주간;
        } else {
          const { EncountersService } = await import("@/services/encounters-service");
          const { selectedDate: selDate } = useSelectedDateStore.getState();
          appointmentReception.receptionInfo.receptionType =
            await EncountersService.getCheckRevisit(
              String(patient?.id ?? "0"),
              selDate.toISOString()
            );
        }
        return { reception: appointmentReception, type: 'todayAppointment' };
      }

      // 4. 예약 없음 → appointmentId 클리어하여 반환
      return {
        reception: {
          ...latestReception,
          receptionDateTime,
          receptionInfo: {
            ...latestReception.receptionInfo,
            appointmentId: null,
          },
        } as Reception,
        type: 'differentDay',
      };
    },
    [getLatestReception]
  );

  const isCheckNoneRegistration = useCallback(async (patientId: string, baseDate: string | Date) => {
    const formattedBaseDate = formatDate(baseDate, "-");
    const baseDateObj = typeof baseDate === "string" ? new Date(baseDate) : new Date(baseDate.getTime());
    baseDateObj.setDate(baseDateObj.getDate() - 1);
    const queryDate = formatDate(baseDateObj, "-");
    const registrationsResponse = await RegistrationsService.getLatestRegistration(
      patientId,
      queryDate
    );
    if(registrationsResponse === null || (Array.isArray(registrationsResponse) && registrationsResponse.length === 0)) {
      return true;
    }
    const list: Registration[] = Array.isArray(registrationsResponse)
      ? registrationsResponse
      : [registrationsResponse];
    const hasPastRegistration = list.some((reg) => {
      const receptionDateStr = formatDate(reg.receptionDateTime, "-");
      return !!receptionDateStr && receptionDateStr < formattedBaseDate;
    });
    return !hasPastRegistration;
  }, []);

  // 접수 처리 함수 (UI 업데이트 없이 비즈니스 로직만)
  const submitRegistration = useCallback(
    async (
      reception: Reception,
      insuranceInfo: Partial<InsuranceInfo>,
      isNewPatient: boolean,
      _newVitalMeasurements: VitalReceptionInfoType[] = []
    ) => {
      let newPatientId: string | null = null;
      let newPatientNo: number | null = null;

      try {
        // 1. 환자 생성 또는 업데이트
        if (isNewPatient) {
          const newPatient = setPatientBaseInfo(reception);
          const createdPatient =
            await createPatientMutation.mutateAsync(newPatient);
          newPatientId = createdPatient.id.toString();
          newPatientNo = createdPatient.patientNo;
        } else {
          const updatePatient = setPatientBaseInfo(reception);

          const patientId =
            reception?.patientBaseInfo.patientId?.toString() ?? "";

          // patientId 유효성 검증
          if (
            !patientId ||
            patientId === "0" ||
            patientId === "new" ||
            patientId.trim() === ""
          ) {
            throw new Error("환자 ID가 없습니다.");
          }

          const patientIdNumber = Number(patientId);
          if (!Number.isInteger(patientIdNumber) || patientIdNumber <= 0) {
            throw new Error(`유효하지 않은 환자 ID입니다: ${patientId}`);
          }

          await updatePatientMutation.mutateAsync({
            patientId: patientIdNumber,
            updatePatient,
          });
        }
        const targetPatientId =
          newPatientId ||
          reception?.patientBaseInfo.patientId?.toString() ||
          "";

        // targetPatientId 유효성 검증
        if (
          !targetPatientId ||
          targetPatientId === "0" ||
          targetPatientId === "new" ||
          targetPatientId.trim() === ""
        ) {
          throw new Error("환자 ID가 없습니다.");
        }

        // 3. Family & Vital 저장
        await saveFamilyInfo(targetPatientId, reception);
        await saveVitalInfo(
          targetPatientId,
          reception.bioMeasurementsInfo.vital
        );

        // insuranceInfo가 전달되지 않았으면 reception.insuranceInfo에서 가져오기
        const finalInsuranceInfo =
          insuranceInfo || reception?.insuranceInfo || {};
        const finalExtraQualification =
          finalInsuranceInfo?.extraQualification ??
          reception?.insuranceInfo?.extraQualification ??
          {};

        // patientId 계산 및 유효성 검증
        const registrationPatientId =
          newPatientId != null
            ? Number(newPatientId)
            : Number(reception?.patientBaseInfo.patientId);

        if (
          !Number.isInteger(registrationPatientId) ||
          registrationPatientId <= 0
        ) {
          throw new Error(
            `유효하지 않은 환자 ID입니다: ${reception?.patientBaseInfo.patientId}`
          );
        }

        // 4. Registration 생성
        const newRegistration: CreateRegistrationRequest = {
          hospitalId: hospital.id,
          patientId: registrationPatientId,
          memo: reception?.patientBaseInfo.receptionMemo,
          insuranceType: finalInsuranceInfo?.uDeptDetail ?? 보험구분상세.일반,
          receptionType: reception?.receptionInfo.receptionType ?? 초재진.초진,
          status: 접수상태.대기 || 0,
          certificateNo: finalInsuranceInfo?.cardNumber ?? "",
          insuredPerson: finalInsuranceInfo?.father ?? "",
          providerCode: finalInsuranceInfo?.unionCode ?? "",
          providerName: finalInsuranceInfo?.unionName ?? "",
          patientRoute: {},
          //TODO - 진료실 여러개 되면 수정필요
          roomPanel: PANEL_TYPE.TREATMENT,
          doctorId:
            reception.patientBaseInfo.doctorId ??
            useDoctorsStore.getState().doctors[0]?.id ??
            0,
          facilityId: reception?.patientBaseInfo.facilityId ?? null,
          exceptionCode: reception?.receptionInfo.exceptionCode ?? null,
          extraQualification: finalExtraQualification,
          detailCategory:
            reception?.receptionInfo.detailCategory ?? DetailCategoryType.없음,
          serviceType: reception?.receptionInfo.checkup ?? null,
            timeCategory: (reception?.receptionInfo.timeCategory ?? 주간야간휴일구분.주간),
          position: "",
          receptionDateTime: (() => {
            // 접수 생성 시에는 선택된 접수일(selectedDate) + 현재 시간을 UTC로 전송
            const { selectedDate } = useSelectedDateStore.getState();
            const receptionDate = createReceptionDateTime(selectedDate);
            return (
              convertKSTtoUTCString(receptionDate.toString()) ??
              convertKSTtoUTCString(new Date().toString())
            );
          })(),
          eligibilityCheckId: (() => {
            const id = reception?.patientBaseInfo?.eligibilityCheck?.id;
            if (!id) return null;
            // 숫자로 변환 (문자열이면 숫자로, 이미 숫자면 그대로)
            return typeof id === "string" ? Number(id) : Number(id);
          })(),
          appointmentId: reception?.receptionInfo?.appointmentId ? Number(reception?.receptionInfo?.appointmentId) : null,
          previousRegistrationId: reception?.receptionInfo?.previousRegistrationId ?? null,
        };

        const registrationResponse =
          await createRegistrationMutation.mutateAsync(newRegistration);

        // verbalOrdersInfo가 있는 경우 Encounter 생성 후 orders 생성
        if (
          reception.verbalOrdersInfo &&
          reception.verbalOrdersInfo.length > 0
        ) {
          await processVerbalOrdersInfo(
            registrationResponse.id,
            reception.verbalOrdersInfo
          );
        }

        return {
          success: true,
          patientId: targetPatientId,
          registrationId: registrationResponse.id,
        };
      } catch (err: any) {
        console.error("[submitRegistration] 접수 실패:", err);

        // 중복 주민등록번호 에러 체크 (409 Conflict, P2002 에러 코드)
        if (err?.status === 409 && err?.data?.code === "P2002") {
          const target = err?.data?.meta?.target;
          if (target && target.includes("rrn_hash")) {
            error("동일한 주민등록번호로 등록된 환자가 있습니다");
          } else {
            error("중복된 데이터가 존재합니다");
          }
        }

        // 신규 환자 생성했다면 롤백
        if (newPatientId) {
          try {
            await deletePatientMutation.mutateAsync(Number(newPatientId));
          } catch (deleteErr) {
            console.error("[submitRegistration] 환자 삭제 실패:", deleteErr);
          }
        }

        throw err;
      }
    },
    [
      hospital,
      createPatientMutation,
      updatePatientMutation,
      deletePatientMutation,
      createMedicalAidMutation,
      createRegistrationMutation,
      saveFamilyInfo,
      saveVitalInfo,
      error,
      createOrderMutation,
      processVerbalOrdersInfo,
    ]
  );

  // 자격조회 비교 후 접수 진행 (실제 접수 처리)
  const processAutoReception = useCallback(
    async (
      reception: Reception,
      insuranceInfoToUse: Partial<InsuranceInfo>,
      newVitalMeasurements: VitalReceptionInfoType[] = []
    ): Promise<ProcessAutoReceptionResult> => {
      try {
        // reception 객체에 insuranceInfo 설정
        reception.insuranceInfo = insuranceInfoToUse as InsuranceInfo;
        reception.patientBaseInfo.roomPanel = PANEL_TYPE.TREATMENT;
        //의사가 없는 경우 첫번째 의사 id로 넣음 TODO - 의사가 없는 경우 처리 필요 (환경설정) 동일내용 많음 수정 시 확인필요
        reception.patientBaseInfo.doctorId =
          reception.patientBaseInfo.doctorId ??
          useDoctorsStore.getState().doctors[0]?.id ??
          0;

        // 신규 환자 여부 확인
        const patientId = reception.patientBaseInfo?.patientId;
        const isNewPatient =
          patientId === null ||
          patientId === undefined ||
          patientId === REGISTRATION_ID_NEW ||
          patientId === "0" ||
          patientId === "" ||
          (typeof patientId === "string" && patientId.trim() === "");

        // 접수 처리
        const registrationResult = await submitRegistration(
          reception,
          reception.insuranceInfo!,
          isNewPatient,
          newVitalMeasurements
        );

        success(
          `'${reception.patientBaseInfo?.name}' 환자 접수가 완료되었습니다.`
        );

        return {
          success: true,
          registrationId: registrationResult?.registrationId,
          patientId: registrationResult?.patientId,
        };
      } catch (err) {
        console.error("[processAutoReception] error", err);
        error("접수 처리에 실패했습니다.");
        return { success: false };
      }
    },
    [submitRegistration, queryClient, success, error]
  );

  type ProcessAutoReceptionParams = {
    reception: Reception;
    insuranceInfo: Partial<InsuranceInfo> | undefined;
  };

  type ProcessAutoReceptionResult = {
    success: boolean;
    registrationId?: string;
    patientId?: number | string;
  };

  type QualificationCompareData = {
    oldInsuranceInfo: Partial<InsuranceInfo> | undefined;
    newInsuranceInfo: Partial<InsuranceInfo>;
    parsedData: components["schemas"]["EligibilityCheckResponseDto"];
    reception: Reception;
    eligibilityResponse: EligibilityCheck;
  };

  type EligibilityComparisonResult =
    | {
      qualificationSuccess: boolean;
      needsCompare: true;
      processAutoReceptionParams: ProcessAutoReceptionParams;
      compareData: QualificationCompareData;
      eligibilityResponse?: EligibilityCheck;
      errorMessage?: string;
    }
    | {
      qualificationSuccess: boolean;
      needsCompare: false;
      processAutoReceptionParams: ProcessAutoReceptionParams;
      eligibilityResponse?: EligibilityCheck;
      errorMessage?: string;
    };

  // 1. 자격조회 요청으로 parsedData를 받고
  // 2. extraQualification 차이를 따져 비교 팝업 여부를 판단하며,
  // 3. 차이가 없으면 새로운 insuranceInfo를 생성해 바로 접수에 사용할 수 있도록 함
  const compareReceptionEligibility = useCallback(
    async (reception: Reception): Promise<EligibilityComparisonResult> => {
      const patientInfo = reception.patientBaseInfo;
      if (!patientInfo) {
        throw new Error("환자 정보가 없습니다.");
      }
      if (!patientInfo.rrn || !patientInfo.name) {
        throw new Error("주민등록번호, 환자이름 정보가 필요합니다.");
      }
      if (!hospital?.number) {
        throw new Error("요양기관 번호가 없습니다.");
      }

      const request = QualificationService.createRequest({
        sujinjaJuminNo: patientInfo.rrn,
        sujinjaJuminNm: patientInfo.name,
        date: new Date(),
        ykiho: hospital.number,
        msgType: 의료급여메시지타입.수진자자격조회,
        idYN: patientInfo.identityOptional ?? false,
      });

      let eligibilityResponse: any;
      try {
        eligibilityResponse = await QualificationService.getQualification(
          request,
          true
        );
      } catch (err: unknown) {
        const qualificationError = new QualificationFetchError(err);
        const errorMessage =
          qualificationError.originalError instanceof Error
            ? qualificationError.originalError.message
            : "자격조회에 실패했습니다.";
        return {
          qualificationSuccess: false,
          needsCompare: false,
          processAutoReceptionParams: {
            reception,
            insuranceInfo: reception.insuranceInfo,
          },
          errorMessage,
        };
      }

      // 자격조회 실패 시
      if (!eligibilityResponse) {
        return {
          qualificationSuccess: false,
          needsCompare: false,
          processAutoReceptionParams: {
            reception,
            insuranceInfo: reception.insuranceInfo,
          },
          errorMessage: "자격조회에 실패했습니다.",
        };
      }

      const newParsedData = eligibilityResponse?.parsedData;
      if (!newParsedData) {
        throw new Error("자격조회 정보를 처리하는데 실패했습니다.");
      }

      const newExtraQualification =
        extractExtraQualificationFromParsedData(newParsedData);
      const oldExtraQualification =
        reception.insuranceInfo?.extraQualification ?? {};

      const normalizedOld = normalizeExtraQualification(oldExtraQualification);
      const normalizedNew = normalizeExtraQualification(newExtraQualification);

      const hasExtraQualificationChanges =
        JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);

      // 자격조회 parsedData에는 없는 키(임신부 등)가 누락되지 않도록 기존 extraQualification에 병합
      const mergedExtraQualification = {
        ...oldExtraQualification,
        ...newExtraQualification,
      };

      const newInsuranceInfo =
        setEligibilityResponseToInsuranceInfo(
          reception.receptionDateTime,
          getResidentRegistrationNumberWithNumberString(patientInfo.rrn),
          eligibilityResponse?.parsedData,
          {
            unionName: "",
          },
          mergedExtraQualification
        ) || reception.insuranceInfo;

      if (hasExtraQualificationChanges) {
        return {
          qualificationSuccess: true,
          needsCompare: true,
          compareData: {
            oldInsuranceInfo: reception.insuranceInfo,
            newInsuranceInfo,
            parsedData: newParsedData,
            reception,
            eligibilityResponse: eligibilityResponse,
          },
          processAutoReceptionParams: {
            reception,
            insuranceInfo: newInsuranceInfo,
          },
          eligibilityResponse,
        };
      }

      const oldInsuranceInfo = reception.insuranceInfo;

      const hasInsuranceInfoChanges = oldInsuranceInfo
        ? oldInsuranceInfo.uDeptDetail !== newInsuranceInfo.uDeptDetail ||
        oldInsuranceInfo.cardNumber !== newInsuranceInfo.cardNumber ||
        oldInsuranceInfo.father !== newInsuranceInfo.father ||
        oldInsuranceInfo.unionCode !== newInsuranceInfo.unionCode ||
        oldInsuranceInfo.identityOptional !==
        newInsuranceInfo.identityOptional
        : true;

      if (hasInsuranceInfoChanges && oldInsuranceInfo) {
        return {
          qualificationSuccess: true,
          needsCompare: true,
          compareData: {
            oldInsuranceInfo,
            newInsuranceInfo,
            parsedData: newParsedData,
            reception,
            eligibilityResponse: eligibilityResponse,
          },
          processAutoReceptionParams: {
            reception,
            insuranceInfo: newInsuranceInfo,
          },
          eligibilityResponse,
        };
      }

      return {
        qualificationSuccess: true,
        needsCompare: false,
        processAutoReceptionParams: {
          reception,
          insuranceInfo: newInsuranceInfo,
        },
        eligibilityResponse: eligibilityResponse,
      };
    },
    [hospital]
  );

  // Auto reception handler - 자격조회 후 자동 접수
  // 반환값: { needsCompare: true, ... } | { needsCompare: false, success: boolean }
  // needsCompare: true 인 경우 자격조회 비교 팝업 표시 (showQualificationComparePopupPromise 호출)
  const autoReception = useCallback(
    async (
      reception: Reception,
      newVitalMeasurements: VitalReceptionInfoType[] = []
    ): Promise<
      | {
        needsCompare: true;
        success: false;
        qualificationSuccess: boolean;
        compareData: {
          oldInsuranceInfo: Partial<InsuranceInfo> | undefined;
          newInsuranceInfo: Partial<InsuranceInfo>;
          parsedData: components["schemas"]["EligibilityCheckResponseDto"];
          reception: Reception;
          eligibilityResponse: EligibilityCheck;
        };
        processAutoReceptionParams: ProcessAutoReceptionParams;
        errorMessage?: string;
      }
      | {
        needsCompare: false;
        success: boolean;
        qualificationSuccess: boolean;
        processAutoReceptionParams: ProcessAutoReceptionParams;
        registrationId?: string;
        patientId?: number | string;
        errorMessage?: string;
      }
    > => {
      const patientInfo = reception.patientBaseInfo;
      if (!patientInfo) {
        error("환자 정보가 없습니다.");
        return {
          needsCompare: false,
          success: false,
          qualificationSuccess: false,
          processAutoReceptionParams: {
            reception,
            insuranceInfo: reception.insuranceInfo,
          },
        };
      }

      if (!patientInfo.rrn || !patientInfo.name || !hospital?.number) {
        error("주민등록번호, 환자이름, 요양기관번호가 필요합니다.");
        return {
          needsCompare: false,
          success: false,
          qualificationSuccess: false,
          processAutoReceptionParams: {
            reception,
            insuranceInfo: reception.insuranceInfo,
          },
        };
      }

      try {
        const comparisonResult = await compareReceptionEligibility(reception);
        if (
          !comparisonResult.qualificationSuccess &&
          comparisonResult.errorMessage
        ) {
          error(comparisonResult.errorMessage);
        }

        if (comparisonResult.needsCompare) {
          return {
            needsCompare: true,
            success: false,
            qualificationSuccess: comparisonResult.qualificationSuccess,
            compareData: comparisonResult.compareData,
            processAutoReceptionParams:
              comparisonResult.processAutoReceptionParams,
            errorMessage: comparisonResult.errorMessage,
          };
        }

        const {
          processAutoReceptionParams,
          eligibilityResponse,
          errorMessage,
          qualificationSuccess,
        } = comparisonResult;

        if (eligibilityResponse) {
          reception.patientBaseInfo.eligibilityCheck = eligibilityResponse;
        }

        const processResult = await processAutoReception(
          processAutoReceptionParams.reception,
          processAutoReceptionParams.insuranceInfo ??
          ({} as Partial<InsuranceInfo>),
          newVitalMeasurements
        );
        return {
          needsCompare: false,
          success: processResult.success,
          qualificationSuccess,
          processAutoReceptionParams,
          registrationId: processResult.registrationId,
          patientId: processResult.patientId,
          errorMessage,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "자동 접수 중 오류가 발생했습니다.";
        error(`자동 접수 실패: ${errorMessage}`);
        return {
          needsCompare: false,
          success: false,
          qualificationSuccess: false,
          processAutoReceptionParams: {
            reception,
            insuranceInfo: reception.insuranceInfo,
          },
          errorMessage,
        };
      }
    },
    [hospital, processAutoReception, error, compareReceptionEligibility]
  );

  // 자격조회 비교 팝업에서 "변경적용" 선택 시 (기존 호환성을 위해 유지)
  const handleQualificationCompareApply = useCallback(async () => {
    if (!qualificationCompareData) return;

    const { reception, newInsuranceInfo } = qualificationCompareData;

    // 팝업 닫기
    setShowQualificationComparePopup(false);
    setQualificationCompareData(null);

    // 팝업이 완전히 닫힌 후 접수 진행 (React 상태 업데이트 대기)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 새로운 자격조회 정보로 접수 진행
    await processAutoReception(reception, newInsuranceInfo);
  }, [qualificationCompareData, processAutoReception]);

  // 자격조회 비교 팝업에서 "미적용" 선택 시 (기존 호환성을 위해 유지)
  const handleQualificationCompareCancel = useCallback(async () => {
    if (!qualificationCompareData) return;

    const { reception, oldInsuranceInfo } = qualificationCompareData;

    // 팝업 닫기
    setShowQualificationComparePopup(false);
    setQualificationCompareData(null);

    // 팝업이 완전히 닫힌 후 접수 진행 (React 상태 업데이트 대기)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 기존 insuranceInfo로 접수 진행
    if (oldInsuranceInfo) {
      await processAutoReception(reception, oldInsuranceInfo);
    }
  }, [qualificationCompareData, processAutoReception]);

  // 자격조회 비교 후 접수 진행 (새로운 순차 처리용)
  const processQualificationCompareResult = useCallback(
    async (
      compareData: {
        oldInsuranceInfo: Partial<InsuranceInfo> | undefined;
        newInsuranceInfo: Partial<InsuranceInfo>;
        parsedData: components["schemas"]["EligibilityCheckResponseDto"];
        reception: Reception;
        eligibilityResponse: EligibilityCheck;
      },
      apply: boolean,
      newVitalMeasurements: VitalReceptionInfoType[] = []
    ): Promise<ProcessAutoReceptionResult> => {
      const {
        reception,
        newInsuranceInfo,
        oldInsuranceInfo,
        eligibilityResponse,
      } = compareData;

      // Apply를 선택한 경우 eligibilityCheck를 reception에 저장
      if (apply && eligibilityResponse) {
        reception.patientBaseInfo.eligibilityCheck = eligibilityResponse;
      }

      // 선택한 정보로 접수 진행
      const insuranceInfoToUse = apply
        ? newInsuranceInfo
        : oldInsuranceInfo || newInsuranceInfo;
      return await processAutoReception(
        reception,
        insuranceInfoToUse,
        newVitalMeasurements
      );
    },
    [processAutoReception]
  );

  // 자격조회 비교 팝업을 Promise로 표시
  const showQualificationComparePopupPromise = useCallback(
    (compareData: {
      oldInsuranceInfo: Partial<InsuranceInfo> | undefined;
      newInsuranceInfo: Partial<InsuranceInfo>;
      parsedData: components["schemas"]["EligibilityCheckResponseDto"];
      reception: Reception;
      eligibilityResponse: EligibilityCheck;
    }): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        // 팝업 상태 및 데이터 설정
        setShowQualificationComparePopup(true);
        setQualificationCompareData(compareData);
        setComparePopupResolver({ resolve, reject });
      });
    },
    []
  );

  // 자격조회 비교 팝업 결과 처리 (Apply)
  const handleQualificationCompareApplyPromise = useCallback(() => {
    if (comparePopupResolver) {
      comparePopupResolver.resolve(true);
      setShowQualificationComparePopup(false);
      setQualificationCompareData(null);
      setComparePopupResolver(null);
    }
  }, [comparePopupResolver]);

  // 자격조회 비교 팝업 결과 처리 (Cancel)
  const handleQualificationCompareCancelPromise = useCallback(() => {
    if (comparePopupResolver) {
      comparePopupResolver.resolve(false);
      setShowQualificationComparePopup(false);
      setQualificationCompareData(null);
      setComparePopupResolver(null);
    }
  }, [comparePopupResolver]);

  /**
   * 예약 -> 접수 전환 통합 함수
   *
   * @param appointment - 전환할 예약 정보
   * @param options - 옵션 객체
   * @param options.receptionTime - 접수 시간 (기본값: new Date())
   * @param options.handleMarkAsVisited - 예약 상태를 '내원'으로 변경하는 함수
   * @param options.onNewPatient - 신규 환자인 경우 처리 콜백 (reception 객체 전달)
   * @param options.onSuccess - 접수 성공 시 콜백
   * @param options.onError - 에러 발생 시 콜백
   * @param options.onNoReceptionHistory - 기접수 내역 없음 시 콜백
   * @param options.onRefresh - 새로고침 콜백
   * @param options.onSuccessMessage - 성공 메시지 표시 콜백
   * @returns 접수 결과
   */
  const handleAppointmentToRegistration = useCallback(
    async (
      appointment: Appointment,
      options?: {
        receptionTime?: Date;
        handleMarkAsVisited: (appointmentId: number) => Promise<void>;
        onNewPatient?: (reception: Reception) => void | Promise<void>;
        onSuccess?: (result: {
          registrationId?: string;
          patientId?: string | number;
        }) => void | Promise<void>;
        onError?: (error: Error) => void;
        onNoReceptionHistory?: () => void;
        onRefresh?: () => void;
        onSuccessMessage?: (message: string) => void;
      }
    ): Promise<{
      success: boolean;
      registrationId?: string;
      patientId?: string | number;
    }> => {
      try {
        // 1. Reception 객체 생성 (신규 환자 체크용)
        const reception =
          ReceptionService.convertAppointmentToReception(appointment);
        const isNewPatient = reception.patientBaseInfo.isNewPatient;

        // 부속의원 여부에 따라 초재진/주야간 초기값 설정
        if (hospital?.isAttachedClinic === true) {
          reception.receptionInfo.receptionType = 초재진.재진;
          reception.receptionInfo.timeCategory = 주간야간휴일구분.주간;
        }

        // 2. 신규 환자인 경우 처리
        if (isNewPatient) {
          if (options?.onNewPatient) {
            await options.onNewPatient(reception);
          }
          return {
            success: true,
          };
        }

        // 3. 기존 환자인 경우: 최근 접수 내역 조회
        const receptionTime = options?.receptionTime || new Date();
        const latestReception = await getLatestReception(
          appointment.patient,
          true,
          receptionTime,
          appointment
        );

        if (!latestReception) {
          if (options?.onNoReceptionHistory) {
            options.onNoReceptionHistory();
          }
          return {
            success: false,
          };
        }

        // 4. autoReception 실행 (자격조회 포함)
        latestReception.receptionInfo.appointmentId = Number(appointment?.id);
        latestReception.patientBaseInfo.receptionMemo = stripHtmlTags(appointment?.memo || "") || "";

        const autoReceptionResult = await autoReception(latestReception);

        // 5. 자격조회 비교 팝업이 필요한 경우
        if (autoReceptionResult.needsCompare) {
          // 5-1. 자격조회 비교 팝업 표시 및 결과 대기
          const apply = await showQualificationComparePopupPromise(
            autoReceptionResult.compareData
          );

          // 5-2. 선택한 정보로 접수 진행
          const result = await processQualificationCompareResult(
            autoReceptionResult.compareData,
            apply
          );

          if (!result.success) {
            return {
              success: false,
            };
          }

          // 5-3. 예약 상태를 '내원'으로 변경
          if (appointment.id && options?.handleMarkAsVisited) {
            await options.handleMarkAsVisited(appointment.id);
          }

          // 5-4. 성공 처리
          if (options?.onSuccess) {
            await options.onSuccess({
              registrationId: result.registrationId,
              patientId: result.patientId,
            });
          }

          if (options?.onSuccessMessage) {
            options.onSuccessMessage("예약이 접수되었습니다.");
          }

          if (options?.onRefresh) {
            options.onRefresh();
          }

          return {
            success: true,
            registrationId: result.registrationId,
            patientId: result.patientId,
          };
        } else {
          // 6. 자격조회 비교 팝업이 필요 없는 경우
          if (!autoReceptionResult.success) {
            return {
              success: false,
            };
          }

          // 6-1. 예약 상태를 '내원'으로 변경
          if (appointment.id && options?.handleMarkAsVisited) {
            await options.handleMarkAsVisited(appointment.id);
          }

          // 6-2. 성공 처리
          if (options?.onSuccess) {
            await options.onSuccess({
              registrationId: autoReceptionResult.registrationId,
              patientId: autoReceptionResult.patientId,
            });
          }

          if (options?.onSuccessMessage) {
            options.onSuccessMessage("예약이 접수되었습니다.");
          }

          if (options?.onRefresh) {
            options.onRefresh();
          }

          return {
            success: true,
            registrationId: autoReceptionResult.registrationId,
            patientId: autoReceptionResult.patientId,
          };
        }
      } catch (err: any) {
        console.error("[handleAppointmentToRegistration] 예약 접수 실패:", err);
        const errorMessage =
          err?.data?.message ||
          err?.message ||
          "예약을 접수로 전환하는데 실패했습니다.";

        if (options?.onError) {
          options.onError(err instanceof Error ? err : new Error(errorMessage));
        }

        return {
          success: false,
        };
      }
    },
    [
      getLatestReception,
      autoReception,
      showQualificationComparePopupPromise,
      processQualificationCompareResult,
    ]
  );
  //#endregion

  //#region Return Values
  return {
    // Core Functions
    autoReception,
    processAutoReception,
    getLatestReception,
    getLatestReceptionForReceptionTab,
    isCheckNoneRegistration,
    submitRegistration,
    updateRegistration,
    cancelRegistration,
    compareReceptionEligibility,
    handleAppointmentToRegistration,

    // 자격조회 비교 팝업 관련
    showQualificationComparePopup,
    setShowQualificationComparePopup,
    qualificationCompareData,
    setQualificationCompareData,
    handleQualificationCompareApply,
    handleQualificationCompareCancel,
    processQualificationCompareResult,
    // Promise 기반 팝업 관리
    showQualificationComparePopupPromise,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,

    // Helper Functions
    setPatientBaseInfo,
    get본인부담구분코드String,
  };
  //#endregion
};
