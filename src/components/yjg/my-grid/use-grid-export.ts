import { useCallback } from "react";
import type { MyGridHeaderType, MyGridRowType, MyGridCellType } from "./my-grid-type";
import type { ExcelExportConfig, ExcelExportExtraRow, CsvExportConfig, PdfExportConfig, MergedCellInfo } from "./my-grid-summary-type";

interface UseGridExportProps {
  headers: MyGridHeaderType[];
  data: MyGridRowType[];
  summaryData?: Record<string, number | string>;
  mergedCells?: MergedCellInfo[];
}

interface UseGridExportResult {
  exportToExcel: (config?: ExcelExportConfig) => Promise<void>;
  exportToCSV: (config?: CsvExportConfig) => void;
  exportToPdf: (config?: PdfExportConfig) => Promise<Blob | void>;
}

// Grid 색상 상수
const GRID_COLORS = {
  headerBg: "#f4f4f5",
  headerText: "#292a2d",
  summaryBg: "#eaf2fe",
  cellBg: "#ffffff",
  border: "#e5e5e5",
} as const;

/**
 * 셀 값을 Excel 타입에 맞게 변환
 */
function convertCellValue(
  cell: MyGridCellType | undefined,
  value: string | number | boolean | null | undefined
): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value === "") return null;

  if (typeof value === "boolean") return value;

  if (cell?.inputType === "textNumber") {
    const cleanValue = String(value).replace(/,/g, "");
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? String(value) : numValue;
  }

  if (typeof value === "number") return value;

  return String(value);
}

/**
 * Summary 값을 Excel 타입에 맞게 변환
 */
function convertSummaryValue(
  value: string | number | null | undefined,
  isNumericColumn: boolean
): string | number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") return value;

  if (isNumericColumn) {
    const cleanValue = String(value).replace(/,/g, "");
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? String(value) : numValue;
  }

  return String(value);
}

/**
 * Grid Excel/CSV/PDF Export를 위한 커스텀 훅
 */
export function useGridExport({
  headers,
  data,
  summaryData,
  mergedCells,
}: UseGridExportProps): UseGridExportResult {

  const getNumericColumns = useCallback((): Set<string> => {
    const numericCols = new Set<string>();
    const firstRow = data[0];
    if (!firstRow) return numericCols;

    firstRow.cells.forEach((cell) => {
      if (cell.inputType === "textNumber") {
        numericCols.add(cell.headerKey);
      }
    });
    return numericCols;
  }, [data]);

  const calculateMergeRanges = useCallback((
    visibleHeaders: MyGridHeaderType[],
    summaryRowIndex: number
  ): { s: { r: number; c: number }; e: { r: number; c: number } }[] => {
    const firstRow = data[0];
    if (!firstRow) return [];

    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
    let mergeStartIndex = -1;

    visibleHeaders.forEach((header, index) => {
      const cell = firstRow.cells.find((c) => c.headerKey === header.key);
      const isTextNumber = cell?.inputType === "textNumber";

      if (!isTextNumber) {
        if (mergeStartIndex === -1) {
          mergeStartIndex = index;
        }
      } else {
        if (mergeStartIndex !== -1) {
          const span = index - mergeStartIndex;
          if (span > 1) {
            merges.push({
              s: { r: summaryRowIndex, c: mergeStartIndex },
              e: { r: summaryRowIndex, c: index - 1 },
            });
          }
          mergeStartIndex = -1;
        }
      }
    });

    if (mergeStartIndex !== -1) {
      const span = visibleHeaders.length - mergeStartIndex;
      if (span > 1) {
        merges.push({
          s: { r: summaryRowIndex, c: mergeStartIndex },
          e: { r: summaryRowIndex, c: visibleHeaders.length - 1 },
        });
      }
    }

    return merges;
  }, [data]);

  const getMergeRanges = useCallback((
    visibleHeaders: MyGridHeaderType[],
    summaryRowIndex: number
  ): { s: { r: number; c: number }; e: { r: number; c: number } }[] => {
    if (mergedCells && mergedCells.length > 0) {
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

      mergedCells.forEach((merged) => {
        const startColIndex = visibleHeaders.findIndex((h) => h.key === merged.startKey);
        if (startColIndex === -1) return;

        merges.push({
          s: { r: summaryRowIndex, c: startColIndex },
          e: { r: summaryRowIndex, c: startColIndex + merged.span - 1 },
        });
      });

      return merges;
    }

    return calculateMergeRanges(visibleHeaders, summaryRowIndex);
  }, [mergedCells, calculateMergeRanges]);

  const exportToExcel = useCallback(async (config?: ExcelExportConfig) => {
    const XLSX = await import("xlsx");

    const {
      fileName = `내보내기 ${Date.now()}`,
      sheetName = "Sheet1",
      includeHeaders = true,
      includeSummary = true,
      summaryPosition = "bottom",
      columnWidths,
      extraRows,
    } = config || {};

    const visibleHeaders = headers.filter((h) => h.visible !== false);
    const numericColumns = getNumericColumns();
    const workbook = XLSX.utils.book_new();
    const wsData: (string | number | boolean | null)[][] = [];
    let summaryRowIndex = -1;

    const addExtraRows = (rows: ExcelExportExtraRow[]) => {
      rows.forEach((extraRow) => {
        if (extraRow.type === "inline") {
          const rowData: (string | number | null)[] = [];
          extraRow.data.forEach((item) => {
            rowData.push(item.label);
            rowData.push(item.value);
          });
          wsData.push(rowData);
        } else if (extraRow.type === "grid") {
          const labels = extraRow.data.map((item) => item.label);
          const values = extraRow.data.map((item) => item.value);
          wsData.push(labels);
          wsData.push(values);
        }
      });

      if (rows.length > 0) {
        wsData.push([]);
      }
    };

    if (extraRows && extraRows.length > 0) {
      addExtraRows(extraRows);
    }

    const createSummaryRow = () => {
      return visibleHeaders.map((header) => {
        const value = summaryData?.[header.key];
        const isNumeric = numericColumns.has(header.key);
        return convertSummaryValue(value, isNumeric);
      });
    };

    if (includeSummary && summaryData && summaryPosition === "top") {
      if (includeHeaders) {
        wsData.push(visibleHeaders.map((h) => h.name));
      }
      summaryRowIndex = wsData.length;
      wsData.push(createSummaryRow());
      wsData.push(visibleHeaders.map(() => null));
      if (includeHeaders) {
        wsData.push(visibleHeaders.map((h) => h.name));
      }
    } else {
      if (includeHeaders) {
        wsData.push(visibleHeaders.map((h) => h.name));
      }
    }

    data.forEach((row) => {
      const rowData = visibleHeaders.map((header) => {
        const cell = row.cells.find((c) => c.headerKey === header.key);
        return convertCellValue(cell, cell?.value);
      });
      wsData.push(rowData);
    });

    if (includeSummary && summaryData && summaryPosition === "bottom") {
      summaryRowIndex = wsData.length;
      wsData.push(createSummaryRow());
    }

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    if (includeSummary && summaryRowIndex >= 0) {
      const mergeRanges = getMergeRanges(visibleHeaders, summaryRowIndex);
      if (mergeRanges.length > 0) {
        worksheet["!merges"] = mergeRanges;
      }
    }

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; C++) {
      const header = visibleHeaders[C];
      if (!header || !numericColumns.has(header.key)) continue;

      for (let R = 0; R <= range.e.r; R++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellRef];
        if (cell && typeof cell.v === "number") {
          cell.t = "n";
          cell.z = "#,##0";
        }
      }
    }

    worksheet["!cols"] = visibleHeaders.map((header) => {
      const customWidth = columnWidths?.[header.key];
      if (customWidth) return { wch: customWidth };

      const headerWidth = header.name.length * 2;
      const contentWidth = Math.max(
        ...data.slice(0, 100).map((row) => {
          const cell = row.cells.find((c) => c.headerKey === header.key);
          return String(cell?.value ?? "").length;
        }),
        0
      );
      return { wch: Math.max(headerWidth, contentWidth, 10) };
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }, [headers, data, summaryData, getNumericColumns, getMergeRanges]);

  const exportToCSV = useCallback((config?: CsvExportConfig) => {
    const {
      fileName = "grid-export",
      includeSummary = true,
      summaryPosition = "bottom",
    } = config || {};

    const visibleHeaders = headers.filter((h) => h.visible !== false);

    let csvContent = "\uFEFF";

    const createSummaryRow = () => {
      return visibleHeaders.map((header) => {
        const value = summaryData?.[header.key];
        if (value === null || value === undefined) return "";
        return escapeCSV(String(value));
      }).join(",") + "\n";
    };

    const createHeaderRow = () => {
      return visibleHeaders.map((h) => escapeCSV(h.name)).join(",") + "\n";
    };

    if (includeSummary && summaryData && summaryPosition === "top") {
      csvContent += createHeaderRow();
      csvContent += createSummaryRow();
      csvContent += visibleHeaders.map(() => "").join(",") + "\n";
      csvContent += createHeaderRow();
    } else {
      csvContent += createHeaderRow();
    }

    data.forEach((row) => {
      const rowData = visibleHeaders.map((header) => {
        const cell = row.cells.find((c) => c.headerKey === header.key);
        if (!cell || cell.value === null || cell.value === undefined) return "";
        return escapeCSV(String(cell.value));
      });
      csvContent += rowData.join(",") + "\n";
    });

    if (includeSummary && summaryData && summaryPosition === "bottom") {
      csvContent += createSummaryRow();
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [headers, data, summaryData]);

  const exportToPdf = useCallback(async (config?: PdfExportConfig) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const {
      fileName = `내보내기 ${Date.now()}`,
      orientation = "landscape",
      pageSize = "a4",
      includeSummary = true,
      summaryPosition = "bottom",
      margin = 10,
      headerBackgroundColor = GRID_COLORS.headerBg,
      headerTextColor = GRID_COLORS.headerText,
      summaryBackgroundColor = GRID_COLORS.summaryBg,
      fontSize = 9,
      extraRows,
      returnBlob = false,
    } = config || {};

    const visibleHeaders = headers.filter((h) => h.visible !== false);
    const numericColumns = getNumericColumns();

    // PDF 페이지 크기 (mm)
    const pageSizes: Record<string, { width: number; height: number }> = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      letter: { width: 216, height: 279 },
      legal: { width: 216, height: 356 },
    };

    const pageConfig = pageSizes[pageSize] || pageSizes.a4;
    const pdfWidth = orientation === "landscape" ? pageConfig?.height ?? 0 : pageConfig?.width ?? 0;
    const pdfHeight = orientation === "landscape" ? pageConfig?.width ?? 0 : pageConfig?.height ?? 0;
    const contentWidth = pdfWidth - margin * 2;

    // px to mm 변환 (96dpi 기준: 1px ≈ 0.264mm)
    const pxToMm = (px: number): number => px * 0.264;

    // 컬럼 너비 계산 (mm)
    const getColumnWidthMm = (header: MyGridHeaderType): number => {
      const widthPx = header.width || 80;
      return pxToMm(widthPx);
    };

    // 컬럼들을 페이지 너비에 맞게 분할
    const splitColumnsIntoPages = (): MyGridHeaderType[][] => {
      const pages: MyGridHeaderType[][] = [];
      let currentPage: MyGridHeaderType[] = [];
      let currentWidth = 0;

      visibleHeaders.forEach((header) => {
        const colWidthMm = getColumnWidthMm(header);

        if (currentWidth + colWidthMm > contentWidth && currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [header];
          currentWidth = colWidthMm;
        } else {
          currentPage.push(header);
          currentWidth += colWidthMm;
        }
      });

      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      return pages;
    };

    // Summary Row 데이터 생성 (colSpan 지원)
    const createSummaryRowData = (columnGroup: MyGridHeaderType[]): (string | { content: string; colSpan?: number })[] => {
      // 병합 정보 계산
      let mergeInfo: { startIdx: number; count: number; label: string } | null = null;
      let tempStartIdx = -1;
      let tempCount = 0;
      let mergeLabel = "";

      columnGroup.forEach((header, idx) => {
        const cell = data[0]?.cells.find((c) => c.headerKey === header.key);
        const isTextNumber = cell?.inputType === "textNumber";

        if (!isTextNumber) {
          if (tempStartIdx === -1) {
            tempStartIdx = idx;
            const labelValue = summaryData?.[header.key];
            if (labelValue && typeof labelValue === "string") {
              mergeLabel = labelValue;
            }
          }
          tempCount++;
        } else {
          if (tempCount > 1) {
            mergeInfo = { startIdx: tempStartIdx, count: tempCount, label: mergeLabel || "합계" };
          }
          tempStartIdx = -1;
          tempCount = 0;
          mergeLabel = "";
        }
      });
      if (tempCount > 1) {
        mergeInfo = { startIdx: tempStartIdx, count: tempCount, label: mergeLabel || "합계" };
      }

      // Summary Row 생성 (colSpan 객체 포함)
      const result: (string | { content: string; colSpan?: number })[] = [];
      let skipCount = 0;

      columnGroup.forEach((header, idx) => {
        if (skipCount > 0) {
          skipCount--;
          // 병합된 셀은 건너뜀 (colSpan으로 처리되므로 추가하지 않음)
          return;
        }

        if (mergeInfo && idx === mergeInfo.startIdx) {
          // 병합 셀: colSpan 객체로 추가
          result.push({
            content: mergeInfo.label,
            colSpan: mergeInfo.count,
          });
          skipCount = mergeInfo.count - 1;
        } else {
          const value = summaryData?.[header.key];
          if (typeof value === "number") {
            result.push(value.toLocaleString("ko-KR"));
          } else {
            result.push(String(value ?? ""));
          }
        }
      });

      return result;
    };

    // 데이터 행 생성
    const createDataRows = (columnGroup: MyGridHeaderType[]): string[][] => {
      return data.map((row) => {
        return columnGroup.map((header) => {
          const cell = row.cells.find((c) => c.headerKey === header.key);
          if (!cell || cell.value === null || cell.value === undefined) return "";

          if (cell.inputType === "textNumber" && typeof cell.value === "number") {
            return cell.value.toLocaleString("ko-KR");
          }
          return String(cell.value);
        });
      });
    };

    // 색상 변환 (hex to RGB array)
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [parseInt(result[1] ?? "0", 16), parseInt(result[2] ?? "0", 16), parseInt(result[3] ?? "0", 16)]
        : [255, 255, 255];
    };

    try {
      const columnPages = splitColumnsIntoPages();

      if (columnPages.length === 0) {
        return;
      }

      const doc = new jsPDF({
        orientation,
        unit: "mm",
        format: pageSize,
      });

      // 한글 폰트 로드 (Next.js public 폴더에서)
      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        return btoa(
          new Uint8Array(buffer).reduce((d, byte) => d + String.fromCharCode(byte), "")
        );
      };

      // Regular, Bold, ExtraBold 폰트 병렬 로드
      const [regularRes, boldRes, extraBoldRes] = await Promise.all([
        fetch("/fonts/NanumGothic-Regular.ttf"),
        fetch("/fonts/NanumGothic-Bold.ttf"),
        fetch("/fonts/NanumGothic-ExtraBold.ttf"),
      ]);

      const [regularBuffer, boldBuffer, extraBoldBuffer] = await Promise.all([
        regularRes.arrayBuffer(),
        boldRes.arrayBuffer(),
        extraBoldRes.arrayBuffer(),
      ]);

      // 폰트 등록
      doc.addFileToVFS("NanumGothic-Regular.ttf", arrayBufferToBase64(regularBuffer));
      doc.addFileToVFS("NanumGothic-Bold.ttf", arrayBufferToBase64(boldBuffer));
      doc.addFileToVFS("NanumGothic-ExtraBold.ttf", arrayBufferToBase64(extraBoldBuffer));

      doc.addFont("NanumGothic-Regular.ttf", "NanumGothic", "normal");
      doc.addFont("NanumGothic-Bold.ttf", "NanumGothic", "bold");
      doc.addFont("NanumGothic-ExtraBold.ttf", "NanumGothic", "bolditalic"); // ExtraBold는 bolditalic으로 매핑

      doc.setFont("NanumGothic");

      // 각 컬럼 그룹을 페이지로 변환
      for (let pageIdx = 0; pageIdx < columnPages.length; pageIdx++) {
        const columnGroup = columnPages[pageIdx];
        if (!columnGroup || columnGroup.length === 0) continue;

        if (pageIdx > 0) {
          doc.addPage();
        }

        let startY = margin;

        // extraRows 추가 (첫 페이지에만)
        if (pageIdx === 0 && extraRows && extraRows.length > 0) {
          extraRows.forEach((extraRow) => {
            if (extraRow.type === "inline") {
              const inlineText = extraRow.data
                .map((item) => `${item.label}: ${item.value ?? ""}`)
                .join("    ");
              doc.setFont("NanumGothic");
              doc.setFontSize(fontSize);
              doc.text(inlineText, margin, startY + 4);
              startY += 8;
            } else if (extraRow.type === "grid") {
              const extraHeaders = extraRow.data.map((item) => item.label);
              const extraValues = [extraRow.data.map((item) => String(item.value ?? ""))];

              // 컬럼 너비 계산 함수
              const calculateExtraRowColumnWidths = (): Record<number, { cellWidth: number }> => {
                const columnStyles: Record<number, { cellWidth: number }> = {};
                const cellPadding = 2;
                const minWidth = 15; // 최소 너비 (mm)
                const maxWidth = 50; // 최대 너비 (mm)

                // 각 컬럼의 텍스트 길이 계산 (한글은 약 1.5배, 영문/숫자는 1배로 계산)
                const textLengths = extraRow.data.map((item) => {
                  const labelLength = Array.from(item.label).reduce((sum, char) => {
                    // 한글, 한자 등은 1.5배, 영문/숫자는 1배
                    return sum + (/[가-힣一-龯]/.test(char) ? 2 : 1);
                  }, 0);
                  const valueLength = Array.from(String(item.value ?? "")).reduce((sum, char) => {
                    return sum + (/[가-힣一-龯]/.test(char) ? 2 : 1);
                  }, 0);
                  return Math.max(labelLength, valueLength);
                });

                // 폰트 크기를 고려한 mm 변환 (대략적인 계산)
                // fontSize 8 기준: 1문자 ≈ 1.5mm, fontSize 9 기준: 1문자 ≈ 1.7mm
                const charWidthMm = (fontSize - 1) * 0.19; // 대략적인 문자 너비
                const totalTextWidth = textLengths.reduce((sum, len) => sum + len * charWidthMm + cellPadding * 2, 0);

                // 사용 가능한 너비
                const availableWidth = contentWidth;

                // 비율 계산
                const scale = totalTextWidth > availableWidth
                  ? availableWidth / totalTextWidth
                  : 1;

                // 각 컬럼 너비 계산
                extraRow.data.forEach((_item, idx) => {
                  const textLength = textLengths[idx] ?? 0;
                  const baseWidth = textLength * charWidthMm + cellPadding * 2;
                  let width = baseWidth * scale;

                  // 최소/최대 너비 제한
                  width = Math.max(minWidth, Math.min(maxWidth, width));

                  columnStyles[idx] = { cellWidth: width };
                });

                // 전체 너비가 사용 가능한 너비를 초과하는 경우 비율 조정
                const totalWidth = Object.values(columnStyles).reduce((sum, style) => sum + style.cellWidth, 0);
                if (totalWidth > availableWidth) {
                  const adjustScale = availableWidth / totalWidth;
                  Object.keys(columnStyles).forEach((key) => {
                    const idx = parseInt(key);
                    const style = columnStyles[idx];
                    if (style) {
                      style.cellWidth *= adjustScale;
                    }
                  });
                }

                return columnStyles;
              };

              const extraColumnStyles = calculateExtraRowColumnWidths();

              autoTable(doc, {
                head: [extraHeaders],
                body: extraValues,
                startY,
                theme: "grid",
                styles: {
                  font: "NanumGothic",
                  fontStyle: "normal",
                  fontSize: fontSize - 1,
                  cellPadding: 2,
                  halign: "center",
                },
                headStyles: {
                  font: "NanumGothic",
                  fontStyle: "bold",
                  fillColor: hexToRgb(GRID_COLORS.headerBg),
                  textColor: hexToRgb(GRID_COLORS.headerText),
                },
                columnStyles: extraColumnStyles,
                margin: { left: margin, right: margin },
              });

              startY = (doc as any).lastAutoTable?.finalY + 5 || startY + 20;
            }
          });

          startY += 3;
        }

        // 페이지 표시 (컬럼이 분할된 경우)
        if (columnPages.length > 1) {
          doc.setFont("NanumGothic");
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(`컬럼 ${pageIdx + 1} / ${columnPages.length}`, margin, startY + 3);
          doc.setTextColor(0);
          startY += 6;
        }

        // 테이블 헤더
        const tableHeaders = columnGroup.map((h) => h.name);

        // 컬럼 스타일 설정 (너비 및 정렬)
        const columnStyles: Record<number, any> = {};
        columnGroup.forEach((header, index) => {
          const isNumeric = numericColumns.has(header.key);
          columnStyles[index] = {
            halign: isNumeric ? "right" : (header.align || "left"),
            cellWidth: getColumnWidthMm(header),
          };
        });

        // 공통 스타일
        const commonStyles = {
          font: "NanumGothic",
          fontStyle: "normal" as const,
          fontSize,
          cellPadding: 2,
          overflow: "linebreak" as const,
          lineColor: hexToRgb(GRID_COLORS.border),
          lineWidth: 0.1,
        };

        const headStyles = {
          font: "NanumGothic",
          fontStyle: "bold" as const,
          fillColor: hexToRgb(headerBackgroundColor),
          textColor: hexToRgb(headerTextColor),
          halign: "center" as const,
        };

        // Summary를 상단에 배치하는 경우
        if (includeSummary && summaryData && summaryPosition === "top") {
          // 헤더 + Summary 테이블
          autoTable(doc, {
            head: [tableHeaders],
            body: [createSummaryRowData(columnGroup)],
            startY,
            theme: "grid",
            styles: commonStyles,
            headStyles,
            columnStyles,
            bodyStyles: {
              font: "NanumGothic",
              fontStyle: "bold",
              fillColor: hexToRgb(summaryBackgroundColor),
            },
            didParseCell: (cellData) => {
              if (cellData.section === "body") {
                // colSpan이 있는 셀(병합 라벨)은 가운데 정렬
                const cell = cellData.cell;
                if (cell.colSpan && cell.colSpan > 1) {
                  cell.styles.halign = "center";
                }
              }
            },
            margin: { left: margin, right: margin },
          });

          const firstTableEndY = (doc as any).lastAutoTable?.finalY || startY + 20;

          // 헤더 + 데이터 테이블
          autoTable(doc, {
            head: [tableHeaders],
            body: createDataRows(columnGroup),
            startY: firstTableEndY + 3,
            theme: "grid",
            styles: commonStyles,
            headStyles,
            columnStyles,
            bodyStyles: {
              font: "NanumGothic",
              fontStyle: "normal",
              fillColor: hexToRgb(GRID_COLORS.cellBg),
            },
            margin: { left: margin, right: margin },
          });
        } else if (includeSummary && summaryData && summaryPosition === "bottom") {
          // Summary를 하단에 배치하는 경우
          const tableData = createDataRows(columnGroup);
          const summaryRow = createSummaryRowData(columnGroup);

          // 데이터 + Summary를 함께 렌더링
          autoTable(doc, {
            head: [tableHeaders],
            body: [...tableData, summaryRow],
            startY,
            theme: "grid",
            styles: commonStyles,
            headStyles,
            columnStyles,
            bodyStyles: {
              font: "NanumGothic",
              fontStyle: "normal",
              fillColor: hexToRgb(GRID_COLORS.cellBg),
            },
            didParseCell: (cellData) => {
              // Summary 행 스타일 (마지막 행)
              if (cellData.section === "body" && cellData.row.index === tableData.length) {
                cellData.cell.styles.fillColor = hexToRgb(summaryBackgroundColor);
                cellData.cell.styles.fontStyle = "bold";
                // colSpan이 있는 셀(병합 라벨)만 가운데 정렬
                if (cellData.cell.colSpan && cellData.cell.colSpan > 1) {
                  cellData.cell.styles.halign = "center";
                }
              }
            },
            margin: { left: margin, right: margin },
          });
        } else {
          // Summary 없이 데이터만
          autoTable(doc, {
            head: [tableHeaders],
            body: createDataRows(columnGroup),
            startY,
            theme: "grid",
            styles: commonStyles,
            headStyles,
            columnStyles,
            bodyStyles: {
              font: "NanumGothic",
              fontStyle: "normal",
              fillColor: hexToRgb(GRID_COLORS.cellBg),
            },
            margin: { left: margin, right: margin },
          });
        }
      }

      // 페이지 번호 추가
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("NanumGothic");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `${i} / ${pageCount}`,
          pdfWidth / 2,
          pdfHeight - 5,
          { align: "center" }
        );
      }

      // returnBlob 옵션이 true이면 blob 반환, 아니면 파일 다운로드
      if (returnBlob) {
        return doc.output("blob") as Blob;
      } else {
        doc.save(`${fileName}.pdf`);
      }
    } catch (error) {
      console.error("PDF Export error:", error);
      throw error;
    }
  }, [headers, data, summaryData, getNumericColumns]);

  return { exportToExcel, exportToCSV, exportToPdf };
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}