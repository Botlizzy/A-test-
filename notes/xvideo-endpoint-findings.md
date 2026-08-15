# XVideo endpoint findings

Source: https://apis.davidcyril.name.ng/endpoints/xxx/#xvideo

The documentation identifies the endpoint as `https://apis.davidcyril.name.ng/xvideo` with a required `url` query parameter described as a full Xvideos video URL. The endpoint documentation marks the response as JSON / Xvideo / Video and includes an 18+ warning. It does not state in its visible content which JSON property contains a direct MP4 or HLS stream; live responses must be inspected before changing any parser.
