import { describe, expect, test } from 'bun:test';

import {
	sanitizeSyncedMultisigs,
	trustedWebAppOrigin,
} from '../../lib/config';

describe('trustedWebAppOrigin', () => {
	test('returns the origin for an allowed https url', () => {
		expect(trustedWebAppOrigin('https://multisig.suisec.app/x')).toBe(
			'https://multisig.suisec.app',
		);
	});

	test('returns null for a disallowed url', () => {
		expect(trustedWebAppOrigin('http://evil.example')).toBeNull();
		expect(trustedWebAppOrigin('javascript:alert(1)')).toBeNull();
	});
});

describe('sanitizeSyncedMultisigs', () => {
	test('keeps well-formed entries and normalizes missing name', () => {
		const out = sanitizeSyncedMultisigs([
			{ address: '0xABC123', name: 'Team', publicKey: 'AQID' },
			{ address: '0xdef', publicKey: '' },
		]);
		expect(out).toEqual([
			{ address: '0xABC123', name: 'Team', publicKey: 'AQID' },
			{ address: '0xdef', name: '', publicKey: '' },
		]);
	});

	test('drops entries with a malformed (non-base64) public key', () => {
		const out = sanitizeSyncedMultisigs([
			{ address: '0xabc', publicKey: 'not!base64!' },
		]);
		expect(out).toEqual([]);
	});

	test('drops entries with an invalid address', () => {
		expect(
			sanitizeSyncedMultisigs([
				{ address: 'nope', publicKey: 'AQID' },
				{ address: 123, publicKey: 'AQID' },
			]),
		).toEqual([]);
	});

	test('returns an empty list for non-array input', () => {
		expect(sanitizeSyncedMultisigs(null)).toEqual([]);
		expect(sanitizeSyncedMultisigs('x')).toEqual([]);
	});
});
