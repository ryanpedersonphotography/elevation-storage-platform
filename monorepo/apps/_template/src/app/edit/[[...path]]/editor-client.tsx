"use client";

import dynamic from "next/dynamic";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck-config";
import type { Data } from "@measured/puck";

const Puck = dynamic(
  () => import("@measured/puck").then((mod) => mod.Puck),
  { ssr: false, loading: () => <div className="flex h-screen items-center justify-center">Loading editor...</div> }
);

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
