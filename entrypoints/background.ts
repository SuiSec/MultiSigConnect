// SPDX-License-Identifier: Apache-2.0
// Background service worker. Receives captured transactions and parks them by
// opening the MultiSig approval page. Does no crypto and holds no keys.

import { browser } from 'wxt/browser';

import { isConfiguredMultisigAddress } from '../lib/capture-policy';
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

function senderOrigin(sender: {
	url?: string;
	tab?: { url?: string };
}): string | null {
	const url = sender.url ?? sender.tab?.url;
	if (!url) return null;
	try {
		return new URL(url).origin;
	} catch {
		return null;
	}
}

export default defineBackground(() => {
	browser.runtime.onMessage.addListener((message, sender) => {
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
		if (msg?.type === 'capture') {
			void (async () => {
				const cfg = await getConfig();
				if (
					typeof msg.txJson !== 'string' ||
					!isConfiguredMultisigAddress(
						msg.address,
						cfg.multisigs,
					)
				) {
					return;
				}

				const actualOrigin = senderOrigin(sender);
				const dappOrigin =
					actualOrigin ??
					(typeof msg.origin === 'string' ? msg.origin : '');
				const fragment = encodePayload({
					address: msg.address,
					network: cfg.network,
					txJson: msg.txJson,
					dapp: dappOrigin,
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
