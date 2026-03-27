import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Hangul from "hangul-js";

export function getChosung(str: string) {
  return (
    typeof Hangul !== "undefined"
      ? Hangul.disassemble(str, true)
      : str.split("")
  )
    .map((jamo: any) => (Array.isArray(jamo) ? jamo[0] : jamo))
    .join("");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
