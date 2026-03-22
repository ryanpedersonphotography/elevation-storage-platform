import * as React from "react";
import { cn } from "../utils";

type SectionProps = React.HTMLAttributes<HTMLElement>;

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, ...props }, ref) => {
    return (
      <section
        className={cn("w-full py-section", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Section.displayName = "Section";

export { Section, type SectionProps };
