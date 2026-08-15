# Eliminator API inventory

The supplied documentation index reports 458 endpoints across 22 categories. The catalog builder extracted 445 unique endpoint paths from the category pages because some documentation entries are duplicated or loaded dynamically.

| Category | Documented count | Website workspace |
|---|---:|---|
| AI | 35 | Generic request workspace with text/JSON inputs |
| AI Music | 25 | Generic request workspace with prompt/task inputs |
| Anime | 21 | Search/media workspace |
| Canvas | 5 | Generic request workspace |
| Downloader | 61 | URL/download workspace |
| Fun | 5 | Generic request workspace |
| Games | 23 | Generic request workspace |
| Image Generation | 7 | Prompt/result workspace |
| Image to Image | 2 | URL/upload-oriented workspace |
| Movies | 1 | Search/result workspace |
| News | 13 | Search/result workspace |
| Random | 6 | One-click result workspace |
| Search | 29 | Query/result workspace |
| Social Boost | 16 | Target/quantity workspace |
| Sports | 10 | Search/result workspace |
| Stalk | 16 | Username/handle workspace |
| Tempmail | 13 | Disposable inbox workspace |
| Temp Numbers | 12 | Number/request workspace |
| Tools | 82 | Generic utility workspace |
| Uploader | 15 | File/URL workspace |
| URL Shortener | 31 | URL workspace |
| XXX | 30 | 18+ gated media/search workspace |

The implementation uses a generated catalog at `client/src/data/apiCatalog.json`, a shared `ToolHub` page at `client/src/pages/ToolHub.tsx`, category filters, endpoint search, generic GET/POST execution, JSON result display, link extraction, copy actions, and an 18+ gate for adult-tagged endpoints. Endpoints vary in parameter requirements, so the workspace exposes common fields plus an additional JSON body area rather than guessing undocumented parameter schemas.
