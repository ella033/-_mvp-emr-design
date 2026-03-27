import {
  getAgeOrMonth,
  getIsBaby,
  getResidentRegistrationNumberWithNumberString,
} from "@/lib/patient-utils";
import {
  createReceptionDateTime,
  createSafeDate,
} from "@/lib/date-utils";
import type { Reception } from "@/types/common/reception-types";
import { calculateUDept } from "@/store/common/insurance-store";
import { useDoctorsStore } from "@/store/doctors-store";
import { useFacilityStore } from "@/store/facility-store";
import { 공간코드, 보험구분 } from "@/constants/common/common-enum";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import {
  ConsentPrivacyType,
  DetailCategoryType,
  MinDate,
  ReceptionInitialTab,
  보험구분상세,
  본인부담구분코드,
  주간야간휴일구분,
  초재진,
  접수상태,
} from "@/constants/common/common-enum";
import type { Patient } from "@/types/patient-types";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";
import { safeSubstring } from "@/lib/eligibility-utils";
import { getUdeptDetailToUdept } from "@/lib/common-utils";
import {
  REGISTRATION_ID_NEW,
  buildAppointmentRegistrationId,
  getIsVitalToday,
  normalizeRegistrationId,
} from "@/lib/registration-utils";
import { PANEL_TYPE } from "@/constants/reception";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { is난임치료, is산정특례기타염색체이상질환등록대상자, is임신부 } from "@/lib/extra-qualification-utils";

/**
 * Reception 변환 서비스
 * DB 구조(Registration/Appointment)와 프로젝트 내 사용 구조(Reception) 간의 변환을 담당합니다.
 */
export class ReceptionService {
  /**
   * 기본 진료실/의사 ID는 Zustand store에서 가져오되,
   * React 훅(`useSyncExternalStore`)을 직접 호출하지 않도록
   * `getState()` 기반으로 동적으로 계산합니다.
   */
  static get defaultFacilityId(): number {
    const { getTreatmentFacilities } = useFacilityStore.getState();
    const treatmentFacilities = getTreatmentFacilities(공간코드.진료);
    return treatmentFacilities.length > 0
      ? treatmentFacilities[0]?.id ?? 0
      : 0;
  }

  static get defaultDoctorId(): number {
    const { doctors } = useDoctorsStore.getState();
    return doctors.length > 0 ? doctors[0]?.id ?? 0 : 0;
  }

  /**
   * todo 관련 정책 일부 변경예정
   * roomPanel과 status에 따라 접수 상세 초기 탭을 결정합니다.
   * patient-card, reception-search-bar 등에서 공통 사용.
   */
  static getInitialTabByRoomPanelAndStatus(
    roomPanel?: string | null,
    status?: number
  ): ReceptionInitialTab {
    if (roomPanel === PANEL_TYPE.PAYMENT) {
      return ReceptionInitialTab.수납정보;
    }
    if (
      roomPanel === PANEL_TYPE.TREATMENT ||
      (roomPanel && roomPanel.startsWith("treatment-"))
    ) {
      if (status === 접수상태.수납대기 || status === 접수상태.수납완료) {
        return ReceptionInitialTab.수납정보;
      }
      return ReceptionInitialTab.환자정보;
    }
    if (!roomPanel || roomPanel === PANEL_TYPE.APPOINTMENT) {
      return ReceptionInitialTab.환자정보;
    }
    return ReceptionInitialTab.환자정보;
  }

  /**
   * Registration을 Reception으로 변환
   * isLatest: 최근접수 변환이라면 isNewPatient을 false로 설정
   */
  static convertRegistrationToReception(
    registration: Registration,
  ): Reception {
    if (!registration) {
      // 기본 Registration 객체 생성
      registration = {
        id: REGISTRATION_ID_NEW,
        isNewPatient: false,
        hospitalId: 0,
        patientId: 0,
        receptionDateTime: new Date().toISOString(),
        status: 0,
        memo: "",
        doctorId: ReceptionService.defaultDoctorId,
        roomPanel: "",
        certificateNo: "",
        insuranceType: 보험구분상세.일반,
        providerCode: "",
        providerName: "",
        insuredPerson: "",
        receptionType: 초재진.초진,
        detailCategory: DetailCategoryType.없음,
        timeCategory: 주간야간휴일구분.주간,
        exceptionCode: null,
        patient: {} as Patient,
        eligibilityCheck: {} as EligibilityCheck,
        extraQualification: {} as Record<string, any>,
        position: "",
        encounters: null,
        paymentInfo: { totalAmount: 0, payments: [] },
      } as Registration;
    }

    // 기본 환자 정보 생성
    const patient = registration.patient;
    const eligibilityCheck = registration.eligibilityCheck;
    return {
      originalRegistrationId: normalizeRegistrationId(registration.id),
      receptionDateTime: createSafeDate(registration.receptionDateTime),
      patientStatus: {
        patient: patient || ({} as any),
        status: registration.status || 0,
        position: registration.position || "",
        isNewRegister: "",
        withMediaCall: false,
        year: new Date().getFullYear(),
        patientClass: 0,
        routeId: 0,
        visitNumber: 0,
        destStat: 0,
        userId: "",
        patientName: patient?.name || "",
        age: patient?.birthDate
          ? String(parseInt(getAgeOrMonth(patient.birthDate, "en")))
          : "0",
        numberOfDaysLived: "0",
        jsDate: new Date(),
        jsTime: "",
        gender: patient?.gender || 0,
        udept: getUdeptDetailToUdept(registration.insuranceType) as 보험구분 || 보험구분.일반,
        birthday: createSafeDate(patient?.birthDate || ""),
        lastVisit: patient?.lastEncounterDate
          ? new Date(patient.lastEncounterDate)
          : null,
        chronicFlags: patient?.chronicDisease || {
          hypertension: false,
          diabetes: false,
          highCholesterol: false,
        },
      },
      patientBaseInfo: {
          isNewPatient: registration.isNewPatient ?? false,
        patientId: String(registration.patientId || "0"),
        patientNo: patient?.patientNo || 0,
        name: patient?.name || "",
        rrn: patient?.rrn || "",
        fatherRrn: getResidentRegistrationNumberWithNumberString(
          patient?.fatherRrn || ""
        ),
        birthday: createSafeDate(patient?.birthDate || ""),
        gender: patient?.gender || 0,
        age: patient?.birthDate
          ? parseInt(getAgeOrMonth(patient.birthDate, "en"))
          : 0,
        phone1: patient?.phone1 || "",
        phone2: patient?.phone2 || "",
        address: patient?.address1 || "",
        address2: patient?.address2 || "",
        zipcode: patient?.zipcode || "",
        doctorId: registration.doctorId || ReceptionService.defaultDoctorId,
        roomPanel: registration.id.startsWith("a")
          ? PANEL_TYPE.APPOINTMENT
          : registration.roomPanel || "",
        patientMemo: patient?.memo || "",
        receptionMemo: registration.memo || "",
        clinicalMemo: patient?.clinicalMemo || "",
        hospitalId: registration.hospitalId || null,
        isActive: patient?.isActive || true,
        lastVisit: patient?.lastEncounterDate
          ? new Date(patient.lastEncounterDate)
          : null,
        nextAppointmentDateTime: patient?.nextAppointmentDateTime || null,
        idNumber: patient?.idNumber || null,
        idType:
          patient?.idType !== undefined && patient?.idType !== null
            ? patient.idType
            : null,
        facilityId: registration.facilityId || ReceptionService.defaultFacilityId,
        isPrivacy: patient?.consent?.privacy || ConsentPrivacyType.미동의,
        recvMsg: patient?.consent?.marketing !== false ? 1 : 0, // 기본값 1(수신), 명시적으로 false인 경우만 0(거부)
        isExistPhoto: false,
        photoPath: "",
        email: "",
        groupId: patient?.groupId ?? null,
        admissiveChannel: 0,
        recommender: "",
        identityVerifiedAt: patient?.identityVerifiedAt || null,
        modifyItemList: [],
        family: [],
        eligibilityCheck: registration.eligibilityCheck || {} as EligibilityCheck,
        identityOptional:
          registration.eligibilityCheck?.parsedData?.["본인확인예외여부"]?.data === "Y" || false,
        isVitalToday: getIsVitalToday(
          registration.receptionDateTime,
          patient?.vitalSignMeasurements ?? undefined
        ),
      },
      insuranceInfo: {
        patientId: String(registration.patientId || "0"),
        isBaby: getIsBaby(patient?.rrn || ""),
        fatherRrn: getIsBaby(patient?.rrn || "")
          ? getResidentRegistrationNumberWithNumberString(
            patient?.fatherRrn || ""
          )
          : getResidentRegistrationNumberWithNumberString(
            patient?.rrn || ""
          ),
        uDeptDetail: registration.insuranceType ?? 보험구분상세.일반,
        차상위보험구분: 0,
        unionCode: registration.providerCode || "",
        unionName: registration.providerName || "",
        자보사고번호: "",
        paymentGuaranteeNumber: "",
        paymentAwardDate: new Date(),
        paymentLostDate: new Date(),
        insuranceCompany: "",
        cardNumber: registration.certificateNo || "",
        father: registration.insuredPerson || "",
        relation: 0,
        is임신부: is임신부(registration.extraQualification)??false,
        is난임치료: is난임치료(registration.extraQualification)??false,
        is만성질환관리: false,
        is의원급만성질환관리제: false,
        만성질환관리제: 0,

        보훈여부: false,
        veteranGrade: 0,
        산재후유: false,
        ori본인부담구분코드: 본인부담구분코드.해당없음, //todo
        cfcd: 0,
        차상위승인일: new Date(),
        차상위종료일: new Date(),
        차상위특정기호: "",
        modifyItemList: [],
        extraQualification: registration.extraQualification || {},
        eligibilityCheck: registration.eligibilityCheck || {} as EligibilityCheck,
        chronicCtrlMngHist: {} as any,
        uDept: calculateUDept(
          registration.insuranceType || 보험구분상세.일반,
          0
        ), // registration에서 차상위보험구분을 가져올 수 있으면 가져오기
        만성질환관리제ForBinding: "",
        veteranGradeForBinding: "",
        본인부담구분코드ForDisplay: "",
        차상위보험구분Description: "",
        identityOptional:
          eligibilityCheck?.parsedData?.["본인확인예외여부"]?.data === "Y" || false,
      },
      receptionInfo: {
        receptionId: parseInt(registration.id) || 0,
        patientId: String(registration.patientId || "0"),
        facilityId: registration.facilityId || ReceptionService.defaultFacilityId,
        checkup: registration.serviceType || null,
        detailCategory:
          registration.detailCategory || DetailCategoryType.없음,
        timeCategory: registration.timeCategory || 주간야간휴일구분.주간,
        discountOrder: 0,
        discountLibraryNo: 0,
        receptionType: registration.receptionType || 초재진.초진,
        exceptionCode: registration.exceptionCode || null,
        appointmentId: registration.appointment?.id || null,
        modifyItemList: [],
        status: registration.status || 접수상태.대기,
        encounters: registration.encounters || null,
        paymentInfo: registration.paymentInfo || { totalAmount: 0, payments: [] },
        hasReceipt: registration.hasReceipt || false,
      },
      bioMeasurementsInfo: {
        vital:
          patient?.vitalSignMeasurements?.map((v) => ({
            id: v.id,
            measurementDateTime: v.measurementDateTime,
            itemId: v.itemId,
            value: v.value.toString(),
            memo: v.memo || "",
            vitalSignItem: v.vitalSignItem || ({} as any),
          })) || [],
        bst: [],
        modifyItemList: [],
      },
    };
  }

  /**
   * Reception을 Registration으로 변환
   */
  static convertReceptionToRegistration(reception: Reception): Registration {
    const normalizedId = normalizeRegistrationId(
      reception.originalRegistrationId ??
      reception.patientBaseInfo?.patientId ??
      REGISTRATION_ID_NEW
    );

    return {
      id: normalizedId,
      hospitalId: reception.patientBaseInfo?.hospitalId || 0,
      patientId: parseInt(reception.patientBaseInfo?.patientId || "0"),
      receptionDateTime: reception.receptionDateTime.toISOString(),
      status: reception.patientStatus?.status || 0,
      memo: reception.patientBaseInfo?.receptionMemo || "",
      doctorId: reception.patientBaseInfo?.doctorId || null,
      roomPanel: reception.patientBaseInfo?.roomPanel || "",
      certificateNo: reception.insuranceInfo?.cardNumber || "",
      insuranceType:
        reception.insuranceInfo?.uDeptDetail || 보험구분상세.일반,
      providerCode: reception.insuranceInfo?.unionCode || "",
      providerName: reception.insuranceInfo?.unionName || "",
      receptionType: reception.receptionInfo?.receptionType || 초재진.초진,
      detailCategory:
        reception.receptionInfo?.detailCategory || DetailCategoryType.없음,
      timeCategory:
        reception.receptionInfo?.timeCategory || 주간야간휴일구분.주간,
      exceptionCode: reception.receptionInfo?.exceptionCode || null,
      extraQualification: reception.insuranceInfo?.extraQualification || {},
      patient: {
        // patientStatus.patient에 원본 데이터가 있으면 우선 사용, 없으면 patientBaseInfo에서 변환
        ...(reception.patientStatus?.patient || {}),
        // 필수 필드들은 명시적으로 설정 (원본이 없을 경우를 대비)
        id: reception.patientStatus?.patient?.id || parseInt(reception.patientBaseInfo?.patientId || "0"),
        name: reception.patientStatus?.patient?.name || reception.patientBaseInfo?.name || "",
        birthDate: reception.patientStatus?.patient?.birthDate || reception.patientBaseInfo?.birthday?.toISOString() || "",
        gender: reception.patientStatus?.patient?.gender ?? reception.patientBaseInfo?.gender ?? 0,
        rrn: reception.patientStatus?.patient?.rrn || reception.patientBaseInfo?.rrn || "",
        rrnView: reception.patientStatus?.patient?.rrnView || (
          reception.patientBaseInfo?.rrn
            ? safeSubstring(reception.patientBaseInfo.rrn, 0, 6) + "-" + safeSubstring(reception.patientBaseInfo.rrn, 6, 7)
            : ""
        ),
        phone1: reception.patientStatus?.patient?.phone1 || reception.patientBaseInfo?.phone1 || "",
        phone2: reception.patientStatus?.patient?.phone2 || reception.patientBaseInfo?.phone2 || "",
        address1: reception.patientStatus?.patient?.address1 || reception.patientBaseInfo?.address || "",
        address2: reception.patientStatus?.patient?.address2 || reception.patientBaseInfo?.address2 || "",
        zipcode: reception.patientStatus?.patient?.zipcode || reception.patientBaseInfo?.zipcode || "",
        isActive: reception.patientStatus?.patient?.isActive ?? reception.patientBaseInfo?.isActive ?? true,
        idNumber: reception.patientStatus?.patient?.idNumber ?? reception.patientBaseInfo?.idNumber ?? null,
        idType: reception.patientStatus?.patient?.idType ?? reception.patientBaseInfo?.idType ?? null,
        memo: reception.patientStatus?.patient?.memo || reception.patientBaseInfo?.patientMemo || "",
        eligibilityCheck:
          reception.patientStatus?.patient?.eligibilityCheck ||
          reception.patientBaseInfo?.eligibilityCheck ||
          {} as EligibilityCheck,
        createDateTime: reception.patientStatus?.patient?.createDateTime || new Date().toISOString(),
        chronicDisease: reception.patientStatus?.patient?.chronicDisease || reception.patientStatus?.chronicFlags || {
          diabetes: false,
          hypertension: false,
          highCholesterol: false,
        },
        vitalSignMeasurements: reception.patientStatus?.patient?.vitalSignMeasurements || reception.bioMeasurementsInfo?.vital || [],
      },
      encounters: reception.receptionInfo?.encounters || null,
      paymentInfo: reception.receptionInfo?.paymentInfo || { totalAmount: 0, payments: [] },
      hasReceipt: reception.receptionInfo?.hasReceipt || false,
    } as unknown as Registration;
  }

  /**
   * Appointment를 Reception으로 변환
   */
  static convertAppointmentToReception(
    appointment: Appointment
  ): Reception {
    if (!appointment) {
      return ReceptionService.createInitialReception();
    }
    const patient = appointment.patient;

    const patientId =
      appointment.patient?.id?.toString() ||
      appointment.patientId?.toString() ||
      "0";

    return {
      // 기본 정보
      originalRegistrationId: buildAppointmentRegistrationId(appointment.id),
      receptionDateTime: createReceptionDateTime(appointment.appointmentStartTime),

      // 환자 기본 정보
      patientBaseInfo: {
        patientId,
        patientNo: patient?.patientNo || 0,
        hospitalId: appointment.hospitalId || 0,
        name: patient?.name || "",
        birthday: createSafeDate(patient?.birthDate || ""),
        age: getAgeOrMonth(patient?.birthDate || "", "ko") || "0",
        gender: patient?.gender || 0,
        rrn: patient?.rrn || "",
        rrnView: patient?.rrnView || "",
        zipcode: patient?.zipcode || "",
        address: patient?.address1 || "",
        address2: patient?.address2 || "",
        phone1: patient?.phone1 || "",
        phone2: patient?.phone2 || "",
        idNumber: patient?.idNumber || null,
        idType:
          patient?.idType !== undefined && patient?.idType !== null
            ? patient.idType
            : null,
        isActive: patient?.isActive || true,
        chronicDisease: patient?.chronicDisease || {
          diabetes: false,
          hypertension: false,
          highCholesterol: false,
        },
        patientMemo: appointment.patient?.memo || "",
        receptionMemo: stripHtmlTags(appointment.memo || ""),
        doctorId: appointment.doctorId || null,
        roomPanel: PANEL_TYPE.APPOINTMENT,
        facilityId: 0, //예약실과 진료실은 별개의 존재이므로 0으로 설정
        consultationRoom: appointment.appointmentRoom?.name || "",
        createDateTime: createSafeDate(patient?.createDateTime || ""),
        updateDateTime: createSafeDate(patient?.updateDateTime || ""),
        identityOptional: false,
        isNewPatient: appointment.isNewPatient || false,
        isVitalToday: false,
      },

      // 환자 상태 정보 - PatientStatus 타입에 맞게 수정
      patientStatus: {
        patient: patient || ({} as Patient),
        status: 접수상태.대기 || 0,
        position: "",
        isNewRegister: appointment.isSimplePatient,
        withMediaCall: false,
        year: new Date().getFullYear(),
        patientClass: 0,
        routeId: 0,
        visitNumber: 0,
        destStat: 0,
        userId: "",
        waitSect: 0,
        patientName: patient?.name || "",
        patientNameStatus: "",
        pregi: "",
        age: getAgeOrMonth(patient?.birthDate || "", "ko") || "0",
        numberOfDaysLived: "0",
        jsDate: createSafeDate(appointment.appointmentStartTime),
        jsTime:
          createSafeDate(appointment.appointmentStartTime)
            .getHours()
            .toString()
            .padStart(2, "0") +
          ":" +
          createSafeDate(appointment.appointmentStartTime)
            .getMinutes()
            .toString()
            .padStart(2, "0"),
        gender: patient?.gender || 0,
        udept: 0,
        waitStatus: 0,
        birthday: createSafeDate(patient?.birthDate || ""),
        lastVisit: patient?.lastEncounterDate ? new Date(patient.lastEncounterDate) : null,
        cardNumber: "",
        startDate: new Date(),
        chronicFlags: [],
        is고혈압: patient?.chronicDisease?.hypertension || false,
        is당뇨: patient?.chronicDisease?.diabetes || false,
        is이상지질혈증: patient?.chronicDisease?.highCholesterol || false,
      },

      // 보험 정보
      insuranceInfo: {
        patientId,
        unionCode: "",
        unionName: "",
        insuranceCompany: "",
        cardNumber: "",
        father: "",
        relation: 0,
        is임신부: false,
        is난임치료: false,
        is만성질환관리: false,
        만성질환관리제: 0,
        is의원급만성질환관리제: false,
        보훈여부: false,
        veteranGrade: 0,
        산재후유: false,
        ori본인부담구분코드: 0,
        cfcd: 0,
        차상위승인일: new Date(),
        차상위종료일: new Date(),
        차상위특정기호: "",
        modifyItemList: [],
        extraQualification: {},
        chronicCtrlMngHist: {} as any,
        uDept: 0,
        만성질환관리제ForBinding: "",
        veteranGradeForBinding: "",
        본인부담구분코드ForDisplay: "",
        차상위보험구분Description: "",
      },

      // 접수 정보
      receptionInfo: {
        patientId,
        receptionId: 0,
        facilityId: appointment.appointmentRoom?.id || 0,
        checkup: null,
        detailCategory: null,
        timeCategory: 주간야간휴일구분.주간,
        discountOrder: 0,
        discountLibraryNo: 0,
        receptionType: 초재진.초진,
        exceptionCode: null,
        appointmentId: appointment.id || null,
        encounters: null,
        paymentInfo: { totalAmount: 0, payments: [] },
        hasReceipt: false,
      },

      // 생체 측정 정보
      bioMeasurementsInfo: {
        vital:
          patient?.vitalSignMeasurements?.map((v) => ({
            ...v,
            measurementDateTime: createSafeDate(v.measurementDateTime),
          })) || [],
        family: [],
      },
    } as unknown as Reception;
  }

  /**
   * Reception에서 encounterId 추출
   * @param reception Reception 객체
   * @param receptionId 현재 receptionId (선택적)
   * @returns encounterId 또는 null
   */
  static getEncounterIdFromReception(
    reception: Reception | null,
    receptionId?: string | null
  ): string | null {
    if (!reception?.receptionInfo?.encounters || !receptionId) {
      return null;
    }
    return reception.receptionInfo.encounters[0]?.id ?? null;
  }

  /**
   * 신규 환자용 초기 Reception 생성
   */
  static createInitialReception(): Reception {
    // 기본 진료실 ID 가져오기 (첫 번째 진료실)


    return {
      receptionDateTime: new Date(),
      patientStatus: {
        patient: {} as any,
        status: 접수상태.대기,
        position: "",
        isNewRegister: "",
        withMediaCall: false,
        year: new Date().getFullYear(),
        patientClass: 0,
        routeId: 0,
        visitNumber: 0,
        destStat: 0,
        userId: "",
        patientName: "",
        age: "0",
        numberOfDaysLived: "0",
        jsDate: new Date(),
        jsTime: "",
        gender: 0,
        udept: 0,
        birthday: new Date(),
        lastVisit: null,
        chronicFlags: {
          hypertension: false,
          diabetes: false,
          highCholesterol: false,
        },
      },
      patientBaseInfo: {
        isNewPatient: true,
        patientId: "0",
        patientNo: 0,
        name: "",
        birthday: new Date(),
        gender: 0,
        age: 0,
        rrn: "",
        fatherRrn: "",
        zipcode: "",
        address: "",
        address2: "",
        phone1: "",
        phone2: "",
        patientMemo: "",
        receptionMemo: "",
        clinicalMemo: "",
        lastVisit: null,
        nextAppointmentDateTime: null,
        idNumber: null,
        idType: null,
        isActive: true,
        hospitalId: null,
        facilityId: ReceptionService.defaultFacilityId, // 기본 진료실 ID로 초기화 (첫 번째 진료실)
        roomPanel: "treatment", // 기본 roomPanel로 초기화
        doctorId: ReceptionService.defaultDoctorId,
        family: [],
        isPrivacy: ConsentPrivacyType.미동의,
        recvMsg: 1,
        isExistPhoto: false,
        photoPath: "",
        identityVerifiedAt: null,
        email: "",
        groupId: null,
        admissiveChannel: 0,
        recommender: "",
        modifyItemList: [],
        eligibilityCheck: {} as EligibilityCheck,
        identityOptional: false,
        isVitalToday: false,
      },
      insuranceInfo: {
        isBaby: false,
        fatherRrn: "",
        patientId: "",
        uDeptDetail: 보험구분상세.일반,
        차상위보험구분: 0,
        unionCode: "",
        unionName: "",
        자보사고번호: "",
        paymentGuaranteeNumber: "",
        paymentAwardDate: MinDate,
        paymentLostDate: MinDate,
        insuranceCompany: "",
        cardNumber: "",
        father: "",
        relation: 0,
        is임신부: false,
        is난임치료: false,
        is만성질환관리: false,
        만성질환관리제: 0,
        is의원급만성질환관리제: false,
        보훈여부: false,
        veteranGrade: 0,
        산재후유: false,
        ori본인부담구분코드: 본인부담구분코드.해당없음,
        cfcd: 본인부담구분코드.해당없음,
        차상위승인일: MinDate,
        차상위종료일: MinDate,
        차상위특정기호: "",
        extraQualification: {},
        modifyItemList: [],
        eligibilityCheck: {} as EligibilityCheck,
        chronicCtrlMngHist: {} as any,
        uDept: 0,
        만성질환관리제ForBinding: "",
        veteranGradeForBinding: "",
        본인부담구분코드ForDisplay: "",
        차상위보험구분Description: "",
        identityOptional: false,
      },
      receptionInfo: {
        patientId: "0",
        receptionId: 0,
        facilityId: ReceptionService.defaultFacilityId,
        checkup: null,
        detailCategory: DetailCategoryType.없음,
        timeCategory: 주간야간휴일구분.주간,
        discountOrder: 0,
        discountLibraryNo: 0,
        receptionType: 초재진.초진,
        exceptionCode: "",
        modifyItemList: [],
        status: 접수상태.대기,
        appointmentId: null,
        encounters: null,
        paymentInfo: { totalAmount: 0, payments: [] },
        hasReceipt: false,
      },
      bioMeasurementsInfo: {
        vital: [],
        bst: [],
        modifyItemList: [],
      },
      originalRegistrationId: "new", // 신규환자는 "new"로 설정
    };
  }
}
