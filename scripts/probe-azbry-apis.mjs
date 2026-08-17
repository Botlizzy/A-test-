const requests = [
  ["webclone", "https://api.azbry.com/api/tools/webclone?url=https%3A%2F%2Fexample.com"],
  ["aicoder", "https://api.azbry.com/api/tools/aicoder?prompt=Create%20a%20minimal%20landing%20page%20with%20HTML%20and%20CSS"],
  ["lyricsgen", "https://api.azbry.com/api/ai/lyricsgen?theme=hope%20after%20rain&genre=pop&emotion=hopeful&lang=en"],
];
for (const [name, url] of requests) {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await response.text();
    console.log(JSON.stringify({ name, status: response.status, ok: response.ok, contentType: response.headers.get("content-type"), body: text.slice(0, 4000) }));
  } catch (error) {
    console.log(JSON.stringify({ name, error: error instanceof Error ? error.message : String(error) }));
  }
}
