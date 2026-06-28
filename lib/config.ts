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
