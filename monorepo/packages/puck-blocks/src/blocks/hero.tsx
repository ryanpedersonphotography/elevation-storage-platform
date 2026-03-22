import type { ComponentConfig } from "@measured/puck";
import { Container, Heading, Text, Button, Section, cn } from "@monorepo/ui";

export type HeroProps = {
  heading: string;
  subheading: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  alignment: "left" | "center" | "right";
  className?: string;
};

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    buttonText: { type: "text" },
    buttonLink: { type: "text" },
    backgroundImage: { type: "text" },
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
    heading: "Welcome",
    subheading: "",
    buttonText: "Learn More",
    buttonLink: "#",
    backgroundImage: "",
    alignment: "center",
  },
  render: ({
    heading,
    subheading,
    buttonText,
    buttonLink,
    backgroundImage,
    alignment,
    className,
  }) => {
    const alignClass = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    }[alignment];

    return (
      <Section
        className={cn("relative", className)}
        style={
          backgroundImage
            ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <Container className={alignClass}>
          <Heading level={1}>{heading}</Heading>
          {subheading && (
            <Text size="lg" muted className="mt-4">
              {subheading}
            </Text>
          )}
          {buttonText && (
            <div className="mt-8">
              <Button asChild>
                <a href={buttonLink}>{buttonText}</a>
              </Button>
            </div>
          )}
        </Container>
      </Section>
    );
  },
};
