import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { TerminalView, VIEW_TYPE_ANTIGRAVITY_TERMINAL } from './TerminalView';

interface AntigravitySettings {
	command: string;
	args: string;
	fontFamily: string;
	fontSize: number;
}

const DEFAULT_SETTINGS: AntigravitySettings = {
	command: 'agy',
	args: '--dangerously-skip-permissions --continue',
	fontFamily: 'monospace',
	fontSize: 14
}

export default class AntigravityPlugin extends Plugin {
	settings: AntigravitySettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_ANTIGRAVITY_TERMINAL,
			(leaf) => new TerminalView(leaf, this)
		);

		this.addRibbonIcon('bot', 'Open Antigravity CLI', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-antigravity-cli',
			name: 'Open Antigravity CLI',
			callback: () => {
				this.activateView();
			},
		});

		this.addSettingTab(new AntigravitySettingTab(this.app, this));
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_ANTIGRAVITY_TERMINAL);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_ANTIGRAVITY_TERMINAL);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_ANTIGRAVITY_TERMINAL,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

		// Migrate settings from old gemini-cli to antigravity-cli
		let migrated = false;
		if (this.settings.command === 'gemini') {
			this.settings.command = 'agy';
			migrated = true;
		}
		if (this.settings.args) {
			let updatedArgs = this.settings.args;
			if (updatedArgs.includes('--yolo')) {
				updatedArgs = updatedArgs.replace('--yolo', '--dangerously-skip-permissions');
				migrated = true;
			}
			if (updatedArgs.includes('-y') && !updatedArgs.includes('--dangerously-skip-permissions')) {
				updatedArgs = updatedArgs.replace('-y', '--dangerously-skip-permissions');
				migrated = true;
			}
			if (updatedArgs.includes('--resume latest')) {
				updatedArgs = updatedArgs.replace('--resume latest', '--continue');
				migrated = true;
			}
			if (updatedArgs.includes('-r latest')) {
				updatedArgs = updatedArgs.replace('-r latest', '--continue');
				migrated = true;
			}
			this.settings.args = updatedArgs;
		}
		if (migrated) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AntigravitySettingTab extends PluginSettingTab {
	plugin: AntigravityPlugin;

	constructor(app: App, plugin: AntigravityPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Antigravity CLI Settings' });

		new Setting(containerEl)
			.setName('Antigravity Command')
			.setDesc('The command to run Antigravity CLI (e.g., /home/desmond/.local/bin/agy or just agy).')
			.addText(text => text
				.setPlaceholder('agy')
				.setValue(this.plugin.settings.command)
				.onChange(async (value) => {
					this.plugin.settings.command = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default Arguments')
			.setDesc('Default arguments to pass to the Antigravity CLI.')
			.addText(text => text
				.setPlaceholder('--dangerously-skip-permissions --continue')
				.setValue(this.plugin.settings.args)
				.onChange(async (value) => {
					this.plugin.settings.args = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Font Family')
			.setDesc('Terminal font family. Use a Nerd Font for proper glyph rendering (e.g., "JetBrainsMono Nerd Font Mono, monospace").')
			.addText(text => text
				.setPlaceholder('monospace')
				.setValue(this.plugin.settings.fontFamily)
				.onChange(async (value) => {
					this.plugin.settings.fontFamily = value || DEFAULT_SETTINGS.fontFamily;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Font Size')
			.setDesc('Terminal font size in pixels.')
			.addText(text => text
				.setPlaceholder('14')
				.setValue(String(this.plugin.settings.fontSize))
				.onChange(async (value) => {
					const parsed = parseInt(value, 10);
					this.plugin.settings.fontSize = (parsed > 0) ? parsed : DEFAULT_SETTINGS.fontSize;
					await this.plugin.saveSettings();
				}));
	}
}
