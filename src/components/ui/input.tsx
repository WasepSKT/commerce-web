import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const isDate = type === 'date';
    return (
      <input
        type={type}
        className={cn(
          // responsive height and text sizing; preserve file input styles
          "flex h-10 md:h-11 w-full rounded-md border-2 border-primary bg-background px-3 py-2 text-sm md:text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
          // allow native controls (calendar) to show and make date inputs show pointer
          isDate && "appearance-auto cursor-pointer",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
