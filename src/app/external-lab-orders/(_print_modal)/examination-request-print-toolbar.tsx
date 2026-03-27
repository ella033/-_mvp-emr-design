"use client";

interface PrintToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoomLevel: string;
  onZoomChange: (zoom: string) => void;
  onPrint: () => void;
  isRendering: boolean;
}

export default function PrintToolbar({
  currentPage,
  totalPages,
  onPageChange,
  zoomLevel,
  onZoomChange,
  onPrint,
  isRendering,
}: PrintToolbarProps) {
  const handlePrevPage = () => {
    const next = Math.max(1, currentPage - 1);
    onPageChange(next);
  };

  const handleNextPage = () => {
    const next = Math.min(totalPages, currentPage + 1);
    onPageChange(next);
  };

  return (
    <div data-print-hide className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* 페이지 이동 버튼 */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1 || isRendering}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          &lt;
        </button>
        <span className="text-[13px] text-[#46474C] min-w-[60px] text-center">
          {totalPages > 0 ? `${currentPage} / ${totalPages}` : "- / -"}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages || isRendering}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          &gt;
        </button>

        {/* 줌 컨트롤 */}
        <div className="relative ml-2">
          <select
            value={zoomLevel}
            onChange={(e) => onZoomChange(e.target.value)}
            className="w-24 h-8 px-2 bg-white rounded-md border border-gray-300 text-[13px] text-[#46474C] focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
            <option value="125%">125%</option>
            <option value="150%">150%</option>
          </select>
        </div>
      </div>

      <button
        onClick={onPrint}
        disabled={isRendering || totalPages === 0}
        className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-[13px] font-medium"
      >
        출력
      </button>
    </div>
  );
}

