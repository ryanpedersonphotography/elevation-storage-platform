import type { ComponentConfig } from "@measured/puck";
import { cn } from "@monorepo/ui";

export type SpacerProps = {
  height: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export const Spacer: ComponentConfig<SpacerProps> = {
  fields: {
    height: {
      type: "select",
      options: [
        { label: "Small (2rem)", value: "sm" },
        { label: "Medium (4rem)", value: "md" },
        { label: "Large (6rem)", value: "lg" },
        { label: "Extra Large (8rem)", value: "xl" },
      ],
    },
  },
  defaultProps: {
    height: "md",
  },
  render: ({ height, className }) => {
    const heightClass = {
      sm: "h-8",
      md: "h-16",
      lg: "h-24",
      xl: "h-32",
    }[height];

    return <div className={cn(heightClass, className)} aria-hidden="true" />;
  },
};
