import { cn } from "@/lib/utils";

export default function MyBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-[var(--input-border)] px-[12px] py-[3px] rounded-sm flex flex-row gap-2 items-center",
        className
      )}
    >
      {children}
    </div>
  );
}
