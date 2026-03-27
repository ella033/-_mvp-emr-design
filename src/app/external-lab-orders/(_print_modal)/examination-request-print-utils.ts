import { getGender, makeRrnView } from "@/lib/patient-utils";
import type { ExternalLabOrder } from "@/services/lab-orders-service";

/**
 * 주문 데이터에서 환자 정보 추출
 */
export const extractPatientInfo = (order: ExternalLabOrder) => {
  const rrn = order.patient?.rrn || "";
  const maskedRrn = rrn ? makeRrnView(rrn) : "-";

  let genderLabel = "-";
  if (order.patient?.gender) {
    genderLabel = getGender(order.patient.gender === 1 ? 1 : 2, "ko");
  } else if (order.sex) {
    genderLabel = getGender(order.sex === "M" ? 1 : 2, "ko");
  }

  const chartNumber = order.patient?.patientNo != null
    ? `${order.patient.patientNo}`
    : "-";

  const doctorName = order.encounter?.doctor?.name || "담당자 미지정";
  const examRows = order.exams || [];

  return {
    chartNumber,
    patientName: order.patientName || "이름 없음",
    genderLabel,
    maskedRrn,
    doctorName,
    examRows,
  };
};

/**
 * 줌 레벨에서 스케일 값 추출
 */
export const getZoomScale = (zoomLevel: string): number => {
  return parseInt(zoomLevel.replace("%", "")) / 100;
};
