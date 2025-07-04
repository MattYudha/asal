// src/components/ui/skeleton.tsx
import { cn } from "../../lib/utils"; // Pastikan path ini benar

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
