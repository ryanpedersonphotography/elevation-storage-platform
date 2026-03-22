import type { ComponentConfig } from "@measured/puck";
import { Card, Heading, Text, Button, cn } from "@monorepo/ui";

type Fact = {
  label: string;
  value: string;
};

export type ServiceCardProps = {
  image: string;
  imageAlt: string;
  title: string;
  price: string;
  facts: Fact[];
  ctaText: string;
  ctaLink: string;
  className?: string;
};

export const ServiceCard: ComponentConfig<ServiceCardProps> = {
  fields: {
    image: { type: "text" },
    imageAlt: { type: "text" },
    title: { type: "text" },
    price: { type: "text" },
    facts: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        value: { type: "text" },
      },
    },
    ctaText: { type: "text" },
    ctaLink: { type: "text" },
  },
  defaultProps: {
    image: "",
    imageAlt: "Service image",
    title: "Service Name",
    price: "Starting $99",
    facts: [
      { label: "Duration", value: "2-3 hours" },
      { label: "Type", value: "Mobile" },
    ],
    ctaText: "Book Now",
    ctaLink: "#",
  },
  render: ({ image, imageAlt, title, price, facts, ctaText, ctaLink, className }) => {
    return (
      <Card className={cn("overflow-hidden p-0", className)}>
        {image && (
          <div className="relative aspect-video overflow-hidden">
            <img
              src={image}
              alt={imageAlt}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <Heading level={3} size="md">{title}</Heading>
            <Text size="sm" muted>{price}</Text>
          </div>
          {facts.length > 0 && (
            <div className="mb-4 space-y-1">
              {facts.map((fact, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <Text size="sm" muted>{fact.label}</Text>
                  <Text size="sm">{fact.value}</Text>
                </div>
              ))}
            </div>
          )}
          <Button asChild className="w-full">
            <a href={ctaLink}>{ctaText}</a>
          </Button>
        </div>
      </Card>
    );
  },
};
