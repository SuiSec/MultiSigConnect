// SPDX-License-Identifier: Apache-2.0
// Content script (ISOLATED world). Hands config to the MAIN-world wallet via
// a shared DOM attribute, injects it, and relays captured transactions to the
// background.

import { browser } from 'wxt/browser';

import { normalizeCaptureMessage } from '../lib/capture-policy';
import { getConfig, trustedWebAppOrigin } from '../lib/config';
import {
	APP_TO_EXT,
	CONFIG_DATA_ATTR,
	PAGE_TO_CONTENT,
} from '../lib/protocol';

export default defineContentScript({
	matches: ['<all_urls>'],
	runAt: 'document_start',
	async main() {
		const cfg = await getConfig();
		if (cfg.multisigs.length > 0) {
			// DOM is shared across worlds — the MAIN-world wallet reads this.
			// Privacy: only the on-chain-public address + composite public key
			// cross the bridge. The user's private label (`name`) is NOT
			// broadcast to pages — it stays in the extension UI only.
			document.documentElement.setAttribute(
				CONFIG_DATA_ATTR,
				JSON.stringify({
					network: cfg.network,
					multisigs: cfg.multisigs.map((m) => ({
						address: m.address,
						publicKey: m.publicKey,
					})),
				}),
			);
		}

		await injectScript('/injected.js', { keepInDom: true });
		// The wallet consumes the config synchronously on load (it also clears
		// the attribute itself); strip it here too so it never lingers in the
		// DOM for arbitrary page scripts / trackers to scrape.
		document.documentElement.removeAttribute(CONFIG_DATA_ATTR);

		// Trusted origin for multisig sync: ONLY the configured MultiSig web
		// app may push a multisig list. A malicious dApp page has a different
		// origin and is rejected — preventing spoofed accounts.
		const trustedAppOrigin = trustedWebAppOrigin(cfg.webAppUrl) ?? '';

		window.addEventListener('message', (event) => {
			if (event.source !== window) return;
			const data = event.data;

			// dApp → capture a transaction for multisig approval.
			if (
				data?.channel === PAGE_TO_CONTENT &&
				data?.type === 'capture'
			) {
				const capture = normalizeCaptureMessage(
					data,
					event.origin,
					cfg.multisigs,
				);
				if (capture) browser.runtime.sendMessage(capture);
				return;
			}

			// MultiSig web app → push the synced multisig list. Strictly
			// origin-gated; payload is public (addresses + composite pubkeys).
			if (
				data?.channel === APP_TO_EXT &&
				data?.type === 'multisigs' &&
				event.origin === trustedAppOrigin &&
				Array.isArray(data.multisigs)
			) {
				browser.runtime.sendMessage({
					type: 'sync-multisigs',
					network: data.network,
					multisigs: data.multisigs,
				});
			}
		});
	},
});
