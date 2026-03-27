"use client";

import { useMemo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { PAPER_SIZES, PrintableDocument, usePrintPageContext } from "@/lib/printable";
import { createPdfBlobFromDom } from "@/lib/pdf/client-pdf-generator";
import type { ExternalLabOrder } from "@/services/lab-orders-service";

import { extractPatientInfo } from "./examination-request-print-utils";

export interface ExaminationRequestPrintablePagesProps {
  labsData: Array<{ labName: string; orders: ExternalLabOrder[] }>;
  treatmentDate: string;
  hospitalName?: string;
  hospitalCode?: string;
  onPageCountChange?: (labName: string, count: number) => void;
}

export const PAGE_MARGIN_MM = { top: 5, right: 8, bottom: 8, left: 8 };
const FOOTER_FONT_SIZE_PX = 13;
const FOOTER_COLOR = "#6B7280";

export async function generateExaminationRequestPdfWithPrintable(
  params: Omit<ExaminationRequestPrintablePagesProps, "onPageCountChange">,
): Promise<Blob> {
  const { labsData, treatmentDate, hospitalName, hospitalCode } = params;

  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    top: "0",
    left: "-10000px",
    width: `${PAPER_SIZES.A4.width}mm`,
    overflow: "visible",
    background: "white",
    zIndex: "-1",
  });
  document.body.appendChild(host);

  const root = createRoot(host);

  try {
    root.render(
      <ExaminationRequestPrintablePages
        labsData={labsData}
        treatmentDate={treatmentDate}
        hospitalName={hospitalName}
        hospitalCode={hospitalCode}
      />
    );

    await waitForStablePrintablePages({ root: host });

    return await createPdfBlobFromDom({
      root: host,
      options: {
        pageSelector: ".printable-page",
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        quality: 1.0,
        isolateDomCapture: true,
      },
    });
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}

export function ExaminationRequestPrintablePages(props: ExaminationRequestPrintablePagesProps) {
  const { labsData, treatmentDate, hospitalName, hospitalCode, onPageCountChange } = props;

  const printableLabs = useMemo(
    () => labsData.filter((lab) => Boolean(lab?.orders?.length)),
    [labsData],
  );

  return (
    <div style={{ background: "white" }}>
      {printableLabs.map((lab) => (
        <PrintableDocument
          key={lab.labName}
          paper={PAPER_SIZES.A4}
          margin={PAGE_MARGIN_MM}
          sectionSpacing={1}
          footerMode="overlay"
          header={() => (
            <ExaminationRequestHeader
              treatmentDate={treatmentDate}
              hospitalName={hospitalName}
              hospitalCode={hospitalCode}
              labName={lab.labName}
            />
          )}
          footer={() => <LabPageFooter />}
          observeDependencies={[lab, treatmentDate, hospitalName, hospitalCode]}
          includeMargins
          onPageCountChange={(count) => onPageCountChange?.(lab.labName, count)}
        >
          {renderExaminationRequestTable(lab.orders)}
        </PrintableDocument>
      ))}
    </div>
  );
}

function ExaminationRequestHeader(props: {
  treatmentDate: string;
  hospitalName?: string;
  hospitalCode?: string;
  labName?: string;
}) {
  const { treatmentDate, hospitalName, hospitalCode, labName } = props;
  const hospitalInfo = resolveHospitalInfoLabel({ hospitalName, hospitalCode });

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          fontWeight: 700,
          paddingBottom: "1px",
        }}
      >
        수탁검사의뢰서
      </div>
      {labName && (
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            color: "#1F2937",
            padding: "1px 0 2px 0",
            borderBottom: "2px solid #333",
          }}
        >
          [ {labName} ]
        </div>
      )}
      {!labName && (
        <div style={{ borderBottom: "2px solid #333" }} />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "1px 0",
          fontSize: "9px",
          color: "#374151",
        }}
      >
        <div>병원명 : {hospitalInfo}</div>
        <div>검사의뢰일 : {treatmentDate}</div>
      </div>
    </div>
  );
}

function renderExaminationRequestTable(orders: ExternalLabOrder[]) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "10px",
      }}
    >
      <thead>
        <tr>
          <th style={resolveHeaderCellStyle({ width: "22%" })}>
            차트번호 / 수진자명 / 성별·주민번호
          </th>
          <th style={resolveHeaderCellStyle({ width: "8%" })}>
            처방의
          </th>
          <th style={resolveHeaderCellStyle({ width: "13%" })}>검체명</th>
          <th style={resolveHeaderCellStyle({ width: "57%" })}>
            검사코드 [검사명] {"<"}수탁의뢰번호{">"}
          </th>
        </tr>
      </thead>
      <tbody>{renderRows(orders)}</tbody>
    </table>
  );
}

function LabPageFooter() {
  const page = usePrintPageContext();

  if (!page) {
    return null;
  }

  return (
    <div
      className="lab-page-footer"
      style={{
        position: "absolute",
        bottom: "0",
        left: "0",
        right: "0",
        textAlign: "center",
        fontSize: `${FOOTER_FONT_SIZE_PX}px`,
        color: FOOTER_COLOR,
        lineHeight: 1.2,
      }}
    >
      - {page.pageIndex} / {page.totalPages} -
    </div>
  );
}

interface FlattenedRow {
  rowKey: string;
  chartNumber: string;
  patientName: string;
  genderLabel: string;
  maskedRrn: string;
  doctorName: string;
  specimenName: string;
  examCells: ReactNode;
}

function flattenOrdersToRows(orders: ExternalLabOrder[]): FlattenedRow[] {
  const rows: FlattenedRow[] = [];

  orders.forEach((order) => {
    const patientInfo = extractPatientInfo(order);
    const { chartNumber, patientName, genderLabel, maskedRrn, doctorName, examRows } =
      patientInfo;

    if (!examRows.length) {
      rows.push({
        rowKey: String(order.id),
        chartNumber,
        patientName,
        genderLabel,
        maskedRrn,
        doctorName,
        specimenName: "-",
        examCells: <span>-</span>,
      });
      return;
    }

    const groupedBySpecimen = new Map<string, typeof examRows>();
    examRows.forEach((exam) => {
      const orderSpecimen = (exam as any).order?.specimenDetail;
      const specimenName = Array.isArray(orderSpecimen) && orderSpecimen.length > 0
        ? orderSpecimen.map((s: { name: string }) => s.name).join(", ")
        : (exam.rawData?.examination?.spcName || "-");
      if (!groupedBySpecimen.has(specimenName)) {
        groupedBySpecimen.set(specimenName, []);
      }
      groupedBySpecimen.get(specimenName)?.push(exam);
    });

    Array.from(groupedBySpecimen.entries()).forEach(([specimenName, exams], groupIdx) => {
      const examCells = exams.map((exam) => {
        const examination = exam.rawData?.examination;
        const examCode = exam.stdCode || exam.trcode || "-";
        const examName = exam.order?.name || exam.stdCodeName || examination?.name || "-";
        return (
          <div key={exam.id || groupIdx}>
            {examCode} [{examName}] {"<"}{exam.id || "-"}{">"}
          </div>
        );
      });

      rows.push({
        rowKey: `${order.id}-${specimenName}-${groupIdx}`,
        chartNumber,
        patientName,
        genderLabel,
        maskedRrn,
        doctorName,
        specimenName,
        examCells: <>{examCells}</>,
      });
    });
  });

  return rows;
}

function resolvePatientGroupKey(row: FlattenedRow): string {
  return `${row.chartNumber}|${row.patientName}|${row.doctorName}`;
}

function renderRows(orders: ExternalLabOrder[]) {
  const rows = flattenOrdersToRows(orders);

  let patientGroupIndex = 0;
  const groupIndices = rows.map((row, index) => {
    const prevRow = index > 0 ? rows[index - 1] ?? null : null;
    const isSamePatientGroup =
      prevRow !== null && resolvePatientGroupKey(prevRow) === resolvePatientGroupKey(row);
    if (!isSamePatientGroup && index > 0) {
      patientGroupIndex += 1;
    }
    return patientGroupIndex;
  });

  return rows.map((row, index) => {
    const prevRow = index > 0 ? rows[index - 1] ?? null : null;
    const nextRow = index < rows.length - 1 ? rows[index + 1] ?? null : null;
    const isSamePatientGroup =
      prevRow !== null && resolvePatientGroupKey(prevRow) === resolvePatientGroupKey(row);
    const isNextSameGroup =
      nextRow !== null && resolvePatientGroupKey(nextRow) === resolvePatientGroupKey(row);

    const isEvenGroup = groupIndices[index] % 2 === 1;
    const rowBg = isEvenGroup ? "#F9FAFB" : undefined;

    const mergedCellStyle = {
      ...resolveBodyCellStyle({}),
      backgroundColor: rowBg,
      borderTop: "none",
      borderBottom: isNextSameGroup ? "none" : resolveBodyCellStyle({}).border,
    };
    const patientCellStyle = isSamePatientGroup
      ? mergedCellStyle
      : {
          ...resolveBodyCellStyle({}),
          backgroundColor: rowBg,
          borderBottom: isNextSameGroup ? "none" : resolveBodyCellStyle({}).border,
        };
    const doctorCellStyle = isSamePatientGroup
      ? mergedCellStyle
      : {
          ...resolveBodyCellStyle({}),
          backgroundColor: rowBg,
          borderBottom: isNextSameGroup ? "none" : resolveBodyCellStyle({}).border,
        };
    const cellStyle = { ...resolveBodyCellStyle({}), backgroundColor: rowBg };

    return (
      <tr key={row.rowKey}>
        <td style={patientCellStyle}>
          {!isSamePatientGroup && (
            <>{row.chartNumber} / {row.patientName} / {row.genderLabel}·{row.maskedRrn}</>
          )}
        </td>
        <td style={doctorCellStyle}>
          {!isSamePatientGroup && row.doctorName}
        </td>
        <td style={cellStyle}>{row.specimenName}</td>
        <td style={cellStyle}>
          {row.examCells}
        </td>
      </tr>
    );
  });
}

function resolveHospitalInfoLabel(params: {
  hospitalName?: string;
  hospitalCode?: string;
}) {
  const { hospitalName, hospitalCode } = params;

  const hasHospitalName = Boolean(hospitalName);
  const hasHospitalCode = Boolean(hospitalCode);
  const hasHospitalInfo = hasHospitalName || hasHospitalCode;

  if (!hasHospitalInfo) {
    return "병원명 [병원코드]";
  }

  if (hasHospitalName && hasHospitalCode) {
    return `${hospitalName} [${hospitalCode}]`;
  }

  return `${hospitalName || "병원명"} [${hospitalCode || "병원코드"}]`;
}

export function resolveHeaderCellStyle(params: { width: string }) {
  return {
    width: params.width,
    border: "1px solid #D1D5DB",
    padding: "3px 4px",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
    backgroundColor: "#F3F4F6",
    fontWeight: 600,
    fontSize: "9px",
    lineHeight: "1.2",
  };
}

export function resolveBodyCellStyle(_params: {}) {
  return {
    border: "1px solid #D1D5DB",
    padding: "2px 4px",
    textAlign: "left" as const,
    verticalAlign: "middle" as const,
    fontSize: "9px",
    lineHeight: "1.2",
  };
}

async function waitForStablePrintablePages(params: {
  root: HTMLElement;
  selector?: string;
  stableFrames?: number;
  timeoutMs?: number;
}) {
  const { root, selector = ".printable-page", stableFrames = 3, timeoutMs = 8000 } =
    params;

  const fontReady = (document as any).fonts?.ready as Promise<unknown> | undefined;
  if (fontReady) {
    await fontReady.catch(() => undefined);
  }

  const start = performance.now();
  let lastCount = -1;
  let stableCount = 0;

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  return await new Promise<void>((resolve, reject) => {
    function tick() {
      const elapsed = performance.now() - start;
      const timedOut = elapsed > timeoutMs;
      if (timedOut) {
        reject(new Error("출력 렌더링이 안정화되지 않았습니다."));
        return;
      }

      const pages = root.querySelectorAll(selector);
      const count = pages.length;
      const hasPages = count > 0;
      const isSame = count === lastCount;

      if (hasPages && isSame) {
        stableCount += 1;
      } else {
        stableCount = 0;
      }

      lastCount = count;

      if (stableCount >= stableFrames) {
        resolve();
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

