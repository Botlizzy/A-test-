Text2Speech V3 documentation verification, 2026-08-16:

The provider page classifies Text2Speech V3 as an Audio Response / TTS / Speech endpoint. The expanded panel visibly documents these parameters: `text` (text to convert to speech), `voice` (speech voice name), `pitch` (pitch level), and `rate` (speech rate). The local API catalog maps the endpoint to GET/POST `/tools/speechma`. The Premium implementation currently sends `text`, optional `voice`, and optional language as `lang`; pitch/rate controls should be added in a follow-up if the provider accepts those fields.
