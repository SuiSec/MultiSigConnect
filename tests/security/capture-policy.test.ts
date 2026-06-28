import { describe, expect, test } from 'bun:test';

import { PAGE_TO_CONTENT } from '../../lib/protocol';
import { normalizeCaptureMessage } from '../../lib/capture-policy';

const multisigs = [
	{
		address: '0xabc',
		name: 'Team',
		publicKey: 'AA==',
	},
];

describe('capture message policy', () => {
	test('uses the browser-provided event origin instead of the page payload origin', () => {
		const capture = normalizeCaptureMessage(
			{
				channel: PAGE_TO_CONTENT,
				type: 'capture',
				txJson: '{"kind":"ProgrammableTransaction"}',
				address: '0xabc',
				chain: 'sui:mainnet',
				origin: 'https://trusted-dapp.example',
			},
			'https://malicious-dapp.example',
			multisigs,
		);

		expect(capture).toEqual({
			type: 'capture',
			txJson: '{"kind":"ProgrammableTransaction"}',
			address: '0xabc',
			chain: 'sui:mainnet',
			origin: 'https://malicious-dapp.example',
		});
	});

	test('rejects capture payloads for addresses not synced into extension storage', () => {
		const capture = normalizeCaptureMessage(
			{
				channel: PAGE_TO_CONTENT,
				type: 'capture',
				txJson: '{"kind":"ProgrammableTransaction"}',
				address: '0xdef',
				chain: 'sui:mainnet',
				origin: 'https://trusted-dapp.example',
			},
			'https://malicious-dapp.example',
			multisigs,
		);

		expect(capture).toBeNull();
	});
});
