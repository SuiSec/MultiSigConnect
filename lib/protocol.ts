// SPDX-License-Identifier: Apache-2.0

// window.postMessage channel between the injected wallet (MAIN world)
// and the content script (ISOLATED world).
export const PAGE_TO_CONTENT = 'msw:page->content';

export interface CapturePayload {
	channel: typeof PAGE_TO_CONTENT;
	type: 'capture';
	// Serialized Transaction (Transaction.toJSON()).
	txJson: string;
	address: string;
	chain: string;
	origin: string;
}

// Data attribute used to hand the multisig config to the MAIN-world
// wallet without inline scripts (the DOM is shared across worlds).
export const CONFIG_DATA_ATTR = 'data-msw-config';

// window.postMessage channel: MultiSig web app (page) → content script.
// The web app pushes the multisig list the signed-in wallet belongs to so the
// extension never has to reach the wallet or the relay itself. The content
// script MUST validate event.origin === webAppUrl before trusting this.
// Payload is public data only (addresses + composite public keys; no keys).
export const APP_TO_EXT = 'msw:app->ext';

export interface SyncedMultisig {
	address: string;
	name: string;
	publicKey: string;
}

export interface MultisigSyncPayload {
	channel: typeof APP_TO_EXT;
	type: 'multisigs';
	network: string;
	multisigs: SyncedMultisig[];
}
