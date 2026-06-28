// SPDX-License-Identifier: Apache-2.0
// Vanilla popup (no React/JSX) — keeps the extension's dependency surface to
// @mysten/wallet-standard (official) + wxt only. It shows the multisigs the web
// app synced into storage; it never reaches the wallet or signs.

import { browser } from 'wxt/browser';

import {
	DEFAULT_CONFIG,
	getConfig,
	isAllowedWebAppUrl,
	setConfig,
	type MswConfig,
	type MswMultisig,
} from '../../lib/config';
import './style.css';

const CONFIG_KEY = 'msw:config';

const root = document.getElementById('root')!;
let cfg: MswConfig = DEFAULT_CONFIG;

function shorten(a: string): string {
	return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function setStatus(kind: 'ok' | 'err', msg: string): void {
	const s = root.querySelector<HTMLElement>('#status');
	if (!s) return;
	s.className = kind === 'err' ? 'error' : 'saved';
	s.textContent = msg;
}

function itemEl(m: MswMultisig): HTMLElement {
	const item = document.createElement('div');
	item.className = 'item';

	const ava = document.createElement('span');
	ava.className = 'ava';
	ava.textContent = (m.name || m.address)
		.replace(/^0x/, '')
		.charAt(0)
		.toUpperCase();

	const itn = document.createElement('div');
	itn.className = 'itn';
	const nm = document.createElement('span');
	nm.className = 'nm';
	nm.textContent = m.name || 'Untitled'; // textContent — no HTML injection
	const ad = document.createElement('span');
	ad.className = 'ad mono';
	ad.textContent = shorten(m.address);
	itn.append(nm, ad);

	const on = document.createElement('span');
	on.className = 'on';
	on.textContent = 'auto · on';

	item.append(ava, itn, on);
	return item;
}

function render(): void {
	root.innerHTML = `
		<div class="wrap">
			<div class="brand"><span class="dot">▲</span>MultiSig</div>
			<div class="sub">Presents every multisig your wallet belongs to as a read-only account — no keys, never signs.</div>
			<div class="rowhead">
				<span>Your multisigs</span>
				<span id="net" class="netbadge" title="Network is chosen in the MultiSig app and mirrored here"></span>
			</div>
			<div id="list"></div>
			<button id="open">Open MultiSig app to sync</button>
			<details>
				<summary>Advanced</summary>
				<label>MultiSig app URL</label>
				<input id="web" />
				<button id="save">Save settings</button>
			</details>
			<div id="status" class="saved"></div>
			<div class="note">Your multisigs are synced from the MultiSig app — the extension never contacts the server itself. On a dApp's connect dialog, pick "MultiSig" and choose which multisig to use; the transaction is captured and opened in the app for approval.</div>
		</div>`;

	// Network is read-only here: the MultiSig web app is the source of truth
	// and syncs it into storage. We just mirror it.
	const net = root.querySelector<HTMLElement>('#net')!;
	net.textContent = cfg.network;

	const list = root.querySelector('#list')!;
	if (cfg.multisigs.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'empty';
		empty.textContent =
			'None yet — open the MultiSig app and sign in; your multisigs sync here automatically.';
		list.appendChild(empty);
	} else {
		for (const m of cfg.multisigs) list.appendChild(itemEl(m));
	}

	const web = root.querySelector<HTMLInputElement>('#web')!;
	web.value = cfg.webAppUrl;
	web.oninput = () => {
		cfg = { ...cfg, webAppUrl: web.value.trim() };
	};

	root
		.querySelector('#open')!
		.addEventListener('click', () =>
			browser.tabs.create({ url: cfg.webAppUrl }),
		);
	root
		.querySelector('#save')!
		.addEventListener('click', async () => {
			if (!isAllowedWebAppUrl(cfg.webAppUrl)) {
				setStatus(
					'err',
					'MultiSig app URL must be an https:// address.',
				);
				return;
			}
			await setConfig(cfg);
			setStatus('ok', 'Settings saved.');
		});
}

async function init(): Promise<void> {
	cfg = await getConfig();
	render();
	// Live-update when the web app pushes a new multisig list into storage.
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === 'local' && changes[CONFIG_KEY]) {
			void getConfig().then((c) => {
				cfg = c;
				render();
			});
		}
	});
}

void init();
