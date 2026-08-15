import fs from "node:fs";
const catalog = JSON.parse(fs.readFileSync(new URL("../client/src/data/apiCatalog.json", import.meta.url), "utf8"));
const families = new Set(["download", "search", "ai", "imagegen", "imageToImage", "tools", "random", "xxx"]);
for (const item of catalog.endpoints) {
  if (families.has(item.category)) console.log(JSON.stringify(item));
}
