import type { Config } from "@measured/puck";
import { blocks } from "@monorepo/puck-blocks";

export const puckConfig: Config = {
  components: {
    ...blocks,
  },
  root: {
    fields: {
      title: { type: "text" },
      description: { type: "textarea" },
    },
    defaultProps: {
      title: "Page Title",
      description: "",
    },
    render: ({ children, title }) => {
      return (
        <>
          <title>{title}</title>
          <main>{children}</main>
        </>
      );
    },
  },
};
