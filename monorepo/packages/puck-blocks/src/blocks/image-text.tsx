import type { ComponentConfig } from "@measured/puck";
import { Container, Text, cn } from "@monorepo/ui";

export type ImageTextProps = {
  image: string;
  imageAlt: string;
  text: string;
  direction: "left" | "right";
  className?: string;
};

export const ImageText: ComponentConfig<ImageTextProps> = {
  fields: {
    image: { type: "text" },
    imageAlt: { type: "text" },
    text: { type: "textarea" },
    direction: {
      type: "radio",
      options: [
        { label: "Image Left", value: "left" },
        { label: "Image Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    image: "",
    imageAlt: "",
    text: "Describe your image here.",
    direction: "left",
  },
  render: ({ image, imageAlt, text, direction, className }) => {
    return (
      <Container
        className={cn(
          "grid grid-cols-1 items-center gap-8 py-8 md:grid-cols-2",
          className
        )}
      >
        <div className={direction === "right" ? "order-2" : ""}>
          {image ? (
            <img
              src={image}
              alt={imageAlt}
              className="h-auto w-full rounded-lg"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
              <Text muted>Image placeholder</Text>
            </div>
          )}
        </div>
        <div className={direction === "right" ? "order-1" : ""}>
          <Text>{text}</Text>
        </div>
      </Container>
    );
  },
};
