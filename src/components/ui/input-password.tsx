import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface InputPasswordProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  className?: string;
}

function InputPassword({ className, ...props }: InputPasswordProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        onClick={togglePasswordVisibility}
      >
        {showPassword ? (
          <img
            src="/icon/ic_line_password-on.svg"
            alt="비밀번호 숨기기"
            width="16"
            height="17"
          />
        ) : (
          <img
            src="/icon/ic_line_password-off.svg"
            alt="비밀번호 보기"
            width="16"
            height="17"
          />
        )}
      </button>
    </div>
  );
}

export { InputPassword };
