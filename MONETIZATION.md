# Eliminator monetization

The current page includes a visible **Monetization Ready** placement below the player. It is intentionally a non-fake placeholder: no ad network is loaded and no invented sponsored content is shown.

## Display advertising

After the site is approved by an ad network such as Google AdSense, add the public publisher/client ID to the production environment and replace the placeholder with the provider’s official ad unit code. Do not place ad code inside the current player controls, age gate, or any misleading play button area.

## Direct sponsorships

The existing red monetization CTA opens an email to `elijahchinecheremonah@gmail.com`. It can be replaced with a sponsor landing page or a dedicated sponsor inquiry form when the platform has an approved partner.

## Paid access

A paid membership flow can be added with Stripe or another supported processor. That requires a clear pricing page, terms, refund policy, and a server-side payment integration; payment secrets must never be exposed in browser code.

## Playback requirement

The current video API returns metadata and a source page URL, not a direct MP4 or HLS stream. The player now supports in-site playback automatically when a future response includes a direct stream field such as `videoUrl`, `mp4`, `m3u8`, or `playback_url`. Until then, the site correctly shows the metadata and an in-site “direct stream not provided” state rather than silently redirecting viewers.
