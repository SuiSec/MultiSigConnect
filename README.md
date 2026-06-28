# MultiSig Connect

A browser extension that presents a **Sui multisig** as a **read-only wallet** to
any dApp, and routes captured transactions to multisig approval in the web app.

> **Holds no keys. Never signs.** Every signing request from a dApp is captured
> and parked for multisig approval — the extension itself has zero signing
> ability and zero private-key material.

## How it works

- Injects a [Wallet-Standard](https://github.com/wallet-standard/wallet-standard)
  wallet into every dApp page, exposing each multisig the connected wallet
  belongs to as a **`ReadonlyWalletAccount`**.
- When a dApp asks the "wallet" to sign, the request is intercepted and forwarded
  (via `postMessage`) to the companion web app, where multisig members approve it
  with their own wallets. The dApp sees the request as parked, not signed here.
- Multisig data is **pushed in by the web app** (`postMessage` → `chrome.storage`).
  The extension **never contacts any backend/relay** on its own — it has no
  `host_permissions` and makes no network requests.

## Security model

- **No keys, no signing** in the extension.
- **No backend access**: zero relay/API host permissions; data flows only from the
  trusted web app via origin-checked `postMessage`.
- The companion web app's origin is validated (`event.origin`) before any data is
  accepted into storage.

## Configuration

`lib/config.ts` holds the defaults:

- `webAppUrl` — the companion web app that performs approval and pushes data in.
- `network` — `mainnet` | `testnet`.

## Development

Requires [Bun](https://bun.sh) and Node ≥ 20.12 (the build toolchain uses
`node:util` `styleText`). Building with Bun's runtime avoids the Node version
requirement:

```bash
bun install
bun run --bun build      # production build → output/chrome-mv3
bun run --bun zip        # packaged zip for the Chrome Web Store
bun run dev              # live-reload development
```

Load the unpacked extension from `output/chrome-mv3` in
`chrome://extensions` (Developer mode → Load unpacked).

## Install manually (from a Release)

While the Chrome Web Store listing is in review, you can install the extension
from a GitHub Release:

1. Download the `.zip` from the latest [Release](../../releases).
2. Unzip it — you'll get a folder containing `manifest.json`.
3. Open `chrome://extensions`, enable **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.

> Manually loaded extensions get a random extension ID and do not auto-update.
> Once the Web Store listing is live, prefer installing from there.

## License

[Apache-2.0](./LICENSE)
