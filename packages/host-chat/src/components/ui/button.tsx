import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950/20 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-white/20",
  {
    variants: {
      variant: {
        default:
          "border border-gray-200 bg-transparent hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5",
        destructive:
          "text-red-600 hover:underline dark:text-red-400",
        outline:
          "border border-gray-200 bg-transparent hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10",
        ghost: "hover:bg-gray-50 dark:hover:bg-white/5",
        link: "text-gray-500 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100",
      },
      size: {
        default: "px-2.5 py-1.5",
        sm: "px-2.5 py-1",
        xs: "px-2 py-0.5 text-xs",
        lg: "px-3 py-2",
        icon: "h-8 w-8",
      },
    },
    compoundVariants: [

    ],
    defaultVariants: {
      variant: "default",
      size: "default",
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
        className={cn(buttonVariants({ variant, size }), className)}
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
