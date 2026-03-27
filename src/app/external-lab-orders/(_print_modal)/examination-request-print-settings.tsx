"use client";

interface PrintSettingsProps {
  selectedPrinter: string;
  onPrinterChange: (printer: string) => void;
  printRange: string;
  onPrintRangeChange: (range: string) => void;
  printRangeInput: string;
  onPrintRangeInputChange: (input: string) => void;
  copies: number;
  onCopiesChange: (copies: number) => void;
}

export default function PrintSettings({
  selectedPrinter,
  onPrinterChange,
  printRange,
  onPrintRangeChange,
  printRangeInput,
  onPrintRangeInputChange,
  copies,
  onCopiesChange,
}: PrintSettingsProps) {
  return (
    <div className="w-[320px] flex-shrink-0 border-r border-gray-200 bg-[#FAFAFA] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 프린터 선택 */}
        <div>
          <label className="block text-[13px] font-medium text-[#292A2D] mb-2">프린터</label>
          <div className="relative">
            <select
              value={selectedPrinter}
              onChange={(e) => onPrinterChange(e.target.value)}
              className="w-full h-8 px-3 bg-white rounded-md border border-gray-300 text-[13px] text-[#46474C] focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="예약실 선택">예약실 선택</option>
              <option value="프린터 1">프린터 1</option>
              <option value="프린터 2">프린터 2</option>
            </select>
          </div>
        </div>

        {/* 출력 범위 */}
        <div>
          <label className="block text-[13px] font-medium text-[#292A2D] mb-2">출력범위</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={printRange}
                onChange={(e) => onPrintRangeChange(e.target.value)}
                className="w-full h-8 px-3 bg-white rounded-md border border-gray-300 text-[13px] text-[#46474C] focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="전체">전체</option>
                <option value="범위">범위</option>
              </select>
            </div>
            {printRange === "범위" && (
              <input
                type="text"
                value={printRangeInput}
                onChange={(e) => onPrintRangeInputChange(e.target.value)}
                placeholder="예: 1-5"
                className="flex-1 h-8 px-3 bg-white rounded-md border border-gray-300 text-[13px] text-[#46474C] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            )}
          </div>
        </div>

        {/* 매수 */}
        <div>
          <label className="block text-[13px] font-medium text-[#292A2D] mb-2">매수</label>
          <div className="relative">
            <input
              type="number"
              value={copies}
              onChange={(e) => onCopiesChange(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full h-8 px-3 bg-white rounded-md border border-gray-300 text-[13px] text-[#46474C] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

