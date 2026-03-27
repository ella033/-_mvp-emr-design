"use client";

interface ChartCheckSelfDetailSectionProps {
  details: Record<string, unknown>[];
}

/** 자체점검 상세내역을 key-value 테이블로 렌더링 */
export function ChartCheckSelfDetailSection({
  details,
}: ChartCheckSelfDetailSectionProps) {
  if (details.length === 0) {
    return (
      <div className="px-3 py-2 text-[12px] text-[var(--gray-300)]">
        상세 내역이 없습니다.
      </div>
    );
  }

  // 모든 항목에서 사용된 키를 순서대로 수집 (아이디 제외)
  const keys = Array.from(
    new Set(details.flatMap((d) => Object.keys(d))),
  ).filter((k) => k !== "아이디");

  return (
    <div className="px-3 py-2 my-scroll">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-[var(--bg-tertiary)]">
            {keys.map((key) => (
              <th
                key={key}
                className="text-left px-2 py-1 border border-[var(--border-primary)] text-[var(--gray-400)] font-[500] whitespace-nowrap"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {details.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {keys.map((key) => (
                <td
                  key={key}
                  className="px-2 py-1 border border-[var(--border-primary)] text-[var(--gray-200)] whitespace-nowrap"
                >
                  {formatValue(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 값을 표시용 문자열로 변환 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Y" : "N";
  if (Array.isArray(value)) {
    return value.length === 0 ? "-" : JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
