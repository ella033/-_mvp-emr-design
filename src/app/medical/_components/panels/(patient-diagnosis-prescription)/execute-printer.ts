/**
 * 저장 후 출력(진료기록부, 처방전, 검사 라벨)을 순서대로 실행하는 유틸.
 * 각 단계는 실패해도 로그만 남기고 다음 단계로 진행합니다.
 */

import type { RefObject } from "react";
import { DocumentsService } from "@/services/documents-service";
import { mapMedicalRecordApiResponseToData, printMedicalRecordLocal } from "@/lib/medical-record";
import type { MedicalRecordData } from "@/lib/medical-record";
import {
  hasExaminationOrders,
  printExaminationLabelsSilent,
  initializePosPrinter,
} from "@/lib/label-printer";
import type { PatientInfo as LabelPatientInfo } from "@/lib/label-printer";
import { calculateAge } from "@/lib/patient-utils";
import { OutputTypeCode } from "@/types/printer-types";
import type { OrderGridRef } from "@/components/disease-order/order/order-grid";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getNormalizedCellString } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { getSpecimenDetail } from "./api-converter";

/**
 * 그리드 데이터에서 검체 코드를 추출 (중복 제거)
 * LabOrdersService.getExternalLabOrdersByPatientAndDate와 동일한 3가지 소스에서 추출
 */
function collectSpecimenCodesFromGrid(gridData: MyTreeGridRowType[]): string[] {
  const codes = new Set<string>();
  for (const row of gridData) {
    // 1. specimenDetail[].code (그리드 셀 — JSON 문자열)
    for (const s of getSpecimenDetail(row)) {
      if (s?.code != null && String(s.code).trim() !== "") {
        codes.add(String(s.code).trim());
      }
    }

    // 2. externalLabData (원본 Order 객체)
    const externalLabData = (row.orgData?.data as any)?.externalLabData;
    if (externalLabData?.examination?.spcCode != null) {
      const code = String(externalLabData.examination.spcCode).trim();
      if (code !== "") codes.add(code);
    }
    if (externalLabData?.exams?.length) {
      for (const e of externalLabData.exams) {
        for (const code of e.scodes ?? []) {
          if (code != null && String(code).trim() !== "") {
            codes.add(String(code).trim());
          }
        }
      }
    }
  }
  return Array.from(codes);
}

/** 삭제 예정: 진료기록부 로컬 출력 시 사용할 POS 프린터 Logical Name (SDK). 에이전트/로컬 분기 제거 시 삭제 */
export const MEDICAL_RECORD_LOCAL_PRINTER_NAME = "Printer2";

/** 진료기록부 에이전트 출력 함수 시그니처 */
type PrintMedicalRecordAgent = (params: {
  data: MedicalRecordData;
}) => Promise<{ success: boolean; message?: string }>;

/** 처방전 PDF 생성 함수 시그니처 */
type BuildPrescriptionPdf = (encounterId: string) => Promise<Blob | string | null>;

/** PDF 출력 요청 함수 시그니처 */
type RequestPrintJob = (params: {
  pdf: Blob;
  outputTypeCode: OutputTypeCode;
  copies?: number;
  paperSize?: string;
  fileNamePrefix?: string;
}) => Promise<unknown>;

/** HTML 출력 요청 함수 시그니처 */
type RequestHtmlPrintJob = (params: {
  html: string;
  outputTypeCode: OutputTypeCode;
  copies?: number;
  paperSize?: string;
  fileNamePrefix?: string;
}) => Promise<unknown>;

/** 옵션: 등록 환자(검사 라벨용). Patient와 호환되는 최소 필드 */
export interface ExecutePrintAfterSavePatient {
  id?: number;
  patientNo?: string | number | null | undefined;
  name?: string;
  birthDate?: string | null;
  gender?: number | null;
}

export interface ExecutePrintAfterSaveOptions {
  /** 진료(encounter) ID. 없거나 비어 있으면 "진료 내역을 찾을 수 없습니다." throw */
  encounterId: string | number | null | undefined;
  /** 처방 그리드 ref. saveEncounter와 같은 방식으로 getTreeData()에서 직접 읽기 */
  prescriptionGridRef: RefObject<OrderGridRef | null>;
  /** 현재 접수 환자 (검사 라벨용) */
  currentRegistrationPatient: ExecutePrintAfterSavePatient | null | undefined;
  /** "agent"면 에이전트 출력, 아니면 로컬 출력. 미지정 시 "agent" */
  medicalRecordPrintMode?: "agent" | "local";
  /** 진료기록부 에이전트 출력 (agent 모드일 때 사용) */
  printMedicalRecord: PrintMedicalRecordAgent;
  /** 진료기록부 로컬 출력 시 사용할 프린터 이름 */
  medicalRecordLocalPrinterName: string;
  buildPrescriptionPdf: BuildPrescriptionPdf;
  requestPrintJob: RequestPrintJob;
  requestHtmlPrintJob: RequestHtmlPrintJob;
}

/**
 * 저장 후 출력(진료기록부 → 처방전 → 검사 라벨)을 순서대로 실행합니다.
 * 각 단계는 try/catch로 감싸져 있어 실패해도 다음 단계로 진행합니다.
 */
export async function executePrinter(options: ExecutePrintAfterSaveOptions): Promise<void> {
  const {
    encounterId: encounterIdInput,
    prescriptionGridRef,
    currentRegistrationPatient,
    medicalRecordPrintMode = "agent",
    printMedicalRecord,
    medicalRecordLocalPrinterName,
    buildPrescriptionPdf,
    requestPrintJob,
    requestHtmlPrintJob,
  } = options;

  if (encounterIdInput == null || String(encounterIdInput).trim() === "") {
    throw new Error("진료 내역을 찾을 수 없습니다.");
  }
  const encounterId = String(encounterIdInput);

  // saveEncounter와 같은 방식으로 그리드에서 직접 읽기
  const prescriptionGridData = prescriptionGridRef.current?.getTreeData() ?? [];
  const orders = prescriptionGridData.map((row) => ({
    itemType: getNormalizedCellString(row, "itemType"),
  }));

  // 1. 진료기록부 출력
  try {
    const medicalRecordApiResponse = await DocumentsService.getMedicalRecord(encounterId);
    const hasPrescriptions = (medicalRecordApiResponse?.처방목록?.length ?? 0) > 0;
    if (!medicalRecordApiResponse || !hasPrescriptions) {
      console.log("처방목록이 없어 진료기록부 출력을 건너뜁니다.");
    } else {
      const medicalRecordData = mapMedicalRecordApiResponseToData(medicalRecordApiResponse);
      const isAgentMode = medicalRecordPrintMode === "agent";
      const medicalRecordResult = isAgentMode
        ? await printMedicalRecord({ data: medicalRecordData })
        : await (async () => {
            await initializePosPrinter().catch((err) => {
              console.warn(
                "[executePrintAfterSave] POS SDK 로드 실패 (진료기록부 로컬 출력 시 필요):",
                err
              );
            });
            return await printMedicalRecordLocal(medicalRecordLocalPrinterName, medicalRecordData, {
              copies: 1,
            });
          })();
      if (!medicalRecordResult.success) {
        console.error("진료기록부 출력 실패:", medicalRecordResult.message);
      }
    }
  } catch (medicalRecordError) {
    console.error("진료기록부 출력 실패:", medicalRecordError);
  }

  // 2. 처방전 출력
  try {
    const prescriptionOutput = await buildPrescriptionPdf(encounterId);
    if (prescriptionOutput === null) {
      console.log("원외 처방 내역이 없어 처방전 출력을 건너뜁니다.");
    } else if (typeof prescriptionOutput === "string") {
      // HTML 기반 처방전 → requestHtmlPrintJob으로 출력
      await requestHtmlPrintJob({
        html: prescriptionOutput,
        outputTypeCode: OutputTypeCode.OUTPATIENT_RX,
      });
    } else {
      await requestPrintJob({
        pdf: prescriptionOutput,
        outputTypeCode: OutputTypeCode.OUTPATIENT_RX,
      });
    }
  } catch (prescriptionError) {
    console.error("처방전 출력 실패:", prescriptionError);
  }

  // 3. 검사 라벨 출력
  try {
    const hasExamOrders = hasExaminationOrders(orders);
    if (!hasExamOrders) {
      console.log("[검사라벨] 검사 처방이 없어 검사 라벨 출력을 건너뜁니다.");
      return;
    }
    const patient = currentRegistrationPatient;
    if (!patient) {
      return;
    }
    const birthDate = String(patient.birthDate ?? "");
    const labelPatient: LabelPatientInfo = {
      chartNumber: String(patient.patientNo ?? patient.id ?? ""),
      patientName: String(patient.name ?? ""),
      age: calculateAge(birthDate) ?? 0,
      gender: patient.gender === 2 ? "F" : "M",
      birthDate,
    };
    const specimenCodes = collectSpecimenCodesFromGrid(prescriptionGridData);
    const labelResult = await printExaminationLabelsSilent({
      patient: labelPatient,
      specimenCodes,
    });
    if (!labelResult.success) {
      console.error("검사 라벨 출력 실패:", labelResult.message);
    }
  } catch (examLabelError) {
    console.error("[검사라벨] 검사 라벨 출력 예외:", examLabelError);
  }
}
