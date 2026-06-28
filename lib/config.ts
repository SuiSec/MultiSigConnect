// SPDX-License-Identifier: Apache-2.0

import { browser } from 'wxt/browser';

/** A multisig the connected wallet belongs to (read-only). */
export interface MswMultisig {
	address: string;
	name: string;
	/** Base64 of the composite multisig public key (from the relay). */
	publicKey: string;
}

export interface MswConfig {
	network: 'mainnet' | 'testnet';
	/** Base URL of the multiSigWeb app that performs approval + syncs data in. */
	webAppUrl: string;
	/**
	 * Every multisig the signed-in wallet belongs to, pushed in by the web app.
	 * The extension never contacts the relay itself. All are presented to dApps
	 * as accounts (Option A — expose all).
	 */
	multisigs: MswMultisig[];
}

const KEY = 'msw:config';

export const DEFAULT_CONFIG: MswConfig = {
	network: 'mainnet',
	webAppUrl: 'https://multisig.suisec.app',
	multisigs: [],
};

export async function getConfig(): Promise<MswConfig> {
	const r = await browser.storage.local.get(KEY);
	return { ...DEFAULT_CONFIG, ...(r[KEY] as MswConfig) };
}

export async function setConfig(
	config: MswConfig,
): Promise<void> {
	await browser.storage.local.set({ [KEY]: config });
}

/**
 * The web app URL is a trust anchor: its origin gates the multisig sync
 * (APP_TO_EXT) and is the target the approval popup is opened against. Restrict
 * it to https — localhost may use http for local development — and reject
 * anything that isn't a parseable http(s) URL. This stops a social-engineered
 * `javascript:` / `data:` / plain-http value from becoming a trusted sync
 * origin or a MITM-able approval target.
 */
export function isAllowedWebAppUrl(value: string): boolean {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return false;
	}
	if (url.protocol === 'https:') return true;
	return (
		url.protocol === 'http:' &&
		(url.hostname === 'localhost' || url.hostname === '127.0.0.1')
	);
}

/**
 * The trusted origin derived from the web app URL, or null if the URL is not an
 * allowed trust anchor. Both the content script (sync gate) and the background
 * (sync sender check) derive the trusted origin through this single helper so
 * the two stay in lockstep.
 */
export function trustedWebAppOrigin(value: string): string | null {
	if (!isAllowedWebAppUrl(value)) return null;
	return new URL(value).origin;
}

// Sui addresses are 0x-prefixed hex (≤32 bytes). Composite multisig public keys
// arrive as standard base64.
const SUI_ADDRESS_RE = /^0x[0-9a-f]{1,64}$/i;
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

function isValidBase64(value: string): boolean {
	if (value.length === 0) return true; // address-only entry is allowed
	return value.length % 4 === 0 && BASE64_RE.test(value);
}

/**
 * Structurally validate the multisig list pushed in by the web app before it is
 * persisted. A compromised (or buggy) web app could otherwise inject malformed
 * entries — e.g. a non-base64 public key that throws in the injected wallet's
 * `atob` and breaks wallet registration on every page. Entries that fail
 * validation are dropped rather than trusted.
 */
export function sanitizeSyncedMultisigs(input: unknown): MswMultisig[] {
	if (!Array.isArray(input)) return [];
	const out: MswMultisig[] = [];
	for (const entry of input) {
		if (typeof entry !== 'object' || entry === null) continue;
		const { address, name, publicKey } = entry as Record<
			string,
			unknown
		>;
		if (
			typeof address !== 'string' ||
			!SUI_ADDRESS_RE.test(address)
		) {
			continue;
		}
		const pk = typeof publicKey === 'string' ? publicKey : '';
		if (!isValidBase64(pk)) continue;
		out.push({
			address,
			name: typeof name === 'string' ? name : '',
			publicKey: pk,
		});
	}
	return out;
}
