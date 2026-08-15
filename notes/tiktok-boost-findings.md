# TikTok Boost endpoint findings

Source: https://apis.davidcyril.name.ng/endpoints/socialboost/#tiktok-boost

Endpoint: `GET https://apis.davidcyril.name.ng/api/tiktok/boost`

Required parameter: `url`, documented as a TikTok video URL. Optional parameter: `type`, with `video_views` (default), `like`, or `followers`. The documentation says `video_views` and `like` use a video URL; `followers` uses a profile URL or @username.

The example request with `type=video_views` returned JSON with `creator`, `success: false`, and a cooldown message: `Please wait. You can use this service for '7309665333272778030' again in approximately 13 minute(s) and 0 second(s).` The UI must render this exact response/status and must not claim a boost succeeded when `success` is false.

Implementation note: the Premium workspace should clearly disclose that results and availability are controlled by the third-party API and that users must use the tool only for accounts/content they own or are authorized to manage and in compliance with TikTok rules. No fake success state or fabricated metrics should be added.
