// SPDX-License-Identifier: Apache-2.0
// Injected into every dApp page (MAIN world). Presents EVERY Sui multisig
// the wallet belongs to as READ-ONLY Wallet-Standard accounts. It holds no
// keys and never signs: every sign request is captured and parked for
// multisig approval.

import {
	ReadonlyWalletAccount,
	registerWallet,
	SUI_CHAINS,
	type SuiSignAndExecuteTransactionInput,
	type SuiSignTransactionInput,
	type Wallet,
	type WalletAccount,
} from '@mysten/wallet-standard';

import { CONFIG_DATA_ATTR, PAGE_TO_CONTENT } from '../lib/protocol';

// Inlined to keep the injected script (which runs in every dApp page) free of
// the large @mysten/sui dependency — minimizing the supply-chain surface of the
// most security-sensitive part of the extension. Standard base64 → bytes.
function fromBase64(b64: string): Uint8Array {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++)
		bytes[i] = bin.charCodeAt(i);
	return bytes;
}

// Project brand (suisec shield), embedded as a PNG data URI so the dApp
// wallet picker shows the MultiSig logo. Self-contained — no extra fetch,
// no remote code (MV3 / supply-chain friendly).
const ICON =
	('data:image/png;base64,' +
		'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') as `data:image/png;base64,${string}`;

interface ConfigMultisig {
	address: string;
	publicKey?: string;
}

// A non-identifying account label derived from the public address — the user's
// private multisig name is never sent to the page.
function addressLabel(address: string): string {
	const a = address.replace(/^0x/, '');
	return a.length > 10
		? `Multisig 0x${a.slice(0, 4)}…${a.slice(-4)}`
		: `Multisig ${address}`;
}

function readConfig(): {
	network: string;
	multisigs: ConfigMultisig[];
} | null {
	const raw = document.documentElement.getAttribute(
		CONFIG_DATA_ATTR,
	);
	// Consume once: clear immediately so the config does not linger in the
	// shared DOM where any page script could read it.
	document.documentElement.removeAttribute(CONFIG_DATA_ATTR);
	if (!raw) return null;
	try {
		const cfg = JSON.parse(raw);
		return Array.isArray(cfg?.multisigs) &&
			cfg.multisigs.length
			? cfg
			: null;
	} catch {
		return null;
	}
}

function park(input: {
	account: WalletAccount;
	transaction: { toJSON: () => Promise<string> };
	chain: string;
}): never {
	// Fire-and-forget: hand the captured transaction (and the multisig it
	// was for) to the content script, then reject so the dApp shows the
	// request as not-completed-here.
	void input.transaction.toJSON().then((txJson) => {
		window.postMessage(
			{
				channel: PAGE_TO_CONTENT,
				type: 'capture',
				txJson,
				address: input.account.address,
				chain: input.chain,
				origin: location.origin,
			},
			'*',
		);
	});
	throw new Error(
		'Sent to MultiSig for multisig approval. Review and sign it in the MultiSig tab that just opened.',
	);
}

class MultisigWallet implements Wallet {
	readonly version = '1.0.0' as const;
	readonly name = 'MultiSig';
	readonly icon = ICON;
	readonly chains = SUI_CHAINS;
	readonly #accounts: ReadonlyWalletAccount[];

	constructor(multisigs: ConfigMultisig[]) {
		this.#accounts = multisigs.map(
			(m) =>
				new ReadonlyWalletAccount({
					address: m.address,
					// Composite multisig public key (MultiSigPublicKey raw
					// bytes) from the relay — derives the address, which
					// key-validating dApps require.
					publicKey: m.publicKey
						? fromBase64(m.publicKey)
						: new Uint8Array(),
					chains: SUI_CHAINS,
					features: [
						'sui:signTransaction',
						'sui:signAndExecuteTransaction',
					],
					label: addressLabel(m.address),
				}),
		);
	}

	get accounts() {
		return this.#accounts;
	}

	get features() {
		return {
			'standard:connect': {
				version: '1.0.0' as const,
				connect: async () => ({ accounts: this.accounts }),
			},
			'standard:disconnect': {
				version: '1.0.0' as const,
				disconnect: async () => {},
			},
			'standard:events': {
				version: '1.0.0' as const,
				on: () => () => {},
			},
			'sui:signTransaction': {
				version: '2.0.0' as const,
				signTransaction: async (
					input: SuiSignTransactionInput,
				) => park(input),
			},
			'sui:signAndExecuteTransaction': {
				version: '2.0.0' as const,
				signAndExecuteTransaction: async (
					input: SuiSignAndExecuteTransactionInput,
				) => park(input),
			},
		};
	}
}

export default defineUnlistedScript(() => {
	const config = readConfig();
	if (!config) return; // no multisigs configured → present nothing
	registerWallet(new MultisigWallet(config.multisigs));
});
