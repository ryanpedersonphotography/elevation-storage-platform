"use client";

import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck-config";
import type { Data } from "@measured/puck";

export function EditorClient({
  pagePath,
  initialData,
}: {
  pagePath: string;
  initialData: Data | null;
}) {
  const handlePublish = async (data: Data) => {
    await fetch("/api/puck/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pagePath, data }),
    });
    window.location.href = pagePath;
  };

  return (
    <Puck
      config={puckConfig}
      data={initialData ?? { root: { props: { title: "New Page" } }, content: [] }}
      onPublish={handlePublish}
    />
  );
}
