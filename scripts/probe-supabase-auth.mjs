import fs from "node:fs";
import https from "node:https";

const source = fs.readFileSync(new URL("../client/src/lib/supabase.ts", import.meta.url), "utf8");
const url = source.match(/https:\/\/[^"']+\.supabase\.co/)?.[0];
const key = source.match(/const supabaseAnonKey[^\n]*?=\s*[^\n]*?"([^"]+)"\s*;/)?.[1];
if (!url || !key) throw new Error("Could not read Supabase fallback configuration");
const target = new URL("/auth/v1/settings", url);
const request = https.request(target, { method: "GET", headers: { apikey: key, Authorization: `Bearer ${key}` } }, (response) => {
  let body = "";
  response.setEncoding("utf8");
  response.on("data", (chunk) => { body += chunk; });
  response.on("end", () => console.log(JSON.stringify({ url: target.origin, status: response.statusCode, body: body.slice(0, 500) })));
});
request.on("error", (error) => console.log(JSON.stringify({ url: target.origin, error: error.message })));
request.end();
