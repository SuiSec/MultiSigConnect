# Privacy Policy — MultiSig Connect

**Effective date:** 2026-06-28

MultiSig Connect ("the extension") is a read-only Sui multisig wallet connector.
This policy explains exactly what data the extension handles.

## Summary

**The extension does not collect, transmit, sell, or share any personal data.**
It holds no private keys, never signs, and makes no network requests of its own.

## What the extension stores

The only data the extension stores is the list of Sui multisig accounts you choose
to use (their addresses, names, and public keys). This list is:

- **Pushed in by the companion web app** (`https://multisig.suisec.app`) via an
  origin-checked `postMessage` bridge — the extension never fetches it from any server.
- **Stored locally on your own device** using the browser's `storage` API.
- **Never transmitted off your device** by the extension, and never sent to us or any
  third party.

## What the extension does NOT do

- It does **not** collect personally identifiable information, financial data,
  authentication data, location, browsing history, or any analytics.
- It does **not** hold private keys and **never** signs transactions. Signing
  requests from dApps are captured and parked for approval in the companion web app,
  where multisig members sign with their own wallets.
- It does **not** contact any backend, relay, or API on its own. It has no
  `host_permissions` and makes no network requests.
- It does **not** use remote code.

## Permissions

- `storage` — to keep your multisig list on your device.
- `tabs` — to open the companion web app when you ask it to.
- Host access (`<all_urls>`) — to present a read-only wallet to any dApp page you
  visit, the same way standard wallet extensions do. No page data is collected.

## Changes

If this policy changes, the updated version will be published in this repository.

## Contact

dev@suisec.app
