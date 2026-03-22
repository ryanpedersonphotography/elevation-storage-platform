import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const textVariants = cva("font-sans", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    muted: {
      true: "text-muted-foreground",
      false: "text-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    muted: false,
  },
});

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants>;

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, muted, ...props }, ref) => {
    return (
      <p
        className={cn(textVariants({ size, muted, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, textVariants, type TextProps };
