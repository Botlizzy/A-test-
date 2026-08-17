# Live API contract findings

- LLAMA 4 SCOUT route: `https://apis.davidcyril.name.ng/llama-4-scout?prompt=...`
- Live response: HTTP 200, `content-type: application/json; charset=utf-8`, object fields `creator`, `success: true`, `model: "llama-4-scout"`, and `data` containing the generated answer as a Markdown string with fenced HTML/CSS/JavaScript.
- Web Cloner route: `https://api.azbry.com/api/tools/webclone?url=https%3A%2F%2Fexample.com`
- Live response: HTTP 200, `content-type: application/json; charset=utf-8`, object fields `creator`, `source`, `status: true`, and `result.url`/`result.filename` pointing to an HTTPS ZIP download.
- The application must keep text-first parsing and never call `response.json()` directly for the Web Cloner response. Empty, malformed, HTML, and non-object responses must become concise actionable errors.
