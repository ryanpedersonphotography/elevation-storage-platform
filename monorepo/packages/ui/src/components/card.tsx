import * as React from "react";
import { cn } from "../utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-background p-6 shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card, type CardProps };
