import * as React from "react"
import { cn } from "@/lib/utils"

const checkboxStyles = `
  input[type="checkbox"].custom-checkbox {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    width: 1rem !important;
    height: 1rem !important;
    border: 2px solid #d1d5db !important;
    border-radius: 0.25rem !important;
    cursor: pointer;
    position: relative;
    background-color: transparent !important;
  }

  input[type="checkbox"].custom-checkbox:checked {
    background-color: var(--main-color) !important;
    border-color: var(--main-color) !important;
  }

  input[type="checkbox"].custom-checkbox::after {
    content: '' !important;
    color: initial !important;
    font-size: initial !important;
    font-weight: initial !important;
    display: block;
    position: absolute;
    left: 2.7px;
    top: 0px;
    width: 4.5px;
    height: 8px;
    border: solid var(--bg-main);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity 0.2s;
  }

  input[type="checkbox"].custom-checkbox:checked::after {
    opacity: 1 !important;
  }

  input[type="checkbox"].custom-checkbox:hover {
    border-color: var(--main-color-hover) !important;
  }

  input[type="checkbox"].custom-checkbox:disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
`

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const isCheckboxOrRadio = type === "checkbox" || type === "radio"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: checkboxStyles }} />

      <input
        type={type}
        data-slot="input"
        className={cn(
          !isCheckboxOrRadio && [
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-2 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          ],
          type === "radio" && [
            "appearance-none w-4 h-4 rounded-full border-1 border-[var(--border-2)] cursor-pointer",
            "checked:border-2 bg-[var(--bg-main)] checked:border-[var(--main-color)]",
            "checked:shadow-[inset_0_0_0_2px_var(--main-color)]",
            "hover:border-[var(--main-color-hover)] focus:outline-none focus:ring-offset-2 focus:ring-[var(--bg-main)]"
          ],
          type === "checkbox" && "custom-checkbox",
          !isCheckboxOrRadio && className
        )}
        {...props}
      />
    </>
  )
}

export { Input }