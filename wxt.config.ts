import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
	// Use a non-hidden output dir so it's easy to find/load in Finder.
	outDir: 'output',
	manifest: {
		name: 'MultiSig — Multisig Connector',
		description:
			'Presents a Sui multisig as a read-only wallet to any dApp and routes captured transactions to multisig approval. Holds no keys, never signs.',
		permissions: ['storage', 'tabs'],
		// No host_permissions: the extension never contacts the relay. It is fed
		// entirely by the web app via the content-script bridge (postMessage →
		// storage). The content script's page access comes from its own match
		// patterns; injectScript uses web_accessible_resources below.
		// The MAIN-world wallet script must be page-loadable for injectScript().
		web_accessible_resources: [
			{
				resources: ['injected.js'],
				matches: ['<all_urls>'],
			},
		],
	},
});
