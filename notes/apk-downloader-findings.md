# APK Downloader endpoint findings

Source: https://apis.davidcyril.name.ng/endpoints/download/

Endpoint: `GET/POST https://apis.davidcyril.name.ng/download/apk`

Required parameter: `text`, described as an app name to search and download an APK. Example: `text=whatsapp`.

Live example response:

```json
{
  "status": true,
  "owner": "@DavidCyrilTech",
  "apk": {
    "name": "WhatsApp Messenger",
    "lastUpdated": "2.26.32.6",
    "package": "com.whatsapp",
    "icon": "https://pool.img.aptoide.com/gamesandapps0/27d8f9ef7935216a2c8fddfa54a32901_icon.png",
    "downloadLink": "https://pool.apk.aptoide.com/gamesandapps0/com-whatsapp-263200606-76076543-43bcae5a3b7a77d38cb3c1f493561f9b.apk"
  }
}
```

The Premium workspace should show the app icon, name, package, last-updated value, exact returned status, and a direct `Download APK` link only when `apk.downloadLink` is present. It should warn users to verify APK sources and permissions before installation; the API result must not be presented as a security guarantee.
