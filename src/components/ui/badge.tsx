import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        live: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-500/15 dark:text-emerald-100",
        scheduled: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-500/15 dark:text-sky-100",
        "almost-full": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-500/15 dark:text-amber-100",
        full: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-500/15 dark:text-rose-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
