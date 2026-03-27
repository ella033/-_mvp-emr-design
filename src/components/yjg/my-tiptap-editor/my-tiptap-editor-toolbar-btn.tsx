import { cn } from "@/lib/utils";
import { MyTooltip } from "../my-tooltip";

export default function MyTiptapEditorToolbarBtn({
  isActive,
  icon,
  onClick,
  title,
  tooltip,
}: {
  isActive: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
  title: string;
  tooltip?: string;
}) {
  return (
    <MyTooltip
      side="top"
      align="center"
      delayDuration={500}
      content={
        <div className="flex flex-col gap-2 p-1">
          <div className="text-sm font-semibold text-center">{title}</div>
          {tooltip && <div className="text-xs text-center">{tooltip}</div>}
        </div>
      }
    >
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left text-xs hover:bg-[var(--bg-tertiary)] rounded-sm px-2 py-1 whitespace-nowrap flex items-center gap-2",
          isActive && "text-blue-500"
        )}
      >
        {icon ? icon : title}
      </button>
    </MyTooltip>
  );
}
