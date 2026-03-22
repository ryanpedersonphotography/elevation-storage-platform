import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const containerVariants = cva("mx-auto w-full px-container", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

type ContainerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof containerVariants>;

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        className={cn(containerVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

export { Container, containerVariants, type ContainerProps };
