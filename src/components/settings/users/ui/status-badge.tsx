import { cn } from "@/lib/utils";
import { UserStatus, UserStatusLabel, UserStatusColor } from "../model";

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
        UserStatusColor[status],
        // border colors often match the text color but lighter, simplified here:
        "border-transparent",
        className
      )}
    >
      {/* Dot indicator */}
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1",
        status === UserStatus.INVITING ? "bg-green-500" :
          status === UserStatus.EXPIRED ? "bg-red-500" :
            status === UserStatus.ACTIVE ? "bg-blue-500" :
              status === UserStatus.SUSPENDED ? "bg-orange-500" :
                "bg-gray-500"
      )} />
      {UserStatusLabel[status]}
    </span>
  );
}
