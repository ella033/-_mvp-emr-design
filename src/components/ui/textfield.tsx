import * as React from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends React.ComponentProps<"input"> {
  description?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  placeholder?: string;
}

const TextField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>(
  (
    {
      description,
      error,
      disabled,
      className,
      inputClassName,
      id,
      multiline,
      rows = 3,
      maxRows,
      placeholder,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const sharedProps = {
      id: inputId,
      ref,
      "aria-invalid": !!error,
      "aria-describedby": description ? `${inputId}-desc` : undefined,
      disabled,
      placeholder,
      className: cn(
        "w-full px-0 py-1 text-base outline-none bg-transparent border-0 border-b border-b-input focus:border-b-ring focus:ring-0 focus:shadow-none placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        error && "border-b-destructive focus:border-b-destructive",
        inputClassName
      ),
      ...props,
    };
    return (
      <div className={cn("flex flex-col gap-1 w-full", className)}>
        {multiline ? (
          <textarea
            rows={rows}
            style={
              maxRows
                ? { maxHeight: `calc(${rows} * 1.5em)`, resize: "vertical" }
                : undefined
            }
            {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            type="text"
            {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {description && (
          <div
            id={`${inputId}-desc`}
            className="text-xs text-muted-foreground mt-0.5"
          >
            {description}
          </div>
        )}
        {error && (
          <div className="text-xs text-destructive mt-0.5">{error}</div>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";

export { TextField };
