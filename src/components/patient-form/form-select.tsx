import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormSelectProps {
  label: string;
  placeholder: string;
  value: string | number;
  onValueChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}

// 재사용 가능한 Select + Label 컴포넌트
export function FormSelect({
  label,
  placeholder,
  value,
  onValueChange,
  items,
  className = "",
  open,
  onOpenChange,
  disabled = false,
}: FormSelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span>{label}</span>
      <Select
        value={String(value)}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={onOpenChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={placeholder}
            className={value ? "text-[#333]" : "text-[#999]"}
          />
        </SelectTrigger>
        <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-full">
          <SelectGroup>
            {items.map((item, index) => {
              // item이 객체가 아닌 경우를 대비한 안전장치
              const safeItem = typeof item === 'object' && item !== null ? item : { value: String(item), label: String(item) };
              const key = safeItem.value !== undefined ? String(safeItem.value) : `item-${index}`;

              return (
                <SelectItem key={key} value={String(safeItem.value)}>
                  {safeItem.label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
