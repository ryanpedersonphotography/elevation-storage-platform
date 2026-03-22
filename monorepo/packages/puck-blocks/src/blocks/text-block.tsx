import type { ComponentConfig } from "@measured/puck";
import { Container, Text, cn } from "@monorepo/ui";

export type TextBlockProps = {
  content: string;
  alignment: "left" | "center" | "right";
  className?: string;
};

export const TextBlock: ComponentConfig<TextBlockProps> = {
  fields: {
    content: { type: "textarea" },
    alignment: {
      type: "radio",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    content: "Enter your text here.",
    alignment: "left",
  },
  render: ({ content, alignment, className }) => {
    const alignClass = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    }[alignment];

    return (
      <Container className={cn("py-8", alignClass, className)}>
        <Text>{content}</Text>
      </Container>
    );
  },
};
