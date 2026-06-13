import * as React from "react"
import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                secondary:
                    "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
                destructive:
                    "border-red-200 bg-red-100 text-red-700 hover:bg-red-200 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
                success:
                    "border-green-200 bg-green-100 text-green-700 hover:bg-green-200 dark:border-green-900 dark:bg-green-950 dark:text-green-400",
                outline: "border-gray-300 text-foreground hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {
}

function Badge({className, variant, ...props}: BadgeProps) {
    return (
        <div className={cn(badgeVariants({variant}), className)} {...props} />
    )
}

export {Badge, badgeVariants}
