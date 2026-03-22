import type { Data } from "@measured/puck";
import fs from "node:fs/promises";
import path from "node:path";

export interface PuckDataStore {
  load(pagePath: string): Promise<Data | null>;
  save(pagePath: string, data: Data): Promise<void>;
}

const CONTENT_DIR = path.join(process.cwd(), "content");

function getFilePath(pagePath: string): string {
  const normalized = pagePath === "/" || pagePath === "" ? "index" : pagePath.replace(/^\//, "").replace(/\//g, "-");
  return path.join(CONTENT_DIR, `${normalized}.json`);
}

export const fileStore: PuckDataStore = {
  async load(pagePath) {
    const filePath = getFilePath(pagePath);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as Data;
    } catch {
      return null;
    }
  },

  async save(pagePath, data) {
    const filePath = getFilePath(pagePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  },
};

export const dataStore: PuckDataStore = fileStore;
