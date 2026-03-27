import { 본인확인여부 } from "@/constants/common/common-enum";
import { extractInfoFromRrn } from "@/lib/common-utils";
import { calculateAge } from "@/lib/patient-utils";
import { formatUTCDateToKSTString } from "@/lib/date-utils";

export const REGISTRATION_ID_NEW = "new";
export const APPOINTMENT_ID_PREFIX = "a";
export const PROVISIONAL_ID_PREFIX = "p";

/**
 * 접수일(receptionDateTime)과 동일한 날짜의 바이탈 측정이 있는지 여부
 * @param receptionDateTime - 접수 일시 (Date | string)
 * @param vitalMeasurements - 바이탈 측정 목록 (measurementDateTime 필드 있는 객체 배열)
 */
export function getIsVitalToday(
  receptionDateTime: Date | string | null | undefined,
  vitalMeasurements: Array<{ measurementDateTime: string }> | null | undefined
): boolean {
  if (!receptionDateTime || !Array.isArray(vitalMeasurements)) return false;
  const receptionYyyymmdd = formatUTCDateToKSTString(receptionDateTime).replace(
    /-/g,
    ""
  );
  if (receptionYyyymmdd.length !== 8) return false;
  return vitalMeasurements.some((v) => {
    const measurementYyyymmdd = formatUTCDateToKSTString(
      v.measurementDateTime
    ).replace(/-/g, "");
    return measurementYyyymmdd === receptionYyyymmdd;
  });
}

export const isNewRegistrationId = (
  id: string | number | null | undefined
): boolean => {
  const value = id?.toString().trim();
  return value === REGISTRATION_ID_NEW;
};

export const isAppointmentRegistrationId = (
  id: string | number | null | undefined
): boolean => {
  const value = id?.toString().trim() ?? "";
  return value.startsWith(APPOINTMENT_ID_PREFIX);
};

/**
 * 접수 모드인지 확인 (신규환자, 예약환자, 접수되지 않은 기환자는 접수모드)
 * 접수된 환자는 false를 반환
 */
export const isRegistrationMode = (
  id: string | number | null | undefined
): boolean => {
  const value = id?.toString().trim() ?? "";
  if (!value || value === "0") return true;
  if (isNewRegistrationId(value)) return true;
  if (isAppointmentRegistrationId(value)) return true;
  if (isProvisionalRegistrationId(value)) return true;
  return false;
};

/**
 * 접수되지 않은 기환자 ID인지 확인 (p 접두사로 시작)
 */
export const isProvisionalRegistrationId = (
  id: string | number | null | undefined
): boolean => {
  const value = id?.toString().trim() ?? "";
  return value.startsWith(PROVISIONAL_ID_PREFIX);
};

export const normalizeRegistrationId = (
  rawId: string | number | null | undefined
): string => {
  const strId =
    rawId === null || rawId === undefined ? "" : rawId.toString().trim();

  if (isAppointmentRegistrationId(strId)) return strId;
  if (isProvisionalRegistrationId(strId)) return strId;
  if (isNewRegistrationId(strId)) return REGISTRATION_ID_NEW;

  if (!strId || strId === "0") {
    console.warn(
      "[registrationId] 유효하지 않은 값 감지 -> 'new'로 대체",
      { rawId }
    );
    return REGISTRATION_ID_NEW;
  }

  return strId;
};

export const buildAppointmentRegistrationId = (
  appointmentId: string | number | null | undefined
): string => {
  if (appointmentId === null || appointmentId === undefined) {
    console.warn(
      "[registrationId] appointmentId가 없어 'new'로 대체"
    );
    return REGISTRATION_ID_NEW;
  }

  return `${APPOINTMENT_ID_PREFIX}${appointmentId}`;
};

/**
 * 접수되지 않은 기환자 ID 생성 (p 접두사 + 고유 ID)
 * @param uniqueId - 고유 식별자 (예: patientId, timestamp 등)
 */
export const buildProvisionalRegistrationId = (
  uniqueId: string | number | null | undefined
): string => {
  if (uniqueId === null || uniqueId === undefined) {
    return `${PROVISIONAL_ID_PREFIX}${Date.now()}`;
  }

  return `${PROVISIONAL_ID_PREFIX}${uniqueId}`;
};

export const formatTimeHHMM = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "";
  let d: Date;
  if (typeof date === "string") {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return "";
  }
  if (isNaN(d.getTime())) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * 본인확인 예외 및 완료 여부에 대한 검증 로직
 * @param identityVerifiedAt - 본인확인 완료 날짜
 * @param rrn - 주민등록번호
 * @param identityOptional - 본인확인 예외 여부 (false면 본인확인 필수)
 * @returns 본인확인여부 enum 값
 */
export function checkIdYN(
  identityVerifiedAt: Date | string | null | undefined,
  rrn: string | null | undefined,
  identityOptional: boolean | null | undefined = false
): 본인확인여부 {
  // 1. rrn이 있으면 나이 계산 (19세 미만이면 예외)
  if (rrn) {
    const rrnInfo = extractInfoFromRrn(rrn);
    if (rrnInfo.isValid && rrnInfo.birthString) {
      const age = calculateAge(rrnInfo.birthString);
      if (age !== undefined && age < 19) {
        return 본인확인여부.예외;
      }
    }
  }

  // 2. 본인확인 완료된 환자 확인 (identityOptional === false && identityVerifiedAt !== null && 6개월 이내)
  if (identityOptional === false && identityVerifiedAt) {
    const verifiedDate =
      identityVerifiedAt instanceof Date
        ? identityVerifiedAt
        : new Date(identityVerifiedAt);

    if (!isNaN(verifiedDate.getTime())) {
      const sixMonthsLater = new Date(verifiedDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      if (sixMonthsLater > new Date()) {
        return 본인확인여부.완료;
      }
    }
  }

  // 3. 본인확인 예외 여부 확인 (identityOptional === true && identityVerifiedAt !== null)
  if (identityOptional === true && identityVerifiedAt) {
    return 본인확인여부.예외;
  }

  // 4. 그 외는 미완료
  return 본인확인여부.미완료;
}

/**
 * 본인확인 예외 및 완료 여부에 대한 검증 로직 (rrnHash 사용)
 * @param identityVerifiedAt - 본인확인 완료 날짜
 * @param rrnHash - 주민등록번호 해시 (rrn과 동일한 형식)
 * @param identityOptional - 본인확인 예외 여부 (false면 본인확인 필수)
 * @returns 본인확인여부 enum 값과 style 객체
 */
export function showIdYN(
  identityVerifiedAt: Date | string | null | undefined,
  rrn: string | null | undefined,
  identityOptional: boolean | null | undefined = false
): {
  idYN: 본인확인여부;
  style: {
    backgroundColor: string;
    color: string;
    borderColor: string;
  };
} {
  // 1. rrn이 있으면 나이 계산 (19세 미만이면 예외)
  if (rrn) {
    const rrnInfo = extractInfoFromRrn(rrn);
    if (rrnInfo.isValid && rrnInfo.birthString) {
      const age = calculateAge(rrnInfo.birthString);
      if (age !== undefined && age < 19) {
        return {
          idYN: 본인확인여부.예외,
          style: {
            backgroundColor: "var(--bg-main)",
            color: "var(--border-2)",
            borderColor: "var(--border-2)",
          },
        };
      }
    }
  }

  // 2. 본인확인 완료된 환자 확인 (identityOptional === false && identityVerifiedAt !== null && 6개월 이내)
  if (identityOptional === false && identityVerifiedAt) {
    const verifiedDate =
      identityVerifiedAt instanceof Date
        ? identityVerifiedAt
        : new Date(identityVerifiedAt);

    if (!isNaN(verifiedDate.getTime())) {
      const sixMonthsLater = new Date(verifiedDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      if (sixMonthsLater > new Date()) {
        return {
          idYN: 본인확인여부.완료,
          style: {
            backgroundColor: "var(--bg-main)",
            color: "var(--positive)",
            borderColor: "var(--positive)",
          },
        };
      }
    }
  }

  // 3. 본인확인 예외 여부 확인 (identityOptional === true && identityVerifiedAt !== null)
  if (identityOptional === true && identityVerifiedAt) {
    return {
      idYN: 본인확인여부.예외,
      style: {
        backgroundColor: "var(--bg-main)",
        color: "var(--border-2)",
        borderColor: "var(--border-2)",
      },
    };
  }

  // 4. 그 외는 미완료 (배경 --red-1, 글자 --red-2, 테두리 미표기)
  return {
    idYN: 본인확인여부.미완료,
    style: {
      backgroundColor: "var(--red-1)",
      color: "var(--red-2)",
      borderColor: "transparent",
    },
  };
}