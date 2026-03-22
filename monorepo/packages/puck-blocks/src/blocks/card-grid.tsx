import type { ComponentConfig } from "@measured/puck";
import { Container, Card, Heading, Text, cn } from "@monorepo/ui";

type CardItem = {
  title: string;
  description: string;
  image: string;
  link: string;
};

export type CardGridProps = {
  cards: CardItem[];
  columns: 2 | 3 | 4;
  className?: string;
};

export const CardGrid: ComponentConfig<CardGridProps> = {
  fields: {
    cards: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
        image: { type: "text" },
        link: { type: "text" },
      },
    },
    columns: {
      type: "select",
      options: [
        { label: "2 Columns", value: 2 },
        { label: "3 Columns", value: 3 },
        { label: "4 Columns", value: 4 },
      ],
    },
  },
  defaultProps: {
    cards: [
      { title: "Card 1", description: "Description", image: "", link: "#" },
      { title: "Card 2", description: "Description", image: "", link: "#" },
      { title: "Card 3", description: "Description", image: "", link: "#" },
    ],
    columns: 3,
  },
  render: ({ cards, columns, className }) => {
    const colsClass = {
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    }[columns];

    return (
      <Container className={cn("py-8", className)}>
        <div className={cn("grid grid-cols-1 gap-6", colsClass)}>
          {cards.map((card, i) => (
            <Card key={i}>
              {card.image && (
                <img
                  src={card.image}
                  alt={card.title}
                  className="-mx-6 -mt-6 mb-4 h-48 w-[calc(100%+3rem)] rounded-t-lg object-cover"
                />
              )}
              <Heading level={3} size="sm">
                {card.link ? (
                  <a href={card.link} className="hover:underline">
                    {card.title}
                  </a>
                ) : (
                  card.title
                )}
              </Heading>
              <Text muted className="mt-2">
                {card.description}
              </Text>
            </Card>
          ))}
        </div>
      </Container>
    );
  },
};
