import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center rounded-lg font-semibold justify-center whitespace-nowrap ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "text-white bg-brand-600 hover:bg-brand-700",
        "secondary-gray": "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50",
        "secondary-color": "text-brand-700 dark:text-brand-500 bg-white dark:bg-gray-900 border border-brand-300 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-900",
        "tertiary-gray": "text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-50",
        "tertiary-color": "text-brand-700 bg-white  hover:bg-brand-50",
        "link-gray": "text-slate-900 dark:text-gray-300 dark:hover:text-gray-100 hover:text-gray-950 p-0",
        "link-color": "text-brand-700 dark:text-brand-600 hover:text-brand-800 p-0",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
        "destructive-secondary": "bg-white text-red-500 hover:bg-red-50 border border-red-300",
        "destructive-tertiary": "bg-white text-red-500 hover:bg-red-50",
        "destructive-link": "bg-white text-red-500 hover:text-red-600",
        
      },
      size: {
        sm: "py-[8px] px-[12px] text-sm",
        md: "py-[10px] px-[14px]",
        lg: "py-[12px] px-[16px]",
        xl: "py-[12px] px-[18px]",
        "2xl": "py-[16px] px-[24px] text-lg",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      // Overwrite padding for link variants
      {
        variant: "link-color",
        className: "p-0",
      },
      {
        variant: "link-gray",
        className: "p-0",
      }
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        children={isLoading ? "Loading..." : children}
        disabled={disabled || isLoading}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
