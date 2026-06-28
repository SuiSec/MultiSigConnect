// SPDX-License-Identifier: Apache-2.0

import type { MswMultisig } from './config';
import { PAGE_TO_CONTENT } from './protocol';

export interface NormalizedCaptureMessage {
	type: 'capture';
	txJson: string;
	address: string;
	chain: string;
	origin: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function isConfiguredMultisigAddress(
	address: unknown,
	multisigs: readonly Pick<MswMultisig, 'address'>[],
): address is string {
	if (typeof address !== 'string') return false;
	const normalized = address.toLowerCase();
	return multisigs.some(
		(m) =>
			typeof m.address === 'string' &&
			m.address.toLowerCase() === normalized,
	);
}

export function normalizeCaptureMessage(
	data: unknown,
	eventOrigin: string,
	multisigs: readonly Pick<MswMultisig, 'address'>[],
): NormalizedCaptureMessage | null {
	if (!isRecord(data)) return null;
	if (
		data.channel !== PAGE_TO_CONTENT ||
		data.type !== 'capture' ||
		typeof data.txJson !== 'string' ||
		typeof data.chain !== 'string' ||
		typeof eventOrigin !== 'string' ||
		eventOrigin.length === 0 ||
		!isConfiguredMultisigAddress(data.address, multisigs)
	) {
		return null;
	}

	return {
		type: 'capture',
		txJson: data.txJson,
		address: data.address,
		chain: data.chain,
		origin: eventOrigin,
	};
}
