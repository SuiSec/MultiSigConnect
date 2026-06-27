// SPDX-License-Identifier: Apache-2.0
// Background service worker. Receives captured transactions and parks them by
// opening the MultiSig approval page. Does no crypto and holds no keys.

import { browser } from 'wxt/browser';

import {
	getConfig,
	setConfig,
	type MswConfig,
	type MswMultisig,
} from '../lib/config';

function encodePayload(payload: unknown): string {
	const json = JSON.stringify(payload);
	// UTF-8 safe base64.
	return btoa(unescape(encodeURIComponent(json)));
}

export default defineBackground(() => {
	browser.runtime.onMessage.addListener((message) => {
		const msg = message as {
			type?: string;
			txJson?: string;
			address?: string;
			origin?: string;
			chain?: string;
			network?: string;
			multisigs?: MswMultisig[];
		};

		// MultiSig web app pushed the synced multisig list → persist it.
		// (Origin was already validated by the content script.)
		if (
			msg?.type === 'sync-multisigs' &&
			Array.isArray(msg.multisigs)
		) {
			void (async () => {
				const cfg = await getConfig();
				await setConfig({
					...cfg,
					network:
						(msg.network as MswConfig['network']) ??
						cfg.network,
					multisigs: msg.multisigs!.map((m) => ({
						address: m.address,
						name: m.name ?? '',
						publicKey: m.publicKey,
					})),
				});
			})();
			return false;
		}

		// dApp transaction captured → open the approval page. A focused popup
		// window (mobile layout, no sidebar) reads like a wallet confirm.
		if (msg?.type === 'capture' && msg.txJson && msg.address) {
			void (async () => {
				const cfg = await getConfig();
				const fragment = encodePayload({
					address: msg.address,
					network: cfg.network,
					txJson: msg.txJson,
					dapp: msg.origin ?? '',
				});
				const base = cfg.webAppUrl.replace(/\/+$/, '');
				await browser.windows.create({
					url: `${base}/capture#${fragment}`,
					type: 'popup',
					width: 460,
					height: 760,
				});
			})();
			return false;
		}

		return false;
	});
});
