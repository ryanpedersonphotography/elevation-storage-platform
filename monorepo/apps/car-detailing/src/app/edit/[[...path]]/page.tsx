import { EditorClient } from "./editor-client";
import { dataStore } from "@/lib/puck-data";

type Params = Promise<{ path?: string[] }>;

export default async function EditPage({ params }: { params: Params }) {
  const { path } = await params;
  const pagePath = path ? `/${path.join("/")}` : "/";
  const data = await dataStore.load(pagePath);
  return <EditorClient pagePath={pagePath} initialData={data} />;
}
