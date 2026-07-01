# MultiSig Connect

**MultiSig Connect** is the browser extension component of [MultiSig](https://multisig.suisec.app) — a non-custodial Sui blockchain multisig console built by the [SuiSec team](https://x.com/suisecurity) (@suisecurity).

The extension presents Sui multisig wallets as standard [Wallet Standard](https://github.com/wallet-standard/wallet-standard) accounts to any dApp, letting multisig teams use DEXes, NFT platforms, governance portals, and any other Sui dApp without requiring the dApp to add special multisig support. Transactions initiated in a dApp are captured and routed to the [MultiSig web app](https://multisig.suisec.app) for threshold approval.

> **Holds no keys. Never signs.** Every signing request from a dApp is captured
> and parked for multisig approval — the extension itself has zero signing
> ability and zero private-key material.

## Key properties

- **Zero signing capability.** The extension holds no private keys and cannot sign anything. A fully compromised extension gives an attacker nothing to exploit — there is no signing material to steal.
- **No network access.** The extension has no `host_permissions` and makes zero independent network requests. All multisig data flows in from the trusted MultiSig web app via origin-validated `postMessage` → `chrome.storage`. It cannot exfiltrate data and cannot be used as a network pivot.
- **Works with any Sui dApp — no dApp changes required.** MultiSig Connect presents each multisig as a standard [Wallet Standard](https://github.com/wallet-standard/wallet-standard) account. DEXes, lending protocols, NFT platforms, governance portals — if a Sui dApp supports wallets, it works with multisig without modification.
- **Every captured transaction is security-analysed before signing.** In the companion MultiSig web app, each co-signer independently decodes the raw transaction bytes and runs a local dry-run simulation against live Sui chain state before committing a signature. No blind approvals, no relay-provided descriptions taken on trust.
- **Free and requires no registration.** Install the extension, connect your Sui wallet at [multisig.suisec.app](https://multisig.suisec.app), and go.

## Why this extension exists

A Sui multisig address is a valid on-chain account, but signing for it requires multiple members to coordinate partial signatures — something no ordinary browser wallet can do inline. Without this extension, a multisig team has to manually copy transaction bytes out of a dApp and into a coordination tool. MultiSig Connect eliminates that step: it injects the multisig as a wallet the dApp recognises, intercepts the signing request, and parks it as a pending proposal in the [MultiSig web app](https://multisig.suisec.app) for members to review and threshold-sign.

This means any Sui multisig can interact with the full Sui ecosystem — swaps, lending, staking, governance — without the dApp needing to know it is a multisig.

## How it works

- Injects a [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
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
- Even if the extension were fully compromised, there are no keys and no signing
  capability to exploit.

## Part of the MultiSig product

This extension is one component of the MultiSig product by SuiSec:

| Component | Purpose |
|---|---|
| [Web app](https://multisig.suisec.app) | Create multisig wallets, propose and sign transactions, publish and verify Move packages |
| **Browser extension** (this repo) | Present multisig wallets to any Sui dApp; capture and park signing requests |
| Relay (api.suisec.app) | Non-custodial coordination: stores proposals and partial signatures, never holds keys |

MultiSig is free to use and requires no account registration — connect your wallet and go.

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
