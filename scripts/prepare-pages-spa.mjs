import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve("dist");

await copyFile(resolve(distDir, "index.html"), resolve(distDir, "404.html"));
