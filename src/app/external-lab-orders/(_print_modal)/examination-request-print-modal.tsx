"use client";

import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToastHelpers } from "@/components/ui/toast";
import type { ExternalLabOrder } from "@/services/lab-orders-service";
import { useHospitalStore } from "@/store/hospital-store";
import PrintSettings from "./examination-request-print-settings";
import PrintToolbar from "./examination-request-print-toolbar";
import PrintPreview from "./examination-request-print-preview";
import { ExaminationRequestPrintablePages } from "./generate-examination-request-pdf-printable";

interface ExaminationRequestPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printPagesByLab: Array<{
    labName: string;
    orders: ExternalLabOrder[];
  }>;
  treatmentDate: string;
}

export default function ExaminationRequestPrintModal({
  open,
  onOpenChange,
  printPagesByLab,
  treatmentDate,
}: ExaminationRequestPrintModalProps) {
  const [selectedPrinter, setSelectedPrinter] = useState("예약실 선택");
  const [printRange, setPrintRange] = useState("전체");
  const [printRangeInput, setPrintRangeInput] = useState("");
  const [copies, setCopies] = useState(1);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState("100%");
  
  const toastHelpers = useToastHelpers();
  const { hospital } = useHospitalStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const labPageCountsRef = useRef<Map<string, number>>(new Map());

  const handleLabPageCountChange = useCallback((labName: string, count: number) => {
    labPageCountsRef.current.set(labName, count);

    let total = 0;
    labPageCountsRef.current.forEach((pageCount) => {
      total += pageCount;
    });
    setTotalPages(total);
  }, []);

  const scrollToPage = (pageNumber: number) => {
    if (!scrollContainerRef.current) return;
    
    const pages = scrollContainerRef.current.querySelectorAll(".printable-page");
    const targetPage = pages[pageNumber - 1] as HTMLElement;
    
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToPage(page);
  };

  const handlePrint = () => {
    if (totalPages === 0) {
      toastHelpers.error("출력할 데이터가 없습니다.");
      return;
    }

    window.print();
  };

  const hasData = printPagesByLab.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-w-[95vw] w-full max-h-[90vh] p-0 gap-0 overflow-hidden [&>button]:hidden !flex !flex-col">
        <DialogTitle className="sr-only">의뢰서 출력</DialogTitle>
        
        <div className="flex flex-col flex-1 min-h-0 bg-white overflow-hidden">
          
          <div data-print-hide className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-semibold text-[#292A2D]">의뢰서 출력</h2>
              <span className="text-[12px] text-[#6B7280]">
                {`총 ${totalPages}페이지`}
              </span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="#46474C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            
            <div data-print-hide>
              <PrintSettings
                selectedPrinter={selectedPrinter}
                onPrinterChange={setSelectedPrinter}
                printRange={printRange}
                onPrintRangeChange={setPrintRange}
                printRangeInput={printRangeInput}
                onPrintRangeInputChange={setPrintRangeInput}
                copies={copies}
                onCopiesChange={setCopies}
              />
            </div>

            <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
              
              <PrintToolbar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onPrint={handlePrint}
                isRendering={false}
              />

              <PrintPreview
                scrollContainerRef={scrollContainerRef}
                zoomLevel={zoomLevel}
                totalPages={totalPages}
              >
                {hasData && (
                  <ExaminationRequestPrintablePages
                    labsData={printPagesByLab}
                    treatmentDate={treatmentDate}
                    hospitalName={hospital?.name}
                    hospitalCode={hospital?.number}
                    onPageCountChange={handleLabPageCountChange}
                  />
                )}
              </PrintPreview>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
