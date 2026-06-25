import * as React from "react"
import { cn } from "@/lib/utils"

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  countryCode?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, countryCode = '+91', ...props }, ref) => {
    // Strip the country code for display if it's there
    const displayValue = value.startsWith(countryCode)
      ? value.slice(countryCode.length)
      : value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value.replace(/\D/g, ''); // Keep only digits
      if (rawValue.length > 10) rawValue = rawValue.slice(0, 10); // Max 10 digits
      
      // Pass the full E.164 formatted string to the parent
      if (onChange) {
        onChange(rawValue ? `${countryCode}${rawValue}` : '');
      }
    };

    return (
      <div className={cn(
        "flex items-center h-9 w-full rounded-lg border border-input bg-transparent text-base shadow-sm transition-all duration-200 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20 hover:border-ring/50 overflow-hidden",
        props.disabled && "cursor-not-allowed bg-input/50 opacity-50",
        className
      )}>
        <div className="flex h-full items-center justify-center bg-muted/50 px-3 text-muted-foreground border-r border-input select-none font-medium text-sm">
          {countryCode}
        </div>
        <input
          type="tel"
          className="flex-1 h-full bg-transparent px-3 py-1.5 outline-none placeholder:text-muted-foreground md:text-sm"
          value={displayValue}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
