# YouTube Boost 4 endpoint findings

Source: https://apis.davidcyril.name.ng/endpoints/socialboost/#youtube-boost-4

Endpoint: `GET https://apis.davidcyril.name.ng/api/youtube/boost4`

Required parameter: `url`, documented as a YouTube video URL for views/likes or a channel URL for subscribers. Optional parameter: `type`, with `views` (default), `likes`, or `subscribers`.

The example request using `type=views` returned:

```json
{
  "creator": "David Cyril",
  "success": true,
  "type": "views",
  "amount": 100,
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "message": "Please wait for the countdown to finish for the sending to begin."
}
```

The Premium workspace should show the exact returned amount, type, URL, message, and JSON. It should state that `success: true` means the API accepted the request, not that YouTube metrics have already changed. Users should only submit channels/videos they own or are authorized to manage and comply with YouTube rules.
