const requests = [
  ["llama", "https://apis.davidcyril.name.ng/llama-4-scout?prompt=Create%20a%20minimal%20mobile%20landing%20page"],
  ["clone", "https://api.azbry.com/api/tools/webclone?url=https%3A%2F%2Fexample.com"],
];
for (const [name, url] of requests) {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await response.text();
    console.log(JSON.stringify({ name, status: response.status, ok: response.ok, contentType: response.headers.get("content-type"), body: text.slice(0, 5000) }));
  } catch (error) {
    console.log(JSON.stringify({ name, error: error instanceof Error ? error.message : String(error) }));
  }
}
