import type { MyGridHeaderType } from "./my-grid-type";
import { getHeaderDefaultWidth } from "./my-grid-util";

export default function MyGridRowSkeleton({
  headers,
  size,
  start,
}: {
  index: number;
  headers: MyGridHeaderType[];
  size: number;
  start: number;
}) {
  const width = headers.reduce(
    (acc, header) => acc + (header.width ?? getHeaderDefaultWidth(header.name)),
    0
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: width,
        height: `${size}px`,
        transform: `translateY(${start}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--grid-bg)",
      }}
    >
      <div className="flex items-center justify-center w-full h-full bg-[var(--grid-bg)] p-[6px]">
        <div className="animate-pulse bg-[var(--grid-skeleton-bg)] w-full h-full"></div>
      </div>
    </div>
  );
}
