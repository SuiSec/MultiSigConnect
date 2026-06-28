import { describe, expect, test } from 'bun:test';

import { isAllowedWebAppUrl } from '../../lib/config';

describe('webAppUrl trust anchor validation', () => {
	test('accepts https origins', () => {
		expect(isAllowedWebAppUrl('https://multisig.suisec.app')).toBe(
			true,
		);
		expect(isAllowedWebAppUrl('https://example.com/path')).toBe(
			true,
		);
	});

	test('accepts http only for localhost (dev)', () => {
		expect(isAllowedWebAppUrl('http://localhost:5173')).toBe(true);
		expect(isAllowedWebAppUrl('http://127.0.0.1:3000')).toBe(true);
	});

	test('rejects plain http for non-localhost hosts', () => {
		expect(isAllowedWebAppUrl('http://evil.example')).toBe(false);
	});

	test('rejects non-http(s) and malformed values', () => {
		expect(isAllowedWebAppUrl('javascript:alert(1)')).toBe(false);
		expect(isAllowedWebAppUrl('data:text/html,<script>')).toBe(
			false,
		);
		expect(isAllowedWebAppUrl('not a url')).toBe(false);
		expect(isAllowedWebAppUrl('')).toBe(false);
	});
});
