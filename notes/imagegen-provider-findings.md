# Image-generation provider findings

Sources:
- Writecream documentation: https://apis.davidcyril.name.ng/endpoints/imagegen/#writecream-image
- Animagine documentation: https://apis.davidcyril.name.ng/endpoints/imagegen/#animagine

Writecream Image uses GET `https://apis.davidcyril.name.ng/ai/writecream/image` with required `prompt` and optional `ratio`. Documented ratio choices are `1:1`, `16:9`, `9:16`, `4:3`, and `3:4`. The documentation labels the result as an image-generated response and shows an example URL with `prompt`.

Animagine uses GET `https://apis.davidcyril.name.ng/animagine` with required `prompt`. The documentation labels it JSON Response / Anime / AI and shows an example URL with a prompt such as `beautiful anime girl, cherry blossoms, sunset, detailed, 4k`.

Implementation requirement: responses may be direct image responses or JSON containing an image URL/data field. The UI must normalize both forms, show preview/download only for an actual image result, and show readable errors for empty, non-JSON, or provider error responses.
