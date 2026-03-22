import { Render } from "@measured/puck";
import { notFound } from "next/navigation";
import { puckConfig } from "@/lib/puck-config";
import { dataStore } from "@/lib/puck-data";
import { EditButton } from "./edit-button";

type Params = Promise<{ path?: string[] }>;

export default async function PuckPage({ params }: { params: Params }) {
  const { path } = await params;
  const pagePath = path ? `/${path.join("/")}` : "/";
  const data = await dataStore.load(pagePath);

  if (!data) {
    notFound();
  }

  return (
    <>
      <Render config={puckConfig} data={data} />
      <EditButton />
    </>
  );
}
