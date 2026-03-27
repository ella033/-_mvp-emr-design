import { cn } from "@/lib/utils";

interface AuthAlertProps {
  message: string;
  variant?: "info" | "error";
  className?: string;
}

export function AuthAlert({ message, variant = "info", className }: AuthAlertProps) {
  const isError = variant === "error";

  return (
    <div
      className={cn(
        "flex gap-[8px] h-[40px] items-center p-3 text-sm rounded-md",
        isError ? "bg-[#FFF0F0] text-[#E54545]" : "bg-blue-50 text-blue-700",
        className
      )}
    >
      {isError ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="10" r="9" stroke="#FF453A" strokeWidth="1.2" />
          <path d="M10 6V10" stroke="#FF453A" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="0.75" fill="#FF453A" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_7576_2648)">
            <path
              d="M4.375 10L8.125 13.5156L15.625 6.48438"
              stroke="#0066FF"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_7576_2648">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>
      )}

      <span className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#46474C]">
        {message}
      </span>
    </div>
  );
}
