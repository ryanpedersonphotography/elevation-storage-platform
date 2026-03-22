import type { ComponentConfig } from "@measured/puck";
import { Section, Container, Heading, Text, Button, cn } from "@monorepo/ui";

export type CallToActionProps = {
  heading: string;
  text: string;
  buttonText: string;
  buttonLink: string;
  variant: "default" | "accent";
  className?: string;
};

export const CallToAction: ComponentConfig<CallToActionProps> = {
  fields: {
    heading: { type: "text" },
    text: { type: "textarea" },
    buttonText: { type: "text" },
    buttonLink: { type: "text" },
    variant: {
      type: "radio",
      options: [
        { label: "Default", value: "default" },
        { label: "Accent", value: "accent" },
      ],
    },
  },
  defaultProps: {
    heading: "Ready to get started?",
    text: "Contact us today.",
    buttonText: "Get in Touch",
    buttonLink: "#",
    variant: "default",
  },
  render: ({ heading, text, buttonText, buttonLink, variant, className }) => {
    return (
      <Section
        className={cn(
          variant === "accent" ? "bg-accent text-accent-foreground" : "bg-muted",
          className
        )}
      >
        <Container className="text-center">
          <Heading level={2}>{heading}</Heading>
          <Text className="mt-4" muted={variant !== "accent"}>
            {text}
          </Text>
          <div className="mt-8">
            <Button
              variant={variant === "accent" ? "outline" : "primary"}
              asChild
            >
              <a href={buttonLink}>{buttonText}</a>
            </Button>
          </div>
        </Container>
      </Section>
    );
  },
};
